# Existing API contract

Base: `/api/v1`. Protected calls use `Authorization: Bearer <opaque-token>`.
FastAPI `/docs` and `/openapi.json` remain authoritative. No endpoint was renamed.

| Feature | Method | Existing endpoint |
| --- | --- | --- |
| Sign in | POST | `/auth/login` (JSON email/password) |
| Session profile | GET | `/auth/me` |
| Customer deliveries | GET, POST | `/customer/orders` |
| Customer order | GET | `/customer/orders/{id}` |
| Customer tracking | GET | `/customer/orders/{id}/tracking` |
| Customer cancellation | POST | `/customer/orders/{id}/cancel` |
| Review | GET, POST | `/customer/orders/{id}/review` |
| Rider profile | GET | `/rider/profile` |
| Rider availability | PATCH | `/rider/availability` |
| Nearby request transport | GET | `/rider/offers` |
| Atomic request acceptance | POST | `/rider/offers/{reference}/accept` |
| Request decline | POST | `/rider/offers/{reference}/reject` |
| Rider deliveries | GET | `/rider/orders` |
| Assigned delivery | GET | `/rider/orders/{id}` |
| Status progression | PATCH | `/rider/orders/{id}/status` |
| Rider reviews | GET | `/rider/reviews` |
| Admin accounts | GET | `/admin/users` |
| Account activation | PATCH | `/admin/users/{id}/activation` |
| Rider directory | GET | `/admin/riders` |
| Admin deliveries | GET | `/admin/orders` |
| Admin order | GET | `/admin/orders/{id}` |
| Admin tracking | GET | `/admin/orders/{id}/tracking` |
| Refresh unanswered request | POST | `/admin/orders/{id}/broadcast` |
| Admin cancellation | POST | `/admin/orders/{id}/cancel` |
| Reviews | GET | `/admin/reviews` |
| Operational summary | GET | `/admin/analytics` |

List requests use `limit=100` and subsequent `offset` pages before applying UI
search/filter/pagination. The interface never substitutes hardcoded operational
records. Fixed neighborhood shortcuts are location inputs, not server records.

Booking sends addresses, numeric coordinates, recipient_name, recipient_phone,
and package_description. No financial data is submitted or displayed. Availability
accepts available/offline. Progress sends picked_up, in_transit, then delivered,
matching the actual schema. Review sends rating 1–5 and optional comment. Admin
request refresh sends radius_km. CSV exports serialize actual loaded records and
escape spreadsheet formula prefixes; nothing is fabricated as a generated report.

401 invalidates the current authenticated session. 403 is wrong-role access. 404
hides inaccessible resources and represents a not-yet-created review. 409 is a
state/assignment/duplicate conflict; stale nearby requests are removed/refreshed.
422 displays field validation errors. Network failure shows retry guidance.

This client does not call registration, profile mutation/settings, vehicle
mutation/settings, or real-time location submission. Full compatibility gaps are
listed in [backend-limitations.md](backend-limitations.md).
