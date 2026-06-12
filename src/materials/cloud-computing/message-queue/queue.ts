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
  '    # call Payment & WAIT for its reply',
  '    r = requests.post(',
  '        f"{PAY_URL}/charge",',
  '        json=order, timeout=10)  # blocking!',
  '    if r.status_code != 200:',
  '        raise HTTPException(502)  # fail too',
  '    return {"status": "paid"}',
]

const ASYNC_CODE = [
  '# producer — order-service',
  '@app.post("/checkout")',
  'def checkout(order):',
  '    db.save(order)',
  '    channel.basic_publish(',
  '        queue="orders", body=json(order))',
  '    return {"status": "processing"}  # instant!',
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
    desc: 'No queue — the caller waits and fails along with it (tight coupling)',
    filename: 'order-service/main.py',
    code: SYNC_CODE,
    showQueue: false,
  },
  async: {
    label: 'Async (Queue)',
    desc: 'With a queue — publish then move on; the consumer pulls when ready',
    filename: 'producer_consumer.py',
    code: ASYNC_CODE,
    showQueue: true,
  },
  down: {
    label: 'Consumer Down',
    desc: 'Payment down — messages pile up safely in the queue, processed on recovery',
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
    b({ activeNodes: ['fe'], line: 0, status: 'Synchronous: Order calls Payment over HTTP and waits for its reply.', story: 'Picture a food stall: the cashier MUST wait for the cook to finish before serving the next customer.' }),
    b({ packet: { from: 'fe', to: 'order', tag: 'POST /checkout #1', tone: 'request' }, activeNodes: ['fe', 'order'], line: 1, status: 'User #1 checks out → request reaches the Order Service.', story: 'Customer #1 walks up and orders at the cashier.', sound: 'send' }),
    b({ packet: { from: 'order', to: 'pay', tag: 'POST /charge', tone: 'request' }, activeNodes: ['order', 'pay'], payState: 'busy', waiting: true, line: 4, status: 'Order calls Payment then WAITS — the user request hangs along with it.', story: 'The cashier shouts the order to the cook, then stands still, waiting in place.', sound: 'send' }),
    b({ activeNodes: ['pay'], payState: 'busy', waiting: true, line: 6, status: 'Payment processes (~3 seconds)… meanwhile Order is blocked (blocking).', story: 'The cook is cooking… the cashier waits, and the line of customers behind is held up too.', sound: 'process' }),
    b({ packet: { from: 'pay', to: 'order', tag: '200 OK', tone: 'response' }, activeNodes: ['pay', 'order'], processed: ['#1'], line: 7, status: 'Payment is done → only now can Order continue.', story: 'The dish is ready! The cook hands it to the cashier.', sound: 'back' }),
    b({ packet: { from: 'order', to: 'fe', tag: 'paid ✓', tone: 'response' }, activeNodes: ['order', 'fe'], processed: ['#1'], line: 9, status: 'The user finally gets a reply — after waiting through the whole process.', story: 'Customer #1 is served… but only after a long wait standing at the cashier.', sound: 'back' }),
    b({ payState: 'down', processed: ['#1'], line: 3, status: 'Suddenly the Payment Service goes DOWN. Then order #2 arrives…', story: 'Disaster — the cook leaves out of nowhere! And customer #2 has just arrived…', sound: 'fail' }),
    b({ packet: { from: 'fe', to: 'order', tag: 'POST /checkout #2', tone: 'request' }, activeNodes: ['fe', 'order'], payState: 'down', processed: ['#1'], line: 1, status: 'User #2 checks out → the Order Service receives the request.', story: 'Customer #2 orders at the cashier as usual.', sound: 'send' }),
    b({ packet: { from: 'order', to: 'pay', tag: 'POST /charge', tone: 'request' }, activeNodes: ['order', 'pay'], payState: 'down', waiting: true, processed: ['#1'], line: 4, status: 'Order calls Payment… no answer…', story: 'The cashier shouts toward the kitchen… silence. No one answers.', sound: 'send' }),
    b({ packet: { from: 'pay', to: 'order', tag: 'timeout ✕', tone: 'fail' }, activeNodes: ['pay', 'order'], payState: 'down', processed: ['#1'], line: 7, status: 'Timeout after 10 seconds → the call FAILS.', story: 'No cook = no food. The cashier gives up waiting.', sound: 'fail' }),
    b({ packet: { from: 'order', to: 'fe', tag: '502 error', tone: 'fail' }, activeNodes: ['order', 'fe'], payState: 'down', failed: true, processed: ['#1'], line: 8, status: 'Order fails too → the user gets an error. Checkout FAILED.', story: 'The cashier has to refuse: "Sorry, can\'t take your order." The customer leaves disappointed.', sound: 'fail' }),
    b({ activeNodes: ['fe'], payState: 'down', failed: true, processed: ['#1'], line: 8, status: 'Tight coupling: one service goes down → everything calling it fails too.', story: 'One cook is absent and the whole stall stops serving. There must be a better way…', sound: 'done' }),
  ]
}

function buildAsync(): QueueStep[] {
  return [
    b({ activeNodes: ['fe'], line: 0, status: 'Asynchronous: Order puts a message on the queue; Payment pulls it when ready.', story: 'The stall now has an ORDER RAIL: the cashier just clips the ticket onto the rail, and the cook takes them one by one.' }),
    b({ packet: { from: 'fe', to: 'order', tag: 'POST /checkout #1', tone: 'request' }, activeNodes: ['fe', 'order'], line: 2, status: 'User #1 checks out → reaches the Order Service.', story: 'Customer #1 walks up and orders at the cashier.', sound: 'send' }),
    b({ packet: { from: 'order', to: 'queue', tag: 'publish #1', tone: 'publish' }, activeNodes: ['order', 'queue'], queued: [M1], line: 4, status: 'Order publishes the "order #1" message to the queue — waiting for no one.', story: 'The cashier clips ticket #1 onto the kitchen rail. Their part is done!', sound: 'publish' }),
    b({ packet: { from: 'order', to: 'fe', tag: '201 processing ✓', tone: 'response' }, activeNodes: ['order', 'fe'], queued: [M1], line: 6, status: 'Order replies to the user IMMEDIATELY (~50ms) — without waiting for Payment.', story: 'The cashier says right away: "Got it! Your order is being processed." The customer is happy.', sound: 'back' }),
    b({ packet: { from: 'queue', to: 'pay', tag: 'consume #1', tone: 'consume' }, activeNodes: ['queue', 'pay'], payState: 'busy', line: 9, status: 'Payment pulls (consumes) message #1 from the queue.', story: 'The cook takes ticket #1 off the rail and starts cooking.', sound: 'consume' }),
    b({ activeNodes: ['pay'], processed: ['#1'], line: 11, status: 'Payment finishes processing → sends ack. Message #1 is complete.', story: 'Dish #1 is ready — its ticket comes off the rail.', sound: 'process' }),
    b({ packet: { from: 'fe', to: 'order', tag: 'POST /checkout #2', tone: 'request' }, activeNodes: ['fe', 'order'], processed: ['#1'], line: 2, status: 'Order #2 arrives…', story: 'Customer #2 walks up.', sound: 'send' }),
    b({ packet: { from: 'order', to: 'queue', tag: 'publish #2', tone: 'publish' }, activeNodes: ['order', 'queue'], queued: [M2], processed: ['#1'], line: 4, status: 'Publish #2 → user #2 also gets instant confirmation.', story: 'Ticket #2 is clipped on; the cashier is immediately ready for the next customer.', sound: 'publish' }),
    b({ packet: { from: 'queue', to: 'pay', tag: 'consume #2', tone: 'consume' }, activeNodes: ['queue', 'pay'], payState: 'busy', processed: ['#1'], line: 9, status: 'Payment pulls #2 at its own working pace.', story: 'The cook prepares #2 at their own tempo — no one waits on anyone.', sound: 'consume' }),
    b({ activeNodes: ['pay'], processed: ['#1', '#2'], line: 11, status: 'Done. Producer & consumer are DECOUPLED — fully separated.', story: 'The cashier serves quickly, the cook cooks calmly. The customer line keeps flowing.', sound: 'done' }),
  ]
}

function buildDown(): QueueStep[] {
  return [
    b({ payState: 'down', line: 8, status: 'Key scenario: the Payment Service is DOWN. What happens to new orders?', story: 'The cook did not show up today. But the stall stays open…', sound: 'fail' }),
    b({ packet: { from: 'fe', to: 'order', tag: 'POST /checkout #1', tone: 'request' }, activeNodes: ['fe', 'order'], payState: 'down', line: 2, status: 'User #1 checks out — unaware (and not needing to know) Payment is down.', story: 'Customer #1 orders as usual.', sound: 'send' }),
    b({ packet: { from: 'order', to: 'queue', tag: 'publish #1', tone: 'publish' }, activeNodes: ['order', 'queue'], queued: [M1], payState: 'down', line: 4, status: 'Message #1 is stored SAFELY in the queue (durable — written to disk).', story: 'Ticket #1 is clipped onto the rail. Safe — it will not be lost.', sound: 'publish' }),
    b({ packet: { from: 'order', to: 'fe', tag: '201 processing ✓', tone: 'response' }, activeNodes: ['order', 'fe'], queued: [M1], payState: 'down', line: 6, status: 'User #1 still gets instant confirmation!', story: '"Got it, your order is being processed!" — the customer heads home at ease.', sound: 'back' }),
    b({ packet: { from: 'order', to: 'queue', tag: 'publish #2', tone: 'publish' }, activeNodes: ['fe', 'order', 'queue'], queued: [M1, M2], payState: 'down', line: 4, status: 'Order #2 arrives → queues up behind #1.', story: 'Customer #2 orders — their ticket is clipped onto the rail too.', sound: 'publish' }),
    b({ packet: { from: 'order', to: 'queue', tag: 'publish #3', tone: 'publish' }, activeNodes: ['fe', 'order', 'queue'], queued: [M1, M2, M3], payState: 'down', line: 4, status: '3 messages waiting. ZERO orders lost, ZERO failed checkouts.', story: 'The rail fills up, but stays orderly. Not a single order is thrown away.', sound: 'publish' }),
    b({ activeNodes: ['pay'], queued: [M1, M2, M3], payState: 'up', line: 9, status: 'Payment comes back up → immediately sees the backlog in the queue.', story: 'The cook arrives! Seeing the rail full of tickets, they get straight to work.', sound: 'recover' }),
    b({ packet: { from: 'queue', to: 'pay', tag: 'consume #1', tone: 'consume' }, activeNodes: ['queue', 'pay'], queued: [M2, M3], payState: 'busy', processed: ['#1'], line: 9, status: 'Consume #1 → process → ack.', story: 'Ticket #1 is taken, cooked, done.', sound: 'consume' }),
    b({ packet: { from: 'queue', to: 'pay', tag: 'consume #2', tone: 'consume' }, activeNodes: ['queue', 'pay'], queued: [M3], payState: 'busy', processed: ['#1', '#2'], line: 9, status: 'Consume #2 → process → ack.', story: 'Ticket #2 follows.', sound: 'consume' }),
    b({ packet: { from: 'queue', to: 'pay', tag: 'consume #3', tone: 'consume' }, activeNodes: ['queue', 'pay'], queued: [], payState: 'busy', processed: ['#1', '#2', '#3'], line: 9, status: 'Consume #3 → the queue is clear.', story: 'The last ticket is done. The rail is empty again.', sound: 'consume' }),
    b({ payState: 'up', processed: ['#1', '#2', '#3'], line: 11, status: 'Every order processed with none lost — the queue acts as a buffer.', story: 'No customer left disappointed. That is the power of a message queue.', sound: 'done' }),
  ]
}

export function buildSteps(mode: Mode): QueueStep[] {
  if (mode === 'sync') return buildSync()
  if (mode === 'async') return buildAsync()
  return buildDown()
}
