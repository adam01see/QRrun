'use client'

import Link from 'next/link'
import { Zap, Map, Users } from 'lucide-react'
import { motion } from 'framer-motion'

const FEATURES = [
  { icon: Zap, label: 'XP & Levels', desc: 'Earn XP for every run' },
  { icon: Map, label: 'World Map', desc: 'Travel the world by running' },
  { icon: Users, label: 'Social Runs', desc: 'Scan QR for 2x XP' },
]

export default function LandingPage({ error }: { error?: string }) {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 }}
          className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-6"
        >
          <span className="text-3xl">🏃</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.12 }}
          className="text-4xl font-bold text-white tracking-tight mb-3"
        >
          RunningQuest
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="text-zinc-400 text-lg max-w-xs leading-relaxed"
        >
          Turn every run into progress. Level up, earn achievements, run with friends.
        </motion.p>
      </div>

      {/* Features */}
      <div className="px-6 mb-8">
        <motion.div
          className="grid grid-cols-2 gap-3 max-w-sm mx-auto"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08, delayChildren: 0.28 } },
          }}
        >
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <motion.div
              key={label}
              variants={{
                hidden: { opacity: 0, y: 14, scale: 0.95 },
                show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
              }}
              className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4"
            >
              <Icon size={18} className="text-green-400 mb-2" strokeWidth={1.8} />
              <p className="text-white text-sm font-medium">{label}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.52 }}
        className="px-6 pb-12 max-w-sm mx-auto w-full"
      >
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
            <p className="text-red-400 text-sm">
              {error === 'strava_denied' ? 'Strava access was denied.' : 'Something went wrong. Try again.'}
            </p>
          </div>
        )}

        <motion.div whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
          <Link
            href="/api/auth/strava"
            className="flex items-center justify-center gap-2 w-full bg-[#FC4C02] hover:bg-[#e04400] active:bg-[#c93d00] text-white font-semibold text-base py-4 rounded-2xl transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
            </svg>
            Continue with Strava
          </Link>
        </motion.div>
        <p className="text-zinc-600 text-xs text-center mt-3">
          Read-only access. We never post to your Strava.
        </p>
      </motion.div>
    </main>
  )
}
