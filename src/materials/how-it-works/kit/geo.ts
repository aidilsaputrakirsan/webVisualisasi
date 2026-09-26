/**
 * The shared "How It Works" world: one paper diorama laid out along +x that
 * every episode reuses, so the series feels like one place.
 *
 *   land A (your city) ── coast ── ocean + undersea cable ── coast ── land B
 *   phone A · tower A                                       data center · tower B · phone B
 */

export type Vec3 = [number, number, number]

export const add = (p: Vec3, d: Vec3): Vec3 => [p[0] + d[0], p[1] + d[1], p[2] + d[2]]

// ── Layout ──────────────────────────────────────────────────────────────────

export const PHONE_A: Vec3 = [0, 0, 1.2]
export const TOWER_A: Vec3 = [6.5, 0, -2.5]
export const COAST_A = 12
export const COAST_B = 26
export const SEABED_Y = -3.4
export const DATACENTER: Vec3 = [32, 0, -1.5]
export const TOWER_B: Vec3 = [38.5, 0, -2.5]
export const PHONE_B: Vec3 = [44, 0, 1.2]

/** Height of a phone's screen centre above its base. */
export const PHONE_SCREEN_Y = 1.25
export const TOWER_H = 5.2

/** Handy points along the world. */
export const SPOT = {
  phoneAScreen: [PHONE_A[0], PHONE_SCREEN_Y, PHONE_A[2] + 0.2] as Vec3,
  phoneAAbove: [PHONE_A[0], PHONE_SCREEN_Y + 1.1, PHONE_A[2] + 0.6] as Vec3,
  towerATop: [TOWER_A[0], TOWER_H - 0.2, TOWER_A[2] + 0.2] as Vec3,
  towerABase: [TOWER_A[0], 0.12, TOWER_A[2] + 0.5] as Vec3,
  coastA: [COAST_A, 0.12, 0] as Vec3,
  seabedA: [COAST_A + 1.2, SEABED_Y + 0.2, 0] as Vec3,
  seabedB: [COAST_B - 1.2, SEABED_Y + 0.2, 0] as Vec3,
  coastB: [COAST_B, 0.12, 0] as Vec3,
  dataCenter: [DATACENTER[0], 0.9, DATACENTER[2] + 1.4] as Vec3,
  towerBTop: [TOWER_B[0], TOWER_H - 0.2, TOWER_B[2] + 0.2] as Vec3,
  phoneBAbove: [PHONE_B[0], PHONE_SCREEN_Y + 1.1, PHONE_B[2] + 0.6] as Vec3,
  phoneBScreen: [PHONE_B[0], PHONE_SCREEN_Y, PHONE_B[2] + 0.2] as Vec3,
}

/** Lays a waypoint on the ground (cable height). */
const ground = (p: Vec3): Vec3 => [p[0], Math.min(p[1], 0.12) - 0.02, p[2]]

/** The undersea cable: tower A base → coast → ocean floor → coast → data center. */
export const MAIN_CABLE: Vec3[] = [
  SPOT.towerABase,
  SPOT.coastA,
  SPOT.seabedA,
  SPOT.seabedB,
  SPOT.coastB,
  SPOT.dataCenter,
].map(ground)

// ── Routes ──────────────────────────────────────────────────────────────────

/**
 * A waypoint a traveller passes through. `arc` lifts the segment leading INTO
 * this waypoint into a curve (radio hops through the air).
 */
export interface Waypoint {
  p: Vec3
  arc?: number
}

/** Point on a route at fractional waypoint index `s` (arcs bulge upward). */
export function pathPoint(route: Waypoint[], s: number): Vec3 {
  const max = route.length - 1
  const c = Math.max(0, Math.min(max, s))
  const i = Math.min(Math.floor(c), max - 1)
  const f = c - i
  const a = route[i].p
  const b = route[i + 1].p
  const lift = (route[i + 1].arc ?? 0) * 4 * f * (1 - f)
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f + lift, a[2] + (b[2] - a[2]) * f]
}

/** Same route travelled the other way (arcs move to the matching segment). */
export function reverseRoute(route: Waypoint[]): Waypoint[] {
  const r = [...route].reverse()
  return r.map((w, i) => ({ p: w.p, arc: i === 0 ? undefined : r[i - 1].arc }))
}

/** Close-up on a phone screen (series hook + loop frame share this framing). */
export const phoneClose = (phone: Vec3): { cam: Vec3; look: Vec3 } => ({
  cam: add(phone, [1.3, PHONE_SCREEN_Y + 1.9, 7.2]),
  look: add(phone, [0, PHONE_SCREEN_Y - 0.1, 0]),
})
