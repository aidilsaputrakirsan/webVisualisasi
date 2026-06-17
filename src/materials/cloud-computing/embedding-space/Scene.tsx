import { useMemo, useRef, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Grid, Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import {
  CLUSTERS,
  NEUTRAL,
  QUERY,
  WORDS,
  distance,
  resolve,
  type ClusterId,
  type EmbStep,
  type Measure,
  type Vec3,
  type Word,
} from './embeddings'

/** Smoothing factor for frame-rate-independent lerp. */
function damp(current: number, goal: number, dt: number): number {
  return THREE.MathUtils.lerp(current, goal, 1 - Math.pow(0.0018, dt))
}

type PointState = 'idle' | 'dim' | 'neighbor'

/** Readable pill label — consistent across word / query / distance tags. */
function WordLabel({ text, state, color }: { text: string; state: PointState; color: string }) {
  const neighbor = state === 'neighbor'
  return (
    <div
      style={{
        fontSize: neighbor ? 27 : 24,
        fontWeight: 600,
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        color: '#20243A',
        background: 'rgba(255,255,255,0.84)',
        border: `1.5px solid ${neighbor ? color : 'rgba(206,210,228,0.75)'}`,
        borderRadius: 999,
        padding: '3px 13px',
        whiteSpace: 'nowrap',
        boxShadow: neighbor ? `0 3px 14px ${color}55` : '0 1px 5px rgba(30,34,58,0.08)',
      }}
    >
      {text}
    </div>
  )
}

function WordSphere({ word, step }: { word: Word; step: EmbStep }) {
  // The label lives on the (unscaled) group so it never drifts when the sphere
  // grows for a neighbour highlight — only the mesh itself scales.
  const group = useRef<THREE.Group>(null!)
  const mesh = useRef<THREE.Mesh>(null!)
  const mat = useRef<THREE.MeshStandardMaterial>(null!)
  const target = useMemo(() => new THREE.Vector3(...word.pos), [word])
  const origin = useMemo(() => new THREE.Vector3(0, 0, 0), [])

  const visible = step.visible.includes(word.id)
  const isNeighbor = step.neighbors.includes(word.id)
  const state: PointState = isNeighbor ? 'neighbor' : step.dimOthers ? 'dim' : 'idle'
  const color = step.colored ? CLUSTERS[word.cluster].color : NEUTRAL
  // Hide labels of dimmed points, and — while the ranking panel is open — hide
  // every non-neighbour label too (the panel already lists each word by name, so
  // the pills would just be covered by it). Points stay as coloured dots.
  const showLabel = visible && state !== 'dim' && (!step.ranking || isNeighbor)

  useFrame((_, dt) => {
    if (!group.current || !mesh.current || !mat.current) return
    group.current.position.lerp(visible ? target : origin, 1 - Math.pow(0.0018, dt))
    const goalScale = !visible ? 0.001 : state === 'neighbor' ? 1.45 : state === 'dim' ? 0.8 : 1
    mesh.current.scale.setScalar(damp(mesh.current.scale.x, goalScale, dt))
    mat.current.opacity = damp(mat.current.opacity, !visible ? 0 : state === 'dim' ? 0.14 : 1, dt)
    mat.current.emissiveIntensity = damp(mat.current.emissiveIntensity, state === 'neighbor' ? 0.6 : 0.14, dt)
  })

  return (
    <group ref={group}>
      <mesh ref={mesh}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial
          ref={mat}
          color={color}
          emissive={color}
          emissiveIntensity={0.14}
          roughness={0.35}
          metalness={0.1}
          transparent
          opacity={0}
        />
      </mesh>
      {showLabel && (
        <Html position={[0, 0.5, 0]} center distanceFactor={9} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <WordLabel text={word.label} state={state} color={color} />
        </Html>
      )}
    </group>
  )
}

function QuerySphere({ active }: { active: boolean }) {
  const group = useRef<THREE.Group>(null!)
  const mesh = useRef<THREE.Mesh>(null!)
  const mat = useRef<THREE.MeshStandardMaterial>(null!)
  const target = useMemo(() => new THREE.Vector3(...QUERY.pos), [])
  const origin = useMemo(() => new THREE.Vector3(0, 0, 0), [])

  useFrame((state, dt) => {
    if (!group.current || !mesh.current || !mat.current) return
    group.current.position.lerp(active ? target : origin, 1 - Math.pow(0.0018, dt))
    const pulse = active ? 1.5 + Math.sin(state.clock.elapsedTime * 3) * 0.12 : 0.001
    mesh.current.scale.setScalar(damp(mesh.current.scale.x, pulse, dt))
    mat.current.opacity = damp(mat.current.opacity, active ? 1 : 0, dt)
  })

  return (
    <group ref={group}>
      <mesh ref={mesh}>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshStandardMaterial
          ref={mat}
          color="#FBBF24"
          emissive="#F59E0B"
          emissiveIntensity={0.7}
          roughness={0.3}
          metalness={0.2}
          transparent
          opacity={0}
        />
      </mesh>
      {active && (
        <Html position={[0, 0.62, 0]} center distanceFactor={9} zIndexRange={[40, 20]} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              fontSize: 29,
              fontWeight: 700,
              fontFamily: 'ui-sans-serif, system-ui, sans-serif',
              color: '#B45309',
              background: 'rgba(255,248,237,0.92)',
              border: '1.5px solid #F59E0B',
              borderRadius: 999,
              padding: '3px 15px',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 16px rgba(245,158,11,0.35)',
            }}
          >
            “{QUERY.label}” ?
          </div>
        </Html>
      )}
    </group>
  )
}

/** Distance lines between point pairs — amber for search matches, slate for the
 *  'near vs far' teaching measures. */
function MeasureLinks({ measures }: { measures: Measure[] }) {
  return (
    <>
      {measures.map(({ a, b, strong }) => {
        const pa = resolve(a).pos
        const pb = resolve(b).pos
        const mid: Vec3 = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2 + 0.15, (pa[2] + pb[2]) / 2]
        const color = strong ? '#D97706' : '#64708A'
        return (
          <group key={`${a}-${b}`}>
            <Line points={[pa, pb]} color={color} lineWidth={strong ? 2.6 : 2} dashed dashScale={2.5} />
            <Html position={mid} center distanceFactor={10} zIndexRange={[30, 10]} style={{ pointerEvents: 'none' }}>
              <div
                style={{
                  fontSize: 21,
                  fontWeight: 600,
                  fontFamily: 'ui-monospace, monospace',
                  color: strong ? '#92400E' : '#3B445C',
                  background: strong ? 'rgba(255,251,244,0.92)' : 'rgba(248,249,253,0.92)',
                  border: `1px solid ${strong ? 'rgba(217,119,6,0.45)' : 'rgba(100,112,138,0.4)'}`,
                  borderRadius: 999,
                  padding: '2px 10px',
                  whiteSpace: 'nowrap',
                }}
              >
                {distance(pa, pb).toFixed(2)}
              </div>
            </Html>
          </group>
        )
      })}
    </>
  )
}

/** Cluster centroid (mean of its members) — anchors the floating region label. */
const CLUSTER_CENTROIDS = (Object.keys(CLUSTERS) as ClusterId[]).map((id) => {
  const members = WORDS.filter((w) => w.cluster === id)
  const c = members.reduce(
    (acc, w) => [acc[0] + w.pos[0], acc[1] + w.pos[1], acc[2] + w.pos[2]],
    [0, 0, 0],
  )
  const n = members.length
  return { id, center: [c[0] / n, c[1] / n + 1.5, c[2] / n] as Vec3, color: CLUSTERS[id].color, label: CLUSTERS[id].label }
})

/** Big translucent cluster names hovering over each region. */
function RegionLabels({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <>
      {CLUSTER_CENTROIDS.map((c) => (
        <Html key={c.id} position={c.center} center distanceFactor={12} zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase',
              fontFamily: 'ui-sans-serif, system-ui, sans-serif',
              color: c.color,
              opacity: 0.5,
              whiteSpace: 'nowrap',
            }}
          >
            {c.label}
          </div>
        </Html>
      ))}
    </>
  )
}

/**
 * Gentle back-and-forth rock (instead of a full spin) so the cloud reads as 3D
 * without the labels swirling all the way around and piling on top of each other.
 */
function Turntable({ children }: { children: ReactNode }) {
  const g = useRef<THREE.Group>(null!)
  useFrame((state) => {
    if (g.current) g.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.22) * 0.42
  })
  return <group ref={g}>{children}</group>
}

export default function Scene({ step }: { step: EmbStep }) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      // Distance derived from the layout's bounding box (x-extent ≈ ±3.7 incl.
      // labels): at this fov it fits the full cloud with margin and no clipping.
      camera={{ position: [0, 1.4, 13], fov: 42 }}
      // MaterialStage scales the whole canvas with a CSS transform; measure via
      // offsetWidth/Height so R3F isn't fooled into a tiny top-left viewport.
      resize={{ offsetSize: true }}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
    >
      <ambientLight intensity={0.95} />
      <directionalLight position={[4, 6, 5]} intensity={0.75} />
      <directionalLight position={[-5, -2, -4]} intensity={0.25} />

      <Grid
        position={[0, -3, 0]}
        args={[30, 30]}
        cellSize={0.7}
        cellThickness={0.6}
        cellColor="#C9CCE0"
        sectionSize={3.5}
        sectionThickness={1}
        sectionColor="#B2B7D6"
        fadeDistance={30}
        fadeStrength={1.5}
        infiniteGrid
      />

      <Turntable>
        {WORDS.map((w) => (
          <WordSphere key={w.id} word={w} step={step} />
        ))}
        <QuerySphere active={step.query} />
        <MeasureLinks measures={step.measures} />
        <RegionLabels active={step.regions} />
      </Turntable>
    </Canvas>
  )
}
