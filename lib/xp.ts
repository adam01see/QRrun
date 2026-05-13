import { Activity, LEVEL_THRESHOLDS } from '@/types'

// XP rules:
// Base: 10 XP per km
// Long run (>15km): 1.5x multiplier
// Race (workout_type=1): 2x multiplier
// PR: flat +100 XP bonus
// Streak multiplier applied separately when awarding

export function calculateRunXP(activity: Partial<Activity>): number {
  const km = (activity.distance ?? 0) / 1000
  if (km < 0.5) return 0

  let base = Math.round(km * 10)

  let multiplier = 1.0
  if (km >= 15) multiplier = 1.5
  if (activity.workout_type === 1) multiplier = 2.0 // race overrides

  let xp = Math.round(base * multiplier)

  if (activity.is_pr) xp += 100

  return xp
}

export function getLevelFromXP(totalXP: number): number {
  let level = 1
  for (const threshold of LEVEL_THRESHOLDS) {
    if (totalXP >= threshold.xp) level = threshold.level
  }
  return level
}

export function getLevelTitle(level: number): string {
  return LEVEL_THRESHOLDS.find((t) => t.level === level)?.title ?? 'Unknown'
}

export function getXPForNextLevel(currentXP: number): {
  current: number
  nextLevelXP: number
  prevLevelXP: number
  progress: number // 0-1
} {
  const currentLevel = getLevelFromXP(currentXP)
  const nextThreshold = LEVEL_THRESHOLDS.find((t) => t.level === currentLevel + 1)
  const currentThreshold = LEVEL_THRESHOLDS.find((t) => t.level === currentLevel)!

  if (!nextThreshold) {
    return { current: currentXP, nextLevelXP: currentXP, prevLevelXP: currentThreshold.xp, progress: 1 }
  }

  const range = nextThreshold.xp - currentThreshold.xp
  const earned = currentXP - currentThreshold.xp
  return {
    current: currentXP,
    nextLevelXP: nextThreshold.xp,
    prevLevelXP: currentThreshold.xp,
    progress: earned / range,
  }
}

// Format seconds → "1h 23m 45s" or "23:45"
export function formatTime(seconds: number, short = false): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (short) {
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
  }
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${s}s`
}

// Format pace: seconds per km → "X:XX /km"
export function formatPace(speedMs: number): string {
  if (!speedMs || speedMs === 0) return '--'
  const secsPerKm = 1000 / speedMs
  const mins = Math.floor(secsPerKm / 60)
  const secs = Math.round(secsPerKm % 60)
  return `${mins}:${String(secs).padStart(2, '0')} /km`
}

export function formatDistance(meters: number): string {
  const km = meters / 1000
  return `${km.toFixed(2)} km`
}
