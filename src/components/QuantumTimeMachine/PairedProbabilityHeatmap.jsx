import React, { useMemo } from "react";

export default function PairedProbabilityHeatmap({
  idealProbabilities = {},
  noisyProbabilities = {},
  readoutProbabilities = null,
  noiseModel = "depolarizing",
}) {
  const isReadout = noiseModel === "readout";

  const activeNoisyProbs =
    isReadout && readoutProbabilities
      ? readoutProbabilities
      : noisyProbabilities;

  // Union of all basis states present
  const allBases = useMemo(() => {
    const set = new Set([
      ...Object.keys(idealProbabilities || {}),
      ...Object.keys(activeNoisyProbs || {}),
    ]);

    return Array.from(set).sort();
  }, [idealProbabilities, activeNoisyProbs]);

  // Filter dominant bases for display clarity
  const filteredBases = useMemo(() => {
    return allBases.filter((b) => {
      const pI = idealProbabilities[b] || 0.0;
      const pN = activeNoisyProbs[b] || 0.0;

      return pI >= 0.005 || pN >= 0.005;
    });
  }, [allBases, idealProbabilities, activeNoisyProbs]);

  const displayBases =
    filteredBases.length > 0 ? filteredBases : allBases;

  return (
    <div className="app-glass rounded-2xl p-5 border border-amber-500/30 flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-app-border)] pb-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
            <span>📊</span>
            <span>Paired Basis State Probabilities</span>
          </h3>

          <p className="text-[11px] text-[var(--color-app-text-muted)]">
            Comparing ideal probability |Pᵢdₑₐₗ⟩ (Cyan) vs.{" "}
            {isReadout
              ? "observed readout distribution"
              : "noisy quantum state"}{" "}
            |Pₙₒᵢₛᵧ⟩ (Amber).
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[var(--color-app-primary)]"></span>

            <span className="text-[var(--color-app-primary)]">
              Ideal
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-amber-400"></span>

            <span className="text-amber-300">
              {isReadout ? "Readout Obs" : "Noisy"}
            </span>
          </div>
        </div>
      </div>

      {/* Basis Probability Bars */}
      <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
        {displayBases.map((basis) => {
          const pIdeal =
            idealProbabilities[basis] || 0.0;

          const pNoisy =
            activeNoisyProbs[basis] || 0.0;

          const delta = Number(
            (pNoisy - pIdeal).toFixed(4)
          );

          const deltaSign =
            delta > 0
              ? `+${(delta * 100).toFixed(1)}%`
              : `${(delta * 100).toFixed(1)}%`;

          return (
            <div
              key={basis}
              className="flex flex-col gap-1 p-2.5 rounded-xl bg-black/30 border border-[var(--color-app-border)]"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-[var(--color-app-text-main)]">
                  |{basis}⟩
                </span>

                <span
                  className={`text-[11px] font-bold ${
                    Math.abs(delta) < 0.005
                      ? "text-[var(--color-app-text-muted)]"
                      : delta > 0
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  Δ: {deltaSign}
                </span>
              </div>

              {/* Stacked / Paired Bars */}
              <div className="flex flex-col gap-1">
                {/* Ideal Bar */}
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-[var(--color-app-surface)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-app-primary)] transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          pIdeal * 100
                        )}%`,
                      }}
                    />
                  </div>

                  <span className="text-[10px] font-mono text-[var(--color-app-primary)] w-12 text-right">
                    {(pIdeal * 100).toFixed(1)}%
                  </span>
                </div>

                {/* Noisy / Readout Bar */}
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-[var(--color-app-surface)] overflow-hidden">
                    <div
                      className="h-full bg-amber-400 transition-all duration-300 shadow-sm shadow-amber-400/50"
                      style={{
                        width: `${Math.min(
                          100,
                          pNoisy * 100
                        )}%`,
                      }}
                    />
                  </div>

                  <span className="text-[10px] font-mono text-amber-300 w-12 text-right">
                    {(pNoisy * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
