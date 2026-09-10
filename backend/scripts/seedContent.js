const mongoose = require("mongoose");
const path = require("path");
const News = require("../models/News");
const Blog = require("../models/Blog");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const newsItems = [
  { 
    title: "IBM Unveils 1000+ Qubit Processor", 
    source: "Nature", 
    date: "2026-02-15", 
    tag: "Hardware", 
    excerpt: "IBM's latest quantum processor marks a significant leap towards utility-scale quantum computing.",
    content: "<p>IBM has officially announced its new 1000+ qubit processor, shattering previous records and paving the way for fault-tolerant quantum computing.</p><p>This processor utilizes a novel coupling mechanism to significantly reduce crosstalk between neighboring qubits, which has been a major bottleneck in scaling up quantum hardware. According to the lead researcher, 'This is not just an incremental step; it is a fundamental shift in how we architect superconducting circuits.'</p><p>The community is eagerly waiting to see benchmarks on standard quantum volume metrics.</p>"
  },
  { 
    title: "Google Achieves Quantum Error Correction Milestone", 
    source: "Science", 
    date: "2026-03-10", 
    tag: "Research", 
    excerpt: "Researchers successfully demonstrate logical qubits that outlive their physical counterparts.",
    content: "<p>In a landmark paper published in Science, Google's Quantum AI team demonstrated the successful implementation of a surface code error correction scheme where a logical qubit outperformed its constituent physical qubits.</p><p>By scaling from a distance-3 to a distance-5 surface code, the team showed a measurable decrease in the logical error rate. This proves the foundational tenet of quantum error correction: that larger codes can suppress errors exponentially.</p>"
  },
  { 
    title: "India Launches National Quantum Mission Phase II", 
    source: "DST", 
    date: "2026-04-05", 
    tag: "Policy", 
    excerpt: "The government allocates new funds to accelerate domestic quantum capabilities.",
    content: "<p>The Department of Science and Technology (DST) has officially launched Phase II of the National Quantum Mission (NQM) with an increased budget allocation of ₹8,000 Crores over the next five years.</p><p>The focus of Phase II will be on transitioning laboratory prototypes into deployable field technologies. Key areas of investment include Quantum Key Distribution (QKD) networks across major metropolitan cities, development of indigenous cryogenic components, and fostering a startup ecosystem around quantum software.</p>"
  },
  { 
    title: "Quantum Computing Market to Reach $125B by 2030", 
    source: "McKinsey", 
    date: "2026-05-20", 
    tag: "Industry", 
    excerpt: "A new report predicts explosive growth in the commercial quantum computing sector.",
    content: "<p>A comprehensive report by McKinsey & Company forecasts that the quantum computing market will grow to an astounding $125 billion by 2030.</p><p>The growth is driven by early adopters in the pharmaceutical, materials science, and financial sectors who are beginning to see viable use cases for NISQ-era hardware. The report highlights that the primary value driver will be the optimization of complex supply chains and the discovery of novel chemical compounds.</p>"
  },
  { 
    title: "New Quantum Algorithm Breaks Optimization Records", 
    source: "arXiv", 
    date: "2026-06-12", 
    tag: "Algorithm", 
    excerpt: "A novel approach to QAOA shows unprecedented performance on complex graphs.",
    content: "<p>A preprint on arXiv introduces a modified version of the Quantum Approximate Optimization Algorithm (QAOA) that incorporates dynamic parameter initialization. The researchers tested the algorithm on the MaxCut problem for dense, non-regular graphs.</p><p>The results show a 40% improvement in the approximation ratio compared to standard QAOA with the same circuit depth. This suggests that near-term quantum devices might be much closer to demonstrating quantum advantage in combinatorial optimization than previously thought.</p>"
  },
  { 
    title: "DRDO Deploys Quantum Key Distribution Network", 
    source: "DRDO", 
    date: "2026-07-02", 
    tag: "Defence", 
    excerpt: "Secure communication links powered by quantum entanglement are now operational.",
    content: "<p>The Defence Research and Development Organisation (DRDO) has successfully deployed a multi-node Quantum Key Distribution (QKD) network connecting critical defense establishments.</p><p>The network relies on entanglement-based protocols to generate unconditionally secure encryption keys. Any attempt by an eavesdropper to intercept the quantum channel introduces measurable disturbances, instantly alerting the communicating parties. This milestone marks a significant upgrade in national security infrastructure.</p>"
  },
];

const blogPosts = [
  { 
    title: "Understanding Quantum Superposition", 
    excerpt: "A deep dive into one of the most fundamental concepts in quantum mechanics and how it enables quantum computing.", 
    readTime: "8 min", 
    category: "Fundamentals",
    date: "2026-07-01",
    author: "Dr. Alice",
    content: "Quantum superposition is a fundamental principle of quantum mechanics. It states that, much like waves in classical physics, any two (or more) quantum states can be added together ('superposed') and the result will be another valid quantum state; and conversely, that every quantum state can be represented as a sum of two or more other distinct states. In the context of quantum computing, a qubit can exist in a superposition of both 0 and 1 simultaneously until it is measured."
  },
  { 
    title: "Grover's Algorithm Explained", 
    excerpt: "How Grover's search algorithm achieves quadratic speedup and its practical applications in database search.", 
    readTime: "12 min", 
    category: "Algorithms",
    date: "2026-07-05",
    author: "Bob Quantum",
    content: "Grover's algorithm is a quantum algorithm that finds with high probability the unique input to a black box function that produces a particular output value, using just O(√N) evaluations of the function, where N is the size of the function's domain. It demonstrates a quadratic speedup over the best possible classical algorithm, which requires O(N) evaluations. This makes it highly significant for unstructured database search and brute-forcing cryptographic hashes."
  },
  { 
    title: "The Future of Quantum Cryptography", 
    excerpt: "How quantum key distribution protocols like BB84 are reshaping the landscape of secure communications.", 
    readTime: "10 min", 
    category: "Cryptography",
    date: "2026-07-10",
    author: "Eve Hacker",
    content: "Quantum cryptography uses the principles of quantum mechanics to encrypt data and transmit it in a way that cannot be hacked. The most prominent application is Quantum Key Distribution (QKD), like the BB84 protocol. It allows two parties to produce a shared random secret key known only to them, which can then be used to encrypt and decrypt messages. The security relies on the fundamental laws of physics, specifically the fact that measuring a quantum state disturbs it, making any eavesdropping detectable."
  },
  { 
    title: "NISQ Era: What Can We Do Today?", 
    excerpt: "Exploring the capabilities and limitations of Noisy Intermediate-Scale Quantum computers in the current era.", 
    readTime: "15 min", 
    category: "Industry",
    date: "2026-07-12",
    author: "Charlie Q.",
    content: "We are currently in the Noisy Intermediate-Scale Quantum (NISQ) era. 'Intermediate-Scale' refers to the size of quantum computers available today, which have 50 to a few hundred qubits. 'Noisy' highlights that we do not yet have enough qubits to implement full quantum error correction. Despite the noise, researchers are actively exploring hybrid quantum-classical algorithms, such as VQE and QAOA, to find near-term applications in chemistry, materials science, and optimization."
  },
  { 
    title: "Variational Quantum Algorithms", 
    excerpt: "VQE, VQC, and QAOA — hybrid quantum-classical algorithms pushing the boundaries of quantum advantage.", 
    readTime: "11 min", 
    category: "Research",
    date: "2026-07-15",
    author: "Dr. Alice",
    content: "Variational Quantum Algorithms (VQAs) are the flagship algorithms for NISQ devices. They use a parameterized quantum circuit (an ansatz) whose parameters are optimized by a classical optimizer to minimize a cost function. Examples include the Variational Quantum Eigensolver (VQE) used for finding the ground state energy of molecules, and the Quantum Approximate Optimization Algorithm (QAOA) for solving combinatorial optimization problems. VQAs are resilient to certain types of noise, making them practical today."
  },
  { 
    title: "Quantum Machine Learning", 
    excerpt: "How quantum computing is transforming machine learning with exponential speedups in specific problem domains.", 
    readTime: "9 min", 
    category: "ML",
    date: "2026-07-20",
    author: "ML Scientist",
    content: "Quantum Machine Learning (QML) lies at the intersection of quantum computing and machine learning. It explores how quantum algorithms can improve classical machine learning methods, and conversely, how classical ML can help optimize quantum circuits. Key areas of interest include quantum support vector machines, quantum neural networks, and quantum principal component analysis. While true quantum advantage in ML is still being researched, the potential for exponential speedups in processing high-dimensional data is incredibly promising."
  },
];

async function seedContent() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for Seeding Content");

    // Clear existing
    await News.deleteMany({});
    await Blog.deleteMany({});
    console.log("Cleared existing News and Blogs.");

    // Insert News
    await News.insertMany(newsItems);
    console.log(`Seeded ${newsItems.length} News Items.`);

    // Insert Blogs
    await Blog.insertMany(blogPosts);
    console.log(`Seeded ${blogPosts.length} Blog Posts.`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding content:", error);
    process.exit(1);
  }
}

seedContent();
