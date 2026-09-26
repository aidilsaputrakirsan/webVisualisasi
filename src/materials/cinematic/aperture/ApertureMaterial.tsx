import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import MaterialStage from '../../../shared/MaterialStage'
import ControlPanel from '../../../shared/ControlPanel'
import { useChrome } from '../../../shared/chrome'
import { ensureAudio, setMuted, playDescend, playDone, playEnqueue, playTrap } from '../../../audio/sounds'
import Scene from './Scene'
import { CINE } from './palette'
import { CHAPTERS, STEPS } from './story'

/** "a *key* word" → word tokens; asterisked ones get the accent. */
function words(text: string) {
  const out: { w: string; hot: boolean; tail: string }[] = []
  text.split(/(\*[^*]+\*)/).forEach((chunk) => {
    const hot = chunk.startsWith('*')
    chunk
      .replace(/\*/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .forEach((w, i) => {
        // Punctuation right after a highlighted word ("*rahasia*.") joins that word.
        if (i === 0 && !hot && /^[.,:;!?]/.test(w) && out.length) out[out.length - 1].tail += w.match(/^[.,:;!?]+/)![0]
        const rest = i === 0 && !hot ? w.replace(/^[.,:;!?]+/, '') : w
        if (rest) out.push({ w: rest, hot, tail: '' })
      })
  })
  return out
}

/** Left-aligned bold headline; words sharpen in from a blur, one after another. */
function Headline({ text }: { text: string }) {
  return (
    <div style={{ minHeight: 250, width: 940 }}>
      <AnimatePresence mode="wait">
        <motion.h1
          key={text}
          exit={{ opacity: 0, x: -30, transition: { duration: 0.15 } }}
          className="font-sans"
          style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.02, letterSpacing: '-0.035em', color: CINE.text }}
        >
          {words(text).map((t, i) => (
            <Fragment key={i}>
              {i > 0 && ' '}
              <motion.span
                className="inline-block"
                initial={{ opacity: 0, y: 24, filter: 'blur(14px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.42, delay: i * 0.07, ease: [0.2, 0.8, 0.2, 1] }}
                style={{ color: t.hot ? CINE.edge : CINE.text }}
              >
                {t.w}
                {t.tail && <span style={{ color: CINE.text }}>{t.tail}</span>}
              </motion.span>
            </Fragment>
          ))}
        </motion.h1>
      </AnimatePresence>
    </div>
  )
}

function ChapterBar({ chapter }: { chapter: string }) {
  const at = CHAPTERS.indexOf(chapter)
  return (
    <div className="flex items-center justify-between" style={{ width: 940 }}>
      <motion.span
        key={chapter}
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        className="rounded-full font-mono font-bold"
        style={{ fontSize: 24, letterSpacing: 4, padding: '8px 22px', color: CINE.edge, border: `2px solid ${CINE.edge}`, background: 'rgba(255,181,71,0.08)' }}
      >
        {chapter}
      </motion.span>
      <div className="flex" style={{ gap: 10 }}>
        {CHAPTERS.map((c, i) => (
          <motion.span
            key={c}
            animate={{ background: i <= at ? CINE.edge : 'rgba(245,241,234,0.18)', width: i === at ? 70 : 34 }}
            transition={{ duration: 0.3 }}
            style={{ height: 8, borderRadius: 8 }}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Cinematic EP. 01 — dark product-shot look: a real (CC0) vintage camera,
 * a push into its lens, then a six-blade iris opening and closing with bloom.
 * Hard cuts with a white flash between shots; beats hold for `step.ms`.
 */
export default function ApertureMaterial() {
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [soundOn, setSoundOn] = useState(true)
  const { hidden } = useChrome()
  const steps = STEPS
  const atEnd = index >= steps.length - 1
  const step = steps[index]
  const cut = index > 0 && steps[index - 1].shot !== step.shot

  const lastSounded = useRef('')
  useEffect(() => {
    if (!soundOn) return
    const key = String(index)
    if (lastSounded.current === key) return
    lastSounded.current = key
    if (index === 0) return
    switch (step.cue) {
      case 'whoosh':
        playDescend()
        break
      case 'flash':
        playTrap()
        break
      case 'click':
        ;[0, 1, 2, 3, 4, 5].forEach((i) => window.setTimeout(() => playEnqueue(66 - i), i * 45))
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
    timer.current = window.setTimeout(() => setIndex((i) => Math.min(i + 1, steps.length - 1)), step.ms / speed)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [isPlaying, index, atEnd, speed, steps.length, step.ms])

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
      } else if (e.code === 'ArrowRight') handleStep()
      else if (e.key.toLowerCase() === 'r') handleReset()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handlePlayPause, handleStep, handleReset])

  return (
    <>
      <MaterialStage>
        <div className="absolute inset-0" style={{ zIndex: 0, background: CINE.bg }}>
          <Scene step={step} />
        </div>

        {/* Dark scrim behind the text. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0"
          style={{ height: 720, background: `linear-gradient(${CINE.bg}F2 0%, ${CINE.bg}B0 50%, ${CINE.bg}00 100%)` }}
        />

        {/* White flash on every hard cut. */}
        <AnimatePresence>
          {cut && (
            <motion.div
              key={`flash-${index}`}
              className="pointer-events-none absolute inset-0"
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              style={{ background: '#FFF6E8' }}
            />
          )}
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center" style={{ paddingTop: 110, gap: 44 }}>
          <ChapterBar chapter={step.chapter} />
          <Headline text={step.caption} />
        </div>

        <div className="pointer-events-none absolute inset-x-0 flex flex-col items-center" style={{ bottom: 330 }}>
          <AnimatePresence mode="wait">
            {step.stat && (
              <motion.div
                key={step.stat}
                initial={{ opacity: 0, scale: 1.25, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                className="flex flex-col items-center"
              >
                <span className="font-mono" style={{ fontSize: 132, fontWeight: 800, lineHeight: 1, color: CINE.text, textShadow: `0 0 40px ${CINE.edge}88` }}>
                  {step.stat}
                </span>
                {step.statNote && (
                  <span className="font-mono" style={{ fontSize: 26, letterSpacing: 3, marginTop: 14, color: CINE.textSoft }}>
                    {step.statNote.toUpperCase()}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
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
          shot {index + 1} / {steps.length}
        </div>
      </div>
    </>
  )
}
