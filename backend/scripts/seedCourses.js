/**
 * Seeds the Courses collection with real, freely-licensed educational content
 * from the official IBM/Qiskit YouTube channel — "Understanding Quantum
 * Information & Computation" (taught by John Watrous, IBM Quantum's
 * Technical Director of Education) and the "Coding with Qiskit" series.
 *
 * Run with: node backend/scripts/seedCourses.js
 */
const mongoose = require("mongoose");
const path = require("path");
const Course = require("../models/Course");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const courses = [
  {
    title: "Quantum Computing Fundamentals",
    description:
      "Start here. A rigorous but accessible introduction to qubits, superposition, measurement, multi-qubit systems, and quantum circuits — taught by John Watrous, IBM Quantum's Technical Director of Education. No prior quantum physics background required, just basic linear algebra.",
    instructor: "John Watrous (IBM Quantum)",
    lectures: [
      { title: "Course Overview", videoUrl: "https://www.youtube.com/watch?v=0Av89fZenSY", duration: "8 min" },
      { title: "Lesson 1: Single Systems", videoUrl: "https://www.youtube.com/watch?v=3-c4xJa7Flk", duration: "45 min" },
      { title: "Lesson 2: Multiple Systems", videoUrl: "https://www.youtube.com/watch?v=DfZZS8Spe7U", duration: "50 min" },
      { title: "Lesson 3: Quantum Circuits", videoUrl: "https://www.youtube.com/watch?v=30U2DTfIrOU", duration: "48 min" },
      { title: "Lesson 4: Entanglement in Action", videoUrl: "https://www.youtube.com/watch?v=GSsElSQgMbU", duration: "55 min" },
    ],
  },
  {
    title: "Quantum Algorithms",
    description:
      "Once you understand circuits and entanglement, this module builds up to the algorithms that give quantum computers their edge: query algorithms, the algorithmic foundations behind quantum speedups, phase estimation, Shor's factoring algorithm, and Grover's search.",
    instructor: "John Watrous (IBM Quantum)",
    lectures: [
      { title: "Lesson 5: Quantum Query Algorithms", videoUrl: "https://www.youtube.com/watch?v=2wticzHE1vs", duration: "52 min" },
      { title: "Lesson 6: Algorithmic Foundations", videoUrl: "https://www.youtube.com/watch?v=2wxxvwRGANQ", duration: "47 min" },
      { title: "Lesson 7: Phase Estimation and Factoring", videoUrl: "https://www.youtube.com/watch?v=4nT0BTUxhJY", duration: "58 min" },
      { title: "Lesson 8: Grover's Algorithm", videoUrl: "https://www.youtube.com/watch?v=hnpjC8WQVrQ", duration: "50 min" },
    ],
  },
  {
    title: "Coding with Qiskit",
    description:
      "Hands-on programming for quantum computers. Learn to write your first Qiskit program, build and run circuits with Qiskit Primitives, and work with dynamic circuits — the same skills you'll use in this platform's Sandbox and Circuit Simulator.",
    instructor: "IBM Quantum Team",
    lectures: [
      { title: "Hello World — Your First Qiskit Program", videoUrl: "https://www.youtube.com/watch?v=93-zLTppFZw", duration: "12 min" },
      { title: "Introduction to Qiskit 1.x", videoUrl: "https://www.youtube.com/watch?v=Tk9LOL9--Y4", duration: "18 min" },
      { title: "Run Quantum Circuits with Qiskit Primitives", videoUrl: "https://www.youtube.com/watch?v=NTplT4WnNbk", duration: "15 min" },
      { title: "Dynamic Circuits", videoUrl: "https://www.youtube.com/watch?v=QDPtcwhpQkE", duration: "14 min" },
    ],
  },
  {
    title: "Advanced Quantum Information Theory",
    description:
      "The general formulation of quantum information — density matrices for mixed states, quantum channels as the most general physical operations, and general (POVM) measurements. Continues directly from the Fundamentals module for learners ready to go deeper into the math.",
    instructor: "John Watrous (IBM Quantum)",
    lectures: [
      { title: "Lesson 9: Density Matrices", videoUrl: "https://www.youtube.com/watch?v=CeK9ry8G8HQ", duration: "54 min" },
      { title: "Lesson 10: Quantum Channels", videoUrl: "https://www.youtube.com/watch?v=cMl-xIDSmXI", duration: "56 min" },
      { title: "Lesson 11: General Measurements", videoUrl: "https://www.youtube.com/watch?v=Xi9YTYzQErY", duration: "49 min" },
    ],
  },
  {
    title: "Near-Term & Variational Quantum Algorithms",
    description:
      "The algorithms that actually run on today's noisy quantum hardware. Learn the Variational Quantum Eigensolver (VQE) for chemistry and optimization problems, then see how QAOA circuits get tuned for real hardware constraints.",
    instructor: "IBM Quantum Team",
    lectures: [
      { title: "What Is the Variational Quantum Eigensolver? (VQE Explained)", videoUrl: "https://www.youtube.com/watch?v=DUq-0r-Prw0", duration: "10 min" },
      { title: "The Variational Quantum Eigensolver — Coding with Qiskit S2E4", videoUrl: "https://www.youtube.com/watch?v=Z-A6G0WVI9w", duration: "16 min" },
      { title: "Optimizing QAOA Circuits for Hardware", videoUrl: "https://www.youtube.com/watch?v=rBfK-l-qSNk", duration: "20 min" },
    ],
  },
];

async function seedCourses() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding Courses");

    // Upsert by title so re-running this script is safe and doesn't orphan
    // existing UserProgress.courseProgress references (which point to Course._id).
    for (const course of courses) {
      await Course.findOneAndUpdate({ title: course.title }, course, { upsert: true, new: true });
    }
    console.log(`Upserted ${courses.length} courses with ${courses.reduce((s, c) => s + c.lectures.length, 0)} lectures total.`);

    process.exit(0);
  } catch (error) {
    console.error("Error seeding courses:", error);
    process.exit(1);
  }
}

seedCourses();
