# Frontend rebuild QA report

Verification date: 21 October 2026 (Africa/Lagos).
Branch: frontend. The backend code/schema and the user's SQLite database were
preserved. Browser mutations ran against a disposable SQLite copy on a separate
backend port, using the actual FastAPI app and endpoints. No fabricated successful
responses or seed arrays were used for the browser journey.

## Automated checks

- ESLint/TypeScript/React Hooks: passed, zero warnings.
- Frontend Vitest: 24 tests passed across 9 files.
- Backend regression suite: 22 tests passed, including atomic acceptance races,
  authentication, roles, ownership, static locations, and migration consistency.
- Strict TypeScript + Vite production build: passed.
- Git whitespace check: passed.

Frontend tests cover token transport/session invalidation, login redirects and
errors, API pagination, address/coordinate booking validation, empty coordinate
handling, confirmation/cancel and keyboard focus wrapping, order filters/history,
accept/decline/409 conflicts, pending-request transport adaptation, status aliases,
invalid action prevention, expired recovery UI, and real operational calculations.
React Router emits its existing v7 migration advisories during unit tests; these
are warnings about future opt-ins, not runtime failures or lint warnings.

## Actual browser journey

Passed incorrect login, correct role login, rider online, customer creation with
confirmation, waiting/tracking, rider acceptance, customer acceptance visibility,
pickup → transit → delivery, rider history, customer review, duplicate-review
protection after refresh, cancellation with confirmation, unauthorized role
redirect, invalid-token logout, navigation, maps, and session restoration.

The initial journey/dashboard pass performed 50 checks with no uncaught browser
exceptions, unexpected HTTP failures, street-tile failures, or page overflow.
Expected 401 tests and the first not-yet-created review's 404 were handled correctly.

## Responsive matrix

Widths: **320, 375, 390, 768, 1024, 1440 pixels**.

An expanded matrix checked 20 pages at all six widths (120 combinations): admin
orders/details, tracking, rider directory/details, customers, analytics, reports;
customer orders/details/tracking/review/history/booking/profile; rider nearby
requests, delivery details, active delivery, history, profile. All passed page
width/overflow and rendered-error checks. Dashboard and booking were also checked
separately during the initial 50-check pass. Representative desktop and mobile
screenshots were visually inspected against the supplied four flow boards.

Mobile tables render as labelled delivery/account cards. Bottom navigation and
More navigation were checked. A confirmation focus-wrap issue found during QA was
fixed; the four final mobile menu/dialog/focus/logout checks passed. The native
confirmation fits 320px, wraps Tab/Shift+Tab focus, and supports cancel/Escape.

## Operational checks

Actual CSV downloads passed for order export, daily reports, and operational
analytics. Downloads contained real records and no financial columns. Admin
Delivered filtering passed. Rider request HTTP polling stopped while offline and
resumed online. No unexpected network errors or browser exceptions occurred.

## Known limits

The current backend is not the idealized API in the prompt: tokens are signed
bearer credentials, invitations use legacy endpoint references, orders do not
expire automatically, some participant contact details are not exposed, and the
server still has a registration endpoint even though the frontend has no signup.
See [backend-limitations.md](backend-limitations.md) for exact decisions. Fixed
locations, straight-line map connections, and no GPS/ETA are intentional simulation
behavior. OpenStreetMap street tiles require network access, with a visible
fallback if unavailable.

Full machine-readable check results: [qa-results.json](qa-results.json).
