import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getPath } from '@/lib/world'
import { WorldState } from '@/types'

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { destination_id } = await req.json()
  if (!destination_id) return NextResponse.json({ error: 'destination_id required' }, { status: 400 })

  const supabase = getSupabaseAdmin()

  const { data: existing } = await supabase
    .from('world_state')
    .select('*')
    .eq('user_id', profile.id)
    .single()

  const state: WorldState = existing ?? {
    id: '',
    user_id: profile.id,
    current_location_id: 'starting_city',
    origin_id: null,
    destination_id: null,
    km_on_path: 0,
    hp: 100,
    encounter: null,
    last_activity_processed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (state.encounter) {
    return NextResponse.json({ error: 'Defeat the creature first' }, { status: 400 })
  }

  // Origin is current location (at rest) or the origin of the current journey (mid-travel)
  const originId = state.current_location_id ?? state.origin_id
  if (!originId) {
    return NextResponse.json({ error: 'Cannot determine origin' }, { status: 400 })
  }

  // Don't allow selecting the same destination again
  if (state.destination_id === destination_id) {
    return NextResponse.json({ error: 'Already heading there' }, { status: 400 })
  }

  const path = getPath(originId, destination_id)
  if (!path) {
    return NextResponse.json({ error: 'No path to that location' }, { status: 400 })
  }

  const update = {
    user_id: profile.id,
    origin_id: originId,
    destination_id,
    current_location_id: null,
    km_on_path: 0,
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    await supabase.from('world_state').update(update).eq('user_id', profile.id)
  } else {
    await supabase.from('world_state').insert({ ...state, ...update })
  }

  return NextResponse.json({ ok: true })
}
