/**
 * Precomputed "monolith request flow" — the COUNTERPART to the Microservices
 * material, on purpose. Same two scenarios (Login, Create Item), but here the
 * whole backend is ONE process (Auth + Items modules) talking to ONE shared
 * database. Token verification is an in-process function call — NOT an HTTP
 * call to another service.
 *
 * Watch the two side-by-side to see the difference:
 *   - Monolith     : 1 deploy, 1 DB (shared), verify = panggil fungsi lokal.
 *   - Microservices: banyak service, DB per-service, verify = HTTP antar service.
 */

export type Mode = 'login' | 'create'

export type Cue = 'send' | 'route' | 'db' | 'internal' | 'back' | 'done' | null

export type NodeId = 'fe' | 'app' | 'auth' | 'items' | 'db'

/** Packet tone → colour family in the view. */
export type Tone = 'request' | 'response' | 'db' | 'internal'

export interface NodeSpec {
  id: NodeId
  cx: number
  cy: number
  w: number
  h: number
  label: string
  sub: string
}

/** Fixed positions on the ~820×520 board (design px). */
export const NODES: Record<NodeId, NodeSpec> = {
  fe: { id: 'fe', cx: 410, cy: 50, w: 230, h: 64, label: 'Frontend', sub: 'React' },
  app: { id: 'app', cx: 410, cy: 178, w: 250, h: 58, label: 'FastAPI app', sub: ':8000' },
  auth: { id: 'auth', cx: 270, cy: 300, w: 204, h: 64, label: 'Auth Module', sub: 'auth.py' },
  items: { id: 'items', cx: 560, cy: 300, w: 204, h: 64, label: 'Items Module', sub: 'crud.py' },
  db: { id: 'db', cx: 410, cy: 462, w: 320, h: 62, label: 'PostgreSQL', sub: '1 database · semua tabel' },
}

/** The single deployable that encloses app + both modules. */
export const BACKEND_BOX = { left: 150, top: 132, width: 520, height: 238 }

export interface EdgeSpec {
  a: NodeId
  b: NodeId
  ax: number
  ay: number
  bx: number
  by: number
  /** In-process call (solid, internal) vs normal — we never dash here:
   *  EVERYTHING in a monolith is in-process. */
}

/** Drawn edges (endpoints sit at the box borders so lines stay clean). */
export const EDGES: EdgeSpec[] = [
  { a: 'fe', b: 'app', ax: 410, ay: 82, bx: 410, by: 149 },
  { a: 'app', b: 'auth', ax: 360, ay: 204, bx: 300, by: 270 },
  { a: 'app', b: 'items', ax: 460, ay: 204, bx: 520, by: 270 },
  { a: 'items', b: 'auth', ax: 458, ay: 300, bx: 372, by: 300 },
  { a: 'auth', b: 'db', ax: 290, ay: 332, bx: 360, by: 433 },
  { a: 'items', b: 'db', ax: 540, ay: 332, bx: 460, by: 433 },
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

export interface FlowStep {
  packet: Packet | null
  activeNodes: NodeId[]
  hasToken: boolean
  line: number
  status: string
  sound: Cue
}

export const MODES: Record<Mode, { label: string; desc: string; filename: string; code: string[] }> = {
  login: {
    label: 'Login',
    desc: 'Satu backend menangani semuanya → satu database shared',
    filename: 'backend/main.py',
    code: [
      '# backend/main.py  (monolith — 1 app)',
      '@app.post("/auth/login")',
      'def login(data, db):',
      '    user = db.query(User) \\',
      '        .filter(email == data.email).first()',
      '    if not verify(data.password, user):',
      '        raise HTTPException(401)',
      '    return {"access_token": make_token(user)}',
    ],
  },
  create: {
    label: 'Create Item',
    desc: 'Verify token = panggil fungsi lokal (in-process), bukan HTTP',
    filename: 'backend/main.py',
    code: [
      '# backend/main.py  (monolith — 1 app)',
      '@app.post("/items")',
      'def create_item(data,',
      '    user = Depends(get_current_user),  # fungsi lokal',
      '    db = Depends(get_db)):',
      '    item = Item(**data, owner_id=user.id)',
      '    db.add(item); db.commit()',
      '    return item',
      '',
      '# auth.py — modul yang sama, satu proses',
      'def get_current_user(token, db):',
      '    payload = decode_jwt(token)     # bukan HTTP!',
      '    return db.query(User).get(payload["sub"])',
    ],
  },
}

function buildLogin(): FlowStep[] {
  const steps: FlowStep[] = []
  steps.push({ packet: null, activeNodes: ['fe'], hasToken: false, line: 0, status: 'User menekan tombol Login di browser.', sound: null })
  steps.push({ packet: { from: 'fe', to: 'app', tag: 'POST /auth/login', tone: 'request' }, activeNodes: ['fe', 'app'], hasToken: false, line: 1, status: 'Frontend memanggil satu backend langsung (tanpa gateway).', sound: 'send' })
  steps.push({ packet: { from: 'app', to: 'auth', tag: 'auth module', tone: 'internal' }, activeNodes: ['app', 'auth'], hasToken: false, line: 1, status: 'Router internal mengarahkan ke Auth Module (masih satu proses).', sound: 'route' })
  steps.push({ packet: { from: 'auth', to: 'db', tag: 'SELECT user', tone: 'db' }, activeNodes: ['auth', 'db'], hasToken: false, line: 3, status: 'Auth Module query ke database bersama (shared).', sound: 'db' })
  steps.push({ packet: { from: 'db', to: 'auth', tag: 'user row', tone: 'response' }, activeNodes: ['auth', 'db'], hasToken: false, line: 4, status: 'DB kembalikan user → cek password (bcrypt).', sound: 'back' })
  steps.push({ packet: { from: 'auth', to: 'app', tag: '{access_token}', tone: 'response' }, activeNodes: ['auth', 'app'], hasToken: true, line: 7, status: 'Password cocok → buat JWT access_token.', sound: 'back' })
  steps.push({ packet: { from: 'app', to: 'fe', tag: 'token', tone: 'response' }, activeNodes: ['app', 'fe'], hasToken: true, line: 7, status: 'Backend balas token ke Frontend.', sound: 'back' })
  steps.push({ packet: null, activeNodes: ['fe'], hasToken: true, line: 7, status: 'Login sukses — semua terjadi di satu app & satu database.', sound: 'done' })
  return steps
}

function buildCreate(): FlowStep[] {
  const steps: FlowStep[] = []
  steps.push({ packet: null, activeNodes: ['fe'], hasToken: true, line: 0, status: 'User membuat item baru — request membawa Bearer token.', sound: null })
  steps.push({ packet: { from: 'fe', to: 'app', tag: 'POST /items + JWT', tone: 'request' }, activeNodes: ['fe', 'app'], hasToken: true, line: 1, status: 'Frontend kirim POST /items ke backend yang sama.', sound: 'send' })
  steps.push({ packet: { from: 'app', to: 'items', tag: 'items module', tone: 'internal' }, activeNodes: ['app', 'items'], hasToken: true, line: 1, status: 'Diteruskan ke Items Module (in-process).', sound: 'route' })
  steps.push({ packet: { from: 'items', to: 'auth', tag: 'get_current_user()', tone: 'internal' }, activeNodes: ['items', 'auth'], hasToken: true, line: 10, status: 'KONTRAS: verify token = panggil fungsi lokal, BUKAN HTTP antar service.', sound: 'internal' })
  steps.push({ packet: { from: 'auth', to: 'items', tag: '{user}', tone: 'response' }, activeNodes: ['auth', 'items'], hasToken: true, line: 11, status: 'decode_jwt() langsung di memori → kembalikan user.', sound: 'back' })
  steps.push({ packet: { from: 'items', to: 'db', tag: 'INSERT item', tone: 'db' }, activeNodes: ['items', 'db'], hasToken: true, line: 5, status: 'Items simpan ke database yang SAMA dengan Auth (shared).', sound: 'db' })
  steps.push({ packet: { from: 'db', to: 'items', tag: 'ok', tone: 'response' }, activeNodes: ['items', 'db'], hasToken: true, line: 6, status: 'DB konfirmasi item tersimpan.', sound: 'back' })
  steps.push({ packet: { from: 'items', to: 'app', tag: '{item}', tone: 'response' }, activeNodes: ['items', 'app'], hasToken: true, line: 7, status: 'Items Module balas data item.', sound: 'back' })
  steps.push({ packet: { from: 'app', to: 'fe', tag: '{item}', tone: 'response' }, activeNodes: ['app', 'fe'], hasToken: true, line: 7, status: 'Backend balas response ke Frontend.', sound: 'back' })
  steps.push({ packet: null, activeNodes: ['fe'], hasToken: true, line: 7, status: 'Selesai — simpel: 1 deploy, 1 DB. Tapi 1 bug bisa menjatuhkan semuanya.', sound: 'done' })
  return steps
}

export function buildSteps(mode: Mode): FlowStep[] {
  return mode === 'login' ? buildLogin() : buildCreate()
}
