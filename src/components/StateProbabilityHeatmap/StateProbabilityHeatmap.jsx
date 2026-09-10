/**
 * Renders exact (pre-measurement) basis-state probabilities as a
 * color-graded horizontal bar heatmap — complements the sampled
 * measurement histogram with the underlying theoretical distribution.
 */
export default function StateProbabilityHeatmap({ probabilities }) {
  if (!probabilities || Object.keys(probabilities).length === 0) return null;

  const entries = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, p]) => p));

  return (
    <div className="app-glass rounded-xl p-4 border border-[var(--color-app-border)]">
      <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-app-text-muted)" }}>
        Exact State Probabilities
      </div>
      <div className="flex flex-col gap-2">
        {entries.map(([state, prob]) => {
          const intensity = max > 0 ? prob / max : 0;
          return (
            <div key={state} className="flex items-center gap-3">
              <span className="font-mono text-xs w-16 shrink-0" style={{ color: "var(--color-app-text-main)" }}>
                |{state}⟩
              </span>
              <div className="flex-1 h-5 rounded-md overflow-hidden" style={{ background: "var(--color-app-surface-hover)" }}>
                <div
                  className="h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2"
                  style={{
                    width: `${Math.max(intensity * 100, 3)}%`,
                    background: `hsl(${190 + intensity * 100}, 75%, ${45 + intensity * 10}%)`,
                  }}
                >
                  {intensity > 0.35 && (
                    <span className="text-[10px] font-mono font-bold text-black/70">
                      {(prob * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              {intensity <= 0.35 && (
                <span className="text-[10px] font-mono w-12 text-right" style={{ color: "var(--color-app-text-muted)" }}>
                  {(prob * 100).toFixed(1)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
