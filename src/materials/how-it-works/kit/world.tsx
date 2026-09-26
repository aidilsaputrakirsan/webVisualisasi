/**
 * Shared 3D building blocks of the "How It Works" diorama: terrain, decor,
 * towers, the undersea cable, racks, phones with canvas-drawn screens, labels
 * and the camera rig. Episodes compose these and add their own actors.
 */
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { COAST_A, COAST_B, MAIN_CABLE, PHONE_SCREEN_Y, SEABED_Y, TOWER_H, type Vec3 } from './geo'
import { WORLD } from './palette'

/** Frame-rate-independent easing factor: `keep` = share left after 1 second. */
export const ease = (dt: number, keep = 0.03) => 1 - Math.pow(keep, dt)

export const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)

/** Live position of whatever the chase cam should trail (written each frame). */
export interface Live {
  pos: THREE.Vector3
  s: number
}

/**
 * Tweens a route position to `target` over most of the beat (`ms` at 1×),
 * so a hop fills its shot. `from` makes a freshly mounted actor start its
 * first hop there instead of appearing at the target. Returns refs updated
 * every frame.
 */
export function useHop(target: number, ms: number, speed: number, from?: number) {
  const start = from ?? target
  const s = useRef(start)
  const hop = useRef({ from: start, to: start, start: 0, p: 1 })
  useFrame((state) => {
    const now = state.clock.elapsedTime
    if (hop.current.to !== target) hop.current = { from: s.current, to: target, start: now, p: 0 }
    const dur = (ms * 0.8) / 1000 / speed
    const p = Math.min(1, (now - hop.current.start) / dur)
    hop.current.p = p
    s.current = hop.current.from + (hop.current.to - hop.current.from) * easeInOut(p)
  })
  return { s, hop }
}

// ── Camera ──────────────────────────────────────────────────────────────────

/** Eases the camera to each beat's framing, with a slow handheld drift so no
 *  frame is ever fully still (still frames get scrolled past). With `follow`,
 *  it becomes a chase cam trailing `live.pos`. */
export function CameraRig({ cam, look, follow, live }: { cam: Vec3; look: Vec3; follow?: Vec3; live: Live }) {
  const lookNow = useRef(new THREE.Vector3(...look))
  const goal = useMemo(() => new THREE.Vector3(), [])
  const lookGoal = useMemo(() => new THREE.Vector3(), [])
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    if (follow) {
      lookGoal.copy(live.pos)
      goal.set(live.pos.x + follow[0], live.pos.y + follow[1], live.pos.z + follow[2])
    } else {
      lookGoal.set(...look)
      goal.set(...cam)
    }
    goal.x += Math.sin(t * 0.45) * 0.18
    goal.y += Math.sin(t * 0.6) * 0.1
    goal.z += Math.cos(t * 0.35) * 0.14
    const k = ease(dt, follow ? 0.02 : 0.035)
    state.camera.position.lerp(goal, k)
    lookNow.current.lerp(lookGoal, k)
    state.camera.lookAt(lookNow.current)
  })
  return null
}

// ── Lights ──────────────────────────────────────────────────────────────────

/** Phones/tablets get a lighter shadow map — plenty at their screen size. */
const SHADOW_MAP = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches ? 1024 : 2048

export function Lights() {
  return (
    <>
      <hemisphereLight args={[WORLD.cloud, WORLD.landSide, 1.2]} />
      <directionalLight
        position={[26, 34, 20]}
        intensity={1.25}
        castShadow
        shadow-mapSize={[SHADOW_MAP, SHADOW_MAP]}
        shadow-camera-left={-36}
        shadow-camera-right={36}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-bias={-0.0006}
        shadow-radius={4}
      >
        <object3D attach="target" position={[22, 0, 0]} />
      </directionalLight>
    </>
  )
}

// ── Terrain + decor ─────────────────────────────────────────────────────────

const Z_BACK = -9
const Z_FRONT = 6
const DEPTH = Z_FRONT - Z_BACK
const Z_MID = (Z_FRONT + Z_BACK) / 2
const BASE_Y = -4.6

/** A slab of land: a darker "cut-away" body with a thin lighter top layer. */
function Slab({ x0, x1, top, topColor }: { x0: number; x1: number; top: number; topColor: string }) {
  const w = x1 - x0
  const bodyH = top - 0.12 - BASE_Y
  return (
    <group position={[(x0 + x1) / 2, 0, Z_MID]}>
      <mesh position={[0, BASE_Y + bodyH / 2, 0]} receiveShadow>
        <boxGeometry args={[w, bodyH, DEPTH]} />
        <meshStandardMaterial color={WORLD.landSide} roughness={0.95} />
      </mesh>
      <mesh position={[0, top - 0.06, 0]} receiveShadow>
        <boxGeometry args={[w, 0.12, DEPTH]} />
        <meshStandardMaterial color={topColor} roughness={0.9} />
      </mesh>
    </group>
  )
}

export function Terrain() {
  return (
    <>
      <Slab x0={-12} x1={COAST_A} top={0} topColor={WORLD.landTop} />
      <Slab x0={COAST_A} x1={COAST_B} top={SEABED_Y} topColor={WORLD.seabed} />
      <Slab x0={COAST_B} x1={56} top={0} topColor={WORLD.landTop} />
      {/* Water: translucent block over the seabed, so the cable reads through it. */}
      <mesh position={[(COAST_A + COAST_B) / 2, (SEABED_Y - 0.15) / 2, Z_MID]}>
        <boxGeometry args={[COAST_B - COAST_A, -SEABED_Y - 0.15, DEPTH]} />
        <meshStandardMaterial color={WORLD.water} transparent opacity={0.34} roughness={0.2} depthWrite={false} />
      </mesh>
      <mesh position={[(COAST_A + COAST_B) / 2, -0.15, Z_MID]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[COAST_B - COAST_A, DEPTH]} />
        <meshStandardMaterial color={WORLD.waterDeep} transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </>
  )
}

export function Tree({ p, s = 1 }: { p: Vec3; s?: number }) {
  return (
    <group position={p} scale={s}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.11, 0.7, 8]} />
        <meshStandardMaterial color={WORLD.trunk} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <icosahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial color={WORLD.leaf} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.28, 0.8, 0.15]} castShadow>
        <icosahedronGeometry args={[0.34, 0]} />
        <meshStandardMaterial color={WORLD.leafDark} roughness={0.85} flatShading />
      </mesh>
    </group>
  )
}

const TREES: { p: Vec3; s: number }[] = [
  { p: [-3, 0, -3], s: 1.2 },
  { p: [-2.2, 0, 2.5], s: 0.8 },
  { p: [3, 0, -5], s: 1 },
  { p: [9.5, 0, -4.5], s: 1.3 },
  { p: [8.5, 0, -6.5], s: 0.9 },
  { p: [28, 0, -5], s: 1.1 },
  { p: [29, 0, 4.2], s: 0.8 },
  { p: [36, 0, -6], s: 1.2 },
  { p: [47, 0, 3.6], s: 0.9 },
  { p: [47, 0, -3], s: 1.2 },
]

function Cloud({ p, s = 1, speed = 0.2 }: { p: Vec3; s?: number; speed?: number }) {
  const g = useRef<THREE.Group>(null!)
  useFrame((state) => {
    if (g.current) g.current.position.x = p[0] + Math.sin(state.clock.elapsedTime * speed) * 0.8
  })
  return (
    <group ref={g} position={p} scale={s}>
      {[
        [0, 0, 0, 0.7],
        [0.7, -0.1, 0, 0.5],
        [-0.7, -0.15, 0.1, 0.5],
        [0.2, 0.3, -0.1, 0.5],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]}>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color={WORLD.cloud} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  )
}

const CLOUDS: { p: Vec3; s: number; speed: number }[] = [
  { p: [-1, 6.5, -6], s: 1.1, speed: 0.18 },
  { p: [8, 7.5, -7], s: 1.3, speed: 0.14 },
  { p: [18, 5.5, -6], s: 1.2, speed: 0.2 },
  { p: [30, 7, -7], s: 1.4, speed: 0.16 },
  { p: [44, 6.5, -6], s: 1.1, speed: 0.22 },
]

/** Terrain + trees + clouds: the backdrop every episode starts from. */
export function Landscape() {
  return (
    <>
      <Terrain />
      {TREES.map((t, i) => (
        <Tree key={i} p={t.p} s={t.s} />
      ))}
      {CLOUDS.map((c, i) => (
        <Cloud key={i} {...c} />
      ))}
    </>
  )
}

// ── Labels ──────────────────────────────────────────────────────────────────

/** Floating label. `factor` scales it (drei distanceFactor; larger = bigger). */
export function Tag({
  p,
  text,
  show,
  tone = 'accent',
  factor = 10,
  upper = true,
}: {
  p: Vec3
  text: string
  show: boolean
  tone?: 'accent' | 'alert'
  factor?: number
  /** Uppercase the text; turn off for units like µs (µ uppercases to Greek Μ). */
  upper?: boolean
}) {
  if (!show) return null
  const alert = tone === 'alert'
  return (
    <Html position={p} center distanceFactor={factor} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <div
        style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: 2,
          textTransform: upper ? 'uppercase' : 'none',
          color: alert ? WORLD.alert : WORLD.accentDeep,
          background: 'rgba(255,255,255,0.9)',
          border: `2px solid ${alert ? WORLD.alert : WORLD.accent}`,
          borderRadius: 999,
          padding: '4px 16px',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
    </Html>
  )
}

// ── Phones ──────────────────────────────────────────────────────────────────

export const PHONE_W = 1.05
export const PHONE_H = 2.1
export const SCREEN_W = PHONE_W - 0.1
export const SCREEN_H = PHONE_H - 0.16
/** Screen texture resolution (px) — same aspect as the screen plane. */
export const TEX_W = 420
export const TEX_H = Math.round((TEX_W * SCREEN_H) / SCREEN_W)
export const SANS = 'Inter, system-ui, sans-serif'

/** Clips to the rounded screen and fills the background; call first in a draw. */
export function screenBase(g: CanvasRenderingContext2D, fill: string) {
  g.clearRect(0, 0, TEX_W, TEX_H)
  g.beginPath()
  g.roundRect(0, 0, TEX_W, TEX_H, 44)
  g.clip()
  g.fillStyle = fill
  g.fillRect(0, 0, TEX_W, TEX_H)
}

/**
 * A phone screen drawn with the 2D canvas API and used as a texture. Living
 * inside WebGL (not a DOM overlay) keeps it depth-sorted behind 3D actors and
 * under the recorded captions. `fps` > 0 redraws continuously (spinners,
 * playing video) with the elapsed time passed to `draw`.
 */
export function CanvasScreen({ draw, deps, fps = 0 }: { draw: (g: CanvasRenderingContext2D, t: number) => void; deps: unknown[]; fps?: number }) {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = TEX_W
    c.height = TEX_H
    return c
  }, [])
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [canvas])
  const drawRef = useRef(draw)
  drawRef.current = draw
  const last = useRef(-1)

  const paint = (t: number) => {
    const g = canvas.getContext('2d')
    if (!g) return
    g.save()
    drawRef.current(g, t)
    g.restore()
    texture.needsUpdate = true
  }

  useEffect(() => {
    paint(0)
    // Web fonts may land after the first paint — redraw once they're ready.
    void document.fonts?.ready.then(() => paint(0))
  }, deps)

  useFrame((state) => {
    if (fps <= 0) return
    const t = state.clock.elapsedTime
    if (t - last.current < 1 / fps) return
    last.current = t
    paint(t)
  })

  return (
    <mesh position={[0, 0, 0.062]}>
      <planeGeometry args={[SCREEN_W, SCREEN_H]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  )
}

/** A giant phone standing on a pedestal; pass its screen as children. */
export function Phone({ p, children }: { p: Vec3; children: ReactNode }) {
  return (
    <group position={p}>
      <mesh position={[0, 0.08, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.85, 0.95, 0.16, 32]} />
        <meshStandardMaterial color={WORLD.tray} roughness={0.7} />
      </mesh>
      <group position={[0, PHONE_SCREEN_Y, 0]} rotation={[-0.08, 0, 0]}>
        <RoundedBox args={[PHONE_W, PHONE_H, 0.12]} radius={0.1} smoothness={4} castShadow>
          <meshStandardMaterial color={WORLD.phoneBody} roughness={0.45} metalness={0.2} />
        </RoundedBox>
        {children}
      </group>
    </group>
  )
}

// ── Map pin ─────────────────────────────────────────────────────────────────

/** A map pin hovering above a spot. */
export function Pin({ y = 2.9, color = WORLD.accent }: { y?: number; color?: string }) {
  return (
    <group position={[0, y, 0]}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.3, 20, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.12, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.2, 0.5, 20]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.3, 0.26]}>
        <sphereGeometry args={[0.11, 12, 12]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
      </mesh>
    </group>
  )
}

// ── Towers + radio ──────────────────────────────────────────────────────────

export function Tower({ p }: { p: Vec3 }) {
  const beacon = useRef<THREE.MeshStandardMaterial>(null!)
  useFrame((state) => {
    if (beacon.current) beacon.current.emissiveIntensity = 0.4 + (Math.sin(state.clock.elapsedTime * 4) > 0.3 ? 1.4 : 0)
  })
  return (
    <group position={p}>
      <mesh position={[0, TOWER_H / 2, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.32, TOWER_H, 6]} />
        <meshStandardMaterial color={WORLD.metal} roughness={0.6} metalness={0.3} flatShading />
      </mesh>
      {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((a) => (
        <mesh key={a} position={[Math.sin(a) * 0.2, TOWER_H - 1, Math.cos(a) * 0.2]} rotation={[0, a, 0]} castShadow>
          <boxGeometry args={[0.22, 0.7, 0.08]} />
          <meshStandardMaterial color={WORLD.metalDark} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, TOWER_H + 0.1, 0]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial ref={beacon} color={WORLD.accent} emissive={WORLD.accent} emissiveIntensity={0.4} />
      </mesh>
    </group>
  )
}

/** Three expanding rings — radio waves leaving a point. `weak` = grey + short. */
export function RadioRings({ p, active, weak = false }: { p: Vec3; active: boolean; weak?: boolean }) {
  const rings = useRef<(THREE.Mesh | null)[]>([])
  const fade = useRef(0)
  const reach = useRef(1)
  useFrame((state, dt) => {
    fade.current = THREE.MathUtils.lerp(fade.current, active ? 1 : 0, ease(dt, 0.01))
    reach.current = THREE.MathUtils.lerp(reach.current, weak ? 0.45 : 1, ease(dt, 0.02))
    rings.current.forEach((m, i) => {
      if (!m) return
      const phase = (state.clock.elapsedTime * 0.7 + i / 3) % 1
      m.scale.setScalar(0.3 + phase * 2.4 * reach.current)
      const mat = m.material as THREE.MeshBasicMaterial
      mat.opacity = (1 - phase) * 0.7 * fade.current
      mat.color.set(weak ? WORLD.metal : WORLD.accent)
      m.visible = fade.current > 0.01
    })
  })
  return (
    <group position={p}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(m) => (rings.current[i] = m)}>
          <torusGeometry args={[0.5, 0.025, 8, 48]} />
          <meshBasicMaterial color={WORLD.accent} transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

// ── Cable + light pulses ────────────────────────────────────────────────────

/** Straight segments between points: a spline would sag through the seabed. */
export function linePath(points: Vec3[]) {
  const path = new THREE.CurvePath<THREE.Vector3>()
  for (let i = 0; i < points.length - 1; i++) {
    path.add(new THREE.LineCurve3(new THREE.Vector3(...points[i]), new THREE.Vector3(...points[i + 1])))
  }
  return path
}

export type CableMode = 'off' | 'flow' | 'jam'

const MAX_PULSES = 40

/**
 * A cable with light pulses. 'flow' = a few fast amber pulses; 'jam' = a
 * crowd of slow red ones bunched up (congestion).
 */
export function Cable({ points = MAIN_CABLE, mode }: { points?: Vec3[]; mode: CableMode }) {
  const curve = useMemo(() => linePath(points), [points])
  const pulses = useRef<(THREE.Mesh | null)[]>([])
  const glow = useRef(0)
  useFrame((state, dt) => {
    glow.current = THREE.MathUtils.lerp(glow.current, mode === 'off' ? 0 : 1, ease(dt, 0.02))
    const jam = mode === 'jam'
    const n = jam ? MAX_PULSES : 14
    const t = state.clock.elapsedTime
    pulses.current.forEach((m, i) => {
      if (!m) return
      if (i >= n) {
        m.visible = false
        return
      }
      // Jammed pulses crawl and bunch into clumps along the cable.
      const u = jam ? (t * 0.018 + i / n + Math.sin(i * 1.7) * 0.012) % 1 : (t * 0.12 + i / n) % 1
      m.position.copy(curve.getPointAt(u))
      m.scale.setScalar(glow.current * (jam ? 0.85 : 1))
      ;(m.material as THREE.MeshBasicMaterial).color.set(jam ? WORLD.alert : WORLD.accent)
      m.visible = glow.current > 0.02
    })
  })
  return (
    <group>
      <mesh castShadow>
        <tubeGeometry args={[curve, 200, 0.11, 12, false]} />
        <meshStandardMaterial color={WORLD.cable} roughness={0.5} />
      </mesh>
      {Array.from({ length: MAX_PULSES }, (_, i) => (
        <mesh key={i} ref={(m) => (pulses.current[i] = m)} visible={false}>
          <sphereGeometry args={[0.17, 14, 14]} />
          <meshBasicMaterial color={WORLD.accent} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

// ── Data center ─────────────────────────────────────────────────────────────

export function Rack({ p, busy, seed }: { p: Vec3; busy: boolean; seed: number }) {
  const leds = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    leds.current.forEach((m, i) => {
      if (!m) return
      m.emissiveIntensity = busy ? (Math.sin(t * (9 + i * 3) + seed * 7) > 0 ? 1.8 : 0.2) : 0.5
    })
  })
  return (
    <group position={p}>
      <RoundedBox args={[0.9, 2.2, 0.8]} radius={0.06} smoothness={3} position={[0, 1.1, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={WORLD.rack} roughness={0.6} />
      </RoundedBox>
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} position={[0, 0.45 + i * 0.38, 0.41]}>
          <mesh>
            <boxGeometry args={[0.72, 0.26, 0.02]} />
            <meshStandardMaterial color={WORLD.rackFace} roughness={0.7} />
          </mesh>
          <mesh position={[0.26, 0, 0.02]}>
            <boxGeometry args={[0.1, 0.05, 0.02]} />
            <meshStandardMaterial
              ref={(m) => (leds.current[i] = m)}
              color={i % 2 ? WORLD.ledOk : WORLD.accent}
              emissive={i % 2 ? WORLD.ledOk : WORLD.accent}
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function DataCenter({ p, busy }: { p: Vec3; busy: boolean }) {
  const racks: Vec3[] = []
  for (let row = 0; row < 2; row++) for (let i = 0; i < 4; i++) racks.push([(i - 1.5) * 1.15, 0.1, -row * 1.6])
  return (
    <group position={p}>
      <mesh position={[0, 0.05, -0.8]} receiveShadow>
        <boxGeometry args={[5.4, 0.1, 4]} />
        <meshStandardMaterial color={WORLD.tray} roughness={0.8} />
      </mesh>
      {racks.map((r, i) => (
        <Rack key={i} p={r} busy={busy} seed={i} />
      ))}
    </group>
  )
}
