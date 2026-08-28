import { useMemo, useState } from 'react'
import MaterialStage from '../../../shared/MaterialStage'
import TitleBlock from '../../../shared/TitleBlock'
import CodeBlock from '../../../shared/CodeBlock'
import StatusPill from '../../../shared/StatusPill'
import ControlPanel, { ModeButton } from '../../../shared/ControlPanel'
import { useChrome } from '../../../shared/chrome'
import { ensureAudio, playCompare, playDone, playReturn, playVisit } from '../../../audio/sounds'
import { ACCENT } from '../palette'
import { usePlayback, useStepSound } from '../usePlayback'
import RoutingView from './RoutingView'
import { buildSteps, CODE_SOURCE, MODES, type Mode } from './routing'

const ORDER: Mode[] = ['pass', 'blocked']

export default function RoutingMiddlewareMaterial() {
  const [mode, setMode] = useState<Mode>('pass')
  const steps = useMemo(() => buildSteps(mode), [mode])
  const pb = usePlayback(steps.length, mode)
  const step = steps[Math.min(pb.index, steps.length - 1)]
  const { hidden } = useChrome()

  const badges = [
    { label: 'LARAVEL', value: '12.x', color: ACCENT.accent },
    {
      label: 'RESULT',
      value: step.responseCode ?? 'pending',
      color: mode === 'blocked' ? '#DC2626' : '#15803D',
    },
  ]

  useStepSound(`${mode}:${pb.index}`, pb.soundOn && pb.index > 0, () => {
    switch (step.sound) {
      case 'test':
        playCompare(52)
        break
      case 'match':
      case 'enter':
        playVisit(64)
        break
      case 'exit':
        playCompare(70)
        break
      case 'block':
        playReturn()
        break
      case 'done':
        playDone()
        break
    }
  })

  return (
    <>
      <MaterialStage>
        <div
          className="flex h-full w-full flex-col items-center"
          style={{ paddingTop: 80, paddingBottom: 110, gap: 18 }}
        >
          <TitleBlock title="ROUTING & MIDDLEWARE" subtitle={MODES[mode].desc} badges={badges} />

          <RoutingView step={step} />

          <StatusPill text={step.status} />

          <CodeBlock filename="routes/web.php" source={CODE_SOURCE} activeLine={step.line} width={880} fontSize={17} />

          <div className="font-mono text-stone-400" style={{ fontSize: 22 }}>
            step {Math.min(pb.index + 1, steps.length)} / {steps.length}
          </div>
        </div>
      </MaterialStage>

      <div className={`fixed bottom-4 left-4 z-50 w-[340px] max-w-[90vw] ${hidden ? 'hidden' : ''}`}>
        <ControlPanel
          isPlaying={pb.isPlaying}
          atEnd={pb.atEnd}
          speed={pb.speed}
          soundOn={pb.soundOn}
          onPlayPause={pb.onPlayPause}
          onStep={pb.onStep}
          onReset={pb.onReset}
          onSpeedChange={pb.setSpeed}
          onToggleSound={pb.onToggleSound}
        >
          <div className="grid grid-cols-2 gap-2">
            {ORDER.map((m) => (
              <ModeButton
                key={m}
                label={MODES[m].label}
                active={mode === m}
                onClick={() => {
                  ensureAudio()
                  setMode(m)
                }}
              />
            ))}
          </div>
        </ControlPanel>
      </div>
    </>
  )
}
