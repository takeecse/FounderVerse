import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Line,
  OrbitControls,
  Sparkles,
} from "@react-three/drei";
import { AdditiveBlending } from "three";

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const CYAN = "#22d3ee";
const BLUE = "#38bdf8";
const MINT = "#34d399";
const GOLD = "#f8d47c";
const WHITE = "#f8fafc";

const makeSphereNodes = (count, radius, phase = 0) =>
  Array.from({ length: count }, (_, index) => {
    const y =
      count === 1 ? 0 : 1 - (index / (count - 1)) * 2;
    const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = index * GOLDEN_ANGLE + phase;
    const radiusPulse =
      radius *
      (0.96 + ((index * 37) % 9) * 0.008);

    return [
      Math.cos(theta) * ringRadius * radiusPulse,
      y * radiusPulse,
      Math.sin(theta) * ringRadius * radiusPulse,
    ];
  });

const makeNetworkEdges = (nodes, neighbors = 3) => {
  const edgeKeys = new Set();
  const edges = [];

  nodes.forEach((node, index) => {
    const closest = nodes
      .map((candidate, candidateIndex) => ({
        candidate,
        candidateIndex,
        distance:
          (candidate[0] - node[0]) ** 2 +
          (candidate[1] - node[1]) ** 2 +
          (candidate[2] - node[2]) ** 2,
      }))
      .filter((item) => item.candidateIndex !== index)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, neighbors);

    closest.forEach(({ candidate, candidateIndex }) => {
      const key =
        index < candidateIndex
          ? `${index}-${candidateIndex}`
          : `${candidateIndex}-${index}`;

      if (edgeKeys.has(key)) return;

      edgeKeys.add(key);
      edges.push([node, candidate]);
    });
  });

  return edges;
};

function NetworkGlobe({
  count = 72,
  radius = 1.4,
  position = [0, 0, 0],
  scale = 1,
  phase = 0,
  rotationSpeed = 0.12,
  nodeSize = 0.032,
  lineOpacity = 0.48,
  shellOpacity = 0.36,
}) {
  const groupRef = useRef(null);
  const nodes = useMemo(
    () => makeSphereNodes(count, radius, phase),
    [count, radius, phase]
  );
  const edges = useMemo(
    () => makeNetworkEdges(nodes, count > 40 ? 4 : 3),
    [count, nodes]
  );
  const latitudes = useMemo(
    () => [-0.72, -0.46, -0.22, 0, 0.22, 0.46, 0.72],
    []
  );
  const longitudes = useMemo(
    () => [
      0,
      Math.PI / 5,
      (Math.PI * 2) / 5,
      (Math.PI * 3) / 5,
      (Math.PI * 4) / 5,
    ],
    []
  );

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    groupRef.current.rotation.y += delta * rotationSpeed;
    groupRef.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 0.24 + phase) * 0.035;
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[radius * 0.985, 96, 96]} />
        <meshPhysicalMaterial
          color="#061827"
          emissive="#0e7490"
          emissiveIntensity={0.38}
          roughness={0.18}
          metalness={0.58}
          transparent
          opacity={shellOpacity}
          clearcoat={1}
          clearcoatRoughness={0.14}
          depthWrite={false}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[radius * 1.005, 64, 64]} />
        <meshBasicMaterial
          color={CYAN}
          wireframe
          transparent
          opacity={0.13}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh scale={[1.04, 1.04, 1.04]}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshBasicMaterial
          color={BLUE}
          transparent
          opacity={0.08}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {latitudes.map((lat) => {
        const y = radius * lat;
        const ringRadius =
          radius * Math.sqrt(Math.max(0.04, 1 - lat * lat));

        return (
          <mesh
            key={`lat-${lat}`}
            position={[0, y, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <torusGeometry args={[ringRadius, radius * 0.0028, 8, 220]} />
            <meshBasicMaterial
              color={CYAN}
              transparent
              opacity={0.34}
              blending={AdditiveBlending}
            />
          </mesh>
        );
      })}

      {longitudes.map((angle) => (
        <mesh
          key={`long-${angle}`}
          rotation={[0, angle, Math.PI / 2]}
        >
          <torusGeometry args={[radius * 1.01, radius * 0.0024, 8, 220]} />
          <meshBasicMaterial
            color={MINT}
            transparent
            opacity={0.2}
            blending={AdditiveBlending}
          />
        </mesh>
      ))}

      {edges.map((points, index) => (
        <Line
          key={`edge-${index}`}
          points={points}
          color={
            index % 11 === 0
              ? GOLD
              : index % 5 === 0
                ? WHITE
                : CYAN
          }
          transparent
          opacity={index % 11 === 0 ? 0.68 : lineOpacity}
          lineWidth={index % 11 === 0 ? 1.45 : 1}
        />
      ))}

      {nodes.map((node, index) => {
        const color =
          index % 13 === 0
            ? WHITE
            : index % 9 === 0
              ? GOLD
              : index % 3 === 0
                ? MINT
                : CYAN;
        const strong = index % 13 === 0 || index % 9 === 0;

        return (
          <mesh key={`node-${index}`} position={node}>
            <sphereGeometry
              args={[
                nodeSize * (strong ? 1.9 : 1),
                strong ? 24 : 16,
                strong ? 24 : 16,
              ]}
            />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={strong ? 1.8 : 0.85}
              roughness={0.12}
              metalness={0.35}
            />
          </mesh>
        );
      })}

      <pointLight
        position={[radius * 0.7, radius * 0.15, radius * 0.65]}
        color={CYAN}
        intensity={1.4}
        distance={radius * 3.2}
      />
      <pointLight
        position={[-radius * 0.65, -radius * 0.35, radius * 0.9]}
        color={WHITE}
        intensity={0.7}
        distance={radius * 2.8}
      />
    </group>
  );
}

function OrbitingGlobes() {
  const orbitRef = useRef(null);
  const miniRefs = useRef([]);

  const globes = useMemo(
    () => [
      {
        radius: 2.45,
        speed: 0.34,
        phase: 0.25,
        scale: 0.31,
        y: 0.52,
      },
      {
        radius: 2.88,
        speed: -0.27,
        phase: 2.2,
        scale: 0.24,
        y: -0.42,
      },
      {
        radius: 3.18,
        speed: 0.22,
        phase: 4.2,
        scale: 0.2,
        y: 0.08,
      },
    ],
    []
  );

  useFrame((state, delta) => {
    if (orbitRef.current) {
      orbitRef.current.rotation.y += delta * 0.045;
    }

    globes.forEach((globe, index) => {
      const group = miniRefs.current[index];

      if (!group) return;

      const time =
        state.clock.elapsedTime * globe.speed + globe.phase;

      group.position.set(
        1.35 + Math.cos(time) * globe.radius,
        globe.y + Math.sin(time * 1.35) * 0.2,
        Math.sin(time) * globe.radius * 0.26
      );
      group.rotation.y += delta * (0.25 + index * 0.08);
      group.rotation.x += delta * 0.06;
    });
  });

  return (
    <group ref={orbitRef}>
      {globes.map((globe, index) => (
        <group key={`mini-${index}`}>
          <mesh
            position={[1.35, 0.02, 0]}
            rotation={[
              index * 0.56 + 0.28,
              index * 0.18,
              index * 0.76 + 0.48,
            ]}
          >
            <torusGeometry args={[globe.radius, 0.006, 12, 260]} />
            <meshBasicMaterial
              color={index === 1 ? MINT : CYAN}
              transparent
              opacity={index === 0 ? 0.36 : 0.22}
              blending={AdditiveBlending}
            />
          </mesh>
          <group
            ref={(node) => {
              miniRefs.current[index] = node;
            }}
          >
            <NetworkGlobe
              count={24}
              radius={0.72}
              scale={globe.scale}
              phase={index * 1.7}
              rotationSpeed={0.24 + index * 0.08}
              nodeSize={0.028}
              lineOpacity={0.58}
              shellOpacity={0.46}
            />
          </group>
        </group>
      ))}
    </group>
  );
}

function OuterSignalRings() {
  const groupRef = useRef(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    groupRef.current.rotation.z -= delta * 0.035;
    groupRef.current.rotation.y =
      Math.sin(state.clock.elapsedTime * 0.16) * 0.06;
  });

  return (
    <group ref={groupRef} position={[1.35, 0, -0.22]}>
      {[2.05, 2.23, 2.48, 2.72].map((radius, index) => (
        <mesh
          key={`signal-${radius}`}
          rotation={[
            Math.PI / 2 + index * 0.1,
            index * 0.2,
            index * 0.55,
          ]}
        >
          <torusGeometry args={[radius, 0.005, 8, 260]} />
          <meshBasicMaterial
            color={index % 2 === 0 ? CYAN : GOLD}
            transparent
            opacity={index % 2 === 0 ? 0.18 : 0.12}
            blending={AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

function DataFilaments() {
  const filaments = useMemo(
    () =>
      Array.from({ length: 9 }, (_, index) => {
        const y = -1.5 + index * 0.36;
        const z = -0.85 + (index % 3) * 0.25;

        return [
          [-3.8, y * 0.44, z],
          [-1.7, y * 0.2, z + 0.25],
          [0.35, y * 0.3, z - 0.1],
          [2.35, y * 0.16, z + 0.28],
          [4.2, y * 0.34, z - 0.08],
        ];
      }),
    []
  );

  return (
    <group position={[0.7, -0.05, -0.75]}>
      {filaments.map((points, index) => (
        <Line
          key={`filament-${index}`}
          points={points}
          color={index % 3 === 0 ? GOLD : CYAN}
          transparent
          opacity={index % 3 === 0 ? 0.13 : 0.18}
          lineWidth={1}
        />
      ))}
    </group>
  );
}

function Hero3D() {
  return (
    <Canvas
      className="h-full w-full"
      camera={{ position: [0, 0.08, 6.4], fov: 43 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.78} />
      <directionalLight
        position={[3.8, 4.4, 4.2]}
        intensity={1.9}
      />
      <pointLight
        position={[1.8, 0.1, 1.6]}
        intensity={2.3}
        color={CYAN}
      />
      <pointLight
        position={[-1.6, -1.2, 1.9]}
        intensity={1.15}
        color={WHITE}
      />
      <pointLight
        position={[3.2, 1.3, -1.8]}
        intensity={0.9}
        color={GOLD}
      />
      <Sparkles
        count={130}
        scale={[8.4, 4.8, 3.8]}
        size={1.25}
        speed={0.22}
        color="#bae6fd"
      />
      <DataFilaments />
      <OuterSignalRings />
      <NetworkGlobe
        count={86}
        radius={1.42}
        position={[1.35, 0, 0]}
        phase={0.4}
        rotationSpeed={0.105}
        nodeSize={0.027}
        lineOpacity={0.52}
        shellOpacity={0.4}
      />
      <OrbitingGlobes />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.18}
      />
    </Canvas>
  );
}

export default Hero3D;
