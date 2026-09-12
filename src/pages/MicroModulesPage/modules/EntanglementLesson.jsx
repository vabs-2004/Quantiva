import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import MathHTMLContainer from "../../../components/MathHTMLContainer/MathHTMLContainer";
import StateProbabilityHeatmap from "../../../components/StateProbabilityHeatmap/StateProbabilityHeatmap";

export default function EntanglementLesson({ onComplete, isCompleted, onAskQuantiva }) {
  const navigate = useNavigate();

  // =========================================================================
  // STATE MANAGEMENT ACROSS 8 SECTIONS
  // =========================================================================

  // Section 1: Two-Qubit State Builder
  const [sec1Basis, setSec1Basis] = useState("00"); // "00", "01", "10", "11"

  // Section 2: Measure Together (Correlated State)
  const [sec2History, setSec2History] = useState(["00", "11", "00", "11"]);
  const [sec2CurrentOutcome, setSec2CurrentOutcome] = useState(null);

  // Section 4: Create Entanglement Stepper (|00⟩ -> H -> CNOT -> M)
  const [sec4Step, setSec4Step] = useState(0); // 0: |00⟩, 1: H(q₀), 2: CNOT(q₀,q₁), 3: Measured
  const [sec4Outcome, setSec4Outcome] = useState(null); // "00" or "11"

  // Section 5: Measure One Qubit (q₀ first, then q₁)
  const [sec5Step, setSec5Step] = useState(0); // 0: Prepared |Φ⁺⟩, 1: Measured q₀, 2: Measured q₁
  const [sec5Q0Outcome, setSec5Q0Outcome] = useState(null); // 0 or 1
  const [sec5Q1Outcome, setSec5Q1Outcome] = useState(null); // 0 or 1

  // Section 6: Entanglement Explorer (Independent vs Entangled Live Table)
  const [sec6Runs, setSec6Runs] = useState([
    { id: 1, indep: "01", entang: "00" },
    { id: 2, indep: "11", entang: "11" },
    { id: 3, indep: "00", entang: "00" },
    { id: 4, indep: "10", entang: "11" },
  ]);

  // Section 8: Challenge Lab
  const [chAnswers, setChAnswers] = useState({ 1: null, 2: null, 3: null, 4: null });
  const [chSubmitted, setChSubmitted] = useState({ 1: false, 2: false, 3: false, 4: false });

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------

  // Section 2: Sample prepared correlated pair
  const handleSec2Measure = () => {
    const outcome = Math.random() < 0.5 ? "00" : "11";
    setSec2CurrentOutcome(outcome);
    setSec2History((prev) => [outcome, ...prev.slice(0, 7)]);
  };

  // Section 4: Advance H -> CNOT circuit
  const handleSec4Advance = () => {
    if (sec4Step === 0) setSec4Step(1); // H
    else if (sec4Step === 1) setSec4Step(2); // CNOT
    else if (sec4Step === 2) {
      const res = Math.random() < 0.5 ? "00" : "11";
      setSec4Outcome(res);
      setSec4Step(3); // Measure
    }
  };

  const handleSec4Reset = () => {
    setSec4Step(0);
    setSec4Outcome(null);
  };

  // Section 5: Measure q₀ then q₁
  const handleSec5MeasureQ0 = () => {
    const res0 = Math.random() < 0.5 ? 0 : 1;
    setSec5Q0Outcome(res0);
    setSec5Step(1);
  };

  const handleSec5MeasureQ1 = () => {
    // Deterministically matches q₀ outcome for |Φ⁺⟩
    setSec5Q1Outcome(sec5Q0Outcome);
    setSec5Step(2);
  };

  const handleSec5Reset = () => {
    setSec5Step(0);
    setSec5Q0Outcome(null);
    setSec5Q1Outcome(null);
  };

  // Section 6: Sample 1 or 10 runs
  const sampleSec6Run = () => {
    const indepOptions = ["00", "01", "10", "11"];
    const randIndep = indepOptions[Math.floor(Math.random() * 4)];
    const randEntang = Math.random() < 0.5 ? "00" : "11";
    return { indep: randIndep, entang: randEntang };
  };

  const handleSec6SampleOne = () => {
    const nextId = sec6Runs.length + 1;
    const run = sampleSec6Run();
    setSec6Runs((prev) => [{ id: nextId, ...run }, ...prev.slice(0, 9)]);
  };

  const handleSec6SampleTen = () => {
    const batch = [];
    const baseId = sec6Runs.length;
    for (let i = 1; i <= 10; i++) {
      const run = sampleSec6Run();
      batch.unshift({ id: baseId + i, ...run });
    }
    setSec6Runs((prev) => [...batch, ...prev].slice(0, 10));
  };

  const handleSec6Reset = () => {
    setSec6Runs([
      { id: 1, indep: "01", entang: "00" },
      { id: 2, indep: "11", entang: "11" },
      { id: 3, indep: "00", entang: "00" },
      { id: 4, indep: "10", entang: "11" },
    ]);
  };

  // Calculated distributions for Section 6
  const sec6Counts = useMemo(() => {
    const indep = { "00": 0, "01": 0, "10": 0, "11": 0 };
    const entang = { "00": 0, "01": 0, "10": 0, "11": 0 };
    sec6Runs.forEach((r) => {
      if (indep[r.indep] !== undefined) indep[r.indep]++;
      if (entang[r.entang] !== undefined) entang[r.entang]++;
    });
    return { indep, entang, total: sec6Runs.length };
  }, [sec6Runs]);

  // Section 8: Challenge check
  const handleSelectChallenge = (chId, choice) => {
    setChAnswers((prev) => ({ ...prev, [chId]: choice }));
    setChSubmitted((prev) => ({ ...prev, [chId]: true }));
  };

  return (
    <div className="space-y-12 pb-16">
      {/* ========================================================================= */}
      {/* MODULE HEADER & TOP PROGRESS BAR                                         */}
      {/* ========================================================================= */}
      <div className="rounded-3xl p-6 sm:p-10 app-glass border border-[var(--color-app-border)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Foundations · Module 11
              </span>
              <span className="text-xs font-medium text-[var(--color-app-text-muted)]">
                8 Focused Interactive Sections
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-app-text-main)] tracking-tight">
              Entanglement
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-app-text-muted)] max-w-2xl leading-relaxed">
              Can two qubits have a state that cannot be described independently? Discover quantum joint states, correlation vs. entanglement, and non-separable quantum pairs.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            <button
              onClick={() => onAskQuantiva && onAskQuantiva({
                topicId: "entanglement",
                title: "Entanglement",
                section: "Overview",
                prompt: "What makes entanglement different from ordinary correlation, and how does H + CNOT create an entangled state?",
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
                  : "bg-purple-600 hover:bg-purple-500 text-white"
              }`}
            >
              {isCompleted ? "✓ Completed" : "Mark Module Complete"}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1 — ONE QUBIT ISN'T ENOUGH                                        */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Section 1 · The Expansion
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">From One Qubit to Two</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          One Qubit Isn't Enough: Two-Qubit Joint States
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            In Modules 1 through 10, we worked primarily with single qubits: states like |0⟩, |1⟩, and |+⟩. But quantum computing achieves its true computational power when qubits work together.
          </p>

          <p>
            When we have two qubits, labeled <strong>q₀</strong> and <strong>q₁</strong>, their combined system has <strong>four computational basis states</strong>:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs text-center max-w-lg mx-auto">
            {["00", "01", "10", "11"].map((b) => (
              <div key={b} className="p-3 rounded-xl bg-black/40 border border-white/10 text-cyan-300 font-bold">
                |{b}⟩
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 font-medium">
            💡 <strong>Core Principle:</strong> With two qubits, we need to describe a <strong>joint quantum state</strong> of the pair. We can no longer assume that each qubit can always be considered completely in isolation.
          </div>
        </div>

        {/* Interactive: Two-Qubit State Builder */}
        <div className="mt-6 p-6 rounded-2xl bg-black/40 border border-white/10 max-w-xl mx-auto space-y-4">
          <div className="text-xs font-bold text-[var(--color-app-text-main)] text-center">
            Interactive: Two-Qubit State Builder
          </div>
          <div className="flex justify-center gap-2">
            {["00", "01", "10", "11"].map((b) => (
              <button
                key={b}
                onClick={() => setSec1Basis(b)}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
                  sec1Basis === b
                    ? "bg-purple-600 text-white ring-2 ring-purple-400 shadow-md"
                    : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
                }`}
              >
                |{b}⟩
              </button>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs font-mono space-y-2">
            <div className="flex justify-between text-[var(--color-app-text-main)]">
              <span>Selected Joint State:</span>
              <strong className="text-cyan-300">|{sec1Basis}⟩</strong>
            </div>
            <div className="flex justify-between text-[var(--color-app-text-muted)] text-[11px]">
              <span>Wire q₀ = {sec1Basis[0]}</span>
              <span>Wire q₁ = {sec1Basis[1]}</span>
            </div>
            <div className="pt-2">
              <StateProbabilityHeatmap probabilities={{ [sec1Basis]: 1.0 }} />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2 — WHAT DOES "CORRELATED" MEAN?                                   */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Section 2 · Foundations of Correlation
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Measurement Interdependence</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          What Does “Correlated” Mean?
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            Before exploring entanglement, we must first understand what <strong>correlation</strong> means.
          </p>

          <p>
            Consider a simple classical example: suppose two coins are prepared inside sealed envelopes so that they always match. If you open envelope A and see Heads, you immediately know envelope B also contains Heads. The two variables are not independent; they are <strong>correlated</strong>.
          </p>

          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 text-blue-200 font-medium">
            🔍 <strong>Let's prepare a pair whose computational-basis outcomes are perfectly correlated.</strong>
          </div>

          <p>
            Press the button below to sample repeated joint measurements of this prepared correlated pair:
          </p>
        </div>

        {/* Interactive: Measure Together */}
        <div className="mt-6 p-6 rounded-2xl bg-black/40 border border-blue-500/30 max-w-xl mx-auto space-y-4 text-center">
          <button
            onClick={handleSec2Measure}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold shadow-lg transition-all"
          >
            Measure Prepared Pair
          </button>

          {sec2CurrentOutcome && (
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 font-mono text-sm text-[var(--color-app-text-main)]">
              Latest Joint Measurement: <strong className="text-cyan-300 text-base">{sec2CurrentOutcome}</strong>
              <span className="text-xs text-[var(--color-app-text-muted)] ml-2">
                (q₀ = {sec2CurrentOutcome[0]}, q₁ = {sec2CurrentOutcome[1]})
              </span>
            </div>
          )}

          <div className="space-y-1">
            <div className="text-[11px] font-mono text-[var(--color-app-text-muted)]">Recent Observations:</div>
            <div className="flex justify-center gap-2 font-mono text-xs">
              {sec2History.map((out, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded bg-blue-950/50 border border-blue-500/30 text-blue-200 font-bold"
                >
                  {out}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-xs text-[var(--color-app-text-muted)] leading-relaxed text-left space-y-2">
            <div className="font-bold text-[var(--color-app-text-main)]">What do you notice?</div>
            <p>
              The measurement outcomes are correlated: when one qubit is measured as 0, the other is also 0; when one is 1, the other is also 1. You never observe 01 or 10.
            </p>
            <p className="text-[11px] text-[var(--color-app-text-light)] italic">
              Important: Do not call this correlation alone “entanglement” yet! Let us see why in Section 3.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3 — IS THIS JUST CLASSICAL CORRELATION?                           */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Section 3 · The Crucial Distinction
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Classical vs Quantum Correlation</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Is This Just Classical Correlation?
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            Now comes an essential question: <strong>Couldn't classical bits do exactly this?</strong>
          </p>

          <p className="text-base font-bold text-amber-300">
            Yes, absolutely.
          </p>

          <p>
            A classical procedure could flip a fair coin: if Heads, output 00; if Tails, output 11. That would produce 50% 00 and 50% 11, giving the exact same computational-basis statistics!
          </p>

          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 font-medium">
            ⚠️ <strong>Key Takeaway:</strong> Correlation alone does not identify entanglement.
          </div>

          <p>
            The profound difference lies in the nature of the physical state:
          </p>
        </div>

        {/* Comparative Cards: Classical Mixture vs Entangled State */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono">
              Classical Mixture
            </div>
            <p className="text-xs text-[var(--color-app-text-muted)] leading-relaxed">
              A 50/50 preparation that produces either 00 or 11, with <strong>no coherent superposition</strong> between those alternatives.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-black/40 border border-purple-500/40 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-purple-300 font-mono">
              Quantum Entangled State |Φ⁺⟩
            </div>
            <div className="font-mono text-xs py-1">
              <MathHTMLContainer html="$$|\Phi^+\rangle = \frac{|00\rangle + |11\rangle}{\sqrt{2}}$$" />
            </div>
            <p className="text-xs text-[var(--color-app-text-muted)] leading-relaxed">
              Where the alternatives are <strong>combined coherently in the joint quantum state</strong>.
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-black/30 border border-white/5 text-xs text-[var(--color-app-text-muted)] leading-relaxed max-w-2xl mx-auto">
          <strong>Scientific Principle:</strong> The special structure of the joint quantum state is what makes it entangled; matching computational-basis outcomes are one observable consequence.
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4 — CREATE ENTANGLEMENT                                           */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Section 4 · Synthesis
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Circuit Construction</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Create Entanglement: H Followed by CNOT
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            How do we actually create this entangled state in a quantum circuit? We start with two qubits in |00⟩ and apply two gates:
          </p>

          <ol className="list-decimal pl-5 space-y-1 text-xs sm:text-sm">
            <li><strong>Apply Hadamard (H) to q₀:</strong> Puts q₀ into superposition while q₁ remains |0⟩.</li>
            <li><strong>Apply CNOT across q₀ ⟶ q₁:</strong> Qubit q₀ acts as control, flipping q₁ if q₀ is 1.</li>
          </ol>

          <div className="p-4 rounded-xl bg-black/30 border border-white/10 text-center font-mono text-xs sm:text-sm max-w-md mx-auto">
            <MathHTMLContainer html="$$|00\rangle \xrightarrow{H(q_0)} \frac{|00\rangle + |10\rangle}{\sqrt{2}} \xrightarrow{CNOT(q_0, q_1)} \frac{|00\rangle + |11\rangle}{\sqrt{2}} = |\Phi^+\rangle$$" />
          </div>
        </div>

        {/* Interactive Stepper: Build -> Measure -> Reset */}
        <div className="mt-6 p-6 rounded-2xl bg-black/40 border border-emerald-500/30 max-w-xl mx-auto space-y-6">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--color-app-text-muted)]">Circuit Progression:</span>
            <span className="text-emerald-300 font-bold">
              {sec4Step === 0 && "Step 0: Initial State |00⟩"}
              {sec4Step === 1 && "Step 1: After H(q₀) -> (|00⟩+|10⟩)/√2"}
              {sec4Step === 2 && "Step 2: After CNOT(q₀,q₁) -> |Φ⁺⟩"}
              {sec4Step === 3 && `Step 3: Measured -> Outcome ${sec4Outcome}`}
            </span>
          </div>

          {/* Visual 2-Wire Circuit */}
          <div className="p-5 rounded-xl bg-black/60 border border-white/10 font-mono text-xs space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-14 text-[var(--color-app-text-muted)] text-[11px]">Wire q₀:</span>
              <span className="text-cyan-300 font-bold">|0⟩</span>
              <span className="text-white/20">──</span>
              <span className={`px-2.5 py-1 rounded border ${sec4Step >= 1 ? "bg-blue-600 text-white font-bold border-blue-400" : "bg-white/5 border-white/10 text-white/40"}`}>
                H
              </span>
              <span className="text-white/20">──</span>
              <span className={`h-3 w-3 rounded-full mx-1 ${sec4Step >= 2 ? "bg-pink-500 ring-2 ring-pink-400" : "bg-white/20"}`} />
              <span className="text-white/20">──</span>
              <span className={`px-2 py-1 rounded border ${sec4Step >= 3 ? "bg-emerald-600 text-white border-emerald-400" : "bg-white/5 border-white/10 text-white/40"}`}>
                [ M ]
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-14 text-[var(--color-app-text-muted)] text-[11px]">Wire q₁:</span>
              <span className="text-purple-300 font-bold">|0⟩</span>
              <span className="text-white/20">─────────────</span>
              <span className={`px-2 py-1 rounded border ${sec4Step >= 2 ? "bg-pink-600 text-white font-bold border-pink-400" : "bg-white/5 border-white/10 text-white/40"}`}>
                ⊕
              </span>
              <span className="text-white/20">──</span>
              <span className={`px-2 py-1 rounded border ${sec4Step >= 3 ? "bg-emerald-600 text-white border-emerald-400" : "bg-white/5 border-white/10 text-white/40"}`}>
                [ M ]
              </span>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            {sec4Step < 3 ? (
              <button
                onClick={handleSec4Advance}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shadow-lg transition-all"
              >
                {sec4Step === 0 ? "Step 1: Apply H(q₀)" : sec4Step === 1 ? "Step 2: Apply CNOT(q₀, q₁)" : "Step 3: Measure Pair"}
              </button>
            ) : (
              <button
                onClick={handleSec4Reset}
                className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition-all"
              >
                Reset & Try Again
              </button>
            )}
          </div>

          {sec4Outcome && (
            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-center font-mono text-xs text-emerald-200">
              Joint outcome: <strong>{sec4Outcome}</strong>. The two qubits collapsed together into |{sec4Outcome}⟩!
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5 — MEASURE ONE QUBIT                                             */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
            Section 5 · Partial Measurement
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Single-Qubit Observation</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Measure One Qubit: What Happens to the Joint State?
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            Suppose we prepare the entangled state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2. What happens if we measure <strong>only q₀</strong> and leave q₁ untouched?
          </p>

          <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-500/30 text-teal-200 font-medium space-y-1">
            <div>📌 <strong>Precise Collapse Rule:</strong></div>
            <p className="text-xs leading-relaxed">
              For |Φ⁺⟩, measuring q₀ as 0 projects the joint state onto |00⟩; measuring q₀ as 1 projects it onto |11⟩.
            </p>
            <p className="text-[11px] text-[var(--color-app-text-muted)] font-sans">
              (Note: This occurs specifically because |Φ⁺⟩ contains only |00⟩ and |11⟩ terms. Measuring one qubit does NOT automatically determine the other for arbitrary two-qubit states).
            </p>
          </div>
        </div>

        {/* Interactive Experiment: Measure q₀ then q₁ */}
        <div className="mt-6 p-6 rounded-2xl bg-black/40 border border-teal-500/30 max-w-xl mx-auto space-y-6">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--color-app-text-muted)]">Current State:</span>
            <span className="text-teal-300 font-bold">
              {sec5Step === 0 && "Prepared: |Φ⁺⟩ = (|00⟩+|11⟩)/√2"}
              {sec5Step === 1 && `q₀ measured as ${sec5Q0Outcome} ⟶ Joint State collapsed to |${sec5Q0Outcome}${sec5Q0Outcome}⟩`}
              {sec5Step === 2 && `q₁ measured as ${sec5Q1Outcome} (Matches q₀ deterministically!)`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center font-mono text-xs">
            <div className={`p-4 rounded-xl border ${sec5Step >= 1 ? "bg-teal-950/50 border-teal-400 text-teal-200" : "bg-white/5 border-white/10 text-white/30"}`}>
              <div className="text-[10px] text-[var(--color-app-text-muted)] uppercase mb-1">Qubit q₀</div>
              <div className="text-xl font-bold">{sec5Q0Outcome !== null ? sec5Q0Outcome : "—"}</div>
              <div className="text-[10px] text-[var(--color-app-text-muted)] mt-1">
                {sec5Step === 0 ? "Superposition" : `Measured ${sec5Q0Outcome}`}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${sec5Step >= 2 ? "bg-teal-950/50 border-teal-400 text-teal-200" : "bg-white/5 border-white/10 text-white/30"}`}>
              <div className="text-[10px] text-[var(--color-app-text-muted)] uppercase mb-1">Qubit q₁</div>
              <div className="text-xl font-bold">{sec5Q1Outcome !== null ? sec5Q1Outcome : "—"}</div>
              <div className="text-[10px] text-[var(--color-app-text-muted)] mt-1">
                {sec5Step < 2 ? "Unmeasured" : `Measured ${sec5Q1Outcome}`}
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            {sec5Step === 0 && (
              <button
                onClick={handleSec5MeasureQ0}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-mono text-xs font-bold shadow-lg transition-all"
              >
                Measure Qubit q₀ Only
              </button>
            )}

            {sec5Step === 1 && (
              <button
                onClick={handleSec5MeasureQ1}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold shadow-lg transition-all"
              >
                Now Measure Qubit q₁
              </button>
            )}

            {sec5Step === 2 && (
              <button
                onClick={handleSec5Reset}
                className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition-all"
              >
                Prepare Fresh |Φ⁺⟩ Pair
              </button>
            )}
          </div>

          {/* Scientific Review Alert */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-xs text-[var(--color-app-text-muted)] leading-relaxed space-y-2">
            <div className="font-bold text-[var(--color-app-text-main)]">Scientific Understanding:</div>
            <p>
              Measuring one qubit produces a classical outcome, and the post-measurement joint state becomes consistent with that outcome.
            </p>
            <p className="text-[11px] text-[var(--color-app-text-light)]">
              Crucially: <strong>q₀ does not send a signal to q₁</strong>. There is no faster-than-light communication, and q₁ is not physically “forced” by a message from q₀. The correlation is an intrinsic property of the joint quantum state itself.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6 — ENTANGLEMENT EXPLORER (MAIN INTERACTIVE)                      */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Section 6 · Laboratory Workbench
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Comparative Experimentation</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Entanglement Explorer: Independent vs. Entangled Pairs
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            To understand entanglement deeply, compare two different two-qubit systems side by side:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-black/40 border border-white/10">
              <div className="text-cyan-300 font-bold mb-1">Independent Pair: |+⟩|+⟩</div>
              <p className="text-[var(--color-app-text-muted)] text-[11px] font-sans">
                Each qubit is in superposition independently. Measures all 4 combinations (00, 01, 10, 11) with ~25% probability each.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-black/40 border border-purple-500/40">
              <div className="text-purple-300 font-bold mb-1">Entangled Pair: |Φ⁺⟩</div>
              <p className="text-[var(--color-app-text-muted)] text-[11px] font-sans">
                Joint state (|00⟩+|11⟩)/√2. Measures only 00 and 11 with ~50% probability each; never 01 or 10!
              </p>
            </div>
          </div>
        </div>

        {/* Primary Interactive: Side-by-Side Experimental Run Table */}
        <div className="mt-6 p-6 rounded-2xl bg-black/40 border border-indigo-500/30 max-w-2xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-bold text-[var(--color-app-text-main)] uppercase tracking-wider">
              Live Comparative Sampling
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSec6SampleOne}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all shadow"
              >
                +1 Run
              </button>
              <button
                onClick={handleSec6SampleTen}
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all shadow"
              >
                +10 Runs
              </button>
              <button
                onClick={handleSec6Reset}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[var(--color-app-text-main)] font-mono text-xs transition-all"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Table: Runs */}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-xs font-mono text-center">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-[var(--color-app-text-muted)]">
                  <th className="p-2.5">Run #</th>
                  <th className="p-2.5 text-cyan-300 font-bold">Independent (|+⟩|+⟩)</th>
                  <th className="p-2.5 text-purple-300 font-bold">Entangled (|Φ⁺⟩)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-[var(--color-app-text-main)]">
                {sec6Runs.slice(0, 7).map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-2 text-[var(--color-app-text-muted)] text-[11px]">#{r.id}</td>
                    <td className="p-2 font-bold text-cyan-200">{r.indep}</td>
                    <td className={`p-2 font-bold ${r.entang === "00" ? "text-purple-300" : "text-emerald-300"}`}>
                      {r.entang}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Supporting Evidence: Statistics Distributions Underneath */}
          <div className="pt-2 space-y-4">
            <div className="text-xs font-bold text-[var(--color-app-text-muted)] text-center">
              Observed Distribution Across {sec6Counts.total} Runs
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2">
                <div className="text-cyan-300 font-bold text-[11px]">Independent Frequencies</div>
                {["00", "01", "10", "11"].map((k) => (
                  <div key={k} className="flex justify-between items-center text-[11px]">
                    <span className="text-[var(--color-app-text-muted)]">|{k}⟩:</span>
                    <span>
                      {sec6Counts.indep[k]} ({((sec6Counts.indep[k] / sec6Counts.total) * 100).toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-black/30 border border-purple-500/30 space-y-2">
                <div className="text-purple-300 font-bold text-[11px]">Entangled Frequencies</div>
                {["00", "01", "10", "11"].map((k) => (
                  <div key={k} className="flex justify-between items-center text-[11px]">
                    <span className="text-[var(--color-app-text-muted)]">|{k}⟩:</span>
                    <span className={k === "01" || k === "10" ? "text-rose-400 font-bold" : "text-purple-200"}>
                      {sec6Counts.entang[k]} ({((sec6Counts.entang[k] / sec6Counts.total) * 100).toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7 — WHAT MAKES IT SPECIAL?                                        */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/30">
            Section 7 · The Essence
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Mathematical Non-Separability</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          What Makes It Special? Non-Separability
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            We are now ready to state the precise conceptual definition of entanglement:
          </p>

          <div className="p-5 rounded-2xl bg-pink-950/40 border border-pink-500/40 text-pink-200 text-sm font-semibold leading-relaxed">
            ✨ <strong>Entanglement is a property of a joint quantum state that cannot be written as a product of independent single-qubit states.</strong>
          </div>

          <p>
            Compare:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
              <div className="text-cyan-300 font-bold">Product State (Separable)</div>
              <div>|+⟩ ⊗ |+⟩</div>
              <p className="text-[var(--color-app-text-muted)] font-sans text-[11px]">
                Can be factored cleanly into a state for q₀ and a state for q₁. Each qubit has its own independent identity.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/40 border border-pink-500/30 space-y-2">
              <div className="text-pink-300 font-bold">Entangled State (Non-Separable)</div>
              <div>(|00⟩ + |11⟩)/√2</div>
              <p className="text-[var(--color-app-text-muted)] font-sans text-[11px]">
                Cannot be factored into (a|0⟩ + b|1⟩) ⊗ (c|0⟩ + d|1⟩). The pair has joint structure that exists only as a whole!
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-xs text-[var(--color-app-text-muted)] leading-relaxed space-y-2">
            <div className="font-bold text-[var(--color-app-text-main)]">Superposition vs. Entanglement:</div>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Superposition:</strong> A quantum system can be in a linear combination of its basis states.</li>
              <li><strong>Entanglement:</strong> Multiple quantum systems share a joint state whose structure cannot be separated into independent states for each system.</li>
            </ul>
            <p className="text-[11px] text-[var(--color-app-text-light)] italic pt-1">
              Note: Entanglement does NOT simply mean “both qubits are in superposition.” As you saw with |+⟩|+⟩, both qubits can be in superposition while remaining completely independent and unentangled.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 8 — CHALLENGE + SUMMARY                                           */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Section 8 · Synthesis & Review
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Check Your Understanding</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Challenges & Module Summary
        </h2>

        {/* 4 Interactive Challenges */}
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Challenge 1 */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="text-xs font-bold text-[var(--color-app-text-main)]">
              Challenge 1: Which circuit creates an entangled state from |00⟩?
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <button
                onClick={() => handleSelectChallenge(1, "A")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  chAnswers[1] === "A"
                    ? "bg-rose-600/30 border-rose-500 text-rose-200"
                    : "bg-white/5 border-white/10 text-[var(--color-app-text-muted)] hover:bg-white/10"
                }`}
              >
                Circuit A: H(q₀) only
              </button>
              <button
                onClick={() => handleSelectChallenge(1, "B")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  chAnswers[1] === "B"
                    ? "bg-emerald-600/30 border-emerald-500 text-emerald-200"
                    : "bg-white/5 border-white/10 text-[var(--color-app-text-muted)] hover:bg-white/10"
                }`}
              >
                Circuit B: H(q₀) then CNOT(q₀, q₁)
              </button>
            </div>
            {chSubmitted[1] && (
              <div className={`p-3 rounded-lg text-xs ${chAnswers[1] === "B" ? "bg-emerald-950/40 text-emerald-300" : "bg-rose-950/40 text-rose-300"}`}>
                {chAnswers[1] === "B" ? "✓ Correct! H creates superposition on q₀, and CNOT entangles q₁ with q₀." : "Try again: A single-qubit gate alone cannot create an entangled state from |00⟩."}
              </div>
            )}
          </div>

          {/* Challenge 2 */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="text-xs font-bold text-[var(--color-app-text-main)]">
              Challenge 2: Given (|00⟩ + |11⟩)/√2, if q₀ is measured as 0, which joint outcome is consistent with the post-measurement state?
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              {["00", "01", "10", "11"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSelectChallenge(2, opt)}
                  className={`p-3 rounded-xl border transition-all ${
                    chAnswers[2] === opt
                      ? opt === "00"
                        ? "bg-emerald-600/30 border-emerald-500 text-emerald-200"
                        : "bg-rose-600/30 border-rose-500 text-rose-200"
                      : "bg-white/5 border-white/10 text-[var(--color-app-text-muted)] hover:bg-white/10"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {chSubmitted[2] && (
              <div className={`p-3 rounded-lg text-xs ${chAnswers[2] === "00" ? "bg-emerald-950/40 text-emerald-300" : "bg-rose-950/40 text-rose-300"}`}>
                {chAnswers[2] === "00" ? "✓ Correct! Measuring q₀ as 0 projects the joint state onto |00⟩." : "Try again: The |Φ⁺⟩ state contains only |00⟩ and |11⟩."}
              </div>
            )}
          </div>

          {/* Challenge 3 */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="text-xs font-bold text-[var(--color-app-text-main)]">
              Challenge 3: Given repeated results: 00, 11, 11, 00, 11, 00, what pattern do you observe?
            </div>
            <div className="space-y-2 text-xs">
              {[
                { id: "random", label: "The two outcomes are completely independent" },
                { id: "correlated", label: "The two measurement outcomes are correlated" },
                { id: "neither", label: "Qubit 0 is always 0" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectChallenge(3, item.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    chAnswers[3] === item.id
                      ? item.id === "correlated"
                        ? "bg-emerald-600/30 border-emerald-500 text-emerald-200"
                        : "bg-rose-600/30 border-rose-500 text-rose-200"
                      : "bg-white/5 border-white/10 text-[var(--color-app-text-muted)] hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {chSubmitted[3] && (
              <div className={`p-3 rounded-lg text-xs ${chAnswers[3] === "correlated" ? "bg-emerald-950/40 text-emerald-300" : "bg-rose-950/40 text-rose-300"}`}>
                {chAnswers[3] === "correlated" ? "✓ Correct! Both qubits always match (either 00 or 11)." : "Try again: Look at the matching relationship between the two bits."}
              </div>
            )}
          </div>

          {/* Challenge 4 */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="text-xs font-bold text-[var(--color-app-text-main)]">
              Challenge 4: Is every pair of correlated classical bits entangled?
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <button
                onClick={() => handleSelectChallenge(4, "yes")}
                className={`p-3 rounded-xl border transition-all ${
                  chAnswers[4] === "yes"
                    ? "bg-rose-600/30 border-rose-500 text-rose-200"
                    : "bg-white/5 border-white/10 text-[var(--color-app-text-muted)] hover:bg-white/10"
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => handleSelectChallenge(4, "no")}
                className={`p-3 rounded-xl border transition-all ${
                  chAnswers[4] === "no"
                    ? "bg-emerald-600/30 border-emerald-500 text-emerald-200"
                    : "bg-white/5 border-white/10 text-[var(--color-app-text-muted)] hover:bg-white/10"
                }`}
              >
                No
              </button>
            </div>
            {chSubmitted[4] && (
              <div className={`p-3 rounded-lg text-xs ${chAnswers[4] === "no" ? "bg-emerald-950/40 text-emerald-300" : "bg-rose-950/40 text-rose-300"}`}>
                {chAnswers[4] === "no" ? "✓ Correct! Classical systems can also be correlated. Entanglement refers to a special non-separable structure of a joint quantum state." : "Try again: Recall Section 3! Classical preparations can easily produce matching correlations."}
              </div>
            )}
          </div>
        </div>

        {/* Final Summary Flow & 8 Takeaways */}
        <div className="mt-10 pt-8 border-t border-white/10 space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold text-[var(--color-app-text-main)]">
              Module 11 Summary: The Entanglement Chain
            </h3>
            <div className="flex items-center justify-center gap-2 font-mono text-xs sm:text-sm text-purple-300 flex-wrap">
              <span>ONE QUBIT</span>
              <span>⟶</span>
              <span>Superposition</span>
              <span>⟶</span>
              <span>TWO QUBITS</span>
              <span>⟶</span>
              <span>Joint State</span>
              <span>⟶</span>
              <span className="text-pink-300 font-bold">Entangled State</span>
              <span>⟶</span>
              <span>Measure</span>
              <span>⟶</span>
              <span className="text-emerald-300 font-bold">Correlated Outcomes</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-3 max-w-2xl mx-auto">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-app-text-main)]">
              8 Core Takeaways:
            </div>
            <ol className="list-decimal pl-5 text-xs text-[var(--color-app-text-muted)] space-y-2 leading-relaxed">
              <li><strong>Two qubits can be described by a joint quantum state:</strong> The pair is represented in the 4-dimensional basis &#123;|00⟩, |01⟩, |10⟩, |11⟩&#125;.</li>
              <li><strong>Correlation does not automatically mean entanglement:</strong> Classical systems can easily exhibit correlated measurement outcomes.</li>
              <li><strong>Classical mixtures differ fundamentally:</strong> A classical mixture is a probabilistic choice without coherent quantum superposition between alternatives.</li>
              <li><strong>Entanglement is an intrinsic property:</strong> It is a property of the joint quantum state itself, not merely an observational artifact.</li>
              <li><strong>Non-separability:</strong> An entangled state cannot be written as a product of independent single-qubit states.</li>
              <li><strong>Circuit creation:</strong> Applying H to q₀ followed by CNOT(q₀, q₁) creates the entangled state (|00⟩ + |11⟩)/√2 from |00⟩.</li>
              <li><strong>Measurement of one qubit:</strong> For |Φ⁺⟩, measuring q₀ produces a classical outcome and projects the joint state onto |00⟩ or |11⟩, correlating with q₁.</li>
              <li><strong>No faster-than-light signals:</strong> Entanglement does not permit instantaneous communication between separated observers.</li>
            </ol>
          </div>

          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-center text-purple-200 max-w-xl mx-auto">
            Next: <em>“Bell States — some of the simplest and most important examples of entangled quantum states.”</em>
          </div>

          <div className="text-center pt-4">
            <button
              onClick={onComplete}
              className={`px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xl ${
                isCompleted
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
              }`}
            >
              {isCompleted ? "✓ Module Completed" : "Complete Module 11"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
