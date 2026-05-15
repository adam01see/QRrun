'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  currentLocationId: string | null
  originId: string | null
  destinationId: string | null
  kmOnPath: number
  totalKm: number
  hasEncounter: boolean
  validDestinationIds: string[]
}

// Pixel coordinates from the 1254x1254 source image
const POS: Record<string, { x: number; y: number }> = {
  dwarfs_kingdom:    { x: 643,  y: 193  },
  starting_city:     { x: 643,  y: 405  },
  house_of_druid:    { x: 149,  y: 619  },
  village_of_elfs:   { x: 615,  y: 624  },
  mountain_of_sun:   { x: 1093, y: 613  },
  city_of_outsiders: { x: 615,  y: 1149 },
  magic_forest:      { x: 1063, y: 374  },
}

const LABELS: Record<string, string> = {
  dwarfs_kingdom:    'Dwarfs Kingdom',
  starting_city:     'Starting City',
  house_of_druid:    'House of the Druid',
  village_of_elfs:   'Village of Elfs',
  mountain_of_sun:   'Mountain of the Sun',
  city_of_outsiders: 'City of Outsiders',
  magic_forest:      'Magic Forest',
}

// Estimate label box width from character count
function labelW(text: string) { return text.length * 12 + 28 }
const LABEL_H = 30
const DOT_R   = 14
const LABEL_GAP = 8   // gap between dot bottom and label top


function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function getPlayerPos(originId: string, destinationId: string, kmOnPath: number, totalKm: number) {
  const from = POS[originId]
  const to   = POS[destinationId]
  if (!from || !to) return null
  const t = Math.min(kmOnPath / totalKm, 1)
  return { x: lerp(from.x, to.x, t), y: lerp(from.y, to.y, t) }
}

export default function WorldMapSVG({
  currentLocationId,
  originId,
  destinationId,
  kmOnPath,
  totalKm,
  hasEncounter,
  validDestinationIds,
}: Props) {
  const router = useRouter()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selecting, setSelecting] = useState<string | null>(null)

  async function handleLocationClick(locationId: string) {
    if (selecting || !validDestinationIds.includes(locationId)) return
    setSelecting(locationId)
    const res = await fetch('/api/world/start-travel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination_id: locationId }),
    })
    if (res.ok) router.refresh()
    setSelecting(null)
  }

  const playerPos = originId && destinationId && totalKm > 0
    ? getPlayerPos(originId, destinationId, kmOnPath, totalKm)
    : currentLocationId
      ? POS[currentLocationId]
      : null

  const SIZE = 1254

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="w-full rounded-xl"
      style={{ display: 'block' }}
    >
      <defs>
        <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Map background */}
      <image href="/world-map.png" x="0" y="0" width={SIZE} height={SIZE} />

      {/* Active path highlight — straight line over the road art */}
      {originId && destinationId && POS[originId] && POS[destinationId] && (
        <line
          x1={POS[originId].x}  y1={POS[originId].y}
          x2={POS[destinationId].x} y2={POS[destinationId].y}
          stroke={hasEncounter ? '#ef4444' : '#60a5fa'}
          strokeWidth={6}
          strokeOpacity={0.25}
          strokeLinecap="round"
        />
      )}

      {/* Location markers */}
      {Object.entries(POS).map(([id, pos]) => {
        const isCurrent  = id === currentLocationId
        const isDest     = id === destinationId
        const isValid    = validDestinationIds.includes(id)
        const isHovered  = hoveredId === id && isValid
        const isSelecting = selecting === id

        const text   = LABELS[id] ?? id
        const lw     = labelW(text)
        const lx     = pos.x - lw / 2
        const ly     = pos.y + DOT_R + LABEL_GAP

        return (
          <g
            key={id}
            onClick={() => handleLocationClick(id)}
            onMouseEnter={() => isValid && setHoveredId(id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{ cursor: isValid ? 'pointer' : 'default', opacity: isSelecting ? 0.6 : 1 }}
          >
            {/* Outer glow for current location */}
            {isCurrent && (
              <>
                <circle cx={pos.x} cy={pos.y} r={38} fill="#4ade80" fillOpacity={0.08} filter="url(#glow-green)" />
                <circle cx={pos.x} cy={pos.y} r={28} fill="none" stroke="#4ade80" strokeWidth={2} strokeOpacity={0.5}>
                  <animate attributeName="r" values="28;36;28" dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
                </circle>
              </>
            )}

            {/* Destination pulse */}
            {isDest && !isCurrent && (
              <circle cx={pos.x} cy={pos.y} r={28} fill="none" stroke="#60a5fa" strokeWidth={2} strokeDasharray="8 4" strokeOpacity={0.6}>
                <animateTransform attributeName="transform" type="rotate" from={`0 ${pos.x} ${pos.y}`} to={`360 ${pos.x} ${pos.y}`} dur="6s" repeatCount="indefinite" />
              </circle>
            )}

            {/* Hover ring for valid destinations */}
            {isHovered && (
              <circle cx={pos.x} cy={pos.y} r={26} fill="#facc15" fillOpacity={0.15} stroke="#facc15" strokeWidth={2} strokeOpacity={0.6} />
            )}

            {/* Marker dot */}
            <circle
              cx={pos.x} cy={pos.y} r={DOT_R}
              fill={isCurrent ? '#052e16' : isDest ? '#2563eb' : '#0a0a0a'}
              fillOpacity={isCurrent || isDest ? 1 : 0.85}
              stroke={isCurrent ? '#4ade80' : isDest ? '#93c5fd' : '#ffffff'}
              strokeWidth={isCurrent || isDest ? 2.5 : 1.5}
              strokeOpacity={isCurrent || isDest ? 1 : 0.4}
              filter={isCurrent ? 'url(#glow-green)' : isDest ? 'url(#glow-blue)' : undefined}
            />

            {/* Name label — parchment box below dot */}
            <rect
              x={lx} y={ly}
              width={lw} height={LABEL_H}
              rx={5} ry={5}
              fill="#e8c9a0"
              stroke="#9a7040"
              strokeWidth={1.5}
            />
            <text
              x={pos.x}
              y={ly + LABEL_H / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#1a0800"
              fontSize={16}
              fontWeight="600"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
              letterSpacing="0.3"
            >
              {text}
            </text>
          </g>
        )
      })}

      {/* Player position dot */}
      {playerPos && (
        <g>
          <circle
            cx={playerPos.x} cy={playerPos.y}
            r={hasEncounter ? 30 : 24}
            fill={hasEncounter ? '#ef4444' : '#4ade80'}
            fillOpacity={0.12}
            filter={hasEncounter ? 'url(#glow-red)' : 'url(#glow-green)'}
          >
            <animate attributeName="r" values={hasEncounter ? '30;46;30' : '24;36;24'} dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="fill-opacity" values="0.12;0;0.12" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle
            cx={playerPos.x} cy={playerPos.y} r={10}
            fill={hasEncounter ? '#ef4444' : '#4ade80'}
            filter={hasEncounter ? 'url(#glow-red)' : 'url(#glow-green)'}
          />
          <circle cx={playerPos.x} cy={playerPos.y} r={4} fill="#fff" fillOpacity={0.9} />
        </g>
      )}
    </svg>
  )
}
