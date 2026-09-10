const express = require("express");
const router = express.Router();
const { exportQasm, importQasm } = require("../controllers/circuitController");

router.post("/export-qasm", exportQasm);
router.post("/import-qasm", importQasm);

module.exports = router;
