/**
 * EP. 05 — "ChatGPT doesn't know the answer. It guesses one word at a time."
 * (tokens → embeddings → attention → layers → next-token probabilities →
 * repeat), precomputed as Step[].
 *
 * The question leaves phone A for the data center, then the camera rises
 * through the clouds into "inside the model": an abstract stage floating
 * above the diorama (MODEL_Y), with three stations along x:
 *   tokens (left) · model core (centre) · guess skyline + answer (right).
 *
 * Facts: text is split into tokens (~4 characters of English each); each
 * token becomes a vector of thousands of numbers; attention lets every token
 * weigh every other; models stack dozens of layers; the output is a score for
 * every possible next token, one is sampled (not always the top one), and the
 * loop repeats. Trained on trillions of words. Percentages shown are
 * illustrative examples, labelled as such on screen.
 */
import { DATACENTER, PHONE_A, PHONE_SCREEN_Y, SPOT, add, pathPoint, phoneClose, type Vec3, type Waypoint } from '../kit/geo'

export type Stage = 'ask' | 'tokens' | 'numbers' | 'attention' | 'guess' | 'repeat'
export type Cue = 'none' | 'whoosh' | 'rise' | 'split' | 'numbers' | 'attend' | 'layers' | 'bars' | 'pick' | 'fast' | 'wrong' | 'rain' | 'done'
export type PromptId = 'sky' | 'mars'

/** One next-token decision: candidates with (example) probabilities. */
export interface Round {
  cands: [string, number][]
  /** Index of the candidate actually picked (usually 0). */
  pick: number
}

export interface Step {
  cam: Vec3
  look: Vec3
  follow?: Vec3
  caption: string
  sub: string
  stage: Stage
  ms: number
  cue: Cue
  /** Question packet flying phone → data center. */
  packet: boolean
  /** Light beam linking the data center to the model above it. */
  beam: boolean
  prompt: PromptId
  tokens: boolean
  vectors: boolean
  attention: boolean
  /** Tokens rise through the stacked layers. */
  layers: boolean
  /** Rounds cycled through on the skyline during this beat (null = hidden). */
  rounds: Round[] | null
  /** Answer tiles already written before this beat's rounds. */
  answerBase: number
  /** Show the alternative (sampled #2) word instead of the top one. */
  alt: boolean
  /** The wrong answer is flagged. */
  wrong: boolean
  /** Pages raining into the model core (training). */
  training: boolean
  /** Phone: words of the answer shown, and whether the AI is still typing. */
  phoneWords: number
  typing: boolean
}

export const QUESTION = 'Why is the sky blue?'
export const PROMPT_TOKENS: Record<PromptId, string[]> = {
  sky: ['Why', ' is', ' the', ' sky', ' blue', '?'],
  mars: ['The', ' first', ' person', ' on', ' Mars', ' was'],
}
export const ANSWER = ['Because', ' air', ' scatters', ' blue', ' light', ' more.']

/** Attention links on the sky prompt: [from, to, strength 0–1]. */
export const LINKS: [number, number, number][] = [
  [4, 3, 1],
  [0, 5, 0.6],
  [3, 2, 0.35],
  [4, 5, 0.3],
  [1, 3, 0.25],
]

export const ROUNDS: Round[] = [
  { cands: [['Because', 62], ['The', 18], ['Sunlight', 8], ['It', 5], ['Light', 4], ['Blue', 3]], pick: 0 },
  { cands: [['air', 41], ['the', 22], ['sunlight', 15], ['of', 9], ['light', 8], ['blue', 5]], pick: 0 },
  { cands: [['scatters', 55], ['molecules', 20], ['bends', 10], ['is', 7], ['reflects', 5], ['has', 3]], pick: 0 },
  { cands: [['blue', 66], ['light', 14], ['short', 10], ['sunlight', 5], ['more', 3], ['the', 2]], pick: 0 },
  { cands: [['light', 71], ['waves', 15], ['more', 7], ['colors', 4], ['the', 2], ['rays', 1]], pick: 0 },
  { cands: [['more.', 48], ['most', 20], ['best', 12], ['.', 10], ['strongly', 6], ['easily', 4]], pick: 0 },
]
export const ROUND_ALT: Round = { ...ROUNDS[1], pick: 1 }
export const ROUND_MARS: Round = {
  cands: [['Neil', 31], ['Elon', 14], ['John', 9], ['a', 8], ['an', 6], ['never', 4]],
  pick: 0,
}

// ── Layout ──────────────────────────────────────────────────────────────────

/** The model floats above the data center. */
export const MODEL_Y = 26
export const CORE: Vec3 = [DATACENTER[0], MODEL_Y, DATACENTER[2]]
export const TOKENS_AT: Vec3 = [CORE[0] - 7, MODEL_Y, CORE[2]]
export const GUESS_AT: Vec3 = [CORE[0] + 7, MODEL_Y, CORE[2]]

export const ROUTE: Waypoint[] = [
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
export const routePoint = (s: number) => pathPoint(ROUTE, s)

// ── Beats ───────────────────────────────────────────────────────────────────

type BeatKey = 'cam' | 'look' | 'caption' | 'sub' | 'stage' | 'ms' | 'cue'
type Beat = Pick<Step, BeatKey> & Partial<Omit<Step, BeatKey>>

const BASE: Omit<Step, BeatKey> = {
  packet: false,
  beam: false,
  prompt: 'sky',
  tokens: false,
  vectors: false,
  attention: false,
  layers: false,
  rounds: null,
  answerBase: 0,
  alt: false,
  wrong: false,
  training: false,
  phoneWords: 0,
  typing: true,
}

/** Near-frontal view of the token row (all six tiles fit the portrait frame). */
const TOK_VIEW = { cam: add(TOKENS_AT, [0.8, 2.2, 15]), look: add(TOKENS_AT, [0, 0.9, 0]) }
const GUESS_VIEW = { cam: add(GUESS_AT, [0.3, 1.4, 14.8]), look: add(GUESS_AT, [0, 1.2, 0]) }

const BEATS: Beat[] = [
  {
    // 0 — hook
    ...phoneClose(PHONE_A),
    caption: 'ChatGPT doesn’t *know* the answer.',
    sub: 'It guesses. One word at a time.',
    stage: 'ask',
    ms: 2800,
    cue: 'none',
  },
  {
    // 1 — off to the data center
    cam: [10, 5, 7],
    look: [14, 0, 0],
    follow: [-4.5, 5.4, 8.2],
    packet: true,
    caption: 'Your question flies to a *data center*.',
    sub: 'Thousands of chips running one giant model.',
    stage: 'ask',
    ms: 3200,
    cue: 'whoosh',
  },
  {
    // 2 — rise into the model, tokens
    ...TOK_VIEW,
    beam: true,
    tokens: true,
    caption: 'First, it chops your words into *tokens*.',
    sub: 'Small chunks of text, about 4 letters each.',
    stage: 'tokens',
    ms: 3200,
    cue: 'split',
  },
  {
    // 3 — numbers
    cam: add(TOKENS_AT, [0.7, 3.4, 15]),
    look: add(TOKENS_AT, [0, 1.7, 0]),
    beam: true,
    tokens: true,
    vectors: true,
    caption: 'Each token becomes a list of *numbers*.',
    sub: 'Thousands of them, encoding what the word means.',
    stage: 'numbers',
    ms: 2900,
    cue: 'numbers',
  },
  {
    // 4 — attention
    ...TOK_VIEW,
    beam: true,
    tokens: true,
    attention: true,
    caption: 'Every word *looks* at every other word.',
    sub: '“blue” pays attention to “sky”. This is called attention.',
    stage: 'attention',
    ms: 3000,
    cue: 'attend',
  },
  {
    // 5 — layers
    cam: add(TOKENS_AT, [1.2, 3.6, 15.5]),
    look: add(TOKENS_AT, [0, 2.2, 0]),
    beam: true,
    tokens: true,
    layers: true,
    caption: 'Again and again, through *dozens* of layers.',
    sub: 'Each layer sharpens what the sentence is about.',
    stage: 'attention',
    ms: 3000,
    cue: 'layers',
  },
  {
    // 6 — the guess
    ...GUESS_VIEW,
    beam: true,
    rounds: [ROUNDS[0]],
    caption: 'Then it scores *every* possible next word.',
    sub: 'Tens of thousands of options. Here, “Because” wins.',
    stage: 'guess',
    ms: 3200,
    cue: 'bars',
  },
  {
    // 7 — write one word, repeat
    ...GUESS_VIEW,
    beam: true,
    rounds: ROUNDS.slice(1),
    answerBase: 1,
    phoneWords: 6,
    caption: 'Write *one* word. Feed it back. Repeat.',
    sub: 'That’s why answers appear word by word.',
    stage: 'repeat',
    ms: 4400,
    cue: 'fast',
  },
  {
    // 8 — sampling
    ...GUESS_VIEW,
    beam: true,
    rounds: [ROUND_ALT],
    answerBase: 1,
    alt: true,
    phoneWords: 6,
    caption: 'It doesn’t always pick the *top* word.',
    sub: 'A little randomness. Ask twice, get two different answers.',
    stage: 'repeat',
    ms: 3200,
    cue: 'pick',
  },
  {
    // 9 — hallucination
    ...GUESS_VIEW,
    beam: true,
    prompt: 'mars',
    rounds: [ROUND_MARS],
    wrong: true,
    phoneWords: 6,
    caption: 'It predicts what *sounds* right…',
    sub: '…not what is right. Nobody has walked on Mars. Yet.',
    stage: 'repeat',
    ms: 3400,
    cue: 'wrong',
  },
  {
    // 10 — training
    cam: add(CORE, [0.4, 1.2, 13]),
    look: add(CORE, [0, 1.2, 0]),
    beam: true,
    training: true,
    phoneWords: 6,
    caption: 'Where do the scores come from? *Reading*.',
    sub: 'Trained on trillions of words to guess the next one.',
    stage: 'repeat',
    ms: 3200,
    cue: 'rain',
  },
  {
    // 11 — back on the phone
    cam: add(PHONE_A, [-1.4, 3.2, 7]),
    look: add(PHONE_A, [0, PHONE_SCREEN_Y + 0.6, 0]),
    phoneWords: 6,
    typing: false,
    caption: 'Not a search engine. A *next-word* machine.',
    sub: 'An astonishingly good one.',
    stage: 'repeat',
    ms: 2900,
    cue: 'done',
  },
  {
    // 12 — loop back to the hook framing
    ...phoneClose(PHONE_A),
    caption: 'Ask it something. Watch it *guess*.',
    sub: 'One word at a time.',
    stage: 'ask',
    ms: 2600,
    cue: 'none',
  },
]

export function buildSteps(): Step[] {
  return BEATS.map((b) => ({ ...BASE, ...b }))
}
