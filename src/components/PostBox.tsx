import { useState } from 'react'

import { supabase } from '@/lib/supabaseClient'

export default function PostBox({ userId }: { userId: string }) {
  const [text, setText] = useState('')

  const submit = async () => {
    if (!text.trim()) return

    const { error } = await supabase.from('posts').insert({ text, author_id: userId })

    if (error) {
      alert(error.message)
    } else {
      setText('')
    }
  }

  return (
    <div className="p-3 border rounded">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your contribution..."
        className="w-full h-24 border p-2"
      />
      <button onClick={submit} className="mt-2 px-4 py-2 border rounded">
        Post
      </button>
    </div>
  )
}
