const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Groq = require('groq-sdk');

const apiKey = (process.env.GROQ_API_KEY || process.env['GROQ_API_KEY '])?.trim();
if (!apiKey) {
  console.error('DIAGNOSTIC FAILURE: GROQ_API_KEY is not set');
  process.exit(1);
}

const groq = new Groq({ apiKey });

const STAGE5_STRICT_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    summary: { type: 'string' },
    mechanism: { type: 'string' },
    stateChanges: {
      type: 'object',
      properties: {
        amplitudes: { type: 'string' },
        probabilities: { type: 'string' },
        phases: { type: 'string' },
        blochVectors: { type: 'string' }
      },
      required: ['amplitudes', 'probabilities', 'phases', 'blochVectors'],
      additionalProperties: false
    },
    pedagogicalNote: { type: 'string' }
  },
  required: ['headline', 'summary', 'mechanism', 'stateChanges', 'pedagogicalNote'],
  additionalProperties: false
};

const STAGE6_STRICT_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    summary: { type: 'string' },
    mechanism: { type: 'string' },
    noiseMetrics: {
      type: 'object',
      properties: {
        divergencePercent: { type: 'string' },
        purityLossPercent: { type: 'string' },
        blochContractionPercent: { type: 'string' }
      },
      required: ['divergencePercent', 'purityLossPercent', 'blochContractionPercent'],
      additionalProperties: false
    },
    pedagogicalNote: { type: 'string' }
  },
  required: ['headline', 'summary', 'mechanism', 'noiseMetrics', 'pedagogicalNote'],
  additionalProperties: false
};

async function runDiagnostics() {
  console.log('--- STARTING GROQ PRE-MIGRATION DIAGNOSTICS ---');

  // 1 & 2. GPT-OSS 120B text generation
  console.log('\n[1/6 & 2/6] Testing openai/gpt-oss-120b text generation...');
  try {
    const t0 = Date.now();
    const res120b = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: '<QUANTIVA_SYSTEM_POLICY><ROLE>You are Quantiva AI.</ROLE></QUANTIVA_SYSTEM_POLICY>' },
        { role: 'user', content: '<QUANTIVA_REQUEST><TASK>Say "Quantum ready" in exactly two words.</TASK></QUANTIVA_REQUEST>' }
      ],
      temperature: 0.1,
      max_completion_tokens: 20
    });
    console.log('SUCCESS (', Date.now() - t0, 'ms):', res120b.choices[0]?.message?.content?.trim());
  } catch (err) {
    console.error('FAILED 120B Text:', err.message, err.status, err.error);
    process.exit(1);
  }

  // 3. GPT-OSS 20B text generation
  console.log('\n[3/6] Testing openai/gpt-oss-20b text generation...');
  try {
    const t0 = Date.now();
    const res20b = await groq.chat.completions.create({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: '<QUANTIVA_SYSTEM_POLICY><ROLE>You are Quantiva Advisor.</ROLE></QUANTIVA_SYSTEM_POLICY>' },
        { role: 'user', content: '<QUANTIVA_REQUEST><TASK>Say "Fast ready" in exactly two words.</TASK></QUANTIVA_REQUEST>' }
      ],
      temperature: 0.1,
      max_completion_tokens: 20
    });
    console.log('SUCCESS (', Date.now() - t0, 'ms):', res20b.choices[0]?.message?.content?.trim());
  } catch (err) {
    console.error('FAILED 20B Text:', err.message, err.status, err.error);
    process.exit(1);
  }

  // 4 & 5. Stage 5 strict JSON Schema generation on 120B
  console.log('\n[4/6 & 5/6] Testing openai/gpt-oss-120b with Stage 5 strict JSON Schema...');
  try {
    const t0 = Date.now();
    const resS5 = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: '<QUANTIVA_SYSTEM_POLICY><ROLE>Stage 5 Explainer</ROLE></QUANTIVA_SYSTEM_POLICY>' },
        { role: 'user', content: '<QUANTIVA_REQUEST><TASK>Explain H gate on qubit 0 creating equal superposition.</TASK></QUANTIVA_REQUEST>' }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'stage5_transition_explanation',
          strict: true,
          schema: STAGE5_STRICT_SCHEMA
        }
      },
      temperature: 0.1
    });
    const parsed = JSON.parse(resS5.choices[0]?.message?.content);
    console.log('SUCCESS (', Date.now() - t0, 'ms):', {
      headline: parsed.headline,
      stateChanges: Object.keys(parsed.stateChanges || {})
    });
  } catch (err) {
    console.error('FAILED Stage 5 Schema:', err.message, err.status, err.error);
    process.exit(1);
  }

  // 6. Stage 6 strict JSON Schema generation on 120B
  console.log('\n[6/6] Testing openai/gpt-oss-120b with Stage 6 strict JSON Schema...');
  try {
    const t0 = Date.now();
    const resS6 = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: '<QUANTIVA_SYSTEM_POLICY><ROLE>Stage 6 Noise Explainer</ROLE></QUANTIVA_SYSTEM_POLICY>' },
        { role: 'user', content: '<QUANTIVA_REQUEST><TASK>Explain depolarizing noise 5% divergence on CNOT.</TASK></QUANTIVA_REQUEST>' }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'stage6_noise_explanation',
          strict: true,
          schema: STAGE6_STRICT_SCHEMA
        }
      },
      temperature: 0.1
    });
    const parsed = JSON.parse(resS6.choices[0]?.message?.content);
    console.log('SUCCESS (', Date.now() - t0, 'ms):', {
      headline: parsed.headline,
      noiseMetrics: Object.keys(parsed.noiseMetrics || {})
    });
  } catch (err) {
    console.error('FAILED Stage 6 Schema:', err.message, err.status, err.error);
    process.exit(1);
  }

  console.log('\n--- ALL 6 GROQ PRE-MIGRATION DIAGNOSTICS PASSED PERFECTLY ---');
}

runDiagnostics();
