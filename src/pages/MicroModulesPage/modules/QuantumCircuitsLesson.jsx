import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import MathHTMLContainer from "../../../components/MathHTMLContainer/MathHTMLContainer";
import StateProbabilityHeatmap from "../../../components/StateProbabilityHeatmap/StateProbabilityHeatmap";
import BlochSphere3D from "../../../components/BlochSphereViewer/BlochSphere3D";

// --- Mathematical Helper Functions ---
function stateToBloch(ar, ai, br, bi) {
  const magA = Math.sqrt(ar * ar + ai * ai);
  const magB = Math.sqrt(br * br + bi * bi);
  const norm = Math.sqrt(magA * magA + magB * magB) || 1;
  const nA = magA / norm;
  const nB = magB / norm;

  const theta = 2 * Math.acos(Math.max(0, Math.min(1, nA)));
  let phi = 0;
  if (nA > 1e-6 && nB > 1e-6) {
    const phaseA = Math.atan2(ai, ar);
    const cosA = Math.cos(-phaseA);
    const sinA = Math.sin(-phaseA);
    const adjBR = br * cosA - bi * sinA;
    const adjBI = br * sinA + bi * cosA;
    phi = Math.atan2(adjBI, adjBR);
    if (phi < 0) phi += 2 * Math.PI;
  } else if (nA <= 1e-6) {
    phi = 0;
  }
  return { theta, phi };
}

function applySingleGate(gateId, ar, ai, br, bi) {
  const sq2 = Math.SQRT2;
  switch (gateId) {
    case "X":
      return { ar: br, ai: bi, br: ar, bi: ai };
    case "Y":
      return { ar: bi, ai: -br, br: -ai, bi: ar };
    case "Z":
      return { ar, ai, br: -br, bi: -bi };
    case "H":
      return {
        ar: (ar + br) / sq2,
        ai: (ai + bi) / sq2,
        br: (ar - br) / sq2,
        bi: (ai - bi) / sq2,
      };
    case "S":
      return { ar, ai, br: -bi, bi: br };
    case "T":
      return {
        ar,
        ai,
        br: (br - bi) / sq2,
        bi: (br + bi) / sq2,
      };
    default:
      return { ar, ai, br, bi };
  }
}

function formatComplex(r, i) {
  const rRound = Math.abs(r) < 1e-5 ? 0 : Number(r.toFixed(3));
  const iRound = Math.abs(i) < 1e-5 ? 0 : Number(i.toFixed(3));

  if (iRound === 0) return String(rRound);
  if (rRound === 0) {
    if (iRound === 1) return "i";
    if (iRound === -1) return "-i";
    return iRound + "i";
  }
  const sign = iRound > 0 ? "+" : "-";
  const absI = Math.abs(iRound) === 1 ? "" : Math.abs(iRound);
  return rRound + " " + sign + " " + absI + "i";
}

export default function QuantumCircuitsLesson({ onComplete, isCompleted, onAskQuantiva }) {
  const navigate = useNavigate();

  // --- Section 1: Intro Circuit Stepper ---
  const [sec1Step, setSec1Step] = useState(0); // 0: |0⟩, 1: H -> |+⟩, 2: X -> |+⟩, 3: Z -> |−⟩, 4: M -> Outcome

  // --- Section 3: Order Matters Interactive State ---
  const [orderMode, setOrderMode] = useState("A"); // "A": H then X, "B": X then H

  // --- Section 4: Circuit Composer State ---
  const [composerBase, setComposerBase] = useState("0");
  const [composerGates, setComposerGates] = useState(["H", "X"]);

  // --- Section 5: Predict -> Run -> Compare State ---
  const [predIndex, setPredIndex] = useState(0);
  const [predChoice, setPredChoice] = useState(null);
  const [predRevealed, setPredRevealed] = useState(false);

  // --- Section 6: Building & Undoing State ---
  const [undoStep, setUndoStep] = useState(0); // 0: |0⟩, 1: H -> |+⟩, 2: H -> |0⟩

  // --- Section 7: Composite Transformations State ---
  const [compDemoRun, setCompDemoRun] = useState(false);

  // --- Section 8: Measurement Boundary State ---
  const [measRun, setMeasRun] = useState(false);
  const [measResult, setMeasResult] = useState(null);

  // --- Section 10: Controlled Operations State ---
  const [cnotIn, setCnotIn] = useState("10");
  const [cnotRun, setCnotRun] = useState(false);

  // --- Section 11: Two-Qubit Circuit Teaser ---
  const [twoQStep, setTwoQStep] = useState(0); // 0: |00⟩, 1: H on q₀, 2: CNOT across q₀->q₁

  // --- Section 13: Parallel Execution View ---
  const [parallelActive, setParallelActive] = useState(false);

  // --- Section 14: Circuit Optimization State ---
  const [optExample, setOptExample] = useState("XX");
  const [optApplied, setOptApplied] = useState(false);

  // --- Section 15: Challenge Lab State ---
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [userGates, setUserGates] = useState([]);
  const [challengeStatus, setChallengeStatus] = useState(null); // null, "success", "retry"

  // -------------------------------------------------------------
  // CALCULATED STATES
  // -------------------------------------------------------------

  // Section 3: Order comparison state
  const orderState = useMemo(() => {
    let s = { ar: 1, ai: 0, br: 0, bi: 0 };
    if (orderMode === "A") {
      // H then X: |0⟩ -> |+⟩ -> |+⟩
      s = applySingleGate("H", s.ar, s.ai, s.br, s.bi);
      s = applySingleGate("X", s.ar, s.ai, s.br, s.bi);
      return {
        label: "|+⟩",
        desc: "State evolved to |+⟩. Amplitudes: α = 1/√2, β = 1/√2.",
        ar: s.ar, ai: s.ai, br: s.br, bi: s.bi,
        p0: 0.5, p1: 0.5,
      };
    } else {
      // X then H: |0⟩ -> |1⟩ -> |−⟩
      s = applySingleGate("X", s.ar, s.ai, s.br, s.bi);
      s = applySingleGate("H", s.ar, s.ai, s.br, s.bi);
      return {
        label: "|−⟩",
        desc: "State evolved to |−⟩. Amplitudes: α = 1/√2, β = −1/√2 (Relative phase is flipped!).",
        ar: s.ar, ai: s.ai, br: s.br, bi: s.bi,
        p0: 0.5, p1: 0.5,
      };
    }
  }, [orderMode]);

  // Section 4: Composer State Evaluation
  const composerResult = useMemo(() => {
    let s = { ar: 1, ai: 0, br: 0, bi: 0 };
    if (composerBase === "1") s = { ar: 0, ai: 0, br: 1, bi: 0 };
    else if (composerBase === "+") s = { ar: 1 / Math.SQRT2, ai: 0, br: 1 / Math.SQRT2, bi: 0 };
    else if (composerBase === "-") s = { ar: 1 / Math.SQRT2, ai: 0, br: -1 / Math.SQRT2, bi: 0 };

    for (const g of composerGates) {
      s = applySingleGate(g, s.ar, s.ai, s.br, s.bi);
    }

    const bloch = stateToBloch(s.ar, s.ai, s.br, s.bi);
    const p0 = Math.max(0, Math.min(1, s.ar * s.ar + s.ai * s.ai));
    const p1 = Math.max(0, Math.min(1, s.br * s.br + s.bi * s.bi));

    return {
      ar: s.ar,
      ai: s.ai,
      br: s.br,
      bi: s.bi,
      theta: bloch.theta,
      phi: bloch.phi,
      p0,
      p1,
    };
  }, [composerBase, composerGates]);

  // Section 5: Prediction Tasks
  const predTasks = useMemo(() => [
    {
      circuit: "|0⟩ ── X",
      options: ["|0⟩", "|1⟩", "|+⟩", "|−⟩"],
      correct: "|1⟩",
      explanation: "The X gate swaps basis states, turning |0⟩ into |1⟩ with 100% certainty.",
    },
    {
      circuit: "|0⟩ ── H",
      options: ["|0⟩", "|1⟩", "|+⟩", "|−⟩"],
      correct: "|+⟩",
      explanation: "The Hadamard gate maps |0⟩ into an equal positive superposition: |+⟩ = (|0⟩ + |1⟩)/√2.",
    },
    {
      circuit: "|0⟩ ── H ── Z",
      options: ["|0⟩", "|1⟩", "|+⟩", "|−⟩"],
      correct: "|−⟩",
      explanation: "H puts the qubit in |+⟩, then Z flips the relative phase of the |1⟩ component, yielding |−⟩.",
    },
    {
      circuit: "|0⟩ ── X ── X",
      options: ["|0⟩", "|1⟩", "|+⟩", "|−⟩"],
      correct: "|0⟩",
      explanation: "Because X is its own inverse (X² = I), the two consecutive X gates cancel out, leaving |0⟩.",
    },
  ], []);

  // Section 10: CNOT Output Calculation
  const cnotOut = useMemo(() => {
    if (!cnotRun) return cnotIn;
    if (cnotIn === "00") return "00";
    if (cnotIn === "01") return "01";
    if (cnotIn === "10") return "11";
    if (cnotIn === "11") return "10";
    return cnotIn;
  }, [cnotIn, cnotRun]);

  // Section 15: Challenge Lab Tasks
  const challenges = useMemo(() => [
    {
      id: 1,
      title: "Challenge 1: Prepare State |1⟩",
      desc: "Starting from |0⟩, build a circuit that transforms the qubit into |1⟩.",
      target: "|1⟩",
      check: (gates) => {
        let s = { ar: 1, ai: 0, br: 0, bi: 0 };
        for (const g of gates) s = applySingleGate(g, s.ar, s.ai, s.br, s.bi);
        return s.br * s.br + s.bi * s.bi > 0.99;
      },
    },
    {
      id: 2,
      title: "Challenge 2: Create Equal Superposition |+⟩",
      desc: "Starting from |0⟩, build a circuit that puts the qubit into equal superposition |+⟩.",
      target: "|+⟩",
      check: (gates) => {
        let s = { ar: 1, ai: 0, br: 0, bi: 0 };
        for (const g of gates) s = applySingleGate(g, s.ar, s.ai, s.br, s.bi);
        return Math.abs(s.ar - 1 / Math.SQRT2) < 0.05 && Math.abs(s.br - 1 / Math.SQRT2) < 0.05;
      },
    },
    {
      id: 3,
      title: "Challenge 3: Transform and Undo (Reversibility)",
      desc: "Starting from |0⟩, create a transformation and then undo it using H followed by H.",
      target: "H → H = |0⟩",
      check: (gates) => {
        return gates.length === 2 && gates[0] === "H" && gates[1] === "H";
      },
    },
    {
      id: 4,
      title: "Challenge 4: Synthesize Pauli-X using 3 Gates",
      desc: "Starting from |0⟩, construct an X-equivalent transformation using exactly three gates (H, Z, H).",
      target: "H → Z → H = |1⟩",
      check: (gates) => {
        if (gates.length !== 3) return false;
        return gates[0] === "H" && gates[1] === "Z" && gates[2] === "H";
      },
    },
    {
      id: 5,
      title: "Challenge 5: Controlled Multi-Qubit Flip",
      desc: "Build a two-qubit circuit where the first qubit (q₀) controls whether the second qubit (q₁) flips.",
      target: "CNOT (CX)",
      check: (gates) => {
        return gates.includes("CX");
      },
    },
  ], []);

  // Handlers for Challenge Lab
  const handleAddChallengeGate = (g) => {
    setUserGates((prev) => [...prev, g]);
    setChallengeStatus(null);
  };

  const handleClearChallenge = () => {
    setUserGates([]);
    setChallengeStatus(null);
  };

  const handleTestChallenge = () => {
    const current = challenges[challengeIdx];
    if (current.check(userGates)) {
      setChallengeStatus("success");
    } else {
      setChallengeStatus("retry");
    }
  };

  // Simulator Handoff
  const handleOpenSimulator = (mode = "hzh") => {
    if (mode === "cnot") {
      navigate("/circuit-simulator", {
        state: {
          initialNumQubits: 2,
          initialCircuit: {
            0: [
              { type: "H", id: "gate-h-0", duration: 1, name: "Hadamard", wire: 0 },
              { type: "CX", id: "gate-cx-0", duration: 1, name: "CNOT", wire: 0, target: 1 },
              { type: "M", id: "gate-m-0", duration: 1, name: "Measure", wire: 0 },
            ],
            1: [
              { type: "I", id: "gate-i-1", duration: 1, name: "Spacer", wire: 1 },
              { type: "I", id: "gate-i-2", duration: 1, name: "Spacer", wire: 1 },
              { type: "M", id: "gate-m-1", duration: 1, name: "Measure", wire: 1 },
            ],
          },
          origin: "quantum-circuits",
          message: "Preloaded Two-Qubit Circuit: H on q₀ followed by CNOT across q₀ → q₁ and Measurement.",
        },
      });
    } else {
      navigate("/circuit-simulator", {
        state: {
          initialNumQubits: 1,
          initialCircuit: {
            0: [
              { type: "H", id: "gate-h-1", duration: 1, name: "Hadamard", wire: 0 },
              { type: "Z", id: "gate-z-1", duration: 1, name: "Pauli-Z", wire: 0 },
              { type: "H", id: "gate-h-2", duration: 1, name: "Hadamard", wire: 0 },
              { type: "M", id: "gate-m-1", duration: 1, name: "Measure", wire: 0 },
            ],
          },
          origin: "quantum-circuits",
          message: "Preloaded Single-Qubit Circuit: |0⟩ → H → Z → H → Measure (Equivalent to Pauli-X!).",
        },
      });
    }
  };

  return (
    <div className="space-y-16 py-4">
      {/* ========================================================================= */}
      {/* SECTION 1 — FROM GATES TO CIRCUITS                                        */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Section 1 · Foundation
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Assembling Operations</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          From Gates to Circuits: How Do Operations Work Together?
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            In Module 7, you discovered how single quantum gates transform states: X swaps basis states,
            Z rotates relative phase, and H bridges computational basis states into superpositions.
          </p>

          <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 text-sm font-semibold">
            💡 "A single gate changes a quantum state. How can several gates work together to perform a computation?"
          </div>

          <p>
            The answer is a <strong>quantum circuit</strong>: a structured sequence of quantum operations applied to quantum states,
            traveling from left to right along qubit wires, and concluding with measurement.
          </p>
        </div>

        {/* Step-by-Step Circuit Flow */}
        <div className="mt-8 p-6 rounded-xl bg-black/40 border border-white/10 space-y-6">
          <div className="text-xs font-mono text-[var(--color-app-text-muted)] uppercase tracking-wider text-center">
            Interactive Circuit Walkthrough: |0⟩ ── H ── X ── Z ── M
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap font-mono text-xs sm:text-sm">
            <div className={`px-3 py-2 rounded-lg border ${sec1Step === 0 ? "bg-blue-600 text-white font-bold border-blue-400" : "bg-black/30 border-white/10 text-[var(--color-app-text-muted)]"}`}>
              |0⟩
            </div>
            <span>──</span>
            <div className={`px-3 py-2 rounded-lg border ${sec1Step === 1 ? "bg-blue-600 text-white font-bold border-blue-400" : "bg-black/30 border-white/10 text-[var(--color-app-text-muted)]"}`}>
              [ H ]
            </div>
            <span>──</span>
            <div className={`px-3 py-2 rounded-lg border ${sec1Step === 2 ? "bg-red-600 text-white font-bold border-red-400" : "bg-black/30 border-white/10 text-[var(--color-app-text-muted)]"}`}>
              [ X ]
            </div>
            <span>──</span>
            <div className={`px-3 py-2 rounded-lg border ${sec1Step === 3 ? "bg-purple-600 text-white font-bold border-purple-400" : "bg-black/30 border-white/10 text-[var(--color-app-text-muted)]"}`}>
              [ Z ]
            </div>
            <span>──</span>
            <div className={`px-3 py-2 rounded-lg border ${sec1Step === 4 ? "bg-emerald-600 text-white font-bold border-emerald-400" : "bg-black/30 border-white/10 text-[var(--color-app-text-muted)]"}`}>
              [ M ]
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/50 border border-white/5 text-center font-mono text-xs text-[var(--color-app-text-main)]">
            {sec1Step === 0 && "Step 0: Qubit begins initialized in the standard computational basis state |0⟩."}
            {sec1Step === 1 && "Step 1: Hadamard gate creates an equal superposition: |+⟩ = (|0⟩ + |1⟩)/√2."}
            {sec1Step === 2 && "Step 2: Pauli-X swaps basis states; on |+⟩, it preserves the superposition (|0⟩+|1⟩)/√2 = |+⟩."}
            {sec1Step === 3 && "Step 3: Pauli-Z flips the phase of |1⟩, transforming |+⟩ into |−⟩ = (|0⟩−|1⟩)/√2."}
            {sec1Step === 4 && "Step 4: Measurement projects the state, yielding outcome 0 (50%) or outcome 1 (50%)."}
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setSec1Step((prev) => (prev + 1) % 5)}
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs shadow-lg transition-all"
            >
              {sec1Step < 4 ? "Step Forward in Circuit →" : "Restart Circuit Walkthrough"}
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2 — READING A QUANTUM CIRCUIT                                     */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Section 2 · Notation
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Circuit Anatomy</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Reading a Quantum Circuit: Wires, Gates, and Time
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            Quantum circuits use a visual musical-score notation. Understanding how to read them requires only four simple conventions:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2">
              <div className="text-blue-300 font-bold uppercase">1. Horizontal Wires</div>
              <p className="text-[var(--color-app-text-muted)]">
                Each horizontal line represents a single qubit wire traveling forward in time from left to right.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2">
              <div className="text-emerald-300 font-bold uppercase">2. Initial State</div>
              <p className="text-[var(--color-app-text-muted)]">
                The left edge indicates state initialization, typically default computational state |0⟩.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2">
              <div className="text-purple-300 font-bold uppercase">3. Gate Blocks</div>
              <p className="text-[var(--color-app-text-muted)]">
                Boxes placed directly on wires denote unitary transformations applied to that qubit at that moment.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2">
              <div className="text-amber-300 font-bold uppercase">4. Measurement Meter</div>
              <p className="text-[var(--color-app-text-muted)]">
                The meter box symbol [ M ] converts quantum amplitudes into classical bit readouts.
              </p>
            </div>
          </div>

          <p>
            When a circuit contains multiple qubits, each wire is numbered as q₀, q₁, etc.:
          </p>
        </div>

        {/* Multi-wire visual diagram */}
        <div className="mt-6 p-6 rounded-xl bg-black/40 border border-blue-500/30 font-mono text-sm max-w-lg mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-14 text-xs text-[var(--color-app-text-muted)]">Wire q₀:</span>
            <span className="text-blue-300">|0⟩</span>
            <div className="flex-1 h-0.5 bg-white/20 relative flex items-center justify-center">
              <span className="px-2.5 py-1 rounded bg-blue-600 text-white font-bold text-xs shadow">H</span>
            </div>
            <span className="px-2 py-1 rounded bg-zinc-700 text-white text-xs">[ M ]</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-14 text-xs text-[var(--color-app-text-muted)]">Wire q₁:</span>
            <span className="text-purple-300">|0⟩</span>
            <div className="flex-1 h-0.5 bg-white/20 relative flex items-center justify-center">
              {/* Wire continues without gate */}
            </div>
            <span className="px-2 py-1 rounded bg-zinc-700 text-white text-xs">[ M ]</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3 — CIRCUIT TIME: ORDER MATTERS                                   */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Section 3 · Core Principle
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Non-Commutativity</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Circuit Time: Gate Order Matters
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            In arithmetic, multiplying numbers is commutative: 2 × 3 = 3 × 2.
            In quantum circuits, <strong>gate order matters fundamentally</strong> because quantum operations generally do not commute!
          </p>

          <p>
            Compare what happens when we swap the order of the Hadamard (H) and Pauli-X gates:
          </p>
        </div>

        {/* Order Comparison Runner */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl bg-black/30 border border-amber-500/30">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOrderMode("A")}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                  orderMode === "A" ? "bg-amber-500 text-black shadow-lg" : "bg-white/5 text-[var(--color-app-text-muted)]"
                }`}
              >
                Circuit A: |0⟩ ── H ── X
              </button>
              <button
                onClick={() => setOrderMode("B")}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                  orderMode === "B" ? "bg-amber-500 text-black shadow-lg" : "bg-white/5 text-[var(--color-app-text-muted)]"
                }`}
              >
                Circuit B: |0⟩ ── X ── H
              </button>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-2 font-mono text-xs">
              <div className="text-[var(--color-app-text-muted)]">Active Circuit: <span className="text-amber-300 font-bold">Circuit {orderMode}</span></div>
              <div className="text-sm font-bold text-white">Resulting State: {orderState.label}</div>
              <p className="text-[var(--color-app-text-muted)] leading-relaxed">{orderState.desc}</p>
              <div className="pt-2 border-t border-white/10 flex gap-4 text-[11px]">
                <span>P(0): {(orderState.p0 * 100).toFixed(1)}%</span>
                <span>P(1): {(orderState.p1 * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex flex-col justify-center space-y-4 font-mono text-xs">
            <div className="text-amber-300 font-bold uppercase text-[11px]">Mathematical Formalism:</div>
            <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-center">
              <MathHTMLContainer html="$$XH|0\rangle = X|+\rangle = |+\rangle$$" />
            </div>
            <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-center">
              <MathHTMLContainer html="$$HX|0\rangle = H|1\rangle = |-\rangle$$" />
            </div>
            <p className="text-[11px] text-[var(--color-app-text-muted)] italic">
              Notice that XH ≠ HX! The algebraic order of written operators is evaluated right-to-left,
              matching the left-to-right flow along circuit wires.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4 — CIRCUIT COMPOSER                                              */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-cyan-500/40 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Section 4 · Interactive Composer
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Hands-On Wire Assembly</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-2">
          Circuit Composer: Build, Run, Observe
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] mb-6">
          Build a single-qubit quantum circuit by appending gates from Quantiva's core gate set.
          Observe how the wire schedules operations and transforms amplitudes in real time.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Wire & Palette */}
          <div className="lg:col-span-7 space-y-5">
            {/* Input State Picker */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[var(--color-app-text-muted)]">Initial Wire State:</span>
              {["0", "1", "+", "-"].map((p) => (
                <button
                  key={p}
                  onClick={() => setComposerBase(p)}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                    composerBase === p ? "bg-cyan-600 text-white shadow" : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
                  }`}
                >
                  |{p}⟩
                </button>
              ))}
              <button
                onClick={() => setComposerGates([])}
                className="ml-auto px-3 py-1 rounded-md text-xs font-bold bg-white/5 hover:bg-white/10 text-[var(--color-app-text-muted)]"
              >
                Clear Wire
              </button>
            </div>

            {/* Visual Circuit Wire */}
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 overflow-x-auto">
              <div className="text-[10px] font-mono uppercase text-[var(--color-app-text-muted)] mb-3">
                Circuit Wire Representation (q₀)
              </div>
              <div className="flex items-center gap-2 min-w-[320px] font-mono text-xs">
                <span className="text-cyan-300 font-bold">|{composerBase}⟩</span>
                <span className="text-white/30">──</span>
                {composerGates.map((g, idx) => (
                  <React.Fragment key={idx}>
                    <div className="relative group">
                      <span className="px-3 py-1.5 rounded-lg bg-blue-600/30 border border-blue-400/50 text-blue-200 font-bold shadow">
                        {g}
                      </span>
                      <button
                        onClick={() => setComposerGates((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-red-600 text-white text-[9px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove gate"
                      >
                        ×
                      </button>
                    </div>
                    <span className="text-white/30">──</span>
                  </React.Fragment>
                ))}
                <span className="px-2 py-1 rounded bg-zinc-700 text-white text-[11px]">[ M ]</span>
              </div>
            </div>

            {/* Gate Palette */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-app-text-muted)] mb-2">
                Append Gate to Wire
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { id: "X", color: "bg-red-500/20 text-red-400 border-red-500 hover:bg-red-500/30" },
                  { id: "Y", color: "bg-green-500/20 text-green-400 border-green-500 hover:bg-green-500/30" },
                  { id: "Z", color: "bg-purple-500/20 text-purple-400 border-purple-500 hover:bg-purple-500/30" },
                  { id: "H", color: "bg-blue-500/20 text-blue-400 border-blue-500 hover:bg-blue-500/30" },
                  { id: "S", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500 hover:bg-yellow-500/30" },
                  { id: "T", color: "bg-orange-500/20 text-orange-400 border-orange-500 hover:bg-orange-500/30" },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setComposerGates((prev) => [...prev, g.id])}
                    className={`py-2.5 rounded-xl border font-mono font-extrabold text-sm shadow transition-all active:scale-95 ${g.color}`}
                  >
                    + {g.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Probability Heatmap */}
            <div>
              <StateProbabilityHeatmap
                probabilities={{
                  "0": composerResult.p0,
                  "1": composerResult.p1,
                }}
              />
            </div>
          </div>

          {/* Right: 3D Bloch & State Readout */}
          <div className="lg:col-span-5 space-y-4">
            <div className="h-64 rounded-xl bg-black/50 border border-white/10 overflow-hidden relative">
              <div className="absolute top-2 left-3 text-[10px] font-mono text-[var(--color-app-text-muted)] uppercase z-10">
                Live Bloch Vector
              </div>
              <Canvas camera={{ position: [2.5, 2, 3], fov: 45 }}>
                <ambientLight intensity={0.8} />
                <pointLight position={[5, 5, 5]} intensity={0.8} />
                <BlochSphere3D theta={composerResult.theta} phi={composerResult.phi} />
                <OrbitControls enablePan={false} enableZoom={false} />
              </Canvas>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2 font-mono text-xs">
              <div className="text-[var(--color-app-text-muted)] uppercase text-[10px]">Output State Vector</div>
              <div className="text-sm font-bold text-cyan-300">
                |ψ⟩ = ({formatComplex(composerResult.ar, composerResult.ai)})|0⟩ + ({formatComplex(composerResult.br, composerResult.bi)})|1⟩
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5 — CIRCUIT → STATE (PREDICT → RUN → COMPARE)                     */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Section 5 · Active Reasoning
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Predict → Run → Compare</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Circuit → State: Predicting Outcomes
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            Before executing a circuit, quantum engineers predict its outcome state by tracking how each gate transforms amplitudes.
            Test your intuition on this sequence:
          </p>
        </div>

        {/* Prediction Card */}
        <div className="mt-6 p-6 rounded-xl bg-black/30 border border-emerald-500/30 space-y-5 max-w-xl mx-auto">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--color-app-text-muted)]">
            <span>Prediction Puzzle {predIndex + 1} of {predTasks.length}</span>
            <span className="text-emerald-400 font-bold">{predTasks[predIndex].circuit}</span>
          </div>

          <div className="p-4 rounded-xl bg-black/50 border border-white/10 text-center font-mono text-base font-bold text-white">
            What quantum state results from: <br />
            <span className="text-cyan-300">{predTasks[predIndex].circuit}</span>?
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {predTasks[predIndex].options.map((opt) => (
              <button
                key={opt}
                onClick={() => { setPredChoice(opt); setPredRevealed(false); }}
                className={`py-2 rounded-lg font-mono font-bold text-xs transition-all ${
                  predChoice === opt ? "bg-emerald-600 text-white shadow" : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setPredRevealed(true)}
              disabled={!predChoice}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-mono font-bold text-xs shadow-lg transition-all"
            >
              Run Circuit & Verify
            </button>
            {predRevealed && predIndex < predTasks.length - 1 && (
              <button
                onClick={() => {
                  setPredIndex((p) => p + 1);
                  setPredChoice(null);
                  setPredRevealed(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold"
              >
                Next Puzzle →
              </button>
            )}
          </div>

          {predRevealed && (
            <div className={`p-4 rounded-xl border text-xs font-mono ${
              predChoice === predTasks[predIndex].correct
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                : "bg-amber-950/40 border-amber-500/40 text-amber-200"
            }`}>
              <div className="font-bold mb-1">
                {predChoice === predTasks[predIndex].correct ? "✓ Correct Prediction!" : "💡 State Analysis:"}
              </div>
              <p className="leading-relaxed">{predTasks[predIndex].explanation}</p>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6 — BUILDING AND UNDOING TRANSFORMATIONS                          */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
            Section 6 · Reversibility
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Inverse Sequences</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Building and Undoing Transformations
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            Because quantum gate operations are strictly reversible, any transformation a circuit creates can also be reversed.
            The Hadamard gate offers the clearest demonstration:
          </p>

          <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-500/30 text-center font-mono text-xs sm:text-sm">
            <MathHTMLContainer html="$$|0\rangle \xrightarrow{H} |+\rangle \xrightarrow{H} |0\rangle$$" />
          </div>

          <p>
            The first H creates a superposition; the second H completely undoes it, returning the qubit to |0⟩.
            In circuit design, this identity (H² = I) allows algorithms to transition in and out of computational bases at will.
          </p>
        </div>

        {/* Interactive Undoing Stepper */}
        <div className="mt-6 p-6 rounded-xl bg-black/30 border border-teal-500/30 space-y-5 max-w-lg mx-auto text-center">
          <div className="flex items-center justify-center gap-4 font-mono text-xs">
            <div className={`p-3 rounded-lg border ${undoStep === 0 ? "bg-teal-600 text-white font-bold" : "bg-black/40 border-white/10 text-[var(--color-app-text-muted)]"}`}>
              <div>Initial</div>
              <div>|0⟩</div>
            </div>
            <span>──[ H ]──►</span>
            <div className={`p-3 rounded-lg border ${undoStep === 1 ? "bg-teal-600 text-white font-bold" : "bg-black/40 border-white/10 text-[var(--color-app-text-muted)]"}`}>
              <div>Superposition</div>
              <div>|+⟩</div>
            </div>
            <span>──[ H ]──►</span>
            <div className={`p-3 rounded-lg border ${undoStep === 2 ? "bg-teal-600 text-white font-bold" : "bg-black/40 border-white/10 text-[var(--color-app-text-muted)]"}`}>
              <div>Undone (Identity)</div>
              <div>|0⟩</div>
            </div>
          </div>

          <button
            onClick={() => setUndoStep((prev) => (prev + 1) % 3)}
            className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-mono text-xs font-bold shadow transition-all"
          >
            {undoStep === 0 ? "Apply 1st H (Transform)" : undoStep === 1 ? "Apply 2nd H (Undo)" : "Reset Cycle"}
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7 — CIRCUITS AS TRANSFORMATIONS                                   */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Section 7 · Synthesis
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Composite Operations</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Circuits as Transformations: Combining Sequences
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            An essential insight in quantum computing is <strong>viewing an entire sequence of gates as one combined transformation</strong>.
          </p>

          <p>
            Consider the 3-gate sequence: <strong>|0⟩ ── H ── Z ── H</strong>.
          </p>

          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-center font-mono text-xs sm:text-sm">
            <MathHTMLContainer html="$$|0\rangle \xrightarrow{H} |+\rangle \xrightarrow{Z} |-\rangle \xrightarrow{H} |1\rangle$$" />
          </div>

          <p>
            The entire 3-gate circuit produces the exact same physical state change as a single Pauli-X gate: <strong>HZH = X</strong>.
            While individual gate operations correspond to unitary transformations, a whole circuit acts as a combined composite unitary operator!
          </p>
        </div>

        {/* Demo Button */}
        <div className="mt-6 p-5 rounded-xl bg-black/30 border border-indigo-500/30 flex items-center justify-between flex-wrap gap-4 max-w-lg mx-auto">
          <div className="font-mono text-xs">
            <span className="text-[var(--color-app-text-muted)]">Circuit: </span>
            <span className="text-indigo-300 font-bold">|0⟩ ── H ── Z ── H</span>
          </div>
          <button
            onClick={() => setCompDemoRun(!compDemoRun)}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold shadow"
          >
            {compDemoRun ? "Reset" : "Execute H-Z-H Sequence"}
          </button>
          {compDemoRun && (
            <div className="w-full text-center font-mono text-xs text-emerald-300 font-bold pt-2 border-t border-white/5">
              Output: |1⟩ (P(1) = 100%). Matches Pauli-X identically!
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 8 — MEASUREMENT AS A CIRCUIT OPERATION BOUNDARY                   */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-zinc-600/30 text-zinc-300 border border-zinc-500/30">
            Section 8 · Operational Boundary
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Quantum to Classical Interface</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Measurement as a Circuit Operation Boundary
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            In a quantum circuit, gates and measurements play fundamentally different roles:
          </p>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-500/40 text-zinc-200 text-xs sm:text-sm font-medium">
            ✨ <strong>"Measurement produces a classical outcome from a quantum state and marks an important operational boundary in a circuit."</strong>
          </div>

          <p>
            While unitary gates smoothly steer state vectors without extracting data, measurement extracts observable classical bits.
            Once a qubit is measured in the computational basis, subsequent operations act on the resulting post-measurement state.
            (You will explore the deep quantum physics of collapse and state updates in Module 10).
          </p>
        </div>

        <div className="mt-6 p-6 rounded-xl bg-black/40 border border-zinc-600/40 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-lg mx-auto">
          <div className="font-mono text-xs space-y-1">
            <div className="text-zinc-400">Circuit: |0⟩ ── H ── [ M ]</div>
            <div className="text-[var(--color-app-text-muted)] text-[11px]">Boundary: Quantum Superposition → Classical Bit</div>
          </div>
          <button
            onClick={() => {
              setMeasRun(true);
              setMeasResult(Math.random() < 0.5 ? 0 : 1);
            }}
            className="px-5 py-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-mono font-bold text-xs shadow transition-all"
          >
            {measRun ? "Sample Again" : "Trigger Measurement"}
          </button>
          {measRun && (
            <div className="font-mono text-sm font-bold text-cyan-300">
              Outcome: {measResult}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 9 — MULTIPLE QUBITS                                               */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/30">
            Section 9 · Multi-Wire Systems
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Scaling to N Wires</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Multiple Qubits: Expanding the Register
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            So far we have worked mostly with one wire. What changes when a circuit contains multiple qubits?
          </p>
          <p>
            Each wire represents a distinct physical qubit. A circuit with 2 qubits has 4 computational basis states (|00⟩, |01⟩, |10⟩, |11⟩),
            written in standard <strong>wire order |q₀ q₁⟩</strong>. With N qubits, the state space scales exponentially to 2ᴺ dimensions!
          </p>
        </div>

        <div className="mt-6 p-6 rounded-xl bg-black/40 border border-pink-500/30 font-mono text-sm max-w-md mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-16 text-xs text-[var(--color-app-text-muted)]">Wire q₀:</span>
            <span className="text-blue-300">|0⟩</span>
            <div className="flex-1 h-0.5 bg-white/20 relative flex items-center justify-center">
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-xs font-bold">H</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-16 text-xs text-[var(--color-app-text-muted)]">Wire q₁:</span>
            <span className="text-purple-300">|0⟩</span>
            <div className="flex-1 h-0.5 bg-white/20"></div>
          </div>
          <div className="text-[11px] text-center text-[var(--color-app-text-muted)] pt-2 border-t border-white/5">
            Gates can act independently on individual wires, or span across multiple wires to couple them together!
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 10 — CONTROLLED OPERATIONS                                        */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/30">
            Section 10 · Conditional Logic
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Controlled-NOT</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Controlled Operations: The CNOT Gate in Circuits
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            The canonical multi-qubit gate is the <strong>Controlled-NOT (CNOT)</strong>.
            In circuit diagrams, a solid dot (●) marks the control qubit, while an encircled cross (⊕) marks the target:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[var(--color-app-text-muted)]">
                  <th className="p-2">Input |q₀ q₁⟩</th>
                  <th className="p-2">Control (q₀)</th>
                  <th className="p-2">Target (q₁)</th>
                  <th className="p-2 text-pink-400">Output |q₀ q₁⟩</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr><td className="p-2 font-bold">|00⟩</td><td className="p-2">0</td><td className="p-2">0</td><td className="p-2 text-pink-300 font-bold">|00⟩</td></tr>
                <tr><td className="p-2 font-bold">|01⟩</td><td className="p-2">0</td><td className="p-2">1</td><td className="p-2 text-pink-300 font-bold">|01⟩</td></tr>
                <tr className="bg-pink-950/20"><td className="p-2 font-bold">|10⟩</td><td className="p-2">1</td><td className="p-2">0</td><td className="p-2 text-pink-300 font-bold">|11⟩ (Flipped!)</td></tr>
                <tr className="bg-pink-950/20"><td className="p-2 font-bold">|11⟩</td><td className="p-2">1</td><td className="p-2">1</td><td className="p-2 text-pink-300 font-bold">|10⟩ (Flipped!)</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Interactive CNOT Basis Stepper */}
        <div className="mt-6 p-6 rounded-xl bg-black/30 border border-pink-500/30 space-y-5 max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-app-text-muted)] font-mono">Choose Input Basis State:</span>
            <div className="flex gap-2">
              {["00", "01", "10", "11"].map((s) => (
                <button
                  key={s}
                  onClick={() => { setCnotIn(s); setCnotRun(false); }}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    cnotIn === s ? "bg-pink-600 text-white" : "bg-white/5 text-[var(--color-app-text-muted)]"
                  }`}
                >
                  |{s}⟩
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between font-mono text-sm">
            <div>Input: <span className="text-white font-bold">|{cnotIn}⟩</span></div>
            <button
              onClick={() => setCnotRun(!cnotRun)}
              className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold"
            >
              {cnotRun ? "Reset" : "Apply CNOT"}
            </button>
            <div>Output: <span className="text-pink-300 font-bold">|{cnotOut}⟩</span></div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 11 — BUILD YOUR FIRST TWO-QUBIT CIRCUIT                           */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Section 11 · Multi-Wire Teaser
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Circuit Composition Teaser</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Build Your First Two-Qubit Circuit
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            Now we combine single-qubit gates and two-qubit operations in the same circuit:
          </p>

          <p>
            We place a Hadamard gate on wire q₀, followed by a CNOT where q₀ acts as control and q₁ acts as target:
          </p>
        </div>

        {/* Multi-Wire Teaser Stepper */}
        <div className="mt-6 p-6 rounded-xl bg-black/40 border border-blue-500/30 space-y-6 max-w-lg mx-auto">
          <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-sm space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-16 text-xs text-[var(--color-app-text-muted)]">Wire q₀:</span>
              <span className="text-blue-300">|0⟩</span>
              <span className="text-[var(--color-app-text-muted)]">──</span>
              <span className={`px-2 py-0.5 rounded border ${twoQStep >= 1 ? "bg-blue-600 text-white font-bold border-blue-400" : "bg-white/5 border-white/10"}`}>
                H
              </span>
              <span className="text-[var(--color-app-text-muted)]">──</span>
              <span className={`h-3 w-3 rounded-full ${twoQStep >= 2 ? "bg-pink-500 ring-2 ring-pink-400" : "bg-white/20"}`}></span>
              <span className="text-[var(--color-app-text-muted)]">──────►</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-16 text-xs text-[var(--color-app-text-muted)]">Wire q₁:</span>
              <span className="text-purple-300">|0⟩</span>
              <span className="text-[var(--color-app-text-muted)]">─────────────</span>
              <span className={`px-2 py-0.5 rounded border ${twoQStep >= 2 ? "bg-pink-600 text-white font-bold border-pink-400" : "bg-white/5 border-white/10"}`}>
                ⊕
              </span>
              <span className="text-[var(--color-app-text-muted)]">──────►</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-center text-xs font-mono text-[var(--color-app-text-main)]">
            {twoQStep === 0 && "Step 0: Both qubits start initialized to |00⟩."}
            {twoQStep === 1 && "Step 1: H on q₀ puts wire 0 into superposition, while wire 1 remains |0⟩."}
            {twoQStep === 2 && "Step 2: CNOT couples the two wires, coordinating their joint behavior."}
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setTwoQStep((prev) => (prev + 1) % 3)}
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold shadow"
            >
              {twoQStep === 0 ? "Step 1: Apply H to q₀" : twoQStep === 1 ? "Step 2: Apply CNOT across q₀ → q₁" : "Reset Circuit"}
            </button>
          </div>

          <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-500/20 text-blue-200 text-xs text-center leading-relaxed">
            💡 <em>"With multiple qubits, the state of the system can show behavior that cannot always be understood by looking at each wire independently. We'll explore what that means later in the curriculum."</em>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 12 — CIRCUIT DEPTH                                                */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Section 12 · Complexity Metric
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Sequential Layers</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Circuit Depth: The Clock of Quantum Execution
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            In quantum computing, performance is measured not just by how many gates a circuit contains, but by its <strong>circuit depth</strong>:
          </p>

          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 text-xs sm:text-sm font-semibold">
            ⏱ <strong>Circuit depth = the number of sequential layers of dependent operations.</strong>
          </div>

          <p>
            Real quantum hardware qubits can only retain coherence for a limited time before quantum noise causes errors.
            A circuit with shorter depth finishes faster and executes with significantly higher fidelity!
          </p>
        </div>

        {/* Visual Layer Diagram */}
        <div className="mt-6 p-6 rounded-xl bg-black/40 border border-purple-500/30 font-mono text-xs max-w-lg mx-auto space-y-4">
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-[var(--color-app-text-muted)] font-bold uppercase pb-2 border-b border-white/10">
            <div>Layer 1 (t₁)</div>
            <div>Layer 2 (t₂)</div>
            <div>Layer 3 (t₃)</div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center items-center py-2">
            <div className="p-2 rounded bg-blue-500/20 border border-blue-500/40 text-blue-300 font-bold">H</div>
            <div className="p-2 rounded bg-red-500/20 border border-red-500/40 text-red-300 font-bold">X</div>
            <div className="p-2 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold">Z</div>
          </div>
          <div className="text-center text-[11px] text-purple-300 pt-2 border-t border-white/5">
            Total Gates: 3 | Circuit Depth: 3 Sequential Layers
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 13 — PARALLEL OPERATIONS                                          */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
            Section 13 · Concurrency
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Parallel Layers</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Parallel Operations: Number of Gates ≠ Circuit Depth
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            When gates act on different, independent qubit wires simultaneously, they can be executed in the <strong>same temporal layer</strong>.
          </p>

          <div className="p-4 rounded-xl bg-yellow-950/30 border border-yellow-500/30 text-yellow-200 text-xs sm:text-sm font-semibold text-center">
            🚀 <strong>Key Takeaway: Number of gates ≠ circuit depth!</strong>
          </div>

          <p>
            In the 2-qubit circuit below, 4 total gates are executed across only 2 time layers:
          </p>
        </div>

        {/* Parallel Layer Visualizer */}
        <div className="mt-6 p-6 rounded-xl bg-black/40 border border-yellow-500/30 max-w-lg mx-auto space-y-4 font-mono text-xs">
          <div className="grid grid-cols-2 gap-4 text-center text-[11px] text-[var(--color-app-text-muted)] uppercase font-bold pb-2 border-b border-white/10">
            <div>Layer 1 (Simultaneous)</div>
            <div>Layer 2 (Simultaneous)</div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-14 text-[var(--color-app-text-muted)]">Wire q₀:</span>
              <div className="flex-1 grid grid-cols-2 gap-4 text-center">
                <span className="p-2 rounded bg-blue-500/20 border border-blue-400/40 text-blue-300 font-bold">H</span>
                <span className="p-2 rounded bg-red-500/20 border border-red-400/40 text-red-300 font-bold">X</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-14 text-[var(--color-app-text-muted)]">Wire q₁:</span>
              <div className="flex-1 grid grid-cols-2 gap-4 text-center">
                <span className="p-2 rounded bg-red-500/20 border border-red-400/40 text-red-300 font-bold">X</span>
                <span className="p-2 rounded bg-blue-500/20 border border-blue-400/40 text-blue-300 font-bold">H</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-black/50 border border-white/5 text-center text-[11px] text-yellow-300">
            Total Gates: 4 | Circuit Depth: 2 Layers (H on q₀ runs in parallel with X on q₁)
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 14 — CIRCUIT OPTIMIZATION                                         */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Section 14 · Compilation
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Gate Cancellation</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Circuit Optimization: Canceling Redundant Gates
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            Because self-inverse gates satisfy G² = I, adjacent identical gates cancel out.
            Quantum compilers analyze circuit graphs and simplify them into shorter, cleaner circuits:
          </p>

          <div className="grid grid-cols-3 gap-3 font-mono text-center text-xs">
            <div className="p-3 rounded-lg bg-black/30 border border-white/5">X ── X = I</div>
            <div className="p-3 rounded-lg bg-black/30 border border-white/5">H ── H = I</div>
            <div className="p-3 rounded-lg bg-black/30 border border-white/5">Z ── Z = I</div>
          </div>
        </div>

        {/* Interactive Optimization Demo */}
        <div className="mt-6 p-6 rounded-xl bg-black/30 border border-emerald-500/30 max-w-lg mx-auto space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-app-text-muted)]">Inspect Identity:</span>
            <div className="flex gap-2">
              {["XX", "HH", "ZZ"].map((ex) => (
                <button
                  key={ex}
                  onClick={() => { setOptExample(ex); setOptApplied(false); }}
                  className={`px-3 py-1 rounded-md font-bold ${optExample === ex ? "bg-emerald-600 text-white" : "bg-white/5 text-[var(--color-app-text-muted)]"}`}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center gap-4 text-sm">
            <span>|0⟩</span>
            <span>──</span>
            <span className={`px-3 py-1.5 rounded transition-all ${optApplied ? "line-through opacity-30 bg-red-900/30 text-red-400" : "bg-blue-600/30 text-blue-300 font-bold border border-blue-400/30"}`}>
              {optExample[0]}
            </span>
            <span>──</span>
            <span className={`px-3 py-1.5 rounded transition-all ${optApplied ? "line-through opacity-30 bg-red-900/30 text-red-400" : "bg-blue-600/30 text-blue-300 font-bold border border-blue-400/30"}`}>
              {optExample[1]}
            </span>
            <span>──</span>
            <span>{optApplied ? "|0⟩ (Identity Bypassed!)" : "|0⟩"}</span>
          </div>

          <div className="flex justify-center">
            <button
              onClick={() => setOptApplied(!optApplied)}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              {optApplied ? "Restore Redundant Gates" : "Optimize & Cancel Gates"}
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 15 — CIRCUIT CHALLENGE LAB                                        */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-cyan-500/40 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Section 15 · Challenge Lab
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Hands-On Synthesis</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-2">
          Circuit Challenge Lab
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] mb-6">
          Put your knowledge into practice! Build quantum circuits that accomplish each challenge goal.
        </p>

        <div className="p-6 rounded-xl bg-black/40 border border-white/10 space-y-6 max-w-2xl mx-auto">
          {/* Challenge Selector */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-white/10">
            <div className="text-xs font-mono font-bold text-cyan-300">
              {challenges[challengeIdx].title}
            </div>
            <div className="flex gap-1.5">
              {challenges.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setChallengeIdx(i);
                    setUserGates([]);
                    setChallengeStatus(null);
                  }}
                  className={`h-6 w-6 rounded-md font-mono text-xs font-bold ${
                    challengeIdx === i ? "bg-cyan-600 text-white" : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
                  }`}
                >
                  {c.id}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] font-mono leading-relaxed">
            {challenges[challengeIdx].desc}
          </p>

          {/* User Circuit Assembly Wire */}
          <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs overflow-x-auto">
            <div className="text-[10px] uppercase text-[var(--color-app-text-muted)] mb-2">Assembled Circuit</div>
            <div className="flex items-center gap-2 min-w-[280px]">
              <span className="text-white">|0⟩</span>
              <span className="text-white/30">──</span>
              {userGates.length === 0 ? (
                <span className="text-xs text-[var(--color-app-text-muted)] italic">(Click buttons below to append gates)</span>
              ) : (
                userGates.map((g, idx) => (
                  <React.Fragment key={idx}>
                    <span className="px-2.5 py-1 rounded bg-blue-600/30 border border-blue-400 text-blue-200 font-bold">
                      {g}
                    </span>
                    <span className="text-white/30">──</span>
                  </React.Fragment>
                ))
              )}
            </div>
          </div>

          {/* Palette */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[var(--color-app-text-muted)] font-mono">Available:</span>
            {["X", "H", "Z", "CX"].map((g) => (
              <button
                key={g}
                onClick={() => handleAddChallengeGate(g)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-white font-mono font-bold text-xs"
              >
                + {g}
              </button>
            ))}
            <button
              onClick={handleClearChallenge}
              className="ml-auto px-3 py-1 rounded-md text-xs font-bold bg-red-950/30 text-red-300 border border-red-500/20"
            >
              Reset
            </button>
          </div>

          {/* Action & Feedback */}
          <div className="flex flex-col items-center gap-3 pt-2">
            <button
              onClick={handleTestChallenge}
              disabled={userGates.length === 0}
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-mono font-bold text-xs shadow"
            >
              Test Circuit Solution
            </button>

            {challengeStatus === "success" && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 font-mono text-xs text-center w-full">
                ✓ Outstanding! Your circuit successfully solves {challenges[challengeIdx].title}!
              </div>
            )}
            {challengeStatus === "retry" && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 font-mono text-xs text-center w-full">
                Not quite there yet. Check the expected transformation and try a different gate sequence!
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 16 — FULL CIRCUIT SIMULATOR BRIDGE                                */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-primary)]/40 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-[var(--color-app-primary)]/20 text-[var(--color-app-primary)] border border-[var(--color-app-primary)]/30">
            Section 16 · Full Scale Experiment
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Circuit Simulator Bridge</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-3">
          Ready to Build Something Larger?
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed mb-6">
          Everything you have learned here works directly inside Quantiva's full Circuit Simulator.
          Choose a pre-configured circuit to launch it live in the simulator:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-black/40 border border-blue-500/30 flex flex-col justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">Experiment 1: Single-Qubit HZH</div>
              <div className="text-sm font-bold text-white font-mono mb-2">|0⟩ ── H ── Z ── H ── [ M ]</div>
              <p className="text-xs text-[var(--color-app-text-muted)] leading-relaxed">
                Preload the H-Z-H identity into the simulator to view the full state vector and multi-backend Qiskit execution.
              </p>
            </div>
            <button
              onClick={() => handleOpenSimulator("hzh")}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-mono font-bold text-xs shadow-lg transition-all"
            >
              Open H-Z-H in Simulator →
            </button>
          </div>

          <div className="p-5 rounded-xl bg-black/40 border border-pink-500/30 flex flex-col justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-pink-400 mb-1">Experiment 2: Two-Qubit CNOT Circuit</div>
              <div className="text-sm font-bold text-white font-mono mb-2">H on q₀ + CNOT(q₀ → q₁) + [ M ]</div>
              <p className="text-xs text-[var(--color-app-text-muted)] leading-relaxed">
                Launch the multi-wire circuit with verified wire ordering: q₀ as control and q₁ as target.
              </p>
            </div>
            <button
              onClick={() => handleOpenSimulator("cnot")}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-mono font-bold text-xs shadow-lg transition-all"
            >
              Open Two-Qubit in Simulator →
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 17 — SUMMARY                                                     */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-emerald-500/40">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Section 17 · Milestone Complete
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Core Takeaways</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Module Summary: The Architecture of Quantum Circuits
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[var(--color-app-text-muted)] leading-relaxed mb-8">
          <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-2">
            <h4 className="font-bold text-emerald-400 uppercase text-[11px]">Core Circuit Concepts</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>A quantum circuit is a sequence of operations applied to quantum states.</li>
              <li>Circuit order matters fundamentally: quantum operations generally do not commute.</li>
              <li>Multiple gates can be combined into larger unitary transformations (e.g. HZH = X).</li>
              <li>Multiple qubits interact through multi-qubit gates like CNOT across wires.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-2">
            <h4 className="font-bold text-cyan-400 uppercase text-[11px]">Depth & Optimization</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>Circuit depth describes sequential layers of dependent operations.</li>
              <li>Gates on independent qubits can run in parallel: number of gates ≠ circuit depth.</li>
              <li>Equivalent circuits can be optimized by canceling adjacent self-inverse pairs.</li>
              <li>A circuit is a live laboratory you can build, simulate, and optimize.</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
          <div>
            <div className="text-sm font-bold text-emerald-300 mb-1">
              {isCompleted ? "✓ Milestone Already Completed" : "Ready to complete Module 8?"}
            </div>
            <div className="text-xs text-[var(--color-app-text-muted)]">
              Next in the curriculum: <strong>Module 9 — Superposition</strong> (exploring the linear combination of quantum states).
            </div>
          </div>

          <button
            onClick={() => onComplete && onComplete()}
            disabled={isCompleted}
            className={`px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-lg ${
              isCompleted
                ? "bg-emerald-600/30 text-emerald-300 cursor-default border border-emerald-500/40"
                : "bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95"
            }`}
          >
            {isCompleted ? "✓ Completed" : "Complete Module 8"}
          </button>
        </div>
      </section>
    </div>
  );
}
