/**
 * AI Tutor Controller
 *
 * Uses Google Gemini to power:
 * - Free-form AI tutoring chat
 * - Quantum concept explanations
 * - Circuit debugging and optimization
 * - Personalized learning recommendations
 * - Grounded Quantum Time Machine transition explanations
 */

const aiProvider = require("../services/aiProvider");
const promptBuilder = require("../services/promptBuilder");

const UserProgress = require("../models/UserProgress");
const Challenge = require("../models/Challenge");
const Course = require("../models/Course");
const { getTimeline, getNoisyTimeline } = require("../services/timelineStorage");

// ─────────────────────────────────────────────
// General AI Tutor System Instruction
// ─────────────────────────────────────────────

const SYSTEM_INSTRUCTION = `
You are the AI Tutor embedded inside "Quantiva", a web platform for
learning quantum computing.

The platform teaches:
- Qubits
- Superposition
- Entanglement
- Quantum gates
- Quantum circuits
- Quantum algorithms such as Deutsch-Jozsa, Grover's algorithm, and Shor's algorithm
- Qiskit-style quantum programming

Rules:

1. Explain concepts clearly and simply.
   Build intuition before introducing formal mathematics.

2. When mathematics is needed:
   - Use $...$ for inline LaTeX.
   - Use $$...$$ for block LaTeX.
   - The platform renders mathematics using KaTeX.

3. When reviewing quantum circuits or code:
   - Identify concrete bugs.
   - Check gate choices.
   - Check qubit indices.
   - Check missing measurements.
   - Check incorrect circuit logic.
   - Suggest concrete optimizations.
   - Look for gate cancellation.
   - Look for redundant gates.
   - Look for unnecessary CNOTs.
   - Look for unnecessary identity operations.

4. Keep answers focused and easy to scan.
   Prefer short paragraphs and bullet points.

5. Never invent platform features.
   If you are unsure about something specific to Quantiva, say so.

6. Default to Qiskit-style syntax unless the user's code clearly uses
   PennyLane, Cirq, or another framework.

7. When explaining quantum states, be mathematically accurate.

8. If the user appears to be a beginner, explain terminology before
   assuming advanced knowledge.
`;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function ensureAIConfigured() {
  if (!aiProvider.isConfigured()) {
    const error = new Error(
      "AI Tutor is not configured. Set GROQ_API_KEY in the server .env file."
    );

    error.code = "AI_NOT_CONFIGURED";
    throw error;
  }
}

function handleAIError(res, error) {
  console.error("❌ AI Tutor error:", error);
  console.error("❌ AI Tutor error details:", {
    name: error?.name,
    message: error?.message,
    code: error?.code,
    status: error?.status,
    statusCode: error?.statusCode,
    cause: error?.cause,
  });
}
/**
 * Safely parse JSON returned by the AI provider.
 */
function parseGroqJson(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Provider returned empty text.");
  }

  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // Continue with defensive extraction.
  }

  const withoutFences = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutFences);
  } catch {
    // Continue with object extraction.
  }

  const firstBrace = withoutFences.indexOf("{");
  const lastBrace = withoutFences.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = withoutFences.slice(firstBrace, lastBrace + 1);
    return JSON.parse(candidate);
  }

  throw new Error("Provider response did not contain valid JSON.");
}

// ─────────────────────────────────────────────
// POST /api/ai/chat
// ─────────────────────────────────────────────

async function chat(req, res) {
  try {
    console.log("\n================ AI CHAT REQUEST START ================");
    console.log("[AI CHAT] Timestamp:", new Date().toISOString());

    const {
      message,
      history = [],
      context = {},
    } = req.body;

    console.log("[AI CHAT] Request received:", {
      hasMessage: !!message,
      messageLength: typeof message === "string" ? message.length : null,
      historyLength: Array.isArray(history) ? history.length : null,
      hasContext: !!context,
      contextKeys: context && typeof context === "object"
        ? Object.keys(context)
        : [],
    });

    if (!message || typeof message !== "string") {
      console.log("[AI CHAT] ❌ Invalid message");
      return res.status(400).json({
        error: "message is required",
      });
    }

    console.log("[AI CHAT] Checking AI configuration...");
    ensureAIConfigured();
    console.log("[AI CHAT] ✅ AI provider configured");

    console.log("[AI CHAT] Building prompt...");

    const prompt = context?.challengeMode? 
      promptBuilder.buildChallengeTutorPrompt({
        challengeContext: context,
        userMessage: message,
      })
      : 
      promptBuilder.buildChatPrompt({
        circuitContext: context,
        userMessage: message,
      });

    console.log("[AI CHAT] ✅ Prompt built:", {
      hasSystemPolicy: !!prompt?.systemPolicy,
      systemPolicyLength: prompt?.systemPolicy?.length,
      hasUserRequest: !!prompt?.userRequest,
      userRequestLength: prompt?.userRequest?.length,
    });

    const recentHistory = Array.isArray(history)
      ? history.slice(-10)
      : [];

    const formattedMessages = recentHistory
      .filter((item) => item && item.text)
      .map((item) => ({
        role: item.role === "assistant" ? "assistant" : "user",
        content: String(item.text).slice(0, 4000),
      }));

    formattedMessages.push({
      role: "user",
      content: prompt.userRequest,
    });

    console.log("[AI CHAT] Messages prepared:", {
      messageCount: formattedMessages.length,
      lastMessageLength:
        formattedMessages[formattedMessages.length - 1]?.content?.length,
    });

    console.log("[AI CHAT] 🚀 Calling aiProvider.generateText()...");

    const providerStart = Date.now();

    const result = await aiProvider.generateText({
      systemPrompt: prompt.systemPolicy,
      messages: formattedMessages,
      temperature: 0.6,
      maxTokens: 2048,
    });

    const providerDuration = Date.now() - providerStart;

    console.log("[AI CHAT] ✅ Provider returned:", {
      durationMs: providerDuration,
      resultExists: !!result,
      resultKeys: result ? Object.keys(result) : [],
      hasText: !!result?.text,
      textLength: result?.text?.length || 0,
    });

    if (result?.text) {
      console.log(
        "[AI CHAT] Response preview:",
        result.text.slice(0, 200)
      );
    }

    const reply = result?.text;

    if (!reply) {
      console.error("[AI CHAT] ❌ PROVIDER RETURNED EMPTY TEXT");

      return res.status(502).json({
        error: "AI Tutor returned an empty response.",
      });
    }

    console.log("[AI CHAT] ✅ Sending successful response");
    console.log("================ AI CHAT REQUEST END ================\n");

    return res.json({
      reply,
    });

  } catch (error) {
    console.error("\n================ AI CHAT ERROR ================");
    console.error("[AI CHAT] ❌ Error:", error);
    console.error("[AI CHAT] Error name:", error?.name);
    console.error("[AI CHAT] Error message:", error?.message);
    console.error("[AI CHAT] Error code:", error?.code);
    console.error("[AI CHAT] Error status:", error?.status);
    console.error("[AI CHAT] Error statusCode:", error?.statusCode);

    if (error?.response) {
      console.error("[AI CHAT] Error response:", error.response);
    }

    console.error("================ AI CHAT ERROR END ================\n");

    return handleAIError(res, error);
  }
}

// ─────────────────────────────────────────────
// POST /api/ai/explain
// ─────────────────────────────────────────────

async function explainConcept(req, res) {
  try {
    const { concept } = req.body;

    if (!concept || typeof concept !== "string") {
      return res.status(400).json({
        error: "concept is required",
      });
    }

    ensureAIConfigured();

    const prompt = promptBuilder.buildConceptPrompt({
      concept,
      level: "intermediate",
    });

    const result = await aiProvider.generateText({
      systemPrompt: prompt.systemPolicy,
      userPrompt: prompt.userRequest,
      maxTokens: 700,
      temperature: 0.5,
    });

    const explanation = result.text;

    if (!explanation) {
      return res.status(502).json({
        error: "AI Tutor returned an empty explanation.",
      });
    }

    return res.json({
      explanation,
    });
  } catch (error) {
    return handleAIError(res, error);
  }
}

// ─────────────────────────────────────────────
// POST /api/ai/analyze-circuit
// ─────────────────────────────────────────────

async function analyzeCircuit(req, res) {
  try {
    const {
      code,
      gates,
      numQubits,
      backend = "qiskit",
    } = req.body;

    if (!code && !gates) {
      return res.status(400).json({
        error: "code or gates is required",
      });
    }

    ensureAIConfigured();

    const prompt = promptBuilder.buildCircuitAnalysisPrompt({
      code,
      gates,
      numQubits,
      backend,
    });

    const result = await aiProvider.generateText({
      systemPrompt: prompt.systemPolicy,
      userPrompt: prompt.userRequest,
      maxTokens: 900,
      temperature: 0.4,
    });

    const analysis = result.text;

    if (!analysis) {
      return res.status(502).json({
        error: "AI Tutor returned an empty circuit analysis.",
      });
    }

    return res.json({
      analysis,
    });
  } catch (error) {
    return handleAIError(res, error);
  }
}

// ─────────────────────────────────────────────
// GET /api/ai/recommend
// ─────────────────────────────────────────────

async function recommend(req, res) {
  try {
    ensureAIConfigured();

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: "Authentication required.",
      });
    }

    const progress = await UserProgress.findOne({
      user: req.user.id,
    })
      .populate("courseProgress.course", "title")
      .populate(
        "challengeProgress.challenge",
        "title numQubits allowedGates"
      );

    const [allCourses, allChallenges] = await Promise.all([
      Course.find().select("title description"),
      Challenge.find()
        .select("title desc numQubits allowedGates order")
        .sort({ order: 1 }),
    ]);

    const completedCourseIds = new Set(
      (progress?.courseProgress || [])
        .filter((course) => course.completed)
        .map((course) => course.course?._id?.toString())
        .filter(Boolean)
    );

    const completedChallengeIds = new Set(
      (progress?.challengeProgress || [])
        .filter((challenge) => challenge.completed)
        .map((challenge) => challenge.challenge?._id?.toString())
        .filter(Boolean)
    );

    const struggledChallenges = (
      progress?.challengeProgress || []
    ).filter(
      (challenge) =>
        !challenge.completed &&
        Number(challenge.attempts || 0) >= 2
    );

    const remainingCourses = allCourses.filter(
      (course) =>
        !completedCourseIds.has(course._id.toString())
    );

    const remainingChallenges = allChallenges.filter(
      (challenge) =>
        !completedChallengeIds.has(challenge._id.toString())
    );

    const prompt = promptBuilder.buildRecommendPrompt({
      statsData: {
        completedCoursesCount: completedCourseIds.size,
        totalCourses: allCourses.length,
        completedChallengesCount: completedChallengeIds.size,
        totalChallenges: allChallenges.length,
        struggledChallenges: struggledChallenges
          .map((item) => item.challenge?.title)
          .filter(Boolean),
        remainingCourses: remainingCourses
          .slice(0, 8)
          .map((course) => course.title),
        remainingChallenges: remainingChallenges
          .slice(0, 8)
          .map((challenge) => challenge.title),
      },
    });

    const result = await aiProvider.generateText({
      systemPrompt: prompt.systemPolicy,
      userPrompt: prompt.userRequest,
      model: aiProvider.FAST_MODEL,
      maxTokens: 400,
      temperature: 0.3,
    });

    const recommendation = result.text;

    if (!recommendation) {
      return res.status(502).json({
        error: "AI Tutor returned an empty recommendation.",
      });
    }

    return res.json({
      recommendation,
      stats: {
        coursesCompleted: completedCourseIds.size,
        totalCourses: allCourses.length,
        challengesCompleted: completedChallengeIds.size,
        totalChallenges: allChallenges.length,
        struggling: struggledChallenges
          .map((challenge) => challenge.challenge?.title)
          .filter(Boolean),
      },
    });
  } catch (error) {
    return handleAIError(res, error);
  }
}

// ─────────────────────────────────────────────
// STAGE 5: Grounded Fact Sheet
// ─────────────────────────────────────────────

function formatDiracState(amplitudes, threshold = 0.01) {
  if (!Array.isArray(amplitudes) || amplitudes.length === 0) {
    return "|0...0⟩";
  }

  const dominant = amplitudes.filter(
    (a) => a.probability >= threshold
  );

  if (dominant.length === 0) {
    return "|0...0⟩";
  }

  const parts = dominant.map((a) => {
    const mag =
      typeof a.magnitude === "number"
        ? a.magnitude.toFixed(2)
        : "0.00";

    const prefix = mag === "1.00" ? "" : `${mag} `;

    return `${prefix}|${a.basis}⟩`;
  });

  return parts.join(" + ");
}

// ─────────────────────────────────────────────
// Stage 5 Question Scope Validation
// ─────────────────────────────────────────────

function validateLearnerQuestionScope(question) {
  if (!question || typeof question !== "string") {
    return {
      isOutOfScope: false,
      sanitized: "",
    };
  }

  const sanitized = question
    .trim()
    .slice(0, 250);

  if (!sanitized) {
    return {
      isOutOfScope: false,
      sanitized: "",
    };
  }

  const OUT_OF_SCOPE_PATTERN =
    /\b(shor|grover|qaoa|deutsch|simon|vqe)\b|write\s+(python|qiskit|cirq|code)|implement|generate\s+code|what\s+is\s+quantum\s+computing|how\s+do\s+quantum\s+computers\s+work|teach\s+me/i;

  if (OUT_OF_SCOPE_PATTERN.test(sanitized)) {
    return {
      isOutOfScope: true,
      sanitized,
    };
  }

  return {
    isOutOfScope: false,
    sanitized,
  };
}

// ─────────────────────────────────────────────
// Stage 5 Grounded Fact Sheet
// ─────────────────────────────────────────────

function buildGroundedFactSheet(timeline, stepIndex) {
  const step = timeline.steps[stepIndex];
  const prevStep = timeline.steps[stepIndex - 1] || null;
  const transition = step.transition;

  const {
    summary,
    probability,
    phase,
    subsystems,
    measurement,
    stateMetrics,
    gate,
  } = transition;

  const isMeasurement =
    transition.type === "measurement_collapse";

  const hasObservableDifference = Boolean(
    summary.stateChanged ||
    summary.probabilityChanged ||
    summary.phaseChanged ||
    summary.blochChanged ||
    isMeasurement ||
    (stateMetrics &&
      stateMetrics.fidelity < 0.999999)
  );

  const beforeDirac =
    formatDiracState(prevStep?.amplitudes);

  const afterDirac =
    formatDiracState(step?.amplitudes);

  const keyDeltas = (
    probability?.deltas || []
  ).map((d) => ({
    basis: d.basis,
    before: Number(d.before.toFixed(3)),
    after: Number(d.after.toFixed(3)),
    delta: Number(d.delta.toFixed(3)),
    status: d.status,
  }));

  const subsystemsFact = (
    subsystems || []
  ).map((sub) => {
    const entStatus =
      sub.entanglement?.status || "unchanged";

    let normMechanism = "none";

    if (entStatus === "became_entangled") {
      normMechanism = "unitary_interaction";
    } else if (
      entStatus === "became_disentangled"
    ) {
      normMechanism = isMeasurement
        ? "measurement_disentanglement"
        : "unitary_interaction";
    } else if (
      sub.entanglement?.mechanism ===
      "not_inferred"
    ) {
      normMechanism = "not_inferred";
    }

    return {
      qubit: sub.qubit,
      movement: sub.movement,
      radiusDelta: Number(
        (sub.radiusDelta || 0).toFixed(3)
      ),
      purityDelta: Number(
        (sub.purityDelta || 0).toFixed(3)
      ),

      beforeBloch: sub.before
        ? {
            x: Number(sub.before.x.toFixed(3)),
            y: Number(sub.before.y.toFixed(3)),
            z: Number(sub.before.z.toFixed(3)),
            r: Number(sub.before.r.toFixed(3)),
            purity: Number(
              sub.before.purity.toFixed(3)
            ),
          }
        : null,

      afterBloch: sub.after
        ? {
            x: Number(sub.after.x.toFixed(3)),
            y: Number(sub.after.y.toFixed(3)),
            z: Number(sub.after.z.toFixed(3)),
            r: Number(sub.after.r.toFixed(3)),
            purity: Number(
              sub.after.purity.toFixed(3)
            ),
          }
        : null,

      entanglement: {
        status: entStatus,
        mechanism: normMechanism,
      },
    };
  });

  return {
    step: stepIndex,
    registerSize: timeline.numQubits,

    operation: isMeasurement
      ? `Projective Measurement on wire q${
          measurement?.wire ?? gate?.wire
        }`
      : `Unitary Gate '${gate.type}' on wire q${
          gate.wire
        }${
          gate.target !== null &&
          gate.target !== undefined
            ? ` targeting q${gate.target}`
            : ""
        }`,

    stateTransition:
      `${beforeDirac} ➔ ${afterDirac}`,

    stateOverlapFidelity:
      stateMetrics?.fidelity !== undefined
        ? Number(stateMetrics.fidelity.toFixed(6))
        : 1.0,

    hasObservableDifference,

    probability: {
      changed: Boolean(
        summary.probabilityChanged
      ),
      keyDeltas,
    },

    phase: {
      classification: phase.classification,

      globalShiftRad:
        phase.globalShiftRad !== null &&
        phase.globalShiftRad !== undefined
          ? Number(
              phase.globalShiftRad.toFixed(4)
            )
          : null,

      maxRelativeShiftRad:
        phase.maxRelativeShiftRad !== null &&
        phase.maxRelativeShiftRad !== undefined
          ? Number(
              phase.maxRelativeShiftRad.toFixed(4)
            )
          : null,

      description: phase.description,
    },

    subsystems: subsystemsFact,

    measurement:
      isMeasurement && measurement
        ? {
            wire: measurement.wire,
            outcome: measurement.outcome,
            preMeasurementProbability:
              Number(
                measurement.preMeasurementProbability.toFixed(
                  3
                )
              ),
            postMeasurementProbability: 1.0,
          }
        : null,

    isNoOp: Boolean(summary.isNoOp),
    headline: summary.headline,
  };
}

// ─────────────────────────────────────────────
// Deterministic Fallback
// ─────────────────────────────────────────────

function generateDeterministicFallback(
  factSheet,
  gate,
  stepIndex,
  learnerQuestion = ""
) {
  const {
    isNoOp,
    stateTransition,
    subsystems,
    measurement,
    headline,
    stateOverlapFidelity,
  } = factSheet;

  const gateType =
    (gate?.type || "").toUpperCase();

  const wire = gate?.wire ?? 0;
  const target = gate?.target;

  let mechanism = "";
  let subsystemInsight = "";
  let takeaway = "";

  if (isNoOp) {
    mechanism =
      `The ${gateType} gate had no observable physical effect on the state ` +
      `($F = ${stateOverlapFidelity.toFixed(2)}) because the target qubit ` +
      `was an eigenstate of the operator with eigenvalue $+1$.`;

    subsystemInsight =
      "The subsystem's Bloch vector coordinates remained stationary on the sphere surface.";

    takeaway =
      "An operator acting on its own eigenstate produces no observable physical change.";
  } else if (factSheet.measurement) {
    const outcome = measurement?.outcome ?? 0;

    mechanism =
      `The projective measurement collapsed the measured subsystem into the ` +
      `observed computational-basis outcome $|${outcome}\\rangle$.`;

    subsystemInsight =
      `Projective measurement conditioned on the observed outcome removed ` +
      `qubit q${wire}'s entanglement with the register when Stage 4 indicates ` +
      `that disentanglement occurred.`;

    takeaway =
      "Measurement projects the quantum state onto an outcome associated with the measurement basis.";
  } else if (gateType === "H") {
    mechanism =
      `The Hadamard gate applies the transformation ` +
      `$H = (X+Z)/\\sqrt{2}$, mapping computational-basis amplitudes ` +
      `into equal-magnitude superposition components.`;

    subsystemInsight =
      `The verified transition shows how the Bloch vector of q${wire} moved ` +
      `while preserving the subsystem's verified purity characteristics.`;

    takeaway =
      "The Hadamard gate creates superposition by mixing computational-basis amplitudes.";
  } else if (gateType === "X") {
    mechanism =
      `The Pauli-X gate performs a bit flip, exchanging the computational ` +
      `basis states $|0\\rangle$ and $|1\\rangle$.`;

    subsystemInsight =
      `The verified transition shows the Bloch-vector movement of q${wire} ` +
      `under the X-axis rotation.`;

    takeaway =
      "The Pauli-X gate is the quantum analogue of a NOT operation.";
  } else if (gateType === "Z") {
    mechanism =
      `The Pauli-Z gate leaves $|0\\rangle$ unchanged while multiplying ` +
      `the $|1\\rangle$ amplitude by $-1$, producing a relative phase shift of $\\pi$.`;

    subsystemInsight =
      `The verified transition determines whether the resulting phase ` +
      `relationship is observable through the subsystem Bloch representation.`;

    takeaway =
      "Pauli-Z changes relative phase without directly changing computational-basis probabilities.";
  } else if (gateType === "S") {
    mechanism =
      `The S gate applies a relative phase of $+\\pi/2$ to the $|1\\rangle$ ` +
      `component while leaving the $|0\\rangle$ component unchanged.`;

    subsystemInsight =
      `The verified Bloch-vector transition captures the corresponding ` +
      `rotation of the subsystem state.`;

    takeaway =
      "The S gate is a quarter-turn phase gate around the Z axis.";
  } else if (gateType === "T") {
    mechanism =
      `The T gate applies a relative phase of $+\\pi/4$ to the $|1\\rangle$ ` +
      `component.`;

    subsystemInsight =
      `The verified Bloch-vector transition shows the resulting geometric ` +
      `movement while preserving the appropriate state purity.`;

    takeaway =
      "The T gate provides a non-Clifford phase rotation important for universal quantum computation.";
  } else if (gateType === "CX") {
    const isEntangled = subsystems.some(
      (s) =>
        s.entanglement?.status ===
        "became_entangled"
    );

    if (isEntangled) {
      mechanism =
        `The CNOT gate conditionally flips target qubit q${target} based on ` +
        `control qubit q${wire}, and the verified transition indicates that ` +
        `the operation generated entanglement.`;

      subsystemInsight =
        "The reduced subsystem becomes mixed because it is entangled with the rest of the quantum register; its reduced density matrix therefore no longer represents a pure single-qubit state.";

      takeaway =
        "Entanglement stores information in joint correlations between qubits rather than independently in each qubit.";
    } else {
      mechanism =
        `The CNOT gate conditionally flips target qubit q${target} according ` +
        `to the state of control qubit q${wire}, while the verified transition ` +
        `indicates that the resulting state remains separable.`;

      subsystemInsight =
        "The subsystems remained in separable product states without loss of single-qubit purity.";

      takeaway =
        "A CNOT creates entanglement only when the overall input state supports coherent quantum correlations.";
    }
  } else if (gateType === "SWAP") {
    mechanism =
      `The SWAP gate exchanges the quantum states of q${wire} and q${target}, ` +
      `producing the verified transition ${stateTransition}.`;

    subsystemInsight =
      "The operation transfers quantum state information between wires without requiring measurement.";

    takeaway =
      "SWAP exchanges quantum states between two qubits.";
  } else {
    mechanism =
      `The ${gateType} gate produced the verified state transition ` +
      `${stateTransition} according to its unitary operation.`;

    subsystemInsight =
      "The subsystem state vectors changed according to the verified unitary transformation.";

    takeaway =
      "Unitary gates preserve the norm of the quantum state while transforming its amplitudes and phases.";
  }

  let answeredQuestion = null;

  if (learnerQuestion) {
    answeredQuestion =
      `Regarding your question "${learnerQuestion}": ` +
      `the observed behavior follows from the verified ${gateType} ` +
      `transition and its quantum transformation rule.`;
  }

  return {
    headline:
      headline ||
      `Transition at Step ${stepIndex}`,

    mechanism,
    subsystemInsight,
    takeaway,
    answeredQuestion,
  };
}

// ─────────────────────────────────────────────
// Stage 5 System Instruction
// ─────────────────────────────────────────────

const STAGE5_SYSTEM_INSTRUCTION = `
You are the Quantum Time Machine Pedagogical Explainer inside the Quantiva quantum platform.

Your role is to explain WHY a specific quantum state transition occurred between step k-1 and step k.

REASONING BOUNDARY & AUTHORITY RULES:

1. The provided QUANTUM TRANSITION FACTS are absolute, verified, authoritative ground truth.

2. Stage 4 determines WHAT happened. You explain WHY the gate's mathematical operator and physical definition produce this exact outcome.

3. You may explain known mathematical gate transformations, but you must NEVER independently recalculate a different state transition, substitute your own results, or contradict the verified facts.

4. If the transition is marked as a No-Op (isNoOp = true), explain why the operation produced no observable state difference.

SCIENTIFIC SEMANTICS RULES:

5. BASIS CONVENTION:
   Basis states are displayed in Qiskit little-endian order:
   |q(n-1)...q1 q0>, where the rightmost qubit is q0.

6. FIDELITY SEMANTICS:
   State fidelity F = |⟨ψ_before|ψ_after⟩|² measures physical state overlap.

   If fidelity F = 1, explain that there is no observable physical state difference between the states, allowing for an unobservable global phase.

   Do NOT claim that F = 1 requires raw complex amplitudes to be byte-for-byte identical.

7. MEASUREMENT SEMANTICS:
   Do NOT claim that a single measurement necessarily destroys all entanglement across the entire register.

   Only claim subsystem disentanglement when the verified Stage 4 facts explicitly indicate it.

8. MULTI-QUBIT PHASE SEMANTICS:
   Do NOT universally describe arbitrary multi-qubit relative phase as a phase "on a target wire."

   Explain verified relative-phase relationships between joint basis states without inventing unsupported single-qubit phase interpretations.

9. SUBSYSTEM PURITY & ENTANGLEMENT:
   When qubits become entangled through unitary interaction, individual reduced subsystems can lose local purity.

   Use this scientific concept when supported by the facts:

   "The reduced subsystem becomes mixed because it is entangled with the rest of the quantum register; its reduced density matrix therefore no longer represents a pure single-qubit state."

   Do NOT describe reduced purity as classical ignorance.

TRANSITION-SCOPED QUESTION HANDLING:

10. If the learner provides a learnerQuestion:

    - If it pertains to this transition, answer it directly.
    - If it is outside the scope of this transition, politely redirect the learner to the AI Tutor.

OUTPUT RULES:

Return ONLY the JSON object.

Do not use Markdown code fences.

Do not add a preamble.

Do not add commentary before or after the JSON.

The JSON must contain exactly these fields:

{
  "headline": "Brief, compelling description of the transition",
  "mechanism": "2-3 sentences explaining why the gate operator produced this state change. Use LaTeX ($...$).",
  "subsystemInsight": "1-2 sentences on the Bloch sphere, purity, or entanglement.",
  "takeaway": "One high-impact takeaway rule for the learner to remember.",
  "answeredQuestion": "Direct answer to the learner's question, or null if no question was asked."
}

Keep the complete explanation under 200 words.
`;

// ─────────────────────────────────────────────
// Stage 5 Groq Strict Response Schema
// ─────────────────────────────────────────────

const STAGE5_STRICT_SCHEMA = {
  type: "object",
  properties: {
    headline: {
      type: "string",
    },
    mechanism: {
      type: "string",
    },
    subsystemInsight: {
      type: "string",
    },
    takeaway: {
      type: "string",
    },
    answeredQuestion: {
      type: ["string", "null"],
    },
  },
  required: [
    "headline",
    "mechanism",
    "subsystemInsight",
    "takeaway",
    "answeredQuestion",
  ],
  additionalProperties: false,
};

// ─────────────────────────────────────────────
// POST /api/ai/explain-transition
// ─────────────────────────────────────────────

async function explainTransition(req, res) {
  try {
    const {
      timelineId,
      stepIndex,
      learnerQuestion,
    } = req.body || {};

    // 1. Validate timeline ID

    if (
      !timelineId ||
      typeof timelineId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        error: "timelineId is required and must be a string.",
      });
    }

    // 2. Validate step index

    const stepIdx = Number(stepIndex);

    if (
      !Number.isInteger(stepIdx) ||
      stepIdx < 1
    ) {
      return res.status(400).json({
        success: false,
        error:
          "stepIndex must be an integer >= 1. Step 0 is the initial state with no preceding transition.",
      });
    }

    // 3. Retrieve authoritative timeline

    const timeline = getTimeline(timelineId);

    if (
      !timeline ||
      !Array.isArray(timeline.steps)
    ) {
      return res.status(410).json({
        success: false,
        error: "TIMELINE_EXPIRED",
        message:
          "The circuit timeline session has expired or is invalid. Please re-run the circuit to inspect transitions.",
      });
    }

    if (
      stepIdx >= timeline.steps.length
    ) {
      return res.status(400).json({
        success: false,
        error:
          `stepIndex ${stepIdx} exceeds timeline total steps (${timeline.steps.length}).`,
      });
    }

    const step = timeline.steps[stepIdx];

    if (!step.transition) {
      return res.status(400).json({
        success: false,
        error:
          `No transition data found at step ${stepIdx}.`,
      });
    }

    // 4. Validate learner question scope

    const {
      isOutOfScope,
      sanitized: sanitizedQuestion,
    } = validateLearnerQuestionScope(
      learnerQuestion
    );

    if (isOutOfScope) {
      return res.status(200).json({
        success: true,
        timelineId,
        stepIndex: stepIdx,

        explanation: {
          headline:
            "Transition-Focused Explainer",

          mechanism:
            `This explanation tool is specialized strictly for the active gate operation at step ${stepIdx} (${step.gate?.type || "Gate"}).`,

          subsystemInsight:
            "It explains why this specific state transition and Bloch vector movement occurred.",

          takeaway:
            "For broader quantum topics, use the AI Tutor in the chat panel.",

          answeredQuestion:
            "Your question relates to an external topic outside the scope of this transition. Please ask the AI Tutor for broader quantum computing help.",
        },

        isFallback: true,
        cached: false,
      });
    }

    // 5. Build verified Stage 4 facts

    const factSheet =
      buildGroundedFactSheet(
        timeline,
        stepIdx
      );

    // 6. Deterministic fallback when Groq isn't configured

    if (!aiProvider.isConfigured()) {
      const fallbackExplanation =
        generateDeterministicFallback(
          factSheet,
          step.gate,
          stepIdx,
          sanitizedQuestion
        );

      return res.status(200).json({
        success: true,
        timelineId,
        stepIndex: stepIdx,
        explanation: fallbackExplanation,
        isFallback: true,
        cached: false,
      });
    }

    // 7. Groq structured generation

    try {
      const prompt = promptBuilder.buildStage5TransitionPrompt({
        factSheet,
        learnerQuestion: sanitizedQuestion,
      });

      const result = await aiProvider.generateStructured({
        systemPrompt: prompt.systemPolicy,
        userPrompt: prompt.userRequest,
        schemaName: "stage5_transition_explanation",
        schema: STAGE5_STRICT_SCHEMA,
        temperature: 0.1,
      });

      const parsed = result.data;

      // 8. Validate returned schema

      if (
        parsed &&
        typeof parsed === "object" &&
        typeof parsed.headline === "string" &&
        typeof parsed.mechanism === "string" &&
        typeof parsed.subsystemInsight === "string" &&
        typeof parsed.takeaway === "string" &&
        (
          parsed.answeredQuestion === null ||
          typeof parsed.answeredQuestion === "string"
        )
      ) {
        return res.status(200).json({
          success: true,
          timelineId,
          stepIndex: stepIdx,
          explanation: parsed,
          isFallback: false,
          cached: false,
        });
      }

      // 9. Schema mismatch fallback

      console.warn(
        "⚠️ Groq returned JSON, but it did not match the Stage 5 schema. Using deterministic fallback."
      );

      const fallback =
        generateDeterministicFallback(
          factSheet,
          step.gate,
          stepIdx,
          sanitizedQuestion
        );

      return res.status(200).json({
        success: true,
        timelineId,
        stepIndex: stepIdx,
        explanation: fallback,
        isFallback: true,
        cached: false,
      });
    } catch (aiErr) {
      console.warn(
        "⚠️ Groq transition explanation error, using deterministic fallback:",
        aiErr.message || aiErr
      );

      const fallback =
        generateDeterministicFallback(
          factSheet,
          step.gate,
          stepIdx,
          sanitizedQuestion
        );

      return res.status(200).json({
        success: true,
        timelineId,
        stepIndex: stepIdx,
        explanation: fallback,
        isFallback: true,
        cached: false,
      });
    }
  } catch (err) {
    console.error(
      "❌ explainTransition fatal controller error:",
      err
    );

    return res.status(500).json({
      success: false,
      error:
        "Internal server error during transition explanation.",
    });
  }
}

// ─────────────────────────────────────────────
// STAGE 6: NOISE LAB AI EXPLANATION
// ─────────────────────────────────────────────

const STAGE6_NOISE_SYSTEM_INSTRUCTION = `
You are the Noise Lab Tutor embedded inside Quantiva, an exploratory quantum computing platform.
Your task is to explain how physical environmental noise causes the quantum state's trajectory to depart from the ideal circuit trajectory.

Guiding Principles:
1. Physical Truth: Rely exclusively on the verified Grounded Noise Fact Sheet provided in the prompt.
2. Mixedness vs Entanglement (CRITICAL GUARDRAIL):
   Reduced purity (purity < 1.0) and contracted Bloch vector radius (r < 1.0) measure statistical mixedness and decoherence caused by environmental noise.
   NEVER state or imply that reduced purity or Bloch shrinkage represents entanglement.
3. Clarity and Tone: Be concise, clear, and pedagogical. Use KaTeX math ($...$) for formulas and state vectors.
4. Channel Specifics:
   - Depolarizing: Causes uniform radial shrinkage towards the center of the Bloch sphere, flattening probability distributions towards maximally mixed states.
   - Phase-Flip (Dephasing): Destroys transverse quantum coherence (x and y shrink), preserving longitudinal populations (z remains unchanged).
   - Bit-Flip (X-noise): Inverts basis populations (|0> <-> |1>), altering z coordinates.
   - Readout Error: A classical detector measurement error that leaves the physical quantum state and fidelity F=1.0 completely untouched, while perturbing observed measurement statistics.
5. Scope: Focus strictly on the divergence between the ideal and noisy states at this step.
`;

const STAGE6_STRICT_SCHEMA = {
  type: "object",
  properties: {
    headline: {
      type: "string",
      description: "A short, punchy summary of the noise effect at this step.",
    },
    physicalMechanism: {
      type: "string",
      description: "Clear pedagogical explanation of how this specific noise channel affected the state at this step.",
    },
    blochDivergence: {
      type: "string",
      description: "Explanation of how the Bloch sphere coordinates and radial purity diverged from the ideal pure state.",
    },
    takeaway: {
      type: "string",
      description: "One actionable takeaway for understanding quantum decoherence or error mitigation.",
    },
  },
  required: ["headline", "physicalMechanism", "blochDivergence", "takeaway"],
  additionalProperties: false,
};

function buildGroundedNoiseFactSheet(idealTimeline, noisyTimeline, stepIdx) {
  const noisyStep = noisyTimeline.steps[stepIdx] || {};
  const idealStep = (idealTimeline.steps && idealTimeline.steps[stepIdx]) || {};
  const divSummary = noisyTimeline.divergenceSummary || {};

  const subsystems = (noisyStep.blochVectors || []).map((nb, i) => {
    const ib = (noisyStep.idealBlochVectors && noisyStep.idealBlochVectors[i]) ||
               (idealStep.blochVectors && idealStep.blochVectors[i]) ||
               null;
    const idealR = ib ? ib.r : 1.0;
    return {
      qubit: nb.qubit !== undefined ? nb.qubit : i,
      idealRadius: idealR,
      noisyRadius: nb.r,
      radialShrinkage: Number((nb.r - idealR).toFixed(4)),
    };
  });

  return {
    step: stepIdx,
    gate: noisyStep.appliedGate || null,
    noiseModel: divSummary.noiseModel || "depolarizing",
    noiseStrength: divSummary.noiseStrength !== undefined ? divSummary.noiseStrength : 0.0,
    stateFidelity: noisyStep.fidelity !== undefined ? noisyStep.fidelity : 1.0,
    divergence: noisyStep.divergence !== undefined ? noisyStep.divergence : 0.0,
    purityDelta: noisyStep.purityDelta !== undefined ? noisyStep.purityDelta : 0.0,
    subsystems,
    firstMeaningfulDivergenceStep: divSummary.firstMeaningfulDivergenceStep || null,
    gateAtFirstDivergence: divSummary.gateAtFirstDivergence || null,
    isReadoutOnly: divSummary.noiseModel === "readout",
  };
}

function generateDeterministicNoiseFallback(factSheet, learnerQuestion = null) {
  const { noiseModel, noiseStrength, stateFidelity, divergence, purityDelta, subsystems, isReadoutOnly, gate } = factSheet;
  const pctDivergence = ((divergence || 0) * 100).toFixed(1);
  const fidPct = ((stateFidelity || 1) * 100).toFixed(1);
  const gateName = gate ? `${gate.type}${gate.wire !== undefined ? ` on wire ${gate.wire}` : ""}` : "Initial state";

  let headline = `Noise Divergence: ${pctDivergence}% state deviation`;
  let physicalMechanism = "";
  let blochDivergence = "";
  let takeaway = "";

  if (isReadoutOnly) {
    headline = "Readout (Measurement) Noise";
    physicalMechanism = `Readout error with strength ${(noiseStrength * 100).toFixed(0)}% represents classical detector infidelity during measurement. The underlying physical quantum state and fidelity remain 100% ideal ($F = 1.0$), but observed measurement statistics deviate from true quantum probabilities.`;
    blochDivergence = "The quantum Bloch vector is completely unaffected ($r = 1.0$) because readout noise only affects the classical registration of measurement results.";
    takeaway = "Readout error is classical measurement noise, not physical decoherence. Error mitigation techniques (like matrix inversion) can often correct it.";
  } else if (noiseModel === "depolarizing") {
    headline = `Depolarizing Noise: ${pctDivergence}% divergence`;
    physicalMechanism = `Depolarizing noise with strength ${(noiseStrength * 100).toFixed(1)}% introduces isotropic Pauli errors following ${gateName}, reducing state fidelity to ${fidPct}%.`;
    blochDivergence = `The Bloch vector contracts radially towards the sphere center (purity change $\\Delta \\gamma = ${purityDelta.toFixed(3)}$). This radial shrinkage represents statistical mixedness from decoherence, not entanglement.`;
    takeaway = "Depolarizing noise symmetrically drives quantum states toward the maximally mixed state ($I/2$).";
  } else if (noiseModel === "phase_flip") {
    headline = `Phase-Flip Dephasing: ${pctDivergence}% divergence`;
    physicalMechanism = `Phase-flip noise applies a random $Z$ operation with probability ${(noiseStrength * 100).toFixed(1)}%, damping off-diagonal density matrix elements (coherence).`;
    blochDivergence = "The transverse Bloch coordinates ($x, y$) contract while computational populations ($z$) remain conserved. The state contracts along the equatorial plane.";
    takeaway = "Dephasing destroys quantum phase relationships without altering computational basis probabilities.";
  } else if (noiseModel === "bit_flip") {
    headline = `Bit-Flip Noise: ${pctDivergence}% divergence`;
    physicalMechanism = `Bit-flip noise applies an unwanted $X$ operation with probability ${(noiseStrength * 100).toFixed(1)}%, swapping computational basis states $|0\\rangle \\leftrightarrow |1\\rangle$.`;
    blochDivergence = "The longitudinal coordinate ($z$) is shifted, causing basis state probability inversion.";
    takeaway = "Bit-flip noise is the quantum equivalent of classical bit errors and directly degrades computational accuracy.";
  } else {
    headline = `Noise Effect: ${pctDivergence}% divergence`;
    physicalMechanism = `Environmental noise has reduced state fidelity to ${fidPct}%.`;
    blochDivergence = `Bloch vectors deviate from ideal pure state trajectories with a purity drop of ${purityDelta.toFixed(3)}.`;
    takeaway = "Noise leads to mixed states inside the Bloch sphere.";
  }

  return {
    headline,
    physicalMechanism,
    blochDivergence,
    takeaway,
  };
}

/**
 * POST /api/ai/explain-noise
 * Generates grounded pedagogical explanation comparing ideal vs noisy state trajectory.
 * Body: { timelineId, noisyTimelineId, stepIndex, learnerQuestion }
 */
async function explainNoise(req, res) {
  try {
    const {
      timelineId,
      noisyTimelineId,
      stepIndex,
      learnerQuestion,
    } = req.body || {};

    // ---------------------------------------------------------
    // 1. Validate request
    // ---------------------------------------------------------
    if (!timelineId || typeof timelineId !== "string") {
      return res.status(400).json({
        success: false,
        error: "INVALID_TIMELINE_ID",
        message: "timelineId is required.",
      });
    }

    if (!noisyTimelineId || typeof noisyTimelineId !== "string") {
      return res.status(400).json({
        success: false,
        error: "INVALID_NOISY_TIMELINE_ID",
        message: "noisyTimelineId is required.",
      });
    }

    const stepIdx = Number(stepIndex);

    if (!Number.isInteger(stepIdx) || stepIdx < 0) {
      return res.status(400).json({
        success: false,
        error: "INVALID_STEP_INDEX",
        message: "stepIndex must be a non-negative integer.",
      });
    }

    const cleanTimelineId = timelineId.trim();
    const cleanNoisyTimelineId = noisyTimelineId.trim();

    // ---------------------------------------------------------
    // 2. Diagnostic logging
    // ---------------------------------------------------------
    console.log("[Stage 6] explainNoise request:", {
      timelineId: cleanTimelineId,
      noisyTimelineId: cleanNoisyTimelineId,
      stepIndex: stepIdx,
    });

    // ---------------------------------------------------------
    // 3. Retrieve IDEAL timeline
    // ---------------------------------------------------------
    const idealTimeline = getTimeline(cleanTimelineId);

    console.log("[Stage 6] Ideal timeline lookup:", {
      timelineId: cleanTimelineId,
      found: !!idealTimeline,
      steps: idealTimeline?.steps?.length,
    });

    if (!idealTimeline || !Array.isArray(idealTimeline.steps)) {
      console.error(
        "[Stage 6] IDEAL TIMELINE NOT FOUND:",
        cleanTimelineId
      );

      return res.status(410).json({
        success: false,
        error: "TIMELINE_EXPIRED",
        message:
          "The circuit timeline session has expired. Please re-run circuit evaluation.",
      });
    }

    // ---------------------------------------------------------
    // 4. Retrieve NOISY timeline
    // ---------------------------------------------------------
    const noisyTimeline = getNoisyTimeline(cleanNoisyTimelineId);

    console.log("[Stage 6] Noisy timeline lookup:", {
      noisyTimelineId: cleanNoisyTimelineId,
      found: !!noisyTimeline,
      steps: noisyTimeline?.steps?.length,
    });

    if (!noisyTimeline || !Array.isArray(noisyTimeline.steps)) {
      console.error(
        "[Stage 6] NOISY TIMELINE NOT FOUND:",
        cleanNoisyTimelineId
      );

      return res.status(410).json({
        success: false,
        error: "NOISY_TIMELINE_EXPIRED",
        message:
          "The noisy timeline session has expired. Please re-run noisy simulation.",
      });
    }

    // ---------------------------------------------------------
    // 5. Validate step index against noisy timeline
    // ---------------------------------------------------------
    if (stepIdx >= noisyTimeline.steps.length) {
      return res.status(400).json({
        success: false,
        error: "STEP_INDEX_OUT_OF_RANGE",
        message: `stepIndex ${stepIdx} is outside the noisy timeline range.`,
        availableSteps: noisyTimeline.steps.length,
      });
    }

    // ---------------------------------------------------------
    // 6. Validate corresponding ideal step
    // ---------------------------------------------------------
    if (
      !idealTimeline.steps[stepIdx] &&
      stepIdx >= idealTimeline.steps.length
    ) {
      return res.status(400).json({
        success: false,
        error: "IDEAL_STEP_INDEX_OUT_OF_RANGE",
        message: `stepIndex ${stepIdx} is outside the ideal timeline range.`,
        availableSteps: idealTimeline.steps.length,
      });
    }

    // ---------------------------------------------------------
    // 7. Build verified Stage 4 fact sheet
    // ---------------------------------------------------------
    const factSheet = buildGroundedNoiseFactSheet(
      idealTimeline,
      noisyTimeline,
      stepIdx
    );

    console.log("[Stage 6] Grounded fact sheet created:", {
      step: factSheet.step,
      gate: factSheet.gate,
      noiseModel: factSheet.noiseModel,
      noiseStrength: factSheet.noiseStrength,
      stateFidelity: factSheet.stateFidelity,
      divergence: factSheet.divergence,
      purityDelta: factSheet.purityDelta,
      firstMeaningfulDivergenceStep:
        factSheet.firstMeaningfulDivergenceStep,
      isReadoutOnly: factSheet.isReadoutOnly,
    });

    // ---------------------------------------------------------
    // 8. Deterministic fallback if Groq unavailable
    // ---------------------------------------------------------
    if (!aiProvider.isConfigured()) {
      console.warn(
        "[Stage 6] Groq unavailable. Using deterministic fallback."
      );

      const fallback = generateDeterministicNoiseFallback(
        factSheet,
        learnerQuestion
      );

      return res.status(200).json({
        success: true,
        source: "deterministic-fallback",
        explanation: fallback,
        factSheet,
      });
    }

    // ---------------------------------------------------------
    // 9. Groq structured explanation
    // ---------------------------------------------------------
    try {
      const prompt = promptBuilder.buildStage6NoisePrompt({
        factSheet,
        learnerQuestion,
      });

      const result = await aiProvider.generateStructured({
        systemPrompt: prompt.systemPolicy,
        userPrompt: prompt.userRequest,
        schemaName: "stage6_noise_explanation",
        schema: STAGE6_STRICT_SCHEMA,
        temperature: 0.1,
      });

      const explanation = result.data;

      // -------------------------------------------------------
      // 10. Validate and return Groq explanation
      // -------------------------------------------------------
      if (
        explanation &&
        typeof explanation === "object" &&
        typeof explanation.headline === "string" &&
        typeof explanation.physicalMechanism === "string" &&
        typeof explanation.blochDivergence === "string" &&
        typeof explanation.takeaway === "string"
      ) {
        return res.status(200).json({
          success: true,
          source: "groq",
          explanation,
          factSheet,
        });
      }

      console.warn(
        "[Stage 6] Groq JSON schema mismatch. Using fallback."
      );

      const fallback = generateDeterministicNoiseFallback(
        factSheet,
        learnerQuestion
      );

      return res.status(200).json({
        success: true,
        source: "deterministic-fallback",
        explanation: fallback,
        factSheet,
      });
    } catch (aiErr) {
      // -------------------------------------------------------
      // 11. Groq failure → deterministic fallback
      // -------------------------------------------------------
      console.error(
        "[Stage 6] Groq explanation failed, using deterministic fallback:",
        aiErr.message || aiErr
      );

      const fallback = generateDeterministicNoiseFallback(
        factSheet,
        learnerQuestion
      );

      return res.status(200).json({
        success: true,
        source: "deterministic-fallback",
        explanation: fallback,
        factSheet,
      });
    }
  } catch (err) {
    // ---------------------------------------------------------
    // 13. Unexpected server error
    // ---------------------------------------------------------
    console.error("[Stage 6] explainNoise unexpected error:", err);

    return res.status(500).json({
      success: false,
      error: "NOISE_EXPLANATION_FAILED",
      message:
        err?.message ||
        "Failed to generate noise divergence explanation.",
    });
  }
}

// ─────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────

module.exports = {
  chat,
  explainConcept,
  analyzeCircuit,
  recommend,
  explainTransition,
  explainNoise,

  // Export helpers for testing
  validateLearnerQuestionScope,
  buildGroundedFactSheet,
  generateDeterministicFallback,
  buildGroundedNoiseFactSheet,
  generateDeterministicNoiseFallback,
};