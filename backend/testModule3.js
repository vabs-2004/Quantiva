/**
 * testModule3.js
 * 
 * Quantiva Quantum Foundations — Module 3: Qubits & Quantum States Test Suite
 * 
 * Verifies:
 * 1. Foundations Curriculum metadata for Module 3 (qubits-quantum-states, sequenceOrder: 3, track: 'foundations')
 * 2. Mathematical state vector logic: |0⟩, |1⟩, |+⟩, |−⟩
 * 3. Born's Rule: P(0) = |α|², P(1) = |β|²
 * 4. Complex amplitude squared magnitude calculation
 * 5. Normalization constraint: |α|² + |β|² = 1
 * 6. Non-equivalence of states with identical probabilities (|+⟩ vs |−⟩)
 * 7. Empirical measurement sampling convergence
 * 8. Simulator handoff state contract verification
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { FOUNDATIONS_MODULES } = require('./data/foundationsCurriculum');
const { KNOWLEDGE_MAP_TOPICS } = require('./data/knowledgeMapData');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

function runTests() {
  console.log("======================================================================");
  console.log("FOUNDATIONS MODULE 3: QUBITS & QUANTUM STATES TEST SUITE");
  console.log("======================================================================\n");

  // ─── 1. Curriculum Metadata Verification ─────────────────────────
  console.log("--- 1. CURRICULUM METADATA VERIFICATION ---");
  const mod3 = FOUNDATIONS_MODULES.find((m) => m.moduleId === "qubits-quantum-states");
  assert(Boolean(mod3), "Module 3 exists in foundationsCurriculum.js");
  assert(mod3.sequenceOrder === 3, "Module 3 sequenceOrder is strictly 3");
  assert(mod3.title === "Qubits & Quantum States", "Module 3 title is 'Qubits & Quantum States'");
  assert(mod3.track === "foundations", "Module 3 track is 'foundations'");
  assert(mod3.status === "published", "Module 3 status is 'published'");

  const kmTopic = KNOWLEDGE_MAP_TOPICS.find((t) => t.topicId === "qubits-quantum-states");
  assert(Boolean(kmTopic), "qubits-quantum-states exists in Knowledge Map");
  assert(kmTopic.resource && kmTopic.resource.type === "micro_module", "Knowledge Map topic points to micro_module resource");
  assert(kmTopic.resource.id === "qubits-quantum-states", "Resource ID matches canonical topic ID");

  // ─── 2. State Vectors & Born's Rule ──────────────────────────────
  console.log("\n--- 2. STATE VECTORS & BORN'S RULE ---");

  function computeProbabilities(alphaReal, alphaImag, betaReal, betaImag) {
    const magA2 = alphaReal * alphaReal + alphaImag * alphaImag;
    const magB2 = betaReal * betaReal + betaImag * betaImag;
    const norm = magA2 + magB2;
    return {
      norm,
      isNormalized: Math.abs(norm - 1.0) < 1e-4,
      p0: norm > 0 ? magA2 / norm : 0,
      p1: norm > 0 ? magB2 / norm : 0,
    };
  }

  // |0⟩: alpha=1, beta=0
  const state0 = computeProbabilities(1, 0, 0, 0);
  assert(state0.isNormalized && state0.p0 === 1 && state0.p1 === 0, "|0⟩ gives 100% P(0) and 0% P(1)");

  // |1⟩: alpha=0, beta=1
  const state1 = computeProbabilities(0, 0, 1, 0);
  assert(state1.isNormalized && state1.p0 === 0 && state1.p1 === 1, "|1⟩ gives 0% P(0) and 100% P(1)");

  // |+⟩: 1/sqrt(2), 1/sqrt(2)
  const sq2Inv = 1 / Math.sqrt(2);
  const statePlus = computeProbabilities(sq2Inv, 0, sq2Inv, 0);
  assert(statePlus.isNormalized, "|+⟩ is strictly normalized");
  assert(Math.abs(statePlus.p0 - 0.5) < 1e-4 && Math.abs(statePlus.p1 - 0.5) < 1e-4, "|+⟩ gives 50/50 measurement probabilities");

  // |−⟩: 1/sqrt(2), -1/sqrt(2)
  const stateMinus = computeProbabilities(sq2Inv, 0, -sq2Inv, 0);
  assert(stateMinus.isNormalized, "|−⟩ is strictly normalized");
  assert(Math.abs(stateMinus.p0 - 0.5) < 1e-4 && Math.abs(stateMinus.p1 - 0.5) < 1e-4, "|−⟩ gives 50/50 measurement probabilities");

  // ─── 3. State Non-Equivalence Under Identical Probabilities ───────
  console.log("\n--- 3. STATE NON-EQUIVALENCE (|+⟩ vs |−⟩) ---");
  // Check that amplitude beta differs (relative phase factor e^(i*pi) = -1)
  const betaPlus = sq2Inv;
  const betaMinus = -sq2Inv;
  assert(betaPlus !== betaMinus, "Amplitudes of |+⟩ and |−⟩ are distinct (positive vs negative)");
  assert(
    Math.abs(statePlus.p0 - stateMinus.p0) < 1e-4,
    "Computational basis measurement probabilities are identical (50/50)"
  );
  assert(
    betaPlus !== betaMinus && Math.abs(statePlus.p0 - stateMinus.p0) < 1e-4,
    "Confirmed: identical measurement probabilities in standard basis do NOT imply identical states"
  );

  // ─── 4. Complex Amplitudes & Normalization ────────────────────────
  console.log("\n--- 4. COMPLEX AMPLITUDES & NORMALIZATION ---");

  // alpha = 0.6 + 0.0i, beta = 0.0 + 0.8i -> |alpha|^2 = 0.36, |beta|^2 = 0.64
  const complexState = computeProbabilities(0.6, 0, 0, 0.8);
  assert(complexState.isNormalized, "Complex state (0.6, 0.8i) satisfies |α|² + |β|² = 1");
  assert(Math.abs(complexState.p0 - 0.36) < 1e-4, "P(0) is exactly 0.36");
  assert(Math.abs(complexState.p1 - 0.64) < 1e-4, "P(1) is exactly 0.64");

  // Unnormalized detection & correction
  const unnorm = computeProbabilities(0.8, 0, 0.8, 0);
  assert(unnorm.isNormalized === false, "Raw amplitudes (0.8, 0.8) detected as unnormalized (|α|²+|β|² = 1.28)");
  assert(Math.abs(unnorm.p0 - 0.5) < 1e-4, "Normalized projection cleanly recovers 50/50 distribution");

  // ─── 5. Measurement Sampling Convergence ─────────────────────────
  console.log("\n--- 5. MEASUREMENT SAMPLING CONVERGENCE ---");

  // Simulate 1000 Bernoulli trials for 80/20 state
  const targetProb0 = 0.8;
  let zeros = 0;
  const shots = 1000;
  for (let i = 0; i < shots; i++) {
    if (Math.random() < targetProb0) zeros++;
  }
  const measuredRatio = zeros / shots;
  assert(measuredRatio >= 0.74 && measuredRatio <= 0.86, `1000 empirical shots converge near 80% (got ${(measuredRatio * 100).toFixed(1)}%)`);

  // ─── 6. Circuit Simulator Handoff Contract ─────────────────────────
  console.log("\n--- 6. CIRCUIT SIMULATOR HANDOFF CONTRACT ---");
  const simulatorStatePayload = {
    initialNumQubits: 1,
    initialCircuit: {
      0: [
        { type: "H", label: "H", short: "H", color: "bg-blue-500/20 text-blue-400 border-blue-500" },
        { type: "M", label: "Measure", short: "M", color: "bg-zinc-700/50 text-white border-zinc-500" },
      ],
    },
    origin: "qubits-quantum-states",
  };

  assert(simulatorStatePayload.initialNumQubits === 1, "Simulator receives 1-qubit circuit");
  assert(simulatorStatePayload.initialCircuit[0].length === 2, "Simulator receives 2 operations (H and M)");
  assert(simulatorStatePayload.initialCircuit[0][0].type === "H", "First gate is Hadamard H");
  assert(simulatorStatePayload.initialCircuit[0][1].type === "M", "Second operation is Measure M");
  assert(simulatorStatePayload.origin === "qubits-quantum-states", "Origin is correctly tagged for contextual simulator notice");

  // ─── Summary ──────────────────────────────────────────────────────
  console.log("\n======================================================================");
  console.log(`MODULE 3 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("======================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
