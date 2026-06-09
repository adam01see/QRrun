import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth'

export default async function AchievementsPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/')

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-6">
        <h1 className="text-2xl font-bold mb-2">Achievements</h1>
        <p className="text-zinc-500 text-sm">Coming soon.</p>
      </div>
    </div>
  )
}
