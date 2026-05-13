import { Activity, Achievement } from '@/types'

export const ALL_ACHIEVEMENTS: Achievement[] = [
  // Distance milestones
  { slug: 'first_run', name: 'First Step', description: 'Log your first run', icon: '👟', xp_reward: 50, category: 'distance' },
  { slug: 'run_5k', name: '5K Club', description: 'Complete a 5K run', icon: '🏅', xp_reward: 100, category: 'distance' },
  { slug: 'run_10k', name: '10K Warrior', description: 'Complete a 10K run', icon: '🥈', xp_reward: 200, category: 'distance' },
  { slug: 'run_half', name: 'Half the Battle', description: 'Complete a half marathon (21K)', icon: '🥇', xp_reward: 500, category: 'distance' },
  { slug: 'run_marathon', name: 'Marathon Legend', description: 'Complete a marathon (42K)', icon: '🏆', xp_reward: 1000, category: 'distance' },
  { slug: 'total_100k', name: 'Century Rider', description: 'Run 100km total', icon: '💯', xp_reward: 300, category: 'distance' },
  { slug: 'total_500k', name: 'Road Master', description: 'Run 500km total', icon: '🗺️', xp_reward: 1000, category: 'distance' },

  // Consistency
  { slug: 'streak_7', name: 'Week Warrior', description: '7-day run streak', icon: '🔥', xp_reward: 150, category: 'consistency' },
  { slug: 'streak_30', name: 'Iron Legs', description: '30-day run streak', icon: '⚡', xp_reward: 500, category: 'consistency' },
  { slug: 'runs_10', name: 'Habit Forming', description: 'Log 10 runs', icon: '📈', xp_reward: 100, category: 'consistency' },
  { slug: 'runs_50', name: 'Dedicated', description: 'Log 50 runs', icon: '🎯', xp_reward: 300, category: 'consistency' },

  // Special
  { slug: 'early_bird', name: 'Early Bird', description: 'Run before 7AM', icon: '🌅', xp_reward: 75, category: 'special' },
  { slug: 'night_owl', name: 'Night Owl', description: 'Run after 9PM', icon: '🌙', xp_reward: 75, category: 'special' },
  { slug: 'pr_crusher', name: 'PR Crusher', description: 'Set a new personal record', icon: '💥', xp_reward: 150, category: 'special' },
  { slug: 'elevation_1000', name: 'Hill Climber', description: 'Gain 1000m elevation in a single run', icon: '⛰️', xp_reward: 200, category: 'special' },
  { slug: 'long_run_20', name: 'Long Hauler', description: 'Run 20km+ in one session', icon: '🛣️', xp_reward: 250, category: 'special' },
]

// Checks which achievements should be newly unlocked based on activities and existing earned slugs
export function checkNewAchievements(
  activities: Activity[],
  earnedSlugs: string[]
): Achievement[] {
  const newlyEarned: Achievement[] = []
  const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0)
  const totalRuns = activities.length

  const check = (slug: string, condition: boolean) => {
    if (condition && !earnedSlugs.includes(slug)) {
      const achievement = ALL_ACHIEVEMENTS.find((a) => a.slug === slug)
      if (achievement) newlyEarned.push(achievement)
    }
  }

  check('first_run', totalRuns >= 1)
  check('run_5k', activities.some((a) => a.distance >= 5000))
  check('run_10k', activities.some((a) => a.distance >= 10000))
  check('run_half', activities.some((a) => a.distance >= 21000))
  check('run_marathon', activities.some((a) => a.distance >= 42000))
  check('total_100k', totalDistance >= 100000)
  check('total_500k', totalDistance >= 500000)
  check('runs_10', totalRuns >= 10)
  check('runs_50', totalRuns >= 50)
  check('pr_crusher', activities.some((a) => a.is_pr))
  check('elevation_1000', activities.some((a) => a.total_elevation_gain >= 1000))
  check('long_run_20', activities.some((a) => a.distance >= 20000))

  check(
    'early_bird',
    activities.some((a) => {
      const hour = new Date(a.start_date).getHours()
      return hour < 7
    })
  )
  check(
    'night_owl',
    activities.some((a) => {
      const hour = new Date(a.start_date).getHours()
      return hour >= 21
    })
  )

  return newlyEarned
}
