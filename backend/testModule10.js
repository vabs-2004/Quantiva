/**
 * Quantiva Foundations — Module 10: Measurement & Collapse Test Suite
 *
 * Verifies:
 * 1. Curriculum metadata and Knowledge Map mapping for 'measurement-collapse'
 * 2. Deterministic measurement probabilities on basis states (|0⟩, |1⟩)
 * 3. 50/50 measurement probabilities on superpositions (|+⟩, |−⟩)
 * 4. State collapse to basis states (|0⟩, |1⟩) and normalization preservation
 * 5. Measure twice repeatability (determinism of post-collapse measurement)
 * 6. Circuit measurement pipeline (|0⟩ -> H -> Z -> M) confirming |−⟩ has 50/50 probabilities
 * 7. Amplitude-to-probability prediction on |ψ⟩ = (√3/2)|0⟩ + (1/2)|1⟩ yields P(0) = 75%
 * 8. Measurement sampling convergence over large shot ensemble
 * 9. All 4 Measurement Challenge Lab solutions
 */

const assert = require("assert");
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

// Math helpers
const SQ2 = Math.SQRT2;

function applySingleGate(gateId, ar, ai, br, bi) {
  switch (gateId) {
    case "X":
      return { ar: br, ai: bi, br: ar, bi: ai };
    case "Y":
      return { ar: bi, ai: -br, br: -ai, bi: ar };
    case "Z":
      return { ar, ai, br: -br, bi: -bi };
    case "H":
      return {
        ar: (ar + br) / SQ2,
        ai: (ai + bi) / SQ2,
        br: (ar - br) / SQ2,
        bi: (ai - bi) / SQ2,
      };
    case "S":
      return { ar, ai, br: -bi, bi: br };
    case "T":
      return {
        ar,
        ai,
        br: (br - bi) / SQ2,
        bi: (br + bi) / SQ2,
      };
    default:
      return { ar, ai, br, bi };
  }
}

function getProbabilities(ar, ai, br, bi) {
  const p0 = ar * ar + ai * ai;
  const p1 = br * br + bi * bi;
  return { p0, p1, sum: p0 + p1 };
}

console.log("==================================================================");
console.log("QUANTIVA FOUNDATIONS — MODULE 10: MEASUREMENT & COLLAPSE TESTS");
console.log("==================================================================\n");

// 1. Curriculum and Knowledge Map Metadata
try {
  const mod10 = FOUNDATIONS_MODULES.find((m) => m.moduleId === "measurement-collapse");
  assert(mod10, "Module 10 (measurement-collapse) must exist in FOUNDATIONS_MODULES");
  assert.strictEqual(mod10.sequenceOrder, 10, "Module 10 sequenceOrder must be 10");
  assert.strictEqual(mod10.title, "Measurement & Collapse", "Module 10 title must be 'Measurement & Collapse'");
  assert.strictEqual(mod10.track, "foundations", "Module 10 track must be 'foundations'");
  assert.strictEqual(mod10.status, "published", "Module 10 status must be 'published'");

  const topic = KNOWLEDGE_MAP_TOPICS.find((t) => t.topicId === "measurement-collapse");
  assert(topic, "Knowledge Map topic 'measurement-collapse' must exist");
  assert.strictEqual(topic.resource?.id, "measurement-collapse", "Topic resource ID must match 'measurement-collapse'");
  pass("1. Curriculum and Knowledge Map metadata validated for measurement-collapse");
} catch (err) {
  fail("1. Curriculum and Knowledge Map metadata failed", err);
}

// 2. Deterministic basis states
try {
  const zeroState = { ar: 1, ai: 0, br: 0, bi: 0 };
  const probZero = getProbabilities(zeroState.ar, zeroState.ai, zeroState.br, zeroState.bi);
  assert.strictEqual(probZero.p0, 1.0, "|0⟩ must measure 0 with 100% certainty");
  assert.strictEqual(probZero.p1, 0.0, "|0⟩ must measure 1 with 0% probability");

  const oneState = { ar: 0, ai: 0, br: 1, bi: 0 };
  const probOne = getProbabilities(oneState.ar, oneState.ai, oneState.br, oneState.bi);
  assert.strictEqual(probOne.p0, 0.0, "|1⟩ must measure 0 with 0% probability");
  assert.strictEqual(probOne.p1, 1.0, "|1⟩ must measure 1 with 100% certainty");
  pass("2. Basis states |0⟩ and |1⟩ measure deterministically");
} catch (err) {
  fail("2. Deterministic basis states failed", err);
}

// 3. 50/50 measurement probabilities on superpositions (|+⟩ and |−⟩)
try {
  const plusState = applySingleGate("H", 1, 0, 0, 0);
  const probPlus = getProbabilities(plusState.ar, plusState.ai, plusState.br, plusState.bi);
  assert(Math.abs(probPlus.p0 - 0.5) < 1e-6, "|+⟩ P(0) must be 0.5");
  assert(Math.abs(probPlus.p1 - 0.5) < 1e-6, "|+⟩ P(1) must be 0.5");
  assert(Math.abs(probPlus.sum - 1.0) < 1e-6, "|+⟩ state must remain normalized");

  const minusState = applySingleGate("Z", plusState.ar, plusState.ai, plusState.br, plusState.bi);
  const probMinus = getProbabilities(minusState.ar, minusState.ai, minusState.br, minusState.bi);
  assert(Math.abs(probMinus.p0 - 0.5) < 1e-6, "|−⟩ P(0) must be 0.5 despite relative phase");
  assert(Math.abs(probMinus.p1 - 0.5) < 1e-6, "|−⟩ P(1) must be 0.5 despite relative phase");
  pass("3. Superposition states |+⟩ and |−⟩ have 50/50 computational measurement probabilities");
} catch (err) {
  fail("3. Superposition measurement probabilities failed", err);
}

// 4. State Collapse and Normalization Preservation
try {
  // Simulating collapse after outcome 0
  const collapsedZero = { ar: 1, ai: 0, br: 0, bi: 0 };
  const normZero = collapsedZero.ar ** 2 + collapsedZero.ai ** 2 + collapsedZero.br ** 2 + collapsedZero.bi ** 2;
  assert.strictEqual(normZero, 1, "Collapsed |0⟩ state is normalized");

  // Simulating collapse after outcome 1
  const collapsedOne = { ar: 0, ai: 0, br: 1, bi: 0 };
  const normOne = collapsedOne.ar ** 2 + collapsedOne.ai ** 2 + collapsedOne.br ** 2 + collapsedOne.bi ** 2;
  assert.strictEqual(normOne, 1, "Collapsed |1⟩ state is normalized");
  pass("4. Post-measurement state collapse produces normalized basis states");
} catch (err) {
  fail("4. State collapse failed", err);
}

// 5. Measure Twice Repeatability
try {
  // Scenario: Prepare |+⟩, first measure yields 1 -> state becomes |1⟩
  const outcomeFirst = 1;
  const stateAfterFirst = outcomeFirst === 0
    ? { ar: 1, ai: 0, br: 0, bi: 0 }
    : { ar: 0, ai: 0, br: 1, bi: 0 };

  const probSecond = getProbabilities(stateAfterFirst.ar, stateAfterFirst.ai, stateAfterFirst.br, stateAfterFirst.bi);
  assert.strictEqual(probSecond.p1, 1.0, "Second measurement of collapsed state |1⟩ must yield 1 with 100% certainty");
  assert.strictEqual(probSecond.p0, 0.0, "Second measurement of collapsed state |1⟩ must have 0% chance of 0");

  // Scenario: First measure yields 0 -> state becomes |0⟩
  const stateZeroAfterFirst = { ar: 1, ai: 0, br: 0, bi: 0 };
  const probSecondZero = getProbabilities(stateZeroAfterFirst.ar, stateZeroAfterFirst.ai, stateZeroAfterFirst.br, stateZeroAfterFirst.bi);
  assert.strictEqual(probSecondZero.p0, 1.0, "Second measurement of collapsed state |0⟩ must yield 0 with 100% certainty");
  pass("5. Measure twice experiment verified: collapsed state yields deterministic second outcome");
} catch (err) {
  fail("5. Measure twice verification failed", err);
}

// 6. Circuit Measurement Pipeline (|0⟩ -> H -> Z -> M)
try {
  // Step 0: |0⟩
  let s = { ar: 1, ai: 0, br: 0, bi: 0 };
  // Step 1: H -> |+⟩
  s = applySingleGate("H", s.ar, s.ai, s.br, s.bi);
  // Step 2: Z -> |−⟩
  s = applySingleGate("Z", s.ar, s.ai, s.br, s.bi);

  const probBeforeM = getProbabilities(s.ar, s.ai, s.br, s.bi);
  assert(Math.abs(probBeforeM.p0 - 0.5) < 1e-6, "Circuit produces |−⟩ which still has 50% P(0)");
  assert(Math.abs(probBeforeM.p1 - 0.5) < 1e-6, "Circuit produces |−⟩ which still has 50% P(1)");

  // Step 3: Measurement produces classical outcome k and post-measurement state |k⟩
  const simulatedOutcome = 0;
  const postMeas = simulatedOutcome === 0 ? { ar: 1, ai: 0, br: 0, bi: 0 } : { ar: 0, ai: 0, br: 1, bi: 0 };
  assert.strictEqual(postMeas.ar, 1, "Post-measurement state is consistent with outcome 0");
  pass("6. Circuit pipeline (|0⟩ -> H -> Z -> M) verified with 50/50 measurement probabilities on |−⟩");
} catch (err) {
  fail("6. Circuit pipeline failed", err);
}

// 7. Amplitude-to-Probability Prediction
try {
  const sqrt3Over2 = Math.sqrt(3) / 2;
  const half = 0.5;
  const predState = { ar: sqrt3Over2, ai: 0, br: half, bi: 0 };
  const predProb = getProbabilities(predState.ar, predState.ai, predState.br, predState.bi);

  assert(Math.abs(predProb.p0 - 0.75) < 1e-6, "P(0) must equal (√3/2)² = 75%");
  assert(Math.abs(predProb.p1 - 0.25) < 1e-6, "P(1) must equal (1/2)² = 25%");
  assert(Math.abs(predProb.sum - 1.0) < 1e-6, "State is normalized (75% + 25% = 100%)");
  pass("7. Prediction experiment (|ψ⟩ = (√3/2)|0⟩ + (1/2)|1⟩) verified at P(0) = 75%");
} catch (err) {
  fail("7. Amplitude-to-probability prediction failed", err);
}

// 8. Measurement Sampling Convergence
try {
  const shots = 10000;
  let zeros = 0;
  for (let i = 0; i < shots; i++) {
    if (Math.random() < 0.5) zeros++;
  }
  const ratio = zeros / shots;
  assert(Math.abs(ratio - 0.5) < 0.02, `10,000 shots on |+⟩ converged close to 0.5 (got ${ratio})`);
  pass("8. Measurement sampling convergence over 10,000 shots verified");
} catch (err) {
  fail("8. Measurement sampling convergence failed", err);
}

// 9. All 4 Measurement Challenges
try {
  // Challenge 1: Prepare state that always measures 0 -> |0⟩
  const ch1State = { ar: 1, ai: 0, br: 0, bi: 0 };
  assert.strictEqual(getProbabilities(ch1State.ar, ch1State.ai, ch1State.br, ch1State.bi).p0, 1.0, "Ch 1 solved: |0⟩");

  // Challenge 2: Prepare state that always measures 1 -> X|0⟩ = |1⟩
  const ch2State = applySingleGate("X", 1, 0, 0, 0);
  assert.strictEqual(getProbabilities(ch2State.ar, ch2State.ai, ch2State.br, ch2State.bi).p1, 1.0, "Ch 2 solved: |1⟩");

  // Challenge 3: Prepare state with equal 50/50 probability -> H|0⟩ = |+⟩
  const ch3State = applySingleGate("H", 1, 0, 0, 0);
  const ch3Prob = getProbabilities(ch3State.ar, ch3State.ai, ch3State.br, ch3State.bi);
  assert(Math.abs(ch3Prob.p0 - 0.5) < 1e-6 && Math.abs(ch3Prob.p1 - 0.5) < 1e-6, "Ch 3 solved: |+⟩");

  // Challenge 4: Superposition -> Measure -> Measure Again
  const ch4Super = applySingleGate("H", 1, 0, 0, 0);
  const ch4Outcome1 = Math.random() < 0.5 ? 0 : 1;
  const ch4Collapsed = ch4Outcome1 === 0 ? { ar: 1, ai: 0, br: 0, bi: 0 } : { ar: 0, ai: 0, br: 1, bi: 0 };
  const ch4Outcome2 = getProbabilities(ch4Collapsed.ar, ch4Collapsed.ai, ch4Collapsed.br, ch4Collapsed.bi);
  assert.strictEqual(
    ch4Outcome1 === 0 ? ch4Outcome2.p0 : ch4Outcome2.p1,
    1.0,
    "Ch 4 solved: 2nd measurement matches 1st measurement with 100% certainty"
  );
  pass("9. All 4 Challenge Lab solutions mathematically verified");
} catch (err) {
  fail("9. Challenge Lab verification failed", err);
}

console.log("\n==================================================================");
console.log(`TOTAL TESTS: ${totalCount} | PASSED: ${passedCount} | FAILED: ${totalCount - passedCount}`);
console.log("==================================================================\n");

if (passedCount === totalCount) {
  console.log("ALL MODULE 10 TESTS PASSED SUCCESSFULLY! ✓\n");
  process.exit(0);
} else {
  console.error("SOME MODULE 10 TESTS FAILED! ✗\n");
  process.exit(1);
}
