import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MaterialStage from '../../../shared/MaterialStage'
import ControlPanel from '../../../shared/ControlPanel'
import { useChrome } from '../../../shared/chrome'
import Topology from './Topology'
import GatewayConsole from './GatewayConsole'
import TipGrid from './TipGrid'
import { OC, CHAPTERS, CONSOLES, GRIDS, buildSteps, type Step } from './guide'
import {
  ensureAudio,
  setMuted,
  playCompare,
  playEnqueue,
  playInsert,
  playVisit,
  playDone,
} from '../../../audio/sounds'

const BASE_DELAY_MS = 1700

export default function OpenClawMaterial() {
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
      case 'type':
        playCompare(58)
        break
      case 'send':
        playEnqueue(72)
        break
      case 'recv':
        playVisit(64)
        break
      case 'tip':
        playInsert(64)
        break
      case 'done':
        playDone()
        break
    }
  }, [index, soundOn, step])

  const timer = useRef<number | null>(null)
  useEffect(() => {
    if (!isPlaying) return
    if (atEnd) {
      setIsPlaying(false)
      return
    }
    timer.current = window.setTimeout(
      () => setIndex((i) => Math.min(i + 1, steps.length - 1)),
      (BASE_DELAY_MS * (step.dwell ?? 1)) / speed,
    )
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [isPlaying, index, atEnd, speed, steps.length, step.dwell])

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
        <div className="flex h-full w-full flex-col items-center" style={{ paddingTop: 56, paddingBottom: 150, gap: 24 }}>
          <Header step={step} />
          <div className="flex flex-1 flex-col items-center justify-start" style={{ gap: 26 }}>
            <Scene step={step} />
          </div>
          <StatusLine text={step.status} />
          <div className="font-mono" style={{ fontSize: 24, color: OC.inkFaint }}>
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

function Scene({ step }: { step: Step }) {
  const consolePanel = <GatewayConsole lines={CONSOLES[step.act]} activeLine={step.activeLine} />

  if (step.act === 'architecture' || step.act === 'recap') {
    return (
      <>
        <Topology active={step.topo!.active} />
        {consolePanel}
      </>
    )
  }

  const grid = GRIDS[step.act]
  return (
    <>
      {grid && <TipGrid key={step.act} items={grid.items} cols={grid.cols} activeId={step.grid?.activeId ?? null} />}
      {consolePanel}
    </>
  )
}

function Header({ step }: { step: Step }) {
  return (
    <header className="flex flex-col items-center text-center select-none" style={{ minHeight: 150 }}>
      <span className="font-mono" style={{ fontSize: 21, letterSpacing: '0.22em', color: OC.emeraldText, textTransform: 'uppercase' }}>
        {CHAPTERS[step.chapter].label}
      </span>
      <AnimatePresence mode="wait">
        <motion.h1
          key={step.heading}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="font-serif font-semibold"
          style={{ fontSize: 84, lineHeight: 1.04, color: OC.ink, marginTop: 8, letterSpacing: '0.01em' }}
        >
          {step.heading}
        </motion.h1>
      </AnimatePresence>
      <p style={{ fontSize: 31, color: OC.inkSoft, marginTop: 12, maxWidth: 900 }}>{step.sub}</p>
    </header>
  )
}

function StatusLine({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: 96, width: 980 }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={text}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="rounded-2xl text-center"
          style={{
            fontSize: 28,
            lineHeight: 1.4,
            padding: '18px 34px',
            background: OC.panel,
            border: `1px solid ${OC.line}`,
            borderTop: `3px solid ${OC.emerald}`,
            color: OC.inkSoft,
            maxWidth: 980,
          }}
        >
          {text}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
