'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Check } from 'lucide-react'

export default function SyncButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')
  const router = useRouter()

  const handleSync = async () => {
    setState('loading')
    const res = await fetch('/api/sync', { method: 'POST' })
    await res.json()
    setState('done')
    router.refresh()
    setTimeout(() => setState('idle'), 2000)
  }

  return (
    <button
      onClick={handleSync}
      disabled={state === 'loading'}
      className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border border-zinc-700/60 text-zinc-300 text-sm font-medium px-3 py-2 rounded-xl transition-colors disabled:opacity-40"
    >
      {state === 'done' ? (
        <Check size={14} className="text-green-400" />
      ) : (
        <RefreshCw size={14} className={state === 'loading' ? 'animate-spin' : ''} />
      )}
      <span>{state === 'loading' ? 'Syncing' : state === 'done' ? 'Done' : 'Sync'}</span>
    </button>
  )
}
