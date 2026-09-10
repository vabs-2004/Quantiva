/**
 * Circuit Interop Controller
 *
 * Converts between the platform's internal gate-array representation
 * (as used by the drag-and-drop builder) and OpenQASM 2.0, so circuits
 * can round-trip with external Qiskit / PennyLane / Cirq notebooks.
 */

const QASM_GATE_MAP = {
  H: "h", X: "x", Y: "y", Z: "z", S: "s", T: "t",
  SX: "sx", SDG: "sdg", TDG: "tdg", I: "id",
};

// POST /api/circuit/export-qasm
// body: { numQubits, gates: [{ type, qubit, target? }] }
function exportQasm(req, res) {
  try {
    const { numQubits, gates } = req.body;
    if (!numQubits || !Array.isArray(gates)) {
      return res.status(400).json({ error: "numQubits and gates array are required" });
    }

    let hasMeasure = gates.some((g) => g.type === "M");
    let lines = [
      "OPENQASM 2.0;",
      'include "qelib1.inc";',
      `qreg q[${numQubits}];`,
    ];
    if (hasMeasure) lines.push(`creg c[${numQubits}];`);

    for (const g of gates) {
      const qubit = Math.min(Math.max(0, parseInt(g.qubit) || 0), numQubits - 1);
      if (g.type === "M") {
        lines.push(`measure q[${qubit}] -> c[${qubit}];`);
      } else if (g.type === "CX") {
        const target = Math.min(Math.max(0, parseInt(g.target ?? (qubit + 1) % numQubits)), numQubits - 1);
        if (target !== qubit) lines.push(`cx q[${qubit}],q[${target}];`);
      } else if (g.type === "SWAP") {
        const target = Math.min(Math.max(0, parseInt(g.target ?? (qubit + 1) % numQubits)), numQubits - 1);
        if (target !== qubit) lines.push(`swap q[${qubit}],q[${target}];`);
      } else if (QASM_GATE_MAP[g.type]) {
        lines.push(`${QASM_GATE_MAP[g.type]} q[${qubit}];`);
      }
    }

    res.json({ qasm: lines.join("\n") });
  } catch (error) {
    console.error("Error exporting QASM:", error);
    res.status(500).json({ error: "Failed to export QASM" });
  }
}

const QASM_GATE_MAP_REV = Object.fromEntries(
  Object.entries(QASM_GATE_MAP).map(([k, v]) => [v, k])
);

// POST /api/circuit/import-qasm
// body: { qasm }
function importQasm(req, res) {
  try {
    const { qasm } = req.body;
    if (!qasm || typeof qasm !== "string") {
      return res.status(400).json({ error: "qasm string is required" });
    }

    const qregMatch = qasm.match(/qreg\s+q\[(\d+)\]/);
    if (!qregMatch) {
      return res.status(400).json({ error: "Could not find a qreg declaration (qreg q[n];)" });
    }
    const numQubits = parseInt(qregMatch[1], 10);
    const gates = [];

    const statementLines = qasm
      .split(";")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("OPENQASM") && !l.startsWith("include") && !l.startsWith("qreg") && !l.startsWith("creg"));

    for (const line of statementLines) {
      const measureMatch = line.match(/^measure\s+q\[(\d+)\]\s*->\s*c\[(\d+)\]/);
      if (measureMatch) {
        gates.push({ type: "M", qubit: parseInt(measureMatch[1], 10) });
        continue;
      }
      const twoQubitMatch = line.match(/^(cx|swap)\s+q\[(\d+)\]\s*,\s*q\[(\d+)\]/i);
      if (twoQubitMatch) {
        gates.push({
          type: twoQubitMatch[1].toUpperCase(),
          qubit: parseInt(twoQubitMatch[2], 10),
          target: parseInt(twoQubitMatch[3], 10),
        });
        continue;
      }
      const singleQubitMatch = line.match(/^([a-z]+)\s+q\[(\d+)\]/i);
      if (singleQubitMatch) {
        const qasmGate = singleQubitMatch[1].toLowerCase();
        const mapped = QASM_GATE_MAP_REV[qasmGate];
        if (mapped) {
          gates.push({ type: mapped, qubit: parseInt(singleQubitMatch[2], 10) });
        }
      }
    }

    res.json({ numQubits, gates });
  } catch (error) {
    console.error("Error importing QASM:", error);
    res.status(500).json({ error: "Failed to parse QASM" });
  }
}

module.exports = { exportQasm, importQasm };
