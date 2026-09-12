import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ComplexPlane from "../../../components/ComplexPlane/ComplexPlane";
import StateProbabilityHeatmap from "../../../components/StateProbabilityHeatmap/StateProbabilityHeatmap";
import MathHTMLContainer from "../../../components/MathHTMLContainer/MathHTMLContainer";

/**
 * Module 2: MATHEMATICAL FOUNDATIONS
 * Educational narrative:
 * 1. Why do we need new math? (|ψ⟩ = α|0⟩ + β|1⟩, normalization |α|² + |β|² = 1)
 * 2. The number line isn't enough (1D real numbers to 2D complex plane)
 * 3. Complex numbers & Complex Plane (z = a + bi, Re & Im axes, interactive dragging)
 * 4. Magnitude (|z| = √(a² + b²), Pythagorean distance)
 * 5. Phase (θ = arg(z), direction angle, undefined at origin, [0°, 360°) convention)
 * 6. Same magnitude, different phase (dual-vector interactive discovery)
 * 7. Connecting math back to the qubit (Qubit State Explorer, strict normalization |α|²+|β|²=1)
 * 8. Why not just use probabilities? (Physical meaning of relative phase, |+⟩ vs |-⟩)
 * 9. Summary & Milestone Completion
 */
export default function MathematicalFoundationsLesson({ onComplete, isCompleted, onAskQuantiva }) {
  // ─── Section 2: Real Number Line ─────────────────────────────
  const [realVal, setRealVal] = useState(1.5);
  const [show2DExpansion, setShow2DExpansion] = useState(false);
  const [rotationStep, setRotationStep] = useState(0); // 0=1, 1=i, 2=-1, 3=-i

  const rotationStates = [
    {
      step: 0,
      label: "1",
      complexStr: "1 + 0i",
      deg: 0,
      r: 1,
      i: 0,
      formula: "1 \\text{ (Start on Real line)}",
      desc: "Starting point: z = 1 on the Real axis. There is no vertical movement (imaginary part = 0).",
    },
    {
      step: 1,
      label: "i",
      complexStr: "0 + 1i",
      deg: 90,
      r: 0,
      i: 1,
      formula: "1 \\times i = i",
      desc: "Multiplying by i rotates the vector by +90° counter-clockwise into the new vertical dimension! This point is completely off the real line.",
    },
    {
      step: 2,
      label: "-1",
      complexStr: "-1 + 0i",
      deg: 180,
      r: -1,
      i: 0,
      formula: "i \\times i = i^2 = -1",
      desc: "Multiplying by i again rotates another +90° (total 180°). Notice we land back on the Real axis at -1! This geometrically explains why i² = -1.",
    },
    {
      step: 3,
      label: "-i",
      complexStr: "0 - 1i",
      deg: 270,
      r: 0,
      i: -1,
      formula: "-1 \\times i = -i",
      desc: "Multiplying by i a third time rotates another +90° (total 270°), pointing straight down along the negative imaginary axis.",
    },
  ];
  const currentRotation = rotationStates[((rotationStep % 4) + 4) % 4];

  // ─── Section 3: Primary Complex Plane ────────────────────────
  const [zVal, setZVal] = useState({ r: 1.0, i: 1.0 });
  const [zStats, setZStats] = useState({
    magnitude: 1.414,
    phaseDeg: 45.0,
    isAtOrigin: false,
  });

  const handleComplexChange = (data) => {
    setZVal({ r: data.r, i: data.i });
    setZStats({
      magnitude: data.magnitude,
      phaseDeg: data.phaseDeg,
      isAtOrigin: data.isAtOrigin,
    });
  };

  // ─── Section 4: Pythagorean Magnitude Explorer ───────────────
  const [magZ, setMagZ] = useState({ r: 1.2, i: 0.9 });
  const magHypotenuse = Math.sqrt(magZ.r * magZ.r + magZ.i * magZ.i);

  // ─── Section 5: Phase Rotation Explorer ──────────────────────
  const [phaseAngleDeg, setPhaseAngleDeg] = useState(60);
  const phaseRad = (phaseAngleDeg * Math.PI) / 180;
  const phaseUnitVector = {
    r: Math.round(Math.cos(phaseRad) * 100) / 100,
    i: Math.round(Math.sin(phaseRad) * 100) / 100,
  };

  // ─── Section 6: Dual Vector Comparison (Same Mag, Diff Phase) ─
  const [comparePhaseDeg, setComparePhaseDeg] = useState(90);
  const compareRad = (comparePhaseDeg * Math.PI) / 180;
  const vectorB = {
    r: Math.round(Math.cos(compareRad) * 100) / 100,
    i: Math.round(Math.sin(compareRad) * 100) / 100,
  };

  // ─── Section 7: Qubit Complex Amplitude Explorer ─────────────
  // Controlled via theta in [0, pi] and relative phase phi in [0, 2pi].
  // Guaranteed normalization: |alpha|^2 + |beta|^2 = 1.0 at all times.
  const [qubitTheta, setQubitTheta] = useState(Math.PI / 2); // default equal superposition
  const [qubitPhiDeg, setQubitPhiDeg] = useState(0); // relative phase in degrees

  const { alphaVal, betaVal, prob0, prob1, formattedAlpha, formattedBeta } = useMemo(() => {
    const half = qubitTheta / 2;
    const aMag = Math.cos(half);
    const bMag = Math.sin(half);
    const phiRad = (qubitPhiDeg * Math.PI) / 180;

    // alpha is real: cos(theta/2)
    const aReal = aMag;
    const aImag = 0;

    // beta is complex: sin(theta/2) * (cos(phi) + i*sin(phi))
    const bReal = bMag * Math.cos(phiRad);
    const bImag = bMag * Math.sin(phiRad);

    // Strict normalization check
    const p0Raw = aReal * aReal + aImag * aImag;
    const p1Raw = bReal * bReal + bImag * bImag;
    const norm = p0Raw + p1Raw;

    // Normalized probabilities
    const p0 = Math.round((p0Raw / norm) * 1000) / 1000;
    const p1 = Math.round((1 - p0) * 1000) / 1000;

    const fmtA = `${aReal.toFixed(2)}`;
    const fmtB =
      Math.abs(bImag) < 0.001
        ? `${bReal.toFixed(2)}`
        : `${bReal.toFixed(2)} ${bImag >= 0 ? "+" : "-"} ${Math.abs(bImag).toFixed(2)}i`;

    return {
      alphaVal: { r: aReal, i: aImag, mag: aMag },
      betaVal: { r: bReal, i: bImag, mag: bMag },
      prob0: p0,
      prob1: p1,
      formattedAlpha: fmtA,
      formattedBeta: fmtB,
    };
  }, [qubitTheta, qubitPhiDeg]);

  // ─── Section 8: |+⟩ vs |-⟩ Phase Mystery ─────────────────────
  const [mysteryState, setMysteryState] = useState("plus"); // "plus" | "minus"

  return (
    <div className="space-y-12">
      {/* ─── SECTION 1: WHY DO WE NEED NEW MATH? ─── */}
      <section className="rounded-3xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)] relative overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
            Section 1 • The Guiding Question
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">• Beyond classical numbers</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-app-text-main)] mb-3">
          "If a qubit isn't simply 0 or 1, how do we describe its state?"
        </h2>
        <p className="text-sm text-[var(--color-app-text-muted)] leading-relaxed max-w-3xl mb-6">
          In Module 1, we learned that a qubit is represented by a quantum state:
          <span className="inline-block mx-2 font-mono text-white bg-white/10 px-2 py-0.5 rounded">
            |ψ⟩ = α|0⟩ + β|1⟩
          </span>
          where the measurement probabilities are determined by the square of these numbers:
          <span className="inline-block mx-2 font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded">
            P(0) = |α|²
          </span>
          and
          <span className="inline-block mx-2 font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded">
            P(1) = |β|²
          </span>.
        </p>

        {/* The Normalization Rule Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/30 to-indigo-950/30 border border-blue-500/30 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-1">
                Universal Quantum Rule: Normalization
              </div>
              <div className="text-xl sm:text-2xl font-mono font-bold text-white">
                <MathHTMLContainer html="$|\alpha|^2 + |\beta|^2 = 1$" />
              </div>
              <p className="text-xs text-[var(--color-app-text-muted)] mt-1 max-w-xl">
                Because measuring a qubit will always yield either 0 or 1, the total probability of all possible outcomes must always add up to 100% (1.0).
              </p>
            </div>

            <div className="px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-200 text-xs font-mono shrink-0 text-center">
              P(0) + P(1) = 1.0 (100%)
            </div>
          </div>
        </div>

        {/* Conceptual Transition Chain */}
        <div className="p-4 rounded-xl bg-black/30 border border-white/10 text-xs text-[var(--color-app-text-muted)] leading-relaxed">
          <strong className="text-white">The big question:</strong> What kind of numbers are <MathHTMLContainer html="$\alpha$" /> and <MathHTMLContainer html="$\beta$" />? As you will discover, ordinary real numbers on a single number line cannot capture the full physical reality of quantum states. We need a two-dimensional number: <strong>a complex number</strong>.
        </div>
      </section>

      {/* ─── SECTION 2: THE NUMBER LINE ISN'T ENOUGH ─── */}
      <section className="rounded-3xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
            Section 2 • 1D to 2D
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">• The real number line</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-app-text-main)] mb-2">
          The Number Line Isn't Enough
        </h2>
        <p className="text-sm text-[var(--color-app-text-muted)] leading-relaxed max-w-3xl mb-6">
          Every ordinary real number can be placed somewhere along a single one-dimensional line. Drag the slider to position a real number on this axis:
        </p>

        {/* 1D Number Line Interactive Slider */}
        <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-6">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--color-app-text-muted)]">Real Number (x):</span>
            <span className="text-lg font-bold text-sky-400">
              {realVal >= 0 ? `+${realVal.toFixed(2)}` : realVal.toFixed(2)}
            </span>
          </div>

          {/* Line Graphic - Fluid, continuous, pixel-perfect alignment with 0 jitter */}
          <div className="relative py-6 px-4">
            <div className="h-1.5 bg-zinc-800 rounded-full relative">
              {/* Ticks */}
              {[-2, -1, 0, 1, 2].map((t) => {
                const tickPct = ((t + 2) / 4) * 100;
                return (
                  <div
                    key={t}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none select-none"
                    style={{ left: `${tickPct}%` }}
                  >
                    <div className={`w-0.5 ${t === 0 ? "h-4 bg-sky-400" : "h-3 bg-zinc-600"}`} />
                    <span
                      className={`text-[11px] font-mono mt-2 font-semibold ${
                        t === 0 ? "text-sky-300" : "text-zinc-400"
                      }`}
                    >
                      {t}
                    </span>
                  </div>
                );
              })}

              {/* Slider Thumb Point - Smooth and perfectly aligned with zero transition lag */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-sky-400 border-2 border-white shadow-[0_0_15px_rgba(56,189,248,0.9)] flex items-center justify-center pointer-events-none select-none"
                style={{ left: `${((realVal + 2) / 4) * 100}%` }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-950" />
              </div>
            </div>

            {/* Native range input overlay with exact matching bounds */}
            <input
              type="range"
              min="-2"
              max="2"
              step="0.01"
              value={realVal}
              onChange={(e) => setRealVal(parseFloat(e.target.value))}
              className="w-full opacity-0 absolute inset-0 cursor-pointer h-full select-none"
              style={{ touchAction: "none" }}
            />
          </div>

          {/* Quick Presets for 1D Line */}
          <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs">
            <span className="text-[11px] text-zinc-500 font-mono">Quick Positions:</span>
            <div className="flex gap-1.5">
              {[-2, -1, 0, 1, 2].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRealVal(val)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-colors cursor-pointer ${
                    Math.abs(realVal - val) < 0.05
                      ? "bg-sky-500/20 border-sky-400 text-sky-300 font-bold"
                      : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                  }`}
                >
                  {val > 0 ? `+${val}` : val}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Dimension Unlock Header & Trigger */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-[var(--color-app-text-muted)]">
              Real numbers can only move left or right. But what if we need an <strong>independent second direction</strong>?
            </div>
            <button
              type="button"
              onClick={() => setShow2DExpansion(!show2DExpansion)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg transition-all cursor-pointer shrink-0 flex items-center gap-2"
            >
              <span>{show2DExpansion ? "Collapse 2D Expansion ✕" : "Unlock the Second Dimension ↗"}</span>
            </button>
          </div>

          {/* Interactive 2D Unfolding Experience */}
          {show2DExpansion && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-6 rounded-2xl bg-gradient-to-b from-purple-950/40 to-black/60 border border-purple-500/30 space-y-6"
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300">
                <span>✨ Unlocking 2D: The Imaginary Axis (Im)</span>
              </div>

              <div className="grid md:grid-cols-2 gap-6 items-center">
                {/* 2D Unfolded Argand Preview SVG */}
                <div className="flex flex-col items-center p-3 rounded-xl bg-black/60 border border-white/10 select-none">
                  <svg
                    viewBox="0 0 260 260"
                    className="w-64 h-64 select-none touch-none"
                    style={{ pointerEvents: "none" }}
                  >
                    {/* Unit Circle Guide */}
                    <circle
                      cx="130"
                      cy="130"
                      r="80"
                      fill="none"
                      stroke="rgba(168, 85, 247, 0.25)"
                      strokeDasharray="3,3"
                      strokeWidth="1.5"
                    />

                    {/* Horizontal Real Axis (Re) */}
                    <line x1="20" y1="130" x2="240" y2="130" stroke="rgba(96, 165, 250, 0.7)" strokeWidth="2" />
                    <polygon points="244,130 236,126 236,134" fill="#60a5fa" />
                    <text x="245" y="145" fill="#60a5fa" fontSize="11" fontWeight="bold" fontFamily="monospace">
                      Re
                    </text>

                    {/* Vertical Imaginary Axis (Im) - blooming into existence */}
                    <line x1="130" y1="240" x2="130" y2="20" stroke="rgba(192, 132, 252, 0.9)" strokeWidth="2.5" />
                    <polygon points="130,16 126,24 134,24" fill="#c084fc" />
                    <text x="138" y="24" fill="#c084fc" fontSize="11" fontWeight="bold" fontFamily="monospace">
                      Im
                    </text>

                    {/* Axis Ticks & Labels */}
                    <line x1="210" y1="126" x2="210" y2="134" stroke="#60a5fa" strokeWidth="2" />
                    <text x="210" y="148" fill="#93c5fd" fontSize="10" textAnchor="middle" fontFamily="monospace">
                      +1
                    </text>

                    <line x1="50" y1="126" x2="50" y2="134" stroke="#60a5fa" strokeWidth="2" />
                    <text x="50" y="148" fill="#93c5fd" fontSize="10" textAnchor="middle" fontFamily="monospace">
                      -1
                    </text>

                    <line x1="126" y1="50" x2="134" y2="50" stroke="#c084fc" strokeWidth="2" />
                    <text x="120" y="54" fill="#e9d5ff" fontSize="10" textAnchor="end" fontFamily="monospace">
                      +i
                    </text>

                    <line x1="126" y1="210" x2="134" y2="210" stroke="#c084fc" strokeWidth="2" />
                    <text x="120" y="214" fill="#e9d5ff" fontSize="10" textAnchor="end" fontFamily="monospace">
                      -i
                    </text>

                    {/* Rotation Angle Arc */}
                    {currentRotation.deg > 0 && (
                      <path
                        d={`M 160 130 A 30 30 0 ${currentRotation.deg > 180 ? 1 : 0} 0 ${
                          130 + 30 * Math.cos((-currentRotation.deg * Math.PI) / 180)
                        } ${130 + 30 * Math.sin((-currentRotation.deg * Math.PI) / 180)}`}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        strokeDasharray="2,2"
                      />
                    )}

                    {/* Rotating Vector Arrow */}
                    <line
                      x1="130"
                      y1="130"
                      x2={130 + currentRotation.r * 80}
                      y2={130 - currentRotation.i * 80}
                      stroke="#c084fc"
                      strokeWidth="3"
                    />

                    {/* Vector Tip Point */}
                    <circle
                      cx={130 + currentRotation.r * 80}
                      cy={130 - currentRotation.i * 80}
                      r="7"
                      fill="#a855f7"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  </svg>
                  <span className="text-[10px] text-zinc-400 font-mono mt-1">
                    Angle: <strong className="text-amber-400">{currentRotation.deg}°</strong> | Value:{" "}
                    <strong className="text-purple-300">{currentRotation.label}</strong>
                  </span>
                </div>

                {/* Mathematical Insight & Interactive Controls */}
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-black/40 border border-purple-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">
                        Euler's Geometric Insight
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-200">
                        Step {currentRotation.step + 1} of 4
                      </span>
                    </div>

                    <div className="text-lg font-mono font-bold text-white pt-1">
                      <MathHTMLContainer html={`$${currentRotation.formula}$`} />
                    </div>

                    <p className="text-[var(--color-app-text-muted)] text-xs leading-relaxed">
                      {currentRotation.desc}
                    </p>
                  </div>

                  {/* Interactive Rotation Step Controls */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-semibold text-zinc-300">
                      Step Through Multiplications by i:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setRotationStep((prev) => (prev + 1) % 4)}
                        className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow cursor-pointer transition-colors flex items-center gap-1.5"
                      >
                        <span>Multiply by i (Rotate +90°) ↻</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRotationStep((prev) => (prev - 1 + 4) % 4)}
                        className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 font-semibold text-xs cursor-pointer transition-colors"
                      >
                        Rotate Back (-90°) ↺
                      </button>
                      <button
                        type="button"
                        onClick={() => setRotationStep(0)}
                        className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs cursor-pointer transition-colors"
                      >
                        Reset to 1
                      </button>
                    </div>
                  </div>

                  {/* Quantum Link Callout */}
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-[11px] text-purple-200 leading-relaxed">
                    💡 <strong>Why Quantum Computers Need This:</strong> A qubit's probability amplitudes <MathHTMLContainer html="$\\alpha$" /> and <MathHTMLContainer html="$\\beta$" /> are points in this 2D complex plane. Their rotations create the constructive and destructive interference that powers quantum algorithms!
                  </div>

                  {/* Smooth Scroll Action */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => document.getElementById("section-3")?.scrollIntoView({ behavior: "smooth" })}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300 transition-colors cursor-pointer text-center"
                    >
                      Now Explore Any Point on the Complex Plane in Section 3 ↓
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── SECTION 3: THE COMPLEX PLANE ─── */}
      <section id="section-3" className="rounded-3xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
            Section 3 • The Complex Plane
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">• z = a + bi</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-app-text-main)] mb-2">
          Mapping Numbers to Points: The Complex Plane
        </h2>
        <p className="text-sm text-[var(--color-app-text-muted)] leading-relaxed max-w-3xl mb-6">
          A complex number <MathHTMLContainer html="$z = a + bi$" /> combines two components: a <strong>real part</strong> (<MathHTMLContainer html="$a$" />) on the horizontal axis and an <strong>imaginary part</strong> (<MathHTMLContainer html="$b$" />) on the vertical axis.
        </p>

        {/* Reusable Complex Plane Component */}
        <div className="p-6 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center">
          <ComplexPlane
            value={zVal}
            onChange={handleComplexChange}
            showComponents={true}
            showPresets={true}
          />

          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-[var(--color-app-text-muted)] max-w-xl text-center leading-relaxed">
            <strong className="text-white">Interactive Discovery:</strong> Click or drag anywhere on the grid above. Moving horizontally alters only the real part <MathHTMLContainer html="$a$" />; moving vertically alters only the imaginary part <MathHTMLContainer html="$bi$" />.
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: MAGNITUDE (PYTHAGOREAN DISTANCE) ─── */}
      <section className="rounded-3xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Section 4 • Geometry
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">• Magnitude |z|</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-app-text-main)] mb-2">
          Magnitude: How Far is the Number from the Origin?
        </h2>
        <p className="text-sm text-[var(--color-app-text-muted)] leading-relaxed max-w-3xl mb-6">
          The <strong>magnitude</strong> (or absolute value) <MathHTMLContainer html="$|z|$" /> is simply the straight-line Euclidean distance from the origin <span className="font-mono text-white">(0, 0)</span> to the point. Notice how the horizontal real distance <MathHTMLContainer html="$a$" /> and vertical imaginary distance <MathHTMLContainer html="$b$" /> form a right triangle!
        </p>

        <div className="grid md:grid-cols-2 gap-6 items-center p-6 rounded-2xl bg-black/40 border border-white/10">
          <ComplexPlane
            value={magZ}
            onChange={(d) => setMagZ({ r: d.r, i: d.i })}
            showTriangle={true}
            showComponents={true}
            showPresets={false}
          />

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
              <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                The Pythagorean Theorem in the Complex Plane
              </div>
              <div className="text-xl font-mono text-white">
                <MathHTMLContainer html="$|z| = \sqrt{a^2 + b^2}$" />
              </div>
              <p className="text-[var(--color-app-text-muted)] leading-relaxed">
                Just like finding the hypotenuse of a right-angled triangle with sides <MathHTMLContainer html="$a$" /> and <MathHTMLContainer html="$b$" />, the magnitude is always positive and represents the length of the vector.
              </p>
            </div>

            {/* Live Calculation Step-by-Step */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 font-mono space-y-2 text-[11px]">
              <div className="text-[var(--color-app-text-muted)] uppercase tracking-wider font-bold">
                Live Calculation:
              </div>
              <div className="text-zinc-300">
                a = {magZ.r.toFixed(2)}, b = {magZ.i.toFixed(2)}
              </div>
              <div className="text-zinc-300">
                a² = {(magZ.r * magZ.r).toFixed(3)}, b² = {(magZ.i * magZ.i).toFixed(3)}
              </div>
              <div className="text-emerald-300 font-bold text-xs pt-1 border-t border-white/10">
                |z| = √({(magZ.r * magZ.r).toFixed(3)} + {(magZ.i * magZ.i).toFixed(3)}) = {magHypotenuse.toFixed(3)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: PHASE (DIRECTION ANGLE) ─── */}
      <section className="rounded-3xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Section 5 • Direction
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">• Phase θ = arg(z)</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-app-text-main)] mb-2">
          Phase: Which Direction Does the Vector Point?
        </h2>
        <p className="text-sm text-[var(--color-app-text-muted)] leading-relaxed max-w-3xl mb-6">
          While magnitude tells us <em>how far</em>, the <strong>phase</strong> <MathHTMLContainer html="$\theta = \text{arg}(z)$" /> tells us <em>which direction</em> the complex number points, measured counter-clockwise from the positive real axis.
        </p>

        <div className="grid md:grid-cols-2 gap-6 items-center p-6 rounded-2xl bg-black/40 border border-white/10">
          <ComplexPlane
            value={phaseUnitVector}
            onChange={(d) => {
              if (d.phaseDeg !== null) setPhaseAngleDeg(Math.round(d.phaseDeg));
            }}
            showComponents={true}
            showPresets={false}
          />

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Magnitude vs Phase Summary
              </div>
              <div className="grid grid-cols-2 gap-2 text-center pt-1 font-mono">
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/10">
                  <div className="text-[10px] text-zinc-400 uppercase">Magnitude</div>
                  <div className="text-base font-bold text-white">|z| = 1.00</div>
                  <div className="text-[10px] text-zinc-400">"How far"</div>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="text-[10px] text-amber-300 uppercase">Phase (θ)</div>
                  <div className="text-base font-bold text-amber-400">{phaseAngleDeg}°</div>
                  <div className="text-[10px] text-amber-300/80">"Which direction"</div>
                </div>
              </div>
            </div>

            {/* Interactive Rotation Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--color-app-text-muted)]">Rotate Phase Angle:</span>
                <span className="font-bold text-amber-400">{phaseAngleDeg}° ({((phaseAngleDeg * Math.PI) / 180).toFixed(2)} rad)</span>
              </div>
              <input
                type="range"
                min="0"
                max="359"
                step="1"
                value={phaseAngleDeg}
                onChange={(e) => setPhaseAngleDeg(parseInt(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-zinc-700 rounded-lg appearance-none"
              />
            </div>

            {/* Quick Cardinal Direction Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                onClick={() => setPhaseAngleDeg(0)}
                className="px-2.5 py-1 text-[11px] font-mono rounded-lg border border-white/10 bg-white/5 hover:bg-white/15 text-white"
              >
                0° (+Re)
              </button>
              <button
                onClick={() => setPhaseAngleDeg(90)}
                className="px-2.5 py-1 text-[11px] font-mono rounded-lg border border-white/10 bg-white/5 hover:bg-white/15 text-white"
              >
                90° (+Im, i)
              </button>
              <button
                onClick={() => setPhaseAngleDeg(180)}
                className="px-2.5 py-1 text-[11px] font-mono rounded-lg border border-white/10 bg-white/5 hover:bg-white/15 text-white"
              >
                180° (-Re, -1)
              </button>
              <button
                onClick={() => setPhaseAngleDeg(270)}
                className="px-2.5 py-1 text-[11px] font-mono rounded-lg border border-white/10 bg-white/5 hover:bg-white/15 text-white"
              >
                270° (-Im, -i)
              </button>
            </div>

            {/* Phase at Origin Scientific Rule */}
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 leading-relaxed">
              ℹ️ <strong>At the origin (z = 0):</strong> The distance is zero, so direction is mathematically <em>undefined</em>. The phase is only meaningful when a vector has non-zero length!
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: SAME MAGNITUDE, DIFFERENT PHASE ─── */}
      <section className="rounded-3xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-pink-400 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
            Section 6 • Key Discovery
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">• Crucial quantum property</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-app-text-main)] mb-2">
          Same Magnitude, Different Phase
        </h2>
        <p className="text-sm text-[var(--color-app-text-muted)] leading-relaxed max-w-3xl mb-6">
          Compare two complex numbers on the unit circle. Both have exactly the same magnitude (<MathHTMLContainer html="$|z| = 1$" />), but Vector B can be rotated to point in completely different directions:
        </p>

        <div className="grid md:grid-cols-2 gap-6 items-center p-6 rounded-2xl bg-black/40 border border-white/10">
          <ComplexPlane
            value={vectorB}
            secondaryVector={{ r: 1.0, i: 0.0, label: "Vector A (0°)", color: "#10b981" }}
            onChange={(d) => {
              if (d.phaseDeg !== null) setComparePhaseDeg(Math.round(d.phaseDeg));
            }}
            showComponents={true}
            showPresets={false}
          />

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-pink-950/20 border border-pink-500/30 space-y-3">
              <div className="text-xs font-bold text-pink-300 uppercase tracking-wider">
                Comparing Vector A & Vector B
              </div>

              <div className="space-y-2 font-mono">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex justify-between">
                  <span className="text-emerald-300 font-bold">Vector A:</span>
                  <span className="text-white">|z| = 1.000, Phase = 0.0° (1 + 0i)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-pink-500/10 border border-pink-500/30 flex justify-between">
                  <span className="text-pink-300 font-bold">Vector B:</span>
                  <span className="text-white">|z| = 1.000, Phase = {comparePhaseDeg.toFixed(1)}°</span>
                </div>
              </div>

              <div className="text-xs text-[var(--color-app-text-muted)] leading-relaxed pt-1">
                Both vectors have identical lengths of 1.000. Yet they are clearly distinct mathematical objects pointing in different directions!
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--color-app-text-muted)]">Rotate Vector B:</span>
                <span className="font-bold text-pink-400">{comparePhaseDeg}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="359"
                step="1"
                value={comparePhaseDeg}
                onChange={(e) => setComparePhaseDeg(parseInt(e.target.value))}
                className="w-full accent-pink-400 cursor-pointer h-2 bg-zinc-700 rounded-lg appearance-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 7: CONNECT MATH BACK TO THE QUBIT ─── */}
      <section className="rounded-3xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Section 7 • The Payoff
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">• Complex amplitudes in action</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-app-text-main)] mb-2">
          Connecting Math Back to the Qubit
        </h2>
        <p className="text-sm text-[var(--color-app-text-muted)] leading-relaxed max-w-3xl mb-6">
          Now we can answer our central question: the probability amplitudes <MathHTMLContainer html="$\alpha$" /> and <MathHTMLContainer html="$\beta$" /> in <MathHTMLContainer html="$|\psi\rangle = \alpha|0\rangle + \beta|1\rangle$" /> are <strong>complex numbers (<MathHTMLContainer html="$\alpha, \beta \in \mathbb{C}$" />)</strong>!
        </p>

        {/* Amplitude to Probability Flow */}
        <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-1.5">
              <span className="text-blue-300 text-[10px] uppercase font-bold">Basis State |0⟩ Amplitude (α)</span>
              <div className="text-lg font-bold text-white">α = {formattedAlpha}</div>
              <div className="text-zinc-400">Magnitude: |α| = {alphaVal.mag.toFixed(3)}</div>
              <div className="text-blue-300 font-bold pt-1 border-t border-white/10">
                P(0) = |α|² = {(prob0 * 100).toFixed(1)}%
              </div>
            </div>

            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-1.5">
              <span className="text-purple-300 text-[10px] uppercase font-bold">Basis State |1⟩ Amplitude (β)</span>
              <div className="text-lg font-bold text-white">β = {formattedBeta}</div>
              <div className="text-zinc-400">Magnitude: |β| = {betaVal.mag.toFixed(3)}</div>
              <div className="text-purple-300 font-bold pt-1 border-t border-white/10">
                P(1) = |β|² = {(prob1 * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Normalization Guarantee Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 font-mono">
            <span>Total Probability: |α|² + |β|²</span>
            <span className="font-bold">{(prob0 + prob1).toFixed(3)} = 100.0% ✓ (Strict Normalization)</span>
          </div>

          {/* Controls: Weight & Relative Phase */}
          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--color-app-text-muted)]">State Weight Balance:</span>
                <span className="text-white font-bold">{((1 - qubitTheta / Math.PI) * 100).toFixed(0)}% |0⟩</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.PI}
                step="0.02"
                value={qubitTheta}
                onChange={(e) => setQubitTheta(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer h-2 bg-zinc-700 rounded-lg appearance-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[var(--color-app-text-muted)]">Relative Phase (φ):</span>
                <span className="text-amber-400 font-bold">{qubitPhiDeg}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="359"
                step="5"
                value={qubitPhiDeg}
                onChange={(e) => setQubitPhiDeg(parseInt(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer h-2 bg-zinc-700 rounded-lg appearance-none"
              />
            </div>
          </div>

          {/* Reused StateProbabilityHeatmap */}
          <div className="pt-2">
            <StateProbabilityHeatmap
              probabilities={{
                "0": prob0,
                "1": prob1,
              }}
            />
          </div>
        </div>
      </section>

      {/* ─── SECTION 8: WHY NOT JUST USE PROBABILITIES? ─── */}
      <section className="rounded-3xl p-6 sm:p-8 app-glass border border-[var(--color-app-border)]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Section 8 • The Phase Mystery
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">• Why probabilities aren't enough</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-app-text-main)] mb-2">
          "If probabilities tell us what we measure, why do we need amplitudes?"
        </h2>
        <p className="text-sm text-[var(--color-app-text-muted)] leading-relaxed max-w-3xl mb-6">
          If measurement only ever sees probabilities <MathHTMLContainer html="$P(0)$" /> and <MathHTMLContainer html="$P(1)$" />, why does quantum mechanics carry complex amplitudes with phase angles?
        </p>

        {/* State Comparison: |+⟩ vs |-⟩ */}
        <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs text-[var(--color-app-text-muted)] font-semibold">Compare two famous quantum states:</span>
            <div className="flex items-center gap-2 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold">
              <button
                onClick={() => setMysteryState("plus")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  mysteryState === "plus" ? "bg-cyan-600 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                State |+⟩ (In Phase)
              </button>
              <button
                onClick={() => setMysteryState("minus")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  mysteryState === "minus" ? "bg-purple-600 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                State |-⟩ (Opposite Phase)
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="text-[10px] uppercase font-bold text-zinc-400">Mathematical Expression</div>
              <div className="text-base text-white font-bold">
                {mysteryState === "plus" ? (
                  <MathHTMLContainer html="$|+\rangle = \frac{1}{\sqrt{2}}|0\rangle + \frac{1}{\sqrt{2}}|1\rangle$" />
                ) : (
                  <MathHTMLContainer html="$|-\rangle = \frac{1}{\sqrt{2}}|0\rangle - \frac{1}{\sqrt{2}}|1\rangle$" />
                )}
              </div>
              <div className="text-zinc-400 text-[11px]">
                Relative Phase: <strong className="text-amber-300">{mysteryState === "plus" ? "0° (0 rad)" : "180° (π rad)"}</strong>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="text-[10px] uppercase font-bold text-zinc-400">Computational Measurement Probabilities</div>
              <div className="flex items-center justify-between text-base font-bold text-sky-400">
                <span>P(0) = 50.0%</span>
                <span>P(1) = 50.0%</span>
              </div>
              <div className="text-zinc-400 text-[11px]">
                Both states produce <em>identical</em> 50/50 measurement probabilities in this basis!
              </div>
            </div>
          </div>

          {/* Scientific Wording Explanation */}
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-200 leading-relaxed space-y-2">
            <div>
              💡 <strong>The Relative Phase is Physically Meaningful:</strong> Even though the phase difference between <span className="font-mono text-white">|+⟩</span> and <span className="font-mono text-white">|-⟩</span> is not directly visible when reading 0 or 1 in the computational basis, it is deeply physical!
            </div>
            <div className="text-indigo-200/80">
              When quantum operations (gates) act on these states in subsequent steps, the phase determines whether quantum amplitudes <strong>interfere constructively or destructively</strong>. Same immediate measurement probabilities does <em>not</em> mean identical quantum states!
            </div>
            <div className="text-amber-300 font-semibold pt-1">
              🔮 Teaser: In Module 5 (Amplitudes & Phase), we will put this exact relative phase into action to perform quantum interference!
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 9: SUMMARY & MILESTONE COMPLETION ─── */}
      <section className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-purple-950/40 via-indigo-950/20 to-blue-950/40 border border-purple-500/30">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Milestone 2 Complete
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">• Core mathematical takeaways</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-app-text-main)] mb-3">
          What You Mastered in "Mathematical Foundations"
        </h2>

        <div className="grid sm:grid-cols-2 gap-4 text-xs text-[var(--color-app-text-muted)] mb-8">
          <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-1">
            <strong className="text-white">1. Complex Numbers on the Argand Plane</strong>
            <p className="leading-relaxed">
              <MathHTMLContainer html="$z = a + bi$" /> maps horizontal real part <MathHTMLContainer html="$a$" /> and vertical imaginary part <MathHTMLContainer html="$b$" /> into a 2D plane.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-1">
            <strong className="text-white">2. Magnitude vs Phase</strong>
            <p className="leading-relaxed">
              Magnitude <MathHTMLContainer html="$|z| = \sqrt{a^2 + b^2}$" /> represents distance from origin; phase <MathHTMLContainer html="$\theta = \text{arg}(z)$" /> represents direction angle.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-1">
            <strong className="text-white">3. Quantum Amplitudes are Complex</strong>
            <p className="leading-relaxed">
              A qubit state has complex amplitudes <MathHTMLContainer html="$\alpha, \beta \in \mathbb{C}$" />. Measurement probability equals squared magnitude: <MathHTMLContainer html="$P = |\text{amplitude}|^2$" />.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-black/30 border border-white/10 space-y-1">
            <strong className="text-white">4. Phase is Physically Meaningful</strong>
            <p className="leading-relaxed">
              States can share the same computational measurement probabilities while possessing distinct relative phases that govern subsequent quantum operations.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-white/10">
          <div>
            <div className="text-sm font-bold text-white">Ready for the next milestone?</div>
            <div className="text-xs text-[var(--color-app-text-muted)]">
              Module 3 will build directly on these mathematical foundations to explore Qubits & Quantum States in depth.
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
              {isCompleted ? "✓ Completed (Review Mode)" : "✓ Mark Module 2 Complete"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
