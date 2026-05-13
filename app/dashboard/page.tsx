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
import { QrCode, ChevronRight, Flame } from 'lucide-react'

export default async function DashboardPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/')

  const supabase = getSupabaseAdmin()

  const [{ data: activitiesRaw }, { data: achievementRows }, { data: questRows }, { data: friendships }] =
    await Promise.all([
      supabase.from('activities').select('*').eq('user_id', profile.id).order('start_date', { ascending: false }),
      supabase.from('user_achievements').select('achievement_slug').eq('user_id', profile.id),
      supabase.from('user_quests').select('*, quests(*)').eq('user_id', profile.id),
      supabase.from('friendships').select('id').or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`),
    ])

  const activities: Activity[] = activitiesRaw ?? []
  const recentActivities = activities.slice(0, 8)
  const totalDistance = activities.reduce((s, a) => s + a.distance, 0)
  const totalTime = activities.reduce((s, a) => s + a.moving_time, 0)

  const predictions = getPredictions(activities)
  const history = getPredictionHistory(
    [...activities].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()),
    5
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-zinc-500 text-sm">Welcome back</p>
            <h1 className="text-2xl font-bold text-white">{profile.firstname}</h1>
          </div>
          <div className="flex items-center gap-2">
            {profile.current_streak > 0 && (
              <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-1.5">
                <Flame size={13} className="text-orange-400" />
                <span className="text-orange-400 text-xs font-semibold">{profile.current_streak}</span>
              </div>
            )}
            <SyncButton />
          </div>
        </div>

        {/* XP Bar */}
        <div className="mb-4">
          <XPBar totalXP={profile.total_xp} level={profile.level} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Distance', value: formatDistance(totalDistance) },
            { label: 'Runs', value: `${activities.length}` },
            { label: 'Time', value: formatTime(totalTime) },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-3 text-center">
              <p className="text-white font-bold text-base">{s.value}</p>
              <p className="text-zinc-600 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* 2x XP Banner */}
        <a
          href="/profile"
          className="flex items-center gap-3 bg-green-500/8 border border-green-500/20 rounded-2xl p-4 mb-4 hover:border-green-500/40 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
            <QrCode size={16} className="text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-green-400 text-sm font-semibold">Run together → 2× XP</p>
            <p className="text-zinc-600 text-xs">Show your QR code before the run</p>
          </div>
          <ChevronRight size={16} className="text-zinc-700" />
        </a>

        {/* Race Predictor */}
        {predictions.length > 0 && (
          <div className="mb-4">
            <RacePredictor predictions={predictions} history={history} />
          </div>
        )}

        {/* Quests */}
        <div className="mb-4">
          <QuestsSection userId={profile.id} userQuestsData={questRows ?? []} />
        </div>

        {/* Recent Runs */}
        <div>
          <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3">Recent Runs</p>
          {recentActivities.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-10 text-center">
              <p className="text-zinc-500 text-sm">No runs yet.</p>
              <p className="text-zinc-600 text-xs mt-1">Hit Sync to pull your Strava activities.</p>
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
