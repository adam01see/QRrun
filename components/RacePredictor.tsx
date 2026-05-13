'use client'

import { RacePrediction } from '@/types'
import { formatTime } from '@/lib/xp'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useState } from 'react'
import { TrendingDown } from 'lucide-react'

interface RacePredictorProps {
  predictions: RacePrediction[]
  history: { date: string; predicted_seconds: number }[]
}

export default function RacePredictor({ predictions, history }: RacePredictorProps) {
  const [selected, setSelected] = useState(predictions[0]?.label ?? '5K')

  const selectedHistory = history
    .filter((_, i) => i % Math.max(1, Math.floor(history.length / 20)) === 0)
    .map((h) => ({ date: h.date, minutes: Math.round(h.predicted_seconds / 60) }))

  return (
    <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">Race Predictor</h2>
        <TrendingDown size={16} className="text-zinc-600" />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {predictions.map((p) => {
          const isSelected = selected === p.label
          return (
            <button
              key={p.label}
              onClick={() => setSelected(p.label)}
              className={`rounded-xl p-3 text-left transition-all border ${
                isSelected
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-zinc-800/50 border-transparent hover:border-zinc-700'
              }`}
            >
              <p className={`text-xs mb-1 ${isSelected ? 'text-green-400' : 'text-zinc-500'}`}>{p.label}</p>
              <p className="text-white font-bold text-base">{formatTime(p.predicted_seconds)}</p>
            </button>
          )
        })}
      </div>

      {selectedHistory.length > 1 && (
        <div>
          <p className="text-zinc-600 text-xs mb-2">{selected} fitness trend — lower is faster</p>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={selectedHistory}>
              <XAxis dataKey="date" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip
                formatter={(val) => [`${val} min`, selected]}
                contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ display: 'none' }}
                itemStyle={{ color: '#4ade80' }}
              />
              <Line type="monotone" dataKey="minutes" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
