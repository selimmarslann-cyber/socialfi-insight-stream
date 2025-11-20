/**
 * API Security Utilities
 * Authentication, authorization, rate limiting, input validation
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

// Allowed origins for CORS (restrict in production)
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:3000"];

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute

/**
 * Get client IP address from request
 */
export function getClientIP(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(",")[0].trim();
  }
  const realIP = req.headers["x-real-ip"];
  if (realIP) {
    return Array.isArray(realIP) ? realIP[0] : realIP;
  }
  return req.socket.remoteAddress || "unknown";
}

/**
 * Check rate limit for IP address
 */
export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetAt) {
    // Reset or create new record
    rateLimitStore.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count, resetAt: record.resetAt };
}

/**
 * Clean up old rate limit records
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

/**
 * CORS headers with origin validation
 */
export function getCORSHeaders(origin?: string): Record<string, string> {
  const allowedOrigin =
    origin && (ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV === "development")
      ? origin
      : ALLOWED_ORIGINS[0] || "*";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400", // 24 hours
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  };
}

/**
 * Validate and sanitize wallet address
 */
export function validateWalletAddress(address: unknown): string | null {
  if (typeof address !== "string") return null;
  const trimmed = address.trim();
  if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return null;
  return trimmed.toLowerCase();
}

/**
 * Validate and sanitize text input
 */
export function sanitizeText(input: unknown, maxLength: number = 10000): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > maxLength) return null;
  // Remove null bytes and control characters
  return trimmed.replace(/\0/g, "").replace(/[\x00-\x1F\x7F]/g, "");
}

/**
 * Validate and sanitize array input
 */
export function sanitizeArray(input: unknown, maxItems: number = 50): string[] | null {
  if (!Array.isArray(input)) return null;
  if (input.length > maxItems) return null;
  const sanitized = input
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.length <= 100);
  return sanitized.length > 0 ? sanitized : null;
}

/**
 * Validate request body size
 */
export function validateBodySize(body: unknown, maxSizeBytes: number = 1024 * 1024): boolean {
  const bodyString = JSON.stringify(body);
  return bodyString.length <= maxSizeBytes;
}

/**
 * Authentication middleware
 */
export async function authenticateRequest(
  req: VercelRequest,
  res: VercelResponse
): Promise<{ authenticated: boolean; userId?: string; error?: string }> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { authenticated: false, error: "Missing or invalid authorization header" };
  }

  const token = authHeader.substring(7);
  
  try {
    // In production, verify JWT token here
    // For now, check if it's a valid Supabase session token
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return { authenticated: false, error: "Supabase not configured" };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { authenticated: false, error: "Invalid token" };
    }

    return { authenticated: true, userId: user.id };
  } catch (error) {
    console.error("[apiSecurity] Auth error:", error);
    return { authenticated: false, error: "Authentication failed" };
  }
}

/**
 * Require authentication middleware
 */
export function requireAuth(
  req: VercelRequest,
  res: VercelResponse
): Promise<{ authenticated: boolean; userId?: string }> {
  return new Promise(async (resolve) => {
    const auth = await authenticateRequest(req, res);
    if (!auth.authenticated) {
      res.status(401).json({ error: auth.error || "Authentication required" });
      resolve({ authenticated: false });
      return;
    }
    resolve({ authenticated: true, userId: auth.userId });
  });
}

/**
 * Security middleware wrapper
 */
export function withSecurity(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<void>,
  options: {
    requireAuth?: boolean;
    rateLimit?: boolean;
    cors?: boolean;
  } = {}
): (req: VercelRequest, res: VercelResponse) => Promise<void> {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      // CORS
      if (options.cors !== false) {
        const origin = req.headers.origin;
        const headers = getCORSHeaders(origin);
        Object.entries(headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });

        if (req.method === "OPTIONS") {
          return res.status(200).end();
        }
      }

      // Rate limiting
      if (options.rateLimit !== false) {
        const ip = getClientIP(req);
        const rateLimit = checkRateLimit(ip);
        if (!rateLimit.allowed) {
          res.setHeader("X-RateLimit-Limit", String(RATE_LIMIT_MAX_REQUESTS));
          res.setHeader("X-RateLimit-Remaining", "0");
          res.setHeader("X-RateLimit-Reset", String(Math.ceil(rateLimit.resetAt / 1000)));
          return res.status(429).json({
            error: "Rate limit exceeded",
            retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
          });
        }
        res.setHeader("X-RateLimit-Limit", String(RATE_LIMIT_MAX_REQUESTS));
        res.setHeader("X-RateLimit-Remaining", String(rateLimit.remaining));
        res.setHeader("X-RateLimit-Reset", String(Math.ceil(rateLimit.resetAt / 1000)));
      }

      // Authentication
      if (options.requireAuth) {
        const auth = await requireAuth(req, res);
        if (!auth.authenticated) {
          return; // Response already sent
        }
      }

      // Execute handler
      await handler(req, res);
    } catch (error) {
      console.error("[apiSecurity] Handler error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          error: "Internal server error",
          // Don't expose internal error details in production
          ...(process.env.NODE_ENV === "development" && { details: error instanceof Error ? error.message : String(error) }),
        });
      }
    }
  };
}

