/**
 * Precomputed "ride-hailing dispatch" walkthrough — how Gojek / Grab / Uber pick
 * a driver for a rider. One Step = a full snapshot of the map + scoreboard; the
 * animation just replays the frames as ONE continuous story.
 *
 * Grounded in how the real systems work (Uber Marketplace, Grab allocation,
 * Gojek "Jaeger"):
 *   1. nearest : closest by straight-line distance — the intuitive but wrong model.
 *   2. eta     : soonest arrival on real roads — ML-predicted ETA beats raw distance.
 *   3. smart   : a weighted score over ETA, rating, heading, vehicle & fairness
 *                (Grab cites 40+ factors). May pick a *farther* driver.
 *   4. batch   : the real core — requests & drivers are matched as a BATCH with a
 *                global min-cost assignment, so your nearest driver may be sent to
 *                someone else. This is why you sometimes get a farther driver.
 *
 * Numbers are hand-tuned so the chosen driver moves Dimas → Maya → Sari, and the
 * batch step assigns Maya to a second rider.
 */

export type Phase = 'nearest' | 'eta' | 'smart' | 'batch'
export type Cue = 'ping' | 'scan' | 'pick' | 'done' | null
export type Vehicle = 'car' | 'bike'

/** The rider ordered a car, so motorbikes are filtered out up front. */
export const REQUEST: Vehicle = 'car'

/** Pickup points in map space (0..100, y points down to match screen coords). */
export const PICKUP: [number, number] = [50, 51]
export const RIDER_B: [number, number] = [82, 26]

export interface Driver {
  id: string
  name: string
  vehicle: Vehicle
  pos: [number, number]
  /** Heads toward the pickup (true) or away (false) — affects the smart score. */
  toward: boolean
  /** Straight-line distance, km (hand-set). */
  dist: number
  /** Real road ETA, minutes (hand-set; encodes traffic). */
  eta: number
  rating: number
  /** Minutes the driver has been idle waiting — fairness input. */
  wait: number
  color: string
}

// Positions pushed well clear of the pickup pin so it stays visible.
export const DRIVERS: Driver[] = [
  { id: 'dimas', name: 'Dimas', vehicle: 'car', pos: [34, 36], toward: false, dist: 0.8, eta: 11, rating: 4.7, wait: 3, color: '#2563EB' },
  { id: 'maya', name: 'Maya', vehicle: 'car', pos: [67, 33], toward: true, dist: 1.4, eta: 4, rating: 4.6, wait: 2, color: '#0D9488' },
  { id: 'sari', name: 'Sari', vehicle: 'car', pos: [66, 73], toward: true, dist: 1.6, eta: 5, rating: 4.95, wait: 18, color: '#D97706' },
  { id: 'toni', name: 'Toni', vehicle: 'car', pos: [85, 58], toward: true, dist: 2.1, eta: 7, rating: 4.8, wait: 5, color: '#7C3AED' },
  { id: 'rafi', name: 'Rafi', vehicle: 'bike', pos: [33, 70], toward: true, dist: 0.5, eta: 3, rating: 4.9, wait: 8, color: '#94A3B8' },
]

export const DRIVER_MAP: Record<string, Driver> = Object.fromEntries(DRIVERS.map((d) => [d.id, d]))

export function eligible(d: Driver): boolean {
  return d.vehicle === REQUEST
}

/**
 * Weighted "cost" in effective minutes — lower is better. The other scoreboard
 * columns ARE the breakdown: ETA, a rating penalty, a wrong-heading penalty, and
 * a fairness bonus for the longest-waiting driver.
 */
export function smartCost(d: Driver): number {
  if (!eligible(d)) return Infinity
  const ratingPenalty = (5 - d.rating) * 2
  const headingPenalty = d.toward ? 0 : 3
  const fairnessBonus = Math.min(d.wait, 20) * 0.1
  return d.eta + ratingPenalty + headingPenalty - fairnessBonus
}

/** Value a phase ranks drivers by (smaller = better). */
export function metric(d: Driver, phase: Phase): number {
  if (phase === 'nearest') return d.dist
  if (phase === 'eta') return d.eta
  return smartCost(d)
}

export const ELIGIBLE = DRIVERS.filter(eligible)
export const FILTERED = DRIVERS.filter((d) => !eligible(d))

function winner(phase: Phase): Driver {
  return [...ELIGIBLE].sort((a, b) => metric(a, phase) - metric(b, phase))[0]
}

export const PHASES: Record<Phase, { label: string; desc: string; decider: string }> = {
  nearest: { label: 'Nearest', desc: 'Idea 1 — pick the closest driver by straight-line distance', decider: 'dist' },
  eta: { label: 'Fastest ETA', desc: 'Idea 2 — pick whoever arrives soonest on real roads', decider: 'eta' },
  smart: { label: 'Smart Match', desc: 'Idea 3 — score many factors at once (what real apps do)', decider: 'score' },
  batch: { label: 'Global Batch', desc: 'The real core — match a whole batch of riders at once', decider: 'score' },
}

export interface Assignment {
  driverId: string
  to: 'you' | 'b'
}

export interface RideStep {
  phase: Phase
  status: string
  pickupPulse: boolean
  driversShown: boolean
  lines: 'none' | 'straight' | 'route'
  traffic: boolean
  revealed: string[]
  candidateId: string | null
  chosenId: string | null
  /** Show the second rider (batch phase). */
  riderB: boolean
  /** Batch assignments — each draws a route from a driver to a rider. */
  assignments: Assignment[]
  note?: string
  sound: Cue
}

const ids = (ds: Driver[]) => ds.map((d) => d.id)

/** Step factory: spell out only what changes, inherit sensible defaults. */
function s(phase: Phase, status: string, sound: Cue, over: Partial<RideStep> = {}): RideStep {
  return {
    phase,
    status,
    sound,
    pickupPulse: false,
    driversShown: true,
    lines: 'none',
    traffic: phase !== 'nearest',
    revealed: [],
    candidateId: null,
    chosenId: null,
    riderB: false,
    assignments: [],
    ...over,
  }
}

export function buildSteps(): RideStep[] {
  const allIds = ids(ELIGIBLE)
  const dimas = winner('nearest') // Dimas
  const maya = winner('eta') // Maya
  const sari = winner('smart') // Sari

  return [
    // ── INTRO ──
    s('nearest', 'You request a car. The app must pick exactly ONE driver out of many.', 'ping', {
      pickupPulse: true,
      driversShown: false,
      traffic: false,
      note: 'One rider, many drivers — who comes?',
    }),
    s('nearest', 'Drivers nearby are online. Rafi rides a motorbike, but you ordered a car — filtered out.', 'ping', {
      pickupPulse: true,
      traffic: false,
    }),

    // ── 1. NEAREST ──
    s('nearest', 'Idea 1 — Nearest: just pick the closest driver as the crow flies.', null, { lines: 'straight' }),
    s('nearest', 'Straight-line distances measured for every eligible car.', 'scan', { lines: 'straight', revealed: allIds }),
    s('nearest', `Closest is ${dimas.name} (${dimas.dist.toFixed(1)} km) — but he is stuck in traffic, ETA 11 min. Distance ≠ time.`, 'pick', {
      lines: 'route',
      revealed: allIds,
      chosenId: dimas.id,
    }),

    // ── 2. FASTEST ETA ──
    s('eta', 'Idea 2 — Fastest ETA: who actually arrives soonest on real roads (traffic counts now)?', null, { traffic: true }),
    s('eta', 'ML-predicted road ETAs — Dimas’ 0.8 km turns into 11 min through congestion.', 'scan', { traffic: true, revealed: allIds }),
    s('eta', `${maya.name} arrives in ${maya.eta} min though she is farther away. ETA beats raw distance.`, 'pick', {
      traffic: true,
      revealed: allIds,
      chosenId: maya.id,
    }),

    // ── 3. SMART MATCH ──
    s('smart', 'Idea 3 — Smart Match: score many factors at once. Grab cites 40+ of them.', null, {
      traffic: true,
      note: 'ETA · rating · heading · vehicle · waiting time',
    }),
    s('smart', 'Each driver gets one combined score (lower = better) from all the columns.', 'scan', { traffic: true, revealed: allIds }),
    s('smart', `${sari.name} wins: +1 min ETA, but top rating (★${sari.rating}) and waited ${sari.wait} min. Already a farther driver than Dimas.`, 'pick', {
      traffic: true,
      revealed: allIds,
      chosenId: sari.id,
    }),

    // ── 4. GLOBAL BATCH ──
    s('batch', 'Zoom out — you are not the only rider. Real systems match a whole BATCH at once.', 'ping', {
      traffic: true,
      revealed: allIds,
      chosenId: sari.id,
      riderB: true,
    }),
    s('batch', `${maya.name} is even closer to Rider B, so the system sends ${maya.name} → Rider B and ${sari.name} → you. Best total for everyone.`, 'pick', {
      traffic: true,
      revealed: allIds,
      riderB: true,
      assignments: [
        { driverId: maya.id, to: 'b' },
        { driverId: sari.id, to: 'you' },
      ],
    }),
    s('batch', 'That is the real answer: dispatch solves a global min-cost matching over many riders & 40+ factors — not just your distance.', 'done', {
      traffic: true,
      revealed: allIds,
      riderB: true,
      assignments: [
        { driverId: maya.id, to: 'b' },
        { driverId: sari.id, to: 'you' },
      ],
    }),
  ]
}
