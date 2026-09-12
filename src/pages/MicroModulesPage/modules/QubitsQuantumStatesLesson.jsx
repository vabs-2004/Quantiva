import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MathHTMLContainer from "../../../components/MathHTMLContainer/MathHTMLContainer";
import StateProbabilityHeatmap from "../../../components/StateProbabilityHeatmap/StateProbabilityHeatmap";

/**
 * Module 3: QUBITS & QUANTUM STATES
 * Educational Narrative:
 * 1. From Bit to Qubit (|0⟩, |1⟩ basis states, |ψ⟩ = α|0⟩ + β|1⟩)
 * 2. What Does the State Tell Us? (Measurement prediction & interactive sampling chamber)
 * 3. The Probability Rule (P(0) = |α|², P(1) = |β|², |α|² + |β|² = 1)
 * 4. Probabilities Are Not the Whole State (|+⟩ vs |−⟩, identical probabilities in Z-basis but different states)
 * 5. Normalization (|α|² + |β|² = 1 constraint & normalization tool)
 * 6. Free State Explorer (Complex amplitudes, state representation, 10 & 100 shots sampling)
 * 7. Predict the Measurement (Interactive 20-shot prediction experiment)
 * 8. From State to Experiment (Circuit Simulator bridge)
 * 9. Summary & Completion
 */
export default function QubitsQuantumStatesLesson({ onComplete, isCompleted, onAskQuantiva }) {
  const navigate = useNavigate();

  // ─── SECTION 1: Build a Qubit Preset Explorer ─────────────────
  const [sec1Preset, setSec1Preset] = useState("plus"); // "0", "1", "plus", "minus"

  const sec1Data = useMemo(() => {
    switch (sec1Preset) {
      case "0":
        return { label: "|0⟩", alpha: "1", beta: "0", p0: 100, p1: 0, desc: "Basis state: definitely 0." };
      case "1":
        return { label: "|1⟩", alpha: "0", beta: "1", p0: 0, p1: 100, desc: "Basis state: definitely 1." };
      case "plus":
        return { label: "|+⟩", alpha: "1/√2", beta: "1/√2", p0: 50, p1: 50, desc: "Equal combination with positive relative phase." };
      case "minus":
        return { label: "|−⟩", alpha: "1/√2", beta: "-1/√2", p0: 50, p1: 50, desc: "Equal combination with negative relative phase." };
      default:
        return { label: "|+⟩", alpha: "1/√2", beta: "1/√2", p0: 50, p1: 50, desc: "Equal superposition." };
    }
  }, [sec1Preset]);

  // ─── SECTION 2: Measurement Chamber ───────────────────────────
  const [chamberCounts, setChamberCounts] = useState({ 0: 0, 1: 0 });
  const [lastShot, setLastShot] = useState(null);
  const [chamberAnimating, setChamberAnimating] = useState(false);

  const measureChamberShot = () => {
    if (chamberAnimating) return;
    setChamberAnimating(true);
    // 50/50 state |+⟩
    const outcome = Math.random() < 0.5 ? 0 : 1;
    setTimeout(() => {
      setLastShot(outcome);
      setChamberCounts((prev) => ({ ...prev, [outcome]: prev[outcome] + 1 }));
      setChamberAnimating(false);
    }, 250);
  };

  const resetChamber = () => {
    setChamberCounts({ 0: 0, 1: 0 });
    setLastShot(null);
  };

  const chamberTotal = chamberCounts[0] + chamberCounts[1];

  // ─── SECTION 3: Probability Playground ─────────────────────────
  // Controlled via real amplitude alpha in [0, 1]. Normalized beta = sqrt(1 - alpha^2).
  const [sliderAlpha, setSliderAlpha] = useState(0.8);
  const sec3Beta = useMemo(() => {
    const val = Math.sqrt(Math.max(0, 1 - sliderAlpha * sliderAlpha));
    return Math.round(val * 1000) / 1000;
  }, [sliderAlpha]);

  const p0Sec3 = Math.round(sliderAlpha * sliderAlpha * 100);
  const p1Sec3 = 100 - p0Sec3;

  // ─── SECTION 4: Distinct States Check ──────────────────────────
  const [sec4Answer, setSec4Answer] = useState(null); // true = "No", false = "Yes"

  // ─── SECTION 5: Normalization Exploration ─────────────────────
  const [rawA, setRawA] = useState(0.8);
  const [rawB, setRawB] = useState(0.8);
  const rawSumSquares = Math.round((rawA * rawA + rawB * rawB) * 100) / 100;
  const isRawNormalized = Math.abs(rawSumSquares - 1.0) < 0.01;

  const handleNormalizeState = () => {
    const norm = Math.sqrt(rawA * rawA + rawB * rawB);
    if (norm === 0) {
      setRawA(1);
      setRawB(0);
      return;
    }
    setRawA(Math.round((rawA / norm) * 100) / 100);
    setRawB(Math.round((rawB / norm) * 100) / 100);
  };

  // ─── SECTION 6: Free State Explorer ────────────────────────────
  const [expPreset, setExpPreset] = useState("custom");
  const [customRealA, setCustomRealA] = useState(0.6);
  const [customImagA, setCustomImagA] = useState(0.0);
  const [customRealB, setCustomRealB] = useState(0.8);
  const [customImagB, setCustomImagB] = useState(0.0);
  const [expShotCounts, setExpShotCounts] = useState({ 0: 0, 1: 0 });

  const sec6Math = useMemo(() => {
    let rA = customRealA;
    let iA = customImagA;
    let rB = customRealB;
    let iB = customImagB;

    if (expPreset === "0") {
      rA = 1; iA = 0; rB = 0; iB = 0;
    } else if (expPreset === "1") {
      rA = 0; iA = 0; rB = 1; iB = 0;
    } else if (expPreset === "plus") {
      rA = 0.707; iA = 0; rB = 0.707; iB = 0;
    } else if (expPreset === "minus") {
      rA = 0.707; iA = 0; rB = -0.707; iB = 0;
    }

    const magA2 = rA * rA + iA * iA;
    const magB2 = rB * rB + iB * iB;
    const norm = magA2 + magB2;

    const p0 = norm > 0 ? magA2 / norm : 1;
    const p1 = norm > 0 ? magB2 / norm : 0;

    const formatComplex = (r, i) => {
      if (Math.abs(i) < 0.001) return r.toFixed(2);
      if (Math.abs(r) < 0.001) return `${i.toFixed(2)}i`;
      return `${r.toFixed(2)} ${i >= 0 ? "+" : "-"} ${Math.abs(i).toFixed(2)}i`;
    };

    return {
      rA, iA, rB, iB,
      strA: formatComplex(rA, iA),
      strB: formatComplex(rB, iB),
      prob0: Math.round(p0 * 1000) / 1000,
      prob1: Math.round(p1 * 1000) / 1000,
    };
  }, [expPreset, customRealA, customImagA, customRealB, customImagB]);

  const runShots = (num) => {
    let zeros = 0;
    let ones = 0;
    for (let i = 0; i < num; i++) {
      if (Math.random() < sec6Math.prob0) zeros++;
      else ones++;
    }
    setExpShotCounts((prev) => ({ 0: prev[0] + zeros, 1: prev[1] + ones }));
  };

  // ─── SECTION 7: Predict the Measurement ───────────────────────
  // Target state: sqrt(0.8)|0⟩ + sqrt(0.2)|1⟩ -> Prob(0) = 80%, Prob(1) = 20%
  const [predictionZero, setPredictionZero] = useState(16); // Expected is ~16
  const [predictionRunResult, setPredictionRunResult] = useState(null);

  const runPredictionExperiment = () => {
    let zeros = 0;
    let ones = 0;
    for (let i = 0; i < 20; i++) {
      if (Math.random() < 0.8) zeros++;
      else ones++;
    }
    setPredictionRunResult({ 0: zeros, 1: ones });
  };

  // ─── SECTION 8: Simulator Bridge ──────────────────────────────
  const handleLaunchSimulator = () => {
    navigate("/circuit-simulator", {
      state: {
        initialNumQubits: 1,
        initialCircuit: {
          0: [
            { type: "H", label: "H", short: "H", color: "bg-blue-500/20 text-blue-400 border-blue-500" },
            { type: "M", label: "Measure", short: "M", color: "bg-zinc-700/50 text-white border-zinc-500" },
          ],
        },
        origin: "qubits-quantum-states",
      },
    });
  };

  return (
    <div className="space-y-12">
      {/* ─── SECTION 1: FROM BIT TO QUBIT ─── */}
      <section className="rounded-3xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)] space-y-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-app-primary)] bg-[var(--color-app-primary)]/10 px-3 py-1 rounded-full border border-[var(--color-app-primary)]/20">
            Section 1 • Foundations
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">• Moving Beyond Classical Bits</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-app-text-main)]">
          From Bit to Qubit: The Computational Basis States
        </h2>

        <p className="text-sm leading-relaxed text-[var(--color-app-text-muted)] max-w-3xl">
          A classical bit is rigidly locked: it is either <strong className="text-white">0</strong> or <strong className="text-white">1</strong>. In quantum computing, we represent these classical baselines as orthogonal quantum states called <strong className="text-white">computational basis states</strong>:
        </p>

        <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
          <div className="p-4 rounded-2xl bg-black/30 border border-white/10 flex items-center gap-4">
            <span className="font-mono text-2xl font-bold text-[var(--color-app-primary)] px-3 py-1 rounded-xl bg-white/5 border border-white/10">
              |0⟩
            </span>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">Basis State 0</div>
              <p className="text-xs text-[var(--color-app-text-muted)]">Analogous to classical 0</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/30 border border-white/10 flex items-center gap-4">
            <span className="font-mono text-2xl font-bold text-[var(--color-app-accent)] px-3 py-1 rounded-xl bg-white/5 border border-white/10">
              |1⟩
            </span>
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">Basis State 1</div>
              <p className="text-xs text-[var(--color-app-text-muted)]">Analogous to classical 1</p>
            </div>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-[var(--color-app-text-muted)] max-w-3xl">
          Crucially, a qubit does not need to choose exclusively between them. A general qubit state <MathHTMLContainer html="$|\psi\rangle$" /> can be formed by combining both basis states:
        </p>

        <div className="p-5 rounded-2xl bg-black/40 border border-white/10 max-w-lg flex flex-col items-center">
          <MathHTMLContainer html="$$|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$$" />
          <p className="text-xs text-[var(--color-app-text-light)] italic mt-2 text-center">
            A linear combination (superposition) of basis states weighted by amplitudes <MathHTMLContainer html="$\alpha$" /> and <MathHTMLContainer html="$\beta$" />.
          </p>
        </div>

        {/* Interaction: Build a Qubit Preset Explorer */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-app-primary)]">
            ⚡ Interactive: Build a Qubit
          </div>
          <p className="text-xs text-[var(--color-app-text-muted)]">
            Select a quantum state preset to inspect its amplitudes and resulting probabilities:
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: "0", label: "|0⟩" },
              { id: "1", label: "|1⟩" },
              { id: "plus", label: "|+⟩" },
              { id: "minus", label: "|−⟩" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSec1Preset(p.id)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                  sec1Preset === p.id
                    ? "bg-[var(--color-app-primary)] text-white border-[var(--color-app-primary)] shadow-md"
                    : "app-glass border-[var(--color-app-border)] text-[var(--color-app-text-muted)] hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-2">
              <div className="text-xs font-bold text-white font-mono">{sec1Data.label} State Vector</div>
              <div className="text-xs font-mono text-[var(--color-app-text-muted)] space-y-1">
                <div>α (amplitude for |0⟩) = <b className="text-[var(--color-app-primary)]">{sec1Data.alpha}</b></div>
                <div>β (amplitude for |1⟩) = <b className="text-[var(--color-app-accent)]">{sec1Data.beta}</b></div>
              </div>
              <p className="text-[11px] text-[var(--color-app-text-light)] italic pt-1">
                {sec1Data.desc}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/30 border border-white/10">
              <div className="text-xs font-bold text-white mb-2">Measurement Probabilities</div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-app-text-muted)]">P(0)</span>
                  <div className="flex-1 mx-3 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-[var(--color-app-primary)]" style={{ width: `${sec1Data.p0}%` }} />
                  </div>
                  <span className="w-10 text-right font-bold text-white">{sec1Data.p0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-app-text-muted)]">P(1)</span>
                  <div className="flex-1 mx-3 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-[var(--color-app-accent)]" style={{ width: `${sec1Data.p1}%` }} />
                  </div>
                  <span className="w-10 text-right font-bold text-white">{sec1Data.p1}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: WHAT DOES THE STATE TELL US? & MEASUREMENT CHAMBER ─── */}
      <section className="rounded-3xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)] space-y-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Section 2 • Prediction & Sampling
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">• What Does the State Tell Us?</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-app-text-main)]">
          Predicting Outcomes: The Quantum Measurement Chamber
        </h2>

        <p className="text-sm leading-relaxed text-[var(--color-app-text-muted)] max-w-3xl">
          If you know the exact state of a qubit, what can you predict? <strong className="text-white">A quantum state does not predict a predetermined sequence of results; it predicts the probability distribution of measurement outcomes.</strong>
        </p>

        {/* Interactive Measurement Chamber */}
        <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Chamber Qubit State: |+⟩ = 1/√2|0⟩ + 1/√2|1⟩
              </div>
              <div className="text-xs text-[var(--color-app-text-muted)] mt-0.5">
                Theoretical distribution: 50% |0⟩ and 50% |1⟩
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={measureChamberShot}
                disabled={chamberAnimating}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {chamberAnimating ? "Measuring..." : "⚡ Measure Qubit"}
              </button>

              <button
                onClick={resetChamber}
                className="px-3 py-2 rounded-xl text-xs font-semibold border border-white/10 hover:bg-white/5 text-[var(--color-app-text-muted)] hover:text-white transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 items-center">
            {/* Last Shot Result Display */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/[0.02] border border-white/10 min-h-[140px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-app-text-muted)] mb-2">
                Last Measured Outcome
              </span>
              {lastShot !== null ? (
                <div className="text-4xl font-mono font-extrabold text-white animate-fade-in flex items-center gap-2">
                  <span className={lastShot === 0 ? "text-[var(--color-app-primary)]" : "text-[var(--color-app-accent)]"}>
                    |{lastShot}⟩
                  </span>
                  <span className="text-sm font-semibold text-emerald-400">Collapsed ✓</span>
                </div>
              ) : (
                <span className="text-xs text-[var(--color-app-text-light)] italic">
                  Press "Measure Qubit" to sample an outcome
                </span>
              )}
            </div>

            {/* Accumulated Histogram */}
            <div className="space-y-3 p-5 rounded-2xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-white">Accumulated Results ({chamberTotal} shots)</span>
                <span className="text-[var(--color-app-text-muted)] font-mono">
                  0: {chamberCounts[0]} | 1: {chamberCounts[1]}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[var(--color-app-primary)]">|0⟩ Outcomes</span>
                    <span>{chamberTotal > 0 ? ((chamberCounts[0] / chamberTotal) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-app-primary)] transition-all duration-300"
                      style={{ width: chamberTotal > 0 ? `${(chamberCounts[0] / chamberTotal) * 100}%` : "0%" }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[var(--color-app-accent)]">|1⟩ Outcomes</span>
                    <span>{chamberTotal > 0 ? ((chamberCounts[1] / chamberTotal) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-app-accent)] transition-all duration-300"
                      style={{ width: chamberTotal > 0 ? `${(chamberCounts[1] / chamberTotal) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-[var(--color-app-text-light)] italic border-t border-white/5 pt-4">
            Notice how individual measurements are unpredictable (either 0 or 1), but as you take more shots, the ratio cleanly converges toward the theoretical 50/50 probability distribution.
          </p>
        </div>
      </section>

      {/* ─── SECTION 3: THE PROBABILITY RULE (BORN'S RULE) ─── */}
      <section className="rounded-3xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)] space-y-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Section 3 • Mathematical Law
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">• Born's Probability Rule</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-app-text-main)]">
          The Probability Rule: Squared Magnitudes
        </h2>

        <p className="text-sm leading-relaxed text-[var(--color-app-text-muted)] max-w-3xl">
          In Module 2, we learned that quantum amplitudes are complex numbers. To translate complex amplitudes into observable physical probabilities, quantum mechanics uses <strong className="text-white">Born's Rule</strong>:
        </p>

        <div className="grid sm:grid-cols-3 gap-4 max-w-2xl">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-center">
            <MathHTMLContainer html="$$P(0) = |\alpha|^2$$" />
            <div className="text-[11px] text-[var(--color-app-text-muted)] mt-1">Probability of measuring 0</div>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-center">
            <MathHTMLContainer html="$$P(1) = |\beta|^2$$" />
            <div className="text-[11px] text-[var(--color-app-text-muted)] mt-1">Probability of measuring 1</div>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-center">
            <MathHTMLContainer html="$$|\alpha|^2 + |\beta|^2 = 1$$" />
            <div className="text-[11px] text-[var(--color-app-text-muted)] mt-1">Total probability is 100%</div>
          </div>
        </div>

        {/* Probability Playground Slider */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-5">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            ⚡ Probability Playground
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[var(--color-app-text-muted)]">Amplitude α (real): <b>{sliderAlpha.toFixed(2)}</b></span>
              <span className="text-[var(--color-app-text-muted)]">Amplitude β (real): <b>{sec3Beta.toFixed(2)}</b></span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={sliderAlpha}
              onChange={(e) => setSliderAlpha(parseFloat(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none bg-white/10 accent-[var(--color-app-primary)] cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-xl bg-black/30 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
            <div>
              <div>|α|² = ({sliderAlpha.toFixed(2)})² = <b className="text-[var(--color-app-primary)]">{(sliderAlpha * sliderAlpha).toFixed(3)}</b> (P(0) = {p0Sec3}%)</div>
              <div>|β|² = ({sec3Beta.toFixed(2)})² = <b className="text-[var(--color-app-accent)]">{(sec3Beta * sec3Beta).toFixed(3)}</b> (P(1) = {p1Sec3}%)</div>
            </div>
            <div className="text-right text-[11px] text-emerald-400 font-bold">
              |α|² + |β|² = 1.000 ✓
            </div>
          </div>

          {/* Probability Bars */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-12 font-mono text-xs text-[var(--color-app-text-muted)]">0:</span>
              <div className="flex-1 h-5 rounded-md bg-white/5 overflow-hidden">
                <div className="h-full bg-[var(--color-app-primary)] flex items-center px-2 text-[10px] font-bold text-white transition-all" style={{ width: `${p0Sec3}%` }}>
                  {p0Sec3 > 10 && `${p0Sec3}%`}
                </div>
              </div>
              <span className="w-12 font-mono text-xs text-right text-white">{p0Sec3}%</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-12 font-mono text-xs text-[var(--color-app-text-muted)]">1:</span>
              <div className="flex-1 h-5 rounded-md bg-white/5 overflow-hidden">
                <div className="h-full bg-[var(--color-app-accent)] flex items-center px-2 text-[10px] font-bold text-white transition-all" style={{ width: `${p1Sec3}%` }}>
                  {p1Sec3 > 10 && `${p1Sec3}%`}
                </div>
              </div>
              <span className="w-12 font-mono text-xs text-right text-white">{p1Sec3}%</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: PROBABILITIES ARE NOT THE WHOLE STATE ─── */}
      <section className="rounded-3xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)] space-y-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
            Section 4 • Crucial Concept
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">• Beyond Probability Distributions</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-app-text-main)]">
          Probabilities Are Not the Whole State
        </h2>

        <p className="text-sm leading-relaxed text-[var(--color-app-text-muted)] max-w-3xl">
          It is tempting to think of a quantum state as merely a pair of probabilities like 50% and 50%. But consider these two states:
        </p>

        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-center">
            <div className="text-xs font-bold text-white uppercase tracking-wider">State 1: |+⟩</div>
            <MathHTMLContainer html="$$|\psi_1\rangle = \frac{1}{\sqrt{2}}|0\rangle + \frac{1}{\sqrt{2}}|1\rangle$$" />
            <div className="text-xs font-mono text-[var(--color-app-text-muted)] pt-2 border-t border-white/5">
              P(0) = 50% · P(1) = 50%
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-center">
            <div className="text-xs font-bold text-white uppercase tracking-wider">State 2: |−⟩</div>
            <MathHTMLContainer html="$$|\psi_2\rangle = \frac{1}{\sqrt{2}}|0\rangle - \frac{1}{\sqrt{2}}|1\rangle$$" />
            <div className="text-xs font-mono text-[var(--color-app-text-muted)] pt-2 border-t border-white/5">
              P(0) = 50% · P(1) = 50%
            </div>
          </div>
        </div>

        {/* Conceptual Interactive Query */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
          <div className="text-sm font-bold text-white">
            Are <MathHTMLContainer html="$|\psi_1\rangle$" /> and <MathHTMLContainer html="$|\psi_2\rangle$" /> the exact same quantum state?
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSec4Answer(false)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                sec4Answer === false
                  ? "bg-red-500/20 text-red-200 border-red-500/40"
                  : "bg-white/5 border-white/10 text-[var(--color-app-text-muted)] hover:text-white"
              }`}
            >
              ○ Yes — they have the exact same probabilities
            </button>

            <button
              onClick={() => setSec4Answer(true)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                sec4Answer === true
                  ? "bg-green-500/20 text-green-200 border-green-500/40"
                  : "bg-white/5 border-white/10 text-[var(--color-app-text-muted)] hover:text-white"
              }`}
            >
              ● No — something fundamental differs
            </button>
          </div>

          {sec4Answer !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border text-xs leading-relaxed ${
                sec4Answer === true
                  ? "bg-green-950/30 border-green-500/30 text-green-200"
                  : "bg-amber-950/30 border-amber-500/30 text-amber-200"
              }`}
            >
              {sec4Answer === true ? (
                <>
                  <strong className="block mb-1 text-green-300">✓ Correct! They are physically distinct states.</strong>
                  While measuring both in the standard 0/1 basis produces identical 50/50 outcomes, their amplitudes have different <strong className="text-white">relative phases</strong> (+ vs -). Under future quantum operations, they interfere completely differently!
                </>
              ) : (
                <>
                  <strong className="block mb-1 text-amber-300">Not quite!</strong>
                  Although their measurement probabilities match in this specific basis, they are distinct physical states with different relative phases. We will explore phase interference deeply in Module 5: Amplitudes & Phase.
                </>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── SECTION 5: NORMALIZATION ─── */}
      <section className="rounded-3xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)] space-y-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            Section 5 • Physical Requirement
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">• Conservation of Probability</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-app-text-main)]">
          Normalization: Why Probabilities Must Sum to 1
        </h2>

        <p className="text-sm leading-relaxed text-[var(--color-app-text-muted)] max-w-3xl">
          Whenever you measure a physical qubit, it <strong className="text-white">must</strong> produce some valid outcome. Therefore, the sum of all outcome probabilities must always equal exactly 100%:
        </p>

        <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4 max-w-xl">
          <div className="flex items-center justify-between text-xs font-mono">
            <span>Amplitude α: <b>{rawA.toFixed(2)}</b></span>
            <span>Amplitude β: <b>{rawB.toFixed(2)}</b></span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs font-mono">
            |α|² + |β|² = ({rawA.toFixed(2)})² + ({rawB.toFixed(2)})² ={" "}
            <b className={isRawNormalized ? "text-green-400" : "text-red-400"}>
              {rawSumSquares.toFixed(2)} {isRawNormalized ? "✓ (Valid State)" : "✗ (Invalid State)"}
            </b>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setRawA(0.8); setRawB(0.8); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 hover:text-white"
            >
              Set Unnormalized (0.8, 0.8)
            </button>

            <button
              onClick={() => { setRawA(0.6); setRawB(0.8); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 hover:text-white"
            >
              Set Normalized (0.6, 0.8)
            </button>

            {!isRawNormalized && (
              <button
                onClick={handleNormalizeState}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 text-white hover:bg-cyan-500 transition-colors"
              >
                Normalize This State ⚡
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: FREE STATE EXPLORER ─── */}
      <section className="rounded-3xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)] space-y-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            Section 6 • Your Turn
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">• Comprehensive State Explorer</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-app-text-main)]">
          Explore Arbitrary Qubit States
        </h2>

        <p className="text-sm leading-relaxed text-[var(--color-app-text-muted)] max-w-3xl">
          Now take full control. Select standard state presets or configure custom complex amplitudes to observe their representation, probabilities, and multi-shot measurement distributions:
        </p>

        <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-6">
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: "custom", label: "Custom State" },
              { id: "0", label: "|0⟩" },
              { id: "1", label: "|1⟩" },
              { id: "plus", label: "|+⟩" },
              { id: "minus", label: "|−⟩" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setExpPreset(p.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  expPreset === p.id
                    ? "bg-[var(--color-app-primary)] text-white border-[var(--color-app-primary)]"
                    : "app-glass border-[var(--color-app-border)] text-[var(--color-app-text-muted)] hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {expPreset === "custom" && (
            <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="space-y-2">
                <div className="text-xs font-bold text-white">Amplitude α = Re + Im·i</div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span>Re:</span>
                  <input
                    type="range" min="-1" max="1" step="0.05" value={customRealA}
                    onChange={(e) => setCustomRealA(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-10 text-right">{customRealA.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span>Im:</span>
                  <input
                    type="range" min="-1" max="1" step="0.05" value={customImagA}
                    onChange={(e) => setCustomImagA(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-10 text-right">{customImagA.toFixed(2)}i</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-white">Amplitude β = Re + Im·i</div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span>Re:</span>
                  <input
                    type="range" min="-1" max="1" step="0.05" value={customRealB}
                    onChange={(e) => setCustomRealB(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-10 text-right">{customRealB.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span>Im:</span>
                  <input
                    type="range" min="-1" max="1" step="0.05" value={customImagB}
                    onChange={(e) => setCustomImagB(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="w-10 text-right">{customImagB.toFixed(2)}i</span>
                </div>
              </div>
            </div>
          )}

          {/* State & Heatmap Representation */}
          <div className="grid sm:grid-cols-2 gap-4 items-center">
            <div className="p-4 rounded-xl bg-black/30 border border-white/10 font-mono text-xs space-y-2">
              <div className="text-white font-bold">Computed Quantum State:</div>
              <div className="text-[var(--color-app-primary)] text-sm">
                |ψ⟩ = ({sec6Math.strA})|0⟩ + ({sec6Math.strB})|1⟩
              </div>
              <div className="text-[var(--color-app-text-muted)] text-[11px] pt-1">
                P(0) = {(sec6Math.prob0 * 100).toFixed(1)}% · P(1) = {(sec6Math.prob1 * 100).toFixed(1)}%
              </div>
            </div>

            <StateProbabilityHeatmap probabilities={{ "0": sec6Math.prob0, "1": sec6Math.prob1 }} />
          </div>

          {/* Measurement Sampling Trigger */}
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-white/10 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => runShots(10)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                Sample 10 Shots
              </button>
              <button
                onClick={() => runShots(100)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                Sample 100 Shots
              </button>
              <button
                onClick={() => setExpShotCounts({ 0: 0, 1: 0 })}
                className="px-3 py-2 rounded-xl text-xs text-[var(--color-app-text-muted)] hover:text-white"
              >
                Clear
              </button>
            </div>

            {(expShotCounts[0] + expShotCounts[1] > 0) && (
              <div className="text-xs font-mono text-[var(--color-app-text-muted)]">
                Sampled Total: <b className="text-white">{expShotCounts[0] + expShotCounts[1]}</b> shots (0: {expShotCounts[0]}, 1: {expShotCounts[1]})
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── SECTION 7: PREDICT THE MEASUREMENT ─── */}
      <section className="rounded-3xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)] space-y-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
            Section 7 • Prediction Challenge
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">• Empirical Verification</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-app-text-main)]">
          Predict the Measurement Experiment
        </h2>

        <p className="text-sm leading-relaxed text-[var(--color-app-text-muted)] max-w-3xl">
          Consider a qubit prepared in the state <MathHTMLContainer html="$|\psi\rangle = \sqrt{0.8}|0\rangle + \sqrt{0.2}|1\rangle$" />.
          Because <MathHTMLContainer html="$P(0) = 80\%$" /> and <MathHTMLContainer html="$P(1) = 20\%$" />, what do you expect to see after <strong className="text-white">20 shots</strong>?
        </p>

        <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-6 max-w-2xl">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-white">
              <span>Your Prediction for 0s: {predictionZero} shots</span>
              <span>Predicted 1s: {20 - predictionZero} shots</span>
            </div>
            <input
              type="range" min="0" max="20" step="1" value={predictionZero}
              onChange={(e) => setPredictionZero(parseInt(e.target.value, 10))}
              className="w-full h-2 rounded-lg appearance-none bg-white/10 accent-[var(--color-app-primary)] cursor-pointer"
            />
          </div>

          <button
            onClick={runPredictionExperiment}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md hover:brightness-110 active:scale-95 cursor-pointer"
          >
            ▶ Run 20-Shot Experiment
          </button>

          {predictionRunResult && (
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[var(--color-app-text-muted)]">Your Prediction:</div>
                  <div className="text-white font-bold text-sm">0: {predictionZero} | 1: {20 - predictionZero}</div>
                </div>
                <div>
                  <div className="text-[var(--color-app-text-muted)]">Actual Quantum Sampling:</div>
                  <div className="text-emerald-400 font-bold text-sm">0: {predictionRunResult[0]} | 1: {predictionRunResult[1]}</div>
                </div>
              </div>
              <p className="text-[11px] text-[var(--color-app-text-muted)] italic pt-2 border-t border-white/5">
                Notice that even though the theoretical expectation is 16 and 4, quantum sampling fluctuates around that distribution. The quantum state dictates probabilities, not an exact fixed script!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ─── SECTION 8: FROM STATE TO EXPERIMENT (CIRCUIT SIMULATOR BRIDGE) ─── */}
      <section className="rounded-3xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)] space-y-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            Section 8 • Experimentation Bridge
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">• Hands-On Quantum Simulator</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-app-text-main)]">
          From State to Experiment: Change the Qubit
        </h2>

        <p className="text-sm leading-relaxed text-[var(--color-app-text-muted)] max-w-3xl">
          Now that you know how a qubit state is formulated, what happens when we operate on it?
          Starting from <span className="font-mono text-white">|0⟩</span>, applying a Hadamard (<span className="font-mono text-cyan-300">H</span>) gate transforms the state into <span className="font-mono text-white">|+⟩</span>, which yields 50/50 measurement probabilities.
        </p>

        <div className="p-6 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">Try it yourself in the Quantum Circuit Simulator</h4>
            <p className="text-xs text-[var(--color-app-text-muted)] max-w-md leading-relaxed">
              We've pre-configured a single-qubit circuit with a Hadamard gate and measurement: <span className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded">|0⟩ ── H ── M</span>.
            </p>
          </div>

          <button
            onClick={handleLaunchSimulator}
            className="px-5 py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg hover:brightness-110 shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <span>🔬</span> Open in Circuit Simulator →
          </button>
        </div>
      </section>

      {/* ─── SECTION 9: SUMMARY & MILESTONE COMPLETION ─── */}
      <section className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-blue-950/40 via-indigo-950/20 to-purple-950/40 border border-blue-500/30 space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Milestone 3 Summary
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-1">
            What You've Mastered in Qubits & Quantum States
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-xs text-[var(--color-app-text-muted)]">
          <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-1">
            <strong className="text-white">1. Qubit State Formalism</strong>
            <p className="leading-relaxed">
              A qubit state is expressed as <MathHTMLContainer html="$|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$" /> in the computational basis.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-1">
            <strong className="text-white">2. Born's Rule</strong>
            <p className="leading-relaxed">
              Measurement probabilities equal squared magnitudes: <MathHTMLContainer html="$P(0) = |\alpha|^2$" /> and <MathHTMLContainer html="$P(1) = |\beta|^2$" />.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-1">
            <strong className="text-white">3. Strict Normalization</strong>
            <p className="leading-relaxed">
              All physical qubit states satisfy <MathHTMLContainer html="$|\alpha|^2 + |\beta|^2 = 1$" /> (conservation of total probability).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-1">
            <strong className="text-white">4. Probabilities ≠ The Whole State</strong>
            <p className="leading-relaxed">
              States like <MathHTMLContainer html="$|+\rangle$" /> and <MathHTMLContainer html="$|-\rangle$" /> produce the same probabilities in this basis, yet are physically distinct states governed by relative phase.
            </p>
          </div>
        </div>

        {/* Module 4 Forward Teaser */}
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200">
          <span className="font-bold">Next Milestone: Module 4 • Dirac Notation</span> — Learn the powerful bra-ket mathematical language used by quantum physicists and computer scientists worldwide.
        </div>

        {/* Completion Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-white/10">
          <div>
            <div className="text-sm font-bold text-white">Milestone 3 of 12 Complete!</div>
            <div className="text-xs text-[var(--color-app-text-muted)]">
              Advance your learning telemetry and update your personal progress.
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onAskQuantiva && (
              <button
                onClick={onAskQuantiva}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 transition-colors cursor-pointer"
              >
                Ask Quantiva a Question ✨
              </button>
            )}

            <button
              onClick={onComplete}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
              }}
            >
              {isCompleted ? "✓ Completed (Review Mode)" : "✓ Mark Module 3 Complete"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
