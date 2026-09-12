/**
 * Quantum Circuit Timeline Service
 *
 * Manages communication with the Python Quantum Timeline Evaluator.
 * Uses a persistent Python worker to keep Qiskit loaded in memory,
 * reducing subsequent request latency from ~750ms to ~1-40ms.
 * Automatically handles worker crashes, timeouts, and fallback to direct execution.
 */

const { spawn, execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const readline = require("readline");

// Resolve Python executable path
function resolvePythonPath() {
  if (process.env.PYTHON_PATH && fs.existsSync(process.env.PYTHON_PATH)) {
    return process.env.PYTHON_PATH;
  }
  const venvWin = path.join(__dirname, "../.venv/Scripts/python.exe");
  if (fs.existsSync(venvWin)) {
    return venvWin;
  }
  const venvNix = path.join(__dirname, "../.venv/bin/python");
  if (fs.existsSync(venvNix)) {
    return venvNix;
  }
  return "python3";
}

const PYTHON_PATH = resolvePythonPath();
const WORKER_SCRIPT = path.join(__dirname, "../scripts/timeline_worker.py");
const EVALUATOR_SCRIPT = path.join(__dirname, "../scripts/timeline_evaluator.py");
const NOISY_EVALUATOR_SCRIPT = path.join(__dirname, "../scripts/noisy_timeline_evaluator.py");
const TIMEOUT_MS = 10000; // 10s strict timeout

class TimelineWorkerManager {
  constructor() {
    this.worker = null;
    this.rl = null;
    this.isReady = false;
    this.requestQueue = [];
    this.activeRequest = null;
    this.requestIdCounter = 1;
    this.starting = false;
    this.initPromise = null;
  }

  /**
   * Initializes or restarts the persistent worker.
   */
  async ensureWorker() {
    if (this.worker && this.isReady) {
      return;
    }
    if (this.starting && this.initPromise) {
      return this.initPromise;
    }

    this.starting = true;
    this.initPromise = new Promise((resolve, reject) => {
      try {
        if (this.worker) {
          try { this.worker.kill(); } catch (_) {}
          this.worker = null;
          this.isReady = false;
        }

        const child = spawn(PYTHON_PATH, [WORKER_SCRIPT], {
          stdio: ["pipe", "pipe", "pipe"],
          windowsHide: true,
        });

        this.worker = child;

        const rl = readline.createInterface({
          input: child.stdout,
          crlfDelay: Infinity,
        });
        this.rl = rl;

        let handshakeDone = false;
        const handshakeTimeout = setTimeout(() => {
          if (!handshakeDone) {
            console.error("[TimelineService] Worker handshake timed out.");
            try { child.kill(); } catch (_) {}
            this.starting = false;
            reject(new Error("Worker handshake timeout"));
          }
        }, 5000);

        rl.on("line", (line) => {
          line = line.trim();
          if (!line) return;

          try {
            const data = JSON.parse(line);
            if (!handshakeDone && data.ready) {
              handshakeDone = true;
              clearTimeout(handshakeTimeout);
              this.isReady = true;
              this.starting = false;
              resolve();
              this.processNext();
              return;
            }

            if (this.activeRequest && data.id === this.activeRequest.id) {
              const req = this.activeRequest;
              this.activeRequest = null;
              clearTimeout(req.timer);

              if (data.success && data.data && data.data.success) {
                req.resolve(data.data);
              } else {
                const errMsg = data.error || (data.data && data.data.error) || "Timeline evaluation failed";
                req.reject(new Error(errMsg));
              }
              this.processNext();
            }
          } catch (parseErr) {
            console.error("[TimelineService] JSON parse error from worker:", parseErr);
          }
        });

        child.stderr.on("data", (chunk) => {
          const msg = chunk.toString().trim();
          if (msg) {
            console.error("[TimelineWorker stderr]:", msg);
          }
        });

        child.on("error", (err) => {
          console.error("[TimelineService] Worker child process error:", err);
          this.handleCrash(err);
          if (!handshakeDone) {
            clearTimeout(handshakeTimeout);
            this.starting = false;
            reject(err);
          }
        });

        child.on("exit", (code, signal) => {
          console.warn(`[TimelineService] Worker process exited with code ${code}, signal ${signal}`);
          this.handleCrash(new Error(`Worker process exited unexpectedly (code: ${code})`));
          if (!handshakeDone) {
            clearTimeout(handshakeTimeout);
            this.starting = false;
            reject(new Error(`Worker exited before ready (code: ${code})`));
          }
        });
      } catch (spawnErr) {
        this.starting = false;
        reject(spawnErr);
      }
    });

    return this.initPromise;
  }

  handleCrash(error) {
    this.worker = null;
    this.isReady = false;
    this.starting = false;

    if (this.activeRequest) {
      clearTimeout(this.activeRequest.timer);
      this.activeRequest.reject(new Error(`Worker error: ${error.message}`));
      this.activeRequest = null;
    }

    // Reject all queued requests so they fail fast and client can retry
    while (this.requestQueue.length > 0) {
      const pending = this.requestQueue.shift();
      clearTimeout(pending.timer);
      pending.reject(new Error("Worker process terminated"));
    }
  }

  processNext() {
    if (this.activeRequest || this.requestQueue.length === 0) {
      return;
    }
    if (!this.isReady || !this.worker) {
      this.ensureWorker().catch((err) => {
        console.error("[TimelineService] Failed to ensure worker:", err);
      });
      return;
    }

    const nextReq = this.requestQueue.shift();
    this.activeRequest = nextReq;

    // Set per-request execution timeout
    nextReq.timer = setTimeout(() => {
      console.error(`[TimelineService] Request ${nextReq.id} timed out after ${TIMEOUT_MS}ms.`);
      try {
        if (this.worker) this.worker.kill();
      } catch (_) {}
      this.handleCrash(new Error("Timeline evaluation request timed out (10s limit)"));
    }, TIMEOUT_MS);

    try {
      const wireMsg = JSON.stringify({ id: nextReq.id, payload: nextReq.payload }) + "\n";
      this.worker.stdin.write(wireMsg);
    } catch (writeErr) {
      clearTimeout(nextReq.timer);
      this.activeRequest = null;
      nextReq.reject(writeErr);
      this.processNext();
    }
  }

  /**
   * Enqueues an evaluation request to the persistent worker.
   */
  async evaluate(payload) {
    await this.ensureWorker();

    return new Promise((resolve, reject) => {
      const reqId = this.requestIdCounter++;
      this.requestQueue.push({
        id: reqId,
        payload,
        resolve,
        reject,
        timer: null,
      });
      this.processNext();
    });
  }

  /**
   * Subprocess fallback if the persistent worker is unavailable.
   */
  static evaluateSubprocess(payload) {
    return new Promise((resolve, reject) => {
      const child = execFile(
        PYTHON_PATH,
        [EVALUATOR_SCRIPT, JSON.stringify(payload)],
        { timeout: TIMEOUT_MS },
        (error, stdout, stderr) => {
          if (error) {
            console.error("[TimelineService Subprocess error]:", stderr || error.message);
            return reject(new Error(stderr.trim() || error.message));
          }
          try {
            const parsed = JSON.parse(stdout.trim());
            if (parsed.success) {
              resolve(parsed);
            } else {
              reject(new Error(parsed.error || "Timeline evaluation failed"));
            }
          } catch (jsonErr) {
            reject(new Error("Invalid JSON returned from evaluator"));
          }
        }
      );
    });
  }
}

const workerManager = new TimelineWorkerManager();

// Pre-warm the persistent worker in background on module load
workerManager.ensureWorker().catch((err) => {
  console.warn("[TimelineService] Initial persistent worker warm-up notice:", err.message);
});

// Clean termination on server shutdown
process.on("exit", () => {
  if (workerManager.worker) {
    try { workerManager.worker.kill(); } catch (_) {}
  }
});

/**
 * Main evaluate entrypoint with automatic fallback.
 */
async function evaluateTimeline(circuitPayload) {
  try {
    return await workerManager.evaluate(circuitPayload);
  } catch (workerErr) {
    console.warn(`[TimelineService] Worker attempt failed (${workerErr.message}), falling back to direct subprocess...`);
    return await TimelineWorkerManager.evaluateSubprocess(circuitPayload);
  }
}

/**
 * Evaluates noisy quantum circuit timeline via subprocess.
 */
function evaluateNoisyTimeline(noisyPayload) {
  return new Promise((resolve, reject) => {
    const child = execFile(
      PYTHON_PATH,
      [NOISY_EVALUATOR_SCRIPT, JSON.stringify(noisyPayload)],
      {
  timeout: TIMEOUT_MS,
  env: {
    ...process.env,
    OMP_NUM_THREADS: "1",
    KMP_DUPLICATE_LIB_OK: "TRUE",
    PYTHONIOENCODING: "utf-8",
  },
},
      (error, stdout, stderr) => {
        if (error) {
          console.error("[TimelineService Noisy Subprocess error]:", stderr || error.message);
          return reject(new Error(stderr.trim() || error.message));
        }
        try {
          const parsed = JSON.parse(stdout.trim());
          if (parsed.success) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error || "Noisy timeline evaluation failed"));
          }
        } catch (jsonErr) {
          reject(new Error("Invalid JSON returned from noisy evaluator"));
        }
      }
    );
  });
}

module.exports = {
  evaluateTimeline,
  evaluateNoisyTimeline,
  TimelineWorkerManager,
  PYTHON_PATH,
};
