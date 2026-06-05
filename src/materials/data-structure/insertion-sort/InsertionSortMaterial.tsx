import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TitleBlock from '../../../shared/TitleBlock'
import MaterialStage from '../../../shared/MaterialStage'
import ArrayView from './ArrayView'
import StatusBar from './StatusBar'
import CodePanel from './CodePanel'
import Controls from './Controls'
import { buildInsertionSortSteps } from './insertionSort'
import {
  ensureAudio,
  setMuted,
  playCompare,
  playShift,
  playInsert,
  playDone,
} from '../../../audio/sounds'

const DEFAULT_ARRAY = [5, 2, 8, 1, 9, 3, 7, 4, 6, 10]
const BASE_DELAY_MS = 750

const BADGES = [
  { label: 'TIME', value: 'O(n²)', color: '#3b82f6' },
  { label: 'SPACE', value: 'O(1)', color: '#a855f7' },
]

function parseArray(text: string): number[] {
  const nums = text
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n))
    .slice(0, 12)
  return nums.length ? nums : DEFAULT_ARRAY
}

function randomArray(len = 10): number[] {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 99) + 1)
}

export default function InsertionSortMaterial() {
  const [values, setValues] = useState<number[]>(DEFAULT_ARRAY)
  const [arrayText, setArrayText] = useState(DEFAULT_ARRAY.join(', '))
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [soundOn, setSoundOn] = useState(true)

  const steps = useMemo(() => buildInsertionSortSteps(values), [values])
  const atEnd = index >= steps.length - 1
  const step = steps[Math.min(index, steps.length - 1)]

  // Play a sound for the current step, mapped to the active code line. A ref
  // guards against React StrictMode firing the effect twice for one index.
  const lastSounded = useRef(-1)
  useEffect(() => {
    if (!soundOn) return
    if (lastSounded.current === index) return
    lastSounded.current = index

    const valueOf = (id: number | null) => step.cells.find((c) => c.id === id)?.value ?? 0

    switch (step.line) {
      case 4: // while: comparing
        playCompare(valueOf(step.comparingId))
        break
      case 5: // shift right
        playShift(valueOf(step.comparingId))
        break
      case 7: // insert key
        playInsert(valueOf(step.keyId))
        break
      case 8: // sorted
        playDone()
        break
    }
  }, [index, soundOn, step])

  // Autoplay loop.
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

  const loadArray = useCallback((next: number[]) => {
    setValues(next)
    setArrayText(next.join(', '))
    setIndex(0)
    setIsPlaying(false)
  }, [])

  // Keep the synth's master gain in sync with the toggle.
  useEffect(() => setMuted(!soundOn), [soundOn])

  const handlePlayPause = useCallback(() => {
    ensureAudio() // unlock audio from this user gesture
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

  const handleShuffle = useCallback(() => loadArray(randomArray()), [loadArray])
  const handleApplyArray = useCallback((text: string) => loadArray(parseArray(text)), [loadArray])

  // Keyboard shortcuts: Space = play/pause, → = step, R = reset.
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
        {/* Full-canvas portrait layout: title up top, the action in the middle,
            code below — sized in fixed px against the 1080×1920 canvas. */}
        <div
          className="flex h-full w-full flex-col items-center"
          style={{ paddingTop: 130, paddingBottom: 150, gap: 70 }}
        >
          <TitleBlock
            title="INSERTION SORT"
            subtitle="Builds the sorted prefix one item at a time, shifting larger elements right"
            badges={BADGES}
          />

          <div className="flex flex-1 flex-col items-center justify-center" style={{ gap: 48 }}>
            <ArrayView step={step} />
            <StatusBar status={step.status} />
            <CodePanel activeLine={step.line} />
          </div>

          <div className="font-mono text-neutral-600" style={{ fontSize: 22 }}>
            step {Math.min(index + 1, steps.length)} / {steps.length}
          </div>
        </div>
      </MaterialStage>

      {/* Controls live OUTSIDE the recording canvas, floating in the corner so
          the 9:16 frame stays clean. */}
      <div className="fixed bottom-4 left-4 z-50 w-[320px] max-w-[90vw]">
        <Controls
          isPlaying={isPlaying}
          atEnd={atEnd}
          speed={speed}
          arrayText={arrayText}
          soundOn={soundOn}
          onPlayPause={handlePlayPause}
          onStep={handleStep}
          onReset={handleReset}
          onShuffle={handleShuffle}
          onSpeedChange={setSpeed}
          onApplyArray={handleApplyArray}
          onToggleSound={() => {
            ensureAudio()
            setSoundOn((s) => !s)
          }}
        />
      </div>
    </>
  )
}
