import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function QKDDemo() {
  const [isHacked, setIsHacked] = useState(false);

  const simulateHack = () => {
    setIsHacked(true);
    // Play a dramatic alert using Sonner
    toast.error("CONNECTION COMPROMISED - QUANTUM STATE COLLAPSED", {
      style: {
        background: "rgba(239, 68, 68, 0.95)",
        color: "#fff",
        border: "1px solid #b91c1c",
        fontWeight: "bold",
        fontSize: "1rem",
        boxShadow: "0 0 40px rgba(239, 68, 68, 0.6)",
      },
      duration: 5000,
      icon: "🚨",
    });
  };

  const resetConnection = () => {
    setIsHacked(false);
    toast.success("Quantum Key Distribution channel restored.", {
      style: {
        background: "rgba(16, 185, 129, 0.95)",
        color: "#fff",
        border: "1px solid #059669",
        fontWeight: "bold",
      },
      icon: "🔐",
    });
  };

  return (
    <div className={cn(
      "border p-6 rounded-2xl flex flex-col shadow-lg relative overflow-hidden transition-colors duration-500",
      isHacked ? "bg-red-900/10 border-red-500/50" : "app-glass border-[var(--color-app-border)]"
    )}>
      
      {/* Background Pulse for Alert */}
      {isHacked && (
        <motion.div 
          className="absolute inset-0 bg-red-500/10 z-0 pointer-events-none"
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        />
      )}

      <div className="flex justify-between items-center w-full border-b border-[var(--color-app-border-light)] pb-2 mb-8 z-10 relative">
        <h3 className={cn(
          "text-sm font-bold uppercase tracking-[0.15em]",
          isHacked ? "text-red-400" : "text-[var(--color-app-primary)]"
        )}>
          Secure Quantum Communication (QKD) Demo
        </h3>
        
        {isHacked ? (
          <button onClick={resetConnection} className="text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/50 px-3 py-1 rounded-md hover:bg-green-500/30 transition-colors">
            Reset Channel
          </button>
        ) : (
          <button onClick={simulateHack} className="text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/50 px-3 py-1 rounded-md hover:bg-red-500/30 hover:scale-105 active:scale-95 transition-all">
            Simulate Hack / Intercept
          </button>
        )}
      </div>

      <div className="text-xs text-[var(--color-app-text-muted)] mb-10 z-10 relative max-w-2xl">
        In QKD (Quantum Key Distribution), information is encoded in entangled qubits. If an eavesdropper attempts to intercept the key, the laws of quantum mechanics dictate that the entanglement collapses, instantly alerting Alice and Bob to the intrusion.
      </div>

      <div className="flex items-center justify-between w-full max-w-2xl mx-auto px-2 relative h-32 z-10">
        
        {/* Alice */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-[var(--color-app-surface)] border border-[var(--color-app-border)] flex items-center justify-center shadow-lg relative z-10">
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke={isHacked ? "#ef4444" : "var(--color-app-primary)"} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
          </div>
          <span className="font-bold text-xs sm:text-sm text-[var(--color-app-text-main)]">Alice</span>
        </div>

        {/* Connection Line */}
        <div className="flex-1 h-[2px] bg-[var(--color-app-border)] overflow-hidden relative mx-2 sm:mx-4 mt-[-2rem] sm:mt-[-1.5rem]">
          {!isHacked ? (
            <motion.div
              className="w-full h-full bg-gradient-to-r from-transparent via-[var(--color-app-primary)] to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
          ) : (
            <div className="w-full h-full bg-red-500 shadow-[0_0_10px_red]"></div>
          )}
          
          {/* Packets */}
          {!isHacked && (
            <motion.div
              className="absolute w-2 h-2 rounded-full bg-[var(--color-app-accent)] shadow-[0_0_8px_var(--color-app-accent)] top-1/2 -translate-y-1/2"
              animate={{ left: ["0%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear", delay: 0.5 }}
            />
          )}
          {!isHacked && (
            <motion.div
              className="absolute w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_8px_pink] top-1/2 -translate-y-1/2"
              animate={{ left: ["0%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear", delay: 0 }}
            />
          )}
          
          {/* Hack Interceptor */}
          <AnimatePresence>
            {isHacked && (
              <motion.div
                initial={{ opacity: 0, scale: 0, top: "-20px" }}
                animate={{ opacity: 1, scale: 1, top: "50%" }}
                className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-red-900 border-2 border-red-500 flex items-center justify-center shadow-[0_0_20px_red] z-20"
              >
                <svg width="14" height="14" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bob */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-[var(--color-app-surface)] border border-[var(--color-app-border)] flex items-center justify-center shadow-lg relative z-10">
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke={isHacked ? "#ef4444" : "var(--color-app-primary)"} viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
          </div>
          <span className="font-bold text-xs sm:text-sm text-[var(--color-app-text-main)]">Bob</span>
        </div>
      </div>
      
    </div>
  );
}
