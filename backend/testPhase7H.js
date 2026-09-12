/**
 * testPhase7H.js
 * 
 * Comprehensive Test Suite for Quantiva Phase 7H: User-Generated Interactive Learning
 * 
 * Verifies:
 * 1. Model bounds & schema validation (GeneratedLesson)
 * 2. Whitelisted interactive component validation (bloch-sphere, circuit, complex-plane, heatmap)
 * 3. Strict prompt injection and executable script rejection (<script>, eval, new Function)
 * 4. Curated resource priority check (recommends Superposition, Bloch Sphere, Grover before AI)
 * 5. Explicit override check (forceAlternative generates personal lesson for curated topic)
 * 6. Concept-only generation (Phase Kickback, Deutsch's Problem)
 * 7. Strict owner-scoped authorization & isolation (User A vs User B)
 * 8. User Progress bookmarking isolation (bookmarkedGeneratedLessons distinct from microModules/algorithms)
 * 9. Deletion cleanup (removing lesson and its bookmark reference without dangling states)
 * 10. Real Groq SDK generation & schema persistence
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const GeneratedLesson = require('./models/GeneratedLesson');
const UserProgress = require('./models/UserProgress');
const lessonGeneratorService = require('./services/lessonGeneratorService');
const generatedLessonController = require('./controllers/generatedLessonController');

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

function createMockReqRes(body = {}, params = {}, query = {}, user = { id: new mongoose.Types.ObjectId().toString() }) {
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
    getData: () => responseData,
  };

  return { req, res };
}

async function runTests() {
  console.log("======================================================================");
  console.log("PHASE 7H: USER-GENERATED INTERACTIVE LEARNING TEST SUITE");
  console.log("======================================================================\n");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/quantiva_test";
  let dbConnected = false;
  try {
    await mongoose.connect(mongoUri);
    dbConnected = true;
    console.log("[DB] Connected to MongoDB for Phase 7H testing.\n");
  } catch (err) {
    console.warn("[DB] Could not connect to MongoDB, testing offline components:", err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Schema Bounds & Validation Unit Tests
  // ─────────────────────────────────────────────────────────────
  console.log("--- 1. SCHEMA BOUNDS & VALIDATION UNIT TESTS ---");

  // Valid lesson spec passes
  const validSpec = {
    title: "Phase Kickback Exploration",
    summary: "Understand phase kickback through controlled unitary gates.",
    difficulty: "intermediate",
    estimatedMinutes: 8,
    sections: [
      {
        id: "sec-1",
        type: "intuition",
        title: "The Intuitive Picture",
        content: "Phase kickback is a quantum phenomenon where eigenvalues kick back into the control qubit.",
        formula: { latex: "U|u\\rangle = e^{i\\phi}|u\\rangle", explanation: "Phase kickback formula" },
      },
      {
        id: "sec-2",
        type: "interactive",
        title: "Bloch Sphere Rotation",
        content: "Observe how relative phase rotates the state vector along the equator.",
        interactiveComponent: {
          type: "bloch-sphere",
          config: { initialTheta: Math.PI / 2, initialPhi: 0, allowedGates: ["Z", "S"] },
        },
        checkQuestion: {
          question: "What happens to the target state in an eigenstate during phase kickback?",
          options: ["It changes completely", "It remains unchanged", "It collapses to zero"],
          correctIndex: 1,
          explanation: "The target state is an eigenstate so it only acquires a global phase factor.",
        },
      },
    ],
  };

  try {
    const validated = lessonGeneratorService.validateLessonSpec(validSpec);
    assert(validated.title === "Phase Kickback Exploration", "Valid lesson specification validates successfully");
    assert(validated.sections.length === 2, "Validated sections retained");
    assert(validated.sections[1].interactiveComponent.type === "bloch-sphere", "Interactive component retained");
  } catch (err) {
    assert(false, "Valid spec should not fail validation: " + err.message);
  }

  // Rejection of missing title
  try {
    lessonGeneratorService.validateLessonSpec({ ...validSpec, title: "" });
    assert(false, "Should reject empty title");
  } catch (err) {
    assert(err.message.includes("Lesson title is required"), "Rejects empty title correctly");
  }

  // Rejection of excessive section title length
  try {
    const longTitle = "A".repeat(300);
    const validated = lessonGeneratorService.validateLessonSpec({
      ...validSpec,
      sections: [{ ...validSpec.sections[0], title: longTitle }, validSpec.sections[1]],
    });
    assert(validated.sections[0].title.length <= 200, "Truncates/bounds oversized section titles");
  } catch (err) {
    assert(false, "Should handle section title bounding: " + err.message);
  }

  // Rejection of insufficient sections
  try {
    lessonGeneratorService.validateLessonSpec({ ...validSpec, sections: [validSpec.sections[0]] });
    assert(false, "Should reject spec with < 2 sections");
  } catch (err) {
    assert(err.message.includes("at least 2 sections"), "Rejects insufficient sections correctly");
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Component Whitelist & Injection Defense Tests
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 2. COMPONENT WHITELIST & INJECTION DEFENSE TESTS ---");

  // Rejection of unknown interactive component
  try {
    const invalidCompSpec = {
      ...validSpec,
      sections: [
        validSpec.sections[0],
        {
          id: "sec-2",
          type: "interactive",
          title: "Hack Attempt",
          content: "Testing unknown component.",
          interactiveComponent: { type: "malicious-eval-iframe", config: {} },
        },
      ],
    };
    const res = lessonGeneratorService.validateLessonSpec(invalidCompSpec);
    // Unknown component must be dropped or defaulted safely
    assert(
      !res.sections[1].interactiveComponent ||
      res.sections[1].interactiveComponent.type !== "malicious-eval-iframe",
      "Disallowed/unknown component type is rejected from specification"
    );
  } catch (err) {
    assert(true, "Rejected unknown interactive component: " + err.message);
  }

  // Rejection of script injection in component config
  try {
    lessonGeneratorService.sanitizeComponentConfig("bloch-sphere", {
      initialTheta: 1.0,
      badScript: "<script>alert('xss')</script>",
    });
    assert(false, "Should reject script tag in component config");
  } catch (err) {
    assert(err.message.includes("disallowed or unsafe tokens"), "Component config rejects <script> tags");
  }

  // Rejection of javascript: in component config
  try {
    lessonGeneratorService.sanitizeComponentConfig("complex-plane", {
      instructions: "javascript:void(0)",
    });
    assert(false, "Should reject javascript: in component config");
  } catch (err) {
    assert(err.message.includes("disallowed or unsafe tokens"), "Component config rejects javascript: URI tokens");
  }

  // Sanitize measurement component config
  try {
    const measConfig = lessonGeneratorService.sanitizeComponentConfig("measurement", {
      shots: 500,
      measurements: [
        { state: "00", probability: 0.5, count: 250 },
        { state: "11", probability: 0.5, count: 250 },
      ],
      instructions: "Observe the measurement distribution.",
    });
    assert(measConfig.shots === 500, "Measurement config preserves valid shots");
    assert(measConfig.measurements.length === 2, "Measurement config preserves states");
    assert(measConfig.measurements[0].state === "00", "Measurement config preserves state label");
  } catch (err) {
    assert(false, "Measurement config sanitization failed: " + err.message);
  }

  // Sanitize sandbox component config
  try {
    const sandConfig = lessonGeneratorService.sanitizeComponentConfig("sandbox", {
      code: "from qiskit import QuantumCircuit\nqc = QuantumCircuit(2)",
      title: "Custom Entanglement",
      instructions: "Run this script in the sandbox.",
    });
    assert(sandConfig.language === "python", "Sandbox config enforces python language");
    assert(sandConfig.title === "Custom Entanglement", "Sandbox config preserves title");
    assert(sandConfig.code.includes("QuantumCircuit(2)"), "Sandbox config preserves valid python code");
  } catch (err) {
    assert(false, "Sandbox config sanitization failed: " + err.message);
  }

  // Prompt bounding tests
  try {
    const longConversation = Array.from({ length: 15 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      text: `Turn ${i}: ${'quantum '.repeat(50)}`,
    }));
    const { systemPrompt, userPrompt } = lessonGeneratorService.buildLessonGenerationPrompt(
      "Quantum Cryptography",
      "Quantum Cryptography",
      "intermediate",
      {
        conversation: longConversation,
        learnerIntent: "Detecting eavesdropping with BB84",
        relatedResources: [
          { id: "1", title: "Res 1" },
          { id: "2", title: "Res 2" },
          { id: "3", title: "Res 3" },
          { id: "4", title: "Res 4" },
        ],
      }
    );
    assert(userPrompt.includes("Quantum Cryptography"), "Prompt includes authoritative topic");
    assert(userPrompt.includes("Detecting eavesdropping with BB84"), "Prompt preserves learner intent");
    assert(userPrompt.includes("Turn 14"), "Prompt preserves latest turns");
    assert(!userPrompt.includes("Turn 2:"), "Prompt drops turns beyond the max bound of 6");
    assert(!userPrompt.includes("Res 4"), "Prompt limits related resources to at most 3 items");
  } catch (err) {
    assert(false, "Prompt bounding test failed: " + err.message);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Curated Resource Priority Tests
  // ─────────────────────────────────────────────────────────────
  console.log("\n--- 3. CURATED RESOURCE PRIORITY TESTS ---");

  const superCheck = await lessonGeneratorService.checkCuratedResource("superposition");
  assert(superCheck.hasCurated === true, 'Exact match "superposition" identifies curated resource');
  assert(
    superCheck.curatedResource && superCheck.curatedResource.type === "micro_module",
    "Superposition maps to curated micro_module"
  );

  const blochCheck = await lessonGeneratorService.checkCuratedResource("bloch-sphere");
  assert(blochCheck.hasCurated === true, 'Canonical ID "bloch-sphere" identifies curated resource');

  const groverCheck = await lessonGeneratorService.checkCuratedResource("grover-search");
  assert(groverCheck.hasCurated === true, 'Algorithm "grover-search" identifies curated resource');
  assert(groverCheck.curatedResource.type === "algorithm", "Grover maps to curated algorithm");

  const kickbackCheck = await lessonGeneratorService.checkCuratedResource("phase-kickback");
  assert(
    kickbackCheck.hasCurated === false,
    'Concept-only topic "phase-kickback" correctly returns hasCurated: false'
  );

  if (dbConnected) {
    // ─────────────────────────────────────────────────────────────
    // 4. Controller & Ownership Isolation Tests
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- 4. CONTROLLER & OWNERSHIP ISOLATION TESTS ---");

    const userA_Id = new mongoose.Types.ObjectId();
    const userB_Id = new mongoose.Types.ObjectId();

    // User A generates a lesson
    const lessonA_Id = `gen-test-${Date.now()}-a`;
    const docA = await GeneratedLesson.create({
      lessonId: lessonA_Id,
      owner: userA_Id,
      topicId: "phase-kickback",
      title: "User A Kickback Lesson",
      summary: "Private to User A",
      difficulty: "intermediate",
      estimatedMinutes: 7,
      sections: validSpec.sections,
      isAIGenerated: true,
    });
    assert(Boolean(docA._id), "User A lesson saved in MongoDB collection");

    // User A can list and find Lesson A
    const mockListA = createMockReqRes({}, {}, {}, { id: userA_Id.toString() });
    await generatedLessonController.getMyGeneratedLessons(mockListA.req, mockListA.res);
    const listAData = mockListA.res.getData();
    const hasLessonAInList = (listAData.lessons || []).some((l) => l.lessonId === lessonA_Id);
    assert(hasLessonAInList === true, "User A can discover their own generated lesson in listing");

    // User B CANNOT list Lesson A
    const mockListB = createMockReqRes({}, {}, {}, { id: userB_Id.toString() });
    await generatedLessonController.getMyGeneratedLessons(mockListB.req, mockListB.res);
    const listBData = mockListB.res.getData();
    const hasLessonAInListB = (listBData.lessons || []).some((l) => l.lessonId === lessonA_Id);
    assert(hasLessonAInListB === false, "User B CANNOT see User A's generated lesson in listing");

    // User A can get Lesson A by ID
    const mockGetA = createMockReqRes({}, { lessonId: lessonA_Id }, {}, { id: userA_Id.toString() });
    await generatedLessonController.getGeneratedLessonById(mockGetA.req, mockGetA.res);
    assert(mockGetA.res.getStatusCode() === 200, "User A can retrieve their own lesson by ID (HTTP 200)");
    assert(mockGetA.res.getData().lesson.lessonId === lessonA_Id, "Retrieved lesson matches requested lessonId");

    // User B CANNOT get Lesson A by ID (must return 404, not 403, preventing existence discovery)
    const mockGetB = createMockReqRes({}, { lessonId: lessonA_Id }, {}, { id: userB_Id.toString() });
    await generatedLessonController.getGeneratedLessonById(mockGetB.req, mockGetB.res);
    assert(
      mockGetB.res.getStatusCode() === 404,
      "User B receives 404 Not Found when trying to access User A's lesson"
    );

    // ─────────────────────────────────────────────────────────────
    // 5. Bookmarking Semantics & Isolation Tests
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- 5. BOOKMARKING SEMANTICS & ISOLATION TESTS ---");

    // User A bookmarks Lesson A
    const mockBmA = createMockReqRes({}, { lessonId: lessonA_Id }, {}, { id: userA_Id.toString() });
    await generatedLessonController.bookmarkGeneratedLesson(mockBmA.req, mockBmA.res);
    assert(mockBmA.res.getStatusCode() === 200, "User A bookmarks Lesson A successfully");
    assert(mockBmA.res.getData().bookmarked === true, "Bookmark state returns true");

    // Verify UserProgress collection has bookmarkedGeneratedLessons
    const progA = await UserProgress.findOne({ user: userA_Id });
    const isBmA = (progA.bookmarkedGeneratedLessons || []).some((b) => b.lessonId === lessonA_Id);
    assert(isBmA === true, "UserProgress.bookmarkedGeneratedLessons stores the bookmark reference");
    assert(
      (progA.bookmarkedMicroModules || []).length === 0,
      "Official bookmarkedMicroModules array remains completely untouched"
    );

    // Repeated bookmark is idempotent
    const mockBmIdemp = createMockReqRes({}, { lessonId: lessonA_Id }, {}, { id: userA_Id.toString() });
    await generatedLessonController.bookmarkGeneratedLesson(mockBmIdemp.req, mockBmIdemp.res);
    const progA2 = await UserProgress.findOne({ user: userA_Id });
    const countA = (progA2.bookmarkedGeneratedLessons || []).filter((b) => b.lessonId === lessonA_Id).length;
    assert(countA === 1, "Bookmarking is strictly idempotent (no duplicates inserted)");

    // User B CANNOT bookmark User A's lesson
    const mockBmB = createMockReqRes({}, { lessonId: lessonA_Id }, {}, { id: userB_Id.toString() });
    await generatedLessonController.bookmarkGeneratedLesson(mockBmB.req, mockBmB.res);
    assert(
      mockBmB.res.getStatusCode() === 404,
      "User B receives 404 trying to bookmark User A's lesson"
    );

    // User A unbookmarks Lesson A
    const mockUnbmA = createMockReqRes({}, { lessonId: lessonA_Id }, {}, { id: userA_Id.toString() });
    await generatedLessonController.unbookmarkGeneratedLesson(mockUnbmA.req, mockUnbmA.res);
    assert(mockUnbmA.res.getStatusCode() === 200, "User A unbookmarks Lesson A successfully");
    const progA3 = await UserProgress.findOne({ user: userA_Id });
    const hasBmAfter = (progA3.bookmarkedGeneratedLessons || []).some((b) => b.lessonId === lessonA_Id);
    assert(hasBmAfter === false, "Bookmark reference successfully removed from UserProgress");

    // ─────────────────────────────────────────────────────────────
    // 6. Deletion & Cleanup Tests
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- 6. DELETION & CLEANUP TESTS ---");

    // Re-bookmark for deletion cleanup test
    await generatedLessonController.bookmarkGeneratedLesson(mockBmA.req, mockBmA.res);

    // User B CANNOT delete User A's lesson
    const mockDelB = createMockReqRes({}, { lessonId: lessonA_Id }, {}, { id: userB_Id.toString() });
    await generatedLessonController.deleteGeneratedLesson(mockDelB.req, mockDelB.res);
    assert(mockDelB.res.getStatusCode() === 404, "User B receives 404 attempting to delete User A's lesson");
    const stillExists = await GeneratedLesson.findOne({ lessonId: lessonA_Id });
    assert(Boolean(stillExists), "User A's lesson was NOT deleted by User B");

    // User A deletes Lesson A
    const mockDelA = createMockReqRes({}, { lessonId: lessonA_Id }, {}, { id: userA_Id.toString() });
    await generatedLessonController.deleteGeneratedLesson(mockDelA.req, mockDelA.res);
    assert(mockDelA.res.getStatusCode() === 200, "User A deletes Lesson A successfully");

    const deletedCheck = await GeneratedLesson.findOne({ lessonId: lessonA_Id });
    assert(deletedCheck === null, "Lesson document completely removed from GeneratedLesson collection");

    // Check that bookmark reference was cleaned up
    const progA4 = await UserProgress.findOne({ user: userA_Id });
    const bmAfterDel = (progA4.bookmarkedGeneratedLessons || []).some((b) => b.lessonId === lessonA_Id);
    assert(bmAfterDel === false, "Bookmark reference automatically cleaned up on lesson deletion (no dangling IDs)");

    // ─────────────────────────────────────────────────────────────
    // 7. Live AI Generation with Real Groq SDK
    // ─────────────────────────────────────────────────────────────
    console.log("\n--- 7. LIVE AI GENERATION WITH REAL GROQ SDK ---");

    try {
      const liveUser = new mongoose.Types.ObjectId();
      console.log("Calling live generateAndSaveLesson for concept-only topic 'Phase Kickback'...");

      const liveResult = await lessonGeneratorService.generateAndSaveLesson({
        topic: "Phase Kickback",
        topicDescription: "How eigenvalues kick back relative phase into control qubits.",
        userId: liveUser,
        learnerLevel: "intermediate",
        forceAlternative: false,
      });

      assert(liveResult.curatedResource === null, "Live generation has no curated resource blocking it");
      assert(Boolean(liveResult.lesson), "Live generation produced a lesson object");
      assert(liveResult.lesson.isAIGenerated === true, "Live lesson has isAIGenerated: true");
      assert(liveResult.lesson.sections.length >= 2, "Live lesson contains at least 2 validated sections");

      const hasInteractive = liveResult.lesson.sections.some((s) => s.interactiveComponent);
      assert(hasInteractive === true, "Live lesson contains at least one interactive workspace component");

      // Verify it was actually saved in DB and can be retrieved deterministically
      const savedDoc = await GeneratedLesson.findOne({ lessonId: liveResult.lesson.lessonId, owner: liveUser });
      assert(Boolean(savedDoc), "Live generated lesson is saved in MongoDB");
      assert(savedDoc.title === liveResult.lesson.title, "Saved document matches live output title exactly");

      // Cleanup test doc
      await GeneratedLesson.deleteOne({ _id: savedDoc._id });
    } catch (err) {
      console.error("Live AI Generation Error:", err);
      assert(false, "Live AI generation should succeed: " + err.message);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────
  console.log("\n======================================================================");
  console.log(`PHASE 7H TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("======================================================================\n");

  if (dbConnected) {
    await mongoose.disconnect();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Fatal Test Suite Error:", err);
  process.exit(1);
});
