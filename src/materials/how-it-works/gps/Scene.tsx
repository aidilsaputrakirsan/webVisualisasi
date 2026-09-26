import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { DATACENTER, PHONE_A, PHONE_B, TOWER_A, TOWER_B, type Vec3 } from '../kit/geo'
import { CanvasScreen, Cable, DataCenter, Landscape, Phone, Pin, SANS, TEX_H, TEX_W, Tag, Tower, ease, easeInOut, screenBase } from '../kit/world'
import Stage3D, { useLive } from '../kit/Stage3D'
import { WORLD } from '../kit/palette'
import { DRIFT_TO, SATS, YOU, crossings, ringOf, shellRadius, type Sat, type Screen, type Step } from './story'

const SAT_COLORS = [WORLD.sat1, WORLD.sat2, WORLD.sat3, WORLD.sat4]
const colorOf = (s: Sat) => SAT_COLORS[s.id - 1]

// ── Phone map screen ────────────────────────────────────────────────────────

function drawMap(g: CanvasRenderingContext2D, t: number, screen: Screen) {
  screenBase(g, '#F3EEE3')
  // Park, river and roads.
  g.fillStyle = '#CFE3C0'
  g.beginPath()
  g.roundRect(40, 250, 150, 170, 18)
  g.fill()
  g.strokeStyle = '#A9CFE6'
  g.lineWidth = 34
  g.lineCap = 'round'
  g.beginPath()
  g.moveTo(-20, 640)
  g.bezierCurveTo(140, 560, 260, 720, 460, 600)
  g.stroke()
  g.strokeStyle = '#FFFFFF'
  g.lineWidth = 18
  for (const [x0, y0, x1, y1] of [
    [-10, 480, 440, 420],
    [250, 130, 300, 830],
    [-10, 200, 440, 290],
    [90, 130, 130, 830],
  ]) {
    g.beginPath()
    g.moveTo(x0, y0)
    g.lineTo(x1, y1)
    g.stroke()
  }

  // Search bar.
  g.fillStyle = '#FFFFFF'
  g.beginPath()
  g.roundRect(24, 50, TEX_W - 48, 64, 32)
  g.fill()
  g.fillStyle = WORLD.inkSoft
  g.font = `500 26px ${SANS}`
  g.textBaseline = 'middle'
  g.fillText('Search here', 60, 83)

  const cx = 262
  const cy = 452
  if (screen === 'searching') {
    // Big uncertain blob + spinner.
    g.fillStyle = 'rgba(120,120,120,0.16)'
    g.beginPath()
    g.arc(cx - 40, cy + 10, 150, 0, Math.PI * 2)
    g.fill()
    g.lineWidth = 9
    g.strokeStyle = 'rgba(0,0,0,0.12)'
    g.beginPath()
    g.arc(TEX_W / 2, TEX_H - 120, 30, 0, Math.PI * 2)
    g.stroke()
    g.strokeStyle = WORLD.info
    g.beginPath()
    g.arc(TEX_W / 2, TEX_H - 120, 30, t * 6, t * 6 + Math.PI * 0.6)
    g.stroke()
    g.fillStyle = WORLD.ink
    g.font = `600 28px ${SANS}`
    g.textAlign = 'center'
    g.fillText('Locating…', TEX_W / 2, TEX_H - 60)
    return
  }
  // Blue dot with a pulsing accuracy ring.
  const pulse = (t * 0.9) % 1
  g.fillStyle = `rgba(37,99,235,${0.28 * (1 - pulse)})`
  g.beginPath()
  g.arc(cx, cy, 26 + pulse * 60, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#FFFFFF'
  g.beginPath()
  g.arc(cx, cy, 24, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = WORLD.info
  g.beginPath()
  g.arc(cx, cy, 17, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#FFFFFF'
  g.beginPath()
  g.roundRect(24, TEX_H - 110, TEX_W - 48, 76, 20)
  g.fill()
  g.fillStyle = WORLD.ink
  g.font = `700 28px ${SANS}`
  g.fillText('You are here', 48, TEX_H - 72)
  g.fillStyle = WORLD.inkSoft
  g.font = `500 22px ${SANS}`
  g.textAlign = 'right'
  g.fillText('±4 m', TEX_W - 48, TEX_H - 72)
}

function MapScreen({ screen }: { screen: Screen }) {
  return <CanvasScreen draw={(g, t) => drawMap(g, t, screen)} deps={[screen]} fps={20} />
}

function OffScreen() {
  return <CanvasScreen draw={(g) => screenBase(g, WORLD.screenOff)} deps={[]} />
}

// ── Satellites ──────────────────────────────────────────────────────────────

function Satellite({ sat, show, size }: { sat: Sat; show: boolean; size: number }) {
  const g = useRef<THREE.Group>(null!)
  const since = useRef<number | null>(null)
  const scale = useRef(size)
  const color = colorOf(sat)
  useFrame((state, dt) => {
    if (!g.current) return
    const t = state.clock.elapsedTime
    if (show && since.current === null) since.current = t
    if (!show) since.current = null
    const local = since.current === null ? 0 : Math.max(0, t - since.current - (sat.id - 1) * 0.25)
    const k = show ? Math.min(1, local * 2.5) : 0
    const pop = k === 0 ? 0 : 1 + Math.sin(k * Math.PI) * 0.3 * (1 - k)
    scale.current = THREE.MathUtils.lerp(scale.current, size, ease(dt, 0.02))
    g.current.scale.setScalar(Math.max(0.0001, k * pop * scale.current))
    g.current.position.set(sat.p[0], sat.p[1] + Math.sin(t * 0.9 + sat.id) * 0.12, sat.p[2])
    g.current.rotation.y = Math.sin(t * 0.3 + sat.id) * 0.4
  })
  return (
    <group ref={g} position={sat.p}>
      <RoundedBox args={[0.62, 0.62, 0.62]} radius={0.06} smoothness={3} castShadow>
        <meshStandardMaterial color={WORLD.gold} metalness={0.4} roughness={0.35} />
      </RoundedBox>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.05, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.3, 0.04, 0.62]} />
            <meshStandardMaterial color={WORLD.panel} roughness={0.35} metalness={0.3} />
          </mesh>
          {[-0.33, 0, 0.33].map((x) => (
            <mesh key={x} position={[x, 0.025, 0]}>
              <boxGeometry args={[0.02, 0.01, 0.6]} />
              <meshStandardMaterial color={WORLD.panelLine} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Downward antenna. */}
      <mesh position={[0, -0.48, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.24, 0.34, 20, 1, true]} />
        <meshStandardMaterial color={WORLD.metal} side={THREE.DoubleSide} roughness={0.5} />
      </mesh>
      {/* Colour halo = this satellite's circle colour. */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.62, 0.05, 10, 40]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  )
}

/**
 * The satellite's signal as an expanding sphere. 'loop' = repeating pulses
 * (broadcasting); 'once' = grows to exactly reach the phone, then lingers.
 */
function SignalShell({ sat, mode }: { sat: Sat; mode: 'off' | 'loop' | 'once' }) {
  const mesh = useRef<THREE.Mesh>(null!)
  const mat = useRef<THREE.MeshBasicMaterial>(null!)
  const started = useRef<number | null>(null)
  const R = shellRadius(sat)
  useFrame((state, dt) => {
    if (!mesh.current || !mat.current) return
    const t = state.clock.elapsedTime
    if (mode === 'once' && started.current === null) started.current = t
    if (mode !== 'once') started.current = null
    if (mode === 'loop') {
      const phase = (t * 0.45 + sat.id * 0.23) % 1
      mesh.current.scale.setScalar(Math.max(0.001, phase * R))
      mat.current.opacity = 0.1 * (1 - phase)
    } else if (mode === 'once') {
      const p = Math.min(1, (t - (started.current ?? t)) / 1.5)
      mesh.current.scale.setScalar(Math.max(0.001, easeInOut(p) * R))
      mat.current.opacity = p < 1 ? 0.14 : THREE.MathUtils.lerp(mat.current.opacity, 0.025, ease(dt, 0.1))
    } else {
      mat.current.opacity = THREE.MathUtils.lerp(mat.current.opacity, 0, ease(dt, 0.001))
    }
    mesh.current.visible = mat.current.opacity > 0.004
  })
  return (
    <mesh ref={mesh} position={sat.p}>
      <sphereGeometry args={[1, 48, 32]} />
      <meshBasicMaterial ref={mat} color={colorOf(sat)} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  )
}

/** The ground circle, drawn on like a pen stroke; `scale` inflates it (bad clock). */
function GroundRing({ sat, show, scale }: { sat: Sat; show: boolean; scale: number }) {
  const { center, r } = ringOf(sat)
  const mesh = useRef<THREE.Mesh>(null!)
  const drawn = useRef(0)
  const size = useRef(scale)
  const lastKey = useRef('')
  useFrame((_, dt) => {
    if (!mesh.current) return
    drawn.current = THREE.MathUtils.lerp(drawn.current, show ? 1 : 0, ease(dt, show ? 0.02 : 0.0005))
    size.current = THREE.MathUtils.lerp(size.current, scale, ease(dt, 0.02))
    const arc = Math.max(0.001, drawn.current * Math.PI * 2)
    const rr = r * size.current
    const key = `${arc.toFixed(3)}|${rr.toFixed(3)}`
    if (key !== lastKey.current) {
      lastKey.current = key
      mesh.current.geometry.dispose()
      mesh.current.geometry = new THREE.RingGeometry(rr - 0.07, rr + 0.07, 160, 1, Math.PI / 2, arc)
    }
    mesh.current.visible = drawn.current > 0.01
  })
  return (
    <mesh ref={mesh} position={center} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[r - 0.07, r + 0.07, 160, 1, 0, 0.001]} />
      <meshBasicMaterial color={colorOf(sat)} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

/** Pulsing disc marking a candidate spot. */
function Marker({ p, show, color = WORLD.ink }: { p: Vec3; show: boolean; color?: string }) {
  const g = useRef<THREE.Mesh>(null!)
  const k = useRef(0)
  useFrame((state, dt) => {
    k.current = THREE.MathUtils.lerp(k.current, show ? 1 : 0, ease(dt, 0.01))
    if (!g.current) return
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.15
    g.current.scale.setScalar(Math.max(0.0001, k.current * pulse))
  })
  return (
    <mesh ref={g} position={[p[0], 0.1, p[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.18, 0.36, 32]} />
      <meshBasicMaterial color={color} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

/** Pin that pops in over a spot. */
function PoppingPin({ p, show, y = 3, color }: { p: Vec3; show: boolean; y?: number; color?: string }) {
  const g = useRef<THREE.Group>(null!)
  const k = useRef(0)
  useFrame((state, dt) => {
    k.current = THREE.MathUtils.lerp(k.current, show ? 1 : 0, ease(dt, 0.002))
    if (!g.current) return
    g.current.scale.setScalar(Math.max(0.0001, k.current))
    g.current.position.set(p[0], Math.sin(state.clock.elapsedTime * 2.2) * 0.08, p[2])
  })
  return (
    <group ref={g}>
      <Pin y={y} color={color} />
    </group>
  )
}

/** Ghost pin sliding away over the "day", leaving a dashed trail. */
function DriftPin({ active, ms, speed }: { active: boolean; ms: number; speed: number }) {
  const g = useRef<THREE.Group>(null!)
  const started = useRef<number | null>(null)
  const pos = useRef<Vec3>(YOU)
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (active && started.current === null) started.current = t
    if (!active) started.current = null
    const p = active ? easeInOut(Math.min(1, (t - (started.current ?? t)) / ((ms * 0.75) / 1000 / speed))) : 0
    pos.current = [YOU[0] + (DRIFT_TO[0] - YOU[0]) * p, 0, YOU[2] + (DRIFT_TO[2] - YOU[2]) * p]
    if (g.current) {
      g.current.position.set(...pos.current)
      g.current.visible = active
    }
  })
  return (
    <>
      <group ref={g}>
        <Pin y={0.4} color={WORLD.alert} />
      </group>
      {active && (
        <Line points={[[YOU[0], 0.1, YOU[2]], [DRIFT_TO[0], 0.1, DRIFT_TO[2]]]} color={WORLD.alert} lineWidth={3} dashed dashSize={0.3} gapSize={0.2} />
      )}
    </>
  )
}

// ── Scene ───────────────────────────────────────────────────────────────────

export default function Scene({ step, speed }: { step: Step; speed: number }) {
  const live = useLive(PHONE_A)
  const cross12 = useMemo(() => crossings(SATS[0], SATS[1]), [])
  return (
    <Stage3D cam={step.cam} look={step.look} live={live} fog={[30, 75]}>
      <Landscape />

      <Phone p={PHONE_A}>
        <MapScreen screen={step.screen} />
      </Phone>
      <Phone p={PHONE_B}>
        <OffScreen />
      </Phone>
      <Tower p={TOWER_A} />
      <Tower p={TOWER_B} />
      <Cable mode="off" />
      <DataCenter p={DATACENTER} busy={false} />

      {SATS.map((s, i) => (
        <group key={s.id}>
          <Satellite sat={s} show={i < step.sats} size={step.satScale} />
          <SignalShell
            sat={s}
            mode={step.shells === 'all' && i < step.sats ? 'loop' : step.shells === s.id ? 'once' : 'off'}
          />
          <GroundRing sat={s} show={i < step.rings} scale={step.ringScale} />
          <Tag p={[s.p[0], s.p[1] + 1.1, s.p[2]]} text="+0.000038 s / day" show={step.relativity && i < 2} factor={16} upper={false} />
        </group>
      ))}

      <Marker p={cross12[0]} show={step.crossings} />
      <Marker p={cross12[1]} show={step.crossings} />
      <PoppingPin p={YOU} show={step.pin} />
      <DriftPin active={step.drift} ms={step.ms} speed={speed} />
      <Tag p={[DRIFT_TO[0], 1.8, DRIFT_TO[2]]} text="+10 km / day" tone="alert" show={step.drift} factor={18} />
    </Stage3D>
  )
}
