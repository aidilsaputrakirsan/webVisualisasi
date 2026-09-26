/**
 * EP. 03 — "How does your phone know where you are?" (GPS trilateration +
 * the clock problem + relativity), precomputed as Step[].
 *
 * Same diorama as the other episodes; four satellites hang above phone A
 * (not to scale — real ones are 20,200 km up). Each satellite's signal delay
 * gives a distance; the sphere of that radius meets the ground in a circle
 * through the phone. Three circles leave one common point.
 *
 * Facts used (all standard GPS numbers):
 *  - ~30 operational GPS satellites at 20,200 km altitude.
 *  - Receivers only listen; nothing is sent to the satellites.
 *  - 1 µs of clock error × speed of light ≈ 300 m.
 *  - Relativity: satellite clocks gain ≈ 38 µs/day (≈ +45 gravity, −7 speed);
 *    uncorrected, that is ≈ 10–11 km of error per day.
 */
import { PHONE_A, PHONE_SCREEN_Y, add, phoneClose, type Vec3 } from '../kit/geo'

export type Screen = 'searching' | 'fix'
export type Stage = 'sky' | 'delay' | 'circle' | 'cross' | 'clock' | 'fix'
export type Cue = 'none' | 'pop' | 'ping' | 'whoosh' | 'land' | 'cross' | 'fix' | 'weak' | 'up' | 'done'

export interface Step {
  cam: Vec3
  look: Vec3
  caption: string
  sub: string
  stage: Stage
  screen: Screen
  /** Satellites visible (0–4). */
  sats: number
  /** Satellite size: shrunk in top-down shots so they don't block the circles. */
  satScale: number
  /** Signal wavefronts: 'all' = every visible satellite pulsing, n = only satellite n (1-based) once. */
  shells: 'off' | 'all' | number
  /** Ground circles shown (0–4). */
  rings: number
  /** 1 = true distances; > 1 = inflated by a bad phone clock (circles miss). */
  ringScale: number
  /** Mark the two points where circles 1 and 2 cross. */
  crossings: boolean
  /** Big "you are here" pin over the phone. */
  pin: boolean
  /** Ghost pin sliding away (uncorrected relativity). */
  drift: boolean
  /** "+0.000038 s / day" clock tags on the satellites (38 µs, written out for viewers). */
  relativity: boolean
  /** Rows filled in the HUD satellite table (0–4). */
  rows: number
  clockBad: boolean
  ms: number
  cue: Cue
}

// ── Geometry ────────────────────────────────────────────────────────────────

/** Where the circles meet: the phone's spot on the ground. */
export const YOU: Vec3 = [PHONE_A[0], 0, PHONE_A[2]]

export interface Sat {
  id: number
  p: Vec3
  /** HUD numbers (real-world scale). */
  delayMs: number
  km: string
}

export const SATS: Sat[] = [
  { id: 1, p: [-2.8, 9.0, -2.0], delayMs: 67.4, km: '20,210' },
  { id: 2, p: [3.0, 9.6, -1.6], delayMs: 71.7, km: '21,480' },
  { id: 3, p: [-1.0, 8.4, 4.0], delayMs: 76.9, km: '23,040' },
  { id: 4, p: [3.2, 9.0, 3.4], delayMs: 81.0, km: '24,290' },
]

/** Sphere radius: satellite → phone. */
export const shellRadius = (s: Sat) => Math.hypot(s.p[0] - YOU[0], s.p[1] - YOU[1], s.p[2] - YOU[2])

/** Ground circle: centred under the satellite, passing through the phone. */
export const ringOf = (s: Sat) => ({
  center: [s.p[0], 0.07, s.p[2]] as Vec3,
  r: Math.hypot(s.p[0] - YOU[0], s.p[2] - YOU[2]),
})

/** The two points where ground circles a and b cross (one of them is YOU). */
export function crossings(a: Sat, b: Sat): Vec3[] {
  const A = ringOf(a)
  const B = ringOf(b)
  const dx = B.center[0] - A.center[0]
  const dz = B.center[2] - A.center[2]
  const d = Math.hypot(dx, dz)
  const along = (A.r * A.r - B.r * B.r + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(0, A.r * A.r - along * along))
  const mx = A.center[0] + (dx * along) / d
  const mz = A.center[2] + (dz * along) / d
  return [
    [mx + (h * dz) / d, 0.08, mz - (h * dx) / d],
    [mx - (h * dz) / d, 0.08, mz + (h * dx) / d],
  ]
}

/** Where the ghost pin ends up after a "day" without relativity correction. */
export const DRIFT_TO: Vec3 = [5.2, 0, -4.6]

// ── Beats ───────────────────────────────────────────────────────────────────

type BeatKey = 'cam' | 'look' | 'caption' | 'sub' | 'stage' | 'ms' | 'cue'
type Beat = Pick<Step, BeatKey> & Partial<Omit<Step, BeatKey>>

const BASE: Omit<Step, BeatKey> = {
  screen: 'searching',
  sats: 4,
  satScale: 1,
  shells: 'off',
  rings: 0,
  ringScale: 1,
  crossings: false,
  pin: false,
  drift: false,
  relativity: false,
  rows: 0,
  clockBad: false,
}

/** Looking down on the circles (trilateration reads best from above). */
const TOP = { cam: [0.6, 20.5, 12.5] as Vec3, look: [0.3, 0, 0.4] as Vec3, satScale: 0.42 }
const TOP_CLOSE = { cam: [0.4, 14.5, 9.5] as Vec3, look: [0.1, 0, 0.8] as Vec3, satScale: 0.3 }
/** From the side, phone low and satellites high. */
const SKY = { cam: [1.6, 3.2, 17.5] as Vec3, look: [0.3, 5.0, 0.2] as Vec3 }

const BEATS: Beat[] = [
  {
    // 0 — hook
    ...phoneClose(PHONE_A),
    sats: 0,
    caption: 'How does your phone know *where you are*?',
    sub: 'No Wi-Fi or cell signal needed. Just the sky.',
    stage: 'sky',
    ms: 2800,
    cue: 'none',
  },
  {
    // 1 — satellites reveal
    ...SKY,
    shells: 'all',
    caption: '*Satellites* are shouting the time.',
    sub: 'About 30 GPS satellites, 20,200 km up, broadcast the exact time nonstop.',
    stage: 'sky',
    ms: 3000,
    cue: 'pop',
  },
  {
    // 2 — receive-only
    cam: add(PHONE_A, [-2.4, 3.4, 8.6]),
    look: add(PHONE_A, [0.2, PHONE_SCREEN_Y + 1.6, 0]),
    shells: 'all',
    caption: 'Your phone never *talks back*.',
    sub: 'It only listens. The satellites don’t even know you exist.',
    stage: 'sky',
    ms: 2700,
    cue: 'ping',
  },
  {
    // 3 — one signal, one delay
    cam: [-12.3, 8.9, 16],
    look: [-2, 5.5, -0.8],
    shells: 1,
    rows: 1,
    caption: 'Each signal arrives a *tiny* bit late.',
    sub: '67 milliseconds late = it traveled 20,210 km.',
    stage: 'delay',
    ms: 2900,
    cue: 'whoosh',
  },
  {
    // 4 — first circle
    ...TOP,
    rings: 1,
    rows: 1,
    caption: 'So you’re somewhere on this *circle*.',
    sub: 'Every point on it is exactly that far from satellite 1.',
    stage: 'circle',
    ms: 2800,
    cue: 'land',
  },
  {
    // 5 — two circles, two crossings
    ...TOP,
    shells: 2,
    rings: 2,
    crossings: true,
    rows: 2,
    caption: 'Add a second: *two* circles.',
    sub: 'They cross at only two spots.',
    stage: 'cross',
    ms: 2800,
    cue: 'cross',
  },
  {
    // 6 — three circles, one spot
    ...TOP,
    shells: 3,
    rings: 3,
    pin: true,
    rows: 3,
    screen: 'fix',
    caption: 'A third: only *one* spot fits.',
    sub: 'That’s you. It’s called trilateration.',
    stage: 'cross',
    ms: 3000,
    cue: 'fix',
  },
  {
    // 7 — the cheap clock
    ...TOP_CLOSE,
    rings: 3,
    ringScale: 1.16,
    rows: 3,
    clockBad: true,
    caption: 'Catch: your phone’s clock is *cheap*.',
    sub: 'Off by a millionth of a second = off by 300 meters.',
    stage: 'clock',
    ms: 3000,
    cue: 'weak',
  },
  {
    // 8 — fourth satellite fixes time
    ...TOP,
    shells: 4,
    rings: 4,
    pin: true,
    rows: 4,
    screen: 'fix',
    caption: 'A *4th* satellite fixes the clock.',
    sub: 'Four signals solve four unknowns: x, y, z and time.',
    stage: 'clock',
    ms: 3000,
    cue: 'up',
  },
  {
    // 9 — relativity
    cam: [1.5, 6.6, 17.1],
    look: [0.8, 9.4, 0.4],
    relativity: true,
    rows: 4,
    screen: 'fix',
    caption: 'And *Einstein* has to be in the loop.',
    sub: 'Up there, satellite clocks run 38 microseconds a day fast.',
    stage: 'clock',
    ms: 3100,
    cue: 'ping',
  },
  {
    // 10 — uncorrected drift
    cam: [1.4, 19, 13.5],
    look: [2, 0, -1.2],
    satScale: 0.42,
    drift: true,
    rings: 4,
    rows: 4,
    screen: 'fix',
    caption: 'Ignore it: *10 km* off per day.',
    sub: 'So every satellite clock is corrected for relativity.',
    stage: 'clock',
    ms: 3100,
    cue: 'weak',
  },
  {
    // 11 — the fix
    cam: add(PHONE_A, [-1.4, 3.6, 7.2]),
    look: add(PHONE_A, [0, 1.8, 0]),
    pin: true,
    rows: 4,
    screen: 'fix',
    caption: 'Your blue dot, *a few meters* accurate.',
    sub: 'Recalculated every second as you move.',
    stage: 'fix',
    ms: 2800,
    cue: 'done',
  },
  {
    // 12 — loop back to the hook framing
    ...phoneClose(PHONE_A),
    screen: 'fix',
    rows: 4,
    caption: 'Look up. They’re shouting *right now*.',
    sub: 'And your phone is quietly listening.',
    stage: 'fix',
    ms: 2600,
    cue: 'none',
  },
]

export function buildSteps(): Step[] {
  return BEATS.map((b) => ({ ...BASE, ...b }))
}
