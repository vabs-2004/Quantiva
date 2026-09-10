/**
 * Algorithm API Routes
 *
 * GET    /api/algorithms      → list all algorithms
 * GET    /api/algorithms/:id  → get single algorithm
 * POST   /api/algorithms      → create algorithm (admin)
 * PUT    /api/algorithms/:id  → update algorithm (admin)
 * DELETE /api/algorithms/:id  → delete algorithm (admin)
 * POST   /api/run             → run algorithm simulation
 *
 * GET    /api/educational/:algorithmId     → get educational content
 * PUT    /api/educational/:algorithmId     → update educational content (admin)
 */

const express = require("express");
const router = express.Router();
const {
  getAlgorithms,
  getAlgorithmById,
  createAlgorithm,
  updateAlgorithm,
  deleteAlgorithm,
  runAlgorithm,
} = require("../controllers/algorithmController");
const {
  getEducationalContent,
  updateEducationalContent,
} = require("../controllers/educationalController");
const { authenticate, adminOnly } = require("../middleware/auth");

// ─── Public Routes ──────────────────────────────────
router.get("/algorithms", getAlgorithms);
router.get("/algorithms/:id", getAlgorithmById);
router.get("/educational/:algorithmId", getEducationalContent);

// Spawns a real Python/papermill process for up to 120s — requires login,
// same as the Algorithm page it's called from.
router.post("/run", authenticate, runAlgorithm);

// ─── Admin Routes ───────────────────────────────────
router.post("/algorithms", authenticate, adminOnly, createAlgorithm);
router.put("/algorithms/:id", authenticate, adminOnly, updateAlgorithm);
router.delete("/algorithms/:id", authenticate, adminOnly, deleteAlgorithm);
router.put("/educational/:algorithmId", authenticate, adminOnly, updateEducationalContent);

module.exports = router;
