import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).json({});
  }

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
      const { title, subtitle, description, author, tags, category, coverImage } = req.body;

      if (!title || !description || !author) {
        return res.status(400).json({
          error: "Missing required fields: title, description, and author are required.",
        });
      }

      // Validate author is a valid wallet address
      if (!/^0x[a-fA-F0-9]{40}$/.test(author)) {
        return res.status(400).json({
          error: "Invalid wallet address format.",
        });
      }

      const { data, error } = await supabase
        .from("contributes")
        .insert({
          title: title.trim(),
          subtitle: subtitle?.trim() || null,
          description: description.trim(),
          author: author.toLowerCase(),
          tags: tags || [],
          category: category || "trading",
          cover_image: coverImage || null,
          pool_enabled: false,
          weekly_score: 0,
          weekly_volume_nop: 0,
        })
        .select()
        .single();

      if (error) {
        console.error("[api/contributes] POST error:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).setHeader("Content-Type", "application/json").json(data);
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
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}

