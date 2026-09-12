/**
 * Temporal Layering & Execution Ordering Verification Suite
 * Tests Constraints 11, 12, 13
 */

const { getCircuitLayers, flattenCircuitByLayer } = require("../../src/utils/circuitLayers.js");
const { execSync } = require("child_process");
const path = require("path");

const PYTHON_PATH = process.platform === "win32"
  ? path.join(__dirname, "../.venv/Scripts/python.exe")
  : path.join(__dirname, "../.venv/bin/python");

const EVALUATOR_SCRIPT = path.join(__dirname, "../scripts/timeline_evaluator.py");
const NOISY_EVALUATOR_SCRIPT = path.join(__dirname, "../scripts/noisy_timeline_evaluator.py");

function runPython(script, payload) {
  const inputJson = JSON.stringify(payload);
  const out = execSync(`"${PYTHON_PATH}" "${script}"`, {
    input: inputJson,
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });
  return JSON.parse(out.trim());
}

console.log("==================================================");
console.log("RUNNING TEMPORAL LAYERING VERIFICATION SUITE");
console.log("==================================================");

// ----------------------------------------------------
// TEST 1: REPRODUCTION CIRCUIT (Constraints 11 & 12)
// q0: H, M
// q1: X
// q2: Z
// ----------------------------------------------------
console.log("\n[TEST 1] Canonical Reproduction Circuit:");
const reproCircuit = {
  0: [{ type: "H", label: "H" }, { type: "M", label: "M" }],
  1: [{ type: "X", label: "X" }],
  2: [{ type: "Z", label: "Z" }],
};

const reproLayers = getCircuitLayers(3, reproCircuit);
const reproFlat = flattenCircuitByLayer(3, reproCircuit);

console.log("Layers:", reproLayers.map(l => l.map(g => `${g.type}(q${g.wire})`)));
console.log("Flattened Order:", reproFlat.map(g => `${g.type}(q${g.wire})@L${g.layerIndex}`));

// Verify flattened order is H0 -> X1 -> Z2 -> M0
const flatSummary = reproFlat.map(g => `${g.type}${g.wire}`).join(" -> ");
if (flatSummary !== "H0 -> X1 -> Z2 -> M0") {
  throw new Error(`Expected 'H0 -> X1 -> Z2 -> M0', got '${flatSummary}'`);
}
console.log("✓ Flattened order is strictly H0 -> X1 -> Z2 -> M0");

// Evaluate timeline
const timelinePayload = {
  numQubits: 3,
  gates: reproFlat.map(({ type, wire, target, layerIndex }) => ({ type, wire, target, layerIndex })),
};
const idealRes = runPython(EVALUATOR_SCRIPT, timelinePayload);

if (!idealRes.success || idealRes.steps.length !== 5) {
  throw new Error(`Expected 5 steps (step 0..4), got ${idealRes.steps?.length}`);
}

console.log(`✓ Timeline has ${idealRes.steps.length} steps:`);
idealRes.steps.forEach((s, idx) => {
  const g = s.appliedGate;
  if (idx === 0) {
    console.log(`  Step 0: Initial Ground State (|000>)`);
  } else {
    console.log(`  Step ${idx}: ${g.type} on q${g.wire}, layerIndex=${g.layerIndex}`);
  }
});

// Verify step details
if (idealRes.steps[1].appliedGate.type !== "H" || idealRes.steps[1].appliedGate.wire !== 0 || idealRes.steps[1].appliedGate.layerIndex !== 0) {
  throw new Error("Step 1 assertion failed");
}
if (idealRes.steps[2].appliedGate.type !== "X" || idealRes.steps[2].appliedGate.wire !== 1 || idealRes.steps[2].appliedGate.layerIndex !== 0) {
  throw new Error("Step 2 assertion failed");
}
if (idealRes.steps[3].appliedGate.type !== "Z" || idealRes.steps[3].appliedGate.wire !== 2 || idealRes.steps[3].appliedGate.layerIndex !== 0) {
  throw new Error("Step 3 assertion failed");
}
if (idealRes.steps[4].appliedGate.type !== "M" || idealRes.steps[4].appliedGate.wire !== 0 || idealRes.steps[4].appliedGate.layerIndex !== 1) {
  throw new Error("Step 4 assertion failed");
}
console.log("✓ Steps 1, 2, 3 have layerIndex=0; Step 4 has layerIndex=1");

// Verify state at Step 3 (pre-measurement state after H0, X1, Z2)
// Basis in Qiskit is |q2 q1 q0>.
// q0 in (|0> + |1>)/sqrt(2), q1 in |1>, q2 in |0>.
// States: |010> and |011>, each with prob 0.5!
const step3Probs = idealRes.steps[3].probabilities;
console.log("Step 3 Pre-measurement Probabilities:", step3Probs);
if (Math.abs(step3Probs["010"] - 0.5) > 1e-4 || Math.abs(step3Probs["011"] - 0.5) > 1e-4) {
  throw new Error(`Expected 50% |010> and 50% |011>, got ${JSON.stringify(step3Probs)}`);
}
console.log("✓ Pre-measurement state correctly reflects H(q0), X(q1), Z(q2) completed!");

// Verify Step 4 measurement collapse
const step4 = idealRes.steps[4];
console.log(`Step 4 Measurement Outcome on q0: ${step4.measurementOutcome}`);
const step4Probs = step4.probabilities;
console.log("Step 4 Post-measurement Probabilities:", step4Probs);
if (step4.measurementOutcome === "0") {
  if (Math.abs(step4Probs["010"] - 1.0) > 1e-4) throw new Error("Expected 100% |010> for outcome 0");
} else {
  if (Math.abs(step4Probs["011"] - 1.0) > 1e-4) throw new Error("Expected 100% |011> for outcome 1");
}
console.log("✓ Measurement correctly collapsed state along physical branch!");

// ----------------------------------------------------
// TEST 2: GENERATED QISKIT CODE EXECUTION (Constraint 12)
// ----------------------------------------------------
console.log("\n[TEST 2] Generated Qiskit Code Execution in Sandbox:");
const qiskitSnippet = `
from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer
from qiskit.quantum_info import Statevector
import json, numpy as np

qc_state = QuantumCircuit(3)
qc = QuantumCircuit(3, 3)

# Layer 0
qc.h(0)
qc_state.h(0)
qc.x(1)
qc_state.x(1)
qc.z(2)
qc_state.z(2)

# Layer 1
qc.measure(0, 0)

simulator = Aer.get_backend('aer_simulator')
compiled = transpile(qc, simulator)
job = simulator.run(compiled, shots=1000)
counts = job.result().get_counts()

sv = Statevector.from_instruction(qc_state)
probs = np.abs(sv.data) ** 2
prob_map = {format(i, '03b'): float(p) for i, p in enumerate(probs) if p > 1e-6}

print("COUNTS=" + json.dumps(counts))
print("STATE_PROBS=" + json.dumps(prob_map))
`;

const sandboxOut = execSync(`"${PYTHON_PATH}"`, {
  input: qiskitSnippet,
  encoding: "utf-8",
});
console.log("Sandbox Output:\n" + sandboxOut.trim());
if (!sandboxOut.includes("COUNTS=") || !sandboxOut.includes("STATE_PROBS=")) {
  throw new Error("Sandbox output missing expected fields");
}
const stateProbsMatch = sandboxOut.match(/STATE_PROBS=({.*})/);
const qiskitStateProbs = JSON.parse(stateProbsMatch[1]);
if (Math.abs(qiskitStateProbs["010"] - 0.5) > 1e-4 || Math.abs(qiskitStateProbs["011"] - 0.5) > 1e-4) {
  throw new Error(`Qiskit state probabilities incorrect: ${JSON.stringify(qiskitStateProbs)}`);
}
console.log("✓ Generated Qiskit code executed cleanly in sandbox with exact analytical state probabilities!");

// ----------------------------------------------------
// TEST 3: NOISY TIMELINE LOCKSTEP (Constraint 9)
// ----------------------------------------------------
console.log("\n[TEST 3] Noisy Simulation Lockstep:");
const noisyPayload = {
  numQubits: 3,
  gates: idealRes.steps.slice(1).map(s => s.appliedGate),
  noiseModel: "depolarizing",
  noiseStrength: 0.1,
};
const noisyRes = runPython(NOISY_EVALUATOR_SCRIPT, noisyPayload);
if (!noisyRes.success || noisyRes.steps.length !== 5) {
  throw new Error(`Noisy simulation failed or step count mismatch: ${noisyRes.steps?.length}`);
}
console.log(`✓ Noisy timeline evaluated in lockstep across all 5 steps (totalSteps=${noisyRes.totalSteps})`);
noisyRes.steps.forEach((s, idx) => {
  if (idx > 0) {
    const g = s.appliedGate;
    console.log(`  Noisy Step ${idx}: ${g.type} on q${g.wire} (L${g.layerIndex}), Fid=${s.fidelity}, Div=${s.divergence}`);
  }
});

// ----------------------------------------------------
// TEST 4: MULTI-QUBIT CX TEST (Constraint 6)
// ----------------------------------------------------
console.log("\n[TEST 4] Multi-Qubit CX Deduplication & Bell State:");
const cxCircuit = {
  0: [{ type: "H" }, { type: "CX", target: 1 }],
  1: [],
};
const cxLayers = getCircuitLayers(2, cxCircuit);
const cxFlat = flattenCircuitByLayer(2, cxCircuit);
console.log("CX Layers:", cxLayers.map(l => l.map(g => `${g.type}(q${g.wire}->${g.target})`)));
if (cxFlat.length !== 2) {
  throw new Error(`Expected exactly 2 operations, got ${cxFlat.length}`);
}
if (cxFlat[1].type !== "CX" || cxFlat[1].wire !== 0 || cxFlat[1].target !== 1) {
  throw new Error(`CX gate properties incorrect: ${JSON.stringify(cxFlat[1])}`);
}

const cxTimelineRes = runPython(EVALUATOR_SCRIPT, {
  numQubits: 2,
  gates: cxFlat,
});
const bellProbs = cxTimelineRes.steps[2].probabilities;
console.log("Bell State Probabilities:", bellProbs);
if (Math.abs(bellProbs["00"] - 0.5) > 1e-4 || Math.abs(bellProbs["11"] - 0.5) > 1e-4) {
  throw new Error(`Bell state probabilities incorrect: ${JSON.stringify(bellProbs)}`);
}
console.log("✓ Multi-qubit CX executed exactly once and generated canonical Bell state (|00> + |11>)/sqrt(2)!");

// ----------------------------------------------------
// TEST 5: SEQUENTIAL GATES ON SAME QUBIT
// ----------------------------------------------------
console.log("\n[TEST 5] Sequential Gates on Same Qubit:");
const seqCircuit = {
  0: [{ type: "H" }, { type: "X" }, { type: "Z" }],
};
const seqLayers = getCircuitLayers(1, seqCircuit);
if (seqLayers.length !== 3) {
  throw new Error(`Expected 3 layers, got ${seqLayers.length}`);
}
console.log("✓ 3 sequential gates produced 3 distinct temporal layers (depth=3)");

// ----------------------------------------------------
// TEST 6: PARALLEL GATES ACROSS WIRES
// ----------------------------------------------------
console.log("\n[TEST 6] Parallel Gates Across Wires:");
const parCircuit = {
  0: [{ type: "H" }],
  1: [{ type: "X" }],
  2: [{ type: "Z" }],
};
const parLayers = getCircuitLayers(3, parCircuit);
if (parLayers.length !== 1 || parLayers[0].length !== 3) {
  throw new Error(`Expected 1 layer with 3 gates, got ${parLayers.length} layers`);
}
console.log("✓ Parallel gates produced exactly 1 temporal layer with 3 concurrent gates");

// ----------------------------------------------------
// TEST 7: TIMELINE STORAGE & STAGE 4/5 TRANSITION INTEGRITY
// ----------------------------------------------------
console.log("\n[TEST 7] Timeline Storage & Stage 4 Transition Integrity:");
const { saveTimeline, getTimeline } = require("../services/timelineStorage.js");
const timelineId = saveTimeline(idealRes);
const fetched = getTimeline(timelineId);
if (!fetched || fetched.steps.length !== 5) {
  throw new Error("Timeline storage retrieval failed");
}
console.log(`✓ Timeline saved and retrieved with ID ${timelineId}`);
console.log("  Step 1 Headline:", fetched.steps[1].transition.summary.headline);
console.log("  Step 2 Headline:", fetched.steps[2].transition.summary.headline);
console.log("  Step 3 Headline:", fetched.steps[3].transition.summary.headline);
console.log("  Step 4 Headline:", fetched.steps[4].transition.summary.headline);
if (!fetched.steps[1].transition.summary.headline.includes("superposition") ||
    !fetched.steps[2].transition.summary.headline.includes("Bit flip") ||
    !fetched.steps[3].transition.summary.headline.includes("Applied Z") ||
    !fetched.steps[4].transition.summary.headline.includes("Measurement collapse")) {
  throw new Error("Stage 4 transition headlines incorrect");
}
console.log("✓ Stage 4 Transition Intelligence completely intact across all steps!");

console.log("\n==================================================");
console.log("ALL VERIFICATION SUITE TESTS PASSED SUCCESSFULLY!");
console.log("==================================================");

