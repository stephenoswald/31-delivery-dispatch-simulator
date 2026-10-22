# SwiftDispatch backend

FastAPI, SQLAlchemy 2, Alembic, and SQLite. Python 3.9+; Python 3.11+ recommended.

```sh
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
.venv/bin/alembic upgrade head
.venv/bin/uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000/docs for interactive API documentation.
The SQLite database is `backend/dispatch.db` when commands run from `backend/`.
Use Alembic migrations to create/update the schema; startup does not create tables.

## Authentication

Register a customer or rider with `POST /api/v1/auth/register`:

```json
{
  "email": "customer@example.com",
  "password": "password123",
  "full_name": "Demo Customer",
  "role": "customer"
}
```

Login with `POST /api/v1/auth/login` using JSON email/password. Copy `access_token`
from the response into Swagger's **Authorize** dialog, or send
`Authorization: Bearer <access_token>`. Passwords use salted PBKDF2-SHA256 with
600,000 iterations. Bearer tokens are HMAC-signed, expire after one hour by default,
and are checked against the current active account on every protected request.
These are application-specific bearer tokens, not JWTs. There is no refresh or
logout/revocation endpoint; tokens expire naturally. Public signup cannot create admins.

Set `AUTH_SECRET` in `.env` to a stable random value of at least 32 characters:

```sh
.venv/bin/python -c 'import secrets; print(secrets.token_urlsafe(48))'
```

Without that setting, a random process-local secret is used: restarting the server
invalidates existing tokens. Multiple workers must share the same configured secret.

Create an administrator locally; the password is entered at a hidden prompt:

```sh
.venv/bin/python -m scripts.create_admin --email admin@example.com --name Admin
```

## Endpoints

All paths below have the prefix `/api/v1`. List endpoints accept `offset` and
`limit` (default 20, maximum 100; events/locations default to 100).

| Role | Method | Path | Purpose |
| --- | --- | --- | --- |
| Public | POST | `/auth/register` | Customer/rider signup; creates rider profile automatically |
| Public | POST | `/auth/login` | Obtain bearer token |
| Authenticated | GET, PATCH | `/auth/me` | Read/update own name and phone |
| Customer | POST, GET | `/customer/orders` | Create delivery with broadcast; list own orders |
| Customer | GET | `/customer/orders/{id}` | Order details |
| Customer | POST | `/customer/orders/{id}/cancel` | Cancel before pickup |
| Customer | GET | `/customer/orders/{id}/tracking` | Status, latest order-linked location, last 100 events |
| Customer | GET | `/customer/orders/{id}/events` | Paginated timeline |
| Customer | GET | `/customer/orders/{id}/locations` | Paginated GPS history |
| Customer | POST, GET | `/customer/orders/{id}/review` | Submit/read own order review |
| Rider | GET, PATCH | `/rider/profile` | View profile; update vehicle type |
| Rider | PATCH | `/rider/availability` | Set offline/available |
| Rider | POST | `/rider/location` | Update GPS and append history |
| Rider | GET | `/rider/offers` | Pending, unexpired offers with delivery details |
| Rider | POST | `/rider/offers/{id}/accept` | Atomically claim order and reserve rider |
| Rider | POST | `/rider/offers/{id}/reject` | Reject an offer |
| Rider | GET | `/rider/orders` | List assigned deliveries |
| Rider | GET | `/rider/orders/{id}` | Assigned delivery details |
| Rider | PATCH | `/rider/orders/{id}/status` | Advance delivery status |
| Rider | GET | `/rider/reviews` | List customer feedback |
| Admin | GET | `/admin/users` | List/filter accounts by role |
| Admin | PATCH | `/admin/users/{id}/activation` | Activate/deactivate account |
| Admin | GET | `/admin/riders` | List/filter rider availability |
| Admin | GET | `/admin/orders` | List/filter all orders |
| Admin | GET | `/admin/orders/{id}` | Inspect order |
| Admin | POST | `/admin/orders/{id}/broadcast` | Broadcast/rebroadcast with radius |
| Admin | POST | `/admin/orders/{id}/cancel` | Cancel before pickup |
| Admin | GET | `/admin/orders/{id}/tracking` | Inspect tracking |
| Admin | GET | `/admin/orders/{id}/events` | Inspect paginated timeline |
| Admin | GET | `/admin/reviews` | List all reviews |
| Admin | GET | `/admin/analytics` | Order counts, availability, delivered fees, average rating |

`GET /health` is public and outside `/api/v1`. Order lists accept `status`; rider
and admin order lists follow the same pagination conventions. Wrong-role access
returns 403; unauthenticated access returns 401. Resources belonging to another
customer/rider return 404. Conflicts and invalid lifecycle actions return 409;
invalid request bodies return 422.

## Delivery walkthrough

1. Register a customer and two riders; login separately as each.
2. Seed the fixed demo accounts (see below). Login as a seeded rider and PATCH
   `/rider/availability` with `{"status":"available"}`. Its Port Harcourt position
   is already stored; no location update is needed.
3. Customer POST `/customer/orders`:

```json
{
  "pickup_address": "Old GRA, Port Harcourt",
  "pickup_latitude": 4.785,
  "pickup_longitude": 7.01,
  "dropoff_address": "D-Line, Port Harcourt",
  "dropoff_latitude": 4.805,
  "dropoff_longitude": 7.005,
  "recipient_name": "Recipient",
  "recipient_phone": "+2348000000000",
  "package_description": "Books"
}
```

4. Riders GET `/rider/offers`; one POSTs `/rider/offers/{offer_id}/accept`.
5. Assigned rider PATCHes `/rider/orders/{order_id}/status` sequentially with
   `{"status":"picked_up"}`, `{"status":"in_transit"}`, `{"status":"delivered"}`.
   In static mode, tracking displays the fixed rider position recorded at acceptance.
6. Customer GETs tracking and POSTs `/customer/orders/{order_id}/review` with
   `{"rating":5,"comment":"Great delivery"}` after delivery.

## Dispatch and data rules

Orders automatically enter broadcasting. Eligible riders must be active, available,
within `DISPATCH_RADIUS_KM` (default 5), and have stored coordinates.
`LOCATION_MODE=static` is the default: seeded positions do not expire and
`POST /rider/location` returns 409 to keep positions fixed. Set `LOCATION_MODE=live`
to enable manual/GPS location updates and require locations updated within
`LOCATION_MAX_AGE_SECONDS` (default 300). Restart the server after changing modes. Offers expire after `OFFER_TTL_SECONDS`
(default 60). There is no background broadcast scheduler: an admin can rebroadcast
an unassigned order with `{"radius_km":10}`. Rebroadcast refreshes eligible offers
and withdraws pending invitations to riders who are no longer eligible. Each
order/rider pair reuses its existing offer row. Expired invitations are excluded
from the offers list and cannot be accepted or rejected.

SQLite write requests acquire a write reservation before reading. Acceptance uses
conditional updates and one transaction for the rider, order, offers, and audit
event. Partial unique indexes also enforce one accepted offer per order and one
active order per rider. Losing requests return 409. Other riders' offers are
withdrawn when an order is accepted; no duplicate assignment is allowed.

Only the owning customer can review a delivered order, once. Rider availability
cannot change during an active delivery; completion or cancellation releases the
rider. Tracking exposes only GPS samples linked to that order and does not expose
rider movement after the delivery ends. Administrators cannot deactivate themselves
or accounts with an active assigned delivery.

Times are naive UTC by schema convention. Coordinates are decimal degrees.
Delivery fees currently remain zero with currency NGN; pricing/payment processing
is not implemented. Analytics fee totals therefore remain zero for API-created
orders. See [SCHEMA.md](SCHEMA.md) for database relationships and constraints.
There is no automatic GPS simulator or external notification service. The reset
module remains a placeholder.

## Demo accounts

Run `.venv/bin/python -m scripts.seed_demo` from `backend/` to create 30 accounts:

| Role | Email | Count |
| --- | --- | --- |
| Admin | `admin@example.com` | 1 |
| Customer | `customer01@example.com` through `customer08@example.com` | 8 |
| Rider | `rider01@example.com` through `rider21@example.com` | 21 |

The password for newly seeded accounts is `DemoPass123!`. Use `--prompt-password`
to choose a different password. All 30 users have fixed Port Harcourt addresses,
coordinates, and unique synthetic phone numbers (`+2340000000001` through
`+2340000000030`). These are demonstration identifiers, not contact numbers.
Locations are illustrative neighborhood points rather than geocoded addresses.
The hardcoded source is `app/db/demo_data.py`. User locations appear in auth
and admin user responses; rider coordinates also appear in rider profiles.
Rerunning updates these demo contact/location fields while preserving passwords,
account activation, names, rider availability, and other existing users. All 21
riders have motorcycle profiles, initially offline; set availability before
dispatching orders. The entire seed runs in one transaction.

## Tests

```sh
.venv/bin/python -m pytest -q
```

Tests use temporary SQLite databases. They cover registration/login, authentication
and roles, ownership, validation, dispatch radius/freshness/expiry, concurrent offer
acceptance, rejection/rebroadcasting, cancellation, delivery transitions, tracking
privacy, reviews, admin operations, and migration/model consistency. They do not
write demo accounts or deliveries into the local application database.


## Support tickets and delivery confirmation

Run `alembic upgrade head` before starting the updated API (migration `0003`).
Existing active orders are assigned receipt codes; new orders generate them at
creation. Only the owning customer can retrieve a code through
`GET /api/v1/customer/orders/{id}/confirmation-code`. Rider completion now requires
`{"status":"delivered","delivery_code":"123456"}` on the existing progress endpoint.
Five incorrect attempts trigger a one-minute cooldown; valid completion remains
subject to assigned-rider authorization and sequential lifecycle transitions.
Codes are omitted from all general order schemas and audit events.

`/api/v1/support/tickets` supports customer creation and scoped listing. Detail and
paginated messages are at `/{ticket_id}` and `/{ticket_id}/messages`; customers and
admins can post messages. Only admins can PATCH ticket status (`open`/`resolved`).
Riders and other customers cannot access conversations. Resolved tickets reject
new messages until reopened. Messages contain plain text, not attachments or email.

The existing free Render start command can remain:
`alembic upgrade head && python -m scripts.seed_demo && uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
Local SQLite tickets, orders, and codes disappear with Render Free filesystem resets.


## Simulated distance pricing and payment

Run migration `0004` via the existing `alembic upgrade head` startup step.
`POST /api/v1/customer/quote` accepts pickup/drop-off coordinates and returns
straight-line distance (rounded to 0.01 km), base fare (50000 kobo), rate per km
(10000 kobo), and total. Order creation calculates and stores this price and
creates an unpaid `pending` order without invitations.

`POST /api/v1/customer/orders/{id}/pay` accepts `{"outcome":"success"}` or
`{"outcome":"failed"}` for the owning customer. Success generates a SIM-prefixed
receipt, records paid_at and a payment event, and broadcasts in one transaction.
Failed simulation returns 402 and leaves the order unpaid. Duplicate successful
requests return the existing receipt. Cancelled orders cannot be paid. Broadcast,
rider discovery, acceptance, and delivery progress enforce paid status.

Existing orders are grandfathered into dispatch eligibility with their historical
fees unchanged and no invented receipt or paid_at timestamp. This is a simulation,
not a payment-provider integration; no actual charges or refunds occur.
