const express = require("express");
const router = express.Router();
const {
  getAllMicroModules,
  getMicroModuleById,
} = require("../controllers/microModuleController");

// Public endpoints to retrieve curriculum micro-modules
router.get("/", getAllMicroModules);
router.get("/:id", getMicroModuleById);

module.exports = router;
