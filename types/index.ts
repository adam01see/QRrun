export interface Profile {
  id: string
  strava_id: number
  username: string
  firstname: string
  lastname: string
  profile_photo: string
  strava_access_token: string
  strava_refresh_token: string
  token_expires_at: number
  total_xp: number
  level: number
  current_streak: number
  longest_streak: number
  last_run_date: string | null
  created_at: string
}

export interface Activity {
  id: string
  user_id: string
  strava_id: number
  name: string
  distance: number        // meters
  moving_time: number     // seconds
  elapsed_time: number    // seconds
  start_date: string
  average_speed: number   // m/s
  average_heartrate: number | null
  max_heartrate: number | null
  total_elevation_gain: number
  workout_type: number    // 0=default, 1=race, 2=long run, 3=workout
  xp_earned: number
  is_pr: boolean
  created_at: string
}

export interface Achievement {
  slug: string
  name: string
  description: string
  icon: string
  xp_reward: number
  category: 'distance' | 'consistency' | 'social' | 'special'
}

export interface UserAchievement {
  achievement_slug: string
  earned_at: string
  achievements: Achievement
}

export interface Quest {
  slug: string
  name: string
  description: string
  xp_reward: number
  quest_type: 'side' | 'weekly' | 'chain'
  requirement_type: 'manual' | 'distance' | 'activities_count'
  requirement_value: number
}

export interface UserQuest {
  quest_slug: string
  status: 'active' | 'completed'
  progress: number
  completed_at: string | null
  quests: Quest
}

export interface RacePrediction {
  distance_km: number
  label: string
  predicted_seconds: number
}

export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: 'Couch Potato' },
  { level: 2, xp: 500, title: 'Jogger' },
  { level: 3, xp: 1500, title: 'Runner' },
  { level: 4, xp: 3500, title: 'Athlete' },
  { level: 5, xp: 7500, title: 'Road Warrior' },
  { level: 6, xp: 15000, title: 'Beast' },
  { level: 7, xp: 30000, title: 'Legend' },
]
