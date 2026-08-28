import { useCallback, useEffect, useRef, useState } from 'react'
import { ensureAudio, setMuted } from '../../audio/sounds'

export interface Playback {
  index: number
  isPlaying: boolean
  atEnd: boolean
  speed: number
  soundOn: boolean
  setSpeed: (v: number) => void
  onPlayPause: () => void
  onStep: () => void
  onReset: () => void
  onToggleSound: () => void
}

/**
 * Shared playback driver for every Laravel material: autoplay timer, Play/Step/
 * Reset/Sound, speed, and the Space/→/R shortcuts. Materials only supply the
 * step count; the visuals stay pure functions of `index`.
 */
export function usePlayback(total: number, resetKey = '', baseDelayMs = 900): Playback {
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [soundOn, setSoundOn] = useState(true)

  const atEnd = index >= total - 1

  // Rewind whenever the step list is rebuilt (e.g. a mode switch).
  useEffect(() => {
    setIndex(0)
    setIsPlaying(false)
  }, [total, resetKey])

  useEffect(() => setMuted(!soundOn), [soundOn])

  const timer = useRef<number | null>(null)
  useEffect(() => {
    if (!isPlaying) return
    if (atEnd) {
      setIsPlaying(false)
      return
    }
    timer.current = window.setTimeout(
      () => setIndex((i) => Math.min(i + 1, total - 1)),
      baseDelayMs / speed,
    )
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [isPlaying, index, atEnd, speed, total, baseDelayMs])

  const onPlayPause = useCallback(() => {
    ensureAudio()
    if (atEnd) {
      setIndex(0)
      setIsPlaying(true)
      return
    }
    setIsPlaying((p) => !p)
  }, [atEnd])

  const onStep = useCallback(() => {
    ensureAudio()
    setIsPlaying(false)
    setIndex((i) => Math.min(i + 1, total - 1))
  }, [total])

  const onReset = useCallback(() => {
    setIsPlaying(false)
    setIndex(0)
  }, [])

  const onToggleSound = useCallback(() => {
    ensureAudio()
    setSoundOn((s) => !s)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      if (e.code === 'Space') {
        e.preventDefault()
        onPlayPause()
      } else if (e.code === 'ArrowRight') {
        onStep()
      } else if (e.key.toLowerCase() === 'r') {
        onReset()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onPlayPause, onStep, onReset])

  return { index, isPlaying, atEnd, speed, soundOn, setSpeed, onPlayPause, onStep, onReset, onToggleSound }
}

/**
 * Fires a per-step sound cue exactly once, even under React StrictMode's double
 * effect invocation. `key` should change on every distinct frame.
 */
export function useStepSound(key: string, enabled: boolean, play: () => void) {
  const last = useRef('')
  useEffect(() => {
    if (!enabled) return
    if (last.current === key) return
    last.current = key
    play()
    // `play` is recreated each render on purpose — the guard above is what
    // prevents a repeat, not the dependency list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled])
}
