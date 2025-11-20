/**
 * Get Client IP Address
 * Returns the client's IP address for anti-sybil detection
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).json({});
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Try various headers to get real IP
    const forwarded = req.headers["x-forwarded-for"];
    const realIP = req.headers["x-real-ip"];
    const cfConnectingIP = req.headers["cf-connecting-ip"]; // Cloudflare

    let clientIP: string | undefined;

    if (cfConnectingIP) {
      clientIP = Array.isArray(cfConnectingIP) ? cfConnectingIP[0] : cfConnectingIP;
    } else if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      clientIP = ips.split(",")[0].trim();
    } else if (realIP) {
      clientIP = Array.isArray(realIP) ? realIP[0] : realIP;
    } else {
      clientIP = req.socket.remoteAddress;
    }

    return res.status(200).setHeader("Content-Type", "application/json").json({
      ip: clientIP || "unknown",
    });
  } catch (error) {
    console.error("[get-client-ip] Error:", error);
    return res.status(500).json({
      error: "Failed to get client IP",
    });
  }
}

