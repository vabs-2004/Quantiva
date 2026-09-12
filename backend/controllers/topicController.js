const topicService = require("../services/topicService");

async function getAllTopics(req, res) {
  try {
    const topics = await topicService.getAllTopics();
    res.json({ success: true, count: topics.length, topics });
  } catch (error) {
    console.error("Error fetching topics:", error);
    res.status(500).json({ error: "Failed to fetch topics." });
  }
}

async function getTopicById(req, res) {
  try {
    const { topicId } = req.params;
    const userId = req.user ? (req.user.id || req.user._id) : null;

    const topic = await topicService.getTopicById(topicId, userId);
    if (!topic) {
      return res.status(404).json({ error: "Topic not found." });
    }

    res.json({ success: true, topic });
  } catch (error) {
    console.error("Error fetching topic details:", error);
    res.status(500).json({ error: "Failed to fetch topic details." });
  }
}

async function getTopicByResource(req, res) {
  try {
    const { resourceType, resourceId } = req.params;
    const userId = req.user ? (req.user.id || req.user._id) : null;

    const topic = await topicService.getTopicByResource(resourceType, resourceId, userId);
    if (!topic) {
      return res.status(404).json({ error: "No topic mapped to this resource." });
    }

    res.json({ success: true, topic });
  } catch (error) {
    console.error("Error fetching topic by resource:", error);
    res.status(500).json({ error: "Failed to fetch topic by resource." });
  }
}

module.exports = {
  getAllTopics,
  getTopicById,
  getTopicByResource,
};
