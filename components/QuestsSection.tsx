'use client'

import { useState } from 'react'
import QuestCard from './QuestCard'
import { useRouter } from 'next/navigation'

const SIDE_QUESTS = [
  {
    slug: 'new_route',
    name: 'Explorer',
    description: 'Run a completely new route you have never done before',
    xp_reward: 150,
    quest_type: 'side',
  },
  {
    slug: 'run_club',
    name: 'Pack Runner',
    description: 'Join a local run club or group run',
    xp_reward: 200,
    quest_type: 'side',
  },
  {
    slug: 'run_with_friend',
    name: 'Social Runner',
    description: 'Run with a friend or training partner',
    xp_reward: 100,
    quest_type: 'side',
  },
  {
    slug: 'race_entry',
    name: 'Signed Up',
    description: 'Enter an official race (any distance)',
    xp_reward: 250,
    quest_type: 'side',
  },
  {
    slug: 'barefoot_run',
    name: 'Natural Roots',
    description: 'Do a short barefoot or minimal shoe run on grass',
    xp_reward: 75,
    quest_type: 'side',
  },
  {
    slug: 'track_workout',
    name: 'On the Track',
    description: 'Do a structured interval workout on a track',
    xp_reward: 150,
    quest_type: 'side',
  },
  {
    slug: 'trail_run',
    name: 'Off-Road',
    description: 'Complete a trail run (any distance)',
    xp_reward: 175,
    quest_type: 'side',
  },
]

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

  const completedCount = completedSlugs.size
  const totalCount = SIDE_QUESTS.length

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-semibold">Side Quests</h2>
        <span className="text-zinc-500 text-sm">
          {completedCount}/{totalCount} complete
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {SIDE_QUESTS.map((q) => (
          <QuestCard
            key={q.slug}
            {...q}
            status={completedSlugs.has(q.slug) ? 'completed' : 'active'}
            onComplete={handleComplete}
          />
        ))}
      </div>
    </div>
  )
}
