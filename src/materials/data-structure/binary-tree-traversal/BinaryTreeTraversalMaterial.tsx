import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MaterialStage from '../../../shared/MaterialStage'
import TitleBlock from '../../../shared/TitleBlock'
import CodeBlock from '../../../shared/CodeBlock'
import { useChrome } from '../../../shared/chrome'
import TreeView from './TreeView'
import OutputBar from './OutputBar'
import QueueView from './QueueView'
import Controls from './Controls'
import { buildTraversalSteps, TRAVERSALS, type Kind } from './traversal'
import { node, connectingEdge } from './tree'
import {
  ensureAudio,
  setMuted,
  playVisit,
  playDescend,
  playReturn,
  playEnqueue,
  playDequeue,
  playDone,
} from '../../../audio/sounds'

const BASE_DELAY_MS = 800

const BADGES = [
  { label: 'TIME', value: 'O(n)', color: '#3b82f6' },
  { label: 'SPACE', value: 'O(h)', color: '#a855f7' },
]

export default function BinaryTreeTraversalMaterial() {
  const [kind, setKind] = useState<Kind>('preorder')
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [soundOn, setSoundOn] = useState(true)
  const { hidden } = useChrome()

  const steps = useMemo(() => buildTraversalSteps(kind), [kind])
  const atEnd = index >= steps.length - 1
  const step = steps[Math.min(index, steps.length - 1)]

  // The edge the pointer is currently walking (between the previous and current
  // active node, when they are directly connected) — lit amber in TreeView.
  const activeEdge = useMemo(
    () => (index === 0 ? null : connectingEdge(steps[index - 1].activeId, step.activeId)),
    [index, steps, step],
  )

  // Sound: each step carries a cue, so manual + auto play sound identically.
  const lastSounded = useRef('')
  useEffect(() => {
    if (!soundOn) return
    const key = `${kind}:${index}`
    if (lastSounded.current === key) return
    lastSounded.current = key
    if (index === 0) return

    switch (step.sound) {
      case 'visit':
        playVisit(step.output[step.output.length - 1])
        break
      case 'descend':
        playDescend()
        break
      case 'return':
        playReturn()
        break
      case 'enqueue':
        playEnqueue(node(step.queue[step.queue.length - 1]).value)
        break
      case 'dequeue':
        playDequeue(step.activeId ? node(step.activeId).value : 1)
        break
      case 'done':
        playDone()
        break
    }
  }, [index, kind, soundOn, step])

  // Autoplay loop.
  const timer = useRef<number | null>(null)
  useEffect(() => {
    if (!isPlaying) return
    if (atEnd) {
      setIsPlaying(false)
      return
    }
    timer.current = window.setTimeout(() => {
      setIndex((i) => Math.min(i + 1, steps.length - 1))
    }, BASE_DELAY_MS / speed)
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

  const handleKindChange = useCallback((k: Kind) => {
    ensureAudio()
    setKind(k)
    setIndex(0)
    setIsPlaying(false)
  }, [])

  // Keyboard: Space = play/pause, → = step, R = reset.
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

  const def = TRAVERSALS[kind]

  return (
    <>
      <MaterialStage>
        <div
          className="flex h-full w-full flex-col items-center"
          style={{ paddingTop: 100, paddingBottom: 140, gap: 36 }}
        >
          <TitleBlock title="BINARY TREE TRAVERSAL" subtitle={`${def.label} · ${def.order}`} badges={BADGES} />

          <TreeView step={step} activeEdge={activeEdge} />

          {kind === 'levelorder' && <QueueView queue={step.queue} />}

          <OutputBar output={step.output} />

          {/* Status line */}
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

          <CodeBlock filename={`${kind}.py`} source={def.code} activeLine={step.line} />

          <div className="font-mono text-stone-400" style={{ fontSize: 22 }}>
            step {Math.min(index + 1, steps.length)} / {steps.length}
          </div>
        </div>
      </MaterialStage>

      {/* Controls live OUTSIDE the recording canvas. */}
      <div className={`fixed bottom-4 left-4 z-50 w-[340px] max-w-[90vw] ${hidden ? 'hidden' : ''}`}>
        <Controls
          isPlaying={isPlaying}
          atEnd={atEnd}
          speed={speed}
          kind={kind}
          soundOn={soundOn}
          onPlayPause={handlePlayPause}
          onStep={handleStep}
          onReset={handleReset}
          onSpeedChange={setSpeed}
          onKindChange={handleKindChange}
          onToggleSound={() => {
            ensureAudio()
            setSoundOn((s) => !s)
          }}
        />
      </div>
    </>
  )
}
