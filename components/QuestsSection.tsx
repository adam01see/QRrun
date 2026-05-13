'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Zap } from 'lucide-react'
import QuestChain from './QuestChain'
import { QUEST_CHAINS, STANDALONE_QUESTS } from '@/lib/quests'

interface QuestsSectionProps {
  userId: string
  userQuestsData: any[]
}

export default function QuestsSection({ userId, userQuestsData }: QuestsSectionProps) {
  const router = useRouter()
  const [completing, setCompleting] = useState<string | null>(null)

  const completedSlugs = new Set(
    userQuestsData.filter((q) => q.status === 'completed').map((q) => q.quest_slug)
  )

  const handleComplete = async (slug: string) => {
    setCompleting(slug)
    const res = await fetch('/api/quests/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quest_slug: slug }),
    })
    setCompleting(null)
    if (res.ok) router.refresh()
  }

  const autoQuests = STANDALONE_QUESTS.filter((q) => q.category === 'auto')
  const manualQuests = STANDALONE_QUESTS.filter((q) => q.category === 'manual')

  const totalQuests =
    QUEST_CHAINS.flatMap((c) => c.quests).length + STANDALONE_QUESTS.length
  const totalCompleted = completedSlugs.size

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-semibold">Quests</h2>
        <span className="text-zinc-500 text-sm bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 py-1">
          {totalCompleted}/{totalQuests}
        </span>
      </div>

      {/* Quest Chains */}
      <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">Chains</p>
      <div className="flex flex-col gap-2 mb-4">
        {QUEST_CHAINS.map((chain) => (
          <QuestChain key={chain.slug} chain={chain} completedSlugs={completedSlugs} />
        ))}
      </div>

      {/* Auto Quests */}
      <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">Auto-detected</p>
      <div className="flex flex-col gap-2 mb-4">
        {autoQuests.map((q) => {
          const done = completedSlugs.has(q.slug)
          return (
            <div
              key={q.slug}
              className={`bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 flex items-center gap-3 ${done ? 'opacity-40' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${done ? 'bg-green-500/20' : 'bg-zinc-800'}`}>
                {done ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <span className="text-sm">{q.icon}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${done ? 'text-zinc-400' : 'text-white'}`}>{q.name}</p>
                <p className="text-zinc-600 text-xs mt-0.5">{q.description}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {!done && (
                  <span className="text-zinc-600 text-[10px] font-medium bg-zinc-800 border border-zinc-700/40 rounded-lg px-1.5 py-0.5 flex items-center gap-0.5">
                    <Zap size={9} className="text-zinc-600" />
                    Auto
                  </span>
                )}
                <span className={`text-xs font-semibold ${done ? 'text-zinc-600' : 'text-green-400'}`}>
                  +{q.xp_reward}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Manual Quests */}
      <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">Side Quests</p>
      <div className="flex flex-col gap-2">
        {manualQuests.map((q) => {
          const done = completedSlugs.has(q.slug)
          const loading = completing === q.slug
          return (
            <div
              key={q.slug}
              className={`bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 flex items-center gap-3 ${done ? 'opacity-40' : ''}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${done ? 'bg-green-500/20' : 'bg-zinc-800'}`}>
                {done ? (
                  <Check size={14} className="text-green-400" />
                ) : (
                  <span className="text-sm">{q.icon}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${done ? 'text-zinc-400' : 'text-white'}`}>{q.name}</p>
                <p className="text-zinc-600 text-xs mt-0.5">{q.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-semibold ${done ? 'text-zinc-600' : 'text-green-400'}`}>
                  +{q.xp_reward}
                </span>
                {!done && (
                  <button
                    onClick={() => handleComplete(q.slug)}
                    disabled={loading}
                    className="text-xs bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border border-zinc-700/60 text-zinc-300 font-medium px-3 py-1.5 rounded-xl transition-colors disabled:opacity-40"
                  >
                    {loading ? '...' : 'Done'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
