/**
 * Precomputed "observability — correlation-ID tracing" — one Step = a snapshot
 * of a single request travelling through the service chain plus the structured
 * log stream it produces. Every service stamps the SAME correlation_id, so one
 * `grep` reveals the whole journey.
 *
 * Two modes mirror Modul 14:
 *   - 'success' : request lolos; semua log INFO; berakhir 201.
 *   - 'error'   : Auth down → retry WARN → ERROR; berakhir 503. Tunjukkan cara
 *                 men-debug kegagalan lintas service lewat satu correlation_id.
 */

export type Mode = 'success' | 'error' | 'metrics'

export type Cue = 'send' | 'route' | 'pass' | 'warn' | 'fail' | 'done' | null

export type NodeId = 'fe' | 'gw' | 'item' | 'auth'
export type Tone = 'request' | 'pass' | 'fail'
export type Level = 'INFO' | 'WARN' | 'ERROR'

export interface NodeSpec {
  id: NodeId
  cx: number
  cy: number
  w: number
  h: number
  label: string
  sub: string
}

/** Service-chain positions on the ~900×118 chain board (design px). */
export const NODES: Record<NodeId, NodeSpec> = {
  fe: { id: 'fe', cx: 100, cy: 58, w: 176, h: 76, label: 'Frontend', sub: 'React' },
  gw: { id: 'gw', cx: 333, cy: 58, w: 176, h: 76, label: 'Gateway', sub: 'Nginx' },
  item: { id: 'item', cx: 567, cy: 58, w: 188, h: 76, label: 'Item Service', sub: ':8002' },
  auth: { id: 'auth', cx: 800, cy: 58, w: 188, h: 76, label: 'Auth Service', sub: ':8001' },
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
  { a: 'fe', b: 'gw', ax: 188, ay: 58, bx: 245, by: 58 },
  { a: 'gw', b: 'item', ax: 421, ay: 58, bx: 473, by: 58 },
  { a: 'item', b: 'auth', ax: 661, ay: 58, bx: 706, by: 58 },
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

export interface LogRow {
  level: Level
  service: string
  ts: string
  method?: string
  path?: string
  status?: number
  ms?: number
  msg: string
}

/** One incoming request (metrics mode). */
export interface ReqInfo {
  method: string
  path: string
  status: number
  ms: number
}

/** Four Golden Signals snapshot (metrics mode). */
export interface Signals {
  total: number
  reqPerSec: number
  errors: number
  errorRate: number
  p50: number
  p95: number
  p99: number
  avg: number
  cpu: number
  mem: number
  spark: number[]
}

export interface ObsStep {
  packet: Packet | null
  activeNodes: NodeId[]
  logs: LogRow[]
  lastMs: number | null
  /** Present only in metrics mode → renders the Golden Signals dashboard. */
  signals?: Signals | null
  /** The request that just arrived (metrics mode). */
  req?: ReqInfo | null
  /** Whether this step generates a fresh correlation id or reuses the header. */
  cidAction?: 'generate' | 'reuse' | null
  line: number
  status: string
  sound: Cue
}

export const CID = 'a1b2c3d4'

/** logging_middleware.py shown in the CodeBlock (same for both modes). */
export const CODE_SOURCE = [
  '# services/shared/logging_middleware.py',
  'async def dispatch(self, request, call_next):',
  '    cid = request.headers.get(',
  '        "X-Correlation-ID", str(uuid4())[:12])',
  '    request.state.correlation_id = cid',
  '    start = time.time()',
  '    response = await call_next(request)',
  '    dur = round((time.time() - start) * 1000, 1)',
  '    logger.info(',
  '        f"{method} {path} -> {response.status_code}",',
  '        extra={"correlation_id": cid,',
  '               "duration_ms": dur})',
  '    response.headers["X-Correlation-ID"] = cid',
  '    return response',
]

/** metrics.py — percentile calc shown in the CodeBlock for the metrics mode. */
export const METRICS_CODE = [
  '# services/shared/metrics.py',
  'def get_metrics(self):',
  '    n = len(self.latencies)',
  '    s = sorted(self.latencies)',
  '    return {',
  '        "total_requests": self.request_count,',
  '        "error_rate_percent":',
  '            self.error_count / self.request_count * 100,',
  '        "p50_ms": s[int(n * 0.50)],',
  '        "p95_ms": s[int(n * 0.95)],   # outlier menonjol di sini',
  '        "p99_ms": s[min(int(n * 0.99), n - 1)],',
  '    }',
]

export const MODES: Record<Mode, { label: string; desc: string; filename: string; code: string[] }> = {
  success: {
    label: 'Sukses',
    desc: 'Satu Correlation ID menjahit log dari semua service jadi satu jejak',
    filename: 'logging_middleware.py',
    code: CODE_SOURCE,
  },
  error: {
    label: 'Error',
    desc: 'Auth down → grep satu Correlation ID untuk debug kegagalan lintas service',
    filename: 'logging_middleware.py',
    code: CODE_SOURCE,
  },
  metrics: {
    label: 'Golden Signals',
    desc: 'Endpoint /metrics: Latency, Traffic, Errors, Saturation terisi tiap request',
    filename: 'metrics.py',
    code: METRICS_CODE,
  },
}

function buildSuccess(): ObsStep[] {
  const logs: LogRow[] = []
  const steps: ObsStep[] = []
  const push = (p: Partial<ObsStep>) =>
    steps.push({ packet: null, activeNodes: [], logs: [...logs], lastMs: null, cidAction: null, line: 0, status: '', sound: null, ...p })

  push({ activeNodes: ['fe'], line: 0, status: `Satu request akan ditrace lewat semua service dengan Correlation ID: ${CID}.` })

  logs.push({ level: 'INFO', service: 'gateway', ts: '10:30:45.118Z', method: 'POST', path: '/items', status: 201, ms: 52, msg: 'routed to item-service' })
  push({ packet: { from: 'fe', to: 'gw', tag: 'POST /items', tone: 'request' }, activeNodes: ['fe', 'gw'], logs: [...logs], cidAction: 'generate', line: 3, status: `Header X-Correlation-ID belum ada → Gateway GENERATE uuid()[:12] = ${CID}.`, sound: 'send' })

  logs.push({ level: 'INFO', service: 'item-service', ts: '10:30:45.121Z', method: 'POST', path: '/items', msg: 'request received' })
  push({ packet: { from: 'gw', to: 'item', tag: `cid ${CID}`, tone: 'request' }, activeNodes: ['gw', 'item'], logs: [...logs], cidAction: 'reuse', line: 4, status: 'Item Service: header sudah ada → PAKAI cid yang sama (tidak generate baru).', sound: 'route' })

  logs.push({ level: 'INFO', service: 'item-service', ts: '10:30:45.124Z', method: 'GET', path: '/verify', msg: 'calling auth-service /verify' })
  push({ packet: { from: 'item', to: 'auth', tag: 'GET /verify · cid', tone: 'request' }, activeNodes: ['item', 'auth'], logs: [...logs], cidAction: 'reuse', line: 9, status: 'Item Service meneruskan cid yang sama ke header request Auth.', sound: 'send' })

  logs.push({ level: 'INFO', service: 'auth-service', ts: '10:30:45.130Z', method: 'GET', path: '/verify', status: 200, ms: 6, msg: 'token verified' })
  push({ packet: { from: 'auth', to: 'item', tag: '200 {user_id}', tone: 'pass' }, activeNodes: ['auth', 'item'], logs: [...logs], cidAction: 'reuse', line: 9, status: 'Auth Service menulis log dengan correlation_id YANG SAMA → bisa dihubungkan.', sound: 'pass' })

  logs.push({ level: 'INFO', service: 'item-service', ts: '10:30:45.166Z', method: 'POST', path: '/items', status: 201, ms: 45, msg: 'request completed' })
  push({ activeNodes: ['item'], logs: [...logs], lastMs: 45, line: 7, status: 'Item Service selesai → 201 (45ms). Lihat JSON-nya: satu record terstruktur ber-cid.', sound: 'pass' })

  push({ activeNodes: [], logs: [...logs], lastMs: 45, line: 12, status: `grep ${CID} → seluruh perjalanan request tampil berurutan di semua service.`, sound: 'done' })
  return steps
}

function buildError(): ObsStep[] {
  const logs: LogRow[] = []
  const steps: ObsStep[] = []
  const push = (p: Partial<ObsStep>) =>
    steps.push({ packet: null, activeNodes: [], logs: [...logs], lastMs: null, cidAction: null, line: 0, status: '', sound: null, ...p })

  push({ activeNodes: ['fe'], line: 0, status: `Request yang sama, tapi Auth Service sedang down. Correlation ID: ${CID}.` })

  logs.push({ level: 'INFO', service: 'gateway', ts: '10:31:02.044Z', method: 'POST', path: '/items', msg: 'routed to item-service' })
  push({ packet: { from: 'fe', to: 'gw', tag: 'POST /items', tone: 'request' }, activeNodes: ['fe', 'gw'], logs: [...logs], cidAction: 'generate', line: 3, status: `Header belum ada → Gateway GENERATE cid ${CID}.`, sound: 'send' })

  logs.push({ level: 'INFO', service: 'item-service', ts: '10:31:02.047Z', method: 'GET', path: '/verify', msg: 'calling auth-service /verify' })
  push({ packet: { from: 'gw', to: 'item', tag: `cid ${CID}`, tone: 'request' }, activeNodes: ['gw', 'item'], logs: [...logs], cidAction: 'reuse', line: 4, status: 'Item Service pakai cid yang sama, lalu coba verify token ke Auth.', sound: 'route' })

  logs.push({ level: 'WARN', service: 'item-service', ts: '10:31:02.048Z', method: 'GET', path: '/verify', msg: 'auth attempt 1/3 failed: timeout' })
  push({ packet: { from: 'item', to: 'auth', tag: 'verify… timeout', tone: 'fail' }, activeNodes: ['item', 'auth'], logs: [...logs], cidAction: 'reuse', line: 9, status: 'Gagal connect → log level WARNING, retry. correlation_id tetap sama.', sound: 'warn' })

  logs.push({ level: 'ERROR', service: 'item-service', ts: '10:31:07.050Z', method: 'GET', path: '/verify', msg: 'Auth Service unreachable after 3 attempts' })
  push({ packet: { from: 'auth', to: 'item', tag: '503', tone: 'fail' }, activeNodes: ['item'], logs: [...logs], cidAction: 'reuse', line: 9, status: 'Semua retry gagal → log ERROR. Circuit breaker mencatat kegagalan.', sound: 'fail' })

  logs.push({ level: 'ERROR', service: 'item-service', ts: '10:31:07.052Z', method: 'POST', path: '/items', status: 503, ms: 5002, msg: 'request failed' })
  push({ activeNodes: ['item'], logs: [...logs], lastMs: 5002, line: 7, status: 'User dapat 503 (5002ms). Lihat JSON ERROR-nya — cid menghubungkan semua.', sound: 'fail' })

  push({ activeNodes: [], logs: [...logs], lastMs: 5002, line: 12, status: `Debug: grep ${CID} → langsung terlihat rantai WARN → ERROR. Itulah observability.`, sound: 'done' })
  return steps
}

// ── Metrics mode: Four Golden Signals fill up as requests arrive ────────────

interface RawReq {
  method: string
  path: string
  status: number
  ms: number
}

/** Precomputed traffic: mostly fast 2xx, one 5xx, one slow outlier (timeout). */
const TRAFFIC: RawReq[] = [
  { method: 'GET', path: '/items', status: 200, ms: 32 },
  { method: 'POST', path: '/items', status: 201, ms: 78 },
  { method: 'GET', path: '/items', status: 200, ms: 41 },
  { method: 'GET', path: '/items/5', status: 200, ms: 28 },
  { method: 'GET', path: '/items', status: 200, ms: 55 },
  { method: 'POST', path: '/items', status: 201, ms: 64 },
  { method: 'GET', path: '/items', status: 200, ms: 38 },
  { method: 'PUT', path: '/items/3', status: 200, ms: 47 },
  { method: 'GET', path: '/items', status: 500, ms: 120 },
  { method: 'GET', path: '/items', status: 200, ms: 35 },
  { method: 'GET', path: '/verify', status: 503, ms: 1100 },
  { method: 'GET', path: '/items', status: 200, ms: 44 },
]

const pct = (sorted: number[], q: number) =>
  sorted.length ? sorted[Math.min(Math.floor(sorted.length * q), sorted.length - 1)] : 0

function buildMetrics(): ObsStep[] {
  const steps: ObsStep[] = []
  const lat: number[] = []
  let total = 0
  let errors = 0

  const snapshot = (): Signals => {
    const s = [...lat].sort((a, b) => a - b)
    const elapsed = Math.max(total * 0.43, 0.4)
    return {
      total,
      reqPerSec: Math.round((total / elapsed) * 10) / 10,
      errors,
      errorRate: total ? Math.round((errors / total) * 1000) / 10 : 0,
      p50: pct(s, 0.5),
      p95: pct(s, 0.95),
      p99: pct(s, 0.99),
      avg: s.length ? Math.round(s.reduce((a, b) => a + b, 0) / s.length) : 0,
      cpu: Math.min(92, Math.round(18 + total * 4 + errors * 6)),
      mem: Math.min(85, Math.round(30 + total * 2)),
      spark: lat.slice(-12),
    }
  }

  steps.push({
    packet: null,
    activeNodes: ['item'],
    logs: [],
    lastMs: null,
    signals: snapshot(),
    req: null,
    line: 1,
    status: 'Endpoint /metrics mengumpulkan Four Golden Signals dari setiap request.',
    sound: null,
  })

  TRAFFIC.forEach((r) => {
    total += 1
    lat.push(r.ms)
    const isErr = r.status >= 500
    if (r.status >= 400) errors += 1
    const spike = r.ms >= 500
    const sig = snapshot()
    steps.push({
      packet: { from: 'gw', to: 'item', tag: `${r.status}`, tone: isErr ? 'fail' : 'pass' },
      activeNodes: ['gw', 'item'],
      logs: [],
      lastMs: r.ms,
      signals: sig,
      req: r,
      line: isErr ? 6 : spike ? 9 : 5,
      status: spike
        ? `${r.method} ${r.path} → ${r.status} (${r.ms}ms) — OUTLIER! lihat p95 & p99 melonjak.`
        : `${r.method} ${r.path} → ${r.status} (${r.ms}ms) · total ${total} req · error ${errors}`,
      sound: isErr ? 'fail' : spike ? 'warn' : 'pass',
    })
  })

  steps.push({
    packet: null,
    activeNodes: ['item'],
    logs: [],
    lastMs: null,
    signals: snapshot(),
    req: null,
    line: 9,
    status: 'Satu request 1100ms menaikkan p95/p99 ke alert — itulah kenapa pakai percentile, bukan rata-rata.',
    sound: 'done',
  })

  return steps
}

export function buildSteps(mode: Mode): ObsStep[] {
  if (mode === 'success') return buildSuccess()
  if (mode === 'error') return buildError()
  return buildMetrics()
}
