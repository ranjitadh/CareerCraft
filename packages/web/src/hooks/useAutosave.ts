'use client'

import { useCallback, useRef, useState } from 'react'

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useAutosave(
  callback: () => Promise<void>,
  delay = 2000
) {
  const [status, setStatus] = useState<AutosaveStatus>('idle')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const save = useCallback(async () => {
    if (!mountedRef.current) return

    setStatus('saving')

    try {
      await callback()
      if (!mountedRef.current) return

      setStatus('saved')

      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
      savedTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) setStatus('idle')
      }, 3000)
    } catch {
      if (mountedRef.current) setStatus('error')
    }
  }, [callback])

  const triggerSave = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(() => {
      save()
    }, delay)
  }, [save, delay])

  return { save, status, triggerSave }
}
