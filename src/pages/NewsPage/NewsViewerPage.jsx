import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import MathHTMLContainer from "../../components/MathHTMLContainer/MathHTMLContainer";
import { getNews } from "../../services/api";

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

export default function NewsViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [newsItem, setNewsItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedImage, setExpandedImage] = useState(null);

  useEffect(() => {
    async function loadNews() {
      try {
        const newsList = await getNews();
        const found = newsList.find(n => n._id === id);
        if (found) {
          setNewsItem(found);
        }
      } catch (err) {
        console.error("Failed to load news", err);
      } finally {
        setLoading(false);
      }
    }
    loadNews();
  }, [id]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert("News link copied to clipboard!");
    }).catch(() => {
      alert("Failed to copy link.");
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-app-base)] text-[var(--color-app-text-main)]">
        <Navbar />
        <div className="flex justify-center items-center h-[60vh]">Loading news...</div>
      </div>
    );
  }

  if (!newsItem) {
    return (
      <div className="min-h-screen bg-[var(--color-app-base)] text-[var(--color-app-text-main)] flex flex-col">
        <Navbar />
        <div className="flex flex-col justify-center items-center flex-1">
          <h2 className="text-2xl font-bold mb-4">News not found</h2>
          <button onClick={() => navigate("/news")} className="text-blue-400 hover:underline">
            ← Back to News
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-app-base)] text-[var(--color-app-text-main)] flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 md:py-20">
        <button 
          onClick={() => navigate("/news")} 
          className="text-[var(--color-app-text-muted)] hover:text-[var(--color-app-text-main)] transition-colors mb-8 flex items-center gap-2 text-sm"
        >
          <span>←</span> Back to all news
        </button>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <header className="mb-10 pb-10 border-b border-[var(--color-app-border)]">
            <div className="flex items-center gap-3 mb-6">
              <span style={{
                display: "inline-block",
                padding: "0.2rem 0.75rem",
                borderRadius: 999,
                fontSize: "0.65rem",
                fontWeight: 700,
                textTransform: "uppercase",
                background: `${tagColors[newsItem.tag] || "#3b82f6"}20`,
                color: tagColors[newsItem.tag] || "#3b82f6",
                border: `1px solid ${tagColors[newsItem.tag] || "#3b82f6"}30`
              }}>
                {newsItem.isFeatured ? "🔥 Featured — " : ""}{newsItem.tag}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
              {newsItem.title}
            </h1>
            
            <div className="flex items-center gap-4 text-[var(--color-app-text-light)]">
              <div>
                <p className="font-medium text-[var(--color-app-text-main)]">{newsItem.source}</p>
                <p className="text-sm">{new Date(newsItem.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || newsItem.date}</p>
              </div>
            </div>
          </header>

          <div className="ql-snow">
            <div className="ql-editor p-0 text-[var(--color-app-text-main)]" style={{ minHeight: 'auto', fontSize: '1.05rem', lineHeight: '1.7' }}>
              {newsItem.content ? (
                <MathHTMLContainer html={newsItem.content} onImageClick={setExpandedImage} />
              ) : (
                <p>{newsItem.excerpt}</p>
              )}
            </div>
          </div>

          {/* --- Action Bar --- */}
          <div className="mt-12 py-6 border-t border-[var(--color-app-border)] flex items-center gap-4">
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-app-border)] bg-[var(--color-app-surface)] hover:bg-[var(--color-app-surface-hover)] text-[var(--color-app-text-main)] transition-colors"
            >
              <span>🔗 Share</span>
            </button>
          </div>
        </motion.article>
      </main>

      <Footer />

      {expandedImage && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 cursor-zoom-out"
          onClick={() => setExpandedImage(null)}
        >
          <img 
            src={expandedImage} 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/20" 
            alt="Expanded view" 
          />
          <button 
            className="absolute top-6 right-6 text-white bg-black/50 hover:bg-black/80 rounded-full w-10 h-10 flex items-center justify-center transition-colors border border-white/10"
            onClick={() => setExpandedImage(null)}
          >
            ✕
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
