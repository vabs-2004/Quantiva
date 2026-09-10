import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import MathHTMLContainer from "../../components/MathHTMLContainer/MathHTMLContainer";
import { getDocs } from "../../services/api";
import "react-quill-new/dist/quill.snow.css";
import "./DocsPage.css";

// Default content for topics not yet written
const defaultContent = {
  title: "Coming Soon",
  content: `This section is currently being developed. Check back soon for comprehensive quantum computing documentation.

### What to Expect

This section will cover the topic in detail with:
- Clear explanations with visual diagrams
- Mathematical formulations
- Practical code examples in Qiskit
- Interactive exercises

In the meantime, explore the other available topics in the sidebar.`,
  code: `# Example code will appear here
# when this section is completed`,
};

export default function DocsPage() {
  const [activeTopic, setActiveTopic] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDocs() {
      try {
        const data = await getDocs();
        setDocs(data);
        if (data.length > 0) {
          setActiveTopic(data[0]._id);
        }
      } catch (err) {
        console.error("Failed to load docs", err);
      } finally {
        setLoading(false);
      }
    }
    loadDocs();
  }, []);

  const [expandedSubsections, setExpandedSubsections] = useState(new Set());

  useEffect(() => {
    if (activeTopic) {
      const activeDoc = docs.find(d => d._id === activeTopic);
      if (activeDoc && activeDoc.subsection) {
        setExpandedSubsections(prev => {
          const newSet = new Set(prev);
          newSet.add(activeDoc.subsection);
          return newSet;
        });
      }
    }
  }, [activeTopic, docs]);

  const toggleSubsection = (subName) => {
    setExpandedSubsections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subName)) {
        newSet.delete(subName);
      } else {
        newSet.add(subName);
      }
      return newSet;
    });
  };

  // Group docs by section
  const docsSidebar = [];
  const flatDocs = [];
  
  const sortedDocs = [...docs].sort((a, b) => {
    if (a.sectionOrder !== b.sectionOrder) return (a.sectionOrder || 0) - (b.sectionOrder || 0);
    if ((a.subsectionOrder || 0) !== (b.subsectionOrder || 0)) return (a.subsectionOrder || 0) - (b.subsectionOrder || 0);
    return (a.order || 0) - (b.order || 0);
  });
  
  sortedDocs.forEach(doc => {
    let section = docsSidebar.find(s => s.section === doc.section);
    if (!section) {
      section = { section: doc.section, items: [], subsections: [] };
      docsSidebar.push(section);
    }
    
    const item = { id: doc._id, title: doc.title, subsection: doc.subsection };
    
    if (doc.subsection && doc.subsection.trim() !== "") {
      let subsection = section.subsections.find(s => s.name === doc.subsection);
      if (!subsection) {
        subsection = { name: doc.subsection, items: [] };
        section.subsections.push(subsection);
      }
      subsection.items.push(item);
    } else {
      section.items.push(item);
    }
    
    flatDocs.push(item);
  });

  const activeDoc = docs.find(d => d._id === activeTopic);
  const currentContent = activeDoc ? {
    title: activeDoc.title,
    content: activeDoc.content,
    code: "" // Optional: can add code field to DB later if needed
  } : defaultContent;

  const currentIndex = flatDocs.findIndex(item => item.id === activeTopic);
  const prevDoc = currentIndex > 0 ? flatDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex !== -1 && currentIndex < flatDocs.length - 1 ? flatDocs[currentIndex + 1] : null;

  if (loading) {
    return (
      <div className="docs-page bg-[var(--color-app-base)] min-h-screen">
        <Navbar />
        <div className="flex justify-center items-center h-[60vh] text-[var(--color-app-text-main)]">Loading docs...</div>
      </div>
    );
  }

  return (
    <div className="docs-page">
      <Navbar />

      <div className="docs-layout">
        {/* Sidebar */}
        <motion.aside
          className={`docs-sidebar ${sidebarOpen ? "open" : "collapsed"}`}
          initial={false}
          animate={{ width: sidebarOpen ? 280 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="docs-sidebar-header">
            <h3 className="docs-sidebar-title">📚 Qiskit Reference</h3>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="docs-sidebar-toggle">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <nav className="docs-sidebar-nav" data-lenis-prevent="true">
            {docsSidebar.map((section) => (
              <div key={section.section} className="docs-sidebar-section">
                <h4 className="docs-sidebar-section-title">{section.section}</h4>
                
                {/* Top-level items in this section */}
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    className={`docs-sidebar-item ${activeTopic === item.id ? "active" : ""}`}
                    onClick={() => setActiveTopic(item.id)}
                  >
                    {item.title}
                  </button>
                ))}

                {/* Subsections */}
                {section.subsections && section.subsections.map((sub) => (
                  <div key={sub.name} className="docs-sidebar-subsection">
                    <button 
                      className={`docs-sidebar-subsection-title docs-sidebar-item flex justify-between items-center w-full ${sub.items.some(i => i.id === activeTopic) ? "text-white" : ""}`}
                      onClick={() => toggleSubsection(sub.name)}
                    >
                      <span>{sub.name}</span>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ transform: expandedSubsections.has(sub.name) ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    <div 
                      className="docs-sidebar-subsection-items-container"
                      style={{ 
                        display: 'grid', 
                        gridTemplateRows: expandedSubsections.has(sub.name) ? '1fr' : '0fr',
                        transition: 'grid-template-rows 0.2s ease-out'
                      }}
                    >
                      <div className="overflow-hidden">
                        <div className="pl-3 border-l border-[var(--color-app-border)] ml-3 mt-1 mb-1 flex flex-col gap-1">
                          {sub.items.map((item) => (
                            <button
                              key={item.id}
                              className={`docs-sidebar-item sub-item ${activeTopic === item.id ? "active" : ""}`}
                              onClick={() => setActiveTopic(item.id)}
                            >
                              {item.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </nav>
        </motion.aside>

        {/* Toggle button when collapsed */}
        {!sidebarOpen && (
          <button onClick={() => setSidebarOpen(true)} className="docs-sidebar-open-btn">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Main Content */}
        <main className="docs-content" data-lenis-prevent="true">
          <motion.article
            key={activeTopic}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="docs-article"
          >
            <h1 className="docs-article-title">{currentContent.title}</h1>

            <div className="docs-article-body ql-snow">
              <div className="ql-editor p-0 text-[var(--color-app-text-main)]" style={{ minHeight: 'auto', fontSize: '1.05rem', lineHeight: '1.7' }}>
                <MathHTMLContainer html={currentContent.content} />
              </div>
            </div>

            {/* Code Example (Legacy support) */}
            {currentContent.code && (
              <div className="docs-code-block">
                <div className="docs-code-header">
                  <span>💻 Example Code (Qiskit)</span>
                  <span className="docs-code-lang">Python</span>
                </div>
                <pre className="docs-code-pre">
                  <code>{currentContent.code}</code>
                </pre>
              </div>
            )}

            {/* Navigation */}
            <div className="docs-nav-bottom">
              {prevDoc ? (
                <button onClick={() => setActiveTopic(prevDoc.id)} className="docs-nav-btn prev">
                  <span className="docs-nav-label">Previous</span>
                  <span className="docs-nav-title">« {prevDoc.title}</span>
                </button>
              ) : <div className="docs-nav-placeholder flex-1" />}

              {nextDoc ? (
                <button onClick={() => setActiveTopic(nextDoc.id)} className="docs-nav-btn next">
                  <span className="docs-nav-label">Next</span>
                  <span className="docs-nav-title">{nextDoc.title} »</span>
                </button>
              ) : <div className="docs-nav-placeholder flex-1" />}
            </div>
          </motion.article>
        </main>
      </div>

      <Footer />
    </div>
  );
}
