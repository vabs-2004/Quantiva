import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { searchResources, getExploreFeatured } from "../../services/searchApi";
import { useAITutor } from "../../context/AITutorContext";
import { useAuth } from "../../context/AuthContext";

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { openTutor } = useAITutor();
  const { isLoggedIn } = useAuth();

  // URL state synchronization
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "all";

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [results, setResults] = useState([]);
  const [facets, setFacets] = useState({ all: 0, micro_modules: 0, algorithms: 0, courses: 0, docs: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Landing content state
  const [featuredData, setFeaturedData] = useState({ foundations: [], algorithms: [], courses: [], topics: [] });
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  const debounceTimerRef = useRef(null);

  // Sync state with URL if URL changes externally
  useEffect(() => {
    const urlQ = searchParams.get("q") || "";
    const urlCat = searchParams.get("category") || "all";
    if (urlQ !== query) setQuery(urlQ);
    if (urlCat !== category) setCategory(urlCat);
  }, [searchParams]);

  // Fetch explore featured sections on initial mount
  useEffect(() => {
    async function loadFeatured() {
      try {
        setLoadingFeatured(true);
        const data = await getExploreFeatured();
        setFeaturedData(data || { foundations: [], algorithms: [], courses: [], topics: [] });
      } catch (err) {
        console.error("Failed to load explore featured:", err);
      } finally {
        setLoadingFeatured(false);
      }
    }
    loadFeatured();
  }, []);

  // Perform search (handles both active query search and empty-query category browsing)
  const executeSearch = useCallback(async (searchQuery, searchCategory) => {
    try {
      setLoading(true);
      const res = await searchResources({
        q: searchQuery,
        category: searchCategory,
        limit: 50,
      });
      if (res && res.success) {
        setResults(res.results || []);
        setFacets(res.facets || { all: 0, micro_modules: 0, algorithms: 0, courses: 0, docs: 0 });
        setTotal(res.total || 0);
      }
    } catch (err) {
      console.error("Failed to execute search:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Whenever query or category changes:
  // If query is present OR category !== "all", we query the backend and show filtered results.
  // If query is empty AND category === "all", we show the curated landing page.
  useEffect(() => {
    const nextParams = {};
    if (query) nextParams.q = query;
    if (category && category !== "all") nextParams.category = category;
    setSearchParams(nextParams, { replace: true });

    const hasQuery = Boolean(query.trim());
    const hasCategoryFilter = category && category !== "all";

    if (!hasQuery && !hasCategoryFilter) {
      // Empty landing state
      setResults([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Small debounce for keystrokes; instant for category switches
    const delay = hasQuery ? 250 : 0;

    debounceTimerRef.current = setTimeout(() => {
      executeSearch(query.trim(), category);
    }, delay);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, category, executeSearch, setSearchParams]);

  // Direct topic chip click
  const handleTopicClick = (topic) => {
    setQuery(topic);
    setCategory("all");
  };

  // Ask Quantiva contextual handoff (Phase 7G contract)
  const handleAskQuantiva = () => {
    const contextualPayload = {
      source: "explore",
      query: query || (category !== "all" ? category : null),
      topic: {
        topicId: query || category,
        title: query ? `Search: "${query}"` : (category !== "all" ? (categoryLabels[category] || category) : "Explore Quantiva"),
        category: "Explore & Search",
        description: query ? `Learner searched for "${query}" in Quantiva.` : "Exploring quantum computing topics and resources.",
      },
      resource: null,
    };
    const seed = query
      ? `I was exploring Quantiva for "${query}", but couldn't find what I was looking for. Can you explain this quantum concept?`
      : null;
    openTutor(seed, contextualPayload);
  };

  // Active view mode: results view if searching OR filtering by specific category
  const isResultsView = Boolean(query.trim()) || (category && category !== "all");

  const categoryLabels = {
    all: "All",
    micro_modules: "Micro Modules",
    algorithms: "Algorithms",
    courses: "Courses",
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Navigation Breadcrumb */}
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

      {/* Hero / Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 mb-3 text-xs font-bold uppercase tracking-wider"
          style={{ background: "rgba(99,102,241,0.12)", color: "var(--color-app-accent)" }}
        >
          <span>🔍</span> Unified Knowledge Discovery
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--color-app-text-main)] mb-3">
          Explore Quantum Computing
        </h1>
        <p className="text-sm sm:text-base text-[var(--color-app-text-muted)]">
          What do you want to learn? Discover micro-modules, interactive algorithms, and video lectures.
        </p>

        {/* Search Input Field */}
        <div className="mt-8 relative max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--color-app-text-muted)] text-lg">
            🔍
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search anything in quantum computing (e.g. QPE, superposition, Grover, Hadamard)..."
            className="w-full pl-12 pr-12 py-3.5 rounded-2xl text-sm sm:text-base outline-none transition-all app-glass shadow-lg"
            style={{
              border: "1px solid var(--color-app-border)",
              background: "var(--color-app-surface)",
              color: "var(--color-app-text-main)",
            }}
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-sm text-[var(--color-app-text-muted)] hover:text-white transition-colors cursor-pointer"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
          {[
            { key: "all", label: "All", count: facets.all },
            { key: "micro_modules", label: "Micro Modules", count: facets.micro_modules },
            { key: "algorithms", label: "Algorithms", count: facets.algorithms },
            { key: "courses", label: "Courses", count: facets.courses },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCategory(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                category === tab.key
                  ? "bg-[var(--color-app-primary)] text-white shadow-md"
                  : "app-glass border border-[var(--color-app-border)] text-[var(--color-app-text-muted)] hover:text-white"
              }`}
            >
              {tab.label}
              {isResultsView && tab.count !== undefined && (
                <span className="opacity-75 font-mono text-[10px]">({tab.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── ACTIVE RESULTS / CATEGORY VIEW ─── */}
      {isResultsView && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--color-app-border-light)] pb-4">
            <div className="text-sm font-semibold text-[var(--color-app-text-main)]">
              {loading ? (
                <span className="animate-pulse">Loading resources...</span>
              ) : query.trim() ? (
                <span>
                  Found <strong className="text-[var(--color-app-primary)]">{total}</strong> {total === 1 ? "result" : "results"} for <span className="italic">"{query}"</span>
                  {category !== "all" && <span className="text-[var(--color-app-text-muted)]"> in {categoryLabels[category]}</span>}
                </span>
              ) : (
                <span>
                  Showing all <strong className="text-[var(--color-app-primary)]">{total}</strong> {categoryLabels[category]}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setQuery("");
                setCategory("all");
              }}
              className="text-xs font-semibold text-[var(--color-app-text-muted)] hover:text-white transition-colors cursor-pointer"
            >
              Reset to Showcase
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center text-sm font-semibold text-[var(--color-app-text-muted)] animate-pulse">
              Retrieving quantum learning resources...
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map((item) => {
                const isMicro = item.type === "micro_module";
                const isAlgo = item.type === "algorithm";
                const isCourse = item.type === "course";
                const isDoc = item.type === "doc";

                const badgeColor = isMicro
                  ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                  : isAlgo
                  ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                  : isCourse
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-300 border-amber-500/30";

                const badgeLabel = isMicro
                  ? "MICRO MODULE"
                  : isAlgo
                  ? "ALGORITHM"
                  : isCourse
                  ? "COURSE"
                  : "DOC";

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-5 border app-glass flex flex-col justify-between hover:border-[var(--color-app-primary)]/50 transition-all duration-200 group shadow-md"
                    style={{ background: "var(--color-app-surface)" }}
                  >
                    <div>
                      {/* Top Header: Resource Type & Category */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border ${badgeColor}`}>
                          {badgeLabel}
                        </span>
                        {item.category && (
                          <span className="text-[11px] font-semibold text-[var(--color-app-text-muted)]">
                            {item.category}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-[var(--color-app-text-main)] group-hover:text-[var(--color-app-primary)] transition-colors mb-2">
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-[var(--color-app-text-muted)] line-clamp-3 mb-4 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Real Metadata Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px] font-mono text-[var(--color-app-text-muted)]">
                        {item.metadata?.timeComplexity && (
                          <span className="px-2 py-0.5 rounded bg-black/30 border border-white/5 text-blue-300">
                            ⏱ {item.metadata.timeComplexity}
                          </span>
                        )}
                        {item.metadata?.spaceComplexity && (
                          <span className="px-2 py-0.5 rounded bg-black/30 border border-white/5 text-purple-300">
                            💾 {item.metadata.spaceComplexity}
                          </span>
                        )}
                        {item.metadata?.sequenceOrder !== undefined && (
                          <span className="px-2 py-0.5 rounded bg-black/30 border border-white/5 text-amber-300">
                            Sequence #{item.metadata.sequenceOrder}
                          </span>
                        )}
                        {item.metadata?.lecturesCount !== undefined && (
                          <span className="px-2 py-0.5 rounded bg-black/30 border border-white/5 text-emerald-300">
                            📹 {item.metadata.lecturesCount} {item.metadata.lecturesCount === 1 ? "lecture" : "lectures"}
                          </span>
                        )}
                        {item.metadata?.instructor && (
                          <span className="px-2 py-0.5 rounded bg-black/30 border border-white/5">
                            👤 {item.metadata.instructor}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-3 border-t border-[var(--color-app-border-light)] flex items-center justify-between">
                      <Link
                        to={item.route}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-app-primary)] hover:text-white transition-colors"
                      >
                        {isMicro && "Launch Module →"}
                        {isAlgo && "Open Algorithm →"}
                        {isCourse && "View Course →"}
                        {isDoc && "Read Documentation →"}
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* No Results Found State */
            <div className="py-16 text-center max-w-xl mx-auto rounded-3xl border border-[var(--color-app-border)] app-glass p-8">
              <div className="text-4xl mb-3">🔭</div>
              <h3 className="text-xl font-bold text-[var(--color-app-text-main)] mb-2">
                No learning resources found
              </h3>
              <p className="text-sm text-[var(--color-app-text-muted)] mb-6">
                No registered resources matched {query ? <span>"{query}"</span> : <span>the selected category</span>}.
              </p>

              {/* Contextual Ask Quantiva Bridge */}
              <div
                className="p-5 rounded-2xl border text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                style={{
                  borderColor: "rgba(99,102,241,0.3)",
                  background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.05))",
                }}
              >
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-app-accent)] mb-1">
                    Can't find what you're looking for?
                  </div>
                  <div className="text-sm font-bold text-white">
                    Ask Quantiva AI Tutor about "{query || category}"
                  </div>
                </div>
                <button
                  onClick={handleAskQuantiva}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md shrink-0 cursor-pointer hover:scale-105"
                  style={{ background: "linear-gradient(135deg, var(--color-app-primary), var(--color-app-accent))" }}
                >
                  Ask Quantiva →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── EMPTY QUERY ALL-SHOWCASE LANDING STATE ─── */}
      {!isResultsView && (
        <div className="space-y-12">
          {/* Section 1: Explore Topics (Real Keywords) */}
          {featuredData.topics?.length > 0 && (
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-app-text-muted)] mb-4 flex items-center gap-2">
                <span>🏷️</span> Explore Topics
              </div>
              <div className="flex flex-wrap gap-2.5">
                {featuredData.topics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => handleTopicClick(topic)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold app-glass border border-[var(--color-app-border)] text-[var(--color-app-text-muted)] hover:text-white hover:border-[var(--color-app-primary)] transition-all cursor-pointer shadow-sm hover:scale-105"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Start with Quantum Foundations */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-app-primary)] mb-1">
                  Beginner Pathway
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-app-text-main)]">
                  Start with Quantum Foundations
                </h2>
              </div>
              <Link
                to="/micro-modules"
                className="text-xs font-bold text-[var(--color-app-primary)] hover:text-white transition-colors"
              >
                View all 12 modules →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredData.foundations?.map((m) => (
                <Link
                  key={m.id}
                  to={m.route}
                  className="rounded-2xl p-5 border app-glass hover:border-[var(--color-app-primary)] transition-all group flex flex-col justify-between shadow-sm"
                  style={{ background: "var(--color-app-surface)" }}
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-app-text-muted)] mb-2">
                      <span>Module {m.sequenceOrder}</span>
                      <span className="text-purple-400 font-bold">FOUNDATIONS</span>
                    </div>
                    <h3 className="text-base font-bold text-[var(--color-app-text-main)] group-hover:text-[var(--color-app-primary)] transition-colors mb-2">
                      {m.title}
                    </h3>
                    <p className="text-xs text-[var(--color-app-text-muted)] line-clamp-3 leading-relaxed">
                      {m.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[var(--color-app-border-light)] text-xs font-bold text-[var(--color-app-primary)] flex items-center justify-between">
                    <span>Start Module</span>
                    <span>→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Section 3: Core Quantum Algorithms */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-blue-400 mb-1">
                  Interactive Lab
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-app-text-main)]">
                  Core Quantum Algorithms
                </h2>
              </div>
              <Link
                to="/algorithms"
                className="text-xs font-bold text-blue-400 hover:text-white transition-colors"
              >
                View all 12 algorithms →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredData.algorithms?.map((a) => (
                <Link
                  key={a.id}
                  to={a.route}
                  className="rounded-2xl p-5 border app-glass hover:border-blue-500/60 transition-all group flex flex-col justify-between shadow-sm"
                  style={{ background: "var(--color-app-surface)" }}
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-app-text-muted)] mb-2">
                      <span className="text-blue-400 font-bold">ALGORITHM</span>
                      <span>{a.metadata?.timeComplexity || ""}</span>
                    </div>
                    <h3 className="text-base font-bold text-[var(--color-app-text-main)] group-hover:text-blue-400 transition-colors mb-2">
                      {a.title}
                    </h3>
                    <p className="text-xs text-[var(--color-app-text-muted)] line-clamp-3 leading-relaxed">
                      {a.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[var(--color-app-border-light)] text-xs font-bold text-blue-400 flex items-center justify-between">
                    <span>Open Algorithm</span>
                    <span>→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Section 4: Video Courses & Lectures */}
          {featuredData.courses?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 mb-1">
                    Video Learning
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-app-text-main)]">
                    Free Courses & Video Lectures
                  </h2>
                </div>
                <Link
                  to="/courses"
                  className="text-xs font-bold text-emerald-400 hover:text-white transition-colors"
                >
                  View all courses →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {featuredData.courses.map((c) => (
                  <Link
                    key={c.id}
                    to={c.route}
                    className="rounded-2xl p-5 border app-glass hover:border-emerald-500/60 transition-all group flex flex-col justify-between shadow-sm"
                    style={{ background: "var(--color-app-surface)" }}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-app-text-muted)] mb-2">
                        <span className="text-emerald-400 font-bold">COURSE</span>
                        <span>{c.metadata?.lecturesCount || 0} Lectures</span>
                      </div>
                      <h3 className="text-base font-bold text-[var(--color-app-text-main)] group-hover:text-emerald-400 transition-colors mb-2">
                        {c.title}
                      </h3>
                      <p className="text-xs text-[var(--color-app-text-muted)] line-clamp-3 leading-relaxed">
                        {c.description}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[var(--color-app-border-light)] text-xs font-bold text-emerald-400 flex items-center justify-between">
                      <span>Watch Lectures</span>
                      <span>→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
