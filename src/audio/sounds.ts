/**
 * Tiny Web Audio synth — generates all sound on the fly, so there are no audio
 * asset files to ship. Notes are mapped onto a pentatonic scale so the playback
 * sounds musical (the classic "sorting sound" effect) and is captured cleanly
 * when you screen-record the tab.
 */

let ctx: AudioContext | null = null
let master: GainNode | null = null

/** Lazily create / resume the AudioContext. Must be called from a user gesture
 *  (e.g. a button click) the first time, or browsers will keep it suspended. */
export function ensureAudio(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    master = ctx.createGain()
    master.gain.value = 0.5
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function setMuted(muted: boolean) {
  if (master && ctx) {
    master.gain.setTargetAtTime(muted ? 0 : 0.5, ctx.currentTime, 0.02)
  }
}

// C major pentatonic across a couple of octaves (Hz).
const SCALE = [
  261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5,
]

/** Map an array value to a pleasant pitch within the scale. */
function pitchFor(value: number): number {
  const idx = Math.abs(Math.round(value)) % SCALE.length
  return SCALE[idx]
}

interface NoteOpts {
  type?: OscillatorType
  duration?: number
  gain?: number
}

function playNote(freq: number, { type = 'sine', duration = 0.16, gain = 0.3 }: NoteOpts = {}) {
  if (!ctx || !master) return
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const env = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(freq, t)

  // Quick attack, exponential decay — short and snappy, no clicks.
  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(gain, t + 0.008)
  env.gain.exponentialRampToValueAtTime(0.0001, t + duration)

  osc.connect(env)
  env.connect(master)
  osc.start(t)
  osc.stop(t + duration + 0.02)
}

/** Soft tick while comparing elements. */
export function playCompare(value: number) {
  playNote(pitchFor(value) / 2, { type: 'sine', duration: 0.08, gain: 0.12 })
}

/** Note played as an element shifts to its new slot. */
export function playShift(value: number) {
  playNote(pitchFor(value), { type: 'triangle', duration: 0.14, gain: 0.26 })
}

/** Warmer pluck when the key is dropped into place. */
export function playInsert(value: number) {
  playNote(pitchFor(value), { type: 'sawtooth', duration: 0.22, gain: 0.22 })
}

/** Little ascending arpeggio when the array is fully sorted. */
export function playDone() {
  if (!ctx) return
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((f, i) => {
    setTimeout(() => playNote(f, { type: 'triangle', duration: 0.3, gain: 0.28 }), i * 90)
  })
}

// ── Expressive cues for tree traversal ──────────────────────────────────────

/** A note that slides in pitch — used for "movement" cues. */
function playGlide(
  from: number,
  to: number,
  { type = 'triangle', duration = 0.14, gain = 0.18 }: NoteOpts = {},
) {
  if (!ctx || !master) return
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const env = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(from, t)
  osc.frequency.exponentialRampToValueAtTime(to, t + duration)

  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(gain, t + 0.01)
  env.gain.exponentialRampToValueAtTime(0.0001, t + duration)

  osc.connect(env)
  env.connect(master)
  osc.start(t)
  osc.stop(t + duration + 0.02)
}

/** Soft downward "whoosh" when descending into a child node. */
export function playDescend() {
  playGlide(680, 460, { type: 'triangle', duration: 0.12, gain: 0.14 })
}

/** Low "thunk" when hitting a None child and returning back up. */
export function playReturn() {
  playGlide(190, 120, { type: 'sine', duration: 0.16, gain: 0.16 })
}

/** Bright two-tone chime when a node's value is emitted. */
export function playVisit(value: number) {
  const f = pitchFor(value)
  playNote(f, { type: 'triangle', duration: 0.24, gain: 0.26 })
  playNote(f * 2, { type: 'sine', duration: 0.18, gain: 0.1 })
}

/** Short high click when a node enters the queue. */
export function playEnqueue(value: number) {
  playNote(pitchFor(value), { type: 'square', duration: 0.07, gain: 0.09 })
}

/** Lower click when a node leaves the queue. */
export function playDequeue(value: number) {
  playNote(pitchFor(value) / 2, { type: 'square', duration: 0.1, gain: 0.12 })
}
