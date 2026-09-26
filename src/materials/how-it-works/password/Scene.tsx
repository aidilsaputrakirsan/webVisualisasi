import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { DATACENTER, PHONE_A, TOWER_A, type Vec3 } from '../kit/geo'
import {
  CanvasScreen,
  Cable,
  DataCenter,
  Landscape,
  Phone,
  SANS,
  TEX_H,
  TEX_W,
  Tag,
  Tower,
  ease,
  easeInOut,
  screenBase,
  useDrawnTexture,
} from '../kit/world'
import Stage3D, { useLive } from '../kit/Stage3D'
import { WORLD } from '../kit/palette'
import { COMMON_GUESSES, HASH, HASHER, LEET_GUESSES, ODOMETER, RIG, WEAK, type Step, type Strength, type Wheels } from './story'

const MONO = '"JetBrains Mono", ui-monospace, monospace'

/** Seconds since `active` last turned on (null while off). */
function useSince(active: boolean, key: unknown = null) {
  const since = useRef<number | null>(null)
  const lastKey = useRef<unknown>(key)
  useFrame((state) => {
    if (!active) since.current = null
    else if (since.current === null || lastKey.current !== key) since.current = state.clock.elapsedTime
    lastKey.current = key
  })
  return since
}

// ── Phone sign-up screen ────────────────────────────────────────────────────

function drawSignup(g: CanvasRenderingContext2D, field: string, strength: Strength) {
  screenBase(g, WORLD.screenOn)
  g.textBaseline = 'middle'
  g.fillStyle = WORLD.ink
  g.font = `700 34px ${SANS}`
  g.fillText('Create account', 36, 100)
  const box = (y: number, label: string, value: string) => {
    g.fillStyle = WORLD.inkSoft
    g.font = `500 22px ${SANS}`
    g.fillText(label, 36, y)
    g.fillStyle = '#F4EFE7'
    g.beginPath()
    g.roundRect(28, y + 20, TEX_W - 56, 70, 16)
    g.fill()
    g.fillStyle = WORLD.ink
    g.font = `600 ${value.length > 20 ? 21 : 28}px ${MONO}`
    g.fillText(value, 46, y + 56)
  }
  box(190, 'Email', 'you@mail.com')
  box(330, 'Password', field)
  // Strength meter.
  const weak = strength === 'weak'
  g.fillStyle = WORLD.lineStrong
  g.fillRect(36, 452, TEX_W - 72, 12)
  g.fillStyle = weak ? WORLD.alert : WORLD.ledOk
  g.fillRect(36, 452, (TEX_W - 72) * (weak ? 0.22 : 1), 12)
  g.font = `700 24px ${SANS}`
  g.fillText(weak ? 'Weak' : 'Strong', 36, 494)
  g.fillStyle = WORLD.accent
  g.beginPath()
  g.roundRect(36, TEX_H - 150, TEX_W - 72, 80, 40)
  g.fill()
  g.fillStyle = '#FFFFFF'
  g.font = `700 30px ${SANS}`
  g.textAlign = 'center'
  g.fillText('Sign up', TEX_W / 2, TEX_H - 110)
}

function SignupScreen({ field, strength }: { field: string; strength: Strength }) {
  return <CanvasScreen draw={(g) => drawSignup(g, field, strength)} deps={[field, strength]} />
}

// ── The site's hash machine ─────────────────────────────────────────────────

function PasswordTile({ active }: { active: boolean }) {
  const g = useRef<THREE.Group>(null!)
  const since = useSince(active)
  const tex = useDrawnTexture(512, 128, (c) => {
    c.fillStyle = '#FFFFFF'
    c.fillRect(0, 0, 512, 128)
    c.fillStyle = WORLD.ink
    c.font = `700 58px ${MONO}`
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillText(WEAK, 256, 66)
  })
  useFrame((state) => {
    if (!g.current) return
    const p = since.current === null ? 1 : Math.min(1, (state.clock.elapsedTime - since.current) / 1.3)
    // Falls from above into the funnel, shrinking as it goes in.
    g.current.position.set(HASHER[0], HASHER[1] + 5.2 - easeInOut(p) * 2.6, HASHER[2])
    g.current.scale.setScalar(Math.max(0.0001, active && p < 1 ? 1 - p * 0.7 : 0))
  })
  return (
    <group ref={g}>
      <RoundedBox args={[2, 0.5, 0.12]} radius={0.05} smoothness={3}>
        <meshStandardMaterial color="#FFFFFF" />
      </RoundedBox>
      <mesh position={[0, 0, 0.065]}>
        <planeGeometry args={[1.9, 0.46]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  )
}

function HashStrip({ show, delay }: { show: boolean; delay: boolean }) {
  const g = useRef<THREE.Group>(null!)
  const k = useRef(show ? 1 : 0)
  const since = useSince(show)
  const tex = useDrawnTexture(560, 96, (c) => {
    c.fillStyle = '#FFFFFF'
    c.fillRect(0, 0, 560, 96)
    c.fillStyle = WORLD.accentDeep
    c.font = `700 44px ${MONO}`
    c.textBaseline = 'middle'
    c.fillText(HASH.slice(0, 16) + '…', 24, 50)
  })
  useFrame((state, dt) => {
    if (!g.current) return
    const wait = delay && since.current !== null && state.clock.elapsedTime - since.current < 1.3
    k.current = THREE.MathUtils.lerp(k.current, show && !wait ? 1 : 0, ease(dt, 0.02))
    // Slides out of the machine's slot like a receipt.
    g.current.position.set(HASHER[0] + 0.9 + k.current * 1.2, HASHER[1] + 0.95, HASHER[2] + 0.62)
    g.current.scale.set(Math.max(0.0001, k.current), 1, 1)
  })
  return (
    <group ref={g}>
      <mesh>
        <planeGeometry args={[2.4, 0.42]} />
        <meshBasicMaterial map={tex} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function HashMachine({ grinding }: { grinding: boolean }) {
  const gears = useRef<(THREE.Mesh | null)[]>([])
  useFrame((_, dt) => {
    gears.current.forEach((m, i) => {
      if (m) m.rotation.z += dt * (grinding ? 4 : 0.4) * (i ? -1 : 1)
    })
  })
  return (
    <group position={HASHER}>
      <RoundedBox args={[1.8, 1.6, 1.2]} radius={0.08} smoothness={3} position={[0, 0.8, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={WORLD.metal} roughness={0.5} metalness={0.3} />
      </RoundedBox>
      {/* Funnel */}
      <mesh position={[0, 1.95, 0]} castShadow>
        <cylinderGeometry args={[0.75, 0.25, 0.7, 24, 1, true]} />
        <meshStandardMaterial color={WORLD.metalDark} side={THREE.DoubleSide} roughness={0.5} />
      </mesh>
      {/* Gears on the front */}
      {[
        [-0.38, 0.95, 0.4],
        [0.3, 0.7, 0.3],
      ].map(([x, y, r], i) => (
        <mesh key={i} ref={(m) => (gears.current[i] = m)} position={[x, y, 0.61]}>
          <torusGeometry args={[r, 0.07, 8, 12]} />
          <meshStandardMaterial color={WORLD.accent} roughness={0.4} />
        </mesh>
      ))}
      {/* Output slot */}
      <mesh position={[0.9, 0.95, 0.61]}>
        <boxGeometry args={[0.06, 0.42, 0.04]} />
        <meshStandardMaterial color={WORLD.ink} />
      </mesh>
    </group>
  )
}

// ── Leak + attacker rig ─────────────────────────────────────────────────────

function Leak({ active }: { active: boolean }) {
  const dots = useRef<(THREE.Mesh | null)[]>([])
  const fade = useRef(0)
  const curve = useMemo(
    () =>
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(DATACENTER[0] + 1.5, 2.2, DATACENTER[2]),
        new THREE.Vector3((DATACENTER[0] + RIG[0]) / 2, 6, (DATACENTER[2] + RIG[2]) / 2),
        new THREE.Vector3(RIG[0], 1.6, RIG[2]),
      ),
    [],
  )
  useFrame((state, dt) => {
    fade.current = THREE.MathUtils.lerp(fade.current, active ? 1 : 0, ease(dt, 0.01))
    dots.current.forEach((m, i) => {
      if (!m) return
      const u = (state.clock.elapsedTime * 0.5 + i / 10) % 1
      m.position.copy(curve.getPointAt(u))
      m.scale.setScalar(Math.max(0.0001, fade.current))
    })
  })
  return (
    <>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} ref={(m) => (dots.current[i] = m)}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshBasicMaterial color={WORLD.alert} toneMapped={false} />
        </mesh>
      ))}
    </>
  )
}

/** Terminal on the rig: guesses scroll, each hashed and compared. */
function drawTerminal(g: CanvasRenderingContext2D, W: number, H: number, list: string[], shown: number, target: string) {
  g.fillStyle = '#15120F'
  g.fillRect(0, 0, W, H)
  g.font = `600 30px ${MONO}`
  g.textBaseline = 'middle'
  const rows = 8
  const start = Math.max(0, shown - rows)
  for (let r = 0; r < Math.min(rows, shown); r++) {
    const guess = list[start + r]
    const hit = guess === target
    const y = 40 + r * 46
    g.fillStyle = hit ? '#34D399' : '#C9BFB2'
    g.fillText(guess.padEnd(12, ' '), 24, y)
    g.fillStyle = hit ? '#34D399' : '#F87171'
    g.fillText(hit ? '✓ MATCH' : '✗', 330, y)
  }
}

function Terminal({ mode }: { mode: Step['terminal'] }) {
  const list = mode === 'leet' ? LEET_GUESSES : COMMON_GUESSES
  const target = mode === 'leet' ? 'P@ssw0rd!' : WEAK
  const W = 512
  const H = 400
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    return c
  }, [])
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [canvas])
  const since = useSince(mode !== 'off', mode)
  const last = useRef(-1)
  useFrame((state) => {
    const t = since.current === null ? 0 : state.clock.elapsedTime - since.current
    const shown = mode === 'off' ? 0 : Math.min(list.length, Math.floor(t * 6) + 1)
    if (shown === last.current) return
    last.current = shown
    drawTerminal(canvas.getContext('2d')!, W, H, list, shown, target)
    tex.needsUpdate = true
  })
  return (
    <mesh position={[RIG[0], 2.35, RIG[2] + 0.42]}>
      <planeGeometry args={[2.3, 1.8]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  )
}

function Rig({ busy, mode }: { busy: boolean; mode: Step['terminal'] }) {
  const fans = useRef<(THREE.Group | null)[]>([])
  const led = useRef<THREE.MeshStandardMaterial>(null!)
  useFrame((state, dt) => {
    fans.current.forEach((f) => {
      if (f) f.rotation.z += dt * (busy ? 18 : 2)
    })
    if (led.current) led.current.emissiveIntensity = busy ? 1.2 + Math.sin(state.clock.elapsedTime * 10) * 0.5 : 0.4
  })
  return (
    <group>
      <group position={RIG}>
        <RoundedBox args={[2.6, 1.2, 1.1]} radius={0.08} smoothness={3} position={[0, 0.6, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={WORLD.phoneBody} roughness={0.5} />
        </RoundedBox>
        {[-0.8, 0, 0.8].map((x, i) => (
          <group key={x} position={[x, 0.62, 0.56]}>
            <mesh>
              <circleGeometry args={[0.34, 24]} />
              <meshStandardMaterial color={WORLD.rackFace} />
            </mesh>
            <group ref={(f) => (fans.current[i] = f)} position={[0, 0, 0.01]}>
              {[0, 1, 2].map((b) => (
                <mesh key={b} rotation={[0, 0, (b / 3) * Math.PI * 2]} position={[0, 0, 0]}>
                  <boxGeometry args={[0.06, 0.56, 0.01]} />
                  <meshStandardMaterial color={WORLD.metal} />
                </mesh>
              ))}
            </group>
          </group>
        ))}
        <mesh position={[0, 0.12, 0.56]}>
          <boxGeometry args={[2.2, 0.06, 0.02]} />
          <meshStandardMaterial ref={led} color={WORLD.alert} emissive={WORLD.alert} emissiveIntensity={0.4} />
        </mesh>
        {/* Monitor stand */}
        <mesh position={[0, 1.35, 0.3]}>
          <boxGeometry args={[0.12, 0.35, 0.12]} />
          <meshStandardMaterial color={WORLD.metalDark} />
        </mesh>
        <RoundedBox args={[2.5, 2, 0.12]} radius={0.05} smoothness={3} position={[0, 2.35, 0.34]} castShadow>
          <meshStandardMaterial color={WORLD.phoneBody} />
        </RoundedBox>
      </group>
      <Terminal mode={mode} />
    </group>
  )
}

// ── Brute-force odometer ────────────────────────────────────────────────────

const LOWER = 'abcdefghijklmnopqrstuvwxyz'
/** The 94 visible ASCII characters (space left out so every flip shows a glyph). */
const ALL = Array.from({ length: 94 }, (_, i) => String.fromCharCode(33 + i)).join('')

/**
 * One split-flap character: cycles random characters fast (the brute-force
 * "spin"), then with `land` settles on that character and turns green.
 */
function FlipTile({ p, chars, land, landAfter, seed }: { p: Vec3; chars: string; land: string | null; landAfter: number; seed: number }) {
  const W = 128
  const H = 160
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    return c
  }, [])
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [canvas])
  const face = useRef<THREE.Group>(null!)
  const born = useRef<number | null>(null)
  const last = useRef(-1)
  const rng = useRef(seed * 9301 + 49297)
  const paint = (ch: string, done: boolean) => {
    const g = canvas.getContext('2d')!
    g.fillStyle = done ? '#DCFCE7' : '#FFFFFF'
    g.fillRect(0, 0, W, H)
    g.fillStyle = 'rgba(0,0,0,0.12)'
    g.fillRect(0, H / 2 - 2, W, 4)
    g.fillStyle = done ? WORLD.ledOk : WORLD.ink
    g.font = `700 104px ${MONO}`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(ch, W / 2, H / 2 + 6)
    tex.needsUpdate = true
  }
  useFrame((state) => {
    if (born.current === null) born.current = state.clock.elapsedTime
    const t = state.clock.elapsedTime - born.current
    const landed = land !== null && t >= landAfter
    if (landed) {
      if (last.current !== -2) {
        last.current = -2
        paint(land, true)
      }
      if (face.current) face.current.scale.y = 1
      return
    }
    // ~24 flips per second, each tile slightly out of phase.
    const step = Math.floor(t * 24 + seed * 0.37)
    if (step !== last.current) {
      last.current = step
      rng.current = (rng.current * 16807) % 2147483647
      paint(chars[rng.current % chars.length], false)
    }
    if (face.current) face.current.scale.y = 0.82 + 0.18 * Math.abs(Math.cos((t * 24 + seed) * Math.PI))
  })
  return (
    <group position={p}>
      <RoundedBox args={[0.54, 0.7, 0.14]} radius={0.04} smoothness={3} castShadow>
        <meshStandardMaterial color={WORLD.rackFace} roughness={0.6} />
      </RoundedBox>
      <group ref={face} position={[0, 0, 0.075]}>
        <mesh>
          <planeGeometry args={[0.48, 0.62]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

function Odometer({ wheels }: { wheels: Wheels }) {
  const k = useRef(0)
  const frame = useRef<THREE.Group>(null!)
  useFrame((_, dt) => {
    k.current = THREE.MathUtils.lerp(k.current, wheels ? 1 : 0, ease(dt, 0.01))
    if (frame.current) frame.current.scale.setScalar(Math.max(0.0001, k.current))
  })
  const count = wheels?.count ?? 8
  const rows = count > 8 ? 2 : 1
  const perRow = Math.min(count, 8)
  const chars = wheels?.charset === 'all' ? ALL : LOWER
  const positions: Vec3[] = []
  for (let r = 0; r < rows; r++) for (let i = 0; i < perRow; i++) positions.push([(i - (perRow - 1) / 2) * 0.62, (rows - 1) * 0.42 - r * 0.84, 0.18])
  return (
    <group ref={frame} position={ODOMETER}>
      <RoundedBox args={[perRow * 0.62 + 0.5, rows * 0.84 + 0.4, 0.3]} radius={0.08} smoothness={3} castShadow>
        <meshStandardMaterial color={WORLD.phoneBody} roughness={0.5} />
      </RoundedBox>
      {wheels &&
        positions.map((p, i) => (
          <FlipTile
            key={`${count}-${wheels.charset}-${i}`}
            p={p}
            chars={chars}
            land={wheels.land ? wheels.land[i] ?? null : null}
            landAfter={1.6 + i * 0.12}
            seed={i * 7 + 3}
          />
        ))}
    </group>
  )
}

// ── Scene ───────────────────────────────────────────────────────────────────

export default function Scene({ step }: { step: Step }) {
  const live = useLive(PHONE_A)
  const busy = step.terminal !== 'off' || step.wheels !== null || step.ladder
  return (
    <Stage3D cam={step.cam} look={step.look} live={live}>
      <Landscape />
      <Phone p={PHONE_A}>
        <SignupScreen field={step.field} strength={step.strength} />
      </Phone>
      <Tower p={TOWER_A} />
      <Cable mode="off" />
      <DataCenter p={DATACENTER} busy={step.hashing || step.leak} />

      <HashMachine grinding={step.hashing} />
      <PasswordTile active={step.hashing} />
      <HashStrip show={step.showHash} delay={step.hashing} />
      <Leak active={step.leak} />
      <Rig busy={busy} mode={step.terminal} />
      <Odometer wheels={step.wheels} />

      <Tag p={[HASHER[0], 3.3, HASHER[2]]} text="Hash function" show={step.hashing} />
      <Tag p={[HASHER[0] + 2.1, 1.75, HASHER[2] + 0.6]} text="one-way" show={step.stage === 'hash' && !step.hashing} />
      <Tag p={[(DATACENTER[0] + RIG[0]) / 2, 6.8, (DATACENTER[2] + RIG[2]) / 2]} text="Stolen database" tone="alert" show={step.leak} factor={14} />
      <Tag p={[RIG[0], 3.75, RIG[2]]} text="Attacker’s GPU rig" tone="alert" show={step.leak} factor={14} />
    </Stage3D>
  )
}
