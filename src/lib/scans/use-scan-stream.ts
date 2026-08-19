"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  TERMINAL_EVENT_TYPES,
  type Finding,
  type ScanEvent,
  type ScanEventType,
  type ScanProgress,
  type ScanStatus,
  type ScanSummary,
} from "@/lib/api/types";
import { publicWebSocketBaseUrl } from "@/lib/env";

export type StreamPhase = "connecting" | "live" | "reconnecting" | "finished" | "offline";

export interface ScanStreamState {
  phase: StreamPhase;
  progress: ScanProgress;
  status: ScanStatus;
  /** Findings as they are discovered, newest last. Empty until the first arrives. */
  findings: Finding[];
  /** Set by the terminal frame, before the full report has been re-fetched. */
  outcome: { score?: number; grade?: string } | null;
  /** True once the broker reported dropping events for this subscriber. */
  lagged: boolean;
}

/**
 * Watch one scan over the WebSocket.
 *
 * The socket is the point of the whole feature: the backend runs enumeration
 * last precisely so a client watching this stream gets the headers and exposure
 * findings — the part they asked about — long before the scan finishes.
 *
 * Three things here are not obvious and are all deliberate:
 *
 *  1. The token is fetched per connection attempt, not once. A deep scan can
 *     outlive an access token, and a reconnect must not re-present the dead one.
 *  2. A close that is not preceded by a terminal frame is retried with backoff.
 *     Proxies drop idle sockets, laptops sleep, and the scan carries on
 *     regardless — giving up would leave a progress bar frozen at 30%.
 *  3. After the retries are exhausted it degrades to polling rather than
 *     failing. A stale-but-moving progress bar beats a dead one.
 */
export function useScanStream({
  scanId,
  initialStatus,
  initialProgress,
  active,
  onTerminal,
}: {
  scanId: string;
  initialStatus: ScanStatus;
  initialProgress: ScanProgress;
  active: boolean;
  /** Called once the scan reaches a terminal state, to reload the full report. */
  onTerminal: () => void;
}): ScanStreamState {
  const [state, setState] = useState<ScanStreamState>({
    phase: active ? "connecting" : "finished",
    progress: initialProgress,
    status: initialStatus,
    findings: [],
    outcome: null,
    lagged: false,
  });

  // Held in a ref so the reconnect loop can read it without being re-created on
  // every render — a changing callback identity would tear the socket down and
  // reopen it on each parent update.
  //
  // Written in an effect rather than during render: React may render a
  // component without committing it, and a ref mutated in that discarded pass
  // would leak a callback belonging to a tree that never mounted.
  const onTerminalRef = useRef(onTerminal);
  useEffect(() => {
    onTerminalRef.current = onTerminal;
  }, [onTerminal]);

  const finishedRef = useRef(!active);

  const handleEvent = useCallback((event: ScanEvent) => {
    if (event.type === "heartbeat") return;

    setState((previous) => {
      const next: ScanStreamState = { ...previous };

      if (event.type === "lagged") {
        // The broker's queue overflowed and dropped frames for this
        // subscriber. Findings may be missing, so say so rather than showing a
        // list that quietly is not the whole list.
        next.lagged = true;
        return next;
      }

      if (typeof event.percent === "number") {
        next.progress = {
          stage: event.stage ?? previous.progress.stage,
          // Never let the bar go backwards: a snapshot racing a progress frame
          // can arrive out of order, and a bar that jumps back reads as a bug.
          percent: Math.max(previous.progress.percent, event.percent),
          message: event.message ?? previous.progress.message,
        };
      }

      if (event.type === "snapshot") {
        const summary = event.data as unknown as ScanSummary | undefined;
        if (summary?.status) next.status = summary.status;
      }

      if (event.type === "finding" && event.data?.finding) {
        const finding = event.data.finding;
        // The snapshot and the replayed history can overlap with the live
        // stream, which is the backend's chosen trade-off: a duplicate is
        // harmless, a missing event is a progress bar that never finishes. It
        // is harmless because of this check.
        const seen = previous.findings.some(
          (existing) =>
            existing.code === finding.code && existing.evidence === finding.evidence,
        );
        if (!seen) next.findings = [...previous.findings, finding];
      }

      if (isTerminal(event.type)) {
        next.status = event.type === "completed" ? "completed" : (event.type as ScanStatus);
        next.phase = "finished";
        next.progress = { ...next.progress, percent: 100 };
        if (event.data && (event.data.grade || event.data.score !== undefined)) {
          next.outcome = { score: event.data.score, grade: event.data.grade };
        }
      }

      return next;
    });

    if (isTerminal(event.type)) {
      finishedRef.current = true;
      onTerminalRef.current();
    }
  }, []);

  useEffect(() => {
    if (!active) return;

    finishedRef.current = false;
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    let attempt = 0;
    let cancelled = false;

    const MAX_ATTEMPTS = 5;

    const connect = async () => {
      if (cancelled || finishedRef.current) return;

      let token: string;
      try {
        // Cookies are httpOnly, so the token for the URL has to be asked for.
        const response = await fetch("/api/scan-ticket", { cache: "no-store" });
        if (!response.ok) throw new Error(String(response.status));
        token = ((await response.json()) as { token: string }).token;
      } catch {
        return scheduleRetry();
      }
      if (cancelled || finishedRef.current) return;

      const url = `${publicWebSocketBaseUrl()}/api/v1/scans/${scanId}/ws?token=${encodeURIComponent(token)}`;
      socket = new WebSocket(url);

      socket.onopen = () => {
        attempt = 0;
        stopPolling();
        setState((previous) => ({ ...previous, phase: "live" }));
      };

      socket.onmessage = (message) => {
        try {
          handleEvent(JSON.parse(message.data as string) as ScanEvent);
        } catch {
          // A frame we cannot parse is not worth tearing the connection down
          // for. The next one will very likely be fine.
        }
      };

      socket.onerror = () => {
        // `onclose` always follows, and that is where the retry belongs —
        // handling both would double every backoff.
      };

      socket.onclose = () => {
        socket = null;
        if (cancelled || finishedRef.current) return;
        scheduleRetry();
      };
    };

    const scheduleRetry = () => {
      if (cancelled || finishedRef.current) return;
      attempt += 1;

      if (attempt > MAX_ATTEMPTS) {
        // Out of retries. Fall back to reloading the Server Component, which
        // reads the durable progress the backend mirrors into the document.
        setState((previous) => ({ ...previous, phase: "offline" }));
        startPolling();
        return;
      }

      setState((previous) => ({ ...previous, phase: "reconnecting" }));
      // 1s, 2s, 4s, 8s, 16s — long enough to outlast a proxy hiccup without
      // hammering a backend that may itself be restarting.
      retryTimer = setTimeout(connect, 2 ** (attempt - 1) * 1000);
    };

    const startPolling = () => {
      if (pollTimer) return;
      pollTimer = setInterval(() => onTerminalRef.current(), 5000);
    };

    const stopPolling = () => {
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = undefined;
    };

    void connect();

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      stopPolling();
      // 1000 is a normal closure: this tab is leaving, nothing went wrong.
      socket?.close(1000, "Component unmounted.");
    };
  }, [scanId, active, handleEvent]);

  return state;
}

function isTerminal(type: ScanEventType): boolean {
  return TERMINAL_EVENT_TYPES.includes(type);
}
