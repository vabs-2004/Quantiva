require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const http = require("http");
const express = require("express");
const User = require("./models/User");
const UserProgress = require("./models/UserProgress");
const MicroModule = require("./models/MicroModule");

const app = express();
app.use(express.json());
app.use("/api", require("./routes/authRoutes"));
app.use("/api/progress", require("./routes/progressRoutes"));
app.use("/api/micro-modules", require("./routes/microModuleRoutes"));

let server;
const PORT = 8098;

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
  console.log("PHASE 7D: UNIVERSAL MICRO-MODULE BOOKMARKS TEST SUITE");
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
    const timestamp = Date.now();
    const userAEmail = `userA_7d_${timestamp}@example.com`;
    const userBEmail = `userB_7d_${timestamp}@example.com`;
    const password = "Password123!";

    // 1. Unauthenticated checks
    const unauthPost = await request("/api/progress/micro-module/why-quantum/bookmark", {
      method: "POST",
    });
    assert(unauthPost.status === 401, "Unauthenticated bookmark POST returns 401");

    const unauthGet = await request("/api/progress/micro-modules/bookmarks");
    assert(unauthGet.status === 401, "Unauthenticated get bookmarks returns 401");

    // 2. Register User A
    const regA = await request("/api/auth/register", {
      method: "POST",
      body: {
        username: `userA_${timestamp}`,
        name: "User A",
        email: userAEmail,
        password,
        dob: "2000-01-01",
        gender: "Other",
        phone: "1234567890",
        os: "Windows",
      },
    });
    assert(regA.status === 201, "User A registered successfully");
    const tokenA = regA.body?.token;
    const authHeadersA = { Authorization: `Bearer ${tokenA}` };

    // 3. Register User B
    const regB = await request("/api/auth/register", {
      method: "POST",
      body: {
        username: `userB_${timestamp}`,
        name: "User B",
        email: userBEmail,
        password,
        dob: "2000-01-01",
        gender: "Other",
        phone: "1234567891",
        os: "Windows",
      },
    });
    assert(regB.status === 201, "User B registered successfully");
    const tokenB = regB.body?.token;
    const authHeadersB = { Authorization: `Bearer ${tokenB}` };

    // 4. Initially empty bookmarks for User A
    const initBmA = await request("/api/progress/micro-modules/bookmarks", {
      headers: authHeadersA,
    });
    assert(initBmA.status === 200, "GET /api/progress/micro-modules/bookmarks returns 200");
    assert(Array.isArray(initBmA.body.bookmarks) && initBmA.body.bookmarks.length === 0, "User A initially has 0 bookmarks");

    // 5. Bookmark non-existent module -> 404
    const nonExistentBm = await request("/api/progress/micro-module/non-existent-module-xyz/bookmark", {
      method: "POST",
      headers: authHeadersA,
    });
    assert(nonExistentBm.status === 404, "Bookmarking non-existent module returns 404");

    // 6. User A bookmarks 'why-quantum'
    const bmA1 = await request("/api/progress/micro-module/why-quantum/bookmark", {
      method: "POST",
      headers: authHeadersA,
    });
    assert(bmA1.status === 200, "POST bookmark 'why-quantum' returns 200");
    assert(bmA1.body.bookmarked === true, "Response indicates bookmarked: true");
    assert(bmA1.body.moduleId === "why-quantum", "Response includes correct moduleId");

    // 7. Small delay and User A bookmarks 'mathematical-foundations'
    await new Promise((r) => setTimeout(r, 100));
    const bmA2 = await request("/api/progress/micro-module/mathematical-foundations/bookmark", {
      method: "POST",
      headers: authHeadersA,
    });
    assert(bmA2.status === 200, "POST bookmark 'mathematical-foundations' returns 200");
    assert(bmA2.body.totalBookmarks === 2, "User A has totalBookmarks: 2");

    // 8. Idempotency: Bookmarking 'why-quantum' again does not duplicate
    const bmA1Dup = await request("/api/progress/micro-module/why-quantum/bookmark", {
      method: "POST",
      headers: authHeadersA,
    });
    assert(bmA1Dup.status === 200, "Duplicate bookmark returns 200");
    assert(bmA1Dup.body.totalBookmarks === 2, "totalBookmarks remains 2 (no duplicate)");

    // 9. Bookmark Ordering Verification:
    // Should be strictly ordered by bookmarkedAt descending (most recently bookmarked first)
    const getBmA = await request("/api/progress/micro-modules/bookmarks", {
      headers: authHeadersA,
    });
    assert(getBmA.status === 200, "GET /api/progress/micro-modules/bookmarks returns 200");
    assert(getBmA.body.bookmarks.length === 2, "User A has exactly 2 bookmarks");
    assert(
      getBmA.body.bookmarks[0].moduleId === "mathematical-foundations",
      "Most recently bookmarked module ('mathematical-foundations') is FIRST"
    );
    assert(
      getBmA.body.bookmarks[1].moduleId === "why-quantum",
      "Earlier bookmarked module ('why-quantum') is SECOND"
    );

    // 10. Route Ordering & Path Collision Check:
    // GET /api/micro-modules/bookmarks must NOT be captured by /:id
    const altRoute = await request("/api/micro-modules/bookmarks", {
      headers: authHeadersA,
    });
    assert(altRoute.status === 200, "GET /api/micro-modules/bookmarks returns 200 without path collision");
    assert(altRoute.body.bookmarks.length === 2, "Returns bookmarks on /api/micro-modules/bookmarks route");

    // Verify /api/micro-modules/:id still works as expected
    const getMod = await request("/api/micro-modules/why-quantum");
    assert(getMod.status === 200, "GET /api/micro-modules/:id still works for normal modules");
    assert(getMod.body.title === "Why Quantum?", "Retrieved correct module title");

    // 11. Multi-User Isolation:
    // User B should have 0 bookmarks
    const getBmB = await request("/api/progress/micro-modules/bookmarks", {
      headers: authHeadersB,
    });
    assert(getBmB.status === 200 && getBmB.body.bookmarks.length === 0, "User B has 0 bookmarks (isolated from User A)");

    // User B bookmarks 'superposition'
    const bmB1 = await request("/api/progress/micro-module/superposition/bookmark", {
      method: "POST",
      headers: authHeadersB,
    });
    assert(bmB1.status === 200, "User B bookmarks 'superposition'");

    // Check User B only has 'superposition'
    const getBmBAfter = await request("/api/progress/micro-modules/bookmarks", {
      headers: authHeadersB,
    });
    assert(
      getBmBAfter.body.bookmarks.length === 1 && getBmBAfter.body.bookmarks[0].moduleId === "superposition",
      "User B has only 'superposition'"
    );

    // Check User A's bookmarks are completely unchanged
    const getBmACheck = await request("/api/progress/micro-modules/bookmarks", {
      headers: authHeadersA,
    });
    assert(
      getBmACheck.body.bookmarks.length === 2 && !getBmACheck.body.bookmarks.some((b) => b.moduleId === "superposition"),
      "User A's bookmarks unaffected by User B (Multi-user isolation guaranteed)"
    );

    // 12. Progress Independence Check (CRITICAL REQUIREMENT):
    // Bookmarking must NOT modify progress states (not_started, in_progress, completed, skipped)
    const progBefore = await request("/api/progress/me", { headers: authHeadersA });
    const whyQuantumProgBefore = (progBefore.body.progress.microModuleProgress || []).find(
      (m) => m.moduleId === "why-quantum"
    );
    assert(!whyQuantumProgBefore || whyQuantumProgBefore.status === "not_started", "Module progress is not_started before");

    // Update status to in_progress
    await request("/api/progress/micro-module/why-quantum", {
      method: "PUT",
      headers: authHeadersA,
      body: { status: "in_progress" },
    });

    const progInProg = await request("/api/progress/me", { headers: authHeadersA });
    const whyQuantumInProg = progInProg.body.progress.microModuleProgress.find(
      (m) => m.moduleId === "why-quantum"
    );
    assert(whyQuantumInProg?.status === "in_progress", "Module progress is in_progress");

    // Unbookmark 'why-quantum'
    const unbmA = await request("/api/progress/micro-module/why-quantum/bookmark", {
      method: "DELETE",
      headers: authHeadersA,
    });
    assert(unbmA.status === 200, "DELETE bookmark returns 200");
    assert(unbmA.body.bookmarked === false, "Response confirms bookmarked: false");

    // Verify progress is STILL in_progress after unbookmarking
    const progAfterUnbm = await request("/api/progress/me", { headers: authHeadersA });
    const whyQuantumAfterUnbm = progAfterUnbm.body.progress.microModuleProgress.find(
      (m) => m.moduleId === "why-quantum"
    );
    assert(
      whyQuantumAfterUnbm?.status === "in_progress",
      "Module progress status strictly PRESERVED as in_progress after unbookmarking"
    );

    // Safe unbookmarking of non-bookmarked item
    const unbmNonExistent = await request("/api/progress/micro-module/qubits-states/bookmark", {
      method: "DELETE",
      headers: authHeadersA,
    });
    assert(unbmNonExistent.status === 200, "Safe removal of non-existent bookmark returns 200");

    // Mark completed
    await request("/api/progress/micro-module/why-quantum", {
      method: "PUT",
      headers: authHeadersA,
      body: { status: "completed" },
    });

    // Re-bookmark completed module
    await request("/api/progress/micro-module/why-quantum/bookmark", {
      method: "POST",
      headers: authHeadersA,
    });

    // Verify progress remains completed
    const progFinal = await request("/api/progress/me", { headers: authHeadersA });
    const whyQuantumFinal = progFinal.body.progress.microModuleProgress.find(
      (m) => m.moduleId === "why-quantum"
    );
    assert(
      whyQuantumFinal?.status === "completed",
      "Module progress status strictly PRESERVED as completed after re-bookmarking"
    );
    assert(
      progFinal.body.progress.bookmarkedMicroModules.some((b) => b.moduleId === "why-quantum"),
      "Module is bookmarked in progress document"
    );

  } catch (err) {
    console.error("Test execution failed:", err);
    failed++;
  } finally {
    console.log("======================================================================");
    console.log(`PHASE 7D TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("======================================================================");
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
