"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferGeometry, Color, Float32BufferAttribute, type Group, type Points, type LineSegments } from "three";
import { useGpuTier } from "@/components/three/orchestration/use-gpu-tier";

/** The flowing mesh behind the headline.
 *
 * A globe used to sit here. It said "reach", which is true, but the reference asks for
 * something that says *movement* — a field of contour lines being pushed through the frame,
 * blue in the troughs and mint on the crests. That reads as telemetry in motion, which is
 * the more honest picture of what this console does: nothing here is a map of the world, it
 * is a signal changing shape over time.
 *
 * Every vertex is displaced in the vertex shader from a sum of four sines, so the CPU builds
 * the grid exactly once and animation costs a single uniform write per frame. Displacing
 * 11k vertices on the CPU each frame is the obvious way to write this and the reason most
 * versions of it stutter.
 *
 * Both ends of the gradient are brand colours now. An earlier revision put violet in the
 * troughs and argued it was contained enough not to matter; it was not — a third hue on a
 * two-accent page is a third hue no matter how small its home, and this object is large.
 */

const HALF_X = 3.4;
const HALF_Z = 2.3;

const VERT = /* glsl */ `
  uniform float uTime;
  attribute float aEdge;
  varying float vEdge;
  varying float vH;

  // Four octaves, none of them harmonically related — two sines at a 2:1 ratio produce a
  // visibly repeating corrugation, which is what makes a wave field look like fabric.
  float field(vec2 p, float t) {
    return sin(p.x * 0.90 + t * 0.55) * 0.60
         + sin(p.x * 0.43 - p.y * 0.77 + t * 0.40) * 0.48
         + sin(p.y * 1.31 + t * 0.75) * 0.28
         + sin(p.x * 2.07 + p.y * 1.63 - t * 0.90) * 0.12;
  }

  void main() {
    vec3 p = position;
    float h = field(p.xz, uTime);
    p.y += h;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    vH = clamp(h * 0.36 + 0.5, 0.0, 1.0);
    vEdge = aEdge;
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uLo;
  uniform vec3 uHi;
  varying float vEdge;
  varying float vH;
  void main() {
    vec3 c = mix(uLo, uHi, smoothstep(0.12, 0.88, vH));
    // Crests carry more light than troughs. Without this the field is a uniform net and the
    // height information is thrown away at exactly the moment it becomes visible.
    gl_FragColor = vec4(c, vEdge * (0.16 + 0.62 * vH));
  }
`;

const NODE_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uDpr;
  attribute float aEdge;
  attribute float aSize;
  varying float vEdge;
  varying float vH;

  float field(vec2 p, float t) {
    return sin(p.x * 0.90 + t * 0.55) * 0.60
         + sin(p.x * 0.43 - p.y * 0.77 + t * 0.40) * 0.48
         + sin(p.y * 1.31 + t * 0.75) * 0.28
         + sin(p.x * 2.07 + p.y * 1.63 - t * 0.90) * 0.12;
  }

  void main() {
    vec3 p = position;
    float h = field(p.xz, uTime);
    p.y += h;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    // Divisor matched to a scene ~7 units across viewed from ~4.5. It has to be retuned
    // whenever the scene's scale changes — carrying a figure over from a differently-sized
    // scene is how you end up with ninety-pixel blobs.
    gl_PointSize = aSize * uDpr * (11.0 / max(-mv.z, 0.001));
    vH = clamp(h * 0.36 + 0.5, 0.0, 1.0);
    vEdge = aEdge;
  }
`;

const NODE_FRAG = /* glsl */ `
  uniform vec3 uLo;
  uniform vec3 uHi;
  varying float vEdge;
  varying float vH;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float falloff = smoothstep(0.5, 0.0, d);
    float core = pow(falloff, 6.0);
    vec3 c = mix(uLo, uHi, smoothstep(0.12, 0.88, vH));
    gl_FragColor = vec4(mix(c, vec3(1.0), core * 0.7), (pow(falloff, 2.2) * 0.42 + core) * vEdge * (0.3 + 0.7 * vH));
  }
`;

const smooth = (t: number) => {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
};

/** Fades a vertex out as it approaches the edge of the grid, so the field dissolves into the
 * page instead of ending on the hard rectangle its geometry actually is. */
function edgeFade(x: number, z: number) {
  const fx = 1 - Math.min(1, Math.abs(x) / HALF_X);
  const fz = 1 - Math.min(1, Math.abs(z) / HALF_Z);
  return Math.min(1, smooth(fx / 0.5) * smooth(fz / 0.46));
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Contour lines running along the flow, plus sparse ties across it. Mostly-parallel rather
 * than a full quad mesh: a square net reads as graph paper, and the direction of travel is
 * the thing this visual is for. */
function buildLines(cols: number, rows: number) {
  const pos: number[] = [];
  const edge: number[] = [];

  const at = (i: number, j: number) => {
    const x = -HALF_X + (i / (cols - 1)) * HALF_X * 2;
    const z = -HALF_Z + (j / (rows - 1)) * HALF_Z * 2;
    return [x, z] as const;
  };

  const push = (a: readonly [number, number], b: readonly [number, number]) => {
    pos.push(a[0], 0, a[1], b[0], 0, b[1]);
    edge.push(edgeFade(a[0], a[1]), edgeFade(b[0], b[1]));
  };

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols - 1; i++) push(at(i, j), at(i + 1, j));
  }
  // Every ninth column tied across. At every fourth the two directions came out at similar
  // densities and the field read as graph paper — the ties have to be sparse enough that
  // the eye takes them as structure holding the contours together, not as a second grid.
  for (let i = 0; i < cols; i += 9) {
    for (let j = 0; j < rows - 1; j++) push(at(i, j), at(i, j + 1));
  }

  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
  geo.setAttribute("aEdge", new Float32BufferAttribute(edge, 1));
  return geo;
}

function buildNodes(count: number) {
  const rand = mulberry32(0x51d3);
  const pos: number[] = [];
  const edge: number[] = [];
  const sizes: number[] = [];

  for (let i = 0; i < count; i++) {
    const x = (rand() * 2 - 1) * HALF_X;
    const z = (rand() * 2 - 1) * HALF_Z;
    pos.push(x, 0, z);
    edge.push(edgeFade(x, z));
    sizes.push(rand() < 0.18 ? 3.4 : 1.8);
  }

  const geo = new BufferGeometry();
  geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
  geo.setAttribute("aEdge", new Float32BufferAttribute(edge, 1));
  geo.setAttribute("aSize", new Float32BufferAttribute(sizes, 1));
  return geo;
}

type Uniforms = { uTime: { value: number }; uDpr?: { value: number } };

function Mesh({ density }: { density: number }) {
  const group = useRef<Group>(null);
  const linesRef = useRef<LineSegments>(null);
  const nodesRef = useRef<Points>(null);

  const lines = useMemo(() => buildLines(Math.round(150 * density), Math.round(52 * density)), [density]);
  const nodes = useMemo(() => buildNodes(Math.round(110 * density)), [density]);

  const lo = useMemo(() => new Color("#3e9cff"), []);
  const hi = useMemo(() => new Color("#34f5c5"), []);
  const lineUniforms = useMemo(() => ({ uTime: { value: 0 }, uLo: { value: lo }, uHi: { value: hi } }), [lo, hi]);
  const nodeUniforms = useMemo(
    () => ({ uTime: { value: 0 }, uDpr: { value: 1 }, uLo: { value: lo }, uHi: { value: hi } }),
    [lo, hi]
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const lm = linesRef.current?.material as { uniforms?: Uniforms } | undefined;
    const nm = nodesRef.current?.material as { uniforms?: Uniforms } | undefined;
    if (lm?.uniforms) lm.uniforms.uTime.value = t;
    if (nm?.uniforms) {
      nm.uniforms.uTime.value = t;
      if (nm.uniforms.uDpr) nm.uniforms.uDpr.value = state.viewport.dpr;
    }
    // A slow yaw on top of the wave. The field alone travels in a straight line, and a
    // straight line is the one motion the eye stops seeing after a few seconds.
    if (group.current) group.current.rotation.y = 0.34 + Math.sin(t * 0.09) * 0.1;
  });

  return (
    <group ref={group} rotation={[-0.94, 0.30, 0.08]} position={[0, -0.15, 0]}>
      <lineSegments ref={linesRef} geometry={lines}>
        <shaderMaterial
          uniforms={lineUniforms}
          vertexShader={VERT}
          fragmentShader={FRAG}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </lineSegments>

      <points ref={nodesRef} geometry={nodes}>
        <shaderMaterial
          uniforms={nodeUniforms}
          vertexShader={NODE_VERT}
          fragmentShader={NODE_FRAG}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>
    </group>
  );
}

export function FlowMesh() {
  const tier = useGpuTier();

  // Tier resolution folds in prefers-reduced-motion and no-WebGL2. Both should get the
  // layout without a canvas rather than a stuttering one; the glow underneath stays either
  // way, so the hero never has a hole in it.
  if (tier === null || tier === "off") return <MeshGlow />;

  return (
    <div className="relative aspect-[4/3] w-full">
      <MeshGlow />
      <Canvas
        camera={{ position: [0, 0.75, 3.7], fov: 48 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={tier === "full" ? [1, 2] : 1}
      >
        <Mesh density={tier === "full" ? 1 : 0.6} />
      </Canvas>
    </div>
  );
}

/** The atmosphere the mesh sits in, and the whole visual where there is no canvas. */
function MeshGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "radial-gradient(60% 50% at 62% 42%, rgba(52,245,197,0.15), transparent 72%)," +
          "radial-gradient(48% 44% at 28% 62%, rgba(168,85,247,0.13), transparent 74%)",
      }}
    />
  );
}
