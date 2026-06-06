import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MaterialStage from '../../../shared/MaterialStage'
import TitleBlock from '../../../shared/TitleBlock'
import CodeBlock from '../../../shared/CodeBlock'
import { useChrome } from '../../../shared/chrome'
import HashTableView from './HashTableView'
import Controls from './Controls'
import { buildSteps, KEYS, SIZE, MODES, type Mode } from './hashtable'
import { ensureAudio, setMuted, playVisit, playCompare, playDequeue, playDone } from '../../../audio/sounds'

const BASE_DELAY_MS = 850

const BADGES = [
  { label: 'AVG', value: 'O(1)', color: '#3b82f6' },
  { label: 'WORST', value: 'O(n)', color: '#a855f7' },
]

export default function HashTableMaterial() {
  const [mode, setMode] = useState<Mode>('chaining')
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

    const pitch = step.insertingKey ?? 30
    switch (step.sound) {
      case 'place':
        playVisit(pitch)
        break
      case 'probe':
        playDequeue(pitch)
        break
      case 'compare':
        playCompare(pitch)
        break
      case 'done':
        playDone()
        break
    }
  }, [index, mode, soundOn, step])

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

  return (
    <>
      <MaterialStage>
        <div className="flex h-full w-full flex-col items-center" style={{ paddingTop: 90, paddingBottom: 130, gap: 26 }}>
          <TitleBlock title="HASH TABLE" subtitle={def.desc} badges={BADGES} />

          {/* Insert tape */}
          <div className="flex items-center gap-3 font-mono">
            <span className="text-stone-500" style={{ fontSize: 22 }}>
              Insert
            </span>
            <div className="flex items-center gap-2">
              {KEYS.map((k) => {
                const active = step.insertingKey === k
                return (
                  <div
                    key={k}
                    className="flex items-center justify-center rounded-lg border-2 font-semibold"
                    style={{
                      width: 56,
                      height: 50,
                      fontSize: 22,
                      borderColor: active ? '#D97706' : '#D3C8B6',
                      background: active ? '#FDEBC8' : '#FFFFFF',
                      color: active ? '#92400E' : '#A89E90',
                    }}
                  >
                    {k}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Hash formula chip */}
          <div
            className="flex items-center gap-3 rounded-full border font-mono"
            style={{ padding: '7px 20px', fontSize: 22, borderColor: '#CBD9F0', background: '#EAF1FB', color: '#1E40AF' }}
          >
            {step.formula ?? `h(key) = key % ${SIZE}`}
          </div>

          <HashTableView step={step} mode={mode} />

          <div className="flex items-center justify-center" style={{ height: 50 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step.status}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="rounded-full border font-mono"
                style={{ fontSize: 22, padding: '8px 22px', borderColor: '#E4DCCF', background: '#FFFFFF', color: '#4A4338' }}
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
