import { useState, useRef, useCallback } from "react";
import { runSandboxCode, installSandboxPackages } from "../../services/api";
import GraphViewer from "../../components/GraphViewer/GraphViewer";
import Loading from "../../components/Loading/Loading";
import EditorModule from "react-simple-code-editor";
const Editor = EditorModule.default || EditorModule;
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/themes/prism-tomorrow.css";
import ImageLightbox from "../../components/ImageLightbox/ImageLightbox";
import { useAITutor } from "../../context/AITutorContext";

const TEMPLATES = {
  blank: {
    label: "Blank",
    code: `# Write your quantum code here
from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer
from qiskit.visualization import circuit_drawer, plot_histogram
import matplotlib
matplotlib.use('agg')
import matplotlib.pyplot as plt

# Create your circuit
qc = QuantumCircuit(2)
qc.h(0)
qc.cx(0, 1)
qc.measure_all()

# Draw circuit
fig = circuit_drawer(qc, output='mpl')
display(fig)
plt.close(fig)

# Simulate
simulator = Aer.get_backend('aer_simulator')
compiled = transpile(qc, simulator)
job = simulator.run(compiled, shots=1000)
result = job.result()
counts = result.get_counts()
print(f"Results: {counts}")

fig2 = plot_histogram(counts)
display(fig2)
plt.close(fig2)
`,
  },
  bell: {
    label: "Bell State",
    code: `# Bell State — Maximum Entanglement
from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer
from qiskit.visualization import circuit_drawer, plot_histogram
import matplotlib
matplotlib.use('agg')
import matplotlib.pyplot as plt

# Create Bell state |Φ+⟩ = (|00⟩ + |11⟩)/√2
qc = QuantumCircuit(2)
qc.h(0)          # Hadamard on qubit 0
qc.cx(0, 1)      # CNOT: qubit 0 controls qubit 1
qc.measure_all()

print("Bell State Circuit:")
fig = circuit_drawer(qc, output='mpl')
display(fig)
plt.close(fig)

# Simulate
simulator = Aer.get_backend('aer_simulator')
compiled = transpile(qc, simulator)
job = simulator.run(compiled, shots=1000)
result = job.result()
counts = result.get_counts()

print(f"\\nMeasurement Results: {counts}")
print("Expected: ~50% |00⟩ and ~50% |11⟩ (entangled)")

fig2 = plot_histogram(counts)
display(fig2)
plt.close(fig2)
`,
  },
  grover: {
    label: "Grover (3-qubit)",
    code: `# Grover's Search — 3 Qubits
from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer
from qiskit.visualization import circuit_drawer, plot_histogram
import matplotlib
matplotlib.use('agg')
import matplotlib.pyplot as plt

num_qubits = 3
target_state = '101'

qc = QuantumCircuit(num_qubits)

# Initialize superposition
for i in range(num_qubits):
    qc.h(i)

# Grover iterations
for _ in range(2):
    qc.barrier()
    # Oracle for |101⟩
    for i in range(num_qubits):
        if target_state[num_qubits - 1 - i] == '0':
            qc.x(i)
    qc.h(num_qubits-1)
    qc.mcx(list(range(num_qubits-1)), num_qubits-1)
    qc.h(num_qubits-1)
    for i in range(num_qubits):
        if target_state[num_qubits - 1 - i] == '0':
            qc.x(i)
    qc.barrier()
    # Diffuser
    for i in range(num_qubits):
        qc.h(i)
        qc.x(i)
    qc.h(num_qubits-1)
    qc.mcx(list(range(num_qubits-1)), num_qubits-1)
    qc.h(num_qubits-1)
    for i in range(num_qubits):
        qc.x(i)
        qc.h(i)

qc.measure_all()

print(f"Grover's Search for |{target_state}⟩")
fig = circuit_drawer(qc, output='mpl')
display(fig)
plt.close(fig)

simulator = Aer.get_backend('aer_simulator')
compiled = transpile(qc, simulator)
job = simulator.run(compiled, shots=1000)
result = job.result()
counts = result.get_counts()
print(f"\\nResults: {counts}")

fig2 = plot_histogram(counts)
display(fig2)
plt.close(fig2)
`,
  },
  qft: {
    label: "QFT",
    code: `# Quantum Fourier Transform
from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer
from qiskit.visualization import circuit_drawer, plot_histogram
import matplotlib
matplotlib.use('agg')
import matplotlib.pyplot as plt
import numpy as np

n = 3  # Number of qubits

def qft_circuit(n):
    qc = QuantumCircuit(n)
    for j in range(n):
        qc.h(j)
        for k in range(j+1, n):
            qc.cp(np.pi / (2**(k-j)), k, j)
    # Swap qubits
    for i in range(n//2):
        qc.swap(i, n-i-1)
    return qc

# Build full circuit
qc = QuantumCircuit(n)
qc.x(0)  # Start with |001⟩
qc.x(2)  # Now |101⟩
qc.barrier()
qc.compose(qft_circuit(n), inplace=True)
qc.measure_all()

print(f"QFT on {n} qubits, input state |101⟩")
fig = circuit_drawer(qc, output='mpl')
display(fig)
plt.close(fig)

simulator = Aer.get_backend('aer_simulator')
compiled = transpile(qc, simulator)
job = simulator.run(compiled, shots=1000)
result = job.result()
counts = result.get_counts()
print(f"\\nResults: {counts}")

fig2 = plot_histogram(counts)
display(fig2)
plt.close(fig2)
`,
  },
  teleportation: {
    label: "Teleportation",
    code: `# Quantum Teleportation Protocol
from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer
from qiskit.visualization import circuit_drawer, plot_histogram
import matplotlib
matplotlib.use('agg')
import matplotlib.pyplot as plt

qc = QuantumCircuit(3, 3)

# Prepare state to teleport: |ψ⟩ = H|0⟩ = |+⟩
qc.h(0)
qc.barrier()

# Create Bell pair between qubit 1 and 2
qc.h(1)
qc.cx(1, 2)
qc.barrier()

# Alice's operations
qc.cx(0, 1)
qc.h(0)
qc.barrier()

# Measure Alice's qubits
qc.measure(0, 0)
qc.measure(1, 1)
qc.barrier()

# Bob's corrections
qc.cx(1, 2)
qc.cz(0, 2)

# Measure Bob's qubit
qc.measure(2, 2)

print("Quantum Teleportation Circuit:")
fig = circuit_drawer(qc, output='mpl')
display(fig)
plt.close(fig)

simulator = Aer.get_backend('aer_simulator')
compiled = transpile(qc, simulator)
job = simulator.run(compiled, shots=1000)
result = job.result()
counts = result.get_counts()
print(f"\\nResults: {counts}")
print("Qubit 2 (Bob) should match the teleported state")

fig2 = plot_histogram(counts)
display(fig2)
plt.close(fig2)
`,
  },
  pennylane_bell: {
    label: "PennyLane: Bell State",
    code: `# Bell State on PennyLane's default.qubit simulator
import pennylane as qml
import matplotlib.pyplot as plt

dev = qml.device("default.qubit", wires=2, shots=1000)

@qml.qnode(dev)
def circuit():
    qml.Hadamard(wires=0)
    qml.CNOT(wires=[0, 1])
    return qml.counts()

fig, ax = qml.draw_mpl(circuit)()
display(fig)
plt.close(fig)

counts = circuit()
print(f"Results: {counts}")

fig2, ax2 = plt.subplots()
ax2.bar([f"|{k}⟩" for k in counts.keys()], counts.values(), color="#1a9c8e")
ax2.set_ylabel("Counts")
display(fig2)
plt.close(fig2)
`,
  },
  cirq_bell: {
    label: "Cirq: Bell State",
    code: `# Bell State on Cirq's built-in Simulator
import cirq
import matplotlib.pyplot as plt

q0, q1 = cirq.LineQubit.range(2)
circuit = cirq.Circuit([
    cirq.H(q0),
    cirq.CNOT(q0, q1),
    cirq.measure(q0, q1, key="result"),
])

fig, ax = plt.subplots(figsize=(6, 2))
ax.text(0.01, 0.5, str(circuit), fontfamily="monospace", fontsize=10, va="center")
ax.axis("off")
display(fig)
plt.close(fig)

simulator = cirq.Simulator()
result = simulator.run(circuit, repetitions=1000)
hist = result.histogram(key="result")
print(f"Results: {dict(hist)}")

fig2, ax2 = plt.subplots()
ax2.bar([f"|{format(k, '02b')}⟩" for k in hist.keys()], hist.values(), color="#f28c28")
ax2.set_ylabel("Counts")
display(fig2)
plt.close(fig2)
`,
  },
};

/** Cell structure for the Colab-style notebook */
function createCell(code = "", outputs = null) {
  return {
    id: Date.now() + Math.random(),
    code,
    outputs, // { images: [], text: "" }
    isRunning: false,
  };
}

export default function SandboxPage() {
  const [cells, setCells] = useState([createCell(TEMPLATES.blank.code)]);
  const { openTutor } = useAITutor();
  const [globalLoading, setGlobalLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [packages, setPackages] = useState("");
  const [installStatus, setInstallStatus] = useState(null); // { status: "loading" | "success" | "error", message: "", logs: "" }
  const [showLogs, setShowLogs] = useState(false);

  const handleInstallPackages = async () => {
    if (!packages.trim()) return;
    setInstallStatus({ status: "loading", message: "Installing...", logs: "" });
    setShowLogs(true);
    try {
      const res = await installSandboxPackages(packages);
      setInstallStatus({ status: "success", message: res.message || "Packages installed!", logs: res.logs || "" });
      
      // Browser alert as requested by Sir
      window.alert("Packages installed successfully!");
      
      setTimeout(() => setInstallStatus(null), 8000); // Give them time to read success
    } catch (err) {
      setInstallStatus({ 
        status: "error", 
        message: err.response?.data?.error || "Installation failed",
        logs: err.response?.data?.logs || "" 
      });
    }
  };

  const updateCellCode = useCallback((cellId, code) => {
    setCells((prev) =>
      prev.map((c) => (c.id === cellId ? { ...c, code } : c))
    );
  }, []);

  const addCell = useCallback((afterId = null) => {
    setCells((prev) => {
      const newCell = createCell("");
      if (afterId === null) return [...prev, newCell];
      const idx = prev.findIndex((c) => c.id === afterId);
      const next = [...prev];
      next.splice(idx + 1, 0, newCell);
      return next;
    });
  }, []);

  const removeCell = useCallback((cellId) => {
    setCells((prev) => {
      if (prev.length <= 1) return prev; // Keep at least one cell
      return prev.filter((c) => c.id !== cellId);
    });
  }, []);

  const runCell = useCallback(async (cellId) => {
    const targetIndex = cells.findIndex((c) => c.id === cellId);
    if (targetIndex === -1) return;
    
    const cell = cells[targetIndex];
    if (!cell.code.trim()) return;

    // Collect all cells up to the target cell
    const cellsToRun = cells.slice(0, targetIndex + 1).map(c => c.code);

    setCells((prev) =>
      prev.map((c) =>
        c.id === cellId ? { ...c, isRunning: true, outputs: null } : c
      )
    );

    try {
      const data = await runSandboxCode({ cells: cellsToRun });
      
      // The result for our target cell will be the LAST item in data.results
      const targetOutput = data.results[data.results.length - 1] || {};
      
      setCells((prev) =>
        prev.map((c) =>
          c.id === cellId
            ? {
                ...c,
                isRunning: false,
                outputs: {
                  images: targetOutput.images || [],
                  text: targetOutput.console || targetOutput.text || "",
                  error: targetOutput.errorText || data.error || null,
                },
              }
            : c
        )
      );
    } catch (err) {
      setCells((prev) =>
        prev.map((c) =>
          c.id === cellId
            ? {
                ...c,
                isRunning: false,
                outputs: {
                  images: [],
                  text: "",
                  error: err.message || "Execution failed. Make sure the backend is running.",
                },
              }
            : c
        )
      );
    }
  }, [cells]);

  const runAllCells = useCallback(async () => {
    setGlobalLoading(true);
    // Send all cells as an array
    const cellsToRun = cells.map((c) => c.code);

    try {
      const data = await runSandboxCode({ cells: cellsToRun });
      // We receive data.results containing outputs for EACH cell!
      setCells((prev) =>
        prev.map((c, i) => {
          const out = data.results[i] || {};
          return {
            ...c,
            outputs: {
              images: out.images || [],
              text: out.console || out.text || "",
              error: out.errorText || (i === prev.length - 1 ? data.error : null),
            },
          };
        })
      );
    } catch (err) {
      setCells((prev) =>
        prev.map((c, i) =>
          i === prev.length - 1
            ? {
                ...c,
                outputs: {
                  images: [],
                  text: "",
                  error: err.message || "Execution failed.",
                },
              }
            : c
        )
      );
    } finally {
      setGlobalLoading(false);
    }
  }, [cells]);

  const loadTemplate = useCallback((templateKey) => {
    const template = TEMPLATES[templateKey];
    if (template) {
      setCells([createCell(template.code)]);
    }
  }, []);

  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();

    if (file.name.endsWith(".ipynb")) {
      // Parse notebook JSON and extract code cells
      try {
        const nb = JSON.parse(text);
        const codeCells = nb.cells
          .filter((c) => c.cell_type === "code")
          .map((c) => createCell(Array.isArray(c.source) ? c.source.join("") : c.source));
        if (codeCells.length > 0) {
          setCells(codeCells);
        }
      } catch {
        alert("Failed to parse .ipynb file");
      }
    } else {
      // Plain .py file
      setCells([createCell(text)]);
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-app-base)]" data-lenis-prevent="true">
      <Loading visible={globalLoading} message="Executing all cells..." />

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xs font-extrabold text-[var(--color-app-text-main)] flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-app-accent)] to-[var(--color-app-accent-hover)]">
                  <svg className="h-5 w-5 text-[var(--color-app-base)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                Quantum Sandbox
              </h1>
              <p className="mt-1 text-xs text-[var(--color-app-text-muted)]">
                Write, execute, and visualize your own quantum circuits — like Google Colab for quantum computing.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Run All */}
              <button
                onClick={runAllCells}
                disabled={globalLoading}
                className="rounded-lg bg-gradient-to-r from-[var(--color-app-primary)] to-[var(--color-app-primary-hover)] px-4 py-2 text-xs font-bold text-[var(--color-app-base)] hover:shadow-lg hover:shadow-[rgba(0,212,255,0.2)] transition-all disabled:opacity-50"
              >
                ▶▶ Run All
              </button>
            </div>
          </div>

          {/* Package Installer */}
          <div className="mb-4 app-glass p-3 rounded-lg border border-[var(--color-app-border)]">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[var(--color-app-text-main)] uppercase tracking-wider">
                Dependencies
              </span>
              <input
                type="text"
                value={packages}
                onChange={(e) => setPackages(e.target.value)}
                placeholder="e.g. tensorflow, pytorch"
                className="flex-1 rounded-md bg-[var(--color-app-surface)] px-3 py-1.5 text-xs text-[var(--color-app-text-main)] outline-none border border-[var(--color-app-border-light)] focus:border-[var(--color-app-primary)] transition"
              />
              <button
                onClick={handleInstallPackages}
                disabled={!packages.trim() || installStatus?.status === "loading"}
                className="rounded-md bg-[var(--color-app-surface-hover)] px-4 py-1.5 text-xs font-bold text-[var(--color-app-text-light)] hover:bg-[var(--color-app-primary)] hover:text-white transition-all disabled:opacity-50 border border-[var(--color-app-border-light)] hover:border-transparent flex items-center gap-2"
              >
                {installStatus?.status === "loading" && (
                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Install
              </button>
              {installStatus?.status === "success" && (
                <span className="text-xs font-medium text-[var(--color-app-success)] flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  {installStatus.message}
                </span>
              )}
              {installStatus?.status === "error" && (
                <span className="text-xs font-medium text-[var(--color-app-error)] flex items-center gap-1 max-w-[200px] truncate" title={installStatus.message}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  Error
                </span>
              )}
              {installStatus?.logs && (
                <button 
                  onClick={() => setShowLogs(!showLogs)}
                  className="text-[10px] underline text-[var(--color-app-text-muted)] hover:text-[var(--color-app-primary)] transition"
                >
                  {showLogs ? "Hide Logs" : "Show Logs"}
                </button>
              )}
            </div>
            <p className="mt-2 text-[10px] text-[var(--color-app-text-muted)]">
              <span className="font-semibold">Pre-installed:</span> qiskit, qiskit-aer, pennylane, cirq, numpy, scipy, pandas, matplotlib, scikit-learn, sympy, networkx
            </p>
            {showLogs && installStatus?.logs && (
              <div className="mt-2 bg-[#0d1117] border border-[var(--color-app-border-light)] p-2 rounded text-[10px] font-mono text-[var(--color-app-text-main)] max-h-32 overflow-y-auto whitespace-pre-wrap">
                {installStatus.logs}
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Templates */}
            <div className="flex items-center gap-1 app-glass rounded-lg px-2 py-1.5">
              <span className="text-xs uppercase tracking-wider text-[var(--color-app-text-muted)] mr-1 font-bold">Templates:</span>
              {Object.entries(TEMPLATES).map(([key, tmpl]) => (
                <button
                  key={key}
                  onClick={() => loadTemplate(key)}
                  className="rounded-md bg-[var(--color-app-surface-hover)] px-2.5 py-1 text-xs font-medium text-[var(--color-app-text-light)] hover:bg-[var(--color-app-surface-alt)] hover:text-[var(--color-app-primary)] transition border border-[var(--color-app-border)]"
                >
                  {tmpl.label}
                </button>
              ))}
            </div>

            <button
              onClick={() =>
  openTutor(
    "Review my code — point out bugs and possible optimizations.",
    {
      source: "sandbox",
      page: "Quantum Sandbox",
      code: cells.map((c) => c.code).join("\n\n# ---\n\n"),
    }
  )
}
              className="rounded-lg px-3 py-1.5 text-xs font-bold transition-colors"
              style={{ border: "1px solid var(--color-app-primary)", color: "var(--color-app-primary)" }}
            >
              ✨ Ask AI Tutor
            </button>

            {/* Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".py,.ipynb"
              onChange={handleFileUpload}
              className="hidden"
              id="sandbox-file-upload"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-[var(--color-app-border-light)] bg-[var(--color-app-surface-hover)] px-3 py-1.5 text-xs font-medium text-[var(--color-app-text-light)] hover:bg-[var(--color-app-surface-alt)] hover:text-[var(--color-app-accent)] transition flex items-center gap-1.5"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload .py / .ipynb
            </button>
          </div>
        </header>

        <div className="app-gradient-line mb-6" />

        {/* Cells */}
        <div className="space-y-4">
          {cells.map((cell, index) => (
            <CellBlock
              key={cell.id}
              cell={cell}
              index={index}
              onCodeChange={(code) => updateCellCode(cell.id, code)}
              onRun={() => runCell(cell.id)}
              onAddBelow={() => addCell(cell.id)}
              onRemove={() => removeCell(cell.id)}
              canRemove={cells.length > 1}
            />
          ))}
        </div>

        {/* Add Cell Button */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => addCell()}
            className="rounded-lg border border-dashed border-[var(--color-app-border-light)] px-6 py-2 text-xs text-[var(--color-app-text-muted)] hover:border-[var(--color-app-primary)]/40 hover:text-[var(--color-app-primary)] transition"
          >
            + Add Code Cell
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Cell Block Component ────────────────────────── */

function CellBlock({ cell, index, onCodeChange, onRun, onAddBelow, onRemove, canRemove }) {
  const textareaRef = useRef(null);
  const [expandedImage, setExpandedImage] = useState(null);
  const lineCount = cell.code.split("\n").length;

  const handleKeyDown = (e) => {
    // Tab key inserts 4 spaces
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = textareaRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newCode = cell.code.substring(0, start) + "    " + cell.code.substring(end);
      onCodeChange(newCode);
      // Set cursor position after React re-render
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    }
    // Ctrl/Cmd + Enter runs the cell
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onRun();
    }
  };

  return (
    <div className="app-glass rounded-lg overflow-hidden group">
      {/* Cell Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-app-surface-hover)]/50 border-b border-[var(--color-app-border)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-[var(--color-app-text-muted)]">
            [{index + 1}]
          </span>
          <span className="text-xs text-[var(--color-app-text-muted)]">
            Python • {lineCount} lines
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onRun}
            disabled={cell.isRunning}
            className="rounded-md bg-[var(--color-app-primary)]/20 px-2.5 py-1 text-xs font-bold text-[var(--color-app-primary)] hover:bg-[var(--color-app-primary)]/30 transition disabled:opacity-50 flex items-center gap-1"
            title="Run cell (Ctrl+Enter)"
          >
            {cell.isRunning ? (
              <>
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Running...
              </>
            ) : (
              <>▶ Run</>
            )}
          </button>
          <button
            onClick={onAddBelow}
            className="rounded-md px-2 py-1 text-xs text-[var(--color-app-text-muted)] hover:text-[var(--color-app-text-main)] hover:bg-[var(--color-app-surface-alt)] transition"
            title="Add cell below"
          >
            +
          </button>
          {canRemove && (
            <button
              onClick={onRemove}
              className="rounded-md px-2 py-1 text-xs text-[var(--color-app-text-muted)] hover:text-[var(--color-app-error)] hover:bg-red-500/10 transition"
              title="Delete cell"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Code Editor */}
      <div className="relative flex">
        {/* Line numbers */}
        <div className="flex flex-col items-end py-3 px-2 bg-[rgba(6,13,24,0.6)] select-none border-r border-[var(--color-app-border)] min-w-[2.5rem]">
          {Array.from({ length: lineCount }, (_, i) => (
            <span key={i} className="text-xs font-mono text-[var(--color-app-text-muted)] opacity-40 leading-[1.6]">
              {i + 1}
            </span>
          ))}
        </div>

        {/* Editor */}
        <div className="flex-1 bg-[#1d1f21] p-0" style={{ fontSize: "14px", minHeight: "120px" }}>
          <Editor
            value={cell.code}
            onValueChange={code => onCodeChange(code)}
            highlight={code => Prism.highlight(code, Prism.languages.python, 'python')}
            padding={12}
            onKeyDown={handleKeyDown}
            style={{
              fontFamily: 'var(--font-mono)',
              lineHeight: "1.6",
              minHeight: "120px",
              color: "#c5c8c6"
            }}
            textareaClassName="focus:outline-none"
          />
        </div>
      </div>

      {/* Output Area */}
      {cell.outputs && (
        <div className="border-t border-[var(--color-app-border)] bg-[rgba(6,13,24,0.4)]">
          {/* Error */}
          {cell.outputs.error && (
            <div className="px-4 py-3 text-xs font-mono text-[var(--color-app-error)] bg-red-500/5">
              <span className="font-bold">Error: </span>
              {cell.outputs.error}
            </div>
          )}

          {/* Text output */}
          {cell.outputs.text && (
            <div className="px-4 py-3 text-xs font-mono text-[var(--color-app-success)] leading-relaxed">
              {cell.outputs.text.split("\n").map((line, i) => (
                <div key={i}>{line || "\u00A0"}</div>
              ))}
            </div>
          )}

          {/* Image outputs */}
          {cell.outputs.images?.length > 0 && (
            <div className="p-4 space-y-4">
              {cell.outputs.images.map((img, i) => {
                const imgSrc = img.startsWith("data:image") ? img : `data:image/png;base64,${img}`;
                return (
                  <div 
                    key={i} 
                    className="flex flex-col items-center justify-center bg-white/95 rounded-lg p-3 cursor-zoom-in group"
                    onClick={() => setExpandedImage(imgSrc)}
                    title="Click to expand"
                  >
                    <img
                      src={imgSrc}
                      alt={`Output ${i + 1}`}
                      className="max-w-full h-auto rounded transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                    <p className="mt-2 text-[10px] text-gray-400 group-hover:text-gray-600 transition-colors">
                      Click image to expand
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {expandedImage && (
        <ImageLightbox
          src={expandedImage}
          alt="Sandbox Output Full View"
          onClose={() => setExpandedImage(null)}
        />
      )}
    </div>
  );
}
