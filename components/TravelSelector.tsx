'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WorldLocation, WorldPath } from '@/types'
import { BIOME_NAMES, BIOME_COLORS } from '@/lib/world'
import { ChevronRight } from 'lucide-react'

interface Props {
  destinations: { location: WorldLocation; path: WorldPath }[]
  currentDestinationId?: string | null
}

export default function TravelSelector({ destinations, currentDestinationId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function startTravel(destinationId: string) {
    setLoading(destinationId)
    const res = await fetch('/api/world/start-travel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination_id: destinationId }),
    })
    if (res.ok) {
      router.refresh()
      setLoading(null)
    } else {
      const { error } = await res.json()
      alert(error)
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {destinations.map(({ location, path }) => {
        const biome = path.segments[0].biome
        const isCurrent = location.id === currentDestinationId
        return (
          <button
            key={location.id}
            onClick={() => startTravel(location.id)}
            disabled={!!loading || isCurrent}
            className={`flex items-center gap-3 rounded-2xl p-4 text-left transition-colors border
              ${isCurrent
                ? 'bg-blue-950/40 border-blue-500/50 cursor-default'
                : 'bg-zinc-900 border-zinc-800/60 hover:border-zinc-700 disabled:opacity-50'
              }`}
          >
            <span className="text-2xl">{location.icon}</span>
            <div className="flex-1">
              <p className={`font-semibold text-sm ${isCurrent ? 'text-blue-300' : 'text-white'}`}>
                {location.name}
              </p>
              <p className={`text-xs mt-0.5 ${BIOME_COLORS[biome]}`}>
                {BIOME_NAMES[biome]} · {path.total_km} km
              </p>
            </div>
            {isCurrent
              ? <span className="text-blue-400 text-xs font-semibold">Selected</span>
              : <ChevronRight size={16} className="text-zinc-600" />
            }
          </button>
        )
      })}
    </div>
  )
}
