import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MaterialStage from '../../../shared/MaterialStage'
import TitleBlock from '../../../shared/TitleBlock'
import StatusPill from '../../../shared/StatusPill'
import ControlPanel from '../../../shared/ControlPanel'
import { useChrome } from '../../../shared/chrome'
import Scene from './Scene'
import PhaseBar from './PhaseBar'
import { CLUSTERS, buildSteps } from './embeddings'
import {
  ensureAudio,
  setMuted,
  playCompare,
  playDone,
  playEnqueue,
  playInsert,
  playVisit,
} from '../../../audio/sounds'

const BASE_DELAY_MS = 1900

const BADGES = [
  { label: 'CONCEPT', value: 'vector space', color: '#a855f7' },
  { label: 'METRIC', value: 'distance', color: '#3b82f6' },
]

const LEGEND = Object.values(CLUSTERS)

export default function EmbeddingSpaceMaterial() {
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [soundOn, setSoundOn] = useState(true)
  const { hidden } = useChrome()

  const steps = useMemo(() => buildSteps(), [])
  const atEnd = index >= steps.length - 1
  const step = steps[Math.min(index, steps.length - 1)]

  // Sound — driven by each frame's cue (ref guard avoids double-fire in StrictMode).
  const lastSounded = useRef('')
  useEffect(() => {
    if (!soundOn) return
    const key = String(index)
    if (lastSounded.current === key) return
    lastSounded.current = key
    if (index === 0) return
    switch (step.sound) {
      case 'appear':
        playEnqueue(70)
        break
      case 'cluster':
        playVisit(64)
        break
      case 'query':
        playInsert(64)
        break
      case 'match':
        playCompare(60)
        break
      case 'done':
        playDone()
        break
    }
  }, [index, soundOn, step])

  // Autoplay.
  const timer = useRef<number | null>(null)
  useEffect(() => {
    if (!isPlaying) return
    if (atEnd) {
      setIsPlaying(false)
      return
    }
    timer.current = window.setTimeout(
      () => setIndex((i) => Math.min(i + 1, steps.length - 1)),
      BASE_DELAY_MS / speed,
    )
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [isPlaying, index, atEnd, speed, steps.length])

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
        <div className="flex h-full w-full flex-col items-center" style={{ paddingTop: 70, paddingBottom: 74, gap: 18 }}>
          <TitleBlock title="EMBEDDINGS" subtitle="Words as points — similar meaning sits close" badges={BADGES} />

          <PhaseBar phase={step.phase} />

          {/* 3D viewport (Canvas is transparent → shows the stage gradient) */}
          <div
            className="relative overflow-hidden"
            style={{
              width: 1000,
              height: 1010,
              borderRadius: 28,
              border: '1px solid #D2D5E6',
              background: 'rgba(255,255,255,0.30)',
              boxShadow: 'inset 0 1px 20px rgba(30,34,58,0.05)',
            }}
          >
            <Scene step={step} />

            {/* Cluster legend (only once colours are on) */}
            <AnimatePresence>
              {step.colored && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute flex flex-col"
                  style={{ left: 24, bottom: 24, gap: 8 }}
                >
                  {LEGEND.map((c) => (
                    <div key={c.id} className="flex items-center" style={{ gap: 10 }}>
                      <span className="rounded-full" style={{ width: 16, height: 16, background: c.color }} />
                      <span style={{ fontSize: 20, color: '#3A3550', fontFamily: 'ui-sans-serif, system-ui' }}>{c.label}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <StatusPill text={step.status} />

          <div className="font-mono text-stone-400" style={{ fontSize: 22 }}>
            step {Math.min(index + 1, steps.length)} / {steps.length}
          </div>
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
      </div>
    </>
  )
}
