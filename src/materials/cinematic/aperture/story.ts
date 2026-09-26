/**
 * Cinematic EP. 01 (Bahasa Indonesia) — "Kamera jadul ini punya rahasia yang
 * baru masuk ke iPhone tahun ini": the variable aperture. Precomputed Step[].
 *
 * Facts (Apple Newsroom, 9 Sep 2026): iPhone 18 Pro's 48MP Fusion Main camera
 * has a "variable aperture with six laser-cut blades", from ƒ/1.48 to ƒ/4.
 * Other phones had variable apertures before (e.g. Samsung, Xiaomi), so the
 * claim is only "new to iPhone". Optics: a wider opening lets in more light;
 * a narrower one keeps more of the scene in focus (deeper depth of field).
 */
export type Vec3 = [number, number, number]
export type Shot = 'camera' | 'iris'
export type Cue = 'none' | 'whoosh' | 'flash' | 'click' | 'done'

export interface Step {
  shot: Shot
  cam: Vec3
  look: Vec3
  /** Chapter pill + which progress segment is lit. */
  chapter: string
  /** Headline; *asterisks* mark the accent words. */
  caption: string
  /** Aperture opening, 0 (closed) … 1 (wide open). */
  open: number
  /** Big readout under the headline (null = hidden). */
  stat: string | null
  statNote: string | null
  ms: number
  cue: Cue
}

export const F_WIDE = 'f/1.48'
export const F_NARROW = 'f/4'
/** Iris openings matching the two f-stops (area ∝ 1/N², so ƒ/4 is ~1/7 the area). */
export const OPEN_WIDE = 1
export const OPEN_NARROW = 0.37

const HOOK = 'Kamera jadul ini punya *rahasia*.'

export const STEPS: Step[] = [
  {
    shot: 'camera',
    cam: [2.6, 1.5, 6.2],
    look: [0, 0.2, 0],
    chapter: 'RAHASIA',
    caption: HOOK,
    open: OPEN_WIDE,
    stat: null,
    statNote: null,
    ms: 3200,
    cue: 'none',
  },
  {
    shot: 'camera',
    cam: [0.25, 0.35, 2.6],
    look: [0, 0.2, 0],
    chapter: 'RAHASIA',
    caption: 'Tahun ini baru masuk ke *iPhone*.',
    open: OPEN_WIDE,
    stat: null,
    statNote: null,
    ms: 2600,
    cue: 'whoosh',
  },
  {
    shot: 'iris',
    cam: [0.7, 0.2, 9.6],
    look: [0, -1, 0],
    chapter: 'DIAFRAGMA',
    caption: '*6 bilah* yang bisa bergerak.',
    open: OPEN_WIDE,
    stat: '6 bilah',
    statNote: 'dipotong laser',
    ms: 3000,
    cue: 'flash',
  },
  {
    shot: 'iris',
    cam: [-0.6, 0.1, 8.4],
    look: [0, -0.9, 0],
    chapter: 'DIAFRAGMA',
    caption: 'Menyempit: *lebih banyak* yang fokus.',
    open: OPEN_NARROW,
    stat: F_NARROW,
    statNote: 'lubang kecil',
    ms: 3200,
    cue: 'click',
  },
  {
    shot: 'iris',
    cam: [0.5, -0.3, 8.0],
    look: [0, -0.9, 0],
    chapter: 'DIAFRAGMA',
    caption: 'Melebar: *lebih banyak* cahaya.',
    open: OPEN_WIDE,
    stat: F_WIDE,
    statNote: 'lubang besar',
    ms: 3200,
    cue: 'click',
  },
  {
    shot: 'iris',
    cam: [1.4, 0.8, 11.5],
    look: [0, -1.3, 0],
    chapter: 'IPHONE 18 PRO',
    caption: 'Dulu cuma di kamera *jadul*.',
    open: 0.7,
    stat: `${F_WIDE} – ${F_NARROW}`,
    statNote: 'sumber: Apple, 9 Sep 2026',
    ms: 3400,
    cue: 'done',
  },
  // Loop back to the hook.
  {
    shot: 'camera',
    cam: [2.6, 1.5, 6.2],
    look: [0, 0.2, 0],
    chapter: 'RAHASIA',
    caption: HOOK,
    open: OPEN_WIDE,
    stat: null,
    statNote: null,
    ms: 2600,
    cue: 'whoosh',
  },
]

export const CHAPTERS = ['RAHASIA', 'DIAFRAGMA', 'IPHONE 18 PRO']
