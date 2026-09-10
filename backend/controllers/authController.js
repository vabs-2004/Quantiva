const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET } = require("../middleware/auth");

/**
 * Generate JWT token for a user.
 */
function generateToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * POST /api/auth/register
 * Creates a new user account.
 */
async function register(req, res) {
  try {
    const { username, password, name, email, dob, gender, phone, os } = req.body;

    if (!username || !password || !name || !email || !dob || !gender || !phone) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ error: "Username or Email already taken." });
    }

    // Create user (always 'user' role — admin is created via seed only)
    const user = new User({ 
      username, 
      password, 
      name, 
      email, 
      dob, 
      gender, 
      phone, 
      os,
      role: "user" 
    });
    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, role: user.role, name: user.name },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed." });
  }
}

/**
 * POST /api/auth/login
 * Authenticates a user and returns JWT.
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: { id: user._id, username: user.username, role: user.role, name: user.name },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed." });
  }
}

/**
 * GET /api/auth/me
 * Returns the currently authenticated user's info.
 */
async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json({ id: user._id, username: user.username, role: user.role, name: user.name });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user." });
  }
}

const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/google-login
 * Logs in or registers a user via Google ID Token.
 */
async function googleLogin(req, res) {
  try {
    const { token, os } = req.body;
    if (!token) {
      return res.status(400).json({ error: "No token provided." });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub } = payload; // sub is the unique Google user ID

    // Check if user exists by email
    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user for Google login
      // We set a random password since they won't use it to login natively
      const randomPassword = Math.random().toString(36).slice(-10) + "A1!";
      
      user = new User({
        username: email.split("@")[0] + Math.floor(Math.random() * 1000), // e.g. john123
        name: name,
        email: email,
        password: randomPassword, 
        dob: "2000-01-01", // Default placeholder for Google users
        gender: "Other", // Default placeholder
        phone: "0000000000",
        os: os || "Unknown",
        role: "user"
      });
      await user.save();
    }

    const jwtToken = generateToken(user);
    res.json({
      token: jwtToken,
      user: { id: user._id, username: user.username, role: user.role, name: user.name },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(401).json({ error: "Invalid Google token." });
  }
}

module.exports = { register, login, getMe, googleLogin };
