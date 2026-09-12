import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getGeneratedLessonById,
  bookmarkGeneratedLesson,
  unbookmarkGeneratedLesson,
  deleteGeneratedLesson,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useAITutor } from "../../context/AITutorContext";
import MathHTMLContainer from "../MathHTMLContainer/MathHTMLContainer";
import GeneratedInteractiveDispatcher from "./GeneratedInteractiveDispatcher";
import { parseMathMarkdown } from "../../utils/mathMarkdownParser";

export default function GeneratedLessonViewer() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const { openTutor } = useAITutor();

  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bmLoading, setBmLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function loadLesson() {
      if (!isLoggedIn) {
        setError("You must be logged in to view your personal generated lessons.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await getGeneratedLessonById(lessonId);
        if (data && data.lesson) {
          setLesson(data.lesson);
          setIsBookmarked(Boolean(data.lesson.isBookmarked));
        } else {
          setError("Lesson not found or inaccessible.");
        }
      } catch (err) {
        console.error("Error loading generated lesson:", err);
        setError(err.response?.data?.error || "Lesson not found or unauthorized.");
      } finally {
        setLoading(false);
      }
    }
    loadLesson();
  }, [lessonId, isLoggedIn]);

  const handleToggleBookmark = async () => {
    if (!lesson || bmLoading) return;
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    setBmLoading(true);

    try {
      if (nextState) {
        await bookmarkGeneratedLesson(lesson.lessonId);
        showToast("🔖 Lesson added to personal bookmarks");
      } else {
        await unbookmarkGeneratedLesson(lesson.lessonId);
        showToast("Lesson removed from bookmarks");
      }
    } catch (err) {
      console.error("Failed to update bookmark:", err);
      setIsBookmarked(!nextState); // Rollback
      showToast("⚠️ Failed to update bookmark.");
    } finally {
      setBmLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!lesson) return;
    if (!window.confirm(`Are you sure you want to delete your generated lesson "${lesson.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteGeneratedLesson(lesson.lessonId);
      navigate("/my-learning/generated-lessons");
    } catch (err) {
      alert("Failed to delete lesson: " + (err.response?.data?.error || err.message));
    }
  };

  const handleAskTutorAboutLesson = () => {
    if (!lesson) return;
    const activeSec = (lesson.sections || [])[activeSectionIndex];
    openTutor(
      `Can you explain section "${activeSec?.title || lesson.title}" from my generated lesson in more detail?`,
      {
        source: "generated-lesson",
        topic: {
          topicId: lesson.topicId,
          title: lesson.title,
          category: "Personal AI Lesson",
          description: lesson.summary,
        },
        resource: null,
      }
    );
  };

  const sections = lesson?.sections || [];
  const currentSection = sections[activeSectionIndex] || sections[0] || null;

  const parsedSectionContent = useMemo(() => {
    return parseMathMarkdown(currentSection?.content || "");
  }, [currentSection?.content]);

  const codeSnippet = useMemo(() => {
    if (!currentSection) return null;
    if (currentSection.codeSnippet && currentSection.codeSnippet.code) {
      return currentSection.codeSnippet;
    }
    if (currentSection.interactiveComponent && currentSection.interactiveComponent.type === "sandbox") {
      const cfg = currentSection.interactiveComponent.config || {};
      return {
        code: cfg.code || "",
        language: cfg.language || "python",
        title: cfg.title || "Python / Qiskit Implementation",
        instructions: cfg.instructions || "",
      };
    }
    return null;
  }, [currentSection]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 max-w-4xl mx-auto flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl border-4 border-[var(--color-app-primary)] border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold text-[var(--color-app-text-muted)]">
          Loading your personal interactive lesson...
        </p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 max-w-2xl mx-auto text-center space-y-4">
        <div className="p-8 rounded-3xl app-glass border border-red-500/30 bg-red-950/20">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-xl font-bold text-white mt-3 mb-2">Lesson Unavailable</h2>
          <p className="text-sm text-[var(--color-app-text-muted)] mb-6">
            {error || "We couldn't locate this personalized lesson."}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              to="/my-learning/generated-lessons"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--color-app-primary)] text-white hover:opacity-95"
            >
              My Generated Lessons
            </Link>
            <Link
              to="/explore"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold border border-[var(--color-app-border)] text-white hover:bg-white/5"
            >
              Explore Knowledge Map
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
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
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          to="/my-learning/generated-lessons"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-app-text-muted)] hover:text-white transition-colors"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to My Generated Lessons
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleBookmark}
            disabled={bmLoading}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              isBookmarked
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                : "bg-white/5 text-[var(--color-app-text-muted)] border-[var(--color-app-border)] hover:text-white"
            }`}
            title={isBookmarked ? "Remove from bookmarks" : "Save to bookmarks"}
          >
            <span>{isBookmarked ? "🔖" : "☆"}</span>
            {isBookmarked ? "Bookmarked" : "Bookmark"}
          </button>

          <button
            onClick={handleDelete}
            className="p-1.5 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all cursor-pointer"
            title="Delete this personal lesson"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Distinction Banner */}
      <div className="mb-6 p-4 rounded-2xl app-glass border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✨</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                AI-Generated Interactive Lesson
              </span>
              <span className="text-[11px] text-[var(--color-app-text-muted)]">
                Personal Learning Experience
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--color-app-text-main)] mt-1">
              {lesson.title}
            </h1>
          </div>
        </div>

        <button
          onClick={handleAskTutorAboutLesson}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[var(--color-app-primary)] to-[var(--color-app-accent)] text-white shadow-md hover:brightness-110 shrink-0 flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
        >
          <span>💬</span> Ask Tutor About This
        </button>
      </div>

      {/* Summary card & difficulty meta */}
      <div className="mb-8 p-4 rounded-xl app-glass border border-[var(--color-app-border)] flex items-center justify-between flex-wrap gap-3 text-xs text-[var(--color-app-text-muted)]">
        <p className="flex-1 min-w-[240px]">
          {lesson.summary || "Interactive exploration generated specifically for your learning session."}
        </p>
        <div className="flex items-center gap-3 shrink-0 font-mono">
          <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 uppercase text-[10px]">
            Level: {lesson.difficulty || "intermediate"}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px]">
            ⏱ ~{lesson.estimatedMinutes || 7} min
          </span>
        </div>
      </div>

      {/* Section Progress Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin">
        {sections.map((sec, idx) => (
          <button
            key={sec.id || idx}
            onClick={() => setActiveSectionIndex(idx)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer border ${
              activeSectionIndex === idx
                ? "bg-[var(--color-app-primary)] text-white border-[var(--color-app-primary)] shadow-md"
                : "app-glass border-[var(--color-app-border)] text-[var(--color-app-text-muted)] hover:text-white hover:border-white/20"
            }`}
          >
            <span className="opacity-75 font-mono">#{idx + 1}</span>
            <span>{sec.title}</span>
            {sec.interactiveComponent && <span title="Contains Interactive Component">⚡</span>}
          </button>
        ))}
      </div>

      {/* Active Section Card */}
      {currentSection && (
        <motion.div
          key={currentSection.id || activeSectionIndex}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="p-6 sm:p-8 rounded-3xl app-glass border border-[var(--color-app-border)] space-y-6"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-app-primary)]">
                Section {activeSectionIndex + 1} of {sections.length} · {currentSection.type}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-app-text-main)] mt-0.5">
                {currentSection.title}
              </h2>
            </div>
          </div>

          {/* Section Text & Markdown (with KaTeX) */}
          <div className="prose prose-invert max-w-none text-sm leading-relaxed text-[var(--color-app-text-muted)]">
            <MathHTMLContainer html={parsedSectionContent} />
          </div>

          {/* Optional Formula Card */}
          {currentSection.formula && currentSection.formula.latex && (
            <div className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-app-accent)]">
                Mathematical Principle
              </div>
              <div className="overflow-x-auto py-2 flex justify-center">
                <MathHTMLContainer html={`$$${currentSection.formula.latex}$$ `} />
              </div>
              {currentSection.formula.explanation && (
                <p className="text-xs text-[var(--color-app-text-light)] italic border-t border-white/5 pt-2">
                  {currentSection.formula.explanation}
                </p>
              )}
            </div>
          )}

          {/* Code Implementation Section (Copyable Code + Open in Sandbox) */}
          {codeSnippet && codeSnippet.code && (
            <div className="rounded-2xl border border-[var(--color-app-border)] bg-black/60 overflow-hidden shadow-2xl">
              <div className="px-4 py-3 bg-white/[0.04] border-b border-white/10 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 inline-block animate-pulse" />
                  <span className="text-xs font-mono font-bold text-[var(--color-app-primary)]">
                    🐍 {codeSnippet.title || "Python / Qiskit Implementation"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyCode(codeSnippet.code)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-1.5 border border-white/10 cursor-pointer"
                    title="Copy Python Code"
                  >
                    <span>{copiedCode ? "✓" : "📋"}</span>
                    <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/sandbox", { state: { code: codeSnippet.code } })}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--color-app-primary)] text-black hover:opacity-90 transition-all flex items-center gap-1.5 shadow-md shadow-[var(--color-app-primary)]/20 cursor-pointer"
                    title="Open in Quantiva Sandbox"
                  >
                    <span>🚀</span> Open in Sandbox
                  </button>
                </div>
              </div>
              {codeSnippet.instructions && (
                <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-xs text-emerald-300">
                  💡 {codeSnippet.instructions}
                </div>
              )}
              <pre className="p-5 text-xs font-mono text-emerald-300 bg-black/50 overflow-x-auto max-h-96 leading-relaxed">
                <code>{codeSnippet.code}</code>
              </pre>
            </div>
          )}

          {/* Curated YouTube Video Section — Strictly restricted to Section 4 / video type */}
          {(currentSection.type === "video" || activeSectionIndex === 3) &&
            currentSection.video &&
            (currentSection.video.embedUrl || currentSection.video.videoId || currentSection.video.url) && (
            <div className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden space-y-4 p-5 shadow-2xl">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1">
                    <span>▶</span> Curated Video Lecture
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">
                    {currentSection.video.title}
                  </h3>
                  <p className="text-xs text-[var(--color-app-text-muted)] mt-0.5">
                    Channel: <span className="text-white font-medium">{currentSection.video.channelTitle || "Quantum Computing"}</span>
                    {currentSection.video.viewCount > 0 && (
                      <span className="ml-3 font-mono opacity-80">
                        👁 {currentSection.video.viewCount.toLocaleString()} views
                      </span>
                    )}
                  </p>
                </div>
                {currentSection.video.url && (
                  <a
                    href={currentSection.video.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-600/90 text-white hover:bg-red-500 transition-all flex items-center gap-1.5 shadow-md shrink-0"
                  >
                    <span>📺</span> Watch on YouTube
                  </a>
                )}
              </div>

              {currentSection.video.embedUrl ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black">
                  <iframe
                    src={currentSection.video.embedUrl}
                    title={currentSection.video.title || "Quantum Video Guide"}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-white/5 text-xs text-[var(--color-app-text-muted)] italic">
                  Video embed not available. Use the button above to view on YouTube.
                </div>
              )}

              {currentSection.video.description && (
                <p className="text-xs text-[var(--color-app-text-muted)] leading-relaxed italic border-t border-white/5 pt-3">
                  {currentSection.video.description}
                </p>
              )}
            </div>
          )}

          {/* Interactive Visualizers (e.g. Bloch Sphere, Complex Plane, Measurement) */}
          {currentSection.interactiveComponent &&
            currentSection.interactiveComponent.type !== "sandbox" &&
            currentSection.interactiveComponent.type !== "circuit" && (
              <div className="pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-3 flex items-center gap-1.5">
                  <span>⚡</span> Interactive Quantum Workspace
                </div>
                <GeneratedInteractiveDispatcher component={currentSection.interactiveComponent} />
              </div>
            )}

          {/* Dedicated Check Your Understanding Quiz — ONLY on Section 5 (final section) */}
          {(activeSectionIndex === sections.length - 1 || currentSection.type === "quiz" || currentSection.type === "reflection") && currentSection.checkQuestion && (
            <div className="mt-8 p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4 shadow-xl">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span>💡</span> Check Your Understanding
              </div>
              <div className="text-sm font-semibold text-[var(--color-app-text-main)]">
                <MathHTMLContainer html={parseMathMarkdown(currentSection.checkQuestion.question || "")} />
              </div>

              <div className="space-y-2.5 pt-1">
                {(currentSection.checkQuestion.options || []).map((opt, oIdx) => {
                  const isSelected = selectedAnswers[currentSection.id] === oIdx;
                  const isSubmitted = selectedAnswers[currentSection.id] !== undefined;
                  const isCorrect = currentSection.checkQuestion.correctIndex === oIdx;

                  let optClass = "border-white/10 bg-black/30 hover:border-white/30 text-[var(--color-app-text-muted)]";
                  if (isSubmitted) {
                    if (isCorrect) {
                      optClass = "border-green-500/50 bg-green-500/20 text-green-200 font-semibold";
                    } else if (isSelected && !isCorrect) {
                      optClass = "border-red-500/50 bg-red-500/20 text-red-200";
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      onClick={() => {
                        setSelectedAnswers((prev) => ({
                          ...prev,
                          [currentSection.id]: oIdx,
                        }));
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${optClass}`}
                    >
                      <div className="flex-1 pr-3">
                        <MathHTMLContainer html={parseMathMarkdown(opt)} />
                      </div>
                      {isSubmitted && isCorrect && <span className="text-green-400 font-bold text-sm">✓</span>}
                      {isSubmitted && isSelected && !isCorrect && <span className="text-red-400 font-bold text-sm">✕</span>}
                    </button>
                  );
                })}
              </div>

              {selectedAnswers[currentSection.id] !== undefined && currentSection.checkQuestion.explanation && (
                <div className="text-xs text-[var(--color-app-text-muted)] italic pt-3 border-t border-white/5">
                  <MathHTMLContainer html={parseMathMarkdown(currentSection.checkQuestion.explanation)} />
                </div>
              )}
            </div>
          )}

          {/* Section Navigation Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <button
              onClick={() => setActiveSectionIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeSectionIndex === 0}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--color-app-border)] disabled:opacity-40 hover:bg-white/5 transition-colors cursor-pointer"
            >
              ← Previous Section
            </button>

            <span className="text-xs font-mono text-[var(--color-app-text-muted)]">
              {activeSectionIndex + 1} / {sections.length}
            </span>

            {activeSectionIndex < sections.length - 1 ? (
              <button
                onClick={() => setActiveSectionIndex((prev) => Math.min(sections.length - 1, prev + 1))}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--color-app-primary)] text-white hover:opacity-95 transition-opacity cursor-pointer"
              >
                Next Section →
              </button>
            ) : (
              <button
                onClick={() => navigate("/my-learning/generated-lessons")}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-green-600 text-white hover:bg-green-500 transition-colors cursor-pointer"
              >
                Done / Return to Library ✓
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
