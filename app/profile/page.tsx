import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth'
import QRDisplay from '@/components/QRDisplay'
import Link from 'next/link'

export default async function ProfilePage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/')

  const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL}/scan/${profile.id}`

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-md mx-auto p-4 pb-16">
        <div className="flex items-center gap-3 py-4 mb-6">
          <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-300 text-sm">
            ← Back
          </Link>
          <h1 className="text-xl font-bold">Your QR Code</h1>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center gap-6">
          <div>
            <p className="text-white font-semibold text-lg text-center">
              {profile.firstname} {profile.lastname}
            </p>
            <p className="text-zinc-500 text-sm text-center">@{profile.username}</p>
          </div>

          <QRDisplay url={scanUrl} size={220} />

          <div className="text-center">
            <p className="text-zinc-300 font-medium mb-1">Show this to a friend</p>
            <p className="text-zinc-500 text-sm">
              They scan it before your run together to link up and earn 2x XP for both of you.
            </p>
          </div>
        </div>

        <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-white font-medium mb-3">How it works</h2>
          <ol className="flex flex-col gap-3">
            {[
              'One of you shows their QR code on this screen',
              'The other scans it with their phone camera',
              'Go for your run',
              'Sync Strava — both get 2x XP automatically',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-green-500 text-black text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-zinc-400 text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
