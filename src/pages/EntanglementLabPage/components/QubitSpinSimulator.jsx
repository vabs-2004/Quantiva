import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function QubitSpinSimulator() {
  // state: "up" (blue) or "down" (red)
  const [spinA, setSpinA] = useState("up");
  const [isAnimating, setIsAnimating] = useState(false);

  // In entanglement, if they are |Phi+> state, they have same spin.
  // If we simulate an entangled pair where A is forced, B collapses to the same instantly.
  const spinB = spinA;

  const toggleSpin = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSpinA((prev) => (prev === "up" ? "down" : "up"));
    setTimeout(() => setIsAnimating(false), 500); // cooldown
  };

  return (
    <div className="app-glass border border-[var(--color-app-border)] p-6 rounded-2xl flex flex-col items-center shadow-lg relative overflow-hidden">
      <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-[var(--color-app-primary)] mb-8 self-start w-full border-b border-[var(--color-app-border-light)] pb-2">
        Interactive Qubit Spin Simulator
      </h3>

      <div className="text-xs text-[var(--color-app-text-muted)] mb-8 text-center max-w-lg">
        Click on Qubit A to forcefully flip its spin. Because they are entangled, Qubit B reacts instantaneously across the distance.
      </div>

      <div className="flex items-center justify-between w-full max-w-2xl mx-auto px-2 sm:px-8 relative">
        
        {/* Qubit A */}
        <div className="flex flex-col items-center gap-2 sm:gap-4 z-10 shrink-0">
          <motion.button
            onClick={toggleSpin}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "w-16 h-16 sm:w-24 sm:h-24 rounded-full relative flex items-center justify-center cursor-pointer border-2 transition-colors duration-300",
              spinA === "up" ? "border-blue-500 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.4)]" : "border-red-500 bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
            )}
          >
            <div className={cn(
              "w-10 h-10 sm:w-16 sm:h-16 rounded-full blur-md transition-colors duration-300",
              spinA === "up" ? "bg-blue-500/60" : "bg-red-500/60"
            )} />
            
            <motion.svg
              width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="absolute z-10 drop-shadow-md sm:w-[32px] sm:h-[32px]"
              animate={{ rotate: spinA === "up" ? 0 : 180 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </motion.svg>
          </motion.button>
          
          <div className="text-center">
            <div className="font-bold text-xs sm:text-sm text-[var(--color-app-text-main)]">Qubit A (Alice)</div>
            <div className="text-[10px] sm:text-xs font-mono mt-1 text-[var(--color-app-text-muted)]">Spin {spinA === "up" ? "Up |0⟩" : "Down |1⟩"}</div>
          </div>
        </div>

        {/* Connection Line */}
        <div className="flex-1 h-1 overflow-hidden z-0 relative mx-2 sm:mx-4 mt-[-2rem] sm:mt-[-3rem]">
          <div className="w-full h-full bg-gradient-to-r from-transparent via-[var(--color-app-primary)]/50 to-transparent"></div>
          <motion.div
            className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-[var(--color-app-primary)] to-transparent opacity-80"
            animate={{ left: ["-50%", "150%", "-50%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Qubit B */}
        <div className="flex flex-col items-center gap-2 sm:gap-4 z-10 shrink-0">
          <motion.div
            animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={cn(
              "w-16 h-16 sm:w-24 sm:h-24 rounded-full relative flex items-center justify-center border-2 transition-colors duration-300",
              spinB === "up" ? "border-blue-500 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.4)]" : "border-red-500 bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
            )}
          >
            <div className={cn(
              "w-10 h-10 sm:w-16 sm:h-16 rounded-full blur-md transition-colors duration-300",
              spinB === "up" ? "bg-blue-500/60" : "bg-red-500/60"
            )} />
            
            <motion.svg
              width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="absolute z-10 drop-shadow-md sm:w-[32px] sm:h-[32px]"
              animate={{ rotate: spinB === "up" ? 0 : 180 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </motion.svg>
          </motion.div>
          
          <div className="text-center">
            <div className="font-bold text-xs sm:text-sm text-[var(--color-app-text-main)]">Qubit B (Bob)</div>
            <div className="text-[10px] sm:text-xs font-mono mt-1 text-[var(--color-app-text-muted)]">Spin {spinB === "up" ? "Up |0⟩" : "Down |1⟩"}</div>
          </div>
        </div>

      </div>
    </div>
  );
}
