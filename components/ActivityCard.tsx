import { Activity } from '@/types'
import { formatDistance, formatTime, formatPace } from '@/lib/xp'

interface ActivityCardProps {
  activity: Activity
}

const TYPE_CONFIG = {
  race: { emoji: '🏁', label: 'Race', color: 'text-yellow-400' },
  long: { emoji: '🛣️', label: 'Long Run', color: 'text-blue-400' },
  run: { emoji: '👟', label: 'Run', color: 'text-zinc-400' },
  hike: { emoji: '⛰️', label: 'Hike', color: 'text-emerald-400' },
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const date = new Date(activity.start_date)
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const type =
    (activity.activity_type ?? 'Run') === 'Hike'
      ? 'hike'
      : activity.workout_type === 1
      ? 'race'
      : activity.distance >= 15000
      ? 'long'
      : 'run'
  const config = TYPE_CONFIG[type]

  return (
    <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform duration-100">
      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-lg shrink-0">
        {config.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{activity.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-xs ${config.color}`}>{config.label}</span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-500 text-xs">{dateStr}</span>
          {activity.is_pr && (
            <>
              <span className="text-zinc-700">·</span>
              <span className="text-yellow-400 text-xs font-semibold">PR</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-zinc-400 text-xs">{formatPace(activity.average_speed)}</p>
          <p className="text-zinc-600 text-xs">{formatTime(activity.moving_time, true)}</p>
        </div>
        <div className="text-right">
          <p className="text-white text-sm font-semibold">{formatDistance(activity.distance)}</p>
          <p className="text-green-400 text-xs font-medium">+{activity.xp_earned} XP</p>
        </div>
      </div>
    </div>
  )
}
