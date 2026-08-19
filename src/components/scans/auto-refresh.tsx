"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Re-render a Server Component page on a timer.
 *
 * The scan list is server-rendered, so a running scan's progress bar would sit
 * frozen at whatever it was when the page loaded. The detail page solves this
 * properly with a WebSocket; a list of twenty scans would need twenty sockets,
 * which is the wrong trade — polling one cheap endpoint is better here.
 *
 * Renders nothing. It exists only for the effect, which is why it can sit
 * inside a Server Component page without making that page a Client Component.
 */
export function AutoRefresh({
  enabled,
  intervalMs = 5000,
}: {
  enabled: boolean;
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setInterval> | undefined;

    const start = () => {
      if (timer) return;
      timer = setInterval(() => router.refresh(), intervalMs);
    };

    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };

    /**
     * Nobody is looking at a background tab.
     *
     * Without this, every tab someone left open yesterday keeps polling
     * forever — and browsers throttle background timers unevenly, so the
     * requests arrive in unhelpful bursts when the machine wakes up. Refreshing
     * once on the way back is what the user actually wants.
     */
    const onVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else {
        router.refresh();
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, intervalMs, router]);

  return null;
}
