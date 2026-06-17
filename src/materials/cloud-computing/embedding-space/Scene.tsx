import { useMemo, useRef, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Grid, Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import {
  CLUSTERS,
  NEUTRAL,
  QUERY,
  WORDS,
  WORD_MAP,
  distance,
  type EmbStep,
  type Vec3,
  type Word,
} from './embeddings'

/** Smoothing factor for frame-rate-independent lerp. */
function damp(current: number, goal: number, dt: number): number {
  return THREE.MathUtils.lerp(current, goal, 1 - Math.pow(0.0018, dt))
}

type PointState = 'idle' | 'dim' | 'neighbor'

function WordSphere({ word, step }: { word: Word; step: EmbStep }) {
  const mesh = useRef<THREE.Mesh>(null!)
  const mat = useRef<THREE.MeshStandardMaterial>(null!)
  const target = useMemo(() => new THREE.Vector3(...word.pos), [word])
  const origin = useMemo(() => new THREE.Vector3(0, 0, 0), [])

  const visible = step.visible.includes(word.id)
  const isNeighbor = step.neighbors.includes(word.id)
  const state: PointState = isNeighbor ? 'neighbor' : step.dimOthers ? 'dim' : 'idle'
  const color = step.colored ? CLUSTERS[word.cluster].color : NEUTRAL

  useFrame((_, dt) => {
    if (!mesh.current || !mat.current) return
    mesh.current.position.lerp(visible ? target : origin, 1 - Math.pow(0.0018, dt))
    const goalScale = !visible ? 0.001 : state === 'neighbor' ? 1.5 : state === 'dim' ? 0.85 : 1
    const s = damp(mesh.current.scale.x, goalScale, dt)
    mesh.current.scale.setScalar(s)
    mat.current.opacity = damp(mat.current.opacity, !visible ? 0 : state === 'dim' ? 0.16 : 1, dt)
    mat.current.emissiveIntensity = damp(mat.current.emissiveIntensity, state === 'neighbor' ? 0.65 : 0.12, dt)
  })

  return (
    <mesh ref={mesh} position={[0, 0, 0]}>
      <sphereGeometry args={[0.3, 32, 32]} />
      <meshStandardMaterial
        ref={mat}
        color={color}
        emissive={color}
        emissiveIntensity={0.12}
        roughness={0.35}
        metalness={0.1}
        transparent
        opacity={0}
      />
      {visible && (
        <Html position={[0, 0.55, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 600,
              fontFamily: 'ui-sans-serif, system-ui, sans-serif',
              color: state === 'dim' ? '#A9AEC4' : '#20243A',
              opacity: state === 'dim' ? 0.45 : 1,
              whiteSpace: 'nowrap',
              transition: 'opacity 0.3s',
            }}
          >
            {word.label}
          </div>
        </Html>
      )}
    </mesh>
  )
}

function QuerySphere({ active }: { active: boolean }) {
  const mesh = useRef<THREE.Mesh>(null!)
  const mat = useRef<THREE.MeshStandardMaterial>(null!)
  const target = useMemo(() => new THREE.Vector3(...QUERY.pos), [])
  const origin = useMemo(() => new THREE.Vector3(0, 0, 0), [])

  useFrame((state, dt) => {
    if (!mesh.current || !mat.current) return
    mesh.current.position.lerp(active ? target : origin, 1 - Math.pow(0.0018, dt))
    const pulse = active ? 1.5 + Math.sin(state.clock.elapsedTime * 3) * 0.12 : 0.001
    mesh.current.scale.setScalar(damp(mesh.current.scale.x, pulse, dt))
    mat.current.opacity = damp(mat.current.opacity, active ? 1 : 0, dt)
  })

  return (
    <mesh ref={mesh} position={[0, 0, 0]}>
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
      {active && (
        <Html position={[0, 0.6, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              fontFamily: 'ui-sans-serif, system-ui, sans-serif',
              color: '#B45309',
              whiteSpace: 'nowrap',
            }}
          >
            “{QUERY.label}” ?
          </div>
        </Html>
      )}
    </mesh>
  )
}

function NeighborLinks({ neighbors }: { neighbors: string[] }) {
  const qp = QUERY.pos
  return (
    <>
      {neighbors.map((id) => {
        const w = WORD_MAP[id]
        const mid: Vec3 = [(qp[0] + w.pos[0]) / 2, (qp[1] + w.pos[1]) / 2 + 0.15, (qp[2] + w.pos[2]) / 2]
        return (
          <group key={id}>
            <Line points={[qp, w.pos]} color="#D97706" lineWidth={2.5} />
            <Html position={mid} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
              <div
                style={{
                  fontSize: 22,
                  fontFamily: 'ui-monospace, monospace',
                  color: '#92400E',
                  background: 'rgba(255,255,255,0.85)',
                  borderRadius: 999,
                  padding: '2px 9px',
                  whiteSpace: 'nowrap',
                }}
              >
                {distance(qp, w.pos).toFixed(2)}
              </div>
            </Html>
          </group>
        )
      })}
    </>
  )
}

/** Slow turntable spin so the cloud reads as 3D. Points + query + links live here. */
function Turntable({ children }: { children: ReactNode }) {
  const g = useRef<THREE.Group>(null!)
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * 0.12
  })
  return <group ref={g}>{children}</group>
}

export default function Scene({ step }: { step: EmbStep }) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0.5, 1.8, 9], fov: 42 }}
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
        <NeighborLinks neighbors={step.neighbors} />
      </Turntable>
    </Canvas>
  )
}
