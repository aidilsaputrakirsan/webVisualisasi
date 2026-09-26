import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import Stage3D, { useLive } from '../../how-it-works/kit/Stage3D'
import { WORLD } from '../../how-it-works/kit/palette'
import { NODE, theme } from '../../../shared/theme'
import type { Vec3 } from '../../how-it-works/kit/geo'
import { HOOK_S, N, START, finishS, tickAt, type Lane, type Timeline } from './race'

/** Shared playback clock (seconds of timeline), advanced by the material. */
export interface Clock {
  t: number
}

const BAR_W = 0.16
const BAR_GAP = 0.205
const MAX_H = 1.75
const LANE_GAP = 2.75
const WIDTH = (N - 1) * BAR_GAP

const laneY = (i: number) => (3 - i) * LANE_GAP
const barX = (i: number) => -WIDTH / 2 + i * BAR_GAP

const LOW = new THREE.Color('#FBE3C0')
const HIGH = new THREE.Color(theme.accentDeep)
const CMP = new THREE.Color(WORLD.ink)
const DONE = new THREE.Color(NODE.done.border)

const ORDINAL = ['1st', '2nd', '3rd', '4th']

function LaneBars({ lane, index, rank, clock }: { lane: Lane; index: number; rank: number; clock: MutableRefObject<Clock> }) {
  const mesh = useRef<THREE.InstancedMesh>(null!)
  const counter = useRef<HTMLDivElement>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])
  const y0 = laneY(index)
  const doneAt = HOOK_S + finishS(lane)

  useFrame(() => {
    const t = clock.current.t
    const tick = Math.min(tickAt(t), lane.frames.length - 1)
    const racing = t >= HOOK_S
    const frame = racing ? lane.frames[tick] : { v: START, a: -1, b: -1 }
    const finished = t >= doneAt
    // Green sweep across the lane once it's sorted.
    const sweep = finished ? Math.min(N, (t - doneAt) * N * 2.2) : 0
    for (let i = 0; i < N; i++) {
      const v = frame.v[i]
      const h = (v / N) * MAX_H
      dummy.position.set(barX(i), y0 + h / 2 + 0.06, 0)
      dummy.scale.set(1, h, 1)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
      if (i < sweep) color.copy(DONE)
      else if (i === frame.a || i === frame.b) color.copy(CMP)
      else color.copy(LOW).lerp(HIGH, v / N)
      mesh.current.setColorAt(i, color)
    }
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true

    const el = counter.current
    if (el) {
      if (finished) {
        el.textContent = `${ORDINAL[rank]} · ${lane.compares} compares`
        el.style.background = rank === 0 ? NODE.done.bg : theme.surface
        el.style.color = rank === 0 ? NODE.done.text : theme.inkSoft
        el.style.borderColor = rank === 0 ? NODE.done.border : theme.lineStrong
      } else {
        el.textContent = `${racing ? tick : 0} compares`
        el.style.background = theme.surface
        el.style.color = theme.ink
        el.style.borderColor = theme.line
      }
    }
  })

  const labelStyle = {
    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    fontSize: 26,
    fontWeight: 700,
    whiteSpace: 'nowrap' as const,
  }

  return (
    <group>
      {/* Paper tray the bars stand on. */}
      <RoundedBox args={[WIDTH + 0.7, 0.12, 0.8]} radius={0.05} smoothness={3} position={[0, y0, 0]} receiveShadow>
        <meshStandardMaterial color={WORLD.tray} roughness={0.7} />
      </RoundedBox>
      <instancedMesh ref={mesh} args={[undefined, undefined, N]} castShadow>
        <boxGeometry args={[BAR_W, 1, 0.42]} />
        <meshStandardMaterial roughness={0.45} />
      </instancedMesh>
      <Html position={[-WIDTH / 2 - 0.2, y0 - 0.22, 0.4]} distanceFactor={26} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{ ...labelStyle, color: theme.ink, transform: 'translate(0, 0)' }}>{lane.label}</div>
      </Html>
      <Html position={[WIDTH / 2 + 0.2, y0 - 0.22, 0.4]} distanceFactor={26} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div
          ref={counter}
          style={{ ...labelStyle, fontSize: 22, fontWeight: 600, border: '2px solid', borderRadius: 999, padding: '3px 12px', transform: 'translate(-100%, 0)' }}
        />
      </Html>
    </group>
  )
}

const CAM: Vec3 = [0.6, laneY(1.5) + 1.6, 22]
const LOOK: Vec3 = [0, laneY(1.5) + 1.2, 0]

export default function Scene({ timeline, clock }: { timeline: Timeline; clock: MutableRefObject<Clock> }) {
  const live = useLive(LOOK)
  const rankOf = (i: number) => timeline.order.indexOf(i)
  return (
    <Stage3D cam={CAM} look={LOOK} live={live} fog={[40, 90]}>
      {timeline.lanes.map((lane, i) => (
        <LaneBars key={lane.algo} lane={lane} index={i} rank={rankOf(i)} clock={clock} />
      ))}
    </Stage3D>
  )
}
