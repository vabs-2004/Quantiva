import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import MathHTMLContainer from "../../../components/MathHTMLContainer/MathHTMLContainer";

export default function DiracNotationLesson({ onComplete, isCompleted, onAskQuantiva }) {
  const navigate = useNavigate();

  // =========================================================================
  // STATE MANAGEMENT ACROSS 7 SECTIONS
  // =========================================================================

  // Section 1: Ket Explorer
  const [sec1State, setSec1State] = useState("0"); // "0", "1", "+", "-"

  // Section 2: Build a State
  const [alphaVal, setAlphaVal] = useState(0.6);
  const [betaVal, setBetaVal] = useState(0.8);

  // Section 3: Read the State
  const [sec3CardIndex, setSec3CardIndex] = useState(0);
  const [sec3Revealed, setSec3Revealed] = useState(false);

  // Section 4: Bra & Overlap Explorer
  const [braChoice, setBraChoice] = useState("0"); // "0", "1", "+", "-"
  const [ketChoice, setKetChoice] = useState("0");

  // Section 5: State -> Measure
  const [sec5Preset, setSec5Preset] = useState("+"); // "0", "1", "+", "custom"
  const [sec5Prediction, setSec5Prediction] = useState(null); // 0 or 1
  const [sec5Result, setSec5Result] = useState(null); // { outcome: 0 | 1, postState: "|0⟩" | "|1⟩" }

  // Section 7: Challenge Lab
  const [chAnswers, setChAnswers] = useState({ 1: null, 2: null, 3: null, 4: null });
  const [chSubmitted, setChSubmitted] = useState({ 1: false, 2: false, 3: false, 4: false });

  // -------------------------------------------------------------
  // DATA & HELPERS
  // -------------------------------------------------------------
  const SQ2 = Math.SQRT2;

  const KET_PRESETS = {
    "0": {
      symbol: "|0⟩",
      name: "Zero Basis State",
      vector: "[1, 0]ᵀ",
      alpha: "1",
      beta: "0",
      p0: 100,
      p1: 0,
      latex: "$$|0\\rangle = \\begin{pmatrix} 1 \\\\ 0 \\end{pmatrix}$$",
    },
    "1": {
      symbol: "|1⟩",
      name: "One Basis State",
      vector: "[0, 1]ᵀ",
      alpha: "0",
      beta: "1",
      p0: 0,
      p1: 100,
      latex: "$$|1\\rangle = \\begin{pmatrix} 0 \\\\ 1 \\end{pmatrix}$$",
    },
    "+": {
      symbol: "|+⟩",
      name: "Plus Superposition",
      vector: "[1/√2, 1/√2]ᵀ",
      alpha: "1/√2",
      beta: "1/√2",
      p0: 50,
      p1: 50,
      latex: "$$|+\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}} = \\frac{1}{\\sqrt{2}}\\begin{pmatrix} 1 \\\\ 1 \\end{pmatrix}$$",
    },
    "-": {
      symbol: "|−⟩",
      name: "Minus Superposition",
      vector: "[1/√2, -1/√2]ᵀ",
      alpha: "1/√2",
      beta: "-1/√2",
      p0: 50,
      p1: 50,
      latex: "$$|-\\rangle = \\frac{|0\\rangle - |1\\rangle}{\\sqrt{2}} = \\frac{1}{\\sqrt{2}}\\begin{pmatrix} 1 \\\\ -1 \\end{pmatrix}$$",
    },
  };

  // Section 2 normalization computation
  const sec2NormSq = useMemo(() => {
    return Math.round((alphaVal * alphaVal + betaVal * betaVal) * 1000) / 1000;
  }, [alphaVal, betaVal]);

  const sec2IsValid = Math.abs(sec2NormSq - 1.0) < 0.02;

  const handleNormalizeSec2 = () => {
    const norm = Math.sqrt(alphaVal * alphaVal + betaVal * betaVal) || 1;
    setAlphaVal(Math.round((alphaVal / norm) * 100) / 100);
    setBetaVal(Math.round((betaVal / norm) * 100) / 100);
  };

  // Section 3 flashcards
  const sec3Cards = [
    {
      state: "|0⟩",
      title: "Computational Basis Zero",
      alphaText: "α = 1, β = 0",
      p0: "100%",
      p1: "0%",
      explanation: "Because α = 1 and β = 0, measuring in the computational basis deterministically yields outcome 0.",
    },
    {
      state: "|+⟩ = (|0⟩ + |1⟩)/√2",
      title: "Equal Superposition with Positive Phase",
      alphaText: "α = 1/√2, β = 1/√2",
      p0: "50%",
      p1: "50%",
      explanation: "Both amplitudes are 1/√2. Their squared magnitudes are (1/√2)² = 1/2, giving 50% probability for 0 and 50% for 1.",
    },
    {
      state: "|−⟩ = (|0⟩ − |1⟩)/√2",
      title: "Equal Superposition with Negative Phase",
      alphaText: "α = 1/√2, β = -1/√2",
      p0: "50%",
      p1: "50%",
      explanation: "Notice the minus sign! However, (-1/√2)² = 1/2. In the computational basis, probabilities are still 50/50, but the relative phase is negative.",
    },
    {
      state: "|1⟩",
      title: "Computational Basis One",
      alphaText: "α = 0, β = 1",
      p0: "0%",
      p1: "100%",
      explanation: "Because α = 0 and β = 1, measuring in the computational basis deterministically yields outcome 1.",
    },
  ];

  // Section 4 Overlap computation
  const overlapData = useMemo(() => {
    const vecMap = {
      "0": [1, 0],
      "1": [0, 1],
      "+": [1 / SQ2, 1 / SQ2],
      "-": [1 / SQ2, -1 / SQ2],
    };
    const braSym = { "0": "⟨0|", "1": "⟨1|", "+": "⟨+|", "-": "⟨−|" };
    const ketSym = { "0": "|0⟩", "1": "|1⟩", "+": "|+⟩", "-": "|−⟩" };

    const vBra = vecMap[braChoice];
    const vKet = vecMap[ketChoice];
    const innerProd = vBra[0] * vKet[0] + vBra[1] * vKet[1];
    const innerRounded = Math.round(innerProd * 1000) / 1000;

    let textVal = String(innerRounded);
    if (Math.abs(innerRounded) < 1e-4) textVal = "0";
    else if (Math.abs(innerRounded - 1) < 1e-4) textVal = "1";
    else if (Math.abs(innerRounded - 1 / SQ2) < 1e-3) textVal = "1/√2 ≈ 0.707";
    else if (Math.abs(innerRounded + 1 / SQ2) < 1e-3) textVal = "−1/√2 ≈ −0.707";

    const isOrthogonal = Math.abs(innerRounded) < 1e-4;

    return {
      bracket: `${braSym[braChoice]}${ketChoice}⟩`,
      value: textVal,
      isOrthogonal,
      desc: isOrthogonal
        ? "Orthogonal states: zero overlap (inner product = 0)."
        : Math.abs(Math.abs(innerRounded) - 1) < 1e-4
        ? "Identical states: maximum overlap (magnitude = 1)."
        : "Partial overlap: the states share common components.",
    };
  }, [braChoice, ketChoice]);

  // Section 5 Measure
  const handleMeasureSec5 = () => {
    let p0 = 0.5;
    if (sec5Preset === "0") p0 = 1;
    else if (sec5Preset === "1") p0 = 0;
    else if (sec5Preset === "+") p0 = 0.5;
    else if (sec5Preset === "custom") p0 = alphaVal * alphaVal;

    const rand = Math.random();
    const outcome = rand < p0 ? 0 : 1;
    setSec5Result({
      outcome,
      postState: outcome === 0 ? "|0⟩" : "|1⟩",
    });
  };

  // Section 7: Challenge
  const handleSelectChallenge = (chId, choice) => {
    setChAnswers((prev) => ({ ...prev, [chId]: choice }));
    setChSubmitted((prev) => ({ ...prev, [chId]: true }));
  };

  return (
    <div className="space-y-12 pb-16">
      {/* ========================================================================= */}
      {/* MODULE HEADER                                                             */}
      {/* ========================================================================= */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-black border border-cyan-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Module 4 · The Language of Quantum Mechanics
              </span>
              <span className="text-xs text-[var(--color-app-text-light)]">•</span>
              <span className="text-xs font-medium text-[var(--color-app-text-muted)]">
                7 Focused Interactive Sections
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--color-app-text-main)] tracking-tight">
              Dirac Notation
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-app-text-muted)] max-w-2xl leading-relaxed">
              How can we write and work with quantum states in a compact way? Master the elegance of kets (|ψ⟩), dual bras (⟨ψ|), brackets (⟨A|B⟩), and multi-qubit joint notation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            <button
              onClick={() => onAskQuantiva && onAskQuantiva({
                topicId: "dirac-notation",
                title: "Dirac Notation",
                section: "Overview",
                prompt: "What does the ket |ψ⟩ actually represent, and how does Dirac bra-ket notation simplify writing quantum states?",
              })}
              className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 font-mono text-xs flex items-center gap-2 transition-all shadow-sm"
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
      {/* SECTION 1 — MEET THE KET                                                  */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Section 1 · The Symbol
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Introduction to |ψ⟩</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Meet the Ket: Compact State Notation
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            In classical computing, a bit is written simply as 0 or 1. In quantum computing, we represent quantum states inside vertical bars and angle brackets:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs max-w-xl mx-auto text-center">
            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-cyan-300 font-bold text-base block mb-1">|0⟩</span>
              <span className="text-[var(--color-app-text-muted)]">Zero Basis State</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/10">
              <span className="text-cyan-300 font-bold text-base block mb-1">|1⟩</span>
              <span className="text-[var(--color-app-text-muted)]">One Basis State</span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/40">
              <span className="text-purple-300 font-bold text-base block mb-1">|ψ⟩</span>
              <span className="text-[var(--color-app-text-muted)]">Generic Quantum State</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 text-xs sm:text-sm">
            💡 <strong>Vocabulary:</strong> The symbol <strong>|ψ⟩</strong> (a vertical bar followed by a label and a right angle bracket) is called a <strong>ket</strong>. It is simply a compact shorthand for a column state vector.
          </div>
        </div>

        {/* Interactive: Ket Explorer */}
        <div className="mt-8 space-y-6">
          <div className="text-xs font-bold text-[var(--color-app-text-main)] uppercase tracking-wider text-center">
            Interactive: Ket Explorer
          </div>

          <div className="flex justify-center gap-2">
            {Object.keys(KET_PRESETS).map((kKey) => (
              <button
                key={kKey}
                onClick={() => setSec1State(kKey)}
                className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all ${
                  sec1State === kKey
                    ? "bg-cyan-600 text-white shadow-md ring-2 ring-cyan-400"
                    : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
                }`}
              >
                {KET_PRESETS[kKey].symbol}
              </button>
            ))}
          </div>

          {/* Card for selected Ket */}
          <div className="p-6 rounded-2xl bg-black/50 border border-white/10 max-w-xl mx-auto space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold text-[var(--color-app-text-main)]">
                Selected: <strong className="text-cyan-300 font-mono">{KET_PRESETS[sec1State].symbol}</strong>
              </span>
              <span className="text-[11px] text-[var(--color-app-text-muted)]">
                {KET_PRESETS[sec1State].name}
              </span>
            </div>

            <div className="py-2 text-center">
              <MathHTMLContainer html={KET_PRESETS[sec1State].latex} />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono text-center">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[var(--color-app-text-muted)] block text-[10px]">Probability of 0:</span>
                <span className="text-emerald-400 font-bold text-sm">{KET_PRESETS[sec1State].p0}%</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[var(--color-app-text-muted)] block text-[10px]">Probability of 1:</span>
                <span className="text-emerald-400 font-bold text-sm">{KET_PRESETS[sec1State].p1}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2 — A QUBIT STATE IN KET NOTATION                                 */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Section 2 · Linear Combination
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Amplitudes & Normalization</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          A Qubit State in Ket Notation
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            Any single-qubit quantum state can be written as a linear combination of the two basis kets:
          </p>

          <div className="p-4 rounded-xl bg-black/40 border border-blue-500/30 font-mono text-center max-w-md mx-auto">
            <MathHTMLContainer html="$$|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$$" />
          </div>

          <p>
            Here, <strong>α</strong> and <strong>β</strong> are complex numbers called <strong>probability amplitudes</strong>.
          </p>

          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs sm:text-sm">
            ⚠️ <strong>Important Conceptual Rule:</strong> The coefficients α and β are <strong>amplitudes</strong>, not probabilities. The probabilities of measuring 0 or 1 in the computational basis are their squared magnitudes:
            <div className="font-mono text-xs pt-1 text-amber-100">
              P(0) = |α|² &nbsp;·&nbsp; P(1) = |β|² &nbsp;·&nbsp; |α|² + |β|² = 1
            </div>
          </div>
        </div>

        {/* Interactive: Build a State with Normalization Guard */}
        <div className="mt-8 p-6 rounded-2xl bg-black/40 border border-blue-500/30 max-w-xl mx-auto space-y-6">
          <div className="text-xs font-bold text-[var(--color-app-text-main)] uppercase tracking-wider text-center">
            Interactive: State Builder & Normalization Check
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <div className="flex justify-between text-[var(--color-app-text-muted)] mb-1">
                <span>Amplitude α (for |0⟩):</span>
                <strong className="text-white">{alphaVal}</strong>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={alphaVal}
                onChange={(e) => setAlphaVal(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-[var(--color-app-text-muted)] mb-1">
                <span>Amplitude β (for |1⟩):</span>
                <strong className="text-white">{betaVal}</strong>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.05"
                value={betaVal}
                onChange={(e) => setBetaVal(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>

          {/* Normalization Status Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            sec2IsValid
              ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
              : "bg-rose-950/30 border-rose-500/40 text-rose-200"
          }`}>
            <div>
              <div className="font-bold flex items-center gap-1.5">
                <span>{sec2IsValid ? "✓ Valid Normalized State" : "⚠️ Not normalized — invalid state"}</span>
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">
                |α|² + |β|² = {sec2NormSq} (must equal 1.0)
              </div>
            </div>

            {!sec2IsValid && (
              <button
                onClick={handleNormalizeSec2}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-[11px] font-bold transition-all shrink-0"
              >
                Normalize State
              </button>
            )}
          </div>

          {/* Resulting Equation */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center font-mono text-xs">
            <span className="text-[var(--color-app-text-muted)] block text-[10px] mb-1">Dirac State Representation:</span>
            <span className="text-cyan-300 font-bold text-sm">
              |ψ⟩ = ({alphaVal})|0⟩ + ({betaVal})|1⟩
            </span>
            {sec2IsValid && (
              <div className="text-[11px] text-emerald-400 mt-2">
                P(0) = {Math.round(alphaVal * alphaVal * 100)}% &nbsp;|&nbsp; P(1) = {Math.round(betaVal * betaVal * 100)}%
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3 — READING QUANTUM STATES                                        */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Section 3 · Comprehension
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Extracting Meaning from Kets</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Reading Quantum States: What Does the Ket Tell Us?
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            When you see a ket written down, ask yourself: <strong>“What can I learn from this expression?”</strong>
          </p>

          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-200 text-xs sm:text-sm text-center font-bold">
            The ket describes the quantum state. It is not itself a probability.
          </div>
        </div>

        {/* Interactive: Read the State Flashcards */}
        <div className="mt-8 p-6 rounded-2xl bg-black/40 border border-indigo-500/30 max-w-xl mx-auto space-y-6">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--color-app-text-muted)]">Flashcard {sec3CardIndex + 1} of {sec3Cards.length}:</span>
            <div className="flex gap-1">
              {sec3Cards.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSec3CardIndex(idx);
                    setSec3Revealed(false);
                  }}
                  className={`w-6 h-6 rounded-md font-mono text-xs font-bold transition-all ${
                    sec3CardIndex === idx
                      ? "bg-indigo-600 text-white"
                      : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-xl bg-black/60 border border-white/10 text-center space-y-3 font-mono">
            <div className="text-xs text-[var(--color-app-text-muted)]">{sec3Cards[sec3CardIndex].title}</div>
            <div className="text-xl font-bold text-cyan-300 py-2">{sec3Cards[sec3CardIndex].state}</div>
            <div className="text-xs text-[var(--color-app-text-light)]">{sec3Cards[sec3CardIndex].alphaText}</div>

            {!sec3Revealed ? (
              <button
                onClick={() => setSec3Revealed(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
              >
                Reveal Probabilities
              </button>
            ) : (
              <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 text-xs space-y-2 text-left">
                <div className="flex justify-between font-bold text-emerald-400">
                  <span>P(0) = {sec3Cards[sec3CardIndex].p0}</span>
                  <span>P(1) = {sec3Cards[sec3CardIndex].p1}</span>
                </div>
                <p className="text-[var(--color-app-text-muted)] leading-relaxed text-[11px] font-sans">
                  {sec3Cards[sec3CardIndex].explanation}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4 — FROM KET TO BRA                                               */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Section 4 · The Dual
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Introducing the Bra ⟨ψ|</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          From Ket to Bra: Brackets and Inner Products
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            Paul Dirac completed his notation by pairing the <strong>ket</strong> with a corresponding <strong>bra</strong>:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs max-w-lg mx-auto">
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-center">
              <span className="text-cyan-300 font-bold text-base block mb-1">|ψ⟩</span>
              <span className="text-[var(--color-app-text-muted)]">Ket (State Vector)</span>
            </div>
            <div className="p-4 rounded-xl bg-black/40 border border-purple-500/40 text-center">
              <span className="text-purple-300 font-bold text-base block mb-1">⟨ψ|</span>
              <span className="text-[var(--color-app-text-muted)]">Bra (Dual Row Vector)</span>
            </div>
          </div>

          <p>
            When a bra meets a ket, they combine into a <strong>bra-ket</strong> (bracket), representing the <strong>inner product</strong>:
          </p>

          <div className="p-3 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-center max-w-sm mx-auto">
            ⟨A| &nbsp;+&nbsp; |B⟩ &nbsp;⟶&nbsp; <strong>⟨A|B⟩</strong>
          </div>

          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-purple-200 text-xs sm:text-sm">
            💡 <strong>Overlap Interpretation:</strong> The magnitude of the overlap tells us how strongly the two states overlap; <strong>zero means orthogonal</strong>.
          </div>
        </div>

        {/* Interactive: Overlap Explorer */}
        <div className="mt-8 p-6 rounded-2xl bg-black/40 border border-purple-500/30 max-w-xl mx-auto space-y-6">
          <div className="text-xs font-bold text-[var(--color-app-text-main)] uppercase tracking-wider text-center">
            Interactive: Overlap & Orthogonality Explorer
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] font-mono text-[var(--color-app-text-muted)] block mb-1">Select Bra ⟨A|:</span>
              <div className="flex gap-1">
                {["0", "1", "+", "-"].map((b) => (
                  <button
                    key={b}
                    onClick={() => setBraChoice(b)}
                    className={`flex-1 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                      braChoice === b
                        ? "bg-purple-600 text-white"
                        : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
                    }`}
                  >
                    ⟨{b}|
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-mono text-[var(--color-app-text-muted)] block mb-1">Select Ket |B⟩:</span>
              <div className="flex gap-1">
                {["0", "1", "+", "-"].map((k) => (
                  <button
                    key={k}
                    onClick={() => setKetChoice(k)}
                    className={`flex-1 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                      ketChoice === k
                        ? "bg-cyan-600 text-white"
                        : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
                    }`}
                  >
                    |{k}⟩
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Computed Overlap Result */}
          <div className="p-5 rounded-xl bg-black/60 border border-white/10 text-center font-mono space-y-2">
            <div className="text-sm text-[var(--color-app-text-muted)]">Inner Product Bracket:</div>
            <div className="text-2xl font-bold text-white tracking-wider">
              {overlapData.bracket} = <span className={overlapData.isOrthogonal ? "text-rose-400" : "text-emerald-400"}>{overlapData.value}</span>
            </div>
            <p className="text-xs text-[var(--color-app-text-light)] font-sans pt-1">
              {overlapData.desc}
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5 — MEASUREMENT THROUGH DIRAC NOTATION                            */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Section 5 · The Transition
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">State to Outcome</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Measurement Through Dirac Notation
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            Dirac notation clearly demarcates the boundary between quantum states and classical measurement outcomes:
          </p>

          <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/30 font-mono text-center max-w-md mx-auto space-y-2">
            <div className="text-xs text-[var(--color-app-text-muted)]">Before Measurement:</div>
            <div className="text-cyan-300 font-bold">|ψ⟩ = α|0⟩ + β|1⟩</div>
            <div className="text-[11px] text-[var(--color-app-text-light)]">
              P(0) = |α|² and P(1) = |β|² when measuring in the computational basis.
            </div>
          </div>

          <p>
            When measurement occurs, the state yields a single classical bit (0 or 1), and the ket instantly corresponds to the observed outcome:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs max-w-lg mx-auto text-center">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              Outcome 0 ⟶ post-state is <strong>|0⟩</strong>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              Outcome 1 ⟶ post-state is <strong>|1⟩</strong>
            </div>
          </div>
        </div>

        {/* Interactive: State -> Measure */}
        <div className="mt-8 p-6 rounded-2xl bg-black/40 border border-emerald-500/30 max-w-xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[var(--color-app-text-muted)]">Select Initial State:</span>
            <div className="flex gap-1 font-mono text-xs">
              {["0", "1", "+"].map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setSec5Preset(p);
                    setSec5Result(null);
                  }}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    sec5Preset === p
                      ? "bg-emerald-600 text-white"
                      : "bg-white/5 text-[var(--color-app-text-muted)] hover:bg-white/10"
                  }`}
                >
                  |{p}⟩
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-mono text-[var(--color-app-text-muted)]">Predict Outcome:</span>
            <div className="flex gap-2">
              {[0, 1].map((out) => (
                <button
                  key={out}
                  onClick={() => setSec5Prediction(out)}
                  className={`px-4 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all ${
                    sec5Prediction === out
                      ? "bg-cyan-500/20 border-cyan-500 text-cyan-300"
                      : "bg-white/5 border-white/10 text-[var(--color-app-text-muted)] hover:bg-white/10"
                  }`}
                >
                  Predict {out}
                </button>
              ))}
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={handleMeasureSec5}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-all shadow-md"
            >
              Measure in Computational Basis [M]
            </button>
          </div>

          {sec5Result && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center font-mono text-xs space-y-2">
              <div className="text-[var(--color-app-text-muted)]">Classical Measurement Result:</div>
              <div className="text-xl font-bold text-white">Outcome: {sec5Result.outcome}</div>
              <div className="text-xs text-emerald-400">
                Post-Measurement Quantum State: <strong>{sec5Result.postState}</strong>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6 — TWO QUBITS, SAME NOTATION                                     */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/30">
            Section 6 · Scaling Up
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Multi-Qubit Kets</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Two Qubits, Same Notation
        </h2>

        <div className="prose prose-invert text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed space-y-4">
          <p>
            One of the greatest strengths of Dirac notation is how effortlessly it scales. For two qubits, we write their joint states by placing the binary sequence directly inside the ket:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs text-center max-w-lg mx-auto">
            {["00", "01", "10", "11"].map((b) => (
              <div key={b} className="p-3 rounded-xl bg-black/40 border border-white/10 text-pink-300 font-bold">
                |{b}⟩
              </div>
            ))}
          </div>

          <p>
            A general two-qubit state is written with four amplitude coefficients:
          </p>

          <div className="p-4 rounded-xl bg-black/40 border border-pink-500/30 font-mono text-center max-w-lg mx-auto">
            <MathHTMLContainer html="$$|\psi\rangle = \alpha|00\rangle + \beta|01\rangle + \gamma|10\rangle + \delta|11\rangle$$" />
            <div className="text-[11px] text-[var(--color-app-text-muted)] mt-2">
              Normalization: |α|² + |β|² + |γ|² + |δ|² = 1
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/30 border border-white/10 text-xs text-[var(--color-app-text-muted)] leading-relaxed max-w-xl mx-auto text-center">
            <strong>Key Insight:</strong> The notation stays the same regardless of how many qubits we have. Later, in Modules 11 and 12, you will see how this notation describes entangled quantum pairs like (|00⟩ + |11⟩)/√2.
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7 — DIRAC NOTATION CHALLENGE & SUMMARY                            */}
      {/* ========================================================================= */}
      <section className="rounded-2xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Section 7 · Challenge Lab
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">Test Your Notation Fluency</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)] mb-4">
          Challenge Lab: Test Your Understanding
        </h2>

        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Challenge 1 */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="text-xs font-bold text-[var(--color-app-text-main)] flex items-center justify-between">
              <span>Challenge 1: Read the Ket</span>
              {chSubmitted[1] && (
                <span className={chAnswers[1] === "basis0" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {chAnswers[1] === "basis0" ? "✓ Correct" : "✗ Try again"}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-app-text-muted)]">
              What does the symbol <strong>|0⟩</strong> represent?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {[
                { id: "basis0", label: "A qubit in the 0 basis state" },
                { id: "prob0", label: "A probability of zero" },
                { id: "dual0", label: "A dual bra vector" },
                { id: "gate0", label: "A quantum reset gate" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectChallenge(1, opt.id)}
                  className={`py-2 px-3 rounded-xl font-mono text-xs font-bold border transition-all text-left ${
                    chAnswers[1] === opt.id
                      ? opt.id === "basis0"
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
                Explanation: |0⟩ is a ket representing the computational basis state corresponding to classical bit 0.
              </p>
            )}
          </div>

          {/* Challenge 2 */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="text-xs font-bold text-[var(--color-app-text-main)] flex items-center justify-between">
              <span>Challenge 2: Read the Coefficients</span>
              {chSubmitted[2] && (
                <span className={chAnswers[2] === "5050" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {chAnswers[2] === "5050" ? "✓ Correct" : "✗ Try again"}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-app-text-muted)]">
              Given the state:
            </p>
            <div className="text-center py-1">
              <MathHTMLContainer html="$$|\psi\rangle = \frac{|0\rangle + |1\rangle}{\sqrt{2}}$$" />
            </div>
            <p className="text-xs text-[var(--color-app-text-muted)]">
              What are the computational-basis measurement probabilities?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {[
                { id: "5050", label: "P(0) = 50%, P(1) = 50%" },
                { id: "1000", label: "P(0) = 100%, P(1) = 0%" },
                { id: "7070", label: "P(0) = 70.7%, P(1) = 70.7%" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectChallenge(2, opt.id)}
                  className={`py-2 px-3 rounded-xl font-mono text-xs font-bold border transition-all text-center ${
                    chAnswers[2] === opt.id
                      ? opt.id === "5050"
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
                Explanation: The amplitudes are 1/√2 each. Squaring them gives (1/√2)² = 1/2 = 50% for each basis outcome.
              </p>
            )}
          </div>

          {/* Challenge 3 */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="text-xs font-bold text-[var(--color-app-text-main)] flex items-center justify-between">
              <span>Challenge 3: Inner Product</span>
              {chSubmitted[3] && (
                <span className={chAnswers[3] === "0" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {chAnswers[3] === "0" ? "✓ Correct" : "✗ Try again"}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-app-text-muted)]">
              What is the value of the bracket <strong>⟨0|1⟩</strong>?
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {["0", "1", "1/√2"].map((val) => (
                <button
                  key={val}
                  onClick={() => handleSelectChallenge(3, val)}
                  className={`py-2 rounded-xl font-mono text-xs font-bold border transition-all ${
                    chAnswers[3] === val
                      ? val === "0"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : "bg-rose-500/20 border-rose-500 text-rose-300"
                      : "bg-white/5 border-white/10 text-[var(--color-app-text-muted)] hover:bg-white/10"
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            {chSubmitted[3] && (
              <p className="text-[11px] text-[var(--color-app-text-light)] pt-1">
                Explanation: |0⟩ and |1⟩ are orthogonal computational basis states. Their overlap is strictly 0.
              </p>
            )}
          </div>

          {/* Challenge 4 */}
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="text-xs font-bold text-[var(--color-app-text-main)] flex items-center justify-between">
              <span>Challenge 4: One or Two Qubits?</span>
              {chSubmitted[4] && (
                <span className={chAnswers[4] === "01" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {chAnswers[4] === "01" ? "✓ Correct" : "✗ Try again"}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-app-text-muted)]">
              Which of the following represents a <strong>two-qubit basis state</strong>?
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { id: "+", label: "|+⟩" },
                { id: "01", label: "|01⟩" },
                { id: "psi", label: "|ψ⟩" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectChallenge(4, opt.id)}
                  className={`py-2 rounded-xl font-mono text-xs font-bold border transition-all ${
                    chAnswers[4] === opt.id
                      ? opt.id === "01"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : "bg-rose-500/20 border-rose-500 text-rose-300"
                      : "bg-white/5 border-white/10 text-[var(--color-app-text-muted)] hover:bg-white/10"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {chSubmitted[4] && (
              <p className="text-[11px] text-[var(--color-app-text-light)] pt-1">
                Explanation: |01⟩ specifies a two-bit sequence, indicating a joint basis state for a pair of qubits.
              </p>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUMMARY & FORWARD LOOK                                                    */}
        {/* ========================================================================= */}
        <div className="mt-12 pt-8 border-t border-white/10 space-y-6">
          <div className="text-center space-y-3">
            <h3 className="text-lg font-bold text-[var(--color-app-text-main)]">
              Dirac Notation Progression
            </h3>
            <div className="flex items-center justify-center gap-2 font-mono text-xs sm:text-sm text-cyan-300 flex-wrap">
              <span>Ket |ψ⟩</span>
              <span>⟶</span>
              <span>State Vector</span>
              <span>⟶</span>
              <span>α|0⟩ + β|1⟩</span>
              <span>⟶</span>
              <span>Bra ⟨ψ|</span>
              <span>⟶</span>
              <span className="text-purple-300 font-bold">Inner Product ⟨A|B⟩</span>
              <span>⟶</span>
              <span className="text-pink-300 font-bold">Multi-Qubit |00⟩</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-3 max-w-2xl mx-auto">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-app-text-main)]">
              8 Core Takeaways:
            </div>
            <ol className="list-decimal pl-5 text-xs text-[var(--color-app-text-muted)] space-y-2 leading-relaxed">
              <li><strong>Ket notation:</strong> A ket |ψ⟩ is a compact representation of a quantum state vector.</li>
              <li><strong>Basis states:</strong> |0⟩ and |1⟩ are the standard computational basis states.</li>
              <li><strong>Linear combination:</strong> A general single qubit is expressed as α|0⟩ + β|1⟩.</li>
              <li><strong>Amplitudes vs probabilities:</strong> Coefficients α and β are amplitudes; computational-basis probabilities are |α|² and |β|².</li>
              <li><strong>Dual bra:</strong> A bra ⟨ψ| is the dual row vector matching ket |ψ⟩.</li>
              <li><strong>Inner products:</strong> Brackets like ⟨A|B⟩ describe the overlap between states; ⟨0|1⟩ = 0 signifies orthogonality.</li>
              <li><strong>Measurement boundary:</strong> The ket describes the state before measurement; measurement yields a classical bit and collapses the state.</li>
              <li><strong>Multi-qubit scalability:</strong> Multi-qubit joint states are written naturally as |00⟩, |01⟩, etc.</li>
            </ol>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/40 to-black border border-cyan-500/30 text-xs sm:text-sm text-center text-cyan-200 max-w-2xl mx-auto leading-relaxed">
            🚀 <strong>Next Up:</strong> Now that we have a language for writing quantum states, we can look more closely at the amplitudes inside those states—and discover why phase matters in <strong>Module 5: Amplitudes & Phase</strong>.
          </div>

          <div className="text-center pt-4">
            <button
              onClick={onComplete}
              className={`px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-xl ${
                isCompleted
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
              }`}
            >
              {isCompleted ? "✓ Module Completed" : "Complete Module 4"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
