import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { targetUserId } = await req.json()
  if (!targetUserId) return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 })
  if (targetUserId === profile.id) return NextResponse.json({ error: 'Cannot pair with yourself' }, { status: 400 })

  const supabase = getSupabaseAdmin()

  // Verify target user exists
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('id, firstname, lastname')
    .eq('id', targetUserId)
    .single()

  if (!targetProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const today = new Date().toISOString().split('T')[0]

  // Upsert pairing — reset to active if they pair again today
  await supabase
    .from('run_pairings')
    .upsert(
      {
        user1_id: profile.id,
        user2_id: targetUserId,
        paired_date: today,
        status: 'active',
      },
      { onConflict: 'user1_id,user2_id,paired_date' }
    )

  return NextResponse.json({
    success: true,
    partner: `${targetProfile.firstname} ${targetProfile.lastname}`,
  })
}
