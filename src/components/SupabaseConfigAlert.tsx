import { SUPABASE_ENV_WARNING } from '@/lib/supabaseClient'

type Props = {
  context?: string
}

export default function SupabaseConfigAlert({ context }: Props) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
      <div className="font-semibold">Supabase configuration missing</div>
      {context ? <div className="mt-1 text-xs text-amber-800">{context}</div> : null}
      <p className="mt-2 text-xs text-amber-700">{SUPABASE_ENV_WARNING}</p>
    </div>
  )
}
