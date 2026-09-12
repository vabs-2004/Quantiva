/**
 * Quantiva AI — AI Provider Service
 *
 * Encapsulates the Groq Cloud AI provider:
 * - Client initialization with GROQ_API_KEY only (no Gemini fallback)
 * - Model routing (openai/gpt-oss-120b for primary, openai/gpt-oss-20b for fast)
 * - Structured outputs using Groq's native strict JSON Schema (strict: true)
 * - Reasoning token suppression (include_reasoning: false)
 * - Conservative retry handling (1 retry on 429/5xx)
 * - Error classification and normalization
 */

const Groq = require('groq-sdk');

const apiKey = (process.env.GROQ_API_KEY || process.env['GROQ_API_KEY '])?.trim();

const PRIMARY_MODEL = process.env.GROQ_PRIMARY_MODEL || 'openai/gpt-oss-120b';
const FAST_MODEL = process.env.GROQ_FAST_MODEL || 'openai/gpt-oss-20b';

let client = null;
if (apiKey) {
  try {
    client = new Groq({ apiKey });
  } catch (err) {
    console.error('Failed to initialize Groq client:', err.message);
  }
} else {
  console.warn('GROQ_API_KEY is not configured. AI features will operate in fallback mode.');
}

/**
 * Checks if the provider is properly configured with an API key.
 */
function isConfigured() {
  return Boolean(client && apiKey);
}

/**
 * Normalizes Groq errors into standard error objects with classification.
 */
function normalizeError(err) {
  const status = err.status || err.statusCode || (err.error && err.error.code) || 500;
  let code = 'SERVER_ERROR';

  if (status === 401) {
    code = 'AUTHENTICATION_ERROR';
  } else if (status === 429) {
    code = 'RATE_LIMIT_ERROR';
  } else if (status === 400) {
    code = 'VALIDATION_ERROR';
  } else if (status === 408 || err.code === 'ETIMEDOUT') {
    code = 'TIMEOUT_ERROR';
  }

  return {
    isAiProviderError: true,
    code,
    status,
    message: err.message || 'Groq provider request failed',
    raw: err
  };
}

/**
 * Sleep helper for retry backoff.
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Executes a text generation completion with conservative 1-retry handling.
 */
async function generateText({
  systemPrompt,
  userPrompt,
  messages = null,
  model = PRIMARY_MODEL,
  temperature = 0.7,
  maxTokens = 1024
}) {
  if (!client) {
    throw normalizeError(new Error('AI provider is not configured. GROQ_API_KEY is missing.'));
  }

  let formattedMessages = [];
  if (messages && Array.isArray(messages) && messages.length > 0) {
    formattedMessages = [...messages];
    if (systemPrompt && !formattedMessages.some(m => m.role === 'system')) {
      formattedMessages.unshift({ role: 'system', content: systemPrompt });
    }
  } else {
    if (systemPrompt) {
      formattedMessages.push({ role: 'system', content: systemPrompt });
    }
    if (userPrompt) {
      formattedMessages.push({ role: 'user', content: userPrompt });
    }
  }

  const payload = {
    model,
    messages: formattedMessages,
    temperature,
    max_completion_tokens: maxTokens,
    include_reasoning: false
  };

let attempts = 0;

console.log("[aiProvider] generateText() called:", {
  model,
  messageCount: formattedMessages.length,
  temperature,
  maxTokens
});

while (attempts < 2) {
  attempts++;

  console.log(`[aiProvider] Attempt ${attempts}/2 → calling Groq...`);

  const startTime = Date.now();

  try {
    const response = await client.chat.completions.create(payload);

    const duration = Date.now() - startTime;

    console.log(`[aiProvider] Attempt ${attempts} succeeded:`, {
      durationMs: duration,
      hasResponse: !!response,
      choicesLength: response?.choices?.length,
      model: response?.model,
      finishReason: response?.choices?.[0]?.finish_reason,
      hasMessage: !!response?.choices?.[0]?.message,
      contentLength:
        response?.choices?.[0]?.message?.content?.length || 0,
      usage: response?.usage || null
    });

    const content =
      response.choices[0]?.message?.content || '';

    if (!content) {
      console.warn(
        `[aiProvider] ⚠️ Attempt ${attempts} returned EMPTY content`
      );
    }

    return {
      text: content,
      model: response.model || model,
      usage: response.usage || null
    };

  } catch (err) {
    const duration = Date.now() - startTime;
    const normalized = normalizeError(err);

    console.error(`[aiProvider] ❌ Attempt ${attempts} failed:`, {
      durationMs: duration,
      status: normalized.status,
      code: normalized.code,
      message: normalized.message,
      originalCode: err?.code,
      originalName: err?.name
    });

    if (
      attempts === 1 &&
      (normalized.status === 429 || normalized.status >= 500)
    ) {
      console.warn(
        `[aiProvider] 🔄 Transient error detected. Retrying after 300ms...`
      );

      await sleep(300);

      console.log(
        `[aiProvider] Retry delay complete. Starting attempt 2...`
      );

      continue;
    }

    console.error(
      `[aiProvider] ❌ No retry available. Throwing normalized error.`
    );

    throw normalized;
  }
}
}

/**
 * Executes a structured JSON Schema generation completion using Groq's native strict mode.
 */
async function generateStructured({
  systemPrompt,
  userPrompt,
  schemaName = 'response_schema',
  schema,
  model = PRIMARY_MODEL,
  temperature = 0.1,
  strict = true
}) {
  if (!client) {
    throw normalizeError(new Error('AI provider is not configured. GROQ_API_KEY is missing.'));
  }

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  if (userPrompt) {
    messages.push({ role: 'user', content: userPrompt });
  }

  const payload = {
    model,
    messages,
    temperature,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: schemaName,
        strict,
        schema
      }
    },
    include_reasoning: false
  };

  let attempts = 0;
  while (attempts < 2) {
    attempts++;
    try {
      const response = await client.chat.completions.create(payload);
      const rawContent = response.choices[0]?.message?.content || '{}';
      let parsed = null;
      try {
        parsed = JSON.parse(rawContent);
      } catch (parseErr) {
        // Fallback cleanup if fences appear
        const cleaned = rawContent.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        parsed = JSON.parse(cleaned);
      }

      return {
        data: parsed,
        rawText: rawContent,
        model: response.model || model,
        usage: response.usage || null
      };
    } catch (err) {
      const normalized = normalizeError(err);
      // Retry once on transient rate limits or server errors
      if (attempts === 1 && (normalized.status === 429 || normalized.status >= 500)) {
        console.warn(`[aiProvider] Groq structured call failed with status ${normalized.status}. Retrying after 300ms...`);
        await sleep(300);
        continue;
      }
      throw normalized;
    }
  }
}

module.exports = {
  isConfigured,
  generateText,
  generateStructured,
  normalizeError,
  PRIMARY_MODEL,
  FAST_MODEL
};
