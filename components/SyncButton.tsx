'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Check, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

  const isError = state === 'error'

  return (
    <motion.button
      onClick={handleSync}
      disabled={state === 'loading'}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={`flex items-center gap-1.5 border text-sm font-medium px-3 py-2 rounded-xl transition-colors disabled:opacity-40 ${
        isError
          ? 'bg-red-500/10 border-red-500/30 text-red-400'
          : state === 'done'
          ? 'bg-green-500/10 border-green-500/30 text-green-400'
          : 'bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border-zinc-700/60 text-zinc-300'
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={state}
          initial={{ opacity: 0, scale: 0.6, rotate: -30 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.6, rotate: 30 }}
          transition={{ duration: 0.18 }}
          className="flex items-center"
        >
          {state === 'done' ? (
            <Check size={14} />
          ) : isError ? (
            <AlertCircle size={14} />
          ) : (
            <RefreshCw size={14} className={state === 'loading' ? 'animate-spin' : ''} />
          )}
        </motion.span>
      </AnimatePresence>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={state + '-label'}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {state === 'loading' ? 'Syncing' : state === 'done' ? 'Done' : state === 'error' ? 'Failed' : 'Sync'}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
