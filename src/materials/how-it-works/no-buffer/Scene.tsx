import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { DATACENTER, PHONE_A, PHONE_B, TOWER_A, TOWER_B, TOWER_H, type Vec3, type Waypoint } from '../kit/geo'
import {
  CanvasScreen,
  Cable,
  DataCenter,
  Landscape,
  Phone,
  Pin,
  RadioRings,
  Rack,
  SANS,
  TEX_H,
  TEX_W,
  Tag,
  Tower,
  ease,
  screenBase,
  useHop,
  type Live,
} from '../kit/world'
import Stage3D, { useLive } from '../kit/Stage3D'
import { WORLD } from '../kit/palette'
import {
  COPY,
  EDGE,
  EDGE_FEED,
  EDGE_LINK,
  EDGE_KM,
  EDGE_SHELF,
  MOVIE,
  ORIGIN_KM,
  ROUTES,
  SITES,
  STREAM,
  TOWER_TOP,
  pointOn,
  type Quality,
  type RouteId,
  type Screen,
  type Step,
} from './story'

// ── Phone video screen ──────────────────────────────────────────────────────

/** Low-res buffer the 480p frame is drawn into, then scaled up unsmoothed. */
const LO = (() => {
  const c = document.createElement('canvas')
  c.width = Math.round(TEX_W / 9)
  c.height = Math.round(TEX_H / 9)
  return c
})()

/** The movie itself: a sunset sea with a drifting sailboat. */
function drawMovie(g: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const k = w / TEX_W
  const sky = g.createLinearGradient(0, 0, 0, h * 0.62)
  sky.addColorStop(0, '#F2A65E')
  sky.addColorStop(1, '#FBE0B8')
  g.fillStyle = sky
  g.fillRect(0, 0, w, h * 0.62)

  // Sun sinking slowly.
  const sunY = h * (0.36 + ((t * 0.01) % 0.12))
  g.fillStyle = '#FFF4DC'
  g.beginPath()
  g.arc(w * 0.62, sunY, 58 * k, 0, Math.PI * 2)
  g.fill()

  // Distant mountains.
  g.fillStyle = '#C98A6B'
  g.beginPath()
  g.moveTo(0, h * 0.62)
  g.lineTo(w * 0.18, h * 0.5)
  g.lineTo(w * 0.36, h * 0.6)
  g.lineTo(w * 0.55, h * 0.47)
  g.lineTo(w * 0.8, h * 0.62)
  g.closePath()
  g.fill()

  // Sea + sun glints.
  const sea = g.createLinearGradient(0, h * 0.62, 0, h)
  sea.addColorStop(0, '#5C9CC0')
  sea.addColorStop(1, '#2F5F80')
  g.fillStyle = sea
  g.fillRect(0, h * 0.62, w, h * 0.38)
  g.fillStyle = 'rgba(255,240,210,0.55)'
  for (let i = 0; i < 6; i++) {
    const y = h * (0.65 + i * 0.045)
    const len = (60 - i * 7) * k
    g.fillRect(w * 0.62 - len / 2 + Math.sin(t * 2 + i) * 6 * k, y, len, 4 * k)
  }

  // Sailboat drifting across.
  const bx = ((t * 18 * k) % (w + 120 * k)) - 60 * k
  const by = h * 0.72
  g.fillStyle = '#3B2A22'
  g.beginPath()
  g.moveTo(bx - 34 * k, by)
  g.lineTo(bx + 34 * k, by)
  g.lineTo(bx + 24 * k, by + 12 * k)
  g.lineTo(bx - 24 * k, by + 12 * k)
  g.closePath()
  g.fill()
  g.fillStyle = '#FFF8EC'
  g.beginPath()
  g.moveTo(bx, by - 4 * k)
  g.lineTo(bx, by - 62 * k)
  g.lineTo(bx + 30 * k, by - 8 * k)
  g.closePath()
  g.fill()
}

function spinner(g: CanvasRenderingContext2D, t: number, color: string) {
  const cx = TEX_W / 2
  const cy = TEX_H / 2
  g.lineWidth = 10
  g.lineCap = 'round'
  g.strokeStyle = 'rgba(255,255,255,0.35)'
  g.beginPath()
  g.arc(cx, cy, 44, 0, Math.PI * 2)
  g.stroke()
  g.strokeStyle = color
  g.beginPath()
  g.arc(cx, cy, 44, t * 6, t * 6 + Math.PI * 0.6)
  g.stroke()
}

function playButton(g: CanvasRenderingContext2D, r: number) {
  const cx = TEX_W / 2
  const cy = TEX_H / 2
  g.fillStyle = 'rgba(255,255,255,0.92)'
  g.beginPath()
  g.arc(cx, cy, r, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = WORLD.accent
  g.beginPath()
  g.moveTo(cx - r * 0.3, cy - r * 0.42)
  g.lineTo(cx + r * 0.46, cy)
  g.lineTo(cx - r * 0.3, cy + r * 0.42)
  g.closePath()
  g.fill()
}

function drawVideo(g: CanvasRenderingContext2D, t: number, screen: Screen, quality: Quality) {
  if (screen === 'next') {
    screenBase(g, WORLD.screenOff)
    g.fillStyle = WORLD.accent
    g.font = `700 26px ${SANS}`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText('UP NEXT', TEX_W / 2, TEX_H / 2 - 140)
    g.fillStyle = '#FFFFFF'
    g.font = `700 40px ${SANS}`
    g.fillText('How It Works', TEX_W / 2, TEX_H / 2 - 92)
    g.fillText('EP. 03', TEX_W / 2, TEX_H / 2 - 44)
    playButton(g, 52)
    return
  }

  screenBase(g, '#000000')
  if (quality === 'lo' && screen === 'playing') {
    const lg = LO.getContext('2d')!
    drawMovie(lg, LO.width, LO.height, t)
    g.imageSmoothingEnabled = false
    g.drawImage(LO, 0, 0, TEX_W, TEX_H)
    g.imageSmoothingEnabled = true
  } else {
    drawMovie(g, TEX_W, TEX_H, screen === 'playing' ? t : 0)
  }

  // Title + quality badge.
  g.textBaseline = 'middle'
  g.fillStyle = 'rgba(0,0,0,0.28)'
  g.fillRect(0, 0, TEX_W, 110)
  g.fillStyle = '#FFFFFF'
  g.font = `700 30px ${SANS}`
  g.fillText(MOVIE, 30, 64)
  if (screen === 'playing') {
    const label = quality === 'hi' ? '1080p' : '480p'
    g.font = `700 22px ${SANS}`
    const bw = g.measureText(label).width + 22
    g.fillStyle = quality === 'hi' ? WORLD.accent : WORLD.metalDark
    g.beginPath()
    g.roundRect(TEX_W - bw - 24, 48, bw, 34, 8)
    g.fill()
    g.fillStyle = '#FFFFFF'
    g.fillText(label, TEX_W - bw - 13, 66)
  }

  if (screen !== 'playing') {
    g.fillStyle = 'rgba(0,0,0,0.35)'
    g.fillRect(0, 110, TEX_W, TEX_H)
  }
  if (screen === 'poster') playButton(g, 60)
  if (screen === 'loading') spinner(g, t, '#FFFFFF')
  if (screen === 'stalled') {
    spinner(g, t, WORLD.alert)
    g.fillStyle = '#FFFFFF'
    g.font = `700 28px ${SANS}`
    g.textAlign = 'center'
    g.fillText('Buffering…', TEX_W / 2, TEX_H / 2 + 90)
    g.textAlign = 'left'
  }

  // Progress bar: played (amber) + buffered (light).
  const y = TEX_H - 60
  const x0 = 30
  const x1 = TEX_W - 30
  const played = screen === 'playing' ? 0.18 + ((t * 0.01) % 0.3) : 0.02
  const buffered = screen === 'playing' ? played + (quality === 'hi' ? 0.22 : 0.1) : played + 0.01
  g.fillStyle = 'rgba(255,255,255,0.3)'
  g.fillRect(x0, y, x1 - x0, 8)
  g.fillStyle = 'rgba(255,255,255,0.7)'
  g.fillRect(x0, y, (x1 - x0) * buffered, 8)
  g.fillStyle = WORLD.accent
  g.fillRect(x0, y, (x1 - x0) * played, 8)
}

function VideoScreen({ screen, quality }: { screen: Screen; quality: Quality }) {
  const animated = screen === 'playing' || screen === 'loading' || screen === 'stalled'
  return <CanvasScreen draw={(g, t) => drawVideo(g, t, screen, quality)} deps={[screen, quality]} fps={animated ? 24 : 0} />
}

function OffScreen() {
  return <CanvasScreen draw={(g) => screenBase(g, WORLD.screenOff)} deps={[]} />
}

// ── Film reels ──────────────────────────────────────────────────────────────

function Reel() {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.34, 0.34, 0.1, 28]} />
        <meshStandardMaterial color={WORLD.accent} emissive={WORLD.accent} emissiveIntensity={0.2} roughness={0.35} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.19, 0.052, Math.sin(a) * 0.19]}>
            <cylinderGeometry args={[0.07, 0.07, 0.01, 16]} />
            <meshStandardMaterial color={WORLD.accentDeep} roughness={0.5} />
          </mesh>
        )
      })}
      <mesh position={[0, 0.055, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.012, 16]} />
        <meshStandardMaterial color={WORLD.ink} roughness={0.4} />
      </mesh>
    </group>
  )
}

/** Three reels crossing from the origin to the edge (the chase cam's lead). */
function TravellingReels({ at, ms, speed, live }: { at: number; ms: number; speed: number; live: Live }) {
  const { s, hop } = useHop(at, ms, speed, 0)
  const reels = useRef<(THREE.Group | null)[]>([])
  useFrame((state) => {
    const moving = hop.current.p < 1 ? 1 : 0
    const lead = pointOn(COPY, s.current)
    live.pos.set(...lead)
    reels.current.forEach((g, i) => {
      if (!g) return
      const p = pointOn(COPY, s.current - i * 0.22 * moving)
      g.position.set(p[0], p[1] + 0.3 + i * 0.02, p[2])
      g.rotation.z = -state.clock.elapsedTime * 3
    })
  })
  return (
    <>
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(g) => (reels.current[i] = g)}>
          <Reel />
        </group>
      ))}
    </>
  )
}

// ── Edge server + CDN sites ─────────────────────────────────────────────────

function EdgeServer({ busy, stored }: { busy: boolean; stored: boolean }) {
  const shelf = useRef<THREE.Group>(null!)
  const grow = useRef(stored ? 1 : 0)
  useFrame((_, dt) => {
    grow.current = THREE.MathUtils.lerp(grow.current, stored ? 1 : 0, ease(dt, 0.01))
    if (shelf.current) shelf.current.scale.setScalar(Math.max(0.0001, grow.current))
  })
  return (
    <group position={EDGE}>
      <RoundedBox args={[2.4, 0.14, 1.7]} radius={0.05} smoothness={3} position={[0.3, 0.07, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={WORLD.tray} roughness={0.7} />
      </RoundedBox>
      <Rack p={[0, 0.14, 0]} busy={busy} seed={3} />
      {/* Stored copies, stacked on the shelf. */}
      <group ref={shelf} position={[EDGE_SHELF[0] - EDGE[0], EDGE_SHELF[1] - 0.2, EDGE_SHELF[2] - EDGE[2]]}>
        {[0, 1, 2].map((i) => (
          <group key={i} position={[0, 0.06 + i * 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <Reel />
          </group>
        ))}
      </group>
    </group>
  )
}

/** Mini edge site: a small rack + pin that pops in (staggered by `order`). */
function Site({ p, show, order }: { p: Vec3; show: boolean; order: number }) {
  const g = useRef<THREE.Group>(null!)
  const since = useRef<number | null>(null)
  useFrame((state) => {
    if (!g.current) return
    const t = state.clock.elapsedTime
    if (show && since.current === null) since.current = t
    if (!show) since.current = null
    const local = since.current === null ? 0 : Math.max(0, t - since.current - order * 0.22)
    // Springy pop: overshoot then settle.
    const k = show ? Math.min(1, local * 3) : 0
    const pop = k === 0 ? 0 : 1 + Math.sin(k * Math.PI) * 0.25 * (1 - k)
    g.current.scale.setScalar(Math.max(0.0001, k * pop))
    g.current.position.y = Math.sin(t * 2 + order) * 0.06
  })
  return (
    <group position={p}>
      <group ref={g}>
        <group scale={0.6}>
          <Rack p={[0, 0, 0]} busy seed={order + 10} />
        </group>
        <Pin y={1.8} />
      </group>
    </group>
  )
}

// ── Request ping + chunk stream ─────────────────────────────────────────────

/** The request: a glowing dot with a short tail racing along its route. */
function Ping({ route, at, ms, speed, live }: { route: RouteId; at: number; ms: number; speed: number; live: Live }) {
  const path = ROUTES[route]
  const { s, hop } = useHop(at, ms, speed, 0)
  const dots = useRef<(THREE.Mesh | null)[]>([])
  useFrame(() => {
    const moving = hop.current.p < 1 ? 1 : 0
    live.pos.set(...pointOn(path, s.current))
    dots.current.forEach((m, i) => {
      if (!m) return
      const p = pointOn(path, s.current - i * 0.05 * moving)
      m.position.set(...p)
      m.scale.setScalar(1 - i * 0.16)
    })
  })
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} ref={(m) => (dots.current[i] = m)}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color={WORLD.accent} toneMapped={false} transparent opacity={1 - i * 0.18} />
        </mesh>
      ))}
    </>
  )
}

const CHUNKS = 8

/** Video chunks looping edge → tower → phone. Low quality = small + grey. */
function ChunkStream({ active, quality }: { active: boolean; quality: Quality }) {
  const tiles = useRef<(THREE.Group | null)[]>([])
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const fade = useRef(0)
  const size = useRef(1)
  const color = useMemo(() => new THREE.Color(), [])
  const end = STREAM.length - 1
  useFrame((state, dt) => {
    fade.current = THREE.MathUtils.lerp(fade.current, active ? 1 : 0, ease(dt, 0.01))
    size.current = THREE.MathUtils.lerp(size.current, quality === 'hi' ? 1 : 0.55, ease(dt, 0.01))
    color.set(quality === 'hi' ? WORLD.accent : WORLD.metal)
    const t = state.clock.elapsedTime
    tiles.current.forEach((g, i) => {
      if (!g) return
      const u = (t * 0.26 + i / CHUNKS) % 1
      const p = pointOn(STREAM as Waypoint[], u * end)
      g.position.set(...p)
      // Shrink in at the edge and out into the screen.
      const edgeFade = Math.min(1, u * 8, (1 - u) * 8)
      g.scale.setScalar(Math.max(0.0001, fade.current * size.current * edgeFade))
      g.rotation.set(0, Math.sin(t + i) * 0.4, Math.sin(t * 1.3 + i) * 0.15)
      mats.current[i]?.color.lerp(color, ease(dt, 0.02))
    })
  })
  return (
    <>
      {Array.from({ length: CHUNKS }, (_, i) => (
        <group key={i} ref={(g) => (tiles.current[i] = g)}>
          <RoundedBox args={[0.72, 0.44, 0.1]} radius={0.04} smoothness={3} castShadow>
            <meshStandardMaterial ref={(m) => (mats.current[i] = m)} color={WORLD.accent} roughness={0.4} />
          </RoundedBox>
          {/* Film-strip notches so a chunk reads as "a bit of video". */}
          {[-0.24, -0.08, 0.08, 0.24].map((x) => (
            <mesh key={x} position={[x, 0.15, 0.055]}>
              <boxGeometry args={[0.09, 0.07, 0.01]} />
              <meshStandardMaterial color={WORLD.ink} roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  )
}

// ── Scene ───────────────────────────────────────────────────────────────────

export default function Scene({ step, speed }: { step: Step; speed: number }) {
  const live = useLive(PHONE_A)
  const towerBusy = step.streaming || step.ping !== null
  return (
    <Stage3D cam={step.cam} look={step.look} follow={step.follow} live={live}>
      <Landscape />

      <Phone p={PHONE_A}>
        <VideoScreen screen={step.screen} quality={step.quality} />
      </Phone>
      <Phone p={PHONE_B}>
        <OffScreen />
      </Phone>

      <Tower p={TOWER_A} />
      <Tower p={TOWER_B} />
      <RadioRings p={TOWER_TOP} active={towerBusy} weak={step.weak} />

      <Cable mode={step.jam ? 'jam' : step.ping?.route === 'far' || step.reels !== null ? 'flow' : 'off'} />
      <Cable points={EDGE_LINK} mode="off" />
      <Cable points={EDGE_FEED} mode="off" />
      <DataCenter p={DATACENTER} busy={step.jam || step.ping?.route === 'far' || step.reels !== null} />
      <EdgeServer busy={step.streaming || step.ping?.route === 'near'} stored={step.stored} />
      {SITES.map((p, i) => (
        <Site key={i} p={p} show={step.sites} order={i} />
      ))}
      {step.sites && (
        <group position={EDGE}>
          <Pin y={3} />
        </group>
      )}

      {step.ping && <Ping key={step.ping.route} route={step.ping.route} at={step.ping.at} ms={step.ms} speed={speed} live={live} />}
      {step.reels !== null && <TravellingReels at={step.reels} ms={step.ms} speed={speed} live={live} />}
      <ChunkStream active={step.streaming} quality={step.quality} />

      <Tag p={[DATACENTER[0], 2.8, DATACENTER[2] + 0.6]} text={`Origin · ${ORIGIN_KM} away`} show={step.stage === 'origin' && !step.jam} />
      <Tag p={[19, -0.6, 0]} text="Congested" tone="alert" show={step.jam} />
      <Tag p={[EDGE[0], 3.1, EDGE[2]]} text={`Edge server · ${EDGE_KM}`} show={step.stage === 'edge' && !step.sites} />
      <Tag p={[TOWER_A[0], TOWER_H + 0.9, TOWER_A[2]]} text="Weak signal" tone="alert" show={step.weak} />
    </Stage3D>
  )
}
