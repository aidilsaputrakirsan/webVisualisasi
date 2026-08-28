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
import MvcView from './MvcView'
import { buildSteps, CODE_SOURCE } from './mvc'

const BADGES = [
  { label: 'LARAVEL', value: '12.x', color: ACCENT.accent },
  { label: 'PATTERN', value: 'MVC', color: '#2563EB' },
]

export default function MvcFlowMaterial() {
  const steps = useMemo(() => buildSteps(), [])
  const pb = usePlayback(steps.length)
  const step = steps[Math.min(pb.index, steps.length - 1)]
  const { hidden } = useChrome()

  useStepSound(String(pb.index), pb.soundOn && pb.index > 0, () => {
    switch (step.sound) {
      case 'move':
        playVisit(62)
        break
      case 'query':
        playCompare(58)
        break
      case 'render':
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
          style={{ paddingTop: 88, paddingBottom: 120, gap: 26 }}
        >
          <TitleBlock
            title="MVC IN ONE REQUEST"
            subtitle="Follow the value, not the folders — from URI to rendered HTML"
            badges={BADGES}
          />

          <MvcView step={step} />

          <StatusPill text={step.status} />

          <CodeBlock filename="PostController.php" source={CODE_SOURCE} activeLine={step.line} width={880} fontSize={19} />

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
