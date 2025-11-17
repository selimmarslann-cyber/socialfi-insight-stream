// DEPRECATED: Legacy component from an earlier iteration of the feed UI.
// Not used in the current NOP Intelligence Layer core flows (PHASE 2).
import { useEffect, useState } from 'react'

import { supabase } from '@/lib/supabaseClient'

type Post = {
  id: number
  text: string
  created_at: string
}

export default function PostList() {
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    if (!supabase) {
      return
    }

    supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) return

        setPosts(data ?? [])
      })
  }, [])

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div key={post.id} className="p-3 border rounded">
          <div className="text-sm opacity-70">{new Date(post.created_at).toLocaleString()}</div>
          <div>{post.text}</div>
        </div>
      ))}
    </div>
  )
}
