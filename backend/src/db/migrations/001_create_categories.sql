-- Migration: 001_create_categories
-- Up

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_no_self_ref CHECK (parent_id IS NULL OR parent_id != id)
);

-- Case-insensitive unique name scoped to parent
CREATE UNIQUE INDEX idx_categories_name_lower
  ON categories (LOWER(name), COALESCE(parent_id, 0));

-- Subcategory lookups
CREATE INDEX idx_categories_parent ON categories (parent_id);

-- Seed default categories (FR-008)
INSERT INTO categories (name, is_default) VALUES
  ('Groceries', true),
  ('Utilities', true),
  ('Shopping', true),
  ('Transport', true),
  ('Entertainment', true),
  ('Health', true),
  ('Salary', true),
  ('Freelance', true),
  ('Investments', true),
  ('Other', true);

-- Down
-- DROP TABLE categories;
