/**
 * Seed Database Script
 *
 * Imports all algorithm and educational content data from the frontend
 * data files into MongoDB. Also creates a default admin user.
 *
 * UGitHappense: node backend/scripts/seedDatabase.js
 */

const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

// ─── Connect to MongoDB ─────────────────────────────
const MONGO_URI =
  process.env.MONGO_URI;

// ─── Models ──────────────────────────────────────────
const Algorithm = require("../models/Algorithm");
const EducationalContent = require("../models/EducationalContent");
const User = require("../models/User");

// ─── Source Data ─────────────────────────────────────
// We read algorithm data from the backend data file (CommonJS)
const algorithms = require("../data/algorithms");

// Educational content is an ES module, so we need to read and parse it manually
function loadEducationalContent() {
  const filePath = path.join(__dirname, "../../src/data/educationalContent.js");
  let raw = fs.readFileSync(filePath, "utf-8");

  // Convert ES module export to something we can eval
  // Remove 'export const educationalContent = ' and get the object
  raw = raw.replace(/^export const educationalContent\s*=\s*/, "");
  // Remove trailing semicolons
  raw = raw.replace(/;\s*$/, "");

  // Use Function constructor to safely evaluate (better than eval)
  const fn = new Function(`return (${raw})`);
  return fn();
}

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected!\n");

    // ─── Clear existing data ────────────────────────
    console.log("Clearing existing data...");
    await Algorithm.deleteMany({});
    await EducationalContent.deleteMany({});
    await User.deleteMany({});
    console.log("  ✓ Cleared algorithms, educational content, and users\n");

    // ─── Seed Algorithms ────────────────────────────
    console.log("Seeding algorithms...");
    // Strip mockOutput from algorithms before inserting (not needed in DB)
    const cleanAlgos = algorithms.map(({ mockOutput, ...rest }) => rest);
    const insertedAlgos = await Algorithm.insertMany(cleanAlgos);
    console.log(`  ✓ Inserted ${insertedAlgos.length} algorithms\n`);

    // ─── Seed Educational Content ───────────────────
    console.log("Seeding educational content...");
    try {
      const eduContent = loadEducationalContent();
      const eduDocs = [];

      for (const [algorithmId, content] of Object.entries(eduContent)) {
        if (algorithmId === "default") continue; // Skip default fallback
        eduDocs.push({
          algorithmId,
          description: content.description || "",
          problemDescription: content.problemDescription || "",
          algorithm: content.algorithm || "",
          geometricProof: content.geometricProof || "",
          algebraicProof: content.algebraicProof || "",
          code: content.code || "",
          applications: content.applications || [],
          limitations: content.limitations || [],
        });
      }

      const insertedEdu = await EducationalContent.insertMany(eduDocs);
      console.log(`  ✓ Inserted ${insertedEdu.length} educational content entries\n`);
    } catch (err) {
      console.error("  ⚠ Could not load educational content:", err.message);
      console.log("  Skipping educational content seeding.\n");
    }

    // ─── Seed Default Admin ─────────────────────────
    console.log("Creating default admin user...");
    const admin = new User({
  username: "admin",
  password: "Admin@123",
  name: "Administrator",
  email: "admin@quantumlab.local",
  dob: new Date("2000-01-01"),
  gender: "Other",
  phone: "0000000000",
  os: "Windows",
  role: "admin",
});
    await admin.save();
    console.log("  ✓ Admin created — username: admin, password: Admin@123\n");

    // ─── Done ───────────────────────────────────────
    console.log("═══════════════════════════════════════════");
    console.log("  🎉 Database seeded successfully!");
    console.log("═══════════════════════════════════════════\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seed();
