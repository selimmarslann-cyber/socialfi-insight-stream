-- Copy Trade Database Trigger
-- Triggers Supabase Edge Function when a trader opens a position

CREATE OR REPLACE FUNCTION trigger_copy_trade()
RETURNS TRIGGER AS $$
BEGIN
  -- Call Supabase Edge Function via HTTP (if needed)
  -- For now, we'll use a database notification that the Edge Function can listen to
  PERFORM pg_notify('copy_trade_event', json_build_object(
    'wallet_address', NEW.wallet_address,
    'contribute_id', NEW.contribute_id,
    'shares', NEW.shares,
    'cost_basis', NEW.cost_basis
  )::text);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on pool_positions insert
DROP TRIGGER IF EXISTS trigger_copy_trade_on_position ON pool_positions;
CREATE TRIGGER trigger_copy_trade_on_position
  AFTER INSERT ON pool_positions
  FOR EACH ROW
  WHEN (NEW.shares > 0)
  EXECUTE FUNCTION trigger_copy_trade();

