const mongoose = require("mongoose");
const path = require("path");
const Challenge = require("../models/Challenge");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const MANUAL_CHALLENGES = [
  {
    id: 1,
    title: "Challenge 1: The Basics",
    desc: "Use an X gate to flip the qubit from |0⟩ to |1⟩.",
    numQubits: 1,
    targetState: [0, 1],
    targetStr: "|1⟩",
    allowedGates: ["X", "H"]
  },
  {
    id: 2,
    title: "Challenge 2: Superposition",
    desc: "Create an equal superposition state on a single qubit using the Hadamard gate.",
    numQubits: 1,
    targetState: [0.5, 0.5],
    targetStr: "(|0⟩ + |1⟩) / √2",
    allowedGates: ["X", "H", "Z"]
  },
  {
    id: 3,
    title: "Challenge 3: Entanglement",
    desc: "Create the |Φ+⟩ Bell state. Hint: You will need Superposition (H) and a Controlled-NOT (CX).",
    numQubits: 2,
    targetState: [0.5, 0, 0, 0.5],
    targetStr: "(|00⟩ + |11⟩) / √2",
    allowedGates: ["H", "X", "CX"]
  },
  {
    id: 4,
    title: "Challenge 4: Double Superposition",
    desc: "Create an equal superposition of all 4 possible states for 2 qubits.",
    numQubits: 2,
    targetState: [0.25, 0.25, 0.25, 0.25],
    targetStr: "(|00⟩ + |01⟩ + |10⟩ + |11⟩) / 2",
    allowedGates: ["H", "X"]
  },
  {
    id: 5,
    title: "Challenge 5: The Flipped State",
    desc: "Transform |00⟩ into |10⟩. Note that q0 is the rightmost bit in Qiskit notation |q1 q0>. So you need to flip q1.",
    numQubits: 2,
    targetState: [0, 0, 1, 0],
    targetStr: "|10⟩",
    allowedGates: ["X", "H"]
  },
  {
    id: 6,
    title: "Challenge 6: Bell State Variant",
    desc: "Create the |Ψ+⟩ Bell state. The probabilities should be split equally between |01⟩ and |10⟩.",
    numQubits: 2,
    targetState: [0, 0.5, 0.5, 0],
    targetStr: "(|01⟩ + |10⟩) / √2",
    allowedGates: ["X", "H", "CX"]
  },
  {
    id: 7,
    title: "Challenge 7: The Disentangler",
    desc: "Create the state where q0 is |1⟩ and q1 is in superposition. Qiskit order is |q1 q0>.",
    numQubits: 2,
    targetState: [0, 0.5, 0, 0.5],
    targetStr: "(|01⟩ + |11⟩) / √2",
    allowedGates: ["X", "H"]
  },
  {
    id: 8,
    title: "Challenge 8: All Ones",
    desc: "Flip all three qubits to create the |111⟩ state.",
    numQubits: 3,
    targetState: [0, 0, 0, 0, 0, 0, 0, 1],
    targetStr: "|111⟩",
    allowedGates: ["X"]
  },
  {
    id: 9,
    title: "Challenge 9: Specific Classical State",
    desc: "Create the classical state |011⟩. Remember Qiskit ordering: |q2 q1 q0>.",
    numQubits: 3,
    targetState: [0, 0, 0, 1, 0, 0, 0, 0],
    targetStr: "|011⟩",
    allowedGates: ["X", "H"]
  },
  {
    id: 10,
    title: "Challenge 10: GHZ State",
    desc: "Create the 3-qubit maximally entangled GHZ state. You will need H and multiple CX gates.",
    numQubits: 3,
    targetState: [0.5, 0, 0, 0, 0, 0, 0, 0.5],
    targetStr: "(|000⟩ + |111⟩) / √2",
    allowedGates: ["H", "CX"]
  },
  {
    id: 11,
    title: "Challenge 11: Uniform Superposition",
    desc: "Create an equal superposition across all 8 possible 3-qubit states.",
    numQubits: 3,
    targetState: [0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125],
    targetStr: "1/√8 ∑ |x⟩",
    allowedGates: ["H", "X"]
  },
  {
    id: 12,
    title: "Challenge 12: Partial Entanglement",
    desc: "Entangle q0 and q1 in a Bell state, but leave q2 in state |1⟩. (Target: 50% |100⟩, 50% |111⟩)",
    numQubits: 3,
    targetState: [0, 0, 0, 0, 0.5, 0, 0, 0.5],
    targetStr: "|1⟩ ⊗ (|00⟩ + |11⟩) / √2",
    allowedGates: ["X", "H", "CX"]
  },
  {
    id: 13,
    title: "Challenge 13: The CNOT Cascade",
    desc: "Apply a superposition to q0, then cascade CNOTs from q0 to q1, and q1 to q2.",
    numQubits: 3,
    targetState: [0.5, 0, 0, 0, 0, 0, 0, 0.5],
    targetStr: "(|000⟩ + |111⟩) / √2",
    allowedGates: ["H", "X", "CX"]
  },
  {
    id: 14,
    title: "Challenge 14: The 3-Qubit Coin Flip",
    desc: "Create a state where q0 and q1 are always |0⟩, but q2 is in an equal superposition.",
    numQubits: 3,
    targetState: [0.5, 0, 0, 0, 0.5, 0, 0, 0], // |000> and |100>
    targetStr: "(|000⟩ + |100⟩) / √2",
    allowedGates: ["H", "X"]
  },
  {
    id: 15,
    title: "Challenge 15: Odd One Out",
    desc: "Create an equal superposition of all states where q0 is |1⟩. (Hint: Superpose q1 and q2, then flip q0).",
    numQubits: 3,
    targetState: [0, 0.25, 0, 0.25, 0, 0.25, 0, 0.25], // |001>, |011>, |101>, |111>
    targetStr: "(|001⟩ + |011⟩ + |101⟩ + |111⟩) / 2",
    allowedGates: ["H", "X"]
  },
  {
    id: 16,
    title: "Challenge 16: Entangled Pair + Observer",
    desc: "Entangle q1 and q2 into a Bell state, while q0 remains |1⟩.",
    numQubits: 3,
    targetState: [0, 0.5, 0, 0, 0, 0, 0, 0.5], // |001> and |111> (Remember Qiskit: q2 q1 q0)
    targetStr: "(|001⟩ + |111⟩) / √2",
    allowedGates: ["H", "X", "CX"]
  },
  {
    id: 17,
    title: "Challenge 17: The Swap Illusion",
    desc: "Make q2 and q0 entangled such that if q0 is 0, q2 is 1, and vice versa. q1 remains 0.",
    numQubits: 3,
    targetState: [0, 0.5, 0, 0, 0.5, 0, 0, 0], // |001> and |100>
    targetStr: "(|001⟩ + |100⟩) / √2",
    allowedGates: ["H", "X", "CX"]
  },
  {
    id: 18,
    title: "Challenge 18: Cascading Superposition",
    desc: "Apply H to q0. Use CX to entangle q1 with q0. Then apply H to q2.",
    numQubits: 3,
    targetState: [0.25, 0, 0, 0.25, 0.25, 0, 0, 0.25], // |000>, |011>, |100>, |111>
    targetStr: "(|000⟩ + |011⟩ + |100⟩ + |111⟩) / 2",
    allowedGates: ["H", "CX"]
  },
  {
    id: 19,
    title: "Challenge 19: The Control Center",
    desc: "Set q2 to |1⟩. Use it as a control to flip q1. q0 should be in superposition.",
    numQubits: 3,
    targetState: [0, 0, 0, 0, 0, 0, 0.5, 0.5], // |110> and |111>
    targetStr: "(|110⟩ + |111⟩) / √2",
    allowedGates: ["H", "X", "CX"]
  },
  {
    id: 20,
    title: "Challenge 20: 3-Qubit Anti-GHZ",
    desc: "Create the state where all qubits are either |010⟩ or |101⟩ equally.",
    numQubits: 3,
    targetState: [0, 0, 0.5, 0, 0, 0.5, 0, 0], 
    targetStr: "(|010⟩ + |101⟩) / √2",
    allowedGates: ["H", "X", "CX"]
  },

  // --- LEVEL 3: Enter 4 Qubits (Data increases to 16 states) ---
  {
    id: 21,
    title: "Challenge 21: The 4-Qubit Initialization",
    desc: "Flip the outer qubits (q3 and q0) while leaving the inner ones at |0⟩.",
    numQubits: 4,
    targetState: [0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0], // |1001> is decimal 9
    targetStr: "|1001⟩",
    allowedGates: ["X"]
  },
  {
    id: 22,
    title: "Challenge 22: 4-Qubit Uniform Superposition",
    desc: "Put all 4 qubits into an equal superposition.",
    numQubits: 4,
    targetState: Array(16).fill(1/16),
    targetStr: "1/4 ∑ |x⟩",
    allowedGates: ["H"]
  },
  {
    id: 23,
    title: "Challenge 23: Twin Bell States",
    desc: "Entangle q0 with q1, and separately entangle q2 with q3.",
    numQubits: 4,
    targetState: [0.25,0,0,0.25, 0,0,0,0, 0,0,0,0, 0.25,0,0,0.25], // |0000>, |0011>, |1100>, |1111>
    targetStr: "(|00⟩ + |11⟩) ⊗ (|00⟩ + |11⟩) / 2",
    allowedGates: ["H", "CX"]
  },
  {
    id: 24,
    title: "Challenge 24: Half and Half",
    desc: "Create a state where the first 8 states have 0 probability, and the last 8 states are equally probable.",
    numQubits: 4,
    targetState: [0,0,0,0,0,0,0,0, 0.125,0.125,0.125,0.125,0.125,0.125,0.125,0.125], 
    targetStr: "|1⟩ ⊗ (H⊗3|000⟩)",
    allowedGates: ["H", "X"]
  },
  {
    id: 25,
    title: "Challenge 25: The Checkerboard",
    desc: "Create a superposition of |0101⟩ and |1010⟩.",
    numQubits: 4,
    targetState: [0,0,0,0,0,0.5,0,0, 0,0,0.5,0,0,0,0,0], // indices 5 and 10
    targetStr: "(|0101⟩ + |1010⟩) / √2",
    allowedGates: ["H", "X", "CX"]
  },
  {
    id: 26,
    title: "Challenge 26: 4-Qubit GHZ",
    desc: "Create a maximally entangled 4-qubit state: all 0s or all 1s.",
    numQubits: 4,
    targetState: [0.5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.5], 
    targetStr: "(|0000⟩ + |1111⟩) / √2",
    allowedGates: ["H", "CX"]
  },
  {
    id: 27,
    title: "Challenge 27: The Mirror State",
    desc: "Create a superposition of |1001⟩ and |0110⟩.",
    numQubits: 4,
    targetState: [0,0,0,0,0,0,0.5,0,0,0.5,0,0,0,0,0,0], // indices 6 and 9
    targetStr: "(|0110⟩ + |1001⟩) / √2",
    allowedGates: ["H", "X", "CX"]
  },
  {
    id: 28,
    title: "Challenge 28: Controlled Entanglement",
    desc: "Set q3 to superposition. If q3 is 1, entangle q0 and q1. (Target: |0000> + |1011>)",
    numQubits: 4,
    targetState: [0.5,0,0,0,0,0,0,0, 0,0,0,0.5,0,0,0,0], // |0000> (index 0), |1011> (index 11)
    targetStr: "(|0000⟩ + |1011⟩) / √2",
    allowedGates: ["H", "CX"]
  },
  {
    id: 29,
    title: "Challenge 29: Lone Zero",
    desc: "Create a state where all qubits are |1⟩ EXCEPT q2, which is |0⟩.",
    numQubits: 4,
    targetState: [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0], // |1011> -> 11
    targetStr: "|1011⟩",
    allowedGates: ["X"]
  },
  {
    id: 30,
    title: "Challenge 30: 4-Qubit Anti-GHZ",
    desc: "Create the state |0111> + |1000>.",
    numQubits: 4,
    targetState: [0,0,0,0,0,0,0,0.5, 0.5,0,0,0,0,0,0,0], // |0111> (7), |1000> (8)
    targetStr: "(|0111⟩ + |1000⟩) / √2",
    allowedGates: ["H", "X", "CX"]
  },

  // --- LEVEL 4: Logic & Multi-Qubit Control (Assuming CCX/Toffoli is added) ---
  {
    id: 31,
    title: "Challenge 31: Introduction to CCX (Toffoli)",
    desc: "Flip q2 ONLY if both q0 and q1 are |1⟩.",
    numQubits: 3,
    targetState: [0, 0, 0, 0, 0, 0, 0, 1], 
    targetStr: "|111⟩",
    allowedGates: ["X", "CCX"]
  },
  {
    id: 32,
    title: "Challenge 32: The Half-Adder Prep",
    desc: "Put q0 and q1 in superposition, then apply a Toffoli targeting q2. This simulates the AND gate on all possible inputs simultaneously.",
    numQubits: 3,
    targetState: [0.25, 0.25, 0.25, 0, 0, 0, 0, 0.25], // |000>, |001>, |010>, |111>
    targetStr: "Superposed AND",
    allowedGates: ["H", "CCX"]
  },
  {
    id: 33,
    title: "Challenge 33: Swap without SWAP",
    desc: "Using only 3 CX gates, swap the states of q0 (starts as |1⟩) and q1 (starts as |0⟩).",
    numQubits: 2,
    targetState: [0, 0, 1, 0], // Ends as |10>
    targetStr: "|10⟩",
    allowedGates: ["X", "CX"]
  },
  {
    id: 34,
    title: "Challenge 34: Entangled Swap",
    desc: "Create a Bell state on q0, q1. Then swap q1 with q2.",
    numQubits: 3,
    targetState: [0.5, 0, 0, 0, 0, 0.5, 0, 0], // |000> (0), |101> (5)
    targetStr: "(|000⟩ + |101⟩) / √2",
    allowedGates: ["H", "CX"] 
  },
  {
    id: 35,
    title: "Challenge 35: The 3-Qubit Cascade",
    desc: "Flip q0. Use it to control q1. Use q1 to control q2.",
    numQubits: 3,
    targetState: [0, 0, 0, 0, 0, 0, 0, 1],
    targetStr: "|111⟩",
    allowedGates: ["X", "CX"]
  },
  {
    id: 36,
    title: "Challenge 36: Double Control",
    desc: "Set q0 and q2 to |1⟩. Flip q1 only if q0 and q2 are |1⟩.",
    numQubits: 3,
    targetState: [0, 0, 0, 0, 0, 0, 0, 1], // |111>
    targetStr: "|111⟩",
    allowedGates: ["X", "CCX"]
  },
  {
    id: 37,
    title: "Challenge 37: The W-State Approximation",
    desc: "Create a state distributing probability equally across |001>, |010>, and |100>. (Close approx: 33.3% each).",
    numQubits: 3,
    targetState: [0, 0.333, 0.333, 0, 0.333, 0, 0, 0], 
    targetStr: "(|001⟩ + |010⟩ + |100⟩) / √3",
    allowedGates: ["H", "X", "CX", "RY"] 
  },
  {
    id: 38,
    title: "Challenge 38: 4-Qubit Parity",
    desc: "Use q3 to store the parity (XOR) of q0, q1, and q2. If q0=1, q1=0, q2=1, then q3 should become 0.",
    numQubits: 4,
    targetState: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Assuming specific inputs
    targetStr: "Parity Check",
    allowedGates: ["X", "CX"]
  },
  {
    id: 39,
    title: "Challenge 39: Superdense Prep",
    desc: "Create the state |00> - |11>. (Note: probability array remains the same as Bell state, but phase differs).",
    numQubits: 2,
    targetState: [0.5, 0, 0, 0.5], 
    targetStr: "(|00⟩ - |11⟩) / √2",
    allowedGates: ["H", "X", "CX", "Z"]
  },
  {
    id: 40,
    title: "Challenge 40: Phase Kickback",
    desc: "Apply H to q0. Apply X then H to q1. Then apply CX(control=q0, target=q1).",
    numQubits: 2,
    targetState: [0.25, 0.25, 0.25, 0.25], 
    targetStr: "|-⟩| -⟩",
    allowedGates: ["H", "X", "CX"]
  },

  // --- LEVEL 5: Algorithmic Fundamentals ---
  {
    id: 41,
    title: "Challenge 41: QFT on 1 Qubit",
    desc: "The Quantum Fourier Transform on 1 qubit is just the Hadamard gate.",
    numQubits: 1,
    targetState: [0.5, 0.5],
    targetStr: "|+⟩",
    allowedGates: ["H"]
  },
  {
    id: 42,
    title: "Challenge 42: Grover's Oracle (State |11>)",
    desc: "Flip the phase of the |11> state. (Probabilities won't change, but try using a CZ or H-CX-H combo).",
    numQubits: 2,
    targetState: [0.25, 0.25, 0.25, 0.25], 
    targetStr: "Oracle |11⟩",
    allowedGates: ["H", "X", "CX", "Z"]
  },
  {
    id: 43,
    title: "Challenge 43: Grover's Diffuser Prep",
    desc: "Apply H, then X to both qubits. This is the first step of the diffusion operator.",
    numQubits: 2,
    targetState: [0.25, 0.25, 0.25, 0.25],
    targetStr: "H⊗X",
    allowedGates: ["H", "X"]
  },
  {
    id: 44,
    title: "Challenge 44: Deutsch Oracle (Constant)",
    desc: "Create a 2-qubit circuit where the output (q1) is always flipped regardless of q0.",
    numQubits: 2,
    targetState: [0, 0, 0.5, 0.5], // q1 is |1>
    targetStr: "f(x) = 1",
    allowedGates: ["H", "X"]
  },
  {
    id: 45,
    title: "Challenge 45: Deutsch Oracle (Balanced)",
    desc: "Create a circuit where q1 is flipped ONLY if q0 is |1>.",
    numQubits: 2,
    targetState: [0.5, 0, 0, 0.5], // Basically a Bell state if q0 is superposed
    targetStr: "f(x) = x",
    allowedGates: ["H", "X", "CX"]
  },
  {
    id: 46,
    title: "Challenge 46: Entangled Triplets",
    desc: "Create 3 independent qubits, flip them all, then apply H to all.",
    numQubits: 3,
    targetState: Array(8).fill(0.125),
    targetStr: "|-⟩|-⟩|-⟩",
    allowedGates: ["X", "H"]
  },
  {
    id: 47,
    title: "Challenge 47: The X-Y Plane",
    desc: "Apply a Y gate to |0>. Notice how it differs from X in phase, but the probability is identical.",
    numQubits: 1,
    targetState: [0, 1],
    targetStr: "i|1⟩",
    allowedGates: ["Y"]
  },
  {
    id: 48,
    title: "Challenge 48: Superposed Control",
    desc: "Use a superposed q1 to control a Z gate on q0. (Equivalent to a CZ gate).",
    numQubits: 2,
    targetState: [0.5, 0.5, 0, 0], // Assuming q0 starts |0>
    targetStr: "CZ effect",
    allowedGates: ["H", "Z", "CZ"]
  },
  {
    id: 49,
    title: "Challenge 49: Hardware Topology Constraint",
    desc: "Entangle q0 and q2, but you can ONLY use CX gates between adjacent qubits (q0-q1, and q1-q2).",
    numQubits: 3,
    targetState: [0.5, 0, 0, 0, 0.5, 0, 0, 0], // Entangle 0 and 2.
    targetStr: "SWAP & CX",
    allowedGates: ["H", "CX"]
  },
  {
    id: 50,
    title: "Challenge 50: The DRDO Final Boss",
    desc: "Create a 4-qubit state representing a secure key distribution prep: q0 and q3 entangled, q1 and q2 superposed.",
    numQubits: 4,
    targetState: [0.125,0,0,0.125,0.125,0,0,0.125,0.125,0,0,0.125,0.125,0,0,0.125], 
    targetStr: "Secure Key Prep",
    allowedGates: ["H", "CX", "X"]
  }
];

async function seedChallenges() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for Seeding Challenges");

    const count = await Challenge.countDocuments();
    if (count > 0) {
      console.log(`Challenges already exist (Found ${count}). Clearing and reseeding...`);
      await Challenge.deleteMany({});
    }

    // Load manual challenges
    const docs = MANUAL_CHALLENGES.map(c => ({
      ...c,
      order: c.id
    }));

    // Sort to be safe
    docs.sort((a, b) => a.order - b.order);

    await Challenge.insertMany(docs);
    console.log(`Successfully seeded ${docs.length} challenges into MongoDB!`);
    
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed challenges:", err);
    process.exit(1);
  }
}

seedChallenges();
