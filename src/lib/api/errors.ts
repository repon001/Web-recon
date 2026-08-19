/**
 * The backend's error envelope, as a throwable.
 *
 * Every failure from FastAPI — domain errors, 401s, validation failures — comes
 * back as `{ error: { code, message, details } }`. `code` is the stable part
 * and the only thing UI should branch on; the message wording is free to
 * change and the status code has been known to (see core/exceptions.py).
 */

export interface FieldError {
  field: string;
  message: string;
  type: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** True when the access token was missing, expired or rejected. */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /**
   * Field-level problems from a 422, keyed by field name.
   *
   * Returns an empty object for every other kind of error, so a form can call
   * this unconditionally instead of type-narrowing first.
   */
  fieldErrors(): Record<string, string> {
    if (!Array.isArray(this.details)) return {};
    const out: Record<string, string> = {};
    for (const entry of this.details as FieldError[]) {
      if (entry && typeof entry.field === "string" && !(entry.field in out)) {
        out[entry.field] = entry.message;
      }
    }
    return out;
  }
}

/** The browser could not reach the API at all — DNS, refused connection, CORS. */
export class NetworkError extends ApiError {
  constructor(cause?: unknown) {
    super(0, "network_error", "Could not reach the API. Is the backend running?");
    this.name = "NetworkError";
    this.cause = cause;
  }
}

/**
 * Turn any thrown value into a message safe to show a user.
 *
 * Server Actions cannot return an Error across the network boundary, so this is
 * how a caught failure reaches the UI.
 */
export function messageFor(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}
