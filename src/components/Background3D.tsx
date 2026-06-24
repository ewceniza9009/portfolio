import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'

function Particles() {
  const count = 200
  const mesh = useRef<THREE.Points>(null)
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const scales = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20
      scales[i] = Math.random() * 0.5 + 0.1
    }
    
    return { positions, scales }
  }, [])

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.02
      mesh.current.rotation.x = state.clock.elapsedTime * 0.01
    }
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#00ff88"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}

function FloatingShapes() {
  return (
    <>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <mesh position={[-4, 2, -5]} scale={0.4}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial 
            color="#00ff88" 
            wireframe
            transparent
            opacity={0.3}
          />
        </mesh>
      </Float>
      
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
        <mesh position={[5, -1, -3]} scale={0.3}>
          <torusGeometry args={[1, 0.3, 16, 32]} />
          <meshStandardMaterial 
            color="#00ffcc" 
            wireframe
            transparent
            opacity={0.25}
          />
        </mesh>
      </Float>
      
      <Float speed={2.5} rotationIntensity={0.8} floatIntensity={1.2}>
        <mesh position={[3, 3, -4]} scale={0.25}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial 
            color="#00ff88" 
            transparent
            opacity={0.2}
          />
        </mesh>
      </Float>
      
      <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.6}>
        <mesh position={[-3, -2, -2]} scale={0.35}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            color="#00ffcc" 
            wireframe
            transparent
            opacity={0.2}
          />
        </mesh>
      </Float>
    </>
  )
}

function GlowingOrb() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.5
      meshRef.current.position.y = Math.cos(state.clock.elapsedTime * 0.2) * 0.3
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -8]} scale={1.5}>
      <sphereGeometry args={[1, 32, 32]} />
      <MeshTransmissionMaterial
        color="#00ff88"
        transmission={0.95}
        thickness={0.5}
        roughness={0.1}
        chromaticAberration={0.03}
        anisotropy={0.1}
        distortion={0.1}
        distortionScale={0.2}
        temporalDistortion={0.1}
        transparent
        opacity={0.8}
      />
    </mesh>
  )
}

export default function Background3D() {
  return (
    <div className="canvas-container">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 5, 20]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#00ff88" />
        <Particles />
        <FloatingShapes />
        <GlowingOrb />
      </Canvas>
    </div>
  )
}