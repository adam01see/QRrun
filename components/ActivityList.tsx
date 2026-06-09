'use client'

import { motion } from 'framer-motion'
import ActivityCard from './ActivityCard'
import { Activity } from '@/types'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055 } },
}

const EASE = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE } },
}

export default function ActivityList({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-10 text-center">
        <p className="text-zinc-500 text-sm">No activities yet.</p>
        <p className="text-zinc-600 text-xs mt-1">Hit Sync to pull your Strava activities.</p>
      </div>
    )
  }

  return (
    <motion.div className="flex flex-col gap-2" variants={container} initial="hidden" animate="show">
      {activities.map((a) => (
        <motion.div key={a.id} variants={item}>
          <ActivityCard activity={a} />
        </motion.div>
      ))}
    </motion.div>
  )
}
