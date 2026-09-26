import { useEffect, useRef, useState, Fragment } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { theme } from '../../../shared/theme'
import { StageIcon, type IconName } from './Icons'

/** Soft paper fades behind the top/bottom text so it reads over the 3D scene. */
export function PaperFades() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{ height: 620, background: `linear-gradient(${theme.paper} 0%, ${theme.paper}F0 45%, ${theme.paper}00 100%)` }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0"
        style={{ height: 520, background: `linear-gradient(${theme.paper}00 0%, ${theme.paper}EE 55%, ${theme.paper} 100%)` }}
      />
    </>
  )
}

export function SeriesTag({ episode, series = 'HOW IT WORKS' }: { episode: string; series?: string }) {
  return (
    <div className="flex items-center font-mono" style={{ gap: 14, fontSize: 24, letterSpacing: 4, color: theme.inkSoft }}>
      <span style={{ width: 40, height: 2, background: theme.accent }} />
      {series} · EP. {episode}
      <span style={{ width: 40, height: 2, background: theme.accent }} />
    </div>
  )
}

/**
 * Splits "a *key* word?" into word tokens; asterisked words get the accent.
 * Punctuation glued to a word (the "?" in "*Send*?") rides along as its
 * un-highlighted `tail`, so it never wraps onto a line of its own.
 */
function tokens(text: string) {
  const out: { word: string; hot: boolean; tail: string }[] = []
  let prevSpace = true
  text.split(/(\*[^*]+\*)/).forEach((chunk) => {
    if (!chunk) return
    const hot = chunk.startsWith('*') && chunk.endsWith('*')
    const clean = hot ? chunk.slice(1, -1) : chunk
    clean.split(/(\s+)/).forEach((part, i) => {
      if (!part || /^\s+$/.test(part)) return
      if (i === 0 && !prevSpace && out.length) out[out.length - 1].tail += part
      else out.push({ word: part, hot, tail: '' })
    })
    prevSpace = /\s$/.test(clean)
  })
  return out
}

/** Big kinetic caption: words rise in one by one, the key word in amber. */
export function Caption({ text, sub }: { text: string; sub: string }) {
  const words = tokens(text)
  return (
    <div className="flex flex-col items-center text-center" style={{ minHeight: 330, width: 960 }}>
      <AnimatePresence mode="wait">
        <motion.div key={text} exit={{ opacity: 0, y: -24, transition: { duration: 0.18 } }} className="flex flex-col items-center">
          <h1
            className="font-serif font-semibold"
            style={{ fontSize: 92, lineHeight: 1.04, letterSpacing: '-0.01em', color: theme.ink }}
          >
            {words.map((w, i) => (
              <Fragment key={i}>
                {i > 0 && ' '}
                <motion.span
                  className="inline-block"
                  initial={{ opacity: 0, y: 36, rotate: 2 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28, delay: i * 0.06 }}
                >
                  {w.hot ? (
                    <span
                      style={{
                        color: theme.accentDeep,
                        backgroundImage: `linear-gradient(transparent 62%, ${theme.accentSoft} 62%)`,
                      }}
                    >
                      {w.word}
                    </span>
                  ) : (
                    w.word
                  )}
                  {w.tail}
                </motion.span>
              </Fragment>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: words.length * 0.06 + 0.1 }}
            style={{ marginTop: 26, fontSize: 33, lineHeight: 1.35, maxWidth: 900, color: theme.inkSoft }}
          >
            {sub}
          </motion.p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/** Counts smoothly up/down to `target` so numbers visibly tick between beats. */
export function useTween(target: number, duration = 900) {
  const [v, setV] = useState(target)
  const from = useRef(target)
  useEffect(() => {
    const start = performance.now()
    const a = from.current
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const val = a + (target - a) * (1 - Math.pow(1 - p, 3))
      from.current = val
      setV(val)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return v
}

export interface RailStop {
  id: string
  label: string
  icon: IconName
}

/** Six-stop progress rail: where the story is on its trip. */
export function StageRail({ stops, current }: { stops: readonly RailStop[]; current: string }) {
  const at = Math.max(0, stops.findIndex((s) => s.id === current))
  return (
    <div className="relative flex items-start justify-between" style={{ width: 880 }}>
      <div className="absolute" style={{ left: 40, right: 40, top: 33, height: 3, background: theme.line }} />
      <motion.div
        className="absolute"
        style={{ left: 40, top: 33, height: 3, background: theme.accent }}
        animate={{ width: `${(at / (stops.length - 1)) * 800}px` }}
        transition={{ type: 'spring', stiffness: 120, damping: 22 }}
      />
      {stops.map((s, i) => {
        const state = i < at ? 'done' : i === at ? 'now' : 'next'
        return (
          <div key={s.id} className="relative flex flex-col items-center" style={{ width: 80, gap: 8 }}>
            <motion.div
              className="flex items-center justify-center rounded-full border-2"
              animate={{
                scale: state === 'now' ? 1.12 : 1,
                backgroundColor: state === 'next' ? theme.surface : state === 'now' ? theme.accentSoft : theme.accent,
                borderColor: state === 'next' ? theme.lineStrong : theme.accent,
                color: state === 'next' ? theme.inkFaint : state === 'now' ? theme.accentDeep : '#FFFFFF',
              }}
              transition={{ duration: 0.25 }}
              style={{ width: 68, height: 68 }}
            >
              <StageIcon name={s.icon} />
            </motion.div>
            <span
              className="font-mono"
              style={{ fontSize: 19, color: state === 'next' ? theme.inkFaint : theme.inkSoft, fontWeight: state === 'now' ? 700 : 500 }}
            >
              {s.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
