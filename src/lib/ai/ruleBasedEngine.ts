export type AISignal = "Bullish" | "Bearish" | "Neutral";
export type AIVolatility = "Low" | "Medium" | "High";
export type AIMMActivity = "Positive" | "Negative" | "Neutral";

export interface AIRuleInput {
  symbol?: string;
  priceChange24h?: number;
  volumeChange24h?: number;
  fundingRate?: number;
  sentimentHint?: "bullish" | "bearish" | "neutral" | null;
}

export interface AIRuleOutput {
  aiSignal: AISignal;
  aiVolatility: AIVolatility;
  aiMmActivity: AIMMActivity;
  aiScore: number;
  aiLastUpdatedAt: string;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const resolveSentiment = (
  hint?: AIRuleInput["sentimentHint"],
): "bullish" | "bearish" | "neutral" => {
  if (hint === "bullish" || hint === "bearish") {
    return hint;
  }
  return "neutral";
};

const detectSignal = (
  price: number,
  volume: number,
  sentiment: ReturnType<typeof resolveSentiment>,
): AISignal => {
  if (price >= 4 && volume >= 10) {
    return "Bullish";
  }
  if (price <= -4 && volume <= -8) {
    return "Bearish";
  }
  if (sentiment === "bullish" && price > 0) {
    return "Bullish";
  }
  if (sentiment === "bearish" && price < 0) {
    return "Bearish";
  }
  return "Neutral";
};

const detectVolatility = (price: number, volume: number): AIVolatility => {
  const magnitude = Math.max(Math.abs(price), Math.abs(volume) / 2);
  if (magnitude >= 8) {
    return "High";
  }
  if (magnitude <= 3) {
    return "Low";
  }
  return "Medium";
};

const detectMarketMakerActivity = (
  price: number,
  volume: number,
): AIMMActivity => {
  if (volume >= 10) {
    return price >= 0 ? "Positive" : "Negative";
  }
  if (volume <= -6) {
    return "Negative";
  }
  return "Neutral";
};

const deriveScore = (
  price: number,
  volume: number,
  fundingRate: number,
  sentiment: ReturnType<typeof resolveSentiment>,
) => {
  let score = 55;
  score += clamp(price * 2.4, -18, 22);
  score += clamp(volume * 0.9, -12, 18);
  score += clamp(fundingRate * 140, -10, 10);
  if (sentiment === "bullish") score += 4;
  if (sentiment === "bearish") score -= 4;
  return Math.round(clamp(score, 40, 92));
};

export const computeAIFromRules = (input: AIRuleInput): AIRuleOutput => {
  const price = Number.isFinite(input.priceChange24h)
    ? (input.priceChange24h as number)
    : 0;
  const volume = Number.isFinite(input.volumeChange24h)
    ? (input.volumeChange24h as number)
    : 0;
  const fundingRate = Number.isFinite(input.fundingRate)
    ? (input.fundingRate as number)
    : 0;

  const sentiment = resolveSentiment(input.sentimentHint);

  const aiSignal = detectSignal(price, volume, sentiment);
  const aiVolatility = detectVolatility(price, volume);
  const aiMmActivity = detectMarketMakerActivity(price, volume);
  const aiScore = deriveScore(price, volume, fundingRate, sentiment);

  return {
    aiSignal,
    aiVolatility,
    aiMmActivity,
    aiScore,
    aiLastUpdatedAt: new Date().toISOString(),
  };
};
