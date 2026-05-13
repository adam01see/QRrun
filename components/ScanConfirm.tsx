'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ScanConfirmProps {
  targetUserId: string
  targetName: string
}

export default function ScanConfirm({ targetUserId, targetName }: ScanConfirmProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle')
  const router = useRouter()

  const handlePair = async () => {
    setState('loading')
    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId }),
    })
    if (res.ok) {
      setState('done')
      setTimeout(() => router.push('/dashboard'), 1500)
    } else {
      setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
        <p className="text-green-400 font-semibold">Paired! Go run.</p>
        <p className="text-zinc-400 text-sm mt-1">
          Both of you sync after and get 2x XP automatically.
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-zinc-400 text-sm mb-6">
        Pair with <span className="text-white font-medium">{targetName}</span> for today&apos;s
        run. Your next run today will earn 2x XP for both of you.
      </p>
      <button
        onClick={handlePair}
        disabled={state === 'loading'}
        className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-4 rounded-xl transition-colors disabled:opacity-50 text-lg"
      >
        {state === 'loading' ? 'Pairing...' : "Let's run together"}
      </button>
    </div>
  )
}
