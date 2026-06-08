import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MaterialStage from '../../../shared/MaterialStage'
import TitleBlock from '../../../shared/TitleBlock'
import CodeBlock from '../../../shared/CodeBlock'
import { useChrome } from '../../../shared/chrome'
import SagaView from './SagaView'
import Controls from './Controls'
import { buildSteps, CODE_SOURCE, MODES, type Mode } from './saga'
import {
  ensureAudio,
  setMuted,
  playVisit,
  playReturn,
  playShift,
  playCompare,
  playDone,
} from '../../../audio/sounds'

const BASE_DELAY_MS = 900

const BADGES = [
  { label: 'PATTERN', value: 'saga', color: '#a855f7' },
  { label: 'TXN', value: 'compensating', color: '#3b82f6' },
]

export default function SagaMaterial() {
  const [mode, setMode] = useState<Mode>('fail')
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [soundOn, setSoundOn] = useState(true)
  const { hidden } = useChrome()

  const steps = useMemo(() => buildSteps(mode), [mode])
  const atEnd = index >= steps.length - 1
  const step = steps[Math.min(index, steps.length - 1)]
  const def = MODES[mode]

  const lastSounded = useRef('')
  useEffect(() => {
    if (!soundOn) return
    const key = `${mode}:${index}`
    if (lastSounded.current === key) return
    lastSounded.current = key
    if (index === 0) return
    switch (step.sound) {
      case 'run':
        playCompare(58)
        break
      case 'commit':
        playVisit(64)
        break
      case 'fail':
        playReturn()
        break
      case 'compensate':
        playShift(46)
        break
      case 'done':
        playDone()
        break
    }
  }, [index, mode, soundOn, step])

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
        <div className="flex h-full w-full flex-col items-center" style={{ paddingTop: 80, paddingBottom: 104, gap: 20 }}>
          <TitleBlock title="SAGA" subtitle={def.desc} badges={BADGES} />

          <SagaView step={step} />

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
                  borderColor: '#D9DCE9',
                  background: '#FFFFFF',
                  color: '#39405A',
                  maxWidth: 940,
                  textAlign: 'center',
                }}
              >
                {step.status}
              </motion.div>
            </AnimatePresence>
          </div>

          <CodeBlock filename="saga.py" source={CODE_SOURCE} activeLine={step.line} width={812} fontSize={20} />

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
