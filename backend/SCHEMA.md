# Database schema

The SQLAlchemy models and initial Alembic migration describe the same SQLite schema.
All tables have an integer primary key and a database-generated creation timestamp.

| Table | Purpose | References and constraints |
| --- | --- | --- |
| users | Accounts, password hashes, contact details, roles, zone/address/coordinates | Unique email and optional phone; customer/rider/admin role |
| rider_profiles | Availability, vehicle, latest position | One profile per user; offline/available/busy |
| orders | Delivery addresses, coordinates, recipient, fee, lifecycle | Customer user; optional assigned rider profile; unique tracking code |
| broadcast_offers | Dispatch invitations and rider responses | Order and rider profile; unique pair; at most one accepted offer per order |
| order_events | Timeline and audit details | Order; optional actor user; event type, old/new status, JSON details |
| reviews | Customer feedback | Order, customer user, rider profile; one review per order; rating 1–5 |
| location_history | Timestamped GPS samples | Rider profile; optional order |

Order states: pending, broadcasting, assigned, picked_up, in_transit, delivered,
cancelled. Active assigned/picked_up/in_transit orders require a rider, and a rider
can have at most one such order. Offer states: pending, accepted, rejected, expired,
withdrawn. Re-broadcasting to the same rider updates the existing offer.

Latitude is between -90 and 90; longitude is between -180 and 180. A rider's latest
coordinates are either both absent or both present. Order and history coordinates
are required. Fees are nonnegative integer minor units. UTC timestamps are stored
without timezone offsets by convention; callers must normalize supplied timestamps.

Deletion rules preserve account references with RESTRICT. Deleting an order
cascades its offers, events and review; history samples retain their rider and clear
the order link. Deleting a rider cascades location history but is restricted while
orders, offers or reviews still reference that rider. Account deactivation is
preferred to deletion. Order-deletion endpoints are not exposed; lifecycle changes are recorded as events.

Database constraints do not enforce actor roles, review eligibility, allowed state
transitions, offer expiry, or agreement between an accepted offer and order
assignment. Those checks are implemented in the service layer and acceptance
transaction. Partial unique indexes provide concurrency safeguards for SQLite,
and the service layer implements the acceptance workflow.
