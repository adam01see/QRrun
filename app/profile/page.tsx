import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth'
import QRDisplay from '@/components/QRDisplay'

export default async function ProfilePage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/')

  const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL}/scan/${profile.id}`

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-6">

        <h1 className="text-2xl font-bold mb-6">My QR Code</h1>

        {/* QR Card */}
        <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-8 flex flex-col items-center mb-4">
          {profile.profile_photo && (
            <img
              src={profile.profile_photo}
              alt={profile.firstname}
              className="w-16 h-16 rounded-full border-2 border-zinc-700 mb-4"
            />
          )}
          <p className="text-white font-semibold text-lg">{profile.firstname} {profile.lastname}</p>
          <p className="text-zinc-600 text-sm mb-6">@{profile.username}</p>

          <div className="p-3 bg-zinc-800 rounded-2xl mb-6">
            <QRDisplay url={scanUrl} size={200} />
          </div>

          <p className="text-zinc-400 text-sm text-center max-w-xs">
            Friend scans this → both run → both sync → <span className="text-green-400 font-medium">2× XP for both</span>
          </p>
        </div>

        {/* Steps */}
        <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-5">
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-4">How it works</p>
          <div className="flex flex-col gap-4">
            {[
              { n: '1', text: 'Show this screen to your friend' },
              { n: '2', text: 'They scan with their phone camera' },
              { n: '3', text: 'Go run together' },
              { n: '4', text: 'Both sync Strava — 2× XP auto-applied' },
            ].map(({ n, text }) => (
              <div key={n} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                  <span className="text-green-400 text-xs font-bold">{n}</span>
                </div>
                <p className="text-zinc-400 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
