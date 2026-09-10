const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("  ❌ MONGO_URI is not set in environment variables!");
  process.exit(1);
}

async function connectDB() {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`  ✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`  ❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
