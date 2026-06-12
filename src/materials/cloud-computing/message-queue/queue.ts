/**
 * Precomputed "message queue" flow — one Step = a full snapshot of an order
 * travelling through Frontend → Order Service → (Queue) → Payment Service.
 * The animation just replays these frames.
 *
 * Three scenarios bercerita berurutan (masalah → solusi → superpower):
 *   - 'sync'  : tanpa queue — Order memanggil Payment via HTTP & menunggu
 *               (blocking). Saat Payment mati, checkout user ikut gagal.
 *   - 'async' : dengan queue — Order publish pesan lalu LANGSUNG balas ke
 *               user; Payment consume dengan ritmenya sendiri (decoupled).
 *   - 'down'  : consumer mati — pesan menumpuk AMAN di queue (buffering),
 *               lalu diproses satu per satu saat Payment pulih.
 */

export type Mode = 'sync' | 'async' | 'down'

export type Cue =
  | 'send'
  | 'publish'
  | 'consume'
  | 'back'
  | 'process'
  | 'fail'
  | 'recover'
  | 'done'
  | null

export type NodeId = 'fe' | 'order' | 'queue' | 'pay'

/** Packet tone → colour family in the view. */
export type Tone = 'request' | 'response' | 'publish' | 'consume' | 'fail'

export type PayState = 'up' | 'busy' | 'down'

export interface Msg {
  id: string
  label: string
}

export interface Packet {
  from: NodeId
  to: NodeId
  tag: string
  tone: Tone
}

export interface QueueStep {
  packet: Packet | null
  activeNodes: NodeId[]
  /** Pesan yang sedang mengantre (index 0 = head / paling depan). */
  queued: Msg[]
  /** Order yang sudah selesai diproses Payment. */
  processed: string[]
  payState: PayState
  /** Mode sync: Order sedang diblokir menunggu jawaban Payment. */
  waiting: boolean
  /** Mode sync: user menerima error checkout. */
  failed: boolean
  line: number
  status: string
  story: string
  sound: Cue
}

export interface NodeSpec {
  id: NodeId
  cx: number
  cy: number
  w: number
  h: number
  label: string
  sub: string
}

/** Fixed positions on the 860×540 board (design px). Queue digambar khusus. */
export const NODES: Record<Exclude<NodeId, 'queue'>, NodeSpec> = {
  fe: { id: 'fe', cx: 430, cy: 48, w: 250, h: 66, label: 'User / Frontend', sub: 'browser' },
  order: { id: 'order', cx: 430, cy: 175, w: 260, h: 72, label: 'Order Service', sub: 'producer · :8001' },
  pay: { id: 'pay', cx: 430, cy: 465, w: 330, h: 72, label: 'Payment Service', sub: 'consumer · :8002' },
}

/** Kotak broker/queue (digambar sebagai panel berisi slot pesan). */
export const QUEUE_BOX = { cx: 430, cy: 320, w: 650, h: 110 }

export interface EdgeSpec {
  a: NodeId
  b: NodeId
  ax: number
  ay: number
  bx: number
  by: number
}

const FE_ORDER: EdgeSpec = { a: 'fe', b: 'order', ax: 430, ay: 81, bx: 430, by: 139 }

/** Mode sync: tidak ada queue — Order langsung ke Payment. */
export const EDGES_SYNC: EdgeSpec[] = [
  FE_ORDER,
  { a: 'order', b: 'pay', ax: 430, ay: 211, bx: 430, by: 429 },
]

/** Mode async/down: Order → Queue → Payment. */
export const EDGES_QUEUE: EdgeSpec[] = [
  FE_ORDER,
  { a: 'order', b: 'queue', ax: 430, ay: 211, bx: 430, by: 265 },
  { a: 'queue', b: 'pay', ax: 430, ay: 375, bx: 430, by: 429 },
]

export function edgesFor(showQueue: boolean): EdgeSpec[] {
  return showQueue ? EDGES_QUEUE : EDGES_SYNC
}

export function edgeBetween(edges: EdgeSpec[], x: NodeId, y: NodeId): EdgeSpec | undefined {
  return edges.find((e) => (e.a === x && e.b === y) || (e.a === y && e.b === x))
}

const SYNC_CODE = [
  '@app.post("/checkout")',
  'def checkout(order):',
  '    db.save(order)',
  '    # panggil Payment & TUNGGU jawabannya',
  '    r = requests.post(',
  '        f"{PAY_URL}/charge",',
  '        json=order, timeout=10)  # blocking!',
  '    if r.status_code != 200:',
  '        raise HTTPException(502)  # ikut gagal',
  '    return {"status": "paid"}',
]

const ASYNC_CODE = [
  '# producer — order-service',
  '@app.post("/checkout")',
  'def checkout(order):',
  '    db.save(order)',
  '    channel.basic_publish(',
  '        queue="orders", body=json(order))',
  '    return {"status": "diproses"}  # instan!',
  '',
  '# consumer — payment-worker',
  'def on_message(ch, method, body):',
  '    process_payment(json.loads(body))',
  '    ch.basic_ack(method.delivery_tag)',
  'channel.basic_consume("orders", on_message)',
]

export const MODES: Record<
  Mode,
  { label: string; desc: string; filename: string; code: string[]; showQueue: boolean }
> = {
  sync: {
    label: 'Sync (HTTP)',
    desc: 'Tanpa queue — pemanggil ikut menunggu & ikut gagal (tight coupling)',
    filename: 'order-service/main.py',
    code: SYNC_CODE,
    showQueue: false,
  },
  async: {
    label: 'Async (Queue)',
    desc: 'Dengan queue — publish lalu lanjut; consumer mengambil saat siap',
    filename: 'producer_consumer.py',
    code: ASYNC_CODE,
    showQueue: true,
  },
  down: {
    label: 'Consumer Mati',
    desc: 'Payment mati — pesan menumpuk aman di queue, diproses saat pulih',
    filename: 'producer_consumer.py',
    code: ASYNC_CODE,
    showQueue: true,
  },
}

const M1: Msg = { id: 'm1', label: '#1' }
const M2: Msg = { id: 'm2', label: '#2' }
const M3: Msg = { id: 'm3', label: '#3' }

type Required = Pick<QueueStep, 'line' | 'status' | 'story'>

function b(p: Partial<QueueStep> & Required): QueueStep {
  return {
    packet: null,
    activeNodes: [],
    queued: [],
    processed: [],
    payState: 'up',
    waiting: false,
    failed: false,
    sound: null,
    ...p,
  }
}

function buildSync(): QueueStep[] {
  return [
    b({ activeNodes: ['fe'], line: 0, status: 'Synchronous: Order memanggil Payment via HTTP dan menunggu jawabannya.', story: 'Bayangkan warung makan: kasir HARUS menunggu koki selesai masak sebelum bisa melayani pembeli berikutnya.' }),
    b({ packet: { from: 'fe', to: 'order', tag: 'POST /checkout #1', tone: 'request' }, activeNodes: ['fe', 'order'], line: 1, status: 'User #1 checkout → request masuk ke Order Service.', story: 'Pembeli #1 datang memesan ke kasir.', sound: 'send' }),
    b({ packet: { from: 'order', to: 'pay', tag: 'POST /charge', tone: 'request' }, activeNodes: ['order', 'pay'], payState: 'busy', waiting: true, line: 4, status: 'Order panggil Payment lalu MENUNGGU — request user ikut menggantung.', story: 'Kasir meneriakkan pesanan ke koki, lalu berdiri diam menunggu di tempat.', sound: 'send' }),
    b({ activeNodes: ['pay'], payState: 'busy', waiting: true, line: 6, status: 'Payment memproses (±3 detik)… selama itu Order diblokir (blocking).', story: 'Koki memasak… kasir menunggu, antrean pembeli di belakang ikut tertahan.', sound: 'process' }),
    b({ packet: { from: 'pay', to: 'order', tag: '200 OK', tone: 'response' }, activeNodes: ['pay', 'order'], processed: ['#1'], line: 7, status: 'Payment selesai → Order baru bisa melanjutkan.', story: 'Masakan jadi! Koki menyerahkannya ke kasir.', sound: 'back' }),
    b({ packet: { from: 'order', to: 'fe', tag: 'paid ✓', tone: 'response' }, activeNodes: ['order', 'fe'], processed: ['#1'], line: 9, status: 'User akhirnya dapat jawaban — setelah ikut menunggu seluruh proses.', story: 'Pembeli #1 terlayani… tapi ia menunggu lama berdiri di depan kasir.', sound: 'back' }),
    b({ payState: 'down', processed: ['#1'], line: 3, status: 'Tiba-tiba Payment Service MATI. Lalu pesanan #2 masuk…', story: 'Gawat — koki pulang mendadak! Dan pembeli #2 baru saja datang…', sound: 'fail' }),
    b({ packet: { from: 'fe', to: 'order', tag: 'POST /checkout #2', tone: 'request' }, activeNodes: ['fe', 'order'], payState: 'down', processed: ['#1'], line: 1, status: 'User #2 checkout → Order Service menerima request.', story: 'Pembeli #2 memesan ke kasir seperti biasa.', sound: 'send' }),
    b({ packet: { from: 'order', to: 'pay', tag: 'POST /charge', tone: 'request' }, activeNodes: ['order', 'pay'], payState: 'down', waiting: true, processed: ['#1'], line: 4, status: 'Order memanggil Payment… tidak ada jawaban…', story: 'Kasir berteriak ke dapur… hening. Tidak ada yang menjawab.', sound: 'send' }),
    b({ packet: { from: 'pay', to: 'order', tag: 'timeout ✕', tone: 'fail' }, activeNodes: ['pay', 'order'], payState: 'down', processed: ['#1'], line: 7, status: 'Timeout 10 detik → panggilan GAGAL.', story: 'Tidak ada koki = tidak ada masakan. Kasir menyerah menunggu.', sound: 'fail' }),
    b({ packet: { from: 'order', to: 'fe', tag: '502 error', tone: 'fail' }, activeNodes: ['order', 'fe'], payState: 'down', failed: true, processed: ['#1'], line: 8, status: 'Order ikut gagal → user menerima error. Checkout GAGAL.', story: 'Kasir terpaksa menolak: "Maaf, tidak bisa pesan." Pembeli pergi kecewa.', sound: 'fail' }),
    b({ activeNodes: ['fe'], payState: 'down', failed: true, processed: ['#1'], line: 8, status: 'Tight coupling: satu service mati → semua yang memanggilnya ikut gagal.', story: 'Satu koki absen, seluruh warung berhenti melayani. Pasti ada cara yang lebih baik…', sound: 'done' }),
  ]
}

function buildAsync(): QueueStep[] {
  return [
    b({ activeNodes: ['fe'], line: 0, status: 'Asynchronous: Order menaruh pesan di queue; Payment mengambil saat siap.', story: 'Warung kini punya REL STRUK: kasir tinggal menempel pesanan di rel, koki mengambil satu per satu.' }),
    b({ packet: { from: 'fe', to: 'order', tag: 'POST /checkout #1', tone: 'request' }, activeNodes: ['fe', 'order'], line: 2, status: 'User #1 checkout → masuk ke Order Service.', story: 'Pembeli #1 datang memesan ke kasir.', sound: 'send' }),
    b({ packet: { from: 'order', to: 'queue', tag: 'publish #1', tone: 'publish' }, activeNodes: ['order', 'queue'], queued: [M1], line: 4, status: 'Order publish pesan "order #1" ke queue — tidak menunggu siapa pun.', story: 'Kasir menempel struk #1 di rel dapur. Urusannya selesai!', sound: 'publish' }),
    b({ packet: { from: 'order', to: 'fe', tag: '201 diproses ✓', tone: 'response' }, activeNodes: ['order', 'fe'], queued: [M1], line: 6, status: 'Order LANGSUNG balas ke user (±50ms) — tanpa menunggu Payment.', story: 'Kasir langsung bilang: "Siap! Pesananmu sedang diproses." Pembeli senang.', sound: 'back' }),
    b({ packet: { from: 'queue', to: 'pay', tag: 'consume #1', tone: 'consume' }, activeNodes: ['queue', 'pay'], payState: 'busy', line: 9, status: 'Payment mengambil (consume) pesan #1 dari queue.', story: 'Koki mengambil struk #1 dari rel dan mulai memasak.', sound: 'consume' }),
    b({ activeNodes: ['pay'], processed: ['#1'], line: 11, status: 'Payment selesai memproses → kirim ack. Pesan #1 tuntas.', story: 'Masakan #1 jadi — struknya dicoret dari rel.', sound: 'process' }),
    b({ packet: { from: 'fe', to: 'order', tag: 'POST /checkout #2', tone: 'request' }, activeNodes: ['fe', 'order'], processed: ['#1'], line: 2, status: 'Pesanan #2 masuk…', story: 'Pembeli #2 datang.', sound: 'send' }),
    b({ packet: { from: 'order', to: 'queue', tag: 'publish #2', tone: 'publish' }, activeNodes: ['order', 'queue'], queued: [M2], processed: ['#1'], line: 4, status: 'Publish #2 → user #2 juga langsung dapat konfirmasi.', story: 'Struk #2 ditempel; kasir langsung siap melayani pembeli berikutnya.', sound: 'publish' }),
    b({ packet: { from: 'queue', to: 'pay', tag: 'consume #2', tone: 'consume' }, activeNodes: ['queue', 'pay'], payState: 'busy', processed: ['#1'], line: 9, status: 'Payment mengambil #2 dengan ritme kerjanya sendiri.', story: 'Koki memasak #2 dengan temponya sendiri — tidak ada yang saling menunggu.', sound: 'consume' }),
    b({ activeNodes: ['pay'], processed: ['#1', '#2'], line: 11, status: 'Selesai. Producer & consumer DECOUPLED — terpisah penuh.', story: 'Kasir cepat melayani, koki tenang memasak. Antrean pembeli tetap lancar.', sound: 'done' }),
  ]
}

function buildDown(): QueueStep[] {
  return [
    b({ payState: 'down', line: 8, status: 'Skenario kunci: Payment Service MATI. Apa nasib pesanan baru?', story: 'Koki tidak masuk kerja hari ini. Tapi warung tetap buka…', sound: 'fail' }),
    b({ packet: { from: 'fe', to: 'order', tag: 'POST /checkout #1', tone: 'request' }, activeNodes: ['fe', 'order'], payState: 'down', line: 2, status: 'User #1 checkout — tidak tahu (dan tidak perlu tahu) Payment mati.', story: 'Pembeli #1 memesan seperti biasa.', sound: 'send' }),
    b({ packet: { from: 'order', to: 'queue', tag: 'publish #1', tone: 'publish' }, activeNodes: ['order', 'queue'], queued: [M1], payState: 'down', line: 4, status: 'Pesan #1 tersimpan AMAN di queue (durable — ditulis ke disk).', story: 'Struk #1 ditempel di rel. Aman — tidak akan hilang.', sound: 'publish' }),
    b({ packet: { from: 'order', to: 'fe', tag: '201 diproses ✓', tone: 'response' }, activeNodes: ['order', 'fe'], queued: [M1], payState: 'down', line: 6, status: 'User #1 tetap dapat konfirmasi instan!', story: '"Siap, pesananmu diproses!" — pembeli pulang dengan tenang.', sound: 'back' }),
    b({ packet: { from: 'order', to: 'queue', tag: 'publish #2', tone: 'publish' }, activeNodes: ['fe', 'order', 'queue'], queued: [M1, M2], payState: 'down', line: 4, status: 'Pesanan #2 masuk → mengantre di belakang #1.', story: 'Pembeli #2 memesan — struknya ikut ditempel di rel.', sound: 'publish' }),
    b({ packet: { from: 'order', to: 'queue', tag: 'publish #3', tone: 'publish' }, activeNodes: ['fe', 'order', 'queue'], queued: [M1, M2, M3], payState: 'down', line: 4, status: '3 pesan menunggu. NOL pesanan hilang, NOL user gagal checkout.', story: 'Rel makin penuh, tapi rapi. Tidak satu pun pesanan dibuang.', sound: 'publish' }),
    b({ activeNodes: ['pay'], queued: [M1, M2, M3], payState: 'up', line: 9, status: 'Payment hidup kembali → langsung melihat antrean di queue.', story: 'Koki datang! Melihat rel penuh struk, ia langsung mulai bekerja.', sound: 'recover' }),
    b({ packet: { from: 'queue', to: 'pay', tag: 'consume #1', tone: 'consume' }, activeNodes: ['queue', 'pay'], queued: [M2, M3], payState: 'busy', processed: ['#1'], line: 9, status: 'Consume #1 → proses → ack.', story: 'Struk #1 diambil, dimasak, selesai.', sound: 'consume' }),
    b({ packet: { from: 'queue', to: 'pay', tag: 'consume #2', tone: 'consume' }, activeNodes: ['queue', 'pay'], queued: [M3], payState: 'busy', processed: ['#1', '#2'], line: 9, status: 'Consume #2 → proses → ack.', story: 'Struk #2 menyusul.', sound: 'consume' }),
    b({ packet: { from: 'queue', to: 'pay', tag: 'consume #3', tone: 'consume' }, activeNodes: ['queue', 'pay'], queued: [], payState: 'busy', processed: ['#1', '#2', '#3'], line: 9, status: 'Consume #3 → antrean bersih.', story: 'Struk terakhir selesai. Rel kosong kembali.', sound: 'consume' }),
    b({ payState: 'up', processed: ['#1', '#2', '#3'], line: 11, status: 'Semua pesanan terproses tanpa ada yang hilang — queue = penyangga (buffer).', story: 'Tidak ada pembeli yang kecewa. Itulah kekuatan message queue.', sound: 'done' }),
  ]
}

export function buildSteps(mode: Mode): QueueStep[] {
  if (mode === 'sync') return buildSync()
  if (mode === 'async') return buildAsync()
  return buildDown()
}
