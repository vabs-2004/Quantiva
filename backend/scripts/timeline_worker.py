#!/usr/bin/env python3
"""
Persistent Python worker for Quantum Circuit Time Machine.
Keeps Qiskit in memory and processes evaluation requests over stdin/stdout line-delimited JSON.
"""

import sys
import os
import json

# Ensure scripts directory is on sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

from timeline_evaluator import evaluate_timeline


def main():
    # Signal readiness to the host process
    sys.stdout.write(json.dumps({"ready": True}) + "\n")
    sys.stdout.flush()

    while True:
        line = sys.stdin.readline()
        if not line:
            break

        line = line.strip()
        if not line:
            continue

        req_id = None
        try:
            req = json.loads(line)
            req_id = req.get("id")
            payload = req.get("payload")
            result = evaluate_timeline(payload)
            response = {"id": req_id, "success": True, "data": result}
        except Exception as exc:
            response = {"id": req_id, "success": False, "error": str(exc)}

        sys.stdout.write(json.dumps(response) + "\n")
        sys.stdout.flush()


if __name__ == "__main__":
    main()
