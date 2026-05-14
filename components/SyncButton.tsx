'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Check, AlertCircle } from 'lucide-react'

export default function SyncButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const router = useRouter()

  const handleSync = async () => {
    setState('loading')
    try {
      const res = await fetch('/api/sync', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || data.error) {
        console.error('Sync error:', data.error)
        setState('error')
        setTimeout(() => setState('idle'), 4000)
        return
      }
      setState('done')
      router.refresh()
      setTimeout(() => setState('idle'), 2000)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 4000)
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={state === 'loading'}
      className={`flex items-center gap-1.5 border text-sm font-medium px-3 py-2 rounded-xl transition-colors disabled:opacity-40 ${
        state === 'error'
          ? 'bg-red-500/10 border-red-500/30 text-red-400'
          : 'bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border border-zinc-700/60 text-zinc-300'
      }`}
    >
      {state === 'done' ? (
        <Check size={14} className="text-green-400" />
      ) : state === 'error' ? (
        <AlertCircle size={14} />
      ) : (
        <RefreshCw size={14} className={state === 'loading' ? 'animate-spin' : ''} />
      )}
      <span>
        {state === 'loading' ? 'Syncing' : state === 'done' ? 'Done' : state === 'error' ? 'Failed' : 'Sync'}
      </span>
    </button>
  )
}
