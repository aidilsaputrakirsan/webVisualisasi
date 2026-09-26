import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { DATACENTER, PHONE_A, TOWER_A, type Vec3 } from '../kit/geo'
import {
  CanvasScreen,
  Cable,
  DataCenter,
  Landscape,
  Phone,
  RadioRings,
  Rack,
  SANS,
  TEX_H,
  TEX_W,
  Tag,
  Tower,
  ease,
  screenBase,
  useDrawnTexture,
  useHop,
  type Live,
} from '../kit/world'
import Stage3D, { useLive } from '../kit/Stage3D'
import { WORLD } from '../kit/palette'
import {
  ACQUIRER,
  AMOUNT,
  HUB,
  HUB_NODES,
  MERCHANT,
  NMID,
  QR_STAND,
  SETTLE_FROM,
  SETTLE_TO,
  SOUNDBOX,
  WARUNG,
  pointOn,
  type RouteId,
  type Screen,
  type Step,
} from './story'

// ── QR drawing ──────────────────────────────────────────────────────────────

/** Deterministic pseudo-QR: finder squares + seeded modules (decorative). */
function drawQR(g: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const n = 25
  const m = size / n
  g.fillStyle = '#FFFFFF'
  g.fillRect(x, y, size, size)
  g.fillStyle = '#1C1814'
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  const inFinder = (i: number, j: number) => (i < 8 && j < 8) || (i < 8 && j >= n - 8) || (i >= n - 8 && j < 8)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (inFinder(i, j)) continue
      if (rand() > 0.52) g.fillRect(x + j * m, y + i * m, m + 0.5, m + 0.5)
    }
  }
  for (const [fi, fj] of [
    [0, 0],
    [0, n - 7],
    [n - 7, 0],
  ]) {
    g.fillRect(x + fj * m, y + fi * m, 7 * m, 7 * m)
    g.fillStyle = '#FFFFFF'
    g.fillRect(x + (fj + 1) * m, y + (fi + 1) * m, 5 * m, 5 * m)
    g.fillStyle = '#1C1814'
    g.fillRect(x + (fj + 2) * m, y + (fi + 2) * m, 3 * m, 3 * m)
  }
}

// ── Phone payment screen ────────────────────────────────────────────────────

function spinner(g: CanvasRenderingContext2D, t: number, cx: number, cy: number) {
  g.lineWidth = 10
  g.lineCap = 'round'
  g.strokeStyle = WORLD.accentSoft
  g.beginPath()
  g.arc(cx, cy, 46, 0, Math.PI * 2)
  g.stroke()
  g.strokeStyle = WORLD.accent
  g.beginPath()
  g.arc(cx, cy, 46, t * 6, t * 6 + Math.PI * 0.6)
  g.stroke()
}

function drawPay(g: CanvasRenderingContext2D, t: number, screen: Screen) {
  const cx = TEX_W / 2
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  if (screen === 'scan') {
    screenBase(g, '#1C1814')
    drawQR(g, cx - 110, 250, 220)
    // Viewfinder brackets.
    g.strokeStyle = WORLD.accent
    g.lineWidth = 8
    const x0 = cx - 150
    const y0 = 210
    const s = 300
    const L = 50
    for (const [px, py, dx, dy] of [
      [x0, y0, 1, 1],
      [x0 + s, y0, -1, 1],
      [x0, y0 + s, 1, -1],
      [x0 + s, y0 + s, -1, -1],
    ]) {
      g.beginPath()
      g.moveTo(px, py + dy * L)
      g.lineTo(px, py)
      g.lineTo(px + dx * L, py)
      g.stroke()
    }
    // Scan line sweeping.
    const sy = y0 + 20 + ((t * 0.8) % 1) * (s - 40)
    g.fillStyle = 'rgba(217,119,6,0.8)'
    g.fillRect(x0 + 20, sy, s - 40, 4)
    g.fillStyle = '#FFFFFF'
    g.font = `600 26px ${SANS}`
    g.fillText('Arahkan ke kode QRIS', cx, 600)
    return
  }

  screenBase(g, WORLD.screenOn)
  g.fillStyle = WORLD.ink
  g.font = `700 30px ${SANS}`
  g.fillText(screen === 'done' ? 'Berhasil' : 'Bayar', cx, 90)
  g.fillStyle = WORLD.inkSoft
  g.font = `500 24px ${SANS}`
  g.fillText(MERCHANT, cx, 150)

  if (screen === 'pay') {
    g.fillStyle = WORLD.ink
    g.font = `700 64px ${SANS}`
    g.fillText(AMOUNT, cx, 270)
    g.fillStyle = WORLD.inkSoft
    g.font = `500 22px ${SANS}`
    g.fillText('Masukkan PIN', cx, 390)
    for (let i = 0; i < 6; i++) {
      g.fillStyle = WORLD.ink
      g.beginPath()
      g.arc(cx - 125 + i * 50, 450, 13, 0, Math.PI * 2)
      g.fill()
    }
    g.fillStyle = WORLD.accent
    g.beginPath()
    g.roundRect(50, TEX_H - 150, TEX_W - 100, 80, 40)
    g.fill()
    g.fillStyle = '#FFFFFF'
    g.font = `700 30px ${SANS}`
    g.fillText('Bayar', cx, TEX_H - 110)
    return
  }
  if (screen === 'wait') {
    spinner(g, t, cx, 340)
    g.fillStyle = WORLD.ink
    g.font = `600 28px ${SANS}`
    g.fillText('Memproses…', cx, 460)
    return
  }
  // done
  g.fillStyle = WORLD.ledOk
  g.beginPath()
  g.arc(cx, 320, 80, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = '#FFFFFF'
  g.lineWidth = 14
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.beginPath()
  g.moveTo(cx - 36, 322)
  g.lineTo(cx - 8, 350)
  g.lineTo(cx + 40, 294)
  g.stroke()
  g.fillStyle = WORLD.ink
  g.font = `700 30px ${SANS}`
  g.fillText('Pembayaran berhasil', cx, 460)
  g.font = `700 52px ${SANS}`
  g.fillText(AMOUNT, cx, 540)
}

function PayScreen({ screen }: { screen: Screen }) {
  const animated = screen === 'scan' || screen === 'wait'
  return <CanvasScreen draw={(g, t) => drawPay(g, t, screen)} deps={[screen]} fps={animated ? 24 : 0} />
}

// ── Warung ──────────────────────────────────────────────────────────────────

function QrStandee() {
  const tex = useDrawnTexture(320, 420, (g) => {
    g.fillStyle = '#FFFFFF'
    g.fillRect(0, 0, 320, 420)
    g.fillStyle = WORLD.alert
    g.fillRect(0, 0, 320, 64)
    g.fillStyle = '#FFFFFF'
    g.font = `800 40px ${SANS}`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText('QRIS', 160, 34)
    drawQR(g, 40, 84, 240)
    g.fillStyle = WORLD.ink
    g.font = `700 24px ${SANS}`
    g.fillText(MERCHANT, 160, 356)
    g.fillStyle = WORLD.inkSoft
    g.font = `500 18px ${SANS}`
    g.fillText(`NMID ${NMID}`, 160, 392)
  })
  return (
    <group position={QR_STAND}>
      <mesh position={[0, 0.02, -0.06]} rotation={[-0.25, 0, 0]} castShadow>
        <boxGeometry args={[0.1, 0.5, 0.06]} />
        <meshStandardMaterial color={WORLD.metalDark} />
      </mesh>
      <mesh position={[0, 0.38, 0]} rotation={[-0.12, 0, 0]} castShadow>
        <planeGeometry args={[0.62, 0.82]} />
        <meshBasicMaterial map={tex} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function Soundbox({ active }: { active: boolean }) {
  const grille = useRef<THREE.MeshStandardMaterial>(null!)
  useFrame((state) => {
    if (grille.current) grille.current.emissiveIntensity = active ? 0.6 + Math.sin(state.clock.elapsedTime * 14) * 0.4 : 0
  })
  return (
    <group position={SOUNDBOX}>
      <RoundedBox args={[0.5, 0.42, 0.4]} radius={0.06} smoothness={3} position={[0, 0.21, 0]} castShadow>
        <meshStandardMaterial color={WORLD.phoneBody} roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.22, 0.205]}>
        <circleGeometry args={[0.14, 24]} />
        <meshStandardMaterial ref={grille} color={WORLD.metal} emissive={WORLD.accent} emissiveIntensity={0} />
      </mesh>
    </group>
  )
}

function Warung({ soundbox }: { soundbox: boolean }) {
  const sign = useDrawnTexture(512, 128, (g) => {
    g.fillStyle = WORLD.accentSoft
    g.fillRect(0, 0, 512, 128)
    g.fillStyle = WORLD.accentDeep
    g.font = `800 58px ${SANS}`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(MERCHANT.toUpperCase(), 256, 68)
  })
  const stripes = 6
  return (
    <group>
      <group position={WARUNG}>
        {/* Counter */}
        <RoundedBox args={[2.8, 1.1, 1.2]} radius={0.06} smoothness={3} position={[0, 0.55, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={WORLD.wood} roughness={0.8} />
        </RoundedBox>
        <mesh position={[0, 1.13, 0]} castShadow>
          <boxGeometry args={[3, 0.06, 1.4]} />
          <meshStandardMaterial color={WORLD.woodDark} roughness={0.7} />
        </mesh>
        {/* Poles */}
        {[-1.35, 1.35].map((x) => (
          <mesh key={x} position={[x, 1.3, -0.5]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 2.6, 8]} />
            <meshStandardMaterial color={WORLD.woodDark} />
          </mesh>
        ))}
        {/* Striped awning */}
        <group position={[0, 2.62, 0.05]} rotation={[0.32, 0, 0]}>
          {Array.from({ length: stripes }, (_, i) => (
            <mesh key={i} position={[-1.5 + (i + 0.5) * (3 / stripes), 0, 0]} castShadow>
              <boxGeometry args={[3 / stripes, 0.06, 1.5]} />
              <meshStandardMaterial color={i % 2 ? '#FFFFFF' : WORLD.accent} roughness={0.7} />
            </mesh>
          ))}
        </group>
        {/* Name banner on the counter front (visible in every warung shot). */}
        <mesh position={[0, 0.6, 0.605]}>
          <planeGeometry args={[2.5, 0.62]} />
          <meshBasicMaterial map={sign} toneMapped={false} />
        </mesh>
      </group>
      <QrStandee />
      <Soundbox active={soundbox} />
      <RadioRings p={[SOUNDBOX[0], SOUNDBOX[1] + 0.3, SOUNDBOX[2] + 0.3]} active={soundbox} />
    </group>
  )
}

/** Translucent scan cone from the phone screen to the QR standee. */
function ScanBeam({ active }: { active: boolean }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null!)
  const geom = useMemo(() => {
    const top: Vec3 = [PHONE_A[0] - 0.45, 1.9, PHONE_A[2] + 0.1]
    const bot: Vec3 = [PHONE_A[0] - 0.45, 0.65, PHONE_A[2] + 0.1]
    const qr: Vec3 = [QR_STAND[0], QR_STAND[1] + 0.38, QR_STAND[2]]
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([...top, ...bot, ...qr], 3))
    g.computeVertexNormals()
    return g
  }, [])
  useFrame((state, dt) => {
    if (!mat.current) return
    const target = active ? 0.22 + Math.sin(state.clock.elapsedTime * 8) * 0.08 : 0
    mat.current.opacity = THREE.MathUtils.lerp(mat.current.opacity, target, ease(dt, 0.001))
  })
  return (
    <mesh geometry={geom}>
      <meshBasicMaterial ref={mat} color={WORLD.accent} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}

// ── Servers on land B ───────────────────────────────────────────────────────

const NODE_COLORS = [WORLD.info, WORLD.ledOk, WORLD.sat4, WORLD.alert, WORLD.accent, WORLD.metalDark]

/** Switching hub: a round "airport" with spokes to every bank / e-wallet. */
function SwitchingHub({ active }: { active: boolean }) {
  const ring = useRef<THREE.MeshStandardMaterial>(null!)
  const dots = useRef<(THREE.Mesh | null)[]>([])
  const glow = useRef(0)
  useFrame((state, dt) => {
    glow.current = THREE.MathUtils.lerp(glow.current, active ? 1 : 0, ease(dt, 0.01))
    if (ring.current) ring.current.emissiveIntensity = 0.2 + glow.current * (0.8 + Math.sin(state.clock.elapsedTime * 5) * 0.3)
    dots.current.forEach((m, i) => {
      if (!m) return
      const node = HUB_NODES[i]
      const u = (state.clock.elapsedTime * 0.8 + i * 0.17) % 1
      const out = i % 2 === 0 ? u : 1 - u
      m.position.set(HUB[0] + (node[0] - HUB[0]) * out, 0.55, HUB[2] + (node[2] - HUB[2]) * out)
      m.scale.setScalar(Math.max(0.0001, glow.current))
    })
  })
  return (
    <group>
      <group position={HUB}>
        <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.05, 1.15, 1.2, 40]} />
          <meshStandardMaterial color={WORLD.tray} roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.08, 0.07, 12, 48]} />
          <meshStandardMaterial ref={ring} color={WORLD.accent} emissive={WORLD.accent} emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0, 1.3, 0]}>
          <sphereGeometry args={[0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={WORLD.landTop} roughness={0.5} />
        </mesh>
      </group>
      {HUB_NODES.map((n, i) => (
        <group key={i}>
          <Line
            points={[
              [HUB[0], 0.55, HUB[2]],
              [n[0], 0.55, n[2]],
            ]}
            color={active ? WORLD.accent : WORLD.lineStrong}
            lineWidth={active ? 3.5 : 2}
          />
          <group position={n}>
            <RoundedBox args={[0.8, 0.8, 0.8]} radius={0.08} smoothness={3} position={[0, 0.4, 0]} castShadow>
              <meshStandardMaterial color={WORLD.tray} roughness={0.6} />
            </RoundedBox>
            <mesh position={[0, 0.83, 0]}>
              <boxGeometry args={[0.82, 0.08, 0.82]} />
              <meshStandardMaterial color={NODE_COLORS[i]} />
            </mesh>
          </group>
          <mesh ref={(m) => (dots.current[i] = m)}>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshBasicMaterial color={WORLD.accent} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/** The merchant's bank: a small row of racks. */
function Acquirer({ busy }: { busy: boolean }) {
  return (
    <group position={ACQUIRER}>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[3.8, 0.1, 1.8]} />
        <meshStandardMaterial color={WORLD.tray} roughness={0.8} />
      </mesh>
      {[-1.15, 0, 1.15].map((x, i) => (
        <Rack key={x} p={[x, 0.1, 0]} busy={busy} seed={20 + i} />
      ))}
    </group>
  )
}

// ── Payment packet + settlement ─────────────────────────────────────────────

function Packet({ route, at, ms, speed, live }: { route: RouteId; at: number; ms: number; speed: number; live: Live }) {
  const { s, hop } = useHop(at, ms, speed, 0)
  const dots = useRef<(THREE.Mesh | null)[]>([])
  useFrame(() => {
    const moving = hop.current.p < 1 ? 1 : 0
    live.pos.set(...pointOn(route, s.current))
    dots.current.forEach((m, i) => {
      if (!m) return
      m.position.set(...pointOn(route, s.current - i * 0.05 * moving))
      m.scale.setScalar(1 - i * 0.15)
    })
  })
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} ref={(m) => (dots.current[i] = m)}>
          <sphereGeometry args={[0.24, 16, 16]} />
          <meshBasicMaterial color={WORLD.accent} toneMapped={false} transparent opacity={1 - i * 0.17} />
        </mesh>
      ))}
    </>
  )
}

/** The slow interbank settlement: a high dashed arc between the two banks. */
function Settlement({ show }: { show: boolean }) {
  const points = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...SETTLE_FROM),
      new THREE.Vector3((SETTLE_FROM[0] + SETTLE_TO[0]) / 2, 7, (SETTLE_FROM[2] + SETTLE_TO[2]) / 2),
      new THREE.Vector3(...SETTLE_TO),
    )
    return curve.getPoints(60)
  }, [])
  const dot = useRef<THREE.Mesh>(null!)
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points])
  useFrame((state) => {
    if (!dot.current) return
    // Deliberately slow: settlement is not instant.
    dot.current.position.copy(curve.getPointAt((state.clock.elapsedTime * 0.08) % 1))
  })
  if (!show) return null
  return (
    <>
      <Line points={points} color={WORLD.metalDark} lineWidth={3} dashed dashSize={0.35} gapSize={0.25} />
      <mesh ref={dot}>
        <sphereGeometry args={[0.22, 14, 14]} />
        <meshStandardMaterial color={WORLD.metal} />
      </mesh>
    </>
  )
}

// ── Scene ───────────────────────────────────────────────────────────────────

export default function Scene({ step, speed }: { step: Step; speed: number }) {
  const live = useLive(PHONE_A)
  const crossingSea = step.packet?.route === 'toIssuer' || step.packet?.route === 'back'
  return (
    <Stage3D cam={step.cam} look={step.look} follow={step.follow} live={live}>
      <Landscape />

      <Phone p={PHONE_A}>
        <PayScreen screen={step.screen} />
      </Phone>
      <Tower p={TOWER_A} />
      <Cable mode={crossingSea ? 'flow' : 'off'} />

      <Warung soundbox={step.soundbox} />
      <ScanBeam active={step.scanBeam} />

      <DataCenter p={DATACENTER} busy={step.stage === 'issuer' || step.stage === 'switch'} />
      <SwitchingHub active={step.hubActive} />
      <Acquirer busy={step.stage === 'acquirer'} />
      <Settlement show={step.settlement} />

      {step.packet && (
        <Packet key={step.packet.route} route={step.packet.route} at={step.packet.at} ms={step.ms} speed={speed} live={live} />
      )}

      {/* What the QR actually holds. */}
      <Tag p={[QR_STAND[0] + 1.45, QR_STAND[1] + 1.05, QR_STAND[2] + 0.2]} text={MERCHANT} show={step.qrTags} upper={false} factor={6} />
      <Tag p={[QR_STAND[0] + 1.45, QR_STAND[1] + 0.6, QR_STAND[2] + 0.2]} text={`NMID ${NMID}`} show={step.qrTags} upper={false} factor={6} />
      <Tag p={[QR_STAND[0] + 1.45, QR_STAND[1] + 0.15, QR_STAND[2] + 0.2]} text="Bank penjual" show={step.qrTags} upper={false} factor={6} />

      <Tag p={[DATACENTER[0], 2.9, DATACENTER[2] + 0.6]} text="Server e-wallet kamu" show={step.stage === 'issuer'} />
      <Tag p={[HUB[0], 2.6, HUB[2]]} text="Switching" show={step.stage === 'switch'} />
      <Tag p={[ACQUIRER[0], 3, ACQUIRER[2]]} text="Bank penjual" show={step.stage === 'acquirer'} />
      <Tag
        p={[WARUNG[0] + 0.1, 3.35, WARUNG[2] + 0.9]}
        text="“Pembayaran diterima, lima belas ribu rupiah”"
        show={step.soundbox}
        upper={false}
        factor={8}
      />
      <Tag p={[(SETTLE_FROM[0] + SETTLE_TO[0]) / 2, 5.5, (SETTLE_FROM[2] + SETTLE_TO[2]) / 2]} text="Setelmen antarbank · nanti" show={step.settlement} factor={18} />
    </Stage3D>
  )
}
