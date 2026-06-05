# MK Cloud Computing

Folder materi untuk mata kuliah **Cloud Computing**.

Setiap materi = satu sub-folder berisi minimal satu komponen React yang
di-`export default`. Contoh:

```
cloud-computing/
└── load-balancing/
    └── LoadBalancingMaterial.tsx   // export default function LoadBalancingMaterial() { ... }
```

Lalu daftarkan di `src/materials/registry.ts`:

```ts
import LoadBalancingMaterial from './cloud-computing/load-balancing/LoadBalancingMaterial'
// ...
{ id: 'load-balancing', title: 'Load Balancing', subtitle: '...', status: 'ready', component: LoadBalancingMaterial }
```

Manfaatkan komponen shared di `src/shared/`:

- `MaterialStage` — background gelap + frame 9:16 + watermark (otomatis).
- `TitleBlock` — judul, subjudul, badge.
- `Watermark` — branding (sudah ikut via `MaterialStage`).
- Audio synth di `src/audio/sounds.ts`.
