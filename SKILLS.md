# SKILLS.md — Panduan Membuat Visualisasi Materi

> **Untuk AI/asisten di chat baru:** Baca file ini lebih dulu. Materi baru ada di
> `materi-baru.md` (atau file lain yang ditunjuk user). Tugasmu: ubah materi itu
> menjadi **satu visualisasi animatif** yang **konsisten** dengan materi yang sudah
> ada (Insertion Sort & Binary Tree Traversal). Jangan menyimpang dari pola di
> bawah ini kecuali user memintanya.

---

## 1. Tujuan Project

Aplikasi web untuk **bahan ajar**: setiap "materi" adalah visualisasi algoritma/
konsep dengan tema **"Editorial Paper"** (light, kertas hangat + aksen amber, font serif
untuk judul) — identitas sendiri, dirancang untuk **direkam layar**
menjadi video/reel 9:16. User memilih materi dari menu, lalu menjalankannya.

Materi dikelompokkan per **mata kuliah (MK)**, mis. *Data Structure*, *Cloud Computing*.

---

## 2. Stack & Perintah

- **Vite + React 18 + TypeScript**
- **Framer Motion** untuk animasi (`layout`, spring, `AnimatePresence`)
- **Tailwind CSS v3** (+ ukuran px inline untuk konten canvas)
- **Web Audio API** untuk suara (tanpa file aset) — `src/audio/sounds.ts`

```bash
npm install      # sekali di awal
npm run dev      # preview di http://localhost:5173
npm run build    # tsc --noEmit && vite build  → WAJIB lolos sebelum selesai
```

---

## 3. Struktur Folder

```
src/
├── App.tsx                 # menu navigasi materi ↔ render materi terpilih
├── main.tsx
├── index.css               # class .stage-bg + Tailwind
├── audio/sounds.ts         # synth bersama (ensureAudio, setMuted, play*)
├── shared/                 # dipakai SEMUA materi — JANGAN duplikasi di materi
│   ├── MaterialStage.tsx     # canvas 1080×1920 (9:16) ber-scale + Watermark otomatis
│   ├── Watermark.tsx         # branding IG + website (edit 2 konstanta di sini)
│   ├── TitleBlock.tsx        # judul + subjudul + badge kompleksitas
│   └── CodeBlock.tsx         # panel kode generik (filename, source[], activeLine)
└── materials/
    ├── registry.ts         # KATALOG semua materi per MK
    ├── data-structure/
    │   ├── insertion-sort/             # contoh materi 1
    │   └── binary-tree-traversal/      # contoh materi 2
    └── cloud-computing/    # MK lain (placeholder)
```

Satu materi = satu sub-folder berisi: **generator step (logika)** + **komponen visual** +
**`<Nama>Material.tsx`** (perakit). Komponen yang spesifik materi tinggal di folder
materi itu; yang umum dipakai lintas materi diangkat ke `src/shared/`.

---

## 4. Pola Inti: "Precompute Steps, lalu Putar"

**Aturan emas:** jangan menganimasikan langsung dari loop algoritma. Hitung dulu
**seluruh langkah** menjadi array `Step[]`, lalu animasi tinggal memutar step satu per
satu (maju/mundur/lompat). Ini bikin Play/Pause/Step/Reset gampang dan animasi mulus.

Setiap `Step` adalah **snapshot lengkap** satu frame, minimal berisi:
- kondisi data (array/tree/queue/dll) — pakai **id stabil** per elemen supaya
  `layout` Framer Motion bisa meluncur mulus saat posisi berubah,
- `line`: nomor baris kode yang sedang "dieksekusi" (0-based),
- `status`: teks penjelasan langkah (Bahasa Indonesia, gaya seperti trace di modul),
- field spesifik materi (mis. `keyId`, `activeId`, `visited`, `queue`, `output`).

Generator step ditulis sebagai **fungsi murni**: `buildXxxSteps(input): Step[]`.
Lihat contoh: `insertion-sort/insertionSort.ts` dan `binary-tree-traversal/traversal.ts`.

> **Akurasi:** kalau modul menyediakan tabel trace / hasil yang diharapkan
> (mis. "Hasil Preorder: 1 2 4 5 3 6 7"), cocokkan output generator dengan itu.

---

## 5. Konvensi Tampilan (WAJIB konsisten)

### Canvas 9:16
- Semua konten yang **terekam** dibungkus `<MaterialStage>` → otomatis jadi canvas
  desain **1080×1920**, di-`scale` agar pas di layar, dan **Watermark ikut otomatis**.
- **Ukuran konten pakai px tetap** (mis. `fontSize: 72`, `width: 720`), **bukan**
  `vw`/`clamp()`/`rem`. Sebab seluruh canvas sudah di-scale; px menjaga proporsi.
- Layout materi = kolom vertikal: `paddingTop ~100`, `paddingBottom ~140`, `gap` antar
  bagian. Urutan umum: **TitleBlock → visual utama → (struktur bantu) → output →
  status → CodeBlock → step counter**.

### Kontrol di LUAR canvas
- Panel kontrol **tidak** boleh di dalam `<MaterialStage>` (biar frame rekaman bersih).
- Letakkan sebagai sibling: `<div className="fixed bottom-4 left-4 z-50 w-[…]">`.

### Tema & palet — "Editorial Paper" (light)

**Sumber warna tunggal: [`src/shared/theme.ts`](src/shared/theme.ts).** Jangan hardcode
hex baru di komponen — impor dari sini. Latar = kertas hangat (`#FAF7F2`), aksen =
amber (`#D97706`), teks = ink (`#211C16`). Judul pakai **font serif** (`font-serif`,
Fraunces); angka & kode **mono**; prosa **sans**.

Untuk warna state node/kotak, pakai objek `NODE` (semantik) dan petakan state lokal:

| Makna semantik | Token | Dipakai untuk |
|----------------|-------|---------------|
| `NODE.active` (amber) | aktif / key / pointer | elemen yang sedang diproses |
| `NODE.done` (hijau) | selesai / terurut / dikunjungi | hasil/visited |
| `NODE.info` (biru) | dibandingkan / di queue | highlight sekunder |
| `NODE.idle` (kertas) | belum tersentuh | default |

Edge pohon pakai `EDGE.idle/done/active`. **Tidak ada glow neon** — gunakan
**bayangan halus** (sudah ada di `theme.ts` tiap state). Chrome berbasis class
(Controls, menu, status) pakai utility Tailwind `stone-*` (netral) + `amber-*` (aksen).

### Animasi
- Spring halus untuk geser posisi: `{ type: 'spring', stiffness: 300, damping: 30 }`.
- Elemen yang berpindah posisi pakai prop **`layout`** + key = id stabil.
- Highlight baris kode pakai `layoutId="code-highlight"` (sudah di `CodeBlock`).
- Perubahan warna/opacity beranimasi (`duration ~0.25`).

### Suara (opsional tapi disukai)
Pakai `src/audio/sounds.ts`: `ensureAudio()` (panggil dari klik user), `setMuted`,
`playCompare`, `playShift`, `playInsert`, `playDone`. Picu di `useEffect` yang
mengamati `index`, dengan `useRef` penjaga agar tidak dobel (StrictMode).

---

## 6. Komponen Shared (pakai ini, jangan bikin ulang)

- **`MaterialStage`** — `<MaterialStage>{children}</MaterialStage>`. Canvas + watermark.
- **`TitleBlock`** — `title`, `subtitle?`, `badges?: {label,value,color}[]`.
- **`CodeBlock`** — `filename`, `source: string[]`, `activeLine`, `width?`, `fontSize?`.
- **`Watermark`** — otomatis via MaterialStage; ubah teks di konstanta `INSTAGRAM` /
  `WEBSITE` di dalam file-nya.

---

## 7. Resep Menambah Materi Baru (langkah demi langkah)

1. **Baca materi** (`materi-baru.md`). Identifikasi **SATU konsep paling visual** —
   yaitu proses dengan langkah-langkah diskret dan keadaan yang berubah (sorting,
   traversal, pencarian, operasi struktur data, simulasi antrian/penjadwalan, dll).
   Modul biasanya luas; **pilih bagian yang paling cocok dianimasikan**, jangan paksa
   semua. Kalau ragu antar beberapa kandidat, tanyakan ke user.
2. Tentukan **MK** (folder course) dan `material-id` (kebab-case), buat folder
   `src/materials/<course>/<material-id>/`.
3. Tulis **model data + generator step** (fungsi murni `buildXxxSteps`). Definisikan
   tipe `Step` yang memuat snapshot + `line` + `status` + field khusus. Pakai id stabil.
4. Tulis **komponen visual** (ukuran px), dan **sumber kode Python** untuk `CodeBlock`
   (array string; petakan indeks baris ke field `line`).
5. Tulis **`<Nama>Material.tsx`** mengikuti template di bawah.
6. **Daftarkan** di `src/materials/registry.ts` (lihat §8).
7. `npm run build` sampai lolos, lalu `npm run dev` untuk cek visual.

---

## 8. Mendaftarkan Materi di `registry.ts`

```ts
import NamaMaterial from './data-structure/<material-id>/NamaMaterial'
// ...di dalam course yang sesuai, tambahkan ke `materials`:
{
  id: '<material-id>',
  title: 'Judul Tampil',
  subtitle: 'Kategori · deskripsi singkat',
  status: 'ready',          // 'soon' = kartu nonaktif "Segera"
  component: NamaMaterial,
}
```

---

## 9. Template Skeleton `<Nama>Material.tsx`

Salin pola ini (sesuaikan field step & visual). Mengikuti `InsertionSortMaterial.tsx`
dan `BinaryTreeTraversalMaterial.tsx`.

```tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MaterialStage from '../../../shared/MaterialStage'
import TitleBlock from '../../../shared/TitleBlock'
import CodeBlock from '../../../shared/CodeBlock'
import { buildXxxSteps, CODE_SOURCE } from './xxx'
import { ensureAudio, setMuted, playShift, playCompare, playDone } from '../../../audio/sounds'

const BASE_DELAY_MS = 800
const BADGES = [
  { label: 'TIME', value: 'O(?)', color: '#3b82f6' },
  { label: 'SPACE', value: 'O(?)', color: '#a855f7' },
]

export default function XxxMaterial() {
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [soundOn, setSoundOn] = useState(true)

  const steps = useMemo(() => buildXxxSteps(/* input */), [])
  const atEnd = index >= steps.length - 1
  const step = steps[Math.min(index, steps.length - 1)]

  // Suara — picu berdasarkan perubahan antar step (ref penjaga anti-dobel).
  const lastSounded = useRef('')
  useEffect(() => {
    if (!soundOn) return
    const key = String(index)
    if (lastSounded.current === key) return
    lastSounded.current = key
    if (index === 0) return
    // contoh: if (tumbuh output) playShift(...); else if (atEnd) playDone(); else playCompare(...)
  }, [index, soundOn, step, steps])

  // Autoplay.
  const timer = useRef<number | null>(null)
  useEffect(() => {
    if (!isPlaying) return
    if (atEnd) { setIsPlaying(false); return }
    timer.current = window.setTimeout(() => setIndex((i) => Math.min(i + 1, steps.length - 1)), BASE_DELAY_MS / speed)
    return () => { if (timer.current) window.clearTimeout(timer.current) }
  }, [isPlaying, index, atEnd, speed, steps.length])

  useEffect(() => setMuted(!soundOn), [soundOn])

  const handlePlayPause = useCallback(() => {
    ensureAudio()
    if (atEnd) { setIndex(0); setIsPlaying(true); return }
    setIsPlaying((p) => !p)
  }, [atEnd])
  const handleStep = useCallback(() => { ensureAudio(); setIsPlaying(false); setIndex((i) => Math.min(i + 1, steps.length - 1)) }, [steps.length])
  const handleReset = useCallback(() => { setIsPlaying(false); setIndex(0) }, [])

  // Keyboard: Space / → / R
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return
      if (e.code === 'Space') { e.preventDefault(); handlePlayPause() }
      else if (e.code === 'ArrowRight') handleStep()
      else if (e.key.toLowerCase() === 'r') handleReset()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handlePlayPause, handleStep, handleReset])

  return (
    <>
      <MaterialStage>
        <div className="flex h-full w-full flex-col items-center" style={{ paddingTop: 100, paddingBottom: 140, gap: 36 }}>
          <TitleBlock title="JUDUL MATERI" subtitle="deskripsi" badges={BADGES} />
          {/* ...komponen visual yang membaca `step`... */}
          <CodeBlock filename="algo.py" source={CODE_SOURCE} activeLine={step.line} />
          <div className="font-mono text-neutral-600" style={{ fontSize: 22 }}>
            step {Math.min(index + 1, steps.length)} / {steps.length}
          </div>
        </div>
      </MaterialStage>

      {/* Kontrol DI LUAR canvas */}
      <div className="fixed bottom-4 left-4 z-50 w-[340px] max-w-[90vw]">
        {/* <Controls ... /> — Play/Pause, Step, Reset, Speed, Sound (+ opsi materi) */}
      </div>
    </>
  )
}
```

---

## 10. Checklist Selesai

- [ ] Memilih satu konsep yang tepat dari materi (bukan memaksa seluruh modul).
- [ ] Generator step = fungsi murni; output cocok dengan trace/hasil di modul.
- [ ] Pakai `MaterialStage`, `TitleBlock`, `CodeBlock` (tidak duplikasi).
- [ ] Ukuran konten px tetap; palet & animasi sesuai §5.
- [ ] Kontrol di luar canvas; Play/Pause/Step/Reset/Speed/Sound berfungsi.
- [ ] Terdaftar di `registry.ts` dengan `status: 'ready'`.
- [ ] `npm run build` lolos; `npm run dev` tampil benar di frame 9:16.
- [ ] Tidak ada file sampah baru yang ter-commit (lihat `.gitignore`).

---

## 11. Catatan Lain

- **Watermark** (IG `@aidilsaputrakirsan`, web `myst-tech.com`) sudah otomatis di
  setiap materi via `MaterialStage`. Ubah di `src/shared/Watermark.tsx`.
- **Badge kompleksitas** saat ini statis per materi. Boleh dibuat dinamis bila relevan.
- Mode tampilan **default 9:16**; tidak ada mode landscape.
- Bahasa: **UI/teks status → Indonesia**, **kode & nama variabel → Inggris**
  (konsisten dengan kode yang ada).
