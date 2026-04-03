# Research: Money Manager Platform

**Date**: 2026-04-03 | **Branch**: `001-money-manager-platform`

## 1. Express on AWS Lambda

**Decision**: Use `@codegenie/serverless-express` (successor to `aws-serverless-express`) to wrap the Express app for Lambda execution. Configure Lambda with 1 GB memory, 30s timeout for API endpoints.

**Rationale**: `@codegenie/serverless-express` is actively maintained, handles API Gateway v1/v2 payload transformations automatically, and allows reusing the Express app instance across warm invocations. 1 GB memory provides near-single-core CPU allocation, balancing cold start time against throughput.

**Alternatives considered**:
- AWS Lambda Web Adapter — less mature, requires custom configuration
- Standalone Lambda per route (no Express) — poor DX, duplicated routing logic, more deployment complexity
- Provisioned Concurrency — adds cost; defer until production metrics justify it

**Key patterns**:
- Express app created once per container (module-level singleton), reused across warm invocations
- Lambda handler delegates to `serverlessExpress({ app })` 
- Cold start optimization: bundle with esbuild to tree-shake; lazy-load heavy modules (DB client) on first request
- Keep deployment package small via Lambda Layers for `node_modules` if needed

## 2. Lambda + RDS PostgreSQL Connection Management

**Decision**: Use RDS Proxy in TRANSACTION pooling mode between Lambda and RDS. Additionally use `pg` Pool client in-process with `max: 5` connections per Lambda container.

**Rationale**: Lambda's ephemeral nature means uncontrolled connections exhaust RDS connection limits under concurrency. RDS Proxy multiplexes many Lambda containers (e.g., 1000) into a small pool of actual DB connections (~50–100). In-process `pg` Pool reuses connections within a warm container, avoiding reconnection overhead.

**Alternatives considered**:
- Only RDS Proxy, no in-process pool — adds latency per request (extra network hop without reuse)
- Only in-process pool, no RDS Proxy — breaks at scale; each Lambda container opens its own connections
- Aurora Serverless v2 — ~30% cost premium; RDS + Proxy is more cost-effective for predictable single-user traffic
- DynamoDB — lacks ACID guarantees needed for financial transaction integrity

**Key configuration**:
- `pg` Pool: `max: 5`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 2000`, `statement_timeout: 30000`
- RDS Proxy: transaction pooling mode, max pool size 100, timeout 1200s
- Set Lambda reserved concurrency below RDS Proxy connection limit
- Add exponential backoff retry for transient connection failures

## 3. Recurring Transaction Scheduling

**Decision**: Use Amazon EventBridge Scheduler to trigger a dedicated Lambda function on a daily cron schedule. Use a PostgreSQL-based idempotency check (not DynamoDB) to prevent duplicate transaction generation.

**Rationale**: EventBridge Scheduler is the modern AWS-native approach for cron-style invocations. A daily run checks all active recurring rules, calculates due occurrences, and generates transactions. PostgreSQL-based idempotency (unique constraint on `recurring_rule_id + occurrence_date`) avoids introducing DynamoDB as an additional service dependency — keeping the stack simpler.

**Alternatives considered**:
- DynamoDB idempotency table — adds another service; PostgreSQL unique constraints achieve the same goal
- CloudWatch Events — legacy; EventBridge Scheduler is the successor
- Step Functions — overkill for a simple daily cron job
- Client-side generation — security risk; server must be source of truth
- pg_cron extension — RDS does not allow superuser access needed for this extension

**Key patterns**:
- EventBridge triggers Lambda daily at 02:00 UTC
- Lambda queries `recurring_rules` where `active = true AND next_occurrence_date <= today`
- For each due rule: INSERT transaction with unique constraint on `(recurring_rule_id, occurrence_date)` — ON CONFLICT DO NOTHING (idempotent)
- Update `next_occurrence_date` on the rule after successful generation
- Backfill: if Lambda was down, calculate all missed dates between last run and today
- Month-end handling: when `day_of_month > days_in_target_month`, use last day of month (e.g., 31st → Feb 28/29)
- Mark failed occurrences as "missed" with user notification

## 4. React SPA on S3 + API Gateway

**Decision**: Host the React build output on S3 using S3 static website hosting (no CloudFront). Use API Gateway HTTP API (v2) to proxy requests to the Express Lambda.

**Rationale**: S3 static website hosting serves the SPA directly at minimal cost, avoiding CloudFront charges. For a single-user personal finance app, CDN edge caching provides negligible benefit. HTTP API v2 is ~70% cheaper than REST API v1, has lower latency, and natively supports Lambda proxy integration.

**Alternatives considered**:
- S3 + CloudFront — standard approach but adds unnecessary cost for a single-user app with no global distribution needs
- AWS Amplify Hosting — simpler DX but adds cost; bundles CloudFront internally
- REST API (v1) instead of HTTP API (v2) — legacy, higher latency, higher cost
- Direct Lambda URLs — no caching; slower for repeat requests

**Key configuration**:
- S3: static website hosting enabled; bucket policy allows public read for website content; versioning enabled
- S3 website endpoint: `http://{bucket}.s3-website-{region}.amazonaws.com`
- S3 error document: set to `index.html` (SPA client-side routing — S3 serves index.html for all 404s)
- API Gateway CORS: allow origin = S3 website endpoint URL; methods GET/POST/PUT/DELETE/PATCH; headers Content-Type + Authorization
- React build: `REACT_APP_API_URL` set per environment via `.env.production` / `.env.staging`
- Cache-Control headers set via S3 object metadata: `index.html` → `no-cache`; hashed assets → `max-age=31536000, immutable`

## 5. Database Migration Strategy

**Decision**: Use `node-pg-migrate` for SQL-first migrations. Execute migrations via a separate Lambda function invoked during CI/CD deployment (before deploying the API Lambda).

**Rationale**: `node-pg-migrate` is lightweight, SQL-native, and does not impose an ORM. SQL migrations give full control and are easy to review/audit for a financial application. A separate migration Lambda decouples schema changes from application code and avoids race conditions.

**Alternatives considered**:
- Prisma Migrate — adds ORM dependency and increases cold start due to Prisma Client bundle size
- Knex migrations — good but adds an abstraction layer; SQL-first is preferable for auditable financial schemas
- Auto-apply at Lambda cold start — risky; every invocation would attempt migration; race conditions
- CloudFormation Custom Resources — tightly couples infra and schema; harder to test independently

**Key patterns**:
- Migrations stored as numbered SQL files in `backend/src/db/migrations/`
- Migration Lambda acquires PostgreSQL advisory lock (`SELECT pg_advisory_lock(1)`) before running
- CI/CD pipeline: Build → Invoke migration Lambda → Verify success → Deploy API Lambda
- Default categories seeded in initial migration via `INSERT ... ON CONFLICT DO NOTHING`
- Rollback: each migration has an `up` and `down` script

## Summary

| Area | Decision | Key Benefit |
|------|----------|-------------|
| Express on Lambda | `@codegenie/serverless-express`, 1GB memory | Warm instance reuse, familiar Express DX |
| DB Connections | RDS Proxy (transaction mode) + `pg` Pool (max 5) | Handles Lambda concurrency without connection exhaustion |
| Recurring Txns | EventBridge Scheduler + PostgreSQL idempotency | AWS-native cron, no extra services, duplicate-safe |
| Frontend Hosting | S3 static website hosting + HTTP API v2 | Lowest cost, simple, no CDN overhead |
| Migrations | `node-pg-migrate` + separate Lambda in CI/CD | SQL control, atomic, auditable |
