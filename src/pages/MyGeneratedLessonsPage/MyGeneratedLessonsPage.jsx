import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getMyGeneratedLessons,
  bookmarkGeneratedLesson,
  unbookmarkGeneratedLesson,
  deleteGeneratedLesson,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useAITutor } from "../../context/AITutorContext";

export default function MyGeneratedLessonsPage() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { openTutor } = useAITutor();

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "bookmarked"
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadLessons = async () => {
    try {
      setLoading(true);
      const data = await getMyGeneratedLessons();
      setLessons(Array.isArray(data.lessons) ? data.lessons : []);
    } catch (err) {
      console.error("Failed to load personal lessons:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadLessons();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const handleToggleBookmark = async (lessonId, currentStatus) => {
    const nextState = !currentStatus;

    // Optimistic update
    setLessons((prev) =>
      prev.map((l) => (l.lessonId === lessonId ? { ...l, isBookmarked: nextState } : l))
    );

    try {
      if (nextState) {
        await bookmarkGeneratedLesson(lessonId);
        showToast("🔖 Added to personal bookmarks");
      } else {
        await unbookmarkGeneratedLesson(lessonId);
        showToast("Removed from bookmarks");
      }
    } catch (err) {
      console.error("Bookmark error:", err);
      // Rollback
      setLessons((prev) =>
        prev.map((l) => (l.lessonId === lessonId ? { ...l, isBookmarked: currentStatus } : l))
      );
      showToast("⚠️ Failed to update bookmark");
    }
  };

  const handleDelete = async (lessonId, title) => {
    if (!window.confirm(`Delete your personal lesson "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteGeneratedLesson(lessonId);
      setLessons((prev) => prev.filter((l) => l.lessonId !== lessonId));
      showToast("Personal lesson deleted.");
    } catch (err) {
      alert("Failed to delete lesson: " + (err.response?.data?.error || err.message));
    }
  };

  // Filter & Search
  const filteredLessons = useMemo(() => {
    return lessons.filter((l) => {
      if (activeFilter === "bookmarked" && !l.isBookmarked) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        l.title.toLowerCase().includes(q) ||
        (l.summary && l.summary.toLowerCase().includes(q)) ||
        l.topicId.toLowerCase().includes(q)
      );
    });
  }, [lessons, activeFilter, searchQuery]);

  const bookmarkedCount = useMemo(() => {
    return lessons.filter((l) => l.isBookmarked).length;
  }, [lessons]);

  return (
    <div className="min-h-screen pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl border border-white/20 bg-black/90 text-xs font-bold text-white shadow-2xl backdrop-blur-md"
        >
          {toastMessage}
        </motion.div>
      )}

      {/* Navigation Breadcrumb */}
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-[var(--color-app-border-light)] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3 text-xs font-bold uppercase tracking-wider bg-purple-500/15 border border-purple-500/30 text-purple-300">
            <span>✨</span> Personal Learning
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--color-app-text-main)]">
            My Generated Lessons
          </h1>
          <p className="text-sm sm:text-base mt-1 text-[var(--color-app-text-muted)] max-w-2xl">
            Interactive quantum modules created specifically for your sessions. Private, persistent, bookmarkable, and completely separate from official Quantiva curriculum.
          </p>
        </div>

        {/* Filter Switcher */}
        <div className="flex items-center gap-2 p-1 rounded-xl app-glass border border-[var(--color-app-border)] self-start md:self-auto">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === "all"
                ? "bg-[var(--color-app-primary)] text-white shadow-md"
                : "text-[var(--color-app-text-muted)] hover:text-white"
            }`}
          >
            All Lessons ({lessons.length})
          </button>
          <button
            onClick={() => setActiveFilter("bookmarked")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeFilter === "bookmarked"
                ? "bg-amber-600 text-white shadow-md"
                : "text-[var(--color-app-text-muted)] hover:text-white"
            }`}
          >
            <span>🔖</span> Bookmarked ({bookmarkedCount})
          </button>
        </div>
      </div>

      {/* Search Input */}
      {lessons.length > 0 && (
        <div className="mb-8 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your generated lessons..."
            className="w-full px-4 py-2.5 rounded-xl text-xs bg-white/5 border border-[var(--color-app-border)] text-white placeholder:text-[var(--color-app-text-light)] focus:outline-none focus:border-[var(--color-app-primary)] transition-colors"
          />
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center">
          <div className="w-10 h-10 rounded-xl border-3 border-[var(--color-app-primary)] border-t-transparent animate-spin mb-3" />
          <p className="text-xs font-semibold text-[var(--color-app-text-muted)]">
            Loading your personal library...
          </p>
        </div>
      ) : lessons.length === 0 ? (
        /* Empty State */
        <div className="py-20 px-6 text-center app-glass rounded-3xl border border-[var(--color-app-border)] max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center justify-center text-3xl mx-auto">
            ✨
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-app-text-main)]">
            What would you like to learn?
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] leading-relaxed max-w-md mx-auto">
            Start a conversation with Quantiva Tutor, then turn the topic into your own interactive Micro-Module when you're ready.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              to="/explore"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--color-app-primary)] text-white hover:opacity-95 shadow-md"
            >
              Explore Knowledge Map →
            </Link>
            <button
              onClick={() =>
                openTutor(null, {
                  source: "my-learning",
                  topic: null,
                  resource: null,
                  query: null,
                })
              }
              className="px-5 py-2.5 rounded-xl text-xs font-bold border border-[var(--color-app-border)] text-[var(--color-app-text-main)] hover:bg-white/5 cursor-pointer"
            >
              Ask Tutor 💬
            </button>
          </div>
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="py-16 text-center app-glass rounded-2xl border border-[var(--color-app-border)]">
          <p className="text-sm font-semibold text-[var(--color-app-text-main)] mb-2">
            No lessons match your current search/filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setActiveFilter("all");
            }}
            className="px-4 py-1.5 rounded-lg text-xs font-bold border border-white/20 hover:bg-white/5 text-white"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        /* Lessons Grid */
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLessons.map((l, idx) => (
            <motion.div
              key={l.lessonId}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.04 }}
              className="p-5 rounded-3xl app-glass border border-[var(--color-app-border)] flex flex-col justify-between hover:border-purple-500/40 hover:scale-[1.01] transition-all group"
            >
              <div>
                {/* Badge Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                    <span>✨</span> AI-generated
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleBookmark(l.lessonId, l.isBookmarked)}
                      className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        l.isBookmarked
                          ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                          : "text-[var(--color-app-text-muted)] hover:text-white hover:bg-white/10"
                      }`}
                      title={l.isBookmarked ? "Remove bookmark" : "Bookmark lesson"}
                    >
                      {l.isBookmarked ? "🔖" : "☆"}
                    </button>

                    <button
                      onClick={() => handleDelete(l.lessonId, l.title)}
                      className="p-1.5 rounded-lg text-xs text-[var(--color-app-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Delete lesson"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-[var(--color-app-text-main)] group-hover:text-purple-300 transition-colors line-clamp-1">
                  {l.title}
                </h3>

                {/* Summary */}
                <p className="text-xs text-[var(--color-app-text-muted)] mt-1.5 line-clamp-2 leading-relaxed">
                  {l.summary || "Interactive exploration of this quantum concept."}
                </p>
              </div>

              {/* Meta & Open Footer */}
              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--color-app-text-light)]">
                  <span className="capitalize">{l.difficulty || "intermediate"}</span>
                  <span>·</span>
                  <span>~{l.estimatedMinutes || 7} min</span>
                </div>

                <Link
                  to={`/generated-lessons/${l.lessonId}`}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 text-white hover:bg-[var(--color-app-primary)] transition-all flex items-center gap-1 cursor-pointer"
                >
                  Open Lesson →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
