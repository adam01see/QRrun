import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getFriendshipTitle, getFriendshipProgress, FRIENDSHIP_LEVELS } from '@/lib/friendship'
import Link from 'next/link'

export default async function FriendsPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/')

  const supabase = getSupabaseAdmin()

  const { data: friendships } = await supabase
    .from('friendships')
    .select('*')
    .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
    .order('friendship_xp', { ascending: false })

  // Fetch partner profiles
  const partnerIds = (friendships ?? []).map((f) =>
    f.user1_id === profile.id ? f.user2_id : f.user1_id
  )

  const { data: partners } = partnerIds.length
    ? await supabase
        .from('profiles')
        .select('id, firstname, lastname, username, profile_photo, level')
        .in('id', partnerIds)
    : { data: [] }

  const partnerMap = new Map((partners ?? []).map((p) => [p.id, p]))

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto p-4 pb-16">
        <div className="flex items-center gap-3 py-4 mb-6">
          <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-300 text-sm">
            ← Back
          </Link>
          <h1 className="text-xl font-bold">Friends</h1>
          <Link
            href="/profile"
            className="ml-auto text-sm bg-zinc-800 border border-zinc-700 text-white px-3 py-1.5 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            My QR Code
          </Link>
        </div>

        {(!friendships || friendships.length === 0) ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 text-center">
            <p className="text-4xl mb-4">👟</p>
            <p className="text-white font-semibold mb-2">No running friends yet</p>
            <p className="text-zinc-500 text-sm mb-6">
              Show your QR code to a friend before a run to link up and start earning together.
            </p>
            <Link
              href="/profile"
              className="inline-block bg-green-500 hover:bg-green-400 text-black font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Show My QR Code
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {(friendships ?? []).map((f) => {
              const partnerId = f.user1_id === profile.id ? f.user2_id : f.user1_id
              const partner = partnerMap.get(partnerId)
              if (!partner) return null

              const title = getFriendshipTitle(f.friendship_level)
              const { progress, nextLevelXP, prevLevelXP } = getFriendshipProgress(f.friendship_xp)
              const nextLevel = FRIENDSHIP_LEVELS.find((l) => l.level === f.friendship_level + 1)
              const isMaxLevel = f.friendship_level >= FRIENDSHIP_LEVELS[FRIENDSHIP_LEVELS.length - 1].level

              return (
                <div key={f.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <div className="flex items-center gap-4 mb-4">
                    {partner.profile_photo ? (
                      <img
                        src={partner.profile_photo}
                        alt={partner.firstname}
                        className="w-14 h-14 rounded-full border-2 border-zinc-700"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-zinc-700 flex items-center justify-center text-xl">
                        👟
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-white font-semibold">
                        {partner.firstname} {partner.lastname}
                      </p>
                      <p className="text-zinc-500 text-sm">@{partner.username}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold text-sm">{title}</p>
                      <p className="text-zinc-500 text-xs">Lvl {f.friendship_level}</p>
                    </div>
                  </div>

                  {/* Friendship XP bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-zinc-500 mb-1">
                      <span>{f.friendship_xp} XP</span>
                      {!isMaxLevel && nextLevel && (
                        <span>{nextLevelXP - f.friendship_xp} XP to {nextLevel.title}</span>
                      )}
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${Math.min(progress * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Runs Together', value: f.run_count },
                      { label: 'Shared KM', value: `${f.total_km.toFixed(1)}` },
                      {
                        label: 'Time Together',
                        value: (() => {
                          const h = Math.floor(f.total_time_seconds / 3600)
                          const m = Math.floor((f.total_time_seconds % 3600) / 60)
                          return h > 0 ? `${h}h ${m}m` : `${m}m`
                        })(),
                      },
                    ].map((s) => (
                      <div key={s.label} className="bg-zinc-800 rounded-lg p-2.5 text-center">
                        <p className="text-white font-bold text-sm">{s.value}</p>
                        <p className="text-zinc-500 text-xs mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
