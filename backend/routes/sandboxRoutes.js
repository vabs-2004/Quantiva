/**
 * Sandbox API Routes
 *
 * POST /api/sandbox/run → execute user Python code
 */

const express = require("express");
const router = express.Router();
const { runSandboxCode, installPackages } = require("../controllers/sandboxController");
const { authenticate } = require("../middleware/auth");

// Both endpoints execute arbitrary Python on the server — authentication is
// the only real boundary here, since the frontend's route guard is
// client-side only and does not stop direct API requests.
router.post("/sandbox/run", authenticate, runSandboxCode);
router.post("/sandbox/install", authenticate, installPackages);

module.exports = router;
