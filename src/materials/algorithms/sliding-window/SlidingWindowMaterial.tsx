import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MaterialStage from '../../../shared/MaterialStage'
import TitleBlock from '../../../shared/TitleBlock'
import CodeBlock from '../../../shared/CodeBlock'
import StatusPill from '../../../shared/StatusPill'
import StoryPanel from '../../../shared/StoryPanel'
import ControlPanel, { ModeButton, type ViewMode } from '../../../shared/ControlPanel'
import { useChrome } from '../../../shared/chrome'
import WindowView from './WindowView'
import { MODES, buildSteps, type Mode } from './slidingWindow'
import {
  ensureAudio,
  setMuted,
  playInsert,
  playDequeue,
  playCompare,
  playVisit,
  playDone,
} from '../../../audio/sounds'

const BASE_DELAY_MS = 1400

const ORDER: Mode[] = ['brute', 'window']

export default function SlidingWindowMaterial() {
  const [mode, setMode] = useState<Mode>('window')
  const [view, setView] = useState<ViewMode>('story')
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [soundOn, setSoundOn] = useState(true)
  const { hidden } = useChrome()

  const steps = useMemo(() => buildSteps(mode), [mode])
  const atEnd = index >= steps.length - 1
  const step = steps[Math.min(index, steps.length - 1)]
  const def = MODES[mode]

  const badges = useMemo(
    () => [
      { label: 'PATTERN', value: 'sliding window', color: '#0d9488' },
      { label: 'TIME', value: def.complexity, color: mode === 'brute' ? '#DB2777' : '#3b82f6' },
    ],
    [def.complexity, mode],
  )

  // Suara — dipicu fase tiap frame (ref penjaga anti-dobel di StrictMode).
  const lastSounded = useRef('')
  useEffect(() => {
    if (!soundOn) return
    const key = `${mode}:${index}`
    if (lastSounded.current === key) return
    lastSounded.current = key
    if (index === 0) return
    const pitch = (step.sum % 12) + 2
    switch (step.sound) {
      case 'expand':
        playInsert(pitch)
        break
      case 'shrink':
        playDequeue(pitch)
        break
      case 'restart':
        playCompare(4)
        break
      case 'record':
        playVisit(8)
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
        <div className="flex h-full w-full flex-col items-center" style={{ paddingTop: 80, paddingBottom: 110, gap: 30 }}>
          <TitleBlock
            title="SLIDING WINDOW"
            subtitle="Shortest subarray with sum ≥ target — slide the window instead of recomputing"
            badges={badges}
          />

          <WindowView step={step} mode={mode} />

          {view === 'code' ? (
            <>
              <StatusPill text={step.status} />
              <CodeBlock filename="sliding_window.py" source={def.code} activeLine={step.line} width={812} fontSize={20} />
            </>
          ) : (
            <StoryPanel story={step.story} />
          )}

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
          view={view}
          onViewChange={setView}
          onPlayPause={handlePlayPause}
          onStep={handleStep}
          onReset={handleReset}
          onSpeedChange={setSpeed}
          onToggleSound={() => {
            ensureAudio()
            setSoundOn((s) => !s)
          }}
        >
          <div className="grid grid-cols-2 gap-2">
            {ORDER.map((m) => (
              <ModeButton key={m} label={MODES[m].label} active={mode === m} onClick={() => handleModeChange(m)} />
            ))}
          </div>
        </ControlPanel>
      </div>
    </>
  )
}
