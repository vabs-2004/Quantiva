import React from "react";

const SPEEDS = [0.5, 1, 2, 4];

/**
 * Playback and step controls for Quantum Circuit Time Machine.
 */
export default function TimelineControls({
  currentStepIndex,
  totalSteps,
  onPrev,
  onNext,
  onReset,
  onPlayPause,
  isPlaying,
  playbackSpeed,
  onSpeedChange,
}) {
  const isFirst = currentStepIndex <= 0;
  const isLast = currentStepIndex >= totalSteps - 1;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl app-glass border border-[var(--color-app-border)]">
      {/* Step Info */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-app-text-muted)]">
          Step:
        </span>
        <span className="font-mono text-sm font-extrabold px-2.5 py-0.5 rounded-lg bg-[var(--color-app-surface)] border border-[var(--color-app-border)] text-[var(--color-app-primary)]">
          {currentStepIndex} <span className="text-xs text-[var(--color-app-text-muted)] font-normal">/ {Math.max(0, totalSteps - 1)}</span>
        </span>
      </div>

      {/* Playback Buttons */}
      <div className="flex items-center gap-2">
        {/* Reset */}
        <button
          onClick={onReset}
          disabled={isFirst}
          title="Reset to Step 0"
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface)] hover:bg-[var(--color-app-surface-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[var(--color-app-text-main)] flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset
        </button>

        {/* Previous */}
        <button
          onClick={onPrev}
          disabled={isFirst}
          title="Previous Gate"
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface)] hover:bg-[var(--color-app-surface-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[var(--color-app-text-main)] flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>

        {/* Play / Pause */}
        <button
          onClick={onPlayPause}
          title={isPlaying ? "Pause Timeline" : "Play Timeline"}
          className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-md ${
            isPlaying
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30"
              : "bg-gradient-to-r from-[var(--color-app-primary)] to-[var(--color-app-accent)] text-black hover:opacity-90"
          }`}
        >
          {isPlaying ? (
            <>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
              Pause
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Play
            </>
          )}
        </button>

        {/* Next */}
        <button
          onClick={onNext}
          disabled={isLast}
          title="Next Gate"
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface)] hover:bg-[var(--color-app-surface-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-all text-[var(--color-app-text-main)] flex items-center gap-1"
        >
          Next
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Speed Controls */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[var(--color-app-text-muted)] font-medium mr-1">
          Speed:
        </span>
        <div className="flex items-center rounded-lg bg-[var(--color-app-surface)] p-0.5 border border-[var(--color-app-border)]">
          {SPEEDS.map((spd) => (
            <button
              key={spd}
              onClick={() => onSpeedChange(spd)}
              className={`px-2 py-0.5 text-[11px] font-mono rounded-md transition-all ${
                playbackSpeed === spd
                  ? "bg-[var(--color-app-primary)] text-black font-bold shadow"
                  : "text-[var(--color-app-text-muted)] hover:text-[var(--color-app-text-main)]"
              }`}
            >
              {spd}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
