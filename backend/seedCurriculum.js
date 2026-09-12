require("dotenv").config();
const mongoose = require("mongoose");
const MicroModule = require("./models/MicroModule");
const { FOUNDATIONS_MODULES } = require("./data/foundationsCurriculum");

async function seedFoundations() {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/quantumlab";
  console.log("Connecting to MongoDB for curriculum seeding:", mongoUri);
  await mongoose.connect(mongoUri);

  console.log(`Starting idempotent seed of ${FOUNDATIONS_MODULES.length} Foundations MicroModules...`);

  for (const moduleData of FOUNDATIONS_MODULES) {
    const updated = await MicroModule.findOneAndUpdate(
      { moduleId: moduleData.moduleId },
      { $set: moduleData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`[OK] Module ${updated.sequenceOrder}: ${updated.title} (${updated.moduleId})`);
  }

  const count = await MicroModule.countDocuments({ track: "foundations" });
  console.log(`Curriculum seed completed successfully! Total Foundations MicroModules in DB: ${count}`);

  await mongoose.disconnect();
}

seedFoundations().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
