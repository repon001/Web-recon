"use client";

/**
 * The last resort: an error thrown by the root layout itself.
 *
 * This one replaces the whole document, so it has to render its own `<html>`
 * and `<body>` — the root layout that would normally provide them is the thing
 * that failed. It also means the app's stylesheet is not guaranteed to be
 * there, so the few styles it needs are inline.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          margin: 0,
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem" }}>
            The application failed to start
          </h1>
          <p style={{ color: "#667085", fontSize: "0.875rem", margin: "0 0 1.5rem" }}>
            {error.digest ? `Digest ${error.digest}.` : null} Reloading may be enough.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              cursor: "pointer",
              borderRadius: "0.5rem",
              border: "1px solid #d0d5dd",
              background: "#4f46e5",
              color: "#fff",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
