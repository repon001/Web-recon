/**
 * The shapes the FastAPI backend puts on the wire.
 *
 * Hand-written rather than generated from `/openapi.json`, because the schema
 * is only served when the backend runs with `ENVIRONMENT=local` — a generation
 * step would break the moment someone builds against a deployed instance. The
 * trade-off is that these must be kept in step with `each module's schemas.py`
 * by hand; the string-union enums below are the ones most likely to drift, so
 * they are declared with `as const` arrays that runtime code can also validate
 * against instead of duplicating the list.
 */

// ------------------------------------------------------------------ enums --
export const SCAN_PROFILES = ["quick", "standard", "deep"] as const;
export type ScanProfile = (typeof SCAN_PROFILES)[number];

export const SCAN_STATUSES = [
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;
export type ScanStatus = (typeof SCAN_STATUSES)[number];

/** Active means "still doing work". Mirrors ACTIVE_SCAN_STATUSES in models.py. */
export const ACTIVE_SCAN_STATUSES: readonly ScanStatus[] = ["queued", "running"];

export function isActiveStatus(status: ScanStatus): boolean {
  return ACTIVE_SCAN_STATUSES.includes(status);
}

/** Ordered worst-first, exactly like `_SEVERITY_ORDER` in the backend. */
export const SEVERITIES = ["critical", "high", "medium", "low", "info"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const FINDING_CATEGORIES = [
  "transport",
  "headers",
  "cookies",
  "exposure",
  "dns",
  "info",
] as const;
export type FindingCategory = (typeof FINDING_CATEGORIES)[number];

export const SUBDOMAIN_SOURCES = [
  "subfinder",
  "amass",
  "crtsh",
  "bruteforce",
] as const;
export type SubdomainSource = (typeof SUBDOMAIN_SOURCES)[number];

// ------------------------------------------------------------------ users --
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RegisterResponse {
  user: User;
  tokens: TokenPair;
}

// ------------------------------------------------------------- pagination --
export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// ------------------------------------------------------------ scan report --
export interface Finding {
  code: string;
  category: FindingCategory;
  severity: Severity;
  title: string;
  detail: string;
  evidence: string | null;
  remediation: string | null;
  points: number;
}

export interface HeaderCheck {
  header: string;
  present: boolean;
  value: string | null;
  ok: boolean;
  note: string;
}

export interface CookieCheck {
  name: string;
  secure: boolean;
  http_only: boolean;
  same_site: string | null;
}

export interface TlsInfo {
  supported: boolean;
  protocol: string | null;
  cipher: string | null;
  issuer: string | null;
  subject: string | null;
  not_after: string | null;
  days_until_expiry: number | null;
  error: string | null;
}

export interface HttpTarget {
  url: string;
  reachable: boolean;
  status_code: number | null;
  redirects_to: string | null;
  server: string | null;
  error: string | null;
  elapsed_ms: number | null;
}

export interface SubdomainRecord {
  name: string;
  addresses: string[];
  cname: string | null;
  sources: SubdomainSource[];
  /** False when a passive source knew the name but DNS no longer answers. */
  resolves: boolean;
}

export interface ExposureRecord {
  path: string;
  url: string;
  status_code: number;
  content_type: string | null;
  content_length: number | null;
  confirmed: boolean;
  /** robots.txt and security.txt: context, not a problem. */
  informational: boolean;
  evidence: string | null;
}

export interface ScanResult {
  resolved_ips: string[];
  nameservers: string[];
  mx_records: string[];

  http: HttpTarget | null;
  https: HttpTarget | null;
  tls: TlsInfo | null;

  header_checks: HeaderCheck[];
  cookies: CookieCheck[];
  exposures: ExposureRecord[];

  subdomains: SubdomainRecord[];
  subdomain_sources_used: SubdomainSource[];
  wildcard_dns: boolean;
  subdomains_truncated: boolean;

  findings: Finding[];
  score: number;
  grade: string;
}

export interface ScanProgress {
  stage: string;
  percent: number;
  message: string;
}

export type SeverityCounts = Record<Severity, number>;

/** One row in the scan list. No report payload — see the note in schemas.py. */
export interface ScanSummary {
  id: string;
  domain: string;
  profile: ScanProfile;
  status: ScanStatus;
  progress: ScanProgress;

  score: number | null;
  grade: string | null;
  findings: SeverityCounts;
  subdomains_found: number;

  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  error: string | null;
}

/** One scan in full. */
export interface Scan extends ScanSummary {
  result: ScanResult | null;
}

export interface ScanCreate {
  domain: string;
  profile: ScanProfile;
}

// -------------------------------------------------------- websocket frames --
export const SCAN_EVENT_TYPES = [
  "snapshot",
  "started",
  "progress",
  "finding",
  "completed",
  "failed",
  "cancelled",
  "lagged",
  "heartbeat",
] as const;
export type ScanEventType = (typeof SCAN_EVENT_TYPES)[number];

/** Terminal frames are followed by the socket closing itself. */
export const TERMINAL_EVENT_TYPES: readonly ScanEventType[] = [
  "completed",
  "failed",
  "cancelled",
];

/**
 * Every frame on `/scans/{id}/ws` uses this envelope, including the snapshot
 * sent on connect — which is what lets a client run one handler over both.
 * `heartbeat` is the exception: it carries only `scan_id`.
 */
export interface ScanEvent {
  scan_id: string;
  type: ScanEventType;
  stage?: string;
  percent?: number;
  message?: string;
  data?: ScanEventData | null;
  at?: string;
}

export interface ScanEventData {
  finding?: Finding;
  score?: number;
  grade?: string;
  [key: string]: unknown;
}
