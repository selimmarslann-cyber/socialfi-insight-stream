import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import {
  withSecurity,
  validateWalletAddress,
  sanitizeText,
  sanitizeArray,
  validateBodySize,
} from "@/lib/apiSecurity";

export default withSecurity(
  async function handler(req: VercelRequest, res: VercelResponse) {

  // Initialize Supabase client
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({
      error: "Supabase configuration missing. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables.",
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // GET /api/contributes - Fetch all contributes
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("contributes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[api/contributes] GET error:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).setHeader("Content-Type", "application/json").json(data || []);
    }

    // POST /api/contributes - Create new contribute
    if (req.method === "POST") {
      // ✅ Validate request body size
      if (!validateBodySize(req.body, 500 * 1024)) {
        return res.status(413).json({
          error: "Request body too large. Maximum size is 500KB.",
        });
      }

      const { title, subtitle, description, author, tags, category, coverImage } = req.body;

      // ✅ Sanitize and validate inputs
      const sanitizedTitle = sanitizeText(title, 200);
      const sanitizedSubtitle = subtitle ? sanitizeText(subtitle, 200) : null;
      const sanitizedDescription = sanitizeText(description, 5000);
      const validatedAuthor = validateWalletAddress(author);
      const sanitizedTags = tags ? sanitizeArray(tags, 20) : [];
      const sanitizedCategory = category && typeof category === "string" ? category.trim().slice(0, 50) : "trading";
      const sanitizedCoverImage =
        coverImage && typeof coverImage === "string" && coverImage.length <= 500 ? coverImage.trim() : null;

      if (!sanitizedTitle || !sanitizedDescription || !validatedAuthor) {
        return res.status(400).json({
          error: "Missing or invalid required fields: title, description, and author are required.",
        });
      }

      // Insert into contributes table with sanitized data
      const { data: contributeData, error: contributeError } = await supabase
        .from("contributes")
        .insert({
          title: sanitizedTitle,
          subtitle: sanitizedSubtitle,
          description: sanitizedDescription,
          author: validatedAuthor,
          tags: sanitizedTags || [],
          category: sanitizedCategory,
          cover_image: sanitizedCoverImage,
          pool_enabled: false,
          weekly_score: 0,
          weekly_volume_nop: 0,
        })
        .select()
        .single();

      if (contributeError) {
        console.error("[api/contributes] POST error:", contributeError);
        return res.status(500).json({ error: contributeError.message });
      }

      // Also create a post in social_posts table so it appears in the feed
      const postContent = `${sanitizedTitle}\n\n${sanitizedDescription}`;
      const { error: postError } = await supabase
        .from("social_posts")
        .insert({
          wallet_address: validatedAuthor,
          content: postContent,
          tags: sanitizedTags || [],
          media_urls: sanitizedCoverImage ? [sanitizedCoverImage] : null,
          pool_enabled: false,
          contract_post_id: null,
        });

      if (postError) {
        // Log error but don't fail the request - contribute was created successfully
        console.warn("[api/contributes] Failed to create social post:", postError);
      }

      return res.status(201).setHeader("Content-Type", "application/json").json(contributeData);
    }

    // GET /api/contributes/:id - Fetch single contribute
    if (req.method === "GET" && req.query.id) {
      const { id } = req.query;

      const { data, error } = await supabase
        .from("contributes")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("[api/contributes] GET by id error:", error);
        return res.status(500).json({ error: error.message });
      }

      if (!data) {
        return res.status(404).json({ error: "Contribute not found" });
      }

      return res.status(200).setHeader("Content-Type", "application/json").json(data);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("[api/contributes] Unexpected error:", error);
    // ✅ Don't expose internal error details
    return res.status(500).json({
      error: "Internal server error",
      // Only show details in development
      ...(process.env.NODE_ENV === "development" && {
        details: error instanceof Error ? error.message : String(error),
      }),
    });
  }
},
  {
    requireAuth: false, // Public endpoint, but rate-limited
    rateLimit: true,
    cors: true,
  }
);

