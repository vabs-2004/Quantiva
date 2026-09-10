const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { authenticate } = require("../middleware/auth");
const { chat, explainConcept, analyzeCircuit, recommend } = require("../controllers/aiController");

// AI calls are more expensive than regular CRUD — keep a tighter limit.
const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30,
  message: { error: "Too many AI Tutor requests. Please wait a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticate, aiLimiter);

router.post("/chat", chat);
router.post("/explain", explainConcept);
router.post("/analyze-circuit", analyzeCircuit);
router.get("/recommend", recommend);

module.exports = router;
