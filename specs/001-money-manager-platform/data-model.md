# Data Model: Money Manager Platform

**Date**: 2026-04-03 | **Branch**: `001-money-manager-platform`

## Entity Relationship Overview

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│   Category   │──1:N──│   Transaction    │──N:M──│     Tag      │
│              │       │                  │       │              │
│ parent_id ──┐│       │ category_id (FK) │       └──────────────┘
│             ││       │ recurring_rule_id│              ▲
│  (self-ref) ││       │    (FK, nullable)│              │
│             │▼       └──────────────────┘       ┌──────────────┐
│   Category   │                ▲                  │transaction_tag│
└──────────────┘                │                  │  (join table) │
                         ┌──────────────────┐      └──────────────┘
                         │ RecurringRule    │
                         │                  │
                         │ (generates txns) │
                         └──────────────────┘
```

## Entities

### Category

Represents a classification label for transactions. Supports one level of nesting (parent → child).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing identifier |
| name | VARCHAR(100) | NOT NULL | Display name |
| parent_id | INTEGER | FK → categories(id), NULLABLE | NULL for top-level; references parent for subcategories |
| is_default | BOOLEAN | NOT NULL, DEFAULT false | True for system-provided categories |
| is_hidden | BOOLEAN | NOT NULL, DEFAULT false | User can hide default categories |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last modification timestamp |

**Constraints**:
- UNIQUE(LOWER(name), COALESCE(parent_id, 0)) — case-insensitive uniqueness scoped to parent (FR-009)
- CHECK(parent_id IS NULL OR parent_id != id) — prevent self-referencing
- Only one level of nesting enforced: a category with a non-null parent_id cannot itself be a parent (application-level constraint, enforced via trigger or service layer)

**Validation rules** (from spec):
- Name must be unique case-insensitively (FR-009)
- Default categories cannot be deleted, only hidden (FR-012)
- Deleting a parent cascades to subcategories; transactions must be reassigned first (FR-011)

**Default seed data** (FR-008):
Groceries, Utilities, Shopping, Transport, Entertainment, Health, Salary, Freelance, Investments, Other

### Transaction

Represents a single financial record — either an expense or income entry.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing identifier |
| type | VARCHAR(7) | NOT NULL, CHECK(type IN ('expense', 'income')) | Transaction direction |
| title | VARCHAR(100) | NOT NULL | Short title (FR-002) |
| date | DATE | NOT NULL | Transaction date (allows future dates) |
| time | TIME | NULLABLE | Optional time component (FR-003) |
| amount | NUMERIC(12,2) | NOT NULL, CHECK(amount > 0) | Positive amount up to 999,999,999.99 (FR-004) |
| currency | VARCHAR(3) | NOT NULL | ISO 4217 currency code (e.g., USD, EUR) |
| short_description | VARCHAR(250) | NOT NULL | Brief description (FR-002) |
| detailed_description | TEXT | NULLABLE | Extended description (FR-003) |
| category_id | INTEGER | NOT NULL, FK → categories(id) | Associated category |
| recurring_rule_id | INTEGER | NULLABLE, FK → recurring_rules(id) | Link to generating rule (NULL for manual entries) |
| occurrence_date | DATE | NULLABLE | The specific occurrence date for recurring-generated transactions |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last modification timestamp |

**Constraints**:
- UNIQUE(recurring_rule_id, occurrence_date) WHERE recurring_rule_id IS NOT NULL — idempotency guard for recurring generation (Research §3)
- CHECK(amount > 0) — zero and negative amounts rejected (FR-004, edge cases)
- NUMERIC(12,2) supports values up to 9,999,999,999.99 (exceeds the 999,999,999.99 spec requirement)

**Validation rules** (from spec):
- Amount must be > 0, max 2 decimal places (FR-004)
- Title max 100 chars, short description max 250 chars (FR-002)
- Date format dd/mm/yyyy (display layer); stored as DATE
- Future dates allowed (edge case)
- Concurrent edits: last-write-wins via `updated_at` (FR-006)

**State transitions**: None — transactions are created, optionally edited, and deleted. No workflow states.

### Tag

A lightweight label for cross-cutting transaction grouping.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing identifier |
| name | VARCHAR(50) | NOT NULL, UNIQUE (case-insensitive) | Tag label |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Constraints**:
- UNIQUE(LOWER(name)) — prevent duplicate tags differing only in case

### TransactionTag (Join Table)

Many-to-many relationship between transactions and tags.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| transaction_id | INTEGER | NOT NULL, FK → transactions(id) ON DELETE CASCADE | |
| tag_id | INTEGER | NOT NULL, FK → tags(id) ON DELETE CASCADE | |

**Constraints**:
- PRIMARY KEY(transaction_id, tag_id)

### RecurringRule

Defines a schedule for automatic transaction generation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Auto-incrementing identifier |
| type | VARCHAR(7) | NOT NULL, CHECK(type IN ('expense', 'income')) | Transaction type for generated entries |
| title | VARCHAR(100) | NOT NULL | Template title |
| amount | NUMERIC(12,2) | NOT NULL, CHECK(amount > 0) | Template amount |
| currency | VARCHAR(3) | NOT NULL | Template currency |
| short_description | VARCHAR(250) | NOT NULL | Template short description |
| detailed_description | TEXT | NULLABLE | Template detailed description |
| category_id | INTEGER | NOT NULL, FK → categories(id) | Template category |
| interval_unit | VARCHAR(5) | NOT NULL, CHECK(interval_unit IN ('day', 'week', 'month', 'year')) | Recurrence unit (FR-014) |
| frequency | INTEGER | NOT NULL, CHECK(frequency > 0) | Interval multiplier, e.g., 2 for "every 2 weeks" (FR-014) |
| start_date | DATE | NOT NULL | When the rule starts |
| day_of_month | INTEGER | NULLABLE, CHECK(day_of_month BETWEEN 1 AND 31) | Anchor day for monthly/yearly rules (for month-end handling) |
| next_occurrence_date | DATE | NOT NULL | Next date an entry should be generated |
| last_generated_date | DATE | NULLABLE | Date of most recent generated transaction |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Active/deactivated status (FR-016) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Last modification timestamp |

**Constraints**:
- CHECK(frequency > 0) — must recur at least every 1 unit
- day_of_month used for month-end normalization (FR-017): if start_date is 31st and target month has fewer days, use last day of month

**State transitions**:
- Created → Active (default)
- Active → Deactivated (user deactivates; FR-016)
- Deactivated → Active (user reactivates)
- Active/Deactivated → Deleted (user deletes rule; past entries preserved; FR-016)

**Validation rules** (from spec):
- Edits to a recurring rule apply to future entries only; past generated entries remain unchanged (FR-016)
- When currency is changed, future entries use new currency; past entries retain original (edge case)

## Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| transactions | idx_transactions_date | date DESC | Transaction list sorting, date range queries |
| transactions | idx_transactions_category | category_id | Category breakdown in statistics |
| transactions | idx_transactions_type_date | type, date | Statistics: income vs expense by period |
| transactions | idx_transactions_recurring_occurrence | recurring_rule_id, occurrence_date (unique, partial WHERE recurring_rule_id IS NOT NULL) | Idempotent recurring generation |
| categories | idx_categories_parent | parent_id | Subcategory lookups |
| categories | idx_categories_name_lower | LOWER(name), COALESCE(parent_id, 0) (unique) | Case-insensitive uniqueness |
| recurring_rules | idx_recurring_active_next | is_active, next_occurrence_date | Scheduler query: find due rules |
| transaction_tags | idx_transaction_tags_tag | tag_id | Reverse lookup: find transactions by tag |

## Migration Plan

Migrations executed via `node-pg-migrate` in numbered SQL files:

1. **001_create_categories.sql** — Create `categories` table with constraints and indexes; seed default categories
2. **002_create_tags.sql** — Create `tags` table with case-insensitive unique index
3. **003_create_transactions.sql** — Create `transactions` table with FKs, constraints, indexes
4. **004_create_transaction_tags.sql** — Create `transaction_tags` join table
5. **005_create_recurring_rules.sql** — Create `recurring_rules` table with constraints and indexes; add FK from transactions
6. **006_add_updated_at_triggers.sql** — Create trigger function to auto-update `updated_at` on row modification; apply to all tables with `updated_at`
