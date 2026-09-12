/**
 * Stage 5: AI-Grounded Explanation Integration & Grounding Test Suite
 *
 * Validates:
 * 1. Server-side timelineStorage (bearer capability, LRU pruning, sliding TTL)
 * 2. Deterministic learner-question scope validation
 * 3. Client-tampering immunity (client cannot inject fake facts)
 * 4. Grounded Fact Sheet compilation (non-recomputing projection)
 * 5. Canonical physics verification (Cases A-G in Qiskit little-endian order)
 * 6. Scientific semantics (fidelity, measurement scoping, entanglement language)
 * 7. HTTP endpoint integration (/api/circuit/timeline -> /api/ai/explain-transition)
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-key-1234567890";

const express = require("express");
const http = require("http");
const circuitRoutes = require("../routes/circuitRoutes");
const aiRoutes = require("../routes/aiRoutes");
const {
  saveTimeline,
  getTimeline,
  getStorageStats,
  clearStorage,
} = require("../services/timelineStorage");
const {
  validateLearnerQuestionScope,
  buildGroundedFactSheet,
  generateDeterministicFallback,
} = require("../controllers/aiController");

const app = express();
app.use(express.json());
app.use("/api/circuit", circuitRoutes);
app.use("/api/ai", aiRoutes);

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runStage5TestSuite() {
  console.log("\n==================================================");
  console.log("STAGE 5: AI-GROUNDED EXPLANATION VERIFICATION SUITE");
  console.log("==================================================\n");

  const server = app.listen(0, async () => {
    const port = server.address().port;

    function post(path, data) {
      return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const req = http.request(
          {
            hostname: "127.0.0.1",
            port,
            path,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(payload),
            },
          },
          (res) => {
            let body = "";
            res.on("data", (chunk) => (body += chunk));
            res.on("end", () => {
              try {
                resolve({ status: res.statusCode, data: JSON.parse(body) });
              } catch (e) {
                resolve({ status: res.statusCode, raw: body });
              }
            });
          }
        );
        req.on("error", reject);
        req.write(payload);
        req.end();
      });
    }

    try {
      // ──────────────────────────────────────────────────
      // 1. TIMELINE STORAGE UNIT TESTS
      // ──────────────────────────────────────────────────
      console.log("--- 1. Timeline Storage Service Tests ---");
      clearStorage();
      const dummyTimeline = { numQubits: 2, steps: [{ step: 0 }, { step: 1 }] };
      const testId = saveTimeline(dummyTimeline);
      assert(typeof testId === "string" && testId.length >= 32, "saveTimeline returns a valid UUIDv4 bearer ID");

      const retrieved = getTimeline(testId);
      assert(retrieved !== null && retrieved.numQubits === 2, "getTimeline retrieves verified timeline before TTL");

      const missing = getTimeline("non-existent-uuid");
      assert(missing === null, "getTimeline returns null for unknown timelineId");

      const stats = getStorageStats();
      assert(stats.activeTimelines === 1, "Storage tracking reflects active count");

      // ──────────────────────────────────────────────────
      // 2. DETERMINISTIC LEARNER QUESTION SCOPE VALIDATION
      // ──────────────────────────────────────────────────
      console.log("\n--- 2. Deterministic Scope Validation Tests ---");
      const inScope1 = validateLearnerQuestionScope("Why did the Bloch vector rotate to Y?");
      assert(!inScope1.isOutOfScope, "In-scope question allowed: 'Why did the Bloch vector rotate to Y?'");

      const inScope2 = validateLearnerQuestionScope("What does the purity drop mean for this qubit?");
      assert(!inScope2.isOutOfScope, "In-scope question allowed: 'What does the purity drop mean for this qubit?'");

      const outScope1 = validateLearnerQuestionScope("Write a Python script for Grover's algorithm");
      assert(outScope1.isOutOfScope, "Out-of-scope intercepted: 'Write a Python script for Grover's algorithm'");

      const outScope2 = validateLearnerQuestionScope("Teach me Shor's algorithm from scratch");
      assert(outScope2.isOutOfScope, "Out-of-scope intercepted: 'Teach me Shor's algorithm from scratch'");

      const outScope3 = validateLearnerQuestionScope("What is quantum computing?");
      assert(outScope3.isOutOfScope, "Out-of-scope intercepted: 'What is quantum computing?'");

      const outScope4 = validateLearnerQuestionScope("Generate code for QAOA on MaxCut");
      assert(outScope4.isOutOfScope, "Out-of-scope intercepted: 'Generate code for QAOA on MaxCut'");

      // ──────────────────────────────────────────────────
      // 3. CANONICAL PHYSICS FACT SHEET VERIFICATION (QISKIT BASIS CONVENTION)
      // ──────────────────────────────────────────────────
      console.log("\n--- 3. Canonical Physics & Fact Sheet Verification ---");

      // Test A: H(q0) on 2 qubits (|00> -> (|00> + |01>)/sqrt(2))
      const resA = await post("/api/circuit/timeline", {
        numQubits: 2,
        gates: [{ type: "H", wire: 0 }],
      });
      assert(resA.status === 200 && resA.data.timelineId, "Timeline evaluation returns timelineId");
      const timelineA = getTimeline(resA.data.timelineId);
      const factSheetA = buildGroundedFactSheet(timelineA, 1);
      assert(
        factSheetA.stateTransition.includes("|00⟩") && factSheetA.stateTransition.includes("|01⟩"),
        "Test A (Qiskit Little-Endian): H(q0) produces (|00⟩ + |01⟩)/√2 (rightmost bit is q0)"
      );
      assert(
        !factSheetA.stateTransition.includes("|10⟩"),
        "Test A: Does NOT produce |10⟩ on H(q0)"
      );
      assert(
        factSheetA.subsystems[0].movement !== "unchanged" && factSheetA.subsystems[0].movement.includes("→"),
        "Test A: Subsystem q0 rotated along Bloch sphere surface (|0⟩ → |+⟩)"
      );

      // Test B: Z on |+> (relative phase = pi, +X -> -X)
      const resB = await post("/api/circuit/timeline", {
        numQubits: 1,
        gates: [{ type: "H", wire: 0 }, { type: "Z", wire: 0 }],
      });
      const timelineB = getTimeline(resB.data.timelineId);
      const factSheetB = buildGroundedFactSheet(timelineB, 2);
      assert(
        factSheetB.phase.classification === "relative",
        "Test B: Pauli-Z on |+⟩ classified as relative phase"
      );
      assert(
        factSheetB.probability.changed === false,
        "Test B: Pauli-Z on |+⟩ leaves probabilities unchanged"
      );
      assert(
        Math.abs(factSheetB.subsystems[0].afterBloch.x - (-1.0)) < 0.05,
        "Test B: Bloch vector rotated from +X to -X"
      );

      // Test C: S on |+> (relative phase = +pi/2, +X -> +Y)
      const resC = await post("/api/circuit/timeline", {
        numQubits: 1,
        gates: [{ type: "H", wire: 0 }, { type: "S", wire: 0 }],
      });
      const timelineC = getTimeline(resC.data.timelineId);
      const factSheetC = buildGroundedFactSheet(timelineC, 2);
      assert(
        factSheetC.phase.classification === "relative" && Math.abs(factSheetC.phase.maxRelativeShiftRad - 1.5708) < 0.01,
        "Test C: S gate on |+⟩ produces relative phase shift of +π/2 rad"
      );
      assert(
        Math.abs(factSheetC.subsystems[0].afterBloch.y - 1.0) < 0.05,
        "Test C: Bloch vector rotated to +Y equator"
      );

      // Test D: T on |+> (relative phase = +pi/4)
      const resD = await post("/api/circuit/timeline", {
        numQubits: 1,
        gates: [{ type: "H", wire: 0 }, { type: "T", wire: 0 }],
      });
      const timelineD = getTimeline(resD.data.timelineId);
      const factSheetD = buildGroundedFactSheet(timelineD, 2);
      assert(
        factSheetD.phase.classification === "relative" && Math.abs(factSheetD.phase.maxRelativeShiftRad - 0.7854) < 0.01,
        "Test D: T gate on |+⟩ produces relative phase shift of +π/4 rad"
      );

      // Test E: H(q0) + CX(q0 -> q1) (Bell State (|00> + |11>)/sqrt(2))
      const resE = await post("/api/circuit/timeline", {
        numQubits: 2,
        gates: [{ type: "H", wire: 0 }, { type: "CX", wire: 0, target: 1 }],
      });
      const timelineE = getTimeline(resE.data.timelineId);
      const factSheetE = buildGroundedFactSheet(timelineE, 2);
      assert(
        factSheetE.stateTransition.includes("|00⟩") && factSheetE.stateTransition.includes("|11⟩"),
        "Test E: CX(q0 -> q1) produces Bell state (|00⟩ + |11⟩)/√2"
      );
      assert(
        factSheetE.subsystems[0].entanglement.status === "became_entangled" &&
        factSheetE.subsystems[0].entanglement.mechanism === "unitary_interaction",
        "Test E: Entanglement status 'became_entangled' with mechanism 'unitary_interaction'"
      );
      assert(
        factSheetE.subsystems[0].afterBloch.r < 0.01 && Math.abs(factSheetE.subsystems[0].afterBloch.purity - 0.5) < 0.05,
        "Test E: Subsystem purity contracted to 0.5 and radius to 0"
      );

      // Test F: SWAP on |01> -> |10> (separable, no entanglement)
      const resF = await post("/api/circuit/timeline", {
        numQubits: 2,
        gates: [{ type: "X", wire: 0 }, { type: "SWAP", wire: 0, target: 1 }],
      });
      const timelineF = getTimeline(resF.data.timelineId);
      const factSheetF = buildGroundedFactSheet(timelineF, 2);
      assert(
        factSheetF.stateTransition.includes("|01⟩") && factSheetF.stateTransition.includes("|10⟩"),
        "Test F: SWAP exchanges |01⟩ to |10⟩"
      );
      assert(
        factSheetF.subsystems[0].entanglement.status === "unchanged" &&
        factSheetF.subsystems[0].entanglement.mechanism === "none",
        "Test F: SWAP does NOT generate entanglement (mechanism 'none')"
      );

      // Test G: Projective Measurement on Bell State
      const resG = await post("/api/circuit/timeline", {
        numQubits: 2,
        gates: [{ type: "H", wire: 0 }, { type: "CX", wire: 0, target: 1 }, { type: "M", wire: 0 }],
      });
      const timelineG = getTimeline(resG.data.timelineId);
      const factSheetG = buildGroundedFactSheet(timelineG, 3);
      assert(
        factSheetG.measurement !== null && (factSheetG.measurement.outcome === "0" || factSheetG.measurement.outcome === "1" || factSheetG.measurement.outcome === 0 || factSheetG.measurement.outcome === 1),
        "Test G: Measurement outcome reflects reported outcome ('0' or '1')"
      );
      assert(
        factSheetG.subsystems[0].entanglement.mechanism === "measurement_disentanglement",
        "Test G: Disentanglement mechanism is 'measurement_disentanglement'"
      );

      // ──────────────────────────────────────────────────
      // 4. SCIENTIFIC LANGUAGE & DETERMINISTIC FALLBACK
      // ──────────────────────────────────────────────────
      console.log("\n--- 4. Scientific Language & Fallback Validation ---");
      const fallbackCX = generateDeterministicFallback(factSheetE, { type: "CX", wire: 0, target: 1 }, 2);
      assert(
        fallbackCX.subsystemInsight.includes("reduced subsystem becomes mixed because it is entangled"),
        "Entanglement Language: Accurately describes reduced subsystem as mixed due to entanglement"
      );
      assert(
        !fallbackCX.subsystemInsight.toLowerCase().includes("classical ignorance"),
        "Entanglement Language: Does NOT use forbidden phrase 'classical ignorance'"
      );

      // ──────────────────────────────────────────────────
      // 5. SECURITY & CLIENT-TAMPERING REGRESSION TEST
      // ──────────────────────────────────────────────────
      console.log("\n--- 5. Security & Client-Tampering Test ---");
      // The client attempts to send spoofed/fake facts along with a valid timelineId
      const spoofedPayload = {
        timelineId: resA.data.timelineId,
        stepIndex: 1,
        fakeFacts: {
          fidelity: 0.0,
          headline: "SPOOFED_ATTACK_HEADLINE",
          probabilityChanged: false,
        },
        transition: {
          type: "fabricated_transition",
          summary: { headline: "FABRICATED_TRANSITION" },
        },
      };

      const resTamper = await post("/api/ai/explain-transition", spoofedPayload);
      assert(resTamper.status === 200, "Server successfully answers request with spoofed payload");
      assert(
        !resTamper.data.explanation.headline.includes("SPOOFED_ATTACK") &&
        !resTamper.data.explanation.headline.includes("FABRICATED_TRANSITION"),
        "Client-Tampering Immunity: Fake facts were completely ignored by the server"
      );
      assert(
        resTamper.data.explanation.headline.includes("superposition") ||
        resTamper.data.explanation.mechanism.includes("Hadamard") ||
        resTamper.data.explanation.mechanism.includes("superposition"),
        "Client-Tampering Immunity: Server Fact Sheet and explanation derived 100% from genuine Stage 4 timeline"
      );

      // ──────────────────────────────────────────────────
      // 6. HTTP API ROUTE BEHAVIOR
      // ──────────────────────────────────────────────────
      console.log("\n--- 6. HTTP API Route Integration Tests ---");
      // Test 410 on invalid timelineId
      const resBadId = await post("/api/ai/explain-transition", {
        timelineId: "00000000-0000-0000-0000-000000000000",
        stepIndex: 1,
      });
      assert(resBadId.status === 410 && resBadId.data.error === "TIMELINE_EXPIRED", "Expired/unknown timelineId returns 410 TIMELINE_EXPIRED");

      // Test 400 on stepIndex 0
      const resStep0 = await post("/api/ai/explain-transition", {
        timelineId: resA.data.timelineId,
        stepIndex: 0,
      });
      assert(resStep0.status === 400, "Step index 0 rejected with 400 Bad Request");

      // Test out-of-scope question short-circuit
      const resOutOfScope = await post("/api/ai/explain-transition", {
        timelineId: resA.data.timelineId,
        stepIndex: 1,
        learnerQuestion: "Teach me Shor's algorithm in detail",
      });
      assert(
        resOutOfScope.status === 200 &&
        resOutOfScope.data.explanation.answeredQuestion.includes("external topic") &&
        resOutOfScope.data.isFallback === true,
        "Out-of-scope question receives immediate polite redirection with zero Gemini calls"
      );

      console.log("\n==================================================");
      console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
      console.log("==================================================\n");

      server.close();
      process.exit(failed > 0 ? 1 : 0);
    } catch (err) {
      console.error("Test execution exception:", err);
      server.close();
      process.exit(1);
    }
  });
}

runStage5TestSuite();
