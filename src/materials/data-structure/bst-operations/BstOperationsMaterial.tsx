import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MaterialStage from '../../../shared/MaterialStage'
import TitleBlock from '../../../shared/TitleBlock'
import CodeBlock from '../../../shared/CodeBlock'
import BstTreeView from './BstTreeView'
import Controls from './Controls'
import { buildSteps, MODES, SEQUENCE, type Mode } from './operations'
import {
  ensureAudio,
  setMuted,
  playCompare,
  playInsert,
  playVisit,
  playReturn,
  playDone,
} from '../../../audio/sounds'

const BASE_DELAY_MS = 850

const BADGES = [
  { label: 'AVG', value: 'O(log n)', color: '#3b82f6' },
  { label: 'WORST', value: 'O(n)', color: '#a855f7' },
]

export default function BstOperationsMaterial() {
  const [mode, setMode] = useState<Mode>('build')
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [soundOn, setSoundOn] = useState(true)

  const steps = useMemo(() => buildSteps(mode), [mode])
  const atEnd = index >= steps.length - 1
  const step = steps[Math.min(index, steps.length - 1)]

  // Sound — each step carries a cue.
  const lastSounded = useRef('')
  useEffect(() => {
    if (!soundOn) return
    const key = `${mode}:${index}`
    if (lastSounded.current === key) return
    lastSounded.current = key
    if (index === 0) return

    const pitch = step.phaseValue ?? 50
    switch (step.sound) {
      case 'compare':
        playCompare(pitch)
        break
      case 'place':
        playInsert(pitch)
        break
      case 'found':
        playVisit(pitch)
        break
      case 'fail':
      case 'remove':
        playReturn()
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
    timer.current = window.setTimeout(() => {
      setIndex((i) => Math.min(i + 1, steps.length - 1))
    }, BASE_DELAY_MS / speed)
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
        <div className="flex h-full w-full flex-col items-center" style={{ paddingTop: 90, paddingBottom: 130, gap: 30 }}>
          <TitleBlock title="BINARY SEARCH TREE" subtitle={MODES[mode].desc} badges={BADGES} />

          {mode === 'build' ? (
            <InsertTape phaseValue={step.phaseValue} />
          ) : (
            <PhaseChip label={step.phaseLabel} value={step.phaseValue} />
          )}

          <BstTreeView step={step} />

          {/* Status line */}
          <div className="flex items-center justify-center" style={{ height: 52 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step.status}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="rounded-full border border-neutral-800 bg-neutral-900/60 font-mono text-neutral-300"
                style={{ fontSize: 23, padding: '9px 24px' }}
              >
                {step.status}
              </motion.div>
            </AnimatePresence>
          </div>

          <CodeBlock filename={MODES[mode].filename} source={MODES[mode].code} activeLine={step.line} fontSize={21} />

          <div className="font-mono text-neutral-600" style={{ fontSize: 22 }}>
            step {Math.min(index + 1, steps.length)} / {steps.length}
          </div>
        </div>
      </MaterialStage>

      <div className="fixed bottom-4 left-4 z-50 w-[340px] max-w-[90vw]">
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

/** Tape of the insert sequence; inserted ones go green, the current one amber. */
function InsertTape({ phaseValue }: { phaseValue: number | null }) {
  const currentIdx = phaseValue === null ? SEQUENCE.length : SEQUENCE.indexOf(phaseValue)
  return (
    <div className="flex items-center gap-3 font-mono">
      <span className="text-neutral-500" style={{ fontSize: 22 }}>
        Insert
      </span>
      <div className="flex items-center gap-2">
        {SEQUENCE.map((v, i) => {
          const done = i < currentIdx
          const current = i === currentIdx
          return (
            <div
              key={v}
              className="flex items-center justify-center rounded-lg border-2"
              style={{
                width: 50,
                height: 50,
                fontSize: 22,
                borderColor: current ? '#f59e0b' : done ? '#22c55e' : '#3f3f46',
                background: current ? 'rgba(245,158,11,0.15)' : done ? 'rgba(34,197,94,0.12)' : 'transparent',
                color: current ? '#fde68a' : done ? '#bbf7d0' : '#71717a',
                boxShadow: current ? '0 0 18px rgba(245,158,11,0.5)' : 'none',
              }}
            >
              {v}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Compact chip showing the current Search/Delete target. */
function PhaseChip({ label, value }: { label: string; value: number | null }) {
  return (
    <div
      className="flex items-center gap-3 rounded-full border border-amber-500/50 bg-amber-500/10 font-mono"
      style={{ padding: '8px 22px', fontSize: 24, boxShadow: '0 0 18px rgba(245,158,11,0.25)' }}
    >
      <span className="text-neutral-400">{label}</span>
      <span className="font-bold text-amber-200">{value ?? '—'}</span>
    </div>
  )
}
