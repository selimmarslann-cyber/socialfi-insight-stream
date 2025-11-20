# Fair Data Implementation

## Overview
This document describes the fair data validation and averaging system that prevents inflation and ensures equitable distribution of rewards.

## Key Principles

### 1. **Average-Based Calculations**
- All metrics are calculated based on historical averages
- Prevents outliers from skewing the system
- Uses moving averages (7-day, 30-day) for stability

### 2. **Inflation Prevention**
- Rewards are normalized using logarithmic scaling
- More activity = less value per reward (prevents inflation)
- Hard caps on daily rewards and actions

### 3. **Fair Distribution**
- Equal distribution among recipients
- No favoritism or whale advantages
- Transparent calculation methods

## Implementation

### Fair Data Functions (`src/lib/fairData.ts`)

#### `calculateFairAverage()`
Calculates average metrics from historical data:
- Posts per user
- Trades per user
- Volume per user
- Followers per user
- Rewards per user

#### `normalizeReward()`
Normalizes rewards to prevent inflation:
- Base rewards: Referral (10 NOP), Badge (5 NOP), Task (20 NOP)
- Logarithmic scaling reduces value as activity increases
- Maximum caps prevent excessive rewards

#### `validateUserAction()`
Validates user actions to prevent spam:
- Daily limits: Posts (10), Trades (20), Referrals (5)
- Trade amount validation (not too small/large)
- Fair value normalization

#### `calculateFairReferralReward()`
Dynamic referral rewards based on platform activity:
- Base: 10 NOP
- Scales down if platform is very active
- Minimum: 5 NOP

#### `getFairRewardDistribution()`
Fair division of rewards:
- Equal per recipient
- Prevents whale advantages
- Transparent calculation

#### `calculateBadgeReward()`
Badge rewards based on rarity:
- Common: 5 NOP (1x)
- Rare: 10 NOP (2x)
- Epic: 25 NOP (5x)
- Legendary: 50 NOP (10x)

#### `capMetric()`
Hard caps to prevent inflation:
- Volume: 1M NOP/day
- Count: 1000 actions/day
- Reward: 10K NOP/day

## Integration Points

### Referral System
- Rewards calculated dynamically based on platform activity
- Normalized to prevent inflation
- Fair distribution among referrers

### Badge System
- Rewards scale with rarity
- Normalized to prevent inflation
- Fair distribution

### Trading System
- Trade amounts validated against averages
- Prevents whale manipulation
- Fair fee distribution

### Analytics System
- Metrics calculated from historical averages
- Moving averages for stability
- Fair representation of user activity

## Database Triggers

### Referral Completion
- Automatically completes referrals on first post/trade/contribute
- Prevents manual manipulation
- Fair completion criteria

### Analytics Recording
- Automatically records analytics on actions
- Real-time updates
- Fair metric calculation

### Copy Trading
- Triggers on position creation
- Fair execution for all copiers
- Prevents front-running

## Cron Jobs

### Daily Analytics Recording (`api/cron/record-analytics.ts`)
- Runs daily at 00:00 UTC
- Processes all active users
- Calculates fair averages
- Prevents data inflation

## Configuration

### Vercel Cron (`vercel.json`)
```json
{
  "crons": [
    {
      "path": "/api/cron/record-analytics",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Environment Variables
- `CRON_SECRET`: Secret for cron authentication
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for cron jobs

## Best Practices

1. **Always use fair data functions** for reward calculations
2. **Validate actions** before processing
3. **Normalize rewards** to prevent inflation
4. **Use moving averages** for stability
5. **Cap metrics** to prevent abuse
6. **Monitor averages** for anomalies

## Monitoring

### Key Metrics to Monitor
- Average posts per user per day
- Average trades per user per day
- Average volume per user per day
- Average rewards per user per day
- Total platform activity

### Alerts
- Unusual spikes in activity
- Reward distribution anomalies
- Average metric deviations
- Inflation indicators

## Future Enhancements

1. **Machine Learning** for dynamic reward calculation
2. **Time-weighted averages** for better accuracy
3. **User reputation** for personalized rewards
4. **Platform health** indicators
5. **Automated inflation detection**

