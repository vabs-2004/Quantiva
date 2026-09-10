import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import QubitSpinSimulator from "./components/QubitSpinSimulator";
import QKDDemo from "./components/QKDDemo";

const BELL_STATES = {
  "Phi+": {
    name: "Φ+ (Phi Plus)",
    amplitudes: [1 / Math.sqrt(2), 0, 0, 1 / Math.sqrt(2)], // |00> + |11>
    circuit: ["H on Q0", "CX(Q0 → Q1)"],
    formula: "(|00⟩ + |11⟩) / √2"
  },
  "Phi-": {
    name: "Φ- (Phi Minus)",
    amplitudes: [1 / Math.sqrt(2), 0, 0, -1 / Math.sqrt(2)], // |00> - |11>
    circuit: ["X on Q0", "H on Q0", "CX(Q0 → Q1)"],
    formula: "(|00⟩ - |11⟩) / √2"
  },
  "Psi+": {
    name: "Ψ+ (Psi Plus)",
    amplitudes: [0, 1 / Math.sqrt(2), 1 / Math.sqrt(2), 0], // |01> + |10>
    circuit: ["H on Q0", "X on Q1", "CX(Q0 → Q1)"],
    formula: "(|01⟩ + |10⟩) / √2"
  },
  "Psi-": {
    name: "Ψ- (Psi Minus)",
    amplitudes: [0, 1 / Math.sqrt(2), -1 / Math.sqrt(2), 0], // |01> - |10>
    circuit: ["X on Q0", "H on Q0", "X on Q1", "CX(Q0 → Q1)"],
    formula: "(|01⟩ - |10⟩) / √2"
  },
};

const BASES = ["|00⟩", "|01⟩", "|10⟩", "|11⟩"];

export default function EntanglementLabPage() {
  const navigate = useNavigate();
  const [activeState, setActiveState] = useState("Phi+");
  
  // Current quantum state [a00, a01, a10, a11]
  const [amplitudes, setAmplitudes] = useState(BELL_STATES["Phi+"].amplitudes);
  
  // Measurement outcomes (null = not measured yet)
  const [measurement, setMeasurement] = useState({ q0: null, q1: null });

  // Reset state when selecting a new Bell State
  const handleSelectState = (key) => {
    setActiveState(key);
    setAmplitudes(BELL_STATES[key].amplitudes);
    setMeasurement({ q0: null, q1: null });
  };

  const measureQubit = (qubitIndex) => {
    // Prevent double measuring same qubit
    if (qubitIndex === 0 && measurement.q0 !== null) return;
    if (qubitIndex === 1 && measurement.q1 !== null) return;

    let [a00, a01, a10, a11] = amplitudes;
    let prob0, prob1;

    if (qubitIndex === 0) {
      // Prob of Q0 being 0 is |a00|^2 + |a01|^2
      prob0 = a00 * a00 + a01 * a01;
      prob1 = a10 * a10 + a11 * a11;
    } else {
      // Prob of Q1 being 0 is |a00|^2 + |a10|^2
      prob0 = a00 * a00 + a10 * a10;
      prob1 = a01 * a01 + a11 * a11;
    }

    // Roll a random number between 0 and 1
    const rand = Math.random();
    const outcome = rand < prob0 ? 0 : 1;

    // Collapse the state
    let newAmps = [0, 0, 0, 0];
    if (qubitIndex === 0) {
      if (outcome === 0) {
        newAmps = [a00, a01, 0, 0];
      } else {
        newAmps = [0, 0, a10, a11];
      }
    } else {
      if (outcome === 0) {
        newAmps = [a00, 0, a10, 0];
      } else {
        newAmps = [0, a01, 0, a11];
      }
    }

    // Normalize new state
    const norm = Math.sqrt(newAmps.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      newAmps = newAmps.map((val) => val / norm);
    }

    setAmplitudes(newAmps);
    setMeasurement((prev) => ({
      ...prev,
      [`q${qubitIndex}`]: outcome,
    }));
    
    // Check if the other qubit is completely determined now
    // (If the norm of the remaining amplitudes is concentrated on a single basis)
    if (qubitIndex === 0 && measurement.q1 === null) {
      const pQ1_0 = newAmps[0]*newAmps[0] + newAmps[2]*newAmps[2];
      const pQ1_1 = newAmps[1]*newAmps[1] + newAmps[3]*newAmps[3];
      // In Bell states, measuring Q0 ALWAYS determines Q1 instantly
      if (pQ1_0 > 0.99) setMeasurement(p => ({ ...p, q1: 0 }));
      else if (pQ1_1 > 0.99) setMeasurement(p => ({ ...p, q1: 1 }));
    }
    
    if (qubitIndex === 1 && measurement.q0 === null) {
      const pQ0_0 = newAmps[0]*newAmps[0] + newAmps[1]*newAmps[1];
      const pQ0_1 = newAmps[2]*newAmps[2] + newAmps[3]*newAmps[3];
      if (pQ0_0 > 0.99) setMeasurement(p => ({ ...p, q0: 0 }));
      else if (pQ0_1 > 0.99) setMeasurement(p => ({ ...p, q0: 1 }));
    }
  };

  const currentProbabilities = amplitudes.map((a) => (a * a) * 100);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-app-base)] text-[var(--color-app-text-main)] overflow-hidden font-sans">
      <Toaster theme="dark" position="bottom-right" />
      
      {/* Top Header */}
      <div className="flex items-center justify-between bg-[var(--color-app-surface)] px-8 py-4 border-b border-[var(--color-app-border)]">
        <div>
          <h1 className="text-sm font-bold flex items-center gap-3 text-[var(--color-app-text-main)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-app-primary)] to-[var(--color-app-primary-hover)]">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            Entanglement Lab
          </h1>
          <p className="text-xs text-[var(--color-app-text-muted)] mt-1 ml-11">
            Explore Bell States and visualize "spooky action at a distance".
          </p>
        </div>
        
        <button
          onClick={() => navigate("/playground")}
          className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-hover)] px-4 py-2 text-xs font-semibold text-[var(--color-app-text-light)] hover:bg-[var(--color-app-surface-alt)] hover:text-[var(--color-app-text-main)] transition"
        >
          ← Back to Playground
        </button>
      </div>
      <div className="app-gradient-line" />

      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        
        {/* Left Sidebar: Controls */}
        <div className="w-full lg:w-80 bg-[var(--color-app-surface)] border-r border-[var(--color-app-border)] p-6 overflow-y-auto">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-app-accent)] mb-4 border-b border-[var(--color-app-border)] pb-2">
            Select Bell State
          </h3>
          
          <div className="flex flex-col gap-3 mb-8">
            {Object.entries(BELL_STATES).map(([key, data]) => (
              <button
                key={key}
                onClick={() => handleSelectState(key)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  activeState === key
                    ? "bg-[var(--color-app-primary)]/10 border-[var(--color-app-primary)] text-[var(--color-app-primary)] shadow-[0_0_15px_rgba(var(--color-app-primary-rgb),0.2)]"
                    : "bg-[var(--color-app-base)] border-[var(--color-app-border)] text-[var(--color-app-text-light)] hover:border-[var(--color-app-border-light)]"
                }`}
              >
                <div className="font-bold text-sm">{data.name}</div>
                <div className="font-mono text-xs mt-1 opacity-70">{data.formula}</div>
              </button>
            ))}
          </div>

          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-app-accent)] mb-4 border-b border-[var(--color-app-border)] pb-2">
            Circuit Diagram
          </h3>
          <div className="app-glass p-4 rounded-xl font-mono text-xs space-y-2 border border-[var(--color-app-border)]">
            <div className="flex items-center gap-2 text-[var(--color-app-text-light)]">
              <span className="font-bold w-6">q0:</span>
              <div className="flex-1 h-px bg-[var(--color-app-border-light)] relative">
                 <div className="absolute top-1/2 -translate-y-1/2 left-4 flex gap-2">
                    {BELL_STATES[activeState].circuit.map((c, i) => 
                      c.includes("Q0") ? <span key={i} className="bg-[var(--color-app-primary)]/20 border border-[var(--color-app-primary)] text-[var(--color-app-primary)] px-1 rounded">{c.split(" ")[0]}</span> : null
                    )}
                 </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[var(--color-app-text-light)]">
              <span className="font-bold w-6">q1:</span>
              <div className="flex-1 h-px bg-[var(--color-app-border-light)] relative">
                 <div className="absolute top-1/2 -translate-y-1/2 left-4 flex gap-2">
                    {BELL_STATES[activeState].circuit.map((c, i) => 
                      c.includes("Q1") && !c.includes("CX") ? <span key={i} className="bg-red-500/20 border border-red-500 text-red-400 px-1 rounded">{c.split(" ")[0]}</span> : null
                    )}
                    {BELL_STATES[activeState].circuit.some(c => c.includes("CX")) && (
                      <span className="bg-pink-500/20 border border-pink-500 text-pink-400 px-1 rounded ml-12">TARGET</span>
                    )}
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Area: Visualization & Measurement */}
        <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-8 bg-[var(--color-app-base)]">
          
          {/* Probability Bar Chart */}
          <div className="app-glass p-6 rounded-2xl border border-[var(--color-app-border)] shadow-xl relative">
            <div className="absolute top-4 right-6 text-xs text-[var(--color-app-text-muted)] font-mono">
              Theoretical Probabilities
            </div>
            <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-[var(--color-app-primary)] mb-8">
              Two-Qubit State Distribution
            </h3>
            
            <div className="flex justify-around items-end h-48 gap-4 px-4 border-b border-[var(--color-app-border-light)] pb-2 relative">
              {/* Y Axis labels */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-[var(--color-app-text-muted)] py-2">
                <span>100%</span>
                <span>50%</span>
                <span>0%</span>
              </div>
              
              {currentProbabilities.map((prob, i) => (
                <div key={i} className="flex flex-col items-center gap-3 w-1/4">
                  <div className="text-xs font-mono text-[var(--color-app-accent)] font-bold">
                    {prob.toFixed(1)}%
                  </div>
                  <motion.div
                    className="w-full max-w-[60px] rounded-t-lg bg-gradient-to-t from-[var(--color-app-primary)] to-[var(--color-app-primary-hover)] relative overflow-hidden"
                    initial={{ height: 0 }}
                    animate={{ height: `${prob}%` }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  >
                    <div className="absolute inset-0 bg-white/10" style={{ opacity: prob === 100 ? 1 : 0 }} />
                  </motion.div>
                  <div className="font-mono text-sm font-bold text-[var(--color-app-text-light)]">
                    {BASES[i]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Measurement Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            
            {/* Qubit 0 Panel */}
            <div className={`p-6 rounded-2xl border transition-colors ${measurement.q0 !== null ? 'bg-[var(--color-app-primary)]/10 border-[var(--color-app-primary)]' : 'app-glass border-[var(--color-app-border)]'}`}>
               <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--color-app-primary)]"></div>
                  Qubit 0 (Alice)
               </h4>
               
               {measurement.q0 === null ? (
                 <button
                   onClick={() => measureQubit(0)}
                   className="w-full py-4 rounded-xl font-bold bg-white/5 hover:bg-[var(--color-app-primary)]/20 border border-white/10 hover:border-[var(--color-app-primary)] transition-all flex items-center justify-center gap-2"
                 >
                   <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                   Measure Qubit 0
                 </button>
               ) : (
                 <div className="flex flex-col items-center justify-center py-2">
                   <span className="text-xs uppercase tracking-widest text-[var(--color-app-text-muted)] mb-2">Measured State</span>
                   <span className="text-6xl font-bold text-[var(--color-app-primary)] font-mono drop-shadow-[0_0_15px_rgba(var(--color-app-primary-rgb),0.5)]">
                     |{measurement.q0}⟩
                   </span>
                 </div>
               )}
            </div>

            {/* Qubit 1 Panel */}
            <div className={`p-6 rounded-2xl border transition-colors ${measurement.q1 !== null ? 'bg-pink-500/10 border-pink-500' : 'app-glass border-[var(--color-app-border)]'}`}>
               <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                  Qubit 1 (Bob)
               </h4>
               
               {measurement.q1 === null ? (
                 <button
                   onClick={() => measureQubit(1)}
                   className="w-full py-4 rounded-xl font-bold bg-white/5 hover:bg-pink-500/20 border border-white/10 hover:border-pink-500 transition-all flex items-center justify-center gap-2"
                 >
                   <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                   Measure Qubit 1
                 </button>
               ) : (
                 <div className="flex flex-col items-center justify-center py-2">
                   <span className="text-xs uppercase tracking-widest text-[var(--color-app-text-muted)] mb-2">Measured State</span>
                   <span className="text-6xl font-bold text-pink-400 font-mono drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]">
                     |{measurement.q1}⟩
                   </span>
                 </div>
               )}
            </div>

          </div>

          {/* Explanation Box */}
          {(measurement.q0 !== null || measurement.q1 !== null) && (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="mt-2 p-5 rounded-xl border border-[var(--color-app-accent)]/30 bg-[var(--color-app-accent)]/5 flex items-start gap-4"
             >
                <span className="text-2xl">⚡</span>
                <div>
                  <h4 className="font-bold text-[var(--color-app-accent)] mb-1">Spooky Action Observed!</h4>
                  <p className="text-sm text-[var(--color-app-text-light)] leading-relaxed">
                    Because these qubits were in the <strong>{BELL_STATES[activeState].name}</strong> state, they were entangled. 
                    Measuring one qubit instantly collapsed the wavefunction of the entire system. 
                    As a result, the state of the other qubit was immediately determined across space, perfectly correlating with the first measurement.
                  </p>
                  <button 
                    onClick={() => handleSelectState(activeState)}
                    className="mt-3 text-xs font-bold text-[var(--color-app-primary)] hover:underline"
                  >
                    Reset & Try Again
                  </button>
                </div>
             </motion.div>
          )}
          
          <div className="mt-8 border-t border-[var(--color-app-border-light)] pt-8">
            <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-[var(--color-app-accent)] mb-6">
              Advanced Demonstrations
            </h3>
            <div className="flex flex-col gap-8 min-w-0">
              {/* Feature 1: Interactive Qubit Spin Simulator */}
              <QubitSpinSimulator />
              
              {/* Feature 2: QKD Demo */}
              <QKDDemo />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
