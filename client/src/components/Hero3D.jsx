import { Canvas } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";

function FloatingSphere() {
  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
      <mesh>
        <sphereGeometry args={[1.1, 64, 64]} />
        <meshStandardMaterial
            color="#4cc9f0"
            emissive="#00d4ff"
            emissiveIntensity={1.5}
            roughness={0.1}
            metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

function Hero3D() {
  return (
    <Canvas camera={{ position: [0, 0, 4] }}>
      <ambientLight intensity={2} />
      <directionalLight position={[2, 2, 2]} />
      <FloatingSphere />
      <OrbitControls enableZoom={false} />
    </Canvas>
  );
}

export default Hero3D;