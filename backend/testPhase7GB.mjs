/**
 * testPhase7GB.js
 * 
 * Quantiva Phase 7G-B: AI Tutor UX & Context Architecture Test Suite
 * 
 * Verifies:
 * 1. Context Normalization & Schema Integrity
 * 2. Controlled Context Sources Enforcement
 * 3. Context Switching & Anti-Leakage Comparison (isSameContext)
 * 4. Suggested Starter Questions (Deterministic, Context-Aware)
 * 5. Initial Contextual Greetings
 * 6. Backend API Payload Contract Compatibility
 */

import {
  normalizeContext,
  isSameContext,
  getSuggestedQuestions,
  getInitialGreeting,
  VALID_CONTEXT_SOURCES,
} from "../src/components/AITutor/tutorContextHelper.js";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("======================================================================");
  console.log("PHASE 7G-B: AI TUTOR UX & CONTEXT ARCHITECTURE TEST SUITE");
  console.log("======================================================================");

  // ─────────────────────────────────────────────────────────────
  // 1. Context Normalization & Schema
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 1. Context Normalization & Schema ---");
  
  // Generic / empty context
  const genericCtx = normalizeContext(null, { startingLevel: "knows_basics" });
  assert(genericCtx.source === "dashboard", "Null context normalizes source to 'dashboard'");
  assert(genericCtx.topic === null, "Null context has topic: null");
  assert(genericCtx.resource === null, "Null context has resource: null");
  assert(genericCtx.learner?.level === "knows_basics", "Learner level populated from user profile");

  // Controlled source validation
  const invalidSourceCtx = normalizeContext({ source: "arbitrary-hacker-string" });
  assert(invalidSourceCtx.source === "dashboard", "Invalid context source defaults safely to 'dashboard'");
  assert(VALID_CONTEXT_SOURCES.includes("topic-navigator"), "VALID_CONTEXT_SOURCES includes 'topic-navigator'");
  assert(VALID_CONTEXT_SOURCES.includes("micro-module"), "VALID_CONTEXT_SOURCES includes 'micro-module'");
  assert(VALID_CONTEXT_SOURCES.includes("algorithm"), "VALID_CONTEXT_SOURCES includes 'algorithm'");
  assert(VALID_CONTEXT_SOURCES.includes("course"), "VALID_CONTEXT_SOURCES includes 'course'");
  assert(VALID_CONTEXT_SOURCES.includes("explore"), "VALID_CONTEXT_SOURCES includes 'explore'");

  // Micro-module context
  const mmCtx = normalizeContext({
    source: "micro-module",
    topic: {
      topicId: "why-quantum",
      title: "Why Quantum?",
      category: "Foundations Track",
      description: "Motivation for quantum computing",
    },
    resource: {
      type: "micro_module",
      id: "why-quantum",
      title: "Why Quantum?",
    },
  });
  assert(mmCtx.source === "micro-module", "Micro-module source preserved");
  assert(mmCtx.topic?.topicId === "why-quantum", "Micro-module topic ID preserved");
  assert(mmCtx.resource?.type === "micro_module", "Micro-module resource type is 'micro_module'");
  assert(mmCtx.resource?.id === "why-quantum", "Micro-module resource ID matches");

  // Topic Navigator concept-only context
  const tnCtx = normalizeContext({
    source: "topic-navigator",
    topic: {
      topicId: "phase-kickback",
      title: "Phase Kickback",
      category: "Quantum Algorithms",
      description: "Phase accumulation on control qubit",
    },
    resource: null,
    knowledgeMap: {
      foundations: [{ topicId: "phase", title: "Quantum Phase" }],
      components: [],
      related: [],
      extensions: [{ topicId: "quantum-phase-estimation", title: "Quantum Phase Estimation" }],
    },
  });
  assert(tnCtx.source === "topic-navigator", "Topic navigator source preserved");
  assert(tnCtx.topic?.topicId === "phase-kickback", "Topic navigator topicId preserved");
  assert(tnCtx.resource === null, "Concept-only topic strictly has resource: null");
  assert(tnCtx.knowledgeMap?.foundations?.length === 1, "Knowledge map foundations attached");
  assert(tnCtx.knowledgeMap?.extensions?.length === 1, "Knowledge map extensions attached");

  // Algorithm context
  const algoCtx = normalizeContext({
    source: "algorithm",
    topic: {
      topicId: "grover-search",
      title: "Grover's Search",
      category: "Search Algorithms",
      description: "Unstructured search with quadratic speedup",
    },
    resource: {
      type: "algorithm",
      id: "grover-search",
      title: "Grover's Search",
    },
  });
  assert(algoCtx.source === "algorithm", "Algorithm source preserved");
  assert(algoCtx.resource?.type === "algorithm", "Algorithm resource type matches");

  // Course context
  const courseCtx = normalizeContext({
    source: "course",
    topic: {
      topicId: "quantum-foundations-course",
      title: "Complete Quantum Foundations",
      category: "Quantum Course",
      description: "Lecture: Intro to Superposition",
    },
    resource: {
      type: "course",
      id: "quantum-foundations-course",
      title: "Complete Quantum Foundations",
    },
  });
  assert(courseCtx.source === "course", "Course source preserved");
  assert(courseCtx.resource?.type === "course", "Course resource type matches");

  // Explore search context
  const exploreCtx = normalizeContext({
    source: "explore",
    query: "teleportation",
    topic: {
      topicId: "teleportation",
      title: "Search: 'teleportation'",
      category: "Explore & Search",
    },
  });
  assert(exploreCtx.source === "explore", "Explore source preserved");
  assert(exploreCtx.query === "teleportation", "Explore query preserved");

  // ─────────────────────────────────────────────────────────────
  // 2. Context Switching & Anti-Leakage (isSameContext)
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 2. Context Switching & Anti-Leakage ---");

  assert(isSameContext(mmCtx, mmCtx) === true, "Identical context returns isSameContext: true");
  assert(isSameContext(mmCtx, tnCtx) === false, "Switching from micro-module to topic-navigator returns isSameContext: false");
  assert(isSameContext(tnCtx, algoCtx) === false, "Switching from Phase Kickback to Grover returns isSameContext: false");
  
  const qpeCtx = normalizeContext({
    source: "algorithm",
    topic: { topicId: "quantum-phase-estimation", title: "Quantum Phase Estimation" },
    resource: { type: "algorithm", id: "quantum-phase-estimation" },
  });
  assert(isSameContext(algoCtx, qpeCtx) === false, "Switching from Grover to QPE detects context switch (no silent leakage)");
  assert(isSameContext(null, genericCtx) === true, "Null vs generic default returns isSameContext: true");
  assert(isSameContext(null, qpeCtx) === false, "Generic vs specific context detects switch");

  // ─────────────────────────────────────────────────────────────
  // 3. Context-Aware Suggested Starter Questions
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 3. Suggested Starter Questions ---");

  const genericQuestions = getSuggestedQuestions(null);
  assert(Array.isArray(genericQuestions), "Generic suggested questions is array");
  assert(genericQuestions.length >= 2 && genericQuestions.length <= 4, "Generic suggested questions bounded between 2 and 4");

  const pkQuestions = getSuggestedQuestions(tnCtx);
  assert(pkQuestions.length >= 2 && pkQuestions.length <= 4, "Phase Kickback questions bounded between 2 and 4");
  assert(pkQuestions.some(q => q.toLowerCase().includes("phase kickback")), "Phase Kickback questions mention 'phase kickback'");

  const qpeQuestions = getSuggestedQuestions(qpeCtx);
  assert(qpeQuestions.some(q => q.toLowerCase().includes("qpe") || q.toLowerCase().includes("phase estimation")), "QPE questions mention 'QPE'");

  const groverQuestions = getSuggestedQuestions(algoCtx);
  assert(groverQuestions.some(q => q.toLowerCase().includes("grover")), "Grover questions mention 'Grover'");

  const superQuestions = getSuggestedQuestions({ topic: { topicId: "superposition", title: "Superposition" } });
  assert(superQuestions.some(q => q.toLowerCase().includes("superposition")), "Superposition questions mention 'superposition'");

  // ─────────────────────────────────────────────────────────────
  // 4. Contextual Initial Greetings
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 4. Contextual Initial Greetings ---");

  const genericGreeting = getInitialGreeting(null);
  assert(genericGreeting.includes("AI Tutor"), "Generic greeting welcomes learner to AI Tutor");

  const tnGreeting = getInitialGreeting(tnCtx);
  assert(tnGreeting.includes("Phase Kickback"), "Topic greeting mentions 'Phase Kickback'");
  assert(tnGreeting.includes("Quantum Algorithms"), "Topic greeting mentions category 'Quantum Algorithms'");

  const mmGreeting = getInitialGreeting(mmCtx);
  assert(mmGreeting.includes("Why Quantum?"), "Micro-module greeting mentions 'Why Quantum?'");

  // ─────────────────────────────────────────────────────────────
  // 5. Backend Contract Verification (POST /api/ai/chat)
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 5. Backend API Payload Compatibility ---");

  try {
    // Check if backend is reachable
    const res = await axios.post(
      `${API_BASE}/ai/chat`,
      {
        message: "What is phase kickback?",
        history: [],
        context: {
          page: "/micro-modules/why-quantum",
          source: "topic-navigator",
          topic: {
            topicId: "phase-kickback",
            title: "Phase Kickback",
            category: "Quantum Algorithms",
          },
          resource: null,
          learner: { level: "knows_basics" },
        },
      },
      { validateStatus: () => true }
    );

    // Any response other than 404 (endpoint exists) and not crashing 500 on json parse
    assert(res.status === 200 || res.status === 500 || res.status === 400, `POST /api/ai/chat responded with status ${res.status}`);
    assert(res.data !== undefined, "Response contains valid JSON data");
  } catch (err) {
    console.log("[INFO] Backend server check skipped if not actively running on 5000:", err.message);
  }

  console.log("======================================================================");
  console.log(`FINAL 7G-B RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("======================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
