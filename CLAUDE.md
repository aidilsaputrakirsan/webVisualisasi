# CLAUDE.md

Project ini membuat **visualisasi materi ajar** dengan tema **"Editorial Paper"**
(light: kertas hangat + aksen amber + judul serif, canvas 9:16, untuk direkam jadi
video). Warna terpusat di `src/shared/theme.ts`. Materi dikelompokkan per mata kuliah
di `src/materials/<course>/<material-id>/`.

## Alur kerja utama

Saat user memberi materi baru (biasanya di `materi-baru.md` atau file lain yang
ditunjuk), buat **satu visualisasi animatif** baru yang konsisten dengan materi yang
sudah ada (Insertion Sort, Binary Tree Traversal).

**WAJIB baca [SKILLS.md](SKILLS.md) lebih dulu** — di sana ada konvensi lengkap:
pola "precompute steps", struktur folder, komponen shared (`MaterialStage`,
`TitleBlock`, `CodeBlock`), palet warna/animasi, template komponen materi, cara
mendaftar di `registry.ts`, dan checklist.

## Perintah

```bash
npm run dev      # preview di http://localhost:5173
npm run build    # tsc --noEmit && vite build — harus lolos sebelum selesai
```

## Prinsip yang tidak boleh dilanggar

- Precompute seluruh langkah jadi `Step[]`, animasi tinggal memutarnya.
- Konten di dalam `MaterialStage` pakai ukuran **px tetap** (bukan vw/clamp).
- Kontrol diletakkan **di luar** `MaterialStage` (frame rekaman harus bersih).
- Pakai komponen di `src/shared/` — jangan duplikasi.
- Semua teks penonton (UI, status, story, judul) **Bahasa Inggris**; kode & variabel juga Bahasa Inggris. (Materi baru full English; materi lama dikonversi saat disentuh.)
