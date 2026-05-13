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
    <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-green-500/20">
            {level}
          </div>
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
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-700"
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
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
