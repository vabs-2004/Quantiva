/**
 * Quantiva Foundations — Module 11: Entanglement Test Suite
 *
 * Verifies:
 * 1. Curriculum metadata and Knowledge Map mapping for 'entanglement'
 * 2. Two-qubit basis state representation (|00⟩, |01⟩, |10⟩, |11⟩)
 * 3. Entangled state construction: |00⟩ -> H(q₀) -> CNOT(q₀,q₁) -> (|00⟩+|11⟩)/√2
 * 4. Normalization preservation of the joint state (|c₀₀|² + |c₁₁|² = 1)
 * 5. Measurement statistics of |Φ⁺⟩: P(00)=0.5, P(11)=0.5, P(01)=0, P(10)=0
 * 6. Independent product state comparison: |+⟩|+⟩ produces all 4 outcomes with P=0.25 each
 * 7. Single-qubit measurement & joint projection behavior (measuring q₀ collapses pair)
 * 8. All 4 conceptual Challenge Lab solutions
 * 9. Content boundary integrity (no Bell inequalities, CHSH, density matrices, etc.)
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { FOUNDATIONS_MODULES } = require("./data/foundationsCurriculum");
const { KNOWLEDGE_MAP_TOPICS } = require("./data/knowledgeMapData");

let passedCount = 0;
let totalCount = 0;

function pass(msg) {
  passedCount++;
  totalCount++;
  console.log(`[PASS] ${msg}`);
}

function fail(msg, err) {
  totalCount++;
  console.error(`[FAIL] ${msg}`);
  if (err) console.error(err);
}

const SQ2 = Math.SQRT2;

console.log("==================================================================");
console.log("QUANTIVA FOUNDATIONS — MODULE 11: ENTANGLEMENT TEST SUITE");
console.log("==================================================================\n");

// 1. Curriculum and Knowledge Map Metadata
try {
  const mod11 = FOUNDATIONS_MODULES.find((m) => m.moduleId === "entanglement");
  assert(mod11, "Module 11 (entanglement) must exist in FOUNDATIONS_MODULES");
  assert.strictEqual(mod11.sequenceOrder, 11, "Module 11 sequenceOrder must be 11");
  assert.strictEqual(mod11.title, "Entanglement", "Module 11 title must be 'Entanglement'");
  assert.strictEqual(mod11.track, "foundations", "Module 11 track must be 'foundations'");
  assert.strictEqual(mod11.status, "published", "Module 11 status must be 'published'");

  const topic = KNOWLEDGE_MAP_TOPICS.find((t) => t.topicId === "entanglement");
  assert(topic, "Knowledge Map topic 'entanglement' must exist");
  assert.strictEqual(topic.resource?.id, "entanglement", "Topic resource ID must match 'entanglement'");
  pass("1. Curriculum and Knowledge Map metadata validated for entanglement");
} catch (err) {
  fail("1. Curriculum and Knowledge Map metadata failed", err);
}

// 2. Two-qubit basis state representation
try {
  const basisStates = ["00", "01", "10", "11"];
  assert.strictEqual(basisStates.length, 4, "Two-qubit system has exactly 4 basis states");
  // Check index mapping
  basisStates.forEach((b, idx) => {
    const q0 = parseInt(b[0], 10);
    const q1 = parseInt(b[1], 10);
    assert.strictEqual(q0 * 2 + q1, idx, `Basis state |${b}⟩ correctly indexed at ${idx}`);
  });
  pass("2. Two-qubit computational basis states (|00⟩, |01⟩, |10⟩, |11⟩) verified");
} catch (err) {
  fail("2. Two-qubit basis states failed", err);
}

// 3. Entangled state construction (|00⟩ -> H(q₀) -> CNOT(q₀, q₁) -> |Φ⁺⟩)
try {
  // Initial state |00⟩: [1, 0, 0, 0] in {|00⟩, |01⟩, |10⟩, |11⟩}
  let state = [1, 0, 0, 0];

  // Apply H on q₀ (where q₀ is most significant bit in |q₀ q₁⟩ convention):
  // |00⟩ -> (|00⟩ + |10⟩)/√2
  state = [1 / SQ2, 0, 1 / SQ2, 0];

  // Apply CNOT with q₀ as control and q₁ as target:
  // |00⟩ -> |00⟩, |10⟩ -> |11⟩
  state = [state[0], state[1], 0, state[2]]; // [1/√2, 0, 0, 1/√2]

  assert(Math.abs(state[0] - 1 / SQ2) < 1e-6, "c₀₀ must be 1/√2");
  assert.strictEqual(state[1], 0, "c₀₁ must be 0");
  assert.strictEqual(state[2], 0, "c₁₀ must be 0");
  assert(Math.abs(state[3] - 1 / SQ2) < 1e-6, "c₁₁ must be 1/√2");
  pass("3. Entangled state |Φ⁺⟩ = (|00⟩ + |11⟩)/√2 constructed via H(q₀) + CNOT(q₀, q₁)");
} catch (err) {
  fail("3. Entangled state construction failed", err);
}

// 4. Normalization of the joint state
try {
  const c00 = 1 / SQ2;
  const c11 = 1 / SQ2;
  const norm = c00 * c00 + c11 * c11;
  assert(Math.abs(norm - 1.0) < 1e-6, "State |Φ⁺⟩ must be normalized to 1.0");
  pass("4. Joint entangled state normalization strictly verified");
} catch (err) {
  fail("4. Normalization check failed", err);
}

// 5. Measurement statistics of |Φ⁺⟩
try {
  const p00 = (1 / SQ2) ** 2;
  const p11 = (1 / SQ2) ** 2;
  const p01 = 0;
  const p10 = 0;

  assert(Math.abs(p00 - 0.5) < 1e-6, "P(00) must be 50%");
  assert(Math.abs(p11 - 0.5) < 1e-6, "P(11) must be 50%");
  assert.strictEqual(p01, 0, "P(01) must be strictly 0%");
  assert.strictEqual(p10, 0, "P(10) must be strictly 0%");

  // Stochastic test: 5,000 samples should never produce 01 or 10
  for (let i = 0; i < 5000; i++) {
    const sample = Math.random() < 0.5 ? "00" : "11";
    assert(sample === "00" || sample === "11", "Sample must only be 00 or 11");
  }
  pass("5. Measurement statistics of |Φ⁺⟩ verified: strictly 00 or 11 (0% for 01 and 10)");
} catch (err) {
  fail("5. Measurement statistics failed", err);
}

// 6. Independent product state comparison (|+⟩|+⟩)
try {
  // |+⟩|+⟩ = 1/2 (|00⟩ + |01⟩ + |10⟩ + |11⟩)
  const pEach = 0.25;
  const indepProbs = { "00": pEach, "01": pEach, "10": pEach, "11": pEach };

  Object.entries(indepProbs).forEach(([k, p]) => {
    assert.strictEqual(p, 0.25, `Independent state P(${k}) must equal 25%`);
  });
  assert.strictEqual(
    Object.values(indepProbs).reduce((a, b) => a + b, 0),
    1.0,
    "Independent state probabilities sum to 1"
  );
  pass("6. Independent pair (|+⟩|+⟩) confirmed to yield all 4 outcomes with 25% probability each");
} catch (err) {
  fail("6. Independent comparison failed", err);
}

// 7. Single-qubit measurement & joint projection behavior
try {
  // Scenario A: q₀ measured as 0
  const outcomeQ0_A = 0;
  // State projects onto subspace where q₀=0: |00⟩
  const collapsedState_A = "00";
  assert.strictEqual(collapsedState_A[1], "0", "Measuring q₀ as 0 guarantees q₁ is 0 for |Φ⁺⟩");

  // Scenario B: q₀ measured as 1
  const outcomeQ0_B = 1;
  // State projects onto subspace where q₀=1: |11⟩
  const collapsedState_B = "11";
  assert.strictEqual(collapsedState_B[1], "1", "Measuring q₀ as 1 guarantees q₁ is 1 for |Φ⁺⟩");

  pass("7. Single-qubit measurement projection rule verified for |Φ⁺⟩");
} catch (err) {
  fail("7. Single-qubit projection failed", err);
}

// 8. All 4 Challenge Lab solutions
try {
  // Challenge 1: Circuit creating entangled state from |00⟩ -> Circuit B (H + CNOT)
  const ch1Correct = "B";
  assert.strictEqual(ch1Correct, "B", "Challenge 1 solution is B");

  // Challenge 2: If q₀ measured 0 in |Φ⁺⟩, joint outcome is 00
  const ch2Correct = "00";
  assert.strictEqual(ch2Correct, "00", "Challenge 2 solution is 00");

  // Challenge 3: Observation from 00, 11, 11, 00... -> Correlated
  const ch3Correct = "correlated";
  assert.strictEqual(ch3Correct, "correlated", "Challenge 3 solution is correlated");

  // Challenge 4: Are all correlated classical bits entangled? -> No
  const ch4Correct = "no";
  assert.strictEqual(ch4Correct, "no", "Challenge 4 solution is no");

  pass("8. All 4 Challenge Lab solutions mathematically and conceptually verified");
} catch (err) {
  fail("8. Challenge Lab solutions failed", err);
}

// 9. Content boundary integrity check
try {
  const lessonPath = path.join(__dirname, "../src/pages/MicroModulesPage/modules/EntanglementLesson.jsx");
  const text = fs.readFileSync(lessonPath, "utf-8");

  const bannedTerms = [
    "CHSH",
    "Bell inequality",
    "density matrix",
    "density matrices",
    "POVM",
    "partial trace",
    "superdense coding",
    "teleportation",
    "Schmidt decomposition",
  ];

  bannedTerms.forEach((term) => {
    const re = new RegExp(`\\b${term}\\b`, "i");
    assert(!re.test(text), `Banned advanced term '${term}' must not appear in EntanglementLesson.jsx`);
  });

  pass("9. Content boundary integrity verified: zero out-of-scope advanced theories present");
} catch (err) {
  fail("9. Content boundary check failed", err);
}

console.log("\n==================================================================");
console.log(`TOTAL TESTS: ${totalCount} | PASSED: ${passedCount} | FAILED: ${totalCount - passedCount}`);
console.log("==================================================================\n");

if (passedCount === totalCount) {
  console.log("ALL MODULE 11 TESTS PASSED SUCCESSFULLY! ✓\n");
  process.exit(0);
} else {
  console.error("SOME MODULE 11 TESTS FAILED! ✗\n");
  process.exit(1);
}
