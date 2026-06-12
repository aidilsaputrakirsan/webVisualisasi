import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MaterialStage from '../../../shared/MaterialStage'
import TitleBlock from '../../../shared/TitleBlock'
import CodeBlock from '../../../shared/CodeBlock'
import StatusPill from '../../../shared/StatusPill'
import StoryPanel from '../../../shared/StoryPanel'
import ControlPanel, { ModeButton, type ViewMode } from '../../../shared/ControlPanel'
import { useChrome } from '../../../shared/chrome'
import CoinView from './CoinView'
import { CODE_SOURCE, MODES, buildSteps, type Mode } from './coinChange'
import { ensureAudio, setMuted, playCompare, playInsert, playReturn, playVisit, playDone } from '../../../audio/sounds'

const BASE_DELAY_MS = 1600

const BADGES = [
  { label: 'STRATEGI', value: 'greedy', color: '#0d9488' },
  { label: 'TIME', value: 'O(n)', color: '#3b82f6' },
]

export default function CoinChangeMaterial() {
  const [mode, setMode] = useState<Mode>('rupiah')
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

  // Suara — pitch lembar uang mengikuti besar pecahan (ribuan).
  const lastSounded = useRef('')
  useEffect(() => {
    if (!soundOn) return
    const key = `${mode}:${index}`
    if (lastSounded.current === key) return
    lastSounded.current = key
    if (index === 0) return
    const denomK = step.denomIndex != null ? def.denoms[step.denomIndex].value / 1000 : 0
    if (step.sound === 'check') playCompare(denomK)
    else if (step.sound === 'take') playInsert(denomK)
    else if (step.sound === 'skip') playReturn()
    else if (step.sound === 'twist') playVisit(9)
    else if (step.sound === 'done') playDone()
  }, [index, mode, soundOn, step, def])

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
        <div className="flex h-full w-full flex-col items-center" style={{ paddingTop: 80, paddingBottom: 110, gap: 26 }}>
          <TitleBlock title="UANG KEMBALIAN" subtitle={def.desc} badges={BADGES} />

          <CoinView step={step} def={def} />

          {view === 'code' ? (
            <>
              <StatusPill text={step.status} />
              <CodeBlock filename={def.filename} source={CODE_SOURCE} activeLine={step.line} width={760} fontSize={21} />
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
            {(['rupiah', 'kupon'] as Mode[]).map((m) => (
              <ModeButton key={m} label={MODES[m].label} active={mode === m} onClick={() => handleModeChange(m)} />
            ))}
          </div>
        </ControlPanel>
      </div>
    </>
  )
}
