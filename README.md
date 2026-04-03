# Money Manager

A personal expense and income management platform. Money Manager helps users track their daily financial transactions, organize spending by category, automate recurring entries, and visualize money flow through a statistics dashboard.

## What's in this repository

This project is based on specification-driven development and makes use of the [Github spec-kit tool](https://github.com/github/spec-kit) integrated with Claude AI.

Currently the project is in the **implementation planning phase**. No application code has been written yet. The specification, technical design, and task breakdown are complete. The repository contains:

- **Project constitution** — Core principles governing code quality, testing, UI/UX consistency, and accessibility standards for all future development.
- **Feature specification** — A detailed spec for the Money Manager platform covering:
  - Transaction logging (expenses and income with categories, tags, and currency support)
  - Category and subcategory management (defaults + user-created)
  - Recurring transaction automation (daily, weekly, monthly, yearly schedules)
  - Financial statistics dashboard (income/expense breakdowns by time period and category)
  - Transaction editing and deletion
- **Implementation plan** — Technical context, architecture decisions, and project structure for a React + Express + PostgreSQL stack deployed on AWS.
- **Research** — Technology decisions for Express on Lambda, RDS connection management, recurring scheduling, S3 static hosting, and database migrations.
- **Data model** — 5 entities (Transaction, Category, Tag, TransactionTag, RecurringRule) with full schema, constraints, indexes, and a 6-migration plan.
- **API contracts** — 15 REST API endpoints across 5 resource groups (Transactions, Categories, Recurring Rules, Statistics, Tags) with request/response schemas.
- **Task list** — 90 implementation tasks organized by user story (5 stories), ready for execution.
- **Quality checklist** — Validation that the specification meets completeness and readiness criteria.

## Architecture

| Component | Technology | Deployment |
|-----------|-----------|------------|
| Frontend | React 18 + TypeScript | S3 static website hosting |
| Backend | Express 4 + TypeScript | AWS Lambda via API Gateway (HTTP API v2) |
| Database | PostgreSQL 16 | AWS RDS with RDS Proxy |
| Recurring Jobs | EventBridge Scheduler | Daily cron → Lambda |
| Migrations | node-pg-migrate | Separate Lambda in CI/CD pipeline |

## Project structure

```
.github/agents/    # AI agent context (Copilot instructions)
.specify/          # Speckit configuration, templates, and project constitution
specs/             # Feature specifications and design artifacts
  001-money-manager-platform/
    spec.md        # Feature specification
    plan.md        # Implementation plan
    research.md    # Technology research and decisions
    data-model.md  # Database schema and entity definitions
    quickstart.md  # Local development setup guide
    tasks.md       # Implementation task list (90 tasks)
    contracts/
      rest-api.md  # REST API endpoint contracts
    checklists/
      requirements.md  # Quality validation checklist
```

## Next steps

Implementation begins with Phase 1 (Setup) and Phase 2 (Foundational) from `tasks.md`. The MVP target is User Story 1 — logging transactions (38 tasks).
