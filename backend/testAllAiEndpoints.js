const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const aiController = require('./controllers/aiController');
const aiProvider = require('./services/aiProvider');
const promptBuilder = require('./services/promptBuilder');
const { saveTimeline, saveNoisyTimeline } = require('./services/timelineStorage');

// Mock Express req/res
function createMockReqRes(body = {}, params = {}, query = {}, user = { id: 'test_user_123' }) {
  const req = { body, params, query, user };
  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      responseData = data;
      return res;
    },
    getStatusCode: () => statusCode,
    getData: () => responseData
  };

  return { req, res };
}

async function runVerification() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('      QUANTIVA AI MIGRATION: END-TO-END VERIFICATION       ');
  console.log('═══════════════════════════════════════════════════════════\n');

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

  // ─────────────────────────────────────────────
  // 1. Direct AI Provider & Models Test
  // ─────────────────────────────────────────────
  console.log('[Test 1] Testing aiProvider and models...');
  try {
    assert(aiProvider.isConfigured(), 'aiProvider is configured with GROQ_API_KEY');

    const t0 = Date.now();
    const primaryRes = await aiProvider.generateText({
      systemPrompt: '<QUANTIVA_SYSTEM_POLICY><ROLE>Quantum Assistant</ROLE></QUANTIVA_SYSTEM_POLICY>',
      userPrompt: '<QUANTIVA_REQUEST><TASK>State Born\'s rule in one concise sentence.</TASK></QUANTIVA_REQUEST>',
      maxTokens: 500
    });
    console.log(`  [Primary Model (${aiProvider.PRIMARY_MODEL})] Output (${Date.now() - t0}ms):`, primaryRes.text.trim());
    assert(primaryRes.text.length > 20, 'Primary model generated valid explanation');

    const t1 = Date.now();
    const fastRes = await aiProvider.generateText({
      systemPrompt: '<QUANTIVA_SYSTEM_POLICY><ROLE>Quantum Recommender</ROLE></QUANTIVA_SYSTEM_POLICY>',
      userPrompt: '<QUANTIVA_REQUEST><TASK>Suggest 1 gate in 5 words.</TASK></QUANTIVA_REQUEST>',
      model: aiProvider.FAST_MODEL,
      maxTokens: 500
    });
    console.log(`  [Fast Model (${aiProvider.FAST_MODEL})] Output (${Date.now() - t1}ms):`, fastRes.text.trim());
    assert(fastRes.text.length > 3, 'Fast model generated valid response');
  } catch (err) {
    assert(false, `aiProvider test error: ${err.message}`);
  }

  // ─────────────────────────────────────────────
  // 2. Chat Endpoint: POST /api/ai/chat
  // ─────────────────────────────────────────────
  console.log('\n[Test 2] Testing POST /api/ai/chat...');
  try {
    const { req, res } = createMockReqRes({
      message: 'What happens when an H gate is applied to |0>?'
    });

    const t0 = Date.now();
    await aiController.chat(req, res);
    const code = res.getStatusCode();
    const data = res.getData();

    assert(code === 200, `Chat returned HTTP 200 (took ${Date.now() - t0}ms)`);
    assert(typeof data.reply === 'string' && data.reply.length > 20, 'Response contains non-empty "reply" field');
    console.log('  Preview:', data.reply.slice(0, 100).replace(/\n/g, ' ') + '...');
  } catch (err) {
    assert(false, `Chat error: ${err.message}`);
  }

  // ─────────────────────────────────────────────
  // 3. Concept Explainer: POST /api/ai/explain
  // ─────────────────────────────────────────────
  console.log('\n[Test 3] Testing POST /api/ai/explain...');
  try {
    const { req, res } = createMockReqRes({
      concept: 'Superposition'
    });

    const t0 = Date.now();
    await aiController.explainConcept(req, res);
    const code = res.getStatusCode();
    const data = res.getData();

    assert(code === 200, `Explain returned HTTP 200 (took ${Date.now() - t0}ms)`);
    assert(typeof data.explanation === 'string' && data.explanation.length > 20, 'Response contains non-empty "explanation" field');
    console.log('  Preview:', data.explanation.slice(0, 100).replace(/\n/g, ' ') + '...');
  } catch (err) {
    assert(false, `Explain error: ${err.message}`);
  }

  // ─────────────────────────────────────────────
  // 4. Circuit Analyzer: POST /api/ai/analyze-circuit
  // ─────────────────────────────────────────────
  console.log('\n[Test 4] Testing POST /api/ai/analyze-circuit...');
  try {
    const { req, res } = createMockReqRes({
      numQubits: 2,
      gates: [
        { type: 'H', wire: 0 },
        { type: 'CNOT', wire: 0, target: 1 }
      ]
    });

    const t0 = Date.now();
    await aiController.analyzeCircuit(req, res);
    const code = res.getStatusCode();
    const data = res.getData();

    assert(code === 200, `Analyze returned HTTP 200 (took ${Date.now() - t0}ms)`);
    assert(typeof data.analysis === 'string' && data.analysis.length > 20, 'Response contains non-empty "analysis" field');
    console.log('  Preview:', data.analysis.slice(0, 100).replace(/\n/g, ' ') + '...');
  } catch (err) {
    assert(false, `Analyze error: ${err.message}`);
  }

  // ─────────────────────────────────────────────
  // 5. Recommender: GET /api/ai/recommend (offline fallback mock)
  // ─────────────────────────────────────────────
  console.log('\n[Test 5] Testing promptBuilder.buildRecommendPrompt & fast model...');
  try {
    const prompt = promptBuilder.buildRecommendPrompt({
      statsData: {
        completedCoursesCount: 1,
        totalCourses: 5,
        completedChallengesCount: 3,
        totalChallenges: 10,
        struggledChallenges: ['Bell State Creator'],
        remainingCourses: ['Quantum Teleportation'],
        remainingChallenges: ['Superdense Coding']
      }
    });

    const t0 = Date.now();
    const recResult = await aiProvider.generateText({
      systemPrompt: prompt.systemPolicy,
      userPrompt: prompt.userRequest,
      model: aiProvider.FAST_MODEL,
      maxTokens: 500,
      temperature: 0.3
    });

    assert(recResult.text.length > 20, `Recommender generated recommendations (took ${Date.now() - t0}ms)`);
    console.log('  Preview:', recResult.text.slice(0, 100).replace(/\n/g, ' ') + '...');
  } catch (err) {
    assert(false, `Recommender error: ${err.message}`);
  }

  // ─────────────────────────────────────────────
  // 6. Stage 5 Transition Explainer: POST /api/ai/explain-transition
  // ─────────────────────────────────────────────
  console.log('\n[Test 6] Testing POST /api/ai/explain-transition (Groq Strict Structured Output)...');
  const mockTimeline = {
    numQubits: 1,
    steps: [
      {
        stepIndex: 0,
        appliedGate: null,
        amplitudes: [{ basis: '0', magnitude: 1.0, probability: 1.0 }],
        transition: null
      },
      {
        stepIndex: 1,
        appliedGate: { type: 'H', wire: 0, target: null },
        amplitudes: [
          { basis: '0', magnitude: 0.707, probability: 0.5 },
          { basis: '1', magnitude: 0.707, probability: 0.5 }
        ],
        transition: {
          type: 'unitary_gate',
          gate: { type: 'H', wire: 0, target: null },
          summary: {
            headline: 'Applied H gate on wire 0',
            stateChanged: true,
            probabilityChanged: true,
            phaseChanged: false,
            blochChanged: true,
            isNoOp: false
          },
          probability: {
            deltas: [
              { basis: '0', before: 1.0, after: 0.5, delta: -0.5, status: 'decreased' },
              { basis: '1', before: 0.0, after: 0.5, delta: 0.5, status: 'increased' }
            ]
          },
          phase: {
            classification: 'none',
            globalShiftRad: 0.0,
            maxRelativeShiftRad: 0.0,
            description: 'No phase change'
          },
          subsystems: [
            {
              wire: 0,
              entanglement: { status: 'unchanged' },
              bloch: {
                before: { x: 0, y: 0, z: 1 },
                after: { x: 1, y: 0, z: 0 },
                delta: { dx: 1, dy: 0, dz: -1 }
              }
            }
          ],
          stateMetrics: { fidelity: 0.5 }
        }
      }
    ]
  };

  const timelineId = saveTimeline(mockTimeline);

  try {
    const { req, res } = createMockReqRes({
      timelineId,
      stepIndex: 1,
      learnerQuestion: 'Why did the probabilities become 50/50?'
    });

    const t0 = Date.now();
    await aiController.explainTransition(req, res);
    const code = res.getStatusCode();
    const data = res.getData();

    assert(code === 200, `Stage 5 returned HTTP 200 (took ${Date.now() - t0}ms)`);
    assert(data.success === true, 'data.success === true');
    assert(data.timelineId === timelineId, 'data.timelineId matches');
    assert(data.stepIndex === 1, 'data.stepIndex === 1');
    assert(data.isFallback === false, 'data.isFallback === false (Groq live execution)');

    const exp = data.explanation;
    assert(typeof exp.headline === 'string' && exp.headline.length > 5, 'explanation.headline is non-empty string');
    assert(typeof exp.mechanism === 'string' && exp.mechanism.length > 10, 'explanation.mechanism is non-empty string');
    assert(typeof exp.subsystemInsight === 'string' && exp.subsystemInsight.length > 5, 'explanation.subsystemInsight is non-empty string');
    assert(typeof exp.takeaway === 'string' && exp.takeaway.length > 5, 'explanation.takeaway is non-empty string');
    assert(exp.answeredQuestion === null || typeof exp.answeredQuestion === 'string', 'explanation.answeredQuestion matches contract');

    console.log('  Stage 5 Live Headline:', exp.headline);
    console.log('  Stage 5 Mechanism:', exp.mechanism.slice(0, 80) + '...');
  } catch (err) {
    assert(false, `Stage 5 error: ${err.message}`);
  }

  // ─────────────────────────────────────────────
  // 7. Stage 5 Deterministic Fallback Test
  // ─────────────────────────────────────────────
  console.log('\n[Test 7] Testing Stage 5 Deterministic Fallback (safety net)...');
  try {
    const factSheet = aiController.buildGroundedFactSheet(mockTimeline, 1);
    const fallback = aiController.generateDeterministicFallback(factSheet, { type: 'H', wire: 0 }, 1, 'Test question');

    assert(typeof fallback.headline === 'string', 'fallback.headline exists');
    assert(typeof fallback.mechanism === 'string', 'fallback.mechanism exists');
    assert(typeof fallback.subsystemInsight === 'string', 'fallback.subsystemInsight exists');
    assert(typeof fallback.takeaway === 'string', 'fallback.takeaway exists');
    console.log('  Fallback Headline:', fallback.headline);
  } catch (err) {
    assert(false, `Stage 5 fallback error: ${err.message}`);
  }

  // ─────────────────────────────────────────────
  // 8. Stage 6 Noise Explainer: POST /api/ai/explain-noise
  // ─────────────────────────────────────────────
  console.log('\n[Test 8] Testing POST /api/ai/explain-noise (Groq Strict Structured Output)...');
  const mockNoisyTimeline = {
    divergenceSummary: {
      noiseModel: 'depolarizing',
      noiseStrength: 0.05,
      firstMeaningfulDivergenceStep: 1,
      gateAtFirstDivergence: { type: 'H', wire: 0 }
    },
    steps: [
      {
        stepIndex: 0,
        fidelity: 1.0,
        divergence: 0.0,
        purityDelta: 0.0,
        blochVectors: [{ qubit: 0, x: 0, y: 0, z: 1, r: 1.0 }]
      },
      {
        stepIndex: 1,
        appliedGate: { type: 'H', wire: 0 },
        fidelity: 0.95,
        divergence: 0.05,
        purityDelta: -0.09,
        blochVectors: [{ qubit: 0, x: 0.95, y: 0, z: 0, r: 0.95 }]
      }
    ]
  };

  const noisyTimelineId = saveNoisyTimeline(mockNoisyTimeline);

  try {
    const { req, res } = createMockReqRes({
      timelineId,
      noisyTimelineId,
      stepIndex: 1,
      learnerQuestion: 'Why did the Bloch vector shrink?'
    });

    const t0 = Date.now();
    await aiController.explainNoise(req, res);
    const code = res.getStatusCode();
    const data = res.getData();

    assert(code === 200, `Stage 6 returned HTTP 200 (took ${Date.now() - t0}ms)`);
    assert(data.success === true, 'data.success === true');
    assert(data.source === 'groq', 'data.source === "groq"');

    const exp = data.explanation;
    assert(typeof exp.headline === 'string' && exp.headline.length > 5, 'explanation.headline is non-empty string');
    assert(typeof exp.physicalMechanism === 'string' && exp.physicalMechanism.length > 10, 'explanation.physicalMechanism is non-empty string');
    assert(typeof exp.blochDivergence === 'string' && exp.blochDivergence.length > 5, 'explanation.blochDivergence is non-empty string');
    assert(typeof exp.takeaway === 'string' && exp.takeaway.length > 5, 'explanation.takeaway is non-empty string');

    console.log('  Stage 6 Live Headline:', exp.headline);
    console.log('  Stage 6 Mechanism:', exp.physicalMechanism.slice(0, 80) + '...');
  } catch (err) {
    assert(false, `Stage 6 error: ${err.message}`);
  }

  // ─────────────────────────────────────────────
  // 9. Stage 6 Deterministic Fallback Test
  // ─────────────────────────────────────────────
  console.log('\n[Test 9] Testing Stage 6 Deterministic Fallback (safety net)...');
  try {
    const factSheet = aiController.buildGroundedNoiseFactSheet(mockTimeline, mockNoisyTimeline, 1);
    const fallback = aiController.generateDeterministicNoiseFallback(factSheet, 'Test question');

    assert(typeof fallback.headline === 'string', 'fallback.headline exists');
    assert(typeof fallback.physicalMechanism === 'string', 'fallback.physicalMechanism exists');
    assert(typeof fallback.blochDivergence === 'string', 'fallback.blochDivergence exists');
    assert(typeof fallback.takeaway === 'string', 'fallback.takeaway exists');
    console.log('  Noise Fallback Headline:', fallback.headline);
  } catch (err) {
    assert(false, `Stage 6 fallback error: ${err.message}`);
  }

  // ─────────────────────────────────────────────
  // Final Summary
  // ─────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('═══════════════════════════════════════════════════════════');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification();
