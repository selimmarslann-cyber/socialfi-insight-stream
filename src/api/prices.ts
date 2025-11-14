import type { PriceSignal } from "./shared/binance";
import { getMarketSnapshot } from "./shared/binance";

interface NetlifyEvent {
  httpMethod: string;
}

interface NetlifyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const buildResponse = (items: PriceSignal[]): NetlifyResponse => ({
  statusCode: 200,
  headers: HEADERS,
  body: JSON.stringify({ items }),
});

export const handler = async (
  event: NetlifyEvent,
): Promise<NetlifyResponse> => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: HEADERS, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: HEADERS,
      body: JSON.stringify({ items: [], error: "method_not_allowed" }),
    };
  }

  try {
    const items = await getMarketSnapshot();
    return buildResponse(items);
  } catch (error) {
    console.error("[api/prices] failed", error);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ items: [], error: "prices_unavailable" }),
    };
  }
};
