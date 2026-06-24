import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  Line,
  OrbitControls,
  Sparkles,
} from "@react-three/drei";

const nodes = [
  [-2.5, 0.9, 0.1],
  [-1.3, -1.1, 0.6],
  [0.4, 1.45, -0.4],
  [1.55, -0.8, 0.25],
  [2.55, 0.72, -0.25],
  [0.2, -1.75, -0.15],
];

function VentureNetwork() {
  const groupRef = useRef(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    groupRef.current.rotation.y += delta * 0.16;
    groupRef.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 0.32) * 0.08;
  });

  return (
    <group ref={groupRef}>
      {nodes.map((position, index) => (
        <Float
          key={position.join("-")}
          speed={1.4 + index * 0.08}
          rotationIntensity={0.8}
          floatIntensity={0.45}
        >
          <mesh position={position}>
            <sphereGeometry args={[0.12, 32, 32]} />
            <meshStandardMaterial
              color={
                index % 3 === 0
                  ? "#22d3ee"
                  : index % 3 === 1
                    ? "#34d399"
                    : "#fbbf24"
              }
              emissive="#22d3ee"
              emissiveIntensity={0.45}
              roughness={0.18}
              metalness={0.72}
            />
          </mesh>
        </Float>
      ))}

      {nodes.slice(0, -1).map((position, index) => (
        <Line
          key={`${position.join("-")}-line`}
          points={[position, nodes[index + 1]]}
          color="#67e8f9"
          transparent
          opacity={0.34}
          lineWidth={1}
        />
      ))}

      <Line
        points={[nodes[0], nodes[3], nodes[5], nodes[2]]}
        color="#86efac"
        transparent
        opacity={0.22}
        lineWidth={1}
      />
    </group>
  );
}

function Core() {
  const coreRef = useRef(null);

  useFrame((state, delta) => {
    if (!coreRef.current) return;

    coreRef.current.rotation.x += delta * 0.2;
    coreRef.current.rotation.y += delta * 0.28;
    coreRef.current.position.y =
      Math.sin(state.clock.elapsedTime * 1.2) * 0.08;
  });

  return (
    <Float speed={1.8} rotationIntensity={0.7} floatIntensity={0.55}>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.98, 3]} />
        <meshPhysicalMaterial
          color="#67e8f9"
          emissive="#0ea5e9"
          emissiveIntensity={0.55}
          roughness={0.12}
          metalness={0.82}
          clearcoat={1}
          clearcoatRoughness={0.08}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.55, 0.012, 16, 160]} />
        <meshStandardMaterial
          color="#34d399"
          emissive="#34d399"
          emissiveIntensity={0.45}
        />
      </mesh>
      <mesh rotation={[0.7, 0.2, 0.8]}>
        <torusGeometry args={[1.88, 0.01, 16, 160]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#fbbf24"
          emissiveIntensity={0.32}
        />
      </mesh>
    </Float>
  );
}

function Hero3D() {
  return (
    <Canvas
      className="h-full w-full"
      camera={{ position: [0, 0.12, 5.4], fov: 46 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={1.1} />
      <directionalLight
        position={[3.5, 4, 4]}
        intensity={2.2}
      />
      <pointLight
        position={[-3, -2, 2]}
        intensity={1.6}
        color="#22d3ee"
      />
      <pointLight
        position={[3, 2, -2]}
        intensity={1.1}
        color="#fbbf24"
      />
      <Sparkles
        count={52}
        scale={[7, 4, 3]}
        size={2.1}
        speed={0.32}
        color="#a7f3d0"
      />
      <Core />
      <VentureNetwork />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.45}
      />
    </Canvas>
  );
}

export default Hero3D;
