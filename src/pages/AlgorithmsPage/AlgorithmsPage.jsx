import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAlgorithmContext } from "../../context/AlgorithmContext";
import { useAuth } from "../../context/AuthContext";
import {
  bookmarkAlgorithm,
  unbookmarkAlgorithm,
  getBookmarkedAlgorithms,
} from "../../services/api";
import { APP_NAME, APP_ORG, ALGORITHM_SERIES_ORDER } from "../../utils/constants";

export default function AlgorithmsPage() {
  const { algorithmList } = useAlgorithmContext();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("all"); // "all" | "bookmarks"
  const [bookmarkMap, setBookmarkMap] = useState({});
  const [bookmarkedAlgorithms, setBookmarkedAlgorithms] = useState([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [toastInfo, setToastInfo] = useState(null);

  const showToast = (msg, isError = false) => {
    setToastInfo({ message: msg, isError });
    setTimeout(() => setToastInfo(null), 3000);
  };

  // Load user bookmarks
  useEffect(() => {
    if (isLoggedIn) {
      setLoadingBookmarks(true);
      getBookmarkedAlgorithms()
        .then((res) => {
          if (res && res.success && Array.isArray(res.bookmarks)) {
            setBookmarkedAlgorithms(res.bookmarks);
            const map = {};
            res.bookmarks.forEach((b) => {
              map[b.id] = true;
            });
            setBookmarkMap(map);
          }
        })
        .catch((err) => console.error("Failed to load algorithm bookmarks:", err))
        .finally(() => setLoadingBookmarks(false));
    }
  }, [isLoggedIn]);

  // Handle bookmark toggle with optimistic rollback
  const handleToggleBookmark = async (e, algoId) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      showToast("Please log in to bookmark algorithms", true);
      return;
    }

    const wasBookmarked = !!bookmarkMap[algoId];
    const nextBookmarked = !wasBookmarked;

    const prevMap = { ...bookmarkMap };
    const prevList = [...bookmarkedAlgorithms];

    const newMap = { ...bookmarkMap };
    let newList;

    if (nextBookmarked) {
      newMap[algoId] = true;
      const targetAlgo = algorithmList.find((a) => a.id === algoId);
      const newBmItem = targetAlgo
        ? { ...targetAlgo, bookmarkedAt: new Date().toISOString() }
        : { id: algoId, bookmarkedAt: new Date().toISOString() };
      newList = [newBmItem, ...prevList];
      showToast("🔖 Algorithm bookmarked");
    } else {
      delete newMap[algoId];
      newList = prevList.filter((a) => a.id !== algoId);
      showToast("Removed from bookmarks");
    }

    setBookmarkMap(newMap);
    setBookmarkedAlgorithms(newList);

    try {
      if (nextBookmarked) {
        await bookmarkAlgorithm(algoId);
      } else {
        await unbookmarkAlgorithm(algoId);
      }
    } catch (err) {
      console.error("Failed to update algorithm bookmark:", err);
      setBookmarkMap(prevMap);
      setBookmarkedAlgorithms(prevList);
      showToast("⚠️ Failed to update bookmark. Changes rolled back.", true);
    }
  };

  // Sorted algorithms according to series order
  const sortedAlgorithms = useMemo(() => {
    return [...algorithmList].sort((a, b) => {
      const idxA = ALGORITHM_SERIES_ORDER.indexOf(a.id);
      const idxB = ALGORITHM_SERIES_ORDER.indexOf(b.id);
      const posA = idxA === -1 ? 999 : idxA;
      const posB = idxB === -1 ? 999 : idxB;
      return posA - posB;
    });
  }, [algorithmList]);

  // Filtered algorithms
  const displayedAlgorithms = useMemo(() => {
    const listToFilter = viewMode === "bookmarks" ? bookmarkedAlgorithms : sortedAlgorithms;

    return listToFilter.filter((algo) => {
      // Category filter
      if (selectedCategory !== "all" && algo.category !== selectedCategory) {
        return false;
      }
      // Text query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = algo.name?.toLowerCase().includes(q);
        const descMatch = (algo.shortDescription || algo.description || "").toLowerCase().includes(q);
        const catMatch = algo.category?.toLowerCase().includes(q);
        return nameMatch || descMatch || catMatch;
      }
      return true;
    });
  }, [viewMode, bookmarkedAlgorithms, sortedAlgorithms, selectedCategory, searchQuery]);

  const categoryList = useMemo(() => {
    return Array.from(new Set(algorithmList.map((a) => a.category).filter(Boolean)));
  }, [algorithmList]);

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastInfo && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl border text-xs font-bold text-white shadow-2xl backdrop-blur-md ${
            toastInfo.isError
              ? "bg-red-950/90 border-red-500/40 text-red-200"
              : "bg-black/90 border-white/20"
          }`}
        >
          {toastInfo.message}
        </motion.div>
      )}

      {/* Navigation Breadcrumbs */}
      <div className="mb-6 flex items-center justify-between">
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
          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3 text-xs font-bold uppercase tracking-wider"
            style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa" }}
          >
            <span>⚛️</span> Quantum Algorithm Library
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-app-text-main)]">
            Quantum Algorithms
          </h1>
          <p className="text-sm sm:text-base mt-1 text-[var(--color-app-text-muted)] max-w-2xl">
            Explore 12 interactive quantum algorithms with live circuit execution, state vector mathematics, and Qiskit simulator runs.
          </p>
        </div>

        {/* View Mode Switcher: All Algorithms | My Bookmarks */}
        <div className="flex items-center gap-2 p-1 rounded-xl app-glass border border-[var(--color-app-border)] self-start md:self-auto">
          <button
            onClick={() => setViewMode("all")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "all"
                ? "bg-[var(--color-app-primary)] text-white shadow-md"
                : "text-[var(--color-app-text-muted)] hover:text-white"
            }`}
          >
            <span>⚛️</span> All Algorithms ({algorithmList.length})
          </button>
          <button
            onClick={() => setViewMode("bookmarks")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "bookmarks"
                ? "bg-amber-600 text-white shadow-md"
                : "text-[var(--color-app-text-muted)] hover:text-white"
            }`}
          >
            <span>🔖</span> Bookmarks
            {bookmarkedAlgorithms.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-black/40 text-amber-200">
                {bookmarkedAlgorithms.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--color-app-text-muted)]">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search algorithms by name, complexity, or theory..."
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

          {/* Category Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-white/20 text-white border border-white/30"
                  : "app-glass text-[var(--color-app-text-muted)] border border-transparent hover:text-white"
              }`}
            >
              All Categories
            </button>
            {categoryList.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-blue-500/25 text-blue-300 border border-blue-500/40"
                    : "app-glass text-[var(--color-app-text-muted)] border border-transparent hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Algorithms Grid */}
      {displayedAlgorithms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedAlgorithms.map((algo) => {
            const isBm = !!bookmarkMap[algo.id];

            return (
              <motion.div
                key={algo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/algorithm/${algo.id}`)}
                className="rounded-2xl p-5 border app-glass flex flex-col justify-between hover:border-blue-500/50 transition-all duration-200 group shadow-md cursor-pointer relative"
                style={{ background: "var(--color-app-surface)" }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border bg-blue-500/15 text-blue-300 border-blue-500/30">
                      {algo.category || "ALGORITHM"}
                    </span>
                    <button
                      onClick={(e) => handleToggleBookmark(e, algo.id)}
                      className={`p-1.5 rounded-lg text-sm transition-all border ${
                        isBm
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-white/5 text-[var(--color-app-text-muted)] border-white/10 hover:text-white"
                      }`}
                      title={isBm ? "Remove bookmark" : "Bookmark algorithm"}
                    >
                      {isBm ? "🔖" : "🏷️"}
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-[var(--color-app-text-main)] group-hover:text-blue-400 transition-colors mb-2">
                    {algo.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] line-clamp-3 mb-4 leading-relaxed">
                    {algo.shortDescription || algo.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px] font-mono text-[var(--color-app-text-muted)]">
                    {algo.timeComplexity && (
                      <span className="px-2 py-0.5 rounded bg-black/30 border border-white/5 text-blue-300">
                        ⏱ {algo.timeComplexity}
                      </span>
                    )}
                    {algo.spaceComplexity && (
                      <span className="px-2 py-0.5 rounded bg-black/30 border border-white/5 text-purple-300">
                        💾 {algo.spaceComplexity}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--color-app-border-light)] flex items-center justify-between text-xs font-bold text-blue-400 group-hover:translate-x-1 transition-transform">
                  <span>Open Simulation</span>
                  <span>→</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center max-w-md mx-auto rounded-3xl border border-[var(--color-app-border)] app-glass p-8">
          <div className="text-4xl mb-3">{viewMode === "bookmarks" ? "🔖" : "🔍"}</div>
          <h3 className="text-lg font-bold text-[var(--color-app-text-main)] mb-2">
            {viewMode === "bookmarks" ? "No bookmarked algorithms yet" : "No algorithms found"}
          </h3>
          <p className="text-xs text-[var(--color-app-text-muted)] mb-4">
            {viewMode === "bookmarks"
              ? "Click the bookmark icon on any algorithm card to save it for quick reference."
              : "Try adjusting your search query or selected category."}
          </p>
          {viewMode === "bookmarks" && (
            <button
              onClick={() => setViewMode("all")}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--color-app-primary)]"
            >
              Browse All Algorithms
            </button>
          )}
        </div>
      )}
    </div>
  );
}
