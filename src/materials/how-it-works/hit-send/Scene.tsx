import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { DATACENTER, PHONE_A, PHONE_B, PHONE_SCREEN_Y, TOWER_A, TOWER_B, TOWER_H, type Vec3 } from '../kit/geo'
import {
  CanvasScreen,
  Cable,
  DataCenter,
  Landscape,
  Phone,
  RadioRings,
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
import { FRIEND, MESSAGE, QUEUE_TRAY, ROUTE, routePoint, type Stage, type Step } from './journey'

// ── Chat screen ─────────────────────────────────────────────────────────────

interface ChatProps {
  owner: 'sender' | 'friend'
  on: boolean
  /** Sender: bubble sent (else still a draft in the input). Friend: bubble received. */
  bubble: boolean
  ticks: 0 | 1 | 2
  tapping: boolean
}

function drawChat(g: CanvasRenderingContext2D, { owner, on, bubble, ticks, tapping }: ChatProps) {
  const mine = owner === 'sender'
  screenBase(g, on ? WORLD.screenOn : WORLD.screenOff)
  if (!on) return

  // Header: avatar + contact name.
  g.fillStyle = mine ? WORLD.info : WORLD.accent
  g.beginPath()
  g.arc(58, 92, 26, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = WORLD.ink
  g.font = `700 34px ${SANS}`
  g.textBaseline = 'middle'
  g.fillText(mine ? FRIEND : 'Alex', 100, 93)
  g.fillStyle = WORLD.accentSoft
  g.fillRect(0, 140, TEX_W, 3)

  // Input bar + send button.
  const barY = TEX_H - 96
  g.fillStyle = '#F4EFE7'
  g.beginPath()
  g.roundRect(22, barY, TEX_W - 130, 68, 34)
  g.fill()
  g.font = `500 28px ${SANS}`
  g.fillStyle = mine && !bubble ? WORLD.ink : WORLD.inkSoft
  g.fillText(mine && !bubble ? MESSAGE : 'Message', 44, barY + 35)
  const bx = TEX_W - 62
  const by = barY + 34
  if (tapping) {
    g.fillStyle = WORLD.accentSoft
    g.beginPath()
    g.arc(bx, by, 50, 0, Math.PI * 2)
    g.fill()
  }
  g.fillStyle = WORLD.accent
  g.beginPath()
  g.arc(bx, by, tapping ? 30 : 36, 0, Math.PI * 2)
  g.fill()
  g.strokeStyle = '#FFFFFF'
  g.lineWidth = 5
  g.lineCap = 'round'
  g.lineJoin = 'round'
  g.beginPath()
  g.moveTo(bx - 14, by)
  g.lineTo(bx + 12, by)
  g.moveTo(bx + 1, by - 11)
  g.lineTo(bx + 12, by)
  g.lineTo(bx + 1, by + 11)
  g.stroke()

  // The message bubble.
  if (bubble) {
    g.font = `500 34px ${SANS}`
    const tw = g.measureText(MESSAGE).width
    const bw = tw + 48
    const bh = 76
    const bxl = mine ? TEX_W - 24 - bw : 24
    const byt = barY - 70 - bh
    g.fillStyle = mine ? WORLD.accent : '#F1ECE4'
    g.beginPath()
    g.roundRect(bxl, byt, bw, bh, mine ? [30, 30, 8, 30] : [30, 30, 30, 8])
    g.fill()
    g.fillStyle = mine ? '#FFFFFF' : WORLD.ink
    g.fillText(MESSAGE, bxl + 24, byt + bh / 2 + 1)
    if (mine) {
      g.font = `600 26px ${SANS}`
      g.fillStyle = ticks === 2 ? WORLD.info : WORLD.inkSoft
      g.textAlign = 'right'
      g.fillText(ticks === 0 ? 'sending…' : ticks === 1 ? '✓' : '✓✓', TEX_W - 28, byt + bh + 30)
    }
  }
}

function ChatScreen(props: ChatProps) {
  const { owner, on, bubble, ticks, tapping } = props
  return <CanvasScreen draw={(g) => drawChat(g, props)} deps={[owner, on, bubble, ticks, tapping]} />
}

// ── Queue ───────────────────────────────────────────────────────────────────

/** The queue tray: a row of slots with other people's messages already waiting. */
function QueueTray() {
  const slots = [-1.2, -0.4, 0.4, 1.2]
  return (
    <group position={QUEUE_TRAY}>
      <RoundedBox args={[3.2, 0.3, 0.9]} radius={0.08} smoothness={3} position={[0, 0.15, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={WORLD.tray} roughness={0.6} />
      </RoundedBox>
      {slots.map((x, i) => (
        <mesh key={x} position={[x, 0.31, 0]}>
          <boxGeometry args={[0.62, 0.02, 0.62]} />
          <meshStandardMaterial color={i < 2 ? WORLD.lineStrong : WORLD.accentSoft} roughness={0.8} />
        </mesh>
      ))}
      {/* Other messages already waiting for their own recipients. */}
      {slots.slice(0, 2).map((x) => (
        <RoundedBox key={x} args={[0.42, 0.42, 0.42]} radius={0.06} smoothness={3} position={[x, 0.54, 0]} castShadow>
          <meshStandardMaterial color={WORLD.metal} roughness={0.5} />
        </RoundedBox>
      ))}
    </group>
  )
}

// ── The message itself ──────────────────────────────────────────────────────

const QUEUE_SLOT: Vec3 = [QUEUE_TRAY[0] + 0.4, 0.54, QUEUE_TRAY[2]]

function Padlock() {
  return (
    <group position={[0, 0, 0.27]}>
      <mesh position={[0, -0.03, 0]}>
        <boxGeometry args={[0.2, 0.16, 0.05]} />
        <meshStandardMaterial color={WORLD.ink} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.07, 0]}>
        <torusGeometry args={[0.065, 0.02, 8, 16, Math.PI]} />
        <meshStandardMaterial color={WORLD.ink} roughness={0.4} />
      </mesh>
    </group>
  )
}

function Message({ step, speed, live }: { step: Step; speed: number; live: Live }) {
  const { s, hop } = useHop(step.at, step.ms, speed)
  const cube = useRef<THREE.Group>(null!)
  const packets = useRef<(THREE.Group | null)[]>([])
  const spread = useRef(0)
  const cubeScale = useRef(0)
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, dt) => {
    // Packets trail one another while travelling, fan out side by side at rest.
    const p = hop.current.p
    const moving = p < 1 ? Math.min(1, Math.sin(p * Math.PI) * 3) : 0
    spread.current = THREE.MathUtils.lerp(spread.current, step.form === 'packets' ? 1 : 0, ease(dt, 0.004))
    cubeScale.current = THREE.MathUtils.lerp(cubeScale.current, step.form === 'cube' ? 1 : 0, ease(dt, 0.004))

    const base = step.queued ? QUEUE_SLOT : routePoint(s.current)
    live.pos.set(...base)
    live.s = s.current
    const bob = Math.sin(state.clock.elapsedTime * 2.4) * 0.05

    if (cube.current) {
      tmp.set(base[0], base[1] + bob, base[2])
      cube.current.position.lerp(tmp, step.queued ? ease(dt, 0.02) : 1)
      cube.current.scale.setScalar(Math.max(0.0001, cubeScale.current))
      cube.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.35
    }

    packets.current.forEach((g, i) => {
      if (!g) return
      const trail = routePoint(s.current - i * 0.16 * moving)
      const lateral = (i - 1.5) * 0.38 * (1 - moving)
      tmp.set(trail[0] + lateral, trail[1] + bob * (i % 2 ? -1 : 1), trail[2])
      g.position.copy(tmp)
      g.scale.setScalar(Math.max(0.0001, spread.current))
      g.rotation.set(state.clock.elapsedTime * (0.8 + i * 0.2), state.clock.elapsedTime * 0.6, 0)
    })
  })

  return (
    <>
      <group ref={cube}>
        <RoundedBox args={[0.5, 0.5, 0.5]} radius={0.08} smoothness={4} castShadow>
          <meshStandardMaterial color={WORLD.accent} emissive={WORLD.accent} emissiveIntensity={0.25} roughness={0.35} />
        </RoundedBox>
        <Padlock />
      </group>
      {[0, 1, 2, 3].map((i) => (
        <group key={i} ref={(g) => (packets.current[i] = g)}>
          <RoundedBox args={[0.28, 0.28, 0.28]} radius={0.05} smoothness={3} castShadow>
            <meshStandardMaterial color={WORLD.accent} emissive={WORLD.accent} emissiveIntensity={0.45} roughness={0.35} />
          </RoundedBox>
        </group>
      ))}
    </>
  )
}

/** Dashed trail showing the route travelled so far (grows with the message). */
function RouteTrail({ live }: { live: Live }) {
  const SAMPLES = 400
  const obj = useMemo(() => {
    const max = ROUTE.length - 1
    const pts = Array.from({ length: SAMPLES + 1 }, (_, i) => new THREE.Vector3(...routePoint((i / SAMPLES) * max)))
    const l = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineDashedMaterial({ color: WORLD.accent, dashSize: 0.18, gapSize: 0.14, transparent: true, opacity: 0.7 }),
    )
    l.computeLineDistances()
    return l
  }, [])
  useFrame(() => {
    const n = Math.round((live.s / (ROUTE.length - 1)) * SAMPLES)
    obj.geometry.setDrawRange(0, Math.max(0, n))
  })
  return <primitive object={obj} />
}

// ── Scene ───────────────────────────────────────────────────────────────────

const TAGS: { stage: Stage; p: Vec3; text: string }[] = [
  { stage: 'tower', p: [TOWER_A[0], TOWER_H + 0.9, TOWER_A[2]], text: 'Cell tower' },
  { stage: 'ocean', p: [19, -0.9, 0], text: 'Undersea cable' },
  { stage: 'server', p: [DATACENTER[0], 3.3, DATACENTER[2] - 0.8], text: 'Data center' },
  { stage: 'queue', p: [QUEUE_TRAY[0], 1.35, QUEUE_TRAY[2]], text: `Queue · for ${FRIEND}` },
]

export default function Scene({ step, speed }: { step: Step; speed: number }) {
  const live = useLive(routePoint(step.at))
  return (
    <Stage3D cam={step.cam} look={step.look} follow={step.follow} live={live}>
      <Landscape />

      <Phone p={PHONE_A}>
        <ChatScreen owner="sender" on bubble={step.bubbleA} ticks={step.ticks} tapping={step.cue === 'tap'} />
      </Phone>
      <Phone p={PHONE_B}>
        <ChatScreen owner="friend" on={step.friendOnline} bubble={step.bubbleB} ticks={0} tapping={false} />
      </Phone>

      <Tower p={TOWER_A} />
      <Tower p={TOWER_B} />
      <RadioRings p={[PHONE_A[0], PHONE_SCREEN_Y + 1.3, PHONE_A[2] + 0.3]} active={step.radio && step.stage === 'tower'} />
      <RadioRings p={[TOWER_A[0], TOWER_H, TOWER_A[2] + 0.3]} active={step.radio && step.stage === 'tower'} />
      <RadioRings p={[TOWER_B[0], TOWER_H, TOWER_B[2] + 0.3]} active={step.radio && step.stage === 'friend'} />

      <Cable mode={step.fiber ? 'flow' : 'off'} />
      <DataCenter p={DATACENTER} busy={step.serverBusy} />
      <QueueTray />

      <RouteTrail live={live} />
      <Message step={step} speed={speed} live={live} />

      {TAGS.map((t) => (
        <Tag key={t.text} p={t.p} text={t.text} show={step.stage === t.stage} />
      ))}
    </Stage3D>
  )
}
