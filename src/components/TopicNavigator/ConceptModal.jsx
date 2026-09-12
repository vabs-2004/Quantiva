import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAITutor } from "../../context/AITutorContext";
import { generatePersonalLesson } from "../../services/api";

/**
 * ConceptModal: lightweight contextual modal for concept-only topics.
 * Does NOT generate fake lesson routes.
 * Offers a clean handoff point to the existing AITutorContext and
 * allows instant generation of personalized interactive lessons (Phase 7H).
 */
export default function ConceptModal({ topic, isOpen, onClose }) {
  const { openTutor } = useAITutor();
  const navigate = useNavigate();

  const [generating, setGenerating] = useState(false);
  const [curatedSuggestion, setCuratedSuggestion] = useState(null);
  const [genError, setGenError] = useState(null);

  if (!isOpen || !topic) return null;

  const handleTeachInteractively = async (forceAlternative = false) => {
    setGenerating(true);
    setGenError(null);
    setCuratedSuggestion(null);

    try {
      const res = await generatePersonalLesson({
        topic: topic.title,
        topicDescription: topic.description || "",
        forceAlternative,
      });

      if (res.hasCurated && res.curatedResource) {
        setCuratedSuggestion(res.curatedResource);
        setGenerating(false);
        return;
      }

      if (res.lesson && res.lesson.lessonId) {
        onClose();
        navigate(`/generated-lessons/${res.lesson.lessonId}`);
      }
    } catch (err) {
      console.error("Failed to generate personal lesson:", err);
      setGenError(err.response?.data?.error || "Failed to generate interactive lesson.");
      setGenerating(false);
    }
  };

  const handleAskQuantiva = () => {
    onClose();
    if (openTutor) {
      openTutor(null, {
        source: "topic-navigator",
        topic: {
          topicId: topic.topicId,
          title: topic.title,
          category: topic.category,
          description: topic.description || null,
        },
        resource: null,
        knowledgeMap: topic.connections || null,
      });
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        {/* Backdrop click */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md p-6 rounded-2xl app-glass border border-[var(--color-app-border)] shadow-2xl z-10 space-y-4"
          style={{ background: "var(--color-app-surface)" }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/15 text-purple-300">
                  Concept Topic
                </span>
                <span className="text-[11px] font-semibold text-[var(--color-app-text-muted)]">
                  {topic.category}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-[var(--color-app-text-main)]">
                {topic.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[var(--color-app-text-muted)] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* Description */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/5">
            <p className="text-sm leading-relaxed text-[var(--color-app-text-muted)]">
              {topic.description || "This fundamental quantum concept is part of Quantiva's curated Knowledge Map."}
            </p>
          </div>

          {/* Curated Resource Notification (if topic has official resource) */}
          {curatedSuggestion && (
            <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/30 space-y-2">
              <div className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                <span>🎓</span> Authoritative Resource Available
              </div>
              <p className="text-xs text-[var(--color-app-text-muted)]">
                Quantiva already has an official curated lesson for <b>{curatedSuggestion.title}</b>.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(curatedSuggestion.route);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 cursor-pointer"
                >
                  Open Official Module →
                </button>
                <button
                  type="button"
                  onClick={() => handleTeachInteractively(true)}
                  className="px-3 py-1.5 rounded-lg text-xs text-purple-300 hover:text-white border border-purple-500/30 hover:bg-purple-500/10 cursor-pointer"
                >
                  Generate Personal Lesson Instead ⚡
                </button>
              </div>
            </div>
          )}

          {/* Generation Error */}
          {genError && (
            <div className="p-3 rounded-xl border border-red-500/30 bg-red-950/20 text-xs text-red-300">
              ⚠️ {genError}
            </div>
          )}

          {/* Educational Note */}
          <p className="text-xs text-[var(--color-app-text-light)] italic">
            This concept connects to other quantum operations in the Knowledge Map. You can explore it interactively right now with an AI-generated personal lesson.
          </p>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-between gap-2 border-t border-[var(--color-app-border-light)] flex-wrap">
            <button
              type="button"
              onClick={onClose}
              disabled={generating}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--color-app-border)] text-[var(--color-app-text-muted)] hover:text-white transition-colors cursor-pointer"
            >
              Close
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAskQuantiva}
                disabled={generating}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--color-app-border)] text-[var(--color-app-text-main)] hover:bg-white/5 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>💬</span> Ask Tutor
              </button>

              <button
                type="button"
                onClick={() => handleTeachInteractively(false)}
                disabled={generating}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:brightness-110 disabled:opacity-60 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {generating ? (
                  <>
                    <span className="animate-spin text-xs">🌀</span> Generating Lesson...
                  </>
                ) : (
                  <>
                    <span>⚡</span> Teach Me Interactively
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
