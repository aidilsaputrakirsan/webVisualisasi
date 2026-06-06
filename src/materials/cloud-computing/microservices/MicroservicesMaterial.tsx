import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MaterialStage from '../../../shared/MaterialStage'
import TitleBlock from '../../../shared/TitleBlock'
import CodeBlock from '../../../shared/CodeBlock'
import { useChrome } from '../../../shared/chrome'
import ArchView from './ArchView'
import Controls from './Controls'
import { buildSteps, MODES, type Mode } from './arch'
import {
  ensureAudio,
  setMuted,
  playVisit,
  playCompare,
  playEnqueue,
  playShift,
  playDescend,
  playDone,
} from '../../../audio/sounds'

const BASE_DELAY_MS = 900

const BADGES = [
  { label: 'PATTERN', value: 'API Gateway', color: '#a855f7' },
  { label: 'DB', value: 'per-service', color: '#3b82f6' },
]

export default function MicroservicesMaterial() {
  const [mode, setMode] = useState<Mode>('login')
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [soundOn, setSoundOn] = useState(true)
  const { hidden } = useChrome()

  const steps = useMemo(() => buildSteps(mode), [mode])
  const atEnd = index >= steps.length - 1
  const step = steps[Math.min(index, steps.length - 1)]
  const def = MODES[mode]

  // Sound — driven by each frame's cue (ref guard avoids double-fire in StrictMode).
  const lastSounded = useRef('')
  useEffect(() => {
    if (!soundOn) return
    const key = `${mode}:${index}`
    if (lastSounded.current === key) return
    lastSounded.current = key
    if (index === 0) return
    switch (step.sound) {
      case 'send':
        playEnqueue(70)
        break
      case 'route':
        playCompare(60)
        break
      case 'db':
        playShift(56)
        break
      case 'verify':
        playDescend()
        break
      case 'back':
        playVisit(64)
        break
      case 'done':
        playDone()
        break
    }
  }, [index, mode, soundOn, step])

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

  const handleModeChange = useCallback((m: Mode) => {
    ensureAudio()
    setMode(m)
    setIndex(0)
    setIsPlaying(false)
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
        <div className="flex h-full w-full flex-col items-center" style={{ paddingTop: 84, paddingBottom: 120, gap: 24 }}>
          <TitleBlock title="MICROSERVICES" subtitle={def.desc} badges={BADGES} />

          <ArchView step={step} stepKey={index} />

          <div className="flex items-center justify-center" style={{ height: 50 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step.status}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="rounded-full border font-mono"
                style={{
                  fontSize: 21,
                  padding: '9px 24px',
                  borderColor: '#E4DCCF',
                  background: '#FFFFFF',
                  color: '#4A4338',
                  maxWidth: 920,
                  textAlign: 'center',
                }}
              >
                {step.status}
              </motion.div>
            </AnimatePresence>
          </div>

          <CodeBlock filename={def.filename} source={def.code} activeLine={step.line} width={812} fontSize={20} />

          <div className="font-mono text-stone-400" style={{ fontSize: 22 }}>
            step {Math.min(index + 1, steps.length)} / {steps.length}
          </div>
        </div>
      </MaterialStage>

      <div className={`fixed bottom-4 left-4 z-50 w-[340px] max-w-[90vw] ${hidden ? 'hidden' : ''}`}>
        <Controls
          isPlaying={isPlaying}
          atEnd={atEnd}
          speed={speed}
          mode={mode}
          soundOn={soundOn}
          onPlayPause={handlePlayPause}
          onStep={handleStep}
          onReset={handleReset}
          onSpeedChange={setSpeed}
          onModeChange={handleModeChange}
          onToggleSound={() => {
            ensureAudio()
            setSoundOn((s) => !s)
          }}
        />
      </div>
    </>
  )
}
