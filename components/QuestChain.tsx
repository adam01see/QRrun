'use client'

import { QuestChainDef } from '@/lib/quests'
import { Check } from 'lucide-react'

interface QuestChainProps {
  chain: QuestChainDef
  completedSlugs: Set<string>
}

export default function QuestChain({ chain, completedSlugs }: QuestChainProps) {
  const steps = chain.quests
  const completedSteps = steps.filter((q) => completedSlugs.has(q.slug))
  const completedCount = completedSteps.length
  const isComplete = completedCount === steps.length

  // Current step = first not yet completed
  const currentStepIndex = steps.findIndex((q) => !completedSlugs.has(q.slug))
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : steps[steps.length - 1]

  return (
    <div className={`bg-zinc-900 border border-zinc-800/60 rounded-2xl p-4 ${isComplete ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{chain.icon}</span>
          <p className="text-white text-sm font-semibold">{chain.name}</p>
        </div>
        <span className="text-zinc-600 text-xs">
          {completedCount}/{steps.length}
        </span>
      </div>

      {/* Step dots */}
      <div className="flex items-center gap-0 mb-3">
        {steps.map((step, i) => {
          const done = completedSlugs.has(step.slug)
          const active = i === currentStepIndex
          return (
            <div key={step.slug} className="flex items-center flex-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                  done
                    ? 'bg-green-500 border-green-500'
                    : active
                    ? 'bg-zinc-800 border-green-500/60'
                    : 'bg-zinc-800/50 border-zinc-700/40'
                }`}
              >
                {done ? (
                  <Check size={11} className="text-white" />
                ) : (
                  <span className="text-zinc-600 text-[9px] font-bold">{i + 1}</span>
                )}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-0.5 ${
                    done ? 'bg-green-500/50' : 'bg-zinc-700/40'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Current step info */}
      {isComplete ? (
        <p className="text-green-400 text-xs font-medium">Chain complete!</p>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-zinc-300 text-xs font-medium">{currentStep.name}</p>
            <p className="text-zinc-600 text-xs mt-0.5">{currentStep.description}</p>
          </div>
          <span className="text-green-400 text-xs font-semibold shrink-0 ml-3">
            +{currentStep.xp_reward}
          </span>
        </div>
      )}
    </div>
  )
}
