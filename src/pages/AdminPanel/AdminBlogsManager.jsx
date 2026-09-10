import { useState, useEffect, useRef } from "react";
import { getBlogs, createBlog, updateBlog, deleteBlog } from "../../services/api";
import RichTextEditor from "../../components/RichTextEditor/RichTextEditor";

export default function AdminBlogsManager() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  
  // Pagination & Search
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;
  
  const [formData, setFormData] = useState({
    title: "", category: "", readTime: "", date: "", author: "", excerpt: "", content: ""
  });
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchBlogs();
  }, [page, search]);

  async function fetchBlogs() {
    try {
      setLoading(true);
      const data = await getBlogs(page, limit, search);
      if (data.data) {
        setBlogs(data.data);
        setTotalPages(data.totalPages);
      } else {
        setBlogs(data);
        setTotalPages(1);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(item) {
    setEditingId(item._id);
    setFormData({
      title: item.title,
      category: item.category,
      readTime: item.readTime,
      date: item.date,
      author: item.author,
      excerpt: item.excerpt,
      content: item.content || ""
    });
  }

  function handleCancel() {
    setEditingId(null);
    setFormData({ title: "", category: "", readTime: "", date: "", author: "", excerpt: "", content: "" });
  }

  function handleUseTemplate() {
    setFormData(prev => ({
      ...prev,
      content: `<h2>Understanding [Topic]</h2>
<p>In this post, we will explore the core concepts of [Topic]...</p>
<h3>Deep Dive</h3>
<p>Let's look at the mathematics behind this:</p>
<pre class="ql-syntax" spellcheck="false"># Paste your Python code here
def quantum_func():
    pass
</pre>
<p><strong>Conclusion:</strong> We hope this helps you understand the topic better.</p>`
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validation
    const requiredFields = [
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
      { key: 'readTime', label: 'Read Time' },
      { key: 'date', label: 'Date' },
      { key: 'author', label: 'Author' },
      { key: 'excerpt', label: 'Excerpt' },
      { key: 'content', label: 'Content' }
    ];
    for (let field of requiredFields) {
      // For rich text, empty value is often '<p><br></p>' or empty string
      if (!formData[field.key] || formData[field.key] === '<p><br></p>') {
        alert(`Please fill the required field: ${field.label}`);
        return;
      }
    }

    try {
      if (editingId && editingId !== 'new') {
        await updateBlog(editingId, formData);
        alert("Blog updated successfully");
      } else {
        await createBlog(formData);
        alert("Blog created successfully");
      }
      handleCancel();
      fetchBlogs();
    } catch (err) {
      console.error(err);
      alert("Failed to save blog");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this blog?")) return;
    try {
      await deleteBlog(id);
      fetchBlogs();
    } catch (err) {
      console.error(err);
      alert("Failed to delete blog");
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const { uploadImage, API_SERVER_URL } = await import("../../services/api");
      const res = await uploadImage(file);
      const imgUrl = res.url.startsWith('http') ? res.url : `${API_SERVER_URL}${res.url}`;
      const imgTag = `\n<img src="${imgUrl}" alt="Uploaded Photo" class="my-4 rounded-lg shadow-lg border border-[var(--color-app-border)]" style="max-width: 100%; height: auto;" />\n`;
      setFormData(prev => ({...prev, content: prev.content + imgTag}));
      
    } catch (error) {
      console.error("Failed to upload image", error);
      const msg = error.response?.data?.error || "Failed to upload image. It might be too large or invalid.";
      alert(msg);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (!file) continue;
        
        e.preventDefault();
        try {
          setUploadingImage(true);
          const { uploadImage, API_SERVER_URL } = await import("../../services/api");
          const res = await uploadImage(file);
          const imgUrl = res.url.startsWith('http') ? res.url : `${API_SERVER_URL}${res.url}`;
          const imgTag = `\n<img src="${imgUrl}" alt="Pasted Photo" class="my-4 rounded-lg shadow-lg border border-[var(--color-app-border)]" style="max-width: 100%; height: auto;" />\n`;
          
          const textarea = e.target;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          
          if (start !== undefined && end !== undefined) {
            setFormData(prev => ({
              ...prev, 
              content: prev.content.substring(0, start) + imgTag + prev.content.substring(end)
            }));
            setTimeout(() => {
              textarea.selectionStart = textarea.selectionEnd = start + imgTag.length;
            }, 0);
          } else {
            setFormData(prev => ({...prev, content: prev.content + imgTag}));
          }
        } catch (error) {
          console.error("Failed to upload pasted image", error);
          alert("Failed to upload pasted image.");
        } finally {
          setUploadingImage(false);
        }
        break;
      }
    }
  };

  if (loading) return <div className="p-10 text-[var(--color-app-text-main)]">Loading...</div>;

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-app-base)] p-8 pb-24" data-lenis-prevent="true">
      <div className="max-w-5xl mx-auto text-[var(--color-app-text-main)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-3xl font-extrabold text-[var(--color-app-text-main)]">Blog Management</h1>
          <div className="flex gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search blogs..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full md:w-64 rounded-lg px-4 py-2 pl-10 text-sm outline-none transition-all"
                style={{ border: "1px solid var(--color-app-border)", background: "var(--color-app-base)", color: "var(--color-app-text-main)" }}
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-app-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={() => { handleCancel(); setEditingId('new'); }}
              className="px-4 py-2 bg-[var(--color-app-primary)] text-white rounded-lg hover:brightness-110 font-bold shadow-lg shadow-purple-500/20"
            >
              + Create Blog
            </button>
          </div>
        </div>

        {editingId && (
        <div className="bg-[var(--color-app-surface)] p-6 rounded-xl border border-[var(--color-app-border)] mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">{editingId !== 'new' ? "Edit Blog" : "Add New Blog"}</h2>
            {editingId === 'new' && (
              <button 
                type="button" 
                onClick={handleUseTemplate}
                className="px-3 py-1 bg-[var(--color-app-primary)]/10 text-[var(--color-app-primary)] text-sm font-semibold rounded hover:bg-[var(--color-app-primary)]/20 transition-colors"
              >
                + Start with Template
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input 
              type="text" placeholder="Title" required
              value={formData.title} onChange={e => setFormData(prev => ({...prev, title: e.target.value}))}
              className="p-3 bg-[var(--color-app-base)] border border-[var(--color-app-border)] rounded text-sm outline-none text-[var(--color-app-text-main)]"
            />
            <div className="flex gap-4">
              <input 
                type="text" placeholder="Category (e.g. Fundamentals)" required
                value={formData.category} onChange={e => setFormData(prev => ({...prev, category: e.target.value}))}
                className="flex-1 p-3 bg-[var(--color-app-base)] border border-[var(--color-app-border)] rounded text-sm outline-none text-[var(--color-app-text-main)]"
              />
              <input 
                type="text" placeholder="Author" required
                value={formData.author} onChange={e => setFormData(prev => ({...prev, author: e.target.value}))}
                className="flex-1 p-3 bg-[var(--color-app-base)] border border-[var(--color-app-border)] rounded text-sm outline-none text-[var(--color-app-text-main)]"
              />
              <input 
                type="text" placeholder="Date (e.g. Jul 10, 2026)" required
                value={formData.date} onChange={e => setFormData(prev => ({...prev, date: e.target.value}))}
                className="flex-1 p-3 bg-[var(--color-app-base)] border border-[var(--color-app-border)] rounded text-sm outline-none text-[var(--color-app-text-main)]"
              />
              <input 
                type="text" placeholder="Read Time (e.g. 8 min)" required
                value={formData.readTime} onChange={e => setFormData(prev => ({...prev, readTime: e.target.value}))}
                className="flex-1 p-3 bg-[var(--color-app-base)] border border-[var(--color-app-border)] rounded text-sm outline-none text-[var(--color-app-text-main)]"
              />
            </div>
            <textarea 
              placeholder="Excerpt (Short summary)" required rows="2"
              value={formData.excerpt} onChange={e => setFormData(prev => ({...prev, excerpt: e.target.value}))}
              className="p-3 bg-[var(--color-app-base)] border border-[var(--color-app-border)] rounded text-sm outline-none text-[var(--color-app-text-main)]"
            />
            
            <div className="flex flex-col gap-2">
              <span className="text-xs text-[var(--color-app-text-muted)] font-bold ml-2">Content Editor</span>
              <RichTextEditor 
                key={editingId || 'new_blog'}
                value={formData.content} 
                onChange={val => setFormData(prev => ({...prev, content: val}))} 
                placeholder="Write your blog post here... (LaTeX math is supported, just wrap in $$ $$)"
              />
            </div>
            
            <div className="flex gap-3 mt-4">
              <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded font-bold text-sm transition">
                {editingId !== 'new' ? "Update Blog" : "Add Blog"}
              </button>
              <button type="button" onClick={handleCancel} className="bg-[var(--color-app-surface-hover)] border border-[var(--color-app-border)] px-6 py-2 rounded font-bold text-sm text-[var(--color-app-text-main)]">
                Cancel
              </button>
            </div>
          </form>
        </div>
        )}

        <div className="flex flex-col gap-3">
          {blogs.map(item => (
            <div key={item._id} className="bg-[var(--color-app-surface)] border border-[var(--color-app-border)] p-4 rounded-lg flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-[var(--color-app-text-main)]">{item.title}</h3>
                <p className="text-xs text-[var(--color-app-text-muted)] mt-1">{item.category} • {item.author} • {item.date}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(item)} className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded hover:bg-blue-500/30">Edit</button>
                <button onClick={() => handleDelete(item._id)} className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded hover:bg-red-500/30">Delete</button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && !editingId && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-base)] text-[var(--color-app-text-main)] disabled:opacity-50 hover:bg-[rgba(255,255,255,0.05)]">Previous</button>
            <span className="text-sm font-medium text-[var(--color-app-text-muted)]">Page {page} of {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-lg border border-[var(--color-app-border)] bg-[var(--color-app-base)] text-[var(--color-app-text-main)] disabled:opacity-50 hover:bg-[rgba(255,255,255,0.05)]">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
