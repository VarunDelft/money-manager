# Money Manager

A personal expense and income management platform. Money Manager helps users track their daily financial transactions, organize spending by category, automate recurring entries, and visualize money flow through a statistics dashboard.

## What's in this repository

This project is based on specification-driven development and makes use of the [Github spec-kit tool](https://github.com/github/spec-kit) integrated with Claude AI.

Currently the project is in the **specification phase**. No application code has been written yet. The repository currently contains:

- **Project constitution** — Core principles governing code quality, testing, UI/UX consistency, and accessibility standards for all future development.
- **Feature specification** — A detailed spec for the Money Manager platform covering:
  - Transaction logging (expenses and income with categories, tags, and currency support)
  - Category and subcategory management (defaults + user-created)
  - Recurring transaction automation (daily, weekly, monthly, yearly schedules)
  - Financial statistics dashboard (income/expense breakdowns by time period and category)
  - Transaction editing and deletion
- **Quality checklist** — Validation that the specification meets completeness and readiness criteria.

## Project structure

```
.specify/          # Speckit configuration, templates, and project constitution
specs/             # Feature specifications and design artifacts
  001-money-manager-platform/
    spec.md        # Feature specification (current)
    checklists/    # Quality validation checklists
```

## Next steps

Implementation planning and technical design will follow once the specification is finalized.
