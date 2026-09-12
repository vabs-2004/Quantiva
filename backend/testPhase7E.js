require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const http = require("http");
const express = require("express");
const User = require("./models/User");
const MicroModule = require("./models/MicroModule");
const Algorithm = require("./models/Algorithm");
const Course = require("./models/Course");
const Doc = require("./models/Doc");
const { JWT_SECRET } = require("./middleware/auth");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use("/api", require("./routes/searchRoutes"));
app.use("/api/micro-modules", require("./routes/microModuleRoutes"));
app.use("/api/progress", require("./routes/progressRoutes"));

let server;
const PORT = 8097;

async function startServer() {
  return new Promise((resolve) => {
    server = app.listen(PORT, () => {
      resolve();
    });
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
  console.log("PHASE 7E: EXPLORE & SEARCH TEST SUITE");
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
    // 1. Corpus Coverage: Empty query returns full curriculum
    const allRes = await request("/api/search");
    assert(allRes.status === 200, "GET /api/search returns 200");
    assert(allRes.body.success === true, "Response has success: true");
    assert(allRes.body.facets.micro_modules >= 12, "At least 12 micro-modules indexed in facets");
    assert(allRes.body.facets.algorithms >= 12, "At least 12 algorithms indexed in facets");
    assert(allRes.body.facets.courses >= 1, "Courses indexed in facets");
    assert(allRes.body.facets.docs >= 1, "Docs indexed in facets");

    // 2. Deterministic Matching & Aliases
    // Query: QPE -> Should match "Quantum Phase Estimation" with high score via alias
    const qpeRes = await request("/api/search?q=QPE");
    assert(qpeRes.status === 200, "GET /api/search?q=QPE returns 200");
    assert(qpeRes.body.results.length > 0, "QPE returns results");
    assert(qpeRes.body.results[0].id === "quantum-phase-estimation", "QPE top result is quantum-phase-estimation");
    assert(qpeRes.body.results[0].type === "algorithm", "QPE top result is of type algorithm");
    assert(qpeRes.body.results[0].route === "/algorithm/quantum-phase-estimation", "Correct route on QPE result");

    // Query: lowercase alias "qpe"
    const qpeLower = await request("/api/search?q=qpe");
    assert(qpeLower.body.results[0].id === "quantum-phase-estimation", "Case insensitive match for 'qpe'");

    // Query: "Grover" -> Exact/Starts-with match
    const groverRes = await request("/api/search?q=Grover");
    assert(groverRes.body.results[0].id === "grover-search", "Grover returns grover-search at rank 1");
    assert(groverRes.body.results[0].score >= 75, "Grover title match score >= 75");

    // Query: "Hadamard" -> Should find "Quantum Gates" via alias
    const hadamardRes = await request("/api/search?q=Hadamard");
    assert(hadamardRes.body.results.some((r) => r.id === "quantum-gates"), "Hadamard surfaces quantum-gates");

    // Query: "H gate" -> Should find "quantum-gates"
    const hGateRes = await request("/api/search?q=H+gate");
    assert(hGateRes.body.results.some((r) => r.id === "quantum-gates"), "'H gate' surfaces quantum-gates");

    // Query: "superposition" -> Should find "superposition" micro-module
    const supRes = await request("/api/search?q=superposition");
    assert(supRes.body.results.some((r) => r.id === "superposition"), "superposition surfaces superposition module");

    // Query: "teleportation" -> Should find quantum-teleportation algorithm
    const teleRes = await request("/api/search?q=teleportation");
    assert(teleRes.body.results.some((r) => r.id === "quantum-teleportation"), "teleportation surfaces quantum-teleportation");

    // 3. Category Filtering
    const algoOnly = await request("/api/search?q=quantum&category=algorithms");
    assert(algoOnly.body.results.every((r) => r.type === "algorithm"), "category=algorithms only returns algorithms");
    assert(algoOnly.body.facets.all > algoOnly.body.results.length, "Facets reflect unfiltered counts");

    const mmOnly = await request("/api/search?q=quantum&category=micro_modules");
    assert(mmOnly.body.results.every((r) => r.type === "micro_module"), "category=micro_modules only returns micro_modules");

    const coursesOnly = await request("/api/search?category=courses");
    assert(coursesOnly.body.results.every((r) => r.type === "course"), "category=courses only returns courses");

    // 4. Non-Existent Query
    const nonExistent = await request("/api/search?q=surface+code+threshold+theorem+xyz123");
    assert(nonExistent.status === 200, "Non-existent query returns 200");
    assert(nonExistent.body.results.length === 0, "Non-existent query returns 0 results");
    assert(nonExistent.body.total === 0, "total is 0 for non-existent query");

    // 5. Landing / Featured API
    const landingRes = await request("/api/explore/featured");
    assert(landingRes.status === 200, "GET /api/explore/featured returns 200");
    assert(Array.isArray(landingRes.body.foundations) && landingRes.body.foundations.length === 4, "Landing returns 4 foundations modules");
    assert(landingRes.body.foundations[0].id === "why-quantum", "First foundations module is why-quantum");
    assert(landingRes.body.foundations[1].id === "mathematical-foundations", "Second foundations module is mathematical-foundations");
    assert(Array.isArray(landingRes.body.algorithms) && landingRes.body.algorithms.length >= 3, "Landing returns core algorithms");
    assert(Array.isArray(landingRes.body.topics) && landingRes.body.topics.length > 5, "Landing returns real topics");

    // 6. Privacy & Visibility: Draft, Archived, and Private AI Modules
    // Create a temporary draft micro-module and a private module
    const testOwnerId = new mongoose.Types.ObjectId();
    const otherUserId = new mongoose.Types.ObjectId();

    const draftMod = await MicroModule.create({
      moduleId: "test-draft-module",
      title: "Secret Quantum Draft",
      description: "Should never be searchable",
      sequenceOrder: 999,
      track: "foundations",
      status: "draft",
    });

    const privateMod = await MicroModule.create({
      moduleId: "test-private-user-module",
      title: "Private Custom User Algorithm Notes",
      description: "Belongs strictly to testOwnerId",
      sequenceOrder: 1000,
      track: "personalized",
      type: "personalized",
      status: "published",
      owner: testOwnerId,
    });

    // Anonymous request: draft & private should NOT be returned
    const anonSearch = await request("/api/search?q=Secret+Quantum+Draft");
    assert(anonSearch.body.results.length === 0, "Draft module is hidden from anonymous search");

    const anonPrivateSearch = await request("/api/search?q=Private+Custom+User");
    assert(anonPrivateSearch.body.results.length === 0, "Private module is hidden from anonymous search");

    // User with different ID: private module should NOT be returned
    const otherToken = jwt.sign({ id: String(otherUserId), role: "user" }, JWT_SECRET);
    const otherSearch = await request("/api/search?q=Private+Custom+User", {
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    assert(otherSearch.body.results.length === 0, "Private module is hidden from other authenticated user");

    // Owner request: private module MUST be returned
    const ownerToken = jwt.sign({ id: String(testOwnerId), role: "user" }, JWT_SECRET);
    const ownerSearch = await request("/api/search?q=Private+Custom+User", {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    assert(ownerSearch.body.results.length === 1, "Private module IS returned to its verified owner");
    assert(ownerSearch.body.results[0].id === "test-private-user-module", "Owner retrieves own private module");

    // Clean up temporary test documents
    await MicroModule.deleteOne({ _id: draftMod._id });
    await MicroModule.deleteOne({ _id: privateMod._id });

    // 7. Deterministic Ranking Priority: Exact Title > Partial Description
    const rankTest = await request("/api/search?q=Why+Quantum");
    assert(rankTest.body.results[0].id === "why-quantum", "Exact title match 'Why Quantum?' ranks first");
    assert(rankTest.body.results[0].score >= 75, "High score for exact/starts-with title match");

    // 8. Algorithm Bookmarking Tests
    const bmAlgoUserToken = jwt.sign({ id: String(testOwnerId), role: "user" }, JWT_SECRET);
    const bmPostRes = await request("/api/progress/algorithm/grover-search/bookmark", {
      method: "POST",
      headers: { Authorization: `Bearer ${bmAlgoUserToken}` },
    });
    assert(bmPostRes.status === 200, "POST /api/progress/algorithm/:id/bookmark returns 200");
    assert(bmPostRes.body.bookmarked === true, "Response confirms algorithm bookmarked");

    const getBmAlgos = await request("/api/progress/algorithms/bookmarks", {
      headers: { Authorization: `Bearer ${bmAlgoUserToken}` },
    });
    assert(getBmAlgos.status === 200, "GET /api/progress/algorithms/bookmarks returns 200");
    assert(getBmAlgos.body.bookmarks.some((b) => b.id === "grover-search"), "Grover search found in user's algorithm bookmarks");

    const bmDelRes = await request("/api/progress/algorithm/grover-search/bookmark", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${bmAlgoUserToken}` },
    });
    assert(bmDelRes.status === 200, "DELETE /api/progress/algorithm/:id/bookmark returns 200");
    assert(bmDelRes.body.bookmarked === false, "Response confirms bookmark removed");

    // 9. Explore Landing Courses section
    const landingCourses = await request("/api/explore/featured");
    assert(Array.isArray(landingCourses.body.courses) && landingCourses.body.courses.length > 0, "Landing returns curated courses list");

    // 10. Category filtering with empty query (Browse Mode)
    const emptyCatSearch = await request("/api/search?category=micro_modules");
    assert(emptyCatSearch.status === 200, "Empty query category search returns 200");
    assert(emptyCatSearch.body.results.length >= 12, "Empty query category=micro_modules returns all 12 modules");
    assert(emptyCatSearch.body.results.every((r) => r.type === "micro_module"), "All items are micro_modules");

    // 11. Exact vs Related match separation: "Quantum Cryptography" (no curated lesson, related exists)
    const qCryptoRes = await request("/api/search?q=Quantum+Cryptography");
    assert(qCryptoRes.status === 200, "GET /api/search?q=Quantum+Cryptography returns 200");
    assert(qCryptoRes.body.exactMatch === null, "Quantum Cryptography has exactMatch: null");
    assert(Array.isArray(qCryptoRes.body.related) && qCryptoRes.body.related.length > 0, "Quantum Cryptography has related results");
    assert(qCryptoRes.body.related.some((r) => r.id === "bb84"), "Related results include BB84 / QKD");

    // 12. Exact vs Related match separation: "Quantum Phase Estimation" (curated exact match)
    const qpeExactRes = await request("/api/search?q=Quantum+Phase+Estimation");
    assert(qpeExactRes.status === 200, "GET /api/search?q=Quantum+Phase+Estimation returns 200");
    assert(qpeExactRes.body.exactMatch !== null, "Quantum Phase Estimation has exactMatch object");
    assert(qpeExactRes.body.exactMatch.id === "quantum-phase-estimation", "Exact match ID is quantum-phase-estimation");

  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
    console.log("======================================================================");
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("======================================================================");
    if (failed > 0) process.exit(1);
  }
}

runTests();
