# Feature Specification: Money Manager Platform

**Feature Branch**: `001-money-manager-platform`  
**Created**: 2026-03-27  
**Status**: Draft  
**Input**: User description: "Develop Money Manager, a personal expense & income manager platform with transaction logging, categories, recurring expenses, and statistics dashboard."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Log an Expense or Income Entry (Priority: P1)

A user opens Money Manager and records a financial transaction that just occurred. They select whether it is an expense or income, fill in the title, date, amount with currency, a short description, and pick a category. Optionally they add a time, detailed description, and tags. After saving, the entry appears in their transaction list.

**Why this priority**: This is the core action of the entire platform. Without the ability to log transactions, no other feature has value.

**Independent Test**: Can be fully tested by creating a new entry, saving it, and verifying it appears in the transaction list with correct details.

**Acceptance Scenarios**:

1. **Given** the user is on the "Add Transaction" screen, **When** they fill in title "Weekly groceries", date "27/03/2026", amount "45.99", currency "USD", category "Groceries", short description "Supermarket run", and select type "Expense", and save, **Then** the entry is persisted and appears in the transaction list with all entered details.
2. **Given** the user is adding a transaction, **When** they enter an amount with more than 2 decimal places (e.g., "45.999"), **Then** the system displays an inline validation error and prevents saving.
3. **Given** the user is adding a transaction, **When** they leave the mandatory fields (title, date, amount, currency, category, short description, type) empty and attempt to save, **Then** the system highlights each missing field with an inline error message.
4. **Given** the user is adding a transaction, **When** they optionally fill in time "14:30", a detailed description, and a tag "weekly", **Then** the entry is saved with all optional fields included.

---

### User Story 2 - Manage Categories and Subcategories (Priority: P2)

A user wants to organize their transactions under meaningful categories. The system provides a set of default categories (e.g., Groceries, Utilities, Shopping, Salary, Freelance). The user can also create custom categories, rename them, and nest subcategories under any category (e.g., "Utilities → Electricity", "Utilities → Water").

**Why this priority**: Categories are essential for meaningful organization and directly support the statistics dashboard. Without them, transaction logging (P1) would lack structure.

**Independent Test**: Can be tested by viewing default categories, creating a new custom category, adding a subcategory under it, and then verifying both appear in the category picker when logging a transaction.

**Acceptance Scenarios**:

1. **Given** a new user opens the platform for the first time, **When** they navigate to the category picker, **Then** they see a predefined set of default categories: Groceries, Utilities, Shopping, Transport, Entertainment, Health, Salary, Freelance, Investments, and Other.
2. **Given** the user is on the "Manage Categories" screen, **When** they create a new category called "Subscriptions", **Then** it appears in the category list and is available when logging transactions.
3. **Given** the user has a category "Utilities", **When** they add a subcategory "Electricity" under it, **Then** "Electricity" appears nested under "Utilities" in the category picker.
4. **Given** the user attempts to create a category with a name that already exists (case-insensitive), **Then** the system shows an error indicating the name is taken.
5. **Given** a category has transactions associated with it, **When** the user attempts to delete that category, **Then** the system warns that transactions exist and requires reassignment to another category before deletion.

---

### User Story 3 - Configure Recurring Transactions (Priority: P3)

A user has regular expenses (e.g., rent, streaming subscriptions) or income (e.g., salary) that repeat on a predictable schedule. They configure a recurring transaction by specifying the base transaction details and a recurrence rule (interval unit: day, week, month, or year; and frequency: e.g., every 1 month, every 2 weeks). The system automatically generates entries according to the schedule.

**Why this priority**: Automating repeat entries saves significant manual effort and reduces the chance of forgotten transactions. It builds on P1 (transaction logging) and P2 (categories).

**Independent Test**: Can be tested by creating a recurring expense set to repeat daily, advancing past the next occurrence, and verifying the system generated the expected entry automatically.

**Acceptance Scenarios**:

1. **Given** the user is on the "Add Recurring Transaction" screen, **When** they configure a monthly rent expense of 1200.00 USD starting 01/04/2026 with interval "every 1 month", **Then** the recurring rule is saved and visible in the recurring transactions list.
2. **Given** a recurring transaction is configured for "every 2 weeks" starting 27/03/2026, **When** the next occurrence date (10/04/2026) arrives, **Then** the system creates a new transaction entry with the same details and the correct date.
3. **Given** the user views the recurring transactions list, **When** they edit the amount of a recurring expense, **Then** future generated entries reflect the updated amount while previously generated entries remain unchanged.
4. **Given** the user no longer needs a recurring transaction, **When** they deactivate or delete the recurring rule, **Then** no further entries are generated, but previously created entries are preserved.
5. **Given** a recurring transaction with interval "every 1 month" starting on the 31st, **When** the next month has fewer than 31 days (e.g., February), **Then** the system generates the entry on the last day of that month.

---

### User Story 4 - View Financial Statistics Dashboard (Priority: P4)

A user wants to understand their spending and earning patterns. They navigate to the statistics dashboard where they can view a summary of total income, total expenses, and net balance over a selected time period (day, week, month, or year). The dashboard shows breakdowns by category so the user can identify where money is going.

**Why this priority**: Statistics provide the analytical value that transforms raw transaction data into actionable insights. It depends on P1 (transactions exist) and P2 (categories provide grouping).

**Independent Test**: Can be tested by logging several transactions across different categories and dates, then opening the statistics dashboard and verifying the totals and category breakdowns match the entered data.

**Acceptance Scenarios**:

1. **Given** the user has logged multiple income and expense entries for March 2026, **When** they open the statistics dashboard and select "Month" view for March 2026, **Then** they see total income, total expenses, and net balance for that month.
2. **Given** the user is viewing monthly statistics, **When** they look at the category breakdown, **Then** they see each category with its total spend/income and its percentage of the overall total.
3. **Given** the user selects "Week" as the time period, **When** they navigate between weeks, **Then** the dashboard updates to show statistics for the selected week.
4. **Given** the user selects "Year" view for 2026, **When** the dashboard loads, **Then** it displays a month-by-month trend of income vs. expenses across the entire year.
5. **Given** no transactions exist for the selected time period, **When** the dashboard loads, **Then** it displays a clear empty state message indicating no data is available for that period.

---

### User Story 5 - Edit and Delete Transactions (Priority: P5)

A user realizes they made a mistake in a previously logged transaction or wants to remove an entry entirely. They can select any transaction from the list, edit its fields, and save the changes. They can also delete a transaction with a confirmation step.

**Why this priority**: Correcting and removing entries is essential for data accuracy but is secondary to the ability to create entries in the first place.

**Independent Test**: Can be tested by creating a transaction, editing its amount and category, saving, and verifying the changes persist. Then deleting the entry and confirming it no longer appears.

**Acceptance Scenarios**:

1. **Given** the user views a transaction entry, **When** they tap/click edit, change the amount from 45.99 to 50.00, and save, **Then** the updated amount is reflected in the transaction list and any statistics.
2. **Given** the user selects a transaction and chooses delete, **When** the confirmation dialog appears and they confirm, **Then** the transaction is permanently removed and no longer appears in any list or statistics.
3. **Given** the user selects delete and the confirmation dialog appears, **When** they cancel, **Then** the transaction remains unchanged.

---

### Edge Cases

- What happens when a user enters an amount of 0.00? The system MUST reject zero-amount transactions with a validation error.
- What happens when a user enters a date in the future? The system MUST allow future-dated entries (e.g., expected upcoming expenses) without error.
- How does the system handle very large amounts (e.g., 999,999,999.99)? The system MUST support amounts up to at least 999,999,999.99 without overflow or display issues.
- What happens when the user changes the currency of a recurring transaction? Future entries use the new currency; past entries retain the original currency.
- How does the statistics dashboard handle transactions in multiple currencies? The dashboard MUST display amounts grouped by currency or show a note that multi-currency totals require a base currency selection.
- What happens when all transactions in a category are deleted? The category remains available for future use; it is not auto-deleted.

## Requirements *(mandatory)*

### Functional Requirements

**Transaction Management**

- **FR-001**: System MUST allow users to create transaction entries of type "Expense" or "Income".
- **FR-002**: Each transaction MUST have the following mandatory fields: title, date (dd/mm/yyyy format), short description, category, amount (up to 2 decimal places), and currency.
- **FR-003**: Each transaction MAY optionally include: time (hh:mm format), detailed description, and one or more tags.
- **FR-004**: System MUST validate that amount has no more than 2 decimal places and is greater than zero.
- **FR-005**: System MUST persist all transaction data so it survives session restarts.
- **FR-006**: Users MUST be able to edit any field of an existing transaction.
- **FR-007**: Users MUST be able to delete a transaction, with a confirmation step before permanent removal.

**Category Management**

- **FR-008**: System MUST provide a predefined set of default categories: Groceries, Utilities, Shopping, Transport, Entertainment, Health, Salary, Freelance, Investments, and Other.
- **FR-009**: Users MUST be able to create custom categories with unique names (case-insensitive uniqueness enforced).
- **FR-010**: Users MUST be able to create subcategories nested under any parent category (one level of nesting).
- **FR-011**: Users MUST be able to rename and delete custom categories. Deleting a category with associated transactions MUST require reassignment first.
- **FR-012**: Default categories MUST NOT be deletable but MAY be hidden by the user.

**Recurring Transactions**

- **FR-013**: Users MUST be able to configure a recurring transaction by specifying a base transaction and a recurrence rule.
- **FR-014**: A recurrence rule MUST define an interval unit (day, week, month, or year) and a frequency (e.g., every 1 month, every 2 weeks).
- **FR-015**: The system MUST automatically generate transaction entries according to the configured schedule.
- **FR-016**: Users MUST be able to edit, deactivate, or delete a recurring rule. Edits apply to future entries only; past generated entries remain unchanged.
- **FR-017**: For monthly recurrences on dates that do not exist in shorter months (e.g., 31st in February), the system MUST use the last day of that month.

**Statistics Dashboard**

- **FR-018**: System MUST provide a statistics view showing total income, total expenses, and net balance.
- **FR-019**: Users MUST be able to select a time granularity: day, week, month, or year.
- **FR-020**: The dashboard MUST display a category-level breakdown showing each category's total and percentage of the overall total.
- **FR-021**: The year view MUST show a month-by-month trend of income vs. expenses.
- **FR-022**: When no transactions exist for the selected period, the dashboard MUST display a meaningful empty state.
- **FR-023**: When transactions span multiple currencies, the dashboard MUST either group totals by currency or prompt the user to select a base currency for aggregation.

**Validation & Feedback**

- **FR-024**: All forms MUST validate inline on blur and again on submit, displaying clear error messages per the project's standard feedback patterns.
- **FR-025**: Destructive actions (delete transaction, delete category) MUST require confirmation via a modal dialog.

### Key Entities

- **Transaction**: A single financial record. Attributes: title, type (expense/income), date, time (optional), short description, detailed description (optional), amount, currency, category, tags (optional), created timestamp, last modified timestamp.
- **Category**: A classification label for transactions. Attributes: name, parent category (null for top-level), is-default flag, is-hidden flag.
- **Recurring Rule**: A schedule definition that drives automatic transaction generation. Attributes: base transaction template, interval unit (day/week/month/year), frequency, start date, next occurrence date, active status.
- **Tag**: A lightweight label for cross-cutting transaction grouping. Attributes: name.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can log a new expense or income entry in under 30 seconds when all fields are known.
- **SC-002**: 95% of users successfully create their first transaction on the first attempt without encountering a validation error they do not understand.
- **SC-003**: Recurring transactions generate entries within the expected day, with zero missed or duplicate entries over a 12-month period.
- **SC-004**: The statistics dashboard loads and displays results within 2 seconds for up to 10,000 transactions.
- **SC-005**: Category and subcategory management operations (create, rename, delete with reassignment) complete in under 3 user actions each.
- **SC-006**: All user-facing screens are fully usable on mobile (≥320px), tablet (≥768px), and desktop (≥1024px) viewports.
- **SC-007**: All interactive elements pass WCAG 2.1 AA contrast and keyboard-navigation requirements.

## Assumptions

- Users have a stable internet connection; offline support is out of scope for v1.
- The platform targets a single user per account; multi-user or shared household features are out of scope.
- Currency exchange rates and automatic currency conversion are out of scope; multi-currency transactions are displayed side by side, not converted.
- Authentication will use standard email/password with session management; social login is out of scope for v1.
- The predefined default categories cover the most common personal finance use cases; additional defaults may be added in future iterations.
- Tags are free-form text labels; a managed tag taxonomy is out of scope for v1.
- Subcategory nesting is limited to one level (parent → child) to keep the UI simple.
- Recurring transaction generation runs server-side on a schedule; real-time to-the-second precision is not required.
