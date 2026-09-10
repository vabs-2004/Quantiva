export const educationalContent = {
  "grover-search": {
    description: `
      <p>In quantum computing, <strong>Grover's algorithm</strong>, also known as the quantum search algorithm, is a quantum algorithm for unstructured search that finds with high probability the unique input to a black box function that produces a particular output value. It was devised by Lov Grover in 1996.</p>
      <br/>
      <p>While classical computation has a query complexity of $O(N)$ (requiring $N/2$ steps on average), Grover's algorithm uses just $O(\\sqrt{N})$ evaluations. Charles H. Bennett, Ethan Bernstein, Gilles Brassard, and Umesh Vazirani proved that this quadratic speedup is asymptotically optimal for unstructured search.</p>
    `,
    problemDescription: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Problem Description</h4>
      <p>Suppose we have a function $f: \\{0, 1, \\dots, N-1\\} \\to \\{0, 1\\}$. The domain represents indices to a database, and $f(x)=1$ if the data that $x$ points to satisfies the search criterion. Assuming only one index satisfies $f(x)=1$, we call this index $\\omega$. Our goal is to identify $\\omega$.</p>
      <br/>
      <p>We access $f$ with an oracle in the form of a unitary operator $U_\\omega$ that acts on an $N$-dimensional state space $\\mathcal{H}$ supplied by $n = \\lceil \\log_2 N \\rceil$ qubits:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ U_\\omega|x\\rangle = -|x\\rangle \\quad \\text{for } x=\\omega $$
        $$ U_\\omega|x\\rangle = |x\\rangle \\quad \\text{for } x \\neq \\omega $$
      </p>
    `,
    algorithm: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Step-by-Step Procedure</h4>
      <ol style="list-style-type: decimal; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 1rem;">
        <li><strong>Initialization:</strong> Initialize the system to the uniform superposition over all states: 
          $$ |s\\rangle = \\frac{1}{\\sqrt{N}} \\sum_{x=0}^{N-1} |x\\rangle $$
        </li>
        <li><strong>Grover Iteration:</strong> Perform the following $r(N)$ times:
          <ul style="list-style-type: disc; margin-left: 1.5rem; margin-top: 0.25rem;">
            <li>Apply the Oracle operator $U_\\omega$.</li>
            <li>Apply the Grover diffusion operator $U_s = 2|s\\rangle\\langle s| - I$.</li>
          </ul>
        </li>
        <li><strong>Measurement:</strong> Measure the resulting quantum state in the computational basis.</li>
      </ol>
      <p>The optimal number of iterations satisfies $r(N) \\le \\lceil \\frac{\\pi}{4}\\sqrt{N} \\rceil$. The overall gate complexity is $O(\\log(N))$ per iteration.</p>
    `,
    geometricProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Geometric Interpretation</h4>
      <p>The quantum state of Grover's algorithm stays in a two-dimensional subspace spanned by $|\\omega\\rangle$ and the perpendicular uniform superposition of all non-winning states, $|s'\\rangle = \\frac{1}{\\sqrt{N-1}} \\sum_{x \\neq \\omega} |x\\rangle$.</p>
      <br/>
      <ul style="list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1rem;">
        <li>The operator $U_\\omega = I - 2|\\omega\\rangle\\langle\\omega|$ acts as a reflection across $|s'\\rangle$.</li>
        <li>The operator $U_s = 2|s\\rangle\\langle s| - I$ is a reflection through $|s\\rangle$.</li>
      </ul>
      <p>Applying $U_s U_\\omega$ rotates the state vector by an angle of $\\theta = 2\\arcsin(\\frac{1}{\\sqrt{N}})$. The exact probability of measuring the correct answer after $r$ iterations is $\\sin^2\\left(\\left(r+\\frac{1}{2}\\right)\\theta\\right)$. The earliest time we get a near-optimal measurement is $r \\approx \\frac{\\pi\\sqrt{N}}{4}$.</p>
    `,
    algebraicProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Algebraic Mechanics</h4>
      <p>We can analyze the repeated application of $U_s U_\\omega$ via matrix eigenvalues. In the non-orthogonal basis $\\{|\\omega\\rangle, |s\\rangle\\}$, the action of applying $U_\\omega$ followed by $U_s$ is given by the matrix:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ U_s U_\\omega = \\begin{bmatrix} 1 - 2/N & -2/N \\\\ 2/N & 1 - 4/N \\end{bmatrix} $$
      </p>
      <p>Defining $t = \\arcsin(1/\\sqrt{N})$, the matrix has the Jordan form:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ U_s U_\\omega = M \\begin{bmatrix} e^{2it} & 0 \\\\ 0 & e^{-2it} \\end{bmatrix} M^{-1} \\quad \\text{where} \\quad M = \\begin{bmatrix} -i & i \\\\ e^{it} & e^{-it} \\end{bmatrix} $$
      </p>
      <p>It follows that the $r$-th power of the matrix (corresponding to $r$ iterations) is:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ (U_s U_\\omega)^r = M \\begin{bmatrix} e^{2rit} & 0 \\\\ 0 & e^{-2rit} \\end{bmatrix} M^{-1} $$
      </p>
      <p>Using trigonometric identities, the probability of observing $\\omega$ after $r$ iterations is $\\sin^2((2r+1)t)$, yielding the optimal target $r \\approx \\frac{\\pi\\sqrt{N}}{4}$.</p>
    `,
    applications: [
      "Unstructured Database Search (speeding up brute-force tasks)",
      "Satisfiability (SAT) problems and constraint satisfaction",
      "Speeding up brute-force attacks on symmetric cryptography (e.g., AES)",
      "Finding collisions in hash functions"
    ],
    limitations: [
      "The $O(\\sqrt{N})$ speedup is only quadratic, not exponential.",
      "Requires coherent quantum states to be maintained for many operations.",
      "If there are multiple solutions and the count is unknown, the number of iterations must be adjusted, otherwise it will 'overshoot' the target."
    ],
    code: `from qiskit import QuantumCircuit
import numpy as np

# Grover's Search — 3 Qubits
num_qubits = 3
target_state = '101'
qc = QuantumCircuit(num_qubits)

# 1. Initialize superposition
for i in range(num_qubits):
    qc.h(i)

# 2. Grover iterations (approx pi/4 * sqrt(8) ≈ 2)
for _ in range(2):
    qc.barrier()
    
    # Oracle for |101⟩
    for i in range(num_qubits):
        if target_state[num_qubits - 1 - i] == '0':
            qc.x(i)
            
    qc.h(num_qubits-1)
    qc.mcx(list(range(num_qubits-1)), num_qubits-1)
    qc.h(num_qubits-1)
    
    for i in range(num_qubits):
        if target_state[num_qubits - 1 - i] == '0':
            qc.x(i)
            
    qc.barrier()
    
    # Diffuser (Inversion about the mean)
    for i in range(num_qubits):
        qc.h(i)
        qc.x(i)
        
    qc.h(num_qubits-1)
    qc.mcx(list(range(num_qubits-1)), num_qubits-1)
    qc.h(num_qubits-1)
    
    for i in range(num_qubits):
        qc.x(i)
        qc.h(i)

qc.measure_all()
`
  },

  "shor": {
    description: `
      <p><strong>Shor's Algorithm</strong> is a quantum algorithm for integer factorization formulated by Peter Shor in 1994. It solves the following problem: given an integer $N$, find its prime factors.</p>
      <br/>
      <p>On a quantum computer, to factor an integer $N$, Shor's algorithm runs in polynomial time, specifically $O((\\log N)^3)$. This is exponentially faster than the best-known classical factoring algorithm, the General Number Field Sieve, which runs in sub-exponential time.</p>
    `,
    problemDescription: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">The Factoring Problem</h4>
      <p>Given a large composite number $N$ (e.g. $N = p \\times q$ where $p$ and $q$ are prime), find $p$ and $q$.</p>
      <p>The security of public-key cryptography systems like RSA relies entirely on the assumption that factoring large numbers is computationally infeasible for classical computers.</p>
    `,
    algorithm: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Step-by-Step Procedure</h4>
      <p>Shor's algorithm consists of two parts: a classical reduction, and a quantum period-finding subroutine.</p>
      <ol style="list-style-type: decimal; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 1rem;">
        <li><strong>Classical:</strong> Pick a random number $a < N$. Compute $\\gcd(a, N)$. If it's $> 1$, we found a factor! Otherwise, proceed.</li>
        <li><strong>Quantum Period Finding:</strong> We need to find the period $r$ of the function $f(x) = a^x \\pmod N$.
          <ul style="list-style-type: disc; margin-left: 1.5rem; margin-top: 0.5rem;">
            <li>Prepare two quantum registers. Initialize the first in a superposition of all states.</li>
            <li>Apply the function $f(x)$ to the second register using the first as control (Modular Exponentiation).</li>
            <li>Apply the <strong>Quantum Fourier Transform (QFT)</strong> to the first register.</li>
            <li>Measure the first register to get a value that allows us to deduce $r$.</li>
          </ul>
        </li>
        <li><strong>Classical:</strong> If $r$ is odd, or if $a^{r/2} \\equiv -1 \\pmod N$, go back to step 1. Otherwise, the factors are $\\gcd(a^{r/2} - 1, N)$ and $\\gcd(a^{r/2} + 1, N)$.</li>
      </ol>
    `,
    geometricProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Why QFT finds the period</h4>
      <p>The modular exponentiation step creates a state that is periodic with period $r$. However, the period is encoded in the amplitudes across multiple states. If we simply measure, we get a random shift of the periodic sequence, which gives no information about $r$.</p>
      <br/>
      <p>The Quantum Fourier Transform (QFT) acts like a prism, extracting the frequency components of this periodic state. By transforming from the "computational basis" to the "frequency basis", constructive interference occurs only at multiples of $N/r$, allowing us to directly measure the period $r$.</p>
    `,
    algebraicProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Algebraic Mechanics</h4>
      <p>After the modular exponentiation and measuring the second register, the first register is left in a state:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ |\\psi\\rangle = \\frac{1}{\\sqrt{m}} \\sum_{j=0}^{m-1} |x_0 + j r\\rangle $$
      </p>
      <p>Applying the QFT yields:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ QFT|\\psi\\rangle = \\frac{1}{\\sqrt{r}} \\sum_{k=0}^{r-1} e^{2\\pi i k x_0 / r} |k \\frac{Q}{r}\\rangle $$
      </p>
      <p>When we measure, we obtain a value $c \\approx k \\frac{Q}{r}$. Dividing by $Q$, we get $c/Q \\approx k/r$. Using classical continued fractions, we can extract $r$.</p>
    `,
    applications: [
      "Breaking RSA Cryptography",
      "Breaking Diffie-Hellman key exchange",
      "Breaking Elliptic Curve Cryptography (ECC)"
    ],
    limitations: [
      "Requires millions of physical qubits with error correction to factor cryptographically relevant numbers (e.g., 2048-bit RSA).",
      "The modular exponentiation circuit requires immense depth and overhead."
    ],
    code: `from qiskit import QuantumCircuit
from qiskit.circuit.library import QFT
import numpy as np

# Shor's Algorithm for N=15, a=7
n_count = 4  # number of counting qubits
a = 7

qc = QuantumCircuit(n_count + 4, n_count)

# Initialize counting qubits to |+>
for q in range(n_count):
    qc.h(q)

# And auxiliary register in state |1>
qc.x(n_count)

# Apply controlled-U operations (Modular Exponentiation)
# For a=7, N=15:
# 7^1 mod 15 = 7  -> swap 0,1 & 2,3
# 7^2 mod 15 = 4  -> swap 0,2 & 1,3
# 7^4 mod 15 = 1  -> identity
# (Skipped explicit gate definitions for brevity)

# Apply Inverse QFT
qc.append(QFT(n_count, inverse=True), range(n_count))

# Measure
for q in range(n_count):
    qc.measure(q, q)
`
  },

  "qft": {
    description: `
      <p>The <strong>Quantum Fourier Transform (QFT)</strong> is the quantum analogue of the classical Discrete Fourier Transform (DFT). It transforms a quantum state from the computational (standard) basis into the Fourier (frequency) basis.</p>
      <br/>
      <p>While computing the DFT of $N = 2^n$ data points on a classical computer using the Fast Fourier Transform (FFT) algorithm takes $O(N \\log N)$ operations, the QFT can process the same $2^n$ amplitudes using a quantum circuit with only $O(n^2)$ gates. This represents a massive <strong>exponential speedup</strong>.</p>
    `,
    problemDescription: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">The Basis Transformation Problem</h4>
      <p>In classical digital signal processing, the Fourier Transform takes a signal in the time domain and breaks it down into its constituent frequencies. In quantum computing, the QFT does something remarkably similar to the probability amplitudes of a quantum state.</p>
      <br/>
      <p>Mathematically, if we have a quantum state represented in the computational basis $|x\\rangle$ (where $x$ is an integer from $0$ to $N-1$, and $N = 2^n$), the QFT maps it to a new state where the value of $x$ is encoded into the <em>relative phases</em> of the qubits.</p>
      <p><strong>Goal:</strong> Implement the transformation:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ QFT|x\\rangle = \\frac{1}{\\sqrt{N}} \\sum_{y=0}^{N-1} e^{\\frac{2\\pi i x y}{N}} |y\\rangle $$
      </p>
    `,
    algorithm: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Step-by-Step Procedure</h4>
      <p>The QFT circuit is built using only two types of quantum gates: the Hadamard gate ($H$) and Controlled-Phase rotation gates ($CP$).</p>
      <ol style="list-style-type: decimal; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 1rem;">
        <li><strong>Start with the most significant qubit:</strong> Apply a Hadamard gate to qubit $0$. This puts it in a superposition.</li>
        <li><strong>Apply Controlled-Phase Rotations:</strong> For every subsequent qubit $k$ (from $1$ to $n-1$), apply a controlled-phase gate between qubit $k$ and qubit $0$, with an increasingly tiny angle: $\\theta = \\frac{\\pi}{2^k}$.</li>
        <li><strong>Move to the next qubit:</strong> Repeat steps 1 and 2 for qubit $1$, then qubit $2$, all the way down the line.</li>
        <li><strong>Swap Qubits:</strong> The circuit naturally produces the output qubits in reverse order. To fix this, apply SWAP gates to physically reverse the order of the qubits at the very end of the circuit (swap the first with the last, second with second-to-last, etc.).</li>
      </ol>
    `,
    geometricProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Phases Around the Bloch Sphere Equator</h4>
      <p>Geometrically, the QFT maps a computational basis state (which points straight UP or DOWN on the Z-axis of the Bloch sphere) to states that lie entirely on the XY equator of the Bloch sphere.</p>
      <br/>
      <p>If you feed the number $x$ into the QFT, every single qubit ends up in a state that looks like $|0\\rangle + e^{i\\phi}|1\\rangle$, but the phase angle $\\phi$ rotates at different speeds for each qubit.</p>
      <ul style="list-style-type: disc; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 1rem;">
        <li>The least significant qubit rotates by a full circle based on $x$.</li>
        <li>The next qubit rotates half as fast.</li>
        <li>The most significant qubit rotates incredibly slowly, turning just a tiny fraction of a degree.</li>
      </ul>
      <p>This "clockwork" encoding is what allows algorithms like Quantum Phase Estimation to read frequency data with extreme precision.</p>
    `,
    algebraicProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Algebraic Mechanics</h4>
      <p>Let's write the binary representation of $x$ as $x = x_1 x_2 \\dots x_n$. We can factor the massive summation definition of the QFT into a beautiful tensor product of individual qubits:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ QFT|x_1 x_2 \\dots x_n\\rangle = \\frac{1}{\\sqrt{2^n}} \\bigotimes_{k=1}^n \\left( |0\\rangle + e^{2\\pi i (0.x_{n-k+1} \\dots x_n)} |1\\rangle \\right) $$
      </p>
      <p><em>(Note: $0.x_a x_b$ denotes a binary fraction: $\\frac{x_a}{2} + \\frac{x_b}{4} + \\dots$)</em></p>
      <p>Let's look at a 3-qubit example $|x_1 x_2 x_3\\rangle$. The output state factors into:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ \\frac{1}{\\sqrt{8}} \\left( |0\\rangle + e^{2\\pi i (0.x_3)}|1\\rangle \\right) \\otimes \\left( |0\\rangle + e^{2\\pi i (0.x_2 x_3)}|1\\rangle \\right) \\otimes \\left( |0\\rangle + e^{2\\pi i (0.x_1 x_2 x_3)}|1\\rangle \\right) $$
      </p>
      <p>The Hadamard gate provides the $|0\\rangle + |1\\rangle$ superposition, and the Controlled-Phase ($CP$) gates mathematically add the fractional binary parts (e.g., the $x_3$ part to the second qubit's phase) only when the control qubit is $1$.</p>
    `,
    applications: [
      "Quantum Phase Estimation (QPE): Estimating the eigenvalues of a unitary operator.",
      "Shor's Algorithm: Finding the period of a modular exponential function to factor primes.",
      "The Hidden Subgroup Problem: Solving complex algebraic structures."
    ],
    limitations: [
      "Cannot be used to speed up classical Fourier analysis of classical data. If you load a classical vector into a quantum state and apply QFT, measuring the state collapses it, giving you only a single random data point, not the full frequency spectrum.",
      "Requires precise phase rotations. As $n$ grows, the phase angles ($\\frac{\\pi}{2^n}$) become vanishingly small and highly susceptible to hardware noise."
    ],
    code: `from qiskit import QuantumCircuit
from qiskit.circuit.library import QFT
import numpy as np

def build_qft(n_qubits):
    """Manually constructs the Quantum Fourier Transform circuit."""
    qc = QuantumCircuit(n_qubits)
    
    # Apply Hadamards and Controlled-Phase gates
    for target in range(n_qubits - 1, -1, -1):
        qc.h(target)
        for control in range(target - 1, -1, -1):
            # The angle decreases by powers of 2 based on the distance between qubits
            angle = np.pi / (2 ** (target - control))
            qc.cp(angle, control, target)
            
    qc.barrier()
    
    # Swap qubits at the end to reverse the output order
    for i in range(n_qubits // 2):
        qc.swap(i, n_qubits - i - 1)
        
    return qc

# Create a 4-qubit QFT circuit
num_qubits = 4
qft_circuit = build_qft(num_qubits)

# Print the circuit depth and visually inspect it
print(f"QFT Circuit Depth for {num_qubits} qubits: {qft_circuit.depth()}")
print(qft_circuit.draw(output='text'))

# NOTE: In practical Qiskit code, you don't need to build this manually.
# You can simply use the highly optimized library function:
# qc = QuantumCircuit(num_qubits)
# qc.append(QFT(num_qubits, do_swaps=True), range(num_qubits))
`
  },
  "deutsch": {
    description: `
      <p><strong>Deutsch's Algorithm</strong>, proposed by David Deutsch in 1985, was the very first algorithm designed to demonstrate a clear quantum advantage over classical computers. It solves a specific "black-box" problem using quantum superposition and interference.</p>
      <br/>
      <p>While a classical computer requires $2$ evaluations of the function to determine the answer, a quantum computer using Deutsch's algorithm can find the answer with just $1$ evaluation. Though it is a simple toy problem, it laid the foundational framework for all future quantum algorithms.</p>
    `,
    problemDescription: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">The Problem: Constant vs. Balanced</h4>
      <p>Suppose you are given a hidden black-box function (an oracle) $f$ that takes a single bit as input and outputs a single bit. Mathematically, $f: \\{0, 1\\} \\to \\{0, 1\\}$.</p>
      <br/>
      <p>There are only four possible such functions, and they fall into two categories:</p>
      <ul style="list-style-type: disc; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 1rem;">
        <li><strong>Constant:</strong> The output is the same for both inputs (always $0$, or always $1$). i.e., $f(0) = f(1)$.</li>
        <li><strong>Balanced:</strong> The output is $0$ for half the inputs and $1$ for the other half. i.e., $f(0) \\neq f(1)$.</li>
      </ul>
      <p><strong>Goal:</strong> Determine if $f$ is constant or balanced with the minimum number of queries. Classically, you must check both $f(0)$ and $f(1)$. Quantumly, we do it in one shot.</p>
    `,
    algorithm: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Step-by-Step Procedure</h4>
      <ol style="list-style-type: decimal; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 1rem;">
        <li><strong>Initialization:</strong> Start with two qubits. The first (control) is set to $|0\\rangle$ and the second (target) is set to $|1\\rangle$. State: $|01\\rangle$.</li>
        <li><strong>Superposition:</strong> Apply a Hadamard ($H$) gate to both qubits to create a uniform superposition. The target qubit becomes $|-\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle - |1\\rangle)$.</li>
        <li><strong>The Oracle:</strong> Apply the quantum oracle $U_f$, which performs the operation $|x\\rangle|y\\rangle \\to |x\\rangle|y \\oplus f(x)\\rangle$.</li>
        <li><strong>Interference:</strong> Apply a final Hadamard gate to the first (control) qubit.</li>
        <li><strong>Measurement:</strong> Measure the first qubit. If the result is $0$, the function is <strong>Constant</strong>. If the result is $1$, the function is <strong>Balanced</strong>.</li>
      </ol>
    `,
    geometricProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">The Magic of Phase Kickback</h4>
      <p>The secret to Deutsch's algorithm is a quantum phenomenon called <strong>Phase Kickback</strong>. When the oracle $U_f$ is applied, the target qubit is in the $|-\\rangle$ state. Because of the math of the XOR ($\\oplus$) operation, the target qubit's state doesn't actually change; instead, its phase is "kicked back" to the control qubit.</p>
      <br/>
      <p>The control qubit starts in the $|+\\rangle$ state. If the function is constant, the phase kickback is symmetric, and the control qubit stays as $|+\\rangle$ (which the final $H$ gate turns into a $0$). If the function is balanced, the phase kickback flips the relative phase of the control qubit, turning it into $|-\\rangle$ (which the final $H$ gate turns into a $1$).</p>
    `,
    algebraicProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Algebraic Mechanics</h4>
      <p>After applying $H$ to $|0\\rangle|1\\rangle$, the state is:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ |\\psi_1\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle + |1\\rangle) \\otimes \\frac{1}{\\sqrt{2}}(|0\\rangle - |1\\rangle) $$
      </p>
      <p>Applying the Oracle $U_f$ introduces a phase factor of $(-1)^{f(x)}$ to the control qubit:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ |\\psi_2\\rangle = \\frac{1}{2} \\left( (-1)^{f(0)}|0\\rangle + (-1)^{f(1)}|1\\rangle \\right) \\otimes (|0\\rangle - |1\\rangle) $$
      </p>
      <p>We can factor out $(-1)^{f(0)}$ from the control qubit:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ (-1)^{f(0)} \\frac{1}{\\sqrt{2}} \\left( |0\\rangle + (-1)^{f(1) - f(0)}|1\\rangle \\right) $$
      </p>
      <p>If $f$ is constant ($f(0) = f(1)$), the exponent is $0$, leaving the state as $\\pm|+\\rangle$. The final $H$ gate maps this to $\\pm|0\\rangle$.</p>
      <p>If $f$ is balanced ($f(0) \\neq f(1)$), the exponent is $\\pm 1$, leaving the state as $\\pm|-\\rangle$. The final $H$ gate maps this to $\\pm|1\\rangle$.</p>
    `,
    applications: [
      "Demonstrating exponential quantum advantage (when generalized to the Deutsch-Jozsa algorithm)",
      "Proving the concept of Quantum Parallelism (evaluating multiple inputs simultaneously)",
      "Introducing the Phase Kickback mechanism, heavily used in Shor's and Grover's algorithms"
    ],
    limitations: [
      "It is a toy problem with no practical real-world application (you rarely need to check if a 1-bit function is constant or balanced).",
      "It strictly requires the oracle to be provided as a quantum gate (unitary operation)."
    ],
    code: `from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer
from qiskit.visualization import plot_histogram

# Setup for a BALANCED function (f(0) = 0, f(1) = 1)
qc = QuantumCircuit(2, 1)

# 1. State Preparation: Set target qubit to |1>
qc.x(1)
qc.barrier()

# 2. Superposition: Apply Hadamard to both
qc.h(0)
qc.h(1)
qc.barrier()

# 3. The Oracle (Balanced-Identity: f(x) = x)
# We use a CNOT gate where q0 is control and q1 is target
qc.cx(0, 1)
qc.barrier()

# 4. Interference
qc.h(0)

# 5. Measurement
qc.measure(0, 0)

# Simulate the circuit
simulator = Aer.get_backend('aer_simulator')
compiled = transpile(qc, simulator)
job = simulator.run(compiled, shots=1000)
result = job.result()
counts = result.get_counts()

print(f"Measurement Counts: {counts}")
# Output will be {'1': 1000}, proving it is Balanced!
`
  },
  "deutsch-jozsa": {
    description: `
      <p>The <strong>Deutsch-Jozsa Algorithm</strong>, proposed by David Deutsch and Richard Jozsa in 1992, is an extension of Deutsch's algorithm. It was the first algorithm to demonstrate an <em>exponential</em> speedup of a quantum algorithm over any deterministic classical algorithm.</p>
      <br/>
      <p>While a classical computer requires an exponentially growing number of queries to solve the problem with 100% certainty, the Deutsch-Jozsa algorithm solves it with exactly <strong>one</strong> quantum query, regardless of the input size.</p>
    `,
    problemDescription: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">The Generalized Black-Box Problem</h4>
      <p>Suppose you are given a black-box function $f$ that takes a string of $n$ bits as input and returns a single bit. Mathematically, $f: \\{0, 1\\}^n \\to \\{0, 1\\}$.</p>
      <br/>
      <p>You are given a promise: the function is guaranteed to be either:</p>
      <ul style="list-style-type: disc; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 1rem;">
        <li><strong>Constant:</strong> It returns the same value ($0$ or $1$) for all possible $2^n$ inputs.</li>
        <li><strong>Balanced:</strong> It returns $0$ for exactly half of the inputs, and $1$ for the other half.</li>
      </ul>
      <p><strong>Goal:</strong> Determine whether $f$ is constant or balanced.</p>
      <p>Classically, in the worst-case scenario, you must query the function $2^{n-1} + 1$ times to be 100% certain. Quantumly, we can do it in 1 query.</p>
    `,
    algorithm: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Step-by-Step Procedure</h4>
      <ol style="list-style-type: decimal; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 1rem;">
        <li><strong>Initialization:</strong> Prepare an $n$-qubit query register in the $|0\\rangle^{\\otimes n}$ state, and a 1-qubit target register in the $|1\\rangle$ state.</li>
        <li><strong>Superposition:</strong> Apply a Hadamard ($H$) gate to all $n+1$ qubits. The query register becomes a uniform superposition of all $2^n$ possible inputs. The target qubit becomes $|-\\rangle$.</li>
        <li><strong>The Oracle:</strong> Apply the quantum oracle $U_f$, mapping $|x\\rangle|y\\rangle \\to |x\\rangle|y \\oplus f(x)\\rangle$.</li>
        <li><strong>Interference:</strong> Apply a Hadamard gate to each of the $n$ qubits in the query register.</li>
        <li><strong>Measurement:</strong> Measure the $n$ query qubits. If you measure all zeros ($|00\\dots 0\\rangle$), the function is <strong>Constant</strong>. If you measure any other state (at least one $1$), it is <strong>Balanced</strong>.</li>
      </ol>
    `,
    geometricProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Multi-Qubit Interference</h4>
      <p>Like the simple Deutsch algorithm, this relies on <strong>Phase Kickback</strong>. The target $|-\\rangle$ state kicks back a phase of $(-1)^{f(x)}$ to every state $|x\\rangle$ in the query register's superposition.</p>
      <br/>
      <p>When we apply the final set of Hadamard gates, we are performing a multi-dimensional interference pattern:</p>
      <ul style="list-style-type: disc; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 1rem;">
        <li>If the function is <strong>constant</strong>, all phases are identical (all positive or all negative). The waves perfectly constructively interfere <em>only</em> at the origin, meaning 100% of the probability amplitude lands on the all-zero state $|00\\dots0\\rangle$.</li>
        <li>If the function is <strong>balanced</strong>, exactly half the phases are positive and half are negative. Their amplitudes perfectly <em>cancel out</em> (destructive interference) at the all-zero state. The probability of measuring $|00\\dots0\\rangle$ drops to exactly $0$.</li>
      </ul>
    `,
    algebraicProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Algebraic Mechanics</h4>
      <p>After applying Hadamards to the initial state $|0\\rangle^{\\otimes n}|1\\rangle$, we get:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ |\\psi_1\\rangle = \\left( \\frac{1}{\\sqrt{2^n}} \\sum_{x=0}^{2^n-1} |x\\rangle \\right) \\otimes |-\\rangle $$
      </p>
      <p>Applying the Oracle $U_f$ kicks back the phase $(-1)^{f(x)}$:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ |\\psi_2\\rangle = \\left( \\frac{1}{\\sqrt{2^n}} \\sum_{x=0}^{2^n-1} (-1)^{f(x)} |x\\rangle \\right) \\otimes |-\\rangle $$
      </p>
      <p>Applying the final $H^{\\otimes n}$ to the query register yields a complex state. The amplitude (probability coefficient) of the all-zero state $|00\\dots0\\rangle$ is given by:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ A_{00\\dots0} = \\frac{1}{2^n} \\sum_{x=0}^{2^n-1} (-1)^{f(x)} $$
      </p>
      <p>If $f$ is constant, $f(x)$ is always $0$ or $1$. The sum evaluates to $\\pm 2^n / 2^n = \\pm 1$. Squaring this amplitude gives a probability of $1$ (100%).</p>
      <p>If $f$ is balanced, there are an equal number of $+1$s and $-1$s. The sum evaluates exactly to $0$. Squaring this gives a probability of $0$.</p>
    `,
    applications: [
      "Providing the first theoretical proof that quantum computers can be exponentially faster than exact classical algorithms.",
      "Laying the groundwork for multi-qubit oracle queries and the Bernstein-Vazirani algorithm.",
      "Serving as a fundamental educational tool for understanding quantum parallelism."
    ],
    limitations: [
      "It is an artificial problem designed specifically to prove a point; it lacks real-world commercial applications.",
      "While it is exponentially faster than a deterministic classical algorithm, a probabilistic classical algorithm can guess the answer with 99.9% accuracy using only a handful of queries (e.g., querying 3 random inputs)."
    ],
    code: `from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer
from qiskit.visualization import plot_histogram

# Setup for a 3-qubit input (+1 output)
n = 3
qc = QuantumCircuit(n + 1, n)

# 1. State Preparation: Set target qubit to |1>
qc.x(n)
qc.barrier()

# 2. Superposition: Apply Hadamard to all qubits
for i in range(n + 1):
    qc.h(i)
qc.barrier()

# 3. The Oracle (Creating a BALANCED function)
# We apply CNOTs from the input qubits to the target qubit.
# This acts as an XOR gate across the inputs, making it perfectly balanced.
for i in range(n):
    qc.cx(i, n)
qc.barrier()

# 4. Interference: Apply Hadamard to input qubits
for i in range(n):
    qc.h(i)
qc.barrier()

# 5. Measurement: Measure the n input qubits
for i in range(n):
    qc.measure(i, i)

# Simulate the circuit
simulator = Aer.get_backend('aer_simulator')
compiled = transpile(qc, simulator)
job = simulator.run(compiled, shots=1000)
result = job.result()
counts = result.get_counts()

print(f"Measurement Counts: {counts}")
# Output will be {'111': 1000} (not '000'), proving it is Balanced!
`
  },
  "quantum-teleportation": {
    description: `
      <p><strong>Quantum Teleportation</strong> is a protocol proposed by Charles Bennett and colleagues in 1993. It allows the exact state of a quantum information particle (a qubit) to be transferred from one location to another, without the physical particle itself traveling through space.</p>
      <br/>
      <p>It achieves this "teleportation" by utilizing two classical communication bits and one pair of entangled qubits (a Bell pair) shared between the sender (Alice) and the receiver (Bob). It is important to note that this does not allow faster-than-light communication, as the classical bits must still travel at or below the speed of light.</p>
    `,
    problemDescription: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">The Quantum Communication Problem</h4>
      <p>Suppose Alice wants to send a precise quantum state $|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle$ to Bob.</p>
      <br/>
      <p>Alice faces two fundamental laws of quantum mechanics that make this difficult:</p>
      <ul style="list-style-type: disc; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 1rem;">
        <li><strong>The Measurement Problem:</strong> If Alice measures the qubit to figure out $\\alpha$ and $\\beta$, the state collapses to either $0$ or $1$. The original delicate superposition is destroyed forever.</li>
        <li><strong>The No-Cloning Theorem:</strong> Alice cannot simply make a perfect copy of the unknown quantum state to keep one and send one.</li>
      </ul>
      <p><strong>Goal:</strong> Transport the exact state $|\\psi\\rangle$ to Bob without measuring it and without violating the No-Cloning theorem.</p>
    `,
    algorithm: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Step-by-Step Procedure</h4>
      <p>We use three qubits: $q_0$ (Alice's message to send), $q_1$ (Alice's half of the entangled pair), and $q_2$ (Bob's half of the entangled pair).</p>
      <ol style="list-style-type: decimal; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 1rem;">
        <li><strong>Entanglement Distribution:</strong> Create a maximally entangled Bell pair between $q_1$ and $q_2$. Alice takes $q_1$, Bob takes $q_2$.</li>
        <li><strong>Alice's Operations:</strong> Alice entangles her message qubit ($q_0$) with her Bell qubit ($q_1$) by applying a CNOT gate (control=$q_0$, target=$q_1$), followed by a Hadamard gate on $q_0$.</li>
        <li><strong>Alice's Measurement:</strong> Alice measures both of her qubits ($q_0$ and $q_1$) in the standard basis, obtaining two classical bits (e.g., $00$, $01$, $10$, or $11$). This measurement completely destroys the original state $|\\psi\\rangle$ on Alice's end.</li>
        <li><strong>Classical Communication:</strong> Alice sends these two classical bits to Bob over a standard communication channel (like a phone line or fiber optic cable).</li>
        <li><strong>Bob's Correction:</strong> Depending on the two bits received, Bob applies specific quantum gates (Pauli-X and/or Pauli-Z) to his qubit ($q_2$) to recover the exact state $|\\psi\\rangle$.</li>
      </ol>
    `,
    geometricProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Entanglement as a Resource</h4>
      <p>In teleportation, the entangled Bell state acts as a "quantum bridge". When Alice performs a joint measurement (a Bell State Measurement) on her message qubit and her half of the entangled pair, she forces the three-qubit system to collapse.</p>
      <br/>
      <p>Because Bob's qubit is deeply entangled with Alice's, the collapse on Alice's side instantly forces Bob's qubit into a state that is mathematically related to Alice's original message. However, from Bob's perspective, his qubit looks like random noise until Alice tells him <em>how</em> her side collapsed (the classical bits). The classical bits act as a "decoder key" that tells Bob which rotations to apply to spin his qubit into the exact original state.</p>
    `,
    algebraicProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Algebraic Mechanics</h4>
      <p>The initial state of the system ($|\\psi\\rangle \\otimes$ Bell Pair) is:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ |\\Psi_0\\rangle = (\\alpha|0\\rangle + \\beta|1\\rangle) \\otimes \\frac{1}{\\sqrt{2}}(|00\\rangle + |11\\rangle) $$
      </p>
      <p>After Alice applies a CNOT ($q_0 \\to q_1$) and a Hadamard on $q_0$, the state can be rewritten by grouping Alice's measurement possibilities:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ \\frac{1}{2} \\Big[ |00\\rangle(\\alpha|0\\rangle + \\beta|1\\rangle) + |01\\rangle(\\alpha|1\\rangle + \\beta|0\\rangle) + |10\\rangle(\\alpha|0\\rangle - \\beta|1\\rangle) + |11\\rangle(\\alpha|1\\rangle - \\beta|0\\rangle) \\Big] $$
      </p>
      <p>When Alice measures her two qubits, the superposition collapses. Bob's qubit ($q_2$) is forced into one of four states:</p>
      <ul style="list-style-type: disc; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 1rem;">
        <li>If Alice measures $00$, Bob has $\\alpha|0\\rangle + \\beta|1\\rangle$ (Apply Identity: $I$)</li>
        <li>If Alice measures $01$, Bob has $\\alpha|1\\rangle + \\beta|0\\rangle$ (Apply Bit Flip: $X$)</li>
        <li>If Alice measures $10$, Bob has $\\alpha|0\\rangle - \\beta|1\\rangle$ (Apply Phase Flip: $Z$)</li>
        <li>If Alice measures $11$, Bob has $\\alpha|1\\rangle - \\beta|0\\rangle$ (Apply Both: $ZX$)</li>
      </ul>
      <p>After Bob applies the correction gates based on Alice's classical bits, his qubit is exactly $\\alpha|0\\rangle + \\beta|1\\rangle$.</p>
    `,
    applications: [
      "Quantum Internet and quantum networking architectures.",
      "Quantum Repeaters (passing quantum information over long distances to combat photon loss).",
      "Moving quantum data between different processing units inside a modular quantum computer."
    ],
    limitations: [
      "Does not allow faster-than-light communication (requires a classical channel).",
      "Destroys the original quantum state on the sender's side (satisfying the No-Cloning theorem).",
      "Requires high-fidelity entanglement. In the real world, noise degrades the Bell pairs, requiring complex 'entanglement distillation'."
    ],
    code: `from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer
from qiskit.visualization import plot_histogram

# 3 qubits: q0 (Alice's msg), q1 (Alice's EPR), q2 (Bob's EPR)
# 2 classical bits: c0, c1 (for Alice to send to Bob)
qc = QuantumCircuit(3, 2)

# ==========================================
# 0. State Preparation (Alice's message to send)
# Let's put q0 in a specific state, e.g., |->
qc.x(0)
qc.h(0)
qc.barrier()
# ==========================================

# 1. Entanglement Distribution (Create Bell Pair between q1 and q2)
qc.h(1)
qc.cx(1, 2)
qc.barrier()

# 2. Alice's Operations
qc.cx(0, 1)
qc.h(0)
qc.barrier()

# 3. Alice's Measurements (into classical bits 0 and 1)
qc.measure(0, 0)
qc.measure(1, 1)
qc.barrier()

# 4 & 5. Classical Communication & Bob's Correction
# In Qiskit, we use c_if to apply gates conditionally based on classical bits
# If c1 == 1 (Alice's q1 was 1), Bob applies X
qc.x(2).c_if(1, 1)
# If c0 == 1 (Alice's q0 was 1), Bob applies Z
qc.z(2).c_if(0, 1)

# Bob's qubit (q2) is now exactly in the state Alice prepared!

# Let's verify by reversing the state preparation on Bob's qubit.
# If teleportation worked, applying H then X to q2 should return it to |0>.
qc.barrier()
qc.h(2)
qc.x(2)

# We add a 3rd classical bit just to measure Bob's outcome
qc.add_register(qiskit.ClassicalRegister(1, 'bob_measure'))
qc.measure(2, 2)

# Simulate
simulator = Aer.get_backend('aer_simulator')
compiled = transpile(qc, simulator)
job = simulator.run(compiled, shots=1000)
result = job.result()
counts = result.get_counts()

print(f"Results: {counts}")
# Notice the first digit (Bob's measurement) is ALWAYS '0', 
# proving he successfully received the |-> state!
`
  },
  "simon": {
    description: `
      <p><strong>Simon's Algorithm</strong>, formulated by Daniel Simon in 1994, is a quantum algorithm that solves a specific black-box problem exponentially faster than any classical algorithm.</p>
      <br/>
      <p>While Deutsch-Jozsa provided an exponential speedup for a problem that was somewhat artificial, Simon's problem was the first to demonstrate an exponential quantum advantage for a problem with a structure that closely mimics real-world cryptography. Its mathematical foundation directly inspired Peter Shor to create his famous factoring algorithm.</p>
    `,
    problemDescription: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Simon's Problem</h4>
      <p>Suppose you are given a black-box function $f$ that takes an $n$-bit string as input and returns an $n$-bit string. Mathematically, $f: \\{0, 1\\}^n \\to \\{0, 1\\}^n$.</p>
      <br/>
      <p>You are given a promise that the function is two-to-one (meaning exactly two inputs map to the exact same output), and it hides a secret bitstring $s$. Specifically, for any two inputs $x$ and $y$:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ f(x) = f(y) \\quad \\text{if and only if} \\quad x \\oplus y = s $$
      </p>
      <p><em>(Where $\\oplus$ is the bitwise XOR operation).</em></p>
      <p><strong>Goal:</strong> Find the secret string $s$. Classically, you would need to guess and check until you find a collision (two inputs with the same output). According to the Birthday Paradox, this takes roughly $O(2^{n/2})$ classical queries. Quantumly, Simon's algorithm finds $s$ in just $O(n)$ queries.</p>
    `,
    algorithm: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Step-by-Step Procedure</h4>
      <ol style="list-style-type: decimal; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 1rem;">
        <li><strong>Initialization:</strong> Prepare two quantum registers, each with $n$ qubits, initialized to $|0\\rangle^{\\otimes n} |0\\rangle^{\\otimes n}$.</li>
        <li><strong>Superposition:</strong> Apply a Hadamard ($H$) gate to all qubits in the first register to create a uniform superposition of all $2^n$ possible inputs.</li>
        <li><strong>The Oracle:</strong> Apply the quantum oracle $U_f$. This evaluates the function and stores the result in the second register: $|x\\rangle |0\\rangle \\to |x\\rangle |f(x)\\rangle$.</li>
        <li><strong>Interference:</strong> Apply a Hadamard gate to all qubits in the <em>first</em> register again.</li>
        <li><strong>Measurement:</strong> Measure the first register. The measured bitstring $y$ will perfectly satisfy the equation $y \\cdot s = 0 \\pmod 2$ (meaning $y$ is orthogonal to the secret string $s$).</li>
        <li><strong>Classical Post-Processing:</strong> Repeat the quantum circuit $\\approx n$ times to get a system of linear equations. Use classical Gaussian elimination to solve for the secret string $s$.</li>
      </ol>
    `,
    geometricProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Quantum Interference as a Filter</h4>
      <p>Imagine the quantum state right after the oracle is applied. For every possible output $z$, the first register is in a superposition of exactly two inputs that produced it: $|x\\rangle$ and $|x \\oplus s\\rangle$.</p>
      <br/>
      <p>When we apply the final set of Hadamard gates to the first register, we are mixing these two states. For any measurement outcome $y$, the probability amplitude is determined by a phase factor. Because of the math of the Hadamard gate, the phase associated with $|x\\rangle$ and the phase associated with $|x \\oplus s\\rangle$ will perfectly cancel each other out (destructive interference) UNLESS $y \\cdot s$ is an even number ($0 \\pmod 2$).</p>
      <p>Therefore, the quantum circuit completely filters out any string $y$ that does not help us solve for $s$.</p>
    `,
    algebraicProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Algebraic Mechanics</h4>
      <p>After the Oracle, the state of the two registers is:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ |\\psi_2\\rangle = \\frac{1}{\\sqrt{2^n}} \\sum_{x \\in \\{0,1\\}^n} |x\\rangle |f(x)\\rangle $$
      </p>
      <p>Applying $H^{\\otimes n}$ to the first register transforms each $|x\\rangle$ into $\\frac{1}{\\sqrt{2^n}} \\sum_y (-1)^{x \\cdot y} |y\\rangle$. The state becomes:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ |\\psi_3\\rangle = \\frac{1}{2^n} \\sum_{x} \\sum_{y} (-1)^{x \\cdot y} |y\\rangle |f(x)\\rangle $$
      </p>
      <p>Let's group the terms by the output of the function, $z = f(x)$. For each $z$, there are exactly two inputs $x_0$ and $x_0 \\oplus s$ that map to it. The amplitude for a specific $|y\\rangle$ state paired with $|z\\rangle$ is proportional to:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ (-1)^{x_0 \\cdot y} + (-1)^{(x_0 \\oplus s) \\cdot y} = (-1)^{x_0 \\cdot y} \\left( 1 + (-1)^{s \\cdot y} \\right) $$
      </p>
      <p>If $s \\cdot y = 1 \\pmod 2$, the term becomes $(1 - 1) = 0$. The probability of measuring this $y$ is exactly zero. We will only ever measure strings $y$ where $s \\cdot y = 0 \\pmod 2$.</p>
    `,
    applications: [
      "Inspired Shor's Algorithm, which breaks RSA encryption.",
      "Used in Quantum Cryptanalysis to break symmetric ciphers like the Even-Mansour cipher.",
      "Demonstrating the power of combining quantum circuits with classical post-processing."
    ],
    limitations: [
      "The algorithm itself does not find the answer outright; it only provides pieces of a puzzle (linear equations) that a classical computer must solve.",
      "Requires an error-free, highly specific oracle which is difficult to construct for real-world cryptographic hashes."
    ],
    code: `from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer
from qiskit.visualization import plot_histogram

# Setup for a 2-qubit Simon's problem
n = 2

# We need 2n qubits (2 for input, 2 for output)
qc = QuantumCircuit(n * 2, n)

# 1. Superposition: Apply Hadamard to input register
for i in range(n):
    qc.h(i)
qc.barrier()

# 2. The Oracle
# We will create an oracle for the secret string s = '11'
# If s = '11', then f(x) = f(x ⊕ 11). 
# Example mapping: f(00)=00, f(11)=00, f(01)=10, f(10)=10
qc.cx(0, 2)
qc.cx(1, 2)
# Qubit 3 remains 0, satisfying our mapping!
qc.barrier()

# 3. Interference: Apply Hadamard to input register again
for i in range(n):
    qc.h(i)
qc.barrier()

# 4. Measurement
for i in range(n):
    qc.measure(i, i)

# Simulate the circuit
simulator = Aer.get_backend('aer_simulator')
compiled = transpile(qc, simulator)
job = simulator.run(compiled, shots=1000)
result = job.result()
counts = result.get_counts()

print(f"Measurement Counts: {counts}")
# For s = '11', you will ONLY measure '00' and '11'.
# Why? Because:
# '00' · '11' = (0*1 + 0*1) = 0 mod 2
# '11' · '11' = (1*1 + 1*1) = 2 = 0 mod 2
# You will NEVER measure '01' or '10' because they dot-product to 1!
`
  },
  "bernstein-vazirani": {
    description: `
      <p>The <strong>Bernstein-Vazirani Algorithm</strong> was developed by Ethan Bernstein and Umesh Vazirani in 1992. It was designed to solve a specific black-box problem where a secret bitstring is hidden inside a function.</p>
      <br/>
      <p>Classically, finding a hidden $n$-bit string requires $n$ separate queries to the function (guessing one bit at a time). The Bernstein-Vazirani algorithm, remarkably, finds the entire secret $n$-bit string using exactly <strong>one</strong> quantum query, providing a linear speedup ($O(1)$ vs $O(n)$).</p>
    `,
    problemDescription: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">The Secret String Problem</h4>
      <p>Suppose you are given a black-box function $f$ that takes an $n$-bit string as input and returns a single bit. Mathematically, $f: \\{0, 1\\}^n \\to \\{0, 1\\}$.</p>
      <br/>
      <p>You are given a promise that the function is guaranteed to return the bitwise dot product of the input string $x$ and a secret hidden string $s$, modulo 2:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ f(x) = s \\cdot x \\pmod 2 = (s_0 x_0 \\oplus s_1 x_1 \\oplus \\dots \\oplus s_{n-1} x_{n-1}) $$
      </p>
      <p><strong>Goal:</strong> Discover the exact value of the secret string $s$.</p>
      <p>Classically, you must feed inputs with a single $1$ and the rest $0$s (e.g., $1000$, $0100$, $0010$) to reveal each bit of $s$ one by one. This takes $n$ queries.</p>
    `,
    algorithm: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Step-by-Step Procedure</h4>
      <p>Notice how similar this circuit is to Deutsch-Jozsa; the magic lies in how the oracle is constructed and how the math resolves.</p>
      <ol style="list-style-type: decimal; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 1rem;">
        <li><strong>Initialization:</strong> Prepare an $n$-qubit query register in $|0\\rangle^{\\otimes n}$, and a 1-qubit target register in $|1\\rangle$.</li>
        <li><strong>Superposition:</strong> Apply a Hadamard ($H$) gate to all $n+1$ qubits. The query register becomes a uniform superposition of all possible inputs. The target qubit becomes $|-\\rangle$.</li>
        <li><strong>The Oracle:</strong> Apply the quantum oracle $U_f$, mapping $|x\\rangle|y\\rangle \\to |x\\rangle|y \\oplus f(x)\\rangle$.</li>
        <li><strong>Interference:</strong> Apply a Hadamard gate to each of the $n$ qubits in the query register.</li>
        <li><strong>Measurement:</strong> Measure the $n$ query qubits. The binary string you measure will be <em>exactly</em> the secret string $s$.</li>
      </ol>
    `,
    geometricProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Perfect Constructive Interference</h4>
      <p>Once again, <strong>Phase Kickback</strong> is the star of the show. The target qubit in the $|-\\rangle$ state kicks back a phase of $(-1)^{f(x)}$ to the query register.</p>
      <br/>
      <p>Because $f(x)$ is literally the dot product $s \\cdot x$, the phase attached to every state $|x\\rangle$ in the superposition becomes $(-1)^{s \\cdot x}$.</p>
      <p>When you apply the final round of Hadamard gates, the quantum waves undergo massive interference. For every state <em>except</em> $|s\\rangle$, the positive and negative amplitudes perfectly cancel each other out (destructive interference). For the state $|s\\rangle$, all the amplitudes perfectly align (constructive interference), resulting in a 100% probability of measuring the secret string $s$.</p>
    `,
    algebraicProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Algebraic Mechanics</h4>
      <p>After applying $H$ to the initial state, we have a superposition of all $x$:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ |\\psi_1\\rangle = \\frac{1}{\\sqrt{2^n}} \\sum_{x=0}^{2^n-1} |x\\rangle \\otimes |-\\rangle $$
      </p>
      <p>Applying the Oracle $U_f$ kicks back the phase $(-1)^{f(x)} = (-1)^{s \\cdot x}$:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ |\\psi_2\\rangle = \\frac{1}{\\sqrt{2^n}} \\sum_{x=0}^{2^n-1} (-1)^{s \\cdot x} |x\\rangle \\otimes |-\\rangle $$
      </p>
      <p>Now, we apply the final $H^{\\otimes n}$ to the query register. The mathematical definition of applying Hadamards to a basis state $|x\\rangle$ is $\\frac{1}{\\sqrt{2^n}} \\sum_y (-1)^{x \\cdot y} |y\\rangle$. Substituting this in, the state becomes:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ |\\psi_3\\rangle = \\frac{1}{2^n} \\sum_{x} \\sum_{y} (-1)^{s \\cdot x} (-1)^{x \\cdot y} |y\\rangle = \\frac{1}{2^n} \\sum_{y} \\left[ \\sum_{x} (-1)^{x \\cdot (s \\oplus y)} \\right] |y\\rangle $$
      </p>
      <p>Look at the inner sum over $x$. If $y \\neq s$, then $(s \\oplus y)$ is non-zero, meaning half the terms are $+1$ and half are $-1$, so the sum is $0$. But if $y = s$, then $(s \\oplus y) = 0$, meaning $(-1)^0 = 1$ for all $2^n$ terms. The sum becomes $2^n$.</p>
      <p>Thus, the entire state collapses perfectly to $|s\\rangle$.</p>
    `,
    applications: [
      "Demonstrates how quantum algorithms can extract global properties (a full string) in a single operation.",
      "Acts as a foundational educational stepping stone towards understanding the Quantum Fourier Transform (QFT).",
      "Used as a subroutine in more complex quantum machine learning and cryptographic protocols."
    ],
    limitations: [
      "The problem is highly contrived; no real-world system naturally provides an oracle in this exact dot-product format without already knowing the answer.",
      "The speedup is only linear ($N$ vs $1$), which is less dramatic than the exponential speedups seen in Shor's or Simon's algorithms."
    ],
    code: `from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer
from qiskit.visualization import plot_histogram

# Let's define a secret string s
secret_string = '1011'
n = len(secret_string)

# We need n qubits for the query, plus 1 target qubit
qc = QuantumCircuit(n + 1, n)

# 1. State Preparation: Set target qubit to |1>
qc.x(n)
qc.barrier()

# 2. Superposition: Apply Hadamard to all qubits
for i in range(n + 1):
    qc.h(i)
qc.barrier()

# 3. The Oracle (Encoding the secret string)
# In Qiskit, qubit indices are reversed (q0 is the rightmost bit)
secret_string_reversed = secret_string[::-1]

# We apply a CNOT from query qubit 'i' to the target qubit 'n'
# ONLY IF the i-th bit of the secret string is '1'
for i in range(n):
    if secret_string_reversed[i] == '1':
        qc.cx(i, n)
qc.barrier()

# 4. Interference: Apply Hadamard to query qubits
for i in range(n):
    qc.h(i)
qc.barrier()

# 5. Measurement: Measure the query qubits
for i in range(n):
    qc.measure(i, i)

# Simulate the circuit
simulator = Aer.get_backend('aer_simulator')
compiled = transpile(qc, simulator)
job = simulator.run(compiled, shots=1)  # Notice we only need ONE shot!
result = job.result()
counts = result.get_counts()

print(f"Secret String discovered: {list(counts.keys())[0]}")
# Output will perfectly match '1011' in just one attempt!
`
  },
  "quantum-phase-estimation": {
    description: `
      <p><strong>Quantum Phase Estimation (QPE)</strong> is one of the most important subroutines in quantum computing. It is designed to estimate the phase (or eigenvalue) of an eigenvector of a unitary operator.</p>
      <br/>
      <p>Because quantum mechanics is built entirely on unitary matrices, finding their eigenvalues is crucial for everything from simulating molecules in quantum chemistry to breaking RSA encryption (Shor's algorithm relies entirely on a specialized version of QPE).</p>
    `,
    problemDescription: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">The Eigenvalue Problem</h4>
      <p>Suppose you are given a unitary operator $U$ and a quantum state $|\\psi\\rangle$ that is guaranteed to be an eigenvector of $U$.</p>
      <br/>
      <p>According to linear algebra, applying $U$ to its eigenvector will just scale it by an eigenvalue. Because $U$ is unitary, this eigenvalue must be a complex number with a magnitude of 1, meaning it can be written as $e^{2\\pi i \\theta}$.</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ U|\\psi\\rangle = e^{2\\pi i \\theta}|\\psi\\rangle $$
      </p>
      <p><strong>Goal:</strong> The value $\\theta$ is an unknown fraction between $0$ and $1$. Find the value of $\\theta$ to a high degree of precision.</p>
    `,
    algorithm: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Step-by-Step Procedure</h4>
      <p>The algorithm uses two registers: a "counting" register of $t$ qubits to store the answer, and a "target" register to hold the state $|\\psi\\rangle$.</p>
      <ol style="list-style-type: decimal; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 1rem;">
        <li><strong>Initialization:</strong> Prepare the counting register in the $|0\\rangle^{\\otimes t}$ state, and the target register in the $|\\psi\\rangle$ state.</li>
        <li><strong>Superposition:</strong> Apply Hadamard gates to all $t$ qubits in the counting register.</li>
        <li><strong>Controlled Unitaries:</strong> Apply controlled-$U$ operations from the counting register to the target register. The trick is to apply powers of $U$. The $j$-th counting qubit controls the operation $U^{2^j}$.</li>
        <li><strong>Inverse QFT:</strong> Apply the Inverse Quantum Fourier Transform (IQFT) to the $t$ counting qubits.</li>
        <li><strong>Measurement:</strong> Measure the counting register. The resulting binary integer $m$ gives the best estimate of the phase: $\\theta \\approx \\frac{m}{2^t}$.</li>
      </ol>
    `,
    geometricProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Phase Kickback and Unwinding</h4>
      <p>The core mechanic here is <strong>Phase Kickback</strong>. When a counting qubit controls the $U$ gate acting on $|\\psi\\rangle$, the eigenvalue phase $e^{2\\pi i \\theta}$ is kicked back onto the counting qubit.</p>
      <br/>
      <p>By applying $U^{2^j}$, we kick back the phase scaled by powers of 2. This perfectly encodes the binary fractional representation of $\\theta$ into the relative phases of the counting register. The state of the counting register becomes geometrically identical to the output of a Quantum Fourier Transform.</p>
      <p>To extract the number from these rotating phases, we simply run the QFT in reverse (the Inverse QFT). The IQFT acts as an interferometer, perfectly unwinding the phases and causing constructive interference exclusively on the computational basis state that corresponds to the binary decimal of $\\theta$.</p>
    `,
    algebraicProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Algebraic Mechanics</h4>
      <p>After applying the controlled-$U^{2^j}$ operations, the target register remains $|\\psi\\rangle$, but the counting register is transformed into:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ |\\text{count}\\rangle = \\frac{1}{\\sqrt{2^t}} \\sum_{k=0}^{2^t-1} e^{2\\pi i \\theta k} |k\\rangle $$
      </p>
      <p>If we look closely at this state, it is the exact mathematical definition of the Quantum Fourier Transform applied to the state $|2^t \\theta\\rangle$.</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ |\\text{count}\\rangle = QFT |2^t \\theta\\rangle $$
      </p>
      <p>Therefore, to retrieve the value $2^t \\theta$, we just apply the Inverse QFT:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ IQFT \\left( QFT |2^t \\theta\\rangle \\right) = |2^t \\theta\\rangle $$
      </p>
      <p>Measuring this state gives the integer $m = 2^t \\theta$. Dividing by $2^t$ gives us our exact phase $\\theta$. (If $\\theta$ cannot be perfectly represented by $t$ bits, the result will be an incredibly close approximation).</p>
    `,
    applications: [
      "Quantum Chemistry: Finding the ground state energies of molecules (simulating the Hamiltonian).",
      "Shor's Algorithm: Used specifically for period finding (order finding subroutine).",
      "HHL Algorithm: Used for solving massive systems of linear equations exponentially faster."
    ],
    limitations: [
      "Requires an exact eigenvector to be prepared. If you provide a superposition of eigenvectors, QPE will collapse it into a random one, giving you only one of the eigenvalues.",
      "High circuit depth: Calculating massive powers like $U^{1024}$ requires incredibly deep and complex quantum circuits.",
      "Requires many clean, error-corrected qubits to achieve high precision."
    ],
    code: `from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer
from qiskit.circuit.library import QFT
import numpy as np
from math import pi

# Let's estimate the phase of a P-gate with theta = 1/8 (0.125)
# P-gate matrix applies e^(i * lambda) to the |1> state.
# We want lambda = 2 * pi * (1/8) = pi/4
theta = 1/8
gate_angle = 2 * pi * theta

t = 3  # Number of counting qubits (we need 3 bits to perfectly represent 1/8)
qc = QuantumCircuit(t + 1, t)

# 1. State Preparation
# Set the target qubit to |1> (the eigenvector of the P-gate with eigenvalue e^(i*lambda))
qc.x(t)
qc.barrier()

# 2. Superposition for counting qubits
for i in range(t):
    qc.h(i)
qc.barrier()

# 3. Controlled Unitaries (U^(2^j))
# We apply controlled-P gates. Each time, we square the unitary (multiply angle by 2)
repetitions = 1
for counting_qubit in range(t):
    for i in range(repetitions):
        qc.cp(gate_angle, counting_qubit, t)
    repetitions *= 2
qc.barrier()

# 4. Inverse QFT on the counting register
qc.append(QFT(t, inverse=True), range(t))
qc.barrier()

# 5. Measurement
for i in range(t):
    qc.measure(i, i)

# Simulate
simulator = Aer.get_backend('aer_simulator')
compiled = transpile(qc, simulator)
job = simulator.run(compiled, shots=1000)
result = job.result()
counts = result.get_counts()

print(f"Measurement Counts: {counts}")
# The result will be '001'. 
# Binary '001' is 1 in decimal. 
# Theta = m / 2^t = 1 / 2^3 = 1/8 = 0.125!
`
  },
  "superdense-coding": {
    description: `
      <p><strong>Superdense Coding</strong> is the twin protocol to Quantum Teleportation, proposed by Bennett and Wiesner in 1992. While teleportation uses two classical bits to send one qubit, superdense coding uses one qubit to send <strong>two</strong> classical bits.</p>
      <br/>
      <p>By utilizing quantum entanglement (a shared Bell pair), Alice can encode two bits of classical information (00, 01, 10, or 11) into a single qubit and send it to Bob. This effectively doubles the channel capacity of a quantum communication line.</p>
    `,
    problemDescription: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">The Bandwidth Problem</h4>
      <p>Suppose Alice wants to send a 2-bit classical message to Bob (e.g., $11$). Classically, she must send two separate physical bits (like two photons or two electrical pulses) through the communication channel.</p>
      <br/>
      <p><strong>Goal:</strong> Send those 2 classical bits by transmitting only 1 physical qubit across the channel, exploiting a previously shared entangled state.</p>
    `,
    algorithm: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Step-by-Step Procedure</h4>
      <ol style="list-style-type: decimal; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 1rem;">
        <li><strong>Entanglement Distribution:</strong> Alice and Bob share a maximally entangled Bell pair. Alice has qubit $A$ and Bob has qubit $B$.</li>
        <li><strong>Alice's Encoding:</strong> Alice wants to send two classical bits ($b_1 b_2$). Based on her message, she applies a specific quantum gate to her qubit $A$:
          <ul style="list-style-type: disc; margin-left: 1.5rem; margin-top: 0.25rem;">
            <li>If $00$: Apply Identity ($I$)</li>
            <li>If $01$: Apply Pauli-X ($X$)</li>
            <li>If $10$: Apply Pauli-Z ($Z$)</li>
            <li>If $11$: Apply Pauli-Z then Pauli-X ($ZX$)</li>
          </ul>
        </li>
        <li><strong>Transmission:</strong> Alice physically sends her single qubit $A$ to Bob over a quantum channel (like a fiber optic cable).</li>
        <li><strong>Bob's Decoding:</strong> Bob now has both qubits. He applies a CNOT gate (control=$A$, target=$B$), followed by a Hadamard gate on qubit $A$.</li>
        <li><strong>Measurement:</strong> Bob measures both qubits in the computational basis. The result perfectly matches Alice's 2-bit message!</li>
      </ol>
    `,
    geometricProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Navigating the Bell Basis</h4>
      <p>There are four distinct, orthogonal maximally entangled states called the <strong>Bell States</strong>. Because Alice and Bob's qubits are deeply linked, applying a localized rotation (X or Z) only to Alice's half of the pair actually shifts the <em>entire global state</em> of both qubits from one Bell state into another.</p>
      <br/>
      <p>By applying her gates, Alice is effectively choosing which of the four Bell states the system is in. When she sends her qubit to Bob, Bob performs a "Bell State Measurement" (the CNOT + Hadamard). This measurement maps the four complex Bell states perfectly back into the four standard classical computational states ($|00\\rangle, |01\\rangle, |10\\rangle, |11\\rangle$).</p>
    `,
    algebraicProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Algebraic Mechanics</h4>
      <p>The initial shared Bell state is:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ |\\Phi^+\\rangle = \\frac{1}{\\sqrt{2}}(|00\\rangle + |11\\rangle) $$
      </p>
      <p>If Alice wants to send $11$, she applies $Z$ then $X$ to her qubit (the first qubit).<br/>
      Applying $Z$ flips the phase of $|1\\rangle$: $\\frac{1}{\\sqrt{2}}(|00\\rangle - |11\\rangle)$.<br/>
      Applying $X$ flips the bits of Alice's qubit: $\\frac{1}{\\sqrt{2}}(|10\\rangle - |01\\rangle)$.</p>
      <p>Bob receives this state and applies CNOT (Alice's qubit is control). The state becomes:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ \\frac{1}{\\sqrt{2}}(|11\\rangle - |01\\rangle) = \\frac{1}{\\sqrt{2}}(|1\\rangle - |0\\rangle) \\otimes |1\\rangle = -|-\\rangle \\otimes |1\\rangle $$
      </p>
      <p>Bob then applies a Hadamard to the first qubit, turning $-|-\\rangle$ into $-|1\\rangle$. The global state is now $-|11\\rangle$. When measured, the negative phase disappears, and Bob reads exactly $11$!</p>
    `,
    applications: [
      "Quantum secure direct communication.",
      "Doubling the efficiency of quantum networking and quantum memory storage.",
      "Fundamental testing of Bell's Theorem and quantum non-locality."
    ],
    limitations: [
      "Requires pre-shared entanglement. Generating and storing stable Bell pairs is technologically difficult.",
      "Vulnerable to noise in the quantum channel. If the sent qubit decoheres, the message is lost."
    ],
    code: `from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer

# Alice wants to send the message '10'
message = '10'

qc = QuantumCircuit(2, 2)

# 1. Entanglement Distribution (Create Bell Pair)
qc.h(0)
qc.cx(0, 1)
qc.barrier()

# 2. Alice's Encoding (on Qubit 0)
if message == '01':
    qc.x(0)
elif message == '10':
    qc.z(0)
elif message == '11':
    qc.z(0)
    qc.x(0)
qc.barrier()

# 3. Transmission (Physically sending Qubit 0 to Bob)
# (Implicit in the circuit moving forward)

# 4. Bob's Decoding
qc.cx(0, 1)
qc.h(0)
qc.barrier()

# 5. Measurement
qc.measure([0, 1], [0, 1])

# Simulate
simulator = Aer.get_backend('aer_simulator')
compiled = transpile(qc, simulator)
job = simulator.run(compiled, shots=1000)
result = job.result()

print(f"message received by Bob: {list(result.get_counts().keys())[0]}")
# The output will perfectly match Alice's message: '10'
`
  },
  
  "vqe": {
    description: `
      <p>The <strong>Variational Quantum Eigensolver (VQE)</strong> is a flagship algorithm of the NISQ (Noisy Intermediate-Scale Quantum) era. It is a hybrid quantum-classical algorithm used to find the ground state energy (the lowest eigenvalue) of a large mathematical matrix called a Hamiltonian.</p>
      <br/>
      <p>Because it keeps quantum circuits short and delegates the heavy optimization math to a classical computer, it is highly resilient to the noise present in today's quantum hardware. It has massive implications for simulating molecules in quantum chemistry and discovering new materials.</p>
    `,
    problemDescription: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">The Ground State Problem</h4>
      <p>In physics and chemistry, the properties of a molecule (like how it binds or reacts) are determined by its lowest energy state, known as the ground state. This energy is represented by the lowest eigenvalue $E_0$ of the system's Hamiltonian matrix $H$.</p>
      <br/>
      <p>For large molecules, the matrix $H$ grows exponentially (a 50-electron system has a matrix larger than the number of atoms in the universe). Classical computers cannot even store this matrix, let alone find its eigenvalues.</p>
      <p><strong>Goal:</strong> Find $E_0$ such that $H|\\psi_0\\rangle = E_0|\\psi_0\\rangle$, using a quantum computer to handle the exponential scaling.</p>
    `,
    algorithm: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">The Hybrid Loop Procedure</h4>
      <ol style="list-style-type: decimal; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 1rem;">
        <li><strong>The Ansatz:</strong> Define a parameterized quantum circuit (an "Ansatz") with tunable rotation gates (parameters $\\vec{\\theta}$). This circuit prepares a trial quantum state $|\\psi(\\vec{\\theta})\\rangle$.</li>
        <li><strong>Quantum Evaluation:</strong> Run the circuit on the quantum computer to prepare the state, and measure the expectation value (average energy) of the Hamiltonian: $E(\\vec{\\theta}) = \\langle \\psi(\\vec{\\theta}) | H | \\psi(\\vec{\\theta}) \\rangle$.</li>
        <li><strong>Classical Optimization:</strong> Send the resulting energy value $E(\\vec{\\theta})$ to a classical optimizer (like Gradient Descent or COBYLA).</li>
        <li><strong>Parameter Update:</strong> The classical optimizer adjusts the parameters $\\vec{\\theta}$ to try and find a lower energy.</li>
        <li><strong>Loop:</strong> Feed the new parameters back into the quantum circuit. Repeat steps 1-4 until the energy converges to a minimum. This minimum is the ground state energy!</li>
      </ol>
    `,
    geometricProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Navigating the Hilbert Space</h4>
      <p>Think of the quantum state space (Hilbert space) as a massive, multi-dimensional landscape of hills and valleys. The height of the terrain represents the energy of the molecule. The ground state is the absolute deepest valley.</p>
      <br/>
      <p>The Ansatz circuit is like a remote-controlled drone. The parameters $\\vec{\\theta}$ are the coordinates. The quantum computer's job is simply to read the altimeter (measure the energy) at the current coordinates. The classical computer acts as the pilot, looking at the altimeter readings and deciding which direction to steer the drone (updating $\\vec{\\theta}$) to fly further down into the valley.</p>
    `,
    algebraicProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">The Rayleigh-Ritz Variational Principle</h4>
      <p>VQE is mathematically guaranteed to work by the Variational Principle of quantum mechanics. It states that for any valid quantum state $|\\psi\\rangle$ and a Hamiltonian $H$, the expectation value is <em>always</em> greater than or equal to the true ground state energy $E_0$:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ \\frac{\\langle \\psi | H | \\psi \\rangle}{\\langle \\psi | \\psi \\rangle} \\ge E_0 $$
      </p>
      <p>Because quantum states are normalized ($\\langle \\psi | \\psi \\rangle = 1$), this simplifies to:</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ \\langle \\psi(\\vec{\\theta}) | H | \\psi(\\vec{\\theta}) \\rangle \\ge E_0 $$
      </p>
      <p>This means our classical optimizer can just blindly minimize the function $f(\\vec{\\theta})$. We are mathematically guaranteed that we can never accidentally go lower than the true ground state. The lowest value we find is our best approximation of $E_0$.</p>
    `,
    applications: [
      "Quantum Chemistry: Finding molecular bonding energies (e.g., simulating Lithium Hydride).",
      "Material Science: Discovering new catalysts for carbon capture or nitrogen fixation.",
      "Combinatorial Optimization: Solving the Max-Cut problem via QAOA (a variant of VQE)."
    ],
    limitations: [
      "Barren Plateaus: For very deep circuits, the gradients vanish, leaving the classical optimizer 'blind' on a flat surface.",
      "Hardware Noise: While resilient, too much noise will blur the 'energy landscape', making it impossible to find the true minimum.",
      "Measurement Overhead: Measuring a complex Hamiltonian requires grouping it into thousands of Pauli strings, taking millions of quantum shots."
    ],
    code: `# NOTE: VQE requires complex Hamiltonian mapping (like Pauli strings) 
# and classical optimizers. This is a conceptual Qiskit structure.

from qiskit.circuit.library import TwoLocal
from qiskit.algorithms.optimizers import COBYLA
from qiskit.primitives import Estimator
# (In real applications, you'd import a Hamiltonian from Qiskit Nature)

def cost_function(params, ansatz, hamiltonian, estimator):
    """The function the classical optimizer wants to minimize."""
    # Bind the classical parameters to the quantum circuit
    bound_circuit = ansatz.bind_parameters(params)
    
    # Evaluate the expectation value <psi|H|psi>
    job = estimator.run(bound_circuit, hamiltonian)
    energy = job.result().values[0]
    
    return energy

# 1. Define the Ansatz (parameterized circuit)
# TwoLocal creates a circuit with rotating RY gates and entangling CX gates
ansatz = TwoLocal(num_qubits=2, rotation_blocks='ry', entanglement_blocks='cx', reps=1)
initial_params = [0.0] * ansatz.num_parameters

# 2. Setup the classical optimizer
optimizer = COBYLA(maxiter=100)
estimator = Estimator() # Qiskit Primitive to calculate expectation values

# (Mock Hamiltonian: e.g., Z on qubit 0)
from qiskit.quantum_info import SparsePauliOp
hamiltonian = SparsePauliOp.from_list([("ZI", 1.0)])

# 3. Run the hybrid loop!
result = optimizer.minimize(
    fun=cost_function,
    x0=initial_params,
    args=(ansatz, hamiltonian, estimator)
)

print(f"Optimized Parameters: {result.x}")
print(f"Ground State Energy: {result.fun}")
`
  },

  "bb84": {
    description: `
      <p><strong>BB84</strong> is the world's first Quantum Key Distribution (QKD) protocol, developed by Charles Bennett and Gilles Brassard in 1984. It is not a computational algorithm, but a cryptographic protocol.</p>
      <br/>
      <p>It allows two parties (Alice and Bob) to generate a shared, completely secret random key over an insecure public channel. Its security is mathematically guaranteed by the laws of quantum mechanics (specifically, the No-Cloning Theorem and wave-function collapse), meaning it is entirely unhackable, even by a quantum computer.</p>
    `,
    problemDescription: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">The Key Exchange Problem</h4>
      <p>To use uncrackable encryption like the One-Time Pad, Alice and Bob must both possess the exact same random string of bits (the key). They must send this key over the internet.</p>
      <br/>
      <p>If an eavesdropper (Eve) intercepts a classical data transmission, she can quietly copy the bits and send them along. Alice and Bob would never know they were compromised.</p>
      <p><strong>Goal:</strong> Send a key in such a way that if Eve tries to intercept and read it, her very act of looking will physically corrupt the data, alerting Alice and Bob to her presence.</p>
    `,
    algorithm: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Step-by-Step Procedure</h4>
      <ol style="list-style-type: decimal; margin-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 1rem;">
        <li><strong>Alice's Preparation:</strong> Alice generates a random string of bits (0s and 1s). For each bit, she randomly chooses to encode it into a photon using either the Rectilinear basis ($+$) or the Diagonal basis ($\\times$). She sends the photons to Bob.</li>
        <li><strong>Bob's Measurement:</strong> Bob receives the photons. He doesn't know Alice's bases, so for each photon, he randomly guesses which basis to measure in ($+$ or $\\times$).</li>
        <li><strong>Classical Sifting:</strong> After all photons are measured, Alice calls Bob on a normal, public phone line. They tell each other <em>which bases</em> they used for each photon (but NOT the actual bit values 0 or 1).</li>
        <li><strong>Key Generation:</strong> They throw away any bits where they used different bases. The remaining bits (where their random bases happened to match) form the secret key.</li>
        <li><strong>Eavesdropper Check:</strong> They compare a small random subset of their secret key publicly. If Eve tried to measure the photons in transit, her incorrect basis guesses would have collapsed the quantum states, introducing a 25% error rate. If they detect errors, they abort!</li>
      </ol>
    `,
    geometricProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Non-Orthogonal Bases</h4>
      <p>The protocol relies on using two sets of states on the Bloch sphere that are 45 degrees offset from each other. In Qiskit terms, the Z-basis ($|0\\rangle$, $|1\\rangle$) and the X-basis ($|+\\rangle$, $|-\\rangle$).</p>
      <br/>
      <p>If Alice encodes a $0$ in the Z-basis ($|0\\rangle$) and Bob measures in the Z-basis, he gets $0$ with 100% certainty.</p>
      <p>But, if Eve intercepts the $|0\\rangle$ photon and randomly guesses the X-basis, she forces the photon to collapse into either $|+\\rangle$ or $|-\\rangle$. When she passes this ruined photon to Bob, and Bob measures in the correct Z-basis, the $|+\\rangle$ state gives him a 50/50 chance of getting a $1$ instead of a $0$. Eve's measurement permanently destroyed the original information!</p>
    `,
    algebraicProof: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">Algebraic Mechanics of Eavesdropping</h4>
      <p>Let's do the math on Eve's interference.</p>
      <p>Assume Alice sends a $0$ in the Standard ($+$) basis. State is $|\\psi\\rangle = |0\\rangle$.</p>
      <p>Eve intercepts and randomly chooses the Hadamard ($\\times$) basis to measure. The probability she measures $|+\\rangle$ is $|\\langle + | 0 \\rangle|^2 = |\\frac{1}{\\sqrt{2}}|^2 = 50\\%$. Let's say she gets $|+\\rangle$. She sends $|+\\rangle$ to Bob.</p>
      <p>Bob measures in the correct Standard ($+$) basis (matching Alice). What is the probability Bob measures the correct bit $0$?</p>
      <p style="background: rgba(0,0,0,0.05); padding: 0.5rem; border-radius: 4px; font-family: monospace; margin: 0.5rem 0;">
        $$ P(0) = |\\langle 0 | + \\rangle|^2 = \\left| \\frac{1}{\\sqrt{2}} \\right|^2 = 0.5 $$
      </p>
      <p>Bob has a 50% chance of measuring a $1$ (an error). Since Eve picks the wrong basis 50% of the time, and causes an error 50% of the time she is wrong, Eve introduces a $0.5 \\times 0.5 = 0.25$ (25%) error rate into the sifted key. This massive error spike is instantly detectable.</p>
    `,
    applications: [
      "Securing military, government, and banking communications against future quantum computer attacks.",
      "Quantum Networks (already deployed commercially in cities like Geneva and Beijing)."
    ],
    limitations: [
      "Hardware intensive: Requires single-photon emitters and incredibly sensitive single-photon avalanche detectors.",
      "Distance limited: Photons get lost in fiber optic cables over long distances (max ~100-200 km without quantum repeaters).",
      "Vulnerable to side-channel attacks (e.g., hackers blinding Bob's detectors with bright lasers)."
    ],
    code: `import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer

# 1. Alice generates random bits and random bases
n_bits = 10
alice_bits = np.random.randint(2, size=n_bits)
# 0 means Z-basis (+), 1 means X-basis (x)
alice_bases = np.random.randint(2, size=n_bits) 

# Alice prepares the quantum circuit
qc = QuantumCircuit(n_bits, n_bits)
for i in range(n_bits):
    if alice_bits[i] == 1:
        qc.x(i) # Bit is 1
    if alice_bases[i] == 1:
        qc.h(i) # Change to X-basis
qc.barrier()

# 2. (Skipping Eve for this simulation)

# 3. Bob guesses random bases
bob_bases = np.random.randint(2, size=n_bits)

# Bob measures
for i in range(n_bits):
    if bob_bases[i] == 1:
        qc.h(i) # Bob measures in X-basis
    qc.measure(i, i)

# Simulate
simulator = Aer.get_backend('aer_simulator')
job = simulator.run(transpile(qc, simulator), shots=1)
# Qiskit outputs string in reverse order, so we reverse it back
bob_results = list(job.result().get_counts().keys())[0][::-1]
bob_bits = [int(b) for b in bob_results]

# 4. Sifting (They publicly compare bases over the phone)
sifted_key = []
for i in range(n_bits):
    if alice_bases[i] == bob_bases[i]:
        sifted_key.append(bob_bits[i])

print(f"Alice's Bases: {alice_bases}")
print(f"Bob's Bases:   {bob_bases}")
print(f"Matches found: {len(sifted_key)}")
print(f"Secret Key:    {sifted_key}")
`
  },
  "default": {
    description: `
      <p>This is a foundational quantum algorithm demonstrating specific principles of quantum mechanics, such as superposition, entanglement, or phase kickback.</p>
    `,
    problemDescription: `
      <p>The algorithm solves a specific oracle-based problem or demonstrates a computational speedup over classical counterparts.</p>
    `,
    algorithm: `
      <h4 style="font-weight: bold; margin-bottom: 0.5rem; color: var(--color-app-text-main);">General Procedure</h4>
      <ol style="list-style-type: decimal; margin-left: 1.5rem; margin-top: 0.5rem; space-y: 0.5rem;">
        <li><strong>Initialization:</strong> Prepare the qubits in a standard initial state, usually $|0\rangle^{\otimes n}$.</li>
        <li><strong>Superposition:</strong> Apply Hadamard gates to create a uniform superposition.</li>
        <li><strong>Oracle Application:</strong> Apply a problem-specific unitary oracle that encodes the problem into the phase or amplitudes of the quantum state.</li>
        <li><strong>Interference:</strong> Apply further unitary gates (like another layer of Hadamards or a QFT) to cause constructive interference for the correct answer and destructive interference for incorrect answers.</li>
        <li><strong>Measurement:</strong> Measure the qubits to collapse the state and read out the classical bit string solution.</li>
      </ol>
    `,
    geometricProof: `
      <p>In general, quantum algorithms operate by rotating state vectors in a high-dimensional Hilbert space. Oracles typically act as reflections across specific hyperplanes, while algorithms like Grover's use amplitude amplification (iterative reflections) to deterministically steer the state vector toward the desired solution.</p>
    `,
    algebraicProof: `
      <p>The mathematics typically involves tensor products of unitary matrices applied to basis states. Phase kickback is a common technique where the eigenvalue of an operation applied to a target qubit is "kicked back" as a phase on the control qubit.</p>
    `,
    applications: [
      "Demonstrating quantum supremacy / advantage",
      "Subroutines for more complex algorithms (e.g. Shor's)"
    ],
    limitations: [
      "Often solves highly contrived 'black-box' (oracle) problems that don't have direct real-world mappings without significant overhead."
    ]
  }
};
