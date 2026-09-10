/**
 * Sandbox Controller
 *
 * Handles execution of user-provided Python code.
 * Creates a temporary Jupyter notebook, runs it via Papermill,
 * and extracts all outputs (images, text).
 */

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const PYTHON_PATH = process.env.PYTHON_PATH || "python3";

function runSandboxCode(req, res) {
  const { code, cells } = req.body;
  let codeCells = [];

  if (cells && Array.isArray(cells)) {
    codeCells = cells;
  } else if (code && typeof code === "string") {
    codeCells = [code];
  } else {
    return res.status(400).json({ error: "code or cells array is required" });
  }

  const timestamp = Date.now();
  const inputNb = path.join(__dirname, `../notebooks/sandbox_input_${timestamp}.ipynb`);
  const outputNb = path.join(__dirname, `../notebooks/sandbox_output_${timestamp}.ipynb`);

  const notebook = {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: {
        display_name: "Python 3",
        language: "python",
        name: "python3",
      },
      language_info: {
        name: "python",
        version: "3.11.0",
      },
    },
    cells: [
      {
        cell_type: "code",
        metadata: {},
        source: [
          "import matplotlib\n",
          "matplotlib.use('agg')\n",
          "import matplotlib.pyplot as plt\n",
          "import io\n",
          "import builtins\n",
          "import IPython.display as ipd\n",
          "from IPython.display import display as original_display, Image\n",
          "def custom_display(*objs, **kwargs):\n",
          "    for obj in objs:\n",
          "        if hasattr(obj, 'savefig'):\n",
          "            buf = io.BytesIO()\n",
          "            obj.savefig(buf, format='png', bbox_inches='tight')\n",
          "            buf.seek(0)\n",
          "            original_display(Image(data=buf.read(), format='png'))\n",
          "        else:\n",
          "            original_display(obj, **kwargs)\n",
          "ipd.display = custom_display\n",
          "builtins.display = custom_display\n",
          "def custom_show():\n",
          "    buf = io.BytesIO()\n",
          "    plt.savefig(buf, format='png', bbox_inches='tight')\n",
          "    buf.seek(0)\n",
          "    original_display(Image(data=buf.read(), format='png'))\n",
          "    plt.clf()\n",
          "plt.show = custom_show\n"
        ],
        outputs: [],
        execution_count: null,
      },
      ...codeCells.map(c => ({
        cell_type: "code",
        metadata: {},
        source: c.split("\n").map((line, i, arr) =>
          i < arr.length - 1 ? line + "\n" : line
        ),
        outputs: [],
        execution_count: null,
      }))
    ],
  };

  try {
    fs.writeFileSync(inputNb, JSON.stringify(notebook, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write sandbox notebook:", err);
    return res.status(500).json({ error: "Failed to create notebook" });
  }

  const command = `"${PYTHON_PATH}" -m papermill "${inputNb}" "${outputNb}" -k python3 -l python`;

  console.log("Sandbox: Running command:", command);

  exec(command, { timeout: 120000 }, (error, stdout, stderr) => {
  if (error) {
    console.error("========== SANDBOX FAILED ==========");
    console.error("Python executable:", PYTHON_PATH);
    console.error("Input notebook:", inputNb);
    console.error("Output notebook:", outputNb);
    console.error("STDOUT:", stdout);
    console.error("STDERR:", stderr);
    console.error("====================================");
  } else {
    try {
      fs.unlinkSync(inputNb);
    } catch (e) {
      /* ignore */
    }
  }

  if (error) {
    console.error("Sandbox execution error:", error.message);
    try {
      if (fs.existsSync(outputNb)) {
        const results = extractNotebookOutputs(outputNb);
        fs.unlinkSync(outputNb);
        
        if (cells) {
          return res.json({
            results,
            error: "Execution completed with errors. Check output."
          });
        } else {
          return res.json({
            images: results[0]?.images || [],
            console: results[0]?.text || "",
            error: results[0]?.errorText ||
              "Execution completed with errors. Check output.",
          });
        }
      }
    } catch (e) {
      /* ignore */
    }

      return res.status(500).json({
        images: [],
        console: "",
        error: `Execution failed: ${stderr || error.message}`,
      });
    }

    try {
      const results = extractNotebookOutputs(outputNb);
      fs.unlinkSync(outputNb);

      if (cells) {
        res.json({ results });
      } else {
        res.json({
          images: results[0]?.images || [],
          console: results[0]?.text || "",
          error: results[0]?.errorText || null,
        });
      }
    } catch (err) {
      console.error("Error reading sandbox output:", err);
      try { fs.unlinkSync(outputNb); } catch (e) { /* ignore */ }
      res.status(500).json({ error: "Failed to parse notebook output" });
    }
  });
}

function extractNotebookOutputs(notebookPath) {
  const nbData = JSON.parse(fs.readFileSync(notebookPath, "utf8"));
  const results = [];

  for (let i = 1; i < nbData.cells.length; i++) {
    const cell = nbData.cells[i];
    const images = [];
    const textParts = [];
    let errorText = null;

    if (cell.outputs) {
      for (const output of cell.outputs) {
        if (output.data && output.data["image/png"]) {
          images.push(output.data["image/png"].trim());
        }
        if (output.output_type === "stream" && output.text) {
          const text = Array.isArray(output.text) ? output.text.join("") : output.text;
          textParts.push(text);
        }
        if (output.output_type === "execute_result" && output.data && output.data["text/plain"]) {
          const text = Array.isArray(output.data["text/plain"])
            ? output.data["text/plain"].join("")
            : output.data["text/plain"];
          textParts.push(text);
        }
        if (output.output_type === "error") {
          errorText = output.traceback
            ? output.traceback.map((line) => line.replace(/\x1b\[[0-9;]*m/g, "")).join("\n")
            : `${output.ename}: ${output.evalue}`;
        }
      }
    }
    results.push({ images, text: textParts.join(""), errorText });
  }

  return results;
}

function installPackages(req, res) {
  const { packages } = req.body;
  if (!packages || typeof packages !== "string") {
    return res.status(400).json({ error: "packages string is required" });
  }

  // Sanitize the input to prevent command injection
  // Allowed characters: letters, numbers, _, -, ., =, <, >, space
  const safePackages = packages.replace(/[^a-zA-Z0-9_\-\.\=\<\> ]/g, "").trim();
  if (!safePackages) {
    return res.status(400).json({ error: "Invalid packages format" });
  }

  console.log("Sandbox: Installing packages:", safePackages);

  // We use standard pip install. Removed -q to get installation logs
  const command = `"${PYTHON_PATH}" -m pip install ${safePackages}`;

  exec(command, { timeout: 120000 }, (error, stdout, stderr) => {
    if (error) {
      console.error("Sandbox package installation error:", error.message, stderr);
      return res.status(500).json({ 
        error: "Failed to install packages.", 
        logs: stderr || stdout || error.message 
      });
    }
    
    return res.json({ 
      success: true, 
      message: "Packages installed successfully.",
      logs: stdout || "Installation complete."
    });
  });
}

module.exports = {
  runSandboxCode,
  extractNotebookOutputs,
  installPackages,
};
