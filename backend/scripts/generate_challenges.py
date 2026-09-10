import json
import numpy as np
import random
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector

def get_binary_string(val, num_qubits):
    return "|" + bin(val)[2:].zfill(num_qubits) + "⟩"

def generate_challenges(num_challenges=100, start_id=14):
    challenges = []
    
    for i in range(num_challenges):
        num_qubits = random.choice([1, 2, 3])
        qc = QuantumCircuit(num_qubits)
        
        num_gates = random.randint(1, 4)
        allowed_gates = set(["H", "X"])
        
        for _ in range(num_gates):
            gate_type = random.choice(["H", "X", "CX"])
            allowed_gates.add(gate_type)
            if gate_type in ["H", "X"]:
                q1 = random.randint(0, num_qubits - 1)
                if gate_type == "H":
                    qc.h(q1)
                else:
                    qc.x(q1)
            elif gate_type == "CX":
                if num_qubits > 1:
                    q1 = random.randint(0, num_qubits - 1)
                    q2 = random.randint(0, num_qubits - 1)
                    while q1 == q2:
                        q2 = random.randint(0, num_qubits - 1)
                    qc.cx(q1, q2)
                else:
                    qc.x(0)

        sv = Statevector.from_instruction(qc)
        actual_state = np.abs(sv.data)**2
        
        # Build target string
        state_parts = []
        for idx, prob in enumerate(actual_state):
            if prob > 0.01:
                pct = round(prob * 100)
                state_parts.append(f"{pct}% {get_binary_string(idx, num_qubits)}")
        
        target_str = " + ".join(state_parts)
        if len(state_parts) == 0:
            target_str = "100% " + get_binary_string(0, num_qubits)
            actual_state[0] = 1.0
            
        challenges.append({
            "id": start_id + i,
            "title": f"Advanced Challenge {start_id + i}",
            "desc": f"Construct a {num_qubits}-qubit circuit that produces the exact probability distribution shown below. Hint: You might need to use superposition and entanglement.",
            "numQubits": num_qubits,
            "targetState": actual_state.tolist(),
            "targetStr": target_str,
            "allowedGates": list(allowed_gates)
        })
        
    with open("src/data/generated_challenges.json", "w") as f:
        json.dump(challenges, f, indent=2)
        
    print(f"Generated {num_challenges} meaningful challenges!")

if __name__ == "__main__":
    import os
    os.makedirs("src/data", exist_ok=True)
    generate_challenges()
