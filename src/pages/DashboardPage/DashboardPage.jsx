import { useNavigate } from "react-router-dom";
import { useAlgorithmContext } from "../../context/AlgorithmContext";
import { useAuth } from "../../context/AuthContext";
import { useAITutor } from "../../context/AITutorContext";
import { deleteAlgorithm as deleteAlgoAPI, getMyProgress, getMyCertificates, downloadCertificate } from "../../services/api";
import { ALGORITHM_SERIES_ORDER } from "../../utils/constants";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

function ProgressStat({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-semibold" style={{ color: "var(--color-app-text-muted)" }}>{label}</span>
        <span className="text-xs font-mono font-bold" style={{ color: "var(--color-app-text-main)" }}>{value}/{total}</span>
      </div>
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-app-surface-hover)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { algorithmList, refreshAlgorithms } = useAlgorithmContext();
  const { isAdmin, user } = useAuth();
  const { openTutor } = useAITutor();
  const navigate = useNavigate();
  const [selectedAlgo, setSelectedAlgo] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [progressSummary, setProgressSummary] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    getMyProgress()
      .then((data) => setProgressSummary(data.summary))
      .catch(() => {});
    getMyCertificates()
      .then(setCertificates)
      .catch(() => {});
  }, []);

  const handleDownload = async (cert) => {
    setDownloadingId(cert.certificateId);
    try {
      await downloadCertificate(cert.certificateId, `QSL-Certificate-${cert.courseTitle}.pdf`);
    } catch (err) {
      console.error("Failed to download certificate:", err);
    }
    setDownloadingId(null);
  };

  // Sort algorithms by series order
  const sortedAlgorithms = [...algorithmList].sort((a, b) => {
    const idxA = ALGORITHM_SERIES_ORDER.indexOf(a.id);
    const idxB = ALGORITHM_SERIES_ORDER.indexOf(b.id);
    const posA = idxA === -1 ? 999 : idxA;
    const posB = idxB === -1 ? 999 : idxB;
    return posA - posB;
  });

  const handleGoToAlgorithm = () => {
    if (selectedAlgo) navigate(`/algorithm/${selectedAlgo}`);
  };

  const handleDelete = async (algoId, algoName) => {
    if (!window.confirm(`Are you sure you want to delete "${algoName}"?`)) return;
    setDeletingId(algoId);
    try {
      await deleteAlgoAPI(algoId);
      await refreshAlgorithms();
    } catch (err) {
      alert("Failed to delete: " + (err.response?.data?.error || err.message));
    }
    setDeletingId(null);
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-10" style={{ background: "var(--color-app-base)" }} data-lenis-prevent="true">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 mb-3" style={{ borderColor: "var(--color-app-accent)", background: "rgba(139,92,246,0.1)" }}>
                <span className="app-pulse-dot" />
                <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: "var(--color-app-accent)" }}>
                  Welcome, {user?.name || user?.username || "User"}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--color-app-text-main)" }}>
                Dashboard
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--color-app-text-light)" }}>
                Explore, simulate, and analyze quantum algorithms
              </p>
            </div>
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/admin/add-algorithm")}
                className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-green-500/20 transition-all hover:shadow-green-500/30"
              >
                ➕ Add Algorithm
              </motion.button>
            )}
          </div>
        </motion.header>

        {/* ─── Beginner Quantum Foundations Progress Card (Shown ONLY for completely_new) ─── */}
        {user?.learningProfile?.startingLevel === "completely_new" && progressSummary && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03, duration: 0.5 }}
            className="mb-8 rounded-2xl app-glass p-6 border"
            style={{
              borderColor: "rgba(59,130,246,0.3)",
              background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(99,102,241,0.03))",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl shrink-0">
                  ⚛️
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[var(--color-app-text-main)]">
                    Quantum Foundations
                  </h2>
                  <p className="text-xs text-[var(--color-app-text-muted)]">
                    Foundational micro-modules designed to introduce quantum principles step by step.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/micro-modules")}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white transition-all hover:scale-105 shrink-0 self-start sm:self-center"
                style={{ background: "linear-gradient(135deg, var(--color-app-primary), var(--color-app-primary-hover))" }}
              >
                Open Foundations →
              </button>
            </div>

            <div className="pt-2">
              <ProgressStat
                label="Micro-modules Completed"
                value={progressSummary.microModulesCompleted || 0}
                total={progressSummary.totalMicroModules || 12}
                color="linear-gradient(90deg, #3b82f6, #6366f1)"
              />
              {progressSummary.microModulesSkipped > 0 && (
                <div className="mt-2 text-[11px] text-[var(--color-app-text-light)]">
                  {progressSummary.microModulesSkipped} module(s) marked as skipped (already known)
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* ─── My Progress ─────────────────────── */}
        {progressSummary && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.5 }}
            className="mb-10 rounded-xl app-glass p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold" style={{ color: "var(--color-app-text-main)" }}>My Progress</h2>
              <button
                onClick={() => openTutor("__RECOMMEND__")}
                className="text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
                style={{ border: "1px solid var(--color-app-primary)", color: "var(--color-app-primary)" }}
              >
                ✨ What should I learn next?
              </button>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              <ProgressStat label="Courses Completed" value={progressSummary.coursesCompleted} total={progressSummary.totalCourses} color="linear-gradient(90deg, var(--color-app-primary), var(--color-app-accent))" />
              <ProgressStat label="Challenges Solved" value={progressSummary.challengesCompleted} total={progressSummary.totalChallenges} color="linear-gradient(90deg, #22c55e, #16a34a)" />
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-xs font-semibold" style={{ color: "var(--color-app-text-muted)" }}>Algorithms Explored</span>
                  <span className="text-xs font-mono font-bold" style={{ color: "var(--color-app-text-main)" }}>{progressSummary.algorithmsRun}</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-app-surface-hover)" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, progressSummary.algorithmsRun * 10)}%`, background: "linear-gradient(90deg, #f59e0b, #d97706)" }} />
                </div>
              </div>
            </div>

            {certificates.length > 0 && (
              <div className="mt-6 pt-5" style={{ borderTop: "1px solid var(--color-app-border)" }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--color-app-text-muted)" }}>
                  My Certificates
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {certificates.map((cert) => (
                    <div
                      key={cert.certificateId}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg"
                      style={{ background: "var(--color-app-surface-hover)", border: "1px solid var(--color-app-border)" }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg shrink-0">🎓</span>
                        <span className="text-xs font-semibold truncate" style={{ color: "var(--color-app-text-main)" }}>
                          {cert.courseTitle}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDownload(cert)}
                        disabled={downloadingId === cert.certificateId}
                        className="text-xs font-bold px-2.5 py-1 rounded-md shrink-0 disabled:opacity-50"
                        style={{ background: "#c9a44c", color: "#0f172a" }}
                      >
                        {downloadingId === cert.certificateId ? "..." : "⬇"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* ─── Demonstrate Section ─────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-10 rounded-xl app-glass p-6"
        >
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: "var(--color-app-text-main)" }}>
            <svg className="h-5 w-5" style={{ color: "var(--color-app-primary)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Demonstrate Algorithm
          </h2>
          <p className="text-xs mb-4" style={{ color: "var(--color-app-text-muted)" }}>
            Select a quantum algorithm from the dropdown to view its theory, set parameters, and run the simulation.
          </p>

          <div className="flex gap-3 items-center">
            <select
              value={selectedAlgo}
              onChange={(e) => setSelectedAlgo(e.target.value)}
              className="flex-1 rounded-lg px-4 py-3 text-sm outline-none transition-colors"
              style={{
                border: "1px solid var(--color-app-border)",
                background: "var(--color-app-surface)",
                color: "var(--color-app-text-main)",
              }}
            >
              <option value="">— Select an Algorithm —</option>
              {sortedAlgorithms.map((algo, idx) => (
                <option key={algo.id} value={algo.id}>
                  {idx + 1}. {algo.name}
                </option>
              ))}
            </select>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGoToAlgorithm}
              disabled={!selectedAlgo}
              className="rounded-lg px-6 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{ background: "linear-gradient(135deg, var(--color-app-primary), var(--color-app-primary-hover))" }}
            >
              Go →
            </motion.button>
          </div>
        </motion.section>

        {/* ─── Quick Access ──────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-10"
        >
          <h2 className="text-sm font-bold mb-4" style={{ color: "var(--color-app-text-main)" }}>Quick Access</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Quantum Sandbox", desc: "Write & run custom Qiskit code", path: "/sandbox", icon: "💻", color: "from-purple-500 to-indigo-600" },
              { label: "Circuit Simulator", desc: "Drag & drop quantum gates", path: "/circuit-simulator", icon: "🔧", color: "from-cyan-500 to-blue-600" },
              { label: "Bloch Sphere", desc: "3D interactive visualization", path: "/blochsphere", icon: "🌐", color: "from-emerald-500 to-teal-600" },
            ].map((item, i) => (
              <motion.button
                key={item.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                whileHover={{ y: -4, boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(item.path)}
                className="text-left p-5 rounded-xl app-glass app-card-hover cursor-pointer"
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="text-sm font-bold" style={{ color: "var(--color-app-text-main)" }}>{item.label}</h3>
                <p className="mt-1 text-xs" style={{ color: "var(--color-app-text-muted)" }}>{item.desc}</p>
              </motion.button>
            ))}
          </div>
        </motion.section>

        <div className="app-gradient-line my-8" />

        {/* ─── Algorithm Series ────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="space-y-4 pb-10"
        >
          <h2 className="text-sm font-bold" style={{ color: "var(--color-app-text-main)" }}>
            Algorithm Series ({sortedAlgorithms.length})
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {sortedAlgorithms.map((algo, i) => (
                <motion.div
                  key={algo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.03 }}
                  className="relative group"
                >
                  <motion.button
                    whileHover={{ y: -3 }}
                    onClick={() => navigate(`/algorithm/${algo.id}`)}
                    className="text-left p-4 rounded-lg app-glass app-card-hover block w-full cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className="flex items-center justify-center w-7 h-7 rounded-lg text-xs font-extrabold"
                        style={{ background: "var(--color-app-primary-glow)", color: "var(--color-app-primary)" }}
                      >
                        {i + 1}
                      </span>
                      <h4 className="text-xs font-bold" style={{ color: "var(--color-app-text-main)" }}>
                        {algo.name}
                      </h4>
                    </div>
                    <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: "var(--color-app-text-muted)" }}>
                      {algo.shortDescription}
                    </p>
                    <div className="mt-3 flex gap-2 font-mono text-xs">
                      <span
                        className="px-2 py-0.5 rounded"
                        style={{ background: "var(--color-app-surface-hover)", color: "var(--color-app-primary)", border: "1px solid var(--color-app-border)" }}
                      >
                        {algo.timeComplexity}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded"
                        style={{ background: "var(--color-app-surface-hover)", color: "var(--color-app-accent)", border: "1px solid var(--color-app-border)" }}
                      >
                        {algo.spaceComplexity}
                      </span>
                    </div>
                  </motion.button>

                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(algo.id, algo.name);
                      }}
                      disabled={deletingId === algo.id}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs"
                      title="Delete Algorithm"
                    >
                      {deletingId === algo.id ? "..." : "🗑️"}
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
