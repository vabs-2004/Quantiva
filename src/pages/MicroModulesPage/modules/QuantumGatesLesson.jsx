import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import MathHTMLContainer from "../../../components/MathHTMLContainer/MathHTMLContainer";
import StateProbabilityHeatmap from "../../../components/StateProbabilityHeatmap/StateProbabilityHeatmap";
import BlochSphere3D from "../../../components/BlochSphereViewer/BlochSphere3D";

// --- Mathematical Helper Functions for Single Qubit Complex State ---
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
      // Y = [[0, -i], [i, 0]] => Y|0> = i|1>, Y|1> = -i|0>
      // Y * [alpha, beta]^T = [-i * beta, i * alpha]^T
      // alpha' = -i*(br + i*bi) = bi - i*br
      // beta' = i*(ar + i*ai) = -ai + i*ar
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
      // S = [[1, 0], [0, i]] => beta' = i*beta = -bi + i*br
      return { ar, ai, br: -bi, bi: br };
    case "T":
      // T = [[1, 0], [0, e^(i*pi/4)]] => beta' = (1+i)/sqrt(2) * (br + i*bi)
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

export default function QuantumGatesLesson({ onComplete, isCompleted, onAskQuantiva }) {
  const navigate = useNavigate();

  // --- Section 2: X Gate State ---
  const [xState, setXState] = useState({ label: "|0⟩", ar: 1, ai: 0, br: 0, bi: 0 });
  const [xApplied, setXApplied] = useState(false);

  // --- Section 3: Y Gate State ---
  const [yInitial, setYInitial] = useState("0");
  const [yApplied, setYApplied] = useState(false);

  // --- Section 4: Z Gate State ---
  const [zApplied, setZApplied] = useState(false);

  // --- Section 5: H Gate State ---
  const [hStep, setHStep] = useState(0); // 0: |0⟩, 1: |+⟩, 2: |0⟩

  // --- Section 6: S and T Gate State ---
  const [phaseGate, setPhaseGate] = useState("none"); // none, S, T

  // --- Section 6B: Rotation Gates (Rx, Ry, Rz) State ---
  const [rotAxis, setRotAxis] = useState("Y"); // X, Y, Z
  const [rotAngle, setRotAngle] = useState(Math.PI / 2); // default pi/2 (90 deg)

  // --- Section 7: Gate Lab State ---
  const [labState, setLabState] = useState({
    name: "|0⟩",
    ar: 1,
    ai: 0,
    br: 0,
    bi: 0,
  });
  const [labHistory, setLabHistory] = useState([
    { gate: "Initial", state: "|0⟩", ar: 1, ai: 0, br: 0, bi: 0 },
  ]);

  // --- Section 8: Gate Composition Challenge ---
  const [compState, setCompState] = useState({ ar: 1, ai: 0, br: 0, bi: 0, name: "|0⟩" });
  const [compHistory, setCompHistory] = useState([]);

  // --- Section 9: Reversibility State ---
  const [revGate, setRevGate] = useState("X");
  const [revStep, setRevStep] = useState(0); // 0: start, 1: applied once, 2: applied twice

  // --- Section 11: CNOT Interactive State ---
  const [cnotInput, setCnotInput] = useState("10");
  const [cnotActive, setCnotActive] = useState(false);

  // --- Section 12: SWAP Interactive State ---
  const [swapInput, setSwapInput] = useState("01");
  const [swapActive, setSwapActive] = useState(false);

  // --- Section 13: Two-Qubit Circuit Teaser ---
  const [twoQubitStep, setTwoQubitStep] = useState(0); // 0: |00⟩, 1: H on q₀, 2: CNOT

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------
  const handleApplyX = () => {
    setXApplied(true);
  };

  const handleResetX = (label) => {
    setXApplied(false);
    if (label === "|0⟩") setXState({ label: "|0⟩", ar: 1, ai: 0, br: 0, bi: 0 });
    else if (label === "|1⟩") setXState({ label: "|1⟩", ar: 0, ai: 0, br: 1, bi: 0 });
    else if (label === "|+⟩") setXState({ label: "|+⟩", ar: 1 / Math.SQRT2, ai: 0, br: 1 / Math.SQRT2, bi: 0 });
    else if (label === "|−⟩") setXState({ label: "|−⟩", ar: 1 / Math.SQRT2, ai: 0, br: -1 / Math.SQRT2, bi: 0 });
  };

  const currentXOut = useMemo(() => {
    if (!xApplied) return xState;
    const res = applySingleGate("X", xState.ar, xState.ai, xState.br, xState.bi);
    let name = "|?⟩";
    if (xState.label === "|0⟩") name = "|1⟩";
    else if (xState.label === "|1⟩") name = "|0⟩";
    else if (xState.label === "|+⟩") name = "|+⟩";
    else if (xState.label === "|−⟩") name = "−|−⟩ (Global Phase −1)";
    return { ...res, label: name };
  }, [xState, xApplied]);

  // Y Gate calculations
  const yStateData = useMemo(() => {
    let ar = 1, ai = 0, br = 0, bi = 0, label = "|0⟩";
    if (yInitial === "1") { ar = 0; br = 1; label = "|1⟩"; }
    else if (yInitial === "+") { ar = 1 / Math.SQRT2; br = 1 / Math.SQRT2; label = "|+⟩"; }
    else if (yInitial === "-") { ar = 1 / Math.SQRT2; br = -1 / Math.SQRT2; label = "|−⟩"; }

    if (!yApplied) {
      const bloch = stateToBloch(ar, ai, br, bi);
      return { ar, ai, br, bi, label, theta: bloch.theta, phi: bloch.phi, p0: ar * ar + ai * ai, p1: br * br + bi * bi };
    }

    const res = applySingleGate("Y", ar, ai, br, bi);
    const bloch = stateToBloch(res.ar, res.ai, res.br, res.bi);
    let outLabel = "";
    if (yInitial === "0") outLabel = "i|1⟩";
    else if (yInitial === "1") outLabel = "−i|0⟩";
    else if (yInitial === "+") outLabel = "−i|−⟩";
    else if (yInitial === "-") outLabel = "i|+⟩";

    return {
      ar: res.ar,
      ai: res.ai,
      br: res.br,
      bi: res.bi,
      label: outLabel,
      theta: bloch.theta,
      phi: bloch.phi,
      p0: res.ar * res.ar + res.ai * res.ai,
      p1: res.br * res.br + res.bi * res.bi,
    };
  }, [yInitial, yApplied]);

  // Z Gate calculations
  const zStateData = useMemo(() => {
    if (!zApplied) {
      return {
        label: "|+⟩",
        ar: 1 / Math.SQRT2,
        br: 1 / Math.SQRT2,
        theta: Math.PI / 2,
        phi: 0,
        p0: 0.5,
        p1: 0.5,
      };
    }
    return {
      label: "|−⟩",
      ar: 1 / Math.SQRT2,
      br: -1 / Math.SQRT2,
      theta: Math.PI / 2,
      phi: Math.PI,
      p0: 0.5,
      p1: 0.5,
    };
  }, [zApplied]);

  // S/T Gate calculations
  const phaseStateData = useMemo(() => {
    let ar = 1 / Math.SQRT2, ai = 0, br = 1 / Math.SQRT2, bi = 0;
    let label = "|+⟩";
    if (phaseGate === "S") {
      const res = applySingleGate("S", ar, ai, br, bi);
      ar = res.ar; ai = res.ai; br = res.br; bi = res.bi;
      label = "|+i⟩";
    } else if (phaseGate === "T") {
      const res = applySingleGate("T", ar, ai, br, bi);
      ar = res.ar; ai = res.ai; br = res.br; bi = res.bi;
      label = "(|0⟩ + e^{iπ/4}|1⟩)/√2";
    }
    const bloch = stateToBloch(ar, ai, br, bi);
    return {
      ar, ai, br, bi, label,
      theta: bloch.theta,
      phi: bloch.phi,
      p0: Math.round((ar * ar + ai * ai) * 100) / 100,
      p1: Math.round((br * br + bi * bi) * 100) / 100,
    };
  }, [phaseGate]);

  // Rotation Gate calculations (Starting from |0⟩: alpha=1, beta=0)
  const rotStateData = useMemo(() => {
    const half = rotAngle / 2;
    const c = Math.cos(half);
    const s = Math.sin(half);
    let ar = 0, ai = 0, br = 0, bi = 0;

    if (rotAxis === "X") {
      // Rx(theta)|0⟩ = cos(theta/2)|0⟩ - i*sin(theta/2)|1⟩
      ar = c;
      ai = 0;
      br = 0;
      bi = -s;
    } else if (rotAxis === "Y") {
      // Ry(theta)|0⟩ = cos(theta/2)|0⟩ + sin(theta/2)|1⟩
      ar = c;
      ai = 0;
      br = s;
      bi = 0;
    } else if (rotAxis === "Z") {
      // Rz(theta)|0⟩ = e^(-i*theta/2)|0⟩ = cos(theta/2)|0⟩ - i*sin(theta/2)|0⟩
      ar = c;
      ai = -s;
      br = 0;
      bi = 0;
    }

    const bloch = stateToBloch(ar, ai, br, bi);
    const p0 = Math.max(0, Math.min(1, ar * ar + ai * ai));
    const p1 = Math.max(0, Math.min(1, br * br + bi * bi));

    return {
      ar, ai, br, bi,
      theta: bloch.theta,
      phi: bloch.phi,
      p0: Number(p0.toFixed(3)),
      p1: Number(p1.toFixed(3)),
    };
  }, [rotAxis, rotAngle]);

  // Gate Lab Actions
  const handleLabApplyGate = (gate) => {
    const next = applySingleGate(gate, labState.ar, labState.ai, labState.br, labState.bi);
    const newEntry = {
      gate,
      ar: next.ar,
      ai: next.ai,
      br: next.br,
      bi: next.bi,
    };
    setLabState({ ...next, name: "State" });
    setLabHistory((prev) => [...prev, newEntry]);
  };

  const handleLabReset = (preset) => {
    let ar = 1, ai = 0, br = 0, bi = 0, name = "|0⟩";
    if (preset === "1") { ar = 0; br = 1; name = "|1⟩"; }
    else if (preset === "+") { ar = 1 / Math.SQRT2; br = 1 / Math.SQRT2; name = "|+⟩"; }
    else if (preset === "-") { ar = 1 / Math.SQRT2; br = -1 / Math.SQRT2; name = "|−⟩"; }
    const initial = { name, ar, ai, br, bi };
    setLabState(initial);
    setLabHistory([{ gate: "Initial", ...initial }]);
  };

  const handleLabUndo = () => {
    if (labHistory.length <= 1) return;
    const newHist = labHistory.slice(0, -1);
    const last = newHist[newHist.length - 1];
    setLabState({ name: "State", ar: last.ar, ai: last.ai, br: last.br, bi: last.bi });
    setLabHistory(newHist);
  };

  const labBloch = useMemo(() => {
    return stateToBloch(labState.ar, labState.ai, labState.br, labState.bi);
  }, [labState]);

  // Composition Challenge
  const handleCompApply = (gate) => {
    const next = applySingleGate(gate, compState.ar, compState.ai, compState.br, compState.bi);
    setCompState({ ...next, name: "Custom" });
    setCompHistory((prev) => [...prev, gate]);
  };

  const handleCompReset = () => {
    setCompState({ ar: 1, ai: 0, br: 0, bi: 0, name: "|0⟩" });
    setCompHistory([]);
  };

  // Reversibility Runner
  const handleRevNext = () => {
    if (revStep === 0) setRevStep(1);
    else if (revStep === 1) setRevStep(2);
    else setRevStep(0);
  };

  // CNOT output calculation (wire order |q0 q1>, q0 = control, q1 = target)
  const cnotOutput = useMemo(() => {
    if (!cnotActive) return cnotInput;
    if (cnotInput === "00") return "00";
    if (cnotInput === "01") return "01";
    if (cnotInput === "10") return "11";
    if (cnotInput === "11") return "10";
    return cnotInput;
  }, [cnotInput, cnotActive]);

  // SWAP output calculation (wire order |q0 q1>)
  const swapOutput = useMemo(() => {
    if (!swapActive) return swapInput;
    if (swapInput === "00") return "00";
    if (swapInput === "01") return "10";
    if (swapInput === "10") return "01";
    if (swapInput === "11") return "11";
    return swapInput;
  }, [swapInput, swapActive]);

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
          origin: "quantum-gates",
          message: "Preloaded Two-Qubit Multi-Wire Circuit: H on q₀ followed by CNOT across q₀ → q₁ and Measurement.",
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
          origin: "quantum-gates",
          message: "Preloaded Gate Sequence: |0⟩ → H → Z → H → Measure (Equivalent to Pauli-X!).",
        },
      });
    }
  };

  return (
    <div className="space-y-16 py-4">
      {/* ========================================================================= */}
      {/* SECTION 1 — THE PROBLEM: HOW DO WE CHANGE A QUBIT?                        */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Section 1 · Foundation
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Transforming Quantum States</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          The Problem: How Do We Change a Qubit?
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            Up to this point, you have explored quantum states as vectors |ψ⟩ = α|0⟩ + β|1⟩,
            points on the Bloch Sphere, and probability amplitudes governed by Born's Rule.
            Now we confront the fundamental operational question:
          </p>

          <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 text-sm font-medium">
            💡 <strong>"Can we change a qubit's state without measuring it?"</strong>
          </div>

          <p>
            If you measure a qubit, you force it to collapse randomly into |0⟩ or |1⟩, destroying the delicate
            superposition. Measurement extracts classical information, but it does not let us guide, steer, or compute.
          </p>

          <p>
            To compute, we need operations that take an existing quantum state and smoothly transform it into another quantum state
            while preserving its total probability. That operation is called a <strong>quantum gate</strong>.
          </p>
        </div>

        {/* Conceptual Visual */}
        <div className="mt-8 p-6 rounded-xl bg-black/40 border border-white/10 flex flex-col items-center justify-center gap-4">
          <div className="text-xs font-mono text-[var(--color-app-text-muted)] uppercase tracking-wider">
            Quantum Gate Conceptual Pipeline
          </div>
          <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap font-mono text-sm sm:text-base">
            <div className="px-4 py-2.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold shadow-lg">
              |0⟩ (Initial State)
            </div>
            <span className="text-xl text-[var(--color-app-text-muted)]">─────────►</span>
            <div className="px-5 py-3 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 text-white font-bold border border-purple-500/50 shadow-xl flex items-center gap-2">
              <span className="text-cyan-300 font-extrabold">[ G ]</span> Quantum Gate
            </div>
            <span className="text-xl text-[var(--color-app-text-muted)]">─────────►</span>
            <div className="px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-lg">
              |ψ⟩ (Transformed State)
            </div>
          </div>
          <div className="mt-2 text-xs text-center text-[var(--color-app-text-muted)] max-w-lg">
            <strong>Key Distinction:</strong> Applying a gate is <em>not</em> the same as measuring the qubit.
            Measurement collapses state; a quantum gate unitarily transforms state vectors.
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2 — THE X GATE                                                   */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-red-500/20 text-red-300 border border-red-500/30">
            Section 2 · Single-Qubit
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Bit-Flipping Operation</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          The Pauli-X Gate
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-3">
          <p>
            The simplest single-qubit transformation is the <strong>Pauli-X</strong> gate.
            On computational basis states, it swaps |0⟩ and |1⟩:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-center">
            <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-red-300">
              <MathHTMLContainer html="$$X|0\rangle = |1\rangle$$" />
            </div>
            <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-red-300">
              <MathHTMLContainer html="$$X|1\rangle = |0\rangle$$" />
            </div>
          </div>
          <div className="p-3 rounded-xl bg-yellow-950/20 border border-yellow-500/30 text-yellow-200/90 text-xs">
            ⚠️ <strong>Pedagogical Note:</strong> Rather than saying "X is the quantum version of NOT", quantum physicists state:
            <em> "On the computational basis states, X behaves like a classical NOT operation."</em>
            On superpositions, its action reveals deeper wave mechanics!
          </div>
          <p>
            For instance, consider the superposition states |+⟩ and |−⟩:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-center text-xs">
            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <MathHTMLContainer html="$$X|+\rangle = X\left(\frac{|0\rangle+|1\rangle}{\sqrt{2}}\right) = \frac{|1\rangle+|0\rangle}{\sqrt{2}} = |+\rangle$$" />
            </div>
            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <MathHTMLContainer html="$$X|-\rangle = X\left(\frac{|0\rangle-|1\rangle}{\sqrt{2}}\right) = \frac{|1\rangle-|0\rangle}{\sqrt{2}} = -|-\rangle$$" />
            </div>
          </div>
        </div>

        {/* Interactive X Experiment */}
        <div className="mt-6 p-6 rounded-xl bg-black/30 border border-red-500/30 space-y-5">
          <div className="text-xs font-bold uppercase tracking-wider text-red-400">
            Interactive: Apply Pauli-X
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-[var(--color-app-text-muted)]">Choose Initial State:</span>
            {["|0⟩", "|1⟩", "|+⟩", "|−⟩"].map((lbl) => (
              <button
                key={lbl}
                onClick={() => handleResetX(lbl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  xState.label === lbl
                    ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                    : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 text-center">
            <div className="p-4 rounded-xl bg-black/40 border border-white/10">
              <div className="text-[10px] text-[var(--color-app-text-muted)] font-mono uppercase mb-1">Before Gate</div>
              <div className="text-base font-bold font-mono text-blue-300">{xState.label}</div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleApplyX}
                disabled={xApplied}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-mono font-bold text-sm shadow-xl transition-all active:scale-95"
              >
                [ Apply X Gate ]
              </button>
              {xApplied && (
                <button
                  onClick={() => setXApplied(false)}
                  className="text-[11px] text-[var(--color-app-text-muted)] hover:text-white underline"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-red-500/30">
              <div className="text-[10px] text-[var(--color-app-text-muted)] font-mono uppercase mb-1">After Gate</div>
              <div className="text-base font-bold font-mono text-red-300">
                {xApplied ? currentXOut.label : "(Click Apply)"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3 — THE Y GATE                                                   */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Section 3 · Single-Qubit
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Pauli-Y Operation</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          The Pauli-Y Gate
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            The <strong>Pauli-Y</strong> gate is a genuinely quantum operator that cannot be understood as a purely classical bit operation.
            Geometrically, <strong>Y represents a 180° (π radian) rotation around the Y-axis of the Bloch sphere</strong>.
          </p>

          <p>
            Its mathematical transformation on computational basis states incorporates the imaginary unit i:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-center">
            <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-emerald-300">
              <MathHTMLContainer html="$$Y|0\rangle = i|1\rangle$$" />
            </div>
            <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-emerald-300">
              <MathHTMLContainer html="$$Y|1\rangle = -i|0\rangle$$" />
            </div>
          </div>
        </div>

        {/* Interactive Y Gate with Bloch Sphere */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 rounded-xl bg-black/30 border border-emerald-500/30">
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Manipulate: Apply Pauli-Y
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[var(--color-app-text-muted)]">Initial:</span>
              {[
                { id: "0", lbl: "|0⟩" },
                { id: "1", lbl: "|1⟩" },
                { id: "+", lbl: "|+⟩" },
                { id: "-", lbl: "|−⟩" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setYInitial(item.id);
                    setYApplied(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    yInitial === item.id
                      ? "bg-emerald-600 text-white"
                      : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
                  }`}
                >
                  {item.lbl}
                </button>
              ))}
            </div>

            <button
              onClick={() => setYApplied(!yApplied)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs shadow-lg transition-all"
            >
              {yApplied ? "Reset State" : "Apply Pauli-Y Gate"}
            </button>

            <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-2 text-xs font-mono">
              <div className="text-[var(--color-app-text-muted)]">Active State: <span className="text-emerald-300 font-bold">{yStateData.label}</span></div>
              <div>α = {formatComplex(yStateData.ar, yStateData.ai)}</div>
              <div>β = {formatComplex(yStateData.br, yStateData.bi)}</div>
              <div className="pt-2 border-t border-white/10 flex gap-4 text-[11px]">
                <span>P(0): {(yStateData.p0 * 100).toFixed(1)}%</span>
                <span>P(1): {(yStateData.p1 * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="h-64 rounded-xl bg-black/60 border border-white/10 overflow-hidden flex flex-col items-center justify-center relative">
            <div className="absolute top-2 left-3 text-[10px] font-mono text-[var(--color-app-text-muted)] uppercase">
              3D Bloch Vector (Rotates 180° around Y)
            </div>
            <Canvas camera={{ position: [2.5, 2, 3], fov: 45 }}>
              <ambientLight intensity={0.8} />
              <pointLight position={[5, 5, 5]} intensity={0.8} />
              <BlochSphere3D theta={yStateData.theta} phi={yStateData.phi} />
              <OrbitControls enablePan={false} enableZoom={false} />
            </Canvas>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4 — THE Z GATE                                                   */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Section 4 · Single-Qubit
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Phase-Flipping Operation</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          The Pauli-Z Gate: Changing State Without Changing Probabilities
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            The <strong>Pauli-Z</strong> gate leaves |0⟩ untouched, but introduces a minus sign (a phase flip of π) to |1⟩:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-center">
            <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-purple-300">
              <MathHTMLContainer html="$$Z|0\rangle = |0\rangle$$" />
            </div>
            <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-purple-300">
              <MathHTMLContainer html="$$Z|1\rangle = -|1\rangle$$" />
            </div>
          </div>

          <p>
            Now examine what happens when we apply Z to a superposition state |+⟩:
          </p>

          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-center font-mono text-xs sm:text-sm">
            <MathHTMLContainer html="$$Z|+\rangle = Z\left(\frac{|0\rangle+|1\rangle}{\sqrt{2}}\right) = \frac{|0\rangle-|1\rangle}{\sqrt{2}} = |-\rangle$$" />
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40 text-cyan-200">
            <div className="font-bold mb-1">🔍 Critical Pedagogical Question:</div>
            <p className="text-xs sm:text-sm mb-2">
              Did the computational-basis measurement probabilities change when going from |+⟩ to |−⟩?
            </p>
            <div className="grid grid-cols-2 gap-3 font-mono text-xs text-center">
              <div className="p-2 rounded bg-black/40">
                <strong>Before (|+⟩):</strong> P(0) = 50%, P(1) = 50%
              </div>
              <div className="p-2 rounded bg-black/40">
                <strong>After (|−⟩):</strong> P(0) = 50%, P(1) = 50%
              </div>
            </div>
            <p className="text-xs mt-2 text-cyan-300">
              <strong>The state physically changed</strong> (moving from the +X axis to the −X axis of the Bloch sphere),
              even though standard measurement probabilities stayed exactly 50/50!
            </p>
          </div>
        </div>

        <div className="mt-6 p-6 rounded-xl bg-black/30 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Interactive: Flip Relative Phase
            </div>
            <div className="text-xs text-[var(--color-app-text-muted)]">
              Toggle the Pauli-Z gate on the state |+⟩:
            </div>
            <button
              onClick={() => setZApplied(!zApplied)}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs shadow-lg transition-all"
            >
              {zApplied ? "Reset to |+⟩" : "Apply Z Gate (|+⟩ → |−⟩)"}
            </button>
          </div>

          <div className="h-48 w-full sm:w-64 rounded-xl bg-black/50 border border-white/10 overflow-hidden relative">
            <div className="absolute top-2 left-3 text-[10px] font-mono text-purple-300 font-bold uppercase">
              Bloch Sphere: {zStateData.label}
            </div>
            <Canvas camera={{ position: [2.5, 2, 3], fov: 45 }}>
              <ambientLight intensity={0.8} />
              <pointLight position={[5, 5, 5]} intensity={0.8} />
              <BlochSphere3D theta={zStateData.theta} phi={zStateData.phi} />
              <OrbitControls enablePan={false} enableZoom={false} />
            </Canvas>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5 — THE H GATE                                                   */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Section 5 · Single-Qubit
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Superposition Bridge</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          The Hadamard (H) Gate: Creating Superposition
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            The <strong>Hadamard (H)</strong> gate is the gateway to quantum computation.
            It maps definite computational basis states into equal superpositions, and vice versa:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-center">
            <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-blue-300">
              <MathHTMLContainer html="$$H|0\rangle = |+\rangle = \frac{|0\rangle+|1\rangle}{\sqrt{2}}$$" />
            </div>
            <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-blue-300">
              <MathHTMLContainer html="$$H|1\rangle = |-\rangle = \frac{|0\rangle-|1\rangle}{\sqrt{2}}$$" />
            </div>
          </div>

          <p>
            Because Hadamard is its own inverse (H² = I), applying it twice brings the qubit back to its starting state:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-center text-xs">
            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <MathHTMLContainer html="$$H|+\rangle = |0\rangle$$" />
            </div>
            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
              <MathHTMLContainer html="$$H|-\rangle = |1\rangle$$" />
            </div>
          </div>
        </div>

        {/* Interactive H Stepper */}
        <div className="mt-6 p-6 rounded-xl bg-black/30 border border-blue-500/30 space-y-5">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
            Interactive: Two Successive Hadamard Pulses (H² = I)
          </div>

          <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap font-mono text-sm">
            <div className={`px-4 py-2.5 rounded-xl border ${
              hStep === 0 ? "bg-blue-600 text-white font-bold" : "bg-black/40 text-[var(--color-app-text-muted)]"
            }`}>
              Step 0: |0⟩
            </div>
            <span>──[ H ]──►</span>
            <div className={`px-4 py-2.5 rounded-xl border ${
              hStep === 1 ? "bg-blue-600 text-white font-bold" : "bg-black/40 text-[var(--color-app-text-muted)]"
            }`}>
              Step 1: |+⟩ (50/50)
            </div>
            <span>──[ H ]──►</span>
            <div className={`px-4 py-2.5 rounded-xl border ${
              hStep === 2 ? "bg-blue-600 text-white font-bold" : "bg-black/40 text-[var(--color-app-text-muted)]"
            }`}>
              Step 2: |0⟩ (100% |0⟩)
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setHStep((prev) => (prev + 1) % 3)}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs shadow-lg transition-all"
            >
              {hStep === 0 ? "Pulse 1st H Gate (|0⟩ → |+⟩)" : hStep === 1 ? "Pulse 2nd H Gate (|+⟩ → |0⟩)" : "Reset Cycle"}
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6 — S AND T: PHASE ROTATION GATES                                 */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
            Section 6 · Single-Qubit
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Fractional Phase Gates</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          S and T: Controlled Phase Rotation Gates
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            What if we want to rotate the relative phase of a qubit by a smaller amount than the 180° flip caused by the Z gate?
            This is where the <strong>S</strong> and <strong>T</strong> phase rotation gates are essential.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
            <div className="p-4 rounded-xl bg-black/30 border border-yellow-500/30 space-y-2">
              <div className="text-xs text-yellow-400 font-bold uppercase">Phase Gate S (√Z)</div>
              <div className="text-xs text-[var(--color-app-text-muted)]">Rotates 90° (π/2 rad) around Z:</div>
              <MathHTMLContainer html="$$S|0\rangle = |0\rangle, \quad S|1\rangle = i|1\rangle$$" />
            </div>

            <div className="p-4 rounded-xl bg-black/30 border border-orange-500/30 space-y-2">
              <div className="text-xs text-orange-400 font-bold uppercase">T Gate (⁴√Z or π/8 Gate)</div>
              <div className="text-xs text-[var(--color-app-text-muted)]">Rotates 45° (π/4 rad) around Z:</div>
              <MathHTMLContainer html="$$T|0\rangle = |0\rangle, \quad T|1\rangle = e^{i\pi/4}|1\rangle$$" />
              <div className="text-[11px] text-[var(--color-app-text-muted)]">Notice that: <span className="text-white font-bold">T² = S</span> and <span className="text-white font-bold">S² = Z</span>!</div>
            </div>
          </div>

          <p>
            Applying S or T to the superposition |+⟩ shifts the state around the equator of the Bloch sphere
            without changing measurement probabilities in the computational basis:
          </p>
        </div>

        {/* Phase Rotation Playground */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 rounded-xl bg-black/30 border border-yellow-500/30">
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-yellow-400">
              Interactive: Rotate Phase on Equator
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPhaseGate("none")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  phaseGate === "none" ? "bg-white/20 text-white" : "bg-white/5 text-[var(--color-app-text-muted)]"
                }`}
              >
                Initial |+⟩ (φ = 0)
              </button>
              <button
                onClick={() => setPhaseGate("T")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  phaseGate === "T" ? "bg-orange-500 text-white" : "bg-white/5 text-[var(--color-app-text-muted)]"
                }`}
              >
                Apply T (+45°)
              </button>
              <button
                onClick={() => setPhaseGate("S")}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  phaseGate === "S" ? "bg-yellow-500 text-white" : "bg-white/5 text-[var(--color-app-text-muted)]"
                }`}
              >
                Apply S (+90°)
              </button>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-2 text-xs font-mono">
              <div className="text-yellow-300 font-bold">State: {phaseStateData.label}</div>
              <div>Azimuthal Angle φ: {(phaseStateData.phi * 180 / Math.PI).toFixed(1)}° ({phaseStateData.phi.toFixed(2)} rad)</div>
              <div className="pt-2 border-t border-white/10 flex gap-4 text-[11px]">
                <span>P(0): {(phaseStateData.p0 * 100).toFixed(1)}%</span>
                <span>P(1): {(phaseStateData.p1 * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="h-64 rounded-xl bg-black/60 border border-white/10 overflow-hidden flex flex-col items-center justify-center relative">
            <Canvas camera={{ position: [2.5, 2, 3], fov: 45 }}>
              <ambientLight intensity={0.8} />
              <pointLight position={[5, 5, 5]} intensity={0.8} />
              <BlochSphere3D theta={phaseStateData.theta} phi={phaseStateData.phi} />
              <OrbitControls enablePan={false} enableZoom={false} />
            </Canvas>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6B — CONTINUOUS ROTATION GATES (Rx, Ry, Rz)                       */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Section 6B · Parameterized Rotations
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Continuous Angles</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-2">
          Arbitrary Rotation Gates: Rx, Ry, and Rz
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] mb-6">
          While Pauli gates rotate a fixed 180° (π radians) and S/T gates apply discrete phase shifts,
          parameterized rotation gates rotate by an arbitrary angle θ around the X, Y, or Z axes.
          Notice how adjusting θ smoothly sweeps the state vector around the Bloch sphere!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-2">
            <h4 className="text-xs font-mono font-bold text-purple-300 uppercase">Rx(θ) Gate</h4>
            <div className="text-xs text-[var(--color-app-text-muted)]">
              Rotates state by angle θ around the Bloch X-axis.
            </div>
            <MathHTMLContainer html="$$R_x(\theta) = \begin{pmatrix} \cos(\theta/2) & -i\sin(\theta/2) \\ -i\sin(\theta/2) & \cos(\theta/2) \end{pmatrix}$$" />
          </div>

          <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-2">
            <h4 className="text-xs font-mono font-bold text-purple-300 uppercase">Ry(θ) Gate</h4>
            <div className="text-xs text-[var(--color-app-text-muted)]">
              Rotates state by angle θ around the Bloch Y-axis, creating real unequal superpositions.
            </div>
            <MathHTMLContainer html="$$R_y(\theta) = \begin{pmatrix} \cos(\theta/2) & -\sin(\theta/2) \\ \sin(\theta/2) & \cos(\theta/2) \end{pmatrix}$$" />
          </div>

          <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-2">
            <h4 className="text-xs font-mono font-bold text-purple-300 uppercase">Rz(θ) Gate</h4>
            <div className="text-xs text-[var(--color-app-text-muted)]">
              Rotates phase by angle θ around the Bloch Z-axis.
            </div>
            <MathHTMLContainer html="$$R_z(\theta) = \begin{pmatrix} e^{-i\theta/2} & 0 \\ 0 & e^{i\theta/2} \end{pmatrix}$$" />
          </div>
        </div>

        {/* Interactive Rotation Explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 rounded-xl bg-black/30 border border-purple-500/30">
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Interactive Slider: Select Axis & Angle θ
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-app-text-muted)]">Axis:</span>
              {["X", "Y", "Z"].map((axis) => (
                <button
                  key={axis}
                  onClick={() => setRotAxis(axis)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    rotAxis === axis
                      ? "bg-purple-600 text-white shadow-lg"
                      : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
                  }`}
                >
                  R{axis.toLowerCase()}(θ)
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--color-app-text-muted)]">Angle θ:</span>
                <span className="text-purple-300 font-bold">
                  {(rotAngle * 180 / Math.PI).toFixed(0)}° ({(rotAngle / Math.PI).toFixed(2)}π rad)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={2 * Math.PI}
                step="0.01"
                value={rotAngle}
                onChange={(e) => setRotAngle(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-[var(--color-app-text-muted)] font-mono">
                <span>0</span>
                <span>π/2 (90°)</span>
                <span>π (180°)</span>
                <span>2π (360°)</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-2 text-xs font-mono">
              <div className="text-purple-300 font-bold">
                Output State from |0⟩: R{rotAxis.toLowerCase()}({(rotAngle * 180 / Math.PI).toFixed(0)}°)
              </div>
              <div>α = {formatComplex(rotStateData.ar, rotStateData.ai)}</div>
              <div>β = {formatComplex(rotStateData.br, rotStateData.bi)}</div>
              <div className="pt-2 border-t border-white/10 flex gap-4 text-[11px]">
                <span>P(0): {(rotStateData.p0 * 100).toFixed(1)}%</span>
                <span>P(1): {(rotStateData.p1 * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="h-64 rounded-xl bg-black/60 border border-white/10 overflow-hidden flex flex-col items-center justify-center relative">
            <Canvas camera={{ position: [2.5, 2, 3], fov: 45 }}>
              <ambientLight intensity={0.8} />
              <pointLight position={[5, 5, 5]} intensity={0.8} />
              <BlochSphere3D theta={rotStateData.theta} phi={rotStateData.phi} />
              <OrbitControls enablePan={false} enableZoom={false} />
            </Canvas>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7 — GATE LAB                                                     */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-cyan-500/40 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Section 7 · Interactive Lab
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Single-Qubit Gate Playground</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-2">
          Gate Lab: Single-Qubit Laboratory
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] mb-6">
          Build arbitrary single-qubit transformations using Quantiva's core gate set: X, Y, Z, H, S, and T.
          Track how amplitudes, probabilities, and the Bloch vector evolve in real time.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls & Palette */}
          <div className="lg:col-span-7 space-y-5">
            {/* Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[var(--color-app-text-muted)]">Preset Base:</span>
              {["0", "1", "+", "-"].map((p) => (
                <button
                  key={p}
                  onClick={() => handleLabReset(p)}
                  className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-white/5 hover:bg-white/10 text-[var(--color-app-text-light)]"
                >
                  |{p}⟩
                </button>
              ))}
              <button
                onClick={handleLabUndo}
                disabled={labHistory.length <= 1}
                className="ml-auto px-3 py-1 rounded-md text-xs font-bold bg-red-950/40 border border-red-500/30 text-red-300 disabled:opacity-30"
              >
                ↶ Undo Step
              </button>
            </div>

            {/* Gate Buttons */}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-app-text-muted)] mb-2">
                Available Quantum Gates
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
                    onClick={() => handleLabApplyGate(g.id)}
                    className={`py-3 rounded-xl border font-mono font-extrabold text-base shadow-lg transition-all active:scale-95 ${g.color}`}
                  >
                    {g.id}
                  </button>
                ))}
              </div>
            </div>

            {/* State Readout */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2 font-mono text-xs">
              <div className="text-[var(--color-app-text-muted)] uppercase text-[10px]">State Vector</div>
              <div className="text-sm font-bold text-cyan-300">
                |ψ⟩ = ({formatComplex(labState.ar, labState.ai)})|0⟩ + ({formatComplex(labState.br, labState.bi)})|1⟩
              </div>
            </div>

            {/* Probability View */}
            <div>
              <StateProbabilityHeatmap
                probabilities={{
                  "0": Math.max(0, Math.min(1, labState.ar * labState.ar + labState.ai * labState.ai)),
                  "1": Math.max(0, Math.min(1, labState.br * labState.br + labState.bi * labState.bi)),
                }}
              />
            </div>

            {/* Gate History Trail */}
            <div className="p-3 rounded-xl bg-black/30 border border-white/5">
              <div className="text-[10px] font-mono uppercase text-[var(--color-app-text-muted)] mb-2">
                Gate History Pipeline
              </div>
              <div className="flex items-center gap-1.5 flex-wrap font-mono text-xs">
                {labHistory.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <span className={`px-2 py-1 rounded ${idx === labHistory.length - 1 ? "bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/40" : "bg-white/5 text-[var(--color-app-text-muted)]"}`}>
                      {step.gate}
                    </span>
                    {idx < labHistory.length - 1 && <span className="text-[var(--color-app-text-muted)]">►</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* 3D Bloch View */}
          <div className="lg:col-span-5 h-80 lg:h-auto min-h-[300px] rounded-xl bg-black/50 border border-white/10 overflow-hidden relative">
            <div className="absolute top-2 left-3 text-[10px] font-mono text-[var(--color-app-text-muted)] uppercase z-10">
              Interactive Bloch Vector
            </div>
            <Canvas camera={{ position: [2.5, 2, 3], fov: 45 }}>
              <ambientLight intensity={0.8} />
              <pointLight position={[5, 5, 5]} intensity={0.8} />
              <BlochSphere3D theta={labBloch.theta} phi={labBloch.phi} />
              <OrbitControls enablePan={false} enableZoom={false} />
            </Canvas>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 8 — COMPOSITION: GATES WORK TOGETHER                             */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Section 8 · Synthesis
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Chaining Operations</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Composition: Gates Work Together
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            Just like notes in a melody or instructions in a classical algorithm, quantum gates achieve their true power when <strong>composed</strong> in sequence.
            Consider what happens if we apply:
          </p>

          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-center font-mono text-sm">
            <MathHTMLContainer html="$$|0\rangle \xrightarrow{H} |+\rangle \xrightarrow{Z} |-\rangle \xrightarrow{H} |1\rangle$$" />
          </div>

          <p>
            Notice that the sequence H → Z → H transformed |0⟩ into |1⟩!
            That is exactly the effect of an X gate: <strong>HZH = X</strong>.
          </p>
        </div>

        {/* Discovery Playground */}
        <div className="mt-6 p-6 rounded-xl bg-black/30 border border-indigo-500/30 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Discovery Challenge: Target |1⟩
          </div>
          <p className="text-xs text-[var(--color-app-text-muted)]">
            Starting from |0⟩, apply gates to discover how different sequences can reach |1⟩ or |−⟩:
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            {["X", "Y", "Z", "H", "S", "T"].map((g) => (
              <button
                key={g}
                onClick={() => handleCompApply(g)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 font-mono font-bold text-xs"
              >
                + {g}
              </button>
            ))}
            <button
              onClick={handleCompReset}
              className="ml-auto px-3 py-1 rounded-md text-xs font-bold bg-white/5 hover:bg-white/10 text-[var(--color-app-text-muted)]"
            >
              Reset
            </button>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between flex-wrap gap-4 text-xs font-mono">
            <div>
              <span className="text-[var(--color-app-text-muted)]">Pipeline: </span>
              <span className="text-white font-bold">{compHistory.length ? compHistory.join(" → ") : "Initial |0⟩"}</span>
            </div>
            <div>
              <span className="text-[var(--color-app-text-muted)]">P(0): </span>
              <span className="text-blue-300 font-bold">{(compState.ar * compState.ar + compState.ai * compState.ai).toFixed(2)}</span>
              <span className="text-[var(--color-app-text-muted)]"> | P(1): </span>
              <span className="text-emerald-300 font-bold">{(compState.br * compState.br + compState.bi * compState.bi).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 9 — REVERSIBILITY                                                 */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
            Section 9 · Physical Law
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Unitary Inverses</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Reversibility: Can We Undo a Gate?
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            In classical computing, operations like AND or OR are fundamentally <em>irreversible</em>: if an AND gate outputs 0, you cannot determine whether the inputs were (0, 0), (0, 1), or (1, 0). Information is erased.
          </p>
          <p>
            Quantum mechanics is strictly reversible: <strong>all closed quantum gate operations preserve total probability and can be run backward</strong>.
          </p>
          <p>
            Many fundamental gates are their own inverses:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-center text-sm">
            <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-teal-300">
              <MathHTMLContainer html="$$X^2 = I$$" />
            </div>
            <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-teal-300">
              <MathHTMLContainer html="$$H^2 = I$$" />
            </div>
            <div className="p-3 rounded-lg bg-black/30 border border-white/5 text-teal-300">
              <MathHTMLContainer html="$$Z^2 = I$$" />
            </div>
          </div>
        </div>

        <div className="mt-6 p-6 rounded-xl bg-black/30 border border-teal-500/30 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--color-app-text-muted)]">Select Self-Inverse Gate:</span>
            {["X", "H", "Z"].map((g) => (
              <button
                key={g}
                onClick={() => { setRevGate(g); setRevStep(0); }}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold ${
                  revGate === g ? "bg-teal-600 text-white" : "bg-white/5 text-[var(--color-app-text-muted)]"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 text-xs font-mono flex-wrap">
            <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-center">
              <div>Initial</div>
              <div className="text-white font-bold">|0⟩</div>
            </div>
            <span>──[{revGate}]──►</span>
            <div className={`p-3 rounded-lg border text-center ${revStep >= 1 ? "bg-teal-900/40 border-teal-500 text-teal-200 font-bold" : "bg-black/40 border-white/10 opacity-50"}`}>
              <div>1st Application</div>
              <div>{revGate === "X" ? "|1⟩" : revGate === "H" ? "|+⟩" : "|0⟩"}</div>
            </div>
            <span>──[{revGate}]──►</span>
            <div className={`p-3 rounded-lg border text-center ${revStep >= 2 ? "bg-teal-900/40 border-teal-500 text-teal-200 font-bold" : "bg-black/40 border-white/10 opacity-50"}`}>
              <div>2nd Application</div>
              <div>|0⟩ (Identity Recovered)</div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleRevNext}
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-mono text-xs font-bold"
            >
              {revStep === 0 ? `Apply 1st ${revGate}` : revStep === 1 ? `Apply 2nd ${revGate} (Undo)` : "Reset"}
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 10 — TWO-QUBIT GATES                                             */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/30">
            Section 10 · Multi-Qubit
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Composite Systems</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Two-Qubit Gates: Moving Beyond Single Wires
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            Until now, every gate has operated on only one qubit at a time.
            Real quantum computation requires qubits to interact with each other.
          </p>
          <p>
            A two-qubit system has four computational basis states.
            Throughout Quantiva, we write composite states in standard <strong>wire order |q₀ q₁⟩</strong>,
            where wire q₀ is the top wire and wire q₁ is the bottom wire:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center text-sm">
            <div className="p-3 rounded-lg bg-black/40 border border-white/5">|00⟩</div>
            <div className="p-3 rounded-lg bg-black/40 border border-white/5">|01⟩</div>
            <div className="p-3 rounded-lg bg-black/40 border border-white/5">|10⟩</div>
            <div className="p-3 rounded-lg bg-black/40 border border-white/5">|11⟩</div>
          </div>

          <p>
            In the next two sections, we explore the two foundational multi-qubit gates:
            <strong> Controlled-NOT (CNOT)</strong> and <strong>SWAP</strong>.
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 11 — CNOT                                                        */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/30">
            Section 11 · Multi-Qubit
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Controlled-NOT</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          The Controlled-NOT (CNOT / CX) Gate
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            The <strong>CNOT</strong> gate acts on two qubits: a <strong>control qubit</strong> (q₀) and a <strong>target qubit</strong> (q₁).
            Its operational rule is simple:
          </p>

          <div className="p-4 rounded-xl bg-pink-950/30 border border-pink-500/30 text-pink-200 text-sm font-semibold">
            ✨ CNOT flips the target qubit if and only if the control qubit is in state |1⟩.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[var(--color-app-text-muted)]">
                  <th className="p-2">Control (q₀)</th>
                  <th className="p-2">Target (q₁)</th>
                  <th className="p-2">Input |q₀ q₁⟩</th>
                  <th className="p-2 text-pink-400">Output |q₀ q₁⟩</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr><td className="p-2">0</td><td className="p-2">0</td><td className="p-2 font-bold">|00⟩</td><td className="p-2 font-bold text-pink-300">|00⟩</td><td className="p-2 text-[var(--color-app-text-muted)]">Target unchanged</td></tr>
                <tr><td className="p-2">0</td><td className="p-2">1</td><td className="p-2 font-bold">|01⟩</td><td className="p-2 font-bold text-pink-300">|01⟩</td><td className="p-2 text-[var(--color-app-text-muted)]">Target unchanged</td></tr>
                <tr className="bg-pink-950/20"><td className="p-2">1</td><td className="p-2">0</td><td className="p-2 font-bold">|10⟩</td><td className="p-2 font-bold text-pink-300">|11⟩</td><td className="p-2 text-pink-300">Target flips 0 → 1</td></tr>
                <tr className="bg-pink-950/20"><td className="p-2">1</td><td className="p-2">1</td><td className="p-2 font-bold">|11⟩</td><td className="p-2 font-bold text-pink-300">|10⟩</td><td className="p-2 text-pink-300">Target flips 1 → 0</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Interactive CNOT Visualizer */}
        <div className="mt-6 p-6 rounded-xl bg-black/30 border border-pink-500/30 space-y-6">
          <div className="text-xs font-bold uppercase tracking-wider text-pink-400">
            Interactive: Select Input Basis State
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {["00", "01", "10", "11"].map((s) => (
              <button
                key={s}
                onClick={() => { setCnotInput(s); setCnotActive(false); }}
                className={`px-4 py-2 rounded-xl font-mono font-bold text-xs transition-all ${
                  cnotInput === s ? "bg-pink-600 text-white shadow-lg" : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
                }`}
              >
                |{s}⟩
              </button>
            ))}
          </div>

          {/* Wire Diagram */}
          <div className="p-6 rounded-xl bg-black/60 border border-white/10 flex flex-col items-center gap-6">
            <div className="w-full max-w-md space-y-6 font-mono text-sm">
              {/* Wire 0 (Control) */}
              <div className="flex items-center gap-3">
                <span className="w-16 text-xs text-[var(--color-app-text-muted)]">q₀ (Ctrl):</span>
                <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 font-bold">|{cnotInput[0]}⟩</span>
                <div className="flex-1 h-0.5 bg-white/20 relative flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-pink-500 ring-4 ring-pink-500/30"></div>
                </div>
                <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 font-bold">|{cnotOutput[0]}⟩</span>
              </div>

              {/* Vertical connector */}
              <div className="h-6 w-0.5 bg-pink-500 mx-auto -my-4 relative z-0"></div>

              {/* Wire 1 (Target) */}
              <div className="flex items-center gap-3">
                <span className="w-16 text-xs text-[var(--color-app-text-muted)]">q₁ (Tgt):</span>
                <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 font-bold">|{cnotInput[1]}⟩</span>
                <div className="flex-1 h-0.5 bg-white/20 relative flex items-center justify-center">
                  <div className="h-6 w-6 rounded-full border-2 border-pink-500 flex items-center justify-center text-pink-400 font-bold text-xs bg-black">
                    ⊕
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 font-bold">|{cnotOutput[1]}⟩</span>
              </div>
            </div>

            <button
              onClick={() => setCnotActive(!cnotActive)}
              className="px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-mono font-bold text-xs shadow-lg transition-all"
            >
              {cnotActive ? "Reset CNOT" : "Pulse CNOT Gate"}
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 12 — SWAP                                                        */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Section 12 · Multi-Qubit
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">State Exchange</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          The SWAP Gate
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            The <strong>SWAP</strong> gate exchanges the quantum states of two qubits.
            In hardware architectures with constrained qubit connectivity, SWAP gates are vital for routing quantum information across chips.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-center text-xs">
            <div className="p-3 rounded-lg bg-black/40 border border-white/5">|00⟩ → |00⟩</div>
            <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 font-bold">|01⟩ → |10⟩</div>
            <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 font-bold">|10⟩ → |01⟩</div>
            <div className="p-3 rounded-lg bg-black/40 border border-white/5">|11⟩ → |11⟩</div>
          </div>
        </div>

        {/* Interactive SWAP Visualizer */}
        <div className="mt-6 p-6 rounded-xl bg-black/30 border border-cyan-500/30 space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-[var(--color-app-text-muted)]">Initial Basis State:</span>
            {["00", "01", "10", "11"].map((s) => (
              <button
                key={s}
                onClick={() => { setSwapInput(s); setSwapActive(false); }}
                className={`px-3 py-1.5 rounded-lg font-mono font-bold text-xs ${
                  swapInput === s ? "bg-cyan-600 text-white" : "bg-white/5 text-[var(--color-app-text-muted)]"
                }`}
              >
                |{s}⟩
              </button>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between font-mono text-sm max-w-md mx-auto">
            <div>Input: <span className="text-cyan-300 font-bold">|{swapInput}⟩</span></div>
            <button
              onClick={() => setSwapActive(!swapActive)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
            >
              {swapActive ? "Reset" : "Apply SWAP"}
            </button>
            <div>Output: <span className="text-emerald-300 font-bold">|{swapOutput}⟩</span></div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 13 — BUILD A TWO-QUBIT CIRCUIT                                    */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Section 13 · Circuit Preview
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Multi-Wire Gate Interaction</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Combining Single-Qubit and Two-Qubit Gates
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            When we combine single-qubit gates on individual wires with multi-qubit gates across wires,
            quantum circuits allow information to flow and correlate across multiple physical registers.
          </p>

          <p>
            Consider placing a Hadamard gate on wire q₀, followed by a CNOT gate with control on q₀ and target on q₁:
          </p>
        </div>

        {/* Multi-Wire Teaser Stepper */}
        <div className="mt-6 p-6 rounded-xl bg-black/40 border border-blue-500/30 space-y-6">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
            Multi-Wire Circuit Execution Teaser
          </div>

          <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-sm max-w-lg mx-auto space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-16 text-xs text-[var(--color-app-text-muted)]">Wire q₀:</span>
              <span className="text-blue-300">|0⟩</span>
              <span className="text-[var(--color-app-text-muted)]">──</span>
              <span className={`px-2 py-0.5 rounded border ${twoQubitStep >= 1 ? "bg-blue-600 text-white font-bold border-blue-400" : "bg-white/5 border-white/10"}`}>
                H
              </span>
              <span className="text-[var(--color-app-text-muted)]">──</span>
              <span className={`h-3 w-3 rounded-full ${twoQubitStep >= 2 ? "bg-pink-500 ring-2 ring-pink-400" : "bg-white/20"}`}></span>
              <span className="text-[var(--color-app-text-muted)]">──────►</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-16 text-xs text-[var(--color-app-text-muted)]">Wire q₁:</span>
              <span className="text-purple-300">|0⟩</span>
              <span className="text-[var(--color-app-text-muted)]">─────────────</span>
              <span className={`px-2 py-0.5 rounded border ${twoQubitStep >= 2 ? "bg-pink-600 text-white font-bold border-pink-400" : "bg-white/5 border-white/10"}`}>
                ⊕
              </span>
              <span className="text-[var(--color-app-text-muted)]">──────►</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-center text-xs sm:text-sm font-mono text-[var(--color-app-text-main)]">
            {twoQubitStep === 0 && "Step 0: Both qubits start initialized to |00⟩."}
            {twoQubitStep === 1 && "Step 1: H on q₀ puts wire 0 into superposition, while wire 1 remains |0⟩."}
            {twoQubitStep === 2 && "Step 2: CNOT activates across both wires, coupling their outcomes."}
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setTwoQubitStep((prev) => (prev + 1) % 3)}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs shadow-lg transition-all"
            >
              {twoQubitStep === 0 ? "Step 1: Apply H to q₀" : twoQubitStep === 1 ? "Step 2: Apply CNOT across q₀ and q₁" : "Reset Circuit"}
            </button>
          </div>

          <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-500/20 text-blue-200 text-xs text-center">
            💡 <strong>Multi-Wire Interaction:</strong> Quantum algorithms operate by orchestrating both single-wire rotations
            and multi-wire interactions to manipulate collective quantum states!
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 14 — GATE COMPARISON TABLE                                        */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Section 14 · Reference
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Comprehensive Gate Palette</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Quantum Gate Comparison Matrix
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10 text-[var(--color-app-text-muted)] uppercase tracking-wider text-[11px]">
                <th className="p-3">Gate</th>
                <th className="p-3">Qubits</th>
                <th className="p-3">Core Intuition</th>
                <th className="p-3">Main Action</th>
                <th className="p-3">Reversible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="p-3 font-bold text-red-400">X</td>
                <td className="p-3">1</td>
                <td className="p-3">Swaps |0⟩ and |1⟩</td>
                <td className="p-3 text-[var(--color-app-text-light)]">180° rotation around X-axis</td>
                <td className="p-3 text-emerald-400 font-bold">Yes (Self-inverse)</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-green-400">Y</td>
                <td className="p-3">1</td>
                <td className="p-3">Bit flip + phase change</td>
                <td className="p-3 text-[var(--color-app-text-light)]">180° rotation around Y-axis</td>
                <td className="p-3 text-emerald-400 font-bold">Yes (Self-inverse)</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-purple-400">Z</td>
                <td className="p-3">1</td>
                <td className="p-3">Flips relative phase of |1⟩</td>
                <td className="p-3 text-[var(--color-app-text-light)]">180° rotation around Z-axis</td>
                <td className="p-3 text-emerald-400 font-bold">Yes (Self-inverse)</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-blue-400">H</td>
                <td className="p-3">1</td>
                <td className="p-3">Basis ↔ Superposition</td>
                <td className="p-3 text-[var(--color-app-text-light)]">Swaps X and Z axes (180° around (X+Z)/√2)</td>
                <td className="p-3 text-emerald-400 font-bold">Yes (Self-inverse)</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-yellow-400">S</td>
                <td className="p-3">1</td>
                <td className="p-3">Phase rotation (√Z)</td>
                <td className="p-3 text-[var(--color-app-text-light)]">90° rotation around Z-axis</td>
                <td className="p-3 text-emerald-400 font-bold">Yes (Inverse S†)</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-orange-400">T</td>
                <td className="p-3">1</td>
                <td className="p-3">Fine phase rotation (⁴√Z)</td>
                <td className="p-3 text-[var(--color-app-text-light)]">45° rotation around Z-axis</td>
                <td className="p-3 text-emerald-400 font-bold">Yes (Inverse T†)</td>
              </tr>
              <tr className="bg-pink-950/20">
                <td className="p-3 font-bold text-pink-400">CNOT</td>
                <td className="p-3">2</td>
                <td className="p-3">Conditional target flip</td>
                <td className="p-3 text-pink-300">Flips target wire if control wire is |1⟩</td>
                <td className="p-3 text-emerald-400 font-bold">Yes (Self-inverse)</td>
              </tr>
              <tr className="bg-cyan-950/20">
                <td className="p-3 font-bold text-cyan-400">SWAP</td>
                <td className="p-3">2</td>
                <td className="p-3">Exchanges two qubit states</td>
                <td className="p-3 text-cyan-300">Exchanges states between wire q₀ and wire q₁</td>
                <td className="p-3 text-emerald-400 font-bold">Yes (Self-inverse)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 15 — MATRIX VIEW                                                 */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Section 15 · Mathematical Formalism
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Unitary Matrices</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Matrix View: Gates as Linear Transformations
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            Now that you have experienced how gates operate, quantum mechanics formalizes these transformations as <strong>unitary matrices</strong>.
            A single-qubit gate is represented by a 2 × 2 matrix acting on the state vector:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-center text-xs">
            <div className="p-4 rounded-xl bg-black/30 border border-red-500/30">
              <div className="text-red-400 font-bold mb-2">Pauli-X</div>
              <MathHTMLContainer html="$$X = \begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}$$" />
            </div>

            <div className="p-4 rounded-xl bg-black/30 border border-green-500/30">
              <div className="text-green-400 font-bold mb-2">Pauli-Y</div>
              <MathHTMLContainer html="$$Y = \begin{pmatrix} 0 & -i \\ i & 0 \end{pmatrix}$$" />
            </div>

            <div className="p-4 rounded-xl bg-black/30 border border-purple-500/30">
              <div className="text-purple-400 font-bold mb-2">Pauli-Z</div>
              <MathHTMLContainer html="$$Z = \begin{pmatrix} 1 & 0 \\ 0 & -1 \end{pmatrix}$$" />
            </div>

            <div className="p-4 rounded-xl bg-black/30 border border-blue-500/30">
              <div className="text-blue-400 font-bold mb-2">Hadamard</div>
              <MathHTMLContainer html="$$H = \frac{1}{\sqrt{2}}\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$$" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-xs text-[var(--color-app-text-muted)]">
            A matrix U is <strong>unitary</strong> if U†U = I, which guarantees that the length of the state vector
            (the sum of probabilities |α|² + |β|² = 1) is always strictly conserved.
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 16 — FINAL GATE EXPERIMENT (SIMULATOR HANDOFF)                    */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-primary)]/40 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-[var(--color-app-primary)]/20 text-[var(--color-app-primary)] border border-[var(--color-app-primary)]/30">
            Section 16 · Real Quantum Experiment
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Quantiva Simulator Bridge</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-3">
          Final Gate Experiment: Test It in the Simulator
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed mb-6">
          Take what you have learned and execute live quantum circuits in Quantiva's Circuit Simulator.
          Choose a pre-configured gate sequence below to preload it directly into the simulator:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-black/40 border border-blue-500/30 flex flex-col justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">Experiment 1: Single-Qubit Composition</div>
              <div className="text-sm font-bold text-white font-mono mb-2">|0⟩ → H → Z → H → Measure</div>
              <p className="text-xs text-[var(--color-app-text-muted)] leading-relaxed">
                Verify empirically that the sequence H-Z-H behaves identically to Pauli-X, yielding an outcome of 1 with 100% probability.
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
              <div className="text-xs font-bold uppercase tracking-wider text-pink-400 mb-1">Experiment 2: Two-Qubit Multi-Wire</div>
              <div className="text-sm font-bold text-white font-mono mb-2">H on q₀ + CNOT(q₀ → q₁) + Measure</div>
              <p className="text-xs text-[var(--color-app-text-muted)] leading-relaxed">
                Witness multi-qubit gate interactions across two wires in the simulator with live density matrix and sampling views.
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
          Module Summary: The Language of Quantum Computation
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[var(--color-app-text-muted)] leading-relaxed mb-8">
          <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-2">
            <h4 className="font-bold text-emerald-400 uppercase text-[11px]">Core Operational Rules</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>A quantum gate is a unitary operation that transforms quantum states without collapsing them.</li>
              <li><strong>X</strong> swaps basis states |0⟩ and |1⟩ (180° rotation around X-axis).</li>
              <li><strong>Y</strong> rotates 180° around the Y-axis of the Bloch sphere (Y|0⟩ = i|1⟩).</li>
              <li><strong>Z</strong> flips relative phase without altering computational-basis measurement probabilities.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-2">
            <h4 className="font-bold text-cyan-400 uppercase text-[11px]">Composition & Multi-Qubit Systems</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>H</strong> connects basis states with equal superpositions (H² = I).</li>
              <li><strong>S & T</strong> perform fine-grained phase rotations of 90° and 45° around Z.</li>
              <li><strong>CNOT</strong> lets control wire q₀ conditionally flip target wire q₁.</li>
              <li><strong>SWAP</strong> exchanges quantum states between two wires.</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
          <div>
            <div className="text-sm font-bold text-emerald-300 mb-1">
              {isCompleted ? "✓ Milestone Already Completed" : "Ready to complete Module 7?"}
            </div>
            <div className="text-xs text-[var(--color-app-text-muted)]">
              Next in the curriculum: <strong>Module 8 — Quantum Circuits</strong> (assembling gates into temporal algorithms).
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
            {isCompleted ? "✓ Completed" : "Complete Module 7"}
          </button>
        </div>
      </section>
    </div>
  );
}
