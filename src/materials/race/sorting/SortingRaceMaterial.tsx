import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MaterialStage from '../../../shared/MaterialStage'
import ControlPanel from '../../../shared/ControlPanel'
import { useChrome } from '../../../shared/chrome'
import { theme } from '../../../shared/theme'
import { Caption, SeriesTag } from '../../how-it-works/kit/Hud'
import Scene, { type Clock } from './Scene'
import { HOOK_S, buildTimeline, finishS, tickAt } from './race'
import { ensureAudio, setMuted, playCompare, playDone, playVisit } from '../../../audio/sounds'

/** Soft fade under the caption so it reads over the top lane. */
function TopFade() {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0"
      style={{ height: 520, background: `linear-gradient(${theme.paper} 0%, ${theme.paper}F2 55%, ${theme.paper}00 100%)` }}
    />
  )
}

/**
 * Algorithm Race EP. 01 — a short (~22 s) loopable reel. The race itself is
 * precomputed (race.ts); playback is a clock in seconds so every lane advances
 * exactly RATE comparisons per second.
 */
export default function SortingRaceMaterial() {
  const timeline = useMemo(() => buildTimeline(), [])
  const clock = useRef<Clock>({ t: 0 })
  const [t, setT] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [soundOn, setSoundOn] = useState(true)
  const { hidden } = useChrome()

  const atEnd = t >= timeline.totalS - 0.001
  const beat = timeline.beats.find((b) => t < b.end) ?? timeline.beats[timeline.beats.length - 1]
  const raceT = Math.max(0, Math.min(t - HOOK_S, timeline.raceS - 0.4))

  // Playback loop: advance the clock, mirror it to React ~30×/s, play sounds.
  const soundState = useRef({ lastTick: -1, lastNote: 0, turn: 0, finished: new Set<number>(), ended: false })
  useEffect(() => {
    if (!isPlaying) return
    let raf = 0
    let prev = performance.now()
    let lastUi = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000)
      prev = now
      const next = Math.min(timeline.totalS, clock.current.t + dt * speed)
      clock.current.t = next

      if (soundOn) {
        const s = soundState.current
        const tick = tickAt(next)
        // One note at most every 45 ms, rotating across lanes still racing.
        if (tick !== s.lastTick && next >= HOOK_S && now - s.lastNote > 45) {
          const racing = timeline.lanes.map((l, i) => ({ l, i })).filter(({ l }) => tick < l.compares)
          if (racing.length) {
            const { l } = racing[s.turn++ % racing.length]
            const f = l.frames[Math.min(tick, l.frames.length - 1)]
            playCompare(f.v[f.a] ?? 20)
            s.lastNote = now
          }
          s.lastTick = tick
        }
        timeline.lanes.forEach((l, i) => {
          if (!s.finished.has(i) && next >= HOOK_S + finishS(l)) {
            s.finished.add(i)
            playVisit(72 - timeline.order.indexOf(i) * 3)
          }
        })
        if (!s.ended && next >= HOOK_S + timeline.raceS) {
          s.ended = true
          playDone()
        }
      }

      if (now - lastUi > 33 || next >= timeline.totalS) {
        lastUi = now
        setT(next)
      }
      if (next >= timeline.totalS) {
        setIsPlaying(false)
        return
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying, speed, soundOn, timeline])

  useEffect(() => setMuted(!soundOn), [soundOn])

  const seek = useCallback((to: number) => {
    clock.current.t = to
    soundState.current = { lastTick: -1, lastNote: 0, turn: 0, finished: new Set(), ended: false }
    // Lanes already past the finish line shouldn't chime again.
    timeline.lanes.forEach((l, i) => {
      if (to >= HOOK_S + finishS(l)) soundState.current.finished.add(i)
    })
    if (to >= HOOK_S + timeline.raceS) soundState.current.ended = true
    setT(to)
  }, [timeline])

  const handlePlayPause = useCallback(() => {
    ensureAudio()
    if (atEnd) {
      seek(0)
      setIsPlaying(true)
      return
    }
    setIsPlaying((p) => !p)
  }, [atEnd, seek])

  /** Step = jump to the next caption beat. */
  const handleStep = useCallback(() => {
    ensureAudio()
    setIsPlaying(false)
    const next = timeline.beats.find((b) => b.start > clock.current.t + 0.01)
    seek(next ? next.start : timeline.totalS)
  }, [seek, timeline])

  const handleReset = useCallback(() => {
    setIsPlaying(false)
    seek(0)
  }, [seek])

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
        <div className="absolute inset-0" style={{ zIndex: 0, isolation: 'isolate' }}>
          <Scene timeline={timeline} clock={clock} />
        </div>

        <TopFade />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center" style={{ paddingTop: 84, gap: 40 }}>
          <SeriesTag series="ALGORITHM RACE" episode="01" />
          <Caption text={beat.caption} sub={beat.sub} />
        </div>

        <div className="pointer-events-none absolute inset-x-0 flex flex-col items-center" style={{ bottom: 140 }}>
          <span className="font-mono" style={{ fontSize: 22, letterSpacing: 4, color: theme.inkFaint }}>
            RACE TIME
          </span>
          <span className="font-mono font-bold tabular-nums" style={{ fontSize: 76, lineHeight: 1.05, color: theme.ink }}>
            {raceT.toFixed(1)}
            <span style={{ fontSize: 40, color: theme.inkSoft }}> s</span>
          </span>
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
        <div className="mt-2 text-center font-mono text-xs text-stone-500">
          {t.toFixed(1)} s / {timeline.totalS.toFixed(1)} s
        </div>
      </div>
    </>
  )
}
