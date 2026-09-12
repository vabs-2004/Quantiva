/**
 * lessonGeneratorService.js
 * 
 * Quantiva Phase 7H: User-Generated Interactive Learning Service
 * 
 * Responsibilities:
 * 1. Curated Content Priority Check (using canonical content registry / Knowledge Map)
 * 2. Structured, bounded JSON prompt construction for the Groq AI provider
 * 3. Strict schema parsing and validation (zero raw HTML/JSX/JS/eval)
 * 4. Whitelisted interactive component and config validation
 * 5. Deterministic persistence in the GeneratedLesson collection scoped to req.user.id
 */

const aiProvider = require("./aiProvider");
const contentRegistryService = require("./contentRegistryService");
const GeneratedLesson = require("../models/GeneratedLesson");
const UserProgress = require("../models/UserProgress");
const { KNOWLEDGE_MAP_TOPICS } = require("../data/knowledgeMapData");

// Whitelisted interactive component types
const ALLOWED_COMPONENTS = [
  "bloch-sphere",
  "circuit",
  "complex-plane",
  "state-vector",
  "probability-heatmap",
];

// Whitelisted section types
const ALLOWED_SECTION_TYPES = [
  "explanation",
  "intuition",
  "formula",
  "visualization",
  "interactive",
  "experiment",
  "reflection",
];

// Max limits to avoid pathological payloads
const BOUNDS = {
  MAX_TITLE_LEN: 200,
  MAX_SUMMARY_LEN: 1000,
  MIN_SECTIONS: 2,
  MAX_SECTIONS: 10,
  MAX_SECTION_TITLE_LEN: 200,
  MAX_SECTION_CONTENT_LEN: 8000,
  MAX_FORMULA_LEN: 2000,
  MAX_QUESTION_OPTIONS: 5,
  MAX_OPTION_LEN: 400,
  MAX_ESTIMATED_MINUTES: 60,
  MIN_ESTIMATED_MINUTES: 1,
};

/**
 * Checks if Quantiva has an authoritative curated resource for a given topic or query.
 * Uses exact / alias matching from contentRegistryService and canonical Knowledge Map.
 * 
 * @param {string} topicQuery - Canonical slug or display title
 * @returns {Promise<{ hasCurated: boolean, curatedResource: object|null }>}
 */
async function checkCuratedResource(topicQuery) {
  if (!topicQuery || typeof topicQuery !== "string") {
    return { hasCurated: false, curatedResource: null };
  }

  const queryClean = topicQuery.trim().toLowerCase();

  // 1. Direct match in Knowledge Map topics
  const kmTopic = KNOWLEDGE_MAP_TOPICS.find(
    (t) =>
      t.topicId.toLowerCase() === queryClean ||
      t.title.toLowerCase() === queryClean
  );

  if (kmTopic && kmTopic.resource) {
    return {
      hasCurated: true,
      curatedResource: {
        type: kmTopic.resource.type,
        id: kmTopic.resource.id,
        route: kmTopic.resource.route,
        title: kmTopic.title,
        topicId: kmTopic.topicId,
      },
    };
  }

  // 2. Exact match in Content Registry (Micro Modules or Algorithms)
  try {
    const registryResult = await contentRegistryService.search({
      q: topicQuery,
      limit: 5,
    });

    if (registryResult && registryResult.results && registryResult.results.length > 0) {
      const topMatch = registryResult.results[0];
      // Check if top match title, id, or aliases strictly match query
      const isExactId = topMatch.id.toLowerCase() === queryClean;
      const isExactTitle = topMatch.title.toLowerCase() === queryClean;
      const isExactAlias = Array.isArray(topMatch.aliases) &&
        topMatch.aliases.some((a) => a.toLowerCase() === queryClean);

      if ((isExactId || isExactTitle || isExactAlias) && topMatch.type !== "tool") {
        let route = topMatch.url;
        if (!route) {
          if (topMatch.type === "micro_module") route = `/micro-modules/${topMatch.id}`;
          else if (topMatch.type === "algorithm") route = `/algorithm/${topMatch.id}`;
          else if (topMatch.type === "course") route = `/courses/${topMatch.id}`;
        }

        return {
          hasCurated: true,
          curatedResource: {
            type: topMatch.type,
            id: topMatch.id,
            route,
            title: topMatch.title,
            topicId: topMatch.id,
          },
        };
      }
    }
  } catch (err) {
    console.warn("[lessonGeneratorService] Curated registry lookup warning:", err.message);
  }

  return { hasCurated: false, curatedResource: null };
}

/**
 * Sanitizes and validates a single interactive component configuration.
 * Prevents executable script/handler injection into mixed config objects.
 */
function sanitizeComponentConfig(type, rawConfig) {
  if (!rawConfig || typeof rawConfig !== "object") return {};

  const config = JSON.parse(JSON.stringify(rawConfig)); // Deep clone

  // Security check: reject keys or values that attempt script injection
  const stringified = JSON.stringify(config).toLowerCase();
  if (
    stringified.includes("<script") ||
    stringified.includes("javascript:") ||
    stringified.includes("eval(") ||
    stringified.includes("new function") ||
    stringified.includes("onload=") ||
    stringified.includes("onerror=")
  ) {
    throw new Error("Interactive component config contains disallowed or unsafe tokens.");
  }

  // Component-specific validation & normalization
  if (type === "bloch-sphere") {
    return {
      initialTheta: typeof config.initialTheta === "number" ? config.initialTheta : Math.PI / 2,
      initialPhi: typeof config.initialPhi === "number" ? config.initialPhi : 0,
      allowedGates: Array.isArray(config.allowedGates)
        ? config.allowedGates.filter((g) => ["X", "Y", "Z", "H", "S", "T"].includes(g))
        : ["X", "Y", "Z", "H"],
      instructions: typeof config.instructions === "string" ? config.instructions.slice(0, 300) : "",
    };
  }

  if (type === "circuit") {
    const numQubits = Math.max(1, Math.min(4, Number(config.numQubits) || 2));
    const rawGates = Array.isArray(config.gates) ? config.gates : [];
    const validGates = ["H", "X", "Y", "Z", "S", "T", "CX", "SWAP", "M"];
    const gates = rawGates
      .filter(
        (g) =>
          g &&
          typeof g === "object" &&
          typeof g.wire === "number" &&
          g.wire >= 0 &&
          g.wire < numQubits &&
          validGates.includes(g.type)
      )
      .slice(0, 16)
      .map((g) => ({
        wire: g.wire,
        type: g.type,
        step: typeof g.step === "number" ? Math.max(0, Math.min(10, g.step)) : 0,
        target: typeof g.target === "number" ? Math.max(0, Math.min(numQubits - 1, g.target)) : undefined,
      }));

    return {
      numQubits,
      gates,
      instructions: typeof config.instructions === "string" ? config.instructions.slice(0, 300) : "",
    };
  }

  if (type === "complex-plane") {
    const r = typeof config.r === "number" ? Math.max(-2, Math.min(2, config.r)) : 1.0;
    const i = typeof config.i === "number" ? Math.max(-2, Math.min(2, config.i)) : 0.0;
    return {
      r,
      i,
      range: 2.0,
      showComponents: config.showComponents !== false,
      instructions: typeof config.instructions === "string" ? config.instructions.slice(0, 300) : "",
    };
  }

  if (type === "probability-heatmap" || type === "state-vector") {
    const probs = {};
    if (config.probabilities && typeof config.probabilities === "object") {
      Object.entries(config.probabilities).forEach(([k, v]) => {
        if (/^[01]{1,4}$/.test(k) && typeof v === "number" && v >= 0 && v <= 1) {
          probs[k] = Math.round(v * 1000) / 1000;
        }
      });
    }
    if (Object.keys(probs).length === 0) {
      probs["0"] = 1.0;
    }
    return {
      probabilities: probs,
      instructions: typeof config.instructions === "string" ? config.instructions.slice(0, 300) : "",
    };
  }

  return {};
}

/**
 * Validates and sanitizes a complete lesson specification against all security and schema bounds.
 * Throws Error on any violation.
 */
function validateLessonSpec(spec) {
  if (!spec || typeof spec !== "object") {
    throw new Error("Invalid lesson specification: expected JSON object.");
  }

  // 1. Basic properties
  const title = (spec.title || "").trim();
  if (!title || title.length > BOUNDS.MAX_TITLE_LEN) {
    throw new Error(`Lesson title is required and must be under ${BOUNDS.MAX_TITLE_LEN} characters.`);
  }

  const summary = (spec.summary || "").trim();
  if (summary.length > BOUNDS.MAX_SUMMARY_LEN) {
    throw new Error(`Lesson summary must be under ${BOUNDS.MAX_SUMMARY_LEN} characters.`);
  }

  const difficulty = ["beginner", "intermediate", "advanced"].includes(spec.difficulty)
    ? spec.difficulty
    : "intermediate";

  const estimatedMinutes = Math.max(
    BOUNDS.MIN_ESTIMATED_MINUTES,
    Math.min(BOUNDS.MAX_ESTIMATED_MINUTES, Number(spec.estimatedMinutes) || 7)
  );

  // 2. Sections
  if (!Array.isArray(spec.sections) || spec.sections.length < BOUNDS.MIN_SECTIONS) {
    throw new Error(`Lesson must contain at least ${BOUNDS.MIN_SECTIONS} sections.`);
  }
  if (spec.sections.length > BOUNDS.MAX_SECTIONS) {
    throw new Error(`Lesson cannot exceed ${BOUNDS.MAX_SECTIONS} sections.`);
  }

  const validatedSections = [];
  for (let idx = 0; idx < spec.sections.length; idx++) {
    const s = spec.sections[idx];
    if (!s || typeof s !== "object") {
      throw new Error(`Section at index ${idx} is invalid.`);
    }

    const sId = (s.id || `sec-${idx + 1}`).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
    const sType = ALLOWED_SECTION_TYPES.includes(s.type) ? s.type : "explanation";
    const sTitle = (s.title || `Section ${idx + 1}`).trim().slice(0, BOUNDS.MAX_SECTION_TITLE_LEN);
    const sContent = (s.content || "").trim();

    if (!sContent) {
      throw new Error(`Section "${sTitle}" cannot have empty content.`);
    }
    if (sContent.length > BOUNDS.MAX_SECTION_CONTENT_LEN) {
      throw new Error(`Section "${sTitle}" content exceeds ${BOUNDS.MAX_SECTION_CONTENT_LEN} characters.`);
    }

    // Security check against script injection in text content
    if (
      sContent.includes("<script") ||
      sContent.includes("javascript:") ||
      sContent.includes("eval(") ||
      sContent.includes("new Function(")
    ) {
      throw new Error(`Section "${sTitle}" contains disallowed script tokens.`);
    }

    // Optional formula
    let formulaObj = undefined;
    if (s.formula && typeof s.formula === "object" && s.formula.latex) {
      const latex = String(s.formula.latex).trim().slice(0, BOUNDS.MAX_FORMULA_LEN);
      const explanation = s.formula.explanation
        ? String(s.formula.explanation).trim().slice(0, BOUNDS.MAX_FORMULA_LEN)
        : "";
      formulaObj = { latex, explanation };
    }

    // Interactive Component
    let interactiveObj = undefined;
    if (s.interactiveComponent && typeof s.interactiveComponent === "object") {
      const cType = s.interactiveComponent.type;
      if (ALLOWED_COMPONENTS.includes(cType)) {
        const sanitizedConfig = sanitizeComponentConfig(cType, s.interactiveComponent.config);
        interactiveObj = {
          type: cType,
          config: sanitizedConfig,
        };
      }
    }

    // Optional check question
    let questionObj = undefined;
    if (s.checkQuestion && typeof s.checkQuestion === "object" && s.checkQuestion.question) {
      const qText = String(s.checkQuestion.question).trim().slice(0, 1000);
      const rawOptions = Array.isArray(s.checkQuestion.options) ? s.checkQuestion.options : [];
      const options = rawOptions
        .map((opt) => String(opt).trim().slice(0, BOUNDS.MAX_OPTION_LEN))
        .filter(Boolean)
        .slice(0, BOUNDS.MAX_QUESTION_OPTIONS);

      const correctIndex =
        typeof s.checkQuestion.correctIndex === "number" &&
        s.checkQuestion.correctIndex >= 0 &&
        s.checkQuestion.correctIndex < options.length
          ? s.checkQuestion.correctIndex
          : 0;

      const qExpl = s.checkQuestion.explanation
        ? String(s.checkQuestion.explanation).trim().slice(0, 1500)
        : "";

      if (options.length >= 2) {
        questionObj = {
          question: qText,
          options,
          correctIndex,
          explanation: qExpl,
        };
      }
    }

    validatedSections.push({
      id: sId,
      type: sType,
      title: sTitle,
      content: sContent,
      ...(formulaObj ? { formula: formulaObj } : {}),
      ...(interactiveObj ? { interactiveComponent: interactiveObj } : {}),
      ...(questionObj ? { checkQuestion: questionObj } : {}),
    });
  }

  // Ensure at least one section has an interactive visual component
  const hasInteractive = validatedSections.some((s) => s.interactiveComponent);
  if (!hasInteractive) {
    // Inject a default bloch-sphere or probability visualizer into the middle section
    const targetIdx = Math.min(1, validatedSections.length - 1);
    validatedSections[targetIdx].interactiveComponent = {
      type: "bloch-sphere",
      config: {
        initialTheta: Math.PI / 2,
        initialPhi: 0,
        allowedGates: ["X", "Y", "Z", "H"],
        instructions: "Explore the state on the Bloch Sphere.",
      },
    };
  }

  return {
    title,
    summary,
    difficulty,
    estimatedMinutes,
    sections: validatedSections,
  };
}

/**
 * Builds the LLM system prompt and instructions for generating a declarative JSON lesson.
 */
function buildLessonGenerationPrompt(topicName, topicDescription, learnerLevel) {
  const levelText = learnerLevel || "intermediate";

  const systemPrompt = `You are the Quantiva AI Curriculum Generator.
Your task is to generate a personalized, interactive quantum computing micro-lesson for a learner at the "${levelText}" level.

CRITICAL SECURITY & DATA RULES:
1. Output ONLY a valid JSON object. No Markdown code wrappers (no triple backticks), no preamble, no commentary.
2. NEVER generate HTML, JSX, JavaScript, eval, React code, or script tags.
3. Every formula must use standard LaTeX without dollar signs inside the formula.latex field.
4. Allowed section types: "explanation", "intuition", "formula", "visualization", "interactive", "experiment", "reflection".
5. Allowed interactive component types: "bloch-sphere", "circuit", "complex-plane", "state-vector", "probability-heatmap".
6. Keep explanations clear, engaging, intuitive, and concise (2-4 paragraphs per section).

JSON SCHEMA TO PRODUCE:
{
  "title": "Clear Title of the Lesson",
  "summary": "1-2 sentence overview of what the learner will discover.",
  "difficulty": "${levelText === "completely_new" ? "beginner" : "intermediate"}",
  "estimatedMinutes": 7,
  "sections": [
    {
      "id": "sec-1",
      "type": "intuition",
      "title": "Intuitive Hook",
      "content": "Explanation in Markdown. Use $...$ for inline math.",
      "formula": { "latex": "\\text{Formula if applicable}", "explanation": "Brief explanation" }
    },
    {
      "id": "sec-2",
      "type": "interactive",
      "title": "Interactive Exploration",
      "content": "Guided exploration instructions.",
      "interactiveComponent": {
        "type": "bloch-sphere",
        "config": {
          "initialTheta": 1.5708,
          "initialPhi": 0,
          "allowedGates": ["H", "X", "Z"],
          "instructions": "Apply H to create superposition."
        }
      }
    },
    {
      "id": "sec-3",
      "type": "reflection",
      "title": "Check Your Understanding",
      "content": "Summary of the core takeaway.",
      "checkQuestion": {
        "question": "Conceptual multiple-choice question?",
        "options": ["Option A", "Option B", "Option C"],
        "correctIndex": 0,
        "explanation": "Why Option A is correct."
      }
    }
  ]
}`;

  const userPrompt = `Topic to teach: "${topicName}"
Topic Context: "${topicDescription || topicName}"
Learner Level: "${levelText}"

Generate a complete 3 to 5 section interactive quantum lesson JSON specification for this topic now.`;

  return { systemPrompt, userPrompt };
}

/**
 * Generates and persists a user-generated interactive lesson.
 * 
 * @param {Object} options
 * @param {string} options.topic - Topic title or slug
 * @param {string} [options.topicDescription] - Context summary
 * @param {string} options.userId - Authenticated user ObjectId
 * @param {string} [options.learnerLevel] - Learner level ("beginner", "intermediate", "advanced")
 * @param {boolean} [options.forceAlternative=false] - If true, skips curated priority check
 * @returns {Promise<{ curatedResource?: object, lesson?: object }>}
 */
async function generateAndSaveLesson({
  topic,
  topicDescription = "",
  userId,
  learnerLevel = "intermediate",
  forceAlternative = false,
}) {
  if (!topic || !userId) {
    throw new Error("topic and userId are required to generate a personal lesson.");
  }

  // 1. Curated Priority Check
  if (!forceAlternative) {
    const { hasCurated, curatedResource } = await checkCuratedResource(topic);
    if (hasCurated) {
      return {
        curatedResource,
        lesson: null,
      };
    }
  }

  // 2. Build prompt for Groq
  const { systemPrompt, userPrompt } = buildLessonGenerationPrompt(
    topic,
    topicDescription,
    learnerLevel
  );

  // 3. Call AI provider
  console.log(`[lessonGeneratorService] Generating lesson for topic "${topic}"...`);
  const completion = await aiProvider.generateText({
    systemPrompt,
    userPrompt,
    temperature: 0.2, // Low temperature for high schema adherence
    maxTokens: 3500,
  });

  const rawText = (completion && completion.text ? completion.text : "").trim();
  if (!rawText) {
    throw new Error("AI provider returned empty response for lesson generation.");
  }

  // 4. Clean and parse JSON
  let parsedJson;
  try {
    // Strip markdown fences if any were emitted
    let jsonStr = rawText;
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    }
    parsedJson = JSON.parse(jsonStr);
  } catch (parseErr) {
    console.error("[lessonGeneratorService] Failed to parse model JSON:", rawText.slice(0, 500));
    throw new Error("Model response was not valid JSON: " + parseErr.message);
  }

  // 5. Validate & sanitize against strict schema bounds
  const validatedData = validateLessonSpec(parsedJson);

  // 6. Generate server-owned identifiers
  const cleanSlug = topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40) || "quantum-concept";

  const lessonId = `gen-${cleanSlug}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // 7. Persist to GeneratedLesson collection (strictly scoped to owner userId)
  const lessonDoc = await GeneratedLesson.create({
    lessonId,
    owner: userId,
    topicId: cleanSlug,
    title: validatedData.title,
    summary: validatedData.summary,
    difficulty: validatedData.difficulty,
    estimatedMinutes: validatedData.estimatedMinutes,
    sections: validatedData.sections,
    isAIGenerated: true,
  });

  console.log(`[lessonGeneratorService] Successfully persisted GeneratedLesson ${lessonId} for user ${userId}`);

  return {
    curatedResource: null,
    lesson: lessonDoc.toObject(),
  };
}

module.exports = {
  checkCuratedResource,
  validateLessonSpec,
  sanitizeComponentConfig,
  generateAndSaveLesson,
  BOUNDS,
  ALLOWED_COMPONENTS,
  ALLOWED_SECTION_TYPES,
};
