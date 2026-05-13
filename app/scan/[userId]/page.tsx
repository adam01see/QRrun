import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import ScanConfirm from '@/components/ScanConfirm'

export default async function ScanPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const profile = await getCurrentProfile()

  // Not logged in — send to Strava auth, return here after
  if (!profile) {
    redirect(`/api/auth/strava?returnTo=/scan/${userId}`)
  }

  if (profile.id === userId) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-2xl mb-2">🤦</p>
          <p className="text-white font-semibold">That&apos;s your own QR code</p>
          <p className="text-zinc-500 text-sm mt-1">Get a friend to scan yours instead.</p>
          <Link href="/dashboard" className="block mt-4 text-green-400 text-sm">
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const supabase = getSupabaseAdmin()
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('id, firstname, lastname, username, profile_photo')
    .eq('id', userId)
    .single()

  if (!targetProfile) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-white font-semibold">User not found</p>
          <Link href="/dashboard" className="block mt-4 text-green-400 text-sm">
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Check if already paired today
  const today = new Date().toISOString().split('T')[0]
  const { data: existingPairing } = await supabase
    .from('run_pairings')
    .select('status')
    .or(
      `and(user1_id.eq.${profile.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${profile.id})`
    )
    .eq('paired_date', today)
    .single()

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
          {targetProfile.profile_photo && (
            <img
              src={targetProfile.profile_photo}
              alt={targetProfile.firstname}
              className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-zinc-700"
            />
          )}
          <h1 className="text-xl font-bold">
            {targetProfile.firstname} {targetProfile.lastname}
          </h1>
          <p className="text-zinc-500 text-sm mb-6">@{targetProfile.username}</p>

          {existingPairing?.status === 'used' ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <p className="text-green-400 font-semibold">Already ran together today!</p>
              <p className="text-zinc-400 text-sm mt-1">
                Sync your Strava to claim your 2x XP.
              </p>
            </div>
          ) : existingPairing?.status === 'active' ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <p className="text-green-400 font-semibold">Paired for today!</p>
              <p className="text-zinc-400 text-sm mt-1">
                Go run. Both of you sync after and get 2x XP.
              </p>
            </div>
          ) : (
            <ScanConfirm
              targetUserId={targetProfile.id}
              targetName={`${targetProfile.firstname} ${targetProfile.lastname}`}
            />
          )}
        </div>

        <Link
          href="/dashboard"
          className="block text-center text-zinc-600 text-sm mt-4 hover:text-zinc-400"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
