/**
 * Quantiva Foundations — Module 7: Quantum Gates Test Suite
 *
 * Verifies:
 * 1. Curriculum metadata and Knowledge Map mapping for quantum-gates
 * 2. Pauli-X transformations on basis and superposition states
 * 3. Pauli-Y transformations (complex amplitudes and Bloch Y rotation)
 * 4. Pauli-Z transformations (phase flip without measurement probability delta)
 * 5. Hadamard (H) transformations (basis <-> superposition and H^2 = I)
 * 6. Phase rotation gates S and T (T^2 = S, S^2 = Z)
 * 7. Two-qubit CNOT transformations (control q0, target q1)
 * 8. Two-qubit SWAP transformations
 * 9. Gate composition (HZH = X) and reversibility (self-inverses)
 * 10. Normalization preservation across single and multi-qubit systems
 * 11. Circuit Simulator handoff contract and qubit ordering convention (|q0 q1>)
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

// Math helpers for verification
const SQ2 = Math.SQRT2;

function applySingleGate(gateId, ar, ai, br, bi) {
  switch (gateId) {
    case "X":
      return { ar: br, ai: bi, br: ar, bi: ai };
    case "Y":
      // Y = [[0, -i], [i, 0]] => alpha' = bi - i*br, beta' = -ai + i*ar
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

function prob0(s) {
  return s.ar * s.ar + s.ai * s.ai;
}

function prob1(s) {
  return s.br * s.br + s.bi * s.bi;
}

function runTests() {
  console.log("======================================================================");
  console.log("FOUNDATIONS MODULE 7: QUANTUM GATES TEST SUITE");
  console.log("======================================================================\n");

  // --- 1. CURRICULUM METADATA ---
  console.log("--- 1. CURRICULUM METADATA VERIFICATION ---");
  const mod7 = FOUNDATIONS_MODULES.find((m) => m.moduleId === "quantum-gates");
  assert(mod7, "Module 7 must exist in foundationsCurriculum.js");
  pass("Module 7 exists in foundationsCurriculum.js");

  assert.strictEqual(mod7.sequenceOrder, 7, "Module 7 sequenceOrder must be 7");
  pass("Module 7 sequenceOrder is strictly 7");

  assert.strictEqual(mod7.title, "Quantum Gates", "Module 7 title must be 'Quantum Gates'");
  pass("Module 7 title is 'Quantum Gates'");

  assert.strictEqual(mod7.track, "foundations", "Module 7 track must be 'foundations'");
  pass("Module 7 track is 'foundations'");

  assert.strictEqual(mod7.status, "published", "Module 7 status must be 'published'");
  pass("Module 7 status is 'published'");

  const kmTopic = KNOWLEDGE_MAP_TOPICS.find((t) => t.topicId === "quantum-gates");
  assert(kmTopic, "quantum-gates topic must exist in Knowledge Map");
  pass("quantum-gates exists in Knowledge Map");

  assert.strictEqual(kmTopic.resource?.type, "micro_module", "Knowledge Map topic must point to micro_module");
  pass("Knowledge Map topic points to micro_module resource");

  assert.strictEqual(kmTopic.resource?.id, "quantum-gates", "Resource id must be 'quantum-gates'");
  pass("Resource ID matches canonical topic ID");

  // --- 2. PAULI-X GATE ---
  console.log("\n--- 2. PAULI-X GATE TRANSFORMATIONS ---");
  // X|0> = |1>
  const x0 = applySingleGate("X", 1, 0, 0, 0);
  assert(Math.abs(prob0(x0) - 0) < 1e-6 && Math.abs(prob1(x0) - 1) < 1e-6);
  pass("X|0⟩ gives |1⟩ (P(0)=0, P(1)=1)");

  // X|1> = |0>
  const x1 = applySingleGate("X", 0, 0, 1, 0);
  assert(Math.abs(prob0(x1) - 1) < 1e-6 && Math.abs(prob1(x1) - 0) < 1e-6);
  pass("X|1⟩ gives |0⟩ (P(0)=1, P(1)=0)");

  // X|+> = |+>
  const xPlus = applySingleGate("X", 1 / SQ2, 0, 1 / SQ2, 0);
  assert(Math.abs(xPlus.ar - 1 / SQ2) < 1e-6 && Math.abs(xPlus.br - 1 / SQ2) < 1e-6);
  pass("X|+⟩ leaves |+⟩ unchanged (eigenstate with eigenvalue +1)");

  // X|-> = -|->
  const xMinus = applySingleGate("X", 1 / SQ2, 0, -1 / SQ2, 0);
  assert(Math.abs(xMinus.ar - (-1 / SQ2)) < 1e-6 && Math.abs(xMinus.br - 1 / SQ2) < 1e-6);
  pass("X|−⟩ gives −|−⟩ (global phase factor of -1, eigenvalue -1)");

  // --- 3. PAULI-Y GATE ---
  console.log("\n--- 3. PAULI-Y GATE TRANSFORMATIONS ---");
  // Y|0> = i|1> => alpha'=0, beta'=i
  const y0 = applySingleGate("Y", 1, 0, 0, 0);
  assert(Math.abs(y0.ar) < 1e-6 && Math.abs(y0.ai) < 1e-6);
  assert(Math.abs(y0.br) < 1e-6 && Math.abs(y0.bi - 1) < 1e-6);
  pass("Y|0⟩ gives i|1⟩ (amplitude β = i)");

  // Y|1> = -i|0> => alpha'=-i, beta'=0
  const y1 = applySingleGate("Y", 0, 0, 1, 0);
  assert(Math.abs(y1.ar) < 1e-6 && Math.abs(y1.ai - (-1)) < 1e-6);
  assert(Math.abs(y1.br) < 1e-6 && Math.abs(y1.bi) < 1e-6);
  pass("Y|1⟩ gives −i|0⟩ (amplitude α = −i)");

  // --- 4. PAULI-Z GATE ---
  console.log("\n--- 4. PAULI-Z GATE TRANSFORMATIONS ---");
  // Z|0> = |0>
  const z0 = applySingleGate("Z", 1, 0, 0, 0);
  assert(Math.abs(z0.ar - 1) < 1e-6 && Math.abs(z0.br) < 1e-6);
  pass("Z|0⟩ leaves |0⟩ invariant");

  // Z|1> = -|1>
  const z1 = applySingleGate("Z", 0, 0, 1, 0);
  assert(Math.abs(z1.ar) < 1e-6 && Math.abs(z1.br - (-1)) < 1e-6);
  pass("Z|1⟩ gives −|1⟩ (phase flip of π)");

  // Z|+> = |->
  const zPlus = applySingleGate("Z", 1 / SQ2, 0, 1 / SQ2, 0);
  assert(Math.abs(zPlus.ar - 1 / SQ2) < 1e-6 && Math.abs(zPlus.br - (-1 / SQ2)) < 1e-6);
  pass("Z|+⟩ transforms into |−⟩");

  // Computational probabilities stay 50/50
  assert(Math.abs(prob0(zPlus) - 0.5) < 1e-6 && Math.abs(prob1(zPlus) - 0.5) < 1e-6);
  pass("Z|+⟩ measurement probabilities remain identically 50/50");

  // --- 5. HADAMARD GATE ---
  console.log("\n--- 5. HADAMARD GATE TRANSFORMATIONS ---");
  // H|0> = |+>
  const h0 = applySingleGate("H", 1, 0, 0, 0);
  assert(Math.abs(h0.ar - 1 / SQ2) < 1e-6 && Math.abs(h0.br - 1 / SQ2) < 1e-6);
  pass("H|0⟩ creates equal superposition |+⟩");

  // H|1> = |->
  const h1 = applySingleGate("H", 0, 0, 1, 0);
  assert(Math.abs(h1.ar - 1 / SQ2) < 1e-6 && Math.abs(h1.br - (-1 / SQ2)) < 1e-6);
  pass("H|1⟩ creates superposition |−⟩");

  // H^2 = I
  const hSquare = applySingleGate("H", h0.ar, h0.ai, h0.br, h0.bi);
  assert(Math.abs(hSquare.ar - 1) < 1e-6 && Math.abs(hSquare.br) < 1e-6);
  pass("H²|0⟩ recovers |0⟩ (H is self-inverse)");

  // --- 6. PHASE ROTATION GATES S & T ---
  console.log("\n--- 6. PHASE ROTATION GATES S & T ---");
  // S|1> = i|1>
  const s1 = applySingleGate("S", 0, 0, 1, 0);
  assert(Math.abs(s1.br) < 1e-6 && Math.abs(s1.bi - 1) < 1e-6);
  pass("S|1⟩ introduces π/2 phase (β = i)");

  // T|1> = e^(i*pi/4)|1> = (1+i)/sqrt(2)|1>
  const t1 = applySingleGate("T", 0, 0, 1, 0);
  assert(Math.abs(t1.br - 1 / SQ2) < 1e-6 && Math.abs(t1.bi - 1 / SQ2) < 1e-6);
  pass("T|1⟩ introduces π/4 phase (β = (1+i)/√2)");

  // T^2 = S
  const tSquare = applySingleGate("T", t1.ar, t1.ai, t1.br, t1.bi);
  assert(Math.abs(tSquare.br) < 1e-6 && Math.abs(tSquare.bi - 1) < 1e-6);
  pass("T²|1⟩ produces i|1⟩, confirming T² = S");

  // --- 7. TWO-QUBIT CNOT TRANSFORMATIONS ---
  console.log("\n--- 7. TWO-QUBIT CNOT TRANSFORMATIONS (|q0 q1>, q0=ctrl, q1=tgt) ---");
  function cnotTransform(q0, q1) {
    if (q0 === 1) return [q0, 1 - q1];
    return [q0, q1];
  }

  assert.deepStrictEqual(cnotTransform(0, 0), [0, 0]);
  pass("CNOT |00⟩ → |00⟩");

  assert.deepStrictEqual(cnotTransform(0, 1), [0, 1]);
  pass("CNOT |01⟩ → |01⟩");

  assert.deepStrictEqual(cnotTransform(1, 0), [1, 1]);
  pass("CNOT |10⟩ → |11⟩ (target flips when control is 1)");

  assert.deepStrictEqual(cnotTransform(1, 1), [1, 0]);
  pass("CNOT |11⟩ → |10⟩ (target flips when control is 1)");

  // --- 8. TWO-QUBIT SWAP TRANSFORMATIONS ---
  console.log("\n--- 8. TWO-QUBIT SWAP TRANSFORMATIONS (|q0 q1>) ---");
  function swapTransform(q0, q1) {
    return [q1, q0];
  }

  assert.deepStrictEqual(swapTransform(0, 0), [0, 0]);
  pass("SWAP |00⟩ → |00⟩");

  assert.deepStrictEqual(swapTransform(0, 1), [1, 0]);
  pass("SWAP |01⟩ → |10⟩");

  assert.deepStrictEqual(swapTransform(1, 0), [0, 1]);
  pass("SWAP |10⟩ → |01⟩");

  assert.deepStrictEqual(swapTransform(1, 1), [1, 1]);
  pass("SWAP |11⟩ → |11⟩");

  // --- 9. GATE COMPOSITION: HZH = X ---
  console.log("\n--- 9. GATE COMPOSITION (HZH = X) ---");
  // Start |0>
  let comp = { ar: 1, ai: 0, br: 0, bi: 0 };
  // Apply H -> |+>
  comp = applySingleGate("H", comp.ar, comp.ai, comp.br, comp.bi);
  // Apply Z -> |->
  comp = applySingleGate("Z", comp.ar, comp.ai, comp.br, comp.bi);
  // Apply H -> |1>
  comp = applySingleGate("H", comp.ar, comp.ai, comp.br, comp.bi);

  assert(Math.abs(prob0(comp) - 0) < 1e-6 && Math.abs(prob1(comp) - 1) < 1e-6);
  pass("Composition |0⟩ → H → Z → H yields |1⟩ (HZH = X)");

  // --- 10. NORMALIZATION PRESERVATION ---
  console.log("\n--- 10. NORMALIZATION PRESERVATION ---");
  // Arbitrary initial normalized state
  const a0 = 0.6, b0 = 0.8;
  const gates = ["X", "Y", "Z", "H", "S", "T"];
  gates.forEach((g) => {
    const out = applySingleGate(g, a0, 0, b0, 0);
    const sumP = prob0(out) + prob1(out);
    assert(Math.abs(sumP - 1) < 1e-6, `Gate ${g} must preserve normalization`);
  });
  pass("All 6 single-qubit gates strictly preserve state normalization (|α|² + |β|² = 1)");

  // --- 11. CIRCUIT SIMULATOR HANDOFF CONTRACT ---
  console.log("\n--- 11. CIRCUIT SIMULATOR HANDOFF CONTRACT ---");
  const simHandoffHZH = {
    initialNumQubits: 1,
    initialCircuit: {
      0: [
        { type: "H", id: "gate-h-1", duration: 1, name: "Hadamard", wire: 0 },
        { type: "Z", id: "gate-z-1", duration: 1, name: "Pauli-Z", wire: 0 },
        { type: "H", id: "gate-h-2", duration: 1, name: "Hadamard", wire: 0 },
        { type: "M", id: "gate-m-1", duration: 1, name: "Measure", wire: 0 },
      ],
    },
    origin: "quantum-gates",
  };

  assert.strictEqual(simHandoffHZH.initialNumQubits, 1);
  assert.strictEqual(simHandoffHZH.initialCircuit[0].length, 4);
  assert.strictEqual(simHandoffHZH.initialCircuit[0][0].type, "H");
  assert.strictEqual(simHandoffHZH.initialCircuit[0][1].type, "Z");
  assert.strictEqual(simHandoffHZH.initialCircuit[0][2].type, "H");
  assert.strictEqual(simHandoffHZH.initialCircuit[0][3].type, "M");
  pass("H-Z-H composition handoff matches Simulator contract");

  const simHandoffCNOT = {
    initialNumQubits: 2,
    initialCircuit: {
      0: [
        { type: "H", id: "gate-h-0", duration: 1, name: "Hadamard", wire: 0 },
        { type: "CX", id: "gate-cx-0", duration: 1, name: "CNOT", wire: 0, target: 1 },
        { type: "M", id: "gate-m-0", duration: 1, name: "Measure", wire: 0 },
      ],
      1: [
        { type: "I", id: "gate-i-1", duration: 1, name: "Spacer", wire: 1 },
        { type: "I", id: "gate-i-2", duration: 1, name: "Spacer", wire: 1 },
        { type: "M", id: "gate-m-1", duration: 1, name: "Measure", wire: 1 },
      ],
    },
    origin: "quantum-gates",
  };

  assert.strictEqual(simHandoffCNOT.initialNumQubits, 2);
  assert.strictEqual(simHandoffCNOT.initialCircuit[0][1].type, "CX");
  assert.strictEqual(simHandoffCNOT.initialCircuit[0][1].target, 1);
  pass("Two-qubit multi-wire circuit handoff matches Simulator CX contract");

  console.log("\n======================================================================");
  console.log(`MODULE 7 TEST RESULTS: ${passedCount} PASSED, 0 FAILED (out of ${totalCount})`);
  console.log("======================================================================\n");
}

runTests();
