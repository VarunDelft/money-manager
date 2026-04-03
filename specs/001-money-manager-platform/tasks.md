# Tasks: Money Manager Platform

**Input**: Design documents from `/specs/001-money-manager-platform/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/rest-api.md
**Tests**: Included — project constitution mandates TDD (Principle II, NON-NEGOTIABLE). Tests written before implementation in each story phase.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Exact file paths included in descriptions

---

## Phase 1: Setup

**Purpose**: Initialize both projects with TypeScript strict mode, linting, and testing frameworks

- [x] T001 [P] Initialize backend Node.js project with TypeScript 5.x strict mode, ESLint + typescript-eslint, Jest, Supertest in backend/package.json and backend/tsconfig.json
- [x] T002 [P] Initialize frontend React 18 project with TypeScript 5.x strict mode, ESLint, Jest, React Testing Library in frontend/package.json and frontend/tsconfig.json
- [x] T003 [P] Create AWS SAM template skeleton with Lambda, HTTP API v2, S3, RDS, RDS Proxy resource stubs in infra/template.yaml

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, Express app, shared middleware, frontend application shell — MUST complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Connection

- [x] T004 Configure PostgreSQL connection pool with RDS Proxy support, environment-based config, and retry logic in backend/src/db/pool.ts
- [x] T005 Set up node-pg-migrate configuration with migration scripts directory in backend/package.json
- [x] T006 [P] Create categories table migration with constraints, indexes, and default category seed data (Groceries, Utilities, Shopping, Transport, Entertainment, Health, Salary, Freelance, Investments, Other) in backend/src/db/migrations/001_create_categories.sql
- [x] T007 [P] Create tags table migration with case-insensitive unique index in backend/src/db/migrations/002_create_tags.sql
- [x] T008 [P] Create transactions table migration with all column constraints, FKs to categories, and indexes (recurring_rule_id column added without FK constraint) in backend/src/db/migrations/003_create_transactions.sql
- [x] T009 [P] Create transaction_tags join table migration with composite primary key in backend/src/db/migrations/004_create_transaction_tags.sql
- [x] T010 [P] Create recurring_rules table migration with constraints, indexes, and ALTER TABLE to add FK from transactions.recurring_rule_id in backend/src/db/migrations/005_create_recurring_rules.sql
- [x] T011 Create updated_at auto-trigger function migration applied to categories, transactions, tags, and recurring_rules in backend/src/db/migrations/006_add_updated_at_triggers.sql

### Backend Application Shell

- [x] T012 Define TypeScript interfaces for all entities (Transaction, Category, Tag, RecurringRule) and shared API response/error types in backend/src/models/
- [x] T013 Create Express app factory with JSON body parsing, CORS configured for S3 website origin, and route mounting in backend/src/api/index.ts
- [x] T014 [P] Create request validation middleware with field-level inline error responses matching contracts error format in backend/src/api/middleware/validation.ts
- [x] T015 [P] Create standardized error handling middleware mapping errors to contract error codes (VALIDATION_ERROR, NOT_FOUND, CONFLICT, INTERNAL_ERROR) in backend/src/api/middleware/errorHandler.ts
- [x] T016 [P] Create Lambda handler entry point wrapping Express app with @codegenie/serverless-express in backend/src/lambda.ts
- [x] T017 Implement read-only CategoryService.getAll returning nested tree structure with subcategories in backend/src/services/categoryService.ts
- [x] T018 Implement GET /categories route with includeHidden query parameter for category picker in backend/src/api/routes/categories.ts

### Frontend Application Shell

- [x] T019 [P] Build shared UI component library (Button, Input, Select, TextArea, Modal, Toast, FormField, LoadingSpinner) following design system consistency rules in frontend/src/components/ui/
- [x] T020 [P] Set up React Router with route definitions and page stub components for all 5 screens in frontend/src/App.tsx
- [x] T021 [P] Create typed API client base with fetch wrapper, error parsing, and REACT_APP_API_URL config in frontend/src/services/api.ts
- [x] T022 [P] Define frontend TypeScript types mirroring all API response contracts in frontend/src/types/
- [x] T023 [P] Create useFormValidation hook for inline validation on blur + submit per FR-024 in frontend/src/hooks/useFormValidation.ts

**Checkpoint**: Foundation ready — database migrated with seeded categories, Express app running with middleware, frontend shell rendering with routing. User story implementation can begin.

---

## Phase 3: User Story 1 — Log an Expense or Income Entry (Priority: P1) 🎯 MVP

**Goal**: Users can create a new transaction (expense or income) with mandatory and optional fields, and see it in the transaction list.

**Independent Test**: Create an entry with all mandatory fields → save → verify it appears in the transaction list with correct details. Create another with optional fields (time, detailed description, tags) → verify all fields saved.

### Tests for US1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation (Red-Green-Refactor)**

- [x] T024 [P] [US1] Write unit tests for TransactionService.create covering amount validation, mandatory field checks, tag upsert, and persistence in backend/tests/unit/services/transactionService.test.ts
- [x] T025 [P] [US1] Write unit tests for TransactionService.getAll covering cursor pagination, filtering by type/category/date range/search in backend/tests/unit/services/transactionService.test.ts
- [x] T026 [P] [US1] Write integration tests for POST /transactions (success, validation errors, invalid category) and GET /transactions (list, filters, pagination) in backend/tests/integration/transactions.test.ts
- [x] T027 [P] [US1] Write unit tests for TransactionForm component covering inline validation on blur, submit with empty fields, optional field toggling in frontend/tests/unit/components/TransactionForm.test.tsx
- [x] T028 [P] [US1] Write unit tests for TransactionList component covering rendering items, empty state, pagination controls in frontend/tests/unit/components/TransactionList.test.tsx

### Implementation for US1

- [x] T029 [US1] Implement TransactionService.create with amount/decimal validation, mandatory field checks, and tag find-or-create logic in backend/src/services/transactionService.ts
- [x] T030 [US1] Implement TransactionService.getAll with cursor-based pagination, filtering by type/categoryId/dateFrom/dateTo/search in backend/src/services/transactionService.ts
- [x] T031 [US1] Implement TransactionService.getById returning full transaction with joined category name and tags in backend/src/services/transactionService.ts
- [x] T032 [US1] Implement POST /transactions route with request validation wiring to TransactionService.create in backend/src/api/routes/transactions.ts
- [x] T033 [US1] Implement GET /transactions and GET /transactions/:id routes with query parameter parsing in backend/src/api/routes/transactions.ts
- [x] T034 [US1] Implement GET /tags route for tag autocomplete support in backend/src/api/routes/tags.ts
- [x] T035 [P] [US1] Build TransactionForm component with type selector, mandatory fields (title, date, amount, currency, category picker, short description), optional fields (time, detailed description, tags), and inline validation in frontend/src/components/transactions/TransactionForm.tsx
- [x] T036 [P] [US1] Build TransactionList component with date-sorted entries, amount/currency display, category badges, and pagination controls in frontend/src/components/transactions/TransactionList.tsx
- [x] T037 [US1] Build AddTransactionPage wiring TransactionForm to POST /transactions API with success toast and redirect to list in frontend/src/pages/AddTransactionPage.tsx
- [x] T038 [US1] Build TransactionListPage wiring TransactionList component to GET /transactions API with filter controls in frontend/src/pages/TransactionListPage.tsx

**Checkpoint**: US1 MVP complete — users can log expenses and incomes and view them in a paginated list with filters.

---

## Phase 4: User Story 2 — Edit and Delete Transactions (Priority: P2)

**Goal**: Users can edit any field of an existing transaction and delete transactions with a confirmation dialog.

**Independent Test**: Create a transaction → edit its amount and category → save → verify changes persist. Then delete → confirm in modal → verify removed from list.

### Tests for US2

- [x] T039 [P] [US2] Write unit tests for TransactionService.update (partial field update, last-write-wins, validation) and TransactionService.delete (permanent removal) in backend/tests/unit/services/transactionService.test.ts
- [x] T040 [P] [US2] Write integration tests for PUT /transactions/:id (success, validation, not found) and DELETE /transactions/:id (success, not found) in backend/tests/integration/transactions.test.ts
- [x] T041 [P] [US2] Write unit tests for EditTransactionPage (loads existing data, submits changes, handles errors) and delete confirmation flow in frontend/tests/unit/pages/EditTransactionPage.test.tsx

### Implementation for US2

- [x] T042 [US2] Implement TransactionService.update with partial field updates, last-write-wins semantics, and validation in backend/src/services/transactionService.ts
- [x] T043 [US2] Implement TransactionService.delete with permanent removal in backend/src/services/transactionService.ts
- [x] T044 [US2] Implement PUT /transactions/:id and DELETE /transactions/:id routes with request validation in backend/src/api/routes/transactions.ts
- [x] T045 [US2] Build EditTransactionPage reusing TransactionForm pre-populated via GET /transactions/:id with save wired to PUT in frontend/src/pages/EditTransactionPage.tsx
- [x] T046 [US2] Add edit navigation link and delete button with confirmation Modal to TransactionList items in frontend/src/components/transactions/TransactionList.tsx
- [x] T047 [US2] Wire edit link and delete action in TransactionListPage to navigate to EditTransactionPage and call DELETE API respectively in frontend/src/pages/TransactionListPage.tsx

**Checkpoint**: US1 + US2 complete — full transaction CRUD operational with confirmation dialogs.

---

## Phase 5: User Story 3 — Manage Categories and Subcategories (Priority: P3)

**Goal**: Users can view default categories, create custom categories and subcategories, rename them, delete with transaction reassignment, and hide default categories.

**Independent Test**: View defaults → create "Subscriptions" category → add "Netflix" subcategory → verify both appear in category picker when logging a transaction.

### Tests for US3

- [x] T048 [P] [US3] Write unit tests for CategoryService CRUD (create with case-insensitive uniqueness, rename with conflict detection, delete with reassignment + subcategory cascade, toggle visibility) in backend/tests/unit/services/categoryService.test.ts
- [x] T049 [P] [US3] Write integration tests for POST /categories, PUT /categories/:id, PATCH /categories/:id/visibility, DELETE /categories/:id (with and without reassignment) in backend/tests/integration/categories.test.ts
- [x] T050 [P] [US3] Write unit tests for ManageCategoriesPage (render tree, create form, rename inline, delete with reassignment dialog, subcategory nesting) in frontend/tests/unit/pages/ManageCategoriesPage.test.tsx

### Implementation for US3

- [x] T051 [US3] Implement CategoryService.create with case-insensitive uniqueness validation and one-level nesting enforcement in backend/src/services/categoryService.ts
- [x] T052 [US3] Implement CategoryService.rename with case-insensitive conflict detection in backend/src/services/categoryService.ts
- [x] T053 [US3] Implement CategoryService.delete with transaction count check, reassignment of transactions from parent and subcategories, and cascading subcategory deletion in backend/src/services/categoryService.ts
- [x] T054 [US3] Implement CategoryService.toggleVisibility for hiding/showing default categories (reject non-default) in backend/src/services/categoryService.ts
- [x] T055 [US3] Implement POST /categories, PUT /categories/:id, PATCH /categories/:id/visibility, DELETE /categories/:id routes in backend/src/api/routes/categories.ts
- [x] T056 [P] [US3] Build CategoryForm component for create/rename with inline name validation and parent selector in frontend/src/components/categories/CategoryForm.tsx
- [x] T057 [P] [US3] Build CategoryTree component displaying nested categories with edit/delete/hide action buttons in frontend/src/components/categories/CategoryTree.tsx
- [x] T058 [US3] Build ReassignCategoryModal component for selecting target category when deleting a category with transactions in frontend/src/components/categories/ReassignCategoryModal.tsx
- [x] T059 [US3] Build ManageCategoriesPage assembling CategoryTree, CategoryForm, and ReassignCategoryModal wired to API in frontend/src/pages/ManageCategoriesPage.tsx

**Checkpoint**: US1–US3 complete — full transaction and category management operational.

---

## Phase 6: User Story 4 — View Financial Statistics Dashboard (Priority: P4)

**Goal**: Users see total income, total expenses, and net balance for a selected period (day/week/month/year) with category breakdowns and a yearly income-vs-expense trend.

**Independent Test**: Log several transactions across categories and dates → open dashboard → select "Month" → verify totals and category percentages match entered data. Select "Year" → verify month-by-month trend.

### Tests for US4

- [ ] T060 [P] [US4] Write unit tests for StatisticsService (period date range calculation for day/week/month/year, aggregation queries, multi-currency grouping, empty state handling) in backend/tests/unit/services/statisticsService.test.ts
- [ ] T061 [P] [US4] Write integration tests for GET /statistics (all granularities, currency filter, empty state) and GET /statistics/trend (yearly, currency filter) in backend/tests/integration/statistics.test.ts
- [ ] T062 [P] [US4] Write unit tests for StatisticsDashboard components (SummaryCards totals, CategoryBreakdown percentages, YearlyTrend chart data, PeriodSelector navigation, empty state message) in frontend/tests/unit/components/StatisticsDashboard.test.tsx

### Implementation for US4

- [ ] T063 [US4] Implement StatisticsService.getSummary with period-based date range calculation and income/expense/balance aggregation with multi-currency grouping in backend/src/services/statisticsService.ts
- [ ] T064 [US4] Implement StatisticsService.getCategoryBreakdown with per-category totals and percentage of overall in backend/src/services/statisticsService.ts
- [ ] T065 [US4] Implement StatisticsService.getYearlyTrend with month-by-month income vs expenses query in backend/src/services/statisticsService.ts
- [ ] T066 [US4] Implement GET /statistics and GET /statistics/trend routes with query parameter validation in backend/src/api/routes/statistics.ts
- [ ] T067 [P] [US4] Build SummaryCards component displaying total income, total expenses, and net balance with currency label in frontend/src/components/statistics/SummaryCards.tsx
- [ ] T068 [P] [US4] Build CategoryBreakdown component showing each category's total and percentage of overall in frontend/src/components/statistics/CategoryBreakdown.tsx
- [ ] T069 [P] [US4] Build YearlyTrend component rendering month-by-month income vs expenses chart in frontend/src/components/statistics/YearlyTrend.tsx
- [ ] T070 [P] [US4] Build PeriodSelector component for day/week/month/year granularity toggle with forward/back navigation in frontend/src/components/statistics/PeriodSelector.tsx
- [ ] T071 [US4] Build StatisticsDashboardPage assembling SummaryCards, CategoryBreakdown, YearlyTrend, PeriodSelector with empty state message wired to API in frontend/src/pages/StatisticsDashboardPage.tsx

**Checkpoint**: US1–US4 complete — core app fully functional with analytics dashboard.

---

## Phase 7: User Story 5 — Configure Recurring Transactions (Priority: P5)

**Goal**: Users create recurring transaction rules with schedule configuration. System auto-generates entries on schedule, handles month-end dates, backfills missed occurrences, and supports deactivation/deletion.

**Independent Test**: Create a daily recurring expense → advance past next occurrence → verify system generated the expected entry with correct date.

### Tests for US5

- [ ] T072 [P] [US5] Write unit tests for RecurringRuleService CRUD (create with dayOfMonth derivation, update future-only semantics, toggle active, delete preserving entries) in backend/tests/unit/services/recurringRuleService.test.ts
- [ ] T073 [P] [US5] Write unit tests for recurring generation job (next date calculation, month-end normalization for 31st→Feb 28, idempotent insert via unique constraint, missed occurrence backfill, failed marking) in backend/tests/unit/jobs/recurringGenerator.test.ts
- [ ] T074 [P] [US5] Write integration tests for GET/POST/PUT /recurring-rules, PATCH /recurring-rules/:id/status, DELETE /recurring-rules/:id in backend/tests/integration/recurringRules.test.ts
- [ ] T075 [P] [US5] Write unit tests for RecurringRulesPage (list active/inactive rules, create form, edit, deactivate, delete) and RecurringRuleForm (schedule configuration validation) in frontend/tests/unit/pages/RecurringRulesPage.test.tsx

### Implementation for US5

- [ ] T076 [US5] Implement RecurringRuleService.create with dayOfMonth derivation from startDate and nextOccurrenceDate initialization in backend/src/services/recurringRuleService.ts
- [ ] T077 [US5] Implement RecurringRuleService.update (future-only), toggleActive, and delete (preserving generated entries) in backend/src/services/recurringRuleService.ts
- [ ] T078 [US5] Implement GET /recurring-rules, POST /recurring-rules, PUT /recurring-rules/:id, PATCH /recurring-rules/:id/status, DELETE /recurring-rules/:id routes in backend/src/api/routes/recurringRules.ts
- [ ] T079 [US5] Implement recurring transaction generator with next-date calculation, month-end normalization, idempotent INSERT ON CONFLICT DO NOTHING, backfill for missed dates, and nextOccurrenceDate update in backend/src/jobs/recurringGenerator.ts
- [ ] T080 [US5] Create EventBridge-triggered Lambda handler invoking recurring generator and logging results in backend/src/jobs/recurringHandler.ts
- [ ] T081 [P] [US5] Build RecurringRuleForm component with transaction fields plus schedule configuration (interval unit selector, frequency input, start date picker) in frontend/src/components/recurring/RecurringRuleForm.tsx
- [ ] T082 [P] [US5] Build RecurringRuleList component showing rules with active/inactive status, next occurrence date, and action buttons in frontend/src/components/recurring/RecurringRuleList.tsx
- [ ] T083 [US5] Build RecurringRulesPage assembling RecurringRuleForm and RecurringRuleList with create/edit/deactivate/delete wired to API in frontend/src/pages/RecurringRulesPage.tsx
- [ ] T084 [US5] Add EventBridge Scheduler resource (daily 02:00 UTC cron) and recurring generator Lambda to SAM template in infra/template.yaml

**Checkpoint**: US1–US5 complete — all user stories implemented and independently testable.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Responsiveness, accessibility, observability, infrastructure finalization

- [ ] T085 [P] Add responsive layout breakpoints (320px, 768px, 1024px) across all page components and verify mobile/tablet/desktop rendering in frontend/src/
- [ ] T086 [P] Verify WCAG 2.1 AA compliance: keyboard navigation, ARIA roles/labels, color contrast (4.5:1 normal, 3:1 large) across all interactive elements in frontend/src/
- [ ] T087 [P] Add structured error logging with context (action, timestamp, error details) to all backend service catch blocks in backend/src/api/middleware/errorHandler.ts
- [ ] T088 Finalize SAM template with complete resource definitions (S3 bucket with website hosting, HTTP API v2 with CORS, API Lambda, migration Lambda, RDS instance, RDS Proxy, security groups) in infra/template.yaml
- [ ] T089 Run quickstart.md end-to-end validation: clone → install → Docker PostgreSQL → migrate → start servers → create transaction → verify list → edit → delete → check stats
- [ ] T090 Performance validation: verify API responses < 200ms at p95 with 10,000 transactions and statistics dashboard loads < 2 seconds

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — **BLOCKS all user stories**
- **User Stories (Phases 3–7)**: All depend on Foundational phase completion
  - Stories can proceed in priority order (P1 → P2 → P3 → P4 → P5)
  - Or in parallel if team capacity allows (all depend on Phase 2, not on each other, except US2 integrates with US1 components)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **US2 (P2)**: Can start after Phase 2 — reuses TransactionForm from US1 and extends TransactionList; benefits from US1 completion but is independently testable
- **US3 (P3)**: Can start after Phase 2 — extends CategoryService from foundational; fully independent from US1/US2
- **US4 (P4)**: Can start after Phase 2 — reads from transactions table; benefits from US1 data but is independently testable with test fixtures
- **US5 (P5)**: Can start after Phase 2 — new RecurringRule service and scheduler; fully independent from other stories

### Within Each User Story

1. Tests MUST be written and FAIL before implementation begins (Constitution Principle II)
2. Backend models/services before routes
3. Routes before frontend components
4. Frontend components before pages
5. Mark story checkpoint as complete before moving to next priority

### Parallel Opportunities

- All Phase 1 tasks (T001–T003) can run in parallel
- Migration file authoring (T006–T010) can run in parallel
- Middleware tasks (T014–T016) can run in parallel
- All frontend shell tasks (T019–T023) can run in parallel
- All test tasks within a story marked [P] can run in parallel
- Frontend component tasks within a story marked [P] can run in parallel
- US3, US4, US5 have no cross-dependencies and can run in parallel after Phase 2

---

## Parallel Example: User Story 1

```text
# Step 1: Launch all US1 tests in parallel (they should all FAIL):
T024: Unit tests for TransactionService.create
T025: Unit tests for TransactionService.getAll
T026: Integration tests for POST/GET /transactions
T027: Unit tests for TransactionForm component
T028: Unit tests for TransactionList component

# Step 2: Implement backend (sequential within, service → routes):
T029 → T030 → T031 → T032 → T033 → T034

# Step 3: Launch frontend components in parallel:
T035: TransactionForm component
T036: TransactionList component

# Step 4: Wire pages (sequential):
T037 → T038
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (**CRITICAL — blocks all stories**)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test US1 independently — log a transaction and verify it in the list
5. Deploy/demo if ready — this is the MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Test → Deploy (**MVP!**)
3. US2 → Test → Deploy (full CRUD)
4. US3 → Test → Deploy (custom categories)
5. US4 → Test → Deploy (analytics value)
6. US5 → Test → Deploy (automation)
7. Each story adds value without breaking previous stories

### Suggested MVP Scope

**User Story 1 only**: Phases 1 + 2 + 3 = 38 tasks. Delivers the core value proposition — users can log and view financial transactions.
