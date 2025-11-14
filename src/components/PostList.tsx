import { useEffect, useState } from "react";

import { getSupabase } from "@/lib/supabaseClient";
import SupabaseConfigAlert from "@/components/SupabaseConfigAlert";

type Post = {
  id: number
  text: string
  created_at: string
}

export default function PostList() {
  const supabase = getSupabase();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) return;

        setPosts(data ?? []);
      });
  }, [supabase]);

  if (!supabase) {
    return (
      <SupabaseConfigAlert context="Community posts require Supabase. Ask an admin to add the missing env vars." />
    );
  }

  if (posts.length === 0) {
    return (
      <div className="space-y-3">
        <div className="rounded border border-dashed border-slate-200 p-4 text-sm text-slate-500">
          Posts will appear here once published.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div key={post.id} className="rounded border p-3">
          <div className="text-sm opacity-70">
            {new Date(post.created_at).toLocaleString()}
          </div>
          <div>{post.text}</div>
        </div>
      ))}
    </div>
  );
}
