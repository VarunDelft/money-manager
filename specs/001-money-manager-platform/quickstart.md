# Quickstart: Money Manager Platform

**Branch**: `001-money-manager-platform`

## Prerequisites

- Node.js 20 LTS
- npm 10+
- PostgreSQL 16 (local for development) or Docker
- AWS CLI v2 (for deployment)
- AWS SAM CLI (for local Lambda testing)

## Local Development Setup

### 1. Clone and install

```bash
git clone <repo-url> && cd expense-manager
git checkout 001-money-manager-platform

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Start PostgreSQL (Docker)

```bash
docker run -d \
  --name expense-manager-db \
  -e POSTGRES_USER=expense_mgr \
  -e POSTGRES_PASSWORD=local_dev_password \
  -e POSTGRES_DB=expense_manager \
  -p 5432:5432 \
  postgres:16
```

### 3. Configure environment

```bash
# backend/.env
DATABASE_URL=postgresql://expense_mgr:local_dev_password@localhost:5432/expense_manager
NODE_ENV=development
PORT=3001
```

```bash
# frontend/.env
REACT_APP_API_URL=http://localhost:3001/api/v1
```

### 4. Run database migrations

```bash
cd backend
npx node-pg-migrate up --migrations-dir src/db/migrations
```

### 5. Start development servers

```bash
# Terminal 1: Backend (Express dev server with hot reload)
cd backend && npm run dev

# Terminal 2: Frontend (React dev server)
cd frontend && npm start
```

Frontend runs at `http://localhost:3000`, proxying API calls to `http://localhost:3001`.

## Run Tests

```bash
# Backend unit + integration tests
cd backend && npm test

# Frontend unit tests
cd frontend && npm test

# Type checking
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

## Project Structure

```
expense-manager/
├── backend/
│   ├── src/
│   │   ├── api/           # Express routes + middleware
│   │   ├── db/            # Migrations, seeds, connection pool
│   │   ├── models/        # TypeScript interfaces
│   │   ├── services/      # Business logic
│   │   ├── jobs/          # Recurring transaction scheduler
│   │   └── lambda.ts      # Lambda entry point
│   ├── tests/
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # UI components (shared, feature-specific)
│   │   ├── pages/         # Route-level pages
│   │   ├── services/      # API client
│   │   ├── hooks/         # Custom React hooks
│   │   └── types/         # Shared TypeScript types
│   ├── tests/
│   ├── tsconfig.json
│   └── package.json
├── infra/                 # AWS IaC (SAM/CDK)
└── specs/                 # Feature specifications
```

## Key Architecture Decisions

| Component | Technology | Notes |
|-----------|-----------|-------|
| Frontend | React 18 + TypeScript | SPA, deployed to S3 static website hosting |
| Backend | Express 4 + TypeScript | Wrapped with `@codegenie/serverless-express` for Lambda |
| Database | PostgreSQL 16 | RDS in production, local Docker for dev |
| Migrations | node-pg-migrate | SQL-first, run via CI/CD pipeline |
| API Gateway | HTTP API v2 | Proxies `/api/*` to Lambda |
| Recurring Jobs | EventBridge Scheduler | Daily cron → Lambda → generate transactions |

## Deployment

```bash
# Build backend
cd backend && npm run build

# Build frontend
cd frontend && npm run build

# Deploy via SAM (from infra/)
cd infra && sam build && sam deploy --guided
```

Production deployment pipeline: Lint → Type Check → Test → Build → Migrate DB → Deploy Lambda → Deploy Frontend to S3.
