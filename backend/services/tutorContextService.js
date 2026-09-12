/**
 * tutorContextService.js
 * 
 * Quantiva Phase 7G-C: AI Backend & Context Integration Service
 * 
 * Provides:
 * 1. Strict validation & sanitization of client-provided Quantiva context
 * 2. Protection against prompt injection via context fields
 * 3. Graceful degradation for null, empty, or malformed contexts
 * 4. Controlled formatting for AI prompt injection (token-efficient text block)
 */

const VALID_SOURCES = [
  'topic-navigator',
  'micro-module',
  'algorithm',
  'course',
  'explore',
  'dashboard',
  'circuit-simulator',
  'circuit-challenges',
  'sandbox'
];

const VALID_RESOURCE_TYPES = [
  'micro_module',
  'algorithm',
  'course',
  'doc'
];

const VALID_LEVELS = [
  'completely_new',
  'beginner',
  'knows_basics',
  'intermediate',
  'advanced'
];

/**
 * Strips control characters, normalizes whitespace, and truncates.
 */
function sanitizeString(val, maxLength = 300) {
  if (typeof val !== 'string') return null;
  const cleaned = val.replace(/[\x00-\x1F\x7F]/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, maxLength) || null;
}

/**
 * Sanitizes an array of relationships, bounding size to preserve token budget.
 */
function sanitizeRelationshipList(arr, maxItems = 8) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter(item => item && (typeof item === 'object' || typeof item === 'string'))
    .slice(0, maxItems)
    .map(item => {
      if (typeof item === 'string') {
        const text = sanitizeString(item, 80);
        return text ? { topicId: text, title: text } : null;
      }
      const topicId = sanitizeString(item.topicId || item.id, 80);
      const title = sanitizeString(item.title || item.name, 80);
      return (topicId || title) ? { topicId, title } : null;
    })
    .filter(Boolean);
}

/**
 * Validates and normalizes incoming client context into a safe, predictable structure.
 */
function validateAndNormalizeContext(rawContext) {
  if (!rawContext || typeof rawContext !== 'object') {
    return {
      source: 'dashboard',
      topic: null,
      resource: null,
      knowledgeMap: null,
      learner: null,
      query: null,
      circuit: null,
      challengeMode: false,
      challenge: null,
    };
  }

  // Source validation
  let source = sanitizeString(rawContext.source, 50);
  if (!VALID_SOURCES.includes(source)) {
    if (rawContext.challengeMode) source = 'circuit-challenges';
    else if (rawContext.section === 'micro-module') source = 'micro-module';
    else source = 'dashboard';
  }

  // Topic validation
  let topic = null;
  const rawTopic = rawContext.topic || (rawContext.topicId || rawContext.title ? rawContext : null);
  if (rawTopic && typeof rawTopic === 'object') {
    const topicId = sanitizeString(rawTopic.topicId || rawTopic.id, 80);
    const title = sanitizeString(rawTopic.title || rawTopic.name, 120);
    const category = sanitizeString(rawTopic.category || rawTopic.track, 80);
    const description = sanitizeString(rawTopic.description, 300);
    if (topicId || title) {
      topic = { topicId, title, category, description };
    }
  }

  // Resource validation
  let resource = null;
  const rawResource = rawContext.resource;
  if (rawResource && typeof rawResource === 'object') {
    let type = sanitizeString(rawResource.type, 30);
    if (!VALID_RESOURCE_TYPES.includes(type)) type = null;
    const id = sanitizeString(rawResource.id || rawResource.moduleId || rawResource.algorithmId || rawResource.courseId, 80);
    const title = sanitizeString(rawResource.title || rawResource.name, 120);
    if (type && id) {
      resource = { type, id, title };
    }
  } else if (rawContext.moduleId) {
    resource = {
      type: 'micro_module',
      id: sanitizeString(rawContext.moduleId, 80),
      title: sanitizeString(rawContext.moduleTitle || rawContext.title, 120)
    };
  } else if (rawContext.algorithmId) {
    resource = {
      type: 'algorithm',
      id: sanitizeString(rawContext.algorithmId, 80),
      title: sanitizeString(rawContext.algorithmTitle || rawContext.title, 120)
    };
  } else if (rawContext.courseId) {
    resource = {
      type: 'course',
      id: sanitizeString(rawContext.courseId, 80),
      title: sanitizeString(rawContext.courseTitle || rawContext.title, 120)
    };
  }

  // Knowledge Map validation
  let knowledgeMap = null;
  if (rawContext.knowledgeMap && typeof rawContext.knowledgeMap === 'object') {
    const foundations = sanitizeRelationshipList(rawContext.knowledgeMap.foundations);
    const related = sanitizeRelationshipList(rawContext.knowledgeMap.related);
    const components = sanitizeRelationshipList(rawContext.knowledgeMap.components);
    const extensions = sanitizeRelationshipList(rawContext.knowledgeMap.extensions);
    if (foundations.length || related.length || components.length || extensions.length) {
      knowledgeMap = { foundations, related, components, extensions };
    }
  }

  // Learner level validation
  let learner = null;
  const rawLevel = rawContext.learner?.level || rawContext.startingLevel;
  if (typeof rawLevel === 'string') {
    const sanitizedLevel = sanitizeString(rawLevel, 30);
    if (VALID_LEVELS.includes(sanitizedLevel)) {
      learner = { level: sanitizedLevel };
    }
  }

  // Query validation
  const query = sanitizeString(rawContext.query, 150);
  function sanitizeCode(val, maxLength = 12000) {
  if (typeof val !== 'string') return null;

  const cleaned = val
    .replace(/\x00/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  return cleaned.slice(0, maxLength) || null;
}
  // Circuit simulator backwards compatibility
  const circuit = {
    numQubits: typeof rawContext.numQubits === 'number' ? rawContext.numQubits : null,
    gates: Array.isArray(rawContext.gates) ? rawContext.gates.slice(0, 50) : [],
    layers: Array.isArray(rawContext.layers) ? rawContext.layers.slice(0, 30) : [],
    probabilities: rawContext.probabilities && typeof rawContext.probabilities === 'object' ? rawContext.probabilities : {},
    stateVector: Array.isArray(rawContext.stateVector) ? rawContext.stateVector.slice(0, 16) : null,
    code: sanitizeCode(rawContext.code, 12000),
  };

  return {
    source,
    topic,
    resource,
    knowledgeMap,
    learner,
    query,
    circuit,
    challengeMode: Boolean(rawContext.challengeMode),
    challenge: rawContext.challenge && typeof rawContext.challenge === 'object' ? {
      id: sanitizeString(rawContext.challenge.id, 80),
      title: sanitizeString(rawContext.challenge.title, 120),
      description: sanitizeString(rawContext.challenge.description, 300),
      targetState: sanitizeString(rawContext.challenge.targetState, 80),
      numQubits: typeof rawContext.challenge.numQubits === 'number' ? rawContext.challenge.numQubits : null,
    } : null
  };
}

/**
 * Formats validated context into a compact, token-efficient text block for AI prompts.
 */
function formatContextForPrompt(ctx) {
  if (!ctx) return 'Platform Location: Dashboard / General Tutor (No specific module context active)';

  const lines = [];

  // Source & Location
  lines.push(`Platform Location: ${ctx.source || 'dashboard'}`);

  // Topic
  if (ctx.topic) {
    lines.push(`Current Topic: ${ctx.topic.title || ctx.topic.topicId}${ctx.topic.category ? ` (Category: ${ctx.topic.category})` : ''}`);
    if (ctx.topic.description) {
      lines.push(`Topic Overview: ${ctx.topic.description}`);
    }
  } else if (ctx.query) {
    lines.push(`Search Query: "${ctx.query}"`);
  } else {
    lines.push('Active Topic: None (General quantum learning session)');
  }

  // Resource Grounding (Platform Truthfulness)
  if (ctx.resource) {
    lines.push(`Platform Resource: ${ctx.resource.type} — "${ctx.resource.title || ctx.resource.id}" (ID: ${ctx.resource.id})`);
    lines.push('Note: This is an existing, verified learning resource in Quantiva.');
  } else if (ctx.topic) {
    lines.push('Platform Resource: None (Concept-Only Topic in Knowledge Map).');
    lines.push('CRITICAL PLATFORM TRUTHFULNESS RULE: Quantiva does NOT currently have a dedicated interactive Micro Module for this topic. Do NOT claim a module or lesson exists in Quantiva for this concept.');
  }

  // Learner Level
  if (ctx.learner?.level) {
    lines.push(`Learner Starting Level: ${ctx.learner.level}`);
    if (ctx.learner.level === 'completely_new' || ctx.learner.level === 'beginner') {
      lines.push('Pedagogy Note: Beginner level — prioritize intuitive mental models, visual analogies, and clear plain-English definitions with minimal heavy notation.');
    } else if (ctx.learner.level === 'knows_basics' || ctx.learner.level === 'intermediate') {
      lines.push('Pedagogy Note: Intermediate level — balance intuition with mathematical formalism, state vectors, circuit gates, and interference.');
    } else if (ctx.learner.level === 'advanced') {
      lines.push('Pedagogy Note: Advanced level — include formal mathematical definitions, unitary operators, state evolution, and algorithmic nuances.');
    }
  }

  // Knowledge Map Relationships
  if (ctx.knowledgeMap) {
    const km = ctx.knowledgeMap;
    const parts = [];
    if (km.foundations?.length) {
      parts.push(`Foundations (prerequisites/building blocks): ${km.foundations.map(f => f.title || f.topicId).join(', ')}`);
    }
    if (km.components?.length) {
      parts.push(`Components (internal mechanisms): ${km.components.map(c => c.title || c.topicId).join(', ')}`);
    }
    if (km.related?.length) {
      parts.push(`Related Concepts: ${km.related.map(r => r.title || r.topicId).join(', ')}`);
    }
    if (km.extensions?.length) {
      parts.push(`Extensions (next steps): ${km.extensions.map(e => e.title || e.topicId).join(', ')}`);
    }
    if (parts.length) {
      lines.push('Curated Knowledge Map Relationships in Quantiva:');
      parts.forEach(p => lines.push(`  * ${p}`));
      lines.push('CRITICAL KNOWLEDGE MAP RULE: You may reference these connections to explain how concepts fit together. Do NOT invent new relationships and claim they are official Quantiva curriculum relationships.');
    }
  }

  // Sandbox Code
  if (ctx.source === 'sandbox' && ctx.circuit?.code) {
  lines.push('Active Sandbox Code:');
  lines.push(
    "  The following is the learner's current Sandbox code. Treat it as authoritative input for code review."
  );
  lines.push('  <SANDBOX_CODE>');
  lines.push(ctx.circuit.code);
  lines.push('  </SANDBOX_CODE>');
}

  // Circuit context if present
  // Circuit context if present
if (ctx.circuit && (ctx.circuit.numQubits || ctx.circuit.gates?.length)) {
  lines.push('Active Circuit State:');

  if (ctx.circuit.numQubits) {
    lines.push(`  * Qubits: ${ctx.circuit.numQubits}`);
  }

  if (ctx.circuit.gates?.length) {
    lines.push(
      `  * Gates: ${JSON.stringify(
        ctx.circuit.gates.map(g => g.name || g.gate || g)
      )}`
    );
  }

  if (
    ctx.circuit.probabilities &&
    Object.keys(ctx.circuit.probabilities).length
  ) {
    lines.push(
      `  * Measurement Probabilities: ${JSON.stringify(
        ctx.circuit.probabilities
      )}`
    );
  }
}

// Sandbox code context
if (ctx.source === 'sandbox' && ctx.circuit?.code) {
  lines.push('Active Sandbox Code:');
  lines.push('  The following is the learner\'s current Sandbox code. Treat it as authoritative input for code review.');
  lines.push('  <SANDBOX_CODE>');
  lines.push(ctx.circuit.code);
  lines.push('  </SANDBOX_CODE>');
}

  return lines.join('\n');
}

module.exports = {
  VALID_SOURCES,
  VALID_RESOURCE_TYPES,
  VALID_LEVELS,
  validateAndNormalizeContext,
  formatContextForPrompt,
};
