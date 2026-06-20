import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MaterialStage from '../../../shared/MaterialStage'
import ControlPanel from '../../../shared/ControlPanel'
import { useChrome } from '../../../shared/chrome'
import Terminal from './Terminal'
import LoopDiagram from './LoopDiagram'
import FeatureGrid from './FeatureGrid'
import ContextMeter from './ContextMeter'
import { CC, CHAPTERS, GRIDS, TERMINALS, buildSteps, type Step } from './guide'
import {
  ensureAudio,
  setMuted,
  playCompare,
  playInsert,
  playVisit,
  playEnqueue,
  playDone,
} from '../../../audio/sounds'

const BASE_DELAY_MS = 1700

export default function ClaudeCodeMaterial() {
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [soundOn, setSoundOn] = useState(true)
  const { hidden } = useChrome()

  const steps = useMemo(() => buildSteps(), [])
  const atEnd = index >= steps.length - 1
  const step = steps[Math.min(index, steps.length - 1)]

  // Sound — one cue per frame (ref guard avoids double-fire in StrictMode).
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
      case 'select':
        playEnqueue(70)
        break
      case 'tool':
        playInsert(64)
        break
      case 'run':
        playVisit(64)
        break
      case 'done':
        playDone()
        break
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
        <div className="flex h-full w-full flex-col items-center" style={{ paddingTop: 56, paddingBottom: 150, gap: 26 }}>
          <ChapterRail current={step.chapter} />
          <Header step={step} />
          <div className="flex flex-1 flex-col items-center justify-start" style={{ gap: 30, marginTop: 4 }}>
            <Scene step={step} />
          </div>
          <StatusLine text={step.status} />
          <div className="font-mono" style={{ fontSize: 24, color: CC.inkFaint }}>
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

/** Switches the central visual based on the current chapter. */
function Scene({ step }: { step: Step }) {
  const terminal = (
    <Terminal lines={TERMINALS[step.act]} activeLine={step.activeLine} />
  )

  if (step.act === 'loop') {
    return (
      <>
        <LoopDiagram loop={step.loop!} />
        <div style={{ height: 8 }} />
        {terminal}
      </>
    )
  }

  if (step.act === 'recap') {
    return (
      <>
        <LoopDiagram loop={step.loop!} compact />
        <RecapChips activeId={step.grid?.activeId ?? null} />
      </>
    )
  }

  if (step.act === 'context') {
    return (
      <>
        <ContextMeter ctx={step.context!} />
        {terminal}
      </>
    )
  }

  // grid chapters (intro, tools, customize, models, permissions, scaling, security)
  const grid = GRIDS[step.act]
  return (
    <>
      {grid && (
        <FeatureGrid
          key={step.act}
          items={grid.items}
          cols={grid.cols}
          activeId={step.grid?.activeId ?? null}
        />
      )}
      {terminal}
    </>
  )
}

/** Top chapter progress rail. */
function ChapterRail({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center" style={{ gap: 8, flexWrap: 'wrap', maxWidth: 980 }}>
      {CHAPTERS.map((ch, i) => {
        const done = i < current
        const on = i === current
        return (
          <div key={ch.id} className="flex items-center" style={{ gap: 8 }}>
            <motion.div
              className="flex items-center rounded-full font-mono"
              animate={{
                background: on ? CC.coral : done ? 'rgba(134,184,107,0.14)' : CC.panel,
                borderColor: on ? CC.coral : done ? CC.green : CC.line,
                color: on ? '#1A130F' : done ? CC.green : CC.inkFaint,
              }}
              style={{ fontSize: 18, padding: '6px 14px', border: '1px solid', fontWeight: on ? 700 : 500 }}
            >
              <span style={{ opacity: 0.7, marginRight: 6 }}>{String(i + 1).padStart(2, '0')}</span>
              {ch.label}
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}

/** Bespoke dark header (replaces the light shared TitleBlock for this theme). */
function Header({ step }: { step: Step }) {
  return (
    <header className="flex flex-col items-center text-center select-none" style={{ minHeight: 150 }}>
      <span
        className="font-mono"
        style={{ fontSize: 21, letterSpacing: '0.22em', color: CC.coralText, textTransform: 'uppercase' }}
      >
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
          style={{ fontSize: 88, lineHeight: 1.04, color: CC.ink, marginTop: 8, letterSpacing: '0.01em' }}
        >
          {step.heading}
        </motion.h1>
      </AnimatePresence>
      <p style={{ fontSize: 31, color: CC.inkSoft, marginTop: 12, maxWidth: 880 }}>{step.sub}</p>
    </header>
  )
}

/** The animated status caption (bespoke dark StatusPill). */
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
            background: CC.panel,
            border: `1px solid ${CC.line}`,
            borderTop: `3px solid ${CC.coral}`,
            color: CC.inkSoft,
            maxWidth: 980,
          }}
        >
          {text}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/** Recap: chips of the supporting surfaces around the central loop. */
const RECAP_CHIPS = [
  { id: 'context', label: 'Context & Memory', color: CC.amber },
  { id: 'customize', label: 'Customize', color: CC.violet },
  { id: 'models', label: 'Models', color: CC.coral },
  { id: 'scaling', label: 'Scaling', color: CC.blue },
  { id: 'security', label: 'Security', color: CC.green },
]

function RecapChips({ activeId }: { activeId: string | null }) {
  return (
    <div className="flex items-center justify-center" style={{ gap: 14, flexWrap: 'wrap', maxWidth: 920 }}>
      {RECAP_CHIPS.map((chip) => {
        const on = chip.id === activeId
        return (
          <motion.div
            key={chip.id}
            className="rounded-full font-semibold"
            animate={{
              background: on ? chip.color : CC.panel,
              borderColor: chip.color,
              color: on ? '#16120F' : CC.inkSoft,
              scale: on ? 1.06 : 1,
            }}
            style={{ fontSize: 26, padding: '12px 26px', border: '2px solid' }}
          >
            {chip.label}
          </motion.div>
        )
      })}
    </div>
  )
}
