import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MaterialStage from '../../../shared/MaterialStage'
import TitleBlock from '../../../shared/TitleBlock'
import CodeBlock from '../../../shared/CodeBlock'
import StatusPill from '../../../shared/StatusPill'
import ControlPanel from '../../../shared/ControlPanel'
import { useChrome } from '../../../shared/chrome'
import MatchFocus from './MatchFocus'
import BracketTree from './BracketTree'
import ChampionReveal from './ChampionReveal'
import ProbabilityChart from './ProbabilityChart'
import { theme } from '../../../shared/theme'
import { buildSteps, CODE_SOURCE, TEAMS } from './worldCup'
import { ensureAudio, setMuted, playCompare, playShift, playInsert, playEnqueue, playDone } from '../../../audio/sounds'

const BASE_DELAY_MS = 1500

const BADGES = [
  { label: 'METHOD', value: 'Monte Carlo', color: '#0d9488' },
  { label: 'MODEL', value: 'Elo rating', color: '#3b82f6' },
]

export default function WorldCupPredictorMaterial() {
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [soundOn, setSoundOn] = useState(true)
  const { hidden } = useChrome()

  const steps = useMemo(() => buildSteps(), [])
  const atEnd = index >= steps.length - 1
  const step = steps[Math.min(index, steps.length - 1)]

  // The bracket diagram only starts once we know the 8 quarterfinalists
  // (tree round >= 1). Before that (Round of 32 + Round of 16), each match
  // is told one at a time via the big MatchFocus card.
  //
  // Crucially, the bracket shows just ONE simulated tournament, so its winner
  // (e.g. Argentina) is NOT the prediction. The moment Monte Carlo begins we
  // hide the bracket entirely and switch to the probability chart, so a single
  // random outcome is never shown next to the statistical champion (France).
  const treeRound = step.activeTreeKey ? Number(step.activeTreeKey.split('-')[0]) : null
  const showMatchFocus = step.stage === 'r32' || (step.stage === 'tree' && treeRound === 0)
  const showBracketTree = step.stage === 'tree' && treeRound !== null && treeRound >= 1

  // Sound — one cue per frame (ref guard avoids double-fire in StrictMode).
  const lastSounded = useRef('')
  useEffect(() => {
    if (!soundOn) return
    const key = String(index)
    if (lastSounded.current === key) return
    lastSounded.current = key
    if (index === 0) return
    switch (step.sound) {
      case 'reveal':
        playCompare(index)
        break
      case 'upset':
        playShift(index)
        break
      case 'advance':
        playInsert(index)
        break
      case 'tally':
        playEnqueue(index)
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
        <div className="flex h-full w-full flex-col items-center" style={{ paddingTop: 64, paddingBottom: 90, gap: 20 }}>
          <TitleBlock
            title="WORLD CUP PREDICTOR"
            subtitle="Real Round of 32 field · Monte Carlo fills in what hasn't been played yet"
            badges={BADGES}
          />

          {showMatchFocus && <MatchFocus step={step} />}
          {showBracketTree && <BracketTree step={step} />}
          <ChampionReveal step={step} />

          {step.probabilities && (
            <>
              <div className="font-mono" style={{ fontSize: 15, letterSpacing: '0.06em', color: theme.inkFaint }}>
                STATISTICAL PREDICTION · ALL SIMULATIONS SO FAR
              </div>
              <ProbabilityChart
                teams={TEAMS}
                probabilities={step.probabilities}
                championId={step.championId}
                trialCount={step.trialCount}
              />
            </>
          )}

          <StatusPill text={step.status} />

          <CodeBlock filename="predict.py" source={CODE_SOURCE} activeLine={step.line} width={860} fontSize={23} />

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
