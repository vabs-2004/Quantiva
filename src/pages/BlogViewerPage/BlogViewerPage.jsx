import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import MathHTMLContainer from "../../components/MathHTMLContainer/MathHTMLContainer";
import { getBlogs, likeBlog, commentBlog } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function BlogViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedImage, setExpandedImage] = useState(null);
  const { user, isLoggedIn } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  useEffect(() => {
    async function loadBlog() {
      try {
        const blogs = await getBlogs();
        const found = blogs.find(b => b._id === id);
        if (found) {
          setBlog(found);
        }
      } catch (err) {
        console.error("Failed to load blog", err);
      } finally {
        setLoading(false);
      }
    }
    loadBlog();
  }, [id]);

  const handleLike = async () => {
    if (!isLoggedIn) {
      alert("Please login to like this blog.");
      return;
    }
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      const res = await likeBlog(id);
      // Optimistically update the blog
      setBlog(prev => ({ ...prev, likes: res.likes }));
    } catch (error) {
      console.error("Failed to like", error);
      alert("Failed to like blog.");
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert("Blog link copied to clipboard!");
    }).catch(() => {
      alert("Failed to copy link.");
    });
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      alert("Please login to comment.");
      return;
    }
    if (!commentText.trim()) return;

    setIsCommenting(true);
    try {
      const res = await commentBlog(id, commentText);
      setBlog(prev => ({ ...prev, comments: res.comments }));
      setCommentText("");
    } catch (error) {
      console.error("Failed to comment", error);
      alert("Failed to post comment.");
    } finally {
      setIsCommenting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-app-base)] text-[var(--color-app-text-main)]">
        <Navbar />
        <div className="flex justify-center items-center h-[60vh]">Loading blog...</div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-[var(--color-app-base)] text-[var(--color-app-text-main)] flex flex-col">
        <Navbar />
        <div className="flex flex-col justify-center items-center flex-1">
          <h2 className="text-2xl font-bold mb-4">Blog not found</h2>
          <button onClick={() => navigate("/blogs")} className="text-blue-400 hover:underline">
            ← Back to Blogs
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
          onClick={() => navigate("/blogs")} 
          className="text-[var(--color-app-text-muted)] hover:text-[var(--color-app-text-main)] transition-colors mb-8 flex items-center gap-2 text-sm"
        >
          <span>←</span> Back to all blogs
        </button>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <header className="mb-10 pb-10 border-b border-[var(--color-app-border)]">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                {blog.category}
              </span>
              <span className="text-[var(--color-app-text-muted)] text-sm">
                📖 {blog.readTime}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
              {blog.title}
            </h1>
            
            <div className="flex items-center gap-4 text-[var(--color-app-text-light)]">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-blue-400 border border-blue-500/30">
                {blog.author.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-[var(--color-app-text-main)]">{blog.author}</p>
                <p className="text-sm">{new Date(blog.updatedAt || blog.createdAt || blog.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          </header>

          <div className="ql-snow">
            <div className="ql-editor p-0 text-[var(--color-app-text-main)]" style={{ minHeight: 'auto', fontSize: '1.05rem', lineHeight: '1.7' }}>
              <MathHTMLContainer html={blog.content} onImageClick={setExpandedImage} />
            </div>
          </div>

          {/* --- Action Bar --- */}
          <div className="mt-12 py-6 border-t border-[var(--color-app-border)] flex items-center gap-4">
            <button 
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                blog.likes?.includes(user?.id) 
                  ? "bg-red-500/20 border-red-500/50 text-red-400" 
                  : "bg-[var(--color-app-surface)] border-[var(--color-app-border)] hover:bg-[var(--color-app-surface-hover)] text-[var(--color-app-text-main)]"
              }`}
            >
              <span>{blog.likes?.includes(user?.id) ? '❤️' : '🤍'}</span>
              <span className="font-bold">{blog.likes?.length || 0}</span>
            </button>

            <button 
              onClick={() => document.getElementById("comments-section").scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-app-border)] bg-[var(--color-app-surface)] hover:bg-[var(--color-app-surface-hover)] text-[var(--color-app-text-main)] transition-colors"
            >
              <span>💬</span>
              <span className="font-bold">{blog.comments?.length || 0}</span>
            </button>

            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--color-app-border)] bg-[var(--color-app-surface)] hover:bg-[var(--color-app-surface-hover)] text-[var(--color-app-text-main)] transition-colors ml-auto"
            >
              <span>🔗 Share</span>
            </button>
          </div>

          {/* --- Comments Section --- */}
          <div id="comments-section" className="mt-12 pt-8 border-t border-[var(--color-app-border)]">
            <h3 className="text-2xl font-bold mb-6">Comments</h3>
            
            {isLoggedIn ? (
              <form onSubmit={handleCommentSubmit} className="mb-8">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full bg-[var(--color-app-surface)] border border-[var(--color-app-border)] rounded-xl p-4 text-[var(--color-app-text-main)] focus:outline-none focus:border-blue-500 transition-colors resize-y min-h-[100px]"
                />
                <button 
                  type="submit" 
                  disabled={isCommenting || !commentText.trim()}
                  className="mt-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-bold transition-colors"
                >
                  {isCommenting ? "Posting..." : "Post Comment"}
                </button>
              </form>
            ) : (
              <div className="bg-[var(--color-app-surface)] border border-[var(--color-app-border)] rounded-xl p-6 text-center mb-8">
                <p className="text-[var(--color-app-text-muted)] mb-3">You must be logged in to leave a comment.</p>
                <button onClick={() => navigate("/login")} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-bold transition-colors">
                  Log In
                </button>
              </div>
            )}

            <div className="space-y-6">
              {(!blog.comments || blog.comments.length === 0) ? (
                <p className="text-[var(--color-app-text-muted)] italic">No comments yet. Be the first to share your thoughts!</p>
              ) : (
                blog.comments.slice().reverse().map((comment, index) => (
                  <div key={index} className="bg-[var(--color-app-surface)] border border-[var(--color-app-border)] rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center font-bold text-purple-400 border border-purple-500/30 text-sm">
                        {comment.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-[var(--color-app-text-main)] text-sm">{comment.username}</p>
                        <p className="text-xs text-[var(--color-app-text-muted)]">
                          {new Date(comment.date).toLocaleDateString()} at {new Date(comment.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                    <p className="text-[var(--color-app-text-light)] whitespace-pre-wrap">{comment.text}</p>
                  </div>
                ))
              )}
            </div>
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
