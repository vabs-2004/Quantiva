const express = require("express");
const router = express.Router();
const {
  getItems,
  updateItem,
  createItem,
  deleteItem,
} = require("../controllers/playgroundController");
const { authenticate, adminOnly } = require("../middleware/auth");

// Public routes
router.get("/playground", getItems);

// Admin only routes
router.post("/playground", authenticate, adminOnly, createItem);
router.put("/playground/:id", authenticate, adminOnly, updateItem);
router.delete("/playground/:id", authenticate, adminOnly, deleteItem);

module.exports = router;
