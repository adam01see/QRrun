import { Activity } from '@/types'
import { formatDistance, formatTime, formatPace } from '@/lib/xp'

interface ActivityCardProps {
  activity: Activity
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const date = new Date(activity.start_date)
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const typeLabel =
    activity.workout_type === 1 ? 'Race' : activity.distance >= 15000 ? 'Long Run' : 'Run'

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-2xl">
          {activity.workout_type === 1 ? '🏁' : activity.distance >= 15000 ? '🛣️' : '👟'}
        </div>
        <div>
          <p className="text-white font-medium text-sm">{activity.name}</p>
          <p className="text-zinc-500 text-xs">
            {dateStr} · {typeLabel}
            {activity.is_pr && (
              <span className="ml-2 text-yellow-400 font-semibold">PR</span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-right">
        <div>
          <p className="text-white text-sm font-medium">{formatDistance(activity.distance)}</p>
          <p className="text-zinc-500 text-xs">{formatTime(activity.moving_time, true)}</p>
        </div>
        <div className="hidden sm:block">
          <p className="text-zinc-300 text-sm">{formatPace(activity.average_speed)}</p>
        </div>
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-2 py-1">
          <p className="text-green-400 text-sm font-semibold">+{activity.xp_earned} XP</p>
        </div>
      </div>
    </div>
  )
}
