import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import MathHTMLContainer from "../../../components/MathHTMLContainer/MathHTMLContainer";

export default function BellStatesLesson({ onComplete, isCompleted, onAskQuantiva }) {
  const navigate = useNavigate();

  // =========================================================================
  // STATE MANAGEMENT ACROSS 6 SECTIONS
  // =========================================================================

  // Section 1: Bell State Selector
  const [sec1State, setSec1State] = useState("Phi+"); // "Phi+", "Phi-", "Psi+", "Psi-"

  // Section 3: Creation Stepper
  // Mode: "Phi+", "Phi-", "Psi+", "Psi-"
  const [sec3Target, setSec3Target] = useState("Phi+");
  const [sec3Step, setSec3Step] = useState(0); // 0: |00⟩, 1: H(q₀), 2: CNOT -> |Φ⁺⟩, 3: post-gate applied
  const [sec3Measured, setSec3Measured] = useState(null);

  // Section 4: Measurement Lab
  const [sec4State, setSec4State] = useState("Phi+");
  const [sec4Runs, setSec4Runs] = useState([
    { id: 1, state: "Phi+", outcome: "00" },
    { id: 2, state: "Phi+", outcome: "11" },
    { id: 3, state: "Phi+", outcome: "00" },
    { id: 4, state: "Phi+", outcome: "11" },
  ]);

  // Section 5: Bell State Explorer
  const [sec5State, setSec5State] = useState("Phi+");
  const [sec5LastSample, setSec5LastSample] = useState(null);

  // Section 6: Challenge Lab
  const [chAnswers, setChAnswers] = useState({ 1: null, 2: null, 3: null, 4: null });
  const [chSubmitted, setChSubmitted] = useState({ 1: false, 2: false, 3: false, 4: false });

  // -------------------------------------------------------------
  // BELL STATES DATA & DEFINITIONS
  // -------------------------------------------------------------
  const BELL_STATES = {
    "Phi+": {
      name: "|Φ⁺⟩",
      latex: "$$|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}$$",
      family: "Phi",
      phase: "+1",
      amplitudes: [
        { basis: "00", amp: "+1/√2", val: 0.707, prob: 50 },
        { basis: "01", amp: "0", val: 0, prob: 0 },
        { basis: "10", amp: "0", val: 0, prob: 0 },
        { basis: "11", amp: "+1/√2", val: 0.707, prob: 50 },
      ],
      outcomes: ["00", "11"],
      circuitDesc: "H(q₀) followed by CNOT(q₀, q₁)",
      gateSeq: ["H(q₀)", "CNOT(q₀,q₁)"],
    },
    "Phi-": {
      name: "|Φ⁻⟩",
      latex: "$$|\\Phi^-\\rangle = \\frac{|00\\rangle - |11\\rangle}{\\sqrt{2}}$$",
      family: "Phi",
      phase: "-1",
      amplitudes: [
        { basis: "00", amp: "+1/√2", val: 0.707, prob: 50 },
        { basis: "01", amp: "0", val: 0, prob: 0 },
        { basis: "10", amp: "0", val: 0, prob: 0 },
        { basis: "11", amp: "-1/√2", val: -0.707, prob: 50 },
      ],
      outcomes: ["00", "11"],
      circuitDesc: "H(q₀) + CNOT(q₀, q₁) followed by Z(q₀)",
      gateSeq: ["H(q₀)", "CNOT(q₀,q₁)", "Z(q₀)"],
    },
    "Psi+": {
      name: "|Ψ⁺⟩",
      latex: "$$|\\Psi^+\\rangle = \\frac{|01\\rangle + |10\\rangle}{\\sqrt{2}}$$",
      family: "Psi",
      phase: "+1",
      amplitudes: [
        { basis: "00", amp: "0", val: 0, prob: 0 },
        { basis: "01", amp: "+1/√2", val: 0.707, prob: 50 },
        { basis: "10", amp: "+1/√2", val: 0.707, prob: 50 },
        { basis: "11", amp: "0", val: 0, prob: 0 },
      ],
      outcomes: ["01", "10"],
      circuitDesc: "H(q₀) + CNOT(q₀, q₁) followed by X(q₁)",
      gateSeq: ["H(q₀)", "CNOT(q₀,q₁)", "X(q₁)"],
    },
    "Psi-": {
      name: "|Ψ⁻⟩",
      latex: "$$|\\Psi^-\\rangle = \\frac{|01\\rangle - |10\\rangle}{\\sqrt{2}}$$",
      family: "Psi",
      phase: "-1",
      amplitudes: [
        { basis: "00", amp: "0", val: 0, prob: 0 },
        { basis: "01", amp: "+1/√2", val: 0.707, prob: 50 },
        { basis: "10", amp: "-1/√2", val: -0.707, prob: 50 },
        { basis: "11", amp: "0", val: 0, prob: 0 },
      ],
      outcomes: ["01", "10"],
      circuitDesc: "H(q₀) + CNOT(q₀, q₁) followed by Z(q₀) and X(q₁)",
      gateSeq: ["H(q₀)", "CNOT(q₀,q₁)", "Z(q₀)", "X(q₁)"],
    },
  };

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------

  // Section 3: Creation Stepper
  const handleSelectSec3Target = (target) => {
    setSec3Target(target);
    setSec3Step(0);
    setSec3Measured(null);
  };

  const handleSec3Advance = () => {
    if (sec3Step === 0) {
      setSec3Step(1); // H on q₀
    } else if (sec3Step === 1) {
      setSec3Step(2); // CNOT -> |Φ⁺⟩
    } else if (sec3Step === 2) {
      if (sec3Target === "Phi+") {
        // Measure directly
        const res = Math.random() < 0.5 ? "00" : "11";
        setSec3Measured(res);
        setSec3Step(3);
      } else {
        // Apply transformation gate
        setSec3Step(3);
      }
    } else if (sec3Step === 3 && !sec3Measured) {
      const allowed = BELL_STATES[sec3Target].outcomes;
      const res = Math.random() < 0.5 ? allowed[0] : allowed[1];
      setSec3Measured(res);
      setSec3Step(4);
    }
  };

  const handleSec3Reset = () => {
    setSec3Step(0);
    setSec3Measured(null);
  };

  // Section 4: Measurement Lab
  const sampleBellStateOutcome = (st) => {
    const allowed = BELL_STATES[st].outcomes;
    return Math.random() < 0.5 ? allowed[0] : allowed[1];
  };

  const handleSec4SampleOne = () => {
    const nextId = sec4Runs.length + 1;
    const outcome = sampleBellStateOutcome(sec4State);
    setSec4Runs((prev) => [{ id: nextId, state: sec4State, outcome }, ...prev.slice(0, 9)]);
  };

  const handleSec4SampleTen = () => {
    const batch = [];
    const baseId = sec4Runs.length;
    for (let i = 1; i <= 10; i++) {
      const outcome = sampleBellStateOutcome(sec4State);
      batch.unshift({ id: baseId + i, state: sec4State, outcome });
    }
    setSec4Runs((prev) => [...batch, ...prev].slice(0, 10));
  };

  const handleSec4SampleHundred = () => {
    const batch = [];
    const baseId = sec4Runs.length;
    for (let i = 1; i <= 100; i++) {
      const outcome = sampleBellStateOutcome(sec4State);
      batch.unshift({ id: baseId + i, state: sec4State, outcome });
    }
    setSec4Runs((prev) => [...batch, ...prev].slice(0, 10));
  };

  const handleSec4Reset = () => {
    setSec4Runs([
      { id: 1, state: sec4State, outcome: sampleBellStateOutcome(sec4State) },
      { id: 2, state: sec4State, outcome: sampleBellStateOutcome(sec4State) },
      { id: 3, state: sec4State, outcome: sampleBellStateOutcome(sec4State) },
      { id: 4, state: sec4State, outcome: sampleBellStateOutcome(sec4State) },
    ]);
  };

  const sec4Counts = useMemo(() => {
    const counts = { "00": 0, "01": 0, "10": 0, "11": 0 };
    sec4Runs.forEach((r) => {
      if (counts[r.outcome] !== undefined) counts[r.outcome]++;
    });
    return { counts, total: sec4Runs.length };
  }, [sec4Runs]);

  // Section 5: Explorer
  const handleSec5Sample = () => {
    const allowed = BELL_STATES[sec5State].outcomes;
    const outcome = Math.random() < 0.5 ? allowed[0] : allowed[1];
    setSec5LastSample(outcome);
  };

  // Section 6: Challenges
  const handleSelectChallenge = (chId, choice) => {
    setChAnswers((prev) => ({ ...prev, [chId]: choice }));
    setChSubmitted((prev) => ({ ...prev, [chId]: true }));
  };

  return (
    <div className="space-y-12 pb-16">
      {/* ========================================================================= */}
      {/* MODULE HEADER & TOP PROGRESS BAR                                         */}
      {/* ========================================================================= */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-black border border-purple-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Module 12 · Foundations Capstone
              </span>
              <span className="text-xs text-[var(--color-app-text-light)]">•</span>
              <span className="text-xs font-medium text-[var(--color-app-text-muted)]">
                6 Focused Interactive Sections
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-app-text-main)] tracking-tight">
              Bell States
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-app-text-muted)] max-w-2xl leading-relaxed">
              How many different maximally entangled two-qubit states are there? Meet the four canonical Bell states, learn how to synthesize and transform them, and discover why identical computational-basis probabilities do not mean identical quantum states.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            <button
              onClick={() => onAskQuantiva && onAskQuantiva({
                topicId: "bell-states",
                title: "Bell States",
                section: "Overview",
                prompt: "Why are there four Bell states, and how do relative phases make them different even when their computational-basis probabilities match?",
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
      {/* SECTION 1 — FOUR ENTANGLED STATES                                         */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Section 1 · The Quartet
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Meet the Four Bell States</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Four Entangled States: The Bell Basis
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            In Module 11, we built an entangled pair using Hadamard and CNOT:
          </p>

          <div className="p-3 rounded-xl bg-black/40 border border-purple-500/30 font-mono text-xs max-w-md mx-auto text-center text-purple-300">
            |Φ⁺⟩ = (|00⟩ + |11⟩) / √2
          </div>

          <p>
            Is |Φ⁺⟩ unique, or are there others? In fact, there is a complete set of <strong>four canonical Bell states</strong> that form a fundamental orthonormal basis for two qubits.
          </p>

          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 text-xs sm:text-sm">
            💡 <strong>Crucial Distinction:</strong> Each Bell state has <strong>two possible computational-basis outcomes</strong>, each with probability <strong>50%</strong>. They divide cleanly into two pairs:
            <ul className="list-disc pl-5 mt-2 space-y-1 font-mono text-xs">
              <li><strong>Φ states (|Φ⁺⟩, |Φ⁻⟩):</strong> Always yield matching bits (<strong>00</strong> or <strong>11</strong>).</li>
              <li><strong>Ψ states (|Ψ⁺⟩, |Ψ⁻⟩):</strong> Always yield opposite bits (<strong>01</strong> or <strong>10</strong>).</li>
            </ul>
          </div>
        </div>

        {/* Interactive: Bell State Selector */}
        <div className="mt-8 space-y-6">
          <div className="text-xs font-bold text-[var(--color-app-text-main)] uppercase tracking-wider text-center">
            Interactive: Select a Bell State to Inspect Amplitudes & Probabilities
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {Object.keys(BELL_STATES).map((stKey) => {
              const item = BELL_STATES[stKey];
              const isSelected = sec1State === stKey;
              return (
                <button
                  key={stKey}
                  onClick={() => setSec1State(stKey)}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    isSelected
                      ? "bg-purple-600/30 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)] ring-1 ring-purple-400"
                      : "bg-black/40 border-white/10 hover:border-white/25 hover:bg-white/5"
                  }`}
                >
                  <div className="font-mono text-lg font-bold text-white mb-1">
                    {item.name}
                  </div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--color-app-text-muted)]">
                    {item.family} Family · Phase {item.phase}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected State Details Card */}
          <div className="p-6 rounded-2xl bg-black/50 border border-white/10 max-w-2xl mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-white/10 pb-3">
              <span className="text-xs font-bold text-[var(--color-app-text-main)]">
                Selected State: <strong className="text-cyan-300 font-mono">{BELL_STATES[sec1State].name}</strong>
              </span>
              <span className="text-[11px] font-mono text-[var(--color-app-text-muted)]">
                Relative Phase: <strong className={BELL_STATES[sec1State].phase === "+1" ? "text-emerald-400" : "text-pink-400"}>{BELL_STATES[sec1State].phase}</strong>
              </span>
            </div>

            <div className="py-2 text-center">
              <MathHTMLContainer html={BELL_STATES[sec1State].latex} />
            </div>

            <div className="space-y-3 pt-2">
              <div className="text-xs font-semibold text-[var(--color-app-text-muted)]">
                State Vector Amplitudes & Computational-Basis Probabilities:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                {BELL_STATES[sec1State].amplitudes.map((a) => (
                  <div key={a.basis} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1 text-center">
                    <div className="text-cyan-300 font-bold">|{a.basis}⟩</div>
                    <div className="text-[11px] text-[var(--color-app-text-muted)]">{a.amp}</div>
                    <div className="text-xs font-bold text-emerald-400">{a.prob}%</div>
                    {/* Small probability bar */}
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${a.prob}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-xs text-[var(--color-app-text-muted)] leading-relaxed max-w-2xl mx-auto text-center">
            <strong>Key Takeaway:</strong> These four states are distinct quantum states, even though some of their computational-basis measurement probabilities are identical.
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2 — WHAT MAKES THEM DIFFERENT?                                    */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Section 2 · Analysis
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">The Nature of Relative Phase</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          What Makes Them Different? Same Probabilities, Different States
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            A natural question immediately arises:
          </p>

          <blockquote className="border-l-2 border-purple-400 pl-4 italic text-[var(--color-app-text-main)]">
            “If both |Φ⁺⟩ and |Φ⁻⟩ produce 00 and 11 with 50/50 probabilities, aren't they basically the same state?”
          </blockquote>

          <p className="text-base font-bold text-amber-300">
            No. They are completely different, mutually orthogonal quantum states.
          </p>

          <p>
            Notice how their outcomes are grouped:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs max-w-xl mx-auto">
            <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/30 space-y-2">
              <div className="text-cyan-300 font-bold">Φ Family (Same Bits)</div>
              <div className="text-[var(--color-app-text-muted)]">
                |Φ⁺⟩ → 50% 00, 50% 11<br />
                |Φ⁻⟩ → 50% 00, 50% 11
              </div>
            </div>
            <div className="p-4 rounded-xl bg-black/40 border border-purple-500/30 space-y-2">
              <div className="text-purple-300 font-bold">Ψ Family (Opposite Bits)</div>
              <div className="text-[var(--color-app-text-muted)]">
                |Ψ⁺⟩ → 50% 01, 50% 10<br />
                |Ψ⁻⟩ → 50% 01, 50% 10
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs sm:text-sm space-y-2">
            <div>
              ⚠️ <strong>Phase vs. Probability:</strong> The + and − signs represent <strong>different relative phases</strong>.
            </div>
            <p className="text-xs text-amber-100/80">
              The sign difference is relative phase, <strong>not a different probability</strong> for the corresponding basis state. Squaring (+1/√2)² and (−1/√2)² yields 1/2 in both cases.
            </p>
          </div>

          <p>
            This directly connects to what we learned in <strong>Module 9 (Superposition)</strong>:
          </p>

          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 text-purple-200 text-center font-bold text-sm">
            Same computational-basis probabilities ≠ Same quantum state.
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3 — CREATE ALL FOUR BELL STATES                                   */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Section 3 · Synthesis
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Circuit Transformation</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Create All Four Bell States
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            We already know the base circuit starting from |00⟩:
          </p>

          <div className="p-3 rounded-xl bg-black/40 border border-white/10 font-mono text-xs max-w-md mx-auto text-center">
            |00⟩ ⟶ H(q₀) ⟶ CNOT(q₀, q₁) ⟶ |Φ⁺⟩
          </div>

          <p>
            Once we have prepared |Φ⁺⟩, we can convert it into <strong>any of the other three Bell states</strong> using simple single-qubit Pauli gates:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs max-w-2xl mx-auto">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-pink-400 font-bold">Z on q₀:</span>
              <p className="text-[11px] text-[var(--color-app-text-muted)]">
                Flips the sign of |11⟩ ⟶ creates <strong>|Φ⁻⟩</strong>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-cyan-400 font-bold">X on q₁:</span>
              <p className="text-[11px] text-[var(--color-app-text-muted)]">
                Flips the target bit ⟶ creates <strong>|Ψ⁺⟩</strong>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-purple-400 font-bold">Z(q₀) + X(q₁):</span>
              <p className="text-[11px] text-[var(--color-app-text-muted)]">
                Flips bit and relative sign ⟶ creates <strong>|Ψ⁻⟩</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Circuit Builder */}
        <div className="mt-8 p-6 rounded-2xl bg-black/40 border border-emerald-500/30 max-w-2xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-bold text-[var(--color-app-text-main)] uppercase tracking-wider">
              Target State to Create:
            </div>
            <div className="flex gap-2">
              {Object.keys(BELL_STATES).map((stKey) => (
                <button
                  key={stKey}
                  onClick={() => handleSelectSec3Target(stKey)}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                    sec3Target === stKey
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
                  }`}
                >
                  {BELL_STATES[stKey].name}
                </button>
              ))}
            </div>
          </div>

          {/* Circuit Graphic */}
          <div className="p-5 rounded-xl bg-black/60 border border-white/10 font-mono text-xs space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-14 text-[var(--color-app-text-muted)] text-[11px]">Wire q₀:</span>
              <span className="text-cyan-300 font-bold">|0⟩</span>
              <span className="text-white/20">──</span>
              <span className={`px-2.5 py-1 rounded border ${sec3Step >= 1 ? "bg-blue-600 text-white font-bold border-blue-400" : "bg-white/5 border-white/10 text-white/40"}`}>
                H
              </span>
              <span className="text-white/20">──</span>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${sec3Step >= 2 ? "bg-purple-600 text-white" : "bg-white/10 text-white/40"}`}>
                ●
              </span>
              <span className="text-white/20">──</span>
              {sec3Target === "Phi-" || sec3Target === "Psi-" ? (
                <span className={`px-2.5 py-1 rounded border ${sec3Step >= 3 ? "bg-pink-600 text-white font-bold border-pink-400" : "bg-white/5 border-white/10 text-white/40"}`}>
                  Z
                </span>
              ) : (
                <span className="text-white/20">──────</span>
              )}
              <span className="text-white/20">──</span>
              <span className={`px-2 py-1 rounded border ${sec3Measured ? "bg-emerald-600 text-white font-bold" : "bg-white/5 border-white/10 text-white/40"}`}>
                [M]
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-14 text-[var(--color-app-text-muted)] text-[11px]">Wire q₁:</span>
              <span className="text-cyan-300 font-bold">|0⟩</span>
              <span className="text-white/20">────────────</span>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs border ${sec3Step >= 2 ? "bg-purple-900 border-purple-400 text-purple-200" : "bg-white/5 border-white/10 text-white/40"}`}>
                ⊕
              </span>
              <span className="text-white/20">──</span>
              {sec3Target === "Psi+" || sec3Target === "Psi-" ? (
                <span className={`px-2.5 py-1 rounded border ${sec3Step >= 3 ? "bg-cyan-600 text-white font-bold border-cyan-400" : "bg-white/5 border-white/10 text-white/40"}`}>
                  X
                </span>
              ) : (
                <span className="text-white/20">──────</span>
              )}
              <span className="text-white/20">──</span>
              <span className={`px-2 py-1 rounded border ${sec3Measured ? "bg-emerald-600 text-white font-bold" : "bg-white/5 border-white/10 text-white/40"}`}>
                [M]
              </span>
            </div>
          </div>

          {/* Stepper Status & Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-mono text-[var(--color-app-text-muted)]">
              {sec3Step === 0 && "Step 0: Initial state |00⟩"}
              {sec3Step === 1 && "Step 1: H(q₀) applied ⟶ (|00⟩+|10⟩)/√2"}
              {sec3Step === 2 && "Step 2: CNOT applied ⟶ Base state |Φ⁺⟩"}
              {sec3Step === 3 && sec3Target === "Phi+" && `Step 3: Measured outcome -> ${sec3Measured}`}
              {sec3Step === 3 && sec3Target !== "Phi+" && `Step 3: Transformed to ${BELL_STATES[sec3Target].name}`}
              {sec3Step === 4 && `Step 4: Measured outcome -> ${sec3Measured}`}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSec3Advance}
                disabled={sec3Step >= (sec3Target === "Phi+" ? 3 : 4)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-mono text-xs font-bold transition-all"
              >
                {sec3Step === 0 && "Apply H(q₀)"}
                {sec3Step === 1 && "Apply CNOT"}
                {sec3Step === 2 && (sec3Target === "Phi+" ? "Measure Pair" : "Apply Gate")}
                {sec3Step === 3 && (sec3Target === "Phi+" ? "Complete" : "Measure Pair")}
                {sec3Step === 4 && "Complete"}
              </button>
              <button
                onClick={handleSec3Reset}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition-all"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Secondary Perspective: Alternative Input Basis Note */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10 text-xs text-[var(--color-app-text-muted)] space-y-2">
            <div className="font-bold text-[var(--color-app-text-main)]">
              Another way to see it: Standard Basis Inputs
            </div>
            <p className="text-[11px] leading-relaxed">
              If we pass different computational-basis inputs into the exact same H(q₀) + CNOT circuit, the four basis inputs map directly to the four Bell states:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] text-center pt-1">
              <div className="p-2 rounded bg-white/5 border border-white/5">|00⟩ ⟶ |Φ⁺⟩</div>
              <div className="p-2 rounded bg-white/5 border border-white/5">|10⟩ ⟶ |Φ⁻⟩</div>
              <div className="p-2 rounded bg-white/5 border border-white/5">|01⟩ ⟶ |Ψ⁺⟩</div>
              <div className="p-2 rounded bg-white/5 border border-white/5">|11⟩ ⟶ |Ψ⁻⟩</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4 — BELL STATE MEASUREMENT LAB                                     */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Section 4 · Laboratory
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Sampling Statistics</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Bell State Measurement Lab
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            Let's prepare each Bell state and repeatedly measure it in the computational basis. Notice which outcomes appear and which are strictly forbidden:
          </p>
        </div>

        {/* Sampling Workbench */}
        <div className="mt-6 p-6 rounded-2xl bg-black/40 border border-cyan-500/30 max-w-2xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-bold text-[var(--color-app-text-main)] uppercase tracking-wider">
              Select Prepared State:
            </div>
            <div className="flex gap-2">
              {Object.keys(BELL_STATES).map((stKey) => (
                <button
                  key={stKey}
                  onClick={() => {
                    setSec4State(stKey);
                    setSec4Runs([
                      { id: 1, state: stKey, outcome: sampleBellStateOutcome(stKey) },
                      { id: 2, state: stKey, outcome: sampleBellStateOutcome(stKey) },
                      { id: 3, state: stKey, outcome: sampleBellStateOutcome(stKey) },
                      { id: 4, state: stKey, outcome: sampleBellStateOutcome(stKey) },
                    ]);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                    sec4State === stKey
                      ? "bg-cyan-600 text-white shadow-md"
                      : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
                  }`}
                >
                  {BELL_STATES[stKey].name}
                </button>
              ))}
            </div>
          </div>

          {/* Sample Trigger Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs font-mono text-[var(--color-app-text-muted)]">
              Total Shots: <strong className="text-white">{sec4Counts.total}</strong>
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleSec4SampleOne}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all"
              >
                +1 Shot
              </button>
              <button
                onClick={handleSec4SampleTen}
                className="px-3 py-1.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all"
              >
                +10 Shots
              </button>
              <button
                onClick={handleSec4SampleHundred}
                className="px-3 py-1.5 rounded-lg bg-cyan-600/60 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all"
              >
                +100 Shots
              </button>
              <button
                onClick={handleSec4Reset}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition-all"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Statistical Distribution Bars */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-mono text-[var(--color-app-text-muted)]">
              Observed Frequency for {BELL_STATES[sec4State].name}:
            </div>
            <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
              {["00", "01", "10", "11"].map((basis) => {
                const count = sec4Counts.counts[basis];
                const pct = sec4Counts.total > 0 ? Math.round((count / sec4Counts.total) * 100) : 0;
                const isPossible = BELL_STATES[sec4State].outcomes.includes(basis);
                return (
                  <div key={basis} className={`p-3 rounded-xl border ${isPossible ? "bg-white/5 border-cyan-500/30" : "bg-black/30 border-white/5 opacity-50"}`}>
                    <div className="text-cyan-300 font-bold">|{basis}⟩</div>
                    <div className="text-sm font-bold text-white my-1">{count}</div>
                    <div className="text-[11px] text-[var(--color-app-text-muted)]">{pct}%</div>
                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full transition-all duration-200 ${isPossible ? "bg-cyan-400" : "bg-transparent"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Concrete Phase Lesson Alert */}
          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200 leading-relaxed space-y-2">
            <div className="font-bold">Operational Principle:</div>
            <p>
              Notice that |Φ⁺⟩ and |Φ⁻⟩ produce identical 50/50 frequencies for 00 and 11. Likewise, |Ψ⁺⟩ and |Ψ⁻⟩ produce identical 50/50 frequencies for 01 and 10.
            </p>
            <p className="text-[11px] text-purple-300/80">
              <strong>Computational-basis measurement alone cannot distinguish the + and − versions.</strong> Additional quantum operations followed by measurement can reveal their phase difference.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5 — BELL STATE EXPLORER                                           */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Section 5 · Explorer
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Multi-View Comparison</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Bell State Explorer: Side-by-Side Perspectives
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            Switch among the four states below to examine all synchronized representations simultaneously:
          </p>
        </div>

        {/* State Toggle Tabs */}
        <div className="mt-6 flex justify-center gap-2">
          {Object.keys(BELL_STATES).map((stKey) => (
            <button
              key={stKey}
              onClick={() => {
                setSec5State(stKey);
                setSec5LastSample(null);
              }}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
                sec5State === stKey
                  ? "bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-400"
                  : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
              }`}
            >
              {BELL_STATES[stKey].name}
            </button>
          ))}
        </div>

        {/* Multi-View Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {/* View A: State */}
          <div className="p-5 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 font-bold">
              View A · Mathematical Equation
            </div>
            <div className="py-2 text-center">
              <MathHTMLContainer html={BELL_STATES[sec5State].latex} />
            </div>
          </div>

          {/* View B: Amplitudes */}
          <div className="p-5 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 font-bold">
              View B · Amplitudes [c₀₀, c₀₁, c₁₀, c₁₁]
            </div>
            <div className="grid grid-cols-4 gap-1 font-mono text-xs text-center pt-2">
              {BELL_STATES[sec5State].amplitudes.map((a) => (
                <div key={a.basis} className="p-2 rounded bg-white/5">
                  <div className="text-[10px] text-[var(--color-app-text-muted)]">|{a.basis}⟩</div>
                  <div className="font-bold text-white mt-1">{a.amp}</div>
                </div>
              ))}
            </div>
          </div>

          {/* View C: Probabilities */}
          <div className="p-5 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 font-bold">
              View C · Computational-Basis Probabilities
            </div>
            <div className="grid grid-cols-4 gap-1 font-mono text-xs text-center pt-2">
              {BELL_STATES[sec5State].amplitudes.map((a) => (
                <div key={a.basis} className="p-2 rounded bg-white/5">
                  <div className="text-[10px] text-[var(--color-app-text-muted)]">|{a.basis}⟩</div>
                  <div className="font-bold text-emerald-400 mt-1">{a.prob}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* View D: Creation Circuit */}
          <div className="p-5 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-300 font-bold">
              View D · Synthesis Circuit
            </div>
            <p className="text-xs text-[var(--color-app-text-muted)] leading-relaxed pt-1 font-mono">
              {BELL_STATES[sec5State].circuitDesc}
            </p>
            <div className="flex gap-1 pt-1 flex-wrap font-mono text-[11px]">
              {BELL_STATES[sec5State].gateSeq.map((g, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-200">
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* View E: Fast Measurement Quick-Shot */}
        <div className="mt-4 p-4 rounded-xl bg-black/40 border border-white/10 max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="text-xs font-mono text-[var(--color-app-text-muted)]">
            View E · Single-Shot Test:{" "}
            {sec5LastSample ? (
              <strong className="text-cyan-300">Measured |{sec5LastSample}⟩</strong>
            ) : (
              <span>(Click to fire a test shot)</span>
            )}
          </div>
          <button
            onClick={handleSec5Sample}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all"
          >
            Measure {BELL_STATES[sec5State].name}
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6 — CHALLENGE LAB & FINAL FOUNDATIONS SUMMARY                     */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Section 6 · Capstone Verification
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Challenge Lab & Curriculum Summary</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Challenge Lab: Test Your Understanding
        </h2>

        {/* 4 Interactive Challenges */}
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Challenge 1 */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="text-xs font-bold text-[var(--color-app-text-main)] flex items-center justify-between">
              <span>Challenge 1: Identify the State</span>
              {chSubmitted[1] && (
                <span className={chAnswers[1] === "Phi-" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {chAnswers[1] === "Phi-" ? "✓ Correct" : "✗ Try again"}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-app-text-muted)]">
              Which Bell state is represented by the formula:
            </p>
            <div className="text-center py-1">
              <MathHTMLContainer html="$$|\psi\rangle = \frac{|00\rangle - |11\rangle}{\sqrt{2}}$$" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              {["Phi+", "Phi-", "Psi+", "Psi-"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSelectChallenge(1, opt)}
                  className={`py-2 rounded-xl font-mono text-xs font-bold border transition-all ${
                    chAnswers[1] === opt
                      ? opt === "Phi-"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : "bg-rose-500/20 border-rose-500 text-rose-300"
                      : "bg-white/5 border-white/10 text-[var(--color-app-text-muted)] hover:bg-white/10"
                  }`}
                >
                  {BELL_STATES[opt].name}
                </button>
              ))}
            </div>
            {chSubmitted[1] && (
              <p className="text-[11px] text-[var(--color-app-text-light)] pt-1">
                Explanation: The superposition involves matching bits (|00⟩ and |11⟩) with a relative minus sign, which defines |Φ⁻⟩.
              </p>
            )}
          </div>

          {/* Challenge 2 */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="text-xs font-bold text-[var(--color-app-text-main)] flex items-center justify-between">
              <span>Challenge 2: Identify Possible Outcomes</span>
              {chSubmitted[2] && (
                <span className={chAnswers[2] === "Psi" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {chAnswers[2] === "Psi" ? "✓ Correct" : "✗ Try again"}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-app-text-muted)]">
              Which Bell states can produce <strong>01</strong> when measured in the computational basis?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              {[
                { id: "Phi", label: "|Φ⁺⟩ and |Φ⁻⟩" },
                { id: "Psi", label: "|Ψ⁺⟩ and |Ψ⁻⟩" },
                { id: "All", label: "All four Bell states" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectChallenge(2, opt.id)}
                  className={`py-2 px-3 rounded-xl font-mono text-xs font-bold border transition-all ${
                    chAnswers[2] === opt.id
                      ? opt.id === "Psi"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : "bg-rose-500/20 border-rose-500 text-rose-300"
                      : "bg-white/5 border-white/10 text-[var(--color-app-text-muted)] hover:bg-white/10"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {chSubmitted[2] && (
              <p className="text-[11px] text-[var(--color-app-text-light)] pt-1">
                Explanation: The Ψ states (|Ψ⁺⟩ and |Ψ⁻⟩) are superpositions of opposite-bit pairs (|01⟩ and |10⟩). The Φ states can only produce 00 and 11.
              </p>
            )}
          </div>

          {/* Challenge 3 */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="text-xs font-bold text-[var(--color-app-text-main)] flex items-center justify-between">
              <span>Challenge 3: Same Probabilities?</span>
              {chSubmitted[3] && (
                <span className={chAnswers[3] === "No" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {chAnswers[3] === "No" ? "✓ Correct" : "✗ Try again"}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-app-text-muted)]">
              |Φ⁺⟩ and |Φ⁻⟩ both produce 00 and 11 with 50/50 probabilities in the computational basis. Does that mean they are the same quantum state?
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {[
                { id: "Yes", label: "Yes, measurement defines the state" },
                { id: "No", label: "No, they have different relative phases" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectChallenge(3, opt.id)}
                  className={`py-2 px-3 rounded-xl font-mono text-xs font-bold border transition-all ${
                    chAnswers[3] === opt.id
                      ? opt.id === "No"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : "bg-rose-500/20 border-rose-500 text-rose-300"
                      : "bg-white/5 border-white/10 text-[var(--color-app-text-muted)] hover:bg-white/10"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {chSubmitted[3] && (
              <p className="text-[11px] text-[var(--color-app-text-light)] pt-1">
                Explanation: They differ in relative phase (+1 vs −1). While computational-basis measurement alone cannot see phase, quantum operations can reveal the difference.
              </p>
            )}
          </div>

          {/* Challenge 4 */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="text-xs font-bold text-[var(--color-app-text-main)] flex items-center justify-between">
              <span>Challenge 4: Gate Transformation</span>
              {chSubmitted[4] && (
                <span className={chAnswers[4] === "Z" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {chAnswers[4] === "Z" ? "✓ Correct" : "✗ Try again"}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-app-text-muted)]">
              Which single-qubit gate can directly transform |Φ⁺⟩ into |Φ⁻⟩?
            </p>
            <div className="grid grid-cols-4 gap-2 pt-2">
              {["X", "Y", "Z", "H"].map((gate) => (
                <button
                  key={gate}
                  onClick={() => handleSelectChallenge(4, gate)}
                  className={`py-2 rounded-xl font-mono text-xs font-bold border transition-all ${
                    chAnswers[4] === gate
                      ? gate === "Z"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : "bg-rose-500/20 border-rose-500 text-rose-300"
                      : "bg-white/5 border-white/10 text-[var(--color-app-text-muted)] hover:bg-white/10"
                  }`}
                >
                  {gate} gate
                </button>
              ))}
            </div>
            {chSubmitted[4] && (
              <p className="text-[11px] text-[var(--color-app-text-light)] pt-1">
                Explanation: The Pauli-Z gate maps |0⟩ ⟶ |0⟩ and |1⟩ ⟶ −|1⟩. Applying Z to either qubit flips the relative sign of |11⟩, producing |Φ⁻⟩.
              </p>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FINAL SUMMARY & FOUNDATIONS CAPSTONE                                      */}
        {/* ========================================================================= */}
        <div className="mt-12 pt-8 border-t border-white/10 space-y-6">
          <div className="text-center space-y-3">
            <h3 className="text-lg font-bold text-[var(--color-app-text-main)]">
              Bell States Architecture
            </h3>
            {/* Visual Tree Hierarchy */}
            <div className="p-6 rounded-2xl bg-black/50 border border-white/10 font-mono text-xs max-w-xl mx-auto space-y-4">
              <div className="text-purple-300 font-bold">Bell States (Maximally Entangled Basis)</div>
              <div className="text-white/30">│</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
                  <div className="text-cyan-300 font-bold">Φ States (00 / 11)</div>
                  <div className="text-[11px] text-[var(--color-app-text-muted)] space-y-1">
                    <div>|Φ⁺⟩: + phase</div>
                    <div>|Φ⁻⟩: − phase</div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-pink-950/30 border border-pink-500/30 space-y-2">
                  <div className="text-pink-300 font-bold">Ψ States (01 / 10)</div>
                  <div className="text-[11px] text-[var(--color-app-text-muted)] space-y-1">
                    <div>|Ψ⁺⟩: + phase</div>
                    <div>|Ψ⁻⟩: − phase</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-3 max-w-2xl mx-auto">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-app-text-main)]">
              8 Core Takeaways:
            </div>
            <ol className="list-decimal pl-5 text-xs text-[var(--color-app-text-muted)] space-y-2 leading-relaxed">
              <li><strong>Four standard Bell states:</strong> There are four canonical maximally entangled two-qubit basis states: |Φ⁺⟩, |Φ⁻⟩, |Ψ⁺⟩, |Ψ⁻⟩.</li>
              <li><strong>Maximally entangled:</strong> All four states possess maximum entanglement; neither qubit has an independent definite state.</li>
              <li><strong>Φ family:</strong> |Φ⁺⟩ and |Φ⁻⟩ involve basis states |00⟩ and |11⟩.</li>
              <li><strong>Ψ family:</strong> |Ψ⁺⟩ and |Ψ⁻⟩ involve basis states |01⟩ and |10⟩.</li>
              <li><strong>Relative phase:</strong> The + and − signs represent different relative phases, not different measurement probabilities.</li>
              <li><strong>Identical probabilities in one basis:</strong> Same computational-basis probabilities do not imply identical quantum states.</li>
              <li><strong>Gate transformations:</strong> Simple single-qubit gates (X, Z) transform one Bell state into any other.</li>
              <li><strong>Foundation for quantum protocols:</strong> Bell states are fundamental building blocks for quantum information processing and algorithms.</li>
            </ol>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-black border border-purple-500/30 text-xs sm:text-sm text-center text-purple-200 max-w-2xl mx-auto leading-relaxed">
            🎓 <strong>Congratulations!</strong> You now know how quantum states can be placed in superposition, transformed by gates, measured, and entangled. These ideas form the foundation for quantum algorithms and quantum information.
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
              {isCompleted ? "✓ Foundations Completed" : "Complete Module 12"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
