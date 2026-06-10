import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MaterialStage from '../../../shared/MaterialStage'
import TitleBlock from '../../../shared/TitleBlock'
import CodeBlock from '../../../shared/CodeBlock'
import { theme } from '../../../shared/theme'
import { useChrome } from '../../../shared/chrome'
import CoinView from './CoinView'
import Controls, { type View } from './Controls'
import { CODE_SOURCE, MODES, buildSteps, type Mode } from './coinChange'
import { ensureAudio, setMuted, playCompare, playInsert, playReturn, playVisit, playDone } from '../../../audio/sounds'

const BASE_DELAY_MS = 1600

const BADGES = [
  { label: 'STRATEGI', value: 'greedy', color: '#0d9488' },
  { label: 'TIME', value: 'O(n)', color: '#3b82f6' },
]

export default function CoinChangeMaterial() {
  const [mode, setMode] = useState<Mode>('rupiah')
  const [view, setView] = useState<View>('story')
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
        <Controls
          isPlaying={isPlaying}
          atEnd={atEnd}
          speed={speed}
          mode={mode}
          view={view}
          soundOn={soundOn}
          onPlayPause={handlePlayPause}
          onStep={handleStep}
          onReset={handleReset}
          onSpeedChange={setSpeed}
          onModeChange={handleModeChange}
          onViewChange={setView}
          onToggleSound={() => {
            ensureAudio()
            setSoundOn((s) => !s)
          }}
        />
      </div>
    </>
  )
}

/** Satu kalimat teknis ringkas (selalu tampil di mode kode). */
function StatusPill({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center" style={{ height: 46 }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={text}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="rounded-full border font-mono"
          style={{
            fontSize: 21,
            padding: '8px 24px',
            borderColor: theme.line,
            background: theme.surface,
            color: theme.ink,
            maxWidth: 920,
            textAlign: 'center',
          }}
        >
          {text}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/** Mode cerita: narasi analogi kasir menggantikan panel kode — untuk penonton awam. */
function StoryPanel({ story }: { story: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-2xl border"
      style={{
        width: 800,
        minHeight: 190,
        padding: '28px 40px',
        borderColor: theme.line,
        background: theme.surface,
        boxShadow: '0 6px 18px rgba(33,28,22,0.06)',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.p
          key={story}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22 }}
          className="text-center"
          style={{ fontSize: 31, lineHeight: 1.55, color: theme.ink, maxWidth: 720 }}
        >
          {story}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
