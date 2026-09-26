import { useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { useStageScale } from '../../../shared/MaterialStage'
import { CameraRig, Lights, type Live } from './world'
import type { Vec3 } from './geo'
import { WORLD } from './palette'

/** Creates the live chase-cam target once per scene. */
export function useLive(start: Vec3): Live {
  const [live] = useState<Live>(() => ({ pos: new THREE.Vector3(...start), s: 0 }))
  return live
}

/**
 * Full-bleed 3D canvas for a "How It Works" reel: camera rig, lights, fog and
 * a render resolution matched to the size the canvas is actually shown.
 *
 * Why the dpr maths: the canvas is laid out at the 1080×1920 design size and
 * scaled down by MaterialStage, so a plain dpr renders design px × device
 * pixel ratio — on a phone ~4× the pixels on screen, which stuttered once
 * screen recording shared the GPU. PerformanceMonitor trims it further if the
 * frame rate keeps dropping.
 */
export default function Stage3D({
  cam,
  look,
  follow,
  live,
  fog = [22, 58],
  children,
}: {
  cam: Vec3
  look: Vec3
  follow?: Vec3
  live: Live
  /** Fog [near, far]; widen it for episodes with far-away high shots. */
  fog?: [number, number]
  children: ReactNode
}) {
  const stageScale = useStageScale()
  const [perf, setPerf] = useState(1)
  const dpr = Math.max(0.5, Math.min(2, window.devicePixelRatio * stageScale * perf))
  return (
    <Canvas
      shadows
      flat
      dpr={dpr}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: cam, fov: 50, near: 0.1, far: 140 }}
      // MaterialStage scales the canvas with a CSS transform; measure via
      // offsetWidth/Height so R3F isn't fooled into a tiny viewport.
      resize={{ offsetSize: true }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      <PerformanceMonitor onDecline={() => setPerf(0.7)} onIncline={() => setPerf(1)} flipflops={3} onFallback={() => setPerf(0.7)} />
      <fog attach="fog" args={[WORLD.paper, fog[0], fog[1]]} />
      <Lights />
      <CameraRig cam={cam} look={look} follow={follow} live={live} />
      {children}
    </Canvas>
  )
}
