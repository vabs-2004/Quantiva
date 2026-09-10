const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const PYTHON_PATH = process.env.PYTHON_PATH || "python3";

function runChallengeCircuit(req, res) {
  const { gates, targetState, challengeId } = req.body;
  const rawNumQubits = req.body.numQubits;

  if (!rawNumQubits || !Array.isArray(gates) || !targetState) {
    return res.status(400).json({ error: "Invalid payload. Required: numQubits, gates, targetState." });
  }

  // Strictly validate numQubits as a small positive integer BEFORE it is ever
  // interpolated into the generated Python source below — it must never be
  // used as a raw string, or an attacker could inject arbitrary Python code.
  const numQubits = Number.isInteger(rawNumQubits)
    ? rawNumQubits
    : parseInt(rawNumQubits, 10);
  if (!Number.isInteger(numQubits) || numQubits < 1 || numQubits > 10 || String(numQubits) !== String(rawNumQubits).trim()) {
    return res.status(400).json({ error: "numQubits must be an integer between 1 and 10." });
  }

  // Construct the Python script securely
  // We do NOT execute user-provided code, we strictly map their JSON to safe Qiskit commands.

  let pythonCode = `
import json
import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector

try:
    qc = QuantumCircuit(${numQubits})
`;

  // Safely map gates
  const ALLOWED_GATES = ["H", "X", "Y", "Z", "S", "T", "SX", "SDG", "TDG", "CX", "SWAP"];
  
  for (const g of gates) {
    if (!ALLOWED_GATES.includes(g.type)) continue;
    
    // Ensure qubit indices are within bounds
    const q1 = Math.min(Math.max(0, parseInt(g.qubit) || 0), numQubits - 1);
    
    if (["CX", "SWAP"].includes(g.type)) {
      const q2 = Math.min(Math.max(0, parseInt(g.target) || 0), numQubits - 1);
      if (q1 !== q2) {
        if (g.type === "CX") pythonCode += `    qc.cx(${q1}, ${q2})\n`;
        if (g.type === "SWAP") pythonCode += `    qc.swap(${q1}, ${q2})\n`;
      }
    } else {
      const gType = g.type.toLowerCase();
      // handle specific names
      if (g.type === "SX") pythonCode += `    qc.sx(${q1})\n`;
      else if (g.type === "SDG") pythonCode += `    qc.sdg(${q1})\n`;
      else if (g.type === "TDG") pythonCode += `    qc.tdg(${q1})\n`;
      else pythonCode += `    qc.${gType}(${q1})\n`;
    }
  }

  // Evaluation block
  pythonCode += `
    sv = Statevector.from_instruction(qc)
    actual_state = np.abs(sv.data)**2 # Get probabilities
    
    target_state = np.array(${JSON.stringify(targetState)})
    
    # 1. Float Precision Trap: use np.allclose to compare probabilities
    is_success = np.allclose(actual_state, target_state, atol=1e-5)
    
    print(json.dumps({
        "success": bool(is_success),
        "actual_probabilities": actual_state.tolist()
    }))
except Exception as e:
    print(json.dumps({
        "success": False,
        "error": str(e)
    }))
`;

  const timestamp = Date.now();
  const scriptPath = path.join(__dirname, `../scripts/challenge_${timestamp}.py`);

  try {
    if (!fs.existsSync(path.join(__dirname, "../scripts"))) {
      fs.mkdirSync(path.join(__dirname, "../scripts"));
    }
    fs.writeFileSync(scriptPath, pythonCode, "utf8");
  } catch (err) {
    console.error("Failed to write challenge script:", err);
    return res.status(500).json({ error: "Failed to create evaluation script." });
  }

  const command = `"${PYTHON_PATH}" "${scriptPath}"`;

  exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
    try { fs.unlinkSync(scriptPath); } catch (e) { /* ignore */ }

    if (error) {
      console.error("Challenge execution error:", stderr || error.message);
      return res.status(500).json({ error: "Execution failed.", details: stderr || error.message });
    }

    try {
      const result = JSON.parse(stdout.trim());
      if (req.user && challengeId) {
        recordChallengeCompletion(req.user.id, challengeId, !!result.success);
      }
      res.json(result);
    } catch (e) {
      console.error("Failed to parse Python output:", stdout);
      res.status(500).json({ error: "Invalid response from evaluator." });
    }
  });
}

// CRUD for Challenges
const Challenge = require("../models/Challenge");
const { recordChallengeCompletion } = require("./progressController");

async function getChallenges(req, res) {
  try {
    const challenges = await Challenge.find().sort({ order: 1 });
    res.json(challenges);
  } catch (err) {
    console.error("Error fetching challenges:", err);
    res.status(500).json({ error: "Server error fetching challenges" });
  }
}

async function createChallenge(req, res) {
  try {
    const newChallenge = new Challenge(req.body);
    await newChallenge.save();
    res.status(201).json(newChallenge);
  } catch (err) {
    console.error("Error creating challenge:", err);
    res.status(400).json({ error: "Bad Request: " + err.message });
  }
}

async function updateChallenge(req, res) {
  try {
    const updated = await Challenge.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: "Challenge not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error updating challenge:", err);
    res.status(400).json({ error: "Bad Request: " + err.message });
  }
}

async function deleteChallenge(req, res) {
  try {
    const deleted = await Challenge.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Challenge not found" });
    res.json({ message: "Challenge deleted successfully" });
  } catch (err) {
    console.error("Error deleting challenge:", err);
    res.status(500).json({ error: "Server error deleting challenge" });
  }
}

module.exports = { 
  runChallengeCircuit,
  getChallenges,
  createChallenge,
  updateChallenge,
  deleteChallenge
};
