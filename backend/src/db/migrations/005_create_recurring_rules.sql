-- Migration: 005_create_recurring_rules
-- Up

CREATE TABLE recurring_rules (
  id SERIAL PRIMARY KEY,
  type VARCHAR(7) NOT NULL CHECK (type IN ('expense', 'income')),
  title VARCHAR(100) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL,
  short_description VARCHAR(250) NOT NULL,
  detailed_description TEXT,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  interval_unit VARCHAR(5) NOT NULL CHECK (interval_unit IN ('day', 'week', 'month', 'year')),
  frequency INTEGER NOT NULL CHECK (frequency > 0),
  start_date DATE NOT NULL,
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
  next_occurrence_date DATE NOT NULL,
  last_generated_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scheduler query: find active rules with due dates
CREATE INDEX idx_recurring_active_next
  ON recurring_rules (is_active, next_occurrence_date);

-- Add FK from transactions to recurring_rules
ALTER TABLE transactions
  ADD CONSTRAINT fk_transactions_recurring_rule
  FOREIGN KEY (recurring_rule_id) REFERENCES recurring_rules(id)
  ON DELETE SET NULL;

-- Down
-- ALTER TABLE transactions DROP CONSTRAINT fk_transactions_recurring_rule;
-- DROP TABLE recurring_rules;
