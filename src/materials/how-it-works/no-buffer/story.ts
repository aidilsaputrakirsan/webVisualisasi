/**
 * EP. 02 — "Why doesn't your movie buffer?" (CDN + chunked adaptive streaming),
 * precomputed as Step[].
 *
 * Same diorama as EP. 01 (kit/geo). New actors: an edge server in your city,
 * a request "ping", film reels copied from the origin to the edge, and a
 * stream of video chunks from the edge to the phone.
 *
 * Numbers are physics, not guesses: light in fiber ≈ 200,000 km/s, so a
 * 10,000 km trip is ≈ 100 ms there-and-back before any routing (we show
 * ~150 ms); an edge server a few km away is dominated by the last hop
 * (~10 ms). Starting a video takes several such round trips.
 */
import { PHONE_A, PHONE_SCREEN_Y, SPOT, TOWER_A, TOWER_H, add, pathPoint, phoneClose, reverseRoute, type Vec3, type Waypoint } from '../kit/geo'

export type Screen = 'poster' | 'loading' | 'stalled' | 'playing' | 'next'
export type Quality = 'hi' | 'lo'
export type Cue = 'none' | 'tap' | 'whoosh' | 'jam' | 'copy' | 'land' | 'pop' | 'ping' | 'chunks' | 'weak' | 'up' | 'done'
export type Stage = 'play' | 'origin' | 'copy' | 'edge' | 'chunks' | 'quality'
export type RouteId = 'far' | 'near'

export interface Step {
  cam: Vec3
  look: Vec3
  /** Chase cam offset from the lead actor (ping or reels). */
  follow?: Vec3
  caption: string
  sub: string
  stage: Stage
  screen: Screen
  quality: Quality
  /** Request ping: which route and where along it (waypoint units). */
  ping: { route: RouteId; at: number } | null
  /** Film reels travelling origin → edge (COPY waypoint units). */
  reels: number | null
  /** Reels already stored at the edge server. */
  stored: boolean
  /** Undersea cable congested by millions of requests. */
  jam: boolean
  /** Extra edge sites popped in around the world (the "N" in CDN). */
  sites: boolean
  /** Chunks flowing edge → phone. */
  streaming: boolean
  /** Weak radio signal (grey, short rings; small low-quality chunks). */
  weak: boolean
  /** Round-trip time on the HUD meter (ms), null = hidden. */
  rtt: number | null
  /** Chunks buffered ahead of the playhead, null = bar hidden. */
  buffer: number | null
  /** Final side-by-side comparison on the HUD. */
  compare: boolean
  ms: number
  cue: Cue
}

export const MOVIE = 'Ocean Drift'
export const ORIGIN_KM = '10,000 km'
export const EDGE_KM = '12 km'
export const RTT_FAR = 150
export const RTT_JAM = 900
export const RTT_NEAR = 12

// ── Edge server (your city) ─────────────────────────────────────────────────

export const EDGE: Vec3 = [9.2, 0, 1.8]
/** Front of the edge rack, where requests arrive and chunks leave. */
export const EDGE_PORT: Vec3 = [EDGE[0], 0.95, EDGE[2] + 0.55]
/** Shelf beside the rack where copied reels are stored. */
export const EDGE_SHELF: Vec3 = [EDGE[0] + 0.95, 0.42, EDGE[2] + 0.1]

/** More edge sites that pop in to show "a copy near almost everyone". */
export const SITES: Vec3[] = [
  [-4.5, 0, -5],
  [4.6, 0, -6.8],
  [-6.2, 0, 3.2],
  [40.5, 0, 2.8],
  [45.5, 0, -1.2],
]

/** Ground cables tying the edge server into the network. */
export const EDGE_LINK: Vec3[] = [
  [TOWER_A[0], 0.1, TOWER_A[2] + 0.5],
  [EDGE[0] - 0.6, 0.1, EDGE[2]],
]
export const EDGE_FEED: Vec3[] = [
  [SPOT.coastA[0], 0.1, SPOT.coastA[2]],
  [EDGE[0] + 0.7, 0.1, EDGE[2]],
]

// ── Routes ──────────────────────────────────────────────────────────────────

/** Phone → origin data center across the ocean. */
export const FAR: Waypoint[] = [
  { p: SPOT.phoneAScreen },
  { p: SPOT.phoneAAbove },
  { p: SPOT.towerATop, arc: 1.6 },
  { p: SPOT.towerABase },
  { p: SPOT.coastA },
  { p: SPOT.seabedA },
  { p: SPOT.seabedB },
  { p: SPOT.coastB },
  { p: SPOT.dataCenter },
]

/** Phone → edge server next door. */
export const NEAR: Waypoint[] = [
  { p: SPOT.phoneAScreen },
  { p: SPOT.phoneAAbove },
  { p: SPOT.towerATop, arc: 1.6 },
  { p: SPOT.towerABase },
  { p: [EDGE[0] - 0.6, 0.12, EDGE[2]] },
  { p: EDGE_PORT },
]

/** Edge → phone: the chunk stream. */
export const STREAM = reverseRoute(NEAR)

/** Origin → edge: the overnight copy. */
export const COPY: Waypoint[] = [
  { p: SPOT.dataCenter },
  { p: SPOT.coastB },
  { p: SPOT.seabedB },
  { p: SPOT.seabedA },
  { p: SPOT.coastA },
  { p: [EDGE[0] + 0.7, 0.12, EDGE[2]] },
  { p: EDGE_SHELF },
]

export const ROUTES: Record<RouteId, Waypoint[]> = { far: FAR, near: NEAR }
export const routeEnd = (id: RouteId) => ROUTES[id].length - 1
export const pointOn = (route: Waypoint[], s: number) => pathPoint(route, s)

// ── Beats ───────────────────────────────────────────────────────────────────

type BeatKey = 'cam' | 'look' | 'caption' | 'sub' | 'stage' | 'screen' | 'ms' | 'cue'
type Beat = Pick<Step, BeatKey> & Partial<Omit<Step, BeatKey>>

const BASE: Omit<Step, BeatKey> = {
  quality: 'hi',
  ping: null,
  reels: null,
  stored: false,
  jam: false,
  sites: false,
  streaming: false,
  weak: false,
  rtt: null,
  buffer: null,
  compare: false,
}

const phoneMid = { cam: add(PHONE_A, [-1.1, 2.8, 6.1]), look: add(PHONE_A, [0, 1.4, 0]) }

const BEATS: Beat[] = [
  {
    // 0 — hook
    ...phoneClose(PHONE_A),
    screen: 'poster',
    caption: 'This movie lives *10,000 km* away.',
    sub: 'So why does it start the moment you press play?',
    stage: 'play',
    ms: 2800,
    cue: 'none',
  },
  {
    // 1 — press play
    ...phoneMid,
    screen: 'loading',
    caption: 'You press *Play*.',
    sub: 'Your phone asks a server for the first seconds of video.',
    stage: 'play',
    ms: 1900,
    cue: 'tap',
  },
  {
    // 2 — the far way: all the way to the origin
    cam: [10, 5, 7],
    look: [14, 0, 0],
    follow: [-4.5, 5.4, 8.2],
    screen: 'loading',
    ping: { route: 'far', at: routeEnd('far') },
    rtt: RTT_FAR,
    caption: 'The original sits *across an ocean*.',
    sub: 'In a data center 10,000 km away. Every request is a round trip.',
    stage: 'origin',
    ms: 3400,
    cue: 'whoosh',
  },
  {
    // 3 — congestion
    cam: [15.4, 4.4, 8.2],
    look: [20.5, -3, -0.4],
    screen: 'stalled',
    jam: true,
    rtt: RTT_JAM,
    caption: 'Now picture *millions* asking at once.',
    sub: 'Everyone squeezing through the same cable. That’s buffering.',
    stage: 'origin',
    ms: 3000,
    cue: 'jam',
  },
  {
    // 4 — copy it closer
    cam: [30, 4.5, 7],
    look: [32, 1, 0],
    follow: [3.4, 4.2, 6.4],
    screen: 'poster',
    reels: COPY.length - 1,
    rtt: RTT_JAM,
    caption: 'So they *copy* it closer.',
    sub: 'Popular shows are sent ahead of time, before you even press play.',
    stage: 'copy',
    ms: 3400,
    cue: 'copy',
  },
  {
    // 5 — edge server in your city
    cam: add(EDGE, [2.6, 2.6, 5.4]),
    look: add(EDGE, [0.2, 0.9, 0.3]),
    screen: 'poster',
    stored: true,
    rtt: RTT_JAM,
    caption: 'Into a server in *your city*.',
    sub: '12 km away instead of 10,000. It’s called an edge server.',
    stage: 'edge',
    ms: 2700,
    cue: 'land',
  },
  {
    // 6 — the network of copies
    cam: [-12, 13, 16],
    look: [0.5, 1, -0.5],
    screen: 'poster',
    stored: true,
    sites: true,
    rtt: RTT_JAM,
    caption: 'Thousands of copies. That’s a *CDN*.',
    sub: 'A Content Delivery Network: a copy near almost everyone.',
    stage: 'edge',
    ms: 2900,
    cue: 'pop',
  },
  {
    // 7 — now the request goes next door
    cam: [-4.6, 8.4, 13.8],
    look: [5.6, 2.4, 0.8],
    screen: 'loading',
    stored: true,
    ping: { route: 'near', at: routeEnd('near') },
    rtt: RTT_NEAR,
    caption: 'Now your request goes *next door*.',
    sub: 'Phone → tower → edge server. A round trip of ~12 ms.',
    stage: 'edge',
    ms: 2700,
    cue: 'ping',
  },
  {
    // 8 — chunks
    cam: [-8.9, 9.1, 12.8],
    look: [4.4, 2.4, 1],
    screen: 'playing',
    stored: true,
    streaming: true,
    rtt: RTT_NEAR,
    buffer: 2,
    caption: 'The movie arrives in *chunks*.',
    sub: 'A few seconds of video at a time, not one giant file.',
    stage: 'chunks',
    ms: 2800,
    cue: 'chunks',
  },
  {
    // 9 — buffer ahead
    cam: add(PHONE_A, [-1.6, PHONE_SCREEN_Y + 2.4, 6.4]),
    look: add(PHONE_A, [0.6, PHONE_SCREEN_Y + 0.9, 0]),
    screen: 'playing',
    stored: true,
    streaming: true,
    rtt: RTT_NEAR,
    buffer: 5,
    caption: 'Your phone stays a few chunks *ahead*.',
    sub: 'That buffer is why small hiccups never pause the movie.',
    stage: 'chunks',
    ms: 2700,
    cue: 'chunks',
  },
  {
    // 10 — weak signal → smaller chunks
    cam: [-4.5, 7.5, 12],
    look: [4.2, 2.8, 0],
    screen: 'playing',
    quality: 'lo',
    stored: true,
    streaming: true,
    weak: true,
    rtt: RTT_NEAR,
    buffer: 3,
    caption: 'Weak signal? It grabs *smaller* chunks.',
    sub: 'Quality dips to 480p for a moment. Blurry beats frozen.',
    stage: 'quality',
    ms: 3000,
    cue: 'weak',
  },
  {
    // 11 — back to HD
    ...phoneMid,
    screen: 'playing',
    stored: true,
    streaming: true,
    rtt: RTT_NEAR,
    buffer: 5,
    caption: 'Signal’s back. *1080p* again.',
    sub: 'It switches quality every few seconds, without ever stopping.',
    stage: 'quality',
    ms: 2500,
    cue: 'up',
  },
  {
    // 12 — the comparison
    cam: [-7.5, 8, 11],
    look: [12, 0.5, -1],
    screen: 'playing',
    stored: true,
    streaming: true,
    rtt: RTT_NEAR,
    compare: true,
    caption: 'Same movie. *12×* shorter trips.',
    sub: 'And starting a video takes several of them. Distance is the trick.',
    stage: 'quality',
    ms: 3200,
    cue: 'done',
  },
  {
    // 13 — loop back to the hook framing
    ...phoneClose(PHONE_A),
    screen: 'next',
    stored: true,
    rtt: RTT_NEAR,
    caption: 'Next episode is *already loading*…',
    sub: 'Probably from a server near you.',
    stage: 'quality',
    ms: 2600,
    cue: 'none',
  },
]

export function buildSteps(): Step[] {
  return BEATS.map((b) => ({ ...BASE, ...b }))
}

/** Tower top — radio rings sit here. */
export const TOWER_TOP: Vec3 = [TOWER_A[0], TOWER_H, TOWER_A[2] + 0.3]
