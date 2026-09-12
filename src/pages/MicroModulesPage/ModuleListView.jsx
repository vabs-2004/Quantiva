import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function ModuleListView({ modules, progressMap, bookmarkMap = {}, onToggleBookmark }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 py-6 max-w-6xl mx-auto">
      {modules.map((m, idx) => {
        const userStatus = progressMap[m.moduleId]?.status || "not_started";
        const isBookmarked = !!bookmarkMap[m.moduleId];

        let statusBadge = {
          label: "Not Started",
          badgeClass: "bg-zinc-800/60 text-zinc-400 border-zinc-700/50",
          borderClass: "border-[var(--color-app-border)]",
        };

        if (userStatus === "in_progress") {
          statusBadge = {
            label: "In Progress",
            badgeClass: "bg-blue-500/20 text-blue-400 border-blue-500/30",
            borderClass: "border-[var(--color-app-primary)] ring-1 ring-[var(--color-app-primary)]/40",
          };
        } else if (userStatus === "completed") {
          statusBadge = {
            label: "Completed ✓",
            badgeClass: "bg-green-500/20 text-green-400 border-green-500/30",
            borderClass: "border-green-500/40",
          };
        } else if (userStatus === "skipped") {
          statusBadge = {
            label: "Skipped ⏭",
            badgeClass: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
            borderClass: "border-indigo-500/30",
          };
        }

        return (
          <motion.div
            key={m.moduleId}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.04 }}
            className="flex flex-col"
          >
            <Link
              to={`/micro-modules/${m.moduleId}`}
              className={`flex-1 p-5 rounded-2xl app-glass flex flex-col justify-between transition-all hover:border-[var(--color-app-primary)] hover:scale-[1.01] ${statusBadge.borderClass}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-white/10 text-[var(--color-app-text-muted)] bg-black/20">
                    #{String(m.sequenceOrder).padStart(2, "0")}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {onToggleBookmark && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onToggleBookmark(m.moduleId);
                        }}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          isBookmarked
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-white/5 text-zinc-500 border-white/10 hover:text-zinc-300 hover:border-white/20"
                        }`}
                        title={isBookmarked ? "Remove Bookmark" : "Bookmark module"}
                      >
                        <span className="text-xs">{isBookmarked ? "🔖" : "🏷️"}</span>
                      </button>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.badgeClass}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-[var(--color-app-text-main)] mb-2">
                  {m.title}
                </h3>

                <p className="text-xs text-[var(--color-app-text-muted)] line-clamp-3 leading-relaxed mb-4">
                  {m.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--color-app-border-light)] flex items-center justify-between text-xs font-semibold">
                <span className="text-[var(--color-app-primary)]">Open Module →</span>
                <span className="text-[10px] uppercase text-[var(--color-app-text-light)]">
                  {m.track}
                </span>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
