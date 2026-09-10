/**
 * Quantum Algorithm Data
 *
 * This is the same data as the frontend's algorithms.js,
 * but kept server-side so the backend can serve it via API.
 *
 * In production, replace this with MongoDB / PostgreSQL.
 */

const algorithms = [
  {
    id: "grover-search",
    name: "Grover's Search",
    shortDescription: "Quadratic speedup for unstructured search problems.",
    description:
      "Grover's algorithm provides a quadratic speedup for searching an unsorted database of N items. It uses amplitude amplification to boost the probability of measuring the correct answer, requiring only O(√N) oracle queries instead of the classical O(N).",
    formula: "O(√N) oracle queries",
    timeComplexity: "O(√N)",
    spaceComplexity: "O(log N)",
    reference: "https://arxiv.org/abs/quant-ph/9605043",
    category: "Search",
    parameters: [
      { name: "Number of Qubits", type: "number", default: 3, min: 1, max: 20 },
      { name: "Iterations", type: "number", default: 2, min: 1, max: 100 },
      { name: "Target State", type: "text", default: "101", placeholder: "e.g. 101" },
    ],
  },
  {
    id: "deutsch",
    name: "Deutsch's Algorithm",
    shortDescription: "Determines if a single-bit function is constant or balanced.",
    description:
      "Deutsch's algorithm is the simplest quantum algorithm that demonstrates quantum advantage. It determines whether a Boolean function f:{0,1}→{0,1} is constant or balanced using a single query.",
    formula: "f(0) ⊕ f(1) with 1 query",
    timeComplexity: "O(1)",
    spaceComplexity: "O(1)",
    
    reference: "https://doi.org/10.1098/rspa.1985.0070",
    category: "Search",
    parameters: [
      { name: "Function Type", type: "select", options: ["Constant-0", "Constant-1", "Balanced-Identity", "Balanced-Negation"], default: "Balanced-Identity" },
    ],
  },
  {
    id: "deutsch-jozsa",
    name: "Deutsch-Jozsa Algorithm",
    shortDescription: "Determines if an n-bit function is constant or balanced in one query.",
    description:
      "The Deutsch-Jozsa algorithm generalizes Deutsch's algorithm to n-bit functions. It determines with certainty whether a function is constant or balanced using a single quantum query.",
    formula: "1 query vs 2^(n-1)+1 classical",
    timeComplexity: "O(1) quantum queries",
    spaceComplexity: "O(n)",
    
    reference: "https://doi.org/10.1098/rspa.1992.0167",
    category: "Search",
    parameters: [
      { name: "Number of Qubits", type: "number", default: 3, min: 1, max: 10 },
      { name: "Function Type", type: "select", options: ["Constant", "Balanced"], default: "Balanced" },
    ],
  },
  {
    id: "quantum-teleportation",
    name: "Quantum Teleportation",
    shortDescription: "Transfers a quantum state using entanglement and classical bits.",
    description:
      "Quantum teleportation transmits the exact quantum state of a qubit from one location to another, using a shared entangled pair and two classical bits of communication.",
    formula: "|ψ⟩ = α|0⟩ + β|1⟩ → teleported via Bell measurement",
    timeComplexity: "O(1)",
    spaceComplexity: "O(1)",
    reference: "https://doi.org/10.1103/PhysRevLett.70.1895",
    category: "Cryptography",
    parameters: [
      { name: "Alpha (real)", type: "number", default: 0.6, min: 0, max: 1, step: 0.1 },
      { name: "Beta (real)", type: "number", default: 0.8, min: 0, max: 1, step: 0.1 },
    ],
  },
  {
    id: "qft",
    name: "Quantum Fourier Transform",
    shortDescription: "Quantum analog of the discrete Fourier transform.",
    description:
      "The QFT maps computational basis states to their frequency-domain representation. It is a key subroutine in Shor's algorithm and quantum phase estimation.",
    formula: "QFT|j⟩ = (1/√N) Σₖ e^(2πijk/N) |k⟩",
    timeComplexity: "O(n²) vs O(n·2ⁿ) classical",
    spaceComplexity: "O(n)",
    
    reference: "https://arxiv.org/abs/quant-ph/0201067",
    category: "Transform",
    parameters: [
      { name: "Number of Qubits", type: "number", default: 4, min: 1, max: 15 },
      { name: "Input State", type: "text", default: "0101", placeholder: "e.g. 0101" },
    ],
  },
  {
    id: "shor",
    name: "Shor's Algorithm",
    shortDescription: "Factors integers in polynomial time on a quantum computer.",
    description:
      "Shor's algorithm efficiently factors large integers, threatening RSA encryption. It uses quantum period-finding via QFT.",
    formula: "O((log N)³) with quantum period finding",
    timeComplexity: "O((log N)³)",
    spaceComplexity: "O(log N)",
    reference: "https://arxiv.org/abs/quant-ph/9508027",
    category: "Factoring",
    parameters: [
      { name: "Number to Factor", type: "number", default: 15, min: 2, max: 10000 },
      { name: "Attempts", type: "number", default: 5, min: 1, max: 50 },
    ],
  },
  {
    id: "simon",
    name: "Simon's Algorithm",
    shortDescription: "Finds hidden period of a function with exponential speedup.",
    description:
      "Simon's algorithm finds a hidden period s in a 2-to-1 function with exponential speedup over classical algorithms.",
    formula: "O(n) quantum queries vs O(2^(n/2)) classical",
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
    reference: "https://doi.org/10.1137/S0097539796298637",
    category: "Cryptography",
    parameters: [
      { name: "Number of Qubits", type: "number", default: 3, min: 2, max: 10 },
      { name: "Secret String", type: "text", default: "110", placeholder: "e.g. 110" },
    ],
  },
  {
    id: "bernstein-vazirani",
    name: "Bernstein-Vazirani Algorithm",
    shortDescription: "Finds hidden string in a linear function with one query.",
    description:
      "The Bernstein-Vazirani algorithm determines the hidden string s in f(x) = s·x mod 2 using a single quantum query.",
    formula: "f(x) = s·x mod 2 → find s in 1 query",
    timeComplexity: "O(1) quantum queries",
    spaceComplexity: "O(n)",
    
    reference: "https://doi.org/10.1137/S0097539796300921",
    category: "Cryptography",
    parameters: [
      { name: "Number of Qubits", type: "number", default: 4, min: 1, max: 12 },
      { name: "Secret String", type: "text", default: "1011", placeholder: "e.g. 1011" },
    ],
  },
  {
    id: "quantum-phase-estimation",
    name: "Quantum Phase Estimation",
    shortDescription: "Estimates the eigenvalue phase of a unitary operator.",
    description:
      "QPE estimates the phase θ in U|ψ⟩ = e^(2πiθ)|ψ⟩. It is fundamental to Shor's algorithm and quantum chemistry simulations.",
    formula: "U|ψ⟩ = e^(2πiθ)|ψ⟩ → estimate θ to n bits",
    timeComplexity: "O(n²) for n-bit precision",
    spaceComplexity: "O(n)",
    
    reference: "https://arxiv.org/abs/quant-ph/9511026",
    category: "Transform",
    parameters: [
      { name: "Precision Qubits", type: "number", default: 4, min: 1, max: 12 },
      { name: "Phase (θ)", type: "number", default: 0.25, min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    id: "superdense-coding",
    name: "Superdense Coding",
    shortDescription: "Transmit two classical bits using one qubit.",
    description: "Superdense coding is a quantum communication protocol to communicate two classical bits of information by only transmitting one qubit, given a pre-shared entangled pair.",
    formula: "1 Qubit ➔ 2 Classical Bits",
    timeComplexity: "O(1)",
    spaceComplexity: "O(1)",
    reference: "https://doi.org/10.1103/PhysRevLett.69.2881",
    category: "Cryptography",
    parameters: [
      { name: "message (2 bits)", type: "select", options: ["00", "01", "10", "11"], default: "10" },
    ],
  },
  {
    id: "vqe",
    name: "Variational Quantum Eigensolver (VQE)",
    shortDescription: "Hybrid algorithm to find ground state energies.",
    description: "VQE is a hybrid quantum-classical algorithm that uses a variational technique to find the minimum eigenvalue of the Hamiltonian of a given system.",
    formula: "min_θ ⟨ψ(θ)|H|ψ(θ)⟩ ≥ E_0",
    timeComplexity: "O(poly(N)) per iteration",
    spaceComplexity: "O(N)",
    
    reference: "https://doi.org/10.1038/ncomms5213",
    category: "Simulation",
    parameters: [
      { name: "Molecule", type: "select", options: ["H2", "LiH", "BeH2"], default: "H2" },
      { name: "Max Iterations", type: "number", default: 100, min: 10, max: 1000 },
    ],
  },
  {
    id: "bb84",
    name: "BB84 Protocol",
    shortDescription: "Provably secure quantum key distribution.",
    description: "BB84 provides a secure way to distribute a private key over an insecure channel by utilizing quantum states (photons) and the no-cloning theorem.",
    formula: "Key distribution using non-orthogonal bases",
    timeComplexity: "O(N) for N bits",
    spaceComplexity: "O(1)",
    reference: "https://doi.org/10.1016/j.tcs.2014.05.025",
    category: "Cryptography",
    parameters: [
      { name: "Number of Bits", type: "number", default: 10, min: 1, max: 100 },
    ],
  }
];

module.exports = algorithms;
