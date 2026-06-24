import { createContext, useContext, type ReactNode } from 'react'

/**
 * Per-course visual theme. Both courses stay on the light "Editorial" base, but
 * each gets its own paper temperature + accent so the menu and recordings read
 * as distinct:
 *   - Data Structure → warm cream paper + amber accent (the original).
 *   - Cloud Computing → cool lavender paper + indigo accent.
 *
 * Shared chrome (MaterialStage, CodeBlock, TitleBlock) reads this via
 * `useCourseTheme()`; cloud-specific node colours live in
 * `materials/cloud-computing/palette.ts` and are derived from CLOUD below.
 */
export interface CourseTheme {
  /** Solid base of the canvas. */
  paper: string
  /** Full canvas background (radial grain + paper). */
  stageBg: string
  /** Letterbox behind the scaled canvas. */
  letterbox: string
  /** Primary text. */
  ink: string
  accent: string
  accentDeep: string
  accentSoft: string
  accentText: string
}

export const EDITORIAL: CourseTheme = {
  paper: '#FAF7F2',
  stageBg:
    'radial-gradient(70% 55% at 50% 22%, rgba(217,119,6,0.05), transparent 70%), radial-gradient(55% 45% at 78% 85%, rgba(180,83,9,0.04), transparent 70%), #FAF7F2',
  letterbox: '#F1E9DB',
  ink: '#211C16',
  accent: '#D97706',
  accentDeep: '#B45309',
  accentSoft: '#FDEBC8',
  accentText: '#92400E',
}

export const CLOUD: CourseTheme = {
  paper: '#EEF0F7',
  stageBg:
    'radial-gradient(70% 55% at 50% 22%, rgba(109,69,217,0.06), transparent 70%), radial-gradient(55% 45% at 78% 85%, rgba(37,99,235,0.05), transparent 70%), #EEF0F7',
  letterbox: '#E2E5F1',
  ink: '#20243A',
  accent: '#6D45D9',
  accentDeep: '#5B34C0',
  accentSoft: '#ECE6FB',
  accentText: '#4326A0',
}

export const ALGO: CourseTheme = {
  paper: '#F1F6F3',
  stageBg:
    'radial-gradient(70% 55% at 50% 22%, rgba(13,148,136,0.06), transparent 70%), radial-gradient(55% 45% at 78% 85%, rgba(5,150,105,0.05), transparent 70%), #F1F6F3',
  letterbox: '#E3EDE7',
  ink: '#163029',
  accent: '#0D9488',
  accentDeep: '#0F766E',
  accentSoft: '#CCFBF1',
  accentText: '#115E59',
}

/**
 * Claude Code → a departure from the light "Editorial" base: a warm near-black
 * "terminal" canvas with Anthropic's signature coral accent. Materials in this
 * course render their own dark panels (they don't reuse the light CodeBlock).
 */
export const CLAUDE: CourseTheme = {
  paper: '#1E1A17',
  stageBg:
    'radial-gradient(62% 48% at 50% 16%, rgba(217,119,87,0.14), transparent 70%), radial-gradient(52% 42% at 82% 90%, rgba(217,119,87,0.07), transparent 70%), #1E1A17',
  letterbox: '#120F0D',
  ink: '#F6EFE6',
  accent: '#D97757',
  accentDeep: '#C15F3C',
  accentSoft: '#3A2A22',
  accentText: '#F0B79A',
}

/**
 * Vibe Coding → a cool "creative night" departure: deep indigo canvas with an
 * electric-violet accent and cyan/mint highlights. Like Claude Code, this
 * course renders its own dark panels rather than the light shared CodeBlock.
 */
export const VIBE: CourseTheme = {
  paper: '#15131F',
  stageBg:
    'radial-gradient(60% 50% at 50% 15%, rgba(167,139,250,0.18), transparent 70%), radial-gradient(52% 45% at 84% 92%, rgba(56,189,248,0.10), transparent 70%), #15131F',
  letterbox: '#0E0C16',
  ink: '#F3F0FB',
  accent: '#A78BFA',
  accentDeep: '#8B5CF6',
  accentSoft: '#2A2640',
  accentText: '#C7B6FF',
}

/**
 * OpenClaw → a "self-hosted homelab" departure: a near-black green-slate canvas
 * with an emerald accent and cyan/lime highlights, evoking servers and terminals.
 * Renders its own dark panels (not the light shared CodeBlock).
 */
export const OPENCLAW: CourseTheme = {
  paper: '#0E1512',
  stageBg:
    'radial-gradient(60% 50% at 50% 15%, rgba(52,211,153,0.16), transparent 70%), radial-gradient(52% 45% at 84% 92%, rgba(34,211,238,0.09), transparent 70%), #0E1512',
  letterbox: '#070C0A',
  ink: '#ECF6EF',
  accent: '#34D399',
  accentDeep: '#10B981',
  accentSoft: '#1C2A23',
  accentText: '#86EFAC',
}

/**
 * Palm Research (GRS) → a light "field notebook" departure: a warm leaf-green
 * paper with an olive-leaf accent, evoking plantation foliage. Stays on the
 * light Editorial base and reuses the shared CodeBlock.
 */
export const SAWIT: CourseTheme = {
  paper: '#F4F6EE',
  stageBg:
    'radial-gradient(70% 55% at 50% 22%, rgba(79,138,47,0.06), transparent 70%), radial-gradient(55% 45% at 78% 85%, rgba(60,110,34,0.05), transparent 70%), #F4F6EE',
  letterbox: '#E7ECDD',
  ink: '#22291A',
  accent: '#4F8A2F',
  accentDeep: '#3C6E22',
  accentSoft: '#E5F3D6',
  accentText: '#3C6E22',
}

/**
 * Blockchain → a light "ledger" departure: a cool steel-paper canvas with a
 * cobalt accent, distinct from Cloud's violet and Algorithms' teal. Stays on the
 * light Editorial base and reuses the shared CodeBlock.
 */
export const BLOCKCHAIN: CourseTheme = {
  paper: '#EEF2F9',
  stageBg:
    'radial-gradient(70% 55% at 50% 22%, rgba(37,99,235,0.07), transparent 70%), radial-gradient(55% 45% at 78% 85%, rgba(29,78,216,0.05), transparent 70%), #EEF2F9',
  letterbox: '#E0E6F1',
  ink: '#16213A',
  accent: '#2563EB',
  accentDeep: '#1D4ED8',
  accentSoft: '#DBEAFE',
  accentText: '#1E40AF',
}

const THEMES: Record<string, CourseTheme> = {
  'cloud-computing': CLOUD,
  algorithms: ALGO,
  'claude-code': CLAUDE,
  'vibe-coding': VIBE,
  openclaw: OPENCLAW,
  research: SAWIT,
  blockchain: BLOCKCHAIN,
}

const Ctx = createContext<CourseTheme>(EDITORIAL)

export const useCourseTheme = () => useContext(Ctx)

export function CourseThemeProvider({ courseId, children }: { courseId: string; children: ReactNode }) {
  return <Ctx.Provider value={THEMES[courseId] ?? EDITORIAL}>{children}</Ctx.Provider>
}
