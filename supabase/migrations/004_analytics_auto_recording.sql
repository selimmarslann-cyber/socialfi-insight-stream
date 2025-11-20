-- Analytics Auto Recording Triggers
-- Automatically record analytics when users perform actions

-- Function to record analytics on post
CREATE OR REPLACE FUNCTION record_analytics_on_post()
RETURNS TRIGGER AS $$
DECLARE
  date_str TEXT;
BEGIN
  date_str := TO_CHAR(NOW(), 'YYYY-MM-DD');

  -- Upsert daily analytics
  INSERT INTO user_analytics (
    wallet_address,
    date,
    posts_count,
    comments_count,
    likes_count,
    trades_count,
    volume_nop,
    pnl_total,
    followers_gained
  )
  VALUES (
    NEW.wallet_address,
    date_str,
    1,
    0,
    0,
    0,
    0,
    0,
    0
  )
  ON CONFLICT (wallet_address, date)
  DO UPDATE SET
    posts_count = user_analytics.posts_count + 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for posts
DROP TRIGGER IF EXISTS trigger_analytics_post ON social_posts;
CREATE TRIGGER trigger_analytics_post
  AFTER INSERT ON social_posts
  FOR EACH ROW
  EXECUTE FUNCTION record_analytics_on_post();

-- Function to record analytics on trade
CREATE OR REPLACE FUNCTION record_analytics_on_trade()
RETURNS TRIGGER AS $$
DECLARE
  date_str TEXT;
  volume_amount NUMERIC;
BEGIN
  date_str := TO_CHAR(NOW(), 'YYYY-MM-DD');
  volume_amount := COALESCE(NEW.cost_basis, 0);

  -- Upsert daily analytics
  INSERT INTO user_analytics (
    wallet_address,
    date,
    posts_count,
    comments_count,
    likes_count,
    trades_count,
    volume_nop,
    pnl_total,
    followers_gained
  )
  VALUES (
    NEW.wallet_address,
    date_str,
    0,
    0,
    0,
    1,
    volume_amount,
    COALESCE(NEW.realized_pnl, 0) + COALESCE(NEW.unrealized_pnl, 0),
    0
  )
  ON CONFLICT (wallet_address, date)
  DO UPDATE SET
    trades_count = user_analytics.trades_count + 1,
    volume_nop = user_analytics.volume_nop + volume_amount,
    pnl_total = user_analytics.pnl_total + COALESCE(NEW.realized_pnl, 0) + COALESCE(NEW.unrealized_pnl, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for trades
DROP TRIGGER IF EXISTS trigger_analytics_trade ON pool_positions;
CREATE TRIGGER trigger_analytics_trade
  AFTER INSERT ON pool_positions
  FOR EACH ROW
  EXECUTE FUNCTION record_analytics_on_trade();

-- Function to record analytics on follow
CREATE OR REPLACE FUNCTION record_analytics_on_follow()
RETURNS TRIGGER AS $$
DECLARE
  date_str TEXT;
BEGIN
  date_str := TO_CHAR(NOW(), 'YYYY-MM-DD');

  -- Update follower's analytics (gained a follower)
  INSERT INTO user_analytics (
    wallet_address,
    date,
    posts_count,
    comments_count,
    likes_count,
    trades_count,
    volume_nop,
    pnl_total,
    followers_gained
  )
  VALUES (
    NEW.following_address,
    date_str,
    0,
    0,
    0,
    0,
    0,
    0,
    1
  )
  ON CONFLICT (wallet_address, date)
  DO UPDATE SET
    followers_gained = user_analytics.followers_gained + 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for follows
DROP TRIGGER IF EXISTS trigger_analytics_follow ON follows;
CREATE TRIGGER trigger_analytics_follow
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION record_analytics_on_follow();

