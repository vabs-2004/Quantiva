/**
 * Timeline Storage Service
 *
 * Ephemeral, server-side in-memory store for verified quantum circuit timelines.
 * Acts as the authoritative bearer-capability boundary:
 * - Each timeline evaluation is stored under an unguessable UUIDv4 timelineId.
 * - Enforces sliding TTL (20 minutes) and LRU capacity pruning (max 500 timelines).
 * - Guarantees that Stage 5 AI explanations retrieve verified Stage 4 facts exclusively
 *   from server memory, completely ignoring any client-submitted quantum state data.
 */

const crypto = require("crypto");

const TTL_MS = 20 * 60 * 1000; // 20 minutes sliding TTL
const MAX_ENTRIES = 500;

// Internal storage map: timelineId -> { timeline, lastAccessedAt }
const store = new Map();

/**
 * Prunes expired entries and enforces max capacity.
 */
function prune() {
  const now = Date.now();

  // 1. Remove expired
  for (const [id, entry] of store.entries()) {
    if (now - entry.lastAccessedAt > TTL_MS) {
      store.delete(id);
    }
  }

  // 2. Enforce max capacity (LRU order in Map)
  if (store.size > MAX_ENTRIES) {
    const excess = store.size - MAX_ENTRIES;
    const keys = store.keys();
    for (let i = 0; i < excess; i++) {
      const oldestKey = keys.next().value;
      if (oldestKey) {
        store.delete(oldestKey);
      }
    }
  }
}

/**
 * Saves a verified timeline result under a new unguessable UUIDv4 timelineId.
 * @param {Object} timelineResult - Authoritative timeline from evaluateTimeline
 * @param {string} [customId] - Optional custom UUID (defaults to crypto.randomUUID())
 * @returns {string} timelineId
 */
function saveTimeline(timelineResult, customId = null) {
  prune();

  const timelineId = customId || crypto.randomUUID();
  store.set(timelineId, {
    timeline: timelineResult,
    lastAccessedAt: Date.now(),
  });

  return timelineId;
}

/**
 * Retrieves a verified timeline by timelineId, updating its sliding TTL.
 * @param {string} timelineId
 * @returns {Object|null} The verified timeline or null if not found/expired
 */
function getTimeline(timelineId) {
  if (!timelineId || typeof timelineId !== "string") {
    return null;
  }

  const entry = store.get(timelineId);
  if (!entry) {
    return null;
  }

  const now = Date.now();
  if (now - entry.lastAccessedAt > TTL_MS) {
    store.delete(timelineId);
    return null;
  }

  // Slide access timestamp
  entry.lastAccessedAt = now;
  // Re-insert to maintain LRU freshness order
  store.delete(timelineId);
  store.set(timelineId, entry);

  return entry.timeline;
}

// Internal storage map for noisy timelines: noisyTimelineId -> { noisyTimeline, lastAccessedAt }
const noisyStore = new Map();

/**
 * Prunes expired noisy entries and enforces max capacity.
 */
function pruneNoisy() {
  const now = Date.now();
  for (const [id, entry] of noisyStore.entries()) {
    if (now - entry.lastAccessedAt > TTL_MS) {
      noisyStore.delete(id);
    }
  }
  if (noisyStore.size > MAX_ENTRIES) {
    const excess = noisyStore.size - MAX_ENTRIES;
    const keys = noisyStore.keys();
    for (let i = 0; i < excess; i++) {
      const oldestKey = keys.next().value;
      if (oldestKey) {
        noisyStore.delete(oldestKey);
      }
    }
  }
}

/**
 * Saves a verified noisy timeline result under a new unguessable UUIDv4 noisyTimelineId.
 * @param {Object} noisyTimelineResult - Authoritative noisy timeline from evaluateNoisyTimeline
 * @param {string} [customId] - Optional custom UUID
 * @returns {string} noisyTimelineId
 */
function saveNoisyTimeline(noisyTimelineResult, customId = null) {
  pruneNoisy();

  const noisyTimelineId = customId || crypto.randomUUID();
  noisyStore.set(noisyTimelineId, {
    noisyTimeline: noisyTimelineResult,
    lastAccessedAt: Date.now(),
  });

  return noisyTimelineId;
}

/**
 * Retrieves a verified noisy timeline by noisyTimelineId, updating sliding TTL.
 * @param {string} noisyTimelineId
 * @returns {Object|null}
 */
function getNoisyTimeline(noisyTimelineId) {
  if (!noisyTimelineId || typeof noisyTimelineId !== "string") {
    return null;
  }

  const entry = noisyStore.get(noisyTimelineId);
  if (!entry) {
    return null;
  }

  const now = Date.now();
  if (now - entry.lastAccessedAt > TTL_MS) {
    noisyStore.delete(noisyTimelineId);
    return null;
  }

  entry.lastAccessedAt = now;
  noisyStore.delete(noisyTimelineId);
  noisyStore.set(noisyTimelineId, entry);

  return entry.noisyTimeline;
}

/**
 * Returns current store statistics (useful for telemetry and testing).
 */
function getStorageStats() {
  return {
    activeTimelines: store.size,
    activeNoisyTimelines: noisyStore.size,
    maxCapacity: MAX_ENTRIES,
    ttlMs: TTL_MS,
  };
}

/**
 * Clears the store (used in tests).
 */
function clearStorage() {
  store.clear();
  noisyStore.clear();
}

module.exports = {
  saveTimeline,
  getTimeline,
  saveNoisyTimeline,
  getNoisyTimeline,
  getStorageStats,
  clearStorage,
};

