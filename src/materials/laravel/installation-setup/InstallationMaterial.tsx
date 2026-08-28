import { useMemo } from 'react'
import MaterialStage from '../../../shared/MaterialStage'
import TitleBlock from '../../../shared/TitleBlock'
import CodeBlock from '../../../shared/CodeBlock'
import StatusPill from '../../../shared/StatusPill'
import ControlPanel from '../../../shared/ControlPanel'
import { useChrome } from '../../../shared/chrome'
import { playCompare, playDone, playEnqueue, playVisit } from '../../../audio/sounds'
import { ACCENT } from '../palette'
import { usePlayback, useStepSound } from '../usePlayback'
import InstallView from './InstallView'
import { buildSteps, CODE_SOURCE } from './install'

const BADGES = [
  { label: 'LARAVEL', value: '12.x', color: ACCENT.accent },
  { label: 'PHP', value: '8.2 - 8.5', color: '#2563EB' },
]

export default function InstallationMaterial() {
  const steps = useMemo(() => buildSteps(), [])
  const pb = usePlayback(steps.length)
  const step = steps[Math.min(pb.index, steps.length - 1)]
  const { hidden } = useChrome()

  useStepSound(String(pb.index), pb.soundOn && pb.index > 0, () => {
    switch (step.sound) {
      case 'type':
        playCompare(56)
        break
      case 'create':
        playVisit(64)
        break
      case 'boot':
        playEnqueue(70)
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
          style={{ paddingTop: 76, paddingBottom: 110, gap: 18 }}
        >
          <TitleBlock
            title="INSTALL LARAVEL 12"
            subtitle="One installer, one scaffold command, three dev processes"
            badges={BADGES}
          />

          <InstallView step={step} />

          <StatusPill text={step.status} />

          <CodeBlock filename="terminal.sh" source={CODE_SOURCE} activeLine={step.line} width={880} fontSize={17} />

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
        />
      </div>
    </>
  )
}
