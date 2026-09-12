import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import QuantumTimeMachinePanel from "../../components/QuantumTimeMachine/QuantumTimeMachinePanel";

import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  closestCenter,
} from "@dnd-kit/core";

import { CSS } from "@dnd-kit/utilities";

import { useAITutor } from "../../context/AITutorContext";

import {
  runChallengeCircuit,
  runCircuitTimeline,
  getChallenges,
  getMyProgress,
} from "../../services/api";

import {
  flattenCircuitByLayer,
  getCircuitLayers,
} from "../../utils/circuitLayers";


/* ============================================================
   GATE DATABASE
   ============================================================ */

const GATES_DB = {
  H: {
    type: "H",
    label: "H",
    short: "H",
    color:
      "bg-blue-500/20 text-blue-400 border-blue-500",
  },

  X: {
    type: "X",
    label: "X",
    short: "X",
    color:
      "bg-red-500/20 text-red-400 border-red-500",
  },

  Z: {
    type: "Z",
    label: "Z",
    short: "Z",
    color:
      "bg-purple-500/20 text-purple-400 border-purple-500",
  },

  CX: {
    type: "CX",
    label: "CX",
    short: "CX",
    color:
      "bg-pink-500/20 text-pink-400 border-pink-500",
  },
};


/* ============================================================
   DRAGGABLE GATE
   ============================================================ */

function DraggableGate({ gate }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
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


/* ============================================================
   WIRE DROPPABLE
   ============================================================ */

function WireDroppable({
  wireIndex,
  gates,
  onRemove,
  onUpdate,
  numQubits,
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `wire-${wireIndex}`,
  });

  return (
    <div className="flex items-center gap-4 w-full h-16 group relative">

      {/* Qubit label */}
      <div className="font-mono text-xs font-bold text-[var(--color-app-text-muted)] w-12">
        q[{wireIndex}]
      </div>

      {/* Wire */}
      <div
        ref={setNodeRef}
        className={`flex-1 h-full relative flex items-center px-4 rounded-lg transition-colors border-2 border-dashed ${
          isOver
            ? "bg-[var(--color-app-primary)]/10 border-[var(--color-app-primary)]"
            : "bg-transparent border-transparent hover:border-[var(--color-app-border)]"
        }`}
      >

        {/* Horizontal wire */}
        <div className="absolute left-0 right-0 h-[2px] bg-[var(--color-app-border-light)] top-1/2 -translate-y-1/2 -z-10" />

        {/* Gates */}
        <div className="flex gap-2 relative z-10 overflow-x-auto w-full custom-scrollbar items-center min-w-0">

          {gates.map((g, i) => (
            <div
              key={i}
              className={`h-12 w-16 shrink-0 flex flex-col items-center justify-center rounded-lg border-2 hover:scale-105 transition-transform relative group/gate ${g.color}`}
            >

              {/* Remove gate */}
              <div
                className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover/gate:opacity-100 cursor-pointer z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(wireIndex, i);
                }}
              >
                ✕
              </div>

              <span className="font-bold text-sm">
                {g.short || g.label}
              </span>

              {/* CX target selector */}
              {g.type === "CX" && (
                <select
                  className="text-[10px] bg-black/40 mt-0.5 border border-pink-500/50 rounded px-1 outline-none text-pink-400 font-mono cursor-pointer"
                  value={
                    g.target !== undefined
                      ? g.target
                      : (wireIndex + 1) % numQubits
                  }
                  onChange={(e) =>
                    onUpdate(
                      wireIndex,
                      i,
                      {
                        ...g,
                        target: parseInt(e.target.value, 10),
                      }
                    )
                  }
                >
                  {Array.from({ length: numQubits }).map(
                    (_, targetIdx) =>
                      targetIdx !== wireIndex && (
                        <option
                          key={targetIdx}
                          value={targetIdx}
                          className="bg-[var(--color-app-surface)]"
                        >
                          → q[{targetIdx}]
                        </option>
                      )
                  )}
                </select>
              )}

            </div>
          ))}

        </div>
      </div>
    </div>
  );
}


/* ============================================================
   MAIN PAGE
   ============================================================ */

export default function CircuitChallengesPage() {
  const navigate = useNavigate();

  const { openTutor } = useAITutor();


  /* ==========================================================
     CHALLENGE STATE
     ========================================================== */

  const [challenges, setChallenges] = useState([]);
  const [activeChallengeIdx, setActiveChallengeIdx] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  /* ==========================================================
     CIRCUIT BUILDER STATE
     ========================================================== */

  // wires[q] = gates placed on qubit q
  const [wires, setWires] = useState([]);

  const [activeDragItem, setActiveDragItem] = useState(null);


  /* ==========================================================
     CHALLENGE SUBMISSION STATE
     ========================================================== */

  const [runStatus, setRunStatus] = useState("idle");
  // idle | running | success | fail

  const [feedback, setFeedback] = useState(null);

  const [completedIds, setCompletedIds] = useState(new Set());


  /* ==========================================================
     QUANTUM TIME MACHINE STATE
     ========================================================== */

  const [timeline, setTimeline] = useState(null);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);

  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  /*
   * A timeline becomes stale whenever the circuit is edited
   * after it was evaluated.
   */
  const [timelineStale, setTimelineStale] = useState(false);

  /*
   * Separate loading state for PLAY CIRCUIT.
   */
  const [isPlayingCircuit, setIsPlayingCircuit] = useState(false);


  /* ==========================================================
     INITIAL DATA FETCH
     ========================================================== */

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);

        const data = await getChallenges();

        setChallenges(data);

        if (data.length > 0) {
          setWires(
            Array.from(
              { length: data[0].numQubits },
              () => []
            )
          );
        }
      } catch (err) {
        console.error(
          "[CircuitChallenges] Failed to load challenges:",
          err
        );

        setError(
          "Failed to load challenges from the server."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchAll();

    getMyProgress()
      .then((data) => {
        const ids = new Set(
          data.progress.challengeProgress
            .filter((c) => c.completed)
            .map(
              (c) =>
                c.challenge?.toString?.() ||
                c.challenge
            )
        );

        setCompletedIds(ids);
      })
      .catch(() => {
        // Not logged in / unavailable.
        // Completion badges simply won't show.
      });
  }, []);


  /* ==========================================================
     CHALLENGE SWITCH
     ========================================================== */

  useEffect(() => {
    if (challenges.length === 0) {
      return;
    }

    const challenge =
      challenges[activeChallengeIdx];

    /*
     * Fresh circuit for every challenge.
     */
    setWires(
      Array.from(
        { length: challenge.numQubits },
        () => []
      )
    );

    /*
     * Reset submission state.
     */
    setRunStatus("idle");
    setFeedback(null);

    /*
     * Reset Time Machine.
     *
     * A timeline belongs to a specific challenge + circuit,
     * so it must never survive a challenge switch.
     */
    setTimeline(null);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setTimelineStale(false);
    setIsPlayingCircuit(false);

  }, [activeChallengeIdx, challenges]);


  /* ==========================================================
     DRAG START
     ========================================================== */

  const handleDragStart = (event) => {
    setActiveDragItem(
      event.active.data.current
    );
  };


  /* ==========================================================
     DRAG END
     ========================================================== */

  const handleDragEnd = (event) => {
    const { active, over } = event;

    setActiveDragItem(null);

    if (
      !over ||
      !over.id
        .toString()
        .startsWith("wire-")
    ) {
      return;
    }

    const wireIndex = parseInt(
      over.id.toString().split("-")[1],
      10
    );

    const gateData = active.data.current;

    const challenge =
      challenges[activeChallengeIdx];

    if (!gateData || !challenge) {
      return;
    }

    const newGate = {
      ...gateData,
    };

    /*
     * Default CX target.
     */
    if (newGate.type === "CX") {
      newGate.target =
        (wireIndex + 1) %
        challenge.numQubits;
    }

    const newWires = [...wires];

    newWires[wireIndex] = [
      ...(newWires[wireIndex] || []),
      newGate,
    ];

    setWires(newWires);

    /*
     * Existing timeline no longer represents
     * the current circuit.
     */
    setTimelineStale(true);
    setIsPlaying(false);

    /*
     * Editing means any previous submission feedback
     * is no longer particularly useful.
     */
    setRunStatus("idle");
  };


  /* ==========================================================
     REMOVE GATE
     ========================================================== */

  const handleRemoveGate = (
    wireIndex,
    gateIndex
  ) => {
    const newWires = wires.map(
      (wire) => [...wire]
    );

    newWires[wireIndex].splice(
      gateIndex,
      1
    );

    setWires(newWires);

    setTimelineStale(true);
    setIsPlaying(false);

    setRunStatus("idle");
  };


  /* ==========================================================
     UPDATE GATE
     ========================================================== */

  const handleUpdateGate = (
    wireIndex,
    gateIndex,
    updatedGate
  ) => {
    const newWires = wires.map(
      (wire) => [...wire]
    );

    newWires[wireIndex][gateIndex] =
      updatedGate;

    setWires(newWires);

    setTimelineStale(true);
    setIsPlaying(false);

    setRunStatus("idle");
  };


  /* ==========================================================
     PLAY CIRCUIT
     ========================================================== */

  const handlePlayCircuit = async () => {
    const challenge =
      challenges[activeChallengeIdx];

    if (!challenge) {
      return;
    }

    setIsPlayingCircuit(true);
    setIsPlaying(false);
    setFeedback(null);

    /*
     * Convert the visual wire representation into
     * canonical temporal gate order.
     *
     * IMPORTANT:
     * flattenCircuitByLayer() gives us:
     *
     * layer 0 → q0, q1, q2...
     * layer 1 → q0, q1, q2...
     * ...
     */
    const gates =
      flattenCircuitByLayer(
        challenge.numQubits,
        wires
      ).map((g) => ({
        type: g.type,
        wire: g.wire,
        target: g.target,
      }));

    try {
      /*
       * PLAY is intentionally independent from
       * challenge correctness evaluation.
       *
       * It only asks:
       *
       * "What does this circuit do?"
       */
      const res =
        await runCircuitTimeline({
          numQubits:
            challenge.numQubits,
          gates,
        });

      if (!res?.success) {
        throw new Error(
          res?.error ||
            "Failed to evaluate circuit timeline."
        );
      }

      setTimeline(res);

      setCurrentStepIndex(0);

      setTimelineStale(false);

      setFeedback({
        msg:
          "Timeline generated. Explore your circuit gate by gate.",
        type: "success",
      });

    } catch (err) {
      console.error(
        "[CircuitChallenges] Timeline evaluation failed:",
        err
      );

      setTimeline(null);

      setFeedback({
        msg:
          err.response?.data?.error ||
          err.message ||
          "Failed to run circuit.",
        type: "error",
      });

    } finally {
      setIsPlayingCircuit(false);
    }
  };


  /* ==========================================================
     TIME MACHINE CONTROLS
     ========================================================== */

  const handleTimelinePlayPause = () => {
    setIsPlaying(
      (prev) => !prev
    );
  };


  const handleTimelineReset = () => {
    setIsPlaying(false);

    setCurrentStepIndex(0);
  };


  const handleTimelineStepChange = (
    index
  ) => {
    setCurrentStepIndex(index);
  };


  const handleTimelineRefresh = () => {
    handlePlayCircuit();
  };


  /* ==========================================================
     ASK AI TUTOR
     ========================================================== */

  const handleAskTutor = () => {
    const challenge =
      challenges[activeChallengeIdx];
      console.log("========== CHALLENGE TUTOR DEBUG ==========");
  console.log("challenge:", challenge);
  console.log("activeChallengeIdx:", activeChallengeIdx);
  console.log("wires:", wires);
  console.log("numQubits:", challenge?.numQubits);
  const debugGates = challenge
    ? flattenCircuitByLayer(challenge.numQubits, wires)
    : [];

  console.log("flattened gates:", debugGates);
  console.log("gate count:", debugGates.length);
    if (!challenge) {
      return;
    }

    /*
     * Canonical gate representation.
     */
    const gates =
      flattenCircuitByLayer(
        challenge.numQubits,
        wires
      ).map((g) => ({
        type: g.type,
        qubit: g.wire,
        target: g.target,
        layerIndex: g.layerIndex,
        wireIndex: g.wireIndex,
        gateIndexOnWire:
          g.gateIndexOnWire,
      }));


    /*
     * Temporal circuit representation.
     */
    const layers =
      getCircuitLayers(
        challenge.numQubits,
        wires
      );


    /*
     * If the circuit has already been played,
     * provide the final timeline probabilities
     * to the tutor.
     *
     * We do NOT invent probabilities when there
     * is no timeline.
     */
    const finalStep =
      timeline?.steps?.[
        timeline.steps.length - 1
      ];

    const probabilities =
      finalStep?.probabilities || {};


    /*
     * Challenge-specific Tutor session.
     *
     * The Tutor receives:
     *
     * - challenge requirements
     * - target state
     * - allowed gates
     * - student's current circuit
     * - temporal layers
     * - actual execution probabilities, if available
     *
     * It is explicitly told not to solve the challenge.
     */
    console.log(
  "========== EXACT TUTOR CONTEXT ==========\n" +
  JSON.stringify(
    {
      page: "Circuit Challenges",
      challengeMode: true,
      challenge: {
        id: challenge._id || challenge.id,
        title: challenge.title,
        description: challenge.desc,
        numQubits: challenge.numQubits,
        targetState: challenge.targetState,
        targetDisplay: challenge.targetStr,
        allowedGates: challenge.allowedGates,
      },
      numQubits: challenge.numQubits,
      gates,
      layers,
      probabilities,
    },
    null,
    2
  )
);
    openTutor(
      "I'm working on this quantum circuit challenge. Analyze my current attempt and help me with a hint. Do NOT give me the solution, final circuit, exact sequence of gates, or code that directly solves the challenge. First identify whether my current approach is correct or where it goes wrong, then give me a progressively useful hint that helps me figure out the next step myself.",
      {
        page: "Circuit Challenges",

        challengeMode: true,

        challenge: {
          id:
            challenge._id ||
            challenge.id,

          title:
            challenge.title,

          description:
            challenge.desc,

          numQubits:
            challenge.numQubits,

          targetState:
            challenge.targetState,

          targetDisplay:
            challenge.targetStr,

          allowedGates:
            challenge.allowedGates,
        },

        numQubits:
          challenge.numQubits,

        gates,

        layers,

        probabilities,
      }
    );
  };


  /* ==========================================================
     SUBMIT CHALLENGE
     ========================================================== */

  const handleRunChallenge =
    async () => {
      const challenge =
        challenges[activeChallengeIdx];

      if (!challenge) {
        return;
      }

      setRunStatus("running");
      setFeedback(null);

      /*
       * Submission is deliberately separate from
       * the Time Machine.
       *
       * This is the authoritative correctness check.
       */
      const gatesList =
        flattenCircuitByLayer(
          challenge.numQubits,
          wires
        ).map((g) => ({
          type: g.type,
          qubit: g.wire,
          target: g.target,
        }));

      try {
        const res =
          await runChallengeCircuit(
            challenge.numQubits,
            gatesList,
            challenge.targetState,
            challenge._id
          );

        if (res.success) {
          setRunStatus("success");

          setFeedback({
            msg:
              "Challenge Complete! Target state achieved.",
            type: "success",
          });

          setCompletedIds(
            (prev) =>
              new Set([
                ...prev,
                challenge._id,
              ])
          );

        } else {
          setRunStatus("fail");

          setFeedback({
            msg:
              "Incorrect state. Keep trying!",
            type: "error",
          });
        }

      } catch (err) {
        console.error(
          "[CircuitChallenges] Challenge submission failed:",
          err
        );

        setRunStatus("fail");

        setFeedback({
          msg:
            err.response?.data?.error ||
            err.message ||
            "Execution failed.",
          type: "error",
        });
      }
    };


  /* ============================================================
     LOADING STATE
     ============================================================ */

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--color-app-base)] h-[calc(100vh-80px)]">
        <div className="text-[var(--color-app-text-muted)] animate-pulse font-bold text-xl">
          Loading Quantum Challenges...
        </div>
      </div>
    );
  }


  /* ============================================================
     ERROR STATE
     ============================================================ */

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--color-app-base)] h-[calc(100vh-80px)]">
        <div className="text-red-400 font-bold text-xl">
          {error}
        </div>
      </div>
    );
  }


  /* ============================================================
     EMPTY STATE
     ============================================================ */

  if (challenges.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--color-app-base)] h-[calc(100vh-80px)]">
        <div className="text-[var(--color-app-text-muted)] font-bold text-xl">
          No challenges available. Ask admin to add some.
        </div>
      </div>
    );
  }


  const challenge =
    challenges[activeChallengeIdx];


  /* ============================================================
     PAGE
     ============================================================ */

  return (
    <div
      className="flex flex-col bg-[var(--color-app-base)] text-[var(--color-app-text-main)] font-sans w-full"
      style={{
        height: "calc(100vh - 80px)",
      }}
    >

      {/* ======================================================
          HEADER
          ====================================================== */}

      <div className="flex items-center justify-between bg-[var(--color-app-surface)] px-8 py-4 border-b border-[var(--color-app-border)] shrink-0">

        <div>
          <h1 className="text-sm font-bold flex items-center gap-3 text-[var(--color-app-text-main)]">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-app-primary)] to-[var(--color-app-primary-hover)]">
              <span className="text-lg">
                📐
              </span>
            </div>

            Circuit Challenges
          </h1>

          <p className="text-xs text-[var(--color-app-text-muted)] mt-1 ml-11">
            Solve quantum circuit puzzles securely evaluated on the Python Qiskit backend.
          </p>
        </div>


        <button
          onClick={() =>
            navigate("/playground")
          }
          className="rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-surface-hover)] px-4 py-2 text-xs font-semibold text-[var(--color-app-text-light)] hover:bg-[var(--color-app-surface-alt)] hover:text-[var(--color-app-text-main)] transition"
        >
          ← Back to Playground
        </button>

      </div>


      <div className="app-gradient-line" />


      {/* ======================================================
          MAIN LAYOUT
          ====================================================== */}

      <div className="flex flex-1 flex-col lg:flex-row">


        {/* ====================================================
            SIDEBAR
            ==================================================== */}

        <div className="w-full lg:w-80 bg-[var(--color-app-surface)] border-r border-[var(--color-app-border)] p-6 overflow-y-auto shrink-0 custom-scrollbar">

          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-app-accent)] mb-1 pb-2 flex items-center justify-between border-b border-[var(--color-app-border)]">

            Select Challenge

            {challenges.length > 0 && (
              <span className="normal-case tracking-normal font-semibold text-[var(--color-app-text-muted)]">
                {completedIds.size}/
                {challenges.length} done
              </span>
            )}

          </h3>


          {/* Progress bar */}

          <div className="w-full h-1.5 rounded-full bg-[var(--color-app-surface-hover)] mb-4 overflow-hidden">

            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${
                  challenges.length
                    ? (completedIds.size /
                        challenges.length) *
                      100
                    : 0
                }%`,

                background:
                  "linear-gradient(90deg, var(--color-app-primary), var(--color-app-accent))",
              }}
            />

          </div>


          {/* Challenge list */}

          <div className="flex flex-col gap-3">

            {challenges.map(
              (ch, idx) => (
                <button
                  key={
                    ch._id ||
                    ch.id
                  }
                  onClick={() =>
                    setActiveChallengeIdx(
                      idx
                    )
                  }
                  className={`text-left p-3 rounded-xl border transition-all ${
                    activeChallengeIdx ===
                    idx
                      ? "bg-[var(--color-app-primary)]/10 border-[var(--color-app-primary)] text-[var(--color-app-primary)] shadow-[0_0_15px_rgba(var(--color-app-primary-rgb),0.2)]"
                      : "bg-[var(--color-app-base)] border-[var(--color-app-border)] text-[var(--color-app-text-light)] hover:border-[var(--color-app-border-light)]"
                  }`}
                >

                  <div className="font-bold text-sm flex items-center gap-2">

                    {ch.title}

                    {completedIds.has(
                      ch._id
                    ) && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-500 border border-green-500/30">
                        ✓ Done
                      </span>
                    )}

                  </div>


                  <div className="text-xs mt-1 opacity-70">
                    {ch.numQubits} Qubit
                    {ch.numQubits > 1
                      ? "s"
                      : ""}
                  </div>

                </button>
              )
            )}

          </div>

        </div>


        {/* ====================================================
            MAIN CONTENT
            ==================================================== */}

        <div className="flex-1 flex flex-col bg-[var(--color-app-base)] relative min-w-0">

          <DndContext
            onDragStart={
              handleDragStart
            }
            onDragEnd={
              handleDragEnd
            }
            collisionDetection={
              closestCenter
            }
          >

            <div className="p-8 flex-1 overflow-y-auto flex flex-col gap-8 min-w-0 custom-scrollbar">


              {/* =================================================
                  CHALLENGE DETAILS
                  ================================================= */}

              <div className="app-glass p-6 rounded-2xl border border-[var(--color-app-border)] shadow-xl relative min-w-0">

                <h2 className="text-2xl font-bold text-[var(--color-app-text-main)] mb-2">
                  {challenge.title}
                </h2>

                <p className="text-[var(--color-app-text-light)] mb-4">
                  {challenge.desc}
                </p>


                <div className="inline-flex flex-col bg-[var(--color-app-surface)] border border-[var(--color-app-border-light)] p-3 rounded-lg">

                  <span className="text-xs uppercase tracking-widest text-[var(--color-app-text-muted)] mb-1">
                    Target State Goal
                  </span>

                  <span className="font-mono font-bold text-lg text-[var(--color-app-accent)]">
                    {challenge.targetStr}
                  </span>

                </div>

              </div>


              {/* =================================================
                  GATE PALETTE
                  ================================================= */}

              <div className="app-glass p-4 rounded-xl border border-[var(--color-app-border)] flex items-center gap-4 flex-wrap shadow-md">

                <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-app-text-muted)]">
                  Available Gates:
                </span>

                {challenge.allowedGates.map(
                  (gateKey) => (
                    <DraggableGate
                      key={gateKey}
                      gate={
                        GATES_DB[
                          gateKey
                        ]
                      }
                    />
                  )
                )}

              </div>


              {/* =================================================
                  CIRCUIT BUILDER
                  ================================================= */}

              <div className="app-glass p-6 rounded-2xl border border-[var(--color-app-border)] shadow-xl flex flex-col min-h-[300px] min-w-0 h-auto">

                <div className="flex justify-between items-center mb-6">

                  <h3 className="font-bold text-lg text-[var(--color-app-text-main)] flex items-center gap-2">
                    <span className="text-[var(--color-app-accent)]">
                      ⚡
                    </span>

                    Circuit Builder
                  </h3>


                  <button
                    onClick={() => {
                      setWires(
                        Array.from(
                          {
                            length:
                              challenge.numQubits,
                          },
                          () => []
                        )
                      );

                      /*
                       * There is no timeline corresponding
                       * to an empty circuit anymore.
                       */
                      setTimeline(null);
                      setCurrentStepIndex(
                        0
                      );
                      setTimelineStale(
                        false
                      );
                      setIsPlaying(
                        false
                      );

                      setRunStatus(
                        "idle"
                      );
                      setFeedback(
                        null
                      );
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-[var(--color-app-border-light)] hover:bg-[var(--color-app-surface)] transition-colors"
                  >
                    Clear All
                  </button>

                </div>


                {/* Circuit wires */}

                <div className="flex flex-col gap-2 relative">

                  {wires.map(
                    (
                      wireGates,
                      wIdx
                    ) => (
                      <WireDroppable
                        key={wIdx}
                        wireIndex={wIdx}
                        gates={
                          wireGates
                        }
                        onRemove={
                          handleRemoveGate
                        }
                        onUpdate={
                          handleUpdateGate
                        }
                        numQubits={
                          challenge.numQubits
                        }
                      />
                    )
                  )}

                </div>


                {/* =================================================
                    ACTION BAR
                    ================================================= */}

                <div className="mt-8 flex items-center justify-between border-t border-[var(--color-app-border-light)] pt-6">

                  {/* Feedback */}

                  <div className="flex-1 min-w-0">

                    <AnimatePresence
                      mode="wait"
                    >

                      {feedback && (
                        <motion.div
                          key={
                            feedback.msg
                          }
                          initial={{
                            opacity: 0,
                            x: -20,
                          }}
                          animate={{
                            opacity: 1,
                            x: 0,
                          }}
                          exit={{
                            opacity: 0,
                            x: 20,
                          }}
                          className={`font-bold text-sm px-4 py-2 rounded-lg inline-block ${
                            feedback.type ===
                            "success"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {
                            feedback.msg
                          }
                        </motion.div>
                      )}

                    </AnimatePresence>

                  </div>


                  {/* Action buttons */}

                  <div className="ml-4 flex items-center gap-2 shrink-0">


                    {/* =================================================
                        PLAY CIRCUIT
                        ================================================= */}

                    <button
                      onClick={
                        handlePlayCircuit
                      }
                      disabled={
                        isPlayingCircuit
                      }
                      className="px-5 py-3 rounded-xl border border-[var(--color-app-primary)]/50 bg-[var(--color-app-primary)]/10 text-[var(--color-app-primary)] font-bold tracking-wider hover:bg-[var(--color-app-primary)]/20 transition-all disabled:opacity-50 flex items-center gap-2"
                    >

                      {isPlayingCircuit ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />

                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>

                          PLAYING...
                        </>
                      ) : (
                        <>
                          ▶
                          PLAY CIRCUIT
                        </>
                      )}

                    </button>


                    {/* =================================================
                        SUBMIT SOLUTION
                        ================================================= */}

                    <button
                      onClick={
                        handleRunChallenge
                      }
                      disabled={
                        runStatus ===
                        "running"
                      }
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-[var(--color-app-primary)] to-[var(--color-app-primary-hover)] text-white font-bold tracking-wider hover:scale-105 transition-all shadow-[0_0_20px_rgba(var(--color-app-primary-rgb),0.4)] disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                    >

                      {runStatus ===
                      "running" ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />

                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>

                          EVALUATING...
                        </>
                      ) : (
                        <>
                          ✓
                          SUBMIT SOLUTION
                        </>
                      )}

                    </button>


                    {/* =================================================
                        ASK TUTOR
                        ================================================= */}

                    <button
                      onClick={
                        handleAskTutor
                      }
                      className="px-5 py-3 rounded-xl border border-[var(--color-app-border-light)] bg-[var(--color-app-surface)] text-[var(--color-app-text-light)] font-bold tracking-wider hover:bg-[var(--color-app-surface-hover)] hover:text-[var(--color-app-text-main)] transition-all flex items-center gap-2"
                    >
                      💡
                      ASK TUTOR
                    </button>

                  </div>

                </div>

              </div>


              {/* =================================================
                  QUANTUM TIME MACHINE
                  ================================================= */}

              {timeline && (
                <QuantumTimeMachinePanel
                  timeline={
                    timeline
                  }

                  currentStepIndex={
                    currentStepIndex
                  }

                  onStepChange={
                    handleTimelineStepChange
                  }

                  isPlaying={
                    isPlaying
                  }

                  onPlayPause={
                    handleTimelinePlayPause
                  }

                  playbackSpeed={
                    playbackSpeed
                  }

                  onSpeedChange={
                    setPlaybackSpeed
                  }

                  onReset={
                    handleTimelineReset
                  }

                  onClose={() => {
                    setTimeline(
                      null
                    );

                    setIsPlaying(
                      false
                    );

                    setCurrentStepIndex(
                      0
                    );

                    setTimelineStale(
                      false
                    );
                  }}

                  isStale={
                    timelineStale
                  }

                  onRefresh={
                    handleTimelineRefresh
                  }

                  numQubits={
                    challenge.numQubits
                  }

                  /*
                   * Critical:
                   *
                   * Challenges use the Time Machine only
                   * for ideal circuit exploration.
                   *
                   * Noise Lab is hidden by the panel when
                   * challengeMode=true.
                   */
                  challengeMode={
                    true
                  }
                />
              )}

            </div>


            {/* ==================================================
                DRAG OVERLAY
                ================================================== */}

            <DragOverlay
              dropAnimation={{
                duration: 250,
                easing:
                  "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
              }}
            >

              {activeDragItem ? (
                <div
                  className={`h-14 w-14 flex items-center justify-center rounded-xl border-2 font-bold shadow-2xl scale-110 rotate-3 ${activeDragItem.color} bg-black/80 backdrop-blur-md`}
                >
                  {
                    activeDragItem.label
                  }
                </div>
              ) : null}

            </DragOverlay>

          </DndContext>

        </div>

      </div>

    </div>
  );
}