# REST API Contracts: Money Manager Platform

**Base URL**: `{API_GATEWAY_URL}/api/v1`
**Content-Type**: `application/json`
**Date**: 2026-04-03

## Common Patterns

### Error Response Format

All error responses follow a consistent structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error description",
    "details": [
      { "field": "amount", "message": "Amount must be a positive number." }
    ]
  }
}
```

**Standard error codes**:
| HTTP Status | Code | When |
|-------------|------|------|
| 400 | VALIDATION_ERROR | Invalid input (missing fields, bad format) |
| 404 | NOT_FOUND | Resource does not exist |
| 409 | CONFLICT | Duplicate resource (e.g., category name already exists) |
| 500 | INTERNAL_ERROR | Unexpected server error |

### Pagination

List endpoints support cursor-based pagination:

```
GET /resource?limit=20&cursor={last_id}
```

Response includes:
```json
{
  "data": [...],
  "pagination": {
    "nextCursor": "123",
    "hasMore": true
  }
}
```

### Timestamps

All timestamps returned as ISO 8601 strings in UTC: `"2026-04-03T14:30:00.000Z"`

---

## 1. Transactions

### POST /transactions

Create a new transaction.

**Request body**:
```json
{
  "type": "expense",
  "title": "Weekly groceries",
  "date": "2026-03-27",
  "time": "14:30",
  "amount": 45.99,
  "currency": "USD",
  "shortDescription": "Supermarket run",
  "detailedDescription": "Bought fruits, vegetables, and dairy",
  "categoryId": 1,
  "tags": ["weekly", "food"]
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| type | string | Yes | `"expense"` or `"income"` |
| title | string | Yes | Max 100 characters |
| date | string | Yes | ISO 8601 date (`YYYY-MM-DD`) |
| time | string | No | `HH:mm` format |
| amount | number | Yes | > 0, max 2 decimal places, max 999999999.99 |
| currency | string | Yes | ISO 4217 3-letter code |
| shortDescription | string | Yes | Max 250 characters |
| detailedDescription | string | No | Free text |
| categoryId | integer | Yes | Must reference existing category |
| tags | string[] | No | Array of tag names (max 50 chars each) |

**Response** `201 Created`:
```json
{
  "data": {
    "id": 1,
    "type": "expense",
    "title": "Weekly groceries",
    "date": "2026-03-27",
    "time": "14:30",
    "amount": 45.99,
    "currency": "USD",
    "shortDescription": "Supermarket run",
    "detailedDescription": "Bought fruits, vegetables, and dairy",
    "category": { "id": 1, "name": "Groceries" },
    "tags": ["weekly", "food"],
    "recurringRuleId": null,
    "createdAt": "2026-03-27T14:35:00.000Z",
    "updatedAt": "2026-03-27T14:35:00.000Z"
  }
}
```

**Errors**: 400 (validation), 404 (categoryId not found)

---

### GET /transactions

List transactions with filtering and pagination.

**Query parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| limit | integer | 20 | Max items per page (1–100) |
| cursor | string | — | Pagination cursor (last transaction ID) |
| type | string | — | Filter by `"expense"` or `"income"` |
| categoryId | integer | — | Filter by category |
| dateFrom | string | — | Start date (inclusive, `YYYY-MM-DD`) |
| dateTo | string | — | End date (inclusive, `YYYY-MM-DD`) |
| search | string | — | Search in title and shortDescription |

**Response** `200 OK`:
```json
{
  "data": [
    {
      "id": 1,
      "type": "expense",
      "title": "Weekly groceries",
      "date": "2026-03-27",
      "time": "14:30",
      "amount": 45.99,
      "currency": "USD",
      "shortDescription": "Supermarket run",
      "detailedDescription": null,
      "category": { "id": 1, "name": "Groceries" },
      "tags": ["weekly"],
      "recurringRuleId": null,
      "createdAt": "2026-03-27T14:35:00.000Z",
      "updatedAt": "2026-03-27T14:35:00.000Z"
    }
  ],
  "pagination": {
    "nextCursor": "1",
    "hasMore": false
  }
}
```

---

### GET /transactions/:id

Get a single transaction by ID.

**Response** `200 OK`: Same shape as single item in list response.

**Errors**: 404 (transaction not found)

---

### PUT /transactions/:id

Update an existing transaction. All mutable fields can be updated.

**Request body**: Same schema as POST (all fields optional; only provided fields are updated).

**Response** `200 OK`: Updated transaction object.

**Errors**: 400 (validation), 404 (not found), 404 (categoryId not found)

---

### DELETE /transactions/:id

Delete a transaction permanently.

**Response** `204 No Content`

**Errors**: 404 (not found)

---

## 2. Categories

### GET /categories

List all categories (tree structure).

**Query parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| includeHidden | boolean | false | Include hidden default categories |

**Response** `200 OK`:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Groceries",
      "parentId": null,
      "isDefault": true,
      "isHidden": false,
      "subcategories": [],
      "createdAt": "2026-03-27T00:00:00.000Z",
      "updatedAt": "2026-03-27T00:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Utilities",
      "parentId": null,
      "isDefault": true,
      "isHidden": false,
      "subcategories": [
        {
          "id": 11,
          "name": "Electricity",
          "parentId": 2,
          "isDefault": false,
          "isHidden": false,
          "createdAt": "2026-03-28T10:00:00.000Z",
          "updatedAt": "2026-03-28T10:00:00.000Z"
        }
      ],
      "createdAt": "2026-03-27T00:00:00.000Z",
      "updatedAt": "2026-03-27T00:00:00.000Z"
    }
  ]
}
```

---

### POST /categories

Create a new category or subcategory.

**Request body**:
```json
{
  "name": "Subscriptions",
  "parentId": null
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| name | string | Yes | Max 100 characters; unique case-insensitively within same parent scope |
| parentId | integer | No | If provided, must reference an existing non-subcategory (top-level) |

**Response** `201 Created`:
```json
{
  "data": {
    "id": 12,
    "name": "Subscriptions",
    "parentId": null,
    "isDefault": false,
    "isHidden": false,
    "createdAt": "2026-04-03T10:00:00.000Z",
    "updatedAt": "2026-04-03T10:00:00.000Z"
  }
}
```

**Errors**: 400 (validation), 404 (parentId not found), 409 (name already exists)

---

### PUT /categories/:id

Rename a category.

**Request body**:
```json
{
  "name": "New Name"
}
```

**Response** `200 OK`: Updated category object.

**Errors**: 400 (validation), 404 (not found), 409 (name conflict)

---

### PATCH /categories/:id/visibility

Toggle visibility of a default category.

**Request body**:
```json
{
  "isHidden": true
}
```

**Response** `200 OK`: Updated category object.

**Errors**: 400 (non-default category), 404 (not found)

---

### DELETE /categories/:id

Delete a category. Requires reassignment if transactions exist.

**Request body** (required when category has transactions):
```json
{
  "reassignToCategoryId": 5
}
```

**Response** `204 No Content`

**Errors**: 400 (is default category — cannot delete), 400 (has transactions but no reassignToCategoryId provided), 404 (not found), 404 (reassignToCategoryId not found)

**Behavior**: When deleting a parent category, all subcategories are also deleted. Transactions from the parent and all subcategories are reassigned to `reassignToCategoryId` (FR-011).

---

## 3. Recurring Rules

### GET /recurring-rules

List all recurring transaction rules.

**Response** `200 OK`:
```json
{
  "data": [
    {
      "id": 1,
      "type": "expense",
      "title": "Monthly Rent",
      "amount": 1200.00,
      "currency": "USD",
      "shortDescription": "Apartment rent",
      "detailedDescription": null,
      "category": { "id": 2, "name": "Utilities" },
      "intervalUnit": "month",
      "frequency": 1,
      "startDate": "2026-04-01",
      "dayOfMonth": 1,
      "nextOccurrenceDate": "2026-05-01",
      "lastGeneratedDate": "2026-04-01",
      "isActive": true,
      "createdAt": "2026-03-30T10:00:00.000Z",
      "updatedAt": "2026-03-30T10:00:00.000Z"
    }
  ]
}
```

---

### POST /recurring-rules

Create a new recurring transaction rule.

**Request body**:
```json
{
  "type": "expense",
  "title": "Monthly Rent",
  "amount": 1200.00,
  "currency": "USD",
  "shortDescription": "Apartment rent",
  "detailedDescription": null,
  "categoryId": 2,
  "intervalUnit": "month",
  "frequency": 1,
  "startDate": "2026-04-01"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| type | string | Yes | `"expense"` or `"income"` |
| title | string | Yes | Max 100 characters |
| amount | number | Yes | > 0, max 2 decimal places |
| currency | string | Yes | ISO 4217 3-letter code |
| shortDescription | string | Yes | Max 250 characters |
| detailedDescription | string | No | Free text |
| categoryId | integer | Yes | Must reference existing category |
| intervalUnit | string | Yes | `"day"`, `"week"`, `"month"`, or `"year"` |
| frequency | integer | Yes | > 0 |
| startDate | string | Yes | ISO 8601 date (`YYYY-MM-DD`) |

**Response** `201 Created`: Created recurring rule object.

**Errors**: 400 (validation), 404 (categoryId not found)

**Behavior**: `nextOccurrenceDate` is set to `startDate`. `dayOfMonth` is derived from `startDate` for monthly/yearly rules. `isActive` defaults to `true`.

---

### PUT /recurring-rules/:id

Update an existing recurring rule. Changes apply to future generated entries only (FR-016).

**Request body**: Same schema as POST (all fields optional).

**Response** `200 OK`: Updated rule object.

**Errors**: 400 (validation), 404 (not found)

---

### PATCH /recurring-rules/:id/status

Activate or deactivate a recurring rule.

**Request body**:
```json
{
  "isActive": false
}
```

**Response** `200 OK`: Updated rule object.

**Errors**: 404 (not found)

---

### DELETE /recurring-rules/:id

Delete a recurring rule. Previously generated transactions are preserved (FR-016).

**Response** `204 No Content`

**Errors**: 404 (not found)

---

## 4. Statistics

### GET /statistics

Get aggregated financial statistics for a time period.

**Query parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| granularity | string | Yes | `"day"`, `"week"`, `"month"`, or `"year"` |
| date | string | Yes | Reference date (`YYYY-MM-DD`); determines the period |
| currency | string | No | Filter by currency; if omitted, group by currency |

**Response** `200 OK` (single currency or filtered):
```json
{
  "data": {
    "period": {
      "granularity": "month",
      "startDate": "2026-03-01",
      "endDate": "2026-03-31",
      "label": "March 2026"
    },
    "summary": {
      "totalIncome": 5000.00,
      "totalExpenses": 3200.50,
      "netBalance": 1799.50,
      "currency": "USD"
    },
    "categoryBreakdown": [
      {
        "categoryId": 1,
        "categoryName": "Groceries",
        "total": 450.00,
        "percentage": 14.06,
        "type": "expense"
      },
      {
        "categoryId": 7,
        "categoryName": "Salary",
        "total": 5000.00,
        "percentage": 100.00,
        "type": "income"
      }
    ]
  }
}
```

**Response** `200 OK` (multi-currency, no filter):
```json
{
  "data": {
    "period": { "granularity": "month", "startDate": "2026-03-01", "endDate": "2026-03-31", "label": "March 2026" },
    "currencies": ["USD", "EUR"],
    "summaryByCurrency": [
      { "currency": "USD", "totalIncome": 5000.00, "totalExpenses": 3200.50, "netBalance": 1799.50 },
      { "currency": "EUR", "totalIncome": 200.00, "totalExpenses": 50.00, "netBalance": 150.00 }
    ],
    "categoryBreakdown": [
      { "categoryId": 1, "categoryName": "Groceries", "total": 450.00, "percentage": 14.06, "type": "expense", "currency": "USD" }
    ]
  }
}
```

**Empty state** `200 OK`:
```json
{
  "data": {
    "period": { "granularity": "month", "startDate": "2026-03-01", "endDate": "2026-03-31", "label": "March 2026" },
    "summary": null,
    "categoryBreakdown": [],
    "message": "No transactions found for this period."
  }
}
```

---

### GET /statistics/trend

Get month-by-month trend for the year view (FR-021).

**Query parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| year | integer | Yes | The year to show trends for |
| currency | string | No | Filter by currency |

**Response** `200 OK`:
```json
{
  "data": {
    "year": 2026,
    "currency": "USD",
    "months": [
      { "month": 1, "label": "January", "totalIncome": 5000.00, "totalExpenses": 3100.00, "netBalance": 1900.00 },
      { "month": 2, "label": "February", "totalIncome": 5000.00, "totalExpenses": 2800.00, "netBalance": 2200.00 },
      { "month": 3, "label": "March", "totalIncome": 5000.00, "totalExpenses": 3200.50, "netBalance": 1799.50 }
    ]
  }
}
```

---

## 5. Tags

### GET /tags

List all tags.

**Response** `200 OK`:
```json
{
  "data": [
    { "id": 1, "name": "weekly", "createdAt": "2026-03-27T14:35:00.000Z" },
    { "id": 2, "name": "food", "createdAt": "2026-03-27T14:35:00.000Z" }
  ]
}
```

Tags are created implicitly when used in a transaction. This endpoint provides autocomplete support.
