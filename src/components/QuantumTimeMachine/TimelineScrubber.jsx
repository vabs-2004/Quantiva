import React from "react";

/**
 * Interactive Timeline Scrubber track with milestone nodes for each gate.
 */
export default function TimelineScrubber({
  steps = [],
  currentStepIndex = 0,
  onSelectStep,
}) {
  const totalSteps = steps.length;
  if (totalSteps <= 1) {
    return (
      <div className="py-2 px-4 rounded-xl app-glass border border-[var(--color-app-border)] text-xs text-[var(--color-app-text-muted)] italic text-center">
        Initial ground state |0...0⟩ (No gates applied)
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 py-3 px-4 rounded-xl app-glass border border-[var(--color-app-border)]">
      {/* Range Slider for smooth scrubbing */}
      <div className="relative flex items-center">
        <input
          type="range"
          min={0}
          max={totalSteps - 1}
          value={currentStepIndex}
          onChange={(e) => onSelectStep(parseInt(e.target.value, 10))}
          className="w-full h-2 rounded-lg bg-[var(--color-app-surface)] appearance-none cursor-pointer accent-[var(--color-app-primary)] focus:outline-none"
        />
      </div>

      {/* Discrete Step Milestone Badges */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 pt-0.5 custom-scrollbar">
        {steps.map((step, idx) => {
          const isActive = idx === currentStepIndex;
          const isPassed = idx < currentStepIndex;
          const gate = step.appliedGate;

          let label = "Start";
          let wireLabel = "";
          if (idx > 0 && gate) {
            label = gate.type;
            wireLabel = gate.target !== null && gate.target !== undefined
              ? `q${gate.wire}→${gate.target}`
              : `q${gate.wire}`;
          }

          return (
            <button
              key={idx}
              onClick={() => onSelectStep(idx)}
              title={
                idx === 0
                  ? "Step 0: Initial Ground State"
                  : `Step ${idx}${gate?.layerIndex !== undefined && gate?.layerIndex !== null ? ` (Layer ${gate.layerIndex})` : ""}: ${gate?.type} on wire ${gate?.wire}${gate?.target !== null && gate?.target !== undefined ? ` (target ${gate.target})` : ""}${step.isMeasurement ? ` [Outcome: ${step.measurementOutcome}]` : ""}`
              }
              className={`flex flex-col items-center shrink-0 min-w-[52px] py-1 px-1.5 rounded-lg text-[11px] font-mono transition-all border ${
                isActive
                  ? "bg-[var(--color-app-primary)] text-black font-extrabold border-[var(--color-app-primary)] shadow-lg shadow-[var(--color-app-primary)]/30 scale-105"
                  : isPassed
                  ? "bg-[var(--color-app-surface-hover)] text-[var(--color-app-text-main)] border-[var(--color-app-border-light)] hover:border-[var(--color-app-primary)]/50"
                  : "bg-[var(--color-app-surface)]/60 text-[var(--color-app-text-muted)] border-[var(--color-app-border)] hover:text-[var(--color-app-text-main)]"
              }`}
            >
              <span className="font-bold leading-tight">{label}</span>
              {wireLabel && (
                <span className={`text-[9px] leading-tight ${isActive ? "text-black/80 font-medium" : "text-[var(--color-app-text-muted)]"}`}>
                  {wireLabel}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
