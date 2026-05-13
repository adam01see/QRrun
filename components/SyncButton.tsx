'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SyncButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')
  const [result, setResult] = useState<string | null>(null)
  const router = useRouter()

  const handleSync = async () => {
    setState('loading')
    setResult(null)
    const res = await fetch('/api/sync', { method: 'POST' })
    const data = await res.json()
    setState('done')
    if (data.synced !== undefined) {
      const msg =
        data.synced === 0
          ? 'Already up to date'
          : `Synced ${data.synced} run${data.synced !== 1 ? 's' : ''}`
      setResult(
        data.newAchievements?.length
          ? `${msg} · Unlocked: ${data.newAchievements.join(', ')}`
          : msg
      )
    }
    router.refresh()
    setTimeout(() => setState('idle'), 3000)
  }

  return (
    <div className="flex items-center gap-3">
      {result && <p className="text-zinc-400 text-sm">{result}</p>}
      <button
        onClick={handleSync}
        disabled={state === 'loading'}
        className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        {state === 'loading' ? 'Syncing...' : 'Sync Strava'}
      </button>
    </div>
  )
}
