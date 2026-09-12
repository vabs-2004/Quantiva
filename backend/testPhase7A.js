require("dotenv").config({ path: ".env" });
const mongoose = require("mongoose");
const http = require("http");
const User = require("./models/User");
const UserProgress = require("./models/UserProgress");
const MicroModule = require("./models/MicroModule");

const BASE_URL = "http://127.0.0.1:8000/api";

// We can test against the running server or mount app directly
const express = require("express");
const app = express();
app.use(express.json());
app.use("/api", require("./routes/authRoutes"));
app.use("/api/progress", require("./routes/progressRoutes"));
app.use("/api/micro-modules", require("./routes/microModuleRoutes"));

let server;

async function startServer() {
  return new Promise((resolve) => {
    server = app.listen(8099, () => {
      resolve();
    });
  });
}

async function request(path, options = {}) {
  const url = `http://127.0.0.1:8099${path}`;
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
  await mongoose.connect(mongoUri);
  await startServer();

  console.log("======================================================================");
  console.log("PHASE 7A BACKEND VERIFICATION TEST SUITE");
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
    // 1. Check all 12 modules retrieved
    const getRes = await request("/api/micro-modules");
    assert(getRes.status === 200, "GET /api/micro-modules returns 200");
    assert(Array.isArray(getRes.body) && getRes.body.length === 12, "Returns exactly 12 Foundations micro-modules");
    assert(getRes.body[0].moduleId === "why-quantum", "Module 1 is 'why-quantum'");
    assert(getRes.body[11].moduleId === "bell-states", "Module 12 is 'bell-states'");

    // 2. Retrieve individual module by moduleId
    const singleRes = await request("/api/micro-modules/superposition");
    assert(singleRes.status === 200, "GET /api/micro-modules/superposition returns 200");
    assert(singleRes.body.title === "Superposition", "Module title matches 'Superposition'");
    assert(singleRes.body.sequenceOrder === 9, "Module sequence order is 9");

    // 3. Retrieve non-existent module returns 404
    const notFoundRes = await request("/api/micro-modules/non-existent-module");
    assert(notFoundRes.status === 404, "GET non-existent module returns 404");

    // 4. Test User & Auth with Learning Profile
    const testUsername = `user7a_${Date.now()}`;
    const testEmail = `${testUsername}@example.com`;
    const regRes = await request("/api/auth/register", {
      method: "POST",
      body: {
        username: testUsername,
        password: "password123",
        name: "Tester 7A",
        email: testEmail,
        dob: "2000-01-01",
        gender: "Other",
        phone: "1234567890",
        os: "Windows",
      },
    });
    assert(regRes.status === 201, "User registered successfully");
    const token = regRes.body.token;

    // 5. Test GET /api/auth/me returns learningProfile with lazy init
    const meRes = await request("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(meRes.status === 200, "GET /api/auth/me returns 200");
    assert(meRes.body.learningProfile?.startingLevel === "completely_new", "Default startingLevel is 'completely_new'");
    assert(meRes.body.learningProfile?.onboardingCompleted === false, "Default onboardingCompleted is false");

    // 6. Test PUT /api/auth/learning-profile
    const updateProfileRes = await request("/api/auth/learning-profile", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: { startingLevel: "knows_basics", onboardingCompleted: true },
    });
    assert(updateProfileRes.status === 200, "PUT /api/auth/learning-profile returns 200");
    assert(updateProfileRes.body.learningProfile.startingLevel === "knows_basics", "Updated startingLevel to 'knows_basics'");
    assert(updateProfileRes.body.learningProfile.onboardingCompleted === true, "Updated onboardingCompleted to true");

    // 7. Test unauthenticated progress update rejected
    const unauthProgRes = await request("/api/progress/micro-module/why-quantum", {
      method: "PUT",
      body: { status: "in_progress" },
    });
    assert(unauthProgRes.status === 401, "Unauthenticated progress update returns 401");

    // 8. Test in_progress status update
    const inProgRes = await request("/api/progress/micro-module/why-quantum", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: { status: "in_progress" },
    });
    assert(inProgRes.status === 200, "PUT in_progress returns 200");
    assert(inProgRes.body.entry.status === "in_progress", "Module status is 'in_progress'");

    // 9. Test mark completed
    const completeRes = await request("/api/progress/micro-module/why-quantum", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: { status: "completed" },
    });
    assert(completeRes.status === 200, "PUT completed returns 200");
    assert(completeRes.body.entry.status === "completed", "Module status is 'completed'");
    assert(completeRes.body.summary.microModulesCompleted === 1, "Completed summary count is 1");

    // 10. Test skip module (Module 2: mathematical-foundations)
    const skipRes = await request("/api/progress/micro-module/mathematical-foundations", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: { status: "skipped" },
    });
    assert(skipRes.status === 200, "PUT skipped returns 200");
    assert(skipRes.body.entry.status === "skipped", "Module status is 'skipped'");
    assert(skipRes.body.summary.microModulesSkipped === 1, "Skipped count is 1");
    assert(skipRes.body.summary.microModulesCompleted === 1, "Completed count remains 1 (skipped does not inflate completion)");

    // 11. Test review behavior (reopening completed module with in_progress preserves completed state)
    const reviewRes = await request("/api/progress/micro-module/why-quantum", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: { status: "in_progress" },
    });
    assert(reviewRes.status === 200, "Reopening completed module returns 200");
    assert(reviewRes.body.entry.status === "completed", "Reopened completed module status remains 'completed'");

    // 12. Test GET /api/progress/me reflects accurate summary
    const myProgRes = await request("/api/progress/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert(myProgRes.status === 200, "GET /api/progress/me returns 200");
    assert(myProgRes.body.summary.totalMicroModules === 12, "Summary totalMicroModules is 12");
    assert(myProgRes.body.summary.microModulesCompleted === 1, "Summary microModulesCompleted is 1");
    assert(myProgRes.body.summary.microModulesSkipped === 1, "Summary microModulesSkipped is 1");

    // Cleanup test user
    await User.deleteOne({ _id: meRes.body.id });
    await UserProgress.deleteOne({ user: meRes.body.id });
  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
  }

  console.log("======================================================================");
  console.log(`RESULTS: ${passed} passed, ${failed} failed (${passed + failed} total)`);
  console.log("======================================================================");

  if (failed > 0) process.exit(1);
}

runTests();
