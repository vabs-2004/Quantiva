const MicroModule = require("../models/MicroModule");

/**
 * GET /api/micro-modules
 * Returns all published micro-modules sorted by track and sequenceOrder.
 */
async function getAllMicroModules(req, res) {
  try {
    const { track = "foundations" } = req.query;
    const modules = await MicroModule.find({ track, status: "published" })
      .sort({ sequenceOrder: 1 })
      .select("-__v");
    res.json(modules);
  } catch (error) {
    console.error("Error fetching micro-modules:", error);
    res.status(500).json({ error: "Failed to fetch micro-modules" });
  }
}

/**
 * GET /api/micro-modules/:id
 * Returns a single micro-module by its stable moduleId or _id.
 */
async function getMicroModuleById(req, res) {
  try {
    const { id } = req.params;
    const moduleItem = await MicroModule.findOne({
      $or: [{ moduleId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      status: "published",
    }).select("-__v");

    if (!moduleItem) {
      return res.status(404).json({ error: "Micro-module not found" });
    }

    res.json(moduleItem);
  } catch (error) {
    console.error("Error fetching micro-module:", error);
    res.status(500).json({ error: "Failed to fetch micro-module" });
  }
}

module.exports = {
  getAllMicroModules,
  getMicroModuleById,
};
