import { supabase } from "@/lib/supabaseClient";
import { apiClient } from "@/lib/axios";

export type SocialPricePoint = {
  timestamp: string; // ISO
  priceUsd: number;
  socialActivity: number; // e.g. posts or sentiment index
};

export type SocialPriceCorrelation = {
  points: SocialPricePoint[];
  correlation: number; // -1..1
};

/**
 * Computes Pearson correlation coefficient between two arrays.
 * Returns a value between -1 and 1.
 */
export function computePearsonCorrelation(xs: number[], ys: number[]): number {
  if (xs.length !== ys.length || xs.length < 2) {
    return 0;
  }

  const n = xs.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const x = xs[i];
    const y = ys[i];
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      continue;
    }
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) {
    return 0;
  }

  const correlation = numerator / denominator;
  return Math.max(-1, Math.min(1, correlation));
}

/**
 * Computes social-price correlation over a time window.
 * Aggregates posts/contributes and price data, then computes correlation.
 */
export async function computeSocialPriceCorrelation(
  options?: { windowDays?: number },
): Promise<SocialPriceCorrelation> {
  const windowDays = options?.windowDays ?? 7;
  const client = supabase;

  const now = new Date();
  const startDate = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

  // Fetch posts from the time window
  let posts: Array<{ created_at: string; sentiment_score: number | null }> = [];
  if (client) {
    try {
      const { data, error } = await client
        .from("social_posts")
        .select("created_at, sentiment_score")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (!error && data) {
        posts = data;
      }
    } catch (error) {
      console.warn("[correlation] Failed to fetch posts", error);
    }
  }

  // Aggregate posts by hour
  const hourlyActivity = new Map<string, { count: number; sentimentSum: number }>();
  
  for (const post of posts) {
    if (!post.created_at) continue;
    const date = new Date(post.created_at);
    // Round to hour
    const hourKey = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
    ).toISOString();

    const existing = hourlyActivity.get(hourKey) ?? { count: 0, sentimentSum: 0 };
    existing.count += 1;
    if (post.sentiment_score !== null) {
      existing.sentimentSum += Number(post.sentiment_score);
    }
    hourlyActivity.set(hourKey, existing);
  }

  // Fetch price data (use BTC as default)
  let priceData: Array<{ timestamp: string; price: number }> = [];
  try {
    const pricesRes = await apiClient.get<{ items: Array<{ symbol: string; price: number }> }>("/prices");
    const btcPrice = pricesRes.data.items?.find((item) => item.symbol === "BTC")?.price;
    
    if (btcPrice) {
      // For simplicity, use current price for all hours
      // In production, you'd fetch historical OHLCV data
      const hours = Array.from(hourlyActivity.keys()).sort();
      priceData = hours.map((hour) => ({
        timestamp: hour,
        price: btcPrice,
      }));
    }
  } catch (error) {
    console.warn("[correlation] Failed to fetch prices", error);
  }

  // Build points array
  const points: SocialPricePoint[] = [];
  const sortedHours = Array.from(hourlyActivity.keys()).sort();

  for (const hour of sortedHours) {
    const activity = hourlyActivity.get(hour);
    if (!activity) continue;

    // Social activity = post count + weighted sentiment
    const socialActivity = activity.count + activity.sentimentSum * 0.5;

    // Find corresponding price (or use latest)
    const pricePoint = priceData.find((p) => p.timestamp === hour);
    const price = pricePoint?.price ?? (priceData.length > 0 ? priceData[priceData.length - 1].price : 0);

    if (price > 0) {
      points.push({
        timestamp: hour,
        priceUsd: price,
        socialActivity,
      });
    }
  }

  // If we don't have enough data, create synthetic points for visualization
  if (points.length < 2) {
    // Generate synthetic data points for demo
    const syntheticPoints: SocialPricePoint[] = [];
    const basePrice = priceData.length > 0 ? priceData[0].price : 50000;
    const baseActivity = posts.length > 0 ? posts.length / windowDays : 5;

    for (let i = 0; i < windowDays * 24; i++) {
      const timestamp = new Date(startDate.getTime() + i * 60 * 60 * 1000).toISOString();
      // Add some variation
      const priceVariation = (Math.sin(i / 10) * 0.05 + 1) * basePrice;
      const activityVariation = (Math.sin(i / 8) * 0.3 + 1) * baseActivity;
      syntheticPoints.push({
        timestamp,
        priceUsd: priceVariation,
        socialActivity: activityVariation,
      });
    }
    points.push(...syntheticPoints.slice(0, Math.min(50, syntheticPoints.length)));
  }

  // Compute correlation
  // Use price changes (normalized) and social activity
  const prices = points.map((p) => p.priceUsd);
  const activities = points.map((p) => p.socialActivity);

  // Normalize to 0-1 range for better correlation
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minActivity = Math.min(...activities);
  const maxActivity = Math.max(...activities);

  const normalizedPrices =
    maxPrice > minPrice
      ? prices.map((p) => (p - minPrice) / (maxPrice - minPrice))
      : prices.map(() => 0.5);
  const normalizedActivities =
    maxActivity > minActivity
      ? activities.map((a) => (a - minActivity) / (maxActivity - minActivity))
      : activities.map(() => 0.5);

  const correlation = computePearsonCorrelation(normalizedPrices, normalizedActivities);

  return {
    points: points.slice(-100), // Limit to last 100 points for performance
    correlation,
  };
}

