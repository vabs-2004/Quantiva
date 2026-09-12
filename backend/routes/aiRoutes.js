const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");
const { chat, explainConcept, analyzeCircuit, recommend, explainTransition, explainNoise } = require("../controllers/aiController");

// AI calls are more expensive than regular CRUD — keep a tighter limit.
const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30,
  message: { error: "Too many AI Tutor requests. Please wait a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stage 5: Explain Why transition endpoint — accepts unguessable bearer timelineId
router.post("/explain-transition", optionalAuthenticate, aiLimiter, explainTransition);

// Stage 6: Noise Lab Explain endpoint — accepts unguessable bearer timelineId and noisyTimelineId
router.post("/explain-noise", optionalAuthenticate, aiLimiter, explainNoise);

router.use(authenticate, aiLimiter);

router.post("/chat", chat);
router.post("/explain", explainConcept);
router.post("/analyze-circuit", analyzeCircuit);
router.get("/recommend", recommend);

module.exports = router;
