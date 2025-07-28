import { useState, useEffect, useRef } from 'react'

export interface TimerState {
  isRunning: boolean
  startTime: Date | null
  elapsedSeconds: number
  sessionId: string | null
}

export const useTimer = () => {
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    startTime: null,
    elapsedSeconds: 0,
    sessionId: null
  })
  
  const intervalRef = useRef<number | null>(null)

  // Load timer state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('timerState')
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        // Convert string dates back to Date objects
        if (parsed.startTime) {
          parsed.startTime = new Date(parsed.startTime)
        }
        setTimerState(parsed)
      } catch (error) {
        console.error('Error loading timer state:', error)
      }
    }
  }, [])

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('timerState', JSON.stringify(timerState))
  }, [timerState])

  // Timer effect for active session
  useEffect(() => {
    if (timerState.isRunning && timerState.startTime) {
      intervalRef.current = setInterval(() => {
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - timerState.startTime!.getTime()) / 1000)
        setTimerState(prev => ({ ...prev, elapsedSeconds: elapsed }))
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timerState.isRunning, timerState.startTime])

  const startTimer = () => {
    const now = new Date()
    const sessionId = `session_${Date.now()}`
    
    setTimerState({
      isRunning: true,
      startTime: now,
      elapsedSeconds: 0,
      sessionId
    })
  }

  const stopTimer = () => {
    if (!timerState.isRunning || !timerState.startTime) return null

    const endTime = new Date()
    const durationMinutes = Math.floor((endTime.getTime() - timerState.startTime.getTime()) / 1000 / 60)
    
    const timeEntry = {
      sessionId: timerState.sessionId!,
      startISO: timerState.startTime.toISOString(),
      endISO: endTime.toISOString(),
      durationMinutes,
      startTime: timerState.startTime,
      endTime
    }

    // Reset timer state
    setTimerState({
      isRunning: false,
      startTime: null,
      elapsedSeconds: 0,
      sessionId: null
    })

    return timeEntry
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return {
    ...timerState,
    startTimer,
    stopTimer,
    formatTime: () => formatTime(timerState.elapsedSeconds)
  }
} 