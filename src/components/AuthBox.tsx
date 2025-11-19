import { useState } from "react";

import { supabase, supabaseAdminHint } from "@/lib/supabaseClient";

type AuthBoxProps = {
  onAuthed: (id: string) => void;
};

export default function AuthBox({ onAuthed }: AuthBoxProps) {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const signup = async () => {
    if (!supabase) {
      alert(supabaseAdminHint);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
    });

    if (error) {
      alert(error.message);
    } else if (data.user) {
      onAuthed(data.user.id);
    }
  };

  const signin = async () => {
    if (!supabase) {
      alert(supabaseAdminHint);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      alert(error.message);
    } else if (data.user) {
      onAuthed(data.user.id);
    }
  };

  return (
    <div className="border p-3 rounded space-y-2">
      <input
        className="border p-2 w-full"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="border p-2 w-full"
        placeholder="password"
        type="password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
      />
      <div className="flex gap-2">
        <button onClick={signup} className="px-3 py-2 border rounded">
          Sign up
        </button>
        <button onClick={signin} className="px-3 py-2 border rounded">
          Sign in
        </button>
      </div>
    </div>
  );
}
