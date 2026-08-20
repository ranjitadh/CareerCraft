'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface WizardStepProps {
  stepKey: number
  currentStep: number
  children: React.ReactNode
  className?: string
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
    scale: 0.98,
  }),
}

export default function WizardStep({
  stepKey,
  currentStep,
  children,
  className,
}: WizardStepProps) {
  if (stepKey !== currentStep) return null

  const direction = stepKey > currentStep ? 1 : -1

  return (
    <motion.div
      key={stepKey}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.25 },
        scale: { duration: 0.25 },
      }}
      className={cn('w-full', className)}
    >
      {children}
    </motion.div>
  )
}
