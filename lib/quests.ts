import { Activity, Profile } from '@/types'

export interface QuestCheckContext {
  activities: Activity[]
  profile: Profile
  distinctFriendCount: number
  totalSharedKm: number
  sharedRunCount: number
}

export interface QuestDef {
  slug: string
  name: string
  description: string
  xp_reward: number
  category: 'auto' | 'manual'
  icon: string
  chainSlug?: string
  chainStep?: number
  checkFn?: (ctx: QuestCheckContext) => boolean
}

export interface QuestChainDef {
  slug: string
  name: string
  icon: string
  quests: QuestDef[]
}

const hasRunInRange = (activities: Activity[], minM: number, maxM: number, minSpeedMs?: number) =>
  activities.some(
    (a) => a.distance >= minM && a.distance < maxM && (minSpeedMs === undefined || a.average_speed >= minSpeedMs)
  )

const distinctCities = (activities: Activity[]) =>
  new Set(activities.map((a) => a.city).filter(Boolean))

const distinctCountries = (activities: Activity[]) =>
  new Set(activities.map((a) => a.country_code).filter(Boolean))

export const QUEST_CHAINS: QuestChainDef[] = [
  {
    slug: 'road_to_marathon',
    name: 'Road to Marathon',
    icon: '🏁',
    quests: [
      {
        slug: 'chain_rtm_5k',
        name: 'First 5K',
        description: 'Complete a 5K run',
        xp_reward: 100,
        category: 'auto',
        icon: '🏅',
        chainSlug: 'road_to_marathon',
        chainStep: 1,
        checkFn: ({ activities }) => activities.some((a) => a.distance >= 5000),
      },
      {
        slug: 'chain_rtm_10k',
        name: 'First 10K',
        description: 'Complete a 10K run',
        xp_reward: 200,
        category: 'auto',
        icon: '🥈',
        chainSlug: 'road_to_marathon',
        chainStep: 2,
        checkFn: ({ activities }) => activities.some((a) => a.distance >= 10000),
      },
      {
        slug: 'chain_rtm_half',
        name: 'Half Marathon',
        description: 'Complete a 21K run',
        xp_reward: 400,
        category: 'auto',
        icon: '🥇',
        chainSlug: 'road_to_marathon',
        chainStep: 3,
        checkFn: ({ activities }) => activities.some((a) => a.distance >= 21097),
      },
      {
        slug: 'chain_rtm_marathon',
        name: 'Full Marathon',
        description: 'Complete a full marathon',
        xp_reward: 1000,
        category: 'auto',
        icon: '🏆',
        chainSlug: 'road_to_marathon',
        chainStep: 4,
        checkFn: ({ activities }) => activities.some((a) => a.distance >= 42195),
      },
    ],
  },
  {
    slug: 'speed_ladder',
    name: 'Speed Ladder',
    icon: '⚡',
    quests: [
      {
        slug: 'chain_speed_sub6',
        name: 'Sub-6:00 Pace',
        description: 'Run 5K at under 6:00/km',
        xp_reward: 150,
        category: 'auto',
        icon: '🐢',
        chainSlug: 'speed_ladder',
        chainStep: 1,
        checkFn: ({ activities }) => hasRunInRange(activities, 4500, 7000, 2.778),
      },
      {
        slug: 'chain_speed_sub530',
        name: 'Sub-5:30 Pace',
        description: 'Run 5K at under 5:30/km',
        xp_reward: 200,
        category: 'auto',
        icon: '🐇',
        chainSlug: 'speed_ladder',
        chainStep: 2,
        checkFn: ({ activities }) => hasRunInRange(activities, 4500, 7000, 3.030),
      },
      {
        slug: 'chain_speed_sub5',
        name: 'Sub-5:00 Pace',
        description: 'Run 5K at under 5:00/km',
        xp_reward: 300,
        category: 'auto',
        icon: '🦊',
        chainSlug: 'speed_ladder',
        chainStep: 3,
        checkFn: ({ activities }) => hasRunInRange(activities, 4500, 7000, 3.333),
      },
      {
        slug: 'chain_speed_sub430',
        name: 'Sub-4:30 Pace',
        description: 'Run 5K at under 4:30/km',
        xp_reward: 500,
        category: 'auto',
        icon: '🐆',
        chainSlug: 'speed_ladder',
        chainStep: 4,
        checkFn: ({ activities }) => hasRunInRange(activities, 4500, 7000, 3.704),
      },
    ],
  },
  {
    slug: 'altitude_hunter',
    name: 'Altitude Hunter',
    icon: '⛰️',
    quests: [
      {
        slug: 'chain_alt_500',
        name: 'High Ground',
        description: 'Run at 500m+ above sea level',
        xp_reward: 100,
        category: 'auto',
        icon: '🌄',
        chainSlug: 'altitude_hunter',
        chainStep: 1,
        checkFn: ({ activities }) => activities.some((a) => (a.elev_high ?? 0) >= 500),
      },
      {
        slug: 'chain_alt_1500',
        name: 'Mountain Runner',
        description: 'Run at 1500m+ above sea level',
        xp_reward: 200,
        category: 'auto',
        icon: '🏔️',
        chainSlug: 'altitude_hunter',
        chainStep: 2,
        checkFn: ({ activities }) => activities.some((a) => (a.elev_high ?? 0) >= 1500),
      },
      {
        slug: 'chain_alt_3000',
        name: 'Sky Runner',
        description: 'Run at 3000m+ above sea level',
        xp_reward: 400,
        category: 'auto',
        icon: '☁️',
        chainSlug: 'altitude_hunter',
        chainStep: 3,
        checkFn: ({ activities }) => activities.some((a) => (a.elev_high ?? 0) >= 3000),
      },
      {
        slug: 'chain_alt_4000',
        name: 'Roof of the World',
        description: 'Run at 4000m+ above sea level',
        xp_reward: 750,
        category: 'auto',
        icon: '🌋',
        chainSlug: 'altitude_hunter',
        chainStep: 4,
        checkFn: ({ activities }) => activities.some((a) => (a.elev_high ?? 0) >= 4000),
      },
    ],
  },
  {
    slug: 'the_nomad',
    name: 'The Nomad',
    icon: '🌍',
    quests: [
      {
        slug: 'chain_nomad_2cities',
        name: 'City Hopper',
        description: 'Run in 2 different cities',
        xp_reward: 150,
        category: 'auto',
        icon: '🏙️',
        chainSlug: 'the_nomad',
        chainStep: 1,
        checkFn: ({ activities }) => distinctCities(activities).size >= 2,
      },
      {
        slug: 'chain_nomad_5cities',
        name: 'Urban Explorer',
        description: 'Run in 5 different cities',
        xp_reward: 300,
        category: 'auto',
        icon: '🗺️',
        chainSlug: 'the_nomad',
        chainStep: 2,
        checkFn: ({ activities }) => distinctCities(activities).size >= 5,
      },
      {
        slug: 'chain_nomad_2countries',
        name: 'Border Crosser',
        description: 'Run in 2 different countries',
        xp_reward: 400,
        category: 'auto',
        icon: '✈️',
        chainSlug: 'the_nomad',
        chainStep: 3,
        checkFn: ({ activities }) => distinctCountries(activities).size >= 2,
      },
      {
        slug: 'chain_nomad_5countries',
        name: 'World Runner',
        description: 'Run in 5+ different countries',
        xp_reward: 1000,
        category: 'auto',
        icon: '🌐',
        chainSlug: 'the_nomad',
        chainStep: 4,
        checkFn: ({ activities }) => distinctCountries(activities).size >= 5,
      },
    ],
  },
  {
    slug: 'social_climber',
    name: 'Social Climber',
    icon: '🤝',
    quests: [
      {
        slug: 'chain_social_first',
        name: 'First Running Buddy',
        description: 'Complete your first paired run',
        xp_reward: 200,
        category: 'auto',
        icon: '👥',
        chainSlug: 'social_climber',
        chainStep: 1,
        checkFn: ({ sharedRunCount }) => sharedRunCount >= 1,
      },
      {
        slug: 'chain_social_5k',
        name: 'Buddy Miles',
        description: 'Run 5km total with friends',
        xp_reward: 150,
        category: 'auto',
        icon: '🤝',
        chainSlug: 'social_climber',
        chainStep: 2,
        checkFn: ({ totalSharedKm }) => totalSharedKm >= 5,
      },
      {
        slug: 'chain_social_3friends',
        name: 'Run Crew',
        description: 'Run with 3 different friends',
        xp_reward: 300,
        category: 'auto',
        icon: '🏃',
        chainSlug: 'social_climber',
        chainStep: 3,
        checkFn: ({ distinctFriendCount }) => distinctFriendCount >= 3,
      },
      {
        slug: 'chain_social_50k',
        name: 'Pacer Pack',
        description: 'Run 50km total with friends',
        xp_reward: 500,
        category: 'auto',
        icon: '💪',
        chainSlug: 'social_climber',
        chainStep: 4,
        checkFn: ({ totalSharedKm }) => totalSharedKm >= 50,
      },
    ],
  },
]

export const STANDALONE_QUESTS: QuestDef[] = [
  {
    slug: 'quest_early_bird',
    name: 'Early Bird',
    description: 'Run before 7:00 AM',
    xp_reward: 75,
    category: 'auto',
    icon: '🌅',
    checkFn: ({ activities }) =>
      activities.some((a) => new Date(a.start_date).getHours() < 7),
  },
  {
    slug: 'quest_night_owl',
    name: 'Night Owl',
    description: 'Run after 9:00 PM',
    xp_reward: 75,
    category: 'auto',
    icon: '🌙',
    checkFn: ({ activities }) =>
      activities.some((a) => new Date(a.start_date).getHours() >= 21),
  },
  {
    slug: 'quest_long_hauler',
    name: 'Long Hauler',
    description: 'Run 20km+ in one session',
    xp_reward: 250,
    category: 'auto',
    icon: '🛣️',
    checkFn: ({ activities }) => activities.some((a) => a.distance >= 20000),
  },
  {
    slug: 'quest_pr_crusher',
    name: 'PR Crusher',
    description: 'Set a new personal record',
    xp_reward: 150,
    category: 'auto',
    icon: '💥',
    checkFn: ({ activities }) => activities.some((a) => a.is_pr),
  },
  {
    slug: 'quest_race_finisher',
    name: 'Race Finisher',
    description: 'Complete an official race on Strava',
    xp_reward: 300,
    category: 'auto',
    icon: '🏁',
    checkFn: ({ activities }) => activities.some((a) => a.workout_type === 1),
  },
  {
    slug: 'quest_back_to_back',
    name: 'Back-to-Back',
    description: 'Run on 2 consecutive days',
    xp_reward: 100,
    category: 'auto',
    icon: '🔁',
    checkFn: ({ activities }) => {
      const dates = [...new Set(activities.map((a) => a.start_date.split('T')[0]))].sort()
      for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1]).getTime()
        const curr = new Date(dates[i]).getTime()
        if ((curr - prev) / 86400000 === 1) return true
      }
      return false
    },
  },
  {
    slug: 'quest_hill_crusher',
    name: 'Hill Crusher',
    description: 'Gain 500m elevation in a single run',
    xp_reward: 200,
    category: 'auto',
    icon: '⛰️',
    checkFn: ({ activities }) => activities.some((a) => a.total_elevation_gain >= 500),
  },
  // Manual quests
  {
    slug: 'quest_rain_runner',
    name: 'Rain Runner',
    description: 'Go for a run in the rain',
    xp_reward: 100,
    category: 'manual',
    icon: '🌧️',
  },
  {
    slug: 'quest_backpack_run',
    name: 'Pack Runner',
    description: 'Complete a run with a backpack',
    xp_reward: 125,
    category: 'manual',
    icon: '🎒',
  },
  {
    slug: 'quest_restaurant_run',
    name: 'Restaurant Run',
    description: 'Run to a restaurant and eat there',
    xp_reward: 150,
    category: 'manual',
    icon: '🍽️',
  },
  {
    slug: 'quest_recruit_runner',
    name: 'Recruiter',
    description: 'Get a friend to start running',
    xp_reward: 200,
    category: 'manual',
    icon: '📣',
  },
  {
    slug: 'quest_trail_run',
    name: 'Off-Road',
    description: 'Complete a trail run',
    xp_reward: 175,
    category: 'manual',
    icon: '🌲',
  },
]

export const ALL_QUESTS: QuestDef[] = [
  ...QUEST_CHAINS.flatMap((c) => c.quests),
  ...STANDALONE_QUESTS,
]

export function checkAutoQuests(ctx: QuestCheckContext, completedSlugs: Set<string>): QuestDef[] {
  return ALL_QUESTS.filter((q) => {
    if (q.category !== 'auto') return false
    if (completedSlugs.has(q.slug)) return false
    return q.checkFn?.(ctx) ?? false
  })
}
