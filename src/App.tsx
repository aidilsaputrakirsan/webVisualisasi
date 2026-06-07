import { useState } from 'react'
import { COURSES, findMaterial, type Course, type Material } from './materials/registry'
import Watermark from './shared/Watermark'
import { ChromeProvider, useChrome } from './shared/chrome'
import { CourseThemeProvider } from './shared/courseTheme'

interface Selection {
  courseId: string
  materialId: string
}

export default function App() {
  const [selection, setSelection] = useState<Selection | null>(null)

  const material = selection ? findMaterial(selection.courseId, selection.materialId) : undefined

  if (material?.component && selection) {
    const MaterialComponent = material.component
    return (
      <CourseThemeProvider courseId={selection.courseId}>
        <ChromeProvider>
          <div className="min-h-screen w-full">
            <BackButton onBack={() => setSelection(null)} />
            <MaterialComponent />
            <ChromeToggle />
          </div>
        </ChromeProvider>
      </CourseThemeProvider>
    )
  }

  return <Home onPick={(courseId, materialId) => setSelection({ courseId, materialId })} />
}

/** Top-left "back to menu" button — hidden when chrome is hidden for recording. */
function BackButton({ onBack }: { onBack: () => void }) {
  const { hidden } = useChrome()
  if (hidden) return null
  return (
    <button
      onClick={onBack}
      className="fixed left-4 top-4 z-50 rounded-lg border border-stone-300 bg-white/85 px-3 py-2 text-sm text-stone-600 shadow-card backdrop-blur transition-colors hover:bg-white"
    >
      ← Materi
    </button>
  )
}

/** Small always-visible toggle to hide/show all UI for a clean recording. */
function ChromeToggle() {
  const { hidden, toggle } = useChrome()
  return (
    <button
      onClick={toggle}
      title={hidden ? 'Tampilkan kontrol' : 'Sembunyikan UI'}
      className="fixed bottom-2 right-2 z-[60] flex h-9 w-9 items-center justify-center rounded-full border border-stone-300/70 bg-white/40 text-sm text-stone-500 opacity-50 backdrop-blur transition hover:bg-white hover:text-stone-800 hover:opacity-100"
    >
      {hidden ? '☰' : '✕'}
    </button>
  )
}

function Home({ onPick }: { onPick: (courseId: string, materialId: string) => void }) {
  return (
    <div className="stage-bg relative min-h-screen w-full">
      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-16">
        <header className="text-center select-none">
          <h1
            className="font-serif font-semibold text-stone-900"
            style={{ letterSpacing: '0.04em', fontSize: 'clamp(1.8rem, 4.5vw, 3rem)' }}
          >
            Materi Presentasi
          </h1>
          <p className="mt-3 text-sm text-stone-500">
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
        <h2 className="font-serif text-xl font-semibold tracking-wide text-stone-800">{course.name}</h2>
        <span className="h-px flex-1 bg-stone-200" />
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
          ? 'cursor-pointer border-stone-200 bg-white shadow-card hover:-translate-y-0.5 hover:border-amber-300'
          : 'cursor-not-allowed border-stone-200 bg-stone-100/60 opacity-70'
      }`}
    >
      {ready && (
        <span
          className="absolute inset-x-0 top-0 h-1 opacity-0 transition-opacity group-hover:opacity-100"
          style={{ background: accent }}
        />
      )}
      <div className="flex w-full items-center justify-between">
        <h3 className="font-serif text-lg font-semibold text-stone-800">{material.title}</h3>
        {ready ? (
          <span className="text-lg" style={{ color: accent }}>
            ▶
          </span>
        ) : (
          <span className="rounded-full border border-stone-300 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-stone-400">
            Segera
          </span>
        )}
      </div>
      <p className="text-sm text-stone-500">{material.subtitle}</p>
    </button>
  )
}
