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

const { evaluateTimeline, evaluateNoisyTimeline } = require("../services/timelineService");
const { saveTimeline, getTimeline, saveNoisyTimeline } = require("../services/timelineStorage");

const TIMELINE_SUPPORTED_GATES = new Set([
  "I", "H", "X", "Y", "Z", "S", "T", "SX", "SDG", "TDG", "CX", "SWAP", "M"
]);
const TIMELINE_TWO_QUBIT_GATES = new Set(["CX", "SWAP"]);

/**
 * POST /api/circuit/timeline
 * Evaluates a circuit gate-by-gate for timeline playback.
 * Body: { numQubits: number, gates: [{ type, wire, target? }] }
 */
async function getCircuitTimeline(req, res) {
  try {
    const { numQubits, gates } = req.body || {};

    // 1. Validate numQubits
    if (
      typeof numQubits !== "number" ||
      !Number.isInteger(numQubits) ||
      numQubits < 1 ||
      numQubits > 8
    ) {
      return res.status(400).json({
        success: false,
        error: "numQubits must be an integer between 1 and 8 inclusive.",
      });
    }

    // 2. Validate gates array
    if (!Array.isArray(gates)) {
      return res.status(400).json({
        success: false,
        error: "gates must be an array.",
      });
    }

    if (gates.length > 30) {
      return res.status(400).json({
        success: false,
        error: "Circuit exceeds maximum limit of 30 gates.",
      });
    }

    // 3. Validate each gate
    const sanitizedGates = [];
    for (let idx = 0; idx < gates.length; idx++) {
      const g = gates[idx];
      if (!g || typeof g !== "object") {
        return res.status(400).json({
          success: false,
          error: `Gate at index ${idx} must be an object.`,
        });
      }

      if (!g.type || typeof g.type !== "string") {
        return res.status(400).json({
          success: false,
          error: `Gate at index ${idx} is missing a valid type string.`,
        });
      }

      const type = g.type.toUpperCase().trim();
      if (!TIMELINE_SUPPORTED_GATES.has(type)) {
        return res.status(400).json({
          success: false,
          error: `Gate at index ${idx} has unsupported type '${g.type}'. Supported gates: ${Array.from(TIMELINE_SUPPORTED_GATES).join(", ")}`,
        });
      }

      const wire = g.wire !== undefined ? g.wire : g.qubit;
      if (typeof wire !== "number" || !Number.isInteger(wire) || wire < 0 || wire >= numQubits) {
        return res.status(400).json({
          success: false,
          error: `Gate at index ${idx} (${type}) specifies invalid wire ${wire}. Must be between 0 and ${numQubits - 1}.`,
        });
      }

      let target = null;
      if (TIMELINE_TWO_QUBIT_GATES.has(type)) {
        if (
          typeof g.target !== "number" ||
          !Number.isInteger(g.target) ||
          g.target < 0 ||
          g.target >= numQubits
        ) {
          return res.status(400).json({
            success: false,
            error: `Two-qubit gate ${type} at index ${idx} requires target between 0 and ${numQubits - 1}.`,
          });
        }
        if (g.target === wire) {
          return res.status(400).json({
            success: false,
            error: `Two-qubit gate ${type} at index ${idx} cannot have identical control and target wire (${wire}).`,
          });
        }
        target = g.target;
      } else {
        if (g.target !== undefined && g.target !== null) {
          return res.status(400).json({
            success: false,
            error: `Target qubit cannot be specified for single-qubit gate ${type} at index ${idx}.`,
          });
        }
      }

      const sanitizedGate = {
        type,
        wire,
        target,
      };
      if (typeof g.layerIndex === "number") {
        sanitizedGate.layerIndex = g.layerIndex;
      }
      sanitizedGates.push(sanitizedGate);
    }

    // 4. Evaluate circuit timeline
    const result = await evaluateTimeline({
      numQubits,
      gates: sanitizedGates,
    });

    // 5. Store verified timeline server-side and attach bearer capability timelineId
    const timelineId = saveTimeline(result);

    return res.status(200).json({
      ...result,
      timelineId,
    });
  } catch (error) {
    console.error("[CircuitController] Timeline evaluation failure:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error during timeline evaluation.",
    });
  }
}

const SUPPORTED_NOISE_MODELS = new Set(["depolarizing", "phase_flip", "bit_flip", "readout"]);

/**
 * POST /api/circuit/noisy-timeline
 * Evaluates a noisy circuit timeline against a verified ideal timeline.
 * Body: { timelineId: string, noiseModel: string, noiseStrength: number }
 */
async function getNoisyCircuitTimeline(req, res) {
  try {
    const { timelineId, noiseModel, noiseStrength } = req.body || {};

    // 1. Validate timelineId
    if (!timelineId || typeof timelineId !== "string" || !timelineId.trim()) {
      return res.status(400).json({
        success: false,
        error: "timelineId must be a valid non-empty string.",
      });
    }

    // 2. Retrieve verified ideal timeline
    const idealTimeline = getTimeline(timelineId.trim());
    if (!idealTimeline || !Array.isArray(idealTimeline.steps)) {
      return res.status(404).json({
        success: false,
        error: "Timeline not found or expired. Please rerun circuit evaluation.",
      });
    }

    // 3. Validate noiseModel
    if (!noiseModel || typeof noiseModel !== "string") {
      return res.status(400).json({
        success: false,
        error: "noiseModel string is required.",
      });
    }

    const normalizedModel = noiseModel.toLowerCase().trim();
    if (!SUPPORTED_NOISE_MODELS.has(normalizedModel)) {
      return res.status(400).json({
        success: false,
        error: `Unsupported noise model '${noiseModel}'. Supported: ${Array.from(SUPPORTED_NOISE_MODELS).join(", ")}.`,
      });
    }

    // 4. Validate noiseStrength (0.0 <= p <= 1.0)
    const strength = Number(noiseStrength);
    if (typeof strength !== "number" || Number.isNaN(strength) || strength < 0.0 || strength > 1.0) {
      return res.status(400).json({
        success: false,
        error: "noiseStrength must be a valid number between 0.0 and 1.0 inclusive.",
      });
    }

    // 5. Extract authoritative gates from ideal timeline
    const gates = idealTimeline.steps
      .slice(1)
      .map((s) => s.appliedGate)
      .filter(Boolean);

    // 6. Run exact noisy timeline evaluator
    const noisyResult = await evaluateNoisyTimeline({
      numQubits: idealTimeline.numQubits,
      gates,
      noiseModel: normalizedModel,
      noiseStrength: strength,
    });

    // 7. Store verified noisy timeline linked to parent timelineId
    const noisyTimelineId = saveNoisyTimeline({
      ...noisyResult,
      timelineId,
    });

    return res.status(200).json({
      success: true,
      noisyTimelineId,
      timelineId,
      totalSteps: noisyResult.totalSteps,
      steps: noisyResult.steps,
      divergenceSummary: noisyResult.divergenceSummary,
    });
  } catch (error) {
    console.error("[CircuitController] Noisy timeline evaluation failure:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error during noisy timeline evaluation.",
    });
  }
}

module.exports = {
  exportQasm,
  importQasm,
  getCircuitTimeline,
  getNoisyCircuitTimeline,
};

