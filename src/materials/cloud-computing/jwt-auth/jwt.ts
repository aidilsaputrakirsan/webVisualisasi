/**
 * Precomputed "JWT verification patterns" — the same authenticated request
 * (POST /items + Bearer JWT) handled three ways, so you can compare hops,
 * latency, and load on the Auth Service.
 *
 *   A 'callAuth'  : Item Service memanggil Auth /verify via HTTP tiap request.
 *                   → hop ekstra, latency tinggi, Auth jadi bottleneck.
 *   B 'local'     : Item verifikasi tanda tangan JWT sendiri pakai PUBLIC KEY
 *                   (RS256). → tanpa network, Auth nganggur, tak bisa di-forge.
 *   C 'gateway'   : Gateway verifikasi sekali lalu inject X-User-Id; service
 *                   hilir percaya. → verifikasi terpusat, service hilir simpel.
 */

export type Mode = 'callAuth' | 'local' | 'gateway' | 'compare'
export type Cue = 'send' | 'verify' | 'authcall' | 'db' | 'pass' | 'done' | null

export type NodeId = 'client' | 'gw' | 'item' | 'auth' | 'db'
export type Tone = 'request' | 'pass' | 'verify' | 'db'

export interface NodeSpec {
  id: NodeId
  cx: number
  cy: number
  w: number
  h: number
  label: string
  sub: string
}

export const NODES: Record<NodeId, NodeSpec> = {
  client: { id: 'client', cx: 100, cy: 74, w: 180, h: 80, label: 'Client', sub: 'kirim JWT' },
  gw: { id: 'gw', cx: 340, cy: 74, w: 180, h: 80, label: 'Gateway', sub: 'Nginx' },
  item: { id: 'item', cx: 582, cy: 74, w: 192, h: 80, label: 'Item Service', sub: ':8002' },
  auth: { id: 'auth', cx: 824, cy: 74, w: 192, h: 80, label: 'Auth Service', sub: ':8001' },
  db: { id: 'db', cx: 582, cy: 236, w: 184, h: 66, label: 'item_db', sub: 'items' },
}

export interface EdgeSpec {
  a: NodeId
  b: NodeId
  ax: number
  ay: number
  bx: number
  by: number
  dashed?: boolean
}

export const EDGES: EdgeSpec[] = [
  { a: 'client', b: 'gw', ax: 190, ay: 74, bx: 250, by: 74 },
  { a: 'gw', b: 'item', ax: 430, ay: 74, bx: 486, by: 74 },
  { a: 'item', b: 'auth', ax: 678, ay: 74, bx: 728, by: 74, dashed: true },
  { a: 'item', b: 'db', ax: 582, ay: 114, bx: 582, by: 203 },
]

export function edgeBetween(x: NodeId, y: NodeId): EdgeSpec | undefined {
  return EDGES.find((e) => (e.a === x && e.b === y) || (e.a === y && e.b === x))
}

export interface Packet {
  from: NodeId
  to: NodeId
  tag: string
  tone: Tone
}

export interface JwtStep {
  packet: Packet | null
  activeNodes: NodeId[]
  /** Where the lock badge (verification happens) shows. */
  verifyAt: NodeId | null
  /** Where the public-key badge shows. */
  keyAt: NodeId | null
  /** Auth Service participates in this mode at all. */
  authIdle: boolean
  latency: number
  authCalls: number
  hops: number
  line: number
  status: string
  sound: Cue
}

const CODE_A = [
  '# item-service/auth_client.py',
  'async def verify(token):',
  '    r = await client.get(',
  '        f"{AUTH_URL}/verify",      # network hop!',
  '        headers={"Authorization": token})',
  '    return r.json()        # {user_id}',
  '# dipanggil TIAP request → Auth bottleneck',
]

const CODE_B = [
  '# item-service/auth.py  (verifikasi lokal)',
  'import jwt',
  'PUBLIC_KEY = load("auth_public.pem")  # RS256',
  '',
  'def verify(token):',
  '    # cek tanda tangan TANPA panggil Auth',
  '    return jwt.decode(token, PUBLIC_KEY,',
  '                      algorithms=["RS256"])',
  '# Auth hanya dipakai saat login',
]

const CODE_C = [
  '# gateway/nginx.conf  (verify di pintu masuk)',
  'location /items {',
  '    auth_request /_verify;          # cek JWT',
  '    auth_request_set $uid',
  '        $upstream_http_x_user_id;',
  '    proxy_set_header X-User-Id $uid;  # inject',
  '    proxy_pass http://item_service;',
  '}',
  '# Item Service percaya header dari Gateway',
]

export const MODES: Record<Mode, { label: string; desc: string; filename: string; code: string[] }> = {
  callAuth: {
    label: 'A · via Auth (HTTP)',
    desc: 'Item Service memanggil Auth /verify tiap request — hop ekstra & bottleneck',
    filename: 'auth_client.py',
    code: CODE_A,
  },
  local: {
    label: 'B · Local (public key)',
    desc: 'Item verifikasi JWT sendiri pakai public key (RS256) — tanpa panggil Auth',
    filename: 'auth.py',
    code: CODE_B,
  },
  gateway: {
    label: 'C · Gateway verify',
    desc: 'Gateway verifikasi sekali lalu inject X-User-Id — verifikasi terpusat',
    filename: 'nginx.conf',
    code: CODE_C,
  },
  compare: {
    label: 'D · Bandingkan A/B/C',
    desc: 'Ketiga pola berlomba berdampingan — panjang jalur = latency',
    filename: '',
    code: [],
  },
}

// ── Compare mode: three lanes racing side by side ───────────────────────────

export interface Segment {
  w: number
  kind: 'normal' | 'auth' | 'verify' | 'db'
  label?: string
}

export interface Lane {
  id: 'A' | 'B' | 'C'
  label: string
  segments: Segment[]
  /** Cumulative time (ms) at which Auth is hit (→ load +1), or null. */
  authLoadAt: number | null
}

export const LANES: Lane[] = [
  {
    id: 'A',
    label: 'A · via Auth (HTTP)',
    segments: [
      { w: 4, kind: 'normal' },
      { w: 4, kind: 'normal' },
      { w: 40, kind: 'auth', label: 'Auth /verify  +40ms' },
      { w: 8, kind: 'db', label: 'DB +8' },
      { w: 8, kind: 'normal' },
    ],
    authLoadAt: 48,
  },
  {
    id: 'B',
    label: 'B · local (public key)',
    segments: [
      { w: 4, kind: 'normal' },
      { w: 4, kind: 'normal' },
      { w: 1, kind: 'verify', label: 'verify ~1ms' },
      { w: 8, kind: 'db', label: 'DB +8' },
      { w: 8, kind: 'normal' },
    ],
    authLoadAt: null,
  },
  {
    id: 'C',
    label: 'C · gateway verify',
    segments: [
      { w: 4, kind: 'normal' },
      { w: 1, kind: 'verify', label: 'GW verify ~1ms' },
      { w: 4, kind: 'normal' },
      { w: 8, kind: 'db', label: 'DB +8' },
      { w: 8, kind: 'normal' },
    ],
    authLoadAt: null,
  },
]

export const laneTotal = (l: Lane) => l.segments.reduce((s, seg) => s + seg.w, 0)
export const MAXTOTAL = Math.max(...LANES.map(laneTotal))

export interface CompareStep {
  t: number
  status: string
  sound: Cue
}

export function buildCompare(): CompareStep[] {
  const times = [0, 4, 8, 12, 16, 20, 25, 30, 38, 48, 56, MAXTOTAL]
  const status = (t: number): string => {
    if (t <= 4) return 'Awal identik: request masuk ke Gateway dengan Bearer JWT.'
    if (t <= 8) return 'C verifikasi di Gateway; A & B diteruskan ke Item Service.'
    if (t < 25) return 'B & C verifikasi lokal (~1ms). A justru hop ke Auth lewat network…'
    if (t < 48) return 'A masih menunggu balasan Auth (~40ms). B & C sudah SELESAI (201).'
    if (t < MAXTOTAL) return 'A baru dapat balasan Auth, lanjut simpan & response.'
    return 'Selesai. A ~64ms + beban Auth = 1. B & C ~25ms, Auth nganggur.'
  }
  const sound = (t: number): Cue => {
    if (t >= MAXTOTAL) return 'done'
    if (t === 25) return 'pass'
    if (t === 12 || t === 38) return 'authcall'
    if (t === 4) return 'send'
    return null
  }
  return times.map((t) => ({ t, status: status(t), sound: sound(t) }))
}

function buildCallAuth(): JwtStep[] {
  const steps: JwtStep[] = []
  let lat = 0
  let calls = 0
  let hops = 0
  const b = (p: Partial<JwtStep>): JwtStep => ({
    packet: null,
    activeNodes: [],
    verifyAt: null,
    keyAt: null,
    authIdle: false,
    latency: lat,
    authCalls: calls,
    hops,
    line: 1,
    status: '',
    sound: null,
    ...p,
  })

  steps.push(b({ activeNodes: ['client'], status: 'Pola A: Item Service bertanya ke Auth via HTTP untuk verifikasi token.' }))
  lat += 4
  steps.push(b({ packet: { from: 'client', to: 'gw', tag: 'POST /items + JWT', tone: 'request' }, activeNodes: ['client', 'gw'], latency: lat, line: 1, status: 'Client kirim request + Bearer token.', sound: 'send' }))
  lat += 4
  steps.push(b({ packet: { from: 'gw', to: 'item', tag: 'route', tone: 'request' }, activeNodes: ['gw', 'item'], latency: lat, line: 1, status: 'Gateway teruskan ke Item Service.', sound: 'send' }))
  hops = 1
  lat += 40
  steps.push(b({ packet: { from: 'item', to: 'auth', tag: 'GET /verify (HTTP)', tone: 'verify' }, activeNodes: ['item', 'auth'], verifyAt: 'auth', hops, latency: lat, line: 3, status: 'Hop EKSTRA ke Auth lewat network (~40ms). Verifikasi terjadi di Auth.', sound: 'authcall' }))
  calls = 1
  steps.push(b({ packet: { from: 'auth', to: 'item', tag: '{user_id}', tone: 'pass' }, activeNodes: ['auth', 'item'], authCalls: calls, hops, latency: lat, line: 5, status: 'Auth decode JWT & balas. Beban Auth +1 (tiap request menambah beban).', sound: 'pass' }))
  lat += 8
  steps.push(b({ packet: { from: 'item', to: 'db', tag: 'INSERT', tone: 'db' }, activeNodes: ['item', 'db'], authCalls: calls, hops, latency: lat, line: 6, status: 'Token valid → simpan item ke item_db.', sound: 'db' }))
  lat += 8
  steps.push(b({ packet: { from: 'gw', to: 'client', tag: '201 Created', tone: 'pass' }, activeNodes: ['gw', 'client'], authCalls: calls, hops, latency: lat, line: 6, status: 'Response kembali ke Client.', sound: 'pass' }))
  steps.push(b({ activeNodes: [], authCalls: calls, hops, latency: lat, line: 6, status: `Pola A selesai · latency ~${lat}ms · Auth dipanggil tiap request → titik bottleneck.`, sound: 'done' }))
  return steps
}

function buildLocal(): JwtStep[] {
  const steps: JwtStep[] = []
  let lat = 0
  const b = (p: Partial<JwtStep>): JwtStep => ({
    packet: null,
    activeNodes: [],
    verifyAt: null,
    keyAt: 'item',
    authIdle: true,
    latency: lat,
    authCalls: 0,
    hops: 0,
    line: 4,
    status: '',
    sound: null,
    ...p,
  })

  steps.push(b({ activeNodes: ['item'], status: 'Pola B: Item Service menyimpan PUBLIC KEY Auth & verifikasi token sendiri.' }))
  lat += 4
  steps.push(b({ packet: { from: 'client', to: 'gw', tag: 'POST /items + JWT', tone: 'request' }, activeNodes: ['client', 'gw'], latency: lat, line: 1, status: 'Client kirim request + Bearer token.', sound: 'send' }))
  lat += 4
  steps.push(b({ packet: { from: 'gw', to: 'item', tag: 'route', tone: 'request' }, activeNodes: ['gw', 'item'], latency: lat, line: 1, status: 'Gateway teruskan ke Item Service.', sound: 'send' }))
  lat += 1
  steps.push(b({ verifyAt: 'item', activeNodes: ['item'], latency: lat, line: 6, status: 'Cek tanda tangan JWT secara LOKAL pakai public key (~1ms). Tanpa panggil Auth.', sound: 'verify' }))
  lat += 8
  steps.push(b({ packet: { from: 'item', to: 'db', tag: 'INSERT', tone: 'db' }, activeNodes: ['item', 'db'], latency: lat, line: 6, status: 'Valid → simpan item. Auth tak tersentuh (beban 0).', sound: 'db' }))
  lat += 8
  steps.push(b({ packet: { from: 'gw', to: 'client', tag: '201 Created', tone: 'pass' }, activeNodes: ['gw', 'client'], latency: lat, line: 6, status: 'Response kembali ke Client.', sound: 'pass' }))
  steps.push(b({ activeNodes: [], latency: lat, line: 8, status: `Pola B selesai · latency ~${lat}ms · Auth nganggur. Tak bisa forge (hanya Auth pegang private key).`, sound: 'done' }))
  return steps
}

function buildGateway(): JwtStep[] {
  const steps: JwtStep[] = []
  let lat = 0
  const b = (p: Partial<JwtStep>): JwtStep => ({
    packet: null,
    activeNodes: [],
    verifyAt: null,
    keyAt: 'gw',
    authIdle: true,
    latency: lat,
    authCalls: 0,
    hops: 0,
    line: 2,
    status: '',
    sound: null,
    ...p,
  })

  steps.push(b({ activeNodes: ['gw'], status: 'Pola C: Gateway verifikasi token sekali di pintu masuk, lalu teruskan identitas.' }))
  lat += 4
  steps.push(b({ packet: { from: 'client', to: 'gw', tag: 'POST /items + JWT', tone: 'request' }, activeNodes: ['client', 'gw'], latency: lat, line: 1, status: 'Client kirim request + Bearer token.', sound: 'send' }))
  lat += 1
  steps.push(b({ verifyAt: 'gw', activeNodes: ['gw'], latency: lat, line: 2, status: 'Gateway verifikasi JWT SEKALI (~1ms) di pintu masuk.', sound: 'verify' }))
  lat += 4
  steps.push(b({ packet: { from: 'gw', to: 'item', tag: 'X-User-Id (tervalidasi)', tone: 'pass' }, activeNodes: ['gw', 'item'], latency: lat, line: 5, status: 'Gateway inject X-User-Id → Item percaya, tak perlu verify lagi.', sound: 'pass' }))
  lat += 8
  steps.push(b({ packet: { from: 'item', to: 'db', tag: 'INSERT', tone: 'db' }, activeNodes: ['item', 'db'], latency: lat, line: 6, status: 'Item Service simpan item — service hilir tetap simpel.', sound: 'db' }))
  lat += 8
  steps.push(b({ packet: { from: 'gw', to: 'client', tag: '201 Created', tone: 'pass' }, activeNodes: ['gw', 'client'], latency: lat, line: 6, status: 'Response kembali ke Client.', sound: 'pass' }))
  steps.push(b({ activeNodes: [], latency: lat, line: 8, status: `Pola C selesai · latency ~${lat}ms · verifikasi terpusat di Gateway, Auth tak dipanggil.`, sound: 'done' }))
  return steps
}

export function buildSteps(mode: Mode): JwtStep[] {
  if (mode === 'callAuth') return buildCallAuth()
  if (mode === 'local') return buildLocal()
  return buildGateway()
}
