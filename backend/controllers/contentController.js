const Doc = require("../models/Doc");
const Blog = require("../models/Blog");
const News = require("../models/News");
const { JSDOM } = require("jsdom");
const createDOMPurify = require("dompurify");
const { invalidateCache } = require("../middleware/cache");

// Create a DOMPurify instance for server-side HTML sanitization
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

// Sanitize HTML to prevent XSS while keeping safe formatting
function sanitizeHTML(html) {
  if (!html) return html;
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'pre', 'code', 'span', 'div', 'table',
      'thead', 'tbody', 'tr', 'th', 'td', 'sub', 'sup', 'hr', 'iframe', 'video', 'source'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel',
      'width', 'height', 'id', 'frameborder', 'allow', 'allowfullscreen', 'controls', 'type'],
    ALLOW_DATA_ATTR: false,
  });
}

// --- Docs ---
async function getDocs(req, res) {
  try {
    const docs = await Doc.find().sort({ sectionOrder: 1, order: 1, createdAt: 1 });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch docs." });
  }
}

async function addDoc(req, res) {
  try {
    const data = { ...req.body };
    if (data.content) data.content = sanitizeHTML(data.content);
    const doc = new Doc(data);
    await doc.save();
    await invalidateCache("docs");
    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ error: "Failed to add doc." });
  }
}

async function updateDoc(req, res) {
  try {
    const data = { ...req.body };
    if (data.content) data.content = sanitizeHTML(data.content);
    const doc = await Doc.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!doc) return res.status(404).json({ error: "Doc not found" });
    await invalidateCache("docs");
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: "Failed to update doc." });
  }
}

async function deleteDoc(req, res) {
  try {
    const doc = await Doc.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: "Doc not found" });
    await invalidateCache("docs");
    res.json({ message: "Doc deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete doc." });
  }
}

async function reorderDocs(req, res) {
  try {
    const updates = req.body.updates; // Expected array of { id, sectionOrder, order }
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: "Invalid updates payload" });
    }

    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { _id: update.id },
        update: { $set: { sectionOrder: update.sectionOrder, subsectionOrder: update.subsectionOrder || 0, order: update.order } }
      }
    }));

    await Doc.bulkWrite(bulkOps);
    await invalidateCache("docs");
    res.json({ message: "Docs reordered successfully" });
  } catch (error) {
    console.error("Reorder error:", error);
    res.status(500).json({ error: "Failed to reorder docs." });
  }
}

// --- Blogs ---
async function getBlogs(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 0; // 0 means no limit (backward compatibility)
    const search = req.query.search || "";

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } }
      ];
    }

    let blogsQuery = Blog.find(query).sort({ createdAt: -1 });
    
    if (limit > 0) {
      const skip = (page - 1) * limit;
      blogsQuery = blogsQuery.skip(skip).limit(limit);
    }

    const [blogs, totalBlogs] = await Promise.all([
      blogsQuery,
      Blog.countDocuments(query)
    ]);

    if (limit > 0) {
      res.json({
        data: blogs,
        currentPage: page,
        totalPages: Math.ceil(totalBlogs / limit),
        totalItems: totalBlogs
      });
    } else {
      res.json(blogs); // Backward compatibility
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch blogs." });
  }
}

async function addBlog(req, res) {
  try {
    const data = { ...req.body };
    if (data.content) data.content = sanitizeHTML(data.content);
    const blog = new Blog(data);
    await blog.save();
    await invalidateCache("blogs");
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ error: "Failed to add blog." });
  }
}

async function updateBlog(req, res) {
  try {
    const data = { ...req.body };
    if (data.content) data.content = sanitizeHTML(data.content);
    const blog = await Blog.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    await invalidateCache("blogs");
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: "Failed to update blog." });
  }
}

async function deleteBlog(req, res) {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    await invalidateCache("blogs");
    res.json({ message: "Blog deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete blog." });
  }
}

// --- News ---
async function getNews(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 0;
    const search = req.query.search || "";

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { summary: { $regex: search, $options: "i" } }
      ];
    }

    let newsQuery = News.find(query).sort({ createdAt: -1 });

    if (limit > 0) {
      const skip = (page - 1) * limit;
      newsQuery = newsQuery.skip(skip).limit(limit);
    }

    const [news, totalNews] = await Promise.all([
      newsQuery,
      News.countDocuments(query)
    ]);

    if (limit > 0) {
      res.json({
        data: news,
        currentPage: page,
        totalPages: Math.ceil(totalNews / limit),
        totalItems: totalNews
      });
    } else {
      res.json(news);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch news." });
  }
}

async function addNews(req, res) {
  try {
    const newsItem = new News(req.body);
    await newsItem.save();
    await invalidateCache("news");
    res.status(201).json(newsItem);
  } catch (error) {
    res.status(500).json({ error: "Failed to add news." });
  }
}

async function updateNews(req, res) {
  try {
    const newsItem = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!newsItem) return res.status(404).json({ error: "News not found" });
    await invalidateCache("news");
    res.json(newsItem);
  } catch (error) {
    res.status(500).json({ error: "Failed to update news." });
  }
}

async function deleteNews(req, res) {
  try {
    const newsItem = await News.findByIdAndDelete(req.params.id);
    if (!newsItem) return res.status(404).json({ error: "News not found" });
    await invalidateCache("news");
    res.json({ message: "News deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete news." });
  }
}

// --- Blog Interactions ---
async function likeBlog(req, res) {
  try {
    const blogId = req.params.id;
    const userId = req.user.id;

    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    // Check if user already liked
    const hasLiked = blog.likes.includes(userId);
    
    if (hasLiked) {
      // Unlike
      blog.likes = blog.likes.filter(id => id.toString() !== userId.toString());
    } else {
      // Like
      blog.likes.push(userId);
    }
    
    await blog.save();
    await invalidateCache("blogs");
    res.json({ message: hasLiked ? "Unliked" : "Liked", likes: blog.likes });
  } catch (error) {
    res.status(500).json({ error: "Failed to like blog." });
  }
}

async function commentBlog(req, res) {
  try {
    const blogId = req.params.id;
    const userId = req.user.id;
    const username = req.user.username; // Added by authenticate middleware
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    const newComment = {
      user: userId,
      username: username,
      text: text.trim(),
    };

    blog.comments.push(newComment);
    await blog.save();
    await invalidateCache("blogs");

    res.status(201).json({ message: "Comment added", comments: blog.comments });
  } catch (error) {
    res.status(500).json({ error: "Failed to add comment." });
  }
}

module.exports = {
  getDocs, addDoc, updateDoc, deleteDoc, reorderDocs,
  getBlogs, addBlog, updateBlog, deleteBlog, likeBlog, commentBlog,
  getNews, addNews, updateNews, deleteNews,
};
