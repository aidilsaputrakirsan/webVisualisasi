export type Mode = 'chaining' | 'probing'

export type Cue = 'compare' | 'probe' | 'place' | 'done' | null

export interface HashStep {
  /** Snapshot of the table — each slot is a list of keys (chaining uses the
   *  whole list; probing slots hold 0 or 1 key). */
  table: number[][]
  /** Home index h(key) — the index cell to highlight. */
  activeIndex: number | null
  /** Current slot being probed (probing mode). */
  probeIndex: number | null
  /** Key currently being inserted (header tape highlight). */
  insertingKey: number | null
  /** Slot where the key just landed (green flash). */
  placedAt: number | null
  /** Hash computation text, e.g. "h(8) = 8 % 7 = 1". */
  formula: string | null
  line: number
  status: string
  sound: Cue
}

export const SIZE = 7
export const KEYS = [15, 11, 27, 8, 22, 4]

export const MODES: Record<Mode, { label: string; desc: string; filename: string; code: string[] }> = {
  chaining: {
    label: 'Chaining',
    desc: 'Tiap slot menyimpan list · collision → sambung ke chain',
    filename: 'chaining.py',
    code: [
      'def insert(table, key):',
      '    i = key % size          # hash',
      '    table[i].append(key)    # sambung ke chain',
    ],
  },
  probing: {
    label: 'Linear Probing',
    desc: 'Satu key per slot · collision → cari slot kosong berikutnya',
    filename: 'linear_probing.py',
    code: [
      'def insert(table, key):',
      '    i = key % size              # hash',
      '    while table[i] is not None: # slot terisi?',
      '        i = (i + 1) % size      # probe berikutnya',
      '    table[i] = key              # simpan',
    ],
  },
}

const emptyTable = (): number[][] => Array.from({ length: SIZE }, () => [])
const clone = (t: number[][]): number[][] => t.map((b) => [...b])

function buildChaining(): HashStep[] {
  const table = emptyTable()
  const steps: HashStep[] = []
  const snap = (p: Partial<HashStep>) =>
    steps.push({
      table: clone(table),
      activeIndex: null,
      probeIndex: null,
      insertingKey: null,
      placedAt: null,
      formula: null,
      line: 0,
      status: '',
      sound: null,
      ...p,
    })

  for (const key of KEYS) {
    const h = key % SIZE
    snap({
      insertingKey: key,
      activeIndex: h,
      formula: `h(${key}) = ${key} % ${SIZE} = ${h}`,
      line: 1,
      status: `Hitung index untuk ${key}`,
      sound: 'compare',
    })
    const collided = table[h].length > 0
    table[h].push(key)
    snap({
      insertingKey: key,
      activeIndex: h,
      placedAt: h,
      formula: `h(${key}) = ${h}`,
      line: 2,
      status: collided ? `Index ${h} sudah terisi → sambung ${key} ke chain` : `Simpan ${key} di index ${h}`,
      sound: 'place',
    })
  }

  snap({ line: 0, status: `Selesai · ${KEYS.length} key dimasukkan`, sound: 'done' })
  return steps
}

function buildProbing(): HashStep[] {
  const table = emptyTable()
  const steps: HashStep[] = []
  const snap = (p: Partial<HashStep>) =>
    steps.push({
      table: clone(table),
      activeIndex: null,
      probeIndex: null,
      insertingKey: null,
      placedAt: null,
      formula: null,
      line: 0,
      status: '',
      sound: null,
      ...p,
    })

  for (const key of KEYS) {
    const h = key % SIZE
    snap({
      insertingKey: key,
      activeIndex: h,
      probeIndex: h,
      formula: `h(${key}) = ${key} % ${SIZE} = ${h}`,
      line: 1,
      status: `h(${key}) = ${h}`,
      sound: 'compare',
    })

    let i = h
    while (table[i].length > 0) {
      snap({
        insertingKey: key,
        activeIndex: h,
        probeIndex: i,
        formula: `h(${key}) = ${h}`,
        line: 2,
        status: `Index ${i} terisi (${table[i][0]}) → probe ke ${(i + 1) % SIZE}`,
        sound: 'probe',
      })
      i = (i + 1) % SIZE
    }

    table[i].push(key)
    snap({
      insertingKey: key,
      activeIndex: h,
      probeIndex: i,
      placedAt: i,
      formula: `h(${key}) = ${h}`,
      line: 4,
      status: i !== h ? `Slot kosong di ${i} → simpan ${key} (probed dari ${h})` : `Simpan ${key} di index ${i}`,
      sound: 'place',
    })
  }

  snap({ line: 0, status: `Selesai · ${KEYS.length} key dimasukkan`, sound: 'done' })
  return steps
}

export function buildSteps(mode: Mode): HashStep[] {
  return mode === 'chaining' ? buildChaining() : buildProbing()
}
