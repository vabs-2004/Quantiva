import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getNews, searchGNews } from "../../services/api";

const tagColors = {
  Hardware: "#3b82f6",
  Research: "#8b5cf6",
  Policy: "#f59e0b",
  Industry: "#10b981",
  Algorithm: "#06b6d4",
  Defence: "#ef4444",
  Space: "#6366f1",
  Healthcare: "#ec4899",
};

/* ───── Shimmer skeleton card ───── */
function SkeletonCard() {
  return (
    <div
      style={{
        padding: "1.75rem",
        borderRadius: "1rem",
        border: "1px solid var(--color-app-card-border)",
        background: "var(--color-app-card-bg)",
      }}
    >
      <div style={{ width: "60px", height: "14px", borderRadius: 999, background: "var(--color-app-surface-hover)", marginBottom: "1rem" }} />
      <div style={{ width: "100%", height: "16px", borderRadius: 6, background: "var(--color-app-surface-hover)", marginBottom: "0.5rem" }} />
      <div style={{ width: "80%", height: "16px", borderRadius: 6, background: "var(--color-app-surface-hover)", marginBottom: "1rem" }} />
      <div style={{ width: "100%", height: "12px", borderRadius: 6, background: "var(--color-app-surface-hover)", marginBottom: "0.4rem" }} />
      <div style={{ width: "90%", height: "12px", borderRadius: 6, background: "var(--color-app-surface-hover)", marginBottom: "1rem" }} />
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <div style={{ width: "60px", height: "10px", borderRadius: 6, background: "var(--color-app-surface-hover)" }} />
        <div style={{ width: "60px", height: "10px", borderRadius: 6, background: "var(--color-app-surface-hover)" }} />
      </div>
    </div>
  );
}

/* ───── Tab button component ───── */
function TabButton({ active, label, icon, onClick, count }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.6rem 1.5rem",
        borderRadius: "0.75rem",
        border: active ? "1px solid var(--color-app-primary)" : "1px solid var(--color-app-card-border)",
        background: active ? "var(--color-app-primary-glow)" : "var(--color-app-card-bg)",
        color: active ? "var(--color-app-primary)" : "var(--color-app-text-muted)",
        fontSize: "0.85rem",
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        transition: "all 0.25s ease",
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {count !== undefined && (
        <span style={{
          fontSize: "0.65rem",
          fontWeight: 800,
          padding: "0.1rem 0.45rem",
          borderRadius: 999,
          background: active ? "var(--color-app-primary)" : "var(--color-app-surface-hover)",
          color: active ? "#fff" : "var(--color-app-text-light)",
        }}>
          {count}
        </span>
      )}
    </button>
  );
}

/* ───── News card for GNews articles ───── */
function GNewsCard({ article, index }) {
  const formattedDate = article.date
    ? new Date(article.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <motion.a
      href={article.externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.45 }}
      whileHover={{ y: -4 }}
      style={{
        display: "block",
        textDecoration: "none",
        borderRadius: "1rem",
        border: "1px solid var(--color-app-card-border)",
        background: "var(--color-app-card-bg)",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.3s",
      }}
    >
      {/* Article Image */}
      {article.image && (
        <div style={{
          width: "100%",
          height: "180px",
          overflow: "hidden",
          position: "relative",
        }}>
          <img
            src={article.image}
            alt={article.title}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.4s ease",
            }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
          {/* Gradient overlay */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "60px",
            background: "linear-gradient(transparent, var(--color-app-card-bg))",
          }} />
        </div>
      )}

      <div style={{ padding: "1.25rem 1.5rem 1.5rem" }}>
        {/* Tag + External badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
          <span style={{
            display: "inline-block",
            padding: "0.2rem 0.75rem",
            borderRadius: 999,
            fontSize: "0.6rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            background: `${tagColors[article.tag] || "#3b82f6"}15`,
            color: tagColors[article.tag] || "#3b82f6",
          }}>
            {article.tag}
          </span>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            padding: "0.15rem 0.5rem",
            borderRadius: 999,
            fontSize: "0.55rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            background: "rgba(16, 185, 129, 0.1)",
            color: "#10b981",
          }}>
            🌐 Live
          </span>
        </div>

        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-app-text-main)", marginBottom: "0.5rem", lineHeight: 1.4 }}>
          {article.title}
        </h3>

        <p style={{ fontSize: "0.8rem", color: "var(--color-app-text-muted)", lineHeight: 1.6, marginBottom: "1rem", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {article.excerpt}
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.7rem", color: "var(--color-app-text-light)" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ fontWeight: 600 }}>{article.source}</span>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.2rem",
            color: "var(--color-app-primary)",
            fontWeight: 600,
            fontSize: "0.65rem",
          }}>
            Read ↗
          </span>
        </div>
      </div>
    </motion.a>
  );
}

/* ───── Featured GNews card (hero) ───── */
function GNewsFeaturedCard({ article }) {
  const formattedDate = article.date
    ? new Date(article.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <motion.a
      href={article.externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      whileHover={{ y: -4 }}
      style={{
        display: "grid",
        gridTemplateColumns: article.image ? "1fr 1fr" : "1fr",
        gap: "0",
        textDecoration: "none",
        borderRadius: "1.25rem",
        border: "1px solid var(--color-app-card-border)",
        background: "linear-gradient(135deg, var(--color-app-primary-glow), rgba(139,92,246,0.05))",
        marginBottom: "2.5rem",
        cursor: "pointer",
        overflow: "hidden",
        transition: "all 0.3s",
      }}
    >
      {/* Image side */}
      {article.image && (
        <div style={{
          width: "100%",
          height: "100%",
          minHeight: "280px",
          overflow: "hidden",
        }}>
          <img
            src={article.image}
            alt={article.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { e.target.parentElement.style.display = "none"; }}
          />
        </div>
      )}

      {/* Content side */}
      <div style={{ padding: "2.5rem", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
          <span style={{
            display: "inline-block",
            padding: "0.2rem 0.75rem",
            borderRadius: 999,
            fontSize: "0.65rem",
            fontWeight: 700,
            textTransform: "uppercase",
            background: `${tagColors[article.tag] || "#f59e0b"}20`,
            color: tagColors[article.tag] || "#f59e0b",
          }}>
            🔥 Featured — {article.tag}
          </span>
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            padding: "0.2rem 0.6rem",
            borderRadius: 999,
            fontSize: "0.6rem",
            fontWeight: 700,
            background: "rgba(16, 185, 129, 0.1)",
            color: "#10b981",
          }}>
            🌐 Live Feed
          </span>
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-app-text-main)", marginBottom: "0.75rem", lineHeight: 1.3 }}>
          {article.title}
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--color-app-text-muted)", lineHeight: 1.7, marginBottom: "1rem", maxWidth: 500 }}>
          {article.excerpt}
        </p>
        <div style={{ fontSize: "0.75rem", color: "var(--color-app-text-light)", display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <span style={{ fontWeight: 600 }}>{article.source}</span>
          <span>•</span>
          <span>{formattedDate}</span>
          <span style={{ marginLeft: "auto", color: "var(--color-app-primary)", fontWeight: 700 }}>Read Article ↗</span>
        </div>
      </div>
    </motion.a>
  );
}

/* ═════════════════════════════════════════════════════════ */
/* ───── MAIN NEWS PAGE ───── */
/* ═════════════════════════════════════════════════════════ */

export default function NewsPage() {
  const navigate = useNavigate();

  // Tab state: "live" (GNews) or "editorial" (DB)
  const [activeTab, setActiveTab] = useState("live");

  // --- GNews state ---
  const [gnewsArticles, setGnewsArticles] = useState([]);
  const [gnewsLoading, setGnewsLoading] = useState(false);
  const [gnewsError, setGnewsError] = useState(null);
  const [gnewsQuery, setGnewsQuery] = useState("quantum computing");
  const [searchInput, setSearchInput] = useState("quantum computing");

  // --- DB News state ---
  const [dbNews, setDbNews] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbPage, setDbPage] = useState(1);
  const [dbTotalPages, setDbTotalPages] = useState(1);
  const dbLimit = 13;

  // Load GNews articles
  const loadGNews = useCallback(async (query) => {
    try {
      setGnewsLoading(true);
      setGnewsError(null);
      const data = await searchGNews(query || "quantum computing");
      setGnewsArticles(data.articles || []);
    } catch (err) {
      console.error("Failed to load GNews", err);
      setGnewsError("Failed to fetch live news. The API key may not be configured yet.");
    } finally {
      setGnewsLoading(false);
    }
  }, []);

  // Load DB news
  useEffect(() => {
    async function loadDbNews() {
      try {
        setDbLoading(true);
        const data = await getNews(dbPage, dbLimit);
        if (data.data) {
          setDbNews(data.data);
          setDbTotalPages(data.totalPages);
        } else {
          setDbNews(data);
          setDbTotalPages(1);
        }
      } catch (err) {
        console.error("Failed to load DB news", err);
      } finally {
        setDbLoading(false);
      }
    }
    loadDbNews();
  }, [dbPage]);

  // Load GNews on mount and when query changes
  useEffect(() => {
    loadGNews(gnewsQuery);
  }, [gnewsQuery, loadGNews]);

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setGnewsQuery(searchInput.trim());
    }
  };

  // Quick search tags
  const quickSearches = [
    { label: "Quantum Computing", query: "quantum computing" },
    { label: "Quantum Physics", query: "quantum physics" },
    { label: "Quantum AI", query: "quantum artificial intelligence" },
    { label: "Quantum Security", query: "quantum cryptography security" },
    { label: "Quantum Hardware", query: "quantum hardware qubits" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-app-base)", color: "var(--color-app-text-main)" }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 2rem" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: "2rem" }}
        >
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.75rem" }}>
            Quantum <span style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>News</span>
          </h1>
          <p style={{ color: "var(--color-app-text-muted)", fontSize: "0.95rem", maxWidth: 500, margin: "0 auto" }}>
            Stay updated with the latest developments in the global quantum computing landscape
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginBottom: "2rem", flexWrap: "wrap" }}
        >
          <TabButton
            active={activeTab === "live"}
            label="Live Feed"
            icon="🌐"
            onClick={() => setActiveTab("live")}
            count={gnewsArticles.length}
          />
          <TabButton
            active={activeTab === "editorial"}
            label="Editorial"
            icon="📰"
            onClick={() => setActiveTab("editorial")}
            count={dbNews.length}
          />
        </motion.div>

        {/* ══════════════════════════════════════ */}
        {/* Live Feed Tab (GNews) */}
        {/* ══════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {activeTab === "live" && (
            <motion.div
              key="live"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Search Bar */}
              <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", maxWidth: 600, margin: "0 auto 1.25rem" }}>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search quantum news..."
                  style={{
                    flex: 1,
                    padding: "0.75rem 1.25rem",
                    borderRadius: "0.75rem",
                    border: "1px solid var(--color-app-input-border)",
                    background: "var(--color-app-input-bg)",
                    color: "var(--color-app-input-text)",
                    fontSize: "0.85rem",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "var(--color-app-primary)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--color-app-input-border)"}
                />
                <button
                  type="submit"
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderRadius: "0.75rem",
                    border: "none",
                    background: "var(--color-app-primary)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Search
                </button>
              </form>

              {/* Quick search pills */}
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "2rem" }}>
                {quickSearches.map((qs) => (
                  <button
                    key={qs.query}
                    onClick={() => { setSearchInput(qs.query); setGnewsQuery(qs.query); }}
                    style={{
                      padding: "0.3rem 0.85rem",
                      borderRadius: 999,
                      border: gnewsQuery === qs.query ? "1px solid var(--color-app-primary)" : "1px solid var(--color-app-card-border)",
                      background: gnewsQuery === qs.query ? "var(--color-app-primary-glow)" : "transparent",
                      color: gnewsQuery === qs.query ? "var(--color-app-primary)" : "var(--color-app-text-muted)",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {qs.label}
                  </button>
                ))}
              </div>

              {/* Error state */}
              {gnewsError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    textAlign: "center",
                    padding: "3rem 2rem",
                    borderRadius: "1rem",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                    background: "rgba(245, 158, 11, 0.05)",
                    marginBottom: "2rem",
                  }}
                >
                  <p style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>⚠️</p>
                  <p style={{ color: "#f59e0b", fontWeight: 600, marginBottom: "0.5rem" }}>API Key Required</p>
                  <p style={{ color: "var(--color-app-text-muted)", fontSize: "0.8rem", maxWidth: 450, margin: "0 auto" }}>
                    Add your GNews API key to <code style={{ background: "var(--color-app-surface-hover)", padding: "0.15rem 0.4rem", borderRadius: 4, fontSize: "0.75rem" }}>.env</code> file as <code style={{ background: "var(--color-app-surface-hover)", padding: "0.15rem 0.4rem", borderRadius: 4, fontSize: "0.75rem" }}>GNEWS_API_KEY=your_key</code>. Get a free key at <a href="https://gnews.io" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-app-primary)" }}>gnews.io</a>
                  </p>
                </motion.div>
              )}

              {/* Loading state */}
              {gnewsLoading && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
                  {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              )}

              {/* GNews Articles */}
              {!gnewsLoading && !gnewsError && gnewsArticles.length > 0 && (
                <>
                  {/* Featured card */}
                  <GNewsFeaturedCard article={gnewsArticles[0]} />

                  {/* Grid of remaining articles */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
                    {gnewsArticles.slice(1).map((article, i) => (
                      <GNewsCard key={article._id} article={article} index={i} />
                    ))}
                  </div>
                </>
              )}

              {/* Empty state */}
              {!gnewsLoading && !gnewsError && gnewsArticles.length === 0 && (
                <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--color-app-text-muted)" }}>
                  <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔍</p>
                  <p style={{ fontWeight: 600 }}>No articles found</p>
                  <p style={{ fontSize: "0.8rem" }}>Try a different search query</p>
                </div>
              )}

              {/* Powered by badge */}
              <div style={{ textAlign: "center", marginTop: "3rem", fontSize: "0.7rem", color: "var(--color-app-text-light)" }}>
                Powered by <a href="https://gnews.io" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-app-primary)", textDecoration: "none", fontWeight: 600 }}>GNews API</a> • Live quantum news from across the web
              </div>
            </motion.div>
          )}

          {/* ══════════════════════════════════════ */}
          {/* Editorial Tab (DB News) */}
          {/* ══════════════════════════════════════ */}
          {activeTab === "editorial" && (
            <motion.div
              key="editorial"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {dbLoading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
                  {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : dbNews.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--color-app-text-muted)" }}>
                  <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📰</p>
                  <p style={{ fontWeight: 600 }}>No editorial news yet</p>
                  <p style={{ fontSize: "0.8rem" }}>Check back later for curated content from the team</p>
                </div>
              ) : (
                <>
                  {/* Featured editorial */}
                  {dbPage === 1 && (() => {
                    const featuredNews = dbNews.find(n => n.isFeatured) || dbNews[0];
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        whileHover={{ y: -4 }}
                        style={{
                          padding: "2.5rem",
                          borderRadius: "1.25rem",
                          border: "1px solid var(--color-app-card-border)",
                          background: "linear-gradient(135deg, var(--color-app-primary-glow), rgba(139,92,246,0.05))",
                          marginBottom: "2.5rem",
                          cursor: "pointer",
                        }}
                        onClick={() => navigate(`/news/${featuredNews._id}`)}
                      >
                        <span style={{
                          display: "inline-block",
                          padding: "0.2rem 0.75rem",
                          borderRadius: 999,
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          background: `${tagColors[featuredNews.tag] || "#f59e0b"}20`,
                          color: tagColors[featuredNews.tag] || "#f59e0b",
                          marginBottom: "0.75rem",
                        }}>
                          🔥 Featured — {featuredNews.tag}
                        </span>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-app-text-main)", marginBottom: "0.75rem" }}>
                          {featuredNews.title}
                        </h2>
                        <p style={{ fontSize: "0.9rem", color: "var(--color-app-text-muted)", lineHeight: 1.7, marginBottom: "1rem", maxWidth: 700 }}>
                          {featuredNews.excerpt}
                        </p>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-app-text-light)", display: "flex", gap: "0.75rem" }}>
                          <span>{featuredNews.source}</span>
                          <span>•</span>
                          <span>{featuredNews.date}</span>
                        </div>
                      </motion.div>
                    );
                  })()}

                  {/* News Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
                    {(() => {
                      const featuredNews = dbPage === 1 ? (dbNews.find(n => n.isFeatured) || dbNews[0]) : null;
                      const otherNews = dbNews.filter(n => n._id !== (featuredNews ? featuredNews._id : null));
                      return otherNews.map((item, i) => (
                        <motion.div
                          key={item._id}
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.06, duration: 0.5 }}
                          whileHover={{ y: -4 }}
                          style={{
                            padding: "1.75rem",
                            borderRadius: "1rem",
                            border: "1px solid var(--color-app-card-border)",
                            background: "var(--color-app-card-bg)",
                            cursor: "pointer",
                            transition: "all 0.3s",
                          }}
                          onClick={() => navigate(`/news/${item._id}`)}
                        >
                          <span style={{
                            display: "inline-block",
                            padding: "0.2rem 0.75rem",
                            borderRadius: 999,
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            background: `${tagColors[item.tag] || "#3b82f6"}15`,
                            color: tagColors[item.tag] || "#3b82f6",
                            marginBottom: "0.75rem",
                          }}>
                            {item.tag}
                          </span>

                          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-app-text-main)", marginBottom: "0.5rem", lineHeight: 1.4 }}>
                            {item.title}
                          </h3>

                          <p style={{ fontSize: "0.8rem", color: "var(--color-app-text-muted)", lineHeight: 1.6, marginBottom: "1rem" }}>
                            {item.excerpt}
                          </p>

                          <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.7rem", color: "var(--color-app-text-light)" }}>
                            <span>{item.source}</span>
                            <span>•</span>
                            <span>{item.date}</span>
                          </div>
                        </motion.div>
                      ));
                    })()}
                  </div>

                  {/* Pagination Controls */}
                  {dbTotalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginTop: "3rem" }}>
                      <button
                        onClick={() => { setDbPage((p) => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                        disabled={dbPage === 1}
                        style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid var(--color-app-border)", background: "var(--color-app-base)", color: "var(--color-app-text-main)", opacity: dbPage === 1 ? 0.5 : 1, cursor: dbPage === 1 ? "not-allowed" : "pointer" }}
                      >
                        Previous
                      </button>
                      <span style={{ fontSize: "0.9rem", color: "var(--color-app-text-muted)" }}>Page {dbPage} of {dbTotalPages}</span>
                      <button
                        onClick={() => { setDbPage((p) => Math.min(dbTotalPages, p + 1)); window.scrollTo(0, 0); }}
                        disabled={dbPage === dbTotalPages}
                        style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid var(--color-app-border)", background: "var(--color-app-base)", color: "var(--color-app-text-main)", opacity: dbPage === dbTotalPages ? 0.5 : 1, cursor: dbPage === dbTotalPages ? "not-allowed" : "pointer" }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
}
