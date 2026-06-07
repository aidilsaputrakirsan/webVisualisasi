import { MODES, type Mode } from './arch'

export interface ControlsProps {
  isPlaying: boolean
  atEnd: boolean
  speed: number
  mode: Mode
  soundOn: boolean
  onPlayPause: () => void
  onStep: () => void
  onReset: () => void
  onSpeedChange: (v: number) => void
  onModeChange: (m: Mode) => void
  onToggleSound: () => void
}

const ORDER: Mode[] = ['normal', 'flood']

export default function Controls(props: ControlsProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-card backdrop-blur">
      <div className="grid grid-cols-2 gap-2">
        {ORDER.map((m) => (
          <button
            key={m}
            onClick={() => props.onModeChange(m)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              props.mode === m
                ? 'border border-violet-400 bg-violet-100 text-violet-800'
                : 'border border-stone-200 bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {MODES[m].label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={props.onPlayPause} primary>
          {props.isPlaying ? '⏸ Pause' : props.atEnd ? '↻ Replay' : '▶ Play'}
        </Button>
        <Button onClick={props.onStep} disabled={props.atEnd}>
          ⏭ Step
        </Button>
        <Button onClick={props.onReset}>↺ Reset</Button>
        <Button onClick={props.onToggleSound} active={props.soundOn}>
          {props.soundOn ? '🔊 Sound' : '🔇 Muted'}
        </Button>
      </div>

      <label className="flex items-center gap-3 text-xs text-stone-500">
        <span className="w-14 shrink-0">Speed</span>
        <input
          type="range"
          min={0.25}
          max={3}
          step={0.25}
          value={props.speed}
          onChange={(e) => props.onSpeedChange(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-stone-200 accent-violet-600"
        />
        <span className="w-10 text-right font-mono text-stone-600">{props.speed}×</span>
      </label>
    </div>
  )
}

function Button({
  children,
  onClick,
  disabled,
  primary,
  active,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  primary?: boolean
  active?: boolean
}) {
  const base =
    'rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const look = primary
    ? 'bg-violet-600 text-white hover:bg-violet-500'
    : active
      ? 'bg-violet-100 text-violet-800 border border-violet-400'
      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${look}`}>
      {children}
    </button>
  )
}
