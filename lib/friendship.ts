export const FRIENDSHIP_LEVELS = [
  { level: 1, xp: 0, title: 'Strangers' },
  { level: 2, xp: 300, title: 'Running Mates' },
  { level: 3, xp: 800, title: 'Training Partners' },
  { level: 4, xp: 2000, title: 'Run Crew' },
  { level: 5, xp: 5000, title: 'Pacer for Life' },
  { level: 6, xp: 12000, title: 'Legendary Duo' },
]

export function getFriendshipLevel(xp: number): number {
  let level = 1
  for (const threshold of FRIENDSHIP_LEVELS) {
    if (xp >= threshold.xp) level = threshold.level
  }
  return level
}

export function getFriendshipTitle(level: number): string {
  return FRIENDSHIP_LEVELS.find((l) => l.level === level)?.title ?? 'Strangers'
}

export function getFriendshipProgress(xp: number): {
  progress: number
  nextLevelXP: number
  prevLevelXP: number
} {
  const level = getFriendshipLevel(xp)
  const current = FRIENDSHIP_LEVELS.find((l) => l.level === level)!
  const next = FRIENDSHIP_LEVELS.find((l) => l.level === level + 1)

  if (!next) return { progress: 1, nextLevelXP: xp, prevLevelXP: current.xp }

  const range = next.xp - current.xp
  const earned = xp - current.xp
  return { progress: earned / range, nextLevelXP: next.xp, prevLevelXP: current.xp }
}

// XP earned per shared run = km of the shorter run * 10
export function calcFriendshipXP(km1: number, km2: number): number {
  return Math.round(Math.min(km1, km2) * 10)
}

// Canonical friendship key: always smaller UUID first
export function friendshipKey(id1: string, id2: string): [string, string] {
  return id1 < id2 ? [id1, id2] : [id2, id1]
}
