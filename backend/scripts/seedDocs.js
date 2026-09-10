const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Doc = require("../models/Doc");

const docsData = [
  {
    title: "Introduction to Qiskit",
    section: "Documentation",
    content: `<p>Welcome to the documentation for <strong>Qiskit</strong>, its related packages, and IBM Quantum Platform. This documentation includes how-to guides to get you started on our tools, specific use-case tutorials that include end-to-end examples, and a collection of API references.</p>
<p>Qiskit provides a modular and extensible framework for quantum research and development across algorithms, high-performance computing, and quantum information science. With it, researchers can build, optimize, and execute quantum workflows with specialized addons, software tools, and extensive resources. Through IBM Quantum Platform, users can access quantum compute services, such as Qiskit Runtime and the Qiskit Functions Catalog, to run workloads efficiently on the IBM fleet of quantum computers.</p>
<h3>What is Qiskit?</h3>
<p>Qiskit is an open-source SDK for working with quantum computers at the level of pulses, circuits, and application modules. It accelerates the development of quantum applications by providing the complete set of tools needed for interacting with quantum systems and simulators.</p>`
  },
  {
    title: "Installation",
    section: "Documentation",
    content: `<p>For a more detailed introduction to installing the Qiskit SDK, check out the installation page. If you're ready to install it now, simply run:</p>
<pre><code class="language-bash">pip install qiskit</code></pre>
<h3>Benchmarking and the Benchpress package</h3>
<p>Benchmarking is important for comparing the relative performance of quantum software across different stages of a development workflow. Benchmarking tests for quantum software might, for example, look at the speed and quality of building, manipulating, and transpiling circuits.</p> 
<p>IBM Quantum is committed to delivering the most performant SDK possible, and to that end, the Qiskit SDK is benchmarked using over 1,000 tests developed by leading universities, national labs, and researchers at IBM. The benchmarking suite used for these tests, named Benchpress, is now available as an open-source package. You can now use the Benchpress package to perform your own analysis of quantum SDK performance.</p>`
  },
  {
    title: "Quickstart",
    section: "Documentation",
    content: `<p>Get started with Qiskit in just a few minutes. This guide will walk you through creating your first quantum circuit, simulating it, and plotting the results.</p>
<h3>1. Build a Quantum Circuit</h3>
<p>A quantum circuit is the primary unit of computation in Qiskit. It represents a sequence of quantum gates, measurements, and other operations.</p>
<pre><code class="language-python">from qiskit import QuantumCircuit

# Create a circuit with 2 qubits and 2 classical bits
qc = QuantumCircuit(2, 2)
qc.h(0)           # Add a Hadamard gate to qubit 0
qc.cx(0, 1)       # Add a CNOT gate on control qubit 0 and target qubit 1
qc.measure([0,1], [0,1]) # Measure both qubits</code></pre>
<h3>2. Simulate the Circuit</h3>
<p>To see the results of our circuit without using a real quantum computer, we use a simulator provided by <code>qiskit-aer</code>.</p>
<pre><code class="language-python">from qiskit_aer import AerSimulator
from qiskit import transpile

sim = AerSimulator()
compiled_circuit = transpile(qc, sim)
result = sim.run(compiled_circuit, shots=1000).result()
counts = result.get_counts()
print(counts)</code></pre>
<p>You will see output approximately like <code>{'00': 500, '11': 500}</code>, which is the famous Bell State (entanglement).</p>`
  },
  {
    title: "Overview",
    section: "Qiskit",
    subsection: "Circuits and Operators",
    content: `<p>The <code>qiskit.circuit</code> module provides the foundational classes for constructing quantum circuits and defining quantum operators.</p>
<h3>Quantum Gates</h3>
<p>A quantum gate is a basic quantum circuit operating on a small number of qubits. They are the building blocks of quantum circuits, analogous to classical logic gates.</p>
<table>
<thead><tr><th>Gate</th><th>Description</th><th>Matrix Size</th></tr></thead>
<tbody>
<tr><td>X (Pauli-X)</td><td>Bit-flip (Quantum NOT)</td><td>2x2</td></tr>
<tr><td>Y (Pauli-Y)</td><td>Bit and Phase flip</td><td>2x2</td></tr>
<tr><td>Z (Pauli-Z)</td><td>Phase flip</td><td>2x2</td></tr>
<tr><td>H (Hadamard)</td><td>Creates Superposition</td><td>2x2</td></tr>
<tr><td>CX (CNOT)</td><td>Controlled-NOT</td><td>4x4</td></tr>
</tbody>
</table>
<h3>Creating Custom Operators</h3>
<p>You can also define your own unitary operators using numpy matrices and apply them to circuits:</p>
<pre><code class="language-python">from qiskit.quantum_info import Operator
import numpy as np

# Define a custom X gate
custom_x = Operator([
    [0, 1],
    [1, 0]
])</code></pre>`
  },
  {
    title: "Introduction to transpilation",
    section: "Qiskit",
    subsection: "Transpilation",
    content: `<p>Transpilation is the process of rewriting a given input circuit to match the topology of a specific quantum device, and/or to optimize the circuit for execution on noisy quantum systems.</p>
<h3>Why Transpile?</h3>
<p>Real quantum computers have physical constraints:</p>
<ol>
<li><strong>Limited Connectivity:</strong> Not all qubits are physically connected to each other. If you want to apply a 2-qubit gate between unconnected qubits, the transpiler must insert SWAP gates.</li>
<li><strong>Basis Gates:</strong> Hardware only natively supports a small set of gates (e.g. <code>RZ</code>, <code>SX</code>, <code>X</code>, <code>CX</code>). Any other gate must be decomposed into these basis gates.</li>
</ol>
<h3>The Transpile Function</h3>
<pre><code class="language-python">from qiskit import transpile
from qiskit.providers.fake_provider import GenericBackendV2

# Create a fake 5-qubit backend
backend = GenericBackendV2(num_qubits=5)

# Transpile the circuit for this specific backend
transpiled_qc = transpile(qc, backend=backend, optimization_level=3)</code></pre>
<p>Higher optimization levels take more time but usually result in shorter circuits with fewer errors.</p>`
  },
  {
    title: "Circuit Library",
    section: "Qiskit",
    subsection: "Circuits and Operators",
    content: `<p>The <code>qiskit.circuit.library</code> module provides a rich collection of valuable circuits, gates, and standard operations used in quantum computing. Instead of building common algorithms from scratch, you can import pre-built components.</p>
<h3>Common Library Components</h3>
<ul>
<li><strong>Standard Gates:</strong> Basic gates like <code>XGate</code>, <code>HGate</code>, and parameterized gates like <code>RXGate</code>.</li>
<li><strong>State Preparation:</strong> Circuits for creating specific quantum states.</li>
<li><strong>N-local Circuits:</strong> Heuristic ansatzes like <code>RealAmplitudes</code> and <code>EfficientSU2</code> commonly used in VQE and quantum machine learning.</li>
<li><strong>Arithmetic Circuits:</strong> Circuits for quantum arithmetic, such as adders and multipliers.</li>
</ul>
<pre><code class="language-python">from qiskit.circuit.library import QuantumVolume, QFT
# Create a 4-qubit Quantum Fourier Transform circuit
qft_circuit = QFT(num_qubits=4)</code></pre>`
  },
  {
    title: "Save circuits to disk",
    section: "Qiskit",
    subsection: "Circuits and Operators",
    content: `<p>Saving circuits to disk is crucial for pausing workflows, sharing research, or logging results. Qiskit supports saving circuits natively using the <strong>QPY</strong> format, which is highly optimized and securely serializes Qiskit circuits.</p>
<h3>Using QPY</h3>
<pre><code class="language-python">from qiskit import qpy

# Save to disk
with open('my_circuit.qpy', 'wb') as f:
    qpy.dump(qc, f)

# Load from disk
with open('my_circuit.qpy', 'rb') as f:
    loaded_qc = qpy.load(f)[0]</code></pre>
<p>You can also export to standard formats like OpenQASM 2.0 or 3.0 using <code>qiskit.qasm2</code> or <code>qiskit.qasm3</code>, though QPY is recommended for strict Qiskit-to-Qiskit serialization.</p>`
  },
  {
    title: "Measure qubits",
    section: "Qiskit",
    subsection: "Circuits and Operators",
    content: `<p>Measurement is how we extract classical information from a quantum system. In Qiskit, the <code>measure</code> instruction collapses the quantum state of a qubit and stores the result (0 or 1) in a classical bit.</p>
<h3>Measurement Techniques</h3>
<p>You can measure specific qubits individually, or use a helper function to measure everything at once.</p>
<pre><code class="language-python"># Measure individual qubits
qc.measure(0, 0) # Measure Qubit 0 into Classical Bit 0

# Measure all qubits at once and create a new classical register
qc.measure_all()</code></pre>
<p><em>Note:</em> Typically, measurements are added at the very end of a circuit, as measuring a qubit destroys its superposition and entanglement.</p>`
  },
  {
    title: "Operators",
    section: "Qiskit",
    subsection: "Circuits and Operators",
    content: `<p>The <code>qiskit.quantum_info</code> module provides classes for defining and manipulating quantum operators, states, and channels. Operators are mathematically represented as unitary matrices or Pauli strings.</p>
<h3>Working with Paulis and SparsePauliOp</h3>
<p>For algorithms like VQE, observables are often defined as sums of Pauli operators. Qiskit handles this efficiently using <code>SparsePauliOp</code>.</p>
<pre><code class="language-python">from qiskit.quantum_info import SparsePauliOp

# Define a Hamiltonian: 2.0 * ZZ - 1.5 * IX
observable = SparsePauliOp.from_list([
    ("ZZ", 2.0),
    ("IX", -1.5)
])
print(observable)</code></pre>
<p>You can also convert standard circuits into Operator objects to examine their underlying unitary matrix representation.</p>`
  },
  {
    title: "Advanced circuit building",
    section: "Qiskit",
    subsection: "Circuits and Operators",
    content: `<p>Advanced circuit building in Qiskit involves dynamic circuits, control flow (like if-else statements executing directly on quantum hardware), and parameterized circuits.</p>
<h3>Parameterized Circuits</h3>
<p>Instead of hardcoding angles for rotational gates, you can use <code>Parameter</code> objects. This is heavily used in Variational Quantum Algorithms where a classical optimizer updates the parameters iteratively without needing to rebuild the circuit.</p>
<pre><code class="language-python">from qiskit.circuit import Parameter, QuantumCircuit

theta = Parameter('θ')
qc = QuantumCircuit(1)
qc.rx(theta, 0)

# Bind the parameter to a specific value later
bound_qc = qc.assign_parameters({theta: 3.14 / 2})</code></pre>`
  },
  {
    title: "Transpiler stages",
    section: "Qiskit",
    subsection: "Transpilation",
    content: `<p>The transpilation process in Qiskit is divided into multiple stages, each handled by specific transpiler passes. Understanding these stages helps you debug and optimize your workflows.</p>
<ol>
<li><strong>Init:</strong> Unrolls custom instructions and prepares the circuit for hardware-specific optimizations.</li>
<li><strong>Layout:</strong> Assigns virtual qubits in your circuit to physical qubits on the backend hardware (mapping).</li>
<li><strong>Routing:</strong> Inserts SWAP gates to ensure all multi-qubit gates obey the hardware's connectivity constraints.</li>
<li><strong>Translation:</strong> Decomposes all gates into the native basis gates supported by the backend.</li>
<li><strong>Optimization:</strong> Simplifies the circuit by canceling redundant gates (e.g., two consecutive X gates) and optimizing block operations.</li>
<li><strong>Scheduling:</strong> Optionally assigns precise timing to gates for pulse-level control.</li>
</ol>`
  },
  {
    title: "Transpile with pass managers",
    section: "Qiskit",
    subsection: "Transpilation",
    content: `<p>While the <code>transpile()</code> function is great for general use, <strong>Pass Managers</strong> give you fine-grained control over the transpilation pipeline. A Pass Manager is a customizable collection of transpiler passes.</p>
<pre><code class="language-python">from qiskit.transpiler import PassManager
from qiskit.transpiler.passes import Unroller, Optimize1qGatesDecomposition

# Create a custom pass manager
pm = PassManager()
pm.append(Unroller(['u3', 'cx']))
pm.append(Optimize1qGatesDecomposition(['u3', 'cx']))

# Apply it to a circuit
optimized_qc = pm.run(qc)</code></pre>
<p>This allows researchers to insert their own custom optimization passes or skip standard passes that might interfere with specific experiments.</p>`
  },
  {
    title: "Create a pass manager for dynamic decoupling",
    section: "Qiskit",
    subsection: "Transpilation",
    content: `<p>Dynamic Decoupling is an error mitigation technique that inserts sequences of idle gates (like sequences of X gates) into qubits while they are waiting. This helps protect the qubit state from decoherence.</p>
<h3>Implementing Dynamical Decoupling</h3>
<p>You can create a pass manager that schedules your circuit and then pads the idle times with decoupling sequences.</p>
<pre><code class="language-python">from qiskit.transpiler import PassManager, InstructionDurations
from qiskit.transpiler.passes import ALAPScheduleAnalysis, PadDynamicalDecoupling
from qiskit.circuit.library import XGate

durations = InstructionDurations.from_backend(backend)
dd_sequence = [XGate(), XGate()]

pm = PassManager([
    ALAPScheduleAnalysis(durations),
    PadDynamicalDecoupling(durations, dd_sequence)
])
dd_circuit = pm.run(transpiled_qc)</code></pre>`
  },
  {
    title: "Configure preset pass managers",
    section: "Qiskit",
    subsection: "Transpilation",
    content: `<p>Qiskit provides factory functions to quickly generate preset pass managers tailored to specific backends and optimization levels. This is exactly what the <code>transpile()</code> function uses under the hood.</p>
<pre><code class="language-python">from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager

# Generate a pass manager for optimization level 3
pm = generate_preset_pass_manager(optimization_level=3, backend=backend)

# Execute the pass manager
transpiled_qc = pm.run(qc)</code></pre>
<p>Using <code>generate_preset_pass_manager</code> is recommended for Qiskit Runtime workflows, as it prepares circuits precisely for ISA (Instruction Set Architecture) execution.</p>`
  },
  {
    title: "Compare transpiler settings",
    section: "Qiskit",
    subsection: "Transpilation",
    content: `<p>The <code>optimization_level</code> argument in the transpiler drastically changes the output. Here is a comparison of what each level does:</p>
<ul>
<li><strong>Level 0:</strong> No optimization. Only layout, routing, and translation are performed. Useful for characterization experiments where you want exact circuit execution.</li>
<li><strong>Level 1:</strong> Light optimization. Merges adjacent gates. Good balance of speed and optimization.</li>
<li><strong>Level 2:</strong> Medium optimization. Uses more intensive mapping algorithms and gate cancellation techniques.</li>
<li><strong>Level 3:</strong> Heavy optimization. Uses unitary synthesis, aggressive SWAP mapping, and takes the longest time to compile, but produces the shallowest possible circuit for hardware execution.</li>
</ul>`
  },
  {
    title: "Advanced transpilation resources",
    section: "Qiskit",
    subsection: "Transpilation",
    content: `<p>For users looking to build their own compilation strategies, Qiskit's transpiler is highly extensible. You can write your own Transformation Passes and Analysis Passes by subclassing <code>TransformationPass</code> or <code>AnalysisPass</code>.</p>
<p>Additionally, Qiskit supports routing plugins (like SABRE) and synthesis plugins. By interfacing directly with the DAG (Directed Acyclic Graph) representation of the quantum circuit, advanced users can implement custom logic for error mitigation, cross-talk avoidance, or entirely new routing heuristics.</p>`
  },
  {
    title: "Introduction to primitives",
    section: "Qiskit",
    subsection: "Primitives",
    content: `<p><strong>Primitives</strong> are the standard interface for executing quantum programs in Qiskit. Instead of just returning raw counts, Primitives abstract away the complexity of hardware execution and error mitigation, returning highly consumable data types.</p>
<p>There are two core Primitives:</p>
<ol>
<li><strong>Sampler:</strong> Yields quasi-probabilities and bitstring distributions from quantum circuits. Ideal for algorithms like Grover's or Shor's.</li>
<li><strong>Estimator:</strong> Calculates the expectation value of observables (like a Hamiltonian) given a parameterized circuit. Ideal for VQE and QAOA.</li>
</ol>`
  },
  {
    title: "Primitive inputs and outputs",
    section: "Qiskit",
    subsection: "Primitives",
    content: `<p>With the release of Qiskit Primitives V2, interactions are structured around <strong>PUBs (Primitive Unified Blocs)</strong>. A PUB bundles all the necessary inputs for a single execution task.</p>
<h3>Sampler Inputs</h3>
<p>A Sampler PUB consists of: <code>(Circuit, Parameter_Values, Shots)</code>. It outputs a <code>PrimitiveResult</code> containing <code>PubResult</code> objects with bitstring counts and metadata.</p>
<h3>Estimator Inputs</h3>
<p>An Estimator PUB consists of: <code>(Circuit, Observables, Parameter_Values, Precision)</code>. It outputs expectation values (e.g., the estimated energy of a molecule) and associated variances.</p>`
  },
  {
    title: "Get started with the backend primitives",
    section: "Qiskit",
    subsection: "Primitives",
    content: `<p>Backend Primitives are wrappers that allow you to run the V2 Primitive interface directly on local simulators or specific hardware backends.</p>
<pre><code class="language-python">from qiskit_ibm_runtime import SamplerV2 as Sampler

# Assuming you have a backend object from IBM Provider
sampler = Sampler(mode=backend)
job = sampler.run([(qc,)])
result = job.result()

# Extract data for the first PUB
pub_result = result[0]
print(pub_result.data.meas.get_counts())</code></pre>
<p>Using Backend Primitives ensures your code remains consistent whether you are testing locally or deploying to IBM Cloud hardware.</p>`
  },
  {
    title: "Exact simulation with Qiskit SDK primitives",
    section: "Qiskit",
    subsection: "Primitives",
    content: `<p>If you need exact, noise-free expectation values or probabilities for debugging algorithmic logic, Qiskit provides reference implementations of the Primitives built into the <code>qiskit.primitives</code> module.</p>
<pre><code class="language-python">from qiskit.primitives import StatevectorEstimator

estimator = StatevectorEstimator()
# Define pub: (circuit, observable)
pub = (qc, observable)
result = estimator.run([pub]).result()

print(f"Exact Expectation Value: {result[0].data.evs}")</code></pre>
<p>These utilize statevector math under the hood and do not suffer from shot noise, making them incredibly fast for small scale circuits (less than 20 qubits).</p>`
  },
  {
    title: "Simulate circuits with noise",
    section: "Qiskit",
    subsection: "Debugging",
    content: `<p>Real quantum computers are noisy. <code>qiskit-aer</code> allows you to simulate this noise to understand how your algorithm will perform on actual hardware.</p>
<h3>Creating a Noise Model</h3>
<p>You can extract a noise model directly from an IBM backend's calibration data, or build your own.</p>
<pre><code class="language-python">from qiskit_aer.noise import NoiseModel, depolarizing_error
from qiskit_aer import AerSimulator

# Create an empty noise model
noise_model = NoiseModel()
# Add a 1% depolarizing error to all CNOT gates
error = depolarizing_error(0.01, 2)
noise_model.add_all_qubit_quantum_error(error, ['cx'])

# Run simulator with noise
sim = AerSimulator(noise_model=noise_model)
</code></pre>`
  },
  {
    title: "Visualization",
    section: "Qiskit",
    subsection: "Debugging",
    content: `<p>Qiskit offers a robust suite of visualization tools to help you design circuits and interpret results. These tools use Matplotlib, Plotly, or LaTeX formatting depending on your configuration.</p>
<h3>Common Visualization Functions</h3>
<ul>
<li><code>circuit.draw('mpl')</code>: Draws the quantum circuit using colorful Matplotlib graphics.</li>
<li><code>qiskit.visualization.plot_histogram(counts)</code>: Plots a bar chart of measurement outcomes.</li>
<li><code>qiskit.visualization.plot_bloch_multivector(state)</code>: Visualizes qubit states on 3D Bloch spheres.</li>
</ul>
<p>These tools are essential for presentations, publications, and visual debugging of algorithmic logic.</p>`
  },
  {
    title: "Advanced techniques - Qiskit addons",
    section: "Qiskit",
    content: `<p>Qiskit Addons extend the capabilities of the core SDK, providing specialized modules for advanced quantum research. These include techniques for scaling quantum algorithms beyond current hardware limitations.</p>
<h3>Notable Techniques</h3>
<ul>
<li><strong>Error Mitigation:</strong> Techniques like Zero Noise Extrapolation (ZNE) and Probabilistic Error Cancellation (PEC) to digitally reduce noise impact.</li>
<li><strong>Circuit Cutting:</strong> Splitting large quantum circuits into smaller fragments that can be run on limited-qubit hardware, then classically recombining the results.</li>
<li><strong>Quantum Serverless:</strong> Managing distributed workloads across quantum and classical high-performance computing (HPC) clusters.</li>
</ul>`
  },
  {
    title: "Integrate external quantum resources with Qiskit",
    section: "Qiskit",
    content: `<p>Qiskit is designed to be hardware-agnostic. Through the Provider architecture, you can integrate Qiskit with external quantum resources, including trapped-ion systems, superconducting competitors, and specialized HPC simulators.</p>
<p>By installing third-party plugins (e.g., <code>qiskit-ionq</code> or <code>qiskit-aws-braket</code>), users can write a Qiskit circuit once and execute it across diverse architectures, allowing for seamless cross-platform benchmarking and research.</p>`
  },
  {
    title: "Quantum resource management interface (QRMI)",
    section: "Qiskit",
    subsection: "Integrations",
    content: `<p>The Quantum Resource Management Interface (QRMI) establishes a standardized protocol for integrating quantum hardware into classical High-Performance Computing (HPC) schedulers. As quantum computers transition into data centers, they must be managed alongside CPU and GPU clusters.</p>
<p>QRMI provides the APIs necessary for node allocation, job queuing, and telemetry monitoring, ensuring that quantum execution steps within hybrid classical-quantum algorithms are routed efficiently.</p>`
  },
  {
    title: "SPANK plugin for QRMI",
    section: "Qiskit",
    subsection: "Integrations",
    content: `<p>SPANK (Slurm Plug-in Architecture for Node and job (K)control) is a widely used plugin architecture for the Slurm workload manager. The SPANK plugin for QRMI allows SLURM to natively recognize and allocate quantum processing units (QPUs) as generic cluster resources.</p>
<p>With this integration, HPC administrators can manage Qiskit workloads using standard Slurm commands (like <code>srun</code> and <code>sbatch</code>), enabling seamless hybrid HPC-quantum computing environments without overhauling existing cluster infrastructure.</p>`
  },
  {
    title: "SPANK plugin user guide",
    section: "Qiskit",
    subsection: "Integrations",
    content: `<p>To utilize the SPANK plugin for submitting Qiskit workloads on a Slurm-managed cluster, users must specify the quantum resource in their job submission scripts.</p>
<h3>Example SBATCH Script</h3>
<pre><code class="language-bash">#!/bin/bash
#SBATCH --job-name=qiskit_vqe
#SBATCH --nodes=1
#SBATCH --gres=qpu:ibm_eagle:1  # Request 1 QPU resource
#SBATCH --time=00:30:00

python run_vqe_qiskit.py
</code></pre>
<p>The plugin intercepts the <code>--gres</code> flag, authenticates with the QRMI gateway, and reserves the requested QPU backend for the duration of the job, passing the connection credentials dynamically to the Qiskit runtime environment.</p>`
  },
  {
    title: "Qiskit MCP Servers",
    section: "Qiskit",
    subsection: "Integrations",
    content: `<p>The Model Context Protocol (MCP) allows AI agents and Large Language Models (LLMs) to interact with external tools and datasets. <strong>Qiskit MCP Servers</strong> provide a bridge between conversational AI and quantum computing workflows.</p>
<p>By connecting an AI assistant to a Qiskit MCP Server, developers can prompt the AI to autonomously draft circuits, query backend calibration data, or analyze primitive execution results. This significantly lowers the barrier to entry for quantum programming by providing real-time, context-aware coding assistance powered by the Qiskit API.</p>`
  }
];

async function seedDocs() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    await Doc.deleteMany({});
    console.log("Cleared existing docs.");

    await Doc.insertMany(docsData);
    console.log("Successfully seeded documentation!");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding docs:", error);
    process.exit(1);
  }
}

seedDocs();