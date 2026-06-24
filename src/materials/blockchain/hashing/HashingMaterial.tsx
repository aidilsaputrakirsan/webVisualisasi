import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MaterialStage from '../../../shared/MaterialStage'
import TitleBlock from '../../../shared/TitleBlock'
import CodeBlock from '../../../shared/CodeBlock'
import StatusPill from '../../../shared/StatusPill'
import ControlPanel from '../../../shared/ControlPanel'
import { useChrome } from '../../../shared/chrome'
import HashingView from './HashingView'
import { CODE_SOURCE, buildSteps } from './hashing'
import { ensureAudio, setMuted, playCompare, playDone, playEnqueue, playInsert, playShift } from '../../../audio/sounds'

const BASE_DELAY_MS = 1400

const BADGES = [
  { label: 'HASIL', value: '256-bit', color: '#2563EB' },
  { label: 'SIFAT', value: 'satu arah', color: '#15803D' },
]

export default function HashingMaterial() {
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [soundOn, setSoundOn] = useState(true)
  const { hidden } = useChrome()

  const steps = useMemo(() => buildSteps(), [])
  const atEnd = index >= steps.length - 1
  const step = steps[Math.min(index, steps.length - 1)]

  const lastSounded = useRef('')
  useEffect(() => {
    if (!soundOn) return
    const key = String(index)
    if (lastSounded.current === key) return
    lastSounded.current = key
    if (index === 0) return
    switch (step.sound) {
      case 'feed':
        playEnqueue(70)
        break
      case 'compute':
        playCompare(60)
        break
      case 'diff':
        playShift(64)
        break
      case 'done':
        playDone()
        break
      default:
        playInsert(64)
    }
  }, [index, soundOn, step])

  const timer = useRef<number | null>(null)
  useEffect(() => {
    if (!isPlaying) return
    if (atEnd) {
      setIsPlaying(false)
      return
    }
    timer.current = window.setTimeout(() => setIndex((i) => Math.min(i + 1, steps.length - 1)), BASE_DELAY_MS / speed)
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
        <div className="flex h-full w-full flex-col items-center" style={{ paddingTop: 72, paddingBottom: 84, gap: 18 }}>
          <TitleBlock title="Hashing Blockchain" subtitle="SHA-256 — sidik jari anti-palsu untuk data apa pun" badges={BADGES} />

          <HashingView step={step} />

          <StatusPill text={step.status} />
          <CodeBlock filename="hash.py" source={CODE_SOURCE} activeLine={step.line} width={760} fontSize={20} />

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
