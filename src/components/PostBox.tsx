import { useState } from "react";

import SmartButton from "@/components/SmartButton";
import { createPost } from "@/lib/actions";

export default function PostBox({ userId }: { userId?: string }) {
  const [text, setText] = useState("");

  const submit = async () => {
    const value = text.trim();
    if (!value) {
      throw new Error("Write something");
    }

    if (!userId) {
      console.warn("PostBox invoked without userId; relying on Supabase session");
    }

    await createPost(value);
    setText("");
  };

  return (
    <div className="p-3 border rounded" data-action="post-box">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Write your contribution..."
        className="w-full h-24 border p-2"
      />
      <SmartButton onClick={submit} className="mt-2 px-4 py-2 border rounded">
        Post
      </SmartButton>
    </div>
  );
}
