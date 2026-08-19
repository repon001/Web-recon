# Domain Scanner — frontend

A Next.js 16 App Router frontend for the FastAPI domain scanner. It signs you
in, starts scans, streams their progress over a WebSocket, and renders the
finished report.

Written to be **read**: most files carry a comment explaining why they are the
way they are, in the same spirit as the backend.

---

## Table of contents

1. [The stack](#1-the-stack)
2. [Setup](#2-setup)
3. [How authentication works](#3-how-authentication-works)
4. [Where the data comes from](#4-where-the-data-comes-from)
5. [The live progress socket](#5-the-live-progress-socket)
6. [Every file, explained](#6-every-file-explained)
7. [Routes](#7-routes)
8. [Known limits](#8-known-limits)

---

## 1. The stack

| Piece | Choice | Why this one |
|---|---|---|
| Framework | **Next.js 16**, App Router | Server Components mean the API token never reaches the browser |
| Language | **TypeScript** | The backend's wire shapes are mirrored in `lib/api/types.ts` |
| Styling | **Tailwind CSS 4** | Design tokens live in `globals.css` as CSS variables, so dark mode is a variable swap rather than a `dark:` class on every element |
| Validation | **Zod 4** | Used in Server Actions and for environment variables — not for API responses, which the backend already validated |
| Data fetching | **Server Components** | No client-side data library, because there is no client-side data |
| Mutations | **Server Actions** | Forms work before hydration, and the password never exists in the client bundle |

There is no state manager, no `axios`, no `react-query`. That is not
minimalism for its own sake: with Server Components the data is already on the
server when the HTML is built, so a client cache would be caching something the
client never fetched.

---

## 2. Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open <http://localhost:3000>.

### Environment

```ini
# Used by Server Components, Route Handlers and Server Actions. Can point at a
# hostname only the server can reach — a Docker service name, a private address.
API_BASE_URL=http://localhost:8000

# Inlined into the browser bundle. Only the progress WebSocket uses it, because
# a WebSocket cannot be proxied through a Server Component.
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Both are parsed and validated once in `lib/env.ts`, so a typo fails at import
with a message naming the variable, rather than two hours later as an opaque
`fetch failed`.

### The backend

This needs the FastAPI scanner running. From that repository:

```bash
uv run uvicorn app.main:app --reload
```

It must be able to reach MongoDB, and `BACKEND_CORS_ORIGINS` should include
`http://localhost:3000` — though CORS only matters for the WebSocket here,
since every HTTP call is made server-side.

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build, including a full TypeScript check |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint, including the React hooks rules |
| `npm run e2e` | Drives a real browser through the whole app — see [`e2e/`](e2e/) |

---

## 3. How authentication works

This is the part with the most deliberate decisions in it, so it is worth
reading before changing anything.

### Tokens live in httpOnly cookies

`lib/auth/session.ts` writes the access and refresh tokens as `httpOnly`
cookies. No script on the page can read them, which matters because an XSS bug
that can read a token keeps working long after the tab is closed.

Each cookie's lifetime is taken from the token's own `exp` claim rather than
hard-coded, so changing `ACCESS_TOKEN_EXPIRE_MINUTES` on the backend does not
silently leave this side wrong.

### Refresh happens in middleware, once

`middleware.ts` is the only place a token is refreshed. It has to be: writing a
cookie is legal in middleware, a Route Handler or a Server Action — and
**never** while a Server Component renders. Middleware runs before all three,
so by the time a page calls the API the cookie is already fresh and no page
needs to handle "expired" as a special case.

The refreshed pair is written twice on purpose:

```ts
request.cookies.set(ACCESS_COOKIE, refreshed.access_token);  // this render
response.cookies.set(ACCESS_COOKIE, refreshed.access_token, …); // the browser
```

A 401 that still escapes to `lib/api/client.ts` therefore means the session is
genuinely gone — the account was deleted or deactivated — not that it merely
aged out. `requireUser()` turns that into a redirect to the login page, and
lets every other status reach the error boundary rather than sending the user
round a login loop that cannot succeed.

### Route protection

| Path | Signed out | Signed in |
|---|---|---|
| `/` | Landing page | Landing page, with a "Go to scans" button |
| `/login`, `/register` | The form | Redirected to `/scans` |
| everything else | Redirected to `/login?next=…` | Rendered |

The `?next=` value is checked before it is used: it must start with a single
`/`. Without that, a link could sign someone in and bounce them to an
attacker's site carrying the credibility of a real login page.

### The one crack: `/api/scan-ticket`

The browser `WebSocket` API cannot set headers — there is no options argument —
so a browser client must put the token in the URL. Since the cookie is
`httpOnly`, the page has to ask for it, and that is what this Route Handler
does. It is same-origin only and never cached.

What that buys over simply not using `httpOnly`: the token is never in
`document.cookie`, so a generic cookie-stealing payload does not get it, and it
exists in JS memory only on the page that needs it. What it does not buy:
immunity from an XSS that specifically calls this endpoint. That is a real
limit, stated rather than glossed.

---

## 4. Where the data comes from

Every read is a Server Component calling `lib/api/*`:

```
Server Component  ->  lib/api/scans.ts  ->  lib/api/client.ts  ->  lib/api/http.ts  ->  FastAPI
                                              (adds the token)      (one fetch, one error shape)
```

`lib/api/http.ts` starts with `import "server-only"`, which makes the build fail
if a Client Component ever imports it. That is what stops an access token being
dragged into the browser bundle by an innocent-looking import.

Every scan read passes `cache: "no-store"`. A running scan changes several times
a second and the whole point of these pages is to show that; Next would
otherwise happily serve a two-minute-old progress bar. `getCurrentUser()` is
`no-store` for a different and more serious reason — it decides whose name the
header shows.

Writes are Server Actions in `lib/*/actions.ts`. They return a state object
rather than throwing, because a thrown error in a Server Action reaches
production as "an error occurred in the Server Components render", which tells
the user nothing about their typo. `useActionState` renders whatever they
return.

### Errors

The backend answers every failure with one envelope:

```json
{ "error": { "code": "scan_limit_exceeded", "message": "…", "details": null } }
```

`lib/api/errors.ts` turns that into an `ApiError` carrying the `code`. Only the
code is branched on — the wording and even the status are free to change.
`lib/scans/actions.ts` maps the guard-rail codes (`invalid_target`,
`target_not_allowed`, `scan_limit_exceeded`, …) onto sentences that say what to
do instead.

---

## 5. The live progress socket

`lib/scans/use-scan-stream.ts` opens one WebSocket per running scan and feeds
every frame — including the `snapshot` sent on connect — through a single
handler, because the backend gives them all the same envelope.

Three things in there are deliberate:

1. **The token is fetched per connection attempt**, not once. A deep scan can
   outlive an access token, and a reconnect must not re-present a dead one.
2. **A close with no preceding terminal frame is retried** with 1/2/4/8/16s
   backoff. Proxies drop idle sockets and laptops sleep; the scan carries on
   regardless, and giving up would leave a progress bar frozen at 30%.
3. **After the retries it degrades to polling** rather than failing. A
   stale-but-moving bar beats a dead one.

Duplicate `finding` frames are dropped by content. The backend subscribes
*before* it reads the snapshot, which produces an occasional duplicate instead
of an occasional gap — a duplicate is harmless, a missing event is a progress
bar that never finishes.

When a terminal frame arrives the hook calls `router.refresh()`, which
re-renders the Server Component and swaps the live view for the real report. The
report is not rebuilt on the client, so there is only ever one implementation of
it.

The scan list does not use sockets: twenty rows would mean twenty connections.
It polls instead, and `components/scans/auto-refresh.tsx` stops polling while
the tab is hidden.

---

## 6. Every file, explained

### `src/lib`

| File | What it is |
|---|---|
| `env.ts` | Both base URLs, parsed and validated once |
| `api/types.ts` | Hand-written mirrors of the backend's wire shapes |
| `api/errors.ts` | `ApiError`, plus `fieldErrors()` for 422s |
| `api/http.ts` | The one place a request leaves for the backend |
| `api/client.ts` | Adds the token. **Read the comment about why there is no retry here** |
| `api/auth.ts` | register / login / refresh. Login is form-encoded, not JSON |
| `api/users.ts` | `/users/me`, and the admin list |
| `api/scans.ts` | The scan endpoints |
| `auth/cookies.ts` | Cookie names and options, importable from the Edge runtime |
| `auth/jwt.ts` | Reads `exp` without verifying — and says why that is correct |
| `auth/session.ts` | Read and write the session from Server Actions |
| `auth/refresh.ts` | Refresh from a Route Handler, which middleware does not cover |
| `auth/require-user.ts` | The signed-in user, or a redirect |
| `auth/actions.ts` | Sign in, sign up, sign out |
| `scans/actions.ts` | Create, cancel, delete, rescan |
| `scans/get-scan.ts` | One scan, fetched at most once per request |
| `scans/use-scan-stream.ts` | The WebSocket client |
| `users/actions.ts` | Profile and password updates |
| `ui/cn.ts` | Class merging, and why `clsx` alone is not enough |
| `ui/format.ts` | Dates, durations, bytes — locale-fixed to avoid hydration mismatches |

### `src/components`

`ui/` holds the generic kit (button, field, card, alert, badge, table,
skeleton, pagination). `scans/` holds everything that knows what a scan is,
with the report sections under `scans/report/`.

### `src/app`

`(auth)` and `(app)` are route groups: the parentheses keep them out of the URL
while giving each its own layout — a centred card for signed-out pages, a
header shell for signed-in ones.

---

## 7. Routes

| Route | What it does |
|---|---|
| `/` | Landing page. Open to everyone |
| `/login`, `/register` | Auth forms |
| `/scans` | Your scans, newest first, paged |
| `/scans/new` | Start one |
| `/scans/[id]` | Live progress while it runs, the full report when it ends |
| `/settings` | Profile, password, account facts |
| `/api/scan-ticket` | Mints a token for the WebSocket URL |

---

## 8. Known limits

| Limit | Detail |
|---|---|
| **`notFound()` answers 200** | On a dynamically rendered route Next commits the response before the page body resolves, so an unknown scan id renders the correct not-found *page* with a 200 *status*. Framework behaviour; the user-visible result is right |
| **One socket per open report** | Fine for a person watching a scan, not for a wall display with fifty tabs |
| **No optimistic UI** | Cancel and delete wait for the server. The round trip is short and a scan that "cancelled" and then did not would be worse |
| **Polling is 5s** | Hard-coded in the list page. A long backlog of running scans will feel slower than the socket does |
| **One e2e script, no unit tests** | `npm run e2e` covers the journeys end to end, but there is nothing testing `grading`-adjacent pure functions like `formatDuration` in isolation |
| **Access log exposure** | The WebSocket token is in a query string, so it lands in proxy logs. Short-lived, but exclude the query string from your access log format |

### Where to take it

- Diff two scans of the same domain: "what changed since last week" is the
  report people actually act on, and both scans are already stored.
- A dashboard summarising grades across every domain you own.
- Export a report as PDF for the person who authorises the fix.
