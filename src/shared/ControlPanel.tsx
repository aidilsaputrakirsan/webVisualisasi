import type { ReactNode } from 'react'
import {
  BookIcon,
  CodeIcon,
  PauseIcon,
  PlayIcon,
  ResetIcon,
  SoundOffIcon,
  SoundOnIcon,
  StepIcon,
} from './Icons'

export type ViewMode = 'story' | 'code'

export interface ControlPanelProps {
  isPlaying: boolean
  atEnd: boolean
  speed: number
  soundOn: boolean
  onPlayPause: () => void
  onStep: () => void
  onReset: () => void
  onSpeedChange: (v: number) => void
  onToggleSound: () => void
  /** Bila diberikan, tampilkan toggle tampilan Cerita / Kode. */
  view?: ViewMode
  onViewChange?: (v: ViewMode) => void
  /** Slot baris atas untuk tombol mode spesifik materi (pakai <ModeButton>). */
  children?: ReactNode
}

/**
 * Panel kontrol pemutaran bersama (di LUAR MaterialStage): Play/Pause, Step,
 * Reset, Sound, Speed + toggle Cerita/Kode opsional. Tombol mode per materi
 * dioper lewat `children`.
 */
export default function ControlPanel(props: ControlPanelProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-card backdrop-blur">
      {props.children}

      {props.view && props.onViewChange && (
        <div className="grid grid-cols-2 gap-2">
          {(['story', 'code'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => props.onViewChange!(v)}
              className={`flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
                props.view === v
                  ? 'border border-amber-400 bg-amber-100 text-amber-800'
                  : 'border border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {v === 'story' ? <BookIcon size={15} /> : <CodeIcon size={15} />}
              {v === 'story' ? 'Cerita' : 'Kode'}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={props.onPlayPause} primary>
          {props.isPlaying ? <PauseIcon /> : props.atEnd ? <ResetIcon /> : <PlayIcon />}
          {props.isPlaying ? 'Pause' : props.atEnd ? 'Replay' : 'Play'}
        </Button>
        <Button onClick={props.onStep} disabled={props.atEnd}>
          <StepIcon />
          Step
        </Button>
        <Button onClick={props.onReset}>
          <ResetIcon />
          Reset
        </Button>
        <Button onClick={props.onToggleSound} active={props.soundOn}>
          {props.soundOn ? <SoundOnIcon /> : <SoundOffIcon />}
          {props.soundOn ? 'Sound' : 'Muted'}
        </Button>
      </div>

      <label className="flex items-center gap-3 text-xs text-stone-500">
        <span className="w-14 shrink-0">Speed</span>
        <input
          type="range"
          min={0.25}
          max={4}
          step={0.25}
          value={props.speed}
          onChange={(e) => props.onSpeedChange(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-teal-600"
        />
        <span className="w-10 text-right font-mono text-stone-600">{props.speed}×</span>
      </label>
    </div>
  )
}

/** Tombol pilihan mode (baris atas) — aktif memakai aksen teal. */
export function ModeButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border border-teal-400 bg-teal-100 text-teal-800'
          : 'border border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200'
      }`}
    >
      {label}
    </button>
  )
}

function Button({
  children,
  onClick,
  disabled,
  primary,
  active,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  primary?: boolean
  active?: boolean
}) {
  const base =
    'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const look = primary
    ? 'bg-teal-600 text-white hover:bg-teal-500'
    : active
      ? 'bg-teal-100 text-teal-800 border border-teal-400'
      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${look}`}>
      {children}
    </button>
  )
}
