import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { runChallengeCircuit, getChallenges, getMyProgress } from "../../services/api";

const GATES_DB = {
  "H": { type: "H", label: "H", short: "H", color: "bg-blue-500/20 text-blue-400 border-blue-500" },
  "X": { type: "X", label: "X", short: "X", color: "bg-red-500/20 text-red-400 border-red-500" },
  "Z": { type: "Z", label: "Z", short: "Z", color: "bg-purple-500/20 text-purple-400 border-purple-500" },
  "CX": { type: "CX", label: "CX", short: "CX", color: "bg-pink-500/20 text-pink-400 border-pink-500" },
};

function DraggableGate({ gate }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${gate.type}`,
    data: { ...gate },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`h-12 w-12 flex items-center justify-center rounded-lg border-2 font-bold cursor-grab active:cursor-grabbing shadow-lg ${gate.color}`}
    >
      {gate.label}
    </div>
  );
}

function WireDroppable({ wireIndex, gates, onRemove, onUpdate, numQubits }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `wire-${wireIndex}`,
  });

  return (
    <div className="flex items-center gap-4 w-full h-16 group relative">
      <div className="font-mono text-xs font-bold text-[var(--color-app-text-muted)] w-12">
        q[{wireIndex}]
      </div>
      
      <div
        ref={setNodeRef}
        className={`flex-1 h-full relative flex items-center px-4 rounded-lg transition-colors border-2 border-dashed ${
          isOver ? "bg-[var(--color-app-primary)]/10 border-[var(--color-app-primary)]" : "bg-transparent border-transparent hover:border-[var(--color-app-border)]"
        }`}
      >
        <div className="absolute left-0 right-0 h-[2px] bg-[var(--color-app-border-light)] top-1/2 -translate-y-1/2 -z-10" />

        <div className="flex gap-2 relative z-10 overflow-x-auto w-full custom-scrollbar items-center min-w-0">
          {gates.map((g, i) => (
            <div
              key={i}
              className={`h-12 w-16 shrink-0 flex flex-col items-center justify-center rounded-lg border-2 hover:scale-105 transition-transform relative group/gate ${g.color}`}
            >
              <div 
                className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover/gate:opacity-100 cursor-pointer z-20"
                onClick={(e) => { e.stopPropagation(); onRemove(wireIndex, i); }}
              >✕</div>
              <span className="font-bold text-sm">{g.short || g.label}</span>
              {g.type === "CX" && (
                <select 
                  className="text-[10px] bg-black/40 mt-0.5 border border-pink-500/50 rounded px-1 outline-none text-pink-400 font-mono cursor-pointer"
                  value={g.target !== undefined ? g.target : ((wireIndex + 1) % numQubits)}
                  onChange={(e) => onUpdate(wireIndex, i, { ...g, target: parseInt(e.target.value) })}
                >
                  {Array.from({ length: numQubits }).map((_, targetIdx) => (
                    targetIdx !== wireIndex && (
                      <option key={targetIdx} value={targetIdx} className="bg-[var(--color-app-surface)]">
                        → q[{targetIdx}]
                      </option>
                    )
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CircuitChallengesPage() {
  const navigate = useNavigate();
  
  const [challenges, setChallenges] = useState([]);
  const [activeChallengeIdx, setActiveChallengeIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Wire state: array of arrays, representing gates on each qubit wire
  const [wires, setWires] = useState([]);
  const [activeDragItem, setActiveDragItem] = useState(null);
  
  const [runStatus, setRunStatus] = useState("idle"); // idle, running, success, fail
  const [feedback, setFeedback] = useState(null);
  const [completedIds, setCompletedIds] = useState(new Set());

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        const data = await getChallenges();
        setChallenges(data);
        if (data.length > 0) {
          setWires(Array(data[0].numQubits).fill([]));
        }
      } catch (err) {
        setError("Failed to load challenges from the server.");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();

    getMyProgress()
      .then((data) => {
        const ids = new Set(
          data.progress.challengeProgress.filter((c) => c.completed).map((c) => c.challenge?.toString?.() || c.challenge)
        );
        setCompletedIds(ids);
      })
      .catch(() => {}); // Not logged in / unavailable — badges just won't show
  }, []);

  useEffect(() => {
    if (challenges.length > 0) {
      setWires(Array(challenges[activeChallengeIdx].numQubits).fill([]));
    }
    setRunStatus("idle");
    setFeedback(null);
  }, [activeChallengeIdx, challenges]);

  const handleDragStart = (event) => {
    setActiveDragItem(event.active.data.current);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (over && over.id.toString().startsWith("wire-")) {
      const wireIndex = parseInt(over.id.toString().split("-")[1], 10);
      const gateData = active.data.current;
      const challenge = challenges[activeChallengeIdx];
      
      const newGate = { ...gateData };
      if (newGate.type === "CX") {
        newGate.target = (wireIndex + 1) % challenge.numQubits;
      }
      
      const newWires = [...wires];
      newWires[wireIndex] = [...newWires[wireIndex], newGate];
      setWires(newWires);
    }
  };

  const handleRemoveGate = (wireIndex, gateIndex) => {
    const newWires = [...wires];
    newWires[wireIndex].splice(gateIndex, 1);
    setWires(newWires);
  };

  const handleUpdateGate = (wireIndex, gateIndex, updatedGate) => {
    const newWires = [...wires];
    newWires[wireIndex][gateIndex] = updatedGate;
    setWires(newWires);
  };

  const handleRunChallenge = async () => {
    const challenge = challenges[activeChallengeIdx];
    setRunStatus("running");
    setFeedback(null);
    
    // Flatten wires to a sequence of gates
    const gatesList = [];
    wires.forEach((wireGates, qIdx) => {
      wireGates.forEach(g => {
        gatesList.push({ type: g.type, qubit: qIdx, target: g.target });
      });
    });
    
    try {
      const res = await runChallengeCircuit(challenge.numQubits, gatesList, challenge.targetState, challenge._id);
      
      if (res.success) {
        setRunStatus("success");
        setFeedback({ msg: "Challenge Complete! Target state achieved.", type: "success" });
        setCompletedIds((prev) => new Set(prev).add(challenge._id));
      } else {
        setRunStatus("fail");
        setFeedback({ msg: "Incorrect state. Keep trying!", type: "error" });
      }
    } catch (err) {
      setRunStatus("fail");
      setFeedback({ msg: err.response?.data?.error || err.message || "Execution failed.", type: "error" });
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--color-app-base)] h-[calc(100vh-80px)]">
        <div className="text-[var(--color-app-text-muted)] animate-pulse font-bold text-xl">Loading Quantum Challenges...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--color-app-base)] h-[calc(100vh-80px)]">
        <div className="text-red-400 font-bold text-xl">{error}</div>
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--color-app-base)] h-[calc(100vh-80px)]">
        <div className="text-[var(--color-app-text-muted)] font-bold text-xl">No challenges available. Ask admin to add some.</div>
      </div>
    );
  }

  const challenge = challenges[activeChallengeIdx];

  return (
    <div className="flex flex-col bg-[var(--color-app-base)] text-[var(--color-app-text-main)] overflow-hidden font-sans w-full" style={{ height: "calc(100vh - 80px)" }}>
      <div className="flex items-center justify-between bg-[var(--color-app-surface)] px-8 py-4 border-b border-[var(--color-app-border)] shrink-0">
        <div>
          <h1 className="text-sm font-bold flex items-center gap-3 text-[var(--color-app-text-main)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-app-primary)] to-[var(--color-app-primary-hover)]">
              <span className="text-lg">📐</span>
            </div>
            Circuit Challenges
          </h1>
          <p className="text-xs text-[var(--color-app-text-muted)] mt-1 ml-11">
            Solve quantum circuit puzzles securely evaluated on the Python Qiskit backend.
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
        
        {/* Sidebar: Challenge Selector */}
        <div className="w-full lg:w-80 bg-[var(--color-app-surface)] border-r border-[var(--color-app-border)] p-6 overflow-y-auto shrink-0 custom-scrollbar">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-app-accent)] mb-1 pb-2 flex items-center justify-between border-b border-[var(--color-app-border)]">
            Select Challenge
            {challenges.length > 0 && (
              <span className="normal-case tracking-normal font-semibold text-[var(--color-app-text-muted)]">
                {completedIds.size}/{challenges.length} done
              </span>
            )}
          </h3>
          <div className="w-full h-1.5 rounded-full bg-[var(--color-app-surface-hover)] mb-4 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${challenges.length ? (completedIds.size / challenges.length) * 100 : 0}%`,
                background: "linear-gradient(90deg, var(--color-app-primary), var(--color-app-accent))",
              }}
            />
          </div>
          <div className="flex flex-col gap-3">
            {challenges.map((ch, idx) => (
              <button
                key={ch._id || ch.id}
                onClick={() => setActiveChallengeIdx(idx)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  activeChallengeIdx === idx
                    ? "bg-[var(--color-app-primary)]/10 border-[var(--color-app-primary)] text-[var(--color-app-primary)] shadow-[0_0_15px_rgba(var(--color-app-primary-rgb),0.2)]"
                    : "bg-[var(--color-app-base)] border-[var(--color-app-border)] text-[var(--color-app-text-light)] hover:border-[var(--color-app-border-light)]"
                }`}
              >
                <div className="font-bold text-sm flex items-center gap-2">
                  {ch.title}
                  {completedIds.has(ch._id) && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-500 border border-green-500/30">✓ Done</span>
                  )}
                </div>
                <div className="text-xs mt-1 opacity-70">{ch.numQubits} Qubit{ch.numQubits > 1 ? 's' : ''}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex flex-col bg-[var(--color-app-base)] relative min-w-0">
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
            
            <div className="p-8 flex-1 overflow-y-auto flex flex-col gap-8 min-w-0 custom-scrollbar">
              
              {/* Challenge Details Card */}
              <div className="app-glass p-6 rounded-2xl border border-[var(--color-app-border)] shadow-xl relative min-w-0">
                <h2 className="text-2xl font-bold text-[var(--color-app-text-main)] mb-2">{challenge.title}</h2>
                <p className="text-[var(--color-app-text-light)] mb-4">{challenge.desc}</p>
                <div className="inline-flex flex-col bg-[var(--color-app-surface)] border border-[var(--color-app-border-light)] p-3 rounded-lg">
                  <span className="text-xs uppercase tracking-widest text-[var(--color-app-text-muted)] mb-1">Target State Goal</span>
                  <span className="font-mono font-bold text-lg text-[var(--color-app-accent)]">{challenge.targetStr}</span>
                </div>
              </div>

              {/* Gate Palette */}
              <div className="app-glass p-4 rounded-xl border border-[var(--color-app-border)] flex items-center gap-4 flex-wrap shadow-md">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-text-muted)]">Available Gates:</span>
                {challenge.allowedGates.map(gateKey => (
                  <DraggableGate key={gateKey} gate={GATES_DB[gateKey]} />
                ))}
              </div>

              {/* Circuit Board */}
              <div className="app-glass p-6 rounded-2xl border border-[var(--color-app-border)] shadow-xl flex flex-col min-h-[300px] min-w-0">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-[var(--color-app-text-main)] flex items-center gap-2">
                    <span className="text-[var(--color-app-accent)]">⚡</span> Circuit Builder
                  </h3>
                  <button 
                    onClick={() => setWires(Array(challenge.numQubits).fill([]))}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-app-border-light)] hover:bg-[var(--color-app-surface)] transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="flex flex-col gap-2 relative">
                  {wires.map((wireGates, wIdx) => (
                    <WireDroppable 
                      key={wIdx} 
                      wireIndex={wIdx} 
                      gates={wireGates}
                      onRemove={handleRemoveGate}
                      onUpdate={handleUpdateGate}
                      numQubits={challenge.numQubits}
                    />
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-[var(--color-app-border-light)] pt-6">
                  <div className="flex-1">
                    <AnimatePresence mode="wait">
                      {feedback && (
                        <motion.div 
                          key={feedback.msg}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className={`font-bold text-sm px-4 py-2 rounded-lg inline-block ${
                            feedback.type === 'success' 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {feedback.msg}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    onClick={handleRunChallenge}
                    disabled={runStatus === "running"}
                    className="ml-4 px-8 py-3 rounded-xl bg-gradient-to-r from-[var(--color-app-primary)] to-[var(--color-app-primary-hover)] text-white font-bold tracking-wider hover:scale-105 transition-all shadow-[0_0_20px_rgba(var(--color-app-primary-rgb),0.4)] disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                  >
                    {runStatus === "running" ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        EVALUATING...
                      </>
                    ) : (
                      <>RUN CIRCUIT</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <DragOverlay dropAnimation={{ duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
              {activeDragItem ? (
                <div className={`h-14 w-14 flex items-center justify-center rounded-xl border-2 font-bold shadow-2xl scale-110 rotate-3 ${activeDragItem.color} bg-black/80 backdrop-blur-md`}>
                  {activeDragItem.label}
                </div>
              ) : null}
            </DragOverlay>
            
          </DndContext>
        </div>
      </div>
    </div>
  );
}
