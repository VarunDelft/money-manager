-- Migration: 003_create_transactions
-- Up

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(7) NOT NULL CHECK (type IN ('expense', 'income')),
  title VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  time TIME,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL,
  short_description VARCHAR(250) NOT NULL,
  detailed_description TEXT,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  recurring_rule_id INTEGER,
  occurrence_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotency guard for recurring generation
CREATE UNIQUE INDEX idx_transactions_recurring_occurrence
  ON transactions (recurring_rule_id, occurrence_date)
  WHERE recurring_rule_id IS NOT NULL;

-- Transaction list sorting and date range queries
CREATE INDEX idx_transactions_date ON transactions (date DESC);

-- Category breakdown in statistics
CREATE INDEX idx_transactions_category ON transactions (category_id);

-- Statistics: income vs expense by period
CREATE INDEX idx_transactions_type_date ON transactions (type, date);

-- Down
-- DROP TABLE transactions;
