const { KNOWLEDGE_MAP_TOPICS } = require("../data/knowledgeMapData");
const UserProgress = require("../models/UserProgress");

// Map of canonical topics for quick O(1) lookup
const TOPIC_INDEX = new Map();
KNOWLEDGE_MAP_TOPICS.forEach((topic) => {
  TOPIC_INDEX.set(topic.topicId, topic);
});

// Build reverse lookup for incoming relationships
const INCOMING_RELATIONSHIPS = new Map();
KNOWLEDGE_MAP_TOPICS.forEach((topic) => {
  (topic.relationships || []).forEach((rel) => {
    if (!INCOMING_RELATIONSHIPS.has(rel.target)) {
      INCOMING_RELATIONSHIPS.set(rel.target, []);
    }
    INCOMING_RELATIONSHIPS.get(rel.target).push({
      sourceTopicId: topic.topicId,
      type: rel.type,
    });
  });
});

/**
 * Returns progress status for a resource-backed topic for a given user.
 * Strictly returns null for concept-only topics (no fake progress!).
 */
function resolveTopicProgress(topic, userProgressDoc) {
  if (!topic || !topic.resource || !userProgressDoc) return null;

  const res = topic.resource;
  if (res.type === "micro_module") {
    const list = userProgressDoc.microModuleProgress || [];
    const item = list.find((m) => m.moduleId === res.id);
    return item ? item.status : "not_started";
  }

  if (res.type === "algorithm") {
    const list = userProgressDoc.algorithmRuns || [];
    const item = list.find((a) => a.algorithmId === res.id);
    return item && item.count > 0 ? "completed" : "not_started";
  }

  if (res.type === "course") {
    const list = userProgressDoc.courseProgress || [];
    const item = list.find((c) => String(c.course) === String(res.id));
    if (item) {
      return item.completed ? "completed" : "in_progress";
    }
    return "not_started";
  }

  if (res.type === "tool") {
    // Platform tools have no completion state; return null
    return null;
  }

  return null;
}

class TopicService {
  /**
   * Returns list of all curated topics with summary metadata.
   */
  async getAllTopics() {
    return KNOWLEDGE_MAP_TOPICS.map((t) => ({
      topicId: t.topicId,
      title: t.title,
      description: t.description,
      category: t.category,
      isResourceBacked: Boolean(t.resource),
      resourceType: t.resource ? t.resource.type : null,
      route: t.resource ? t.resource.route : null,
      relationshipCount: (t.relationships || []).length,
    }));
  }

  /**
   * Retrieves topic details, grouped relationships, and user progress overlay.
   */
  async getTopicById(topicId, userId = null) {
    const topic = TOPIC_INDEX.get(topicId);
    if (!topic) return null;

    let userProgressDoc = null;
    if (userId) {
      userProgressDoc = await UserProgress.findOne({ user: userId }).lean();
    }

    // Group outgoing relationships
    const grouped = {
      foundations: [],
      components: [],
      related: [],
      extensions: [],
    };

    const groupKeyMap = {
      foundation: "foundations",
      component: "components",
      related: "related",
      extension: "extensions",
    };

    (topic.relationships || []).forEach((rel) => {
      const targetTopic = TOPIC_INDEX.get(rel.target);
      if (targetTopic) {
        const targetProgress = resolveTopicProgress(targetTopic, userProgressDoc);
        const groupKey = groupKeyMap[rel.type] || "related";
        grouped[groupKey].push({
          topicId: targetTopic.topicId,
          title: targetTopic.title,
          description: targetTopic.description,
          category: targetTopic.category,
          relationshipType: rel.type,
          resource: targetTopic.resource,
          progress: targetProgress,
        });
      }
    });

    // Default connections (top 3–6 high-value connections preserved deterministically)
    // Preference: 2 foundations, 2 components/related, 1-2 extensions
    const defaultConnections = [];
    const maxDefault = 6;
    
    // Add up to 2 foundations
    grouped.foundations.slice(0, 2).forEach((c) => defaultConnections.push(c));
    // Add up to 2 components
    grouped.components.slice(0, 2).forEach((c) => defaultConnections.push(c));
    // Add up to 1 related
    if (defaultConnections.length < maxDefault && grouped.related.length > 0) {
      defaultConnections.push(grouped.related[0]);
    }
    // Add up to 1 extension
    if (defaultConnections.length < maxDefault && grouped.extensions.length > 0) {
      defaultConnections.push(grouped.extensions[0]);
    }
    // If still under 4, fill from remaining
    const remaining = [
      ...grouped.foundations.slice(2),
      ...grouped.components.slice(2),
      ...grouped.related.slice(1),
      ...grouped.extensions.slice(1),
    ];
    for (const item of remaining) {
      if (defaultConnections.length >= maxDefault) break;
      if (!defaultConnections.some((d) => d.topicId === item.topicId)) {
        defaultConnections.push(item);
      }
    }

    // Incoming relationships (topics that connect to this one)
    const rawIncoming = INCOMING_RELATIONSHIPS.get(topicId) || [];
    const incomingConnections = rawIncoming
      .map((inc) => {
        const src = TOPIC_INDEX.get(inc.sourceTopicId);
        if (!src) return null;
        return {
          topicId: src.topicId,
          title: src.title,
          category: src.category,
          relationshipType: inc.type,
          resource: src.resource,
          progress: resolveTopicProgress(src, userProgressDoc),
        };
      })
      .filter(Boolean);

    return {
      topicId: topic.topicId,
      title: topic.title,
      description: topic.description,
      category: topic.category,
      resource: topic.resource,
      progress: resolveTopicProgress(topic, userProgressDoc),
      defaultConnections,
      relationships: grouped,
      totalRelationships: (topic.relationships || []).length,
      incomingConnections,
    };
  }

  /**
   * Finds a topic by backing resource type and ID (e.g. micro_module + "why-quantum").
   */
  async getTopicByResource(resourceType, resourceId, userId = null) {
    const normType = resourceType === "micro-module" || resourceType === "micro_module"
      ? "micro_module"
      : resourceType;

    const topic = KNOWLEDGE_MAP_TOPICS.find((t) => {
      if (!t.resource) return false;
      return t.resource.type === normType && t.resource.id === resourceId;
    });

    if (!topic) return null;
    return this.getTopicById(topic.topicId, userId);
  }
}

module.exports = new TopicService();
