# SwiftDispatch

A responsive Port Harcourt delivery simulator for customers, riders, and admins.
The frontend follows the four supplied UI flow boards with a dark sidebar,
emerald actions, navy/blue interface, mobile bottom navigation, delivery cards,
and interactive Leaflet/OpenStreetMap maps with simulated positions.

```sh
cd frontend
npm ci
npm run dev
```

Open http://127.0.0.1:5173 with FastAPI running on port 8000. Select a demo portal
and sign in. Credentials: admin@example.com, customer01@example.com, or
rider01@example.com; all seeded passwords are DemoPass123!.

```sh
npm run lint
npm test
npm run build
```

[Setup and included screens](frontend/README.md) ·
[Architecture](docs/architecture.md) · [API contract](docs/api-contract.md) ·
[Backend compatibility limits](docs/backend-limitations.md) ·
[Demo walkthrough](docs/demo-script.md) · [QA report](docs/qa-report.md)

This branch contains frontend changes. The existing backend and SQLite schema
were preserved. All operational data comes from FastAPI; simulated distance-based payment is included; signup,
payout, promotion, and settings UI are not included. Rider requests use HTTP polling.
