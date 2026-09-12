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

export default function MeasurementCollapseLesson({ onComplete, isCompleted, onAskQuantiva }) {
  const navigate = useNavigate();

  // =========================================================================
  // STATE MANAGEMENT ACROSS 10 SECTIONS
  // =========================================================================

  // Section 1: Prediction before first measurement
  const [sec1Prediction, setSec1Prediction] = useState(null); // 0 or 1
  const [sec1Sample, setSec1Sample] = useState(null); // 0 or 1

  // Section 2: Measurement Chamber Centerpiece
  const [chamberPreset, setChamberPreset] = useState("plus"); // "plus", "zero", "one", "minus", "custom"
  const [chamberAngle, setChamberAngle] = useState(0.5); // For custom unequal superposition (0 = |0⟩, 1 = |1⟩)
  const [chamberState, setChamberState] = useState({ ar: 1 / Math.SQRT2, ai: 0, br: 1 / Math.SQRT2, bi: 0 });
  const [chamberOutcome, setChamberOutcome] = useState(null); // null, 0, or 1
  const [chamberCollapsedState, setChamberCollapsedState] = useState(null); // { ar, ai, br, bi }
  const [chamberHistory, setChamberHistory] = useState([]);
  const [isChamberMeasuring, setIsChamberMeasuring] = useState(false);

  // Section 3: Multi-shot sampling on |+⟩
  const [shotCount, setShotCount] = useState(100);
  const [shotResults, setShotResults] = useState(null); // { count0, count1, total }

  // Section 5: Measure Twice experiment
  const [m2Step, setM2Step] = useState(0); // 0: Prepared |+⟩, 1: First Measured, 2: Second Measured
  const [m2FirstOutcome, setM2FirstOutcome] = useState(null);
  const [m2SecondOutcome, setM2SecondOutcome] = useState(null);

  // Section 6: Gate Reversibility vs Measurement Irreversibility
  const [sec6GateStep, setSec6GateStep] = useState(0); // 0: |0⟩, 1: X applied (|1⟩), 2: X undone (|0⟩)
  const [sec6MeasStep, setSec6MeasStep] = useState(0); // 0: |0⟩, 1: H applied (|+⟩), 2: Measured (0 or 1, collapsed)
  const [sec6MeasOutcome, setSec6MeasOutcome] = useState(null);

  // Section 7: Computational basis selector
  const [sec7BasisChoice, setSec7BasisChoice] = useState("plus"); // "zero", "one", "plus"
  const [sec7SampleResult, setSec7SampleResult] = useState(null);

  // Section 8: Circuit |0⟩ -> H -> Z -> M
  const [sec8Step, setSec8Step] = useState(0); // 0: |0⟩, 1: H -> |+⟩, 2: Z -> |−⟩, 3: M -> outcome
  const [sec8Outcome, setSec8Outcome] = useState(null);

  // Section 9: Prediction -> Measurement on |ψ⟩ = (√3/2)|0⟩ + (1/2)|1⟩
  const [sec9Choice, setSec9Choice] = useState(null); // "25", "50", "75", "100"
  const [sec9Submitted, setSec9Submitted] = useState(false);
  const [sec9ShotsResult, setSec9ShotsResult] = useState(null);

  // Section 10: Measurement Challenge Lab
  const [activeChallenge, setActiveChallenge] = useState(1);
  const [chQubitState, setChQubitState] = useState({ ar: 1, ai: 0, br: 0, bi: 0, label: "|0⟩" });
  const [chMeasOutcome, setChMeasOutcome] = useState(null);
  const [chSuccess, setChSuccess] = useState({ 1: false, 2: false, 3: false, 4: false });
  const [ch4Stage, setCh4Stage] = useState(0); // 0: initial, 1: superposed, 2: first meas, 3: second meas
  const [ch4FirstRes, setCh4FirstRes] = useState(null);
  const [ch4SecondRes, setCh4SecondRes] = useState(null);

  // -------------------------------------------------------------
  // HANDLERS & COMPUTATIONS
  // -------------------------------------------------------------

  // Section 2: Change Chamber Preset
  const handleChamberPresetChange = (preset) => {
    setChamberPreset(preset);
    setChamberOutcome(null);
    setChamberCollapsedState(null);
    const sq2 = Math.SQRT2;
    if (preset === "plus") {
      setChamberState({ ar: 1 / sq2, ai: 0, br: 1 / sq2, bi: 0 });
    } else if (preset === "zero") {
      setChamberState({ ar: 1, ai: 0, br: 0, bi: 0 });
    } else if (preset === "one") {
      setChamberState({ ar: 0, ai: 0, br: 1, bi: 0 });
    } else if (preset === "minus") {
      setChamberState({ ar: 1 / sq2, ai: 0, br: -1 / sq2, bi: 0 });
    } else if (preset === "custom") {
      const cosA = Math.cos((chamberAngle * Math.PI) / 2);
      const sinA = Math.sin((chamberAngle * Math.PI) / 2);
      setChamberState({ ar: cosA, ai: 0, br: sinA, bi: 0 });
    }
  };

  // Section 2: Custom Slider
  const handleCustomSliderChange = (val) => {
    setChamberAngle(val);
    setChamberPreset("custom");
    setChamberOutcome(null);
    setChamberCollapsedState(null);
    const cosA = Math.cos((val * Math.PI) / 2);
    const sinA = Math.sin((val * Math.PI) / 2);
    setChamberState({ ar: cosA, ai: 0, br: sinA, bi: 0 });
  };

  // Section 2: Execute Chamber Measurement
  const triggerChamberMeasurement = () => {
    setIsChamberMeasuring(true);
    const active = chamberCollapsedState || chamberState;
    const p0 = active.ar * active.ar + active.ai * active.ai;
    const outcome = Math.random() < p0 ? 0 : 1;

    setTimeout(() => {
      setChamberOutcome(outcome);
      const postState = outcome === 0
        ? { ar: 1, ai: 0, br: 0, bi: 0 }
        : { ar: 0, ai: 0, br: 1, bi: 0 };
      setChamberCollapsedState(postState);
      setChamberHistory((prev) => [outcome, ...prev.slice(0, 7)]);
      setIsChamberMeasuring(false);
    }, 250);
  };

  const resetChamberPreparation = () => {
    setChamberOutcome(null);
    setChamberCollapsedState(null);
  };

  // Bloch angles for current chamber state
  const chamberBlochAngles = useMemo(() => {
    const s = chamberCollapsedState || chamberState;
    return stateToBloch(s.ar, s.ai, s.br, s.bi);
  }, [chamberCollapsedState, chamberState]);

  // Chamber probabilities
  const chamberProbabilities = useMemo(() => {
    const s = chamberCollapsedState || chamberState;
    const p0 = s.ar * s.ar + s.ai * s.ai;
    const p1 = s.br * s.br + s.bi * s.bi;
    return { "0": p0, "1": p1 };
  }, [chamberCollapsedState, chamberState]);

  // Section 3: Run Multi-Shot Sampling
  const runShots = (count) => {
    setShotCount(count);
    let c0 = 0;
    for (let i = 0; i < count; i++) {
      if (Math.random() < 0.5) c0++;
    }
    setShotResults({ count0: c0, count1: count - c0, total: count });
  };

  // Section 5: Measure Twice Handlers
  const handleM2FirstMeasure = () => {
    const res = Math.random() < 0.5 ? 0 : 1;
    setM2FirstOutcome(res);
    setM2Step(1);
  };

  const handleM2SecondMeasure = () => {
    // Deterministic repeat of first measurement!
    setM2SecondOutcome(m2FirstOutcome);
    setM2Step(2);
  };

  const resetM2Experiment = () => {
    setM2Step(0);
    setM2FirstOutcome(null);
    setM2SecondOutcome(null);
  };

  // Section 8: Circuit Stepper Handlers
  const advanceSec8 = () => {
    if (sec8Step === 0) {
      setSec8Step(1); // H
    } else if (sec8Step === 1) {
      setSec8Step(2); // Z
    } else if (sec8Step === 2) {
      const res = Math.random() < 0.5 ? 0 : 1;
      setSec8Outcome(res);
      setSec8Step(3); // M
    }
  };

  const resetSec8 = () => {
    setSec8Step(0);
    setSec8Outcome(null);
  };

  // Section 9: Run 100 Shots on (√3/2)|0⟩ + (1/2)|1⟩
  const runSec9Shots = () => {
    const p0 = 0.75;
    let c0 = 0;
    for (let i = 0; i < 100; i++) {
      if (Math.random() < p0) c0++;
    }
    setSec9ShotsResult({ count0: c0, count1: 100 - c0, total: 100 });
  };

  // Section 10: Challenge Handlers
  const handleChGate = (gate) => {
    setChMeasOutcome(null);
    const next = applySingleGate(gate, chQubitState.ar, chQubitState.ai, chQubitState.br, chQubitState.bi);
    const p0 = next.ar * next.ar + next.ai * next.ai;
    let label = "|ψ⟩";
    if (p0 > 0.999) label = "|0⟩";
    else if (p0 < 0.001) label = "|1⟩";
    else if (Math.abs(p0 - 0.5) < 0.01 && next.br > 0) label = "|+⟩";
    else if (Math.abs(p0 - 0.5) < 0.01 && next.br < 0) label = "|−⟩";
    setChQubitState({ ...next, label });
  };

  const resetChQubit = () => {
    setChQubitState({ ar: 1, ai: 0, br: 0, bi: 0, label: "|0⟩" });
    setChMeasOutcome(null);
  };

  const handleTestChallenge = (chId) => {
    const p0 = chQubitState.ar * chQubitState.ar + chQubitState.ai * chQubitState.ai;
    const sample = Math.random() < p0 ? 0 : 1;
    setChMeasOutcome(sample);

    if (chId === 1 && p0 > 0.999) {
      setChSuccess((prev) => ({ ...prev, 1: true }));
    } else if (chId === 2 && p0 < 0.001) {
      setChSuccess((prev) => ({ ...prev, 2: true }));
    } else if (chId === 3 && Math.abs(p0 - 0.5) < 0.01) {
      setChSuccess((prev) => ({ ...prev, 3: true }));
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* ========================================================================= */}
      {/* MODULE HEADER & TOP PROGRESS BAR                                         */}
      {/* ========================================================================= */}
      <div className="rounded-3xl p-6 sm:p-10 app-glass border border-[var(--color-app-border)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Foundations · Module 10
              </span>
              <span className="text-xs font-medium text-[var(--color-app-text-muted)]">
                10 Focused Interactive Sections
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-app-text-main)] tracking-tight">
              Measurement & State Collapse
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-app-text-muted)] max-w-2xl leading-relaxed">
              Before measurement, a qubit can exist in a superposition of states. A measurement produces one definite classical outcome, and the state afterward is consistent with that result.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            <button
              onClick={() => onAskQuantiva && onAskQuantiva({
                topicId: "measurement-collapse",
                title: "Measurement & Collapse",
                section: "Overview",
                prompt: "Can you explain what measurement and quantum state collapse mean intuitively?",
              })}
              className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-500/40 font-mono text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              <span>✦ Ask Quantiva</span>
            </button>
            <button
              onClick={onComplete}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg ${
                isCompleted
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-cyan-600 hover:bg-cyan-500 text-white"
              }`}
            >
              {isCompleted ? "✓ Completed" : "Mark Module Complete"}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1 — FROM SUPERPOSITION TO MEASUREMENT                             */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Section 1 · Bridge from Module 9
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Predicting the Observable</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          From Superposition to Measurement
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            In Module 9, we explored how a quantum bit can exist in a genuine superposition of basis states. A classic example is the equal superposition state |+⟩:
          </p>

          <div className="p-4 rounded-xl bg-black/30 border border-white/10 text-center font-mono text-sm max-w-md mx-auto">
            <MathHTMLContainer html="$$|+\rangle = \frac{|0\rangle + |1\rangle}{\sqrt{2}}$$" />
          </div>

          <p className="text-center font-medium text-[var(--color-app-text-main)]">
            If we measure this qubit, what do we actually get?
          </p>

          <p>
            The state contains both |0⟩ and |1⟩ with equal probability amplitudes. According to the Born rule:
          </p>

          <div className="flex items-center justify-center gap-8 font-mono text-sm">
            <span className="px-4 py-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-200">
              <MathHTMLContainer html="$$P(0) = \frac{1}{2}$$" />
            </span>
            <span className="px-4 py-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-200">
              <MathHTMLContainer html="$$P(1) = \frac{1}{2}$$" />
            </span>
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 font-medium">
            💡 <strong>Key Principle:</strong> A measurement does not return a half-and-half mixture, nor does it report the fractions. <strong>A measurement produces one definite classical outcome: either 0 or 1.</strong>
          </div>
        </div>

        {/* Prediction Before First Measurement */}
        <div className="mt-6 p-6 rounded-xl bg-black/40 border border-[var(--color-app-border)] max-w-lg mx-auto text-center space-y-4">
          <div className="text-xs font-bold text-[var(--color-app-text-main)]">
            Try a Single Measurement on |+⟩:
          </div>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setSec1Prediction(0)}
              className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
                sec1Prediction === 0
                  ? "bg-cyan-600 text-white ring-2 ring-cyan-400"
                  : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
              }`}
            >
              Predict 0
            </button>
            <button
              onClick={() => setSec1Prediction(1)}
              className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
                sec1Prediction === 1
                  ? "bg-cyan-600 text-white ring-2 ring-cyan-400"
                  : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
              }`}
            >
              Predict 1
            </button>
          </div>

          <button
            onClick={() => setSec1Sample(Math.random() < 0.5 ? 0 : 1)}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold shadow-lg transition-all"
          >
            Measure |+⟩ Once
          </button>

          {sec1Sample !== null && (
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 font-mono text-xs text-[var(--color-app-text-main)]">
              Outcome: <strong className="text-cyan-300 text-sm">{sec1Sample}</strong>.
              {sec1Prediction !== null && (
                <span className="ml-2 text-[var(--color-app-text-muted)]">
                  (You predicted {sec1Prediction}: {sec1Prediction === sec1Sample ? "matched!" : "different outcome on this run"})
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2 — THE MEASUREMENT CHAMBER (CENTERPIECE)                         */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)] relative overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Section 2 · Centerpiece
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Interactive Laboratory</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          The Measurement Chamber
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4 mb-6">
          <p>
            Welcome to the <strong>Measurement Chamber</strong>. Here you can prepare a quantum state, trigger a measurement, and observe the classical result and resulting state.
          </p>
        </div>

        {/* State Preparation Selector */}
        <div className="p-5 rounded-xl bg-black/30 border border-white/10 mb-6 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-app-text-main)]">
            1. Prepare Input Quantum State
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "plus", label: "|+⟩", desc: "(|0⟩+|1⟩)/√2" },
              { id: "zero", label: "|0⟩", desc: "100% |0⟩" },
              { id: "one", label: "|1⟩", desc: "100% |1⟩" },
              { id: "minus", label: "|−⟩", desc: "(|0⟩−|1⟩)/√2" },
              { id: "custom", label: "Custom", desc: "Adjust Ratio" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleChamberPresetChange(p.id)}
                className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
                  chamberPreset === p.id
                    ? "bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-md"
                    : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
                }`}
              >
                {p.label} <span className="text-[10px] opacity-70">({p.desc})</span>
              </button>
            ))}
          </div>

          {chamberPreset === "custom" && (
            <div className="pt-2 space-y-1 max-w-md">
              <div className="flex justify-between text-[11px] font-mono text-[var(--color-app-text-muted)]">
                <span>More |0⟩ (P(0) ≈ {(Math.cos((chamberAngle * Math.PI) / 2) ** 2 * 100).toFixed(0)}%)</span>
                <span>More |1⟩ (P(1) ≈ {(Math.sin((chamberAngle * Math.PI) / 2) ** 2 * 100).toFixed(0)}%)</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={chamberAngle}
                onChange={(e) => handleCustomSliderChange(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Chamber Interactive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Chamber Operation Console */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-2xl bg-black/50 border border-emerald-500/30 relative overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="text-xs font-mono text-[var(--color-app-text-muted)]">
                  Chamber Status:{" "}
                  <span className={chamberOutcome !== null ? "text-cyan-300 font-bold" : "text-emerald-400 font-bold"}>
                    {chamberOutcome !== null ? "Measured (Collapsed)" : "Ready (Superposition Prepared)"}
                  </span>
                </div>
                {chamberOutcome !== null && (
                  <button
                    onClick={resetChamberPreparation}
                    className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-mono text-[var(--color-app-text-main)] transition-all"
                  >
                    Reset Preparation
                  </button>
                )}
              </div>

              {/* Visual Chamber Apparatus */}
              <div className="my-8 flex items-center justify-around gap-2 text-center">
                {/* Input Qubit */}
                <div className="space-y-1">
                  <div className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center font-mono font-bold text-sm text-cyan-200 mx-auto shadow-lg shadow-cyan-500/20">
                    {chamberPreset === "plus" ? "|+⟩" : chamberPreset === "minus" ? "|−⟩" : chamberPreset === "zero" ? "|0⟩" : chamberPreset === "one" ? "|1⟩" : "|ψ⟩"}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--color-app-text-muted)]">Input State</div>
                </div>

                <div className="text-cyan-400 font-bold text-lg animate-pulse">⟶</div>

                {/* Central Chamber Detector */}
                <div className={`p-4 rounded-xl border transition-all ${
                  isChamberMeasuring
                    ? "bg-emerald-500/30 border-emerald-400 scale-105"
                    : "bg-zinc-900/80 border-zinc-700"
                }`}>
                  <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-app-text-muted)] mb-1">
                    Detector
                  </div>
                  <div className="text-xl font-bold text-[var(--color-app-text-main)]">
                    [ M ]
                  </div>
                </div>

                <div className="text-cyan-400 font-bold text-lg animate-pulse">⟶</div>

                {/* Output Classical Result */}
                <div className="space-y-1">
                  <div className={`w-14 h-14 rounded-xl border flex items-center justify-center font-mono font-bold text-xl mx-auto shadow-lg transition-all ${
                    chamberOutcome !== null
                      ? "bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-emerald-500/30 scale-110"
                      : "bg-white/5 border-white/10 text-white/30"
                  }`}>
                    {chamberOutcome !== null ? chamberOutcome : "—"}
                  </div>
                  <div className="text-[10px] font-mono text-[var(--color-app-text-muted)]">Classical Bit</div>
                </div>
              </div>

              {/* Trigger Button */}
              <div className="text-center">
                <button
                  onClick={triggerChamberMeasurement}
                  disabled={isChamberMeasuring}
                  className="w-full sm:w-auto px-10 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-sm tracking-wide shadow-xl shadow-emerald-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isChamberMeasuring ? "Measuring..." : chamberOutcome !== null ? "Measure Again" : "Trigger Measurement"}
                </button>
              </div>

              {/* Post-Measurement State Readout */}
              {chamberOutcome !== null && (
                <div className="mt-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-1 animate-fadeIn">
                  <div className="text-xs font-mono font-bold text-emerald-300 flex items-center justify-between">
                    <span>Measured Outcome: {chamberOutcome}</span>
                    <span>Current State: |{chamberOutcome}⟩</span>
                  </div>
                  <p className="text-[11px] text-[var(--color-app-text-muted)] leading-relaxed">
                    Notice that the quantum state is now |{chamberOutcome}⟩. If you measure this qubit again without preparing a new one, you will deterministically obtain {chamberOutcome} every time.
                  </p>
                </div>
              )}
            </div>

            {/* Measurement History */}
            {chamberHistory.length > 0 && (
              <div className="flex items-center gap-2 font-mono text-xs text-[var(--color-app-text-muted)]">
                <span>Recent Out:</span>
                <div className="flex gap-1.5">
                  {chamberHistory.map((res, i) => (
                    <span
                      key={i}
                      className={`w-6 h-6 rounded flex items-center justify-center font-bold ${
                        res === 0 ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {res}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Educational Bloch Visualization */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl p-4 bg-black/40 border border-[var(--color-app-border)] text-center">
              <div className="text-xs font-mono font-bold text-[var(--color-app-text-main)] mb-1">
                Post-Measurement State Visualization
              </div>
              <div className="text-[11px] text-[var(--color-app-text-muted)] mb-3">
                {chamberOutcome === null
                  ? "Pre-measurement superposition vector on the Bloch sphere"
                  : `Vector now pointing to |${chamberOutcome}⟩ pole`}
              </div>

              <div className="h-56 w-full relative">
                <Canvas camera={{ position: [2.5, 2.5, 2.5], fov: 45 }}>
                  <ambientLight intensity={0.7} />
                  <pointLight position={[10, 10, 10]} intensity={0.8} />
                  <BlochSphere3D theta={chamberBlochAngles.theta} phi={chamberBlochAngles.phi} />
                  <OrbitControls enableZoom={false} />
                </Canvas>
              </div>

              <div className="mt-3">
                <StateProbabilityHeatmap probabilities={chamberProbabilities} />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/20 border border-white/5 text-[11px] text-[var(--color-app-text-light)] italic leading-relaxed">
              Note: The Bloch-sphere movement shown here is an educational visualization of the post-measurement state, not necessarily a literal physical continuous trajectory or instantaneous physical vector collapse.
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3 — WHY DON'T WE ALWAYS GET THE SAME RESULT?                      */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Section 3 · Statistics
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Single Shots vs Ensembles</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Why Don't We Always Get the Same Result?
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            When we prepare the state |+⟩, the theoretical probabilities are exactly:
          </p>

          <div className="flex items-center justify-center gap-6 font-mono text-xs sm:text-sm">
            <span className="px-3 py-1.5 rounded-lg bg-blue-950/40 border border-blue-500/30 text-blue-200">
              P(0) = 50%
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-blue-950/40 border border-blue-500/30 text-blue-200">
              P(1) = 50%
            </span>
          </div>

          <p>
            Why did your individual measurement in Section 1 or 2 give one specific number?
          </p>

          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 text-blue-200 font-medium">
            ✨ <strong>The probability describes what happens across repeated preparations. A single measurement gives one particular outcome.</strong>
          </div>
        </div>

        {/* Multi-shot Experiment */}
        <div className="mt-6 p-6 rounded-xl bg-black/30 border border-white/10 max-w-xl mx-auto space-y-4">
          <div className="text-xs font-bold text-[var(--color-app-text-main)] text-center">
            Run Repeated Preparations & Measurements on |+⟩:
          </div>

          <div className="flex justify-center gap-3">
            {[10, 100, 1000].map((shots) => (
              <button
                key={shots}
                onClick={() => runShots(shots)}
                className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
                  shotCount === shots && shotResults !== null
                    ? "bg-blue-600 text-white shadow-lg ring-2 ring-blue-400"
                    : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
                }`}
              >
                {shots} Shots
              </button>
            ))}
          </div>

          {shotResults && (
            <div className="pt-3 space-y-3 font-mono text-xs">
              <div className="flex justify-between text-[var(--color-app-text-main)]">
                <span>Result 0: {shotResults.count0} ({((shotResults.count0 / shotResults.total) * 100).toFixed(1)}%)</span>
                <span>Result 1: {shotResults.count1} ({((shotResults.count1 / shotResults.total) * 100).toFixed(1)}%)</span>
              </div>

              {/* Visual distribution bar */}
              <div className="h-4 rounded-full overflow-hidden flex bg-white/5 border border-white/10">
                <div
                  className="bg-cyan-500 h-full transition-all duration-500"
                  style={{ width: `${(shotResults.count0 / shotResults.total) * 100}%` }}
                />
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${(shotResults.count1 / shotResults.total) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-[var(--color-app-text-muted)] text-center font-sans">
                Notice that with 10 shots there is small-sample variation, but as you scale to 1,000 shots, the empirical frequencies converge tightly toward the 50/50 theoretical expectation.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4 — COLLAPSE: THE STATE AFTER MEASUREMENT                         */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Section 4 · The Postulate
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">State Evolution Through Measurement</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Collapse: The State After Measurement
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            Now we formally introduce one of the most famous concepts in quantum mechanics: <strong>collapse</strong>.
          </p>

          <p>
            Before measurement, our single-qubit quantum state is a linear combination of basis vectors:
          </p>

          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-center font-mono text-sm max-w-md mx-auto">
            <MathHTMLContainer html="$$|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$$" />
          </div>

          <p>
            When a measurement takes place in the computational basis, what happens to |ψ⟩?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto font-mono text-xs text-center">
            <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/30 space-y-2">
              <div className="text-cyan-300 font-bold uppercase tracking-wider text-[11px]">If Detector Measures 0</div>
              <div className="text-sm">
                <MathHTMLContainer html="$$|\psi\rangle \longrightarrow |0\rangle$$" />
              </div>
              <div className="text-[10px] text-[var(--color-app-text-muted)] font-sans">
                Occurs with probability |α|²
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/30 space-y-2">
              <div className="text-emerald-300 font-bold uppercase tracking-wider text-[11px]">If Detector Measures 1</div>
              <div className="text-sm">
                <MathHTMLContainer html="$$|\psi\rangle \longrightarrow |1\rangle$$" />
              </div>
              <div className="text-[10px] text-[var(--color-app-text-muted)] font-sans">
                Occurs with probability |β|²
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 font-medium">
            ⚡ <strong>Physical Meaning:</strong> Measurement selects one possible outcome, and after the measurement the quantum state is <strong>consistent with the observed result</strong>. The previous superposition is replaced by the observed basis state.
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5 — MEASURE TWICE                                                 */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Section 5 · Sequential Verification
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Repeatability of Collapsed States</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Measure Twice: What Happens on the Second Measurement?
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            If measurement changes the state to match the result, what happens if we immediately measure the qubit a second time without doing any gates in between?
          </p>
        </div>

        {/* Sequential Experiment Stepper */}
        <div className="mt-6 p-6 rounded-2xl bg-black/40 border border-amber-500/30 max-w-xl mx-auto space-y-6">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--color-app-text-muted)]">State:</span>
            <span className="text-amber-300 font-bold">
              {m2Step === 0 ? "Prepared: |+⟩" : m2Step === 1 ? `After 1st Measurement: |${m2FirstOutcome}⟩` : `After 2nd Measurement: |${m2SecondOutcome}⟩`}
            </span>
          </div>

          {/* Stepper Graphics */}
          <div className="flex items-center justify-center gap-4 text-center">
            {/* Initial */}
            <div className="space-y-1">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/20 flex items-center justify-center font-mono font-bold text-sm text-cyan-300 mx-auto">
                |+⟩
              </div>
              <div className="text-[10px] font-mono text-[var(--color-app-text-muted)]">Prepared</div>
            </div>

            <span className="text-amber-400 font-bold">⟶</span>

            {/* First Measurement */}
            <div className="space-y-1">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-mono font-bold text-sm mx-auto ${
                m2Step >= 1
                  ? "bg-amber-500/20 border-amber-400 text-amber-200"
                  : "bg-white/5 border-white/10 text-white/30"
              }`}>
                {m2Step >= 1 ? m2FirstOutcome : "[M₁]"}
              </div>
              <div className="text-[10px] font-mono text-[var(--color-app-text-muted)]">1st Measure</div>
            </div>

            <span className="text-amber-400 font-bold">⟶</span>

            {/* Second Measurement */}
            <div className="space-y-1">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-mono font-bold text-sm mx-auto ${
                m2Step === 2
                  ? "bg-emerald-500/20 border-emerald-400 text-emerald-200"
                  : "bg-white/5 border-white/10 text-white/30"
              }`}>
                {m2Step === 2 ? m2SecondOutcome : "[M₂]"}
              </div>
              <div className="text-[10px] font-mono text-[var(--color-app-text-muted)]">2nd Measure</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-3">
            {m2Step === 0 && (
              <button
                onClick={handleM2FirstMeasure}
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold shadow-lg transition-all"
              >
                Perform 1st Measurement
              </button>
            )}

            {m2Step === 1 && (
              <button
                onClick={handleM2SecondMeasure}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shadow-lg transition-all"
              >
                Perform 2nd Measurement
              </button>
            )}

            {m2Step === 2 && (
              <button
                onClick={resetM2Experiment}
                className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition-all"
              >
                Prepare Fresh Qubit (Try Again)
              </button>
            )}
          </div>

          {/* Explanation */}
          {m2Step === 2 && (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-[var(--color-app-text-main)] space-y-2 animate-fadeIn">
              <div className="font-bold text-emerald-300">
                Why did the second measurement become 100% predictable?
              </div>
              <p className="text-[var(--color-app-text-muted)] leading-relaxed">
                The first measurement collapsed the superposition into <strong>|{m2FirstOutcome}⟩</strong>. Measuring that basis state again gives <strong>{m2FirstOutcome}</strong> with 100% certainty!
              </p>
              <p className="text-[11px] text-[var(--color-app-text-light)]">
                Try preparing fresh qubits multiple times: across different runs, the <em>first</em> result will randomly be 0 or 1, but the <em>second</em> result will always match the first.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6 — MEASUREMENT IS NOT A GATE                                     */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Section 6 · Fundamental Contrast
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Reversibility vs Collapse</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Measurement Is Not a Gate
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            In Modules 7 and 8, we studied quantum gates like Pauli-X and Hadamard. It is tempting to think of measurement as simply another gate symbol on a wire, but physical measurement operates under completely different rules.
          </p>

          <p>
            Crucially, <strong>measurement cannot generally be undone like a unitary gate</strong>:
          </p>
        </div>

        {/* Side-by-Side Comparison Demonstration */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Reversible Unitary Gates */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Reversible Quantum Gate
              </span>
              <span className="text-[10px] font-mono text-[var(--color-app-text-muted)]">X · X = I</span>
            </div>

            <div className="p-3 rounded-lg bg-white/5 font-mono text-xs text-center">
              |0⟩ ── X ── X ── |0⟩
            </div>

            <div className="text-xs text-[var(--color-app-text-muted)] space-y-1">
              <div>Current step: <strong>{sec6GateStep === 0 ? "Initial |0⟩" : sec6GateStep === 1 ? "After 1st X: |1⟩" : "After 2nd X: |0⟩ (Undone!)"}</strong></div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSec6GateStep((prev) => (prev + 1) % 3)}
                className="w-full py-2 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/40 text-cyan-200 border border-cyan-500/40 font-mono text-xs font-bold transition-all"
              >
                {sec6GateStep === 0 ? "Apply X Gate" : sec6GateStep === 1 ? "Apply Second X (Undo)" : "Reset"}
              </button>
            </div>
            <p className="text-[11px] text-[var(--color-app-text-muted)]">
              Quantum gates rotate the state predictably and are completely reversible. Applying X twice cleanly restores the original input state.
            </p>
          </div>

          {/* Right: Irreversible Measurement */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                Measurement
              </span>
              <span className="text-[10px] font-mono text-[var(--color-app-text-muted)]">Irreversible</span>
            </div>

            <div className="p-3 rounded-lg bg-white/5 font-mono text-xs text-center">
              |0⟩ ── H ── [ M ] ── ...
            </div>

            <div className="text-xs text-[var(--color-app-text-muted)] space-y-1">
              <div>Current step: <strong>{sec6MeasStep === 0 ? "Initial |0⟩" : sec6MeasStep === 1 ? "After H: |+⟩ (Superposition)" : `Measured: ${sec6MeasOutcome} (State: |${sec6MeasOutcome}⟩)`}</strong></div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (sec6MeasStep === 0) setSec6MeasStep(1);
                  else if (sec6MeasStep === 1) {
                    const res = Math.random() < 0.5 ? 0 : 1;
                    setSec6MeasOutcome(res);
                    setSec6MeasStep(2);
                  } else {
                    setSec6MeasStep(0);
                    setSec6MeasOutcome(null);
                  }
                }}
                className="w-full py-2 rounded-lg bg-rose-600/30 hover:bg-rose-600/40 text-rose-200 border border-rose-500/40 font-mono text-xs font-bold transition-all"
              >
                {sec6MeasStep === 0 ? "Apply H Gate" : sec6MeasStep === 1 ? "Measure Qubit" : "Reset"}
              </button>
            </div>
            <p className="text-[11px] text-[var(--color-app-text-muted)]">
              Measurement extracts a classical bit and collapses the superposition. Once measured, the delicate superposition information is gone and cannot simply be undone!
            </p>
          </div>
        </div>

        {/* Structured Comparison Table */}
        <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-[var(--color-app-text-main)] font-mono">
                <th className="p-3">Property</th>
                <th className="p-3 text-cyan-300">Quantum Gate (e.g. H, X, Z)</th>
                <th className="p-3 text-rose-300">Measurement [ M ]</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[var(--color-app-text-muted)]">
              <tr>
                <td className="p-3 font-semibold text-[var(--color-app-text-main)]">Reversibility</td>
                <td className="p-3">Always reversible (can undo via inverse gate)</td>
                <td className="p-3 font-medium text-rose-200">Cannot generally be undone</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-[var(--color-app-text-main)]">Information Output</td>
                <td className="p-3">None extracted (qubit remains isolated)</td>
                <td className="p-3 font-medium text-rose-200">Produces definite classical bit (0 or 1)</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-[var(--color-app-text-main)]">State Evolution</td>
                <td className="p-3">Smooth deterministic rotation of state vector</td>
                <td className="p-3 font-medium text-rose-200">State collapses to match the observed outcome</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7 — COMPUTATIONAL-BASIS MEASUREMENT                                */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Section 7 · Standard Reference Frame
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Computational Basis</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Computational-Basis Measurement
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            Throughout our Quantum Foundations curriculum, every measurement we perform is in the <strong>computational basis</strong>:
          </p>

          <div className="p-3 rounded-xl bg-black/30 border border-white/10 text-center font-mono text-sm max-w-xs mx-auto">
            {"{|0⟩, |1⟩}"}
          </div>

          <p>
            In computational-basis measurement, the observable classical outcomes are always either <strong>0</strong> or <strong>1</strong>:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div
              onClick={() => {
                setSec7BasisChoice("zero");
                setSec7SampleResult(0);
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                sec7BasisChoice === "zero"
                  ? "bg-indigo-950/40 border-indigo-400 ring-2 ring-indigo-500/40"
                  : "bg-black/30 border-white/10 hover:bg-white/5"
              }`}
            >
              <div className="font-bold text-indigo-300 text-sm mb-1">State: |0⟩</div>
              <div className="text-[var(--color-app-text-muted)] text-[11px]">Always measures 0 (100%)</div>
            </div>

            <div
              onClick={() => {
                setSec7BasisChoice("one");
                setSec7SampleResult(1);
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                sec7BasisChoice === "one"
                  ? "bg-indigo-950/40 border-indigo-400 ring-2 ring-indigo-500/40"
                  : "bg-black/30 border-white/10 hover:bg-white/5"
              }`}
            >
              <div className="font-bold text-indigo-300 text-sm mb-1">State: |1⟩</div>
              <div className="text-[var(--color-app-text-muted)] text-[11px]">Always measures 1 (100%)</div>
            </div>

            <div
              onClick={() => {
                setSec7BasisChoice("plus");
                setSec7SampleResult(Math.random() < 0.5 ? 0 : 1);
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                sec7BasisChoice === "plus"
                  ? "bg-indigo-950/40 border-indigo-400 ring-2 ring-indigo-500/40"
                  : "bg-black/30 border-white/10 hover:bg-white/5"
              }`}
            >
              <div className="font-bold text-indigo-300 text-sm mb-1">State: |+⟩</div>
              <div className="text-[var(--color-app-text-muted)] text-[11px]">50% chance of 0, 50% chance of 1</div>
            </div>
          </div>

          {sec7SampleResult !== null && (
            <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-center font-mono text-xs">
              Measured from {sec7BasisChoice === "zero" ? "|0⟩" : sec7BasisChoice === "one" ? "|1⟩" : "|+⟩"}:{" "}
              <strong className="text-indigo-300 text-sm">{sec7SampleResult}</strong>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 8 — MEASUREMENT AFTER A CIRCUIT                                   */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
            Section 8 · Circuit Integration
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">From Gates to Output</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Measurement After a Circuit
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            In a quantum algorithm, unitary gates perform transformations while the qubit is in isolation. At the very end of the circuit, measurement converts the final quantum state into classical output bits.
          </p>

          <p>
            Consider this circuit: <strong>|0⟩ ── H ── Z ── [ M ]</strong>.
          </p>
        </div>

        {/* Circuit Stepper */}
        <div className="mt-6 p-6 rounded-2xl bg-black/40 border border-teal-500/30 max-w-xl mx-auto space-y-6">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--color-app-text-muted)]">Circuit Progression:</span>
            <span className="text-teal-300 font-bold">
              {sec8Step === 0 && "Step 0: Initial State |0⟩"}
              {sec8Step === 1 && "Step 1: After H Gate -> |+⟩"}
              {sec8Step === 2 && "Step 2: After Z Gate -> |−⟩"}
              {sec8Step === 3 && `Step 3: Measured -> Outcome ${sec8Outcome} (State: |${sec8Outcome}⟩)`}
            </span>
          </div>

          {/* Visual Circuit Diagram */}
          <div className="p-4 rounded-xl bg-black/60 border border-white/10 flex items-center justify-around font-mono text-xs">
            <span className={sec8Step === 0 ? "text-cyan-300 font-bold" : "text-white/40"}>|0⟩</span>
            <span className="text-white/20">──</span>
            <span className={`px-2.5 py-1 rounded border ${sec8Step === 1 ? "bg-blue-600 text-white border-blue-400" : "bg-white/5 border-white/10 text-white/50"}`}>H</span>
            <span className="text-white/20">──</span>
            <span className={`px-2.5 py-1 rounded border ${sec8Step === 2 ? "bg-purple-600 text-white border-purple-400" : "bg-white/5 border-white/10 text-white/50"}`}>Z</span>
            <span className="text-white/20">──</span>
            <span className={`px-2.5 py-1 rounded border ${sec8Step === 3 ? "bg-emerald-600 text-white border-emerald-400" : "bg-white/5 border-white/10 text-white/50"}`}>[ M ]</span>
            <span className="text-white/20">──</span>
            <span className={sec8Step === 3 ? "text-emerald-300 font-bold" : "text-white/30"}>
              {sec8Outcome !== null ? `Bit ${sec8Outcome}` : "?"}
            </span>
          </div>

          <div className="flex justify-center gap-3">
            {sec8Step < 3 ? (
              <button
                onClick={advanceSec8}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-mono text-xs font-bold transition-all shadow-lg"
              >
                {sec8Step === 0 ? "Apply H Gate" : sec8Step === 1 ? "Apply Z Gate" : "Measure Output"}
              </button>
            ) : (
              <button
                onClick={resetSec8}
                className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition-all"
              >
                Reset Circuit
              </button>
            )}
          </div>

          {/* Crucial Section 8 Teaching Note */}
          <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-500/30 text-xs text-teal-200 leading-relaxed space-y-2">
            <div className="font-bold">⚠️ Crucial Physical Point:</div>
            <p>
              The Pauli-Z gate flipped the relative phase between |0⟩ and |1⟩ to produce |−⟩ = (|0⟩ − |1⟩)/√2.
            </p>
            <p className="text-[var(--color-app-text-muted)]">
              However, <strong>|−⟩ measured in the computational basis still produces 50/50 probabilities</strong> (P(0) = 50%, P(1) = 50%)! The Z gate changes the phase, not the computational measurement probabilities. Measurement turns that final superposition into a 50/50 classical outcome.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 9 — PREDICTION -> MEASUREMENT                                     */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Section 9 · Predictive Workbench
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Amplitude to Probability</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Prediction ⟶ Measurement
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            Let us test the complete learning chain: <strong>Amplitude ⟶ Probability ⟶ Measurement Outcome</strong>.
          </p>

          <p>
            Consider a qubit prepared in the following unequal superposition:
          </p>

          <div className="p-3 rounded-xl bg-black/30 border border-white/10 text-center font-mono text-sm max-w-md mx-auto">
            <MathHTMLContainer html="$$|\psi\rangle = \frac{\sqrt{3}}{2}|0\rangle + \frac{1}{2}|1\rangle$$" />
          </div>

          <p className="text-center font-bold text-[var(--color-app-text-main)]">
            What is the theoretical probability of measuring 0?
          </p>
        </div>

        {/* Multiple Choice Question */}
        <div className="mt-6 max-w-md mx-auto space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {["25", "50", "75", "100"].map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  setSec9Choice(opt);
                  setSec9Submitted(true);
                }}
                className={`py-3 rounded-xl font-mono text-xs font-bold transition-all ${
                  sec9Choice === opt
                    ? opt === "75"
                      ? "bg-emerald-600 text-white ring-2 ring-emerald-400"
                      : "bg-rose-600 text-white ring-2 ring-rose-400"
                    : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10 border border-white/10"
                }`}
              >
                {opt}%
              </button>
            ))}
          </div>

          {sec9Submitted && (
            <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 animate-fadeIn ${
              sec9Choice === "75"
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                : "bg-rose-950/40 border-rose-500/40 text-rose-200"
            }`}>
              <div className="font-bold">
                {sec9Choice === "75" ? "✓ Correct: P(0) = 75%!" : "Try again: Recall the Born rule!"}
              </div>
              <div className="font-mono text-[11px]">
                <MathHTMLContainer html="$$P(0) = |\alpha|^2 = \left(\frac{\sqrt{3}}{2}\right)^2 = \frac{3}{4} = 75\%$$" />
                <MathHTMLContainer html="$$P(1) = |\beta|^2 = \left(\frac{1}{2}\right)^2 = \frac{1}{4} = 25\%$$" />
              </div>
            </div>
          )}

          {/* Test Prediction with 100 Shots */}
          <div className="pt-4 text-center">
            <button
              onClick={runSec9Shots}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold shadow-lg transition-all"
            >
              Verify with 100 Empirical Shots
            </button>

            {sec9ShotsResult && (
              <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/10 font-mono text-xs space-y-2">
                <div className="flex justify-between text-[var(--color-app-text-main)]">
                  <span>Measured 0: {sec9ShotsResult.count0} times ({sec9ShotsResult.count0}%)</span>
                  <span>Measured 1: {sec9ShotsResult.count1} times ({sec9ShotsResult.count1}%)</span>
                </div>
                <div className="text-[11px] font-sans text-[var(--color-app-text-muted)]">
                  Notice how close the empirical count lands to the expected 75% theoretical probability!
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 10 — MEASUREMENT CHALLENGE & SUMMARY                              */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Section 10 · Verification & Review
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Measurement Challenge Lab</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Measurement Challenges & Summary
        </h2>

        {/* Challenge Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[1, 2, 3, 4].map((num) => (
            <button
              key={num}
              onClick={() => {
                setActiveChallenge(num);
                resetChQubit();
                setCh4Stage(0);
                setCh4FirstRes(null);
                setCh4SecondRes(null);
              }}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                activeChallenge === num
                  ? "bg-cyan-600 text-white shadow-lg"
                  : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
              }`}
            >
              <span>Challenge {num}</span>
              {chSuccess[num] && <span className="text-emerald-400">✓</span>}
            </button>
          ))}
        </div>

        {/* Challenge 1-3 Interactive Workbench */}
        {activeChallenge < 4 && (
          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 max-w-xl mx-auto space-y-6">
            <div className="space-y-1">
              <div className="text-xs font-bold text-cyan-300">
                {activeChallenge === 1 && "Goal: Prepare a state that ALWAYS measures 0 (100% P(0))."}
                {activeChallenge === 2 && "Goal: Prepare a state that ALWAYS measures 1 (100% P(1))."}
                {activeChallenge === 3 && "Goal: Prepare a state with EQUAL probability of measuring 0 or 1 (50/50)."}
              </div>
              <div className="text-[11px] text-[var(--color-app-text-muted)]">
                Starting from |0⟩, apply gates to reach the target state, then test with a measurement.
              </div>
            </div>

            {/* Current State Readout */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 font-mono text-xs">
              <span className="text-[var(--color-app-text-muted)]">Current State:</span>
              <span className="text-cyan-300 font-bold text-sm">{chQubitState.label}</span>
              <button
                onClick={resetChQubit}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] text-[var(--color-app-text-main)]"
              >
                Reset to |0⟩
              </button>
            </div>

            {/* Gate Toolbox */}
            <div className="flex justify-center gap-3">
              {["X", "H", "Z"].map((gate) => (
                <button
                  key={gate}
                  onClick={() => handleChGate(gate)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-xs border border-white/10 transition-all shadow"
                >
                  Apply {gate}
                </button>
              ))}
            </div>

            {/* Test Button */}
            <div className="text-center pt-2">
              <button
                onClick={() => handleTestChallenge(activeChallenge)}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold shadow-lg transition-all"
              >
                Test Measurement
              </button>
            </div>

            {chMeasOutcome !== null && (
              <div className={`p-4 rounded-xl border font-mono text-xs space-y-1 text-center animate-fadeIn ${
                chSuccess[activeChallenge]
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                  : "bg-amber-950/40 border-amber-500/40 text-amber-200"
              }`}>
                <div className="font-bold">
                  {chSuccess[activeChallenge] ? "✓ Challenge Completed!" : "Outcome sampled: " + chMeasOutcome}
                </div>
                <div className="text-[11px] font-sans">
                  {chSuccess[activeChallenge]
                    ? "Target distribution verified!"
                    : "Try applying gates to reach the exact target distribution before measuring."}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Challenge 4: Superposition -> Measure -> Measure Again */}
        {activeChallenge === 4 && (
          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 max-w-xl mx-auto space-y-6">
            <div className="space-y-1">
              <div className="text-xs font-bold text-cyan-300">
                Goal: Create a superposition, measure it, then measure again to observe why the second result is predictable.
              </div>
              <div className="text-[11px] text-[var(--color-app-text-muted)]">
                Follow the 4-step sequence below:
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span>Step 1: Superposition</span>
                <span className={ch4Stage >= 1 ? "text-emerald-400 font-bold" : "text-white/40"}>
                  {ch4Stage >= 1 ? "Prepared |+⟩" : "Pending"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Step 2: 1st Measurement</span>
                <span className={ch4Stage >= 2 ? "text-emerald-400 font-bold" : "text-white/40"}>
                  {ch4FirstRes !== null ? `Result: ${ch4FirstRes} (State: |${ch4FirstRes}⟩)` : "Pending"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Step 3: 2nd Measurement</span>
                <span className={ch4Stage >= 3 ? "text-emerald-400 font-bold" : "text-white/40"}>
                  {ch4SecondRes !== null ? `Result: ${ch4SecondRes} (Repeat: ${ch4FirstRes === ch4SecondRes ? "Identical!" : "Different"})` : "Pending"}
                </span>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              {ch4Stage === 0 && (
                <button
                  onClick={() => setCh4Stage(1)}
                  className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold shadow-lg"
                >
                  Apply H Gate (Create Superposition)
                </button>
              )}

              {ch4Stage === 1 && (
                <button
                  onClick={() => {
                    const res = Math.random() < 0.5 ? 0 : 1;
                    setCh4FirstRes(res);
                    setCh4Stage(2);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold shadow-lg"
                >
                  Measure 1st Time
                </button>
              )}

              {ch4Stage === 2 && (
                <button
                  onClick={() => {
                    setCh4SecondRes(ch4FirstRes);
                    setCh4Stage(3);
                    setChSuccess((prev) => ({ ...prev, 4: true }));
                  }}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shadow-lg"
                >
                  Measure 2nd Time (Observe Predictability)
                </button>
              )}

              {ch4Stage === 3 && (
                <button
                  onClick={() => {
                    setCh4Stage(0);
                    setCh4FirstRes(null);
                    setCh4SecondRes(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold"
                >
                  Repeat Experiment
                </button>
              )}
            </div>

            {chSuccess[4] && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 font-mono text-xs text-emerald-200 text-center animate-fadeIn">
                ✓ Challenge 4 Complete! Notice that the second measurement confirmed the first collapse!
              </div>
            )}
          </div>
        )}

        {/* Summary Flow & Core Takeaways */}
        <div className="mt-10 pt-8 border-t border-white/10 space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-[var(--color-app-text-main)]">
              Module 10 Summary: The Measurement Chain
            </h3>
            <div className="flex items-center justify-center gap-3 font-mono text-xs sm:text-sm text-cyan-300 flex-wrap">
              <span>Quantum State</span>
              <span>⟶</span>
              <span className="text-amber-300 font-bold">Measurement</span>
              <span>⟶</span>
              <span>Classical Outcome</span>
              <span>⟶</span>
              <span className="text-emerald-300 font-bold">Post-Measurement State</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-app-text-main)]">
              8 Core Takeaways:
            </div>
            <ol className="list-decimal pl-5 text-xs text-[var(--color-app-text-muted)] space-y-2 leading-relaxed">
              <li><strong>Measurement produces a definite classical outcome:</strong> Detectors report 0 or 1, never fractional superpositions.</li>
              <li><strong>The outcome is probabilistic for superpositions:</strong> When a qubit is superposed, individual outcomes cannot be predicted with certainty.</li>
              <li><strong>Probabilities come from amplitudes:</strong> By the Born rule, P(0) = |α|² and P(1) = |β|².</li>
              <li><strong>Measurement changes the quantum state:</strong> This irreversible state transformation is termed collapse.</li>
              <li><strong>Post-measurement state for 0:</strong> After measuring 0, the state becomes consistent with |0⟩.</li>
              <li><strong>Post-measurement state for 1:</strong> After measuring 1, the state becomes consistent with |1⟩.</li>
              <li><strong>Repeated measurements:</strong> Measuring the resulting basis state again deterministically yields the same outcome.</li>
              <li><strong>Fundamental difference from gates:</strong> Unlike unitary quantum gates, measurement extracts classical information and cannot generally be undone.</li>
            </ol>
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-center text-cyan-200">
            Next up: <em>“You've seen what measurement does to a single qubit. Next, we'll explore what happens when quantum states involve more than one qubit.”</em>
          </div>

          <div className="text-center pt-4">
            <button
              onClick={onComplete}
              className={`px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xl ${
                isCompleted
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white"
              }`}
            >
              {isCompleted ? "✓ Module Completed" : "Complete Module 10"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
