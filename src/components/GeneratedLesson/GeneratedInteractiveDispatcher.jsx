import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BlochSphereViewer from "../BlochSphereViewer/BlochSphereViewer";
import ComplexPlane from "../ComplexPlane/ComplexPlane";
import StateProbabilityHeatmap from "../StateProbabilityHeatmap/StateProbabilityHeatmap";
import MeasurementTable from "../MeasurementTable/MeasurementTable";

/**
 * GeneratedInteractiveDispatcher
 * 
 * Secure adapter mapping whitelisted interactiveComponent types to trusted Quantiva visualizers.
 * Supported types:
 * - "bloch-sphere" -> BlochSphereViewer (with custom theta/phi and gate palette)
 * - "circuit" -> Interactive Quantum Wire & Step Visualizer with Sandbox Bridge
 * - "complex-plane" -> ComplexPlane (with real & imaginary coordinate controls)
 * - "state-vector" / "probability-heatmap" -> StateProbabilityHeatmap
 * - "measurement" -> MeasurementTable with interactive shot resampling
 * - "sandbox" -> Sandboxed python/qiskit preview with explicit Sandbox bridge
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
    case "measurement":
      return <MeasurementAdapter config={config} />;
    case "sandbox":
      return <SandboxAdapter config={config} />;
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
 * Helper to translate visual circuit gates to runnable Qiskit python code
 */
function circuitToQiskit(numQubits, gates) {
  const lines = [
    "# Generated from Quantiva Circuit",
    "from qiskit import QuantumCircuit, transpile",
    "from qiskit_aer import Aer",
    "from qiskit.visualization import circuit_drawer, plot_histogram",
    "import matplotlib",
    "matplotlib.use('agg')",
    "import matplotlib.pyplot as plt",
    "",
    `qc = QuantumCircuit(${numQubits})`
  ];
  gates.forEach((g) => {
    const type = (g.type || "").toUpperCase();
    if (type === "H") lines.push(`qc.h(${g.wire})`);
    else if (type === "X") lines.push(`qc.x(${g.wire})`);
    else if (type === "Y") lines.push(`qc.y(${g.wire})`);
    else if (type === "Z") lines.push(`qc.z(${g.wire})`);
    else if (type === "CX" || type === "CNOT") {
      const target = g.target !== undefined ? g.target : (g.wire + 1) % numQubits;
      lines.push(`qc.cx(${g.wire}, ${target})`);
    } else if (type === "S") lines.push(`qc.s(${g.wire})`);
    else if (type === "T") lines.push(`qc.t(${g.wire})`);
  });
  lines.push("qc.measure_all()");
  lines.push("");
  lines.push("# Draw circuit");
  lines.push("fig = circuit_drawer(qc, output='mpl')");
  lines.push("display(fig)");
  lines.push("plt.close(fig)");
  lines.push("");
  lines.push("# Simulate");
  lines.push("simulator = Aer.get_backend('aer_simulator')");
  lines.push("compiled = transpile(qc, simulator)");
  lines.push("job = simulator.run(compiled, shots=1000)");
  lines.push("result = job.result()");
  lines.push("counts = result.get_counts()");
  lines.push('print(f"Results: {counts}")');
  lines.push("");
  lines.push("fig2 = plot_histogram(counts)");
  lines.push("display(fig2)");
  lines.push("plt.close(fig2)");
  return lines.join("\n");
}

/**
 * Circuit Visualizer Adapter
 */
function CircuitAdapter({ config }) {
  const navigate = useNavigate();
  const numQubits = Math.max(1, Math.min(4, Number(config.numQubits) || 2));
  const gates = Array.isArray(config.gates) ? config.gates : [];

  // Group gates by wire
  const wires = Array.from({ length: numQubits }, (_, q) => {
    return gates.filter((g) => g.wire === q).sort((a, b) => (a.step || 0) - (b.step || 0));
  });

  const handleOpenSandbox = () => {
    const code = circuitToQiskit(numQubits, gates);
    navigate("/sandbox", { state: { code } });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        {config.instructions ? (
          <p className="text-xs font-medium text-[var(--color-app-text-muted)] italic">
            💡 {config.instructions}
          </p>
        ) : <div />}
        <button
          type="button"
          onClick={handleOpenSandbox}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-[var(--color-app-primary)] hover:text-black transition-all flex items-center gap-1.5 border border-white/10 shrink-0"
          title="Export this circuit to executable Python in the Sandbox"
        >
          <span>🚀 Open in Sandbox</span>
        </button>
      </div>
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

/**
 * Measurement Adapter
 */
function MeasurementAdapter({ config }) {
  const baseMeasurements = useMemo(() => {
    return Array.isArray(config.measurements) && config.measurements.length > 0
      ? config.measurements
      : [
          { state: "0", probability: 0.5, count: 500 },
          { state: "1", probability: 0.5, count: 500 },
        ];
  }, [config]);

  const shots = config.shots || 1000;
  const [measurements, setMeasurements] = useState(baseMeasurements);
  const [isResampling, setIsResampling] = useState(false);

  const handleResample = () => {
    setIsResampling(true);
    setTimeout(() => {
      const totalProb = baseMeasurements.reduce((sum, m) => sum + (m.probability || 0), 0) || 1;
      const counts = new Array(baseMeasurements.length).fill(0);
      for (let s = 0; s < shots; s++) {
        let r = Math.random() * totalProb;
        for (let i = 0; i < baseMeasurements.length; i++) {
          r -= (baseMeasurements[i].probability || 0);
          if (r <= 0 || i === baseMeasurements.length - 1) {
            counts[i]++;
            break;
          }
        }
      }
      setMeasurements(baseMeasurements.map((m, idx) => ({
        ...m,
        count: counts[idx],
        probability: Math.round((counts[idx] / shots) * 1000) / 1000,
      })));
      setIsResampling(false);
    }, 150);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        {config.instructions ? (
          <p className="text-xs font-medium text-[var(--color-app-text-muted)] italic">
            💡 {config.instructions}
          </p>
        ) : <div />}
        <button
          type="button"
          onClick={handleResample}
          disabled={isResampling}
          className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-[var(--color-app-text-main)] transition-all flex items-center gap-1.5 border border-white/10 disabled:opacity-50 shrink-0"
        >
          <span>🎲 Re-sample ({shots} shots)</span>
        </button>
      </div>
      <MeasurementTable measurements={measurements} />
    </div>
  );
}

/**
 * Sandbox Adapter
 */
function SandboxAdapter({ config }) {
  const navigate = useNavigate();
  const code = config.code || "# No code provided";

  const handleOpenInSandbox = () => {
    navigate("/sandbox", { state: { code } });
  };

  return (
    <div className="space-y-3">
      {config.instructions && (
        <p className="text-xs font-medium text-[var(--color-app-text-muted)] italic">
          💡 {config.instructions}
        </p>
      )}
      <div className="rounded-2xl border border-[var(--color-app-border)] bg-black/60 overflow-hidden shadow-xl">
        <div className="px-4 py-2.5 bg-white/5 border-b border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 inline-block animate-pulse" />
            <span className="text-xs font-mono font-semibold text-[var(--color-app-text-muted)]">
              🐍 {config.title || "Python / Qiskit Code"}
            </span>
          </div>
          <button
            type="button"
            onClick={handleOpenInSandbox}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[var(--color-app-primary)] text-black hover:opacity-90 transition-all flex items-center gap-1.5 shadow-md shadow-[var(--color-app-primary)]/20 shrink-0"
          >
            <span>🚀 Open in Sandbox</span>
          </button>
        </div>
        <pre className="p-4 text-xs font-mono text-emerald-300 bg-black/40 overflow-x-auto max-h-72 leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}
