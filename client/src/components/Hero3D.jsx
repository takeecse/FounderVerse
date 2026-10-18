import {
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, Sparkles } from "@react-three/drei";
import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  SRGBColorSpace,
} from "three";

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const CYAN = "#72b8ff";
const ELECTRIC_BLUE = "#3b82ff";
const MINT = "#3180e3";
const GOLD = "#9bc8ff";
const WHITE = "#dbeafe";
const VIOLET = "#10295f";

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, value));

const randomFrom = (seed) => {
  const value =
    Math.sin(seed * 12.9898 + 78.233) * 43758.5453;

  return value - Math.floor(value);
};

const makePlanetTexture = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;

  const context = canvas.getContext("2d");
  const ocean = context.createLinearGradient(0, 0, 0, canvas.height);
  ocean.addColorStop(0, "#0e2a57");
  ocean.addColorStop(0.22, "#1a4d96");
  ocean.addColorStop(0.52, "#2861b0");
  ocean.addColorStop(0.8, "#1a4d96");
  ocean.addColorStop(1, "#0e2a57");
  context.fillStyle = ocean;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const landmasses = [
    [[0.075, 0.2], [0.105, 0.13], [0.16, 0.15], [0.19, 0.2], [0.24, 0.23], [0.22, 0.29], [0.19, 0.32], [0.17, 0.4], [0.14, 0.44], [0.11, 0.38], [0.09, 0.31]],
    [[0.24, 0.43], [0.28, 0.41], [0.31, 0.46], [0.32, 0.53], [0.3, 0.62], [0.285, 0.74], [0.265, 0.82], [0.25, 0.74], [0.245, 0.62], [0.225, 0.53]],
    [[0.43, 0.24], [0.47, 0.2], [0.51, 0.22], [0.54, 0.28], [0.52, 0.33], [0.49, 0.36], [0.46, 0.33]],
    [[0.465, 0.35], [0.51, 0.34], [0.535, 0.4], [0.53, 0.5], [0.51, 0.61], [0.49, 0.68], [0.47, 0.62], [0.455, 0.52], [0.45, 0.42]],
    [[0.52, 0.22], [0.57, 0.17], [0.64, 0.18], [0.7, 0.21], [0.77, 0.19], [0.83, 0.24], [0.88, 0.29], [0.84, 0.35], [0.78, 0.36], [0.74, 0.42], [0.67, 0.39], [0.62, 0.34], [0.57, 0.33], [0.54, 0.29]],
    [[0.79, 0.54], [0.83, 0.52], [0.87, 0.56], [0.86, 0.62], [0.82, 0.64], [0.79, 0.6]],
  ];

  landmasses.forEach((points, index) => {
    context.beginPath();
    points.forEach(([x, y], pointIndex) => {
      const next = points[(pointIndex + 1) % points.length];
      const currentX = x * canvas.width;
      const currentY = y * canvas.height;
      const midpointX = ((x + next[0]) / 2) * canvas.width;
      const midpointY = ((y + next[1]) / 2) * canvas.height;

      if (pointIndex === 0) {
        const previous = points[points.length - 1];
        context.moveTo(
          ((previous[0] + x) / 2) * canvas.width,
          ((previous[1] + y) / 2) * canvas.height
        );
      }

      context.quadraticCurveTo(
        currentX,
        currentY,
        midpointX,
        midpointY
      );
    });
    context.closePath();
    context.fillStyle = index % 2 === 0 ? "#3975c9" : "#2e65b7";
    context.shadowColor = "#1c58a3";
    context.shadowBlur = 9;
    context.fill();
    context.shadowBlur = 0;
  });

  for (let index = 0; index < 2200; index += 1) {
    const x = randomFrom(index + 121) * canvas.width;
    const y = randomFrom(index + 823) * canvas.height;
    context.fillStyle = index % 3 === 0
      ? "rgba(89, 151, 231, 0.035)"
      : "rgba(0, 4, 19, 0.055)";
    context.fillRect(x, y, 1 + (index % 3), 1);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
};

const makeSphereNodes = (count, radius, phase = 0) =>
  Array.from({ length: count }, (_, index) => {
    const y =
      count === 1 ? 0 : 1 - (index / (count - 1)) * 2;
    const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = index * GOLDEN_ANGLE + phase;
    const radiusPulse =
      radius *
      (0.95 + ((index * 37) % 13) * 0.007);

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

const makeSurfaceArc = (start, end, radius) => {
  const startLength = Math.hypot(...start);
  const endLength = Math.hypot(...end);
  const from = start.map((value) => value / startLength);
  const to = end.map((value) => value / endLength);
  const dot = clamp(
    from[0] * to[0] + from[1] * to[1] + from[2] * to[2],
    -1,
    1
  );
  const angle = Math.acos(dot);
  const sine = Math.sin(angle);
  const segments = Math.max(3, Math.ceil(angle / 0.1));

  return Array.from({ length: segments + 1 }, (_, index) => {
    const progress = index / segments;
    const fromWeight = sine < 0.0001
      ? 1 - progress
      : Math.sin((1 - progress) * angle) / sine;
    const toWeight = sine < 0.0001
      ? progress
      : Math.sin(progress * angle) / sine;
    const direction = from.map(
      (value, axis) => value * fromWeight + to[axis] * toWeight
    );
    const directionLength = Math.hypot(...direction);

    return direction.map((value) => (value / directionLength) * radius);
  });
};

const useHeroParallax = () => {
  const parallax = useRef({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  useEffect(() => {
    const setTarget = (clientX, clientY) => {
      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;

      parallax.current.targetX = clamp(
        (clientX / width) * 2 - 1,
        -1,
        1
      );
      parallax.current.targetY = clamp(
        -((clientY / height) * 2 - 1),
        -1,
        1
      );
    };

    const handlePointerMove = (event) => {
      setTarget(event.clientX, event.clientY);
    };

    const handleTouch = (event) => {
      const touch = event.touches?.[0];

      if (touch) {
        setTarget(touch.clientX, touch.clientY);
      }
    };

    const resetTarget = () => {
      parallax.current.targetX = 0;
      parallax.current.targetY = 0;
    };

    window.addEventListener(
      "pointermove",
      handlePointerMove,
      { passive: true }
    );
    window.addEventListener("touchstart", handleTouch, {
      passive: true,
    });
    window.addEventListener("touchmove", handleTouch, {
      passive: true,
    });
    window.addEventListener("pointerleave", resetTarget);
    window.addEventListener("blur", resetTarget);

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );
      window.removeEventListener("touchstart", handleTouch);
      window.removeEventListener("touchmove", handleTouch);
      window.removeEventListener(
        "pointerleave",
        resetTarget
      );
      window.removeEventListener("blur", resetTarget);
    };
  }, []);

  useFrame((state, delta) => {
    const pointer = parallax.current;
    const ease = 1 - Math.pow(0.001, delta);

    pointer.x += (pointer.targetX - pointer.x) * ease;
    pointer.y += (pointer.targetY - pointer.y) * ease;

    state.camera.position.x +=
      (pointer.x * 0.34 - state.camera.position.x) * ease;
    state.camera.position.y +=
      (0.08 + pointer.y * 0.2 - state.camera.position.y) *
      ease;
    state.camera.lookAt(
      0.62 + pointer.x * 0.08,
      -pointer.y * 0.05,
      0
    );
  });

  return useMemo(() => () => parallax.current, []);
};

function ParallaxLayer({
  children,
  depth = 1,
  getParallax,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}) {
  const groupRef = useRef(null);

  useFrame(() => {
    if (!groupRef.current) return;

    const { x, y } = getParallax();

    groupRef.current.position.set(
      position[0] + x * 0.18 * depth,
      position[1] + y * 0.12 * depth,
      position[2]
    );
    groupRef.current.rotation.set(
      rotation[0] - y * 0.05 * depth,
      rotation[1] + x * 0.08 * depth,
      rotation[2] + x * 0.015 * depth
    );
  });

  return <group ref={groupRef}>{children}</group>;
}

function StarField({
  count = 500,
  spreadX = 11,
  spreadY = 6.4,
  minZ = -5.4,
  maxZ = -1.1,
  size = 0.018,
  color = CYAN,
  opacity = 0.7,
  seed = 1,
}) {
  const positions = useMemo(() => {
    const nextPositions = new Float32Array(count * 3);

    for (let index = 0; index < count; index += 1) {
      const base = index * 3;
      const z =
        minZ + randomFrom(seed + index * 11) * (maxZ - minZ);

      nextPositions[base] =
        (randomFrom(seed + index * 17) - 0.5) * spreadX;
      nextPositions[base + 1] =
        (randomFrom(seed + index * 23) - 0.5) * spreadY;
      nextPositions[base + 2] = z;
    }

    return nextPositions;
  }, [
    count,
    maxZ,
    minZ,
    seed,
    spreadX,
    spreadY,
  ]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={opacity}
        blending={AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

const TWINKLE_VERTEX_SHADER = `
  uniform float uTime;
  attribute float aPhase;
  attribute float aSize;
  varying float vTwinkle;

  void main() {
    float pulse = 0.3 + 0.7 * (0.5 + 0.5 * sin(uTime * (1.1 + aPhase * 2.2) + aPhase * 6.283));
    vTwinkle = pulse;
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (48.0 / max(1.0, -viewPosition.z)) * (0.55 + pulse * 1.45);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const TWINKLE_FRAGMENT_SHADER = `
  uniform vec3 glowColor;
  varying float vTwinkle;

  void main() {
    vec2 point = gl_PointCoord - vec2(0.5);
    float radius = length(point);
    float core = 1.0 - smoothstep(0.0, 0.14, radius);
    float halo = exp(-radius * 9.0);
    float rays = exp(-abs(point.x) * 52.0) * exp(-abs(point.y) * 8.0)
      + exp(-abs(point.y) * 52.0) * exp(-abs(point.x) * 8.0);
    float alpha = min((core + halo * 0.3 + rays * 0.2) * vTwinkle * 0.72, 0.9);
    gl_FragColor = vec4(glowColor * alpha, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function TwinklingPoints({ points, color = "#a9ceff" }) {
  const pointsRef = useRef(null);
  const geometry = useMemo(() => {
    const positions = new Float32Array(points.length * 3);
    const phases = new Float32Array(points.length);
    const sizes = new Float32Array(points.length);

    points.forEach(([x, y, z, phase, size], index) => {
      const base = index * 3;
      positions[base] = x;
      positions[base + 1] = y;
      positions[base + 2] = z;
      phases[index] = phase;
      sizes[index] = size;
    });

    const nextGeometry = new BufferGeometry();
    nextGeometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    nextGeometry.setAttribute("aPhase", new Float32BufferAttribute(phases, 1));
    nextGeometry.setAttribute("aSize", new Float32BufferAttribute(sizes, 1));
    return nextGeometry;
  }, [points]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      glowColor: { value: new Color(color) },
    }),
    [color]
  );

  useFrame((state) => {
    if (pointsRef.current?.material?.uniforms?.uTime) {
      pointsRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={TWINKLE_VERTEX_SHADER}
        fragmentShader={TWINKLE_FRAGMENT_SHADER}
        transparent
        blending={AdditiveBlending}
        depthWrite={false}
        depthTest
        toneMapped={false}
      />
    </points>
  );
}

function BackgroundSparkles() {
  const points = useMemo(
    () =>
      Array.from({ length: 150 }, (_, index) => [
        (randomFrom(index * 17 + 201) - 0.5) * 10.8,
        (randomFrom(index * 23 + 203) - 0.5) * 6.2,
        -1.9 - randomFrom(index * 31 + 207) * 3.4,
        randomFrom(index * 37 + 211),
        0.55 + randomFrom(index * 41 + 223) * 0.7,
      ]),
    []
  );

  return <TwinklingPoints points={points} color="#8bbaff" />;
}

function NebulaClouds() {
  const clouds = useMemo(
    () => [
      [-2.3, -0.92, -5.2, 2.1, 0.42, VIOLET],
      [-0.7, -1.1, -5.05, 2.8, 0.32, ELECTRIC_BLUE],
      [2.5, 0.48, -5.35, 2.6, 0.28, CYAN],
      [3.5, -0.8, -5.6, 1.8, 0.18, MINT],
    ],
    []
  );

  return (
    <group>
      {clouds.map(([x, y, z, size, opacity, color], index) => (
        <mesh
          key={`nebula-${index}`}
          position={[x, y, z]}
          scale={[size * 1.9, size, 1]}
          rotation={[0, 0, index * 0.52]}
        >
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={opacity * 0.13}
            blending={AdditiveBlending}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function ConstellationLayer() {
  const nodes = useMemo(
    () =>
      Array.from({ length: 44 }, (_, index) => [
        (randomFrom(index * 3 + 1) - 0.5) * 9.8,
        (randomFrom(index * 5 + 2) - 0.5) * 5.6,
        -3.6 - randomFrom(index * 7 + 3) * 1.8,
      ]),
    []
  );
  const edges = useMemo(
    () =>
      nodes
        .map((node, index) => {
          const nextIndex =
            (index +
              1 +
              Math.floor(randomFrom(index + 19) * 4)) %
            nodes.length;

          return randomFrom(index + 41) > 0.42
            ? [node, nodes[nextIndex]]
            : null;
        })
        .filter(Boolean),
    [nodes]
  );

  return (
    <group>
      {edges.map((points, index) => (
        <Line
          key={`constellation-${index}`}
          points={points}
          color={index % 4 === 0 ? VIOLET : CYAN}
          transparent
          opacity={index % 4 === 0 ? 0.16 : 0.22}
          lineWidth={0.65}
        />
      ))}

      {nodes.map((node, index) => (
        <mesh key={`constellation-node-${index}`} position={node}>
          <sphereGeometry
            args={[index % 9 === 0 ? 0.025 : 0.014, 12, 12]}
          />
          <meshBasicMaterial
            color={index % 9 === 0 ? WHITE : CYAN}
            transparent
            opacity={index % 9 === 0 ? 0.92 : 0.58}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function PlanetAtmosphere({ radius }) {
  return (
    <>
      <mesh scale={1.055}>
        <sphereGeometry args={[radius, 96, 96]} />
        <shaderMaterial
          uniforms={{
            glowColor: { value: new Color("#3d91ff") },
            strength: { value: 1.24 },
          }}
          vertexShader={`
            varying vec3 vWorldNormal;
            varying vec3 vViewDirection;

            void main() {
              vec4 worldPosition = modelMatrix * vec4(position, 1.0);
              vWorldNormal = normalize(mat3(modelMatrix) * normal);
              vViewDirection = cameraPosition - worldPosition.xyz;
              gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
          `}
          fragmentShader={`
            uniform vec3 glowColor;
            uniform float strength;
            varying vec3 vWorldNormal;
            varying vec3 vViewDirection;

            void main() {
              float facing = max(dot(normalize(vWorldNormal), normalize(vViewDirection)), 0.0);
              float rim = pow(1.0 - facing, 2.25);
              float alpha = rim * strength;
              gl_FragColor = vec4(glowColor * alpha, alpha);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }
          `}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          depthTest
        />
      </mesh>
      <mesh scale={1.11}>
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          uniforms={{
            glowColor: { value: new Color("#2874e8") },
            strength: { value: 0.31 },
          }}
          vertexShader={`
            varying vec3 vWorldNormal;
            varying vec3 vViewDirection;

            void main() {
              vec4 worldPosition = modelMatrix * vec4(position, 1.0);
              vWorldNormal = normalize(mat3(modelMatrix) * normal);
              vViewDirection = cameraPosition - worldPosition.xyz;
              gl_Position = projectionMatrix * viewMatrix * worldPosition;
            }
          `}
          fragmentShader={`
            uniform vec3 glowColor;
            uniform float strength;
            varying vec3 vWorldNormal;
            varying vec3 vViewDirection;

            void main() {
              float facing = max(dot(normalize(vWorldNormal), normalize(vViewDirection)), 0.0);
              float rim = pow(1.0 - facing, 1.7);
              float alpha = rim * strength;
              gl_FragColor = vec4(glowColor * alpha, alpha);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }
          `}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
          depthTest
        />
      </mesh>
    </>
  );
}

function GlobeTechScan({ radius }) {
  const scanRef = useRef(null);
  const scanMaterialRef = useRef(null);

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;

    if (scanRef.current) {
      scanRef.current.rotation.y = elapsed * 0.2;
      scanRef.current.rotation.z = Math.sin(elapsed * 0.32) * 0.12;
    }

    if (scanMaterialRef.current) {
      scanMaterialRef.current.opacity =
        0.18 + (Math.sin(elapsed * 1.8) + 1) * 0.075;
    }
  });

  return (
    <group ref={scanRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 1.009, radius * 0.0032, 10, 320]} />
        <meshBasicMaterial
          ref={scanMaterialRef}
          color={CYAN}
          transparent
          opacity={0.24}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 1.009, radius * 0.009, 8, 320]} />
        <meshBasicMaterial
          color={ELECTRIC_BLUE}
          transparent
          opacity={0.055}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function NetworkGlobe({
  count = 96,
  radius = 1.48,
  position = [0, 0, 0],
  scale = 1,
  phase = 0,
  rotationSpeed = 0.12,
  nodeSize = 0.03,
  lineOpacity = 0.58,
  techDetail = "rich",
}) {
  const groupRef = useRef(null);
  const surfaceTexture = useMemo(makePlanetTexture, []);
  useEffect(() => () => surfaceTexture.dispose(), [surfaceTexture]);
  const nodes = useMemo(
    () => makeSphereNodes(count, radius, phase),
    [count, radius, phase]
  );
  const edgeNodes = useMemo(() => {
    const edgeRadius = radius * (count > 70 ? 1.035 : 1.06);

    return nodes.map((node) => {
      const nodeRadius = Math.hypot(...node);
      const lift = edgeRadius / nodeRadius;

      return node.map((value) => value * lift);
    });
  }, [count, nodes, radius]);
  const sparklePoints = useMemo(
    () =>
      makeSphereNodes(
      techDetail === "rich" ? 168 : 12,
        radius * 1.006,
        phase + 0.72
      ).map((point, index) => [
        ...point,
        randomFrom(index + 337),
        (techDetail === "rich" ? 1.15 : 0.58) +
          randomFrom(index + 407) * (techDetail === "rich" ? 0.82 : 0.55),
      ]),
    [phase, radius, techDetail]
  );
  const edges = useMemo(
    () =>
      makeNetworkEdges(edgeNodes, count > 70 ? 6 : 4).map(
        ([start, end]) =>
          makeSurfaceArc(
            start,
            end,
            radius * (count > 70 ? 1.018 : 1.035)
          )
      ),
    [count, edgeNodes, radius]
  );
  const latitudes = useMemo(
    () => [-0.76, -0.56, -0.36, -0.17, 0, 0.17, 0.36, 0.56, 0.76],
    []
  );
  const longitudes = useMemo(
    () => [
      0,
      Math.PI / 6,
      Math.PI / 3,
      Math.PI / 2,
      (Math.PI * 2) / 3,
      (Math.PI * 5) / 6,
    ],
    []
  );
  const scanBands = useMemo(
    () => [-0.68, -0.44, -0.12, 0.18, 0.48, 0.7],
    []
  );
  const circuitArcs = useMemo(
    () =>
      Array.from({ length: techDetail === "rich" ? 32 : 7 }, (_, index) => {
        const start = nodes[(index * 5 + 3) % nodes.length];
        const mid = nodes[(index * 11 + 17) % nodes.length];
        const end = nodes[(index * 19 + 29) % nodes.length];
        const lift = 1.075 + (index % 4) * 0.014;

        return [
          start.map((value) => value * lift),
          mid.map((value) => value * (lift + 0.035)),
          end.map((value) => value * lift),
        ];
      }),
    [nodes, techDetail]
  );
  const techNodes = useMemo(
    () =>
      nodes
        .filter((_, index) =>
          techDetail === "rich"
            ? index % 6 === 0
            : index % 12 === 0
        )
        .slice(0, techDetail === "rich" ? 26 : 8)
        .map((node, index) => ({
          position: node.map(
            (value) => value * (1.04 + (index % 3) * 0.006)
          ),
          size: nodeSize * (2.2 + (index % 4) * 0.38),
          color:
            index % 7 === 0
              ? WHITE
              : index % 5 === 0
                ? MINT
                : CYAN,
        })),
    [nodeSize, nodes, techDetail]
  );

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    groupRef.current.rotation.y += delta * rotationSpeed;
    groupRef.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 0.24 + phase) * 0.045;
    groupRef.current.rotation.z =
      Math.sin(state.clock.elapsedTime * 0.18 + phase) * 0.018;
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[radius * 0.985, 128, 128]} />
        <meshPhysicalMaterial
          map={surfaceTexture}
          color="#ffffff"
          emissive="#164783"
          emissiveIntensity={0.34}
          roughness={0.46}
          metalness={0.16}
          transparent={false}
          clearcoat={0.54}
          clearcoatRoughness={0.24}
        />
      </mesh>

      <PlanetAtmosphere radius={radius} />
      {techDetail === "rich" && <GlobeTechScan radius={radius} />}

      <mesh>
        <sphereGeometry args={[radius * 1.012, 96, 96]} />
        <meshBasicMaterial
          color={ELECTRIC_BLUE}
          wireframe
          transparent
          opacity={0.08}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {techDetail === "rich" && (
        <mesh scale={[1.035, 1.035, 1.035]}>
          <sphereGeometry args={[radius, 56, 56]} />
          <meshBasicMaterial
            color={CYAN}
            wireframe
            transparent
            opacity={0.14}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

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
            <torusGeometry
              args={[ringRadius, radius * 0.0028, 8, 260]}
            />
            <meshBasicMaterial
              color={CYAN}
              transparent
              opacity={0.1}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        );
      })}

      {longitudes.map((angle) => (
        <mesh
          key={`long-${angle}`}
          rotation={[0, angle, Math.PI / 2]}
        >
          <torusGeometry
            args={[radius * 1.012, radius * 0.0023, 8, 260]}
          />
          <meshBasicMaterial
            color={ELECTRIC_BLUE}
            transparent
            opacity={0.07}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {techDetail === "rich" &&
        scanBands.map((lat, index) => {
          const y = radius * lat;
          const ringRadius =
            radius *
            Math.sqrt(Math.max(0.04, 1 - lat * lat));

          return (
            <mesh
              key={`scan-${lat}`}
              position={[0, y, 0]}
              rotation={[
                Math.PI / 2,
                index % 2 === 0 ? 0.22 : -0.16,
                index * 0.28,
              ]}
            >
              <torusGeometry
                args={[
                  ringRadius,
                  radius * (index % 2 === 0 ? 0.0052 : 0.0036),
                  8,
                  260,
                ]}
              />
              <meshBasicMaterial
                color={index % 2 === 0 ? ELECTRIC_BLUE : CYAN}
                transparent
                opacity={index % 2 === 0 ? 0.16 : 0.11}
                blending={AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          );
        })}

      {edges.map((points, index) =>
        index % 13 === 0 ? (
          <Line
            key={`edge-glow-${index}`}
            points={points}
            color={ELECTRIC_BLUE}
            transparent
            opacity={0.16}
            lineWidth={3.2}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        ) : null
      )}

      {edges.map((points, index) => (
        <Line
          key={`edge-${index}`}
          points={points}
          color={
            index % 17 === 0
              ? WHITE
              : index % 9 === 0
                ? GOLD
                : index % 5 === 0
                  ? MINT
                  : CYAN
          }
          transparent
          opacity={index % 17 === 0 ? 0.94 : lineOpacity * 0.8}
          lineWidth={index % 17 === 0 ? 1.8 : 1.3}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      ))}

      {circuitArcs.map((points, index) => (
        <Line
          key={`circuit-${index}`}
          points={points}
          color={index % 4 === 0 ? ELECTRIC_BLUE : CYAN}
          transparent
          opacity={techDetail === "rich" ? 0.3 : 0.16}
          lineWidth={techDetail === "rich" ? 1.1 : 0.7}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      ))}

      {techNodes.map((marker, index) => (
        <mesh
          key={`tech-node-${index}`}
          position={marker.position}
          rotation={[index * 0.32, index * 0.18, index * 0.41]}
        >
          <torusGeometry
            args={[
              marker.size * 0.56,
              marker.size * 0.08,
              8,
              28,
            ]}
          />
          <meshBasicMaterial
            color={marker.color}
            transparent
            opacity={0.54}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      <TwinklingPoints points={sparklePoints} color="#b9d8ff" />

    </group>
  );
}

const SATELLITE_ORBITS = [
  { semiMajor: 2.86, semiMinor: 2.52, tilt: [0.38, 0.1, 0.16], phase: 0.1, speed: 0.28, scale: 0.28 },
  { semiMajor: 3.28, semiMinor: 2.72, tilt: [-0.3, 0.18, -0.42], phase: 1.65, speed: -0.22, scale: 0.24 },
  { semiMajor: 3.78, semiMinor: 3.08, tilt: [0.66, -0.24, 0.28], phase: 3.2, speed: 0.18, scale: 0.22 },
  { semiMajor: 2.98, semiMinor: 2.56, tilt: [-0.72, 0.32, -0.12], phase: 4.65, speed: -0.25, scale: 0.2 },
];

function OrbitingSatellite({ orbit, index }) {
  const orbitRef = useRef(null);
  const satelliteRef = useRef(null);
  const orbitPoints = useMemo(
    () =>
      Array.from({ length: 241 }, (_, pointIndex) => {
        const angle = (pointIndex / 240) * Math.PI * 2;

        return [
          Math.cos(angle) * orbit.semiMajor,
          Math.sin(angle) * orbit.semiMinor,
          0,
        ];
      }),
    [orbit.semiMajor, orbit.semiMinor]
  );

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;

    if (orbitRef.current) {
      orbitRef.current.rotation.y += delta * (index % 2 === 0 ? 0.008 : -0.006);
    }

    if (!satelliteRef.current) return;

    const angle = elapsed * orbit.speed + orbit.phase;
    satelliteRef.current.position.set(
      Math.cos(angle) * orbit.semiMajor,
      Math.sin(angle) * orbit.semiMinor,
      0
    );
    satelliteRef.current.rotation.y += delta * (0.34 + index * 0.045);
    satelliteRef.current.rotation.x += delta * 0.05;
  });

  return (
    <group
      ref={orbitRef}
      position={[1.58, -0.02, 0.04]}
      rotation={orbit.tilt}
    >
      <Line
        points={orbitPoints}
        color={ELECTRIC_BLUE}
        transparent
        opacity={0.1}
        lineWidth={2.3}
        depthWrite={false}
      />
      <Line
        points={orbitPoints}
        color={CYAN}
        transparent
        opacity={0.48}
        lineWidth={0.8}
        depthWrite={false}
      />
      <group ref={satelliteRef}>
        <NetworkGlobe
          count={24}
          radius={0.76}
          scale={orbit.scale}
          phase={orbit.phase}
          rotationSpeed={0.2}
          nodeSize={0.022}
          lineOpacity={0.5}
          techDetail="lean"
        />
      </group>
    </group>
  );
}

function OrbitingSmallGlobes() {
  return (
    <group>
      {SATELLITE_ORBITS.map((orbit, index) => (
        <OrbitingSatellite
          key={`satellite-${index}`}
          orbit={orbit}
          index={index}
        />
      ))}
    </group>
  );
}

function OuterSignalRings() {
  const groupRef = useRef(null);
  const beaconRef = useRef(null);
  const ringSpecs = useMemo(
    () => [
      {
        radius: 2.86,
        tube: 0.0042,
        rotation: [Math.PI / 2 + 0.2, 0.1, 0.64],
        opacity: 0.46,
        color: CYAN,
      },
      {
        radius: 3.52,
        tube: 0.0036,
        rotation: [Math.PI / 2 - 0.24, 0.28, -0.42],
        opacity: 0.4,
        color: ELECTRIC_BLUE,
      },
      {
        radius: 4.12,
        tube: 0.003,
        rotation: [Math.PI / 2 + 0.34, -0.18, 0.18],
        opacity: 0.3,
        color: ELECTRIC_BLUE,
      },
    ],
    []
  );
  const beacons = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => {
        const radius =
          2.5 + randomFrom(index * 4 + 51) * 1.08;
        const angle = randomFrom(index * 7 + 67) * Math.PI * 2;

        return {
          position: [
            Math.cos(angle) * radius,
            (randomFrom(index + 8) - 0.5) * 1.2 +
              Math.sin(angle * 1.6) * 0.18,
            Math.sin(angle) * radius * 0.92,
          ],
          size: 0.018 + randomFrom(index + 91) * 0.026,
            color: index % 5 === 0 ? WHITE : CYAN,
        };
      }),
    []
  );

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.z -= delta * 0.026;
      groupRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.15) * 0.07;
    }

    if (beaconRef.current) {
      beaconRef.current.rotation.y += delta * 0.055;
      beaconRef.current.rotation.z -= delta * 0.018;
    }
  });

  return (
    <group ref={groupRef} position={[1.58, -0.02, 0.04]}>
      {ringSpecs.map((ring) => (
        <group key={`signal-${ring.radius}`}>
          <mesh
            position={[0, 0, 0]}
            rotation={ring.rotation}
            scale={[1.1, 0.88, 1]}
          >
            <torusGeometry
              args={[ring.radius, ring.tube * 2.2, 10, 360]}
            />
            <meshBasicMaterial
              color={ring.color}
              transparent
              opacity={ring.opacity * 0.14}
              blending={AdditiveBlending}
              depthWrite={false}
              depthTest
            />
          </mesh>
          <mesh
            position={[0, 0, 0]}
            rotation={ring.rotation}
            scale={[1.1, 0.88, 1]}
          >
            <torusGeometry
              args={[ring.radius, ring.tube, 12, 420]}
            />
            <meshBasicMaterial
              color={ring.color}
              transparent
              opacity={ring.opacity}
              blending={AdditiveBlending}
              depthWrite={false}
              depthTest
            />
          </mesh>
        </group>
      ))}

      <group ref={beaconRef} rotation={[0.08, 0.1, 0.18]}>
        {beacons.map((beacon, index) => (
          <mesh
            key={`beacon-${index}`}
            position={beacon.position}
          >
            <sphereGeometry
              args={[
                beacon.size,
                index % 5 === 0 ? 20 : 12,
                index % 5 === 0 ? 20 : 12,
              ]}
            />
            <meshStandardMaterial
              color={beacon.color}
              emissive={beacon.color}
              emissiveIntensity={index % 5 === 0 ? 2.6 : 1.6}
              roughness={0.12}
              metalness={0.28}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function DataFilaments() {
  const filaments = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => {
        const y = -2 + index * 0.31;
        const z = -1.1 + (index % 4) * 0.21;
        const lift = (randomFrom(index + 31) - 0.5) * 0.34;

        return [
          [-4.5, y * 0.45 + lift, z],
          [-2.2, y * 0.22 - lift * 0.3, z + 0.25],
          [0.1, y * 0.32 + lift * 0.2, z - 0.08],
          [2.35, y * 0.18 - lift * 0.2, z + 0.32],
          [4.55, y * 0.34 + lift * 0.1, z - 0.08],
        ];
      }),
    []
  );

  return (
    <group position={[0.72, -0.04, -0.8]}>
      {filaments.map((points, index) => (
        <Line
          key={`filament-${index}`}
          points={points}
          color={index % 4 === 0 ? VIOLET : CYAN}
          transparent
          opacity={index % 4 === 0 ? 0.13 : 0.18}
          lineWidth={0.7}
        />
      ))}
    </group>
  );
}

function HeroScene() {
  const getParallax = useHeroParallax();

  return (
    <>
      <ambientLight intensity={0.34} color="#8cb5f3" />
      <directionalLight
        position={[3.8, 4.4, 4.2]}
        intensity={3.05}
        color="#d1e4ff"
      />
      <directionalLight
        position={[-3.6, 1.1, -3.8]}
        intensity={0.95}
        color="#518cff"
      />
      <pointLight
        position={[1.8, 0.1, 3.2]}
        intensity={2.6}
        color="#4b8fff"
      />
      <pointLight
        position={[-2.2, 1.2, 2.2]}
        intensity={0.65}
        color="#245ed1"
      />
      <pointLight
        position={[3.2, 1.3, -1.8]}
        intensity={0.45}
        color="#0b2b77"
      />

      <ParallaxLayer
        getParallax={getParallax}
        depth={-0.26}
        position={[0, 0, -0.08]}
      >
        <NebulaClouds />
        <StarField
          count={1120}
          size={0.011}
          opacity={0.62}
          seed={3}
        />
        <StarField
          count={340}
          size={0.024}
          opacity={0.62}
          color={WHITE}
          seed={71}
          minZ={-4.2}
          maxZ={-1.8}
        />
        <BackgroundSparkles />
        <ConstellationLayer />
      </ParallaxLayer>

      <ParallaxLayer
        getParallax={getParallax}
        depth={0.3}
        position={[0.18, 0, 0]}
      >
        <Sparkles
          count={190}
          scale={[8.8, 5.2, 3.9]}
          size={1.2}
          speed={0.18}
          color="#bae6fd"
          opacity={0.72}
        />
        <DataFilaments />
      </ParallaxLayer>

      <ParallaxLayer
        getParallax={getParallax}
        depth={0.82}
        position={[0, 0, 0]}
      >
        <OuterSignalRings />
        <OrbitingSmallGlobes />
        <NetworkGlobe
          count={260}
          radius={1.66}
          position={[1.58, -0.02, 0.04]}
          phase={0.4}
          rotationSpeed={0.1}
          nodeSize={0.022}
          lineOpacity={0.92}
        />
      </ParallaxLayer>
    </>
  );
}

function Hero3D() {
  return (
    <Canvas
      className="h-full w-full"
      camera={{ position: [0, 0.08, 6.15], fov: 42 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <HeroScene />
    </Canvas>
  );
}

export default Hero3D;
