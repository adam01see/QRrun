import Link from 'next/link'
import { getCurrentProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const profile = await getCurrentProfile()
  if (profile) redirect('/dashboard')

  const { error } = await searchParams

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">🏃</div>
        <h1 className="text-4xl font-bold text-white mb-2">RunningQuest</h1>
        <p className="text-zinc-400 text-lg mb-8">
          Gamify your running. Level up. Complete quests. Beat your records.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-10 text-center">
          {[
            { icon: '⚡', label: 'XP System' },
            { icon: '🏆', label: 'Achievements' },
            { icon: '📈', label: 'Race Predictor' },
          ].map((f) => (
            <div key={f.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-2xl mb-1">{f.icon}</p>
              <p className="text-zinc-300 text-sm">{f.label}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-400 text-sm">
              {error === 'strava_denied'
                ? 'Strava access was denied.'
                : 'Something went wrong. Try again.'}
            </p>
          </div>
        )}

        <Link
          href="/api/auth/strava"
          className="block w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold text-lg py-4 rounded-xl transition-colors"
        >
          Connect with Strava
        </Link>
        <p className="text-zinc-600 text-sm mt-3">
          We only read your activities. Nothing is posted.
        </p>
      </div>
    </main>
  )
}
