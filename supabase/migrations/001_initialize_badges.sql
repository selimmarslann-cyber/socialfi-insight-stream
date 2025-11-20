-- Initialize Badges
-- Run this migration to populate the badges table

INSERT INTO public.badges (badge_key, name, description, rarity, category)
VALUES
  ('first_post', 'First Contribution', 'Shared your first contribution', 'common', 'social'),
  ('first_trade', 'First Trade', 'Completed your first trade', 'common', 'trading'),
  ('10_posts', 'Active Contributor', 'Shared 10 contributions', 'rare', 'social'),
  ('100_posts', 'Power User', 'Shared 100 contributions', 'epic', 'social'),
  ('first_follower', 'Influencer', 'Gained your first follower', 'common', 'social'),
  ('10_followers', 'Rising Star', 'Gained 10 followers', 'rare', 'social'),
  ('100_followers', 'Community Leader', 'Gained 100 followers', 'epic', 'social'),
  ('alpha_score_50', 'Alpha Trader', 'Achieved Alpha Score of 50', 'rare', 'trading'),
  ('alpha_score_80', 'Elite Trader', 'Achieved Alpha Score of 80', 'epic', 'trading'),
  ('alpha_score_95', 'Legendary Trader', 'Achieved Alpha Score of 95', 'legendary', 'trading'),
  ('first_referral', 'Network Builder', 'Referred your first user', 'common', 'achievement'),
  ('10_referrals', 'Community Builder', 'Referred 10 users', 'rare', 'achievement'),
  ('early_adopter', 'Early Adopter', 'Joined in the first 1000 users', 'epic', 'special'),
  ('whale', 'Whale', 'Traded over 100,000 NOP', 'epic', 'trading'),
  ('perfect_week', 'Perfect Week', '100% win rate for a week', 'legendary', 'trading')
ON CONFLICT (badge_key) DO NOTHING;

