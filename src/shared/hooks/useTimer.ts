import { useCallback, useEffect, useRef, useState } from 'react'

interface UseTimerOptions {
  autoStart?: boolean
  limit?: number
  onLimit?: () => void
}

export function useTimer({ autoStart = false, limit, onLimit }: UseTimerOptions = {}) {
  const [time, setTime] = useState(0)
  const [running, setRunning] = useState(autoStart)
  const onLimitRef = useRef(onLimit)
  onLimitRef.current = onLimit

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setTime((t) => {
        const next = t + 1
        if (limit !== undefined && next >= limit) {
          setRunning(false)
          onLimitRef.current?.()
          return limit
        }
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running, limit])

  const start = useCallback(() => setRunning(true), [])
  const stop = useCallback(() => setRunning(false), [])
  const reset = useCallback(() => {
    setRunning(false)
    setTime(0)
  }, [])
  const restart = useCallback(() => {
    setTime(0)
    setRunning(true)
  }, [])

  return { time, running, start, stop, reset, restart }
}
