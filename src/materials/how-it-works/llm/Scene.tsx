import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { DATACENTER, PHONE_A, TOWER_A } from '../kit/geo'
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
  screenBase,
  useDrawnTexture,
  useHop,
  type Live,
} from '../kit/world'
import Stage3D, { useLive } from '../kit/Stage3D'
import { WORLD } from '../kit/palette'
import {
  ANSWER,
  CORE,
  GUESS_AT,
  LINKS,
  PROMPT_TOKENS,
  QUESTION,
  ROUTE,
  TOKENS_AT,
  routePoint,
  type PromptId,
  type Round,
  type Step,
} from './story'

/** Tokenizer-style pastel colours, one per token. */
const TOKEN_COLORS = ['#FDE2C4', '#D6E8FA', '#DDF3DF', '#EFE0FB', '#FBE3DF', '#FFF1BF']

// ── Phone chat screen ───────────────────────────────────────────────────────

function wrap(g: CanvasRenderingContext2D, text: string, maxW: number) {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const test = line ? `${line} ${word}` : word
    if (g.measureText(test).width > maxW && line) {
      lines.push(line)
      line = word
    } else line = test
  }
  if (line) lines.push(line)
  return lines
}

function drawChat(g: CanvasRenderingContext2D, t: number, words: number, typing: boolean) {
  screenBase(g, WORLD.screenOn)
  g.textBaseline = 'middle'
  g.fillStyle = WORLD.ink
  g.font = `700 30px ${SANS}`
  g.fillText('AI chat', 36, 88)
  g.fillStyle = WORLD.accentSoft
  g.fillRect(0, 138, TEX_W, 3)

  // Your question (right).
  g.font = `500 30px ${SANS}`
  const qw = g.measureText(QUESTION).width + 44
  g.fillStyle = WORLD.accent
  g.beginPath()
  g.roundRect(TEX_W - 24 - qw, 190, qw, 70, [28, 28, 8, 28])
  g.fill()
  g.fillStyle = '#FFFFFF'
  g.fillText(QUESTION, TEX_W - 24 - qw + 22, 226)

  // The AI's reply (left), streaming word by word.
  const text = ANSWER.slice(0, words).join('')
  const y0 = 300
  if (text) {
    g.font = `500 30px ${SANS}`
    const lines = wrap(g, text, TEX_W - 110)
    const h = lines.length * 42 + 32
    g.fillStyle = '#F1ECE4'
    g.beginPath()
    g.roundRect(24, y0, TEX_W - 70, h, [28, 28, 28, 8])
    g.fill()
    g.fillStyle = WORLD.ink
    lines.forEach((l, i) => g.fillText(l, 46, y0 + 36 + i * 42))
  }
  if (typing && words < ANSWER.length) {
    const y = text ? y0 + 150 : y0 + 30
    g.fillStyle = '#F1ECE4'
    g.beginPath()
    g.roundRect(24, y, 120, 60, 30)
    g.fill()
    for (let i = 0; i < 3; i++) {
      const up = Math.max(0, Math.sin(t * 7 - i * 0.8)) * 8
      g.fillStyle = WORLD.inkSoft
      g.beginPath()
      g.arc(56 + i * 28, y + 30 - up, 8, 0, Math.PI * 2)
      g.fill()
    }
  }
  // Input bar.
  g.fillStyle = '#F4EFE7'
  g.beginPath()
  g.roundRect(22, TEX_H - 96, TEX_W - 44, 68, 34)
  g.fill()
  g.fillStyle = WORLD.metal
  g.font = `500 26px ${SANS}`
  g.fillText('Ask anything', 48, TEX_H - 61)
}

function ChatScreen({ words, typing }: { words: number; typing: boolean }) {
  return <CanvasScreen draw={(g, t) => drawChat(g, t, words, typing)} deps={[words, typing]} fps={typing ? 20 : 0} />
}

// ── Question packet ─────────────────────────────────────────────────────────

function Packet({ ms, speed, live }: { ms: number; speed: number; live: Live }) {
  const { s, hop } = useHop(ROUTE.length - 1, ms, speed, 0)
  const dots = useRef<(THREE.Mesh | null)[]>([])
  useFrame(() => {
    const moving = hop.current.p < 1 ? 1 : 0
    live.pos.set(...routePoint(s.current))
    dots.current.forEach((m, i) => {
      if (!m) return
      m.position.set(...routePoint(s.current - i * 0.05 * moving))
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

// ── The model: beam + core ──────────────────────────────────────────────────

function Beam({ show }: { show: boolean }) {
  const mat = useRef<THREE.MeshBasicMaterial>(null!)
  const bottom = 2.4
  const top = CORE[1] - 1.4
  useFrame((state, dt) => {
    if (!mat.current) return
    const goal = show ? 0.16 + Math.sin(state.clock.elapsedTime * 3) * 0.04 : 0
    mat.current.opacity = THREE.MathUtils.lerp(mat.current.opacity, goal, ease(dt, 0.01))
  })
  return (
    <mesh position={[DATACENTER[0], (bottom + top) / 2, DATACENTER[2]]}>
      <cylinderGeometry args={[0.35, 1.2, top - bottom, 24, 1, true]} />
      <meshBasicMaterial ref={mat} color={WORLD.accent} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  )
}

function ModelCore({ training }: { training: boolean }) {
  const shell = useRef<THREE.Group>(null!)
  const heart = useRef<THREE.Mesh>(null!)
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (shell.current) shell.current.rotation.set(t * 0.2, t * 0.3, 0)
    if (heart.current) heart.current.scale.setScalar(1 + Math.sin(t * (training ? 9 : 3)) * (training ? 0.12 : 0.06))
  })
  return (
    <group position={CORE}>
      <group ref={shell}>
        <mesh>
          <icosahedronGeometry args={[1.6, 1]} />
          <meshBasicMaterial color={WORLD.accent} wireframe transparent opacity={0.45} toneMapped={false} />
        </mesh>
      </group>
      <mesh ref={heart}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color={WORLD.accent} emissive={WORLD.accent} emissiveIntensity={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}

/** Pages falling into the core: the training data. */
function TrainingRain({ show }: { show: boolean }) {
  const pages = useRef<(THREE.Mesh | null)[]>([])
  const fade = useRef(0)
  const seeds = useMemo(() => Array.from({ length: 28 }, (_, i) => ({ a: (i * 2.39996) % (Math.PI * 2), r: 1.2 + ((i * 37) % 10) / 4, off: (i * 0.137) % 1 })), [])
  useFrame((state, dt) => {
    fade.current = THREE.MathUtils.lerp(fade.current, show ? 1 : 0, ease(dt, 0.01))
    const t = state.clock.elapsedTime
    pages.current.forEach((m, i) => {
      if (!m) return
      const { a, r, off } = seeds[i]
      const u = (t * 0.45 + off) % 1
      const rr = r * (1 - u)
      m.position.set(CORE[0] + Math.cos(a + u * 2) * rr, CORE[1] + 6 * (1 - u) - 0.4, CORE[2] + Math.sin(a + u * 2) * rr)
      m.rotation.set(t + i, t * 0.7 + i, 0)
      m.scale.setScalar(Math.max(0.0001, fade.current * (1 - u * 0.7)))
    })
  })
  return (
    <>
      {seeds.map((_, i) => (
        <mesh key={i} ref={(m) => (pages.current[i] = m)}>
          <boxGeometry args={[0.46, 0.6, 0.02]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
        </mesh>
      ))}
    </>
  )
}

// ── Tokens station ──────────────────────────────────────────────────────────

const TILE_W = 1.05
const TILE_GAP = 1.18

function TokenTile({ word, index, count, show, rise }: { word: string; index: number; count: number; show: boolean; rise: boolean }) {
  const g = useRef<THREE.Group>(null!)
  const k = useRef(0)
  const lift = useRef(0)
  const since = useRef<number | null>(null)
  const tex = useDrawnTexture(
    256,
    118,
    (c) => {
      c.fillStyle = TOKEN_COLORS[index % TOKEN_COLORS.length]
      c.fillRect(0, 0, 256, 118)
      c.fillStyle = WORLD.ink
      c.font = `700 52px ${SANS}`
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      // Show the leading space as a dot so "tokens include spaces" reads.
      c.fillText(word.startsWith(' ') ? `·${word.trim()}` : word, 128, 62)
    },
    word,
  )
  const x = (index - (count - 1) / 2) * TILE_GAP
  useFrame((state, dt) => {
    if (!g.current) return
    const t = state.clock.elapsedTime
    if (show && since.current === null) since.current = t
    if (!show) since.current = null
    // Split out of one block: tiles start stacked at the centre, then spread.
    const local = since.current === null ? 0 : Math.max(0, t - since.current - 0.25)
    k.current = show ? Math.min(1, local * 1.6) : THREE.MathUtils.lerp(k.current, 0, ease(dt, 0.001))
    const spread = 1 - Math.pow(1 - k.current, 3)
    lift.current = THREE.MathUtils.lerp(lift.current, rise ? 3.3 : 0, ease(dt, rise ? 0.25 + index * 0.05 : 0.02))
    g.current.position.set(TOKENS_AT[0] + x * spread, TOKENS_AT[1] + lift.current + Math.sin(t * 1.5 + index) * 0.05, TOKENS_AT[2])
    g.current.scale.setScalar(Math.max(0.0001, show ? Math.min(1, 0.4 + k.current) : k.current))
  })
  return (
    <group ref={g}>
      <RoundedBox args={[TILE_W, 0.56, 0.2]} radius={0.06} smoothness={3} castShadow>
        <meshStandardMaterial color={TOKEN_COLORS[index % TOKEN_COLORS.length]} roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0, 0.105]}>
        <planeGeometry args={[TILE_W - 0.06, 0.5]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** A column of little bars above a token: its vector of numbers. */
function VectorColumn({ index, count, show }: { index: number; count: number; show: boolean }) {
  const bars = useRef<(THREE.Mesh | null)[]>([])
  const k = useRef(0)
  const values = useMemo(() => Array.from({ length: 10 }, (_, i) => Math.sin(index * 12.9898 + i * 78.233) * 0.5 + 0.5), [index])
  const x = TOKENS_AT[0] + (index - (count - 1) / 2) * TILE_GAP
  useFrame((state, dt) => {
    k.current = THREE.MathUtils.lerp(k.current, show ? 1 : 0, ease(dt, 0.02))
    const t = state.clock.elapsedTime
    bars.current.forEach((m, i) => {
      if (!m) return
      const on = Math.max(0, Math.min(1, k.current * 11 - i))
      const v = values[i] * (0.85 + Math.sin(t * 2 + i + index) * 0.15)
      m.scale.set(Math.max(0.0001, (0.25 + v * 0.95) * on), Math.max(0.0001, on), 1)
    })
  })
  return (
    <group position={[x, TOKENS_AT[1] + 0.55, TOKENS_AT[2]]}>
      {values.map((v, i) => (
        <mesh key={i} ref={(m) => (bars.current[i] = m)} position={[0, i * 0.2, 0]}>
          <boxGeometry args={[0.9, 0.13, 0.12]} />
          <meshStandardMaterial color={v > 0.5 ? WORLD.accent : WORLD.info} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function AttentionLinks({ show }: { show: boolean }) {
  const count = PROMPT_TOKENS.sky.length
  const arcs = useMemo(
    () =>
      LINKS.map(([a, b, w]) => {
        const xa = TOKENS_AT[0] + (a - (count - 1) / 2) * TILE_GAP
        const xb = TOKENS_AT[0] + (b - (count - 1) / 2) * TILE_GAP
        const y = TOKENS_AT[1] + 0.34
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(xa, y, TOKENS_AT[2] + 0.1),
          new THREE.Vector3((xa + xb) / 2, y + 0.7 + Math.abs(a - b) * 0.35, TOKENS_AT[2] + 0.4),
          new THREE.Vector3(xb, y, TOKENS_AT[2] + 0.1),
        )
        return { points: curve.getPoints(40), w }
      }),
    [count],
  )
  if (!show) return null
  return (
    <>
      {arcs.map(({ points, w }, i) => (
        <Line key={i} points={points} color={WORLD.accent} lineWidth={2 + w * 7} transparent opacity={0.35 + w * 0.65} />
      ))}
    </>
  )
}

function LayerPlates({ show }: { show: boolean }) {
  const plates = useRef<(THREE.MeshBasicMaterial | null)[]>([])
  useFrame((_, dt) => {
    plates.current.forEach((m) => {
      if (m) m.opacity = THREE.MathUtils.lerp(m.opacity, show ? 0.18 : 0, ease(dt, 0.01))
    })
  })
  return (
    <>
      {[0.9, 1.5, 2.1, 2.7].map((y, i) => (
        <mesh key={y} position={[TOKENS_AT[0], TOKENS_AT[1] + y, TOKENS_AT[2]]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[8, 2.2]} />
          <meshBasicMaterial ref={(m) => (plates.current[i] = m)} color={WORLD.info} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </>
  )
}

// ── Guess station: skyline + sentence ───────────────────────────────────────

const BAR_GAP = 0.95
const BAR_BASE = -1.3
const barX = (i: number) => GUESS_AT[0] + (i - 2.5) * BAR_GAP

/** Which round is on screen and whether its pick has been written yet. */
function useRoundClock(rounds: Round[] | null, ms: number, speed: number) {
  const since = useRef<number | null>(null)
  const key = useRef<Round[] | null>(null)
  const state = useRef({ idx: 0, written: 0 })
  useFrame((s) => {
    if (rounds !== key.current) {
      key.current = rounds
      since.current = s.clock.elapsedTime
    }
    if (!rounds) return
    const span = (ms * 0.92) / 1000 / speed
    const p = Math.min(0.9999, (s.clock.elapsedTime - (since.current ?? 0)) / span)
    const slot = p * rounds.length
    const idx = Math.floor(slot)
    state.current = { idx, written: idx + (slot - idx > 0.55 ? 1 : 0) }
  })
  return state
}

function Skyline({ step, speed }: { step: Step; speed: number }) {
  const clock = useRoundClock(step.rounds, step.ms, speed)
  const bars = useRef<(THREE.Mesh | null)[]>([])
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  const heights = useRef<number[]>([0, 0, 0, 0, 0, 0])
  const tagRef = useRef<(HTMLDivElement | null)[]>([])
  const pickColor = useMemo(() => new THREE.Color(WORLD.accent), [])
  const otherColor = useMemo(() => new THREE.Color(WORLD.landSide), [])
  const wrongColor = useMemo(() => new THREE.Color(WORLD.alert), [])
  const rounds = step.rounds
  useFrame((_, dt) => {
    const r = rounds ? rounds[Math.min(clock.current.idx, rounds.length - 1)] : null
    bars.current.forEach((m, i) => {
      if (!m) return
      const target = r ? (r.cands[i][1] / 100) * 5 + 0.08 : 0.001
      heights.current[i] = THREE.MathUtils.lerp(heights.current[i], target, ease(dt, 0.0008))
      const h = heights.current[i]
      m.scale.set(1, Math.max(0.001, h), 1)
      m.position.y = GUESS_AT[1] + BAR_BASE + h / 2
      const picked = r !== null && i === r.pick
      mats.current[i]?.color.lerp(picked ? (step.wrong ? wrongColor : pickColor) : otherColor, ease(dt, 0.02))
      const el = tagRef.current[i]
      if (el && r) {
        el.textContent = `${r.cands[i][0]} ${r.cands[i][1]}%`
        el.style.opacity = '1'
        el.style.fontWeight = picked ? '800' : '600'
        el.style.color = picked ? (step.wrong ? WORLD.alert : WORLD.accentDeep) : WORLD.inkSoft
      }
    })
  })
  return (
    <group>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <group key={i}>
          <mesh ref={(m) => (bars.current[i] = m)} position={[barX(i), GUESS_AT[1] + BAR_BASE, GUESS_AT[2]]} castShadow>
            <boxGeometry args={[0.72, 1, 0.72]} />
            <meshStandardMaterial ref={(m) => (mats.current[i] = m)} color={WORLD.landSide} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {rounds && <BarLabels tagRef={tagRef} heights={heights} />}
    </group>
  )
}

/** Word + % labels riding on top of each bar (DOM, updated per frame). */
function BarLabels({ tagRef, heights }: { tagRef: MutableRefObject<(HTMLDivElement | null)[]>; heights: MutableRefObject<number[]> }) {
  const groups = useRef<(THREE.Group | null)[]>([])
  useFrame(() => {
    groups.current.forEach((g, i) => {
      if (g) g.position.set(barX(i), GUESS_AT[1] + BAR_BASE + heights.current[i] + 0.35, GUESS_AT[2])
    })
  })
  return (
    <>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <group key={i} ref={(g) => (groups.current[i] = g)}>
          <BarTag onEl={(el) => (tagRef.current[i] = el)} />
        </group>
      ))}
    </>
  )
}


function BarTag({ onEl }: { onEl: (el: HTMLDivElement | null) => void }) {
  return (
    <Html center distanceFactor={13} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <div
        ref={onEl}
        style={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 24,
          whiteSpace: 'nowrap',
          background: 'rgba(255,255,255,0.88)',
          borderRadius: 999,
          padding: '2px 10px',
          opacity: 0,
        }}
      />
    </Html>
  )
}

/** The sentence being written, drawn on a floating card above the skyline. */
function SentenceCard({ step, speed }: { step: Step; speed: number }) {
  const clock = useRoundClock(step.rounds, step.ms, speed)
  const mesh = useRef<THREE.Mesh>(null!)
  const k = useRef(0)
  const lastKey = useRef('')
  const W = 1024
  const H = 300
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    return c
  }, [])
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [canvas])

  const paint = (words: string[], hotFrom: number, tone: 'accent' | 'alert') => {
    const g = canvas.getContext('2d')!
    g.clearRect(0, 0, W, H)
    g.fillStyle = '#FFFFFF'
    g.beginPath()
    g.roundRect(4, 4, W - 8, H - 8, 36)
    g.fill()
    g.font = `600 58px ${SANS}`
    g.textBaseline = 'middle'
    // Lay out word by word so the newest word can be highlighted.
    let x = 48
    let y = 96
    words.forEach((w, i) => {
      const text = w.trim()
      const width = g.measureText(text + ' ').width
      if (x + width > W - 40) {
        x = 48
        y += 92
      }
      const hot = i >= hotFrom
      if (hot) {
        g.fillStyle = tone === 'alert' ? WORLD.alertSoft : WORLD.accentSoft
        g.fillRect(x - 6, y - 36, g.measureText(text).width + 12, 72)
      }
      g.fillStyle = hot ? (tone === 'alert' ? WORLD.alert : WORLD.accentDeep) : WORLD.ink
      g.fillText(text, x, y)
      x += width
    })
    tex.needsUpdate = true
  }

  useFrame((_, dt) => {
    k.current = THREE.MathUtils.lerp(k.current, step.rounds ? 1 : 0, ease(dt, 0.01))
    if (mesh.current) {
      mesh.current.scale.setScalar(Math.max(0.0001, k.current))
      mesh.current.visible = k.current > 0.01
    }
    if (!step.rounds) return
    const written = clock.current.written
    const r = step.rounds[Math.min(clock.current.idx, step.rounds.length - 1)]
    let words: string[]
    let hotFrom: number
    if (step.prompt === 'mars') {
      const prompt = PROMPT_TOKENS.mars
      words = written > 0 ? [...prompt, r.cands[r.pick][0]] : [...prompt, '…']
      hotFrom = written > 0 ? prompt.length : words.length
    } else if (step.alt) {
      words = written > 0 ? [ANSWER[0], r.cands[r.pick][0], '…'] : [ANSWER[0], '…']
      hotFrom = written > 0 ? 1 : 99
    } else {
      const n = Math.min(ANSWER.length, step.answerBase + written)
      words = n > 0 ? ANSWER.slice(0, n) : ['…']
      hotFrom = n > step.answerBase || n === 1 ? n - 1 : 99
    }
    const key = `${words.join('|')}#${hotFrom}`
    if (key !== lastKey.current) {
      lastKey.current = key
      paint(words, hotFrom, step.wrong ? 'alert' : 'accent')
    }
  })

  return (
    <mesh ref={mesh} position={[GUESS_AT[0], GUESS_AT[1] + 3.4, GUESS_AT[2]]}>
      <planeGeometry args={[5.6, (5.6 * H) / W]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  )
}

// ── Scene ───────────────────────────────────────────────────────────────────

function TokenRow({ step }: { step: Step }) {
  const words = PROMPT_TOKENS[step.prompt as PromptId]
  return (
    <>
      {words.map((w, i) => (
        <TokenTile key={`${step.prompt}-${i}`} word={w} index={i} count={words.length} show={step.tokens} rise={step.layers} />
      ))}
      {words.map((_, i) => (
        <VectorColumn key={i} index={i} count={words.length} show={step.vectors} />
      ))}
    </>
  )
}

export default function Scene({ step, speed }: { step: Step; speed: number }) {
  const live = useLive(PHONE_A)
  return (
    <Stage3D cam={step.cam} look={step.look} follow={step.follow} live={live} fog={[26, 70]}>
      <Landscape />
      <Phone p={PHONE_A}>
        <ChatScreen words={step.phoneWords} typing={step.typing} />
      </Phone>
      <Tower p={TOWER_A} />
      <Cable mode={step.packet ? 'flow' : 'off'} />
      <DataCenter p={DATACENTER} busy={step.beam || step.packet} />
      {step.packet && <Packet ms={step.ms} speed={speed} live={live} />}

      <Beam show={step.beam} />
      <ModelCore training={step.training} />
      <TrainingRain show={step.training} />

      <TokenRow step={step} />
      <AttentionLinks show={step.attention} />
      <LayerPlates show={step.layers} />

      <Skyline step={step} speed={speed} />
      <SentenceCard step={step} speed={speed} />

      <Tag p={[GUESS_AT[0], GUESS_AT[1] + BAR_BASE - 0.45, GUESS_AT[2] + 0.4]} text="example numbers" show={step.rounds !== null} upper={false} factor={8} />
      <Tag p={[GUESS_AT[0] + 2.2, GUESS_AT[1] + 4.5, GUESS_AT[2]]} text="Nobody yet" tone="alert" show={step.wrong} factor={12} />
      <Tag p={[CORE[0], CORE[1] + 2.4, CORE[2]]} text="The model" show={step.training} factor={12} />
    </Stage3D>
  )
}
