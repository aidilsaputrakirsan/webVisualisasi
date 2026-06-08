/**
 * Precomputed Saga (distributed transaction). One Step = a snapshot of every
 * service's state + the saga log. The animation replays the forward commits and,
 * on failure, the compensating rollback that runs in reverse.
 *
 * Two modes:
 *   - 'success' : semua langkah commit → order berhasil.
 *   - 'fail'    : satu langkah gagal (stok habis) → langkah yang sudah commit
 *                 dibatalkan lewat compensating action, MUNDUR satu per satu.
 */

export type Mode = 'success' | 'fail'
export type Cue = 'run' | 'commit' | 'fail' | 'compensate' | 'done' | null

export type ServiceId = 'order' | 'payment' | 'inventory' | 'shipping'
export type ServiceState = 'idle' | 'running' | 'committed' | 'failed' | 'compensating' | 'compensated' | 'skipped'

export interface ServiceDef {
  id: ServiceId
  name: string
  t: string // forward (local transaction)
  c: string // compensating action
}

export const SERVICES: ServiceDef[] = [
  { id: 'order', name: 'Order', t: 'createOrder', c: 'cancelOrder' },
  { id: 'payment', name: 'Payment', t: 'chargeCard', c: 'refund' },
  { id: 'inventory', name: 'Inventory', t: 'reserveStock', c: 'releaseStock' },
  { id: 'shipping', name: 'Shipping', t: 'scheduleShip', c: 'cancelShip' },
]

const ORDER: ServiceId[] = ['order', 'payment', 'inventory', 'shipping']
const NAME: Record<ServiceId, ServiceDef> = Object.fromEntries(SERVICES.map((s) => [s.id, s])) as Record<ServiceId, ServiceDef>

export interface LogEntry {
  kind: 'commit' | 'fail' | 'compensate'
  service: ServiceId
  text: string
}

export interface SagaStep {
  states: Record<ServiceId, ServiceState>
  current: ServiceId | null
  log: LogEntry[]
  line: number
  status: string
  sound: Cue
}

export const CODE_SOURCE = [
  'def place_order_saga():',
  '    steps = [order, payment, inventory, shipping]',
  '    done = []',
  '    try:',
  '        for s in steps:',
  '            s.execute()        # transaksi lokal',
  '            done.append(s)',
  '    except StepFailed:',
  '        for s in reversed(done):     # MUNDUR',
  '            s.compensate()     # batalkan efeknya',
  '        raise',
]
const LINE = { execute: 5, fail: 7, compensate: 9 }

export const MODES: Record<Mode, { label: string; desc: string }> = {
  success: { label: 'Sukses', desc: 'Semua transaksi lokal commit berurutan → order berhasil' },
  fail: { label: 'Gagal (rollback)', desc: 'Satu langkah gagal → compensating action membatalkan mundur' },
}

const init = (): Record<ServiceId, ServiceState> => ({
  order: 'idle',
  payment: 'idle',
  inventory: 'idle',
  shipping: 'idle',
})

function build(mode: Mode): SagaStep[] {
  const steps: SagaStep[] = []
  const states = init()
  const log: LogEntry[] = []
  const snap = (current: ServiceId | null, line: number, status: string, sound: Cue) =>
    steps.push({ states: { ...states }, current, log: [...log], line, status, sound })

  snap(null, 0, 'Saga: rangkaian transaksi lokal — tiap langkah punya aksi kompensasi.', null)

  const failAt: ServiceId | null = mode === 'fail' ? 'inventory' : null
  const committed: ServiceId[] = []

  for (const id of ORDER) {
    const def = NAME[id]
    states[id] = 'running'
    snap(id, LINE.execute, `${def.name}: ${def.t}() …`, 'run')

    if (id === failAt) {
      states[id] = 'failed'
      log.push({ kind: 'fail', service: id, text: `${def.t}() GAGAL — stok habis` })
      // remaining services are skipped
      for (const rest of ORDER) if (!committed.includes(rest) && rest !== id) states[rest] = 'skipped'
      snap(id, LINE.fail, `${def.name} GAGAL → batalkan semua langkah sebelumnya (rollback).`, 'fail')
      break
    }

    states[id] = 'committed'
    committed.push(id)
    log.push({ kind: 'commit', service: id, text: `${def.t}() ✓` })
    snap(id, LINE.execute, `${def.name} commit ✓ — lanjut ke langkah berikutnya.`, 'commit')
  }

  if (mode === 'fail') {
    for (const id of [...committed].reverse()) {
      const def = NAME[id]
      states[id] = 'compensating'
      snap(id, LINE.compensate, `Kompensasi: ${def.name}.${def.c}() …`, 'compensate')
      states[id] = 'compensated'
      log.push({ kind: 'compensate', service: id, text: `${def.c}() ↺ dibatalkan` })
      snap(id, LINE.compensate, `${def.name} dibatalkan (${def.c}).`, 'compensate')
    }
    snap(null, LINE.compensate, 'Dibatalkan UTUH — tidak ada efek sebagian (atomicity ala saga).', 'done')
  } else {
    snap(null, LINE.execute, 'Semua langkah commit → order berhasil ditempatkan.', 'done')
  }

  return steps
}

export function buildSteps(mode: Mode): SagaStep[] {
  return build(mode)
}
