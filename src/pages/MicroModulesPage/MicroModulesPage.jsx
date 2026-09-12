import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getMicroModules, getMyProgress } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import VisualJourneyView from "./VisualJourneyView";
import ModuleListView from "./ModuleListView";

export default function MicroModulesPage() {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progressSummary, setProgressSummary] = useState(null);
  const [progressMap, setProgressMap] = useState({});
  const [viewMode, setViewMode] = useState("journey"); // "journey" | "list"
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [mods, progData] = await Promise.all([
          getMicroModules("foundations"),
          isLoggedIn ? getMyProgress().catch(() => null) : Promise.resolve(null),
        ]);

        setModules(Array.isArray(mods) ? mods : []);

        if (progData && progData.progress) {
          setProgressSummary(progData.summary);
          const map = {};
          (progData.progress.microModuleProgress || []).forEach((entry) => {
            map[entry.moduleId] = entry;
          });
          setProgressMap(map);
        }
      } catch (err) {
        console.error("Failed to load micro-modules:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isLoggedIn]);

  // Compute 7A deterministic "Continue Learning" target
  const continueModule = useMemo(() => {
    if (!modules.length) return null;

    // 1. Existing in_progress module
    const inProg = modules.find((m) => progressMap[m.moduleId]?.status === "in_progress");
    if (inProg) return inProg;

    // 2. First not_started module (ignoring completed and skipped)
    const notStarted = modules.find((m) => {
      const st = progressMap[m.moduleId]?.status;
      return !st || st === "not_started";
    });
    return notStarted || null;
  }, [modules, progressMap]);

  // Check if all 12 modules are completed or skipped
  const isFoundationsComplete = useMemo(() => {
    if (!modules.length) return false;
    return modules.every((m) => {
      const st = progressMap[m.moduleId]?.status;
      return st === "completed" || st === "skipped";
    });
  }, [modules, progressMap]);

  // Lightweight 7A search filter
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return modules;
    const q = searchQuery.toLowerCase();
    return modules.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        m.moduleId.toLowerCase().includes(q)
    );
  }, [modules, searchQuery]);

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Back to Dashboard Navigation */}
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--color-app-text-muted)] hover:text-[var(--color-app-primary)] transition-colors"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      {/* Header & Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-[var(--color-app-border-light)] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3 text-xs font-bold uppercase tracking-wider"
               style={{ background: "rgba(99,102,241,0.12)", color: "var(--color-app-accent)" }}>
            <span>⚛️</span> Micro Modules Library
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-app-text-main)]">
            Micro Modules
          </h1>
          <p className="text-sm sm:text-base mt-1 text-[var(--color-app-text-muted)] max-w-2xl">
            Atomic, non-gated quantum learning milestones. Explore freely in any order, mark completion when ready, or skip concepts you already master.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-2 p-1 rounded-xl app-glass border border-[var(--color-app-border)] self-start md:self-auto">
          <button
            onClick={() => setViewMode("journey")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === "journey"
                ? "bg-[var(--color-app-primary)] text-white shadow-md"
                : "text-[var(--color-app-text-muted)] hover:text-white"
            }`}
            title="Explore the sequential beginner Foundations journey"
          >
            <span>🗺️</span> {user?.learningProfile?.startingLevel !== "completely_new" ? "Explore Foundations Journey" : "Visual Journey"}
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === "list"
                ? "bg-[var(--color-app-primary)] text-white shadow-md"
                : "text-[var(--color-app-text-muted)] hover:text-white"
            }`}
          >
            <span>📋</span> Module List
          </button>
        </div>
      </div>

      {/* ─── Continue Learning / Foundations Summary Banner ─── */}
      {isLoggedIn && (
        <div className="mb-8 rounded-2xl p-5 border app-glass flex flex-col sm:flex-row sm:items-center justify-between gap-4"
             style={{
               borderColor: "rgba(59,130,246,0.3)",
               background: "linear-gradient(135deg, rgba(59,130,246,0.06), rgba(99,102,241,0.02))",
             }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl shrink-0">
              {isFoundationsComplete ? "🎓" : "▶"}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-app-primary)]">
                {isFoundationsComplete ? "Foundations Completed" : "Continue Learning"}
              </div>
              <div className="text-sm font-bold text-[var(--color-app-text-main)]">
                {isFoundationsComplete
                  ? "You have completed or reviewed all 12 Foundations micro-modules!"
                  : continueModule
                  ? `Next: Module ${continueModule.sequenceOrder} — ${continueModule.title}`
                  : "All current modules reviewed"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {progressSummary && (
              <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg bg-black/30 border border-white/10 text-[var(--color-app-text-muted)]">
                {progressSummary.microModulesCompleted || 0} / 12 Completed
              </span>
            )}
            {!isFoundationsComplete && continueModule && (
              <button
                onClick={() => navigate(`/micro-modules/${continueModule.moduleId}`)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, var(--color-app-primary), var(--color-app-primary-hover))" }}
              >
                Resume →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="mb-8 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--color-app-text-muted)]">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter modules (e.g. superposition, bloch, gates)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm outline-none transition-all app-glass"
            style={{
              border: "1px solid var(--color-app-border)",
              background: "var(--color-app-surface)",
              color: "var(--color-app-text-main)",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-app-text-muted)] hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
        <span className="text-xs font-semibold text-[var(--color-app-text-muted)] hidden sm:inline">
          Showing {filteredModules.length} of {modules.length} modules
        </span>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <div className="py-24 text-center text-sm font-semibold text-[var(--color-app-text-muted)] animate-pulse">
          Loading Foundations curriculum...
        </div>
      ) : filteredModules.length === 0 ? (
        <div className="py-20 text-center app-glass rounded-2xl border border-[var(--color-app-border)] p-8">
          <p className="text-base font-bold text-[var(--color-app-text-main)] mb-1">
            No matching micro-modules found
          </p>
          <p className="text-xs text-[var(--color-app-text-muted)] mb-4">
            Try a different search keyword or clear the filter.
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="px-4 py-1.5 rounded-lg text-xs font-bold border border-[var(--color-app-border)] hover:bg-[var(--color-app-surface-hover)]"
          >
            Clear Filter
          </button>
        </div>
      ) : viewMode === "journey" ? (
        <VisualJourneyView
          modules={filteredModules}
          progressMap={progressMap}
          onSelectModule={(mod) => navigate(`/micro-modules/${mod.moduleId}`)}
          onSwitchToList={() => setViewMode("list")}
        />
      ) : (
        <ModuleListView
          modules={filteredModules}
          progressMap={progressMap}
        />
      )}
    </div>
  );
}
