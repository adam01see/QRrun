'use client'

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

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-black font-bold text-lg">
            {level}
          </div>
          <div>
            <p className="text-white font-semibold">{title}</p>
            <p className="text-zinc-400 text-sm">{totalXP.toLocaleString()} XP total</p>
          </div>
        </div>
        {!isMaxLevel && (
          <p className="text-zinc-400 text-sm">
            {xpIntoLevel} / {xpNeeded} XP
          </p>
        )}
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
        />
      </div>
      {!isMaxLevel && (
        <p className="text-zinc-500 text-xs mt-1">
          {(nextLevelXP - totalXP).toLocaleString()} XP to Level {level + 1}
        </p>
      )}
    </div>
  )
}
