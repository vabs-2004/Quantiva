#!/usr/bin/env python3
"""
Quantum Circuit Time Machine - Noisy Timeline Evaluator (Stage 6)
Evaluates quantum circuit state step-by-step under physical and classical noise channels.
Simulates exact DensityMatrix evolution in lockstep with ideal Statevector evolution.
Outputs compact observables and cross-sectional divergence metrics as structured JSON.
"""

import sys
import json
import math
import numpy as np

try:
    from qiskit import QuantumCircuit
    from qiskit.quantum_info import Statevector, DensityMatrix, partial_trace
    from qiskit_aer.noise import depolarizing_error, pauli_error
except ImportError as e:
    sys.stderr.write(f"Qiskit / Aer import error: {e}\n")
    print(json.dumps({
        "success": False,
        "error": "Qiskit or Qiskit Aer is not installed or could not be loaded in the Python environment."
    }))
    sys.exit(1)

SUPPORTED_GATES = {
    "I", "H", "X", "Y", "Z", "S", "T", "SX", "SDG", "TDG", "CX", "SWAP", "M"
}
TWO_QUBIT_GATES = {"CX", "SWAP"}
SUPPORTED_NOISE_MODELS = {"depolarizing", "phase_flip", "bit_flip", "readout"}
MAX_QUBITS = 8
MAX_GATES = 30
DIVERGENCE_THRESHOLD = 0.05  # D_k >= 0.05 marks meaningful divergence


def calculate_bloch_components(rho_matrix):
    """
    Given a 2x2 reduced density matrix rho, calculate the Bloch coordinates (x, y, z),
    radius r, purity, spherical coordinates (theta, phi), and mixed/entanglement status.
    """
    rho_00 = rho_matrix[0, 0].real
    rho_11 = rho_matrix[1, 1].real
    rho_01 = rho_matrix[0, 1]
    rho_10 = rho_matrix[1, 0]

    x = float(2.0 * rho_01.real)
    y = float(2.0 * rho_10.imag)
    z = float(rho_00 - rho_11)

    r = float(math.sqrt(max(0.0, x * x + y * y + z * z)))
    r_clamped = min(1.0, r)

    # Purity: Tr(rho^2) = (1 + r^2) / 2
    purity = float(np.real(np.trace(rho_matrix @ rho_matrix)))
    purity = max(0.5, min(1.0, purity))

    if r > 1e-6:
        cos_theta = max(-1.0, min(1.0, z / r))
        theta = float(math.acos(cos_theta))
        phi = float(math.atan2(y, x) % (2.0 * math.pi))
    else:
        theta = 0.0
        phi = 0.0
        r_clamped = 0.0

    return {
        "x": round(x, 6),
        "y": round(y, 6),
        "z": round(z, 6),
        "r": round(r_clamped, 6),
        "theta": round(theta, 6),
        "phi": round(phi, 6),
        "purity": round(purity, 6),
    }


def compute_bloch_vectors(state_obj, num_qubits, is_density_matrix=False):
    """
    Computes 1-qubit reduced Bloch vectors for each qubit wire.
    """
    vectors = []
    for q in range(num_qubits):
        if num_qubits == 1:
            if is_density_matrix:
                rho = state_obj.data
            else:
                ket = state_obj.data.reshape((2, 1))
                rho = ket @ ket.conj().T
        else:
            trace_qubits = [k for k in range(num_qubits) if k != q]
            rho_obj = partial_trace(state_obj, trace_qubits)
            rho = rho_obj.data

        bloch = calculate_bloch_components(rho)
        bloch["qubit"] = q
        vectors.append(bloch)
    return vectors


def create_quantum_channel(noise_model, p):
    """
    Instantiates the 1-qubit Qiskit Aer SuperOp noise channel for a given noise model and strength p.
    """
    if p <= 0.0:
        return None
    if noise_model == "depolarizing":
        return depolarizing_error(p, 1).to_quantumchannel()
    elif noise_model == "phase_flip":
        return pauli_error([('Z', p), ('I', 1.0 - p)]).to_quantumchannel()
    elif noise_model == "bit_flip":
        return pauli_error([('X', p), ('I', 1.0 - p)]).to_quantumchannel()
    elif noise_model == "readout":
        return None
    else:
        raise ValueError(f"Unknown noise model '{noise_model}'.")


def apply_readout_confusion(probs_dict, target_wires, num_qubits, p):
    """
    Applies the single-qubit classical confusion matrix M = [[1-p, p], [p, 1-p]]
    independently to the target wires in the basis probabilities dictionary.
    In Qiskit basis strings |q(n-1)...q1 q0>, wire w is at index (num_qubits - 1 - w).
    """
    if p <= 0.0 or not target_wires:
        return dict(probs_dict)

    current_probs = dict(probs_dict)
    for w in sorted(target_wires):
        bit_idx = num_qubits - 1 - w
        next_probs = {}
        for bitstring in current_probs:
            b = bitstring[bit_idx]
            other_b = "1" if b == "0" else "0"
            flipped = bitstring[:bit_idx] + other_b + bitstring[bit_idx + 1:]

            p_self = current_probs.get(bitstring, 0.0)
            p_flip = current_probs.get(flipped, 0.0)
            # P_obs(b) = (1 - p) * P_true(b) + p * P_true(flipped)
            next_probs[bitstring] = (1.0 - p) * p_self + p * p_flip
        current_probs = next_probs

    return {k: round(v, 6) for k, v in current_probs.items()}


def project_density_matrix_outcome(rho, wire, outcome_char, num_qubits):
    """
    Projects DensityMatrix rho onto the measurement outcome ('0' or '1') on wire w:
    rho_new = Pi_{m, w} rho Pi_{m, w} / Tr(Pi_{m, w} rho Pi_{m, w})
    """
    p_single = np.array([[1, 0], [0, 0]], dtype=complex) if outcome_char == "0" else np.array([[0, 0], [0, 1]], dtype=complex)

    # Qiskit basis tensor order: q(num_qubits-1) (x) ... (x) q(0)
    full_proj = np.array([[1]], dtype=complex)
    for q in reversed(range(num_qubits)):
        if q == wire:
            full_proj = np.kron(full_proj, p_single)
        else:
            full_proj = np.kron(full_proj, np.eye(2, dtype=complex))

    projected_data = full_proj @ rho.data @ full_proj.conj().T
    trace_val = float(np.real(np.trace(projected_data)))

    if trace_val > 1e-12:
        return DensityMatrix(projected_data / trace_val)
    else:
        # Trace is nearly zero (near impossible branch under noise) - renormalize trace-wise
        return DensityMatrix(projected_data / (trace_val + 1e-14))


def evaluate_noisy_timeline(payload):
    """
    Main evaluation routine: evaluates ideal statevector and noisy density matrix
    in lockstep across each gate in the circuit.
    """
    if not isinstance(payload, dict):
        raise ValueError("Payload must be a JSON object.")

    num_qubits = payload.get("numQubits")
    if not isinstance(num_qubits, int) or num_qubits < 1 or num_qubits > MAX_QUBITS:
        raise ValueError(f"numQubits must be an integer between 1 and {MAX_QUBITS} inclusive.")

    gates = payload.get("gates", [])
    if not isinstance(gates, list):
        raise ValueError("gates must be a list.")
    if len(gates) > MAX_GATES:
        raise ValueError(f"Circuit exceeds maximum limit of {MAX_GATES} gates (received {len(gates)}).")

    noise_model = str(payload.get("noiseModel", "depolarizing")).lower().strip()
    if noise_model not in SUPPORTED_NOISE_MODELS:
        raise ValueError(f"Unsupported noise model '{noise_model}'. Supported: {sorted(SUPPORTED_NOISE_MODELS)}")

    noise_strength = float(payload.get("noiseStrength", 0.0))
    if noise_strength < 0.0 or noise_strength > 1.0:
        raise ValueError(f"noiseStrength must be between 0.0 and 1.0 inclusive (received {noise_strength}).")

    channel = create_quantum_channel(noise_model, noise_strength)
    dim = 2 ** num_qubits

    # Check if circuit contains explicit measurement gates
    has_explicit_measurements = any(
        isinstance(g, dict) and str(g.get("type", "")).upper() == "M"
        for g in gates
    )

    # Initial states at step 0: |0...0>
    current_sv = Statevector.from_int(0, dim)
    current_rho = DensityMatrix.from_int(0, dim)

    steps = []
    measured_wires = set()

    # Helper to build probabilities dictionary
    def get_probs_from_sv(sv):
        raw = sv.data
        return {format(i, f"0{num_qubits}b"): round(float(abs(raw[i]) ** 2), 6) for i in range(dim)}

    def get_probs_from_rho(rho):
        diag = np.real(np.diag(rho.data))
        return {format(i, f"0{num_qubits}b"): round(max(0.0, float(diag[i])), 6) for i in range(dim)}

    # Step 0 snapshot
    ideal_probs_0 = get_probs_from_sv(current_sv)
    noisy_probs_0 = get_probs_from_rho(current_rho)
    ideal_bloch_0 = compute_bloch_vectors(current_sv, num_qubits, is_density_matrix=False)
    noisy_bloch_0 = compute_bloch_vectors(current_rho, num_qubits, is_density_matrix=True)

    readout_probs_0 = None
    if noise_model == "readout":
        # At step 0, if no explicit measurements exist, show basis readout confusion
        wires_to_confuse = range(num_qubits) if not has_explicit_measurements else []
        readout_probs_0 = apply_readout_confusion(noisy_probs_0, wires_to_confuse, num_qubits, noise_strength)

    steps.append({
        "stepIndex": 0,
        "appliedGate": None,
        "isMeasurement": False,
        "measurementOutcome": None,
        "idealProbabilities": ideal_probs_0,
        "idealBlochVectors": ideal_bloch_0,
        "quantumProbabilities": noisy_probs_0,
        "readoutObservedProbabilities": readout_probs_0,
        "blochVectors": noisy_bloch_0,
        "fidelity": 1.0,
        "divergence": 0.0,
        "purity": 1.0,
        "purityDelta": 0.0,
        "maxBlochDistance": 0.0
    })

    # Sequential gate execution
    for idx, gate_item in enumerate(gates):
        if not isinstance(gate_item, dict):
            raise ValueError(f"Gate at index {idx} must be an object.")

        gate_type = str(gate_item.get("type", "")).upper()
        if gate_type not in SUPPORTED_GATES:
            raise ValueError(f"Gate at index {idx} has unsupported type '{gate_type}'. Supported: {sorted(SUPPORTED_GATES)}")

        wire = gate_item.get("wire")
        if wire is None:
            wire = gate_item.get("qubit")
        if not isinstance(wire, int) or wire < 0 or wire >= num_qubits:
            raise ValueError(f"Gate at index {idx} ({gate_type}) specifies invalid wire {wire} for {num_qubits} qubits.")

        target = gate_item.get("target")
        if gate_type in TWO_QUBIT_GATES:
            if not isinstance(target, int) or target < 0 or target >= num_qubits:
                raise ValueError(f"Two-qubit gate {gate_type} at index {idx} specifies invalid target {target} for {num_qubits} qubits.")
            if wire == target:
                raise ValueError(f"Two-qubit gate {gate_type} at index {idx} cannot have identical control and target wire ({wire}).")
        else:
            target = None

        applied_gate_spec = {
            "type": gate_type,
            "wire": wire,
            "target": target,
            "originalIndex": idx
        }
        if "layerIndex" in gate_item and gate_item["layerIndex"] is not None:
            applied_gate_spec["layerIndex"] = gate_item["layerIndex"]

        is_measurement = False
        measurement_outcome = None

        # 1. Ideal evolution
        if gate_type == "M":
            outcome, collapsed_sv = current_sv.measure([wire])
            current_sv = collapsed_sv
            is_measurement = True
            measurement_outcome = str(outcome)
            measured_wires.add(wire)
        else:
            sub_qc = QuantumCircuit(num_qubits)
            if gate_type == "I":
                sub_qc.id(wire)
            elif gate_type == "H":
                sub_qc.h(wire)
            elif gate_type == "X":
                sub_qc.x(wire)
            elif gate_type == "Y":
                sub_qc.y(wire)
            elif gate_type == "Z":
                sub_qc.z(wire)
            elif gate_type == "S":
                sub_qc.s(wire)
            elif gate_type == "T":
                sub_qc.t(wire)
            elif gate_type == "SX":
                sub_qc.sx(wire)
            elif gate_type == "SDG":
                sub_qc.sdg(wire)
            elif gate_type == "TDG":
                sub_qc.tdg(wire)
            elif gate_type == "CX":
                sub_qc.cx(wire, target)
            elif gate_type == "SWAP":
                sub_qc.swap(wire, target)

            current_sv = current_sv.evolve(sub_qc)

        # 2. Noisy evolution
        if gate_type == "M":
            # Project DensityMatrix onto the exact same measurement branch
            current_rho = project_density_matrix_outcome(current_rho, wire, measurement_outcome, num_qubits)
            # CRITICAL CONSTRAINT: No quantum-state noise channel is applied after a measurement operation!
        else:
            # Unitary evolution
            current_rho = current_rho.evolve(sub_qc)

            # Apply quantum noise channel independently to participating wires
            if channel is not None:
                current_rho = current_rho.evolve(channel, [wire])
                if target is not None:
                    current_rho = current_rho.evolve(channel, [target])

        # 3. Observables extraction
        ideal_probs = get_probs_from_sv(current_sv)
        noisy_probs = get_probs_from_rho(current_rho)
        ideal_bloch = compute_bloch_vectors(current_sv, num_qubits, is_density_matrix=False)
        noisy_bloch = compute_bloch_vectors(current_rho, num_qubits, is_density_matrix=True)

        # Readout observed probabilities
        readout_probs = None
        if noise_model == "readout":
            if has_explicit_measurements:
                wires_to_confuse = list(measured_wires)
            else:
                wires_to_confuse = range(num_qubits)
            readout_probs = apply_readout_confusion(noisy_probs, wires_to_confuse, num_qubits, noise_strength)

        # Overlap Fidelity: F_k = <psi_k | rho_k | psi_k>
        sv_ket = current_sv.data
        fid_val = float(np.real(np.vdot(sv_ket, current_rho.data @ sv_ket)))
        fidelity = max(0.0, min(1.0, round(fid_val, 6)))
        divergence = max(0.0, min(1.0, round(1.0 - fidelity, 6)))

        # Whole state purity Tr(rho^2)
        total_purity = float(np.real(np.trace(current_rho.data @ current_rho.data)))
        total_purity = max(0.0, min(1.0, round(total_purity, 6)))
        purity_delta = round(total_purity - 1.0, 6)

        # Max Bloch distance across all qubits
        max_b_dist = 0.0
        for q in range(num_qubits):
            ib = ideal_bloch[q]
            nb = noisy_bloch[q]
            dist = math.sqrt((ib["x"] - nb["x"]) ** 2 + (ib["y"] - nb["y"]) ** 2 + (ib["z"] - nb["z"]) ** 2)
            if dist > max_b_dist:
                max_b_dist = dist
        max_b_dist = round(max_b_dist, 6)

        steps.append({
            "stepIndex": idx + 1,
            "appliedGate": applied_gate_spec,
            "isMeasurement": is_measurement,
            "measurementOutcome": measurement_outcome,
            "idealProbabilities": ideal_probs,
            "idealBlochVectors": ideal_bloch,
            "quantumProbabilities": noisy_probs,
            "readoutObservedProbabilities": readout_probs,
            "blochVectors": noisy_bloch,
            "fidelity": fidelity,
            "divergence": divergence,
            "purity": total_purity,
            "purityDelta": purity_delta,
            "maxBlochDistance": max_b_dist
        })

    # Summary and attribution
    first_meaningful_step = None
    gate_at_first_div = None
    max_div = 0.0

    for step in steps[1:]:  # Check steps k >= 1
        d = step["divergence"]
        if d > max_div:
            max_div = d
        if first_meaningful_step is None and d >= DIVERGENCE_THRESHOLD:
            first_meaningful_step = step["stepIndex"]
            gate_at_first_div = step["appliedGate"]

    final_fidelity = steps[-1]["fidelity"] if steps else 1.0

    divergence_summary = {
        "noiseModel": noise_model,
        "noiseStrength": round(noise_strength, 6),
        "firstMeaningfulDivergenceStep": first_meaningful_step,
        "gateAtFirstDivergence": gate_at_first_div,
        "maxDivergence": round(max_div, 6),
        "finalFidelity": final_fidelity
    }

    return {
        "success": True,
        "numQubits": num_qubits,
        "totalSteps": len(steps),
        "steps": steps,
        "divergenceSummary": divergence_summary
    }


def main():
    try:
        if len(sys.argv) > 1 and sys.argv[1].strip():
            raw_input = sys.argv[1]
        else:
            raw_input = sys.stdin.read()

        if not raw_input or not raw_input.strip():
            raise ValueError("No input payload provided.")

        payload = json.loads(raw_input)
        result = evaluate_noisy_timeline(payload)
        print(json.dumps(result))
        sys.exit(0)

    except json.JSONDecodeError as jde:
        sys.stderr.write(f"JSON Parse Error: {jde}\n")
        print(json.dumps({
            "success": False,
            "error": f"Invalid JSON payload: {str(jde)}"
        }))
        sys.exit(1)
    except Exception as exc:
        sys.stderr.write(f"Evaluation Error: {exc}\n")
        print(json.dumps({
            "success": False,
            "error": str(exc)
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
