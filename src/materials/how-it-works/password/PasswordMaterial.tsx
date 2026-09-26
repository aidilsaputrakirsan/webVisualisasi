import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MaterialStage from '../../../shared/MaterialStage'
import ControlPanel from '../../../shared/ControlPanel'
import { useChrome } from '../../../shared/chrome'
import { Caption, PaperFades, SeriesTag, StageRail } from '../kit/Hud'
import Scene from './Scene'
import { CrackMeter, Ladder, RAIL } from './Hud'
import { buildSteps } from './story'
import {
  ensureAudio,
  setMuted,
  playCompare,
  playDone,
  playEnqueue,
  playShift,
  playTrap,
  playVisit,
} from '../../../audio/sounds'

/**
 * EP. 06 reel — same format as EP. 01–05: full-bleed 3D, hook as the first
 * frame, last beat mirrors the first so the video loops. Beats carry their
 * own duration (`step.ms`).
 */
export default function PasswordMaterial() {
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [soundOn, setSoundOn] = useState(true)
  const { hidden } = useChrome()

  const steps = useMemo(() => buildSteps(), [])
  const atEnd = index >= steps.length - 1
  const step = steps[Math.min(index, steps.length - 1)]

  // Sound — one cue per beat (ref guard avoids double-fire in StrictMode).
  const lastSounded = useRef('')
  useEffect(() => {
    if (!soundOn) return
    const key = String(index)
    if (lastSounded.current === key) return
    lastSounded.current = key
    if (index === 0) return
    const stagger = (fn: (i: number) => void, n: number, gap: number) =>
      Array.from({ length: n }, (_, i) => window.setTimeout(() => fn(i), i * gap))
    switch (step.cue) {
      case 'grind':
        stagger(() => playShift(2), 5, 120)
        break
      case 'leak':
        playTrap()
        break
      case 'guess':
        stagger((i) => playCompare(58 + i), 8, 110)
        break
      case 'match':
        playVisit(70)
        break
      case 'spin':
        stagger((i) => playEnqueue(60 + (i % 5)), 10, 90)
        break
      case 'long':
        stagger((i) => playEnqueue(62 + (i % 7)), 14, 70)
        break
      case 'chart':
        stagger((i) => playCompare(60 + i * 2), 6, 250)
        break
      case 'done':
        playDone()
        break
    }
  }, [index, soundOn, step])

  // Autoplay — every beat holds for its own duration.
  const timer = useRef<number | null>(null)
  useEffect(() => {
    if (!isPlaying) return
    if (atEnd) {
      setIsPlaying(false)
      return
    }
    timer.current = window.setTimeout(() => setIndex((i) => Math.min(i + 1, steps.length - 1)), step.ms / speed)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [isPlaying, index, atEnd, speed, steps.length, step.ms])

  useEffect(() => setMuted(!soundOn), [soundOn])

  const handlePlayPause = useCallback(() => {
    ensureAudio()
    if (atEnd) {
      setIndex(0)
      setIsPlaying(true)
      return
    }
    setIsPlaying((p) => !p)
  }, [atEnd])

  const handleStep = useCallback(() => {
    ensureAudio()
    setIsPlaying(false)
    setIndex((i) => Math.min(i + 1, steps.length - 1))
  }, [steps.length])

  const handleReset = useCallback(() => {
    setIsPlaying(false)
    setIndex(0)
  }, [])

  // Keyboard: Space / → / R
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      if (e.code === 'Space') {
        e.preventDefault()
        handlePlayPause()
      } else if (e.code === 'ArrowRight') {
        handleStep()
      } else if (e.key.toLowerCase() === 'r') {
        handleReset()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handlePlayPause, handleStep, handleReset])

  return (
    <>
      <MaterialStage>
        {/* Own stacking context so the scene's 3D labels stay under the captions. */}
        <div className="absolute inset-0" style={{ zIndex: 0, isolation: 'isolate' }}>
          <Scene step={step} />
        </div>

        <PaperFades />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center" style={{ paddingTop: 84, gap: 40 }}>
          <SeriesTag episode="06" />
          <Caption text={step.caption} sub={step.sub} />
        </div>

        <div className="pointer-events-none absolute inset-x-0 flex flex-col items-center" style={{ bottom: 130, gap: 30 }}>
          <AnimatePresence mode="wait">
            {step.ladder ? (
              <motion.div key="ladder" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Ladder />
              </motion.div>
            ) : (
              <motion.div key="meter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CrackMeter step={step} />
              </motion.div>
            )}
          </AnimatePresence>
          <StageRail stops={RAIL} current={step.stage} />
        </div>
      </MaterialStage>

      <div className={`fixed bottom-4 left-4 z-50 w-[340px] max-w-[90vw] ${hidden ? 'hidden' : ''}`}>
        <ControlPanel
          isPlaying={isPlaying}
          atEnd={atEnd}
          speed={speed}
          soundOn={soundOn}
          onPlayPause={handlePlayPause}
          onStep={handleStep}
          onReset={handleReset}
          onSpeedChange={setSpeed}
          onToggleSound={() => {
            ensureAudio()
            setSoundOn((s) => !s)
          }}
        />
        <div className="mt-2 text-center font-mono text-xs text-stone-500">
          beat {Math.min(index + 1, steps.length)} / {steps.length}
        </div>
      </div>
    </>
  )
}
