# Team responsibilities

| Area | Responsibility |
| --- | --- |
| Frontend | Responsive layouts, role-specific workflows, accessible forms, API transport, loading/error states, frontend tests |
| Backend | Authentication, role/ownership enforcement, state transitions, atomic acceptance, radius matching, persistence, migrations, seed data |
| Integration | Maintain response types/contracts, handle expiry/conflicts, verify the three-role delivery journey |
| Product/design | Validate the supplied flow boards, Port Harcourt demo neighborhoods, copy, and mobile layouts |
| Operations | Run/reverse-proxy FastAPI, configure production SPA hosting, HTTPS, environment variables, CI |

Frontend changes belong on the frontend branch; backend changes belong on the
backend branch. Do not commit local SQLite databases, virtual environments,
node_modules, .env credentials, screenshots, or build output. No external messaging
or publishing integration is configured in this implementation.
