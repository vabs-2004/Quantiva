#!/usr/bin/env python3
"""
Unit and Scientific Verification Test Suite for Stage 4 Transition Intelligence.
Tests all 12 required scenarios.
"""

import sys
import math
import numpy as np

from timeline_evaluator import (
    evaluate_timeline,
    analyze_transition,
    compute_step_snapshot,
    EPS_PROBABILITY,
    EPS_AMPLITUDE,
    EPS_BLOCH,
    EPS_PURITY,
    EPS_PHASE
)
from qiskit.quantum_info import Statevector


def run_all_tests():
    print("=== STAGE 4 TRANSITION INTELLIGENCE TEST SUITE ===")
    passed = 0
    total = 0

    def assert_test(label, condition, details=""):
        nonlocal passed, total
        total += 1
        if condition:
            passed += 1
            print(f"[PASS] {label}")
        else:
            print(f"[FAIL] {label} -- {details}")

    # -------------------------------------------------------------
    # 1. H gate: |0> -> |+>
    # -------------------------------------------------------------
    res1 = evaluate_timeline({"numQubits": 1, "gates": [{"type": "H", "wire": 0}]})
    t1 = res1["steps"][1]["transition"]
    assert_test("1. H gate probability split", (
        t1["summary"]["probabilityChanged"] is True and
        abs(t1["probability"]["deltas"][0]["delta"]) >= 0.49 and
        t1["summary"]["headline"] == "Created superposition"
    ), f"t1 summary: {t1['summary']}")

    # -------------------------------------------------------------
    # 2. Z on |+>: |+> -> |->
    # -------------------------------------------------------------
    res2 = evaluate_timeline({"numQubits": 1, "gates": [{"type": "H", "wire": 0}, {"type": "Z", "wire": 0}]})
    t2 = res2["steps"][2]["transition"]
    max_shift2 = t2["phase"]["maxRelativeShiftRad"]
    assert_test("2. Z on |+> relative phase = pi", (
        t2["summary"]["probabilityChanged"] is False and
        t2["phase"]["classification"] == "relative" and
        max_shift2 is not None and abs(max_shift2 - math.pi) < 0.05 and
        "Relative phase shifted by π" in t2["summary"]["headline"]
    ), f"t2 phase: {t2['phase']}, headline: {t2['summary']['headline']}")

    # -------------------------------------------------------------
    # 3. S on |+>: |+> -> (|0> + i|1>)/sqrt(2)
    # -------------------------------------------------------------
    res3 = evaluate_timeline({"numQubits": 1, "gates": [{"type": "H", "wire": 0}, {"type": "S", "wire": 0}]})
    t3 = res3["steps"][2]["transition"]
    max_shift3 = t3["phase"]["maxRelativeShiftRad"]
    assert_test("3. S on |+> relative phase = pi/2", (
        t3["summary"]["probabilityChanged"] is False and
        t3["phase"]["classification"] == "relative" and
        max_shift3 is not None and abs(max_shift3 - math.pi / 2.0) < 0.05 and
        "Relative phase shifted by π/2" in t3["summary"]["headline"]
    ), f"t3 phase: {t3['phase']}, headline: {t3['summary']['headline']}")

    # -------------------------------------------------------------
    # 4. T on |+>: |+> -> (|0> + e^{i pi/4}|1>)/sqrt(2)
    # -------------------------------------------------------------
    res4 = evaluate_timeline({"numQubits": 1, "gates": [{"type": "H", "wire": 0}, {"type": "T", "wire": 0}]})
    t4 = res4["steps"][2]["transition"]
    max_shift4 = t4["phase"]["maxRelativeShiftRad"]
    assert_test("4. T on |+> relative phase = pi/4", (
        t4["summary"]["probabilityChanged"] is False and
        t4["phase"]["classification"] == "relative" and
        max_shift4 is not None and abs(max_shift4 - math.pi / 4.0) < 0.05 and
        "Relative phase shifted by π/4" in t4["summary"]["headline"]
    ), f"t4 phase: {t4['phase']}, headline: {t4['summary']['headline']}")

    # -------------------------------------------------------------
    # 5. Global phase test: |psi> -> -|psi>
    # -------------------------------------------------------------
    # Direct test of analyze_transition with -Statevector
    sv_plus = Statevector([1.0 / math.sqrt(2), 1.0 / math.sqrt(2)])
    sv_minus_global = Statevector([-1.0 / math.sqrt(2), -1.0 / math.sqrt(2)])
    snap_plus = compute_step_snapshot(0, None, sv_plus, 1)
    snap_minus = compute_step_snapshot(1, {"type": "GLOBAL", "wire": 0, "target": None}, sv_minus_global, 1)
    t5 = analyze_transition(
        sv_plus, sv_minus_global, snap_plus, snap_minus,
        {"type": "GLOBAL", "wire": 0, "target": None}, False, None, 1
    )
    assert_test("5. Global phase shift not reported as relative", (
        t5["phase"]["classification"] == "global" and
        t5["summary"]["relativePhaseChanged"] is False and
        t5["summary"]["globalPhaseOnly"] is True and
        abs(t5["phase"]["globalShiftRad"] - math.pi) < 0.05
    ), f"t5 phase: {t5['phase']}")

    # -------------------------------------------------------------
    # 6. CX creating Bell state: H(q0), CX(0, 1)
    # -------------------------------------------------------------
    res6 = evaluate_timeline({"numQubits": 2, "gates": [{"type": "H", "wire": 0}, {"type": "CX", "wire": 0, "target": 1}]})
    t6 = res6["steps"][2]["transition"]
    assert_test("6. CX creating Bell state generates entanglement", (
        t6["summary"]["entanglementChanged"] is True and
        t6["subsystems"][0]["entanglement"]["status"] == "became_entangled" and
        t6["subsystems"][1]["entanglement"]["status"] == "became_entangled" and
        t6["subsystems"][0]["purityDelta"] <= -0.49 and
        t6["summary"]["headline"] == "Generated bipartite entanglement"
    ), f"t6 summary: {t6['summary']}, subsystems: {t6['subsystems']}")

    # -------------------------------------------------------------
    # 7. SWAP: |01> -> |10>
    # -------------------------------------------------------------
    res7 = evaluate_timeline({"numQubits": 2, "gates": [{"type": "X", "wire": 0}, {"type": "SWAP", "wire": 0, "target": 1}]})
    t7 = res7["steps"][2]["transition"]
    assert_test("7. SWAP permutes probabilities with NO entanglement", (
        t7["summary"]["probabilityChanged"] is True and
        t7["summary"]["entanglementChanged"] is False and
        t7["subsystems"][0]["entanglement"]["status"] == "unchanged" and
        t7["subsystems"][1]["entanglement"]["status"] == "unchanged" and
        t7["summary"]["headline"] == "State swapped between q[0] and q[1]"
    ), f"t7 summary: {t7['summary']}, subsystems: {t7['subsystems']}")

    # -------------------------------------------------------------
    # 8. Identity gate (I)
    # -------------------------------------------------------------
    res8 = evaluate_timeline({"numQubits": 1, "gates": [{"type": "I", "wire": 0}]})
    t8 = res8["steps"][1]["transition"]
    assert_test("8. Identity recognized as no-op", (
        t8["type"] == "identity_no_op" and
        t8["summary"]["isNoOp"] is True and
        t8["summary"]["stateChanged"] is False and
        t8["summary"]["headline"] == "No quantum state change (Identity spacer)"
    ), f"t8 summary: {t8['summary']}")

    # -------------------------------------------------------------
    # 9. Measurement collapse
    # -------------------------------------------------------------
    res9 = evaluate_timeline({"numQubits": 1, "gates": [{"type": "H", "wire": 0}, {"type": "M", "wire": 0}]})
    t9 = res9["steps"][2]["transition"]
    assert_test("9. Measurement collapse metadata", (
        t9["type"] == "measurement_collapse" and
        t9["measurement"] is not None and
        t9["measurement"]["outcome"] in ("0", "1") and
        t9["measurement"]["postMeasurementProbability"] == 1.0 and
        "Measurement collapse" in t9["summary"]["headline"]
    ), f"t9 measurement: {t9['measurement']}")

    # -------------------------------------------------------------
    # 10. Zero-amplitude phase handling
    # -------------------------------------------------------------
    # In |0> -> |1>, |1> had 0 amplitude before, and |0> has 0 amplitude after.
    # No basis state has non-zero amplitude in both!
    res10 = evaluate_timeline({"numQubits": 1, "gates": [{"type": "X", "wire": 0}]})
    t10 = res10["steps"][1]["transition"]
    assert_test("10. Zero-amplitude phase handling (not comparable)", (
        t10["phase"]["classification"] == "not_comparable" and
        t10["summary"]["relativePhaseChanged"] is False
    ), f"t10 phase: {t10['phase']}")

    # -------------------------------------------------------------
    # 11. Multi-qubit phase case
    # -------------------------------------------------------------
    # Circuit: H(0), H(1), then Z(0).
    # Before Z: (|00> + |01> + |10> + |11>)/2.
    # After Z(0): (|00> - |01> + |10> - |11>)/2.
    # Relative phase is correctly detected among populated 2-qubit basis states.
    res11 = evaluate_timeline({"numQubits": 2, "gates": [
        {"type": "H", "wire": 0},
        {"type": "H", "wire": 1},
        {"type": "Z", "wire": 0}
    ]})
    t11 = res11["steps"][3]["transition"]
    assert_test("11. Multi-qubit relative phase detection", (
        t11["summary"]["probabilityChanged"] is False and
        t11["phase"]["classification"] == "relative" and
        len(t11["phase"]["relativeShifts"]) == 4 and
        abs(t11["phase"]["maxRelativeShiftRad"] - math.pi) < 0.05
    ), f"t11 phase: {t11['phase']}")

    # -------------------------------------------------------------
    # 12. Numerical tolerance: sub-threshold changes are ignored
    # -------------------------------------------------------------
    sv_base = Statevector([1.0, 0.0])
    # Add tiny perturbation 1e-7 below EPS_AMPLITUDE (1e-4) and EPS_PROBABILITY (1e-4)
    sv_perturbed = Statevector([math.sqrt(1.0 - 1e-7), math.sqrt(1e-7)])
    snap_base = compute_step_snapshot(0, None, sv_base, 1)
    snap_pert = compute_step_snapshot(1, {"type": "I", "wire": 0, "target": None}, sv_perturbed, 1)
    t12 = analyze_transition(
        sv_base, sv_perturbed, snap_base, snap_pert,
        {"type": "I", "wire": 0, "target": None}, False, None, 1
    )
    assert_test("12. Sub-threshold changes ignored", (
        t12["summary"]["probabilityChanged"] is False and
        t12["summary"]["blochChanged"] is False
    ), f"t12 summary: {t12['summary']}")

    print(f"\nRESULTS: {passed}/{total} tests passed.")
    if passed == total:
        print("ALL 12 TESTS PASSED SUCCESSFULLY!")
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(run_all_tests())
