import { useState } from 'react'
import { COURSES, findMaterial, type Course, type Material } from './materials/registry'
import Watermark from './shared/Watermark'

interface Selection {
  courseId: string
  materialId: string
}

export default function App() {
  const [selection, setSelection] = useState<Selection | null>(null)

  const material = selection ? findMaterial(selection.courseId, selection.materialId) : undefined

  if (material?.component) {
    const MaterialComponent = material.component
    return (
      <div className="stage-bg min-h-screen w-full">
        <button
          onClick={() => setSelection(null)}
          className="fixed left-4 top-4 z-50 rounded-lg border border-neutral-700 bg-neutral-900/80 px-3 py-2 text-sm text-neutral-300 backdrop-blur transition-colors hover:bg-neutral-800"
        >
          ← Materi
        </button>
        <MaterialComponent />
      </div>
    )
  }

  return <Home onPick={(courseId, materialId) => setSelection({ courseId, materialId })} />
}

function Home({ onPick }: { onPick: (courseId: string, materialId: string) => void }) {
  return (
    <div className="stage-bg relative min-h-screen w-full">
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-16">
        <header className="text-center select-none">
          <h1
            className="font-bold text-white"
            style={{ letterSpacing: '0.3em', fontSize: 'clamp(1.5rem, 4vw, 2.6rem)' }}
          >
            MATERI PRESENTASI
          </h1>
          <p className="mt-3 text-sm text-neutral-400">
            Visualisasi animatif untuk bahan ajar — pilih materi untuk mulai
          </p>
        </header>

        {COURSES.map((course) => (
          <CourseSection key={course.id} course={course} onPick={onPick} />
        ))}
      </div>
      <Watermark />
    </div>
  )
}

function CourseSection({
  course,
  onPick,
}: {
  course: Course
  onPick: (courseId: string, materialId: string) => void
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span
          className="rounded-md px-2 py-0.5 font-mono text-xs font-semibold"
          style={{ background: `${course.accent}22`, color: course.accent }}
        >
          {course.code}
        </span>
        <h2 className="text-lg font-semibold tracking-wide text-neutral-200">{course.name}</h2>
        <span className="h-px flex-1 bg-neutral-800" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {course.materials.map((m) => (
          <MaterialCard
            key={m.id}
            material={m}
            accent={course.accent}
            onClick={() => m.status === 'ready' && onPick(course.id, m.id)}
          />
        ))}
      </div>
    </section>
  )
}

function MaterialCard({
  material,
  accent,
  onClick,
}: {
  material: Material
  accent: string
  onClick: () => void
}) {
  const ready = material.status === 'ready'
  return (
    <button
      onClick={onClick}
      disabled={!ready}
      className={`group relative flex flex-col items-start gap-2 overflow-hidden rounded-2xl border p-5 text-left transition-all ${
        ready
          ? 'cursor-pointer border-neutral-800 bg-neutral-900/60 hover:-translate-y-0.5 hover:border-neutral-600'
          : 'cursor-not-allowed border-neutral-900 bg-neutral-950/40 opacity-60'
      }`}
      style={ready ? { boxShadow: `inset 0 0 0 1px ${accent}10` } : undefined}
    >
      {ready && (
        <span
          className="absolute inset-x-0 top-0 h-0.5 opacity-0 transition-opacity group-hover:opacity-100"
          style={{ background: accent, boxShadow: `0 0 12px ${accent}` }}
        />
      )}
      <div className="flex w-full items-center justify-between">
        <h3 className="font-semibold text-neutral-100">{material.title}</h3>
        {ready ? (
          <span className="text-lg" style={{ color: accent }}>
            ▶
          </span>
        ) : (
          <span className="rounded-full border border-neutral-700 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-neutral-500">
            Segera
          </span>
        )}
      </div>
      <p className="text-sm text-neutral-400">{material.subtitle}</p>
    </button>
  )
}
