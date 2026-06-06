/**
 * Precomputed "microservices request flow" — one Step = a full snapshot of a
 * request travelling through the architecture (Frontend → API Gateway → a
 * service → its DB, and back). The animation just replays these frames.
 *
 * Two scenarios mirror Modul 12's sequence diagram (§3.2):
 *   - 'login'  : FE → Gateway → Auth Service → auth_db → token kembali.
 *   - 'create' : FE → Gateway → Item Service, lalu Item Service memanggil
 *                Auth Service (GET /verify) via HTTP — inter-service comms —
 *                baru menulis ke item_db. (Item Service TIDAK menyentuh auth_db.)
 */

export type Mode = 'login' | 'create'

export type Cue = 'send' | 'route' | 'db' | 'verify' | 'back' | 'done' | null

export type NodeId = 'fe' | 'gw' | 'auth' | 'authdb' | 'item' | 'itemdb'

/** Packet tone → colour family in the view. */
export type Tone = 'request' | 'response' | 'db' | 'verify'

export interface NodeSpec {
  id: NodeId
  cx: number
  cy: number
  w: number
  h: number
  label: string
  sub: string
}

/** Fixed positions on the ~820×520 architecture board (design px). */
export const NODES: Record<NodeId, NodeSpec> = {
  fe: { id: 'fe', cx: 410, cy: 50, w: 230, h: 66, label: 'Frontend', sub: 'React' },
  gw: { id: 'gw', cx: 410, cy: 175, w: 220, h: 60, label: 'API Gateway', sub: 'Nginx :80' },
  auth: { id: 'auth', cx: 200, cy: 315, w: 236, h: 72, label: 'Auth Service', sub: ':8001' },
  authdb: { id: 'authdb', cx: 200, cy: 455, w: 188, h: 58, label: 'auth_db', sub: 'users' },
  item: { id: 'item', cx: 620, cy: 315, w: 236, h: 72, label: 'Item Service', sub: ':8002' },
  itemdb: { id: 'itemdb', cx: 620, cy: 455, w: 188, h: 58, label: 'item_db', sub: 'items' },
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

/** Drawn edges (endpoints sit at the box borders so lines stay clean). */
export const EDGES: EdgeSpec[] = [
  { a: 'fe', b: 'gw', ax: 410, ay: 83, bx: 410, by: 145 },
  { a: 'gw', b: 'auth', ax: 372, ay: 203, bx: 258, by: 281 },
  { a: 'gw', b: 'item', ax: 448, ay: 203, bx: 562, by: 281 },
  { a: 'auth', b: 'authdb', ax: 200, ay: 351, bx: 200, by: 426 },
  { a: 'item', b: 'itemdb', ax: 620, ay: 351, bx: 620, by: 426 },
  { a: 'item', b: 'auth', ax: 502, ay: 315, bx: 318, by: 315, dashed: true },
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
    desc: 'Request flow: Frontend → Gateway → Auth Service → auth_db',
    filename: 'auth-service/main.py',
    code: [
      '@app.post("/login")',
      'def login(data, db):',
      '    user = db.query(User) \\',
      '        .filter(email == data.email).first()',
      '    if not verify(data.password, user):',
      '        raise HTTPException(401)',
      '    token = create_access_token({...})',
      '    return {"access_token": token}',
    ],
  },
  create: {
    label: 'Create Item',
    desc: 'Item Service memanggil Auth Service (HTTP) untuk verify token',
    filename: 'item-service/main.py',
    code: [
      '@app.post("/items")',
      'async def create_item(data,',
      '    user = Depends(verify_with_auth),  # HTTP →',
      '    db = Depends(get_db)):',
      '    item = Item(**data,',
      '        owner_id=user["user_id"])',
      '    db.add(item); db.commit()',
      '    return item',
      '',
      '# auth_client.py — inter-service call',
      'async def verify_with_auth(authorization):',
      '    r = await client.get(',
      '        f"{AUTH_URL}/verify",',
      '        headers={"Authorization": authorization})',
      '    return r.json()   # {user_id, email}',
    ],
  },
}

function buildLogin(): FlowStep[] {
  const steps: FlowStep[] = []
  steps.push({ packet: null, activeNodes: ['fe'], hasToken: false, line: 0, status: 'User menekan tombol Login di browser.', sound: null })
  steps.push({ packet: { from: 'fe', to: 'gw', tag: 'POST /auth/login', tone: 'request' }, activeNodes: ['fe', 'gw'], hasToken: false, line: 0, status: 'Frontend mengirim request ke Gateway (satu URL saja).', sound: 'send' })
  steps.push({ packet: { from: 'gw', to: 'auth', tag: 'route → :8001', tone: 'request' }, activeNodes: ['gw', 'auth'], hasToken: false, line: 0, status: 'Gateway merutekan /auth/* ke Auth Service.', sound: 'route' })
  steps.push({ packet: { from: 'auth', to: 'authdb', tag: 'SELECT user', tone: 'db' }, activeNodes: ['auth', 'authdb'], hasToken: false, line: 2, status: 'Auth Service query ke database miliknya sendiri (auth_db).', sound: 'db' })
  steps.push({ packet: { from: 'authdb', to: 'auth', tag: 'user row', tone: 'response' }, activeNodes: ['auth', 'authdb'], hasToken: false, line: 4, status: 'auth_db kembalikan user → cek password (bcrypt).', sound: 'back' })
  steps.push({ packet: { from: 'auth', to: 'gw', tag: '{access_token}', tone: 'response' }, activeNodes: ['auth', 'gw'], hasToken: true, line: 6, status: 'Password cocok → buat JWT access_token.', sound: 'back' })
  steps.push({ packet: { from: 'gw', to: 'fe', tag: 'token', tone: 'response' }, activeNodes: ['gw', 'fe'], hasToken: true, line: 7, status: 'Token diteruskan Gateway kembali ke Frontend.', sound: 'back' })
  steps.push({ packet: null, activeNodes: ['fe'], hasToken: true, line: 7, status: 'Login sukses — Frontend menyimpan token untuk request berikutnya.', sound: 'done' })
  return steps
}

function buildCreate(): FlowStep[] {
  const steps: FlowStep[] = []
  steps.push({ packet: null, activeNodes: ['fe'], hasToken: true, line: 0, status: 'User membuat item baru — request membawa Bearer token.', sound: null })
  steps.push({ packet: { from: 'fe', to: 'gw', tag: 'POST /items + JWT', tone: 'request' }, activeNodes: ['fe', 'gw'], hasToken: true, line: 0, status: 'Frontend kirim POST /items (Authorization: Bearer …).', sound: 'send' })
  steps.push({ packet: { from: 'gw', to: 'item', tag: 'route → :8002', tone: 'request' }, activeNodes: ['gw', 'item'], hasToken: true, line: 1, status: 'Gateway merutekan /items ke Item Service.', sound: 'route' })
  steps.push({ packet: { from: 'item', to: 'auth', tag: 'GET /verify', tone: 'verify' }, activeNodes: ['item', 'auth'], hasToken: true, line: 11, status: 'KUNCI: Item Service panggil Auth Service via HTTP untuk verify token.', sound: 'verify' })
  steps.push({ packet: { from: 'auth', to: 'item', tag: '{user_id, email}', tone: 'response' }, activeNodes: ['auth', 'item'], hasToken: true, line: 14, status: 'Auth Service decode token → balas {user_id}. (auth_db tidak disentuh)', sound: 'back' })
  steps.push({ packet: { from: 'item', to: 'itemdb', tag: 'INSERT item', tone: 'db' }, activeNodes: ['item', 'itemdb'], hasToken: true, line: 4, status: 'Token valid → Item Service simpan item ke item_db (owner_id).', sound: 'db' })
  steps.push({ packet: { from: 'itemdb', to: 'item', tag: 'ok', tone: 'response' }, activeNodes: ['item', 'itemdb'], hasToken: true, line: 6, status: 'item_db konfirmasi item tersimpan.', sound: 'back' })
  steps.push({ packet: { from: 'item', to: 'gw', tag: '{item}', tone: 'response' }, activeNodes: ['item', 'gw'], hasToken: true, line: 7, status: 'Item Service balas data item ke Gateway.', sound: 'back' })
  steps.push({ packet: { from: 'gw', to: 'fe', tag: '{item}', tone: 'response' }, activeNodes: ['gw', 'fe'], hasToken: true, line: 7, status: 'Gateway teruskan response ke Frontend.', sound: 'back' })
  steps.push({ packet: null, activeNodes: ['fe'], hasToken: true, line: 7, status: 'Selesai — 2 service bekerja sama lewat HTTP, tiap service punya DB sendiri.', sound: 'done' })
  return steps
}

export function buildSteps(mode: Mode): FlowStep[] {
  return mode === 'login' ? buildLogin() : buildCreate()
}
