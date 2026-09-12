const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const youtubeService = require("../services/youtubeService");
const lessonGeneratorService = require("../services/lessonGeneratorService");

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`[PASS] ${msg}`);
    passed++;
  } else {
    console.error(`[FAIL] ${msg}`);
    failed++;
  }
}

async function run() {
  console.log("==================================================");
  console.log("TESTING YOUTUBE SERVICE & 5-SECTION GENERATOR");
  console.log("==================================================");

  // 1. YouTube Service Test
  console.log("\n--- 1. YouTube Service Fetch ---");
  const ytKeyPresent = !!(process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_API_KEY.length > 5);
  console.log(`YOUTUBE_API_KEY configured: ${ytKeyPresent}`);

  const vid1 = await youtubeService.fetchTopVideo("Quantum Phase Estimation");
  assert(vid1 && vid1.embedUrl, "fetchTopVideo returns valid object with embedUrl for QPE");
  assert(vid1.title && vid1.title.length > 0, "Video has title: " + vid1.title);
  assert(vid1.embedUrl.includes("youtube"), "Video embedUrl points to youtube");
  console.log("Video result:", {
    title: vid1.title,
    channel: vid1.channelTitle,
    views: vid1.viewCount,
    embedUrl: vid1.embedUrl,
  });

  const vid2 = await youtubeService.fetchTopVideo("Phase Kickback");
  assert(vid2 && vid2.embedUrl, "fetchTopVideo returns valid object for Phase Kickback");

  // 2. Schema Validation with 5 Sections
  console.log("\n--- 2. 5-Section Lesson Validation ---");
  const testSpec = {
    title: "Understanding Phase Kickback",
    summary: "A 5-part deep dive into phase kickback.",
    difficulty: "intermediate",
    estimatedMinutes: 8,
    sections: [
      {
        id: "sec-1",
        type: "intuition",
        title: "Intuitive Picture",
        content: "If the target is an eigenstate of U with eigenvalue $e^{i\\phi}$, phase kicks back.",
        checkQuestion: { question: "Should be stripped from sec 1", options: ["A", "B"] }, // Should be stripped!
      },
      {
        id: "sec-2",
        type: "formalism",
        title: "Mathematical Formalism",
        content: "Step 1. Prepare target in state $|u\\rangle$.\nStep 2. Apply controlled-U gate.",
        formula: { latex: "U|u\\rangle = e^{i\\phi}|u\\rangle", explanation: "Eigenvalue relation" },
        checkQuestion: { question: "Should be stripped from sec 2", options: ["A", "B"] }, // Should be stripped!
      },
      {
        id: "sec-3",
        type: "code",
        title: "Code & Implementation",
        content: "Here is the runnable Qiskit circuit for phase kickback.",
        codeSnippet: {
          language: "python",
          title: "Phase Kickback Circuit",
          code: "from qiskit import QuantumCircuit\nqc = QuantumCircuit(2)\nqc.h(0)\nqc.x(1)\nqc.cp(3.14, 0, 1)\n",
          instructions: "Run this in the Sandbox.",
        },
      },
      {
        id: "sec-4",
        type: "video",
        title: "Video Learning",
        content: "Watch this video walkthrough explaining phase kickback visually.",
        video: vid2,
      },
      {
        id: "sec-5",
        type: "quiz",
        title: "Check Your Understanding",
        content: "Test your grasp of this topic.",
        checkQuestion: {
          question: "Which qubit acquires the phase during kickback?",
          options: ["Only the control qubit", "Only the target qubit", "Both qubits"],
          correctIndex: 0,
          explanation: "The phase is transferred to the control qubit's relative state.",
        },
      },
    ],
  };

  const validated = lessonGeneratorService.validateLessonSpec(testSpec);
  assert(validated.sections.length === 5, "Validated lesson retains all 5 sections");
  assert(validated.sections[0].checkQuestion === undefined, "checkQuestion was stripped from Section 1");
  assert(validated.sections[1].checkQuestion === undefined, "checkQuestion was stripped from Section 2");
  assert(validated.sections[2].codeSnippet && validated.sections[2].codeSnippet.code.includes("QuantumCircuit"), "Section 3 codeSnippet preserved");
  assert(validated.sections[3].video && validated.sections[3].video.embedUrl, "Section 4 video preserved");
  assert(validated.sections[4].checkQuestion && validated.sections[4].checkQuestion.question, "Section 5 quiz checkQuestion preserved");

  // 3. Prompt Construction Check
  console.log("\n--- 3. Prompt Construction Check ---");
  const { systemPrompt, userPrompt } = lessonGeneratorService.buildLessonGenerationPrompt(
    "Quantum Cryptography",
    "Quantum Cryptography",
    "intermediate"
  );
  assert(systemPrompt.includes("EXACT 5-SECTION PROGRESSION"), "System prompt specifies exact 5 sections");
  assert(systemPrompt.includes("CHECK QUESTIONS ARE EXCLUSIVE TO SECTION 5"), "System prompt declares check questions exclusive to section 5");
  assert(systemPrompt.includes("STRICT MATH DELIMITERS"), "System prompt demands strict math delimiters");
  assert(systemPrompt.includes("POINT-WISE LIST FORMATTING"), "System prompt instructs clean point-wise list formatting");
  assert(userPrompt.includes("5-section"), "User prompt requests 5-section lesson");

  console.log("\n==================================================");
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
