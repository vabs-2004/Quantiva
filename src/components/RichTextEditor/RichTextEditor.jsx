import React, { useRef, useMemo, useEffect, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { marked } from 'marked';
import TurndownService from 'turndown';
import MathHTMLContainer from '../MathHTMLContainer/MathHTMLContainer';

export default function RichTextEditor({ value, onChange, placeholder }) {
  const quillRef = useRef(null);
  const fileInputRef = useRef(null);
  const [mode, setMode] = useState('visual'); // 'visual' | 'markdown' | 'preview'
  const [markdownText, setMarkdownText] = useState('');
  const turndownService = useMemo(() => {
    const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    td.keep(['iframe', 'video', 'source']);
    return td;
  }, []);

  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        try {
          // Dynamic import to avoid circular dependencies
          const { uploadImage, API_SERVER_URL } = await import('../../services/api');
          const res = await uploadImage(file);
          // Cloudinary returns full URL, local returns relative path
          const url = res.url.startsWith('http') ? res.url : `${API_SERVER_URL}${res.url}`;
          
          const quill = quillRef.current.getEditor();
          const range = quill.getSelection();
          const index = range ? range.index : quill.getLength();
          
          quill.insertEmbed(index, 'image', url);
          // Set custom class to the image so it matches our neon theme styling
          // Quill doesn't easily support adding classes to embedded images dynamically,
          // but our BlogViewer and EducationalTabs already handle image styling globally using prose!
          quill.setSelection(index + 1);
        } catch (error) {
          console.error("Image upload failed", error);
          const msg = error.response?.data?.error || "Failed to upload image. It might be too large or invalid.";
          alert(msg);
        }
      }
    };
  };

  useEffect(() => {
    // Add tooltips to Quill toolbar buttons
    const tooltips = {
      'ql-bold': 'Bold',
      'ql-italic': 'Italic',
      'ql-underline': 'Underline',
      'ql-strike': 'Strikethrough',
      'ql-list[value="ordered"]': 'Numbered List',
      'ql-list[value="bullet"]': 'Bulleted List',
      'ql-link': 'Insert Link',
      'ql-image': 'Insert Image',
      'ql-video': 'Insert Video',
      'ql-code-block': 'Insert Code Block',
      'ql-clean': 'Clear Formatting',
      'ql-header': 'Headers'
    };

    // A small delay to ensure toolbar is rendered
    // Bullet List icon (Dots)
    const bulletListIcon = document.querySelector('.ql-list[value="bullet"]');
    if (bulletListIcon) bulletListIcon.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`;

    setTimeout(() => {
      const toolbars = document.querySelectorAll('.ql-toolbar');
      toolbars.forEach(toolbar => {
        Object.keys(tooltips).forEach(selector => {
          const btns = toolbar.querySelectorAll(`button.${selector.split('[')[0]}, span.${selector.split('[')[0]}`);
          btns.forEach(btn => {
            // If the selector has a value attribute (like lists), check it
            if (selector.includes('[value=')) {
              const val = selector.match(/value="([^"]+)"/)[1];
              if (btn.value === val) {
                btn.setAttribute('title', tooltips[selector]);
              }
            } else {
              btn.setAttribute('title', tooltips[selector]);
            }
          });
        });
      });
    }, 100);
  }, []);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{'list': 'ordered'}, {'list': 'bullet'}],
        ['link', 'image', 'video', 'code-block'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), []);

  const handleModeToggle = (newMode) => {
    if (newMode === mode) return;

    // If leaving markdown, ensure value (HTML) is updated
    if (mode === 'markdown') {
      onChange(marked.parse(markdownText));
    }

    // If entering markdown, ensure markdownText is updated from HTML
    if (newMode === 'markdown') {
      setMarkdownText(turndownService.turndown(value || ''));
    }

    setMode(newMode);
  };

  const handleMarkdownChange = (e) => {
    const md = e.target.value;
    setMarkdownText(md);
    onChange(marked.parse(md));
  };

  const handleMarkdownUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const md = event.target.result;
      setMarkdownText(md);
      onChange(marked.parse(md));
      setMode('markdown');
    };
    reader.readAsText(file);
    e.target.value = ''; // reset input
  };

  return (
    <div className="bg-[var(--color-app-base)] text-black rounded overflow-hidden border border-[var(--color-app-border)] relative z-0 flex flex-col">
      <div className="flex justify-between items-center bg-gray-100 p-2 border-b border-[var(--color-app-border)] text-sm">
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => handleModeToggle('visual')}
            className={`px-3 py-1 rounded transition-colors ${mode === 'visual' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Visual
          </button>
          <button 
            type="button"
            onClick={() => handleModeToggle('markdown')}
            className={`px-3 py-1 rounded transition-colors ${mode === 'markdown' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Markdown
          </button>
          <button 
            type="button"
            onClick={() => handleModeToggle('preview')}
            className={`px-3 py-1 rounded transition-colors ${mode === 'preview' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Live Preview
          </button>
        </div>
        <div>
          <input 
            type="file" 
            accept=".md, .txt" 
            ref={fileInputRef} 
            onChange={handleMarkdownUpload} 
            className="hidden" 
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded transition-colors flex items-center gap-1"
            title="Upload a .md file"
          >
            <span>Upload .md</span>
          </button>
        </div>
      </div>

      {mode === 'visual' && (
        <ReactQuill 
          ref={quillRef}
          theme="snow" 
          value={value} 
          onChange={onChange}
          modules={modules}
          placeholder={placeholder}
          className="bg-[var(--color-app-base)] text-[var(--color-app-text-main)] flex-1"
        />
      )}
      
      {mode === 'markdown' && (
        <textarea
          value={markdownText}
          onChange={handleMarkdownChange}
          placeholder="Write or paste Markdown here..."
          className="w-full min-h-[400px] p-4 font-mono text-sm bg-[#0D1117] text-gray-100 focus:outline-none resize-y border-none"
          spellCheck="false"
        />
      )}
      
      {mode === 'preview' && (
        <div className="w-full min-h-[400px] p-8 bg-[var(--color-app-base)] overflow-y-auto">
          <div className="ql-editor p-0 text-[var(--color-app-text-main)]" style={{ minHeight: 'auto', fontSize: '1.05rem', lineHeight: '1.7' }}>
            <MathHTMLContainer html={value} />
          </div>
        </div>
      )}
      
      <style>{`
        .ql-container {
          min-height: 400px;
          font-family: inherit;
          font-size: 1rem;
        }
        .ql-editor {
          min-height: 400px;
          padding: 1.5rem;
        }
        .ql-toolbar {
          background-color: var(--color-app-surface) !important;
          border-color: var(--color-app-border) !important;
        }
        .ql-toolbar .ql-stroke {
          stroke: var(--color-app-text-main) !important;
        }
        .ql-toolbar .ql-fill {
          fill: var(--color-app-text-main) !important;
        }
        .ql-toolbar .ql-picker {
          color: var(--color-app-text-main) !important;
        }
        .ql-container.ql-snow {
          border-color: var(--color-app-border) !important;
        }
        /* Make the editor match the output prose styles */
        .ql-editor h1, .ql-editor h2, .ql-editor h3, .ql-editor h4 {
          color: var(--color-app-text-main);
          font-weight: 800;
          margin-bottom: 1rem;
          margin-top: 1.5rem;
        }
        .ql-editor p {
          color: var(--color-app-text-main);
          margin-bottom: 1rem;
          line-height: 1.7;
        }
        .ql-editor a {
          color: #60a5fa; /* blue-400 */
          text-decoration: underline;
        }
        .ql-editor img {
          border-radius: 0.75rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          margin: 1.5rem 0;
          max-width: 100%;
        }
        .ql-editor pre.ql-syntax {
          background-color: #0D1117;
          color: #C9D1D9;
          border-radius: 0.5rem;
          padding: 1rem;
          border: 1px solid var(--color-app-border);
        }
        .ql-editor iframe.ql-video {
          width: 100%;
          height: 400px;
          border-radius: 0.75rem;
          margin: 1.5rem 0;
        }
        .ql-editor.ql-blank::before {
          color: var(--color-app-text-muted) !important;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
