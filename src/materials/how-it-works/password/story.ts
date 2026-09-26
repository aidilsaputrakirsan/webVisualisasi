/**
 * EP. 06 — "A hacker can crack this in under a second." How stolen password
 * hashes get cracked, and what actually makes a password strong. Defensive
 * security education, precomputed as Step[].
 *
 * Story: your password → the site's hash machine (a one-way fingerprint) →
 * the database gets stolen → an attacker's GPU rig guesses offline: common
 * passwords first, then brute force (a 3D odometer of character wheels).
 *
 * Numbers (verified): assume 100 billion guesses/s — a GPU rig against a
 * fast, unsalted hash; the assumption is shown on screen. Worst-case times:
 *   8 lowercase      26^8  ≈ 2.1e11 → ~2 s
 *   8 of 95 chars    95^8  ≈ 6.6e15 → ~18 h
 *   16 lowercase     26^16 ≈ 4.4e22 → ~14,000 years
 *   12 of 95 chars   95^12 ≈ 5.4e23 → ~171,000 years
 * (Note: 4 random dictionary words ≈ 3.7e15 → ~10 h at this rate, so we do
 * NOT claim short passphrases are uncrackable.)
 * sha256("password123") = ef92b778bafe771e…
 */
import { DATACENTER, PHONE_A, PHONE_B, PHONE_SCREEN_Y, add, phoneClose, type Vec3 } from '../kit/geo'

export type Stage = 'store' | 'hash' | 'leak' | 'guess' | 'brute' | 'defend'
export type Cue = 'none' | 'type' | 'grind' | 'leak' | 'guess' | 'match' | 'spin' | 'stop' | 'long' | 'chart' | 'done'
export type Strength = 'weak' | 'strong'
/** What the odometer wheels do this beat. */
export type Wheels = { count: number; charset: 'lower' | 'all'; land: string | null } | null

export interface Step {
  cam: Vec3
  look: Vec3
  caption: string
  sub: string
  stage: Stage
  ms: number
  cue: Cue
  /** Password field on the phone + its strength meter. */
  field: string
  strength: Strength
  /** A password tile drops into the hash machine; the hash comes out. */
  hashing: boolean
  showHash: boolean
  /** Stolen hashes streaming from the data center to the attacker's rig. */
  leak: boolean
  /** Rig terminal: which guess list is scrolling. */
  terminal: 'off' | 'common' | 'leet'
  wheels: Wheels
  /** Time-to-crack shown on the HUD (null = hidden). */
  crack: string | null
  crackTone: 'bad' | 'mid' | 'good'
  /** Guesses-per-second assumption chip. */
  rate: boolean
  /** Final time-to-crack ladder. */
  ladder: boolean
}

export const WEAK = 'password123'
export const HASH = 'ef92b778bafe771e89245b89ecbc08a4'
/** Five random words: ~7776^5 ≈ 2.8e19 → ~9 years even at the fast-hash rate above. */
export const STRONG = 'tulip-rocket-saturday-cloud-maple'
export const RATE_LABEL = '100 billion guesses / second'

/** Guess lists scrolling on the attacker's terminal. */
export const COMMON_GUESSES = ['123456', 'qwerty', '111111', 'iloveyou', 'password', 'abc123', 'password1', 'dragon', 'sunshine', 'password123']
export const LEET_GUESSES = ['Password', 'Passw0rd', 'P@ssword', 'P4ssw0rd', 'Pa$$word', 'P@ssw0rd', 'P@ssw0rd!']

/** Ladder rows: label, worst-case time, relative log10(seconds) for bar length. */
export const LADDER: { label: string; time: string; log: number; tone: 'bad' | 'mid' | 'good' }[] = [
  { label: 'password123', time: 'instant', log: -3, tone: 'bad' },
  { label: 'P@ssw0rd!', time: 'instant', log: -3, tone: 'bad' },
  { label: '8 lowercase', time: '2 seconds', log: 0.3, tone: 'bad' },
  { label: '8 mixed', time: '18 hours', log: 4.8, tone: 'mid' },
  { label: '16 lowercase', time: '14,000 years', log: 11.6, tone: 'good' },
  { label: '12 mixed', time: '171,000 years', log: 12.7, tone: 'good' },
]

// ── Layout ──────────────────────────────────────────────────────────────────

/** The site's hash machine, beside its data center. */
export const HASHER: Vec3 = [DATACENTER[0] - 2.2, 0, DATACENTER[2] + 4.2]
/** The attacker's GPU rig (where phone B stood in earlier episodes). */
export const RIG: Vec3 = [PHONE_B[0], 0, PHONE_B[2] - 0.4]
/** Odometer panel floating above the rig. */
export const ODOMETER: Vec3 = [RIG[0], 4.1, RIG[2] + 1.2]

// ── Beats ───────────────────────────────────────────────────────────────────

type BeatKey = 'cam' | 'look' | 'caption' | 'sub' | 'stage' | 'ms' | 'cue'
type Beat = Pick<Step, BeatKey> & Partial<Omit<Step, BeatKey>>

const BASE: Omit<Step, BeatKey> = {
  field: WEAK,
  strength: 'weak',
  hashing: false,
  showHash: false,
  leak: false,
  terminal: 'off',
  wheels: null,
  crack: null,
  crackTone: 'bad',
  rate: false,
  ladder: false,
}

const HASH_VIEW = { cam: add(HASHER, [2.2, 2.7, 8.8]), look: add(HASHER, [0.8, 1.4, 0]) }
const RIG_VIEW = { cam: add(RIG, [-1.6, 2.8, 8.6]), look: add(RIG, [0, 2.2, 0.4]) }
const ODO_VIEW = { cam: add(ODOMETER, [0, 0.6, 12.5]), look: add(ODOMETER, [0, 0.2, 0]) }

const BEATS: Beat[] = [
  {
    // 0 — hook
    ...phoneClose(PHONE_A),
    caption: 'A hacker can crack this in *under a second*.',
    sub: 'Here’s how. And how to make it take centuries.',
    stage: 'store',
    ms: 3000,
    cue: 'none',
  },
  {
    // 1 — the hash
    ...HASH_VIEW,
    hashing: true,
    showHash: true,
    caption: 'Websites don’t store your *password*…',
    sub: '…only a scrambled fingerprint of it, called a hash.',
    stage: 'hash',
    ms: 3200,
    cue: 'grind',
  },
  {
    // 2 — one-way
    cam: add(HASHER, [2.1, 2, 7.4]),
    look: add(HASHER, [0.9, 1.3, 0]),
    showHash: true,
    caption: 'You can’t *unscramble* a hash.',
    sub: 'Same password, same hash, every time. But there’s no way back.',
    stage: 'hash',
    ms: 3000,
    cue: 'none',
  },
  {
    // 3 — breach
    cam: [38.4, 9.5, 25],
    look: [38.2, 2.2, -0.6],
    showHash: true,
    leak: true,
    caption: 'But databases get *stolen*.',
    sub: 'Millions of hashes leak. Now attackers can guess offline.',
    stage: 'leak',
    ms: 3200,
    cue: 'leak',
  },
  {
    // 4 — guess and compare
    ...RIG_VIEW,
    terminal: 'common',
    rate: true,
    caption: 'So they *guess*. Billions per second.',
    sub: 'Hash each guess, compare. On weakly protected sites, that’s fast.',
    stage: 'guess',
    ms: 3400,
    cue: 'guess',
  },
  {
    // 5 — common passwords fall
    ...RIG_VIEW,
    terminal: 'common',
    rate: true,
    crack: 'instant',
    caption: 'Common passwords fall *instantly*.',
    sub: '123456, qwerty, password123: first on every attacker’s list.',
    stage: 'guess',
    ms: 3000,
    cue: 'match',
  },
  {
    // 6 — leetspeak
    ...RIG_VIEW,
    field: 'P@ssw0rd!',
    terminal: 'leet',
    rate: true,
    crack: 'instant',
    caption: 'P@ssw0rd! Also *instant*.',
    sub: 'Swapping a→@ and o→0 is one of the oldest tricks on the list.',
    stage: 'guess',
    ms: 3000,
    cue: 'match',
  },
  {
    // 7 — brute force, 8 lowercase
    ...ODO_VIEW,
    wheels: { count: 8, charset: 'lower', land: 'kqzvtmra' },
    rate: true,
    crack: '2 seconds',
    caption: 'No match? Try *every* combination.',
    sub: '8 lowercase letters: 208 billion options. About 2 seconds.',
    stage: 'brute',
    ms: 3400,
    cue: 'spin',
  },
  {
    // 8 — add every character type
    ...ODO_VIEW,
    wheels: { count: 8, charset: 'all', land: null },
    rate: true,
    crack: '18 hours',
    crackTone: 'mid',
    caption: 'Add capitals, digits, *symbols*…',
    sub: '8 characters from 95 options each: about 18 hours.',
    stage: 'brute',
    ms: 3200,
    cue: 'spin',
  },
  {
    // 9 — make it longer
    cam: add(ODOMETER, [0, 0.6, 13]),
    look: add(ODOMETER, [0, 0, 0]),
    wheels: { count: 16, charset: 'lower', land: null },
    rate: true,
    crack: '14,000 years',
    crackTone: 'good',
    caption: 'Or just make it *longer*.',
    sub: '16 lowercase letters: about 14,000 years.',
    stage: 'brute',
    ms: 3200,
    cue: 'long',
  },
  {
    // 10 — the ladder
    cam: [42, 7.5, 14],
    look: [43, 3, 0],
    rate: true,
    ladder: true,
    caption: '*Length* beats complexity.',
    sub: 'Every extra character multiplies the work.',
    stage: 'defend',
    ms: 3600,
    cue: 'chart',
  },
  {
    // 11 — what to do
    cam: add(PHONE_A, [-1.4, 3.2, 7]),
    look: add(PHONE_A, [0, PHONE_SCREEN_Y + 0.6, 0]),
    field: STRONG,
    strength: 'strong',
    caption: 'Long, and *different* for every site.',
    sub: 'A password manager remembers them. Add 2-factor login on top.',
    stage: 'defend',
    ms: 3200,
    cue: 'done',
  },
  {
    // 12 — loop back to the hook framing
    ...phoneClose(PHONE_A),
    field: STRONG,
    strength: 'strong',
    caption: 'Now try cracking *this* one.',
    sub: 'One leak can’t unlock the rest of your life.',
    stage: 'defend',
    ms: 2600,
    cue: 'none',
  },
]

export function buildSteps(): Step[] {
  return BEATS.map((b) => ({ ...BASE, ...b }))
}
