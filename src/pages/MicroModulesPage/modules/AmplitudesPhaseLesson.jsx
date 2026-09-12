import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import MathHTMLContainer from "../../../components/MathHTMLContainer/MathHTMLContainer";

export default function AmplitudesPhaseLesson({ onComplete, isCompleted, onAskQuantiva }) {
  const navigate = useNavigate();

  // =========================================================================
  // STATE MANAGEMENT ACROSS 8 SECTIONS
  // =========================================================================

  // Section 1: Amplitude Explorer
  const [sec1Mag, setSec1Mag] = useState(0.707); // r in [0, 1]
  const [sec1Phase, setSec1Phase] = useState(0); // phi in [0, 360)

  // Section 2: Phase Dial (Normalized State |ψ⟩ = (|0⟩ + e^(iφ)|1⟩)/√2)
  const [sec2Phase, setSec2Phase] = useState(0); // 0, 90, 180, 270 or continuous

  // Section 3: Hero Comparison Choice
  const [sec3Selected, setSec3Selected] = useState("plus"); // "plus" or "minus"

  // Section 5: Hadamard Test (Predict -> Apply -> Measure -> Compare)
  const [sec5State, setSec5State] = useState("plus"); // "plus" (|+⟩) or "minus" (|−⟩)
  const [sec5Step, setSec5Step] = useState(0); // 0: Prepared, 1: H applied, 2: Measured
  const [sec5Outcome, setSec5Outcome] = useState(null); // 0 or 1

  // Section 6: Continuous Phase H Experiment
  const [sec6Phase, setSec6Phase] = useState(0); // phi in degrees
  const [sec6Runs, setSec6Runs] = useState([
    { id: 1, outcome: 0 },
    { id: 2, outcome: 0 },
    { id: 3, outcome: 0 },
    { id: 4, outcome: 0 },
  ]);

  // Section 8: Challenge Lab
  const [chAnswers, setChAnswers] = useState({ 1: null, 2: null, 3: null, 4: null });
  const [chSubmitted, setChSubmitted] = useState({ 1: false, 2: false, 3: false, 4: false });
  // Free experiment in Section 8
  const [sec8Phase, setSec8Phase] = useState(90);
  const [sec8Shots, setSec8Shots] = useState({ 0: 5, 1: 5 });

  // -------------------------------------------------------------
  // CALCULATIONS & HELPERS
  // -------------------------------------------------------------
  const SQ2 = Math.SQRT2;

  // Section 1: Cartesian components from polar r and phi
  const sec1Complex = useMemo(() => {
    const rad = (sec1Phase * Math.PI) / 180;
    const a = Math.round(sec1Mag * Math.cos(rad) * 1000) / 1000;
    const b = Math.round(sec1Mag * Math.sin(rad) * 1000) / 1000;
    const probContrib = Math.round(sec1Mag * sec1Mag * 1000) / 1000;
    const probPct = Math.round(sec1Mag * sec1Mag * 100);
    return { a, b, probContrib, probPct };
  }, [sec1Mag, sec1Phase]);

  // Section 2: e^(i phi) representations
  const sec2Details = useMemo(() => {
    let expString = "1";
    let latex = "$$|\\psi\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}} = |+\\rangle$$";
    if (sec2Phase === 90) {
      expString = "i";
      latex = "$$|\\psi\\rangle = \\frac{|0\\rangle + i|1\\rangle}{\\sqrt{2}}$$";
    } else if (sec2Phase === 180) {
      expString = "-1";
      latex = "$$|\\psi\\rangle = \\frac{|0\\rangle - |1\\rangle}{\\sqrt{2}} = |-\\rangle$$";
    } else if (sec2Phase === 270) {
      expString = "-i";
      latex = "$$|\\psi\\rangle = \\frac{|0\\rangle - i|1\\rangle}{\\sqrt{2}}$$";
    } else if (sec2Phase !== 0) {
      latex = `$$|\\psi\\rangle = \\frac{|0\\rangle + e^{i(${sec2Phase}^\\circ)}|1\\rangle}{\\sqrt{2}}$$`;
    }
    return { expString, latex };
  }, [sec2Phase]);

  // Section 5: H-gate test handlers
  const handleSec5Prepare = (st) => {
    setSec5State(st);
    setSec5Step(0);
    setSec5Outcome(null);
  };

  const handleSec5ApplyH = () => {
    setSec5Step(1);
  };

  const handleSec5Measure = () => {
    // For |+⟩: H|+⟩ = |0⟩ deterministically (outcome 0)
    // For |−⟩: H|−⟩ = |1⟩ deterministically (outcome 1)
    const out = sec5State === "plus" ? 0 : 1;
    setSec5Outcome(out);
    setSec5Step(2);
  };

  const handleSec5Reset = () => {
    setSec5Step(0);
    setSec5Outcome(null);
  };

  // Section 6: Continuous phase H-gate probabilities
  const sec6Probs = useMemo(() => {
    const rad = (sec6Phase * Math.PI) / 180;
    const p0 = (1 + Math.cos(rad)) / 2;
    const p1 = (1 - Math.cos(rad)) / 2;
    return {
      p0: Math.round(p0 * 100),
      p1: Math.round(p1 * 100),
      rawP0: p0,
    };
  }, [sec6Phase]);

  const sampleSec6Shot = (rawP0) => {
    return Math.random() < rawP0 ? 0 : 1;
  };

  const handleSec6SampleOne = () => {
    const out = sampleSec6Shot(sec6Probs.rawP0);
    const nextId = sec6Runs.length + 1;
    setSec6Runs((prev) => [{ id: nextId, outcome: out }, ...prev.slice(0, 9)]);
  };

  const handleSec6SampleTen = () => {
    const batch = [];
    const baseId = sec6Runs.length;
    for (let i = 1; i <= 10; i++) {
      const out = sampleSec6Shot(sec6Probs.rawP0);
      batch.unshift({ id: baseId + i, outcome: out });
    }
    setSec6Runs((prev) => [...batch, ...prev].slice(0, 10));
  };

  const handleSec6Reset = () => {
    setSec6Runs([
      { id: 1, outcome: sampleSec6Shot(sec6Probs.rawP0) },
      { id: 2, outcome: sampleSec6Shot(sec6Probs.rawP0) },
      { id: 3, outcome: sampleSec6Shot(sec6Probs.rawP0) },
      { id: 4, outcome: sampleSec6Shot(sec6Probs.rawP0) },
    ]);
  };

  const sec6Counts = useMemo(() => {
    let c0 = 0;
    let c1 = 0;
    sec6Runs.forEach((r) => {
      if (r.outcome === 0) c0++;
      else c1++;
    });
    return { c0, c1, total: sec6Runs.length };
  }, [sec6Runs]);

  // Section 8: Free sandbox shots
  const handleSec8RunBatch = () => {
    const rad = (sec8Phase * Math.PI) / 180;
    const p0 = (1 + Math.cos(rad)) / 2;
    let c0 = 0;
    let c1 = 0;
    for (let i = 0; i < 50; i++) {
      if (Math.random() < p0) c0++;
      else c1++;
    }
    setSec8Shots({ 0: c0, 1: c1 });
  };

  const handleSelectChallenge = (chId, choice) => {
    setChAnswers((prev) => ({ ...prev, [chId]: choice }));
    setChSubmitted((prev) => ({ ...prev, [chId]: true }));
  };

  return (
    <div className="space-y-12 pb-16">
      {/* ========================================================================= */}
      {/* MODULE HEADER                                                             */}
      {/* ========================================================================= */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-black border border-amber-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Module 5 · The Hidden Dimension
              </span>
              <span className="text-xs text-[var(--color-app-text-light)]">•</span>
              <span className="text-xs font-medium text-[var(--color-app-text-muted)]">
                8 Focused Interactive Sections
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-app-text-main)] tracking-tight">
              Amplitudes & Phase
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-app-text-muted)] max-w-2xl leading-relaxed">
              If two quantum states have identical measurement probabilities, how can they still be different? Discover how relative phase stores quantum information that probabilities alone cannot see.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            <button
              onClick={() => onAskQuantiva && onAskQuantiva({
                topicId: "amplitudes-phase",
                title: "Amplitudes & Phase",
                section: "Overview",
                prompt: "Why can two quantum states have the exact same computational-basis probabilities but still be completely different states?",
              })}
              className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-mono text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              <span>✦ Ask Quantiva</span>
            </button>
            <button
              onClick={onComplete}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg ${
                isCompleted
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-amber-600 hover:bg-amber-500 text-white"
              }`}
            >
              {isCompleted ? "✓ Completed" : "Mark Module Complete"}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1 — AMPLITUDE IS MORE THAN PROBABILITY                            */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Section 1 · Foundations
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Magnitude vs Phase</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Amplitude Is More Than Probability
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            In Modules 2 through 4, we saw that a qubit state is written as:
          </p>

          <div className="p-4 rounded-xl bg-black/40 border border-amber-500/30 font-mono text-center max-w-md mx-auto">
            <MathHTMLContainer html="$$|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$$" />
          </div>

          <p>
            When we measure in the computational basis, the probabilities are given by Born's rule:
          </p>

          <div className="p-3 rounded-xl bg-black/40 border border-white/10 font-mono text-xs max-w-md mx-auto text-center space-x-6">
            <span>P(0) = |α|²</span>
            <span>P(1) = |β|²</span>
          </div>

          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs sm:text-sm space-y-2">
            <div>
              💡 <strong>Core Discovery:</strong> The magnitude of an amplitude determines its probability, but an amplitude also carries a <strong>phase</strong>!
            </div>
            <p className="text-[11px] text-amber-100/80">
              An amplitude α can be expressed in polar form as α = r(cos φ + i sin φ), where <strong>r = |α|</strong> is the magnitude and <strong>φ</strong> is the phase angle.
            </p>
          </div>
        </div>

        {/* Interactive: Amplitude Explorer */}
        <div className="mt-8 p-6 rounded-2xl bg-black/40 border border-amber-500/30 max-w-xl mx-auto space-y-6">
          <div className="text-xs font-bold text-[var(--color-app-text-main)] uppercase tracking-wider text-center">
            Interactive: Amplitude Explorer (Magnitude vs. Phase)
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <div className="flex justify-between text-[var(--color-app-text-muted)] mb-1">
                <span>Magnitude r = |α|:</span>
                <strong className="text-white">{sec1Mag}</strong>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={sec1Mag}
                onChange={(e) => setSec1Mag(parseFloat(e.target.value))}
                className="w-full accent-amber-400"
              />
              <span className="text-[10px] text-[var(--color-app-text-light)]">
                Controls the size of the amplitude in [0, 1].
              </span>
            </div>

            <div>
              <div className="flex justify-between text-[var(--color-app-text-muted)] mb-1">
                <span>Phase φ:</span>
                <strong className="text-cyan-300">{sec1Phase}°</strong>
              </div>
              <input
                type="range"
                min="0"
                max="355"
                step="5"
                value={sec1Phase}
                onChange={(e) => setSec1Phase(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400"
              />
              <span className="text-[10px] text-[var(--color-app-text-light)]">
                Rotates the direction angle without changing magnitude.
              </span>
            </div>
          </div>

          {/* Live Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-[var(--color-app-text-muted)] block">Amplitude α</span>
              <span className="text-amber-300 font-bold text-xs mt-1 block">
                {sec1Complex.a} {sec1Complex.b >= 0 ? "+" : "-"} {Math.abs(sec1Complex.b)}i
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-[var(--color-app-text-muted)] block">Magnitude |α|</span>
              <span className="text-white font-bold text-sm mt-1 block">{sec1Mag}</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-[var(--color-app-text-muted)] block">Phase φ</span>
              <span className="text-cyan-300 font-bold text-sm mt-1 block">{sec1Phase}°</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-[var(--color-app-text-muted)] block">|α|² Value</span>
              <span className="text-emerald-400 font-bold text-sm mt-1 block">{sec1Complex.probContrib}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/50 border border-white/10 text-xs text-[var(--color-app-text-muted)] leading-relaxed space-y-1">
            <div className="text-[var(--color-app-text-main)] font-semibold">
              Probability contribution of this amplitude: {sec1Complex.probPct}%
            </div>
            <p className="text-[11px] text-[var(--color-app-text-light)]">
              (In a complete normalized state |ψ⟩ = α|0⟩ + β|1⟩, the total probability requires |α|² + |β|² = 1).
            </p>
            <p className="text-[11px] text-amber-200/90 pt-1">
              Notice: Rotating the phase slider changes α continuously, but <strong>leaves |α|² completely unchanged</strong>!
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2 — THE PHASE DIAL                                                */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Section 2 · The Dial
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Relative Phase in Superpositions</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          The Phase Dial: Equal Superpositions with Variable Phase
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            Consider a normalized state where both computational basis states have equal magnitude 1/√2:
          </p>

          <div className="p-4 rounded-xl bg-black/40 border border-blue-500/30 font-mono text-center max-w-md mx-auto">
            <MathHTMLContainer html="$$|\psi\rangle = \frac{1}{\sqrt{2}}|0\rangle + \frac{e^{i\varphi}}{\sqrt{2}}|1\rangle$$" />
          </div>

          <p>
            Here, <strong>φ</strong> is the <strong>relative phase</strong> between the |0⟩ and |1⟩ components.
          </p>
        </div>

        {/* Interactive: Phase Dial */}
        <div className="mt-8 p-6 rounded-2xl bg-black/40 border border-blue-500/30 max-w-xl mx-auto space-y-6">
          <div className="text-xs font-bold text-[var(--color-app-text-main)] uppercase tracking-wider text-center">
            Interactive: Relative Phase Dial
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-4 gap-2 font-mono text-xs">
            {[0, 90, 180, 270].map((deg) => (
              <button
                key={deg}
                onClick={() => setSec2Phase(deg)}
                className={`py-2 rounded-xl font-bold border transition-all ${
                  sec2Phase === deg
                    ? "bg-blue-600 text-white border-blue-400 shadow-md"
                    : "bg-white/5 border-white/10 text-[var(--color-app-text-muted)] hover:bg-white/10"
                }`}
              >
                {deg}° {deg === 0 ? "(|+⟩)" : deg === 180 ? "(|−⟩)" : ""}
              </button>
            ))}
          </div>

          {/* Continuous Slider */}
          <div className="space-y-1 font-mono text-xs">
            <div className="flex justify-between text-[var(--color-app-text-muted)]">
              <span>Continuous Angle φ:</span>
              <strong className="text-cyan-300">{sec2Phase}°</strong>
            </div>
            <input
              type="range"
              min="0"
              max="355"
              step="5"
              value={sec2Phase}
              onChange={(e) => setSec2Phase(parseInt(e.target.value, 10))}
              className="w-full accent-blue-400"
            />
          </div>

          {/* Live Equation & Measurement Probabilities */}
          <div className="p-5 rounded-xl bg-black/60 border border-white/10 text-center space-y-3 font-mono">
            <div className="text-xs text-[var(--color-app-text-muted)]">Resulting Quantum State:</div>
            <div className="py-1">
              <MathHTMLContainer html={sec2Details.latex} />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
              <div className="p-3 rounded-lg bg-white/5">
                <span className="text-[var(--color-app-text-muted)] block text-[10px]">P(0) in Computational Basis:</span>
                <span className="text-emerald-400 font-bold text-base">50%</span>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <span className="text-[var(--color-app-text-muted)] block text-[10px]">P(1) in Computational Basis:</span>
                <span className="text-emerald-400 font-bold text-base">50%</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs text-blue-200 text-center leading-relaxed">
            💡 <strong>Key Observation:</strong> Changing the relative phase φ here <strong>does not change the computational-basis probabilities</strong>. They remain strictly 50/50 for any angle!
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3 — SAME PROBABILITIES, DIFFERENT STATES                          */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Section 3 · The Hero Concept
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">|+⟩ vs |−⟩</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Same Probabilities, Different States
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            Let's place the two most famous superpositions side-by-side:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto font-mono text-xs">
            <div className={`p-4 rounded-xl border text-center transition-all ${
              sec3Selected === "plus"
                ? "bg-purple-950/40 border-purple-400 shadow-md ring-1 ring-purple-400"
                : "bg-black/40 border-white/10"
            }`}
            onClick={() => setSec3Selected("plus")}>
              <span className="text-cyan-300 font-bold text-lg block mb-1">|+⟩ State</span>
              <div className="py-2">
                <MathHTMLContainer html="$$|+\rangle = \frac{|0\rangle + |1\rangle}{\sqrt{2}}$$" />
              </div>
              <span className="text-[11px] text-[var(--color-app-text-muted)]">Relative Phase: 0°</span>
            </div>

            <div className={`p-4 rounded-xl border text-center transition-all ${
              sec3Selected === "minus"
                ? "bg-purple-950/40 border-purple-400 shadow-md ring-1 ring-purple-400"
                : "bg-black/40 border-white/10"
            }`}
            onClick={() => setSec3Selected("minus")}>
              <span className="text-pink-300 font-bold text-lg block mb-1">|−⟩ State</span>
              <div className="py-2">
                <MathHTMLContainer html="$$|-\rangle = \frac{|0\rangle - |1\rangle}{\sqrt{2}}$$" />
              </div>
              <span className="text-[11px] text-[var(--color-app-text-muted)]">Relative Phase: 180°</span>
            </div>
          </div>

          {/* Comparative Properties Table */}
          <div className="overflow-x-auto max-w-xl mx-auto pt-2">
            <table className="w-full text-xs font-mono border border-white/10 rounded-xl overflow-hidden text-center">
              <thead className="bg-white/5 text-[var(--color-app-text-main)]">
                <tr>
                  <th className="p-3 border-b border-white/10 text-left">Property</th>
                  <th className="p-3 border-b border-white/10 text-cyan-300">|+⟩</th>
                  <th className="p-3 border-b border-white/10 text-pink-300">|−⟩</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[var(--color-app-text-muted)]">
                <tr>
                  <td className="p-2.5 text-left font-sans">|0⟩ amplitude</td>
                  <td className="p-2.5 text-white">+1/√2</td>
                  <td className="p-2.5 text-white">+1/√2</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-left font-sans">|1⟩ amplitude</td>
                  <td className="p-2.5 text-emerald-400">+1/√2</td>
                  <td className="p-2.5 text-pink-400">−1/√2</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-left font-sans">P(0)</td>
                  <td className="p-2.5 text-emerald-400 font-bold">50%</td>
                  <td className="p-2.5 text-emerald-400 font-bold">50%</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-left font-sans">P(1)</td>
                  <td className="p-2.5 text-emerald-400 font-bold">50%</td>
                  <td className="p-2.5 text-emerald-400 font-bold">50%</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-left font-sans">Relative phase</td>
                  <td className="p-2.5 text-cyan-300 font-bold">0°</td>
                  <td className="p-2.5 text-pink-300 font-bold">180°</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 text-xs sm:text-sm space-y-2 max-w-xl mx-auto">
            <div className="font-bold">
              Are these the same quantum state?
            </div>
            <p className="leading-relaxed">
              <strong>No.</strong> The minus sign corresponds to a 180° relative phase between the |0⟩ and |1⟩ components.
            </p>
            <p className="leading-relaxed text-[11px] text-purple-300/90">
              That phase difference does not change their computational-basis probabilities, but it can change what happens when we apply another quantum operation.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4 — RELATIVE PHASE VS GLOBAL PHASE                                */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Section 4 · Conceptual Distinction
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Global vs Relative</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Relative Phase vs. Global Phase
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            In quantum physics, the word "phase" is used in two very different ways. It is essential to distinguish them:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="p-5 rounded-xl bg-black/40 border border-white/10 space-y-3 font-mono">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Global Phase
              </div>
              <div className="text-center py-1">
                <MathHTMLContainer html="$$|\psi'\rangle = e^{i\varphi}|\psi\rangle$$" />
              </div>
              <p className="text-xs text-[var(--color-app-text-muted)] leading-relaxed font-sans">
                Multiplies the <strong>entire state</strong> by the same overall factor e^(iφ).
              </p>
              <div className="text-[11px] text-amber-200/80 font-sans border-t border-white/5 pt-2">
                Has no observable consequence by itself in any measurement or circuit.
              </div>
            </div>

            <div className="p-5 rounded-xl bg-black/40 border border-cyan-500/40 space-y-3 font-mono">
              <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                Relative Phase
              </div>
              <div className="text-center py-1">
                <MathHTMLContainer html="$$|\psi\rangle = \alpha|0\rangle + \beta e^{i\varphi}|1\rangle$$" />
              </div>
              <p className="text-xs text-[var(--color-app-text-muted)] leading-relaxed font-sans">
                A phase difference <strong>between components</strong> inside the superposition.
              </p>
              <div className="text-[11px] text-cyan-200/80 font-sans border-t border-white/5 pt-2">
                Can affect future quantum operations and observable outcomes!
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/30 border border-white/10 text-xs text-center text-[var(--color-app-text-main)] max-w-xl mx-auto font-medium">
            ⚖️ <strong>Scientific Principle:</strong> Global phase is not observable by itself. Relative phase can affect observable outcomes.
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5 — HOW CAN WE SEE THE PHASE? (PRIMARY EXPERIMENT)                */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Section 5 · The Experiment
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Revealing Phase with Hadamard</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          How Can We See the Phase? The Hadamard Test
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            If |+⟩ and |−⟩ both produce 50/50 in the computational basis, how can we prove they are different?
          </p>
          <p>
            <strong>Apply a Hadamard (H) gate before measuring!</strong>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs max-w-lg mx-auto text-center">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              |+⟩ ⟶ <strong>H</strong> ⟶ <span className="text-cyan-300 font-bold">|0⟩ (100% 0)</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              |−⟩ ⟶ <strong>H</strong> ⟶ <span className="text-pink-300 font-bold">|1⟩ (100% 1)</span>
            </div>
          </div>
        </div>

        {/* Interactive: Predict -> Apply -> Measure -> Compare */}
        <div className="mt-8 p-6 rounded-2xl bg-black/40 border border-emerald-500/30 max-w-xl mx-auto space-y-6">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--color-app-text-muted)]">State to Test:</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleSec5Prepare("plus")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  sec5State === "plus"
                    ? "bg-cyan-600 text-white shadow-md"
                    : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
                }`}
              >
                |+⟩ (0° phase)
              </button>
              <button
                onClick={() => handleSec5Prepare("minus")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  sec5State === "minus"
                    ? "bg-pink-600 text-white shadow-md"
                    : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
                }`}
              >
                |−⟩ (180° phase)
              </button>
            </div>
          </div>

          {/* Stepper Visual */}
          <div className="p-5 rounded-xl bg-black/60 border border-white/10 font-mono text-xs space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-20 text-[var(--color-app-text-muted)] text-[11px]">Preparation:</span>
              <span className="text-white font-bold">{sec5State === "plus" ? "|+⟩" : "|−⟩"}</span>
              <span className="text-white/20">──</span>
              <span className={`px-2.5 py-1 rounded border ${sec5Step >= 1 ? "bg-blue-600 text-white font-bold border-blue-400" : "bg-white/5 border-white/10 text-white/40"}`}>
                H
              </span>
              <span className="text-white/20">──</span>
              <span className={`px-2.5 py-1 rounded border ${sec5Step >= 2 ? "bg-emerald-600 text-white font-bold border-emerald-400" : "bg-white/5 border-white/10 text-white/40"}`}>
                [M]
              </span>
              <span className="text-white/20">──</span>
              <span className="text-emerald-400 font-bold text-sm">
                {sec5Step === 2 ? `Outcome: ${sec5Outcome}` : "?"}
              </span>
            </div>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono text-[var(--color-app-text-muted)]">
              {sec5Step === 0 && "Step 0: Prepared state (Both measure 50/50 without H)"}
              {sec5Step === 1 && `Step 1: H applied! Transformed to ${sec5State === "plus" ? "|0⟩" : "|1⟩"}`}
              {sec5Step === 2 && `Step 2: Measured! Outcome is definitely ${sec5Outcome}`}
            </div>

            <div className="flex gap-2">
              {sec5Step === 0 && (
                <button
                  onClick={handleSec5ApplyH}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold transition-all"
                >
                  Apply H Gate
                </button>
              )}
              {sec5Step === 1 && (
                <button
                  onClick={handleSec5Measure}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all"
                >
                  Measure [M]
                </button>
              )}
              {sec5Step === 2 && (
                <button
                  onClick={handleSec5Reset}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition-all"
                >
                  Test Again
                </button>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-200 leading-relaxed">
            💡 <strong>The Lesson:</strong> Before H, both states produced 50/50. But because they carry different relative phases, the H gate converted |+⟩ to |0⟩ and |−⟩ to |1⟩. <strong>Operations can reveal phase!</strong>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6 — PHASE CAN CHANGE WHAT HAPPENS NEXT                            */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Section 6 · Generalization
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Continuous Phase Steering</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Phase Can Change What Happens Next
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            What happens if the relative phase φ is not just 0° or 180°, but any arbitrary angle?
          </p>

          <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/30 font-mono text-center max-w-lg mx-auto space-y-2 text-xs">
            <div className="text-[var(--color-app-text-muted)]">Applying H to (|0⟩ + e^(iφ)|1⟩)/√2 yields probabilities:</div>
            <div className="text-cyan-300 font-bold text-sm">
              P(0) = cos²(φ/2) = (1 + cos φ) / 2
            </div>
            <div className="text-pink-300 font-bold text-sm">
              P(1) = sin²(φ/2) = (1 - cos φ) / 2
            </div>
          </div>
        </div>

        {/* Interactive Phase Tester */}
        <div className="mt-8 p-6 rounded-2xl bg-black/40 border border-cyan-500/30 max-w-xl mx-auto space-y-6">
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between text-[var(--color-app-text-muted)]">
              <span>Relative Phase φ:</span>
              <strong className="text-cyan-300">{sec6Phase}°</strong>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="15"
              value={sec6Phase}
              onChange={(e) => setSec6Phase(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400"
            />
            {/* Quick Benchmark Buttons */}
            <div className="flex gap-2 pt-1">
              {[0, 90, 180, 270].map((d) => (
                <button
                  key={d}
                  onClick={() => setSec6Phase(d)}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-all ${
                    sec6Phase === d
                      ? "bg-cyan-600 text-white border-cyan-400"
                      : "bg-white/5 border-white/10 text-[var(--color-app-text-muted)] hover:bg-white/10"
                  }`}
                >
                  {d}°
                </button>
              ))}
            </div>
          </div>

          {/* Expected Probabilities Display */}
          <div className="grid grid-cols-2 gap-3 text-center font-mono text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-[var(--color-app-text-muted)] block">Theoretical P(0) after H:</span>
              <span className="text-cyan-300 font-bold text-base">{sec6Probs.p0}%</span>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] text-[var(--color-app-text-muted)] block">Theoretical P(1) after H:</span>
              <span className="text-pink-300 font-bold text-base">{sec6Probs.p1}%</span>
            </div>
          </div>

          {/* Sampling Workbench */}
          <div className="pt-2 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[var(--color-app-text-muted)]">
                Sample Runs ({sec6Counts.total} shots):
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleSec6SampleOne}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all"
                >
                  +1 Shot
                </button>
                <button
                  onClick={handleSec6SampleTen}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all"
                >
                  +10 Shots
                </button>
                <button
                  onClick={handleSec6Reset}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition-all"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Frequencies Bar */}
            <div className="grid grid-cols-2 gap-3 text-center font-mono text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/30">
                <span className="text-cyan-300 font-bold">Outcome 0: {sec6Counts.c0}</span>
                <span className="text-[10px] text-[var(--color-app-text-muted)] block mt-0.5">
                  ({sec6Counts.total > 0 ? Math.round((sec6Counts.c0 / sec6Counts.total) * 100) : 0}%)
                </span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-pink-500/30">
                <span className="text-pink-300 font-bold">Outcome 1: {sec6Counts.c1}</span>
                <span className="text-[10px] text-[var(--color-app-text-muted)] block mt-0.5">
                  ({sec6Counts.total > 0 ? Math.round((sec6Counts.c1 / sec6Counts.total) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7 — PHASE AND INTERFERENCE (CONCEPTUAL TEASER)                     */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/30">
            Section 7 · Looking Ahead
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Constructive & Destructive Interference</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Phase and Interference
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p className="text-base font-semibold text-[var(--color-app-text-main)]">
            Quantum amplitudes can combine in ways that resemble wave interference.
          </p>

          <p>
            When a quantum gate transforms a state, different computational paths add together:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto font-mono text-xs">
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2 text-center">
              <span className="text-emerald-300 font-bold block">Constructive Interference</span>
              <div className="text-[var(--color-app-text-muted)] text-[11px]">
                (+α) + (+α) = +2α<br />
                Amplitudes reinforce each other, boosting probability!
              </div>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-2 text-center">
              <span className="text-rose-300 font-bold block">Destructive Interference</span>
              <div className="text-[var(--color-app-text-muted)] text-[11px]">
                (+α) + (−α) = 0<br />
                Amplitudes cancel out, reducing probability to zero!
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs text-center text-amber-200 max-w-xl mx-auto leading-relaxed">
            💡 <strong>The Crucial Insight:</strong> The important idea is that <strong>amplitudes—not probabilities—combine before probabilities are calculated</strong>. This ability to cancel wrong answers and reinforce correct ones is the engine of quantum computing!
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 8 — PHASE CHALLENGE LAB & SUMMARY                                  */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Section 8 · Challenge Lab
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Verification & Summary</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Phase Challenge Lab
        </h2>

        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Challenge 1 */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="text-xs font-bold text-[var(--color-app-text-main)] flex items-center justify-between">
              <span>Challenge 1: Same Probability</span>
              {chSubmitted[1] && (
                <span className={chAnswers[1] === "pair" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {chAnswers[1] === "pair" ? "✓ Correct" : "✗ Try again"}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-app-text-muted)]">
              Which pair of states have identical 50/50 measurement probabilities in the computational basis?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-xs">
              {[
                { id: "pair", label: "|+⟩ and |−⟩" },
                { id: "01", label: "|0⟩ and |1⟩" },
                { id: "0plus", label: "|0⟩ and |+⟩" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectChallenge(1, opt.id)}
                  className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                    chAnswers[1] === opt.id
                      ? opt.id === "pair"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : "bg-rose-500/20 border-rose-500 text-rose-300"
                      : "bg-white/5 border-white/10 text-[var(--color-app-text-muted)] hover:bg-white/10"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {chSubmitted[1] && (
              <p className="text-[11px] text-[var(--color-app-text-light)] pt-1">
                Explanation: |+⟩ and |−⟩ both yield 50% for 0 and 50% for 1 in the standard computational basis.
              </p>
            )}
          </div>

          {/* Challenge 2 */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="text-xs font-bold text-[var(--color-app-text-main)] flex items-center justify-between">
              <span>Challenge 2: Identify the Relative Phase</span>
              {chSubmitted[2] && (
                <span className={chAnswers[2] === 180 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {chAnswers[2] === 180 ? "✓ Correct" : "✗ Try again"}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-app-text-muted)]">
              Given the state (|0⟩ − |1⟩)/√2, what is the relative phase between the |0⟩ and |1⟩ components?
            </p>
            <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-xs">
              {[0, 90, 180, 270].map((deg) => (
                <button
                  key={deg}
                  onClick={() => handleSelectChallenge(2, deg)}
                  className={`py-2 rounded-xl font-bold border transition-all ${
                    chAnswers[2] === deg
                      ? deg === 180
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : "bg-rose-500/20 border-rose-500 text-rose-300"
                      : "bg-white/5 border-white/10 text-[var(--color-app-text-muted)] hover:bg-white/10"
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>
            {chSubmitted[2] && (
              <p className="text-[11px] text-[var(--color-app-text-light)] pt-1">
                Explanation: The factor of −1 in front of |1⟩ corresponds to e^(iπ) = −1, which is a relative phase of 180°.
              </p>
            )}
          </div>

          {/* Challenge 3 */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="text-xs font-bold text-[var(--color-app-text-main)] flex items-center justify-between">
              <span>Challenge 3: Reveal the Difference</span>
              {chSubmitted[3] && (
                <span className={chAnswers[3] === "H" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {chAnswers[3] === "H" ? "✓ Correct" : "✗ Try again"}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-app-text-muted)]">
              Which single-qubit gate can reveal the difference between |+⟩ and |−⟩ in the computational basis?
            </p>
            <div className="grid grid-cols-4 gap-2 pt-1 font-mono text-xs">
              {["X", "Y", "Z", "H"].map((g) => (
                <button
                  key={g}
                  onClick={() => handleSelectChallenge(3, g)}
                  className={`py-2 rounded-xl font-bold border transition-all ${
                    chAnswers[3] === g
                      ? g === "H"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : "bg-rose-500/20 border-rose-500 text-rose-300"
                      : "bg-white/5 border-white/10 text-[var(--color-app-text-muted)] hover:bg-white/10"
                  }`}
                >
                  {g} gate
                </button>
              ))}
            </div>
            {chSubmitted[3] && (
              <p className="text-[11px] text-[var(--color-app-text-light)] pt-1">
                Explanation: The Hadamard (H) gate transforms |+⟩ into |0⟩ (100% 0) and |−⟩ into |1⟩ (100% 1).
              </p>
            )}
          </div>

          {/* Challenge 4: Free Phase Experiment */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4">
            <div className="text-xs font-bold text-[var(--color-app-text-main)] flex items-center justify-between">
              <span>Challenge 4: Free Phase Experiment</span>
              <span className="text-[10px] font-mono text-cyan-300">Interactive Sandbox</span>
            </div>
            <p className="text-xs text-[var(--color-app-text-muted)]">
              Adjust the relative phase φ to any angle, then click "Run 50 Shots" to observe the experimental outcome distribution after applying H:
            </p>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between text-[var(--color-app-text-muted)]">
                <span>Chosen Phase φ:</span>
                <strong className="text-cyan-300">{sec8Phase}°</strong>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="10"
                value={sec8Phase}
                onChange={(e) => setSec8Phase(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleSec8RunBatch}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all"
              >
                Apply H & Run 50 Shots
              </button>

              <div className="flex gap-3 font-mono text-xs">
                <span className="text-cyan-300">0: {sec8Shots[0]}</span>
                <span className="text-pink-300">1: {sec8Shots[1]}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FINAL SUMMARY                                                             */}
        {/* ========================================================================= */}
        <div className="mt-12 pt-8 border-t border-white/10 space-y-6">
          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-3 max-w-2xl mx-auto">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-app-text-main)]">
              8 Core Takeaways:
            </div>
            <ol className="list-decimal pl-5 text-xs text-[var(--color-app-text-muted)] space-y-2 leading-relaxed">
              <li><strong>Complex amplitudes:</strong> Quantum states are described by complex probability amplitudes.</li>
              <li><strong>Magnitude squared:</strong> The squared magnitude |α|² determines the computational-basis measurement probability.</li>
              <li><strong>Phase information:</strong> Amplitudes also carry phase φ, which is not directly revealed by computational-basis probabilities.</li>
              <li><strong>Phase invariance:</strong> Changing relative phase does not necessarily change immediate computational-basis measurement probabilities.</li>
              <li><strong>Same probabilities ≠ same state:</strong> Two states can have identical 50/50 probabilities while being fundamentally different quantum states.</li>
              <li><strong>|+⟩ and |−⟩:</strong> Demonstrate this distinction clearly (0° phase vs 180° phase).</li>
              <li><strong>Operations reveal phase:</strong> Relative phase changes how states respond to subsequent quantum operations like the Hadamard gate.</li>
              <li><strong>Interference:</strong> Amplitudes combine before probabilities are calculated, enabling constructive and destructive interference.</li>
            </ol>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-orange-950/40 to-black border border-amber-500/30 text-xs sm:text-sm text-center text-amber-200 max-w-2xl mx-auto leading-relaxed">
            🚀 <strong>Looking Ahead:</strong> We've learned that phase is an essential part of a qubit's state. But where does that phase actually live geometrically? Next: <strong>Module 6 — Bloch Sphere</strong>.
          </div>

          <div className="text-center pt-4">
            <button
              onClick={onComplete}
              className={`px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xl ${
                isCompleted
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white"
              }`}
            >
              {isCompleted ? "✓ Module Completed" : "Complete Module 5"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
