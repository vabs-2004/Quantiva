const express = require("express");
const router = express.Router();
const { register, login, getMe, googleLogin } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/google-login", googleLogin);
router.get("/auth/me", authenticate, getMe);

module.exports = router;
