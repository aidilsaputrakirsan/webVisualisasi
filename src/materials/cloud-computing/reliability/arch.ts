/**
 * Precomputed "microservices reliability" — one Step = a full snapshot of the
 * request lane (Item Service → Circuit Breaker → Auth Service) plus the circuit
 * breaker state machine. The animation just replays these frames.
 *
 * Two modes mirror Modul 13:
 *   - 'retry'   : satu request gagal transient → retry dengan exponential
 *                 backoff (0.5s, 1s) → berhasil di percobaan ke-3.
 *   - 'breaker' : Auth down → gagal beruntun → ambang tercapai → breaker OPEN
 *                 (fast-fail) → cooldown → HALF_OPEN test → pulih → CLOSED.
 */

export type Mode = 'retry' | 'breaker'

export type Cue = 'send' | 'fail' | 'pass' | 'reject' | 'trip' | 'wait' | 'recover' | 'done' | null

export type LaneId = 'item' | 'breaker' | 'auth'
export type StateId = 'CLOSED' | 'OPEN' | 'HALF_OPEN'
export type Tone = 'request' | 'pass' | 'fail' | 'reject'

export interface LaneNode {
  id: LaneId
  cx: number
  cy: number
  w: number
  h: number
}

/** Request-lane node positions on the ~860×480 board (design px). */
export const LANE: Record<LaneId, LaneNode> = {
  item: { id: 'item', cx: 132, cy: 62, w: 224, h: 78 },
  breaker: { id: 'breaker', cx: 430, cy: 62, w: 330, h: 108 },
  auth: { id: 'auth', cx: 728, cy: 62, w: 224, h: 78 },
}

export interface LaneEdge {
  a: LaneId
  b: LaneId
  ax: number
  ay: number
  bx: number
  by: number
}

export const LANE_EDGES: LaneEdge[] = [
  { a: 'item', b: 'breaker', ax: 244, ay: 62, bx: 265, by: 62 },
  { a: 'breaker', b: 'auth', ax: 595, ay: 62, bx: 616, by: 62 },
]

export function laneEdge(x: LaneId, y: LaneId): LaneEdge | undefined {
  return LANE_EDGES.find((e) => (e.a === x && e.b === y) || (e.a === y && e.b === x))
}

export interface StateNode {
  id: StateId
  cx: number
  cy: number
  w: number
  h: number
  label: string
  sub: string
}

/** Circuit-breaker state machine node positions. */
export const STATES: Record<StateId, StateNode> = {
  CLOSED: { id: 'CLOSED', cx: 152, cy: 270, w: 218, h: 88, label: 'CLOSED', sub: 'normal · diteruskan' },
  OPEN: { id: 'OPEN', cx: 708, cy: 270, w: 218, h: 88, label: 'OPEN', sub: 'tripped · fast-fail' },
  HALF_OPEN: { id: 'HALF_OPEN', cx: 430, cy: 426, w: 240, h: 88, label: 'HALF-OPEN', sub: 'testing · 1 request' },
}

export interface Transition {
  from: StateId
  to: StateId
  label: string
  ax: number
  ay: number
  bx: number
  by: number
  lx: number
  ly: number
}

export const TRANSITIONS: Transition[] = [
  { from: 'CLOSED', to: 'OPEN', label: '≥ ambang gagal', ax: 261, ay: 234, bx: 599, by: 234, lx: 430, ly: 212 },
  { from: 'OPEN', to: 'HALF_OPEN', label: 'cooldown 30s', ax: 672, ay: 314, bx: 556, by: 398, lx: 656, ly: 360 },
  { from: 'HALF_OPEN', to: 'CLOSED', label: 'test ok', ax: 304, ay: 398, bx: 188, by: 314, lx: 206, ly: 360 },
]

export interface Packet {
  from: LaneId
  to: LaneId
  tag: string
  tone: Tone
}

export interface RelStep {
  packet: Packet | null
  authUp: boolean
  state: StateId
  failureCount: number
  threshold: number
  attempt: number | null
  activeTransition: { from: StateId; to: StateId } | null
  laneActive: LaneId[]
  line: number
  status: string
  sound: Cue
}

export const THRESHOLD = 3

export const MODES: Record<Mode, { label: string; desc: string; filename: string; code: string[] }> = {
  retry: {
    label: 'Retry',
    desc: 'Gagal transient? Coba lagi dengan exponential backoff (0.5s, 1s, 2s)',
    filename: 'item-service/auth_client.py',
    code: [
      '# item-service/auth_client.py',
      'MAX_RETRIES = 3',
      'BASE_DELAY  = 0.5     # detik',
      '',
      'for attempt in range(1, MAX_RETRIES + 1):',
      '    try:',
      '        r = await client.get(f"{AUTH}/verify")',
      '        if r.status_code == 200:',
      '            return r.json()          # sukses',
      '    except (ConnectError, Timeout):',
      '        log.warning(f"gagal (attempt {attempt})")',
      '    # exponential backoff: 0.5s, 1s, 2s',
      '    await asyncio.sleep(BASE_DELAY * 2**(attempt-1))',
      'raise HTTPException(503, "Auth unavailable")',
    ],
  },
  breaker: {
    label: 'Circuit Breaker',
    desc: 'Service down terus → berhenti mencoba (fail-fast) → pulih otomatis',
    filename: 'item-service/circuit_breaker.py',
    code: [
      '# circuit_breaker.py',
      'class CircuitBreaker:',
      '    state = "CLOSED"   # CLOSED / OPEN / HALF_OPEN',
      '    failure_count = 0',
      '    threshold = 3',
      '    def can_execute(self):',
      '        if state == "OPEN" and cooldown_passed():',
      '            state = "HALF_OPEN"; return True',
      '        return state != "OPEN"      # OPEN → tolak',
      '    def record_failure(self):',
      '        failure_count += 1',
      '        if failure_count >= threshold:',
      '            state = "OPEN"           # trip!',
      '    def record_success(self):',
      '        failure_count = 0; state = "CLOSED"',
    ],
  },
}

function buildRetry(): RelStep[] {
  const steps: RelStep[] = []
  const b = (p: Partial<RelStep>): RelStep => ({
    packet: null,
    authUp: false,
    state: 'CLOSED',
    failureCount: 0,
    threshold: THRESHOLD,
    attempt: null,
    activeTransition: null,
    laneActive: [],
    line: 0,
    status: '',
    sound: null,
    ...p,
  })

  steps.push(b({ laneActive: ['item'], line: 4, status: 'Item Service perlu verify token ke Auth Service (Auth sedang bermasalah).' }))
  // attempt 1
  steps.push(b({ packet: { from: 'breaker', to: 'auth', tag: 'GET /verify #1', tone: 'request' }, laneActive: ['breaker', 'auth'], attempt: 1, line: 6, status: 'Percobaan 1 — kirim request ke Auth Service…', sound: 'send' }))
  steps.push(b({ packet: { from: 'auth', to: 'breaker', tag: 'Connection refused', tone: 'fail' }, laneActive: ['auth', 'breaker'], attempt: 1, line: 9, status: 'Percobaan 1 GAGAL: Connection refused (error transient).', sound: 'fail' }))
  steps.push(b({ laneActive: ['breaker'], attempt: 1, line: 12, status: 'Tunggu 0.5 detik (exponential backoff) sebelum coba lagi…', sound: 'wait' }))
  // attempt 2
  steps.push(b({ packet: { from: 'breaker', to: 'auth', tag: 'GET /verify #2', tone: 'request' }, laneActive: ['breaker', 'auth'], attempt: 2, line: 6, status: 'Percobaan 2 — kirim ulang…', sound: 'send' }))
  steps.push(b({ packet: { from: 'auth', to: 'breaker', tag: 'Timeout', tone: 'fail' }, laneActive: ['auth', 'breaker'], attempt: 2, line: 9, status: 'Percobaan 2 GAGAL: Timeout. Tunggu lebih lama…', sound: 'fail' }))
  steps.push(b({ laneActive: ['breaker'], attempt: 2, line: 12, status: 'Tunggu 1 detik (delay berlipat: 0.5s → 1s → 2s)…', sound: 'wait' }))
  // attempt 3 success (Auth recovered)
  steps.push(b({ packet: { from: 'breaker', to: 'auth', tag: 'GET /verify #3', tone: 'request' }, authUp: true, laneActive: ['breaker', 'auth'], attempt: 3, line: 6, status: 'Percobaan 3 — Auth sudah pulih, kirim lagi…', sound: 'send' }))
  steps.push(b({ packet: { from: 'auth', to: 'breaker', tag: '200 {user_id}', tone: 'pass' }, authUp: true, laneActive: ['auth', 'breaker'], attempt: 3, line: 8, status: 'Percobaan 3 BERHASIL: 200 OK.', sound: 'pass' }))
  steps.push(b({ authUp: true, laneActive: ['item'], attempt: 3, line: 8, status: 'Retry menyelamatkan request: gangguan sesaat tertangani tanpa error ke user.', sound: 'done' }))
  return steps
}

function buildBreaker(): RelStep[] {
  const steps: RelStep[] = []
  const b = (p: Partial<RelStep>): RelStep => ({
    packet: null,
    authUp: false,
    state: 'CLOSED',
    failureCount: 0,
    threshold: THRESHOLD,
    attempt: null,
    activeTransition: null,
    laneActive: [],
    line: 0,
    status: '',
    sound: null,
    ...p,
  })

  steps.push(b({ state: 'CLOSED', line: 2, status: 'State CLOSED (normal): semua request diteruskan ke Auth Service.' }))

  // 3 failures while CLOSED
  for (let i = 1; i <= THRESHOLD; i++) {
    steps.push(b({ packet: { from: 'breaker', to: 'auth', tag: `verify #${i}`, tone: 'request' }, state: 'CLOSED', failureCount: i - 1, laneActive: ['breaker', 'auth'], line: 8, status: `Request ${i}: diteruskan ke Auth Service…`, sound: 'send' }))
    const tripping = i === THRESHOLD
    steps.push(
      b({
        packet: { from: 'auth', to: 'breaker', tag: 'gagal', tone: 'fail' },
        state: tripping ? 'OPEN' : 'CLOSED',
        failureCount: i,
        laneActive: ['auth', 'breaker'],
        activeTransition: tripping ? { from: 'CLOSED', to: 'OPEN' } : null,
        line: tripping ? 12 : 10,
        status: tripping
          ? `Gagal (${i}/${THRESHOLD}) → ambang tercapai! Breaker TRIP: CLOSED → OPEN.`
          : `Auth down → gagal (${i}/${THRESHOLD}). failure_count naik.`,
        sound: tripping ? 'trip' : 'fail',
      }),
    )
  }

  // OPEN → fast fail (rejected, Auth not even called)
  steps.push(b({ packet: { from: 'breaker', to: 'item', tag: '503 ditolak', tone: 'reject' }, state: 'OPEN', failureCount: THRESHOLD, laneActive: ['item', 'breaker'], line: 8, status: 'State OPEN: request DITOLAK langsung (<100ms) — Auth tidak dipanggil.', sound: 'reject' }))
  steps.push(b({ packet: { from: 'breaker', to: 'item', tag: '503 ditolak', tone: 'reject' }, state: 'OPEN', failureCount: THRESHOLD, laneActive: ['item', 'breaker'], line: 8, status: 'Fail-fast menghemat resource & mencegah cascading failure.', sound: 'reject' }))

  // cooldown → HALF_OPEN
  steps.push(b({ state: 'OPEN', failureCount: THRESHOLD, activeTransition: { from: 'OPEN', to: 'HALF_OPEN' }, line: 6, status: 'Tunggu cooldown 30 detik… (Auth Service dinyalakan kembali)', sound: 'wait' }))
  steps.push(b({ packet: { from: 'breaker', to: 'auth', tag: 'verify (test)', tone: 'request' }, authUp: true, state: 'HALF_OPEN', failureCount: THRESHOLD, laneActive: ['breaker', 'auth'], line: 7, status: 'HALF-OPEN: izinkan 1 request percobaan untuk cek apakah Auth pulih.', sound: 'send' }))
  steps.push(b({ packet: { from: 'auth', to: 'breaker', tag: '200 OK', tone: 'pass' }, authUp: true, state: 'CLOSED', failureCount: 0, activeTransition: { from: 'HALF_OPEN', to: 'CLOSED' }, laneActive: ['auth', 'breaker'], line: 14, status: 'Test berhasil! HALF-OPEN → CLOSED, failure_count di-reset.', sound: 'recover' }))
  steps.push(b({ authUp: true, state: 'CLOSED', failureCount: 0, laneActive: ['item'], line: 2, status: 'Sistem pulih otomatis tanpa intervensi manual — itulah circuit breaker.', sound: 'done' }))
  return steps
}

export function buildSteps(mode: Mode): RelStep[] {
  return mode === 'retry' ? buildRetry() : buildBreaker()
}
