import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getPredictions, getPredictionHistory } from '@/lib/predictor'
import { formatDistance, formatTime } from '@/lib/xp'
import XPBar from '@/components/XPBar'
import ActivityCard from '@/components/ActivityCard'
import RacePredictor from '@/components/RacePredictor'
import SyncButton from '@/components/SyncButton'
import QuestsSection from '@/components/QuestsSection'
import { Activity } from '@/types'

export default async function DashboardPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/')

  const supabase = getSupabaseAdmin()

  const [{ data: activitiesRaw }, { data: achievementRows }, { data: questRows }, { data: friendships }] =
    await Promise.all([
      supabase
        .from('activities')
        .select('*')
        .eq('user_id', profile.id)
        .order('start_date', { ascending: false }),
      supabase
        .from('user_achievements')
        .select('achievement_slug, earned_at')
        .eq('user_id', profile.id),
      supabase
        .from('user_quests')
        .select('*, quests(*)')
        .eq('user_id', profile.id),
      supabase
        .from('friendships')
        .select('id')
        .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`),
    ])

  const activities: Activity[] = activitiesRaw ?? []
  const recentActivities = activities.slice(0, 10)

  const totalDistance = activities.reduce((s, a) => s + a.distance, 0)
  const totalTime = activities.reduce((s, a) => s + a.moving_time, 0)

  const predictions = getPredictions(activities)
  const history = getPredictionHistory(
    [...activities].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()),
    5
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto p-4 pb-16">

        {/* Header */}
        <div className="flex items-center justify-between py-4 mb-4">
          <div>
            <h1 className="text-xl font-bold">Hey, {profile.firstname}</h1>
            <p className="text-zinc-500 text-sm">
              {profile.current_streak > 0
                ? `${profile.current_streak}-day streak 🔥`
                : 'Start your streak today'}
            </p>
          </div>
          <SyncButton />
        </div>

        {/* XP Bar */}
        <div className="mb-4">
          <XPBar totalXP={profile.total_xp} level={profile.level} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Total Distance', value: formatDistance(totalDistance) },
            { label: 'Total Runs', value: `${activities.length}` },
            { label: 'Total Time', value: formatTime(totalTime) },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
              <p className="text-white font-bold text-lg">{s.value}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Race Predictor */}
        {predictions.length > 0 && (
          <div className="mb-6">
            <RacePredictor predictions={predictions} history={history} />
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <a
            href="/achievements"
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:border-zinc-600 transition-colors"
          >
            <div>
              <p className="text-white font-semibold text-sm">Achievements</p>
              <p className="text-zinc-500 text-xs">{achievementRows?.length ?? 0} earned</p>
            </div>
            <span className="text-zinc-600">→</span>
          </a>
          <a
            href="/friends"
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:border-zinc-600 transition-colors"
          >
            <div>
              <p className="text-white font-semibold text-sm">Friends</p>
              <p className="text-zinc-500 text-xs">{friendships?.length ?? 0} running friends</p>
            </div>
            <span className="text-zinc-600">→</span>
          </a>
        </div>

        {/* QR code CTA */}
        <a
          href="/profile"
          className="mb-6 flex items-center gap-4 bg-green-500/10 border border-green-500/30 rounded-xl p-4 hover:border-green-500/50 transition-colors"
        >
          <div className="text-2xl">📱</div>
          <div className="flex-1">
            <p className="text-green-400 font-semibold text-sm">Run with a friend → 2x XP</p>
            <p className="text-zinc-500 text-xs">Show your QR code before your next run together</p>
          </div>
          <span className="text-zinc-600">→</span>
        </a>

        {/* Quests */}
        <div className="mb-6">
          <QuestsSection
            userId={profile.id}
            userQuestsData={questRows ?? []}
          />
        </div>

        {/* Recent Runs */}
        <div>
          <h2 className="text-white font-semibold mb-3">Recent Runs</h2>
          {recentActivities.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
              <p className="text-zinc-400">No runs yet. Sync your Strava to get started.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentActivities.map((a) => (
                <ActivityCard key={a.id} activity={a} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
