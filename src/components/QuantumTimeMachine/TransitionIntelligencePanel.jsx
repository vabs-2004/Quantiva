import React, { useState } from "react";
import { marked } from "marked";
import { explainCircuitTransition } from "../../services/api";
import MathHTMLContainer from "../MathHTMLContainer/MathHTMLContainer";

/**
 * Format helper for Dirac state strings
 */
function getDiracSnippet(amplitudes, threshold = 0.01) {
  if (!amplitudes || amplitudes.length === 0) return "|0...0⟩";
  const dominant = amplitudes.filter((a) => a.probability >= threshold);
  if (dominant.length === 0) return "|0...0⟩";

  const parts = dominant.map((a) => {
    const mag = a.magnitude.toFixed(2);
    const prefix = mag === "1.00" ? "" : `${mag} `;
    return `${prefix}|${a.basis}⟩`;
  });
  return parts.join(" + ");
}

/**
 * Transition Intelligence Panel
 * Answers: "WHAT EXACTLY CHANGED BECAUSE OF THIS GATE?"
 * Purely deterministic scientific delta analysis + On-demand AI Pedagogical Explanation.
 */
export default function TransitionIntelligencePanel({
  transition,
  stepIndex,
  prevStep,
  currStep,
  numQubits,
  timelineId,
}) {
  const [showFullDeltas, setShowFullDeltas] = useState(false);
  const [explanationCache, setExplanationCache] = useState({});
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [userQuestion, setUserQuestion] = useState("");
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Step 0: Initial State
  if (stepIndex === 0 || !transition) {
    return (
      <div className="p-4 rounded-xl app-glass border border-[var(--color-app-border)] bg-[var(--color-app-surface)]/40">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-app-text-main)]">
            Initial State (Step 0)
          </h4>
        </div>
        <p className="text-xs text-[var(--color-app-text-muted)] font-mono">
          Register prepared in ground state |{"0".padStart(numQubits || 1, "0")}⟩. No preceding gate transitions.
        </p>

      </div>
    );
  }

  const { summary, probability, phase, subsystems, measurement, stateMetrics, gate } = transition;
  const isNoOp = summary.isNoOp;
  const isMeasurement = transition.type === "measurement_collapse";

  const beforeDirac = getDiracSnippet(prevStep?.amplitudes);
  const afterDirac = getDiracSnippet(currStep?.amplitudes);

  // Compute composite cache key: timelineId + stepIndex + normalized question
  const normQ = userQuestion ? userQuestion.trim().toLowerCase().slice(0, 40) : "default";
  const currentKey = timelineId ? `${timelineId}_s${stepIndex}_standard_${normQ}` : `step_${stepIndex}_${normQ}`;
  const currentExplanation = explanationCache[currentKey] || null;

  const handleRequestExplanation = async (questionToAsk = "") => {
    if (!timelineId) {
      setAiError("Timeline session is not ready. Please re-run the circuit.");
      return;
    }

    const q = questionToAsk.trim();
    const key = `${timelineId}_s${stepIndex}_standard_${q ? q.toLowerCase().slice(0, 40) : "default"}`;
    if (explanationCache[key]) {
      setIsExpanded(true);
      return;
    }

    setIsLoadingAI(true);
    setAiError(null);
    try {
      const data = await explainCircuitTransition({
        timelineId,
        stepIndex,
        learnerQuestion: q,
        explanationMode: "standard",
      });

      if (data && data.explanation) {
        setExplanationCache((prev) => ({
          ...prev,
          [key]: data.explanation,
        }));
        setIsExpanded(true);
      } else {
        setAiError("No explanation returned from server.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to load explanation.";
      setAiError(msg);
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl app-glass border border-cyan-500/30 bg-gradient-to-b from-cyan-950/10 to-transparent shadow-lg shadow-cyan-500/5 animate-fade-in">
      {/* Header Badge, Headline & Explain Why AI Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-app-border)] pb-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            What Changed?
          </span>
          <span className="text-xs font-mono text-[var(--color-app-text-muted)]">
            Step {stepIndex - 1} ➔ Step {stepIndex}
          </span>
        </div>

        {/* Right actions: Headline Badge + Explain Why AI Button */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-3 py-1 rounded-lg text-xs font-bold font-mono border ${
              isNoOp
                ? "bg-zinc-800 text-zinc-300 border-zinc-700"
                : isMeasurement
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse"
                : summary.entanglementChanged
                ? "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm shadow-purple-500/20"
                : summary.phaseChanged && !summary.probabilityChanged
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50"
                : "bg-cyan-500/20 text-cyan-200 border-cyan-500/40"
            }`}
          >
            {summary.headline}
          </span>

          {/* Explain Why Button & Question Toggle */}
          <div className="flex items-center gap-1.5">
            {!currentExplanation ? (
              <button
                onClick={() => handleRequestExplanation(userQuestion)}
                disabled={isLoadingAI}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-600/40 to-cyan-600/40 border border-purple-400/40 text-purple-200 hover:text-white hover:border-purple-300 transition-all flex items-center gap-1.5 shadow-sm shadow-purple-500/10 disabled:opacity-50 cursor-pointer"
                title="Explain why this gate operation caused this exact transition"
              >
                {isLoadingAI ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin text-purple-300" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Explaining...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 text-purple-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                    <span>Explain Why (AI)</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-950/50 border border-purple-500/40 text-purple-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>{isExpanded ? "Hide Explanation" : "View Explanation"}</span>
              </button>
            )}

            <button
              onClick={() => setShowQuestionInput(!showQuestionInput)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                showQuestionInput
                  ? "bg-purple-600/30 border-purple-400 text-purple-200"
                  : "border-[var(--color-app-border)] hover:bg-[var(--color-app-surface)] text-[var(--color-app-text-muted)] hover:text-cyan-300"
              }`}
              title="Ask a specific question about this transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Optional Transition-Scoped Question Input Bar */}
      {showQuestionInput && (
        <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-purple-500/30 animate-fade-in">
          <input
            type="text"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRequestExplanation(userQuestion);
            }}
            placeholder="Ask about this step (e.g. Why did the Bloch vector rotate to Y? What does purity mean?)"
            className="grow bg-transparent text-xs text-white placeholder-zinc-500 outline-none px-2 font-sans"
            maxLength={250}
          />
          <button
            onClick={() => handleRequestExplanation(userQuestion)}
            disabled={isLoadingAI || !userQuestion.trim()}
            className="px-3 py-1 text-xs font-bold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-all disabled:opacity-40 cursor-pointer"
          >
            Ask
          </button>
        </div>
      )}

      {/* AI Error Notification */}
      {aiError && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>{aiError}</span>
          <button onClick={() => setAiError(null)} className="text-rose-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Stage 5: AI-Grounded Explanation Section */}
      {currentExplanation && isExpanded && (
        <div className="flex flex-col gap-3 p-4 rounded-xl border border-purple-500/40 bg-gradient-to-br from-purple-950/30 via-slate-900/60 to-black/50 shadow-md shadow-purple-500/10 animate-fade-in">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                AI Pedagogical Explanation
              </span>
              <h4 className="text-xs font-bold text-white">
                {currentExplanation.headline}
              </h4>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-zinc-400 hover:text-white text-xs p-1 cursor-pointer"
              title="Hide Explanation"
            >
              ✕
            </button>
          </div>

          {/* Mechanism */}
          <div className="text-xs text-zinc-200 leading-relaxed font-sans">
            <MathHTMLContainer html={marked.parse(currentExplanation.mechanism || "")} />
          </div>

          {/* Subsystem & Geometric Insight */}
          {currentExplanation.subsystemInsight && (
            <div className="p-2.5 rounded-lg bg-black/40 border border-purple-500/20 text-xs text-purple-200/90 font-mono">
              <span className="font-bold text-purple-300 block text-[10px] uppercase tracking-wider mb-1">
                Geometric & Subsystem Insight:
              </span>
              <MathHTMLContainer html={marked.parse(currentExplanation.subsystemInsight || "")} />
            </div>
          )}

          {/* Direct Answer to User Question if present */}
          {currentExplanation.answeredQuestion && (
            <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 font-sans">
              <span className="font-bold text-cyan-300 block text-[10px] uppercase tracking-wider mb-1">
                Answer to Your Question:
              </span>
              <MathHTMLContainer html={marked.parse(currentExplanation.answeredQuestion || "")} />
            </div>
          )}

          {/* Key Takeaway */}
          {currentExplanation.takeaway && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-purple-500/10 border border-purple-400/30 text-[11px] text-purple-200">
              <span className="font-bold text-purple-300 shrink-0">💡 Takeaway:</span>
              <div className="grow font-sans font-medium">
                <MathHTMLContainer html={marked.parse(currentExplanation.takeaway || "")} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* State Transition Formula */}
      <div className="flex flex-col gap-1 p-3 rounded-xl bg-black/40 border border-[var(--color-app-border)]">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-app-text-muted)]">
          State Transition:
        </span>
        <div className="flex items-center gap-2 font-mono text-xs overflow-x-auto custom-scrollbar py-0.5">
          <span className="text-zinc-300 shrink-0 font-semibold">{beforeDirac}</span>
          <span className="px-2 py-0.5 rounded bg-[var(--color-app-surface)] text-[var(--color-app-primary)] font-bold text-[11px] shrink-0 border border-[var(--color-app-border)]">
            ──[ {gate.type}{gate.target !== null && gate.target !== undefined ? `(q${gate.wire}→q${gate.target})` : `(q${gate.wire})`} ]──▶
          </span>
          <span className="text-[var(--color-app-primary)] shrink-0 font-semibold">{afterDirac}</span>
        </div>
      </div>

      {/* Measurement Collapse Callout */}
      {isMeasurement && measurement && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 flex flex-col gap-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Projective Measurement Collapse on q[{measurement.wire}]
            </span>
            <span className="font-mono font-extrabold px-2 py-0.5 rounded bg-amber-500/30 text-amber-100">
              Outcome: |{measurement.outcome}⟩
            </span>
          </div>
          <p className="text-[11px] text-amber-200/80 font-mono">
            Subsystem collapsed from a pre-measurement outcome probability of {(measurement.preMeasurementProbability * 100).toFixed(1)}% into definite state |{measurement.outcome}⟩ (100%).
          </p>
        </div>
      )}

      {/* Grid: Probability Shifts & Phase / Bloch Deltas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Probability Shifts Card */}
        <div className="p-3.5 rounded-xl bg-[var(--color-app-surface)]/50 border border-[var(--color-app-border)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-app-text-muted)]">
                Probability Redistribution
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${summary.probabilityChanged ? "bg-cyan-500/20 text-cyan-300" : "bg-zinc-800 text-zinc-400"}`}>
                {summary.probabilityChanged ? "Shifted" : "Unchanged"}
              </span>
            </div>

            {summary.probabilityChanged && probability.deltas.length > 0 ? (
              <div className="flex flex-col gap-1.5 font-mono text-xs max-h-36 overflow-y-auto custom-scrollbar">
                {probability.deltas.slice(0, 5).map((d) => (
                  <div key={d.basis} className="flex items-center justify-between text-[11px] p-1 rounded bg-black/30">
                    <span className="text-zinc-300 font-bold">|{d.basis}⟩</span>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">{(d.before * 100).toFixed(1)}%</span>
                      <span className="text-zinc-500">➔</span>
                      <span className="text-white font-bold">{(d.after * 100).toFixed(1)}%</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                          d.status === "newly_populated"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : d.status === "depleted"
                            ? "bg-rose-500/20 text-rose-300"
                            : d.delta > 0
                            ? "bg-teal-500/20 text-teal-300"
                            : "bg-orange-500/20 text-orange-300"
                        }`}
                      >
                        {d.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--color-app-text-muted)] italic">
                Measurement probabilities across all basis states remained unchanged.
              </p>
            )}
          </div>
        </div>

        {/* Phase & Entanglement Dynamics */}
        <div className="p-3.5 rounded-xl bg-[var(--color-app-surface)]/50 border border-[var(--color-app-border)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-app-text-muted)]">
                Phase & Entanglement Dynamics
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  phase.classification === "relative"
                    ? "bg-indigo-500/20 text-indigo-300 font-bold"
                    : phase.classification === "global"
                    ? "bg-zinc-800 text-zinc-300"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {phase.classification.toUpperCase()} PHASE
              </span>
            </div>

            <div className="flex flex-col gap-2 font-mono text-xs">
              {/* Phase Description */}
              <div className="text-[11px] text-zinc-300 p-2 rounded bg-black/30 border border-[var(--color-app-border)]">
                {phase.description}
                {phase.maxRelativeShiftRad !== null && phase.maxRelativeShiftRad !== undefined && (
                  <span className="text-indigo-400 font-bold ml-1">
                    (Δφ ≈ {phase.maxRelativeShiftRad.toFixed(3)} rad)
                  </span>
                )}
              </div>

              {/* Subsystem Purity / Entanglement Summary */}
              <div className="flex flex-col gap-1">
                {subsystems.map((sub) => {
                  if (sub.movement === "unchanged" && sub.entanglement.status === "unchanged") {
                    return null;
                  }
                  return (
                    <div key={sub.qubit} className="flex items-center justify-between text-[10px] p-1 rounded bg-black/20">
                      <span className="font-bold text-cyan-300">q[{sub.qubit}]</span>
                      <span className="text-zinc-300">{sub.movement}</span>
                      {sub.entanglement.status === "became_entangled" && (
                        <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">
                          ⚡ Entangled
                        </span>
                      )}
                      {sub.entanglement.status === "became_disentangled" && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          Disentangled
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Mathematical Details (Fidelity & Full Basis Deltas) */}
      <div className="pt-2 border-t border-[var(--color-app-border)]/50">
        <button
          onClick={() => setShowFullDeltas(!showFullDeltas)}
          className="text-[11px] font-semibold text-[var(--color-app-text-muted)] hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
        >
          <svg
            className={`w-3 h-3 transition-transform ${showFullDeltas ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {showFullDeltas ? "Hide Mathematical Transition Details" : "Inspect Mathematical Details (Fidelity & Complete Distribution)"}
        </button>

        {showFullDeltas && (
          <div className="mt-3 flex flex-col gap-3 animate-fade-in font-mono text-xs">
            {/* Fidelity metric */}
            <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-[var(--color-app-border)]">
              <span className="text-[11px] text-[var(--color-app-text-muted)]">
                State Fidelity F = |⟨ψ<sub>before</sub>|ψ<sub>after</sub>⟩|²
              </span>
              <span className="font-bold text-cyan-300">
                {stateMetrics?.fidelity !== undefined ? stateMetrics.fidelity.toFixed(6) : "1.000000"}
              </span>
            </div>

            {/* Complete distribution table */}
            {probability.allDeltas && (
              <div className="max-h-48 overflow-y-auto border border-[var(--color-app-border)] rounded-lg custom-scrollbar">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[var(--color-app-surface)] text-[var(--color-app-text-muted)] sticky top-0 border-b border-[var(--color-app-border)]">
                    <tr>
                      <th className="p-1.5">Basis</th>
                      <th className="p-1.5">Before (%)</th>
                      <th className="p-1.5">After (%)</th>
                      <th className="p-1.5">Δ (%)</th>
                      <th className="p-1.5">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-app-border)]/40">
                    {probability.allDeltas.map((d) => (
                      <tr
                        key={d.basis}
                        className={`hover:bg-white/5 ${d.status !== "unchanged" ? "bg-cyan-500/5 font-bold" : "text-zinc-500"}`}
                      >
                        <td className="p-1.5 text-cyan-300">|{d.basis}⟩</td>
                        <td className="p-1.5">{(d.before * 100).toFixed(2)}%</td>
                        <td className="p-1.5">{(d.after * 100).toFixed(2)}%</td>
                        <td className={`p-1.5 ${d.delta > 0 ? "text-emerald-400" : d.delta < 0 ? "text-rose-400" : ""}`}>
                          {(d.delta > 0 ? "+" : "") + (d.delta * 100).toFixed(2)}%
                        </td>
                        <td className="p-1.5 text-[10px] text-zinc-400">{d.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
