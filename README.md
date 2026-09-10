# Quantum Algorithm Execution Platform

This project is a full-stack web platform designed to seamlessly execute Quantum Machine Learning (ML) algorithms written in Python (Qiskit) via a modern React user interface. 

It acts as a bridge between **Quantum Engineers/Data Scientists** (who write Jupyter Notebooks) and **End Users** (who want to run algorithms dynamically through a web dashboard).

---

## 🚀 Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Three.js (for the 3D Bloch Sphere)
- **Backend:** Node.js, Express.js
- **Execution Engine:** Python, Jupyter Notebooks, `papermill`, `qiskit`, `matplotlib`

---

## 📂 Project Architecture

```text
d:/Learning/quantum-app/
├── backend/
│   ├── controllers/
│   │   └── algorithmController.js  # Runs Python papermill & parses images
│   ├── data/
│   │   └── algorithms.js           # Database of algorithms & their parameters
│   ├── notebooks/                  # 📍 ML Team puts their .ipynb files here!
│   │   └── grover-search.ipynb
│   └── server.js                   # Express server entry point
├── src/
│   ├── components/                 # React UI Components (Bloch Sphere, Viewers, etc.)
│   ├── pages/                      # Dashboard Pages
│   └── index.css                   # Global Tailwind Styles
└── README.md
```

---

## 🛠️ Setup & Installation

### Prerequisites
1. **Node.js** (v18+)
2. **Python** (v3.9+)
3. Install Python dependencies:
   ```bash
   pip install qiskit qiskit-aer papermill matplotlib
   ```

### Running the App Locally

**1. Start the Frontend:**
```bash
# In the root directory
npm install
npm run dev
```

**2. Start the Backend Server:**
```bash
# In the backend directory
cd backend
npm install
npm run dev
```

The web app will now be available at `http://localhost:5173` and the API at `http://localhost:8000`.

---

## 🧪 Instructions for the ML / Quantum Team

To add your quantum algorithms to this platform, you don't need to write any JavaScript or web code! Just follow these rules when writing your Jupyter Notebook (`.ipynb`):

1. **Parameter Cell:** 
   Your notebook must have a specific cell where you define your default variables. You MUST tag this cell with the word `parameters`. Papermill uses this tag to inject values from the web UI.
   ```python
   # Parameters (Make sure to tag this cell in Jupyter: View -> Cell Toolbar -> Tags)
   num_qubits = 3
   iterations = 1
   target_state = "101"
   ```

2. **Outputting Graphs & Circuits:**
   Do NOT use `plt.show()`. Since the notebook runs headlessly in the background, you must explicitly display the figure object and then close it to prevent memory leaks.
   ```python
   # Example: Rendering a circuit
   fig1 = qc.draw(output='mpl')
   display(fig1)
   plt.close(fig1)

   # Example: Rendering a histogram
   fig2 = plot_histogram(counts)
   display(fig2)
   plt.close(fig2)
   ```
   *Note: Our backend automatically captures any images generated via `display()` and sends them to the web UI.*

3. **Handover:**
   Once your notebook is tested and working, send the `.ipynb` file to the Web Developer to drop into the `backend/notebooks/` folder.

---

## 💻 Instructions for the Web Team

When the ML team provides a new algorithm notebook (e.g., `shors-algo.ipynb`):

1. **Place the Notebook:** Move the `.ipynb` file into the `backend/notebooks/` directory.
2. **Update UI Parameters:** Open `backend/data/algorithms.js` (and `src/data/algorithms.js` if separated) and add a new entry. Define all the dynamic parameters the notebook expects:
   ```javascript
   {
     id: "shors-algo",
     name: "Shor's Factoring",
     parameters: [
       { name: "Number N", type: "number", default: 15, min: 2, max: 100 }
     ]
   }
   ```
3. **Update the Controller:** Open `backend/controllers/algorithmController.js`, add a new `else if` block for the new algorithm ID, extract the parameters, and format the `-p` flags for the `papermill` command execution.

---
*Built for the Quantum Computing Web Integration Project.*
