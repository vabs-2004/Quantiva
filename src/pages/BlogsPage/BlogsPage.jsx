import { motion } from "framer-motion";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getBlogs } from "../../services/api";

export default function BlogsPage() {
  const navigate = useNavigate();
  const [blogPosts, setBlogPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12;

  useEffect(() => {
    async function loadBlogs() {
      try {
        setLoading(true);
        const data = await getBlogs(page, limit);
        
        let allDataForCats = [];
        // Extract unique categories (for this we could fetch a separate API or just use the current page's categories,
        // but for simplicity we'll just use the current page's categories)
        if (data.data) {
          setBlogPosts(data.data);
          setTotalPages(data.totalPages);
          allDataForCats = data.data;
        } else {
          setBlogPosts(data);
          setTotalPages(1);
          allDataForCats = data;
        }
        
        // We only extract categories from the loaded blogs. In a full system, you'd fetch all unique categories.
        const cats = [...new Set(allDataForCats.map(p => p.category))];
        setCategories(cats);
      } catch (err) {
        console.error("Failed to load blogs", err);
      } finally {
        setLoading(false);
      }
    }
    loadBlogs();
  }, [page]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--color-app-base)", color: "white" }}>
        <Navbar />
        <div className="flex justify-center items-center h-[60vh]">Loading blogs...</div>
      </div>
    );
  }
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-app-base)", color: "var(--color-app-text-main)" }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 2rem" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: "3rem" }}
        >
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.75rem" }}>
            Quantum <span style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Blogs</span>
          </h1>
          <p style={{ color: "var(--color-app-text-muted)", fontSize: "0.95rem", maxWidth: 500, margin: "0 auto" }}>
            In-depth articles about quantum computing, algorithms, and the latest research
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center", marginBottom: "2.5rem" }}
        >
          {categories.map(cat => (
            <span
              key={cat}
              style={{
                padding: "0.3rem 0.85rem",
                borderRadius: 999,
                fontSize: "0.7rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                background: "var(--color-app-primary-glow)",
                color: "var(--color-app-primary)",
                border: "1px solid var(--color-app-border)",
              }}
            >
              {cat}
            </span>
          ))}
        </motion.div>

        {/* Blog Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {blogPosts.map((post, i) => (
            <motion.article
              key={post._id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
              style={{
                padding: "2rem",
                borderRadius: "1rem",
                border: "1px solid var(--color-app-card-border)",
                background: "var(--color-app-card-bg)",
                cursor: "pointer",
                transition: "all 0.3s",
                display: "flex",
                flexDirection: "column",
              }}
              onClick={() => navigate(`/blogs/${post._id}`)}
            >
              <span style={{
                display: "inline-block",
                padding: "0.2rem 0.75rem",
                borderRadius: 999,
                fontSize: "0.6rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                background: "rgba(139,92,246,0.1)",
                color: "var(--color-app-accent)",
                marginBottom: "0.75rem",
                width: "fit-content",
              }}>
                {post.category}
              </span>

              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-app-text-main)", marginBottom: "0.5rem", lineHeight: 1.3 }}>
                {post.title}
              </h3>

              <p style={{ fontSize: "0.82rem", color: "var(--color-app-text-muted)", lineHeight: 1.6, flex: 1, marginBottom: "1rem" }}>
                {post.excerpt}
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.7rem", color: "var(--color-app-text-light)" }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <span>{post.author}</span>
                  <span>•</span>
                  <span>{new Date(post.updatedAt || post.createdAt || post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <span>📖 {post.readTime}</span>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginTop: "3rem" }}>
            <button 
              onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo(0, 0); }} 
              disabled={page === 1} 
              style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid var(--color-app-border)", background: "var(--color-app-base)", color: "var(--color-app-text-main)", opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? "not-allowed" : "pointer" }}
            >
              Previous
            </button>
            <span style={{ fontSize: "0.9rem", color: "var(--color-app-text-muted)" }}>Page {page} of {totalPages}</span>
            <button 
              onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }} 
              disabled={page === totalPages} 
              style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid var(--color-app-border)", background: "var(--color-app-base)", color: "var(--color-app-text-main)", opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? "not-allowed" : "pointer" }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
