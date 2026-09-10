import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, Text, Html } from "@react-three/drei";
import * as THREE from "three";

const SPHERE_RADIUS = 1.5;
const AXIS_LENGTH = SPHERE_RADIUS + 0.5;

/* ─── QL Color Scheme ──────────────────────── */
const COLORS = {
  sphere: "#162d4a",
  equator: "#1c3a5e",
  xAxis: "#ff6b6b",
  yAxis: "#34d399",
  zAxis: "#00d4ff",
  vector: "#c7a94e",
  vectorTip: "#ddc06a",
  grid: "#1c3a5e",
};


/**
 * The 3D Bloch sphere scene rendered inside a React Three Fiber Canvas.
 *
 * @param {number} theta — polar angle (0 to π)
 * @param {number} phi   — azimuthal angle (0 to 2π)
 */

export default function BlochSphere3D({ theta = 0, phi = 0 }) {
  const vectorRef = useRef();
  const tipRef = useRef();
  const trailRef = useRef();

  // State vector endpoint on the sphere
  const stateVec = useMemo(() => {
    // In ThreeJS, Y is UP. So theta=0 (North Pole) must map to Y=1.
    const x = SPHERE_RADIUS * Math.sin(theta) * Math.cos(phi);
    const y = SPHERE_RADIUS * Math.cos(theta); // UP is cos(theta)
    const z = SPHERE_RADIUS * Math.sin(theta) * Math.sin(phi); // DEPTH is sin(theta)sin(phi)
    return new THREE.Vector3(x, y, z);
  }, [theta, phi]);

  // Animate the tip glow
  useFrame(({ clock }) => {
    if (tipRef.current) {
      const scale = 1 + 0.15 * Math.sin(clock.elapsedTime * 3);
      tipRef.current.scale.setScalar(scale);
    }
  });

  // Longitude / latitude grid lines
  const gridLines = useMemo(() => {
    const lines = [];

    // Latitude circles (horizontal)
    for (let lat = -60; lat <= 60; lat += 30) {
      const r = SPHERE_RADIUS * Math.cos((lat * Math.PI) / 180);
      const h = SPHERE_RADIUS * Math.sin((lat * Math.PI) / 180);
      const pts = [];
      for (let a = 0; a <= 360; a += 5) {
        const rad = (a * Math.PI) / 180;
        // Horizontal circles: Y is constant (height h)
        pts.push(new THREE.Vector3(r * Math.cos(rad), h, r * Math.sin(rad)));
      }
      lines.push(pts);
    }

    // Longitude circles (vertical)
    for (let lon = 0; lon < 180; lon += 45) {
      const pts = [];
      const rad = (lon * Math.PI) / 180;
      for (let a = 0; a <= 360; a += 5) {
        const aRad = (a * Math.PI) / 180;
        pts.push(
          new THREE.Vector3(
            SPHERE_RADIUS * Math.sin(aRad) * Math.cos(rad),
            SPHERE_RADIUS * Math.cos(aRad),
            SPHERE_RADIUS * Math.sin(aRad) * Math.sin(rad)
          )
        );
      }
      lines.push(pts);
    }

    return lines;
  }, []);

  // Equator circle points
  const equatorPoints = useMemo(() => {
    const pts = [];
    for (let a = 0; a <= 360; a += 2) {
      const rad = (a * Math.PI) / 180;
      pts.push(
        new THREE.Vector3(
          SPHERE_RADIUS * Math.cos(rad),
          0,
          SPHERE_RADIUS * Math.sin(rad)
        )
      );
    }
    return pts;
  }, []);

  // Theta arc (from Z-axis to state vector)
  const thetaArc = useMemo(() => {
    const pts = [];
    const arcRadius = SPHERE_RADIUS * 0.4;
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * theta;
      pts.push(
        new THREE.Vector3(
          arcRadius * Math.sin(t) * Math.cos(phi),
          arcRadius * Math.cos(t),
          arcRadius * Math.sin(t) * Math.sin(phi)
        )
      );
    }
    return pts;
  }, [theta, phi]);

  // Phi arc (on equator from X-axis to projection)
  const phiArc = useMemo(() => {
    if (Math.abs(theta) < 0.01) return [];
    const pts = [];
    const arcRadius = SPHERE_RADIUS * 0.35;
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const p = (i / steps) * phi;
      pts.push(
        new THREE.Vector3(arcRadius * Math.cos(p), 0, arcRadius * Math.sin(p))
      );
    }
    return pts;
  }, [theta, phi]);

  return (
    <group>
      {/* ─── Wireframe Sphere ────────────────── */}
      <mesh>
        <sphereGeometry args={[SPHERE_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color={COLORS.sphere}
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Grid lines */}
      {gridLines.map((pts, i) => (
        <Line key={i} points={pts} color={COLORS.grid} lineWidth={0.5} transparent opacity={0.12} />
      ))}

      {/* Equator */}
      <Line points={equatorPoints} color={COLORS.equator} lineWidth={1.5} transparent opacity={0.25} />

      {/* ─── Axes ────────────────────────────── */}
      {/* X axis (red) */}
      <Line
        points={[[-AXIS_LENGTH, 0, 0], [AXIS_LENGTH, 0, 0]]}
        color={COLORS.xAxis}
        lineWidth={1.5}
        transparent
        opacity={0.5}
      />
      {/* Y axis (green) */}
      <Line
        points={[[0, 0, -AXIS_LENGTH], [0, 0, AXIS_LENGTH]]}
        color={COLORS.yAxis}
        lineWidth={1.5}
        transparent
        opacity={0.5}
      />
      {/* Z axis (blue/cyan) */}
      <Line
        points={[[0, -AXIS_LENGTH, 0], [0, AXIS_LENGTH, 0]]}
        color={COLORS.zAxis}
        lineWidth={1.5}
        transparent
        opacity={0.5}
      />

      {/* ─── Axis Labels ────────────────────── */}
      <Text position={[AXIS_LENGTH + 0.2, 0, 0]} fontSize={0.22} color={COLORS.xAxis} anchorX="left">
        X
      </Text>
      <Text position={[0, 0, AXIS_LENGTH + 0.2]} fontSize={0.22} color={COLORS.yAxis} anchorX="left">
        Y
      </Text>
      <Text position={[0, AXIS_LENGTH + 0.2, 0]} fontSize={0.22} color={COLORS.zAxis} anchorX="center">
        Z
      </Text>

      {/* ─── Qubit State Labels ──────────────── */}
      <Text position={[0, SPHERE_RADIUS + 0.35, 0]} fontSize={0.25} color="#00d4ff" anchorX="center">
        |0⟩
      </Text>
      <Text position={[0, -SPHERE_RADIUS - 0.35, 0]} fontSize={0.25} color="#00d4ff" anchorX="center">
        |1⟩
      </Text>
      <Text position={[SPHERE_RADIUS + 0.35, 0, 0]} fontSize={0.2} color="#8899aa" anchorX="left">
        |+⟩
      </Text>
      <Text position={[-SPHERE_RADIUS - 0.35, 0, 0]} fontSize={0.2} color="#8899aa" anchorX="right">
        |−⟩
      </Text>
      <Text position={[0, 0, SPHERE_RADIUS + 0.35]} fontSize={0.2} color="#34d399" anchorX="left">
        |i⟩
      </Text>
      <Text position={[0, 0, -SPHERE_RADIUS - 0.35]} fontSize={0.2} color="#34d399" anchorX="right">
        |-i⟩
      </Text>

      {/* ─── Theta Arc ──────────────────────── */}
      {thetaArc.length > 1 && (
        <Line points={thetaArc} color="#c7a94e" lineWidth={2} transparent opacity={0.8} />
      )}

      {/* ─── Phi Arc ────────────────────────── */}
      {phiArc.length > 1 && (
        <Line points={phiArc} color="#00d4ff" lineWidth={2} transparent opacity={0.8} />
      )}

      {/* ─── Angle Labels (HTML overlays) ──── */}
      {thetaArc.length > 1 && (
        <Html
          position={[
            SPHERE_RADIUS * 0.3 * Math.sin(theta / 2) * Math.cos(phi) - 0.15,
            SPHERE_RADIUS * 0.3 * Math.cos(theta / 2) + 0.1,
            SPHERE_RADIUS * 0.3 * Math.sin(theta / 2) * Math.sin(phi),
          ]}
          style={{ pointerEvents: "none" }}
        >
          <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded" style={{ color: "#c7a94e", background: "rgba(10,22,40,0.9)", border: "1px solid rgba(199,169,78,0.3)" }}>θ</span>
        </Html>
      )}
      {phiArc.length > 1 && (
        <Html
          position={[
            SPHERE_RADIUS * 0.25 * Math.cos(phi / 2),
            -0.15,
            SPHERE_RADIUS * 0.25 * Math.sin(phi / 2),
          ]}
          style={{ pointerEvents: "none" }}
        >
          <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded" style={{ color: "#00d4ff", background: "rgba(10,22,40,0.9)", border: "1px solid rgba(0,212,255,0.3)" }}>φ</span>
        </Html>
      )}

      {/* ─── State Vector ────────────────────── */}
      <Line
        ref={vectorRef}
        points={[[0, 0, 0], stateVec.toArray()]}
        color={COLORS.vector}
        lineWidth={3}
      />

      {/* ─── State Vector Tip (sphere) ─ */}
      <mesh ref={tipRef} position={stateVec.toArray()}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={COLORS.vectorTip} />
      </mesh>

      {/* Small outer helper ring */}
      <mesh position={stateVec.toArray()}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={COLORS.vectorTip} transparent opacity={0.15} />
      </mesh>

      {/* ─── Projection line to equator ──────── */}
      {Math.abs(theta) > 0.01 && Math.abs(theta - Math.PI) > 0.01 && (
        <Line
          points={[
            stateVec.toArray(),
            [stateVec.x, 0, stateVec.z],
          ]}
          color="#8899aa"
          lineWidth={1}
          dashed
          dashSize={0.05}
          gapSize={0.05}
          transparent
          opacity={0.3}
        />
      )}
    </group>
  );
}
