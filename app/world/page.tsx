import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { applyEncounterTimeout } from '@/lib/world-engine'
import {
  getLocation,
  getPath,
  getPathsFrom,
  getCreature,
  BIOME_NAMES,
  BIOME_COLORS,
  getBiomeAtKm,
} from '@/lib/world'
import { WorldState } from '@/types'
import TravelSelector from '@/components/TravelSelector'
import WorldMapSVG from '@/components/WorldMapSVG'
import { Swords, Heart, MapPin, Navigation } from 'lucide-react'

export default async function WorldPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/')

  const supabase = getSupabaseAdmin()

  let { data: worldRow, error: selectErr } = await supabase
    .from('world_state')
    .select('*')
    .eq('user_id', profile.id)
    .maybeSingle()

  if (!worldRow) {
    const { data: created, error: insertErr } = await supabase
      .from('world_state')
      .insert({ user_id: profile.id, current_location_id: 'starting_city', hp: 100 })
      .select()
      .single()

    if (insertErr) {
      const { data: retry } = await supabase
        .from('world_state')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle()
      worldRow = retry
    } else {
      worldRow = created
    }
  }

  if (!worldRow) redirect('/dashboard')

  const { state: worldState, fired } = applyEncounterTimeout(worldRow as WorldState)
  if (fired) {
    await supabase
      .from('world_state')
      .update({ hp: worldState.hp, encounter: null, updated_at: new Date().toISOString() })
      .eq('user_id', profile.id)
  }

  const isTraveling    = !!worldState.destination_id
  const isAtLocation   = !!worldState.current_location_id && !isTraveling
  const hasEncounter   = !!worldState.encounter

  const currentLocation = isAtLocation ? getLocation(worldState.current_location_id!) : null
  const originLocation  = isTraveling  ? getLocation(worldState.origin_id!)           : null
  const destLocation    = isTraveling  ? getLocation(worldState.destination_id!)      : null
  const activePath      = isTraveling && worldState.origin_id && worldState.destination_id
    ? getPath(worldState.origin_id, worldState.destination_id)
    : null

  const creature = hasEncounter ? getCreature(worldState.encounter!.creature_slug) : null

  const currentBiome = activePath
    ? getBiomeAtKm(activePath, worldState.km_on_path)
    : null

  const deadlineDaysLeft = worldState.encounter
    ? Math.max(0, Math.ceil((new Date(worldState.encounter.deadline).getTime() - Date.now()) / 86400000))
    : null

  const travelBase = worldState.current_location_id ?? worldState.origin_id
  const travelOptions = travelBase
    ? getPathsFrom(travelBase).map(path => {
        const neighborId = path.from === travelBase ? path.to : path.from
        return { location: getLocation(neighborId)!, path }
      }).filter(o => o.location)
    : []

  const hpPct = Math.max(0, Math.min(100, worldState.hp))
  const hpColor = hpPct > 60 ? '#4ade80' : hpPct > 30 ? '#facc15' : '#ef4444'

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      <div className="max-w-lg mx-auto px-4 pt-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-zinc-600 text-xs uppercase tracking-widest">World</p>
            <h1 className="text-xl font-bold text-white leading-tight">
              {isAtLocation && currentLocation ? currentLocation.name
                : isTraveling && destLocation ? `→ ${destLocation.name}`
                : 'Journey'}
            </h1>
          </div>
          {/* HP */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5">
              <Heart size={12} className="text-red-400" />
              <span className="text-red-300 text-xs font-bold">{worldState.hp} / 100</span>
            </div>
            <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${hpPct}%`, backgroundColor: hpColor }}
              />
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="mb-4 -mx-4 overflow-hidden">
          <WorldMapSVG
            currentLocationId={worldState.current_location_id}
            originId={worldState.origin_id}
            destinationId={worldState.destination_id}
            kmOnPath={worldState.km_on_path}
            totalKm={activePath?.total_km ?? 0}
            hasEncounter={hasEncounter}
            validDestinationIds={hasEncounter ? [] : travelOptions.map(o => o.location.id)}
          />
        </div>

        {/* Timeout warning */}
        {fired && (
          <div className="bg-red-950/50 border border-red-500/40 rounded-2xl p-4 mb-4">
            <p className="text-red-300 font-semibold text-sm">You fled!</p>
            <p className="text-zinc-400 text-xs mt-1">
              The creature caught up. You took {creature?.damage ?? 15} damage and escaped.
            </p>
          </div>
        )}

        {/* ── ENCOUNTER ──────────────────────────────────────── */}
        {hasEncounter && creature && (
          <div className="relative bg-zinc-900 border border-red-500/40 rounded-2xl p-5 mb-4 overflow-hidden">
            {/* bg glow */}
            <div className="absolute inset-0 bg-red-900/10 pointer-events-none" />
            <div className="relative">
              <div className="flex items-start gap-4 mb-4">
                <span className="text-5xl leading-none">{creature.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Swords size={13} className="text-red-400" />
                    <p className="text-red-300 text-xs font-semibold uppercase tracking-widest">Combat</p>
                  </div>
                  <p className="text-white font-bold text-lg leading-tight">{creature.name}</p>
                  <p className="text-zinc-400 text-xs mt-0.5">{creature.description}</p>
                </div>
              </div>

              {/* Creature HP */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-zinc-500">Creature HP</span>
                  <span className="text-zinc-400 font-mono">
                    {worldState.encounter!.km_dealt.toFixed(1)} / {creature.hp_km} km
                  </span>
                </div>
                <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-2.5 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (worldState.encounter!.km_dealt / creature.hp_km) * 100)}%`,
                      background: 'linear-gradient(90deg, #dc2626, #ef4444)',
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl px-4 py-2.5">
                <p className="text-zinc-300 text-sm">
                  Run <span className="text-white font-bold">
                    {(creature.hp_km - worldState.encounter!.km_dealt).toFixed(1)} km
                  </span> to defeat
                </p>
                <p className={`text-xs font-semibold ${deadlineDaysLeft === 0 ? 'text-red-400' : deadlineDaysLeft === 1 ? 'text-yellow-400' : 'text-zinc-500'}`}>
                  {deadlineDaysLeft === 0 ? '⚠ Last day' : `${deadlineDaysLeft}d left`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── TRAVELING, NO ENCOUNTER ────────────────────────── */}
        {isTraveling && !hasEncounter && activePath && originLocation && destLocation && (
          <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Navigation size={13} className="text-blue-400" />
              <p className="text-zinc-400 text-xs">
                <span className="text-zinc-300 font-medium">{originLocation.name}</span>
                {' → '}
                <span className="text-blue-300 font-medium">{destLocation.name}</span>
              </p>
            </div>

            {/* Progress */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-zinc-500">
                  {currentBiome && (
                    <span className={BIOME_COLORS[currentBiome]}>{BIOME_NAMES[currentBiome]}</span>
                  )}
                </span>
                <span className="text-zinc-400 font-mono">
                  {worldState.km_on_path.toFixed(1)} / {activePath.total_km} km
                </span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (worldState.km_on_path / activePath.total_km) * 100)}%`,
                    background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                  }}
                />
              </div>
            </div>

            <p className="text-zinc-500 text-xs text-center">
              {(activePath.total_km - worldState.km_on_path).toFixed(1)} km remaining — sync after your next run
            </p>
          </div>
        )}

        {/* Change destination — shown when traveling without encounter */}
        {isTraveling && !hasEncounter && travelOptions.length > 0 && (
          <div className="mb-4">
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mb-2.5 px-1">
              Change destination
            </p>
            <TravelSelector destinations={travelOptions} currentDestinationId={worldState.destination_id} />
          </div>
        )}

        {/* ── AT LOCATION ────────────────────────────────────── */}
        {isAtLocation && currentLocation && (
          <>
            <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={12} className="text-green-400" />
                <p className="text-green-400 text-xs font-semibold uppercase tracking-widest">You are here</p>
              </div>
              <p className="text-zinc-400 text-sm">{currentLocation.description}</p>
            </div>

            <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mb-2.5 px-1">
              Choose your path
            </p>
            <TravelSelector destinations={travelOptions} />
          </>
        )}

      </div>
    </div>
  )
}
