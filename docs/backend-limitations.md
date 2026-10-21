# Existing backend limitations and compatibility decisions

The frontend rebuild preserves the SQLite schema. A subsequent rider-discovery
fix updates FastAPI polling to discover waiting orders and renew expired invitations. These are explicit differences between the requested ideal contract
and the actual OpenAPI/service implementation inspected for this task.

| Requested behavior | Existing backend | Frontend behavior |
| --- | --- | --- |
| JWT authentication | `/auth/login` returns a custom HMAC-signed bearer token | Treat token as opaque; preserve login/me, expiry, active-account and role checks |
| No separate broadcast-offers architecture | Server persists invitations and exposes `/rider/offers` and `/rider/offers/{id}/accept` or `/reject` | Only `features/rider/api.ts` knows the wire envelope; UI consumes flattened `NearbyDelivery` orders and has no Offer/BroadcastOffer domain model |
| Online riders discover pending requests | Server creates radius-filtered invitations at booking and reconciles eligible waiting orders on rider polling | Available riders discover earlier bookings automatically; explicit declines stay declined |
| Requests remain available until order expiry | Invitations expire after 60 seconds by default and renew on eligible rider polling while the order remains unassigned; orders themselves do not expire | Poll every five seconds while available; no manual admin refresh required |
| PENDING → ACCEPTED → PICKED_UP → DELIVERED | Actual states are pending/broadcasting → assigned → picked_up → in_transit → delivered, plus cancelled | Group aliases for filtering/display and preserve exact sequential API mutations, including Start delivery |
| EXPIRED order state | Not present in the current order schema | Badge, history filters, timeline and recovery view support it if supplied later; never fabricate it locally |
| Assigned rider name/contact for customer | Customer order/tracking contains rider profile ID, not rider name/phone/vehicle | Show actual assigned ID and location snapshot; explain that contact details are unavailable, without fabricating people |
| Customer details for rider | Assigned order exposes customer ID and recipient name/phone, but not customer profile contact | Display exactly the permitted ID and recipient details |
| No public signup | Server still exposes `POST /auth/register` | No route, client method, link, or signup form. Disabling the server endpoint is a separate backend policy change |
| Average pickup-to-delivery duration | Summary/order records expose created_at and delivered_at; bulk analytics lacks pickup timestamps | Label calculation accurately as request-to-delivery average; no invented duration or ETA |

All operational lists, metrics and reports use actual API data. Radius matching,
atomic acceptance, lifecycle authorization, review eligibility/uniqueness, and
account activation restrictions remain enforced by the server. A losing acceptance
returns 409, removes the stale request and refreshes the nearby list. A request
may also conflict if rider availability changed; no conflict is reported as success.

Removing the backend invitation table, renaming endpoints/states, replacing token
format, and exposing additional participant details
would require a coordinated backend change. None is silently simulated here.
