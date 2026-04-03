# Money Manager

A personal expense and income management platform. Money Manager helps users track their daily financial transactions, organize spending by category, automate recurring entries, and visualize money flow through a statistics dashboard.

## Implementation Status

**Progress: ~65% complete** (59 of 90 tasks done)

| Phase | Status | Tasks |
|-------|--------|-------|
| Phase 1: Setup | Complete | 3/3 |
| Phase 2: Foundational (DB, backend shell, frontend shell) | Complete | 20/20 |
| Phase 3: US1 — Log Transactions | Complete | 15/15 |
| Phase 4: US2 — Edit/Delete Transactions | Complete | 9/9 |
| Phase 5: US3 — Manage Categories | Complete | 12/12 |
| Phase 6: US4 — Statistics Dashboard | Not started | 0/12 |
| Phase 7: US5 — Recurring Transactions | Not started | 0/13 |
| Phase 8: Polish & Cross-Cutting | Not started | 0/6 |

## Architecture

| Component | Technology | Deployment |
|-----------|-----------|------------|
| Frontend | React 18 + TypeScript 4.9 | S3 static website hosting |
| Backend | Express 5 + TypeScript 4.9 | AWS Lambda via API Gateway (HTTP API v2) |
| Database | PostgreSQL 16 | AWS RDS with RDS Proxy |
| Recurring Jobs | EventBridge Scheduler | Daily cron → Lambda |
| Migrations | node-pg-migrate | Separate Lambda in CI/CD pipeline |

## Project Structure

```
backend/
  src/
    api/             # Express routes and middleware
    db/              # Connection pool and SQL migrations
    models/          # TypeScript entity interfaces
    services/        # Business logic (category, transaction)
  tests/
    integration/     # API endpoint tests
    unit/            # Service unit tests
frontend/
  src/
    components/      # UI components (categories, transactions, ui)
    hooks/           # Custom React hooks
    pages/           # Route page components
    services/        # API client
    types/           # Shared TypeScript types
  tests/
    unit/            # Component and page tests
infra/
  template.yaml      # AWS SAM template
specs/
  001-money-manager-platform/
    spec.md          # Feature specification
    plan.md          # Implementation plan
    tasks.md         # Task list (90 tasks)
    data-model.md    # Database schema
    contracts/
      rest-api.md    # REST API contracts
```

## Getting Started

### Prerequisites

- Node.js 20 LTS
- npm 10+
- PostgreSQL 16 (or Docker)

### Setup

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start PostgreSQL (Docker)
docker run --name money-pg -e POSTGRES_DB=money_manager \
  -e POSTGRES_USER=mm_user -e POSTGRES_PASSWORD=mm_pass \
  -p 5432:5432 -d postgres:16

# Run migrations
cd backend && npm run migrate up

# Start backend
npm run dev

# Start frontend (in another terminal)
cd frontend && npm start
```

## Testing

```bash
# Backend tests (60 tests across 4 suites)
cd backend && npm test

# Frontend tests (19 tests across 4 suites)
cd frontend && npm test
```

## Next Steps

Implementation continues with Phase 6 (US4 — Statistics Dashboard), followed by Phase 7 (US5 — Recurring Transactions), and Phase 8 (Polish).
