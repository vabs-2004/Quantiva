const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../../.env"),
});

const aiProvider = require("../services/aiProvider");

async function test() {
  const isConfigured = aiProvider.isConfigured();
  console.log("Groq Configured:", isConfigured ? "YES" : "NO");

  if (!isConfigured) {
    console.error("GROQ TEST FAILED: GROQ_API_KEY is not set.");
    return;
  }

  try {
    const result = await aiProvider.generateText({
      systemPrompt: "<QUANTIVA_SYSTEM_POLICY><ROLE>You are a test agent.</ROLE></QUANTIVA_SYSTEM_POLICY>",
      userPrompt: "<QUANTIVA_REQUEST><TASK>Reply with exactly: GROQ_TEST_OK</TASK></QUANTIVA_REQUEST>",
      maxTokens: 50,
    });

    console.log("SUCCESS:");
    console.log(result.text);
  } catch (error) {
    console.error("GROQ TEST FAILED:");
    console.error(error);
  }
}

test();