import { getSupabase, SUPABASE_ENV_WARNING } from "@/lib/supabaseClient";

export async function createPost(text: string) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error(SUPABASE_ENV_WARNING);
  }
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  const user = authData.user;
  if (!user) {
    throw new Error("Please sign in first.");
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({ text, author_id: user.id })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function ratePost(post_id: number, score: number) {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error(SUPABASE_ENV_WARNING);
  }
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(authError.message);
  }

  const user = authData.user;
  if (!user) {
    throw new Error("Please sign in first.");
  }

  const { data, error } = await supabase
    .from("ratings")
    .upsert({ post_id, rater_id: user.id, score })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
