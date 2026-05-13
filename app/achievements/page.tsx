import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { ALL_ACHIEVEMENTS } from '@/lib/achievements'

export default async function AchievementsPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/')

  const supabase = getSupabaseAdmin()
  const { data: earnedRows } = await supabase
    .from('user_achievements')
    .select('achievement_slug, earned_at')
    .eq('user_id', profile.id)

  const earnedMap = new Map((earnedRows ?? []).map((r) => [r.achievement_slug, r.earned_at]))

  const byCategory = ALL_ACHIEVEMENTS.reduce((acc, a) => {
    if (!acc[a.category]) acc[a.category] = []
    acc[a.category].push(a)
    return acc
  }, {} as Record<string, typeof ALL_ACHIEVEMENTS>)

  const categoryLabels: Record<string, string> = {
    distance: 'Distance',
    consistency: 'Consistency',
    social: 'Social',
    special: 'Special',
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-6">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Achievements</h1>
          <span className="text-zinc-500 text-sm bg-zinc-900 border border-zinc-800/60 rounded-xl px-3 py-1">
            {earnedMap.size} / {ALL_ACHIEVEMENTS.length}
          </span>
        </div>

        {Object.entries(byCategory).map(([category, achievements]) => (
          <div key={category} className="mb-8">
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-3">
              {categoryLabels[category] ?? category}
            </p>
            <div className="flex flex-col gap-2">
              {achievements.map((a) => {
                const earnedAt = earnedMap.get(a.slug)
                const isEarned = !!earnedAt
                return (
                  <div
                    key={a.slug}
                    className={`bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 flex items-center gap-4 ${
                      !isEarned ? 'opacity-35' : ''
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                      isEarned ? 'bg-zinc-800' : 'bg-zinc-800/50'
                    }`}>
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{a.name}</p>
                      <p className="text-zinc-500 text-xs mt-0.5">{a.description}</p>
                      {isEarned && earnedAt && (
                        <p className="text-zinc-700 text-xs mt-1">
                          {new Date(earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <p className={`text-sm font-semibold shrink-0 ${isEarned ? 'text-green-400' : 'text-zinc-700'}`}>
                      +{a.xp_reward}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
