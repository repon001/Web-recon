# End-to-end journey

One script, no test framework. It drives a real Chromium through the whole
app against a **real running backend** and prints a pass/fail line per check.

```bash
npx playwright install chromium   # once
npm run dev                       # in another terminal
npm run e2e
```

It expects the FastAPI scanner on `http://localhost:8000` with a reachable
MongoDB, and the frontend on `http://localhost:3000` (override with `BASE`).

## What it covers

Registration, login, bad credentials, sign-out, route protection and the
`?next=` round trip; starting a scan; the progress WebSocket opening and the
report replacing the live view when it lands; every report section; the scan
list; profile updates; and the guard rails (`printer.local` refused, unknown
scan id not found).

It also asserts two things that are easy to regress and invisible by eye:

- the access token is **not** readable from `document.cookie`
- the standing "only scan what you are allowed to scan" notice is **not** a
  live region, so a screen reader is not interrupted on every page load

## It creates real data

Each run registers a new account (`e2e-<timestamp>@example.com`) and runs one
`quick` scan of `example.com` — a domain reserved by RFC 2606 for exactly this.
Point it at a development database, not production.

## Two traps worth knowing

`getByRole("alert")` is never safe in a Next.js app: Next renders its own route
announcer with `role="alert"` holding the page title. Scope alert queries to a
form or to `main`.

`isVisible()` does not wait. Every check here goes through the `visible()`
helper, which does — otherwise the assertions race the render and fail
intermittently.
