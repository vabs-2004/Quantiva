import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function VisualJourneyView({ modules, progressMap, onSelectModule, onSwitchToList }) {
  return (
    <div className="relative py-4 px-2 max-w-4xl mx-auto">
      {/* Informative route banner */}
      <div className="mb-6 p-4 rounded-xl app-glass border border-[var(--color-app-border)] text-xs text-[var(--color-app-text-muted)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base shrink-0">🗺️</span>
          <span>
            This visual journey represents our beginner <strong className="text-[var(--color-app-text-main)]">Quantum Foundations</strong> route. You're free to explore any module directly without prerequisite locks or return to the full library.
          </span>
        </div>
        {onSwitchToList && (
          <button
            onClick={onSwitchToList}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--color-app-border)] hover:bg-[var(--color-app-surface-hover)] text-[var(--color-app-primary)] shrink-0 self-start sm:self-center transition-colors"
          >
            Return to Module List 📋
          </button>
        )}
      </div>

      {/* Central progression timeline line */}
      <div
        className="absolute left-6 md:left-1/2 top-20 bottom-10 w-0.5 -translate-x-1/2 hidden sm:block"
        style={{
          background: "linear-gradient(180deg, var(--color-app-primary), var(--color-app-accent), rgba(255,255,255,0.1))",
        }}
      />

      <div className="space-y-8 relative">
        {modules.map((m, idx) => {
          const userStatus = progressMap[m.moduleId]?.status || "not_started";
          const isEven = idx % 2 === 0;

          // Status-specific badges & styling
          let statusBadge = {
            label: "Not Started",
            badgeClass: "bg-zinc-800/60 text-zinc-400 border-zinc-700/50",
            borderClass: "border-[var(--color-app-border)]",
            nodeClass: "bg-[var(--color-app-surface)] text-zinc-400 border-[var(--color-app-border)]",
            glow: "",
          };

          if (userStatus === "in_progress") {
            statusBadge = {
              label: "In Progress",
              badgeClass: "bg-blue-500/20 text-blue-400 border-blue-500/30",
              borderClass: "border-[var(--color-app-primary)] ring-1 ring-[var(--color-app-primary)]/40",
              nodeClass: "bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/30",
              glow: "shadow-[0_0_25px_rgba(59,130,246,0.15)]",
            };
          } else if (userStatus === "completed") {
            statusBadge = {
              label: "Completed ✓",
              badgeClass: "bg-green-500/20 text-green-400 border-green-500/30",
              borderClass: "border-green-500/40",
              nodeClass: "bg-emerald-600 text-white border-green-400",
              glow: "",
            };
          } else if (userStatus === "skipped") {
            statusBadge = {
              label: "Skipped ⏭",
              badgeClass: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
              borderClass: "border-indigo-500/30",
              nodeClass: "bg-indigo-900/60 text-indigo-300 border-indigo-500/40",
              glow: "",
            };
          }

          return (
            <motion.div
              key={m.moduleId}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-8 ${
                isEven ? "sm:flex-row-reverse" : ""
              }`}
            >
              {/* Card */}
              <div className="w-full sm:w-[calc(50%-2.5rem)]">
                <Link
                  to={`/micro-modules/${m.moduleId}`}
                  className={`block p-5 rounded-2xl app-glass transition-all hover:border-[var(--color-app-primary)] hover:scale-[1.01] ${statusBadge.borderClass} ${statusBadge.glow}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-white/10 text-[var(--color-app-text-muted)] bg-black/20">
                      Module {String(m.sequenceOrder).padStart(2, "0")}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.badgeClass}`}>
                      {statusBadge.label}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[var(--color-app-text-main)] mb-1.5 group-hover:text-[var(--color-app-primary)]">
                    {m.title}
                  </h3>

                  <p className="text-xs text-[var(--color-app-text-muted)] line-clamp-2 leading-relaxed mb-4">
                    {m.description}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--color-app-border-light)] text-xs font-semibold">
                    <span className="text-[var(--color-app-primary)] hover:underline flex items-center gap-1">
                      Explore Module →
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--color-app-text-light)]">
                      {m.track}
                    </span>
                  </div>
                </Link>
              </div>

              {/* Center Node Indicator */}
              <div className="hidden sm:flex items-center justify-center shrink-0 z-10">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-transform hover:scale-110 ${statusBadge.nodeClass}`}
                >
                  {userStatus === "completed" ? "✓" : userStatus === "skipped" ? "⏭" : m.sequenceOrder}
                </div>
              </div>

              {/* Spacer on the opposite side to balance 50/50 flex */}
              <div className="hidden sm:block w-[calc(50%-2.5rem)]" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
