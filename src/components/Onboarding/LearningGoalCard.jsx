import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

/**
 * OnboardingModal (LearningGoalCard)
 * First-time onboarding modal for genuinely new users.
 * Never locks the user out, allows dismissal, and routes user based on chosen level:
 * - "completely_new" -> sets level and navigates to Foundations Journey (/micro-modules)
 * - "knows_basics" | "well_aware" -> sets level and directs user to /dashboard
 * Once onboardingCompleted is true, this modal never appears again.
 */
export default function LearningGoalCard({ onSelect }) {
  const { isLoggedIn, user, setLearningProfile } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // If not logged in, or already completed, or dismissed, do not show
  if (!isLoggedIn || !user || user?.learningProfile?.onboardingCompleted || dismissed) {
    return null;
  }

  const handleSelectLevel = async (level) => {
    setSaving(true);
    try {
      await setLearningProfile({ startingLevel: level, onboardingCompleted: true });
      if (onSelect) onSelect(level);

      if (level === "completely_new") {
        navigate("/micro-modules");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Failed to save learning goal:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDismiss = async () => {
    setDismissed(true);
    try {
      await setLearningProfile({
        startingLevel: user?.learningProfile?.startingLevel || "completely_new",
        onboardingCompleted: true,
      });
    } catch (err) {
      console.error("Failed to dismiss onboarding modal:", err);
    }
  };

  const options = [
    {
      id: "completely_new",
      icon: "🔰",
      title: "I'm completely new",
      desc: "Start with Quantum Foundations: qubits, superposition, gates, and the Bloch sphere.",
      badge: "Guided Foundations",
      actionText: "Start Foundations Journey →",
      highlight: "from-blue-600/20 to-indigo-600/20 border-blue-500/40 hover:border-blue-400",
    },
    {
      id: "knows_basics",
      icon: "⚡",
      title: "I know the basics",
      desc: "Skip basic fundamentals and jump straight into intermediate topics and experiments.",
      badge: "Direct Exploration",
      actionText: "Go to Dashboard →",
      highlight: "from-purple-600/20 to-pink-600/20 border-purple-500/40 hover:border-purple-400",
    },
    {
      id: "well_aware",
      icon: "🚀",
      title: "I'm well aware",
      desc: "Head directly to Algorithms, Circuit Simulator, Noise Lab, and Python Sandbox.",
      badge: "Advanced & Labs",
      actionText: "Go to Dashboard →",
      highlight: "from-emerald-600/20 to-teal-600/20 border-emerald-500/40 hover:border-emerald-400",
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-4xl my-auto rounded-3xl p-6 sm:p-8 app-glass shadow-2xl overflow-hidden"
          style={{
            border: "1px solid var(--color-app-border)",
            background: "linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.98))",
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 mb-2.5 text-xs font-bold uppercase tracking-wider"
                style={{ background: "rgba(37,99,235,0.15)", color: "var(--color-app-primary)" }}
              >
                <span>🎯</span> Welcome to Quantiva
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-app-text-main)] tracking-tight">
                Where would you like to begin your quantum journey?
              </h2>
              <p className="text-sm mt-1.5 text-[var(--color-app-text-muted)] max-w-2xl">
                Choose the starting path that best fits your experience. Every module, algorithm, and simulation lab remains freely accessible at all times without prerequisite locks.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              disabled={saving}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--color-app-border)] hover:bg-[var(--color-app-surface-hover)] text-[var(--color-app-text-muted)] hover:text-white transition-colors shrink-0"
              title="Skip onboarding"
            >
              ✕ Skip
            </button>
          </div>

          {/* 3 Pathway Cards */}
          <div className="grid gap-4 sm:grid-cols-3 mt-4">
            {options.map((opt) => (
              <motion.button
                key={opt.id}
                whileHover={{ y: -4, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectLevel(opt.id)}
                disabled={saving}
                className={`flex flex-col text-left p-5 sm:p-6 rounded-2xl border transition-all relative overflow-hidden bg-gradient-to-br ${opt.highlight} cursor-pointer group`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{opt.icon}</span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md border border-white/15 bg-black/30 text-[var(--color-app-text-main)]">
                    {opt.badge}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--color-app-text-main)] mb-2 group-hover:text-[var(--color-app-primary)] transition-colors">
                  {opt.title}
                </h3>
                <p className="text-xs text-[var(--color-app-text-muted)] leading-relaxed flex-1 mb-4">
                  {opt.desc}
                </p>
                <div className="pt-3 border-t border-white/10 flex items-center justify-between mt-auto">
                  <span className="text-xs font-bold text-[var(--color-app-primary)] group-hover:underline">
                    {opt.actionText}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Subtext info */}
          <div className="mt-6 pt-4 border-t border-[var(--color-app-border-light)] text-center text-xs text-[var(--color-app-text-light)]">
            ℹ️ You can change or explore any section anytime. Quantiva never locks topics behind mandatory gates.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
export { LearningGoalCard as OnboardingModal };
