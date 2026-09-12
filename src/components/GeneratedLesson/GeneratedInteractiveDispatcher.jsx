import React, { useState, useMemo } from "react";
import BlochSphereViewer from "../BlochSphereViewer/BlochSphereViewer";
import ComplexPlane from "../ComplexPlane/ComplexPlane";
import StateProbabilityHeatmap from "../StateProbabilityHeatmap/StateProbabilityHeatmap";

/**
 * GeneratedInteractiveDispatcher
 * 
 * Secure adapter mapping whitelisted interactiveComponent types to trusted Quantiva visualizers.
 * Supported types:
 * - "bloch-sphere" -> BlochSphereViewer (with custom theta/phi and gate palette)
 * - "circuit" -> Interactive Quantum Wire & Step Visualizer
 * - "complex-plane" -> ComplexPlane (with real & imaginary coordinate controls)
 * - "state-vector" / "probability-heatmap" -> StateProbabilityHeatmap
 * 
 * NEVER executes arbitrary code or unwhitelisted components.
 */
export default function GeneratedInteractiveDispatcher({ component }) {
  if (!component || !component.type) return null;

  const { type, config = {} } = component;

  switch (type) {
    case "bloch-sphere":
      return <BlochSphereAdapter config={config} />;
    case "complex-plane":
      return <ComplexPlaneAdapter config={config} />;
    case "circuit":
      return <CircuitAdapter config={config} />;
    case "state-vector":
    case "probability-heatmap":
      return <HeatmapAdapter config={config} />;
    default:
      return (
        <div className="p-4 rounded-xl border border-white/10 bg-black/20 text-xs text-[var(--color-app-text-muted)] italic">
          Interactive component "{type}" cannot be previewed.
        </div>
      );
  }
}

/**
 * Bloch Sphere Adapter
 */
function BlochSphereAdapter({ config }) {
  const blochData = useMemo(() => ({
    theta: typeof config.initialTheta === "number" ? config.initialTheta : Math.PI / 2,
    phi: typeof config.initialPhi === "number" ? config.initialPhi : 0,
  }), [config]);

  return (
    <div className="space-y-3">
      {config.instructions && (
        <p className="text-xs font-medium text-[var(--color-app-text-muted)] italic">
          💡 {config.instructions}
        </p>
      )}
      <div className="w-full rounded-2xl overflow-hidden border border-[var(--color-app-border)] bg-black/40">
        <BlochSphereViewer blochData={blochData} />
      </div>
    </div>
  );
}

/**
 * Complex Plane Adapter
 */
function ComplexPlaneAdapter({ config }) {
  const [point, setPoint] = useState({
    r: typeof config.r === "number" ? config.r : 1.0,
    i: typeof config.i === "number" ? config.i : 0.5,
  });

  return (
    <div className="space-y-3">
      {config.instructions && (
        <p className="text-xs font-medium text-[var(--color-app-text-muted)] italic">
          💡 {config.instructions}
        </p>
      )}
      <div className="p-4 rounded-2xl border border-[var(--color-app-border)] bg-black/30 flex flex-col items-center">
        <ComplexPlane
          value={point}
          onChange={(newVal) => setPoint({ r: newVal.r, i: newVal.i })}
          range={config.range || 2.0}
          showComponents={config.showComponents !== false}
        />
        <div className="mt-3 text-xs font-mono text-[var(--color-app-text-muted)] flex items-center gap-4">
          <span>Real (a): <b className="text-[var(--color-app-primary)]">{point.r.toFixed(2)}</b></span>
          <span>Imag (b): <b className="text-[var(--color-app-accent)]">{point.i.toFixed(2)}</b></span>
          <span>|z|: <b className="text-emerald-400">{Math.sqrt(point.r * point.r + point.i * point.i).toFixed(2)}</b></span>
        </div>
      </div>
    </div>
  );
}

/**
 * Circuit Visualizer Adapter
 */
function CircuitAdapter({ config }) {
  const numQubits = Math.max(1, Math.min(4, Number(config.numQubits) || 2));
  const gates = Array.isArray(config.gates) ? config.gates : [];

  // Group gates by wire
  const wires = Array.from({ length: numQubits }, (_, q) => {
    return gates.filter((g) => g.wire === q).sort((a, b) => (a.step || 0) - (b.step || 0));
  });

  return (
    <div className="space-y-3">
      {config.instructions && (
        <p className="text-xs font-medium text-[var(--color-app-text-muted)] italic">
          💡 {config.instructions}
        </p>
      )}
      <div className="p-5 rounded-2xl border border-[var(--color-app-border)] bg-black/40 overflow-x-auto">
        <div className="min-w-[320px] space-y-4">
          {wires.map((wireGates, qIdx) => (
            <div key={qIdx} className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold w-12 text-[var(--color-app-text-muted)] shrink-0">
                q[{qIdx}]
              </span>
              <div className="flex-1 relative flex items-center h-10 px-2 bg-white/5 rounded-lg border border-white/5">
                {/* Wire line */}
                <div className="absolute inset-x-0 top-1/2 h-[2px] bg-white/20 -translate-y-1/2" />
                
                {/* Gate blocks on this wire */}
                <div className="relative flex items-center gap-4 z-10">
                  <span className="text-[10px] font-mono text-[var(--color-app-text-light)] px-1.5 py-0.5 rounded bg-black/60 border border-white/10">
                    |0⟩
                  </span>
                  {wireGates.length === 0 ? (
                    <span className="text-[11px] text-[var(--color-app-text-light)] italic">
                      — (identity) —
                    </span>
                  ) : (
                    wireGates.map((g, gIdx) => (
                      <div
                        key={gIdx}
                        className="px-2.5 py-1 rounded-md font-mono text-xs font-bold border shadow-md flex items-center gap-1"
                        style={{
                          background: g.type === "CX" ? "rgba(236, 72, 153, 0.25)" : "rgba(99, 102, 241, 0.25)",
                          borderColor: g.type === "CX" ? "rgba(236, 72, 153, 0.5)" : "rgba(99, 102, 241, 0.5)",
                          color: "#fff",
                        }}
                      >
                        {g.type}
                        {g.target !== undefined && <span className="text-[10px] opacity-75">→{g.target}</span>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Heatmap Adapter
 */
function HeatmapAdapter({ config }) {
  const probabilities = config.probabilities || { "0": 1.0 };

  return (
    <div className="space-y-3">
      {config.instructions && (
        <p className="text-xs font-medium text-[var(--color-app-text-muted)] italic">
          💡 {config.instructions}
        </p>
      )}
      <StateProbabilityHeatmap probabilities={probabilities} />
    </div>
  );
}
