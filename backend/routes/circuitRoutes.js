const express = require("express");
const router = express.Router();
const { exportQasm, importQasm, getCircuitTimeline, getNoisyCircuitTimeline } = require("../controllers/circuitController");

router.post("/export-qasm", exportQasm);
router.post("/import-qasm", importQasm);
router.post("/timeline", getCircuitTimeline);
router.post("/noisy-timeline", getNoisyCircuitTimeline);

module.exports = router;

