-- Migration: 002_create_tags
-- Up

CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive unique tag name
CREATE UNIQUE INDEX idx_tags_name_lower ON tags (LOWER(name));

-- Down
-- DROP TABLE tags;
