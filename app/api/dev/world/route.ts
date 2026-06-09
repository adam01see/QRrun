import { NextRequest, NextResponse } from 'next/server'
import { getCurrentProfile } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getCreature, getPath, getPathsFrom } from '@/lib/world'
import { processRunKm } from '@/lib/world-engine'
import { CAMPAIGN_ADVANCE_MAP } from '@/lib/campaign'
import { WorldState } from '@/types'

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const profile = await getCurrentProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, payload } = await req.json()
  const supabase = getSupabaseAdmin()

  if (action === 'teleport') {
    await supabase
      .from('world_state')
      .update({
        current_location_id: payload.location_id,
        origin_id: null,
        destination_id: null,
        km_on_path: 0,
        encounter: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile.id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'set_campaign_step') {
    await supabase
      .from('world_state')
      .update({ campaign_step: payload.step, updated_at: new Date().toISOString() })
      .eq('user_id', profile.id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'trigger_encounter') {
    const creature = getCreature(payload.creature_slug)
    if (!creature) return NextResponse.json({ error: 'Unknown creature' }, { status: 400 })

    const deadline = new Date()
    deadline.setDate(deadline.getDate() + 3)

    // If at a location, auto-start travel to a neighbor so encounter makes sense
    const { data: ws } = await supabase.from('world_state').select('*').eq('user_id', profile.id).single()
    const travelUpdate: Record<string, any> = {}
    if (ws?.current_location_id && !ws.destination_id) {
      const paths = getPathsFrom(ws.current_location_id)
      if (paths.length) {
        const path = paths[0]
        const neighborId = path.from === ws.current_location_id ? path.to : path.from
        travelUpdate.origin_id = ws.current_location_id
        travelUpdate.destination_id = neighborId
        travelUpdate.current_location_id = null
        travelUpdate.km_on_path = 1
      }
    }

    await supabase
      .from('world_state')
      .update({
        ...travelUpdate,
        encounter: {
          creature_slug: creature.slug,
          hp_km: creature.hp_km,
          km_dealt: 0,
          started_at: new Date().toISOString(),
          deadline: deadline.toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile.id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'simulate_run') {
    const km: number = payload.km ?? 1
    const { data: ws } = await supabase.from('world_state').select('*').eq('user_id', profile.id).single()
    if (!ws) return NextResponse.json({ error: 'No world state' }, { status: 400 })

    let worldState = ws as WorldState
    let campaignStep: number = ws.campaign_step ?? 0

    const result = processRunKm(worldState, km)
    worldState = result.state

    if (result.arrived && worldState.current_location_id) {
      const nextStep = CAMPAIGN_ADVANCE_MAP[worldState.current_location_id]
      if (nextStep !== undefined && nextStep > campaignStep) {
        campaignStep = nextStep
      }
    }

    await supabase
      .from('world_state')
      .update({
        ...worldState,
        campaign_step: campaignStep,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile.id)

    return NextResponse.json({
      ok: true,
      arrived: result.arrived,
      encounterDefeated: result.encounterDefeated,
      encounterTriggered: result.encounterTriggered?.creature_slug ?? null,
      campaignStep,
    })
  }

  if (action === 'set_hp') {
    await supabase
      .from('world_state')
      .update({ hp: payload.hp, updated_at: new Date().toISOString() })
      .eq('user_id', profile.id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'clear_encounter') {
    await supabase
      .from('world_state')
      .update({ encounter: null, updated_at: new Date().toISOString() })
      .eq('user_id', profile.id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'reset') {
    await supabase
      .from('world_state')
      .update({
        current_location_id: 'starting_city',
        origin_id: null,
        destination_id: null,
        km_on_path: 0,
        hp: 100,
        encounter: null,
        campaign_step: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', profile.id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
