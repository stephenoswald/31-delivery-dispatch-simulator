# SwiftDispatch frontend

A responsive delivery simulator with customer, rider, and admin portals. Built
with React 19, strict TypeScript, Vite, Tailwind CSS, React Router, TanStack Query,
Lucide, Recharts, and Leaflet/OpenStreetMap. Use Node.js 22.13+ and npm.

```sh
cd frontend
npm ci
npm run dev
```

Open http://127.0.0.1:5173. Run the existing FastAPI backend on port 8000.
Vite proxies `/api` to that server. `API_PROXY_TARGET` optionally changes the
server-side development proxy target; `VITE_API_BASE_URL` changes the browser
API base URL. Copy `.env.example` only if you need an override. Never put secrets
in VITE variables, which are included in the public bundle.

| Portal | Seeded email | Password |
| --- | --- | --- |
| Customer | customer01@example.com | DemoPass123! |
| Rider | rider01@example.com | DemoPass123! |
| Admin | admin@example.com | DemoPass123! |

Choose a portal to fill demo credentials, then sign in. The backend-returned role
controls access. There is no public registration screen or registration client.
Existing credentials and user records are not modified by the frontend.

## Screens and actions

Customer: dashboard; guided delivery form with addresses, coordinates, map point
selection, recipient/package details and confirmation; pending/waiting view;
accepted view; delivery tracking and timeline; cancellation; searchable paginated
history; delivery details; eligible, duplicate-protected reviews; read-only profile.

Rider: dashboard; online/offline availability; nearby requests with expiry
countdowns; real accept/decline and conflict recovery; active delivery; sequential
pickup/transit/delivery confirmation dialogs; terminal delivery history; read-only
profile, vehicle information, availability and actual customer rating.

Admin: dashboard with seven operational summaries; order search/status filters,
pagination and CSV export; order/participant details and supported cancellation;
manual request refresh with a pickup radius; active tracking and rider filters;
rider/customer directories and details; account activation; completion/duration/
status/rider analytics; date-filtered daily operational reports and CSV exports.

No pricing, payment, earnings, payout, revenue, promotion, public signup, or
settings UI is included. No successful response or operational record is mocked.
The current backend may include financial fields in responses; the UI ignores them.

## Visual and interaction design

The four supplied flow boards are the foundation: dark navigation, emerald action
buttons, navy typography, blue status accents, white cards, map-led delivery views,
and mobile bottom navigation. Tables become labelled cards on small screens.
Shared components provide fields, badges, buttons, panels, skeletons, empty/error
states, native modal confirmations, keyboard focus wrapping, and toast feedback.

Leaflet maps use OpenStreetMap tiles with attribution. Maps support panning, zoom,
marker selection and point selection. They do not request GPS. Lines are clearly
labelled illustrative connections, not road routes or ETAs. If street tiles are
unavailable, fixed markers and controls remain usable with a notice. Tile access
requires an internet connection; API data still comes from your local backend.
Addresses are entered manually; map clicks change coordinates and do not geocode.

Rider pending requests and availability poll every five seconds while online and
visible. TanStack Query deduplicates shared resource queries and pauses interval
polling in hidden tabs. Countdown timers also pause while hidden and catch up when
visible. Terminal order views stop interval polling. Logout clears session/cache;
protected routes and the backend enforce role/ownership permissions after refresh.

## Verification

```sh
npm run lint
npm test
npm run build
npm run preview
```

Lint uses ESLint + TypeScript + React Hooks rules with zero warnings permitted.
Vitest tests cover authentication/errors, API transport/pagination, booking and
coordinate validation, confirmation/focus behavior, filters/history, acceptance
conflicts, transport adaptation, and lifecycle/operational metrics. TypeScript is
checked before Vite generates `dist/`. Browser QA exercised real end-to-end flows
against a disposable copy of SQLite, leaving the user's database unchanged.
See [QA report](../docs/qa-report.md).

For production, serve `dist/` with SPA fallback to `index.html` and an HTTPS API
reverse proxy. Vite's development proxy is not part of the production bundle.
Cross-origin deployments need backend CORS configured for their actual origin.
Tokens are opaque bearer credentials: sessionStorage by default, or localStorage
when Remember me is checked. The current backend uses HMAC-signed tokens, not JWTs.

## Backend compatibility limits

No backend files or database schema were changed for this rebuild. The actual
backend contract takes precedence over the illustrative prompt. See
[backend gaps](../docs/backend-limitations.md) for the existing invitation-based
request transport, manual refresh requirement, missing order expiry, participant
contact limitations, legacy registration endpoint, and actual lifecycle states.
