const PlaygroundItem = require("../models/PlaygroundItem");

const DEFAULT_ITEMS = [
  {
    icon: "🌐",
    title: "Bloch Sphere Explorer",
    desc: "Visualize quantum states interactively on the Bloch Sphere. Understand superpositions and phase shifts intuitively.",
    status: "Available",
    path: "/sandbox",
    order: 1,
  },
  {
    icon: "⚡",
    title: "Quantum Circuit Simulator",
    desc: "Drag-and-drop gates to build circuits. See state vectors and measurement probabilities in real-time.",
    status: "Available",
    path: "/circuit-simulator",
    order: 2,
  },
  {
    icon: "🔗",
    title: "Entanglement Lab",
    desc: "Create and measure Bell States. Witness spooky action at a distance and the collapse of the wavefunction.",
    status: "Available",
    path: "/entanglement-lab",
    order: 3,
  },
  {
    icon: "📐",
    title: "Circuit Challenges",
    desc: "Solve quantum circuit puzzles — build circuits that produce target output states.",
    status: "Available",
    path: "/circuit-challenges",
    order: 4,
  }
];

// Auto-seed if empty
const autoSeedPlayground = async () => {
  try {
    const count = await PlaygroundItem.countDocuments();
    if (count === 0) {
      console.log("Seeding default Playground Items...");
      await PlaygroundItem.insertMany(DEFAULT_ITEMS);
      console.log("Playground Items seeded successfully.");
    }
  } catch (err) {
    console.error("Error seeding Playground Items:", err);
  }
};

// @desc    Get all playground items
// @route   GET /api/playground
// @access  Public
const getItems = async (req, res) => {
  try {
    // Attempt auto-seed before fetching
    await autoSeedPlayground();
    const items = await PlaygroundItem.find().sort({ order: 1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch playground items." });
  }
};

// @desc    Update a playground item
// @route   PUT /api/playground/:id
// @access  Private/Admin
const updateItem = async (req, res) => {
  try {
    const item = await PlaygroundItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: "Failed to update item." });
  }
};

// @desc    Create a new playground item
// @route   POST /api/playground
// @access  Private/Admin
const createItem = async (req, res) => {
  try {
    const newItem = new PlaygroundItem(req.body);
    const saved = await newItem.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: "Failed to create item." });
  }
};

// @desc    Delete a playground item
// @route   DELETE /api/playground/:id
// @access  Private/Admin
const deleteItem = async (req, res) => {
  try {
    const item = await PlaygroundItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item removed" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete item." });
  }
};

module.exports = {
  getItems,
  updateItem,
  createItem,
  deleteItem,
};
