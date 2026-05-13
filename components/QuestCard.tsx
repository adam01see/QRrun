'use client'

import { useState } from 'react'

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

  const typeColor: Record<string, string> = {
    side: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    weekly: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    chain: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  }

  return (
    <div
      className={`bg-zinc-900 border rounded-xl p-4 flex items-center justify-between transition-opacity ${
        status === 'completed' ? 'opacity-50 border-zinc-800' : 'border-zinc-800'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`text-xs font-semibold px-2 py-1 rounded border shrink-0 mt-0.5 ${
            typeColor[quest_type] ?? typeColor.side
          }`}
        >
          {quest_type.toUpperCase()}
        </div>
        <div>
          <p className="text-white font-medium text-sm">{name}</p>
          <p className="text-zinc-500 text-xs mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 ml-4 shrink-0">
        <span className="text-green-400 text-sm font-semibold">+{xp_reward} XP</span>
        {status === 'completed' ? (
          <span className="text-zinc-500 text-sm">Done</span>
        ) : (
          <button
            onClick={handleComplete}
            disabled={loading}
            className="text-xs bg-green-500 hover:bg-green-400 text-black font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'Complete'}
          </button>
        )}
      </div>
    </div>
  )
}
