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
import { formatDistance, formatTime } from '@/lib/xp'
import XPBar from '@/components/XPBar'
import ActivityList from '@/components/ActivityList'
import SyncButton from '@/components/SyncButton'
import TravelSelector from '@/components/TravelSelector'
import WorldMapSVG from '@/components/WorldMapSVG'
import { Activity, WorldState } from '@/types'
import { getCampaignStep } from '@/lib/campaign'
import { Swords, Heart, MapPin, Navigation, ScrollText } from 'lucide-react'

export default async function DashboardPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/')

  const supabase = getSupabaseAdmin()

  const [{ data: activitiesRaw }, worldResult] = await Promise.all([
    supabase.from('activities').select('*').eq('user_id', profile.id).order('start_date', { ascending: false }),
    supabase.from('world_state').select('*').eq('user_id', profile.id).maybeSingle(),
  ])

  const activities: Activity[] = activitiesRaw ?? []
  const recentActivities = activities.slice(0, 8)
  const totalDistance = activities.reduce((s, a) => s + a.distance, 0)
  const totalTime = activities.reduce((s, a) => s + a.moving_time, 0)

  // Bootstrap world state if first visit
  let worldRow = worldResult.data
  if (!worldRow) {
    const { data: created } = await supabase
      .from('world_state')
      .insert({ user_id: profile.id, current_location_id: 'starting_city', hp: 100 })
      .select()
      .single()
    worldRow = created
  }

  const { state: worldState, fired } = worldRow
    ? applyEncounterTimeout(worldRow as WorldState)
    : { state: null, fired: false }

  if (fired && worldState) {
    await supabase
      .from('world_state')
      .update({ hp: worldState.hp, encounter: null, updated_at: new Date().toISOString() })
      .eq('user_id', profile.id)
  }

  const isTraveling  = !!worldState?.destination_id
  const isAtLocation = !!worldState?.current_location_id && !isTraveling
  const hasEncounter = !!worldState?.encounter

  const currentLocation = isAtLocation ? getLocation(worldState!.current_location_id!) : null
  const originLocation  = isTraveling  ? getLocation(worldState!.origin_id!)           : null
  const destLocation    = isTraveling  ? getLocation(worldState!.destination_id!)      : null
  const activePath      = isTraveling && worldState!.origin_id && worldState!.destination_id
    ? getPath(worldState!.origin_id, worldState!.destination_id)
    : null

  const creature = hasEncounter ? getCreature(worldState!.encounter!.creature_slug) : null
  const currentBiome = activePath ? getBiomeAtKm(activePath, worldState!.km_on_path) : null

  const deadlineDaysLeft = worldState?.encounter
    ? Math.max(0, Math.ceil((new Date(worldState.encounter.deadline).getTime() - Date.now()) / 86400000))
    : null

  const travelBase = worldState?.current_location_id ?? worldState?.origin_id
  const travelOptions = travelBase
    ? getPathsFrom(travelBase).map(path => {
        const neighborId = path.from === travelBase ? path.to : path.from
        return { location: getLocation(neighborId)!, path }
      }).filter(o => o.location)
    : []

  const hpPct      = worldState ? Math.max(0, Math.min(100, worldState.hp)) : 0
  const hpColor    = hpPct > 60 ? '#4ade80' : hpPct > 30 ? '#facc15' : '#ef4444'
  const questStep  = getCampaignStep(worldState?.campaign_step ?? 0)
  const isComplete = (worldState?.campaign_step ?? 0) >= 6

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-zinc-500 text-sm">Welcome back</p>
            <h1 className="text-2xl font-bold text-white">{profile.firstname}</h1>
          </div>
          <SyncButton />
        </div>

        {/* XP Bar */}
        <div className="mb-4">
          <XPBar totalXP={profile.total_xp} level={profile.level} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Distance', value: formatDistance(totalDistance) },
            { label: 'Activities', value: `${activities.length}` },
            { label: 'Time', value: formatTime(totalTime) },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-3 text-center">
              <p className="text-white font-bold text-base">{s.value}</p>
              <p className="text-zinc-600 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── CAMPAIGN QUEST ────────────────────────────────────── */}
        {worldState && (
          <div className={`rounded-2xl p-4 mb-4 border ${isComplete ? 'bg-yellow-500/8 border-yellow-500/20' : 'bg-zinc-900 border-zinc-800/60'}`}>
            <div className="flex items-center gap-2 mb-2">
              <ScrollText size={13} className={isComplete ? 'text-yellow-400' : 'text-amber-400'} />
              <p className={`text-xs font-semibold uppercase tracking-widest ${isComplete ? 'text-yellow-400' : 'text-amber-400'}`}>
                {isComplete ? 'Campaign Complete' : `Quest — ${questStep.npc} · ${questStep.npc_location}`}
              </p>
            </div>
            <p className="text-white text-sm font-semibold mb-1">{questStep.title}</p>
            <p className="text-zinc-400 text-xs leading-relaxed mb-3">"{questStep.dialogue}"</p>
            {!isComplete && (
              <div className="flex items-center gap-2 bg-zinc-800/60 rounded-xl px-3 py-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <p className="text-zinc-300 text-xs font-medium">{questStep.objective}</p>
              </div>
            )}
          </div>
        )}

        {/* ── WORLD MAP ─────────────────────────────────────────── */}
        {worldState && (
          <div className="mb-4">
            {/* World header with HP */}
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
                {isAtLocation && currentLocation ? currentLocation.name
                  : isTraveling && destLocation ? `→ ${destLocation.name}`
                  : 'World'}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${hpPct}%`, backgroundColor: hpColor }} />
                </div>
                <div className="flex items-center gap-1">
                  <Heart size={10} className="text-red-400" />
                  <span className="text-red-300 text-xs font-bold">{worldState.hp} / 100</span>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="-mx-4 mb-3 overflow-hidden">
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
              <div className="bg-red-950/50 border border-red-500/40 rounded-2xl p-4 mb-3">
                <p className="text-red-300 font-semibold text-sm">You fled!</p>
                <p className="text-zinc-400 text-xs mt-1">
                  The creature caught up. You took {creature?.damage ?? 15} damage and escaped.
                </p>
              </div>
            )}

            {/* Encounter */}
            {hasEncounter && creature && (
              <div className="relative bg-zinc-900 border border-red-500/40 rounded-2xl p-5 mb-3 overflow-hidden">
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

            {/* Traveling */}
            {isTraveling && !hasEncounter && activePath && originLocation && destLocation && (
              <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 mb-3">
                <div className="flex items-center gap-2 mb-3">
                  <Navigation size={13} className="text-blue-400" />
                  <p className="text-zinc-400 text-xs">
                    <span className="text-zinc-300 font-medium">{originLocation.name}</span>
                    {' → '}
                    <span className="text-blue-300 font-medium">{destLocation.name}</span>
                  </p>
                </div>
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

            {/* Change destination while traveling */}
            {isTraveling && !hasEncounter && travelOptions.length > 0 && (
              <div className="mb-3">
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mb-2.5 px-1">Change destination</p>
                <TravelSelector destinations={travelOptions} currentDestinationId={worldState.destination_id} />
              </div>
            )}

            {/* At location */}
            {isAtLocation && currentLocation && (
              <>
                <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin size={12} className="text-green-400" />
                    <p className="text-green-400 text-xs font-semibold uppercase tracking-widest">You are here</p>
                  </div>
                  <p className="text-zinc-400 text-sm">{currentLocation.description}</p>
                </div>
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mb-2.5 px-1">Choose your path</p>
                <TravelSelector destinations={travelOptions} />
              </>
            )}
          </div>
        )}

        {/* ── RECENT ACTIVITIES ─────────────────────────────────── */}
        <div>
          <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3">Recent Activities</p>
          <ActivityList activities={recentActivities} />
        </div>

      </div>
    </div>
  )
}
