import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MaterialStage from '../../../shared/MaterialStage'
import TitleBlock from '../../../shared/TitleBlock'
import CodeBlock from '../../../shared/CodeBlock'
import StatusPill from '../../../shared/StatusPill'
import StoryPanel from '../../../shared/StoryPanel'
import ControlPanel, { ModeButton, type ViewMode } from '../../../shared/ControlPanel'
import { useChrome } from '../../../shared/chrome'
import RangeView from './RangeView'
import { CODE_SOURCE, MODES, buildSteps, type Mode } from './guessNumber'
import {
  ensureAudio,
  setMuted,
  playCompare,
  playShift,
  playDequeue,
  playVisit,
  playDone,
} from '../../../audio/sounds'

const BASE_DELAY_MS = 1600

const BADGES = [
  { label: 'STRATEGI', value: 'binary search', color: '#0d9488' },
  { label: 'TIME', value: 'O(log n)', color: '#3b82f6' },
]

export default function GuessNumberMaterial() {
  const [mode, setMode] = useState<Mode>('r1')
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

  // Suara — pitch mengikuti nilai tebakan (tebakan besar = nada tinggi).
  const lastSounded = useRef('')
  useEffect(() => {
    if (!soundOn) return
    const key = `${mode}:${index}`
    if (lastSounded.current === key) return
    lastSounded.current = key
    if (index === 0) return
    const g = (step.guess ?? 50) / 10
    if (step.sound === 'guess') playCompare(g)
    else if (step.sound === 'up') playShift(g)
    else if (step.sound === 'down') playDequeue(g)
    else if (step.sound === 'hit') playVisit(8)
    else if (step.sound === 'done') playDone()
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
            title="TEBAK ANGKA"
            subtitle="Binary search: tebak tengah, buang setengah — angka 1–100 ketemu maksimal 7 tebakan"
            badges={BADGES}
          />

          <RangeView step={step} secret={def.secret} />

          {view === 'code' ? (
            <>
              <StatusPill text={step.status} />
              <CodeBlock filename="tebak_angka.py" source={CODE_SOURCE} activeLine={step.line} width={760} fontSize={21} />
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
          <div className="grid grid-cols-3 gap-2">
            {(['r1', 'r2', 'r3'] as Mode[]).map((m) => (
              <ModeButton key={m} label={MODES[m].label} active={mode === m} onClick={() => handleModeChange(m)} />
            ))}
          </div>
        </ControlPanel>
      </div>
    </>
  )
}
