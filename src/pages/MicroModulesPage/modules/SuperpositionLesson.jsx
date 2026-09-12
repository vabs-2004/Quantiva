import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import MathHTMLContainer from "../../../components/MathHTMLContainer/MathHTMLContainer";
import StateProbabilityHeatmap from "../../../components/StateProbabilityHeatmap/StateProbabilityHeatmap";
import BlochSphere3D from "../../../components/BlochSphereViewer/BlochSphere3D";

// --- Mathematical Helper Functions for Single-Qubit Complex States ---
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

export default function SuperpositionLesson({ onComplete, isCompleted, onAskQuantiva }) {
  const navigate = useNavigate();

  // --- SECTION 1: Classical Bit vs Quantum Qubit ---
  const [sec1ClassicalBit, setSec1ClassicalBit] = useState(0);
  const [sec1Reveal, setSec1Reveal] = useState(false);

  // --- SECTION 2: Building Superposition ---
  const [sec2AppliedH, setSec2AppliedH] = useState(false);

  // --- SECTION 3: Superposition Explorer ---
  const [sec3Preset, setSec3Preset] = useState("plus");
  const [sec3Theta, setSec3Theta] = useState(Math.PI / 2); // 0 to pi
  const [sec3Phi, setSec3Phi] = useState(0); // 0 to 2pi

  const sec3State = useMemo(() => {
    let theta = sec3Theta;
    let phi = sec3Phi;
    let label = "Custom Superposition";

    if (sec3Preset === "0") {
      theta = 0; phi = 0; label = "|0⟩";
    } else if (sec3Preset === "1") {
      theta = Math.PI; phi = 0; label = "|1⟩";
    } else if (sec3Preset === "plus") {
      theta = Math.PI / 2; phi = 0; label = "|+⟩";
    } else if (sec3Preset === "minus") {
      theta = Math.PI / 2; phi = Math.PI; label = "|−⟩";
    }

    const half = theta / 2;
    const ar = Math.cos(half);
    const ai = 0;
    const br = Math.sin(half) * Math.cos(phi);
    const bi = Math.sin(half) * Math.sin(phi);

    const p0 = Math.max(0, Math.min(1, ar * ar + ai * ai));
    const p1 = Math.max(0, Math.min(1, br * br + bi * bi));

    return { ar, ai, br, bi, theta, phi, label, p0, p1 };
  }, [sec3Preset, sec3Theta, sec3Phi]);

  // --- SECTION 4: Unequal Superposition ---
  const [sec4Ratio, setSec4Ratio] = useState(0.8); // p0 = 0.8, p1 = 0.2
  const sec4State = useMemo(() => {
    const ar = Math.sqrt(sec4Ratio);
    const br = Math.sqrt(1 - sec4Ratio);
    const bloch = stateToBloch(ar, 0, br, 0);
    return {
      ar, ai: 0, br, bi: 0,
      p0: sec4Ratio,
      p1: 1 - sec4Ratio,
      theta: bloch.theta,
      phi: bloch.phi,
    };
  }, [sec4Ratio]);

  // --- SECTION 6: |+⟩ vs |−⟩ ---
  const [sec6Active, setSec6Active] = useState("plus"); // 'plus' or 'minus'
  const sec6Data = useMemo(() => {
    const isPlus = sec6Active === "plus";
    const sq2 = Math.SQRT2;
    const ar = 1 / sq2;
    const br = isPlus ? 1 / sq2 : -1 / sq2;
    const bloch = stateToBloch(ar, 0, br, 0);
    return {
      label: isPlus ? "|+⟩" : "|−⟩",
      ar, ai: 0, br, bi: 0,
      p0: 0.5, p1: 0.5,
      phase: isPlus ? "0 (in-phase)" : "π (out-of-phase)",
      theta: bloch.theta,
      phi: bloch.phi,
    };
  }, [sec6Active]);

  // --- SECTION 8: Change the Superposition ---
  const [sec8Gate, setSec8Gate] = useState("none"); // none, H, X, Z, S
  const sec8State = useMemo(() => {
    const sq2 = Math.SQRT2;
    let curr = { ar: 1 / sq2, ai: 0, br: 1 / sq2, bi: 0, label: "|+⟩" };
    if (sec8Gate === "H") {
      curr = { ar: 1, ai: 0, br: 0, bi: 0, label: "|0⟩" };
    } else if (sec8Gate === "X") {
      curr = { ar: 1 / sq2, ai: 0, br: 1 / sq2, bi: 0, label: "|+⟩" };
    } else if (sec8Gate === "Z") {
      curr = { ar: 1 / sq2, ai: 0, br: -1 / sq2, bi: 0, label: "|−⟩" };
    } else if (sec8Gate === "S") {
      curr = { ar: 1 / sq2, ai: 0, br: 0, bi: 1 / sq2, label: "|+i⟩" };
    }
    const bloch = stateToBloch(curr.ar, curr.ai, curr.br, curr.bi);
    const p0 = Math.max(0, Math.min(1, curr.ar * curr.ar + curr.ai * curr.ai));
    const p1 = Math.max(0, Math.min(1, curr.br * curr.br + curr.bi * curr.bi));
    return { ...curr, theta: bloch.theta, phi: bloch.phi, p0, p1 };
  }, [sec8Gate]);

  // --- SECTION 10: Measurement Experiment ---
  const [sec10Target, setSec10Target] = useState("plus"); // "0" or "plus"
  const [sec10Results, setSec10Results] = useState({ shots: 0, c0: 0, c1: 0 });
  const [sec10Animating, setSec10Animating] = useState(false);

  const runSec10Experiment = (numShots) => {
    if (sec10Animating) return;
    setSec10Animating(true);
    setTimeout(() => {
      const prob0 = sec10Target === "0" ? 1.0 : 0.5;
      let c0 = 0;
      for (let s = 0; s < numShots; s++) {
        if (Math.random() < prob0) c0++;
      }
      const c1 = numShots - c0;
      setSec10Results({ shots: numShots, c0, c1 });
      setSec10Animating(false);
    }, 150);
  };

  // --- SECTION 11: Predict Before Measuring ---
  const [sec11Choice, setSec11Choice] = useState(null);
  const [sec11Ran, setSec11Ran] = useState(false);
  const [sec11Counts, setSec11Counts] = useState({ c0: 0, c1: 0, total: 0 });

  const runSec11Experiment = () => {
    // State: sqrt(3)/2 |0⟩ + 1/2 |1⟩ -> P(0) = 3/4 = 75%
    let c0 = 0;
    const total = 100;
    for (let i = 0; i < total; i++) {
      if (Math.random() < 0.75) c0++;
    }
    setSec11Counts({ c0, c1: total - c0, total });
    setSec11Ran(true);
  };

  // --- SECTION 12: Superposition Under Different Gates ---
  const [sec12Gate, setSec12Gate] = useState("Z"); // X, Z, H, S, T
  const sec12State = useMemo(() => {
    const sq2 = Math.SQRT2;
    // initial state is |+⟩
    const res = applySingleGate(sec12Gate, 1 / sq2, 0, 1 / sq2, 0);
    const bloch = stateToBloch(res.ar, res.ai, res.br, res.bi);
    const p0 = Math.max(0, Math.min(1, res.ar * res.ar + res.ai * res.ai));
    const p1 = Math.max(0, Math.min(1, res.br * res.br + res.bi * res.bi));
    return {
      ar: res.ar, ai: res.ai, br: res.br, bi: res.bi,
      theta: bloch.theta, phi: bloch.phi,
      p0, p1,
    };
  }, [sec12Gate]);

  // --- SECTION 13: Interference Teaser ---
  const [sec13Step, setSec13Step] = useState(0); // 0: |0⟩, 1: after H1 (|+⟩), 2: after H2 (|0⟩)

  // --- SECTION 14: Challenge Lab ---
  const [chalActive, setChalActive] = useState(1);
  const [chal1Gate, setChal1Gate] = useState("none");
  const [chal2P0, setChal2P0] = useState(0.5); // slider
  const [chal3Gates, setChal3Gates] = useState([]);
  const [chal4Gate, setChal4Gate] = useState("none");
  const [chal5Gates, setChal5Gates] = useState([]);

  // --- SECTION 15: Classical Mixture vs Superposition Experiment ---
  const [sec15Mode, setSec15Mode] = useState("z_basis"); // "z_basis" or "h_test"
  const [sec15Data, setSec15Data] = useState(null);
  const [sec15Running, setSec15Running] = useState(false);

  const runSec15Experiment = useCallback(() => {
    setSec15Running(true);
    setTimeout(() => {
      const shots = 200;
      let mix0 = 0, mix1 = 0;
      let q0 = 0, q1 = 0;

      if (sec15Mode === "z_basis") {
        // Direct computational measurement:
        // Classical mixture: randomly prepare |0⟩ (50%) or |1⟩ (50%)
        for (let i = 0; i < shots; i++) {
          const prep = Math.random() < 0.5 ? 0 : 1;
          if (prep === 0) mix0++; else mix1++;
        }
        // Quantum superposition |+⟩: 50% chance of 0 or 1
        for (let i = 0; i < shots; i++) {
          if (Math.random() < 0.5) q0++; else q1++;
        }
      } else {
        // Apply Hadamard H before measurement:
        // Classical mixture:
        // 50% prepared as |0⟩ -> H|0⟩ = |+⟩ -> 50% 0, 50% 1
        // 50% prepared as |1⟩ -> H|1⟩ = |−⟩ -> 50% 0, 50% 1
        // Overall mixture still produces 50/50!
        for (let i = 0; i < shots; i++) {
          const prep = Math.random() < 0.5 ? 0 : 1;
          // Whether |0⟩ or |1⟩ was prepared, H turns it into |+⟩ or |−⟩, both having 50% prob of 0
          if (Math.random() < 0.5) mix0++; else mix1++;
        }
        // Quantum superposition:
        // Every single run prepares |+⟩!
        // Applying H to |+⟩: H|+⟩ = |0⟩ deterministically!
        // 100% of measurements yield 0, 0% yield 1!
        for (let i = 0; i < shots; i++) {
          q0++;
        }
      }

      setSec15Data({
        shots,
        mix0, mix1,
        q0, q1,
      });
      setSec15Running(false);
    }, 180);
  }, [sec15Mode]);

  // --- SECTION 16: Free Superposition Lab ---
  const [labPreset, setLabPreset] = useState("plus");
  const [labAlpha, setLabAlpha] = useState(1 / Math.SQRT2);
  const [labBeta, setLabBeta] = useState(1 / Math.SQRT2);
  const [labAppliedGates, setLabAppliedGates] = useState([]);
  const [labShotResult, setLabShotResult] = useState(null);

  const freeLabState = useMemo(() => {
    let curr = { ar: labAlpha, ai: 0, br: labBeta, bi: 0 };
    for (const g of labAppliedGates) {
      curr = applySingleGate(g, curr.ar, curr.ai, curr.br, curr.bi);
    }
    const bloch = stateToBloch(curr.ar, curr.ai, curr.br, curr.bi);
    const p0 = Math.max(0, Math.min(1, curr.ar * curr.ar + curr.ai * curr.ai));
    const p1 = Math.max(0, Math.min(1, curr.br * curr.br + curr.bi * curr.bi));
    return { ...curr, theta: bloch.theta, phi: bloch.phi, p0, p1 };
  }, [labAlpha, labBeta, labAppliedGates]);

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">
      {/* ========================================================================= */}
      {/* SECTION 1 — THE QUESTION: IS A QUBIT 0, 1, OR SOMETHING ELSE?             */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Section 1 · Foundations Concept
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Conceptual Anchor</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-2">
          The Question: Is a Qubit 0, 1, or Something Else?
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] mb-6 leading-relaxed">
          In classical computing, a bit is physically fixed as either 0 or 1 at any given moment.
          Even if a coin is flipped and hidden under a cup, the coin is already definitely heads or tails—you
          simply lack knowledge of it. Does a quantum superposition mean the qubit is secretly 0 or 1?
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl bg-black/30 border border-white/5">
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold text-indigo-300 uppercase">
              Classical Bit: Definite Reality
            </h4>
            <p className="text-xs text-[var(--color-app-text-muted)]">
              Toggle the classical switch. At all times, its value is 100% determined.
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSec1ClassicalBit(0)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                  sec1ClassicalBit === 0 ? "bg-indigo-600 text-white shadow-lg" : "bg-white/5 text-[var(--color-app-text-muted)]"
                }`}
              >
                State 0
              </button>
              <button
                onClick={() => setSec1ClassicalBit(1)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                  sec1ClassicalBit === 1 ? "bg-indigo-600 text-white shadow-lg" : "bg-white/5 text-[var(--color-app-text-muted)]"
                }`}
              >
                State 1
              </button>
            </div>
            <div className="p-3 rounded-lg bg-black/50 border border-white/10 font-mono text-xs text-indigo-200">
              Current Value: <strong>{sec1ClassicalBit}</strong> (No intermediate states exist)
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold text-purple-300 uppercase">
              Quantum Qubit: Superposition State
            </h4>
            <p className="text-xs text-[var(--color-app-text-muted)]">
              A qubit state is a linear combination of basis states with complex weights:
            </p>
            <MathHTMLContainer html="$$|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$$" />
            <button
              onClick={() => setSec1Reveal(!sec1Reveal)}
              className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all"
            >
              {sec1Reveal ? "Hide Insight" : "Does this mean it's secretly 0 or 1?"}
            </button>
            {sec1Reveal && (
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs text-purple-200 space-y-2 leading-relaxed animate-fadeIn">
                <div className="font-bold text-purple-300">Crucial Conceptual Anchor:</div>
                <div>
                  <strong>No.</strong> A quantum superposition is <em>not</em> simply classical uncertainty about an already-existing 0 or 1.
                  The state vector |ψ⟩ is itself the complete, deterministic physical description of the qubit before observation!
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2 — BUILDING A SUPERPOSITION                                      */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Section 2 · State Transformation
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Creating |+⟩</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-2">
          Building a Superposition: |0⟩ ── H ── |+⟩
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] mb-6 leading-relaxed">
          How do we create a superposition? In quantum computing, we pass a definite basis state like |0⟩
          through a Hadamard (H) gate. The transformation creates an equal superposition known as the |+⟩ state:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl bg-black/30 border border-blue-500/30 items-center">
          <div className="space-y-4">
            <div className="text-xs font-mono text-blue-400 font-bold uppercase">Circuit Operation</div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-black/50 border border-white/10 font-mono text-sm">
              <span className="text-zinc-400">|0⟩</span>
              <span className="text-zinc-600">──</span>
              <button
                onClick={() => setSec2AppliedH(!sec2AppliedH)}
                className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                  sec2AppliedH
                    ? "bg-blue-600 text-white border-blue-400 shadow-lg"
                    : "bg-white/10 hover:bg-white/20 text-blue-300 border-white/20"
                }`}
              >
                [ H ]
              </button>
              <span className="text-zinc-600">──</span>
              <span className="text-blue-300 font-bold">{sec2AppliedH ? "|+⟩" : "|0⟩"}</span>
            </div>

            <div className="text-xs text-[var(--color-app-text-muted)]">
              Click the [ H ] gate to apply or remove the Hadamard transformation.
            </div>

            <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs text-blue-200 space-y-1">
              <div className="font-bold">Important Discovery:</div>
              <div>
                {sec2AppliedH
                  ? "50/50 measurement probabilities do not mean the qubit was randomly 0 or 1 before measurement. Both amplitudes are active simultaneously."
                  : "Currently in definite ground state |0⟩ with 100% probability of measuring 0."}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
              <div className="text-xs font-mono text-zinc-400">Mathematical State:</div>
              {sec2AppliedH ? (
                <MathHTMLContainer html="$$|+\rangle = \frac{|0\rangle + |1\rangle}{\sqrt{2}} = \frac{1}{\sqrt{2}}|0\rangle + \frac{1}{\sqrt{2}}|1\rangle$$" />
              ) : (
                <MathHTMLContainer html="$$|\psi\rangle = 1|0\rangle + 0|1\rangle = |0\rangle$$" />
              )}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                  <span className="text-zinc-400">P(0): </span>
                  <span className="text-blue-300 font-bold">{sec2AppliedH ? "50%" : "100%"}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                  <span className="text-zinc-400">P(1): </span>
                  <span className="text-purple-300 font-bold">{sec2AppliedH ? "50%" : "0%"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3 — SUPERPOSITION EXPLORER                                        */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-cyan-500/40 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Section 3 · Primary Workbench
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">State, Probabilities & Geometry</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-2">
          Superposition Explorer
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] mb-6">
          Manipulate a normalized qubit state. Watch the state equation, measurement probabilities, and 3D Bloch
          vector update in lockstep!
        </p>

        {/* Presets */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <span className="text-xs text-[var(--color-app-text-muted)]">Presets:</span>
          {[
            { id: "0", label: "|0⟩" },
            { id: "1", label: "|1⟩" },
            { id: "plus", label: "|+⟩" },
            { id: "minus", label: "|−⟩" },
            { id: "custom", label: "Custom Real" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSec3Preset(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                sec3Preset === item.id
                  ? "bg-cyan-600 text-white shadow-lg"
                  : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls & Math */}
          <div className="lg:col-span-7 space-y-5">
            {sec3Preset === "custom" && (
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[var(--color-app-text-muted)]">Polar Angle θ (Weights):</span>
                    <span className="text-cyan-300 font-bold">{(sec3Theta * 180 / Math.PI).toFixed(0)}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.PI}
                    step="0.02"
                    value={sec3Theta}
                    onChange={(e) => setSec3Theta(parseFloat(e.target.value))}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>|0⟩ (0°)</span>
                    <span>Equal Superposition (90°)</span>
                    <span>|1⟩ (180°)</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[var(--color-app-text-muted)]">Azimuthal Phase φ:</span>
                    <span className="text-indigo-300 font-bold">{(sec3Phi * 180 / Math.PI).toFixed(0)}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={2 * Math.PI}
                    step="0.05"
                    value={sec3Phi}
                    onChange={(e) => setSec3Phi(parseFloat(e.target.value))}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-3 font-mono text-xs">
              <div className="text-cyan-300 font-bold text-sm">{sec3State.label}</div>
              <div>α (weight on |0⟩) = {formatComplex(sec3State.ar, sec3State.ai)}</div>
              <div>β (weight on |1⟩) = {formatComplex(sec3State.br, sec3State.bi)}</div>
              <div className="text-[11px] text-[var(--color-app-text-muted)]">
                Normalization: |α|² + |β|² = {(sec3State.p0 + sec3State.p1).toFixed(3)}
              </div>
            </div>

            {/* Probability Visualizer */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
              <div className="text-xs font-mono font-bold text-[var(--color-app-text-muted)]">
                Measurement Probability Distribution
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span>P(0): {(sec3State.p0 * 100).toFixed(1)}%</span>
                  <span>|α|²</span>
                </div>
                <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 transition-all duration-200"
                    style={{ width: `${sec3State.p0 * 100}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs font-mono pt-1">
                  <span>P(1): {(sec3State.p1 * 100).toFixed(1)}%</span>
                  <span>|β|²</span>
                </div>
                <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-200"
                    style={{ width: `${sec3State.p1 * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3D Bloch Sphere */}
          <div className="lg:col-span-5 h-80 rounded-2xl bg-black/60 border border-white/10 overflow-hidden flex flex-col items-center justify-center relative">
            <Canvas camera={{ position: [2.5, 2, 3], fov: 45 }}>
              <ambientLight intensity={0.8} />
              <pointLight position={[5, 5, 5]} intensity={0.8} />
              <BlochSphere3D theta={sec3State.theta} phi={sec3State.phi} />
              <OrbitControls enablePan={false} enableZoom={false} />
            </Canvas>
            <div className="absolute bottom-3 left-3 right-3 text-center text-[10px] font-mono text-[var(--color-app-text-muted)] bg-black/60 py-1 rounded-md border border-white/5">
              θ: {(sec3State.theta * 180 / Math.PI).toFixed(0)}° | φ: {(sec3State.phi * 180 / Math.PI).toFixed(0)}°
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4 — SUPERPOSITION IS NOT JUST "50/50"                             */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Section 4 · Core Concept
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Unequal Weights</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-2">
          Superposition Is Not Just "50/50"
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] mb-6 leading-relaxed">
          A frequent beginner misconception is assuming superposition always means an even 50/50 split.
          In reality, a qubit can be in a superposition with <strong>any</strong> combination of amplitudes as long
          as |α|² + |β|² = 1!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl bg-black/30 border border-amber-500/30 items-center">
          <div className="space-y-4">
            <div className="text-xs font-mono font-bold text-amber-400 uppercase">
              Unequal Amplitudes Slider
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--color-app-text-muted)]">Probability P(0):</span>
                <span className="text-amber-300 font-bold">{(sec4State.p0 * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.95"
                step="0.05"
                value={sec4Ratio}
                onChange={(e) => setSec4Ratio(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>P(0) = 5%</span>
                <span>50/50</span>
                <span>P(0) = 95%</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-2 text-xs font-mono">
              <div>α = √({sec4State.p0.toFixed(2)}) ≈ {sec4State.ar.toFixed(3)}</div>
              <div>β = √({sec4State.p1.toFixed(2)}) ≈ {sec4State.br.toFixed(3)}</div>
              <div className="text-emerald-400 font-bold pt-2 border-t border-white/10">
                Is this still a superposition? YES!
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-3 text-xs leading-relaxed text-amber-200">
            <h4 className="font-bold text-amber-300 text-sm">Key Takeaway:</h4>
            <p>
              Superposition describes a linear combination of basis vectors in Hilbert space.
              The coefficients α and β can continuously vary.
            </p>
            <p>
              For example, \(|\psi\rangle = \sqrt{0.8}|0\rangle + \sqrt{0.2}|1\rangle\) gives an 80% chance of 0 and a 20%
              chance of 1. It is just as much a valid quantum superposition as \(|+\rangle\)!
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5 — CLASSICAL MIXTURE VS QUANTUM SUPERPOSITION                     */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-emerald-500/40">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Section 5 · Critical Distinction
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Conceptual Comparison</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-2">
          Classical Mixture vs Quantum Superposition
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] mb-6 leading-relaxed">
          Compare two different scenarios that both produce 50% 0 and 50% 1 when measured in the standard basis:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl bg-black/40 border border-zinc-700 space-y-4">
            <div className="text-xs font-mono font-bold text-zinc-400 uppercase">Preparation A: Classical Mixture</div>
            <div className="text-xs text-[var(--color-app-text-muted)] leading-relaxed">
              On every shot, a random classical coin toss chooses to prepare <strong>either</strong> definite |0⟩ or definite |1⟩:
            </div>
            <div className="p-3 rounded-lg bg-black/60 border border-white/5 text-xs font-mono text-zinc-300">
              50% runs: prepare |0⟩<br />
              50% runs: prepare |1⟩
            </div>
            <div className="text-xs text-zinc-400">
              Measurement outcome: <strong>50% 0, 50% 1</strong>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-4">
            <div className="text-xs font-mono font-bold text-emerald-400 uppercase">Preparation B: Quantum Superposition</div>
            <div className="text-xs text-[var(--color-app-text-muted)] leading-relaxed">
              On every shot, the exact same pure quantum state |+⟩ is prepared:
            </div>
            <MathHTMLContainer html="$$|+\rangle = \frac{|0\rangle + |1\rangle}{\sqrt{2}}$$" />
            <div className="text-xs text-emerald-300 font-bold">
              Measurement outcome: <strong>50% 0, 50% 1</strong>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-black/40 border border-emerald-500/30 text-xs text-[var(--color-app-text-muted)] leading-relaxed">
          <span className="font-bold text-emerald-300">The Big Question: </span>
          If their computational-basis probabilities look identical, are these two situations physically the same?
          <span className="font-bold text-white"> No. </span>
          In Section 15, we will prove this experimentally by applying a quantum operation to each before measurement!
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6 — |+⟩ VS |−⟩                                                    */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/30">
            Section 6 · Relative Phase
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Orthogonal Superpositions</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-2">
          |+⟩ vs |−⟩: Same Probabilities, Different States
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] mb-6 leading-relaxed">
          Look at |+⟩ and |−⟩. In the computational basis, both have exactly P(0) = 50% and P(1) = 50%.
          Why are they completely different, orthogonal states?
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 rounded-xl bg-black/30 border border-pink-500/30">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSec6Active("plus")}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
                  sec6Active === "plus" ? "bg-pink-600 text-white shadow-lg" : "bg-white/5 text-zinc-400"
                }`}
              >
                Inspect |+⟩ State
              </button>
              <button
                onClick={() => setSec6Active("minus")}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
                  sec6Active === "minus" ? "bg-pink-600 text-white shadow-lg" : "bg-white/5 text-zinc-400"
                }`}
              >
                Inspect |−⟩ State
              </button>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-3">
              {sec6Active === "plus" ? (
                <MathHTMLContainer html="$$|+\rangle = \frac{|0\rangle + |1\rangle}{\sqrt{2}}$$" />
              ) : (
                <MathHTMLContainer html="$$|-\rangle = \frac{|0\rangle - |1\rangle}{\sqrt{2}}$$" />
              )}
              <div className="text-xs font-mono text-pink-300">
                Relative Phase: <strong>{sec6Data.phase}</strong>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-2 border-t border-white/10">
                <div>P(0) = 50%</div>
                <div>P(1) = 50%</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-pink-950/20 border border-pink-500/30 text-xs text-pink-200">
              <strong>Takeaway: </strong> Measurement probabilities in a single basis do <em>not</em> completely characterize a quantum state!
            </div>
          </div>

          <div className="h-64 rounded-xl bg-black/60 border border-white/10 overflow-hidden flex flex-col items-center justify-center relative">
            <Canvas camera={{ position: [2.5, 2, 3], fov: 45 }}>
              <ambientLight intensity={0.8} />
              <pointLight position={[5, 5, 5]} intensity={0.8} />
              <BlochSphere3D theta={sec6Data.theta} phi={sec6Data.phi} />
              <OrbitControls enablePan={false} enableZoom={false} />
            </Canvas>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7 — SUPERPOSITION HAS STRUCTURE                                   */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
            Section 7 · Interpretation
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Amplitudes as Weights</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-2">
          Superposition Has Structure
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] mb-6 leading-relaxed">
          The quantum state vector is structured as a superposition of distinct basis components:
        </p>

        <div className="p-6 rounded-xl bg-black/30 border border-white/5 flex flex-col md:flex-row items-center justify-around gap-6 text-center font-mono">
          <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-500/30 w-full md:w-1/3">
            <div className="text-sm font-bold text-teal-300 mb-1">State Vector |ψ⟩</div>
            <div className="text-xs text-[var(--color-app-text-muted)]">Total Quantum State</div>
          </div>
          <div className="text-2xl text-teal-400">═══▶</div>
          <div className="flex flex-col gap-3 w-full md:w-1/2">
            <div className="p-3 rounded-lg bg-black/60 border border-white/10 text-xs text-left">
              <span className="text-cyan-400 font-bold">α |0⟩ component:</span> weight on computational 0
            </div>
            <div className="p-3 rounded-lg bg-black/60 border border-white/10 text-xs text-left">
              <span className="text-purple-400 font-bold">β |1⟩ component:</span> weight on computational 1
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 8 — CHANGE THE SUPERPOSITION                                      */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/30">
            Section 8 · Dynamics
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Gate Actions</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-2">
          Change the Superposition: Transforming |+⟩ with Gates
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] mb-6 leading-relaxed">
          Quantum gates can <strong>create</strong>, <strong>transform</strong>, and <strong>remove</strong> superpositions.
          Start from |+⟩ and apply gates to observe their effects:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl bg-black/30 border border-violet-500/30 items-center">
          <div className="space-y-4">
            <div className="text-xs font-mono font-bold text-violet-400 uppercase">Apply Gate to |+⟩:</div>
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { id: "none", label: "None (|+⟩)" },
                { id: "H", label: "H Gate (H|+⟩ = |0⟩)" },
                { id: "X", label: "X Gate (X|+⟩ = |+⟩)" },
                { id: "Z", label: "Z Gate (Z|+⟩ = |−⟩)" },
                { id: "S", label: "S Gate (Phase Shift)" },
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSec8Gate(g.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    sec8Gate === g.id ? "bg-violet-600 text-white shadow-lg" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-2 text-xs font-mono">
              <div className="text-violet-300 font-bold">Current State: {sec8State.label}</div>
              <div>α = {formatComplex(sec8State.ar, sec8State.ai)}</div>
              <div>β = {formatComplex(sec8State.br, sec8State.bi)}</div>
              <div className="pt-2 border-t border-white/10 flex gap-4 text-[11px]">
                <span>P(0): {(sec8State.p0 * 100).toFixed(1)}%</span>
                <span>P(1): {(sec8State.p1 * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="h-64 rounded-xl bg-black/60 border border-white/10 overflow-hidden flex flex-col items-center justify-center relative">
            <Canvas camera={{ position: [2.5, 2, 3], fov: 45 }}>
              <ambientLight intensity={0.8} />
              <pointLight position={[5, 5, 5]} intensity={0.8} />
              <BlochSphere3D theta={sec8State.theta} phi={sec8State.phi} />
              <OrbitControls enablePan={false} enableZoom={false} />
            </Canvas>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 9 — SUPERPOSITION ON THE BLOCH SPHERE                             */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Section 9 · Geometry
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Bloch Sphere Representation</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-2">
          Superposition on the Bloch Sphere
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] mb-6 leading-relaxed">
          On the Bloch sphere, the north pole is |0⟩ and the south pole is |1⟩. Any other point on the sphere is a superposition!
        </p>

        <div className="p-6 rounded-xl bg-blue-950/20 border border-blue-500/30 text-xs text-blue-200 leading-relaxed space-y-3">
          <div className="font-bold text-blue-300 text-sm">Precise Geometric Meaning:</div>
          <p>
            <strong>States on the equator have equal-magnitude |0⟩ and |1⟩ components, with their relative phase determining where they sit around the equator.</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>|+⟩ sits on the +X axis (φ = 0).</li>
            <li>|−⟩ sits on the −X axis (φ = π).</li>
            <li>|+i⟩ sits on the +Y axis (φ = π/2).</li>
            <li>Points between the poles and equator represent unequal superpositions where one basis state dominates.</li>
          </ul>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 10 — MEASUREMENT EXPERIMENT                                       */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Section 10 · Experimentation
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Sampling Chamber</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-2">
          Measurement Experiment: Discovering the Probability Distribution
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] mb-6 leading-relaxed">
          A single measurement yields only one classical bit (0 or 1). How do we confirm that a state is in superposition?
          By repeating identical preparations and measurements across many shots:
        </p>

        <div className="p-6 rounded-xl bg-black/30 border border-emerald-500/30 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-app-text-muted)]">Prepare State:</span>
              <button
                onClick={() => { setSec10Target("0"); setSec10Results({ shots: 0, c0: 0, c1: 0 }); }}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                  sec10Target === "0" ? "bg-emerald-600 text-white" : "bg-white/5 text-zinc-400"
                }`}
              >
                |0⟩ (Basis State)
              </button>
              <button
                onClick={() => { setSec10Target("plus"); setSec10Results({ shots: 0, c0: 0, c1: 0 }); }}
                className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                  sec10Target === "plus" ? "bg-emerald-600 text-white" : "bg-white/5 text-zinc-400"
                }`}
              >
                |+⟩ (Superposition)
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-app-text-muted)]">Run Shots:</span>
              {[10, 100, 1000].map((shots) => (
                <button
                  key={shots}
                  onClick={() => runSec10Experiment(shots)}
                  disabled={sec10Animating}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 text-xs font-mono font-bold transition-all disabled:opacity-40"
                >
                  +{shots} Shots
                </button>
              ))}
            </div>
          </div>

          {sec10Results.shots > 0 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-2 gap-4 text-center font-mono">
                <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-xs text-[var(--color-app-text-muted)]">Outcome 0 Count</div>
                  <div className="text-2xl font-bold text-cyan-300">{sec10Results.c0}</div>
                  <div className="text-xs text-zinc-500">{((sec10Results.c0 / sec10Results.shots) * 100).toFixed(1)}%</div>
                </div>
                <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                  <div className="text-xs text-[var(--color-app-text-muted)]">Outcome 1 Count</div>
                  <div className="text-2xl font-bold text-purple-300">{sec10Results.c1}</div>
                  <div className="text-xs text-zinc-500">{((sec10Results.c1 / sec10Results.shots) * 100).toFixed(1)}%</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200">
                <strong>Law of Large Numbers: </strong>
                With 10 shots, statistical fluctuations occur. At 1,000 shots, the frequency converges cleanly to the theoretical probabilities!
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 11 — PREDICT BEFORE MEASURING                                     */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Section 11 · Intuition Builder
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Predict → Run → Compare</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-2">
          Predict Before Measuring
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] mb-6 leading-relaxed">
          Consider the unequal superposition state:
        </p>

        <div className="p-4 rounded-xl bg-black/30 border border-white/5 mb-6 text-center">
          <MathHTMLContainer html="$$|\psi\rangle = \frac{\sqrt{3}}{2}|0\rangle + \frac{1}{2}|1\rangle$$" />
        </div>

        <div className="p-6 rounded-xl bg-black/30 border border-amber-500/30 space-y-4">
          <div className="text-xs font-bold text-amber-300 uppercase font-mono">
            Prediction Prompt: What fraction of measurements will produce 0?
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[25, 50, 75, 100].map((choice) => (
              <button
                key={choice}
                onClick={() => { setSec11Choice(choice); setSec11Ran(false); }}
                className={`p-3 rounded-xl font-mono font-bold text-xs transition-all ${
                  sec11Choice === choice ? "bg-amber-600 text-white shadow-lg" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                }`}
              >
                {choice}%
              </button>
            ))}
          </div>

          {sec11Choice !== null && (
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={runSec11Experiment}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold text-xs shadow-lg transition-all"
              >
                Run 100-Shot Experiment
              </button>

              {sec11Ran && (
                <div className="text-xs font-mono space-y-1 text-right">
                  <div className="text-amber-300 font-bold">Observed: {sec11Counts.c0}% Outcome 0 | {sec11Counts.c1}% Outcome 1</div>
                  <div className="text-zinc-400 text-[11px]">
                    Theory: P(0) = |√3/2|² = 3/4 = 75%. {sec11Choice === 75 ? "Your prediction was exactly right!" : "Notice how it centers around 75%!"}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 12 — SUPERPOSITION UNDER DIFFERENT GATES                          */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Section 12 · Circuit Mini-Lab
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Circuit Evolution</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-2">
          Superposition Under Different Gates
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] mb-6 leading-relaxed">
          Construct the circuit: |0⟩ ── H ── [ Gate ]. Select different gates to see how they transform the superposition:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl bg-black/30 border border-purple-500/30 items-center">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--color-app-text-muted)]">Second Gate:</span>
              {["X", "Z", "H", "S", "T"].map((g) => (
                <button
                  key={g}
                  onClick={() => setSec12Gate(g)}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                    sec12Gate === g ? "bg-purple-600 text-white shadow-lg" : "bg-white/5 text-zinc-400"
                  }`}
                >
                  [ {g} ]
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-2 text-xs font-mono">
              <div className="text-purple-300 font-bold">State after |0⟩ ── H ── {sec12Gate}:</div>
              <div>α = {formatComplex(sec12State.ar, sec12State.ai)}</div>
              <div>β = {formatComplex(sec12State.br, sec12State.bi)}</div>
              <div className="pt-2 border-t border-white/10 flex gap-4 text-[11px]">
                <span>P(0): {(sec12State.p0 * 100).toFixed(1)}%</span>
                <span>P(1): {(sec12State.p1 * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="h-64 rounded-xl bg-black/60 border border-white/10 overflow-hidden flex flex-col items-center justify-center relative">
            <Canvas camera={{ position: [2.5, 2, 3], fov: 45 }}>
              <ambientLight intensity={0.8} />
              <pointLight position={[5, 5, 5]} intensity={0.8} />
              <BlochSphere3D theta={sec12State.theta} phi={sec12State.phi} />
              <OrbitControls enablePan={false} enableZoom={false} />
            </Canvas>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 13 — INTERFERENCE TEASER                                          */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-cyan-500/40">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Section 13 · Teaser
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Amplitudes Combining</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-2">
          Interference Teaser: |0⟩ ── H ── H ── |0⟩
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] mb-6 leading-relaxed">
          If a single Hadamard creates an even 50/50 superposition, what happens if we apply a second Hadamard?
        </p>

        <div className="p-6 rounded-xl bg-black/30 border border-cyan-500/30 space-y-6">
          <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-black/50 border border-white/10 font-mono text-sm">
            <span className="text-zinc-400">|0⟩</span>
            <span>──</span>
            <span className={`px-2.5 py-1 rounded-md border font-bold ${sec13Step >= 1 ? "bg-cyan-600 text-white border-cyan-400" : "bg-white/5 border-white/10 text-zinc-500"}`}>
              H₁
            </span>
            <span>──</span>
            <span className={`px-2.5 py-1 rounded-md border font-bold ${sec13Step >= 2 ? "bg-cyan-600 text-white border-cyan-400" : "bg-white/5 border-white/10 text-zinc-500"}`}>
              H₂
            </span>
            <span>──</span>
            <span className="text-cyan-300 font-bold">
              {sec13Step === 0 ? "|0⟩ (100% 0)" : sec13Step === 1 ? "|+⟩ (50% 0, 50% 1)" : "|0⟩ (100% 0)"}
            </span>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setSec13Step(0)}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-400"
            >
              Reset
            </button>
            <button
              onClick={() => setSec13Step(1)}
              className="px-3 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/30 text-xs font-mono"
            >
              Apply First H
            </button>
            <button
              onClick={() => setSec13Step(2)}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold shadow-lg"
            >
              Apply Second H
            </button>
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-200 leading-relaxed">
            <div className="font-bold text-cyan-300 mb-1">How do two randomizing operations produce 100% certainty?</div>
            <div>
              The answer involves amplitudes and their phases: when the second H acts on |+⟩, the amplitudes on |0⟩
              reinforce, while the amplitudes on |1⟩ cancel out to zero. We will explore this full mechanism in later modules!
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 14 — SUPERPOSITION CHALLENGE LAB                                  */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-emerald-500/40">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Section 14 · Challenge Lab
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Build → Run → Understand</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-2">
          Superposition Challenge Lab
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] mb-6 leading-relaxed">
          Test your mastery by building states that meet each challenge requirement.
        </p>

        {/* Challenge Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setChalActive(n)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
                chalActive === n ? "bg-emerald-600 text-white shadow-lg" : "bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              Challenge {n}
            </button>
          ))}
        </div>

        <div className="p-6 rounded-xl bg-black/40 border border-emerald-500/30 space-y-4">
          {chalActive === 1 && (
            <div className="space-y-4">
              <div className="text-sm font-bold text-emerald-300">Challenge 1: Starting from |0⟩, create an equal superposition.</div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-400">Apply:</span>
                {["X", "Z", "H"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setChal1Gate(g)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      chal1Gate === g ? "bg-emerald-600 text-white" : "bg-white/5 text-zinc-400"
                    }`}
                  >
                    [ {g} ]
                  </button>
                ))}
              </div>
              <div className="p-3 rounded-lg bg-black/50 border border-white/5 text-xs font-mono">
                {chal1Gate === "H" ? (
                  <span className="text-emerald-400 font-bold">✓ Success! H|0⟩ = |+⟩ (Equal 50/50 superposition).</span>
                ) : (
                  <span className="text-zinc-500">Apply the gate that splits |0⟩ into equal amplitudes.</span>
                )}
              </div>
            </div>
          )}

          {chalActive === 2 && (
            <div className="space-y-4">
              <div className="text-sm font-bold text-emerald-300">
                Challenge 2: Create an unequal superposition where P(0) &gt; P(1), using the Custom State controls.
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span>Probability P(0): {(chal2P0 * 100).toFixed(0)}%</span>
                  <span>Probability P(1): {((1 - chal2P0) * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={chal2P0}
                  onChange={(e) => setChal2P0(parseFloat(e.target.value))}
                  className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
              <div className="p-3 rounded-lg bg-black/50 border border-white/5 text-xs font-mono">
                {chal2P0 > 0.5 ? (
                  <span className="text-emerald-400 font-bold">
                    ✓ Valid Solution! P(0) = {(chal2P0 * 100).toFixed(0)}% &gt; P(1) = {((1 - chal2P0) * 100).toFixed(0)}%.
                  </span>
                ) : (
                  <span className="text-amber-400">Slide P(0) above 50% to make |0⟩ more likely than |1⟩.</span>
                )}
              </div>
            </div>
          )}

          {chalActive === 3 && (
            <div className="space-y-4">
              <div className="text-sm font-bold text-emerald-300">Challenge 3: Create |−⟩ starting from |0⟩.</div>
              <div className="flex items-center gap-2">
                {["H", "Z", "X"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setChal3Gates([...chal3Gates, g])}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono font-bold text-zinc-300"
                  >
                    + Add {g}
                  </button>
                ))}
                <button
                  onClick={() => setChal3Gates([])}
                  className="px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs font-mono text-red-300"
                >
                  Clear
                </button>
              </div>
              <div className="p-3 rounded-lg bg-black/50 border border-white/5 text-xs font-mono">
                <div>Circuit: |0⟩ ── {chal3Gates.join(" ── ") || "(empty)"}</div>
                {chal3Gates.join("-") === "H-Z" || chal3Gates.join("-") === "X-H" ? (
                  <div className="text-emerald-400 font-bold pt-2">✓ Success! Created |−⟩ state.</div>
                ) : (
                  <div className="text-zinc-500 pt-2">Goal: Create equal superposition with relative phase of π.</div>
                )}
              </div>
            </div>
          )}

          {chalActive === 4 && (
            <div className="space-y-4">
              <div className="text-sm font-bold text-emerald-300">Challenge 4: Starting from |+⟩, return to |0⟩.</div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-400">Apply:</span>
                {["X", "Z", "H"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setChal4Gate(g)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                      chal4Gate === g ? "bg-emerald-600 text-white" : "bg-white/5 text-zinc-400"
                    }`}
                  >
                    [ {g} ]
                  </button>
                ))}
              </div>
              <div className="p-3 rounded-lg bg-black/50 border border-white/5 text-xs font-mono">
                {chal4Gate === "H" ? (
                  <span className="text-emerald-400 font-bold">✓ Success! H|+⟩ = H(H|0⟩) = |0⟩.</span>
                ) : (
                  <span className="text-zinc-500">Apply the gate that inverts the Hadamard transformation.</span>
                )}
              </div>
            </div>
          )}

          {chalActive === 5 && (
            <div className="space-y-4">
              <div className="text-sm font-bold text-emerald-300">
                Challenge 5: Build a circuit where superposition appears during the circuit but the final state returns deterministically to |0⟩.
              </div>
              <div className="flex items-center gap-2">
                {["H", "Z", "X"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setChal5Gates([...chal5Gates, g])}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono font-bold text-zinc-300"
                  >
                    + Add {g}
                  </button>
                ))}
                <button
                  onClick={() => setChal5Gates([])}
                  className="px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs font-mono text-red-300"
                >
                  Clear
                </button>
              </div>
              <div className="p-3 rounded-lg bg-black/50 border border-white/5 text-xs font-mono">
                <div>Circuit: |0⟩ ── {chal5Gates.join(" ── ") || "(empty)"}</div>
                {chal5Gates.length >= 2 && chal5Gates[0] === "H" && chal5Gates[chal5Gates.length - 1] === "H" && chal5Gates.length === 2 ? (
                  <div className="text-emerald-400 font-bold pt-2">
                    ✓ Success! H creates |+⟩, and second H returns state deterministically to |0⟩.
                  </div>
                ) : (
                  <div className="text-zinc-500 pt-2">Goal: Create superposition, then cancel it back to |0⟩.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 15 — SUPERPOSITION VS CLASSICAL UNCERTAINTY: THE PROOF EXPERIMENT  */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-emerald-500/50 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Section 15 · Conceptual Climax
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">The Decisive Experiment</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-2">
          Superposition vs Classical Uncertainty: The Proof Experiment
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] mb-6 leading-relaxed">
          Can subsequent quantum operations distinguish a true quantum superposition from a classical random mixture?
          Let us test them under identical conditions across 200 runs:
        </p>

        <div className="space-y-6">
          {/* Test Mode Selector */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-black/30 border border-white/10 flex-wrap">
            <span className="text-xs text-[var(--color-app-text-muted)]">Experimental Setup:</span>
            <button
              onClick={() => { setSec15Mode("z_basis"); setSec15Data(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                sec15Mode === "z_basis" ? "bg-emerald-600 text-white shadow-lg" : "bg-white/5 text-zinc-400"
              }`}
            >
              Test 1: Measure in Computational (Z) Basis
            </button>
            <button
              onClick={() => { setSec15Mode("h_test"); setSec15Data(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                sec15Mode === "h_test" ? "bg-emerald-600 text-white shadow-lg" : "bg-white/5 text-zinc-400"
              }`}
            >
              Test 2: Apply Hadamard (H) Before Measuring
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Classical Mixture Box */}
            <div className="p-5 rounded-xl bg-black/40 border border-zinc-700 space-y-3">
              <div className="text-xs font-mono font-bold text-zinc-400 uppercase">
                Preparation A: Classical Mixture
              </div>
              <div className="text-xs text-[var(--color-app-text-muted)]">
                Randomly prepares different states on different runs (50% |0⟩, 50% |1⟩).
              </div>
              {sec15Mode === "z_basis" ? (
                <div className="text-xs font-mono text-zinc-300">Circuit: [Prep 0 or 1] ── M</div>
              ) : (
                <div className="text-xs font-mono text-zinc-300">Circuit: [Prep 0 or 1] ── H ── M</div>
              )}
              {sec15Data && (
                <div className="p-3 rounded-lg bg-black/60 border border-white/5 font-mono text-xs space-y-1">
                  <div>Outcome 0: {sec15Data.mix0} / {sec15Data.shots} ({((sec15Data.mix0 / sec15Data.shots) * 100).toFixed(0)}%)</div>
                  <div>Outcome 1: {sec15Data.mix1} / {sec15Data.shots} ({((sec15Data.mix1 / sec15Data.shots) * 100).toFixed(0)}%)</div>
                </div>
              )}
            </div>

            {/* Quantum Superposition Box */}
            <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
              <div className="text-xs font-mono font-bold text-emerald-400 uppercase">
                Preparation B: Quantum Superposition
              </div>
              <div className="text-xs text-[var(--color-app-text-muted)]">
                Prepares the exact same superposition state |+⟩ on every single run.
              </div>
              {sec15Mode === "z_basis" ? (
                <div className="text-xs font-mono text-emerald-300">Circuit: |+⟩ ── M</div>
              ) : (
                <div className="text-xs font-mono text-emerald-300">Circuit: |+⟩ ── H ── M</div>
              )}
              {sec15Data && (
                <div className="p-3 rounded-lg bg-black/60 border border-white/5 font-mono text-xs space-y-1">
                  <div className="text-emerald-300 font-bold">
                    Outcome 0: {sec15Data.q0} / {sec15Data.shots} ({((sec15Data.q0 / sec15Data.shots) * 100).toFixed(0)}%)
                  </div>
                  <div>Outcome 1: {sec15Data.q1} / {sec15Data.shots} ({((sec15Data.q1 / sec15Data.shots) * 100).toFixed(0)}%)</div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-black/50 border border-white/10">
            <button
              onClick={runSec15Experiment}
              disabled={sec15Running}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs shadow-lg transition-all disabled:opacity-40"
            >
              {sec15Running ? "Running 200 Shots..." : "Execute 200-Shot Experiment"}
            </button>

            {sec15Data && (
              <div className="text-xs leading-relaxed text-emerald-200">
                {sec15Mode === "z_basis" ? (
                  <span>Both preparations produce identical ~50/50 statistics in the standard basis! Now switch to Test 2.</span>
                ) : (
                  <span className="font-bold text-emerald-300">
                    Remarkable! Applying H transforms the quantum superposition back into 100% |0⟩, while the classical mixture remains an incoherent 50/50!
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-200 leading-relaxed font-semibold">
            The experiment demonstrates that a quantum superposition is not equivalent to a classical 50/50 mixture.
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 16 — FREE SUPERPOSITION LAB                                       */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-cyan-500/40 shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Section 16 · Sandbox
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Free Exploration</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-2">
          Free Superposition Lab
        </h2>
        <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] mb-6 leading-relaxed">
          Freely prepare states, apply gates, inspect probabilities, view the Bloch sphere, and sample measurements:
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-zinc-400">Presets:</span>
              {[
                { id: "0", a: 1, b: 0, lbl: "|0⟩" },
                { id: "1", a: 0, b: 1, lbl: "|1⟩" },
                { id: "plus", a: 1 / Math.SQRT2, b: 1 / Math.SQRT2, lbl: "|+⟩" },
                { id: "minus", a: 1 / Math.SQRT2, b: -1 / Math.SQRT2, lbl: "|−⟩" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setLabPreset(p.id);
                    setLabAlpha(p.a);
                    setLabBeta(p.b);
                    setLabAppliedGates([]);
                    setLabShotResult(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    labPreset === p.id ? "bg-cyan-600 text-white" : "bg-white/5 text-zinc-400"
                  }`}
                >
                  {p.lbl}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-zinc-400">Apply Gate:</span>
              {["H", "X", "Y", "Z", "S", "T"].map((g) => (
                <button
                  key={g}
                  onClick={() => setLabAppliedGates([...labAppliedGates, g])}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-cyan-300"
                >
                  + [ {g} ]
                </button>
              ))}
              <button
                onClick={() => { setLabAppliedGates([]); setLabShotResult(null); }}
                className="px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs font-mono text-red-300"
              >
                Reset Gates
              </button>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-2 text-xs font-mono">
              <div className="text-cyan-300 font-bold">
                Sequence: {labPreset} ── {labAppliedGates.join(" ── ") || "(no gates)"}
              </div>
              <div>α = {formatComplex(freeLabState.ar, freeLabState.ai)}</div>
              <div>β = {formatComplex(freeLabState.br, freeLabState.bi)}</div>
              <div className="pt-2 border-t border-white/10 flex gap-4 text-[11px]">
                <span>P(0): {(freeLabState.p0 * 100).toFixed(1)}%</span>
                <span>P(1): {(freeLabState.p1 * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  const outcome = Math.random() < freeLabState.p0 ? 0 : 1;
                  setLabShotResult(outcome);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs shadow-lg"
              >
                Single Measurement Shot
              </button>
              {labShotResult !== null && (
                <span className="text-xs font-mono text-cyan-300 font-bold">
                  Measured Classical Bit: [ {labShotResult} ]
                </span>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 h-72 rounded-2xl bg-black/60 border border-white/10 overflow-hidden flex flex-col items-center justify-center relative">
            <Canvas camera={{ position: [2.5, 2, 3], fov: 45 }}>
              <ambientLight intensity={0.8} />
              <pointLight position={[5, 5, 5]} intensity={0.8} />
              <BlochSphere3D theta={freeLabState.theta} phi={freeLabState.phi} />
              <OrbitControls enablePan={false} enableZoom={false} />
            </Canvas>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 17 — SUMMARY & COMPLETION                                         */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)] space-y-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Section 17 · Milestone Review
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Summary & Next Steps</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)]">
          Summary: What Superposition Really Means
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-[var(--color-app-text-muted)]">
          <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-2">
            <h4 className="font-mono font-bold text-white uppercase text-[11px]">Core Principles</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>A qubit can exist in a genuine linear combination of basis states.</li>
              <li>Superposition is not simply classical uncertainty about a hidden 0 or 1.</li>
              <li>Superpositions do not have to be 50/50; amplitudes can be unequal.</li>
              <li>Amplitudes determine computational-basis measurement probabilities.</li>
              <li>States with identical computational probabilities can be completely different (like |+⟩ and |−⟩).</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-2">
            <h4 className="font-mono font-bold text-white uppercase text-[11px]">Operations & Geometry</h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>Quantum gates can create, transform, and remove superpositions.</li>
              <li>Superposition corresponds to directions on the Bloch sphere.</li>
              <li>Repeated measurements reveal the probability distribution associated with a state.</li>
              <li>Subsequent quantum operations can distinguish a superposition from a classical mixture.</li>
              <li>Superposition becomes computationally powerful when combined with quantum gates.</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
          <div>
            <div className="text-sm font-bold text-emerald-300 mb-1">
              {isCompleted ? "✓ Milestone Already Completed" : "Ready to complete Module 9?"}
            </div>
            <div className="text-xs text-[var(--color-app-text-muted)]">
              Next in the curriculum: <strong>Module 10 — Measurement & Collapse</strong> (what observation actually does to a quantum state).
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
            {isCompleted ? "✓ Completed" : "Complete Module 9"}
          </button>
        </div>
      </section>
    </div>
  );
}
