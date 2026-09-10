const EducationalContent = require("../models/EducationalContent");

/**
 * GET /api/educational/:algorithmId
 * Returns educational content for a specific algorithm.
 */
async function getEducationalContent(req, res) {
  try {
    const content = await EducationalContent.findOne({
      algorithmId: req.params.algorithmId,
    });

    if (!content) {
      return res.json({
        algorithmId: req.params.algorithmId,
        description: "<p>Content not available yet for this algorithm.</p>",
        problemDescription: "",
        algorithm: "",
        geometricProof: "",
        algebraicProof: "",
        code: "",
        applications: [],
        limitations: [],
      });
    }

    res.json(content);
  } catch (error) {
    console.error("Error fetching educational content:", error);
    res.status(500).json({ error: "Failed to fetch educational content." });
  }
}

/**
 * PUT /api/educational/:algorithmId
 * Updates educational content for a specific algorithm (admin only).
 */
async function updateEducationalContent(req, res) {
  try {
    const { algorithmId } = req.params;
    const updateData = req.body;

    const content = await EducationalContent.findOneAndUpdate(
      { algorithmId },
      { ...updateData, algorithmId },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(content);
  } catch (error) {
    console.error("Error updating educational content:", error);
    res.status(500).json({ error: "Failed to update educational content." });
  }
}

module.exports = { getEducationalContent, updateEducationalContent };
