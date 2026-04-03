-- Migration: 006_add_updated_at_triggers
-- Up

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_categories
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_transactions
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_recurring_rules
  BEFORE UPDATE ON recurring_rules
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Down
-- DROP TRIGGER IF EXISTS set_updated_at_categories ON categories;
-- DROP TRIGGER IF EXISTS set_updated_at_transactions ON transactions;
-- DROP TRIGGER IF EXISTS set_updated_at_recurring_rules ON recurring_rules;
-- DROP FUNCTION IF EXISTS trigger_set_updated_at();
