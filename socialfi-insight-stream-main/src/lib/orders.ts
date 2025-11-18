import { getSupabase } from '@/lib/supabaseClient'

export async function logInvestmentBuy(postId: number, amount: number, txHash?: string) {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase yok')
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) throw new Error('Giriş yok')
  await sb.from('investment_orders').insert({
    user_id: user.id,
    post_id: postId,
    type: 'buy',
    amount_nop: amount,
    tx_hash: txHash || null,
  })
  await sb.from('user_task_rewards').upsert(
    {
      user_id: user.id,
      task_key: 'deposit',
      reward_nop: 5000,
      completed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,task_key' },
  )
}

export async function setPostInvestable(postId: number, investable: boolean, open: boolean) {
  const sb = getSupabase()
  if (!sb) throw new Error('Supabase yok')
  const { error: e1 } = await sb
    .from('posts')
    .update({ is_investable: investable, invest_open: open })
    .eq('id', postId)
  if (e1) throw new Error(e1.message)
  if (investable) {
    await sb.from('investment_items').upsert({ post_id: postId }, { onConflict: 'post_id' })
  }
}
