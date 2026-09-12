const express = require("express");
const http = require("http");
const circuitRoutes = require("../routes/circuitRoutes");

const app = express();
app.use(express.json());
app.use("/api/circuit", circuitRoutes);

async function runRegressionTests() {
  const server = app.listen(0, async () => {
    const port = server.address().port;

    function post(path, data) {
      return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const req = http.request({
          hostname: "127.0.0.1",
          port: port,
          path: path,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload)
          }
        }, (res) => {
          let body = "";
          res.on("data", chunk => body += chunk);
          res.on("end", () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(body) });
            } catch (e) {
              resolve({ status: res.statusCode, raw: body });
            }
          });
        });
        req.on("error", reject);
        req.write(payload);
        req.end();
      });
    }

    try {
      console.log("=== RUNNING API REGRESSION TEST SUITE ===");

      // API-1
      const t1 = await post("/api/circuit/timeline", { numQubits: 1, gates: [{ type: "H", wire: 0 }] });
      const t1Valid = t1.status === 200 &&
        t1.data.steps[0].transition === null &&
        t1.data.steps[1].transition !== null &&
        t1.data.steps[1].transition.summary.headline === "Created superposition";
      console.log("API-1 (1 qubit H & Transition Object):", t1Valid ? "PASS" : "FAIL");

      // API-2
      const t2 = await post("/api/circuit/timeline", {
        numQubits: 2,
        gates: [{ type: "H", wire: 0 }, { type: "CX", wire: 0, target: 1 }]
      });
      const t2Valid = t2.status === 200 &&
        t2.data.steps[2].transition.summary.entanglementChanged === true &&
        t2.data.steps[2].transition.summary.headline === "Generated bipartite entanglement";
      console.log("API-2 (Bell State & Entanglement Transition):", t2Valid ? "PASS" : "FAIL");

      // API-3
      const t3 = await post("/api/circuit/timeline", { numQubits: 2, gates: [{ type: "X", wire: 0 }] });
      const t3Valid = t3.status === 200 &&
        t3.data.steps[1].probabilities["01"] === 1.0 &&
        t3.data.steps[1].transition.summary.probabilityChanged === true;
      console.log("API-3 (Asymmetric X(q0)):", t3Valid ? "PASS" : "FAIL");

      // API-4
      const t4 = await post("/api/circuit/timeline", { numQubits: 1, gates: [{ type: "MAGIC_GATE", wire: 0 }] });
      console.log("API-4 (Invalid gate MAGIC_GATE):", t4.status === 400 ? "PASS" : "FAIL");

      // API-5
      const t5 = await post("/api/circuit/timeline", { numQubits: 2, gates: [{ type: "H", wire: 99 }] });
      console.log("API-5 (Invalid wire 99):", t5.status === 400 ? "PASS" : "FAIL");

      // API-6
      const t6 = await post("/api/circuit/timeline", { numQubits: 9, gates: [{ type: "H", wire: 0 }] });
      console.log("API-6 (numQubits = 9):", t6.status === 400 ? "PASS" : "FAIL");

      // API-7
      const t7 = await post("/api/circuit/timeline", { numQubits: 2, gates: Array(31).fill({ type: "H", wire: 0 }) });
      console.log("API-7 (31 gates):", t7.status === 400 ? "PASS" : "FAIL");

      // API-8
      const t8 = await post("/api/circuit/timeline", { numQubits: 1, gates: [{ type: "H", wire: 0 }, { type: "M", wire: 0 }] });
      const t8Valid = t8.status === 200 &&
        t8.data.steps[2].isMeasurement === true &&
        t8.data.steps[2].transition.type === "measurement_collapse" &&
        t8.data.steps[2].transition.measurement.postMeasurementProbability === 1.0;
      console.log("API-8 (Measurement H then M & Collapse Transition):", t8Valid ? "PASS" : "FAIL");


      // Existing circuit route regressions:
      console.log("\n=== EXISTING CIRCUIT REGRESSION VERIFICATION ===");
      const qasmExport = await post("/api/circuit/export-qasm", {
        numQubits: 2,
        gates: [{ type: "H", qubit: 0 }, { type: "CX", qubit: 0, target: 1 }]
      });
      console.log("Existing export-qasm:", qasmExport.status === 200 && qasmExport.data.qasm.includes("cx q[0],q[1];") ? "PASS" : "FAIL");

      const qasmImport = await post("/api/circuit/import-qasm", {
        qasm: 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\nh q[0];\ncx q[0],q[1];'
      });
      console.log("Existing import-qasm:", qasmImport.status === 200 && qasmImport.data.gates.length === 2 ? "PASS" : "FAIL");

    } catch (err) {
      console.error("Test execution error:", err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

runRegressionTests();
