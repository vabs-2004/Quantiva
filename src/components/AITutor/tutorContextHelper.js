/**
 * tutorContextHelper.js
 * 
 * Quantiva Phase 7G-B: Tutor UX & Context Architecture Helper
 * 
 * Provides:
 * - Deterministic, serializable context normalization
 * - Context comparison to prevent silent context leakage
 * - Contextual suggested starter questions
 * - Context-aware greeting generation
 */

export const VALID_CONTEXT_SOURCES = [
  "topic-navigator",
  "micro-module",
  "algorithm",
  "course",
  "explore",
  "dashboard",
  "circuit-simulator",
  "circuit-challenges",
  "sandbox",
];

/**
 * Normalizes any incoming context into the authoritative Quantiva 7G Context schema.
 */
export function normalizeContext(rawContext, user = null) {
  if (!rawContext || typeof rawContext !== "object") {
    return {
      source: "dashboard",
      topic: null,
      resource: null,
      knowledgeMap: null,
      learner: user?.startingLevel ? { level: user.startingLevel } : null,
      query: null,
      challengeMode: false,
      challenge: null,
      circuit: null,
    };
  }

  // Derive source
  let source = rawContext.source || "dashboard";
  if (rawContext.section === "micro-module") source = "micro-module";
  if (rawContext.challengeMode) source = "circuit-challenges";
  if (!VALID_CONTEXT_SOURCES.includes(source)) {
    source = "dashboard";
  }

  // Derive topic
  let topic = null;
  if (rawContext.topic && typeof rawContext.topic === "object") {
    topic = {
      topicId: rawContext.topic.topicId || null,
      title: rawContext.topic.title || null,
      category: rawContext.topic.category || null,
      description: rawContext.topic.description || null,
    };
  } else if (rawContext.topicId || rawContext.moduleTitle || rawContext.title) {
    topic = {
      topicId: rawContext.topicId || rawContext.moduleId || rawContext.algorithmId || null,
      title: rawContext.title || rawContext.moduleTitle || rawContext.algorithmTitle || null,
      category: rawContext.category || rawContext.track || null,
      description: rawContext.description || null,
    };
  }

  // Derive resource
  let resource = null;
  if (rawContext.resource && typeof rawContext.resource === "object") {
    resource = {
      type: rawContext.resource.type || null,
      id: rawContext.resource.id || null,
      title: rawContext.resource.title || null,
    };
  } else if (rawContext.moduleId) {
    resource = {
      type: "micro_module",
      id: rawContext.moduleId,
      title: rawContext.moduleTitle || null,
    };
  } else if (rawContext.algorithmId) {
    resource = {
      type: "algorithm",
      id: rawContext.algorithmId,
      title: rawContext.algorithmTitle || null,
    };
  } else if (rawContext.courseId) {
    resource = {
      type: "course",
      id: rawContext.courseId,
      title: rawContext.courseTitle || null,
    };
  }

  // Derive knowledgeMap
  let knowledgeMap = null;
  if (rawContext.knowledgeMap && typeof rawContext.knowledgeMap === "object") {
    knowledgeMap = {
      foundations: Array.isArray(rawContext.knowledgeMap.foundations) ? rawContext.knowledgeMap.foundations : [],
      related: Array.isArray(rawContext.knowledgeMap.related) ? rawContext.knowledgeMap.related : [],
      components: Array.isArray(rawContext.knowledgeMap.components) ? rawContext.knowledgeMap.components : [],
      extensions: Array.isArray(rawContext.knowledgeMap.extensions) ? rawContext.knowledgeMap.extensions : [],
    };
  }

  // Derive learner
  const learner = rawContext.learner || (user?.startingLevel ? { level: user.startingLevel } : null);

  return {
    source,
    topic,
    resource,
    knowledgeMap,
    learner,
    query: rawContext.query || null,
    // Backwards compatibility for challenge/circuit simulator
    challengeMode: Boolean(rawContext.challengeMode),
    challenge: rawContext.challenge || null,
    circuit: rawContext.circuit || null,
  };
}

/**
 * Checks whether two contexts are equivalent.
 * Returns false if context has switched to a different topic, resource, query, or mode.
 */
export function isSameContext(ctxA, ctxB) {
  const normA = ctxA ? ctxA : normalizeContext(null);
  const normB = ctxB ? ctxB : normalizeContext(null);

  const idA = normA.topic?.topicId || normA.resource?.id || normA.query || "";
  const idB = normB.topic?.topicId || normB.resource?.id || normB.query || "";
  const sourceA = normA.source || "dashboard";
  const sourceB = normB.source || "dashboard";
  const chalA = normA.challenge?.id || (normA.challengeMode ? "challenge" : "");
  const chalB = normB.challenge?.id || (normB.challengeMode ? "challenge" : "");

  return idA === idB && sourceA === sourceB && chalA === chalB;
}

/**
 * Returns 2-4 deterministic, context-aware suggested starter questions.
 */
export function getSuggestedQuestions(context) {
  if (!context) {
    return [
      "Explain superposition and entanglement intuitively.",
      "How does a quantum computer differ from a classical one?",
      "What is quantum phase estimation?",
      "What should I learn first in Quantiva?",
    ];
  }

  if (context.challengeMode) {
    return [
      "Can you give me a conceptual hint without giving away the answer?",
      "What quantum gates should I consider for this challenge?",
      "How does the target state connect to superposition or entanglement?",
    ];
  }

  const topicId = (context.topic?.topicId || context.resource?.id || "").toLowerCase();
  const title = (context.topic?.title || context.resource?.title || context.query || "").toLowerCase();
  const rawTitle = context.topic?.title || context.resource?.title || context.query || "";

  // Topic specific rules:
  if (topicId.includes("phase-kickback") || title.includes("phase kickback")) {
    return [
      "What is phase kickback intuitively?",
      "Why does phase kickback matter in QPE?",
      "Can you explain it with a simple 2-qubit circuit?",
    ];
  }

  if (topicId.includes("quantum-phase-estimation") || topicId === "qpe" || title.includes("phase estimation")) {
    return [
      "What is QPE doing conceptually?",
      "Why is the Inverse QFT used in QPE?",
      "What role does phase kickback play here?",
    ];
  }

  if (topicId.includes("grover") || title.includes("grover")) {
    return [
      "How does Grover's search achieve quadratic speedup?",
      "What does the oracle do in Grover's algorithm?",
      "Can you explain the diffusion operator intuitively?",
    ];
  }

  if (topicId.includes("superposition") || title.includes("superposition")) {
    return [
      "What is superposition intuitively?",
      "How does measurement affect a superposition state?",
      "Why can't classical bits be in superposition?",
    ];
  }

  if (topicId.includes("measurement") || topicId.includes("collapse") || title.includes("measurement") || title.includes("collapse")) {
    return [
      "What happens to a quantum state when we measure it?",
      "Why does measuring a collapsed state twice produce the same result?",
      "How is quantum measurement fundamentally different from a quantum gate?",
    ];
  }

  if (topicId.includes("bell") || title.includes("bell")) {
    return [
      "Why are there four Bell states?",
      "What's the difference between Φ⁺ and Φ⁻?",
      "Why do Φ⁺ and Φ⁻ have the same computational-basis probabilities?",
      "How can gates transform one Bell state into another?",
    ];
  }

  if (topicId.includes("entanglement") || title.includes("entanglement")) {
    return [
      "What makes entanglement different from ordinary correlation?",
      "How does H + CNOT create an entangled state?",
      "What happens when I measure one qubit of an entangled pair?",
      "Can entanglement be used to send information instantly?",
    ];
  }

  if (topicId.includes("dirac") || title.includes("dirac") || title.includes("bra-ket")) {
    return [
      "What does the ket |ψ⟩ actually represent?",
      "What's the difference between a bra and a ket?",
      "What does ⟨0|1⟩ = 0 mean?",
      "Are the coefficients in α|0⟩ + β|1⟩ probabilities?",
    ];
  }

  if (topicId.includes("amplitudes-phase") || topicId.includes("amplitude") || title.includes("amplitudes & phase") || title.includes("amplitude")) {
    return [
      "Why can two states have the same probabilities but still be different?",
      "What is relative phase?",
      "Why does H distinguish |+⟩ and |−⟩?",
      "What is the difference between global and relative phase?",
    ];
  }

  if (topicId.includes("bloch") || title.includes("bloch")) {
    return [
      "Why are |0⟩ and |1⟩ at opposite poles?",
      "What does θ control?",
      "Where does relative phase appear on the Bloch Sphere?",
      "Why are |+⟩ and |−⟩ opposite points on the equator?",
    ];
  }

  if (topicId.includes("gate") || topicId.includes("hadamard") || title.includes("gate") || title.includes("hadamard")) {
    return [
      "What does a Hadamard gate do?",
      "Why does quantum phase matter in gate operations?",
      "How do unitary matrices represent quantum gates?",
    ];
  }

  if (topicId.includes("why-quantum") || title.includes("why quantum")) {
    return [
      "Why do we need quantum computers?",
      "What problems can quantum computers solve that classical cannot?",
      "What is quantum advantage?",
    ];
  }

  if (topicId.includes("mathematical-foundations") || title.includes("math")) {
    return [
      "What linear algebra concepts are essential for quantum computing?",
      "Why do state vectors need to be normalized?",
      "What do complex amplitudes represent?",
    ];
  }

  if (topicId.includes("qubit") || title.includes("qubit")) {
    return [
      "How does a qubit differ from a classical bit?",
      "What is the Bloch sphere representation?",
      "What are probability amplitudes?",
    ];
  }

  if (rawTitle) {
    return [
      `What is ${rawTitle} and why is it important in quantum computing?`,
      `Can you explain ${rawTitle} with an intuitive analogy?`,
      `How does ${rawTitle} connect to quantum circuits and algorithms?`,
    ];
  }

  return [
    "Explain superposition and entanglement intuitively.",
    "How does a quantum computer differ from a classical one?",
    "What is quantum phase estimation?",
    "What should I learn first in Quantiva?",
  ];
}

/**
 * Returns a warm, contextual initial greeting from the AI Tutor.
 */
export function getInitialGreeting(context) {
  if (!context) {
    return "Hi! I'm your **AI Tutor**. Ask me to explain a concept, debug your circuit, or suggest what to learn next.";
  }

  if (context.challengeMode) {
    return "Hi! I'm your **Challenge Tutor**. I'll help you reason through the challenge conceptually without giving away the direct solution.";
  }

  const title = context.topic?.title || context.resource?.title || (context.query ? `"${context.query}"` : null);
  const category = context.topic?.category;

  if (title) {
    return `Hi! I'm your Quantiva Tutor. I'm focused on **${title}**${category ? ` (${category})` : ""}. What would you like to explore about this concept?`;
  }

  return "Hi! I'm your **AI Tutor**. Ask me to explain any quantum concept, explore algorithms, or guide your learning path.";
}
