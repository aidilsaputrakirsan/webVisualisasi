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

const THEMES: Record<string, CourseTheme> = {
  'cloud-computing': CLOUD,
}

const Ctx = createContext<CourseTheme>(EDITORIAL)

export const useCourseTheme = () => useContext(Ctx)

export function CourseThemeProvider({ courseId, children }: { courseId: string; children: ReactNode }) {
  return <Ctx.Provider value={THEMES[courseId] ?? EDITORIAL}>{children}</Ctx.Provider>
}
