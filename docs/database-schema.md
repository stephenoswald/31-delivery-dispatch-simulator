# Database schema consumed by the frontend

The source of truth is the backend’s SQLAlchemy models and Alembic migrations.
The frontend does not create a database or store operational records locally.

| Table | Frontend use |
| --- | --- |
| users | Authentication, roles, contact information, fixed user zone/address/coordinates |
| rider_profiles | Availability, vehicle details, fixed rider position |
| orders | Delivery route, recipient, fee, assignment, lifecycle |
| broadcast_offers | Rider invitations, expiration, acceptance/rejection |
| order_events | Customer/admin delivery timeline |
| reviews | Completed-order feedback and aggregate ratings |
| location_history | Order-linked tracking snapshot |

User IDs and rider-profile IDs differ: orders and offers reference the rider
profile ID, while a rider profile references its owning user ID. Directory joins
use `rider.user_id === user.id` rather than assuming those IDs are interchangeable.

Money uses integer minor units; NGN display divides by 100. Backend naive
ISO timestamps represent UTC and are displayed in Africa/Lagos time. An order
progresses through pending/broadcasting, assigned, picked_up, in_transit, delivered,
or ends in cancelled. Only the server authorizes transitions and ownership.

The current seed has 1 admin, 8 customers, 21 riders, synthetic phone identifiers,
and fixed Port Harcourt locations. There are no seeded orders or payments.
