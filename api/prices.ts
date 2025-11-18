import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getMarketSnapshot } from "./shared/binance.js";

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    withHeaders(res).status(204).end();
    return;
  }

  if (req.method !== "GET") {
    respond(res, 405, { items: [], error: "method_not_allowed" });
    return;
  }

  try {
    const items = await getMarketSnapshot();
    respond(res, 200, { items });
  } catch (error) {
    console.error("[api/prices] failed", error);
    respond(res, 500, {
      items: [],
      error: "prices_unavailable",
    });
  }
}
