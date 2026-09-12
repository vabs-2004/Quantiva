import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import BlochSphere3D from "../../../components/BlochSphereViewer/BlochSphere3D";
import MathHTMLContainer from "../../../components/MathHTMLContainer/MathHTMLContainer";

/**
 * Quantiva Quantum Foundations — Module 6: Bloch Sphere
 *
 * Pedagogical Structure (9 Exact Approved Sections):
 * 1. Meet the Bloch Sphere
 * 2. The Poles: |0⟩ and |1⟩
 * 3. The Equator: Superposition
 * 4. Where Does Phase Live? (Hero Section)
 * 5. The Full State: θ and φ
 * 6. Build Any Qubit (Integration Centerpiece: 5 Synchronized Views)
 * 7. Move the Qubit: Gates as Rotations
 * 8. Measurement on the Bloch Sphere
 * 9. Bloch Sphere Challenge Lab + Summary
 */

const SQ2 = Math.SQRT2;

// Utility to cleanly format floats, eliminating floating point noise like 6.12e-17
function fmt(val, decimals = 3) {
  if (Math.abs(val) < 1e-10) return "0.000";
  const str = val.toFixed(decimals);
  return str === "-0.000" ? "0.000" : str;
}

// Convert spherical angles to Cartesian coordinates on the unit sphere
function getBlochCoords(theta, phi) {
  const x = Math.sin(theta) * Math.cos(phi);
  const y = Math.sin(theta) * Math.sin(phi);
  const z = Math.cos(theta);
  return {
    x: Math.abs(x) < 1e-10 ? 0 : x,
    y: Math.abs(y) < 1e-10 ? 0 : y,
    z: Math.abs(z) < 1e-10 ? 0 : z,
  };
}

// Single-qubit gate application removing global phase
function applyGate(theta, phi, gateId) {
  const a = Math.cos(theta / 2);
  const bR = Math.sin(theta / 2) * Math.cos(phi);
  const bI = Math.sin(theta / 2) * Math.sin(phi);

  let nAR = 0, nAI = 0, nBR = 0, nBI = 0;

  switch (gateId) {
    case "X":
      nAR = bR; nAI = bI;
      nBR = a; nBI = 0;
      break;
    case "Y":
      nAR = bI; nAI = -bR;
      nBR = 0; nBI = a;
      break;
    case "Z":
      nAR = a; nAI = 0;
      nBR = -bR; nBI = -bI;
      break;
    case "H":
      nAR = (a + bR) / SQ2; nAI = bI / SQ2;
      nBR = (a - bR) / SQ2; nBI = -bI / SQ2;
      break;
    default:
      return { theta, phi };
  }

  let magA = Math.sqrt(nAR * nAR + nAI * nAI);
  let magB = Math.sqrt(nBR * nBR + nBI * nBI);
  const norm = Math.sqrt(magA * magA + magB * magB);
  if (norm > 1e-10) {
    magA /= norm;
    magB /= norm;
  }

  let finalTheta = 2 * Math.acos(Math.max(0, Math.min(1, magA)));
  let finalPhi = 0;

  if (magA > 1e-6) {
    const phaseA = Math.atan2(nAI, nAR);
    const c = Math.cos(-phaseA);
    const s = Math.sin(-phaseA);
    const adjBR = nBR * c - nBI * s;
    const adjBI = nBR * s + nBI * c;
    finalPhi = Math.atan2(adjBI, adjBR);
  } else {
    finalTheta = Math.PI;
  }
  if (finalPhi < 0) finalPhi += 2 * Math.PI;

  return { theta: finalTheta, phi: finalPhi };
}

export default function BlochSphereLesson({ onComplete, isCompleted, onAskQuantiva }) {
  const navigate = useNavigate();

  // =========================================================================
  // STATE MANAGEMENT ACROSS ALL 9 SECTIONS
  // =========================================================================

  // Section 1: Meet the Bloch Sphere Explorer
  const [sec1State, setSec1State] = useState({ name: "|0⟩", theta: 0, phi: 0 });

  // Section 2: The Poles Explorer
  const [sec2ThetaDeg, setSec2ThetaDeg] = useState(0);

  // Section 3: The Equator Explorer
  const [sec3Selected, setSec3Selected] = useState("plus"); // 'plus' or 'minus'

  // Section 4: Hero Section - Where Does Phase Live?
  const [sec4PhiDeg, setSec4PhiDeg] = useState(0);

  // Section 5: The Full State Parameterization
  const [sec5ThetaDeg, setSec5ThetaDeg] = useState(60);
  const [sec5PhiDeg, setSec5PhiDeg] = useState(45);

  // Section 6: Build Any Qubit (5 Synchronized Views)
  const [sec6ThetaDeg, setSec6ThetaDeg] = useState(45);
  const [sec6PhiDeg, setSec6PhiDeg] = useState(60);

  // Section 7: Gates as Rotations
  const [sec7Current, setSec7Current] = useState({ label: "|0⟩", theta: 0, phi: 0 });
  const [sec7History, setSec7History] = useState([]);
  const [sec7LastGate, setSec7LastGate] = useState(null);

  // Section 8: Measurement on the Bloch Sphere
  const [sec8ThetaDeg, setSec8ThetaDeg] = useState(60);
  const [sec8Prediction, setSec8Prediction] = useState(null); // 0 or 1
  const [sec8Shots, setSec8Shots] = useState(100);
  const [sec8Results, setSec8Results] = useState(null);
  const [sec8Collapsed, setSec8Collapsed] = useState(null);

  // Section 9: Challenge Lab
  const [userAnswers, setUserAnswers] = useState({
    ch1: null,
    ch2: null,
    ch3: null,
    ch4: null,
    ch5: null,
    ch6: null,
  });
  const [revealedSolutions, setRevealedSolutions] = useState({});

  // =========================================================================
  // DERIVED COMPUTATIONS
  // =========================================================================

  // Section 2 derived
  const sec2ThetaRad = (sec2ThetaDeg * Math.PI) / 180;
  const sec2P0 = Math.cos(sec2ThetaRad / 2) ** 2;
  const sec2P1 = Math.sin(sec2ThetaRad / 2) ** 2;

  // Section 3 derived
  const sec3ThetaRad = Math.PI / 2;
  const sec3PhiRad = sec3Selected === "plus" ? 0 : Math.PI;

  // Section 4 derived
  const sec4PhiRad = (sec4PhiDeg * Math.PI) / 180;
  const sec4Coords = getBlochCoords(Math.PI / 2, sec4PhiRad);

  // Section 6 derived (The 5 Views)
  const sec6ThetaRad = (sec6ThetaDeg * Math.PI) / 180;
  const sec6PhiRad = (sec6PhiDeg * Math.PI) / 180;
  const sec6Alpha = Math.cos(sec6ThetaRad / 2);
  const sec6BetaRe = Math.cos(sec6PhiRad) * Math.sin(sec6ThetaRad / 2);
  const sec6BetaIm = Math.sin(sec6PhiRad) * Math.sin(sec6ThetaRad / 2);
  const sec6P0 = sec6Alpha * sec6Alpha;
  const sec6P1 = sec6BetaRe * sec6BetaRe + sec6BetaIm * sec6BetaIm;
  const sec6Coords = getBlochCoords(sec6ThetaRad, sec6PhiRad);

  // Section 7 gate application
  const handleApplyGate = (gate) => {
    const next = applyGate(sec7Current.theta, sec7Current.phi, gate);
    let label = `Rotated (${gate})`;
    if (Math.abs(next.theta) < 0.05) label = "|0⟩";
    else if (Math.abs(next.theta - Math.PI) < 0.05) label = "|1⟩";
    else if (Math.abs(next.theta - Math.PI / 2) < 0.05 && Math.abs(next.phi) < 0.05) label = "|+⟩";
    else if (Math.abs(next.theta - Math.PI / 2) < 0.05 && Math.abs(next.phi - Math.PI) < 0.05) label = "|−⟩";

    setSec7History((prev) => [...prev, { from: sec7Current.label, gate, to: label }]);
    setSec7Current({ label, theta: next.theta, phi: next.phi });
    setSec7LastGate(gate);
  };

  const handleResetSec7 = (preset) => {
    if (preset === "0") setSec7Current({ label: "|0⟩", theta: 0, phi: 0 });
    else if (preset === "1") setSec7Current({ label: "|1⟩", theta: Math.PI, phi: 0 });
    else if (preset === "plus") setSec7Current({ label: "|+⟩", theta: Math.PI / 2, phi: 0 });
    else if (preset === "minus") setSec7Current({ label: "|−⟩", theta: Math.PI / 2, phi: Math.PI });
    setSec7LastGate(null);
  };

  // Section 8 measurement
  const sec8ThetaRad = (sec8ThetaDeg * Math.PI) / 180;
  const sec8P0 = Math.cos(sec8ThetaRad / 2) ** 2;
  const sec8P1 = Math.sin(sec8ThetaRad / 2) ** 2;

  const handleRunMeasurement = () => {
    let count0 = 0;
    let count1 = 0;
    let lastOutcome = 0;
    for (let i = 0; i < sec8Shots; i++) {
      const outcome = Math.random() < sec8P0 ? 0 : 1;
      if (outcome === 0) count0++;
      else count1++;
      lastOutcome = outcome;
    }
    setSec8Results({ shots: sec8Shots, count0, count1 });
    setSec8Collapsed(lastOutcome);
  };

  // Challenge checks
  const handleAnswer = (ch, ans) => {
    setUserAnswers((prev) => ({ ...prev, [ch]: ans }));
  };

  const toggleSolution = (ch) => {
    setRevealedSolutions((prev) => ({ ...prev, [ch]: !prev[ch] }));
  };

  const correctAnswers = {
    ch1: "north_pole",
    ch2: "south_pole",
    ch3: "equator_phase_0",
    ch4: "equator_phase_180",
    ch5: 0,
    ch6: "plus",
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto pb-16">
      {/* HEADER CARD */}
      <div className="rounded-3xl p-6 sm:p-10 app-glass border border-[var(--color-app-border)] relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[var(--color-app-primary)]/10 text-[var(--color-app-primary)] border border-[var(--color-app-primary)]/20">
              Module 6 • Quantum Foundations
            </span>
            <span className="text-xs text-[var(--color-app-text-muted)] font-mono">
              Pure Single-Qubit Geometry
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-app-text-main)]">
            Bloch Sphere
          </h1>

          <p className="text-base sm:text-lg text-[var(--color-app-text-muted)] leading-relaxed max-w-3xl">
            For pure single-qubit states, each state corresponds to a point on the surface of the Bloch Sphere, up to an overall global phase. Here we explore how the unit sphere geometrically unites amplitudes, relative phase, quantum gates, and measurement.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onAskQuantiva && onAskQuantiva("Why are |0⟩ and |1⟩ at opposite poles?")}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--color-app-text-muted)] hover:text-white border border-white/10 transition-colors flex items-center gap-1.5"
            >
              <span>✦</span> Ask Tutor about Bloch Sphere
            </button>
            {isCompleted && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <span>✓</span> Completed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1 — MEET THE BLOCH SPHERE                                         */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)] space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[var(--color-app-primary)]/20 text-[var(--color-app-primary)]">
              Section 1
            </span>
            <h2 className="text-xl font-bold text-[var(--color-app-text-main)]">
              Meet the Bloch Sphere
            </h2>
          </div>
          <p className="text-sm text-[var(--color-app-text-muted)] leading-relaxed">
            We have been writing qubit states using complex amplitudes and Dirac notation. Can we represent that same information visually?
          </p>
        </div>

        <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-2">
          <p className="text-sm font-semibold text-[var(--color-app-text-main)]">
            The Bloch Sphere is a geometric representation of the state of a single qubit.
          </p>
          <p className="text-xs text-[var(--color-app-text-muted)] leading-relaxed">
            For the pure single-qubit states covered in this module, every physical state corresponds to a point on the surface of the unit sphere, up to an overall global phase.
          </p>
        </div>

        {/* Interactive Sphere Explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 h-80 rounded-2xl bg-black/60 border border-white/10 overflow-hidden relative flex items-center justify-center">
            <Canvas camera={{ position: [2.8, 2.2, 2.8], fov: 45 }}>
              <ambientLight intensity={0.9} />
              <pointLight position={[5, 5, 5]} intensity={0.8} />
              <BlochSphere3D theta={sec1State.theta} phi={sec1State.phi} />
              <OrbitControls enablePan={false} minDistance={2} maxDistance={6} />
            </Canvas>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-[var(--color-app-text-muted)] bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
              <span>State: <strong className="text-white">{sec1State.name}</strong></span>
              <span>θ: {(sec1State.theta * 180 / Math.PI).toFixed(0)}° | φ: {(sec1State.phi * 180 / Math.PI).toFixed(0)}°</span>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-app-text-muted)]">
              Select a Basis State:
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSec1State({ name: "|0⟩", theta: 0, phi: 0 })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  sec1State.name === "|0⟩"
                    ? "bg-[var(--color-app-primary)]/20 border-[var(--color-app-primary)] text-white"
                    : "bg-black/30 border-white/10 text-[var(--color-app-text-muted)] hover:text-white"
                }`}
              >
                <div className="font-bold text-sm">|0⟩ (North Pole)</div>
                <div className="text-[11px] text-[var(--color-app-text-muted)]">Top of Z-axis</div>
              </button>

              <button
                onClick={() => setSec1State({ name: "|1⟩", theta: Math.PI, phi: 0 })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  sec1State.name === "|1⟩"
                    ? "bg-[var(--color-app-primary)]/20 border-[var(--color-app-primary)] text-white"
                    : "bg-black/30 border-white/10 text-[var(--color-app-text-muted)] hover:text-white"
                }`}
              >
                <div className="font-bold text-sm">|1⟩ (South Pole)</div>
                <div className="text-[11px] text-[var(--color-app-text-muted)]">Bottom of Z-axis</div>
              </button>

              <button
                onClick={() => setSec1State({ name: "|+⟩", theta: Math.PI / 2, phi: 0 })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  sec1State.name === "|+⟩"
                    ? "bg-[var(--color-app-primary)]/20 border-[var(--color-app-primary)] text-white"
                    : "bg-black/30 border-white/10 text-[var(--color-app-text-muted)] hover:text-white"
                }`}
              >
                <div className="font-bold text-sm">|+⟩ (Equator)</div>
                <div className="text-[11px] text-[var(--color-app-text-muted)]">+X Axis (φ = 0°)</div>
              </button>

              <button
                onClick={() => setSec1State({ name: "|−⟩", theta: Math.PI / 2, phi: Math.PI })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  sec1State.name === "|−⟩"
                    ? "bg-[var(--color-app-primary)]/20 border-[var(--color-app-primary)] text-white"
                    : "bg-black/30 border-white/10 text-[var(--color-app-text-muted)] hover:text-white"
                }`}
              >
                <div className="font-bold text-sm">|−⟩ (Equator)</div>
                <div className="text-[11px] text-[var(--color-app-text-muted)]">−X Axis (φ = 180°)</div>
              </button>
            </div>

            <p className="text-xs text-[var(--color-app-text-muted)] italic">
              Tip: Click and drag on the 3D sphere to rotate your camera view and explore the vector in 3D space.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2 — THE POLES: |0⟩ AND |1⟩                                         */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)] space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[var(--color-app-primary)]/20 text-[var(--color-app-primary)]">
              Section 2
            </span>
            <h2 className="text-xl font-bold text-[var(--color-app-text-main)]">
              The Poles: |0⟩ and |1⟩
            </h2>
          </div>
          <p className="text-sm text-[var(--color-app-text-muted)] leading-relaxed">
            The two poles of the sphere represent the classical computational basis states.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-cyan-400 text-base">North Pole: |0⟩</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">θ = 0°</span>
            </div>
            <p className="text-xs text-[var(--color-app-text-muted)]">
              Measurement in computational basis:
            </p>
            <div className="text-xs font-mono space-y-1">
              <div className="flex justify-between"><span>P(0):</span> <strong className="text-cyan-400">100%</strong></div>
              <div className="flex justify-between"><span>P(1):</span> <strong className="text-gray-400">0%</strong></div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-indigo-400 text-base">South Pole: |1⟩</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">θ = 180°</span>
            </div>
            <p className="text-xs text-[var(--color-app-text-muted)]">
              Measurement in computational basis:
            </p>
            <div className="text-xs font-mono space-y-1">
              <div className="flex justify-between"><span>P(0):</span> <strong className="text-gray-400">0%</strong></div>
              <div className="flex justify-between"><span>P(1):</span> <strong className="text-indigo-400">100%</strong></div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-app-primary)]">
            The Polar Angle θ
          </div>
          <p className="text-xs text-[var(--color-app-text-muted)] leading-relaxed">
            The angle <strong>θ</strong> (polar angle, measured from the North Pole down to the vector) determines the balance of probabilities between 0 and 1:
          </p>
          <div className="py-2 flex justify-center">
            <MathHTMLContainer html="$$P(0) = \cos^2\left(\frac{\theta}{2}\right), \quad P(1) = \sin^2\left(\frac{\theta}{2}\right)$$" />
          </div>
        </div>

        {/* Interactive: Pole Explorer Slider */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 h-72 rounded-2xl bg-black/60 border border-white/10 overflow-hidden relative flex items-center justify-center">
            <Canvas camera={{ position: [2.8, 2.2, 2.8], fov: 45 }}>
              <ambientLight intensity={0.9} />
              <pointLight position={[5, 5, 5]} intensity={0.8} />
              <BlochSphere3D theta={sec2ThetaRad} phi={0} />
              <OrbitControls enablePan={false} minDistance={2} maxDistance={6} />
            </Canvas>
          </div>

          <div className="lg:col-span-5 space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--color-app-text-muted)]">Polar angle (θ):</span>
                <span className="text-white font-bold">{sec2ThetaDeg}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="1"
                value={sec2ThetaDeg}
                onChange={(e) => setSec2ThetaDeg(Number(e.target.value))}
                className="w-full accent-[var(--color-app-primary)] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[var(--color-app-text-muted)]">
                <span>0° (|0⟩ North)</span>
                <span>90° (Equator)</span>
                <span>180° (|1⟩ South)</span>
              </div>
            </div>

            {/* Probability Bars */}
            <div className="space-y-3 p-4 rounded-xl bg-black/40 border border-white/10">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-cyan-300">P(0) = cos²(θ/2)</span>
                  <span className="text-cyan-300 font-bold">{(sec2P0 * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-150"
                    style={{ width: `${sec2P0 * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-indigo-300">P(1) = sin²(θ/2)</span>
                  <span className="text-indigo-300 font-bold">{(sec2P1 * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-indigo-400 transition-all duration-150"
                    style={{ width: `${sec2P1 * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="text-xs text-[var(--color-app-text-muted)] leading-relaxed">
              {sec2ThetaDeg < 45 && "Near North Pole: mostly outcome 0 when measured."}
              {sec2ThetaDeg >= 45 && sec2ThetaDeg <= 135 && "Near the Equator: balanced superposition of 0 and 1."}
              {sec2ThetaDeg > 135 && "Near South Pole: mostly outcome 1 when measured."}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3 — THE EQUATOR: SUPERPOSITION                                    */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)] space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[var(--color-app-primary)]/20 text-[var(--color-app-primary)]">
              Section 3
            </span>
            <h2 className="text-xl font-bold text-[var(--color-app-text-main)]">
              The Equator: Superposition
            </h2>
          </div>
          <p className="text-sm text-[var(--color-app-text-muted)] leading-relaxed">
            In Module 9, you encountered equal superpositions created by the Hadamard gate:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-2">
            <div className="text-sm font-mono font-bold text-emerald-400">
              |+⟩ = (|0⟩ + |1⟩)/√2
            </div>
            <p className="text-xs text-[var(--color-app-text-muted)]">
              Located on the equator at +X axis. Both components have magnitude 1/√2.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-2">
            <div className="text-sm font-mono font-bold text-amber-400">
              |−⟩ = (|0⟩ − |1⟩)/√2
            </div>
            <p className="text-xs text-[var(--color-app-text-muted)]">
              Located on the equator at −X axis. Exactly opposite to |+⟩ across the equator.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--color-app-primary)]/10 border border-[var(--color-app-primary)]/20 space-y-2">
          <p className="text-sm font-semibold text-[var(--color-app-text-main)]">
            States on the equator have equal-magnitude |0⟩ and |1⟩ components.
          </p>
          <p className="text-xs text-[var(--color-app-text-muted)] leading-relaxed">
            Because θ = 90° on the equator, every equator state has P(0) = cos²(45°) = 50% and P(1) = sin²(45°) = 50%. Their location around the circumference of the equator represents their relative phase.
          </p>
        </div>

        {/* Interactive Equator Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 h-72 rounded-2xl bg-black/60 border border-white/10 overflow-hidden relative flex items-center justify-center">
            <Canvas camera={{ position: [2.8, 2.2, 2.8], fov: 45 }}>
              <ambientLight intensity={0.9} />
              <pointLight position={[5, 5, 5]} intensity={0.8} />
              <BlochSphere3D theta={sec3ThetaRad} phi={sec3PhiRad} />
              <OrbitControls enablePan={false} minDistance={2} maxDistance={6} />
            </Canvas>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-app-text-muted)]">
              Toggle Equator State:
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSec3Selected("plus")}
                className={`p-3 rounded-xl border text-center transition-all ${
                  sec3Selected === "plus"
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                    : "bg-black/30 border-white/10 text-[var(--color-app-text-muted)] hover:text-white"
                }`}
              >
                <div className="font-bold text-sm">|+⟩ State</div>
                <div className="text-[10px] font-mono mt-1">Relative Phase 0°</div>
              </button>

              <button
                onClick={() => setSec3Selected("minus")}
                className={`p-3 rounded-xl border text-center transition-all ${
                  sec3Selected === "minus"
                    ? "bg-amber-500/20 border-amber-500 text-amber-300"
                    : "bg-black/30 border-white/10 text-[var(--color-app-text-muted)] hover:text-white"
                }`}
              >
                <div className="font-bold text-sm">|−⟩ State</div>
                <div className="text-[10px] font-mono mt-1">Relative Phase 180°</div>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[var(--color-app-text-muted)]">P(0):</span>
                <span className="text-white font-bold">50.0%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-app-text-muted)]">P(1):</span>
                <span className="text-white font-bold">50.0%</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-1.5">
                <span className="text-[var(--color-app-text-muted)]">Equator separation:</span>
                <span className="text-cyan-400 font-bold">180° (opposite sides)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4 — WHERE DOES PHASE LIVE? (HERO SECTION)                          */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)] space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[var(--color-app-primary)]/20 text-[var(--color-app-primary)]">
              Section 4 • Hero Discovery
            </span>
            <h2 className="text-xl font-bold text-[var(--color-app-text-main)]">
              Where Does Phase Live?
            </h2>
          </div>
          <p className="text-sm text-[var(--color-app-text-muted)] leading-relaxed">
            In Module 5, you learned that relative phase does not alter computational-basis measurement probabilities. Where does that phase go geometrically?
          </p>
        </div>

        <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-2">
          <p className="text-xs text-[var(--color-app-text-muted)]">
            Recall the phase family on the equator (θ = 90°):
          </p>
          <div className="py-2 flex justify-center">
            <MathHTMLContainer html="$$|\psi\rangle = \frac{1}{\sqrt{2}}|0\rangle + \frac{e^{i\varphi}}{\sqrt{2}}|1\rangle$$" />
          </div>
          <p className="text-xs text-[var(--color-app-text-muted)] leading-relaxed">
            Interactive demonstration: demonstrate that changing relative phase moves the state around the equator while computational-basis probabilities remain 50/50.
          </p>
        </div>

        {/* Phase Dial Interactive */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 h-80 rounded-2xl bg-black/60 border border-white/10 overflow-hidden relative flex items-center justify-center">
            <Canvas camera={{ position: [2.8, 2.2, 2.8], fov: 45 }}>
              <ambientLight intensity={0.9} />
              <pointLight position={[5, 5, 5]} intensity={0.8} />
              <BlochSphere3D theta={Math.PI / 2} phi={sec4PhiRad} />
              <OrbitControls enablePan={false} minDistance={2} maxDistance={6} />
            </Canvas>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-[var(--color-app-text-muted)] bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
              <span>Phase φ: <strong className="text-cyan-400">{sec4PhiDeg}°</strong></span>
              <span>Bloch: ({fmt(sec4Coords.x, 2)}, {fmt(sec4Coords.y, 2)}, {fmt(sec4Coords.z, 2)})</span>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--color-app-text-muted)]">Azimuthal phase angle (φ):</span>
                <span className="text-cyan-400 font-bold">{sec4PhiDeg}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="359"
                step="1"
                value={sec4PhiDeg}
                onChange={(e) => setSec4PhiDeg(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSec4PhiDeg(0)}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                  sec4PhiDeg === 0
                    ? "bg-cyan-500/20 border-cyan-400 text-white"
                    : "bg-black/30 border-white/10 text-[var(--color-app-text-muted)] hover:text-white"
                }`}
              >
                <div className="font-bold">φ = 0°: |+⟩</div>
                <div className="text-[10px] text-gray-400">(|0⟩ + |1⟩)/√2</div>
              </button>

              <button
                onClick={() => setSec4PhiDeg(90)}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                  sec4PhiDeg === 90
                    ? "bg-cyan-500/20 border-cyan-400 text-white"
                    : "bg-black/30 border-white/10 text-[var(--color-app-text-muted)] hover:text-white"
                }`}
              >
                <div className="font-bold">φ = 90°: |+i⟩</div>
                <div className="text-[10px] text-gray-400">(|0⟩ + i|1⟩)/√2</div>
              </button>

              <button
                onClick={() => setSec4PhiDeg(180)}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                  sec4PhiDeg === 180
                    ? "bg-cyan-500/20 border-cyan-400 text-white"
                    : "bg-black/30 border-white/10 text-[var(--color-app-text-muted)] hover:text-white"
                }`}
              >
                <div className="font-bold">φ = 180°: |−⟩</div>
                <div className="text-[10px] text-gray-400">(|0⟩ − |1⟩)/√2</div>
              </button>

              <button
                onClick={() => setSec4PhiDeg(270)}
                className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                  sec4PhiDeg === 270
                    ? "bg-cyan-500/20 border-cyan-400 text-white"
                    : "bg-black/30 border-white/10 text-[var(--color-app-text-muted)] hover:text-white"
                }`}
              >
                <div className="font-bold">φ = 270°: |−i⟩</div>
                <div className="text-[10px] text-gray-400">(|0⟩ − i|1⟩)/√2</div>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[var(--color-app-text-muted)]">P(0):</span>
                <span className="text-white font-bold">50.0%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-app-text-muted)]">P(1):</span>
                <span className="text-white font-bold">50.0%</span>
              </div>
              <div className="text-[11px] text-cyan-300/80 pt-1 border-t border-white/5">
                Notice: The state rotates continuously around the equator while computational-basis probabilities remain exactly 50/50.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5 — THE FULL STATE: θ AND φ                                       */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)] space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[var(--color-app-primary)]/20 text-[var(--color-app-primary)]">
              Section 5
            </span>
            <h2 className="text-xl font-bold text-[var(--color-app-text-main)]">
              The Full State: θ and φ
            </h2>
          </div>
          <p className="text-sm text-[var(--color-app-text-muted)] leading-relaxed">
            Combining polar angle θ and azimuthal phase angle φ gives the complete parameterization of any single-qubit pure state up to global phase.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-3">
          <div className="py-2 flex justify-center">
            <MathHTMLContainer html="$$|\psi\rangle = \cos\left(\frac{\theta}{2}\right)|0\rangle + e^{i\varphi}\sin\left(\frac{\theta}{2}\right)|1\rangle$$" />
          </div>
          <p className="text-xs text-[var(--color-app-text-muted)] text-center leading-relaxed">
            Two geometric angles uniquely specify any pure single-qubit state on the unit sphere up to an overall global phase.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-400 text-sm">θ — Polar Angle</span>
              <span className="text-xs font-mono text-[var(--color-app-text-muted)]">[0°, 180°]</span>
            </div>
            <p className="text-xs text-[var(--color-app-text-muted)] leading-relaxed">
              Measured from the +z axis down to the state vector. Controls the balance of magnitudes between the |0⟩ and |1⟩ components, dictating the computational-basis probabilities:
            </p>
            <div className="text-xs font-mono text-cyan-300">
              P(0) = cos²(θ/2), &nbsp; P(1) = sin²(θ/2)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-400 text-sm">φ — Azimuthal Angle</span>
              <span className="text-xs font-mono text-[var(--color-app-text-muted)]">[0°, 360°)</span>
            </div>
            <p className="text-xs text-[var(--color-app-text-muted)] leading-relaxed">
              Measured around the equator from the +x axis toward +y. Represents the relative phase between the |0⟩ and |1⟩ components:
            </p>
            <div className="text-xs font-mono text-cyan-300">
              e^(iφ) = cos(φ) + i sin(φ)
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
          <strong>Note on Global Phase:</strong> An overall multiplying factor of e^(iγ) changes the mathematical expression without altering any measurement probabilities or observable properties. The Bloch Sphere represents the physical single-qubit pure state modulo global phase.
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6 — BUILD ANY QUBIT (5 SYNCHRONIZED VIEWS)                        */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)] space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[var(--color-app-primary)]/20 text-[var(--color-app-primary)]">
              Section 6 • Integration Centerpiece
            </span>
            <h2 className="text-xl font-bold text-[var(--color-app-text-main)]">
              Build Any Qubit
            </h2>
          </div>
          <p className="text-sm text-[var(--color-app-text-muted)] leading-relaxed">
            Move the sliders to set any polar angle θ and azimuthal phase angle φ. Observe 5 synchronized views of the exact same state.
          </p>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-black/30 border border-white/10">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-amber-400 font-bold">Polar Angle θ:</span>
              <span className="text-white font-bold">{sec6ThetaDeg}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              step="1"
              value={sec6ThetaDeg}
              onChange={(e) => setSec6ThetaDeg(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--color-app-text-muted)] font-mono">
              <span>0° (North)</span>
              <span>90° (Equator)</span>
              <span>180° (South)</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-cyan-400 font-bold">Azimuthal Phase φ:</span>
              <span className="text-white font-bold">{sec6PhiDeg}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="359"
              step="1"
              value={sec6PhiDeg}
              onChange={(e) => setSec6PhiDeg(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--color-app-text-muted)] font-mono">
              <span>0° (+X)</span>
              <span>90° (+Y)</span>
              <span>180° (−X)</span>
              <span>270° (−Y)</span>
            </div>
          </div>
        </div>

        {/* 5 Synchronized Views Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* View 1: 3D Bloch Sphere */}
          <div className="lg:col-span-6 h-80 rounded-2xl bg-black/60 border border-white/10 overflow-hidden relative flex items-center justify-center">
            <Canvas camera={{ position: [2.8, 2.2, 2.8], fov: 45 }}>
              <ambientLight intensity={0.9} />
              <pointLight position={[5, 5, 5]} intensity={0.8} />
              <BlochSphere3D theta={sec6ThetaRad} phi={sec6PhiRad} />
              <OrbitControls enablePan={false} minDistance={2} maxDistance={6} />
            </Canvas>
            <div className="absolute top-3 left-3 text-[10px] font-mono text-[var(--color-app-text-muted)] bg-black/70 px-2 py-1 rounded border border-white/10">
              View 1: Bloch Sphere
            </div>
            <div className="absolute bottom-3 left-3 right-3 text-center text-[10px] font-mono text-cyan-300 bg-black/70 px-2 py-1 rounded border border-white/10">
              (x: {fmt(sec6Coords.x)}, y: {fmt(sec6Coords.y)}, z: {fmt(sec6Coords.z)})
            </div>
          </div>

          {/* Views 2, 3, 4, 5 */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* View 2: Dirac Notation */}
            <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-1.5 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-app-primary)]">
                View 2: Dirac Notation
              </span>
              <div className="font-mono text-sm text-white py-1">
                |ψ⟩ = {fmt(sec6Alpha, 3)}|0⟩ + ({fmt(sec6BetaRe, 3)} {sec6BetaIm >= 0 ? "+" : "−"} {fmt(Math.abs(sec6BetaIm), 3)}i)|1⟩
              </div>
              <span className="text-[10px] text-[var(--color-app-text-muted)]">
                |ψ⟩ = α|0⟩ + β|1⟩
              </span>
            </div>

            {/* View 3: Amplitudes */}
            <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-1.5 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                View 3: Amplitudes
              </span>
              <div className="font-mono text-xs text-white space-y-0.5">
                <div>α = {fmt(sec6Alpha, 3)}</div>
                <div>β = {fmt(sec6BetaRe, 3)} {sec6BetaIm >= 0 ? "+" : "−"} {fmt(Math.abs(sec6BetaIm), 3)}i</div>
              </div>
              <span className="text-[10px] text-[var(--color-app-text-muted)]">
                |α| = {fmt(Math.abs(sec6Alpha), 3)}, |β| = {fmt(Math.sqrt(sec6BetaRe**2 + sec6BetaIm**2), 3)}
              </span>
            </div>

            {/* View 4: Probabilities */}
            <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-1.5 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                View 4: Probabilities
              </span>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span>P(0):</span>
                  <span className="text-cyan-300 font-bold">{(sec6P0 * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>P(1):</span>
                  <span className="text-indigo-300 font-bold">{(sec6P1 * 100).toFixed(1)}%</span>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">
                |α|² + |β|² = {(sec6P0 + sec6P1).toFixed(3)} ✓
              </span>
            </div>

            {/* View 5: Relative Phase */}
            <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-1.5 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                View 5: Phase
              </span>
              <div className="font-mono text-sm text-cyan-300 py-1">
                φ = {sec6PhiDeg}° ({(sec6PhiRad / Math.PI).toFixed(2)}π rad)
              </div>
              <span className="text-[10px] text-[var(--color-app-text-muted)]">
                Relative phase between |0⟩ and |1⟩
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7 — MOVE THE QUBIT: GATES AS ROTATIONS                            */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)] space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[var(--color-app-primary)]/20 text-[var(--color-app-primary)]">
              Section 7
            </span>
            <h2 className="text-xl font-bold text-[var(--color-app-text-main)]">
              Move the Qubit: Gates as Rotations
            </h2>
          </div>
          <p className="text-sm text-[var(--color-app-text-muted)] leading-relaxed">
            On the Bloch Sphere, many single-qubit quantum gates can be understood geometrically as rotations of the state vector.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-2 text-xs text-[var(--color-app-text-muted)] leading-relaxed">
          <p className="font-semibold text-white">Concrete Educational Transformations:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>X Gate (Bit Flip):</strong> |0⟩ → X → |1⟩ and |1⟩ → X → |0⟩ (180° rotation around the X axis).</li>
            <li><strong>Z Gate (Phase Flip):</strong> |+⟩ → Z → |−⟩ and |−⟩ → Z → |+⟩ (180° rotation around the Z axis, flipping equator phase).</li>
            <li><strong>H Gate (Hadamard):</strong> |0⟩ → H → |+⟩ and |+⟩ → H → |0⟩ (H maps the computational Z basis to the X basis).</li>
            <li><strong>Y Gate:</strong> |0⟩ → Y → i|1⟩ and |1⟩ → Y → −i|0⟩ (180° rotation around the Y axis).</li>
          </ul>
        </div>

        {/* Interactive Gate Workbench */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 h-72 rounded-2xl bg-black/60 border border-white/10 overflow-hidden relative flex items-center justify-center">
            <Canvas camera={{ position: [2.8, 2.2, 2.8], fov: 45 }}>
              <ambientLight intensity={0.9} />
              <pointLight position={[5, 5, 5]} intensity={0.8} />
              <BlochSphere3D theta={sec7Current.theta} phi={sec7Current.phi} />
              <OrbitControls enablePan={false} minDistance={2} maxDistance={6} />
            </Canvas>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-[var(--color-app-text-muted)] bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
              <span>Current: <strong className="text-cyan-400">{sec7Current.label}</strong></span>
              {sec7LastGate && <span className="text-amber-400 font-bold">Applied: {sec7LastGate}</span>}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-app-text-muted)]">
                Start From:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleResetSec7("0")}
                  className="px-3 py-1 text-xs rounded-lg bg-black/40 border border-white/10 hover:border-white/30 text-white font-mono"
                >
                  |0⟩
                </button>
                <button
                  onClick={() => handleResetSec7("1")}
                  className="px-3 py-1 text-xs rounded-lg bg-black/40 border border-white/10 hover:border-white/30 text-white font-mono"
                >
                  |1⟩
                </button>
                <button
                  onClick={() => handleResetSec7("plus")}
                  className="px-3 py-1 text-xs rounded-lg bg-black/40 border border-white/10 hover:border-white/30 text-white font-mono"
                >
                  |+⟩
                </button>
                <button
                  onClick={() => handleResetSec7("minus")}
                  className="px-3 py-1 text-xs rounded-lg bg-black/40 border border-white/10 hover:border-white/30 text-white font-mono"
                >
                  |−⟩
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-app-text-muted)]">
                Apply Single-Qubit Gate:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleApplyGate("X")}
                  className="p-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 font-mono font-bold text-xs flex items-center justify-between"
                >
                  <span>X (NOT)</span>
                  <span className="text-[10px] opacity-70">Bit Flip</span>
                </button>
                <button
                  onClick={() => handleApplyGate("Z")}
                  className="p-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 font-mono font-bold text-xs flex items-center justify-between"
                >
                  <span>Z (Phase)</span>
                  <span className="text-[10px] opacity-70">Phase Flip</span>
                </button>
                <button
                  onClick={() => handleApplyGate("H")}
                  className="p-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 font-mono font-bold text-xs flex items-center justify-between"
                >
                  <span>H (Hadamard)</span>
                  <span className="text-[10px] opacity-70">Z ↔ X</span>
                </button>
                <button
                  onClick={() => handleApplyGate("Y")}
                  className="p-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs flex items-center justify-between"
                >
                  <span>Y</span>
                  <span className="text-[10px] opacity-70">Y-Flip</span>
                </button>
              </div>
            </div>

            {sec7History.length > 0 && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 text-xs font-mono max-h-24 overflow-y-auto">
                <span className="text-[10px] text-[var(--color-app-text-muted)] uppercase">Transformation History:</span>
                {sec7History.slice(-3).map((item, idx) => (
                  <div key={idx} className="text-gray-300">
                    {item.from} → [{item.gate}] → <strong className="text-cyan-300">{item.to}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 8 — MEASUREMENT ON THE BLOCH SPHERE                               */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)] space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[var(--color-app-primary)]/20 text-[var(--color-app-primary)]">
              Section 8
            </span>
            <h2 className="text-xl font-bold text-[var(--color-app-text-main)]">
              Measurement on the Bloch Sphere
            </h2>
          </div>
          <p className="text-sm text-[var(--color-app-text-muted)] leading-relaxed">
            The Bloch Sphere is a geometric representation of the quantum state. Computational-basis measurement produces a classical outcome according to the state's measurement probabilities.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-2 text-xs text-[var(--color-app-text-muted)] leading-relaxed">
          <p>
            When a measurement is performed in the computational basis, the quantum state collapses to either |0⟩ (North pole) or |1⟩ (South pole). If our visualization shows the post-measurement state at a pole, that represents the <strong>post-measurement state</strong>, not a literal physical vector moving through space.
          </p>
        </div>

        {/* Predict -> Measure Workbench */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 h-72 rounded-2xl bg-black/60 border border-white/10 overflow-hidden relative flex items-center justify-center">
            <Canvas camera={{ position: [2.8, 2.2, 2.8], fov: 45 }}>
              <ambientLight intensity={0.9} />
              <pointLight position={[5, 5, 5]} intensity={0.8} />
              <BlochSphere3D
                theta={sec8Collapsed !== null ? (sec8Collapsed === 0 ? 0 : Math.PI) : sec8ThetaRad}
                phi={0}
              />
              <OrbitControls enablePan={false} minDistance={2} maxDistance={6} />
            </Canvas>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-[var(--color-app-text-muted)] bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
              <span>Prepared θ: <strong>{sec8ThetaDeg}°</strong></span>
              {sec8Collapsed !== null && (
                <span className="text-emerald-400 font-bold">
                  Collapsed to: |{sec8Collapsed}⟩ ({sec8Collapsed === 0 ? "North" : "South"} Pole)
                </span>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--color-app-text-muted)]">Set Prepared State (θ):</span>
                <span className="text-white font-bold">{sec8ThetaDeg}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="5"
                value={sec8ThetaDeg}
                onChange={(e) => {
                  setSec8ThetaDeg(Number(e.target.value));
                  setSec8Collapsed(null);
                  setSec8Results(null);
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[var(--color-app-text-muted)] font-mono">
                <span>P(0): {(sec8P0 * 100).toFixed(0)}%</span>
                <span>P(1): {(sec8P1 * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-app-text-muted)]">
                Step 1: Predict More Likely Outcome
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSec8Prediction(0)}
                  className={`p-2.5 rounded-xl border text-center font-mono font-bold text-xs transition-all ${
                    sec8Prediction === 0
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                      : "bg-black/30 border-white/10 text-gray-300 hover:text-white"
                  }`}
                >
                  Outcome 0 (|0⟩)
                </button>
                <button
                  onClick={() => setSec8Prediction(1)}
                  className={`p-2.5 rounded-xl border text-center font-mono font-bold text-xs transition-all ${
                    sec8Prediction === 1
                      ? "bg-indigo-500/20 border-indigo-400 text-indigo-300"
                      : "bg-black/30 border-white/10 text-gray-300 hover:text-white"
                  }`}
                >
                  Outcome 1 (|1⟩)
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-app-text-muted)]">
                  Step 2: Run Shots
                </span>
                <select
                  value={sec8Shots}
                  onChange={(e) => setSec8Shots(Number(e.target.value))}
                  className="bg-black/60 border border-white/10 text-xs rounded px-2 py-1 text-white font-mono"
                >
                  <option value="1">1 shot</option>
                  <option value="10">10 shots</option>
                  <option value="100">100 shots</option>
                  <option value="1000">1,000 shots</option>
                </select>
              </div>
              <button
                onClick={handleRunMeasurement}
                className="w-full py-2.5 rounded-xl bg-[var(--color-app-primary)] hover:bg-[var(--color-app-primary)]/80 text-black font-bold text-xs transition-colors"
              >
                Perform Measurement
              </button>
            </div>

            {sec8Results && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-cyan-300">Measured 0: {sec8Results.count0}</span>
                  <span className="text-indigo-300">Measured 1: {sec8Results.count1}</span>
                </div>
                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden flex">
                  <div
                    className="bg-cyan-400 h-full"
                    style={{ width: `${(sec8Results.count0 / sec8Results.shots) * 100}%` }}
                  />
                  <div
                    className="bg-indigo-400 h-full"
                    style={{ width: `${(sec8Results.count1 / sec8Results.shots) * 100}%` }}
                  />
                </div>
                <div className="text-[10px] text-gray-400 flex justify-between">
                  <span>Theoretical P(0): {(sec8P0 * 100).toFixed(1)}%</span>
                  <span>Empirical 0: {((sec8Results.count0 / sec8Results.shots) * 100).toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 9 — BLOCH SPHERE CHALLENGE LAB + SUMMARY                          */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)] space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[var(--color-app-primary)]/20 text-[var(--color-app-primary)]">
              Section 9
            </span>
            <h2 className="text-xl font-bold text-[var(--color-app-text-main)]">
              Bloch Sphere Challenge Lab
            </h2>
          </div>
          <p className="text-sm text-[var(--color-app-text-muted)] leading-relaxed">
            Test your understanding across 6 interactive challenges.
          </p>
        </div>

        {/* 6 Challenges */}
        <div className="space-y-4">
          {/* Challenge 1 */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase">Challenge 1: Find |0⟩</span>
              {userAnswers.ch1 === correctAnswers.ch1 && (
                <span className="text-xs text-emerald-400 font-bold">✓ Correct</span>
              )}
            </div>
            <p className="text-sm text-white">Where is the basis state |0⟩ located on the Bloch Sphere?</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "north_pole", label: "North pole (+Z)" },
                { id: "south_pole", label: "South pole (−Z)" },
                { id: "equator_x", label: "Equator (+X)" },
                { id: "center", label: "Center of sphere" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleAnswer("ch1", opt.id)}
                  className={`p-2 text-xs rounded-lg border text-center transition-all ${
                    userAnswers.ch1 === opt.id
                      ? opt.id === correctAnswers.ch1
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : "bg-red-500/20 border-red-500 text-red-300"
                      : "bg-black/20 border-white/10 text-gray-300 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {revealedSolutions.ch1 && (
              <p className="text-xs text-cyan-300/80 pt-1">
                Solution: |0⟩ corresponds to polar angle θ = 0°, which is the North Pole of the Bloch Sphere.
              </p>
            )}
            <button
              onClick={() => toggleSolution("ch1")}
              className="text-[11px] text-[var(--color-app-text-muted)] hover:underline"
            >
              {revealedSolutions.ch1 ? "Hide explanation" : "Show explanation"}
            </button>
          </div>

          {/* Challenge 2 */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase">Challenge 2: Find |1⟩</span>
              {userAnswers.ch2 === correctAnswers.ch2 && (
                <span className="text-xs text-emerald-400 font-bold">✓ Correct</span>
              )}
            </div>
            <p className="text-sm text-white">Where is the basis state |1⟩ located on the Bloch Sphere?</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "south_pole", label: "South pole (−Z)" },
                { id: "north_pole", label: "North pole (+Z)" },
                { id: "equator_y", label: "Equator (+Y)" },
                { id: "equator_neg_x", label: "Equator (−X)" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleAnswer("ch2", opt.id)}
                  className={`p-2 text-xs rounded-lg border text-center transition-all ${
                    userAnswers.ch2 === opt.id
                      ? opt.id === correctAnswers.ch2
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : "bg-red-500/20 border-red-500 text-red-300"
                      : "bg-black/20 border-white/10 text-gray-300 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {revealedSolutions.ch2 && (
              <p className="text-xs text-cyan-300/80 pt-1">
                Solution: |1⟩ corresponds to polar angle θ = 180° (π rad), placing it at the South Pole.
              </p>
            )}
            <button
              onClick={() => toggleSolution("ch2")}
              className="text-[11px] text-[var(--color-app-text-muted)] hover:underline"
            >
              {revealedSolutions.ch2 ? "Hide explanation" : "Show explanation"}
            </button>
          </div>

          {/* Challenge 3 */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase">Challenge 3: Find |+⟩</span>
              {userAnswers.ch3 === correctAnswers.ch3 && (
                <span className="text-xs text-emerald-400 font-bold">✓ Correct</span>
              )}
            </div>
            <p className="text-sm text-white">Where is the state |+⟩ = (|0⟩ + |1⟩)/√2 located?</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "equator_phase_0", label: "Equator at relative phase 0° (+X)" },
                { id: "north_pole", label: "North pole (+Z)" },
                { id: "equator_phase_180", label: "Equator at relative phase 180° (−X)" },
                { id: "south_pole", label: "South pole (−Z)" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleAnswer("ch3", opt.id)}
                  className={`p-2 text-xs rounded-lg border text-center transition-all ${
                    userAnswers.ch3 === opt.id
                      ? opt.id === correctAnswers.ch3
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : "bg-red-500/20 border-red-500 text-red-300"
                      : "bg-black/20 border-white/10 text-gray-300 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {revealedSolutions.ch3 && (
              <p className="text-xs text-cyan-300/80 pt-1">
                Solution: |+⟩ has θ = 90° (on the equator) and relative phase φ = 0°, aligning it with the +X axis.
              </p>
            )}
            <button
              onClick={() => toggleSolution("ch3")}
              className="text-[11px] text-[var(--color-app-text-muted)] hover:underline"
            >
              {revealedSolutions.ch3 ? "Hide explanation" : "Show explanation"}
            </button>
          </div>

          {/* Challenge 4 */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase">Challenge 4: Find |−⟩</span>
              {userAnswers.ch4 === correctAnswers.ch4 && (
                <span className="text-xs text-emerald-400 font-bold">✓ Correct</span>
              )}
            </div>
            <p className="text-sm text-white">Where is the state |−⟩ = (|0⟩ − |1⟩)/√2 located?</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "equator_phase_180", label: "Equator opposite |+⟩ at 180° (−X)" },
                { id: "south_pole", label: "South pole (−Z)" },
                { id: "equator_phase_90", label: "Equator at phase 90° (+Y)" },
                { id: "north_pole", label: "North pole (+Z)" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleAnswer("ch4", opt.id)}
                  className={`p-2 text-xs rounded-lg border text-center transition-all ${
                    userAnswers.ch4 === opt.id
                      ? opt.id === correctAnswers.ch4
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : "bg-red-500/20 border-red-500 text-red-300"
                      : "bg-black/20 border-white/10 text-gray-300 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {revealedSolutions.ch4 && (
              <p className="text-xs text-cyan-300/80 pt-1">
                Solution: |−⟩ is on the equator (θ = 90°) directly opposite |+⟩ with a 180° phase difference (φ = 180°), pointing along −X.
              </p>
            )}
            <button
              onClick={() => toggleSolution("ch4")}
              className="text-[11px] text-[var(--color-app-text-muted)] hover:underline"
            >
              {revealedSolutions.ch4 ? "Hide explanation" : "Show explanation"}
            </button>
          </div>

          {/* Challenge 5 */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase">Challenge 5: Predict Probability</span>
              {userAnswers.ch5 === correctAnswers.ch5 && (
                <span className="text-xs text-emerald-400 font-bold">✓ Correct</span>
              )}
            </div>
            <p className="text-sm text-white">
              A qubit is prepared with polar angle θ = 60°. Which computational-basis measurement outcome is more likely?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAnswer("ch5", 0)}
                className={`p-2.5 text-xs rounded-lg border text-center font-mono font-bold transition-all ${
                  userAnswers.ch5 === 0
                    ? 0 === correctAnswers.ch5
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                      : "bg-red-500/20 border-red-500 text-red-300"
                    : "bg-black/20 border-white/10 text-gray-300 hover:text-white"
                }`}
              >
                Outcome 0 (P(0) = cos²(30°) = 75%)
              </button>
              <button
                onClick={() => handleAnswer("ch5", 1)}
                className={`p-2.5 text-xs rounded-lg border text-center font-mono font-bold transition-all ${
                  userAnswers.ch5 === 1
                    ? 1 === correctAnswers.ch5
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                      : "bg-red-500/20 border-red-500 text-red-300"
                    : "bg-black/20 border-white/10 text-gray-300 hover:text-white"
                }`}
              >
                Outcome 1 (P(1) = sin²(30°) = 25%)
              </button>
            </div>
            {revealedSolutions.ch5 && (
              <p className="text-xs text-cyan-300/80 pt-1">
                Solution: P(0) = cos²(60°/2) = cos²(30°) = (√3/2)² = 75%, while P(1) = 25%. Outcome 0 is three times as likely.
              </p>
            )}
            <button
              onClick={() => toggleSolution("ch5")}
              className="text-[11px] text-[var(--color-app-text-muted)] hover:underline"
            >
              {revealedSolutions.ch5 ? "Hide explanation" : "Show explanation"}
            </button>
          </div>

          {/* Challenge 6 */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase">Challenge 6: Gate Experiment</span>
              {userAnswers.ch6 === correctAnswers.ch6 && (
                <span className="text-xs text-emerald-400 font-bold">✓ Correct</span>
              )}
            </div>
            <p className="text-sm text-white">
              Start with the qubit in state |0⟩ at the North Pole. Apply a Hadamard gate (H). Where does the state move?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "plus", label: "|+⟩ on the equator (+X)" },
                { id: "one", label: "|1⟩ at South Pole (−Z)" },
                { id: "minus", label: "|−⟩ on the equator (−X)" },
                { id: "zero", label: "Remains at |0⟩" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleAnswer("ch6", opt.id)}
                  className={`p-2 text-xs rounded-lg border text-center transition-all ${
                    userAnswers.ch6 === opt.id
                      ? opt.id === correctAnswers.ch6
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : "bg-red-500/20 border-red-500 text-red-300"
                      : "bg-black/20 border-white/10 text-gray-300 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {revealedSolutions.ch6 && (
              <p className="text-xs text-cyan-300/80 pt-1">
                Solution: H|0⟩ = (|0⟩ + |1⟩)/√2 = |+⟩. The Hadamard gate rotates the state from the North Pole to the +X point on the equator.
              </p>
            )}
            <button
              onClick={() => toggleSolution("ch6")}
              className="text-[11px] text-[var(--color-app-text-muted)] hover:underline"
            >
              {revealedSolutions.ch6 ? "Hide explanation" : "Show explanation"}
            </button>
          </div>
        </div>

        {/* 8 Core Takeaways Summary */}
        <div className="p-6 rounded-2xl bg-black/30 border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white uppercase tracking-wider">
            8 Core Takeaways
          </h3>
          <ol className="list-decimal pl-5 space-y-2 text-xs text-[var(--color-app-text-muted)] leading-relaxed">
            <li>The Bloch Sphere is a geometric representation of a <strong>single-qubit pure state</strong>.</li>
            <li><strong>|0⟩ and |1⟩</strong> are the North and South poles of the sphere.</li>
            <li>Other points on the surface represent other pure single-qubit states.</li>
            <li>States on the equator have <strong>equal-magnitude |0⟩ and |1⟩ components</strong> (50/50 probabilities).</li>
            <li>The polar angle <strong>θ</strong> controls the computational-basis probability balance: P(0) = cos²(θ/2), P(1) = sin²(θ/2).</li>
            <li>The azimuthal angle <strong>φ</strong> represents the relative phase between basis states.</li>
            <li>Single-qubit gates such as X, Y, Z, and H can be visualized as transformations/rotations of the state on the sphere.</li>
            <li>The Bloch Sphere connects amplitudes, phase, probabilities, Dirac notation, and quantum-state geometry into a unified picture.</li>
          </ol>

          <div className="pt-4 border-t border-white/10 text-xs text-cyan-300/90 leading-relaxed italic">
            “You can now describe and visualize a single qubit. But what happens when we start combining these qubits into larger systems?”
          </div>
        </div>

        {/* Complete / Milestone Action */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
          <button
            onClick={() => onAskQuantiva && onAskQuantiva("Where does relative phase appear on the Bloch Sphere?")}
            className="text-xs px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors"
          >
            ✦ Ask Tutor About Relative Phase
          </button>

          <button
            onClick={() => onComplete && onComplete()}
            className="px-6 py-2.5 rounded-xl bg-[var(--color-app-primary)] hover:bg-[var(--color-app-primary)]/80 text-black font-bold text-xs transition-colors"
          >
            {isCompleted ? "Module Completed ✓" : "Mark Module Complete"}
          </button>
        </div>
      </section>
    </div>
  );
}
