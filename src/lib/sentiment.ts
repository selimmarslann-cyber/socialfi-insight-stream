import { supabase } from "@/lib/supabaseClient";

export type SentimentLabel = "bearish" | "neutral" | "bullish";

export type SentimentResult = {
  score: number; // -1 .. 1
  label: SentimentLabel;
  confidence: number; // 0..1
  source: "local" | "ai";
};

const bullishWords = [
  "bullish",
  "moon",
  "pump",
  "good",
  "great",
  "up",
  "rise",
  "gain",
  "profit",
  "buy",
  "long",
  "bull",
  "rally",
  "surge",
  "soar",
  "rocket",
  "breakout",
  "breakthrough",
  "positive",
  "optimistic",
  "strong",
  "growth",
  "opportunity",
  "win",
  "success",
];

const bearishWords = [
  "bearish",
  "dump",
  "crash",
  "down",
  "bad",
  "risk",
  "drop",
  "fall",
  "loss",
  "sell",
  "short",
  "bear",
  "decline",
  "plunge",
  "collapse",
  "correction",
  "negative",
  "pessimistic",
  "weak",
  "recession",
  "danger",
  "fail",
  "fear",
  "worry",
];

/**
 * Local heuristic-based sentiment analyzer.
 * Uses keyword matching to determine sentiment.
 */
export function analyzeTextSentimentLocal(text: string): SentimentResult {
  const lowerText = text.toLowerCase();
  
  let bullishCount = 0;
  let bearishCount = 0;

  for (const word of bullishWords) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = lowerText.match(regex);
    if (matches) {
      bullishCount += matches.length;
    }
  }

  for (const word of bearishWords) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    const matches = lowerText.match(regex);
    if (matches) {
      bearishCount += matches.length;
    }
  }

  const totalMatches = bullishCount + bearishCount;
  const diff = bullishCount - bearishCount;
  
  // Map diff to score in [-1, 1]
  // If no matches, default to neutral (0)
  let score = 0;
  if (totalMatches > 0) {
    // Normalize by total matches, but cap the influence
    score = Math.max(-1, Math.min(1, diff / Math.max(5, totalMatches)));
  }

  // Determine label
  let label: SentimentLabel = "neutral";
  if (score > 0.2) {
    label = "bullish";
  } else if (score < -0.2) {
    label = "bearish";
  }

  // Confidence based on number of matches
  const confidence = Math.min(1, totalMatches / 5);

  return {
    score,
    label,
    confidence,
    source: "local",
  };
}

/**
 * Updates post sentiment in Supabase using local analysis.
 */
export async function updatePostSentimentLocal(
  postId: string,
  text: string,
): Promise<SentimentResult | null> {
  const result = analyzeTextSentimentLocal(text);
  const client = supabase;
  
  if (!client) {
    console.warn("[sentiment] Supabase client unavailable");
    return null;
  }

  try {
    const { error } = await client
      .from("posts")
      .update({
        sentiment_score: result.score,
        sentiment_label: result.label,
        sentiment_confidence: result.confidence,
        sentiment_updated_at: new Date().toISOString(),
      })
      .eq("id", postId);

    if (error) {
      console.warn("[sentiment] Failed to update post sentiment", error);
      return null;
    }

    return result;
  } catch (error) {
    console.warn("[sentiment] Error updating post sentiment", error);
    return null;
  }
}

/**
 * AI-backed sentiment analyzer (optional).
 * Reads env variables for API endpoint and key.
 */
export async function analyzeTextSentimentAI(
  text: string,
): Promise<SentimentResult | null> {
  const apiUrl = import.meta.env.VITE_SENTIMENT_API_URL;
  const apiKey = import.meta.env.VITE_SENTIMENT_API_KEY;

  if (!apiUrl || !apiKey) {
    return null;
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      console.warn("[sentiment] AI API returned error", response.status);
      return null;
    }

    const data = await response.json();
    
    // Map response to SentimentResult
    // Expected format: { score: number, label: string, confidence: number }
    const score = typeof data.score === "number" ? Math.max(-1, Math.min(1, data.score)) : 0;
    const label = data.label === "bullish" || data.label === "bearish" ? data.label : "neutral";
    const confidence = typeof data.confidence === "number" ? Math.max(0, Math.min(1, data.confidence)) : 0.5;

    return {
      score,
      label: label as SentimentLabel,
      confidence,
      source: "ai",
    };
  } catch (error) {
    console.warn("[sentiment] AI API call failed", error);
    return null;
  }
}

/**
 * Analyzes text sentiment, preferring AI if available, falling back to local.
 */
export async function analyzeTextSentiment(
  text: string,
): Promise<SentimentResult> {
  const aiResult = await analyzeTextSentimentAI(text);
  if (aiResult) {
    return aiResult;
  }
  return analyzeTextSentimentLocal(text);
}

