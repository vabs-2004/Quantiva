const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authenticate, adminOnly } = require("../middleware/auth");

// Get all users with pagination and search
router.get("/", authenticate, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;

    const [users, totalUsers] = await Promise.all([
      User.find(query, "-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query)
    ]);

    res.json({
      data: users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalItems: totalUsers
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Update user role
router.put("/:id/role", authenticate, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // 'admin' or 'user'
    
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
});

module.exports = router;
