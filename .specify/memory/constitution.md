<!--
  Sync Impact Report
  ===================
  Version change: N/A → 1.0.0 (initial ratification)
  Modified principles: None (initial creation)
  Added sections:
    - Core Principles (5 principles: Type Safety, Test-Driven Development,
      Consistent UI/UX Patterns, Clean Code & Readability,
      Accessible & Responsive Design)
    - Quality Standards
    - Development Workflow
    - Governance
  Removed sections: None
  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ no changes needed
    - .specify/templates/spec-template.md ✅ no changes needed
    - .specify/templates/tasks-template.md ✅ no changes needed
  Follow-up TODOs: None
-->

# Expense Manager Constitution

## Core Principles

### I. Type Safety & Static Analysis

- All code MUST use strict type checking; dynamic `any` types are
  prohibited unless wrapped in a validated type guard.
- Linting and static analysis MUST run on every commit via pre-commit
  hooks or CI. Builds with lint errors MUST NOT be merged.
- Compiler/interpreter warnings MUST be treated as errors in CI.
  Zero-warning policy is enforced on the main branch.

**Rationale**: Catching defects at compile time is cheaper than catching
them at runtime. Strict typing eliminates entire categories of bugs
(null references, shape mismatches, implicit coercions) and serves as
living documentation of data contracts.

### II. Test-Driven Development (NON-NEGOTIABLE)

- Every new feature or bug fix MUST begin with a failing test that
  captures the expected behavior before any implementation code is
  written.
- The Red-Green-Refactor cycle MUST be followed: write a failing test,
  write the minimum code to pass, then refactor with tests green.
- Unit test coverage for business logic MUST remain above 80%.
  Critical financial calculations (totals, splits, currency
  conversions) MUST have 100% branch coverage.
- Integration tests MUST cover: API contract changes, database
  migration paths, and cross-module data flows.

**Rationale**: TDD produces smaller, more focused functions and acts
as a safety net for refactoring. In a financial application, incorrect
calculations directly harm users; exhaustive test coverage is the
primary defense.

### III. Consistent UI/UX Patterns

- Every user-facing feature MUST reuse the project's shared component
  library. New one-off components are prohibited when an existing
  pattern covers the use case.
- Navigation, layout spacing, color tokens, and typography MUST
  follow the design system. Deviations require explicit justification
  documented in the PR description.
- User feedback (loading states, success confirmations, error
  messages) MUST follow a single, project-wide pattern: inline
  feedback for field-level issues, toast notifications for
  transient outcomes, and modal dialogs for destructive actions.
- All forms MUST validate inline on blur and again on submit,
  displaying the same error format and language.

**Rationale**: Inconsistent UI erodes user trust and increases
cognitive load. A shared component library enforces visual and
behavioral uniformity while reducing duplicated code.

### IV. Clean Code & Readability

- Functions MUST do one thing. A function exceeding 40 lines or
  accepting more than 4 parameters MUST be refactored.
- Naming MUST be descriptive and domain-aligned. Abbreviations
  are prohibited unless they are ubiquitous in the domain (e.g.,
  `tx` for transaction, `amt` for amount).
- Dead code, commented-out code, and TODO comments without a
  linked issue number MUST NOT exist on the main branch.
- Code duplication across modules MUST be extracted into a shared
  utility only when the duplicated logic appears in three or more
  locations (Rule of Three).

**Rationale**: Code is read far more often than it is written.
Readable, small functions lower onboarding time, reduce review
effort, and make bugs easier to locate.

### V. Accessible & Responsive Design

- All interactive elements MUST be keyboard-navigable and expose
  correct ARIA roles/labels.
- Color contrast MUST meet WCAG 2.1 AA (minimum 4.5:1 for normal
  text, 3:1 for large text).
- Layouts MUST be responsive across mobile (≥320px), tablet
  (≥768px), and desktop (≥1024px) breakpoints.
- Every user-facing change MUST be manually verified against at
  least one screen reader (e.g., VoiceOver, NVDA) before merge.

**Rationale**: An expense manager is used across devices and by
users with varying abilities. Accessibility is a legal and ethical
requirement, not an optional enhancement.

## Quality Standards

- **Code Review**: Every PR MUST be reviewed by at least one other
  contributor before merge. Reviewers MUST verify adherence to
  all five core principles.
- **Performance Budget**: Pages MUST achieve a Lighthouse
  performance score ≥ 90. API responses MUST complete within
  200ms at the 95th percentile under normal load.
- **Security**: All user inputs MUST be validated and sanitized
  at system boundaries. Dependencies MUST be audited for known
  vulnerabilities before adoption and on a recurring schedule.
- **Error Handling**: Errors MUST be caught at module boundaries,
  logged with structured context (user ID, action, timestamp),
  and presented to users with actionable, non-technical messages.

## Development Workflow

- **Branching**: Feature branches MUST follow the naming convention
  `###-feature-name` (sequential numbering). Branches MUST be
  short-lived (merged or rebased within 5 working days).
- **Commit Messages**: MUST follow Conventional Commits format
  (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
- **CI Pipeline**: Lint → Type Check → Unit Tests → Integration
  Tests → Build. All stages MUST pass before a PR can be merged.
- **Definition of Done**: A feature is done when tests pass,
  documentation is updated, accessibility is verified, and the
  PR has been approved.

## Governance

- This constitution supersedes ad-hoc practices. When a conflict
  arises between convenience and a principle, the principle wins.
- Amendments require: (1) a written proposal describing the change
  and rationale, (2) review and approval, and (3) a migration
  plan for any existing code that becomes non-compliant.
- Constitution version follows Semantic Versioning: MAJOR for
  principle removals or incompatible redefinitions, MINOR for new
  principles or material expansions, PATCH for clarifications.
- Compliance MUST be checked at PR review time. Reviewers MUST
  reference the relevant principle number when requesting changes.

**Version**: 1.0.0 | **Ratified**: 2026-03-27 | **Last Amended**: 2026-03-27
