#!/usr/bin/env python3
"""
Quantum Circuit Time Machine - Timeline Evaluator
Evaluates quantum circuit state step-by-step for timeline playback.
Reads circuit payload from sys.argv[1] (or stdin) and emits structured JSON to stdout.
Includes Stage 4 deterministic Transition Intelligence analysis.
"""

import sys
import json
import math
import numpy as np

try:
    from qiskit import QuantumCircuit
    from qiskit.quantum_info import Statevector, partial_trace
except ImportError as e:
    sys.stderr.write(f"Qiskit import error: {e}\n")
    print(json.dumps({
        "success": False,
        "error": "Qiskit is not installed or could not be loaded in the Python environment."
    }))
    sys.exit(1)

SUPPORTED_GATES = {
    "I", "H", "X", "Y", "Z", "S", "T", "SX", "SDG", "TDG", "CX", "SWAP", "M"
}
TWO_QUBIT_GATES = {"CX", "SWAP"}
MAX_QUBITS = 8
MAX_GATES = 30

# Explicit Stage 4 numerical tolerances
EPS_PROBABILITY = 1e-4
EPS_AMPLITUDE = 1e-4
EPS_BLOCH = 1e-3
EPS_PURITY = 1e-3
EPS_PHASE = 1e-3  # radians (~0.057 deg)


def calculate_bloch_components(rho_matrix):
    """
    Given a 2x2 reduced density matrix rho, calculate the Bloch coordinates (x, y, z),
    radius r, purity, spherical coordinates (theta, phi), and entanglement status.
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

    is_entangled = (r < 0.999)

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
        "isEntangled": is_entangled
    }


def compute_step_snapshot(step_index, applied_gate, sv, num_qubits, is_measurement=False, measurement_outcome=None):
    """
    Computes all analytical observables for the current statevector sv.
    """
    dim = 2 ** num_qubits
    raw_amplitudes = sv.data

    amplitudes_list = []
    probabilities_dict = {}

    for i in range(dim):
        basis_str = format(i, f"0{num_qubits}b")
        amp = raw_amplitudes[i]
        real_val = float(amp.real)
        imag_val = float(amp.imag)
        mag = float(abs(amp))
        phase = float(np.angle(amp))
        prob = float(mag * mag)

        probabilities_dict[basis_str] = round(prob, 6)
        amplitudes_list.append({
            "basis": basis_str,
            "real": round(real_val, 6),
            "imag": round(imag_val, 6),
            "magnitude": round(mag, 6),
            "phase": round(phase, 6),
            "probability": round(prob, 6)
        })

    bloch_vectors = []
    for q in range(num_qubits):
        if num_qubits == 1:
            ket = raw_amplitudes.reshape((2, 1))
            rho = ket @ ket.conj().T
        else:
            trace_qubits = [k for k in range(num_qubits) if k != q]
            rho_obj = partial_trace(sv, trace_qubits)
            rho = rho_obj.data

        bloch_data = calculate_bloch_components(rho)
        bloch_data["qubit"] = q
        bloch_vectors.append(bloch_data)

    return {
        "stepIndex": step_index,
        "appliedGate": applied_gate,
        "isMeasurement": is_measurement,
        "measurementOutcome": measurement_outcome,
        "amplitudes": amplitudes_list,
        "probabilities": probabilities_dict,
        "blochVectors": bloch_vectors,
        "transition": None
    }


def vector_label(x, y, z, r):
    if r < 0.05:
        return "Center (r ≈ 0)"
    if z > 0.95:
        return "+Z (|0⟩)"
    if z < -0.95:
        return "-Z (|1⟩)"
    if x > 0.95:
        return "+X (|+⟩)"
    if x < -0.95:
        return "-X (|−⟩)"
    if y > 0.95:
        return "+Y (|+i⟩)"
    if y < -0.95:
        return "-Y (|-i⟩)"
    return f"({x:.2f}, {y:.2f}, {z:.2f})"


def analyze_transition(prev_sv, curr_sv, prev_snapshot, curr_snapshot, applied_gate_spec, is_measurement, measurement_outcome, num_qubits):
    """
    Computes deterministic Transition Intelligence between prev_snapshot and curr_snapshot.
    """
    gate_type = applied_gate_spec["type"]
    wire = applied_gate_spec["wire"]
    target = applied_gate_spec.get("target")

    # 1. State Fidelity F = |<psi_prev | psi_curr>|^2
    fidelity = float(abs(np.vdot(prev_sv.data, curr_sv.data)) ** 2)
    fidelity = max(0.0, min(1.0, round(fidelity, 6)))

    # 2. Probability Deltas
    dim = 2 ** num_qubits
    prob_deltas = []
    meaningful_prob_deltas = []
    prob_changed = False

    for i in range(dim):
        basis = format(i, f"0{num_qubits}b")
        p_before = prev_snapshot["probabilities"].get(basis, 0.0)
        p_after = curr_snapshot["probabilities"].get(basis, 0.0)
        delta = p_after - p_before

        if abs(delta) >= EPS_PROBABILITY:
            prob_changed = True

        if p_before < EPS_PROBABILITY and p_after >= EPS_PROBABILITY:
            status = "newly_populated"
        elif p_before >= EPS_PROBABILITY and p_after < EPS_PROBABILITY:
            status = "depleted"
        elif delta >= EPS_PROBABILITY:
            status = "increased"
        elif delta <= -EPS_PROBABILITY:
            status = "decreased"
        else:
            status = "unchanged"

        entry = {
            "basis": basis,
            "before": round(p_before, 6),
            "after": round(p_after, 6),
            "delta": round(delta, 6),
            "status": status
        }
        prob_deltas.append(entry)
        if abs(delta) >= 1e-3:
            meaningful_prob_deltas.append(entry)

    meaningful_prob_deltas.sort(key=lambda d: abs(d["delta"]), reverse=True)

    # 3. Phase Analysis
    # Comparable states: |before| >= EPS_AMPLITUDE and |after| >= EPS_AMPLITUDE
    prev_amps = {a["basis"]: complex(a["real"], a["imag"]) for a in prev_snapshot["amplitudes"]}
    curr_amps = {a["basis"]: complex(a["real"], a["imag"]) for a in curr_snapshot["amplitudes"]}

    comparable_bases = []
    phase_shifts = []

    for i in range(dim):
        basis = format(i, f"0{num_qubits}b")
        a_b = prev_amps[basis]
        a_a = curr_amps[basis]
        if abs(a_b) >= EPS_AMPLITUDE and abs(a_a) >= EPS_AMPLITUDE:
            comparable_bases.append(basis)
            pd = (float(np.angle(a_a)) - float(np.angle(a_b))) % (2.0 * math.pi)
            if pd > math.pi:
                pd -= 2.0 * math.pi
            phase_shifts.append(pd)

    phase_classification = "none"
    global_shift_rad = None
    relative_shifts = []
    phase_description = "No meaningful phase change detected"
    relative_phase_changed = False
    global_phase_only = False
    max_rel_shift = 0.0

    if gate_type == "I":
        phase_classification = "none"
        phase_description = "Identity spacer (phases unchanged)"
    elif len(comparable_bases) < 2:
        phase_classification = "not_comparable"
        phase_description = "Insufficient comparable superposition states to evaluate relative phase"
    else:
        ref_pd = phase_shifts[0]
        diffs = [abs((pd - ref_pd + math.pi) % (2.0 * math.pi) - math.pi) for pd in phase_shifts]
        max_diff = max(diffs)

        if max_diff < EPS_PHASE:
            if abs(ref_pd) < EPS_PHASE:
                phase_classification = "none"
                phase_description = "Amplitudes remained in phase"
            else:
                phase_classification = "global"
                global_phase_only = True
                global_shift_rad = round(ref_pd, 6)
                phase_description = f"Uniform global phase shift of {round(ref_pd, 4)} rad (physically unobservable)"
        else:
            phase_classification = "relative"
            relative_phase_changed = True
            for b, pd in zip(comparable_bases, phase_shifts):
                rel_to_ref = ((pd - ref_pd + math.pi) % (2.0 * math.pi) - math.pi)
                relative_shifts.append({
                    "basis": b,
                    "phaseShiftRad": round(pd, 6),
                    "relativeToRef": round(rel_to_ref, 6)
                })
            max_rel_shift = max(abs(r["relativeToRef"]) for r in relative_shifts)
            phase_description = f"Relative phase shifted between basis states by up to {round(max_rel_shift, 4)} rad"

    # 4. Bloch & Subsystem Deltas
    bloch_deltas = []
    any_bloch_changed = False
    any_purity_changed = False
    any_entangled = False
    any_disentangled = False

    for q in range(num_qubits):
        b_prev = prev_snapshot["blochVectors"][q]
        b_curr = curr_snapshot["blochVectors"][q]

        dx = b_curr["x"] - b_prev["x"]
        dy = b_curr["y"] - b_prev["y"]
        dz = b_curr["z"] - b_prev["z"]
        displacement = math.sqrt(dx * dx + dy * dy + dz * dz)
        radius_delta = b_curr["r"] - b_prev["r"]
        purity_delta = b_curr["purity"] - b_prev["purity"]

        if displacement >= EPS_BLOCH or abs(radius_delta) >= EPS_BLOCH:
            any_bloch_changed = True
        if abs(purity_delta) >= EPS_PURITY:
            any_purity_changed = True

        if displacement < EPS_BLOCH:
            movement_str = "unchanged"
        else:
            movement_str = f"{vector_label(b_prev['x'], b_prev['y'], b_prev['z'], b_prev['r'])} → {vector_label(b_curr['x'], b_curr['y'], b_curr['z'], b_curr['r'])}"

        if purity_delta <= -EPS_PURITY and b_curr["isEntangled"] and not b_prev["isEntangled"]:
            entanglement_delta = "became_entangled"
            any_entangled = True
        elif purity_delta >= EPS_PURITY and b_prev["isEntangled"] and not b_curr["isEntangled"]:
            entanglement_delta = "became_disentangled"
            any_disentangled = True
        else:
            entanglement_delta = "unchanged"

        bloch_deltas.append({
            "qubit": q,
            "displacement": round(displacement, 6),
            "radiusDelta": round(radius_delta, 6),
            "purityDelta": round(purity_delta, 6),
            "movement": movement_str,
            "entanglement": {
                "status": entanglement_delta,
                "mechanism": "unitary_entangling_operation" if entanglement_delta != "unchanged" else None
            },
            "before": {
                "x": b_prev["x"], "y": b_prev["y"], "z": b_prev["z"], "r": b_prev["r"], "purity": b_prev["purity"]
            },
            "after": {
                "x": b_curr["x"], "y": b_curr["y"], "z": b_curr["z"], "r": b_curr["r"], "purity": b_curr["purity"]
            }
        })

    # 5. Determine transition type and isNoOp
    if gate_type == "I":
        trans_type = "identity_no_op"
        is_no_op = True
        state_changed = False
    elif is_measurement:
        trans_type = "measurement_collapse"
        is_no_op = False
        state_changed = True
    else:
        trans_type = "unitary_gate"
        is_no_op = False
        state_changed = bool(prob_changed or relative_phase_changed or any_bloch_changed)

    # 6. Measurement metadata
    measurement_meta = None
    if is_measurement:
        prob_before_outcome = sum(
            prev_snapshot["probabilities"][b] for b in prev_snapshot["probabilities"]
            if b[num_qubits - 1 - wire] == str(measurement_outcome)
        )
        measurement_meta = {
            "wire": wire,
            "outcome": str(measurement_outcome),
            "preMeasurementProbability": round(prob_before_outcome, 6),
            "postMeasurementProbability": 1.0
        }

    # 7. Deterministic Headline
    if is_no_op:
        headline = "No quantum state change (Identity spacer)"
    elif is_measurement:
        headline = f"Measurement collapse on q[{wire}] → Outcome |{measurement_outcome}⟩"
    elif any_entangled:
        headline = "Generated bipartite entanglement"
    elif any_disentangled:
        headline = "Subsystem disentangled (returned to product state)"
    elif relative_phase_changed and not prob_changed:
        if abs(max_rel_shift - math.pi) < 0.05:
            headline = "Relative phase shifted by π (Phase flip)"
        elif abs(max_rel_shift - math.pi / 2.0) < 0.05:
            headline = "Relative phase shifted by π/2 (Quarter phase)"
        elif abs(max_rel_shift - math.pi / 4.0) < 0.05:
            headline = "Relative phase shifted by π/4 (T phase)"
        else:
            headline = f"Relative phase shifted by {round(max_rel_shift, 3)} rad"
    elif gate_type == "H" and prob_changed:
        headline = "Created superposition"
    elif gate_type == "SWAP" and prob_changed:
        headline = f"State swapped between q[{wire}] and q[{target}]"
    elif gate_type in ("X", "SX") and prob_changed:
        headline = f"Bit flip on q[{wire}]"
    elif prob_changed:
        headline = "Probability redistributed"
    elif any_bloch_changed:
        headline = f"Bloch vector rotation on q[{wire}]"
    else:
        headline = f"Applied {gate_type} gate"

    return {
        "type": trans_type,
        "gate": applied_gate_spec,
        "summary": {
            "stateChanged": state_changed,
            "probabilityChanged": prob_changed,
            "phaseChanged": relative_phase_changed,
            "relativePhaseChanged": relative_phase_changed,
            "globalPhaseOnly": global_phase_only,
            "blochChanged": any_bloch_changed,
            "purityChanged": any_purity_changed,
            "entanglementChanged": bool(any_entangled or any_disentangled),
            "isNoOp": is_no_op,
            "headline": headline
        },
        "probability": {
            "changed": prob_changed,
            "deltas": meaningful_prob_deltas,
            "allDeltas": prob_deltas
        },
        "phase": {
            "classification": phase_classification,
            "globalShiftRad": global_shift_rad,
            "relativeShifts": relative_shifts,
            "maxRelativeShiftRad": round(max_rel_shift, 6) if relative_phase_changed else None,
            "description": phase_description
        },
        "subsystems": bloch_deltas,
        "measurement": measurement_meta,
        "stateMetrics": {
            "fidelity": fidelity
        }
    }


def evaluate_timeline(payload):
    """
    Main evaluation routine: validates input and sequentially applies gates.
    Attaches Transition Intelligence to each step k >= 1.
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

    # Initial state: |0...0>
    current_sv = Statevector.from_int(0, 2 ** num_qubits)

    steps = []
    # Step 0: Initial state snapshot (transition = None)
    step_0 = compute_step_snapshot(
        step_index=0,
        applied_gate=None,
        sv=current_sv,
        num_qubits=num_qubits
    )
    steps.append(step_0)

    for idx, gate_item in enumerate(gates):
        if not isinstance(gate_item, dict):
            raise ValueError(f"Gate at index {idx} must be an object.")

        gate_type = str(gate_item.get("type", "")).upper()
        if gate_type not in SUPPORTED_GATES:
            raise ValueError(f"Gate at index {idx} has unsupported type '{gate_type}'. Supported: {sorted(SUPPORTED_GATES)}")

        wire = gate_item.get("wire")
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

        prev_sv = current_sv
        is_measurement = False
        measurement_outcome = None

        if gate_type == "M":
            outcome, collapsed_sv = current_sv.measure([wire])
            current_sv = collapsed_sv
            is_measurement = True
            measurement_outcome = str(outcome)
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

        snapshot = compute_step_snapshot(
            step_index=idx + 1,
            applied_gate=applied_gate_spec,
            sv=current_sv,
            num_qubits=num_qubits,
            is_measurement=is_measurement,
            measurement_outcome=measurement_outcome
        )

        # Stage 4: Compute deterministic transition from previous step
        snapshot["transition"] = analyze_transition(
            prev_sv=prev_sv,
            curr_sv=current_sv,
            prev_snapshot=steps[-1],
            curr_snapshot=snapshot,
            applied_gate_spec=applied_gate_spec,
            is_measurement=is_measurement,
            measurement_outcome=measurement_outcome,
            num_qubits=num_qubits
        )

        steps.append(snapshot)

    return {
        "success": True,
        "numQubits": num_qubits,
        "totalSteps": len(steps),
        "steps": steps
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
        result = evaluate_timeline(payload)
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
