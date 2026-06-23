import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MaterialStage from '../../../shared/MaterialStage'
import TitleBlock from '../../../shared/TitleBlock'
import StatusPill from '../../../shared/StatusPill'
import ControlPanel from '../../../shared/ControlPanel'
import { useChrome } from '../../../shared/chrome'
import PhaseLoop from './PhaseLoop'
import EdgeView from './EdgeView'
import StoryPanel from './StoryPanel'
import { buildSteps } from './edgeLoop'
import {
  ensureAudio,
  setMuted,
  playCompare,
  playInsert,
  playVisit,
  playEnqueue,
  playDone,
  playRain,
  playTrap,
  playDeter,
} from '../../../audio/sounds'

const BASE_DELAY_MS = 1500

const BADGES = [
  { label: 'EDGE', value: 'deteksi · putuskan · tindak', color: '#4F8A2F' },
  { label: 'DAYA', value: 'surya · tanpa kimia', color: '#C08A2E' },
]

export default function BSmartIpmMaterial() {
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
      case 'sense':
        playEnqueue(70)
        break
      case 'think':
        playCompare(62)
        break
      case 'act':
        playInsert(66)
        break
      case 'reject':
        playCompare(40)
        break
      case 'rain':
        playRain()
        break
      case 'trap':
        playTrap()
        break
      case 'deter':
        playDeter()
        break
      case 'done':
        playDone()
        break
      default:
        playVisit(64)
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
        <div className="flex h-full w-full flex-col items-center" style={{ paddingTop: 58, paddingBottom: 70, gap: 16 }}>
          <TitleBlock
            title="B-SMART IPM"
            subtitle="Gateway edge bio-perilaku — deteksi, putuskan, bertindak untuk hama sawit"
            badges={BADGES}
          />

          <PhaseLoop phase={step.phase} cycle={step.cycle} skipped={step.actSkipped} />

          <EdgeView step={step} />

          <StatusPill text={step.status} />
          <StoryPanel phase={step.phase} text={step.story} width={900} />

          <div className="font-mono" style={{ fontSize: 22, color: '#9AA889' }}>
            langkah {Math.min(index + 1, steps.length)} / {steps.length}
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
