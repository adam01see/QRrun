'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getXPForNextLevel, getLevelTitle } from '@/lib/xp'
import { LEVEL_THRESHOLDS } from '@/types'

interface XPBarProps {
  totalXP: number
  level: number
}

export default function XPBar({ totalXP, level }: XPBarProps) {
  const { nextLevelXP, prevLevelXP, progress } = getXPForNextLevel(totalXP)
  const title = getLevelTitle(level)
  const isMaxLevel = level >= LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].level
  const xpIntoLevel = totalXP - prevLevelXP
  const xpNeeded = nextLevelXP - prevLevelXP

  const [barWidth, setBarWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setBarWidth(Math.min(progress * 100, 100)), 120)
    return () => clearTimeout(t)
  }, [progress])

  return (
    <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.05 }}
            className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-green-500/30 level-badge"
          >
            {level}
          </motion.div>
          <div>
            <p className="text-white font-semibold text-base">{title}</p>
            <p className="text-zinc-500 text-xs mt-0.5">{totalXP.toLocaleString()} XP total</p>
          </div>
        </div>
        {!isMaxLevel && (
          <div className="text-right">
            <p className="text-zinc-300 text-sm font-medium">{xpIntoLevel.toLocaleString()}</p>
            <p className="text-zinc-600 text-xs">/ {xpNeeded.toLocaleString()} XP</p>
          </div>
        )}
      </div>

      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-green-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${barWidth}%` }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number], delay: 0.15 }}
        />
      </div>

      {!isMaxLevel && (
        <p className="text-zinc-600 text-xs mt-2">
          {(nextLevelXP - totalXP).toLocaleString()} XP to Level {level + 1}
        </p>
      )}
    </div>
  )
}
