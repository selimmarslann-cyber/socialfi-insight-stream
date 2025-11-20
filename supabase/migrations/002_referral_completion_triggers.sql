-- Referral Completion Triggers
-- Automatically complete referrals when users perform actions

-- Function to check and complete referral on first post
CREATE OR REPLACE FUNCTION check_referral_on_first_post()
RETURNS TRIGGER AS $$
DECLARE
  post_count INTEGER;
BEGIN
  -- Count user's posts
  SELECT COUNT(*) INTO post_count
  FROM social_posts
  WHERE wallet_address = NEW.wallet_address;

  -- If this is the first post, complete referral
  IF post_count = 1 THEN
    UPDATE referrals
    SET status = 'completed',
        completed_at = NOW()
    WHERE referred_address = NEW.wallet_address
      AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for first post
DROP TRIGGER IF EXISTS trigger_referral_first_post ON social_posts;
CREATE TRIGGER trigger_referral_first_post
  AFTER INSERT ON social_posts
  FOR EACH ROW
  EXECUTE FUNCTION check_referral_on_first_post();

-- Function to check and complete referral on first trade
CREATE OR REPLACE FUNCTION check_referral_on_first_trade()
RETURNS TRIGGER AS $$
DECLARE
  trade_count INTEGER;
BEGIN
  -- Count user's trades
  SELECT COUNT(*) INTO trade_count
  FROM pool_positions
  WHERE wallet_address = NEW.wallet_address;

  -- If this is the first trade, complete referral
  IF trade_count = 1 THEN
    UPDATE referrals
    SET status = 'completed',
        completed_at = NOW()
    WHERE referred_address = NEW.wallet_address
      AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for first trade
DROP TRIGGER IF EXISTS trigger_referral_first_trade ON pool_positions;
CREATE TRIGGER trigger_referral_first_trade
  AFTER INSERT ON pool_positions
  FOR EACH ROW
  EXECUTE FUNCTION check_referral_on_first_trade();

-- Function to check and complete referral on first contribute
CREATE OR REPLACE FUNCTION check_referral_on_first_contribute()
RETURNS TRIGGER AS $$
DECLARE
  contribute_count INTEGER;
BEGIN
  -- Count user's contributes
  SELECT COUNT(*) INTO contribute_count
  FROM contributes
  WHERE author = NEW.author;

  -- If this is the first contribute, complete referral
  IF contribute_count = 1 THEN
    UPDATE referrals
    SET status = 'completed',
        completed_at = NOW()
    WHERE referred_address = NEW.author
      AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for first contribute
DROP TRIGGER IF EXISTS trigger_referral_first_contribute ON contributes;
CREATE TRIGGER trigger_referral_first_contribute
  AFTER INSERT ON contributes
  FOR EACH ROW
  EXECUTE FUNCTION check_referral_on_first_contribute();

