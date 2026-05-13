import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { ALL_ACHIEVEMENTS } from '@/lib/achievements'
import Link from 'next/link'

export default async function AchievementsPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/')

  const supabase = getSupabaseAdmin()
  const { data: earnedRows } = await supabase
    .from('user_achievements')
    .select('achievement_slug, earned_at')
    .eq('user_id', profile.id)

  const earnedMap = new Map(
    (earnedRows ?? []).map((r) => [r.achievement_slug, r.earned_at])
  )

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
      <div className="max-w-2xl mx-auto p-4 pb-16">
        <div className="flex items-center gap-3 py-4 mb-6">
          <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-300 text-sm">
            ← Back
          </Link>
          <h1 className="text-xl font-bold">Achievements</h1>
          <span className="text-zinc-500 text-sm ml-auto">
            {earnedMap.size}/{ALL_ACHIEVEMENTS.length} earned
          </span>
        </div>

        {Object.entries(byCategory).map(([category, achievements]) => (
          <div key={category} className="mb-8">
            <h2 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
              {categoryLabels[category] ?? category}
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {achievements.map((a) => {
                const earnedAt = earnedMap.get(a.slug)
                const isEarned = !!earnedAt
                return (
                  <div
                    key={a.slug}
                    className={`bg-zinc-900 border rounded-xl p-4 flex items-center gap-4 transition-opacity ${
                      isEarned ? 'border-zinc-700' : 'border-zinc-800 opacity-50'
                    }`}
                  >
                    <div className="text-3xl">{a.icon}</div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{a.name}</p>
                      <p className="text-zinc-500 text-xs">{a.description}</p>
                      {isEarned && (
                        <p className="text-zinc-600 text-xs mt-0.5">
                          Earned {new Date(earnedAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold ${isEarned ? 'text-green-400' : 'text-zinc-600'}`}>
                        +{a.xp_reward} XP
                      </p>
                      {!isEarned && <p className="text-zinc-600 text-xs">Locked</p>}
                    </div>
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
