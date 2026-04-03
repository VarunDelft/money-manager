-- Migration: 004_create_transaction_tags
-- Up

CREATE TABLE transaction_tags (
  transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, tag_id)
);

-- Reverse lookup: find transactions by tag
CREATE INDEX idx_transaction_tags_tag ON transaction_tags (tag_id);

-- Down
-- DROP TABLE transaction_tags;
