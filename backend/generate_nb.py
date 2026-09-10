import nbformat as nbf
nb = nbf.v4.new_notebook()

# Cell 1: Parameters (must have tags=['parameters'])
code1 = '''# Parameters
num_qubits = 3
target_state = '101'
iterations = 2
'''
cell1 = nbf.v4.new_code_cell(code1)
cell1.metadata['tags'] = ['parameters']

# Cell 2: Setup matplotlib inline so images get captured in notebook output
code_setup = '''%matplotlib inline
import matplotlib
matplotlib.use('agg')
'''
cell_setup = nbf.v4.new_code_cell(code_setup)

# Cell 3: Qiskit Logic - build and draw circuit
code2 = '''
import warnings
warnings.filterwarnings('ignore')

from qiskit import QuantumCircuit, transpile
from qiskit_aer import Aer
from qiskit.visualization import circuit_drawer, plot_histogram
import matplotlib.pyplot as plt

num_qubits = int(num_qubits)
iterations = int(iterations)
target_state = str(target_state)

if len(target_state) != num_qubits:
    target_state = '1' * num_qubits

print(f"Running Grover on {num_qubits} qubits to find |{target_state}⟩")

qc = QuantumCircuit(num_qubits)
for i in range(num_qubits):
    qc.h(i)

for _ in range(iterations):
    qc.barrier()
    # Oracle
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
    # Diffuser
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

# Draw circuit — the display() call ensures the image is captured in notebook output
fig = circuit_drawer(qc, output='mpl')
display(fig)
plt.close(fig)
'''
cell2 = nbf.v4.new_code_cell(code2)

# Cell 4: Simulation and Graph
code3 = '''
simulator = Aer.get_backend('aer_simulator')
compiled_circuit = transpile(qc, simulator)
job = simulator.run(compiled_circuit, shots=1000)
result = job.result()
counts = result.get_counts()

print(f"Measurement results: {counts}")

# Draw histogram
fig2 = plot_histogram(counts)
display(fig2)
plt.close(fig2)
'''
cell3 = nbf.v4.new_code_cell(code3)

nb.cells = [cell1, cell_setup, cell2, cell3]
with open('notebooks/grover-search.ipynb', 'w', encoding='utf-8') as f:
    nbf.write(nb, f)
print('Notebook created successfully.')
