'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const LOCATIONS = [
  { id: 'starting_city',     name: 'Starting City'         },
  { id: 'dwarfs_kingdom',    name: 'Dwarfs Kingdom'        },
  { id: 'house_of_druid',    name: 'House of the Druid'    },
  { id: 'magic_forest',      name: 'Magic Forest'          },
  { id: 'village_of_elfs',   name: 'Village of Elfs'       },
  { id: 'mountain_of_sun',   name: 'Mountain of the Sun'   },
  { id: 'city_of_outsiders', name: 'City of Outsiders'     },
]

const CREATURES = [
  { slug: 'stray_dog',   name: 'Stray Dog',       stats: '1 km · 5 dmg'  },
  { slug: 'bandit',      name: 'Bandit',           stats: '3 km · 10 dmg' },
  { slug: 'skeleton',    name: 'Skeleton',         stats: '2 km · 8 dmg'  },
  { slug: 'wolf',        name: 'Wolf',             stats: '3 km · 12 dmg' },
  { slug: 'dark_witch',  name: 'Dark Witch',       stats: '8 km · 20 dmg' },
  { slug: 'fairy',       name: 'Mischief Fairy',   stats: '1 km · 5 dmg'  },
  { slug: 'will_o_wisp', name: "Will-o'-Wisp",     stats: '3 km · 10 dmg' },
  { slug: 'treant',      name: 'Treant',           stats: '7 km · 18 dmg' },
  { slug: 'leech_swarm', name: 'Leech Swarm',      stats: '4 km · 12 dmg' },
  { slug: 'swamp_troll', name: 'Swamp Troll',      stats: '6 km · 15 dmg' },
  { slug: 'scorpion',    name: 'Giant Scorpion',   stats: '2 km · 8 dmg'  },
  { slug: 'sand_wyrm',   name: 'Sand Wyrm',        stats: '15 km · 30 dmg'},
  { slug: 'eagle',       name: 'Mountain Eagle',   stats: '2 km · 8 dmg'  },
  { slug: 'golem',       name: 'Stone Golem',      stats: '10 km · 25 dmg'},
  { slug: 'stone_giant', name: 'Stone Giant',      stats: '12 km · 30 dmg'},
]

async function call(action: string, payload: object = {}) {
  const res = await fetch('/api/dev/world', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? res.statusText)
  return json
}

export default function DevTools() {
  const router = useRouter()
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null)
  const [hp, setHp] = useState(100)
  const [km, setKm] = useState(1)

  async function run(action: string, payload: object = {}) {
    setStatus({ text: '...', ok: true })
    try {
      const result = await call(action, payload)
      let msg = 'ok'
      if (result.arrived)            msg = 'Arrived at destination!'
      if (result.encounterDefeated)  msg = `Defeated ${result.encounterDefeated}!`
      if (result.encounterTriggered) msg = `Encounter: ${result.encounterTriggered}`
      if (result.campaignStep !== undefined) msg += `  ·  campaign step ${result.campaignStep}`
      setStatus({ text: msg, ok: true })
      router.refresh()
    } catch (e: any) {
      setStatus({ text: e.message, ok: false })
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 pb-24">
      <div className="max-w-lg mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-red-400 text-xs font-semibold uppercase tracking-widest">Dev Tools</p>
            <h1 className="text-2xl font-bold">World State</h1>
          </div>
          <a href="/dashboard" className="text-zinc-500 text-sm hover:text-white transition-colors">
            → Dashboard
          </a>
        </div>

        {status && (
          <div className={`rounded-xl px-4 py-2.5 mb-5 text-sm font-mono ${status.ok ? 'bg-green-900/30 text-green-400 border border-green-500/20' : 'bg-red-900/30 text-red-400 border border-red-500/20'}`}>
            {status.text}
          </div>
        )}

        {/* Simulate run */}
        <section className="mb-6">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-2">Simulate run</p>
          <p className="text-zinc-600 text-xs mb-3">Processes km through the world engine — deals damage to encounter, advances travel, triggers arrival.</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0.1}
              step={0.5}
              value={km}
              onChange={e => setKm(Number(e.target.value))}
              className="bg-zinc-900 border border-zinc-800/60 rounded-xl px-4 py-2 text-white text-sm w-24 focus:outline-none focus:border-zinc-600"
            />
            <span className="text-zinc-500 text-sm">km</span>
            <button
              onClick={() => run('simulate_run', { km })}
              className="bg-blue-900/40 border border-blue-500/30 rounded-xl px-5 py-2 text-sm text-blue-300 hover:border-blue-500/60 transition-colors"
            >
              Run
            </button>
          </div>
        </section>

        {/* Trigger encounter */}
        <section className="mb-6">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-2">Trigger encounter</p>
          <p className="text-zinc-600 text-xs mb-3">Spawns a creature. If at a location, auto-starts travel to a neighbor first.</p>
          <div className="flex flex-col gap-1.5">
            {CREATURES.map(c => (
              <button
                key={c.slug}
                onClick={() => run('trigger_encounter', { creature_slug: c.slug })}
                className="text-left bg-zinc-900 border border-zinc-800/60 rounded-xl px-4 py-2.5 text-sm hover:border-red-500/30 transition-colors flex items-center justify-between"
              >
                <span className="text-white">{c.name}</span>
                <span className="text-zinc-500 text-xs font-mono">{c.stats}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Teleport */}
        <section className="mb-6">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-2">Teleport to location</p>
          <div className="flex flex-col gap-1.5">
            {LOCATIONS.map(loc => (
              <button
                key={loc.id}
                onClick={() => run('teleport', { location_id: loc.id })}
                className="text-left bg-zinc-900 border border-zinc-800/60 rounded-xl px-4 py-2.5 text-sm text-white hover:border-zinc-600 transition-colors"
              >
                {loc.name}
              </button>
            ))}
          </div>
        </section>

        {/* Campaign step */}
        <section className="mb-6">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-2">Set campaign step (0–6)</p>
          <div className="flex flex-wrap gap-1.5">
            {[0,1,2,3,4,5,6].map(step => (
              <button
                key={step}
                onClick={() => run('set_campaign_step', { step })}
                className="bg-zinc-900 border border-zinc-800/60 rounded-xl px-4 py-2 text-sm text-white hover:border-zinc-600 transition-colors"
              >
                {step}
              </button>
            ))}
          </div>
        </section>

        {/* HP */}
        <section className="mb-6">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-2">Set HP</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={100}
              value={hp}
              onChange={e => setHp(Number(e.target.value))}
              className="bg-zinc-900 border border-zinc-800/60 rounded-xl px-4 py-2 text-white text-sm w-24 focus:outline-none focus:border-zinc-600"
            />
            <button
              onClick={() => run('set_hp', { hp })}
              className="bg-zinc-900 border border-zinc-800/60 rounded-xl px-4 py-2 text-sm text-white hover:border-zinc-600 transition-colors"
            >
              Apply
            </button>
          </div>
        </section>

        {/* Misc */}
        <section className="mb-6">
          <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-2">Misc</p>
          <div className="flex gap-2">
            <button
              onClick={() => run('clear_encounter')}
              className="bg-zinc-900 border border-zinc-800/60 rounded-xl px-4 py-2 text-sm text-white hover:border-zinc-600 transition-colors"
            >
              Clear encounter
            </button>
            <button
              onClick={() => run('reset')}
              className="bg-red-950/40 border border-red-500/20 rounded-xl px-4 py-2 text-sm text-red-400 hover:border-red-500/40 transition-colors"
            >
              Reset world
            </button>
          </div>
        </section>

      </div>
    </div>
  )
}
