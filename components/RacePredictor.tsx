'use client'

import { RacePrediction } from '@/types'
import { formatTime } from '@/lib/xp'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useState } from 'react'

interface RacePredictorProps {
  predictions: RacePrediction[]
  history: { date: string; predicted_seconds: number }[]
}

const DISTANCES = ['5K', '10K', 'Half Marathon', 'Marathon']

export default function RacePredictor({ predictions, history }: RacePredictorProps) {
  const [selected, setSelected] = useState('5K')

  const selectedHistory = history
    .filter((_, i) => i % Math.max(1, Math.floor(history.length / 20)) === 0)
    .map((h) => ({
      date: h.date,
      minutes: Math.round(h.predicted_seconds / 60),
    }))

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h2 className="text-white font-semibold mb-4">Race Time Predictor</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {predictions.map((p) => (
          <div
            key={p.label}
            className="bg-zinc-800 rounded-lg p-3 text-center cursor-pointer hover:border-green-500 border border-transparent transition-colors"
            onClick={() => setSelected(p.label)}
          >
            <p className="text-zinc-400 text-xs mb-1">{p.label}</p>
            <p className="text-white font-bold text-lg">{formatTime(p.predicted_seconds)}</p>
            <p className="text-zinc-500 text-xs">
              {Math.round(p.predicted_seconds / 60)}:{String(p.predicted_seconds % 60).padStart(2, '0')} min
            </p>
          </div>
        ))}
      </div>

      {selectedHistory.length > 1 && (
        <div>
          <p className="text-zinc-400 text-xs mb-2">
            {selected} prediction over time (lower = faster)
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={selectedHistory}>
              <XAxis dataKey="date" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip
                formatter={(val) => [`${val} min`, 'Predicted']}
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                labelStyle={{ color: '#71717a' }}
                itemStyle={{ color: '#22c55e' }}
              />
              <Line
                type="monotone"
                dataKey="minutes"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
