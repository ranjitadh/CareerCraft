'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  FileText,
  Sparkles,
  PenTool,
  CheckCircle2,
  Download,
  Check,
} from 'lucide-react'

const steps = [
  { label: 'Job Description', icon: FileText },
  { label: 'Analysis', icon: Sparkles },
  { label: 'Tailor Resume', icon: PenTool },
  { label: 'Review', icon: CheckCircle2 },
  { label: 'Export', icon: Download },
]

interface StepProgressProps {
  currentStep: number
}

export default function StepProgress({ currentStep }: StepProgressProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* Background connector line */}
        <div className="absolute top-5 left-[10%] right-[10%] h-[2px] bg-border" />
        {/* Active connector line */}
        <motion.div
          className="absolute top-5 left-[10%] h-[2px] bg-primary"
          initial={false}
          animate={{
            width: `${Math.min(((currentStep - 1) / (steps.length - 1)) * 80, 80)}%`,
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 30 }}
        />

        {steps.map((step, idx) => {
          const stepNum = idx + 1
          const isCompleted = currentStep > stepNum
          const isCurrent = currentStep === stepNum
          const isUpcoming = currentStep < stepNum

          return (
            <div
              key={step.label}
              className="flex flex-col items-center relative z-10"
            >
              <motion.div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300',
                  isCompleted &&
                    'bg-primary border-primary text-primary-foreground',
                  isCurrent &&
                    'bg-background border-primary text-primary shadow-lg shadow-primary/20',
                  isUpcoming &&
                    'bg-background border-border text-muted-foreground'
                )}
                animate={
                  isCurrent
                    ? { scale: [1, 1.08, 1] }
                    : { scale: 1 }
                }
                transition={
                  isCurrent
                    ? { repeat: Infinity, duration: 2, ease: 'easeInOut' }
                    : {}
                }
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <step.icon className="w-4 h-4" />
                )}
              </motion.div>
              <span
                className={cn(
                  'mt-2 text-xs font-medium whitespace-nowrap hidden sm:block',
                  isCompleted && 'text-primary',
                  isCurrent && 'text-foreground font-semibold',
                  isUpcoming && 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
