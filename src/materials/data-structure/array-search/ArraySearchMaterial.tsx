import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MaterialStage from '../../../shared/MaterialStage'
import TitleBlock from '../../../shared/TitleBlock'
import CodeBlock from '../../../shared/CodeBlock'
import { useChrome } from '../../../shared/chrome'
import SearchView from './SearchView'
import Controls from './Controls'
import { buildSteps, MODES, TARGET, type Mode } from './search'
import { ensureAudio, setMuted, playVisit, playCompare, playDequeue, playReturn, playDone } from '../../../audio/sounds'

const BASE_DELAY_MS = 850

export default function ArraySearchMaterial() {
  const [mode, setMode] = useState<Mode>('linear')
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [soundOn, setSoundOn] = useState(true)
  const { hidden } = useChrome()

  const steps = useMemo(() => buildSteps(mode), [mode])
  const atEnd = index >= steps.length - 1
  const step = steps[Math.min(index, steps.length - 1)]
  const def = MODES[mode]

  const lastSounded = useRef('')
  useEffect(() => {
    if (!soundOn) return
    const key = `${mode}:${index}`
    if (lastSounded.current === key) return
    lastSounded.current = key
    if (index === 0) return

    const pitch = step.activeIndex !== null ? def.array[step.activeIndex] : 30
    switch (step.sound) {
      case 'compare':
        playCompare(pitch)
        break
      case 'eliminate':
        playDequeue(pitch)
        break
      case 'found':
        playVisit(pitch)
        break
      case 'fail':
        playReturn()
        break
      case 'done':
        playDone()
        break
    }
  }, [index, mode, soundOn, step, def])

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

  const handleModeChange = useCallback((m: Mode) => {
    ensureAudio()
    setMode(m)
    setIndex(0)
    setIsPlaying(false)
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

  const badges = [
    { label: 'TIME', value: def.time, color: '#3b82f6' },
    { label: 'SPACE', value: 'O(1)', color: '#a855f7' },
  ]

  return (
    <>
      <MaterialStage>
        <div className="flex h-full w-full flex-col items-center justify-center" style={{ paddingTop: 96, paddingBottom: 130, gap: 44 }}>
          <TitleBlock title="ARRAY SEARCH" subtitle={def.desc} badges={badges} />

          {/* Target chip */}
          <div
            className="flex items-center gap-3 rounded-full border font-mono"
            style={{ padding: '8px 22px', fontSize: 24, borderColor: '#F0C98A', background: '#FDEBC8' }}
          >
            <span style={{ color: '#9C8458' }}>🔍 Target</span>
            <span className="font-bold" style={{ color: '#92400E' }}>{TARGET}</span>
          </div>

          <SearchView array={def.array} step={step} mode={mode} />

          <div className="flex items-center justify-center" style={{ height: 52 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step.status}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="rounded-full border font-mono"
                style={{ fontSize: 23, padding: '9px 24px', borderColor: '#E4DCCF', background: '#FFFFFF', color: '#4A4338' }}
              >
                {step.status}
              </motion.div>
            </AnimatePresence>
          </div>

          <CodeBlock filename={def.filename} source={def.code} activeLine={step.line} fontSize={22} />

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
          soundOn={soundOn}
          onPlayPause={handlePlayPause}
          onStep={handleStep}
          onReset={handleReset}
          onSpeedChange={setSpeed}
          onModeChange={handleModeChange}
          onToggleSound={() => {
            ensureAudio()
            setSoundOn((s) => !s)
          }}
        />
      </div>
    </>
  )
}
