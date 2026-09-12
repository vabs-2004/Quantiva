const MicroModule = require("../models/MicroModule");
const Algorithm = require("../models/Algorithm");
const Course = require("../models/Course");
const Doc = require("../models/Doc");

/**
 * Authoritative static alias and keyword registry for Quantiva learning resources.
 * Future content can define its own aliases directly on the models.
 */
const RESOURCE_ALIASES = {
  // Algorithms
  "grover-search": {
    aliases: ["grover", "grovers algorithm", "amplitude amplification", "quantum search"],
    keywords: ["search", "oracle", "database", "speedup", "unstructured search", "diffuser"],
  },
  "deutsch": {
    aliases: ["deutsch", "deutsch algorithm", "constant or balanced"],
    keywords: ["oracle", "balanced", "constant", "quantum advantage", "boolean function"],
  },
  "deutsch-jozsa": {
    aliases: ["deutsch jozsa", "deutsch jozsa algorithm", "dj algorithm"],
    keywords: ["oracle", "n-qubit", "balanced", "constant", "quantum parallelism"],
  },
  "quantum-teleportation": {
    aliases: ["teleportation", "quantum teleportation", "state teleportation", "epr teleportation"],
    keywords: ["entanglement", "bell pair", "bell state", "classical channel", "no-cloning"],
  },
  "qft": {
    aliases: ["qft", "quantum fourier transform", "discrete fourier transform"],
    keywords: ["fourier", "phase", "period finding", "frequency", "unitary transform"],
  },
  "shor": {
    aliases: ["shor", "shors algorithm", "factoring", "integer factorization"],
    keywords: ["cryptography", "rsa", "order finding", "period finding", "qft"],
  },
  "simon": {
    aliases: ["simon", "simons algorithm", "periodicity"],
    keywords: ["oracle", "xor", "exponential speedup", "hidden subgroup"],
  },
  "bernstein-vazirani": {
    aliases: ["bernstein vazirani", "bv algorithm", "parity"],
    keywords: ["hidden string", "inner product", "oracle", "single query"],
  },
  "quantum-phase-estimation": {
    aliases: ["qpe", "phase estimation", "quantum phase estimation", "eigenvalue estimation"],
    keywords: ["eigenvalues", "unitary", "qft", "precision", "phase"],
  },
  "superdense-coding": {
    aliases: ["superdense coding", "dense coding", "quantum dense coding"],
    keywords: ["entanglement", "bell state", "two bits one qubit", "communication"],
  },
  "vqe": {
    aliases: ["vqe", "variational quantum eigensolver", "variational eigensolver"],
    keywords: ["variational", "ansatz", "hamiltonian", "ground state", "hybrid", "chemistry"],
  },
  "bb84": {
    aliases: ["bb84", "bb84 protocol", "quantum key distribution", "qkd"],
    keywords: ["cryptography", "key distribution", "eavesdropping", "bases", "polarization"],
  },

  // Foundations Micro Modules
  "why-quantum": {
    aliases: ["why quantum", "intro to quantum", "limits of classical"],
    keywords: ["computation", "classical limits", "moore's law", "information processing"],
  },
  "mathematical-foundations": {
    aliases: ["math foundations", "linear algebra", "quantum math"],
    keywords: ["vectors", "matrices", "inner product", "complex numbers", "hilbert space"],
  },
  "qubits-quantum-states": {
    aliases: ["qubits", "quantum states", "qubit", "state vector"],
    keywords: ["computational basis", "ket 0", "ket 1", "two-level system"],
  },
  "dirac-notation": {
    aliases: ["dirac notation", "bra ket", "braket", "bra-ket notation"],
    keywords: ["bra", "ket", "bracket", "inner product", "outer product", "projection"],
  },
  "amplitudes-phase": {
    aliases: ["amplitudes and phase", "probability amplitudes", "relative phase"],
    keywords: ["probability", "global phase", "interference", "constructive", "destructive"],
  },
  "bloch-sphere": {
    aliases: ["bloch sphere", "bloch", "sphere visualization"],
    keywords: ["unit sphere", "theta", "phi", "geometric visualization", "angles"],
  },
  "quantum-gates": {
    aliases: ["quantum gates", "gates", "h gate", "hadamard", "hadamard gate", "pauli gates"],
    keywords: ["unitary", "pauli x", "pauli y", "pauli z", "hadamard", "phase gate", "cnot"],
  },
  "quantum-circuits": {
    aliases: ["quantum circuits", "circuits", "circuit composition"],
    keywords: ["wires", "gate scheduling", "depth", "qubit lines", "temporal"],
  },
  "superposition": {
    aliases: ["superposition", "quantum superposition", "linear combination"],
    keywords: ["hadamard", "linear combination", "basis states", "simultaneous states"],
  },
  "measurement-collapse": {
    aliases: ["measurement and collapse", "measurement", "state collapse", "born rule"],
    keywords: ["born rule", "projection", "collapse", "observation", "probabilities"],
  },
  "entanglement": {
    aliases: ["entanglement", "quantum entanglement", "epr paradox"],
    keywords: ["non-separable", "bipartite", "spooky action", "nonlocal", "correlations"],
  },
  "bell-states": {
    aliases: ["bell states", "bell pairs", "maximally entangled"],
    keywords: ["phi plus", "phi minus", "psi plus", "psi minus", "two-qubit", "entangled pair"],
  },
};

// Common English and domain stop words to prevent noise in token matching
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "in", "of", "to", "for", "with", "on", "at",
  "from", "by", "about", "as", "into", "like", "through", "after", "over",
  "between", "out", "against", "during", "without", "before", "under", "around",
  "among", "is", "it", "this", "that"
]);

/**
 * Normalizes text for case-insensitive, whitespace-trimmed, punctuation-clean comparison.
 */
function normalizeText(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Tokenizes a string into distinct meaningful alphanumeric words.
 */
function tokenize(text) {
  const norm = normalizeText(text);
  if (!norm) return [];
  return norm.split(" ").filter((t) => t.length > 0);
}

/**
 * Runtime Content Registry Service
 * Aggregates existing authoritative models on demand without database duplication.
 */
class ContentRegistryService {
  async getNormalizedResources(user = null) {
    const [microModules, algorithms, courses, docs] = await Promise.all([
      MicroModule.find({}).lean(),
      Algorithm.find({}).lean(),
      Course.find({}).lean(),
      Doc.find({}).lean(),
    ]);

    const normalized = [];

    // 1. Micro Modules
    for (const m of microModules) {
      const aliasData = RESOURCE_ALIASES[m.moduleId] || { aliases: [], keywords: [] };
      normalized.push({
        id: m.moduleId,
        type: "micro_module",
        title: m.title,
        description: m.description || "",
        category: "Foundations",
        track: m.track || "foundations",
        sequenceOrder: m.sequenceOrder,
        level: undefined,
        estimatedMinutes: undefined,
        aliases: aliasData.aliases,
        keywords: aliasData.keywords,
        route: `/micro-modules/${m.moduleId}`,
        visibility: m.type === "personalized" ? "private" : "public",
        status: m.status || "published",
        owner: m.owner ? String(m.owner) : null,
        metadata: {
          type: m.type,
          sequenceOrder: m.sequenceOrder,
          track: m.track,
        },
      });
    }

    // 2. Algorithms
    for (const a of algorithms) {
      const aliasData = RESOURCE_ALIASES[a.id] || { aliases: [], keywords: [] };
      normalized.push({
        id: a.id,
        type: "algorithm",
        title: a.name,
        description: a.shortDescription || a.description || "",
        category: a.category || "Algorithm",
        track: undefined,
        level: undefined,
        estimatedMinutes: undefined,
        aliases: aliasData.aliases,
        keywords: aliasData.keywords,
        route: `/algorithm/${a.id}`,
        visibility: "public",
        status: "published",
        owner: null,
        metadata: {
          timeComplexity: a.timeComplexity,
          spaceComplexity: a.spaceComplexity,
          formula: a.formula,
          parametersCount: a.parameters?.length || 0,
        },
      });
    }

    // 3. Courses
    for (const c of courses) {
      const idStr = String(c._id);
      const aliasData = RESOURCE_ALIASES[idStr] || { aliases: [], keywords: [] };
      normalized.push({
        id: idStr,
        type: "course",
        title: c.title,
        description: c.description || "",
        category: "Course",
        track: undefined,
        level: undefined,
        estimatedMinutes: undefined,
        aliases: aliasData.aliases,
        keywords: aliasData.keywords,
        route: `/courses/${idStr}`,
        visibility: "public",
        status: "published",
        owner: null,
        metadata: {
          instructor: c.instructor,
          lecturesCount: c.lectures?.length || 0,
          thumbnail: c.thumbnail,
        },
      });
    }

    // 4. Docs (Reference content)
    for (const d of docs) {
      const idStr = String(d._id);
      normalized.push({
        id: idStr,
        type: "doc",
        title: d.title,
        description: d.content ? d.content.substring(0, 160).replace(/\n/g, " ") : "",
        category: d.section || "Documentation",
        track: undefined,
        level: undefined,
        estimatedMinutes: undefined,
        aliases: [],
        keywords: [d.section, d.subsection].filter(Boolean),
        route: `/docs`,
        visibility: "public",
        status: "published",
        owner: null,
        contentBody: d.content || "",
        metadata: {
          section: d.section,
          subsection: d.subsection,
        },
      });
    }

    const userId = user && (user.id || user._id) ? String(user.id || user._id) : null;

    return normalized.filter((item) => {
      // 1. Never show non-published
      if (item.status !== "published") return false;
      // 2. Public items visible to all
      if (item.visibility === "public") return true;
      // 3. Private items strictly isolated to owner
      if (item.visibility === "private") {
        return Boolean(userId && item.owner === userId);
      }
      return false;
    });
  }

  calculateScore(item, queryNorm, queryTokens) {
    if (!queryNorm) return { score: 0, matchReason: null };

    const titleNorm = normalizeText(item.title);
    const descNorm = normalizeText(item.description);
    const bodyNorm = item.contentBody ? normalizeText(item.contentBody) : "";

    let score = 0;
    let matchReasons = [];

    // 1. Exact Title Match (100)
    if (titleNorm === queryNorm) {
      score = Math.max(score, 100);
      matchReasons.push("exact_title");
    }
    // 2. Title Starts With (75)
    else if (titleNorm.startsWith(queryNorm)) {
      score = Math.max(score, 75);
      matchReasons.push("title_starts_with");
    }

    // 3. Exact Alias Match (70)
    for (const alias of item.aliases) {
      const aliasNorm = normalizeText(alias);
      if (aliasNorm === queryNorm) {
        score = Math.max(score, 70);
        matchReasons.push("exact_alias");
        break;
      }
    }

    // Meaningful query tokens
    const meaningfulTokens = queryTokens.filter((qt) => !STOP_WORDS.has(qt));
    const tokensToUse = meaningfulTokens.length > 0 ? meaningfulTokens : queryTokens;

    // 4. Exact Keyword Match (30)
    for (const kw of item.keywords) {
      const kwNorm = normalizeText(kw);
      if (kwNorm === queryNorm) {
        score = Math.max(score, 30);
        matchReasons.push("exact_keyword");
        break;
      }
    }

    // 5. Title Token Match (50)
    const titleTokens = tokenize(item.title);
    const matchedTitleTokens = tokensToUse.filter((qt) => titleTokens.includes(qt));
    if (matchedTitleTokens.length > 0) {
      const fraction = matchedTitleTokens.length / tokensToUse.length;
      // For multi-word queries, require matching at least half the tokens or at least 2 tokens
      if (tokensToUse.length === 1 || fraction >= 0.5) {
        const tokenScore = Math.round(50 * fraction);
        if (tokenScore > score) {
          score = Math.max(score, tokenScore);
          matchReasons.push("title_token");
        }
      }
    }

    // 6. Alias Token Match (40)
    for (const alias of item.aliases) {
      const aliasTokens = tokenize(alias);
      const matchedAliasTokens = tokensToUse.filter((qt) => aliasTokens.includes(qt));
      if (matchedAliasTokens.length > 0) {
        const fraction = matchedAliasTokens.length / tokensToUse.length;
        if (tokensToUse.length === 1 || fraction >= 0.5) {
          const aliasScore = Math.round(40 * fraction);
          if (aliasScore > score) {
            score = Math.max(score, aliasScore);
            matchReasons.push("alias_token");
          }
        }
      }
    }

    // 7. Keyword Token Match (25)
    for (const kw of item.keywords) {
      const kwNorm = normalizeText(kw);
      if (tokensToUse.some((qt) => kwNorm === qt)) {
        if (25 > score) {
          score = Math.max(score, 25);
          matchReasons.push("keyword_token");
        }
        break;
      }
    }

    // 8. Description Full Phrase Match (15)
    if (descNorm.includes(queryNorm)) {
      if (15 > score) {
        score = Math.max(score, 15);
        matchReasons.push("description_phrase");
      }
    }

    // 9. Full Query Substring in Body (5) - require full query phrase match
    if (queryNorm.length >= 4 && bodyNorm && bodyNorm.includes(queryNorm)) {
      if (5 > score) {
        score = Math.max(score, 5);
        matchReasons.push("content_body");
      }
    }

    return { score, matchReason: matchReasons[0] || null };
  }

  async search({ q = "", category = "all", user = null, limit = 50, offset = 0 } = {}) {
    const resources = await this.getNormalizedResources(user);

    const queryNorm = normalizeText(q);
    const queryTokens = tokenize(q);

    const facets = {
      all: 0,
      micro_modules: 0,
      algorithms: 0,
      courses: 0,
      docs: 0,
    };

    let scoredItems = [];

    if (!queryNorm) {
      scoredItems = resources.map((item) => ({
        ...item,
        score: 1,
        matchReason: "default_listing",
      }));
    } else {
      for (const item of resources) {
        const { score, matchReason } = this.calculateScore(item, queryNorm, queryTokens);
        if (score > 0) {
          scoredItems.push({
            ...item,
            score,
            matchReason,
          });
        }
      }
    }

    for (const item of scoredItems) {
      facets.all++;
      if (item.type === "micro_module") facets.micro_modules++;
      else if (item.type === "algorithm") facets.algorithms++;
      else if (item.type === "course") facets.courses++;
      else if (item.type === "doc") facets.docs++;
    }

    let filtered = scoredItems;
    if (category && category !== "all") {
      filtered = scoredItems.filter((item) => {
        if (category === "micro_modules" || category === "micro_module") {
          return item.type === "micro_module";
        }
        if (category === "algorithms" || category === "algorithm") {
          return item.type === "algorithm";
        }
        if (category === "courses" || category === "course") {
          return item.type === "course";
        }
        if (category === "docs" || category === "doc") {
          return item.type === "doc";
        }
        return true;
      });
    }

    const typePriority = { micro_module: 1, algorithm: 2, course: 3, doc: 4 };

    filtered.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      const pA = typePriority[a.type] || 99;
      const pB = typePriority[b.type] || 99;
      if (pA !== pB) {
        return pA - pB;
      }
      if (a.sequenceOrder !== undefined && b.sequenceOrder !== undefined) {
        return a.sequenceOrder - b.sequenceOrder;
      }
      return a.title.localeCompare(b.title);
    });

    // Exact Match Semantics (title == query, canonical ID == query, registered alias == query)
    const isExactCuratedMatch = (item) => {
      if (!queryNorm) return false;
      if (normalizeText(item.title) === queryNorm) return true;
      if (normalizeText(item.id) === queryNorm) return true;
      if (Array.isArray(item.aliases) && item.aliases.some((a) => normalizeText(a) === queryNorm)) {
        return true;
      }
      return false;
    };

    let exactMatches = [];
    let relatedMatches = [];

    if (queryNorm) {
      exactMatches = filtered.filter((item) => isExactCuratedMatch(item));
      relatedMatches = filtered.filter((item) => !isExactCuratedMatch(item));
    } else {
      relatedMatches = filtered;
    }

    // Exact curated matches always rank first in combined results
    const combinedFiltered = queryNorm ? [...exactMatches, ...relatedMatches] : filtered;
    const total = combinedFiltered.length;
    const paginated = combinedFiltered.slice(offset, offset + limit);

    const sanitizedResults = paginated.map(({ contentBody, ...rest }) => rest);
    const sanitizedExact = exactMatches.map(({ contentBody, ...rest }) => rest);
    const sanitizedRelated = relatedMatches.map(({ contentBody, ...rest }) => rest);

    return {
      success: true,
      query: q,
      total,
      facets,
      results: sanitizedResults,
      exact: sanitizedExact,
      exactMatch: sanitizedExact.length > 0 ? sanitizedExact[0] : null,
      related: sanitizedRelated,
    };
  }

  async getExploreLanding(user = null) {
    const resources = await this.getNormalizedResources(user);

    const foundations = resources
      .filter((r) => r.type === "micro_module" && r.track === "foundations")
      .sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0))
      .slice(0, 4);

    const coreAlgoIds = ["grover-search", "quantum-teleportation", "qft", "deutsch-jozsa"];
    const algorithms = resources
      .filter((r) => r.type === "algorithm" && coreAlgoIds.includes(r.id))
      .sort((a, b) => coreAlgoIds.indexOf(a.id) - coreAlgoIds.indexOf(b.id));

    // Curated Video Courses
    const courses = resources
      .filter((r) => r.type === "course")
      .sort((a, b) => (b.metadata?.lecturesCount || 0) - (a.metadata?.lecturesCount || 0))
      .slice(0, 3);

    const topics = [
      "Superposition",
      "Entanglement",
      "Bloch Sphere",
      "Hadamard Gate",
      "Quantum Phase Estimation",
      "Amplitude Amplification",
      "Bell States",
      "Quantum Fourier Transform",
      "Measurement & Collapse",
    ];

    return {
      success: true,
      foundations,
      algorithms,
      courses,
      topics,
    };
  }
}

module.exports = new ContentRegistryService();
