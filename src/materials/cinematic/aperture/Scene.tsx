import { Suspense, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Environment, MeshReflectorMaterial, PerformanceMonitor, Sparkles, useGLTF } from '@react-three/drei'
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { useStageScale } from '../../../shared/MaterialStage'
import { CINE } from './palette'
import type { Step } from './story'

const ASSETS = '/assets/polyhaven'
const CAMERA_GLTF = `${ASSETS}/Camera_01.glb`
const HDRI = `${ASSETS}/studio_small_09_1k.hdr`

/** Frame-rate-independent lerp factor: `keep` = share left after 1 s. */
const ease = (dt: number, keep: number) => 1 - Math.pow(keep, dt)

// ── Camera rig: hard cuts between shots, fast dolly within a shot ───────────

function Rig({ step }: { step: Step }) {
  const look = useRef(new THREE.Vector3(...step.look))
  const goal = useMemo(() => new THREE.Vector3(), [])
  const lookGoal = useMemo(() => new THREE.Vector3(), [])
  const shot = useRef(step.shot)
  useFrame((state, dt) => {
    const cam = state.camera
    if (shot.current !== step.shot) {
      // Cut: start pulled back so the new shot opens with a push-in.
      shot.current = step.shot
      cam.position.set(step.cam[0] * 1.5, step.cam[1] * 1.5, step.cam[2] * 1.5)
      look.current.set(...step.look)
    }
    const t = state.clock.elapsedTime
    goal.set(step.cam[0] + Math.sin(t * 0.5) * 0.08, step.cam[1] + Math.sin(t * 0.7) * 0.05, step.cam[2])
    lookGoal.set(...step.look)
    cam.position.lerp(goal, ease(dt, 0.08))
    look.current.lerp(lookGoal, ease(dt, 0.05))
    cam.lookAt(look.current)
  })
  return null
}

// ── The vintage camera (Poly Haven "Camera 01", CC0) ────────────────────────

function VintageCamera({ visible }: { visible: boolean }) {
  const { scene } = useGLTF(CAMERA_GLTF)
  const model = useMemo(() => scene.clone(true), [scene])
  const g = useRef<THREE.Group>(null!)
  const [fit, setFit] = useState<{ s: number; c: THREE.Vector3 }>({ s: 1, c: new THREE.Vector3() })
  useLayoutEffect(() => {
    model.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    setFit({ s: 2.4 / Math.max(size.x, size.y, size.z), c: box.getCenter(new THREE.Vector3()) })
  }, [model])
  useFrame((state) => {
    if (g.current) g.current.rotation.y = -0.35 + Math.sin(state.clock.elapsedTime * 0.35) * 0.25
  })
  return (
    <group ref={g} visible={visible}>
      <group scale={fit.s}>
        <primitive object={model} position={[-fit.c.x, -fit.c.y, -fit.c.z]} />
      </group>
    </group>
  )
}
useGLTF.preload(CAMERA_GLTF)

function Floor({ visible }: { visible: boolean }) {
  return (
    <group visible={visible}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
        <planeGeometry args={[40, 40]} />
        <MeshReflectorMaterial
          resolution={512}
          blur={[300, 80]}
          mixBlur={1}
          mixStrength={18}
          roughness={0.9}
          depthScale={1}
          color={CINE.floor}
          metalness={0.6}
          mirror={0.6}
        />
      </mesh>
      <ContactShadows position={[0, -1.19, 0]} opacity={0.7} scale={8} blur={2.4} far={2} />
    </group>
  )
}

// ── Iris: six blades whose inner edges form a hexagonal opening ─────────────

const BLADES = 6
const R_MIN = 0.14
const R_MAX = 1.05

function Iris({ open, visible }: { open: number; visible: boolean }) {
  const root = useRef<THREE.Group>(null!)
  const blades = useRef<(THREE.Group | null)[]>([])
  const cur = useRef(open)
  const bladeMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: CINE.blade,
        metalness: 0.9,
        roughness: 0.3,
        clearcoat: 1,
        clearcoatRoughness: 0.18,
      }),
    [],
  )
  const edgeMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(CINE.edge).multiplyScalar(2.2), toneMapped: false }), [])
  useFrame((state, dt) => {
    // Snappy mechanical ease with a hint of overshoot, like blades clicking into place.
    cur.current = THREE.MathUtils.lerp(cur.current, open, ease(dt, 0.004))
    const o = cur.current
    const r = R_MIN + (R_MAX - R_MIN) * o
    const swirl = (1 - o) * 0.75
    blades.current.forEach((b, i) => {
      if (!b) return
      b.rotation.z = (i / BLADES) * Math.PI * 2 + swirl
      b.children[0].position.y = r
    })
    if (root.current) root.current.rotation.z = state.clock.elapsedTime * 0.12
  })
  return (
    <group visible={visible}>
      {/* Light behind the lens: HDR white so only the opening blooms. */}
      <mesh position={[0, 0, -1.6]}>
        <circleGeometry args={[1.5, 64]} />
        <meshBasicMaterial color={new THREE.Color(CINE.light).multiplyScalar(1.12)} toneMapped={false} />
      </mesh>
      <group ref={root}>
        {Array.from({ length: BLADES }, (_, i) => (
          <group key={i} ref={(g) => (blades.current[i] = g)}>
            {/* Local +y edge of this group sits at radius r; the blade extends outward. */}
            <group>
              <mesh position={[0, 1.3, i * 0.014]} material={bladeMat} castShadow>
                <boxGeometry args={[5, 2.6, 0.03]} />
              </mesh>
              <mesh position={[0, 0.006, i * 0.014 + 0.017]} material={edgeMat}>
                <boxGeometry args={[1.2, 0.012, 0.004]} />
              </mesh>
            </group>
          </group>
        ))}
      </group>
      {/* Lens housing: brushed front plate + a fat outer ring. */}
      <mesh position={[0, 0, 0.14]}>
        <ringGeometry args={[1.62, 3.4, 96]} />
        <meshPhysicalMaterial color={CINE.housing} metalness={1} roughness={0.32} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.16]}>
        <torusGeometry args={[1.64, 0.05, 16, 96]} />
        <meshStandardMaterial color={CINE.accent} emissive={CINE.accent} emissiveIntensity={0.6} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.05]} scale={[1, 1, 0.55]}>
        <torusGeometry args={[3.2, 0.45, 32, 128]} />
        <meshPhysicalMaterial color={CINE.housingDark} metalness={1} roughness={0.25} clearcoat={1} />
      </mesh>
      {/* Raking lights so the dark blades read as machined metal. */}
      <pointLight position={[-2.5, 3, 2.2]} intensity={14} distance={9} color={CINE.key} />
      <pointLight position={[2.8, -2.4, 2]} intensity={8} distance={8} color={CINE.fill} />
      <Sparkles count={70} scale={[5, 5, 3]} position={[0, 0, 1.4]} size={3} speed={0.3} color={CINE.edge} opacity={0.7} />
    </group>
  )
}

// ── Stage ───────────────────────────────────────────────────────────────────

export default function Scene({ step }: { step: Step }) {
  const stageScale = useStageScale()
  const [perf, setPerf] = useState(1)
  const dpr = Math.max(0.5, Math.min(2, window.devicePixelRatio * stageScale * perf))
  const onCamera = step.shot === 'camera'
  return (
    <Canvas
      shadows
      dpr={dpr}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ position: step.cam, fov: 38, near: 0.1, far: 80 }}
      resize={{ offsetSize: true }}
      style={{ width: '100%', height: '100%', background: CINE.bg }}
    >
      <PerformanceMonitor onDecline={() => setPerf(0.7)} onIncline={() => setPerf(1)} flipflops={3} onFallback={() => setPerf(0.7)} />
      <color attach="background" args={[CINE.bg]} />
      <fog attach="fog" args={[CINE.bg, 9, 22]} />
      <Suspense fallback={null}>
        <Environment files={HDRI} environmentIntensity={onCamera ? 0.9 : 1.2} />
        <VintageCamera visible={onCamera} />
        <Floor visible={onCamera} />
        <Iris open={step.open} visible={!onCamera} />
      </Suspense>
      {/* Warm key from behind-left, cool fill from the right: a product-shot rim. */}
      <spotLight position={[-4, 5, -3]} angle={0.5} penumbra={0.8} intensity={60} color={CINE.key} castShadow />
      <spotLight position={[5, 2, 4]} angle={0.6} penumbra={1} intensity={25} color={CINE.fill} />
      <Rig step={step} />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.15} intensity={0.75} radius={0.6} />
        <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={new THREE.Vector2(0.0007, 0.0007)} radialModulation={false} modulationOffset={0} />
        <Noise premultiply opacity={0.35} />
        <Vignette eskil={false} offset={0.25} darkness={0.75} />
      </EffectComposer>
    </Canvas>
  )
}
