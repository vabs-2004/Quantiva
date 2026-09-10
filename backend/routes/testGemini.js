const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../../.env"),
});

const { GoogleGenAI } = require("@google/genai");

async function test() {
  console.log(
    "Key loaded:",
    process.env.GEMINI_API_KEY
      ? `YES (${process.env.GEMINI_API_KEY.length} chars)`
      : "NO"
  );

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: "Reply with exactly: GEMINI_TEST_OK",
    });

    console.log("SUCCESS:");
    console.log(response.text);
  } catch (error) {
    console.error("GEMINI TEST FAILED:");
    console.error(error);
  }
}

test();