import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const withHeaders = (res: VercelResponse): VercelResponse => {
  Object.entries(HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  return res;
};

const respond = (
  res: VercelResponse,
  statusCode: number,
  payload: Record<string, unknown>,
) => {
  withHeaders(res).status(statusCode).json(payload);
};

// Local sentiment analyzer (same logic as frontend)
function analyzeTextSentimentLocal(text: string): {
  score: number;
  label: "bearish" | "neutral" | "bullish";
  confidence: number;
} {
  const bullishWords = [
    "bullish", "moon", "pump", "good", "great", "up", "rise", "gain",
    "profit", "buy", "long", "bull", "rally", "surge", "soar", "rocket",
    "breakout", "breakthrough", "positive", "optimistic", "strong", "growth",
    "opportunity", "win", "success",
  ];

  const bearishWords = [
    "bearish", "dump", "crash", "down", "bad", "risk", "drop", "fall",
    "loss", "sell", "short", "bear", "decline", "plunge", "collapse",
    "correction", "negative", "pessimistic", "weak", "recession", "danger",
    "fail", "fear", "worry",
  ];

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

  let score = 0;
  if (totalMatches > 0) {
    score = Math.max(-1, Math.min(1, diff / Math.max(5, totalMatches)));
  }

  let label: "bearish" | "neutral" | "bullish" = "neutral";
  if (score > 0.2) {
    label = "bullish";
  } else if (score < -0.2) {
    label = "bearish";
  }

  const confidence = Math.min(1, totalMatches / 5);

  return { score, label, confidence };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    withHeaders(res).status(204).end();
    return;
  }

  if (req.method !== "POST") {
    respond(res, 405, { ok: false, error: "method_not_allowed" });
    return;
  }

  try {
    const { text, postId } = req.body as { text?: string; postId?: string };

    if (!text || typeof text !== "string") {
      respond(res, 400, { ok: false, error: "text_required" });
      return;
    }

    const sentimentApiUrl = process.env.SENTIMENT_API_URL;
    const sentimentApiKey = process.env.SENTIMENT_API_KEY;

    let result: { score: number; label: string; confidence: number; source: string };

    // Try AI API if configured
    if (sentimentApiUrl && sentimentApiKey) {
      try {
        const aiResponse = await fetch(sentimentApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sentimentApiKey}`,
          },
          body: JSON.stringify({ text }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          result = {
            score: typeof aiData.score === "number" ? Math.max(-1, Math.min(1, aiData.score)) : 0,
            label: aiData.label === "bullish" || aiData.label === "bearish" ? aiData.label : "neutral",
            confidence: typeof aiData.confidence === "number" ? Math.max(0, Math.min(1, aiData.confidence)) : 0.5,
            source: "ai",
          };
        } else {
          throw new Error("AI API returned error");
        }
      } catch (error) {
        console.warn("[api/sentiment] AI API failed, falling back to local", error);
        // Fall through to local
        const localResult = analyzeTextSentimentLocal(text);
        result = { ...localResult, source: "local" };
      }
    } else {
      // Use local heuristic
      const localResult = analyzeTextSentimentLocal(text);
      result = { ...localResult, source: "local" };
    }

    // Update post in Supabase if postId provided
    if (postId) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseServiceKey) {
        try {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          // Update social_posts table (main table used by the app)
          await supabase
            .from("social_posts")
            .update({
              sentiment_score: result.score,
              sentiment_label: result.label,
              sentiment_confidence: result.confidence,
              sentiment_updated_at: new Date().toISOString(),
            })
            .eq("id", postId);
        } catch (error) {
          console.warn("[api/sentiment] Failed to update post in Supabase", error);
          // Continue anyway, return the result
        }
      }
    }

    respond(res, 200, { ok: true, result });
  } catch (error) {
    console.error("[api/sentiment] failed", error);
    respond(res, 500, {
      ok: false,
      error: "sentiment_analysis_failed",
    });
  }
}

