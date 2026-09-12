import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getTopicById, getTopicByResource } from "../../services/api";
import ConceptModal from "./ConceptModal";

/**
 * TopicNavigator: Contextual Knowledge Map navigation component.
 *
 * Props:
 *  - topicId: string (optional, explicit canonical topic ID)
 *  - resourceType: string (optional, e.g. "micro_module" | "algorithm" | "course")
 *  - resourceId: string (optional, canonical resource ID)
 *  - titleOverride: string (optional, title override)
 */
export default function TopicNavigator({
  topicId,
  resourceType,
  resourceId,
  titleOverride,
}) {
  const navigate = useNavigate();

  const [topicData, setTopicData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeConceptTopic, setActiveConceptTopic] = useState(null);

  const fetchTopicData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let res = null;
      if (topicId) {
        res = await getTopicById(topicId);
      } else if (resourceType && resourceId) {
        res = await getTopicByResource(resourceType, resourceId);
      }

      if (res && res.success && res.topic) {
        setTopicData(res.topic);
      } else {
        setTopicData(null);
      }
    } catch (err) {
      console.warn("TopicNavigator: could not load topic neighborhood:", err);
      setError("Unable to load conceptual neighborhood.");
    } finally {
      setLoading(false);
    }
  }, [topicId, resourceType, resourceId]);

  useEffect(() => {
    fetchTopicData();
  }, [fetchTopicData]);

  // Handle clicking on any topic node (resource-backed vs concept-only)
  const handleNodeClick = (node) => {
    if (node.resource && node.resource.route) {
      navigate(node.resource.route);
    } else {
      // Concept-only: Open lightweight context modal with tutor handoff
      setActiveConceptTopic(node);
    }
  };

  // Helper to render progress indicator (strictly null for concept-only)
  const renderProgressBadge = (node) => {
    if (!node.resource || !node.progress) return null;

    const map = {
      completed: { label: "✓ Completed", cls: "text-green-400 bg-green-500/10 border-green-500/30" },
      in_progress: { label: "◐ In Progress", cls: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
      skipped: { label: "↷ Skipped", cls: "text-indigo-300 bg-indigo-500/10 border-indigo-500/30" },
      not_started: { label: "○ Not Started", cls: "text-zinc-400 bg-zinc-800/40 border-zinc-700/50" },
    };

    const badge = map[node.progress];
    if (!badge) return null;

    return (
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${badge.cls}`}>
        {badge.label}
      </span>
    );
  };

  // Helper to render relationship node card
  const renderTopicCard = (node, relationshipLabel) => {
    const isResource = Boolean(node.resource && node.resource.route);

    return (
      <motion.button
        key={node.topicId}
        type="button"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => handleNodeClick(node)}
        className={`group text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
          isResource
            ? "app-glass border-[var(--color-app-border)] hover:border-[var(--color-app-primary)] hover:shadow-md"
            : "bg-purple-950/20 border-purple-800/30 hover:border-purple-600/60 hover:bg-purple-900/30"
        }`}
      >
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-app-text-light)]">
              {relationshipLabel || node.category}
            </span>
            {renderProgressBadge(node)}
          </div>

          <div className="text-xs sm:text-sm font-bold text-[var(--color-app-text-main)] group-hover:text-[var(--color-app-primary)] transition-colors line-clamp-1">
            {node.title}
          </div>

          {node.description && (
            <p className="text-[11px] text-[var(--color-app-text-muted)] line-clamp-2 leading-relaxed">
              {node.description}
            </p>
          )}
        </div>

        <div className="mt-3 pt-2 border-t border-[var(--color-app-border-light)] flex items-center justify-between text-[10px] font-semibold">
          <span className={isResource ? "text-[var(--color-app-primary)]" : "text-purple-400"}>
            {isResource ? "Explore Resource →" : "Concept Overview ℹ"}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-[var(--color-app-text-light)]">
            {node.resource?.type ? node.resource.type.replace("_", " ") : "Concept"}
          </span>
        </div>
      </motion.button>
    );
  };

  // Non-blocking loading skeleton
  if (loading) {
    return (
      <div className="my-8 p-5 rounded-2xl app-glass border border-[var(--color-app-border)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-36 rounded bg-white/10 animate-pulse" />
          <div className="h-3 w-20 rounded bg-white/10 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-white/5 border border-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Graceful error state (never breaks parent page)
  if (error) {
    return (
      <div className="my-8 p-4 rounded-xl border border-[var(--color-app-border-light)] text-xs text-[var(--color-app-text-muted)] flex items-center justify-between">
        <span>Couldn't load related topics for this concept.</span>
        <button
          onClick={fetchTopicData}
          className="text-[var(--color-app-primary)] hover:underline font-semibold cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  // If no topic mapping exists for this resource, render nothing unobtrusively
  if (!topicData) {
    return null;
  }

  const {
    title,
    category,
    defaultConnections = [],
    relationships = {},
    totalRelationships = 0,
  } = topicData;

  const {
    foundations = [],
    components = [],
    related = [],
    extensions = [],
  } = relationships;

  return (
    <div className="my-10 p-5 sm:p-6 rounded-2xl app-glass border border-[var(--color-app-border)] shadow-lg space-y-6">
      {/* Navigator Header */}
      <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[var(--color-app-primary)]/30 bg-[var(--color-app-primary)]/10 text-[var(--color-app-primary)]">
              Topic Navigator
            </span>
            <span className="text-xs text-[var(--color-app-text-light)]">
              Curated Knowledge Map
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-[var(--color-app-text-main)]">
            Explore concepts connected to {titleOverride || title}
          </h3>
          <p className="text-xs text-[var(--color-app-text-muted)] mt-0.5">
            Discover foundations, component mechanics, and natural extensions across quantum computing.
          </p>
        </div>

        {totalRelationships > 0 && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-[var(--color-app-border)] text-[var(--color-app-text-main)] hover:border-[var(--color-app-primary)] hover:text-[var(--color-app-primary)] transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <span>{isExpanded ? "▾ Collapse Map" : "▸ View Full Neighborhood"}</span>
            <span className="opacity-60 text-[10px]">({totalRelationships})</span>
          </button>
        )}
      </div>

      {/* ─── DEFAULT VIEW: Compact 3–6 Deterministic Connections ─── */}
      {!isExpanded && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {defaultConnections.map((node) => {
              const labelMap = {
                foundation: "Foundation",
                component: "Built with",
                related: "Related",
                extension: "Explore next",
              };
              return renderTopicCard(node, labelMap[node.relationshipType]);
            })}
          </div>

          {totalRelationships > defaultConnections.length && (
            <div className="pt-2 flex items-center justify-between text-xs text-[var(--color-app-text-light)]">
              <span>
                Showing <strong>{defaultConnections.length}</strong> of <strong>{totalRelationships}</strong> curated conceptual connections.
              </span>
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="font-semibold text-[var(--color-app-primary)] hover:underline cursor-pointer"
              >
                View all connections →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── EXPANDED VIEW: Clear Grouped Conceptual Neighborhood ─── */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-6 pt-2 border-t border-[var(--color-app-border-light)]"
        >
          {/* Active Topic Banner */}
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">🎯</span>
              <span className="text-xs font-bold text-blue-300">
                Current Anchor: <span className="text-white">{title}</span> ({category})
              </span>
            </div>
            <span className="text-[10px] text-blue-300/70 italic">
              Relationships guide exploration — not rigid gates
            </span>
          </div>

          {/* 1. Foundations Group */}
          {foundations.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-app-text-main)]">
                  Foundations
                </span>
                <span className="text-[10px] text-[var(--color-app-text-light)]">
                  (Concepts useful before or while learning this)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {foundations.map((node) => renderTopicCard(node, "Foundation"))}
              </div>
            </div>
          )}

          {/* 2. Components / Built With Group */}
          {components.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-app-text-main)]">
                  Built With / Components
                </span>
                <span className="text-[10px] text-[var(--color-app-text-light)]">
                  (Subroutines, mechanics, and operators used)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {components.map((node) => renderTopicCard(node, "Component"))}
              </div>
            </div>
          )}

          {/* 3. Related Concepts Group */}
          {related.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-app-text-main)]">
                  Related Concepts
                </span>
                <span className="text-[10px] text-[var(--color-app-text-light)]">
                  (Strong conceptual kinship without prerequisite ordering)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {related.map((node) => renderTopicCard(node, "Related"))}
              </div>
            </div>
          )}

          {/* 4. Extensions / Explore Next Group */}
          {extensions.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-app-text-main)]">
                  Explore Next
                </span>
                <span className="text-[10px] text-[var(--color-app-text-light)]">
                  (Natural next steps and advanced topics building upon this)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {extensions.map((node) => renderTopicCard(node, "Extension"))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Lightweight Concept Context Modal for Concept-Only Nodes */}
      <ConceptModal
        topic={activeConceptTopic}
        isOpen={Boolean(activeConceptTopic)}
        onClose={() => setActiveConceptTopic(null)}
      />
    </div>
  );
}
