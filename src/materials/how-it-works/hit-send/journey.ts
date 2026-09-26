/**
 * "What happens when you hit Send?" — the whole reel precomputed as Step[].
 *
 * The shared diorama (kit/geo): phone A → tower A → coast → undersea cable
 * → coast → data center (queue) → tower B → phone B.
 * A message travels along ROUTE (a chain of waypoints); each step says where
 * the message should be (`at`, in waypoint units), what shape it has, where
 * the camera sits, and what the big caption says. The scene only eases
 * towards each snapshot.
 */

import { DATACENTER, PHONE_A, PHONE_B, PHONE_SCREEN_Y, SEABED_Y, SPOT, add, pathPoint, phoneClose, type Vec3, type Waypoint } from '../kit/geo'

/** Shape of the travelling message. */
export type Form = 'hidden' | 'bubble' | 'cube' | 'packets'

export type Cue = 'none' | 'tap' | 'lock' | 'split' | 'whoosh' | 'light' | 'server' | 'queue' | 'online' | 'merge' | 'done'

/** Journey stages shown in the bottom progress rail. */
export type Stage = 'phone' | 'tower' | 'ocean' | 'server' | 'queue' | 'friend'

export interface Step {
  /** Where the message is along ROUTE (waypoint index, fractional allowed). */
  at: number
  form: Form
  /** Camera position + look-at target. */
  cam: Vec3
  look: Vec3
  /** Chase cam: when set, the camera trails the message at this offset. */
  follow?: Vec3
  /** Big caption; wrap a word in *asterisks* to highlight it. */
  caption: string
  sub: string
  /** Cumulative network time shown on the clock (ms). */
  clockMs: number
  stage: Stage
  /** Chat bubble visible on phone A / phone B screens. */
  bubbleA: boolean
  bubbleB: boolean
  /** Phone B screen on (friend online). */
  friendOnline: boolean
  /** Ticks shown under phone B's bubble: 0 none, 1 sent, 2 delivered. */
  ticks: 0 | 1 | 2
  /** Radio rings from phone/tower, light pulses in the cable, server LEDs busy. */
  radio: boolean
  fiber: boolean
  serverBusy: boolean
  /** Message is parked in the queue tray. */
  queued: boolean
  /** How long this beat stays on screen (ms, at 1× speed). */
  ms: number
  cue: Cue
}

/** The message text on both phones. */
export const MESSAGE = 'see you at 7?'
export const FRIEND = 'Sam'

// ── Route ───────────────────────────────────────────────────────────────────

export const QUEUE_TRAY: Vec3 = [DATACENTER[0], 0, 2.4]

/** Waypoints the message follows (`at` indexes into this). */
export const ROUTE: Waypoint[] = [
  /* 0 */ { p: SPOT.phoneAScreen },
  /* 1 */ { p: SPOT.phoneAAbove }, // lifted off the screen
  /* 2 */ { p: SPOT.towerATop, arc: 1.6 }, // radio hop to tower A
  /* 3 */ { p: SPOT.towerABase }, // down the mast into the ground cable
  /* 4 */ { p: SPOT.coastA },
  /* 5 */ { p: SPOT.seabedA },
  /* 6 */ { p: SPOT.seabedB }, // across the ocean floor
  /* 7 */ { p: SPOT.coastB },
  /* 8 */ { p: SPOT.dataCenter },
  /* 9 */ { p: [QUEUE_TRAY[0], 0.55, QUEUE_TRAY[2]] }, // parked in the queue tray
  /* 10 */ { p: SPOT.towerBTop, arc: 1.4 },
  /* 11 */ { p: SPOT.phoneBAbove, arc: 1.6 },
  /* 12 */ { p: SPOT.phoneBScreen },
]

export const routePoint = (s: number): Vec3 => pathPoint(ROUTE, s)

// ── The beats ───────────────────────────────────────────────────────────────

/** Fields every beat must spell out; the rest fall back to BASE. */
type BeatKey = 'at' | 'form' | 'cam' | 'look' | 'caption' | 'sub' | 'clockMs' | 'stage' | 'ms' | 'cue'
type Beat = Pick<Step, BeatKey> & Partial<Omit<Step, BeatKey>>

const BASE: Omit<Step, BeatKey> = {
  bubbleA: false,
  bubbleB: false,
  friendOnline: false,
  ticks: 0,
  radio: false,
  fiber: false,
  serverBusy: false,
  queued: false,
}

const BEATS: Beat[] = [
  {
    // 0 — hook: no title card, the question IS the first frame.
    ...phoneClose(PHONE_A),
    at: 0,
    form: 'hidden',
    caption: 'What happens when you hit *Send*?',
    sub: 'It crosses an ocean in about 0.2 seconds.',
    clockMs: 0,
    stage: 'phone',
    ms: 2600,
    cue: 'none',
  },
  {
    // 1 — tap
    cam: add(PHONE_A, [-1.1, 2.8, 6.1]),
    look: add(PHONE_A, [0, 1.4, 0]),
    at: 0,
    form: 'bubble',
    caption: 'You tap *Send*.',
    sub: 'The clock starts now.',
    clockMs: 0,
    stage: 'phone',
    ms: 1700,
    cue: 'tap',
  },
  {
    // 2 — encrypt
    cam: add(PHONE_A, [2, PHONE_SCREEN_Y + 2.3, 6.2]),
    look: add(PHONE_A, [0.1, PHONE_SCREEN_Y + 0.6, 0.6]),
    at: 1,
    form: 'cube',
    caption: 'First, it gets *locked*.',
    sub: 'Encrypted on your phone. Only your friend’s phone holds the key.',
    clockMs: 2,
    stage: 'phone',
    ms: 2400,
    cue: 'lock',
  },
  {
    // 3 — split into packets
    cam: add(PHONE_A, [-2.2, PHONE_SCREEN_Y + 2.5, 6.2]),
    look: add(PHONE_A, [0.1, PHONE_SCREEN_Y + 0.6, 0.6]),
    at: 1,
    form: 'packets',
    caption: 'Then chopped into *packets*.',
    sub: 'Small numbered pieces, reassembled at the other end.',
    clockMs: 3,
    stage: 'phone',
    ms: 2300,
    cue: 'split',
  },
  {
    // 4 — radio hop to the tower
    cam: [-6.5, 6.8, 11.3],
    look: [3.1, 3.2, -0.9],
    at: 2,
    form: 'packets',
    radio: true,
    caption: 'Radio waves carry them to a *tower*.',
    sub: 'Your phone talks to the nearest cell tower or Wi-Fi router.',
    clockMs: 12,
    stage: 'tower',
    ms: 2500,
    cue: 'whoosh',
  },
  {
    // 5 — into the ground cable
    cam: [3.7, 5.5, 10.6],
    look: [9.9, -1, -1.3],
    at: 4,
    form: 'packets',
    fiber: true,
    caption: 'Into a cable, as *light*.',
    sub: 'Fiber-optic glass turns your message into flashes of light.',
    clockMs: 20,
    stage: 'ocean',
    ms: 2300,
    cue: 'light',
  },
  {
    // 6 — across the ocean floor
    cam: [10.5, 4.4, 5.6],
    look: [14, SEABED_Y, 0],
    follow: [-3.2, 4.6, 5.6],
    at: 6,
    form: 'packets',
    fiber: true,
    caption: 'Across the *ocean floor*.',
    sub: 'Light in glass covers about 200,000 km every second.',
    clockMs: 70,
    stage: 'ocean',
    ms: 2800,
    cue: 'light',
  },
  {
    // 7 — into the data center
    cam: [28.6, 4.8, 5.2],
    look: [31.6, 1.7, -1.8],
    at: 8,
    form: 'packets',
    fiber: true,
    serverBusy: true,
    caption: 'Into a *data center*.',
    sub: 'The chat server reads the label: this is for Sam.',
    clockMs: 95,
    stage: 'server',
    ms: 2400,
    cue: 'server',
  },
  {
    // 8 — server can't read it
    cam: [34.1, 3.2, 4.1],
    look: [32.2, 1.6, -1.1],
    at: 8,
    form: 'cube',
    serverBusy: true,
    caption: 'It *can’t* read it.',
    sub: 'Still locked. The server only sees where it goes, not what it says.',
    clockMs: 97,
    stage: 'server',
    ms: 2600,
    cue: 'lock',
  },
  {
    // 9 — friend offline → parked in the queue
    cam: [35.8, 5.6, 10.3],
    look: [31.5, 1.4, 1.1],
    at: 9,
    form: 'cube',
    queued: true,
    ticks: 1,
    caption: 'Sam is offline? It *waits*.',
    sub: 'Parked in a message queue. Nothing gets lost. That’s your single ✓.',
    clockMs: 100,
    stage: 'queue',
    ms: 2900,
    cue: 'queue',
  },
  {
    // 10 — friend comes online
    cam: [40.2, 3.6, 8.8],
    look: [43.2, 1.2, 0.6],
    at: 9,
    form: 'cube',
    queued: true,
    friendOnline: true,
    ticks: 1,
    caption: 'Sam opens the app…',
    sub: 'Their phone checks in with the server.',
    clockMs: 100,
    stage: 'queue',
    ms: 2000,
    cue: 'online',
  },
  {
    // 11 — pushed down to phone B
    cam: [30.1, 7.3, 7.9],
    look: [41.2, 3.4, -1],
    at: 11,
    form: 'packets',
    friendOnline: true,
    radio: true,
    ticks: 1,
    caption: '…and it’s *pushed* to them.',
    sub: 'Out of the queue, through another tower, into their phone.',
    clockMs: 180,
    stage: 'friend',
    ms: 2300,
    cue: 'whoosh',
  },
  {
    // 12 — reassembled + unlocked
    cam: add(PHONE_B, [-2.2, PHONE_SCREEN_Y + 2.5, 6.2]),
    look: add(PHONE_B, [-0.1, PHONE_SCREEN_Y + 0.6, 0.6]),
    at: 11,
    form: 'cube',
    friendOnline: true,
    ticks: 1,
    caption: 'Reassembled. *Unlocked*.',
    sub: 'Only Sam’s phone has the key to open it.',
    clockMs: 195,
    stage: 'friend',
    ms: 2200,
    cue: 'merge',
  },
  {
    // 13 — delivered
    cam: add(PHONE_B, [-1.1, 2.8, 6.1]),
    look: add(PHONE_B, [0, 1.4, 0]),
    at: 12,
    form: 'hidden',
    friendOnline: true,
    bubbleB: true,
    ticks: 2,
    caption: '*Delivered.* ✓✓',
    sub: 'Under an ocean and back, in about the time of a blink.',
    clockMs: 200,
    stage: 'friend',
    ms: 3000,
    cue: 'done',
  },
  {
    // 14 — loop: same framing as the hook, now on Sam's phone.
    ...phoneClose(PHONE_B),
    at: 12,
    form: 'hidden',
    friendOnline: true,
    bubbleB: true,
    ticks: 2,
    caption: 'Now Sam hits *Reply*…',
    sub: 'And the whole trip starts again.',
    clockMs: 200,
    stage: 'friend',
    ms: 2600,
    cue: 'none',
  },
]

export function buildSteps(): Step[] {
  // The bubble sits in phone A's chat from the tap onward (step 0 is still a draft).
  return BEATS.map((b, i) => ({ ...BASE, ...b, bubbleA: i >= 1 }))
}
