/**
 * B-SMART IPM — loop keputusan edge, dihitung di muka sebagai daftar frame.
 *
 * Gateway di perangkat menjalankan loop kontrol terus-menerus bertenaga surya:
 *   DETEKSI  → baca jalur sensor (sinyal mentah → fusi sensor)
 *   PUTUSKAN → filter pemicu palsu · gerbang cuaca · gerbang konteks · level
 *   TINDAK   → pilih modul → aktuasi (atau tahan, demi hemat energi/lindungi alat)
 *   CATAT    → simpan kejadian, perbarui dashboard & rekomendasi
 *
 * Empat siklus contoh menunjukkan klaim sistem:
 *   1. malam       → perangkap fototaktik menyala pada sinyal kumbang nyata
 *   2. malam hujan → sinyal nyata, tapi gerbang cuaca MENAHAN aktuasi
 *   3. siang       → gerak PIR ternyata pelepah → filter MENOLAK → tahan
 *   4. siang       → kamera memastikan tupai → deterrent acak (anti-habituasi)
 * lalu loop kembali ke DETEKSI untuk menegaskan ia berjalan 24/7.
 *
 * Catatan: teks penonton sengaja Bahasa Indonesia (nama sensor/istilah teknis
 * tetap Inggris bila lebih pas), sesuai permintaan untuk materi riset ini.
 */

export type Phase = 'sense' | 'decide' | 'act' | 'log'

export const PHASES: { id: Phase; label: string; desc: string }[] = [
  { id: 'sense', label: 'Deteksi', desc: 'baca sensor' },
  { id: 'decide', label: 'Putuskan', desc: 'edge gateway' },
  { id: 'act', label: 'Tindak', desc: 'aktuasi / tahan' },
  { id: 'log', label: 'Catat', desc: 'dashboard' },
]

export type SensorId = 'light' | 'pir' | 'camera' | 'climate' | 'power'

export interface SensorDef {
  id: SensorId
  label: string
  spec: string
}

export const SENSORS: SensorDef[] = [
  { id: 'light', label: 'Cahaya spektral', spec: 'lux · fototaksis kumbang' },
  { id: 'pir', label: 'Gerak PIR', spec: 'gerak bertubuh-hangat' },
  { id: 'camera', label: 'Kamera · edge ML', spec: 'validasi spesies' },
  { id: 'climate', label: 'Iklim', spec: 'suhu · lembap · hujan' },
  { id: 'power', label: 'Surya / baterai', spec: 'anggaran energi' },
]

export type ModuleId = 'trap' | 'deterrent'

export interface ModuleDef {
  id: ModuleId
  label: string
  spec: string
  window: 'night' | 'day'
}

export const MODULES: ModuleDef[] = [
  { id: 'trap', label: 'Perangkap Fototaktik', spec: 'UV 365–395 + biru 450 · kumbang', window: 'night' },
  { id: 'deterrent', label: 'Deterrent Adaptif', spec: 'strobe + suara predator · tupai', window: 'day' },
]

export type FilterState = 'idle' | 'pass' | 'reject'
export type WeatherState = 'idle' | 'ok' | 'hold'
export type ContextState = 'idle' | 'ok' | 'blocked'
export type Decision = 'activate' | 'suppress'

export interface Checks {
  filter: FilterState
  /** Gerbang cuaca: hujan deras menahan aktuasi (lindungi alat). */
  weather: WeatherState
  context: ContextState
  /** Estimasi level serangan berjalan, 0–100. */
  level: number
}

export interface LogEntry {
  id: string
  time: string
  label: string
  result: 'activated' | 'suppressed'
}

export type SoundCue = 'sense' | 'think' | 'act' | 'reject' | 'rain' | 'trap' | 'deter' | 'done'

export interface Step {
  phase: Phase
  cycle: number
  env: 'day' | 'night'
  time: string
  battery: number
  solar: number
  /** Sensor yang menyala pada frame ini (mendukung fusi = banyak sensor). */
  triggers: SensorId[]
  reading: string
  checks: Checks
  decision: Decision | null
  activeModule: ModuleId | null
  pattern: string | null
  /** True pada frame CATAT yang TINDAK-nya dilewati (ditahan). */
  actSkipped: boolean
  log: LogEntry[]
  /** Status teknis ringkas (pill). */
  status: string
  /** Narasi "cerita" yang lebih santai (panel pengganti kode). */
  story: string
  sound: SoundCue
}

export function buildSteps(): Step[] {
  const steps: Step[] = []
  const log: LogEntry[] = []

  // Running scene state — DETEKSI/PUTUSKAN/TINDAK dipecah jadi sub-frame supaya
  // tiap langkah terlihat. `level` berjalan lintas siklus; field gateway
  // per-siklus direset oleh `scene()`.
  let env: 'day' | 'night' = 'night'
  let time = '21:42'
  let battery = 86
  let solar = 0.2
  let triggers: SensorId[] = []
  let reading = ''
  let filter: FilterState = 'idle'
  let weather: WeatherState = 'idle'
  let context: ContextState = 'idle'
  let level = 0
  let decision: Decision | null = null
  let activeModule: ModuleId | null = null
  let pattern: string | null = null

  function scene(s: { env: 'day' | 'night'; time: string; battery: number; solar: number }) {
    env = s.env
    time = s.time
    battery = s.battery
    solar = s.solar
    triggers = []
    reading = ''
    filter = 'idle'
    weather = 'idle'
    context = 'idle'
    decision = null
    activeModule = null
    pattern = null
  }

  function push(
    phase: Phase,
    cycle: number,
    status: string,
    story: string,
    sound: SoundCue,
    actSkipped = false,
  ) {
    steps.push({
      phase, cycle, env, time, battery, solar, triggers: [...triggers], reading,
      checks: { filter, weather, context, level },
      decision, activeModule, pattern, actSkipped,
      log: log.map((e) => ({ ...e })),
      status, story, sound,
    })
  }

  // ── Siklus 1 — MALAM: sinyal kumbang nokturnal nyata → nyalakan perangkap ──
  scene({ env: 'night', time: '21:42', battery: 86, solar: 0.2 })
  triggers = ['light']
  reading = 'lux 2 · 4 kumbang/menit dekat perangkap'
  push('sense', 1,
    'Deteksi · sinyal: sensor cahaya spektral menangkap lux 2 dan kumbang berdatangan.',
    'Malam tiba — jam aktif kumbang nokturnal. Sensor cahaya melihat kebun nyaris gelap sekaligus laju kumbang yang naik di sekitar perangkap.',
    'sense')

  triggers = ['light', 'climate', 'power']
  reading = 'fusi: cahaya + iklim cerah + baterai 86% → 1 kejadian-kandidat'
  push('sense', 1,
    'Deteksi · fusi: gabungkan cahaya, iklim, dan status daya menjadi satu kejadian-kandidat.',
    'Gateway tak menilai satu sensor sendirian. Ia memadukan pembacaan cahaya dengan iklim (cerah) dan anggaran daya untuk membentuk satu kejadian-kandidat yang utuh.',
    'sense')

  triggers = ['light']
  filter = 'pass'
  push('decide', 1,
    'Putuskan · filter: sinyal bertahan & konsisten → bukan derau, filter LOLOS.',
    'Gateway tidak langsung percaya satu pembacaan. Karena sinyal kumbang bertahan dan stabil, filter pemicu palsu menyatakannya nyata.',
    'think')

  weather = 'ok'
  push('decide', 1,
    'Putuskan · cuaca: iklim cerah, tidak hujan → gerbang cuaca AMAN untuk beraktuasi.',
    'Sebelum menyalakan perangkat di ruang terbuka, sistem mengecek cuaca. Malam ini cerah, jadi aman menyalakan perangkap tanpa risiko ke elektronik.',
    'think')

  context = 'ok'
  push('decide', 1,
    'Putuskan · konteks: sekarang malam → jendela perangkap fototaktik terbuka.',
    'Tiap modul punya jam kerjanya. Perangkap fototaktik hanya relevan malam hari — dan sekarang memang malam — jadi gerbang konteksnya terbuka.',
    'think')

  level = 38
  decision = 'activate'
  push('decide', 1,
    'Putuskan · level: estimasi serangan naik ke 38, melewati ambang → keputusan AKTIFKAN.',
    'Sistem memperbarui perkiraan tingkat serangan menjadi 38. Angka itu melewati ambang tindakan, sehingga gateway memutuskan untuk bertindak.',
    'think')

  activeModule = 'trap'
  push('act', 1,
    'Tindak · pilih: gateway memilih modul Perangkap Fototaktik untuk kumbang.',
    'Dari dua aktuator yang tersedia, gateway memilih perangkap fototaktik — modul yang memang dirancang untuk kumbang nokturnal.',
    'act')

  pattern = 'UV 365–395 + biru 450 · berdenyut'
  push('act', 1,
    'Tindak · aktuasi: nyalakan UV 365–395 + biru 450 berdenyut, spektrum yang ditala ke kumbang.',
    'Perangkap menyala pada panjang gelombang khusus yang menarik kumbang target — bukan musuh alami — sehingga tangkapannya selektif dan ramah ekosistem.',
    'trap')

  log.unshift({ id: 'l1', time: '21:42', label: 'Perangkap · kumbang malam', result: 'activated' })
  push('log', 1,
    'Catat: kejadian tersimpan, hitung-kumbang dashboard +4. Loop siap mengulang.',
    'Kejadian masuk ke dashboard dan jumlah kumbang bertambah. Satu siklus selesai, sistem kembali ke tahap Deteksi.',
    'done')

  // ── Siklus 2 — MALAM HUJAN: sinyal nyata, tapi gerbang cuaca menahan aktuasi ──
  scene({ env: 'night', time: '23:10', battery: 80, solar: 0.0 })
  triggers = ['light']
  reading = 'lux 1 · 2 kumbang/menit'
  push('sense', 2,
    'Deteksi · sinyal: sensor cahaya menangkap kumbang lagi, lebih sedikit.',
    'Lewat tengah malam, masih ada kumbang meski lebih jarang. Sensor cahaya tetap menaikkan sinyal kandidat.',
    'sense')

  triggers = ['light', 'climate']
  reading = 'fusi: sensor iklim → hujan deras 12 mm/jam'
  push('sense', 2,
    'Deteksi · fusi: saat memadukan sensor, iklim melaporkan hujan deras 12 mm/jam.',
    'Ketika sensor digabung, iklim memberi kabar penting: hujan turun deras. Satu pembacaan ini mengubah keputusan berikutnya.',
    'rain')

  triggers = ['light']
  filter = 'pass'
  push('decide', 2,
    'Putuskan · filter: sinyal kumbang tetap nyata → filter LOLOS.',
    'Kumbangnya memang ada, jadi filter pemicu palsu tetap meloloskan sinyal sebagai target nyata. Persoalannya bukan di sini.',
    'think')

  weather = 'hold'
  decision = 'suppress'
  push('decide', 2,
    'Putuskan · cuaca: hujan deras → gerbang cuaca MENAHAN (lindungi alat, perangkap kurang efektif basah).',
    'Menyalakan perangkat saat hujan deras berisiko untuk elektronik dan kurang efektif. Gerbang cuaca menahan aktuasi demi melindungi alat — sesuatu yang penting di kebun terbuka.',
    'reject')

  log.unshift({ id: 'l2', time: '23:10', label: 'Perangkap · ditahan (hujan)', result: 'suppressed' })
  push('log', 2,
    'Catat: aktuasi ditahan karena cuaca, tapi kejadian tetap dicatat untuk tren. Daya aman.',
    'Tidak ada yang dinyalakan, namun kejadian tetap dicatat agar tren hama akurat. Perangkat aman dan hemat daya selama hujan, lalu siap lagi begitu reda.',
    'done', true)

  // ── Siklus 3 — SIANG: gerak PIR yang ditolak kamera → tahan (hemat energi) ──
  scene({ env: 'day', time: '10:15', battery: 92, solar: 18.4 })
  triggers = ['pir']
  reading = 'gerak PIR · 1 kejadian di panel'
  push('sense', 3,
    'Deteksi · sinyal: PIR menangkap gerak di siang hari.',
    'Berganti siang. Sensor PIR menangkap gerakan di dekat panel. Tapi gerakan saja belum cukup jadi bukti — banyak hal bergerak di kebun.',
    'sense')

  triggers = ['pir', 'camera']
  reading = 'fusi: PIR membangunkan kamera untuk validasi spesies'
  push('sense', 3,
    'Deteksi · fusi: PIR memicu kamera edge-ML untuk memvalidasi apa yang bergerak.',
    'Daripada langsung bereaksi, PIR membangunkan kamera. Sistem ingin memastikan dulu: benarkah ini hama target, bukan sekadar daun?',
    'sense')

  triggers = ['camera']
  reading = 'edge ML: pelepah (conf 0.88) — bukan target'
  filter = 'reject'
  decision = 'suppress'
  push('decide', 3,
    "Putuskan · filter: kamera melihat 'pelepah (conf 0.88)' → filter MENOLAK, keputusan TAHAN.",
    'Kamera memutuskan: itu pelepah yang bergoyang, bukan tupai. Filter pemicu palsu menolak agar sistem tidak bereaksi berlebihan.',
    'reject')

  log.unshift({ id: 'l3', time: '10:15', label: 'PIR · pemicu palsu', result: 'suppressed' })
  push('log', 3,
    'Catat: tidak ada aktuasi. Energi surya terjaga dan alarm palsu disaring sejak awal.',
    'Tidak ada modul menyala. Inilah kuncinya: alarm palsu disaring lebih dulu sehingga energi hemat dan perangkat awet.',
    'done', true)

  // ── Siklus 4 — SIANG: kamera memastikan tupai → deterrent acak (anti-habituasi) ──
  scene({ env: 'day', time: '14:03', battery: 90, solar: 16.7 })
  triggers = ['pir']
  reading = 'gerak PIR · 1 kejadian di tandan buah'
  push('sense', 4,
    'Deteksi · sinyal: PIR menyala lagi, kali ini dekat tandan buah.',
    'Masih siang. PIR menangkap gerakan tepat di area tandan buah — lokasi yang rawan dirusak hama mamalia.',
    'sense')

  triggers = ['pir', 'camera']
  reading = 'fusi: kamera edge-ML aktif untuk validasi'
  push('sense', 4,
    'Deteksi · fusi: PIR + kamera digabung untuk memastikan spesies sebelum bertindak.',
    'Lagi-lagi PIR memanggil kamera, supaya tindakan hanya diambil untuk target yang benar — bukan untuk setiap gerakan.',
    'sense')

  triggers = ['camera']
  reading = 'edge ML: tupai (conf 0.93) — target'
  filter = 'pass'
  push('decide', 4,
    "Putuskan · filter: kamera memastikan 'tupai (conf 0.93)' → filter LOLOS.",
    'Kali ini benar-benar seekor tupai dengan keyakinan tinggi, jadi filter meloloskannya sebagai target nyata.',
    'think')

  weather = 'ok'
  push('decide', 4,
    'Putuskan · cuaca: siang cerah → gerbang cuaca AMAN.',
    'Cuaca cerah, tidak ada alasan menahan. Gerbang cuaca aman untuk beraktuasi.',
    'think')

  context = 'ok'
  push('decide', 4,
    'Putuskan · konteks: sekarang siang → jendela deterrent adaptif terbuka.',
    'Tupai aktif di siang hari, dan modul deterrent memang untuk siang. Gerbang konteks pun terbuka untuk modul yang tepat.',
    'think')

  level = 64
  decision = 'activate'
  push('decide', 4,
    'Putuskan · level: serangan berulang menaikkan estimasi ke 64 → keputusan AKTIFKAN.',
    'Karena gangguan tupai berulang, perkiraan tingkat serangan melonjak ke 64 — cukup tinggi untuk menuntut tindakan segera.',
    'think')

  activeModule = 'deterrent'
  push('act', 4,
    'Tindak · pilih: gateway memilih modul Deterrent Adaptif untuk tupai.',
    'Gateway beralih ke aktuator yang sesuai: deterrent adaptif yang menggabungkan strobe dan suara predator.',
    'act')

  pattern = 'strobe + suara predator · acak'
  push('act', 4,
    'Tindak · aktuasi: pola strobe + suara predator diacak agar tupai tak terbiasa (anti-habituasi).',
    'Alih-alih pola yang sama berulang, sistem mengacak kombinasi strobe dan suara predator setiap kali. Tujuannya agar tupai tidak cepat kebal terhadap gangguan.',
    'deter')

  log.unshift({ id: 'l4', time: '14:03', label: 'Deterrent · tupai', result: 'activated' })
  push('log', 4,
    'Catat: tren naik, dashboard menandai blok B-7 untuk patroli tanpa bahan kimia.',
    'Kejadian tercatat dan trennya menanjak; dashboard merekomendasikan patroli terfokus di blok B-7 — semua tanpa menyemprot pestisida.',
    'done')

  // ── Loop berlanjut — kembali ke Deteksi, 24/7 bertenaga surya ──
  scene({ env: 'day', time: '14:04', battery: 90, solar: 16.7 })
  reading = 'menunggu sinyal berikutnya…'
  push('sense', 5,
    'Loop: Deteksi → Putuskan → Tindak → Catat, 24/7 — adaptif, sadar cuaca, surya, tanpa kimia.',
    'Begitulah B-SMART IPM bekerja sepanjang hari: mendeteksi & memfusikan sensor, memutuskan cerdas di perangkat (termasuk sadar cuaca), bertindak seperlunya, lalu mencatat. Hemat energi, selektif, dan bebas bahan kimia.',
    'done')

  return steps
}
