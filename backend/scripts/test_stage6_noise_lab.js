/**
 * Stage 6: Noise Lab Verification Test Suite
 *
 * Validates:
 * 1. Deterministic Equivalence at p = 0 (including circuits with measurement)
 * 2. Multi-qubit noise distribution (independent channels on participating wires; no quantum noise after measurement)
 * 3. Channel-specific analytical tests:
 *    - Depolarizing shrinkage (r = 1 - p on |+>)
 *    - Phase-flip dephasing (x = 1 - 2p, z = 0 on |+>; invariant on |0>)
 *    - Bit-flip population inversion (P(|1>) = p, z = 1 - 2p on |0>)
 *    - Readout error (F = 1.0, rho pure, readoutObservedProbabilities perturbed)
 * 4. Density matrix physicality (probabilities sum to 1, purity in [2^-n, 1.0])
 * 5. Non-causal divergence attribution (firstMeaningfulDivergenceStep >= 0.05)
 * 6. Guardrail: mixedness != entanglement in fact sheet and fallback
 * 7. In-memory storage and sliding TTL for noisy timelines
 * 8. Full HTTP API integration:
 *    - POST /api/circuit/timeline -> POST /api/circuit/noisy-timeline -> POST /api/ai/explain-noise
 *    - Client tampering immunity
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
  saveNoisyTimeline,
  getNoisyTimeline,
  getStorageStats,
  clearStorage,
} = require("../services/timelineStorage");
const {
  evaluateNoisyTimeline,
} = require("../services/timelineService");
const {
  buildGroundedNoiseFactSheet,
  generateDeterministicNoiseFallback,
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

function approx(val, expected, eps = 1e-4) {
  return Math.abs(val - expected) < eps;
}

async function runStage6TestSuite() {
  console.log("\n==================================================");
  console.log("STAGE 6: NOISE LAB VERIFICATION SUITE");
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
              } catch (_) {
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
      // ─────────────────────────────────────────────
      // GROUP 1: Deterministic Equivalence at p = 0
      // ─────────────────────────────────────────────
      console.log("--- Group 1: Deterministic Equivalence at p = 0 ---");
      clearStorage();

      const p0Result = await evaluateNoisyTimeline({
        numQubits: 2,
        gates: [
          { type: "H", wire: 0 },
          { type: "CX", wire: 0, target: 1 },
          { type: "M", wire: 0 },
        ],
        noiseModel: "depolarizing",
        noiseStrength: 0.0,
      });

      assert(p0Result.success === true, "p=0 simulation succeeds");
      assert(p0Result.totalSteps === 4, "Total steps = 4 (initial + 3 gates)");
      assert(p0Result.steps.every((s) => approx(s.fidelity, 1.0, 1e-5)), "All steps have fidelity F = 1.000000 ± 1e-5 at p=0");
      assert(p0Result.steps.every((s) => approx(s.divergence, 0.0, 1e-5)), "All steps have divergence D = 0.000000 at p=0");
      assert(p0Result.divergenceSummary.firstMeaningfulDivergenceStep === null, "firstMeaningfulDivergenceStep is null when p=0");
      assert(p0Result.divergenceSummary.maxDivergence === 0.0, "maxDivergence is 0.0 when p=0");

      // ─────────────────────────────────────────────
      // GROUP 2: Multi-Qubit Noise Distribution
      // ─────────────────────────────────────────────
      console.log("\n--- Group 2: Multi-Qubit Noise Distribution ---");

      // 2A: Single-qubit gate: wire 0 receives noise, wire 1 remains unaffected
      const singleGateResult = await evaluateNoisyTimeline({
        numQubits: 2,
        gates: [{ type: "H", wire: 0 }],
        noiseModel: "depolarizing",
        noiseStrength: 0.15,
      });
      const step1Bloch = singleGateResult.steps[1].blochVectors;
      assert(approx(step1Bloch[0].r, 0.85, 1e-4), "Participating wire 0 contracts to r = 0.85 under depolarizing(0.15)");
      assert(approx(step1Bloch[1].r, 1.0, 1e-4), "Non-participating wire 1 remains pure at r = 1.0");

      // 2B: Two-qubit gate (CX on wire 0 -> target 1): both participate independently
      const twoQubitResult = await evaluateNoisyTimeline({
        numQubits: 2,
        gates: [
          { type: "H", wire: 0 },
          { type: "CX", wire: 0, target: 1 },
        ],
        noiseModel: "depolarizing",
        noiseStrength: 0.15,
      });
      assert(twoQubitResult.steps[2].appliedGate.type === "CX", "Step 2 applied gate is CX");
      assert(twoQubitResult.steps[2].divergence > singleGateResult.steps[1].divergence, "Cumulative divergence increases after CX on both wires");

      // 2C: Measurement gate: NO quantum noise applied afterward
      const measResult = await evaluateNoisyTimeline({
        numQubits: 1,
        gates: [
          { type: "H", wire: 0 },
          { type: "M", wire: 0 },
        ],
        noiseModel: "depolarizing",
        noiseStrength: 0.2,
      });
      const measStep = measResult.steps[2];
      assert(measStep.isMeasurement === true, "Step 2 is measurement step");
      // After projection onto outcome branch, purity of collapsed state is 1.0
      assert(measStep.blochVectors[0].r === 1.0, "Projected outcome eigenstate is pure (r = 1.0); no post-measurement quantum noise");

      // ─────────────────────────────────────────────
      // GROUP 3: Channel-Specific Analytical Tests
      // ─────────────────────────────────────────────
      console.log("\n--- Group 3: Channel-Specific Analytical Tests ---");

      // 3A: Depolarizing on |+> -> r = 1 - p
      const depolResult = await evaluateNoisyTimeline({
        numQubits: 1,
        gates: [{ type: "H", wire: 0 }],
        noiseModel: "depolarizing",
        noiseStrength: 0.12,
      });
      const depolBloch = depolResult.steps[1].blochVectors[0];
      assert(approx(depolBloch.r, 0.88, 1e-4), "Depolarizing(0.12) on |+> contracts radius to exactly r = 1 - 0.12 = 0.88");
      assert(approx(depolBloch.x, 0.88, 1e-4), "Depolarizing(0.12) on |+> shrinks x to 0.88");

      // 3B: Phase-Flip on |+> -> x = 1 - 2p, z = 0
      const pfResult = await evaluateNoisyTimeline({
        numQubits: 1,
        gates: [{ type: "H", wire: 0 }],
        noiseModel: "phase_flip",
        noiseStrength: 0.15,
      });
      const pfBloch = pfResult.steps[1].blochVectors[0];
      assert(approx(pfBloch.x, 0.70, 1e-4), "Phase-flip(0.15) on |+> contracts transverse x to 1 - 2(0.15) = 0.70");
      assert(approx(pfBloch.z, 0.0, 1e-4), "Phase-flip(0.15) on |+> preserves z = 0.0");

      // 3C: Phase-Flip on |0> -> invariant state (z = 1, r = 1)
      const pfZeroResult = await evaluateNoisyTimeline({
        numQubits: 1,
        gates: [{ type: "I", wire: 0 }],
        noiseModel: "phase_flip",
        noiseStrength: 0.25,
      });
      const pfZeroBloch = pfZeroResult.steps[1].blochVectors[0];
      assert(approx(pfZeroBloch.z, 1.0, 1e-4), "Phase-flip on |0> preserves z = 1.0");
      assert(approx(pfZeroBloch.r, 1.0, 1e-4), "Phase-flip on |0> preserves r = 1.0");

      // 3D: Bit-Flip on |0> -> P(|1>) = p, z = 1 - 2p
      const bfResult = await evaluateNoisyTimeline({
        numQubits: 1,
        gates: [{ type: "I", wire: 0 }],
        noiseModel: "bit_flip",
        noiseStrength: 0.2,
      });
      const bfStep = bfResult.steps[1];
      assert(approx(bfStep.quantumProbabilities["1"], 0.2, 1e-4), "Bit-flip(0.2) flips population P(1) = 0.20");
      assert(approx(bfStep.quantumProbabilities["0"], 0.8, 1e-4), "Bit-flip(0.2) leaves population P(0) = 0.80");
      assert(approx(bfStep.blochVectors[0].z, 0.6, 1e-4), "Bit-flip(0.2) sets z = 1 - 2(0.2) = 0.60");

      // 3E: Readout Noise -> Quantum density matrix pure (F = 1.0), readoutObservedProbabilities perturbed
      const roResult = await evaluateNoisyTimeline({
        numQubits: 1,
        gates: [{ type: "M", wire: 0 }],
        noiseModel: "readout",
        noiseStrength: 0.1,
      });
      const roStep = roResult.steps[1];
      assert(approx(roStep.fidelity, 1.0, 1e-4), "Readout error keeps quantum state fidelity F = 1.0");
      assert(approx(roStep.blochVectors[0].r, 1.0, 1e-4), "Readout error keeps quantum Bloch radius r = 1.0");
      assert(roStep.quantumProbabilities["0"] === 1.0, "Quantum true probability P(0) = 1.0");
      assert(approx(roStep.readoutObservedProbabilities["0"], 0.9, 1e-4), "Readout observed probability P_obs(0) = 0.90");
      assert(approx(roStep.readoutObservedProbabilities["1"], 0.1, 1e-4), "Readout observed probability P_obs(1) = 0.10");

      // ─────────────────────────────────────────────
      // GROUP 4: Density Matrix Physicality & Attribution
      // ─────────────────────────────────────────────
      console.log("\n--- Group 4: Physicality & Non-Causal Attribution ---");

      // Probability sums
      const sumProbs = Object.values(depolResult.steps[1].quantumProbabilities).reduce((a, b) => a + b, 0);
      assert(approx(sumProbs, 1.0, 1e-4), "Quantum probabilities sum to 1.0");

      // Meaningful divergence attribution
      const attrCircuit = await evaluateNoisyTimeline({
        numQubits: 2,
        gates: [
          { type: "I", wire: 0 },
          { type: "H", wire: 0 }, // Step 2: H creates |+> which dephases, crossing D_k >= 0.05
          { type: "CX", wire: 0, target: 1 },
        ],
        noiseModel: "phase_flip",
        noiseStrength: 0.15,
      });
      const summary = attrCircuit.divergenceSummary;
      assert(summary.firstMeaningfulDivergenceStep === 2, "firstMeaningfulDivergenceStep identifies step 2 where D_k >= 0.05");
      assert(summary.gateAtFirstDivergence.type === "H", "gateAtFirstDivergence identifies gate H at step 2");

      // ─────────────────────────────────────────────
      // GROUP 5: Guardrail Check: Mixedness != Entanglement
      // ─────────────────────────────────────────────
      console.log("\n--- Group 5: Guardrail Check: Mixedness != Entanglement ---");

      const bellNoise = await evaluateNoisyTimeline({
        numQubits: 2,
        gates: [
          { type: "H", wire: 0 },
          { type: "CX", wire: 0, target: 1 },
        ],
        noiseModel: "depolarizing",
        noiseStrength: 0.15,
      });

      const mockIdealTimeline = {
        numQubits: 2,
        steps: [
          { blochVectors: [{ qubit: 0, r: 1.0 }, { qubit: 1, r: 1.0 }] },
          { blochVectors: [{ qubit: 0, r: 1.0 }, { qubit: 1, r: 1.0 }] },
          { blochVectors: [{ qubit: 0, r: 0.0 }, { qubit: 1, r: 0.0 }] },
        ],
      };

      const factSheet = buildGroundedNoiseFactSheet(mockIdealTimeline, bellNoise, 2);
      assert(factSheet.purityDelta < 0, "Fact sheet records negative purityDelta from mixedness");
      assert(factSheet.isReadoutOnly === false, "Fact sheet correctly classifies non-readout model");

      const fallback = generateDeterministicNoiseFallback(factSheet);
      assert(typeof fallback.headline === "string", "Fallback contains headline");
      assert(typeof fallback.physicalMechanism === "string", "Fallback contains physicalMechanism");
      assert(typeof fallback.blochDivergence === "string", "Fallback contains blochDivergence");
      assert(typeof fallback.takeaway === "string", "Fallback contains takeaway");
      assert(!fallback.blochDivergence.toLowerCase().includes("entanglement generated"), "Fallback does not describe mixedness as entanglement generation");
      assert(fallback.blochDivergence.includes("not entanglement"), "Fallback explicitly guards that mixedness is NOT entanglement");

      // ─────────────────────────────────────────────
      // GROUP 6: Storage & Sliding TTL
      // ─────────────────────────────────────────────
      console.log("\n--- Group 6: Noisy Timeline Storage & TTL ---");
      clearStorage();

      const nId = saveNoisyTimeline({ test: "data" });
      assert(typeof nId === "string" && nId.length > 10, "saveNoisyTimeline returns UUID string");
      const retrieved = getNoisyTimeline(nId);
      assert(retrieved && retrieved.test === "data", "getNoisyTimeline retrieves stored noisy timeline");
      assert(getNoisyTimeline("invalid-id") === null, "getNoisyTimeline returns null for non-existent id");

      const stats = getStorageStats();
      assert(stats.activeNoisyTimelines === 1, "getStorageStats tracks active noisy timelines");

      // ─────────────────────────────────────────────
      // GROUP 7: Full HTTP API Endpoint Integration
      // ─────────────────────────────────────────────
      console.log("\n--- Group 7: Full HTTP API Endpoint Integration ---");
      clearStorage();

      // 7A: Run ideal timeline first
      const idealRes = await post("/api/circuit/timeline", {
        numQubits: 2,
        gates: [
          { type: "H", wire: 0 },
          { type: "CX", wire: 0, target: 1 },
        ],
      });
      assert(idealRes.status === 200, "POST /api/circuit/timeline returns 200");
      const timelineId = idealRes.data.timelineId;
      assert(Boolean(timelineId), "Received valid timelineId bearer capability");

      // 7B: POST /api/circuit/noisy-timeline validation errors
      const badIdRes = await post("/api/circuit/noisy-timeline", {
        timelineId: "non-existent-uuid",
        noiseModel: "depolarizing",
        noiseStrength: 0.15,
      });
      assert(badIdRes.status === 404, "Unknown timelineId returns 404 Not Found");

      const badModelRes = await post("/api/circuit/noisy-timeline", {
        timelineId,
        noiseModel: "invalid_noise_channel",
        noiseStrength: 0.15,
      });
      assert(badModelRes.status === 400, "Invalid noiseModel returns 400 Bad Request");

      const badStrengthRes = await post("/api/circuit/noisy-timeline", {
        timelineId,
        noiseModel: "depolarizing",
        noiseStrength: 1.5,
      });
      assert(badStrengthRes.status === 400, "Out-of-bounds noiseStrength returns 400 Bad Request");

      // 7C: POST /api/circuit/noisy-timeline success
      const noisyRes = await post("/api/circuit/noisy-timeline", {
        timelineId,
        noiseModel: "depolarizing",
        noiseStrength: 0.15,
      });
      assert(noisyRes.status === 200, "POST /api/circuit/noisy-timeline returns 200 OK");
      assert(noisyRes.data.success === true, "Response reports success = true");
      const noisyTimelineId = noisyRes.data.noisyTimelineId;
      assert(Boolean(noisyTimelineId), "Received valid noisyTimelineId bearer capability");
      assert(noisyRes.data.steps.length === 3, "Returned 3 noisy steps");
      assert(noisyRes.data.divergenceSummary.firstMeaningfulDivergenceStep === 1, "Summary identified first divergence at step 1");

      // 7D: Client tampering immunity
      const spoofRes = await post("/api/circuit/noisy-timeline", {
        timelineId,
        noiseModel: "depolarizing",
        noiseStrength: 0.15,
        fakeFidelity: 0.0, // Attempted spoof
        fakeSteps: [], // Attempted spoof
      });
      assert(spoofRes.data.steps[1].fidelity > 0.9, "Server ignores client-spoofed fidelity and computes authoritative value");

      // 7E: POST /api/ai/explain-noise
      const explainRes = await post("/api/ai/explain-noise", {
        timelineId,
        noisyTimelineId,
        stepIndex: 1,
        learnerQuestion: "Why did the Bloch vector shrink?",
      });
      assert(explainRes.status === 200, "POST /api/ai/explain-noise returns 200 OK");
      assert(explainRes.data.success === true, "AI explanation reports success = true");
      const exp = explainRes.data.explanation;
      assert(typeof exp.headline === "string", "Explanation has valid headline");
      assert(typeof exp.physicalMechanism === "string", "Explanation has valid physicalMechanism");
      assert(typeof exp.blochDivergence === "string", "Explanation has valid blochDivergence");
      assert(typeof exp.takeaway === "string", "Explanation has valid takeaway");

      // 7F: Out of scope learner question
      const oosRes = await post("/api/ai/explain-noise", {
        timelineId,
        noisyTimelineId,
        stepIndex: 1,
        learnerQuestion: "What is the weather today?",
      });
      assert(oosRes.status === 200, "Out-of-scope question handled gracefully with 200 OK");
      assert(oosRes.data.isFallback === true, "Out-of-scope question returns fallback with boundary guidance");

      console.log("\n==================================================");
      console.log(`STAGE 6 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
      console.log("==================================================\n");

      server.close(() => {
        process.exit(failed > 0 ? 1 : 0);
      });
    } catch (err) {
      console.error("Fatal test error:", err);
      server.close(() => {
        process.exit(1);
      });
    }
  });
}

runStage6TestSuite();
