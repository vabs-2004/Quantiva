import React, { useState, useMemo } from "react";

/**
 * Formats a complex amplitude into a clean Dirac component string.
 */
function formatAmplitude(real, imag) {
  const r = Math.abs(real) > 1e-4 ? real : 0;
  const i = Math.abs(imag) > 1e-4 ? imag : 0;

  if (r === 0 && i === 0) return "0";
  if (i === 0) return `${r.toFixed(3)}`;
  if (r === 0) return `${i > 0 ? "" : "-"}${Math.abs(i) === 1 ? "" : Math.abs(i).toFixed(3)}i`;

  const sign = i > 0 ? "+" : "-";
  return `(${r.toFixed(3)} ${sign} ${Math.abs(i).toFixed(3)}i)`;
}

/**
 * Generates Dirac ket notation |ψ⟩ = c0|00⟩ + c1|11⟩ for dominant states.
 */
function getDiracNotation(amplitudes = [], threshold = 0.001) {
  if (!amplitudes || amplitudes.length === 0) return "|ψ⟩ = |0...0⟩";

  const nonZero = amplitudes.filter((a) => a.probability >= threshold);
  if (nonZero.length === 0) return "|ψ⟩ = 0";

  const parts = nonZero.map((a) => {
    const ampStr = formatAmplitude(a.real, a.imag);
    const prefix = ampStr === "1" ? "" : ampStr === "-1" ? "-" : `${ampStr} `;
    return `${prefix}|${a.basis}⟩`;
  });

  return `|ψ⟩ = ${parts.join(" + ").replace(/\+ -/g, "- ")}`;
}

export default function QuantumStateInspector({ step, numQubits }) {
  const [showAmplitudesTable, setShowAmplitudesTable] = useState(false);

  const diracStr = useMemo(() => {
    return getDiracNotation(step?.amplitudes, 0.001);
  }, [step]);

  if (!step) return null;

  const appliedGate = step.appliedGate;
  const isMeasurement = step.isMeasurement;
  const outcome = step.measurementOutcome;
  const blochVectors = step.blochVectors || [];

  return (
    <div className="flex flex-col gap-4 p-5 rounded-xl app-glass border border-[var(--color-app-border)]">
      {/* Header / Gate Event Summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-app-border)] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-app-text-muted)]">
            Active Event:
          </span>
          {appliedGate ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--color-app-surface)] border border-[var(--color-app-primary)]/40 text-xs font-mono font-bold text-[var(--color-app-text-main)]">
              <span className="text-[var(--color-app-accent)]">{appliedGate.type}</span>
              <span className="text-[var(--color-app-text-muted)]">wire</span>
              <span>q[{appliedGate.wire}]</span>
              {appliedGate.target !== null && appliedGate.target !== undefined && (
                <>
                  <span className="text-[var(--color-app-text-muted)]">→</span>
                  <span>q[{appliedGate.target}]</span>
                </>
              )}
            </span>
          ) : (
            <span className="text-xs font-mono text-[var(--color-app-text-muted)] italic">
              Initial Ground State |0...0⟩
            </span>
          )}
        </div>

        {/* Measurement Banner */}
        {isMeasurement && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold animate-pulse">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Measurement Collapse: |{outcome}⟩</span>
          </div>
        )}
      </div>

      {/* Dirac Notation Box */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-app-text-muted)] mb-1">
          State Vector (Dirac Notation)
        </div>
        <div className="p-3 rounded-lg bg-black/40 border border-[var(--color-app-border)] font-mono text-sm font-semibold text-[var(--color-app-primary)] overflow-x-auto whitespace-nowrap custom-scrollbar">
          {diracStr}
        </div>
      </div>

      {/* Per-Qubit Observables (Purity & Entanglement) */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-app-text-muted)] mb-2">
          Subsystem Entanglement & Reduced State Purity
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {blochVectors.map((bv) => (
            <div
              key={bv.qubit}
              className={`p-2.5 rounded-lg border text-xs font-mono transition-all ${
                bv.isEntangled
                  ? "bg-purple-950/20 border-purple-500/40 text-purple-300"
                  : "bg-[var(--color-app-surface)] border-[var(--color-app-border)] text-[var(--color-app-text-main)]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold">q[{bv.qubit}]</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    bv.isEntangled
                      ? "bg-purple-500/30 text-purple-200"
                      : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {bv.isEntangled ? "Entangled" : "Pure"}
                </span>
              </div>
              <div className="text-[11px] text-[var(--color-app-text-muted)] flex flex-col gap-0.5">
                <div>r = <span className="text-[var(--color-app-text-main)] font-semibold">{bv.r.toFixed(3)}</span></div>
                <div>Purity γ = <span className="text-[var(--color-app-text-main)] font-semibold">{bv.purity.toFixed(3)}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Amplitudes Collapsible Toggle */}
      <div>
        <button
          onClick={() => setShowAmplitudesTable(!showAmplitudesTable)}
          className="text-xs font-semibold text-[var(--color-app-text-muted)] hover:text-[var(--color-app-text-main)] flex items-center gap-1.5 transition-colors"
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform ${showAmplitudesTable ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {showAmplitudesTable ? "Hide Full State Amplitudes Table" : "View Full State Amplitudes Table"}
        </button>

        {showAmplitudesTable && step.amplitudes && (
          <div className="mt-2.5 max-h-60 overflow-y-auto border border-[var(--color-app-border)] rounded-lg overflow-x-auto custom-scrollbar">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-[var(--color-app-surface)] text-[var(--color-app-text-muted)] sticky top-0 border-b border-[var(--color-app-border)]">
                <tr>
                  <th className="p-2">Basis</th>
                  <th className="p-2">Real</th>
                  <th className="p-2">Imag</th>
                  <th className="p-2">Magnitude</th>
                  <th className="p-2">Phase (rad)</th>
                  <th className="p-2">Prob (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-app-border)]/50">
                {step.amplitudes.map((amp) => (
                  <tr
                    key={amp.basis}
                    className={`hover:bg-white/5 ${amp.probability > 0.001 ? "bg-[var(--color-app-primary)]/5 font-bold" : "text-[var(--color-app-text-muted)]"}`}
                  >
                    <td className="p-2 text-[var(--color-app-primary)]">|{amp.basis}⟩</td>
                    <td className="p-2">{amp.real.toFixed(4)}</td>
                    <td className="p-2">{amp.imag.toFixed(4)}</td>
                    <td className="p-2">{amp.magnitude.toFixed(4)}</td>
                    <td className="p-2">{amp.phase.toFixed(4)}</td>
                    <td className="p-2">{(amp.probability * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
