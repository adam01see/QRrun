import { WorldState, ActiveEncounter } from '@/types'
import {
  getPath,
  getBiomeAtKm,
  getCreaturesForBiome,
  getCreature,
  BIOME_DANGER,
} from './world'

const ENCOUNTER_TIMEOUT_DAYS = 3

export interface EngineResult {
  state: WorldState
  arrived: boolean
  encounterTriggered: ActiveEncounter | null
  encounterDefeated: string | null  // creature slug
  timeoutFired: boolean
}

function makeDeadline(): string {
  const d = new Date()
  d.setDate(d.getDate() + ENCOUNTER_TIMEOUT_DAYS)
  return d.toISOString()
}

function rollEncounter(biomeKm: number, dangerRate: number): boolean {
  const chance = 1 - Math.pow(1 - dangerRate, biomeKm)
  return Math.random() < chance
}

function pickCreature(biome: ReturnType<typeof getBiomeAtKm>): string | null {
  const candidates = getCreaturesForBiome(biome)
  if (!candidates.length) return null
  return candidates[Math.floor(Math.random() * candidates.length)].slug
}

// Resolves a timed-out encounter: creature deals damage, then disappears.
// Returns the updated state (unchanged if no timeout).
export function applyEncounterTimeout(state: WorldState): { state: WorldState; fired: boolean } {
  if (!state.encounter) return { state, fired: false }
  if (new Date() <= new Date(state.encounter.deadline)) return { state, fired: false }

  const creature = getCreature(state.encounter.creature_slug)
  const damage = creature?.damage ?? 15
  return {
    state: { ...state, hp: Math.max(0, state.hp - damage), encounter: null },
    fired: true,
  }
}

// Core engine: given a world state and a run's km, returns the new state.
// Pure — no side effects, no DB.
export function processRunKm(state: WorldState, runKm: number): EngineResult {
  const base: EngineResult = {
    state,
    arrived: false,
    encounterTriggered: null,
    encounterDefeated: null,
    timeoutFired: false,
  }

  if (!state.destination_id || !state.origin_id) return base

  // Check timeout before processing run
  const { state: afterTimeout, fired } = applyEncounterTimeout(state)
  let current = afterTimeout
  let remainingKm = runKm
  let encounterDefeated: string | null = null

  // Fight active encounter with this run's km
  if (current.encounter) {
    const enc = current.encounter
    const newDealt = enc.km_dealt + remainingKm

    if (newDealt >= enc.hp_km) {
      remainingKm = newDealt - enc.hp_km
      encounterDefeated = enc.creature_slug
      current = { ...current, encounter: null }
    } else {
      return {
        state: { ...current, encounter: { ...enc, km_dealt: newDealt } },
        arrived: false,
        encounterTriggered: null,
        encounterDefeated: null,
        timeoutFired: fired,
      }
    }
  }

  const path = getPath(current.origin_id!, current.destination_id!)
  if (!path) return { ...base, state: current, timeoutFired: fired }

  const newKmOnPath = current.km_on_path + remainingKm

  // Arrived at destination
  if (newKmOnPath >= path.total_km) {
    return {
      state: {
        ...current,
        current_location_id: current.destination_id,
        origin_id: null,
        destination_id: null,
        km_on_path: 0,
        encounter: null,
      },
      arrived: true,
      encounterTriggered: null,
      encounterDefeated,
      timeoutFired: fired,
    }
  }

  // Roll for encounter at current position in biome
  const biome = getBiomeAtKm(path, newKmOnPath)
  const dangerRate = BIOME_DANGER[biome]
  let newEncounter: ActiveEncounter | null = null

  if (rollEncounter(remainingKm, dangerRate)) {
    const slug = pickCreature(biome)
    if (slug) {
      const creature = getCreaturesForBiome(biome).find(c => c.slug === slug)!
      newEncounter = {
        creature_slug: slug,
        hp_km: creature.hp_km,
        km_dealt: 0,
        started_at: new Date().toISOString(),
        deadline: makeDeadline(),
      }
    }
  }

  return {
    state: { ...current, km_on_path: newKmOnPath, encounter: newEncounter },
    arrived: false,
    encounterTriggered: newEncounter,
    encounterDefeated,
    timeoutFired: fired,
  }
}
