/**
 * AI Tutor Controller
 *
 * Uses Google Gemini to power:
 * - Free-form AI tutoring chat
 * - Quantum concept explanations
 * - Circuit debugging and optimization
 * - Personalized learning recommendations
 */

const { GoogleGenAI } = require("@google/genai");

const UserProgress = require("../models/UserProgress");
const Challenge = require("../models/Challenge");
const Course = require("../models/Course");

// ─────────────────────────────────────────────
// Gemini Configuration
// ─────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = "gemini-3.6-flash";
let genAI = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
  });
}

// ─────────────────────────────────────────────
// System Instruction
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
   The platform renders mathematics using KaTeX.

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
  if (!genAI) {
    const error = new Error(
      "AI Tutor is not configured. Set GEMINI_API_KEY in the server .env file."
    );

    error.code = "AI_NOT_CONFIGURED";

    throw error;
  }
}

function handleAIError(res, error) {
  console.error("❌ AI Tutor error:", error);

  if (error?.code === "AI_NOT_CONFIGURED") {
    return res.status(503).json({
      error: error.message,
    });
  }

  // Gemini/API errors can contain useful information.
  // Log the detailed error on the server, but don't expose
  // unnecessary internal information to production clients.
  return res.status(502).json({
    error: "AI Tutor is temporarily unavailable. Please try again.",
  });
}

// Safely extract text from Gemini response.
function getResponseText(result) {
  if (!result) {
    return "";
  }

  // Current @google/genai SDK
  if (typeof result.text === "string") {
    return result.text;
  }

  // Defensive fallback
  if (result.response && typeof result.response.text === "function") {
    return result.response.text();
  }

  return "";
}

// ─────────────────────────────────────────────
// POST /api/ai/chat
//
// Body:
// {
//   message: string,
//   history?: [
//     { role: "user", text: "..." },
//     { role: "assistant", text: "..." }
//   ],
//   context?: {
//     page?: string,
//     algorithmId?: string,
//     code?: string
//   }
// }
// ─────────────────────────────────────────────

async function chat(req, res) {
  try {
    const {
      message,
      history = [],
      context = {},
    } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "message is required",
      });
    }

    ensureAIConfigured();

    // Limit history to the most recent 10 messages.
    const recentHistory = Array.isArray(history)
      ? history.slice(-10)
      : [];

    // Convert frontend history into Gemini format.
    const contents = recentHistory
      .filter((item) => item && item.text)
      .map((item) => ({
        role: item.role === "assistant" ? "model" : "user",
        parts: [
          {
            text: String(item.text).slice(0, 4000),
          },
        ],
      }));

    // Build contextual information.
    let contextPreamble = "";

    if (context && context.page) {
      contextPreamble +=
        `The user is currently on the "${String(context.page)}" page.\n`;
    }

    if (context && context.algorithmId) {
      contextPreamble +=
        `They are viewing the "${String(context.algorithmId)}" algorithm.\n`;
    }

    if (context && context.code) {
      contextPreamble += `
Here is the user's current code or circuit for reference:

\`\`\`
${String(context.code).slice(0, 4000)}
\`\`\`
`;
    }

    const finalMessage = contextPreamble
      ? `${contextPreamble}\nUser question:\n${message}`
      : message;

    contents.push({
      role: "user",
      parts: [
        {
          text: finalMessage,
        },
      ],
    });

    const result = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        maxOutputTokens: 1024,
        temperature: 0.6,
      },
    });

    const reply = getResponseText(result);

    if (!reply) {
      return res.status(502).json({
        error: "AI Tutor returned an empty response.",
      });
    }

    return res.json({
      reply,
    });
  } catch (error) {
    return handleAIError(res, error);
  }
}

// ─────────────────────────────────────────────
// POST /api/ai/explain
//
// Body:
// {
//   concept: string
// }
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

    const prompt = `
Explain the following quantum computing concept to a learner:

"${concept}"

Structure your answer as:

1. Intuitive definition
   Give a simple one-sentence explanation.

2. Analogy
   Give a short non-technical analogy.

3. Key mathematics
   Include important mathematics if appropriate.
   Use LaTeX.

4. Why it matters
   Explain why this concept is useful in quantum computing
   or quantum algorithms.

Keep the complete response under 220 words.
`;

    const result = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        maxOutputTokens: 700,
        temperature: 0.5,
      },
    });

    const explanation = getResponseText(result);

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
//
// Body:
// {
//   code?: string,
//   gates?: array,
//   numQubits?: number,
//   backend?: string
// }
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

    let description = "";

    if (code) {
      description = `
Here is a quantum circuit written using ${backend}:

\`\`\`python
${String(code).slice(0, 6000)}
\`\`\`
`;
    } else {
      let serializedGates;

      try {
        serializedGates = JSON.stringify(gates);
      } catch {
        serializedGates = "Unable to serialize gate data.";
      }

      description = `
Here is a circuit created with the drag-and-drop circuit editor.

Number of qubits:
${numQubits ?? "unknown"}

Gate sequence:
${serializedGates.slice(0, 4000)}
`;
    }

    const prompt = `
${description}

Analyze this quantum circuit.

Respond using exactly these three sections:

**Bugs**

Identify correctness problems such as:
- Incorrect gates
- Incorrect qubit indices
- Invalid gate arguments
- Missing measurements
- Incorrect control/target relationships
- Logic that is likely to produce an unintended result
- Code that could crash

If there are no obvious problems, say:
"None found."

**Optimizations**

Look for:
- Consecutive gates that cancel
- Redundant gates
- Unnecessary identity operations
- Unnecessary CNOTs
- Opportunities to reduce circuit depth
- Other gate-level simplifications

If no useful optimization exists, say:
"None."

**What it does**

Explain in one or two sentences what the circuit appears to do
and what quantum state or measurement behavior it is likely intended
to produce.

Be concise because this response appears in a side panel.
`;

    const result = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        maxOutputTokens: 900,
        temperature: 0.4,
      },
    });

    const analysis = getResponseText(result);

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
//
// Requires authentication.
//
// Uses:
// - User progress
// - Completed courses
// - Completed challenges
// - Struggled challenges
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

    // ─────────────────────────────────────────
    // Completed Courses
    // ─────────────────────────────────────────

    const completedCourseIds = new Set(
      (progress?.courseProgress || [])
        .filter((course) => course.completed)
        .map((course) => course.course?._id?.toString())
        .filter(Boolean)
    );

    // ─────────────────────────────────────────
    // Completed Challenges
    // ─────────────────────────────────────────

    const completedChallengeIds = new Set(
      (progress?.challengeProgress || [])
        .filter((challenge) => challenge.completed)
        .map((challenge) => challenge.challenge?._id?.toString())
        .filter(Boolean)
    );

    // ─────────────────────────────────────────
    // Struggling Challenges
    // ─────────────────────────────────────────

    const struggledChallenges = (
      progress?.challengeProgress || []
    ).filter(
      (challenge) =>
        !challenge.completed &&
        Number(challenge.attempts || 0) >= 2
    );

    // ─────────────────────────────────────────
    // Remaining Content
    // ─────────────────────────────────────────

    const remainingCourses = allCourses.filter(
      (course) =>
        !completedCourseIds.has(course._id.toString())
    );

    const remainingChallenges = allChallenges.filter(
      (challenge) =>
        !completedChallengeIds.has(challenge._id.toString())
    );

    // ─────────────────────────────────────────
    // AI Prompt
    // ─────────────────────────────────────────

    const prompt = `
A learner on the Quantiva quantum computing platform has the
following progress:

Completed courses:
${completedCourseIds.size} of ${allCourses.length}

Completed challenges:
${completedChallengeIds.size} of ${allChallenges.length}

Challenges attempted at least twice without completion:
${JSON.stringify(
  struggledChallenges
    .map((item) => item.challenge?.title)
    .filter(Boolean)
)}

Remaining courses:
${JSON.stringify(
  remainingCourses
    .slice(0, 8)
    .map((course) => course.title)
)}

Remaining challenges in intended order:
${JSON.stringify(
  remainingChallenges
    .slice(0, 8)
    .map((challenge) => challenge.title)
)}

Recommend a personalized learning path.

Choose:

1. The single best next course.
2. The single best next challenge.
3. If the learner is struggling with challenges, identify the
   underlying quantum computing concept they should review first.

Respond with exactly 3 short bullet points.

Do not add a preamble.
`;

    const result = await genAI.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        maxOutputTokens: 500,
        temperature: 0.5,
      },
    });

    const recommendation = getResponseText(result);

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
// Exports
// ─────────────────────────────────────────────

module.exports = {
  chat,
  explainConcept,
  analyzeCircuit,
  recommend,
};

