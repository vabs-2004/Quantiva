import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Line } from "@react-three/drei";
import * as THREE from "three";

/**
 * 3D Quantum Atom — spinning nucleus with electron orbits.
 * Used as hero element on the landing page.
 */

function Nucleus() {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.05);
    }
  });

  return (
    <group ref={meshRef}>
      <Sphere args={[0.35, 32, 32]}>
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#3b82f6"
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
      {/* Inner glow */}
      <Sphere args={[0.45, 16, 16]}>
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.15} />
      </Sphere>
    </group>
  );
}

function ElectronOrbit({ radius, speed, tilt, color }) {
  const electronRef = useRef();
  const angleRef = useRef(Math.random() * Math.PI * 2);

  // Create orbit path points
  const orbitPoints = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        )
      );
    }
    return points;
  }, [radius]);

  useFrame((state, delta) => {
    if (electronRef.current) {
      angleRef.current += delta * speed;
      electronRef.current.position.x = Math.cos(angleRef.current) * radius;
      electronRef.current.position.z = Math.sin(angleRef.current) * radius;
    }
  });

  return (
    <group rotation={tilt}>
      {/* Orbit ring */}
      <Line
        points={orbitPoints}
        color={color}
        lineWidth={0.5}
        transparent
        opacity={0.25}
      />
      {/* Electron */}
      <group ref={electronRef}>
        <Sphere args={[0.08, 16, 16]}>
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.5}
          />
        </Sphere>
        {/* Electron glow */}
        <Sphere args={[0.14, 8, 8]}>
          <meshBasicMaterial color={color} transparent opacity={0.2} />
        </Sphere>
      </group>
    </group>
  );
}

function AtomScene() {
  const groupRef = useRef();

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={groupRef}>
      <Nucleus />
      <ElectronOrbit radius={1.2} speed={1.5} tilt={[0.3, 0, 0]} color="#60a5fa" />
      <ElectronOrbit radius={1.6} speed={1.0} tilt={[-0.5, 0.8, 0.3]} color="#a78bfa" />
      <ElectronOrbit radius={2.0} speed={0.7} tilt={[0.8, -0.3, -0.5]} color="#38bdf8" />
    </group>
  );
}

export default function QuantumAtom3D({ className = "" }) {
  return (
    <div className={`${className}`}>
      <Canvas
        camera={{ position: [0, 1.5, 4.5], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={1} color="#3b82f6" />
        <pointLight position={[-5, -3, 3]} intensity={0.5} color="#a78bfa" />
        <AtomScene />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
