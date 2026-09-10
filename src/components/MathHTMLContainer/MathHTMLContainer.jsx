import { useLayoutEffect, useRef } from "react";
import renderMathInElement from "katex/dist/contrib/auto-render";
import "katex/dist/katex.min.css";

export default function MathHTMLContainer({ html, onImageClick }) {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = html;
      
      if (onImageClick) {
        const images = containerRef.current.querySelectorAll("img");
        images.forEach(img => {
          // If the image is inside a link, let the link handle the click
          if (img.closest('a')) {
            return;
          }
          img.style.cursor = "zoom-in";
          img.onclick = (e) => {
            e.preventDefault();
            onImageClick(img.src);
          };
        });
      }

      // Add Copy Buttons to all <pre> tags
      const pres = containerRef.current.querySelectorAll("pre");
      pres.forEach(pre => {
        pre.style.position = "relative";
        if (pre.querySelector('.code-copy-btn')) return;

        const btn = document.createElement("button");
        btn.className = "code-copy-btn";
        btn.title = "Copy to clipboard";
        const copyIcon = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>`;
        const checkIcon = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7"></path></svg>`;
        btn.innerHTML = copyIcon;
        
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          const code = pre.querySelector('code');
          const text = code ? code.innerText : pre.innerText.replace('Copy', '').trim();
          navigator.clipboard.writeText(text).then(() => {
            btn.innerHTML = checkIcon;
            btn.classList.add("copied");
            setTimeout(() => {
              btn.innerHTML = copyIcon;
              btn.classList.remove("copied");
            }, 2000);
          });
        };
        pre.appendChild(btn);
      });

      try {
        renderMathInElement(containerRef.current, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true },
          ],
          throwOnError: false,
        });
      } catch (e) {
        console.error("KaTeX error:", e);
      }
    }
  }, [html, onImageClick]);

  return (
    <>
      <div 
        ref={containerRef} 
        className="math-html-content w-full overflow-hidden break-words"
        style={{
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          whiteSpace: 'pre-wrap'
        }}
      />
      <style>{`
        .math-html-content p {
          white-space: pre-wrap !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
        }
        .code-copy-btn {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: transparent;
          border: none;
          color: #8c8c8c;
          padding: 0.25rem;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 10;
        }
        .code-copy-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }
        .code-copy-btn.copied {
          color: #4ade80; /* green-400 */
        }
        /* Ensure standard padding for pre so button doesn't overlap text */
        .math-html-content pre {
          background-color: #161616 !important;
          color: #f4f4f4 !important;
          border-radius: 0 !important;
          border: 1px solid #333333 !important;
          padding: 1.25rem !important;
          padding-right: 3rem !important;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
          font-size: 0.85rem !important;
          margin-top: 1.5rem !important;
          margin-bottom: 1.5rem !important;
        }
        .math-html-content pre code {
          background: transparent !important;
          color: inherit !important;
          padding: 0 !important;
        }
      `}</style>
    </>
  );
}
