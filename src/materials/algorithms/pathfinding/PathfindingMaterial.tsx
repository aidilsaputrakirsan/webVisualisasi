import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MaterialStage from '../../../shared/MaterialStage'
import TitleBlock from '../../../shared/TitleBlock'
import CodeBlock from '../../../shared/CodeBlock'
import { useChrome } from '../../../shared/chrome'
import ControlPanel, { ModeButton } from '../../../shared/ControlPanel'
import GridView from './GridView'
import { GOAL, buildSteps, rc, MODES, type Mode } from './pathfinding'
import { ensureAudio, setMuted, playCompare, playEnqueue, playVisit, playDone } from '../../../audio/sounds'

const BASE_DELAY_MS = 130

const BADGES = [
  { label: 'GRAPH', value: 'shortest path', color: '#0d9488' },
  { label: 'GRID', value: '13 × 15', color: '#3b82f6' },
]

export default function PathfindingMaterial() {
  const [mode, setMode] = useState<Mode>('astar')
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1.5)
  const [soundOn, setSoundOn] = useState(true)
  const { hidden } = useChrome()

  const steps = useMemo(() => buildSteps(mode), [mode])
  const atEnd = index >= steps.length - 1
  const step = steps[Math.min(index, steps.length - 1)]
  const def = MODES[mode]

  // Sound — expansion pitched by how close the current cell is to the goal.
  const lastSounded = useRef('')
  useEffect(() => {
    if (!soundOn) return
    const key = `${mode}:${index}`
    if (lastSounded.current === key) return
    lastSounded.current = key
    if (index === 0) return
    if (step.sound === 'visit' && step.current != null) {
      const [r, c] = rc(step.current)
      const [gr, gc] = rc(GOAL)
      const dist = Math.abs(r - gr) + Math.abs(c - gc)
      playCompare(28 - dist) // closer → higher pitch
    } else if (step.sound === 'frontier') {
      playEnqueue(58)
    } else if (step.sound === 'path') {
      playVisit(60)
    } else if (step.sound === 'done') {
      playDone()
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
        <div className="flex h-full w-full flex-col items-center" style={{ paddingTop: 72, paddingBottom: 96, gap: 18 }}>
          <TitleBlock title="PATHFINDING" subtitle={def.desc} badges={BADGES} />

          <GridView step={step} />

          <div className="flex items-center justify-center" style={{ height: 46 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step.status}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="rounded-full border font-mono"
                style={{
                  fontSize: 21,
                  padding: '8px 24px',
                  borderColor: '#D6E3DD',
                  background: '#FFFFFF',
                  color: '#2C3A34',
                  maxWidth: 920,
                  textAlign: 'center',
                }}
              >
                {step.status}
              </motion.div>
            </AnimatePresence>
          </div>

          <CodeBlock filename={`${mode}.py`} source={def.code} activeLine={step.line} width={760} fontSize={19} />

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
        >
          <div className="grid grid-cols-3 gap-2">
            {(['bfs', 'greedy', 'astar'] as Mode[]).map((m) => (
              <ModeButton key={m} label={MODES[m].label} active={mode === m} onClick={() => handleModeChange(m)} />
            ))}
          </div>
        </ControlPanel>
      </div>
    </>
  )
}
