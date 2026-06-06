/**
 * Precomputed "API Gateway rate limiting" — a token-bucket model. One Step = a
 * snapshot of the bucket (tokens), the request in flight, and the running
 * allowed / 429 counters. The animation just replays these frames.
 *
 * Token bucket: capacity = burst, refills at `rate`. Each request consumes one
 * token → 200 (forwarded). No token left → 429 Too Many Requests (rejected,
 * backend never touched). Mirrors nginx `limit_req` (Modul 15).
 *
 * Two modes:
 *   - 'normal' : traffic ≤ kapasitas → bucket terisi ulang tepat waktu → semua 200.
 *   - 'flood'  : ledakan request (brute force) → burst terpakai → 429 → pulih
 *                saat traffic mereda & token terisi ulang.
 */

export type Mode = 'normal' | 'flood'

export type Cue = 'allow' | 'reject' | 'refill' | 'done' | null

export type NodeId = 'client' | 'gw' | 'backend'
export type Tone = 'request' | 'allow' | 'reject'

export interface NodeSpec {
  id: NodeId
  cx: number
  cy: number
  w: number
  h: number
}

export const NODES: Record<NodeId, NodeSpec> = {
  client: { id: 'client', cx: 122, cy: 112, w: 210, h: 86 },
  gw: { id: 'gw', cx: 452, cy: 136, w: 320, h: 156 },
  backend: { id: 'backend', cx: 800, cy: 112, w: 220, h: 86 },
}

export interface EdgeSpec {
  a: NodeId
  b: NodeId
  ax: number
  ay: number
  bx: number
  by: number
}

export const EDGES: EdgeSpec[] = [
  { a: 'client', b: 'gw', ax: 227, ay: 112, bx: 292, by: 112 },
  { a: 'gw', b: 'backend', ax: 612, ay: 112, bx: 690, by: 112 },
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

export interface RateStep {
  packet: Packet | null
  tokens: number
  capacity: number
  allowed: number
  rejected: number
  refilling: boolean
  verdict: 'allow' | 'reject' | null
  activeNodes: NodeId[]
  line: number
  status: string
  sound: Cue
}

export const CAPACITY = 5
export const RATE = '5 r/s'

export const CODE_SOURCE = [
  '# services/gateway/nginx.conf',
  'limit_req_zone $binary_remote_addr',
  '    zone=auth_limit:10m rate=5r/s;',
  '',
  'location /auth/login {',
  '    limit_req zone=auth_limit burst=5 nodelay;',
  '    limit_req_status 429;',
  '    proxy_pass http://auth_service/login;',
  '}',
  '',
  'error_page 429 = @rate_limited;',
  'location @rate_limited {',
  '    return 429 \'{"error":"Too many requests"}\';',
  '}',
]

const LINE = { rate: 2, burst: 5, allow: 7, reject: 12, refill: 2 }

export const MODES: Record<Mode, { label: string; desc: string }> = {
  normal: {
    label: 'Traffic Normal',
    desc: 'Request ≤ kapasitas → token terisi ulang tepat waktu → semua diteruskan',
  },
  flood: {
    label: 'Flood / Brute Force',
    desc: 'Ledakan request → burst habis → kelebihan ditolak 429 → pulih saat mereda',
  },
}

function buildNormal(): RateStep[] {
  const steps: RateStep[] = []
  let tokens = CAPACITY
  let allowed = 0
  let rejected = 0
  const b = (p: Partial<RateStep>): RateStep => ({
    packet: null,
    tokens,
    capacity: CAPACITY,
    allowed,
    rejected,
    refilling: false,
    verdict: null,
    activeNodes: [],
    line: LINE.burst,
    status: '',
    sound: null,
    ...p,
  })

  steps.push(b({ activeNodes: ['gw'], status: `Token bucket: kapasitas ${CAPACITY} (burst), isi ulang ${RATE}. Tiap request = 1 token.` }))

  const allow = (label: string) => {
    tokens -= 1
    allowed += 1
    steps.push(b({ packet: { from: 'gw', to: 'backend', tag: '200 OK', tone: 'allow' }, tokens, allowed, verdict: 'allow', activeNodes: ['gw', 'backend'], line: LINE.allow, status: label, sound: 'allow' }))
  }
  const refill = (label: string) => {
    tokens = Math.min(CAPACITY, tokens + 1)
    steps.push(b({ tokens, refilling: true, activeNodes: ['gw'], line: LINE.refill, status: label, sound: 'refill' }))
  }

  allow('Request masuk → ada token → diteruskan ke Auth Service (200).')
  refill('Waktu berjalan → bucket isi ulang +1 token (5/detik).')
  allow('Request berikutnya → token tersedia → 200.')
  refill('Isi ulang lagi — laju request masih di bawah kapasitas.')
  allow('200 — pengguna normal tidak pernah kena limit.')
  allow('200.')
  refill('Bucket tetap sehat karena traffic wajar.')
  steps.push(b({ activeNodes: ['backend'], line: LINE.burst, status: 'Traffic normal ≤ kapasitas → semua 200, tidak ada 429.', sound: 'done' }))
  return steps
}

function buildFlood(): RateStep[] {
  const steps: RateStep[] = []
  let tokens = CAPACITY
  let allowed = 0
  let rejected = 0
  const b = (p: Partial<RateStep>): RateStep => ({
    packet: null,
    tokens,
    capacity: CAPACITY,
    allowed,
    rejected,
    refilling: false,
    verdict: null,
    activeNodes: [],
    line: LINE.burst,
    status: '',
    sound: null,
    ...p,
  })

  steps.push(b({ activeNodes: ['gw'], status: `Bucket penuh (${CAPACITY} token). Attacker membombardir /auth/login secepat mungkin.` }))

  const allow = (label: string) => {
    tokens -= 1
    allowed += 1
    steps.push(b({ packet: { from: 'gw', to: 'backend', tag: '200 OK', tone: 'allow' }, tokens, allowed, verdict: 'allow', activeNodes: ['gw', 'backend'], line: LINE.allow, status: label, sound: 'allow' }))
  }
  const reject = (label: string) => {
    rejected += 1
    steps.push(b({ packet: { from: 'gw', to: 'client', tag: '429', tone: 'reject' }, tokens, rejected, verdict: 'reject', activeNodes: ['client', 'gw'], line: LINE.reject, status: label, sound: 'reject' }))
  }
  const refill = (n: number, label: string) => {
    tokens = Math.min(CAPACITY, tokens + n)
    steps.push(b({ tokens, refilling: true, activeNodes: ['gw'], line: LINE.refill, status: label, sound: 'refill' }))
  }

  // Burst absorbed
  allow('Request 1 → token ada → 200. (burst menyerap lonjakan awal)')
  allow('Request 2 → 200.')
  allow('Request 3 → 200.')
  allow('Request 4 → 200.')
  allow('Request 5 → 200. Token terakhir terpakai — bucket KOSONG.')

  // Throttled
  reject('Request 6 → tidak ada token → 429 Too Many Requests (Auth tidak dipanggil).')
  reject('Request 7 → 429. Fail-fast melindungi backend.')
  reject('Request 8 → 429. Brute force login diblok.')

  // Recover
  refill(2, 'Attacker melambat / waktu berlalu → bucket isi ulang +2 token.')
  allow('Request sah masuk lagi → token tersedia → 200.')
  allow('200 — layanan pulih untuk pengguna normal.')

  steps.push(b({ activeNodes: ['gw'], line: LINE.burst, status: 'Rate limiting: burst diserap, kelebihan ditolak 429, pulih saat traffic turun.', sound: 'done' }))
  return steps
}

export function buildSteps(mode: Mode): RateStep[] {
  return mode === 'normal' ? buildNormal() : buildFlood()
}
