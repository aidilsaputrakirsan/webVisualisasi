import { useMemo } from 'react'
import MaterialStage from '../../../shared/MaterialStage'
import TitleBlock from '../../../shared/TitleBlock'
import CodeBlock from '../../../shared/CodeBlock'
import StatusPill from '../../../shared/StatusPill'
import ControlPanel from '../../../shared/ControlPanel'
import { useChrome } from '../../../shared/chrome'
import { playCompare, playDone, playReturn, playVisit } from '../../../audio/sounds'
import { ACCENT } from '../palette'
import { usePlayback, useStepSound } from '../usePlayback'
import LifecycleView from './LifecycleView'
import { buildSteps, CODE_SOURCE } from './lifecycle'

const BADGES = [
  { label: 'LARAVEL', value: '12.x', color: ACCENT.accent },
  { label: 'TOPIC', value: 'lifecycle', color: '#2563EB' },
]

export default function RequestLifecycleMaterial() {
  const steps = useMemo(() => buildSteps(), [])
  const pb = usePlayback(steps.length)
  const step = steps[Math.min(pb.index, steps.length - 1)]
  const { hidden } = useChrome()

  useStepSound(String(pb.index), pb.soundOn && pb.index > 0, () => {
    switch (step.sound) {
      case 'move':
        playVisit(62)
        break
      case 'hit':
        playCompare(58)
        break
      case 'turn':
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
          style={{ paddingTop: 84, paddingBottom: 120, gap: 22 }}
        >
          <TitleBlock
            title="REQUEST LIFECYCLE"
            subtitle="What actually happens between the browser and your controller"
            badges={BADGES}
          />

          <LifecycleView step={step} />

          <StatusPill text={step.status} />

          <CodeBlock filename="bootstrap/app.php" source={CODE_SOURCE} activeLine={step.line} width={800} fontSize={18} />

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
