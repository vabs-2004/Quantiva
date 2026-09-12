/**
 * Algorithm Simulation Controller
 *
 * Contains the logic for running quantum algorithm simulations
 * and CRUD operations for algorithm management.
 * Uses MongoDB via Mongoose for data persistence.
 * Uses Papermill to execute Qiskit Jupyter notebooks.
 */

const Algorithm = require("../models/Algorithm");
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const { extractNotebookOutputs } = require("./sandboxController");

const PYTHON_PATH = process.env.PYTHON_PATH || "python3";

/**
 * GET /api/algorithms
 * Returns all available algorithms from MongoDB.
 */
async function getAlgorithms(req, res) {
  try {
    const algorithms = await Algorithm.find().sort({ category: 1, name: 1 });
    res.json(algorithms);
  } catch (error) {
    console.error("Error fetching algorithms:", error);
    res.status(500).json({ error: "Failed to fetch algorithms." });
  }
}

/**
 * GET /api/algorithms/:id
 * Returns a single algorithm by its slug ID.
 */
async function getAlgorithmById(req, res) {
  try {
    const algo = await Algorithm.findOne({ id: req.params.id });
    if (!algo) {
      return res.status(404).json({ error: "Algorithm not found" });
    }
    res.json(algo);
  } catch (error) {
    console.error("Error fetching algorithm:", error);
    res.status(500).json({ error: "Failed to fetch algorithm." });
  }
}

/**
 * POST /api/algorithms
 * Creates a new algorithm (admin only).
 */
async function createAlgorithm(req, res) {
  try {
    const algoData = req.body;

    if (!algoData.id || !algoData.name || !algoData.category) {
      return res.status(400).json({ error: "id, name, and category are required." });
    }

    // Check if ID already exists
    const existing = await Algorithm.findOne({ id: algoData.id });
    if (existing) {
      return res.status(409).json({ error: `Algorithm with id '${algoData.id}' already exists.` });
    }

    const algorithm = new Algorithm(algoData);
    await algorithm.save();
    res.status(201).json(algorithm);
  } catch (error) {
    console.error("Error creating algorithm:", error);
    res.status(500).json({ error: "Failed to create algorithm." });
  }
}

/**
 * PUT /api/algorithms/:id
 * Updates an existing algorithm (admin only).
 */
async function updateAlgorithm(req, res) {
  try {
    const algorithm = await Algorithm.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!algorithm) {
      return res.status(404).json({ error: "Algorithm not found." });
    }

    res.json(algorithm);
  } catch (error) {
    console.error("Error updating algorithm:", error);
    res.status(500).json({ error: "Failed to update algorithm." });
  }
}

/**
 * DELETE /api/algorithms/:id
 * Deletes an algorithm (admin only).
 */
async function deleteAlgorithm(req, res) {
  try {
    const algorithm = await Algorithm.findOneAndDelete({ id: req.params.id });
    if (!algorithm) {
      return res.status(404).json({ error: "Algorithm not found." });
    }
    res.json({ message: `Algorithm '${algorithm.name}' deleted successfully.` });
  } catch (error) {
    console.error("Error deleting algorithm:", error);
    res.status(500).json({ error: "Failed to delete algorithm." });
  }
}

/**
 * POST /api/run
 * Runs a quantum algorithm simulation.
 */
async function runAlgorithm(req, res) {
  const { algorithmId, parameters } = req.body;

  if (!algorithmId) {
    return res.status(400).json({ error: "algorithmId is required" });
  }

  const algo = await Algorithm.findOne({ id: algorithmId });
  if (!algo) {
    return res.status(404).json({ error: `Algorithm '${algorithmId}' not found` });
  }

  // ─── Real Papermill Execution ───
  const inputNb = path.join(__dirname, `../notebooks/${algorithmId}.ipynb`);
  
  if (!fs.existsSync(inputNb)) {
      return res.status(500).json({ error: `Notebook for ${algorithmId} not found on server.` });
  }

  const outputNb = path.join(__dirname, `../notebooks/output_${Date.now()}.ipynb`);
  
  // Build parameter arguments for Papermill.
  // Passed as a real argv array via execFile (no shell), so parameter values
  // can never break out into shell metacharacters/command injection.
  const args = ["-m", "papermill", inputNb, outputNb];
  if (parameters) {
      for (const [key, value] of Object.entries(parameters)) {
          // Map frontend parameter names to notebook variable names
          let varName = key.toLowerCase().replace(/[^a-z0-9]/g, "_");
          if (key === "Number of Qubits") varName = "num_qubits";
          if (key === "Iterations") varName = "iterations";
          if (key === "Target State") varName = "target_state";
          if (key === "Function Type") varName = "function_type";
          if (key === "Alpha (real)") varName = "alpha_real";
          if (key === "Beta (real)") varName = "beta_real";
          if (key === "Input State") varName = "input_state";
          if (key === "Number to Factor") varName = "number_to_factor";
          if (key === "Attempts") varName = "attempts";
          if (key === "Secret String") varName = "secret_string";
          if (key === "Precision Qubits") varName = "precision_qubits";
          if (key === "Phase (θ)") varName = "phase_theta";

          args.push("-p", varName, String(value));
      }
  }
  args.push("-k", "python3", "-l", "python");

  console.log("Running papermill with args:", args);

  execFile(
    PYTHON_PATH,
    args,
    {
      timeout: 120000,
      env: {
        ...process.env,
        OMP_NUM_THREADS: "1",
        KMP_DUPLICATE_LIB_OK: "TRUE",
        PYTHONIOENCODING: "utf-8",
      },
    },
    (error, stdout, stderr) => {
    if (error) {
      console.error("Papermill execution error:", error.message);
      if (!fs.existsSync(outputNb)) {
          return res.status(500).json({ error: "Execution failed completely", console: stderr || error.message });
      }
    }

    try {
      const resultsArray = extractNotebookOutputs(outputNb);
      fs.unlinkSync(outputNb);

      let allImages = [];
      let allText = "";
      let allErrors = "";

      for (const r of resultsArray) {
        if (r.images && r.images.length > 0) allImages.push(...r.images);
        if (r.text) allText += r.text + "\n";
        if (r.errorText) allErrors += r.errorText + "\n";
      }

      let circuitImg = null;
      let graphImg = null;
      let blochImg = null;

      if (allImages.length > 0) circuitImg = allImages[0];
      if (allImages.length > 1) graphImg = allImages[1];
      if (allImages.length > 2) blochImg = allImages[2];

      // Parse text output for Bloch sphere and measurements
      let theta = Math.PI / 4;
      let phi = Math.PI / 3;
      let measurements = [];
      let consoleOut = allText || "";

      // Parse Bloch Sphere Angles
      const thetaMatch = consoleOut.match(/BLOCH_THETA=([\d.]+)/);
      if (thetaMatch) theta = parseFloat(thetaMatch[1]);
      const phiMatch = consoleOut.match(/BLOCH_PHI=([\d.]+)/);
      if (phiMatch) phi = parseFloat(phiMatch[1]);

      // Remove the BLOCH_ variables from the console output
      consoleOut = consoleOut.replace(/BLOCH_THETA=[\d.]+\n?/g, "");
      consoleOut = consoleOut.replace(/BLOCH_PHI=[\d.]+\n?/g, "");

      // Parse Measurements Dictionary
      const countsMatch = consoleOut.match(/\{('[01]+': \d+(?:,\s*)?)+\}/);
      if (countsMatch) {
          try {
              const jsonStr = countsMatch[0].replace(/'/g, '"');
              const countsObj = JSON.parse(jsonStr);
              
              let totalShots = 0;
              for (const count of Object.values(countsObj)) {
                  totalShots += count;
              }

              for (const [state, count] of Object.entries(countsObj)) {
                  measurements.push({
                      state: `|${state}⟩`,
                      probability: count / totalShots,
                      count: count
                  });
              }
              measurements.sort((a, b) => b.probability - a.probability);
          } catch (e) {
              console.error("Failed to parse measurements:", e);
          }
      }

      consoleOut = `═══ ${algo.name} ═══\nExecuted successfully via Qiskit Aer Simulator.\n\n${consoleOut}`;

      if (allErrors.trim()) {
          consoleOut += `\n\nERRORS:\n${allErrors.trim()}`;
      }

      res.json({
        circuit: circuitImg,
        graph: graphImg,
        blochImage: blochImg,
        console: consoleOut.trim(),
        measurements: measurements.length > 0 ? measurements : null,
        blochSphere: { theta, phi },
      });

    } catch (err) {
      console.error("Error parsing notebook output:", err);
      try { fs.unlinkSync(outputNb); } catch (e) {}
      res.status(500).json({ error: "Failed to parse notebook output" });
    }
  });
}

module.exports = { getAlgorithms, getAlgorithmById, createAlgorithm, updateAlgorithm, deleteAlgorithm, runAlgorithm };
