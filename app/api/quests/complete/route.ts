import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { ALL_QUESTS } from '@/lib/quests'

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { quest_slug } = await req.json()
  if (!quest_slug) return NextResponse.json({ error: 'Missing quest_slug' }, { status: 400 })

  const supabase = getSupabaseAdmin()

  const { data: existing } = await supabase
    .from('user_quests')
    .select('*')
    .eq('user_id', profile.id)
    .eq('quest_slug', quest_slug)
    .single()

  if (existing?.status === 'completed') {
    return NextResponse.json({ error: 'Already completed' }, { status: 409 })
  }

  const codeDef = ALL_QUESTS.find((q) => q.slug === quest_slug)
  let xpReward = codeDef?.xp_reward ?? 0

  if (!xpReward) {
    const { data: quest } = await supabase
      .from('quests')
      .select('xp_reward')
      .eq('slug', quest_slug)
      .single()
    xpReward = quest?.xp_reward ?? 0
  }

  await supabase.from('user_quests').upsert({
    user_id: profile.id,
    quest_slug,
    status: 'completed',
    progress: 1,
    completed_at: new Date().toISOString(),
  }, { onConflict: 'user_id,quest_slug' })

  await supabase
    .from('profiles')
    .update({ total_xp: profile.total_xp + xpReward })
    .eq('id', profile.id)

  return NextResponse.json({ success: true, xp_earned: xpReward })
}
