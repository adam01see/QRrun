'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

interface QuestCardProps {
  slug: string
  name: string
  description: string
  xp_reward: number
  quest_type: string
  status: 'active' | 'completed'
  onComplete: (slug: string) => void
}

export default function QuestCard({
  slug,
  name,
  description,
  xp_reward,
  quest_type,
  status,
  onComplete,
}: QuestCardProps) {
  const [loading, setLoading] = useState(false)

  const handleComplete = async () => {
    setLoading(true)
    await onComplete(slug)
    setLoading(false)
  }

  const isCompleted = status === 'completed'

  return (
    <div className={`bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 flex items-center gap-3 transition-opacity ${isCompleted ? 'opacity-40' : ''}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isCompleted ? 'bg-green-500/20' : 'bg-zinc-800'}`}>
        {isCompleted
          ? <Check size={14} className="text-green-400" />
          : <span className="text-sm">🎯</span>
        }
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isCompleted ? 'text-zinc-400' : 'text-white'}`}>{name}</p>
        <p className="text-zinc-600 text-xs mt-0.5 truncate">{description}</p>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <span className="text-green-400 text-xs font-semibold">+{xp_reward}</span>
        {!isCompleted && (
          <button
            onClick={handleComplete}
            disabled={loading}
            className="text-xs bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border border-zinc-700/60 text-zinc-300 font-medium px-3 py-1.5 rounded-xl transition-colors disabled:opacity-40"
          >
            {loading ? '...' : 'Done'}
          </button>
        )}
      </div>
    </div>
  )
}
