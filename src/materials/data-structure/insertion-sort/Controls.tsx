import { useState } from 'react'

export interface ControlsProps {
  isPlaying: boolean
  atEnd: boolean
  speed: number
  arrayText: string
  soundOn: boolean
  onPlayPause: () => void
  onStep: () => void
  onReset: () => void
  onShuffle: () => void
  onSpeedChange: (v: number) => void
  onApplyArray: (text: string) => void
  onToggleSound: () => void
}

export default function Controls(props: ControlsProps) {
  const [draft, setDraft] = useState(props.arrayText)

  // Keep the local draft in sync when the array is shuffled/reset elsewhere.
  if (draft !== props.arrayText && document.activeElement?.id !== 'array-input') {
    setDraft(props.arrayText)
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={props.onPlayPause} primary>
          {props.isPlaying ? '⏸ Pause' : props.atEnd ? '↻ Replay' : '▶ Play'}
        </Button>
        <Button onClick={props.onStep} disabled={props.atEnd}>
          ⏭ Step
        </Button>
        <Button onClick={props.onReset}>↺ Reset</Button>
        <Button onClick={props.onShuffle}>🎲 Shuffle</Button>
        <Button onClick={props.onToggleSound} active={props.soundOn}>
          {props.soundOn ? '🔊 Sound' : '🔇 Muted'}
        </Button>
      </div>

      <label className="flex items-center gap-3 text-xs text-neutral-400">
        <span className="w-14 shrink-0">Speed</span>
        <input
          type="range"
          min={0.25}
          max={3}
          step={0.25}
          value={props.speed}
          onChange={(e) => props.onSpeedChange(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-neutral-700 accent-blue-500"
        />
        <span className="w-10 text-right font-mono text-neutral-300">{props.speed}×</span>
      </label>

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          props.onApplyArray(draft)
        }}
      >
        <input
          id="array-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. 5,2,8,1,9"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-sm text-neutral-200 outline-none focus:border-blue-500"
        />
        <Button type="submit">Apply</Button>
      </form>
    </div>
  )
}

function Button({
  children,
  onClick,
  disabled,
  primary,
  active,
  type = 'button',
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  primary?: boolean
  active?: boolean
  type?: 'button' | 'submit'
}) {
  const base =
    'rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const look = primary
    ? 'bg-blue-600 text-white hover:bg-blue-500'
    : active
      ? 'bg-purple-600/30 text-purple-200 border border-purple-500/60'
      : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${look}`}>
      {children}
    </button>
  )
}
