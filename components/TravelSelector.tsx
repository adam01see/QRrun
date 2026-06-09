'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WorldLocation, WorldPath } from '@/types'
import { BIOME_NAMES, BIOME_COLORS } from '@/lib/world'
import { ChevronRight, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  destinations: { location: WorldLocation; path: WorldPath }[]
  currentDestinationId?: string | null
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const EASE = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]

const item = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.22, ease: EASE } },
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
    <motion.div className="flex flex-col gap-2" variants={container} initial="hidden" animate="show">
      {destinations.map(({ location, path }) => {
        const biome = path.segments[0].biome
        const isCurrent = location.id === currentDestinationId
        const isLoading = loading === location.id
        return (
          <motion.button
            key={location.id}
            variants={item}
            whileTap={!isCurrent && !loading ? { scale: 0.97 } : undefined}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
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
              : isLoading
              ? <Loader2 size={15} className="text-zinc-400 animate-spin" />
              : <ChevronRight size={16} className="text-zinc-600" />
            }
          </motion.button>
        )
      })}
    </motion.div>
  )
}
