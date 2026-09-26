/**
 * EP. 04 — "Kok bisa bayar QRIS cuma 2 detik?" — precomputed as Step[].
 *
 * Bahasa: episode ini sengaja full Bahasa Indonesia (topik khas Indonesia),
 * pengecualian dari aturan "teks penonton Bahasa Inggris" di CLAUDE.md atas
 * permintaan user. Kode & nama variabel tetap Inggris.
 *
 * Same diorama as the other episodes. Your side (phone + warung) is on land A;
 * the servers sit across the sea on land B (think: Jakarta, another island):
 *   issuer (your e-wallet) → switching hub → acquirer (merchant's bank),
 * then the confirmation flies back to the warung's soundbox.
 *
 * Facts: QRIS = BI/ASPI standard on EMVCo MPM; the code holds merchant data
 * (name, NMID, acquirer), not money; transactions route issuer → one of four
 * licensed switching companies → acquirer; interbank settlement happens
 * later, so the "payment received" notice arrives before banks settle.
 * Timings on the HUD are illustrative (the whole trip is ~seconds).
 */
import { DATACENTER, PHONE_A, PHONE_SCREEN_Y, SPOT, add, pathPoint, phoneClose, type Vec3, type Waypoint } from '../kit/geo'

export type Screen = 'scan' | 'pay' | 'wait' | 'done'
export type Stage = 'scan' | 'pin' | 'issuer' | 'switch' | 'acquirer' | 'warung'
export type Cue = 'none' | 'scan' | 'pop' | 'tap' | 'whoosh' | 'hub' | 'land' | 'done' | 'twist'
export type RouteId = 'toIssuer' | 'toHub' | 'toAcquirer' | 'back'

export interface Step {
  cam: Vec3
  look: Vec3
  follow?: Vec3
  caption: string
  sub: string
  stage: Stage
  screen: Screen
  /** The payment message: which route and where along it. */
  packet: { route: RouteId; at: number } | null
  /** Scan beam from the phone to the QR standee. */
  scanBeam: boolean
  /** Data labels rising out of the QR code. */
  qrTags: boolean
  /** Switching hub lit up with spokes to every bank / e-wallet. */
  hubActive: boolean
  /** Soundbox at the warung speaking ("Pembayaran diterima"). */
  soundbox: boolean
  /** Slow dashed interbank settlement arc (the plot twist). */
  settlement: boolean
  /** Elapsed time on the HUD (seconds), null = hidden. */
  timeS: number | null
  /** Your balance has been debited. */
  debited: boolean
  /** Merchant's bank has recorded the incoming money. */
  credited: boolean
  ms: number
  cue: Cue
}

export const MERCHANT = 'Myst-Tech'
export const AMOUNT = 'Rp15.000'
export const BALANCE_BEFORE = 'Rp100.000'
export const BALANCE_AFTER = 'Rp85.000'
export const NMID = 'ID1024•••••'

// ── Layout (land A: you + warung; land B: servers) ──────────────────────────

export const WARUNG: Vec3 = [-4.4, 0, 0.4]
/** QR standee on the counter, facing the viewer. */
export const QR_STAND: Vec3 = [WARUNG[0] + 0.75, 1.12, WARUNG[2] + 0.75]
export const SOUNDBOX: Vec3 = [WARUNG[0] - 0.7, 1.12, WARUNG[2] + 0.75]
export const HUB: Vec3 = [38.5, 0, 1.2]
export const ACQUIRER: Vec3 = [45.2, 0, -1.4]
/** Small satellite nodes around the hub: other banks / e-wallets. */
export const HUB_NODES: Vec3[] = Array.from({ length: 6 }, (_, i) => {
  const a = (i / 6) * Math.PI * 2 + 0.3
  return [HUB[0] + Math.cos(a) * 3.1, 0, HUB[2] + Math.sin(a) * 2.4] as Vec3
})

const HUB_PORT: Vec3 = [HUB[0], 1.1, HUB[2] + 0.2]
const ACQ_PORT: Vec3 = [ACQUIRER[0], 0.95, ACQUIRER[2] + 0.9]
const SOUND_TOP: Vec3 = [SOUNDBOX[0], SOUNDBOX[1] + 0.45, SOUNDBOX[2]]

// ── Routes ──────────────────────────────────────────────────────────────────

export const ROUTES: Record<RouteId, Waypoint[]> = {
  toIssuer: [
    { p: SPOT.phoneAScreen },
    { p: SPOT.phoneAAbove },
    { p: SPOT.towerATop, arc: 1.6 },
    { p: SPOT.towerABase },
    { p: SPOT.coastA },
    { p: SPOT.seabedA },
    { p: SPOT.seabedB },
    { p: SPOT.coastB },
    { p: SPOT.dataCenter },
  ],
  toHub: [{ p: SPOT.dataCenter }, { p: HUB_PORT, arc: 1.4 }],
  toAcquirer: [{ p: HUB_PORT }, { p: ACQ_PORT, arc: 1.4 }],
  back: [
    { p: ACQ_PORT },
    { p: SPOT.coastB, arc: 2.4 },
    { p: SPOT.seabedB },
    { p: SPOT.seabedA },
    { p: SPOT.coastA },
    { p: SPOT.towerABase },
    { p: SPOT.towerATop },
    { p: SOUND_TOP, arc: 2 },
  ],
}

export const routeEnd = (id: RouteId) => ROUTES[id].length - 1
export const pointOn = (id: RouteId, s: number) => pathPoint(ROUTES[id], s)

/** Endpoints of the settlement arc (issuer ↔ acquirer). */
export const SETTLE_FROM: Vec3 = [DATACENTER[0], 2.6, DATACENTER[2]]
export const SETTLE_TO: Vec3 = [ACQUIRER[0], 2.2, ACQUIRER[2]]

// ── Beats ───────────────────────────────────────────────────────────────────

type BeatKey = 'cam' | 'look' | 'caption' | 'sub' | 'stage' | 'ms' | 'cue'
type Beat = Pick<Step, BeatKey> & Partial<Omit<Step, BeatKey>>

const BASE: Omit<Step, BeatKey> = {
  screen: 'scan',
  packet: null,
  scanBeam: false,
  qrTags: false,
  hubActive: false,
  soundbox: false,
  settlement: false,
  timeS: null,
  debited: false,
  credited: false,
}

const BEATS: Beat[] = [
  {
    // 0 — hook
    ...phoneClose(PHONE_A),
    caption: 'Kamu scan *QRIS*. 2 detik kemudian uangnya pindah.',
    sub: 'Kok bisa secepat itu? Ikuti perjalanannya.',
    stage: 'scan',
    ms: 3000,
    cue: 'none',
  },
  {
    // 1 — scan
    cam: [-0.9, 5.8, 14.7],
    look: [-2.6, 1.8, 0.7],
    scanBeam: true,
    caption: 'Kamu *scan* kode QR di warung.',
    sub: 'Isinya bukan uang. Cuma “alamat” si penjual.',
    stage: 'scan',
    ms: 2600,
    cue: 'scan',
  },
  {
    // 2 — what the QR holds
    cam: add(QR_STAND, [1.2, 1, 5.6]),
    look: add(QR_STAND, [0.75, 0.55, 0]),
    qrTags: true,
    caption: 'QR itu berisi *data penjual*.',
    sub: 'Nama toko, nomor ID (NMID), dan bank atau e-wallet si penjual.',
    stage: 'scan',
    ms: 3000,
    cue: 'pop',
  },
  {
    // 3 — amount + PIN
    cam: add(PHONE_A, [-1.1, 2.8, 6.1]),
    look: add(PHONE_A, [0, 1.4, 0]),
    screen: 'pay',
    timeS: 0,
    caption: 'Kamu isi *nominal* & PIN.',
    sub: 'PIN membuktikan ini benar-benar kamu yang bayar.',
    stage: 'pin',
    ms: 2600,
    cue: 'tap',
  },
  {
    // 4 — to your e-wallet's server, across the sea
    cam: [10, 5, 7],
    look: [14, 0, 0],
    follow: [-4.5, 5.4, 8.2],
    screen: 'wait',
    packet: { route: 'toIssuer', at: routeEnd('toIssuer') },
    timeS: 0.4,
    debited: true,
    caption: 'Meluncur ke *server e-wallet* kamu.',
    sub: 'Bisa jadi di Jakarta, di pulau lain. Saldo kamu dipotong di sini.',
    stage: 'issuer',
    ms: 3400,
    cue: 'whoosh',
  },
  {
    // 5 — switching
    cam: [33.5, 6.6, 12],
    look: [37.5, 0.8, 0.2],
    screen: 'wait',
    packet: { route: 'toHub', at: routeEnd('toHub') },
    hubActive: true,
    timeS: 0.7,
    debited: true,
    caption: 'Lalu lewat *switching*.',
    sub: 'Semacam “bandara” yang menyambungkan semua bank & e-wallet.',
    stage: 'switch',
    ms: 2900,
    cue: 'hub',
  },
  {
    // 6 — one QR for every app
    cam: [38.5, 11.5, 11],
    look: [38.5, 0, 0.6],
    screen: 'wait',
    hubActive: true,
    timeS: 0.7,
    debited: true,
    caption: 'Kuncinya: *satu QR* untuk semua aplikasi.',
    sub: 'Bayar pakai e-wallet atau bank apa pun, jalurnya ketemu di sini.',
    stage: 'switch',
    ms: 2900,
    cue: 'pop',
  },
  {
    // 7 — the merchant's bank
    cam: [41, 4.8, 9.5],
    look: [43.6, 1, -0.6],
    screen: 'wait',
    packet: { route: 'toAcquirer', at: routeEnd('toAcquirer') },
    hubActive: true,
    timeS: 1.0,
    debited: true,
    credited: true,
    caption: 'Diteruskan ke *bank si penjual*.',
    sub: 'Bank penjual mencatat: ada uang masuk Rp15.000.',
    stage: 'acquirer',
    ms: 2800,
    cue: 'land',
  },
  {
    // 8 — confirmation flies back to the warung
    cam: [30, 5, 7],
    look: [26, 0, 0],
    follow: [4.2, 5.2, 8.2],
    screen: 'wait',
    packet: { route: 'back', at: routeEnd('back') },
    timeS: 1.6,
    debited: true,
    credited: true,
    caption: 'Konfirmasi balik *ke warung*.',
    sub: 'Menyeberang laut lagi. Semua ini kurang dari 2 detik.',
    stage: 'warung',
    ms: 3400,
    cue: 'whoosh',
  },
  {
    // 9 — the soundbox
    cam: [-2.5, 3.7, 9.4],
    look: [-4.3, 2, 0.9],
    screen: 'done',
    soundbox: true,
    timeS: 1.8,
    debited: true,
    credited: true,
    caption: '*“Pembayaran diterima!”*',
    sub: 'Suara paling merdu bagi penjual.',
    stage: 'warung',
    ms: 2800,
    cue: 'done',
  },
  {
    // 10 — plot twist: settlement comes later
    cam: [37, 12, 17],
    look: [38.5, 2.6, -0.8],
    screen: 'done',
    settlement: true,
    timeS: 1.8,
    debited: true,
    credited: true,
    caption: 'Plot twist: uangnya *belum* pindah.',
    sub: 'Antarbank baru dibereskan belakangan lewat Bank Indonesia. Notifikasinya duluan.',
    stage: 'warung',
    ms: 3400,
    cue: 'twist',
  },
  {
    // 11 — the payer's view: done
    cam: add(PHONE_A, [-2.6, 3.2, 7.6]),
    look: add(PHONE_A, [-1.6, PHONE_SCREEN_Y + 0.4, 0]),
    screen: 'done',
    timeS: 1.8,
    debited: true,
    credited: true,
    caption: '5 pihak, 2 kali seberang laut, *< 2 detik*.',
    sub: 'Kamu, e-wallet kamu, switching, bank penjual, dan warung.',
    stage: 'warung',
    ms: 3000,
    cue: 'pop',
  },
  {
    // 12 — loop back to the hook framing
    ...phoneClose(PHONE_A),
    caption: 'Jadi, lain kali kamu *scan*…',
    sub: '…ingat perjalanan 2 detik ini.',
    stage: 'warung',
    ms: 2600,
    cue: 'none',
  },
]

export function buildSteps(): Step[] {
  return BEATS.map((b) => ({ ...BASE, ...b }))
}
