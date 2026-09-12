require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const express = require("express");
const User = require("./models/User");
const UserProgress = require("./models/UserProgress");
const { KNOWLEDGE_MAP_TOPICS } = require("./data/knowledgeMapData");
const topicRoutes = require("./routes/topicRoutes");
const { JWT_SECRET } = require("./middleware/auth");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use("/api/topics", topicRoutes);

let server;
const PORT = 8098;

async function startServer() {
  return new Promise((resolve) => {
    server = app.listen(PORT, () => resolve());
  });
}

async function request(path, options = {}) {
  const url = `http://127.0.0.1:${PORT}${path}`;
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let body;
  try {
    body = await res.json();
  } catch (e) {
    body = null;
  }
  return { status: res.status, body };
}

async function runTests() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/quantumlab";
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
  await startServer();

  console.log("======================================================================");
  console.log("PHASE 7F: TOPIC NAVIGATOR & KNOWLEDGE MAP TEST SUITE");
  console.log("======================================================================");

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

  try {
    // 1. DATA INTEGRITY CHECKS
    assert(Array.isArray(KNOWLEDGE_MAP_TOPICS), "KNOWLEDGE_MAP_TOPICS is an array");
    assert(KNOWLEDGE_MAP_TOPICS.length >= 60, `Substantial topic count: ${KNOWLEDGE_MAP_TOPICS.length} >= 60`);

    const topicIds = new Set();
    KNOWLEDGE_MAP_TOPICS.forEach((t) => topicIds.add(t.topicId));
    assert(topicIds.size === KNOWLEDGE_MAP_TOPICS.length, "All topic IDs are strictly unique");

    // 2. API: GET /api/topics
    const listRes = await request("/api/topics");
    assert(listRes.status === 200, "GET /api/topics returns 200");
    assert(listRes.body.success === true, "GET /api/topics has success: true");
    assert(listRes.body.count === KNOWLEDGE_MAP_TOPICS.length, `Returns all ${KNOWLEDGE_MAP_TOPICS.length} topics`);

    // 3. API: GET /api/topics/:topicId (Resource-backed QPE)
    const qpeRes = await request("/api/topics/quantum-phase-estimation");
    assert(qpeRes.status === 200, "GET /api/topics/quantum-phase-estimation returns 200");
    assert(qpeRes.body.topic.topicId === "quantum-phase-estimation", "Topic ID matches");
    assert(qpeRes.body.topic.resource.type === "algorithm", "QPE resource is an algorithm");
    assert(qpeRes.body.topic.defaultConnections.length >= 3 && qpeRes.body.topic.defaultConnections.length <= 6, "Default connections bounded between 3 and 6");
    assert(qpeRes.body.topic.relationships.foundations.length > 0, "QPE has foundations grouped");
    assert(qpeRes.body.topic.relationships.components.length > 0, "QPE has components grouped");
    assert(qpeRes.body.topic.relationships.extensions.length > 0, "QPE has extensions grouped");

    // 4. API: GET /api/topics/:topicId (Concept-only Phase Kickback)
    const pkRes = await request("/api/topics/phase-kickback");
    assert(pkRes.status === 200, "GET /api/topics/phase-kickback returns 200");
    assert(pkRes.body.topic.resource === null, "Concept-only topic strictly has resource: null");
    assert(pkRes.body.topic.progress === null, "Concept-only topic strictly has progress: null (no fake progress)");

    // 5. API: Contextual lookup GET /api/topics/by-resource/:type/:id
    const mmLookup = await request("/api/topics/by-resource/micro_module/why-quantum");
    assert(mmLookup.status === 200, "GET by-resource for micro_module 'why-quantum' returns 200");
    assert(mmLookup.body.topic.topicId === "why-quantum", "Maps directly to 'why-quantum' topic");

    const algoLookup = await request("/api/topics/by-resource/algorithm/grover-search");
    assert(algoLookup.status === 200, "GET by-resource for algorithm 'grover-search' returns 200");
    assert(algoLookup.body.topic.topicId === "grover-search", "Maps directly to 'grover-search' topic");

    const courseLookup = await request("/api/topics/by-resource/course/6aa2e9e764a1165b2a3fc70b");
    assert(courseLookup.status === 200, "GET by-resource for course returns 200");
    assert(courseLookup.body.topic.topicId === "quantum-algorithms", "Maps to 'quantum-algorithms' topic");

    // 6. Non-existent topic returns 404
    const notFound = await request("/api/topics/quantum-magic-wand");
    assert(notFound.status === 404, "Non-existent topic returns 404");

    const noResourceFound = await request("/api/topics/by-resource/algorithm/fake-algo-id");
    assert(noResourceFound.status === 404, "Non-mapped resource returns 404");

    // 7. USER PROGRESS OVERLAY INTEGRATION
    const testUsername = `test_user_7f_${Date.now()}`;
    const testUser = await User.create({
      username: testUsername,
      email: `${testUsername}@example.com`,
      password: "password123",
      name: "Tester 7F",
      dob: "2000-01-01",
      gender: "Other",
      phone: "1234567890",
      role: "user",
    });

    const userToken = jwt.sign(
      { id: testUser._id, role: testUser.role },
      JWT_SECRET || "5e444e68eda75937490df238ce51cfc6e6dd1cd892770fb5d62fb3b316097956dec1906cd8b5a3c34c2da1a496c92f7a975a8f6f781d666265d8fc520c692073",
      { expiresIn: "1h" }
    );

    // Seed progress: 'why-quantum' completed, 'qubits-quantum-states' in_progress, 'grover-search' run 5 times
    await UserProgress.create({
      user: testUser._id,
      microModuleProgress: [
        { moduleId: "why-quantum", status: "completed" },
        { moduleId: "qubits-quantum-states", status: "in_progress" },
      ],
      algorithmRuns: [
        { algorithmId: "grover-search", count: 5 },
      ],
      courseProgress: [],
    });

    // Request topic details WITH user token
    const authHeaders = { Authorization: `Bearer ${userToken}` };
    const authWhyRes = await request("/api/topics/why-quantum", { headers: authHeaders });
    assert(authWhyRes.status === 200, "Authenticated GET topic returns 200");
    assert(authWhyRes.body.topic.progress === "completed", "Authoritative progress 'completed' overlaid for why-quantum");

    // Inspect connected node progress
    const qubitsConn = authWhyRes.body.topic.defaultConnections.find((c) => c.topicId === "qubits-quantum-states");
    assert(qubitsConn && qubitsConn.progress === "in_progress", "Connected target qubits-quantum-states has progress 'in_progress'");

    const groverAuthRes = await request("/api/topics/grover-search", { headers: authHeaders });
    assert(groverAuthRes.body.topic.progress === "completed", "Algorithm with runs overlaid as 'completed'");

    // Clean up test user
    await UserProgress.deleteOne({ user: testUser._id });
    await User.deleteOne({ _id: testUser._id });
  } catch (err) {
    console.error("Test error:", err);
    failed++;
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    console.log("======================================================================");
    console.log(`FINAL 7F RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("======================================================================");
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
