const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const rateLimit = require("express-rate-limit");
const {
  getMyCertificates,
  getCertificateForCourse,
  verifyCertificate,
  downloadCertificate,
} = require("../controllers/certificateController");

// Public verification is unauthenticated, so rate-limit it against ID-guessing/enumeration.
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { valid: false, error: "Too many verification attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/me", authenticate, getMyCertificates);
router.get("/course/:courseId", authenticate, getCertificateForCourse);
router.get("/verify/:certificateId", verifyLimiter, verifyCertificate);
router.get("/:certificateId/download", authenticate, downloadCertificate);

module.exports = router;
