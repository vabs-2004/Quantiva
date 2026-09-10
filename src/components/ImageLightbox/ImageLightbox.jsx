import { useEffect } from "react";
import ReactDOM from "react-dom";

/**
 * Full-screen image lightbox overlay.
 * Click on the backdrop or press Escape to close.
 */
export default function ImageLightbox({ src, alt, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Prevent body scroll while lightbox is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-app-base)]/90 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-app-surface-hover)] text-[var(--color-app-text-muted)] hover:bg-[var(--color-app-surface-alt)] hover:text-[var(--color-app-text-main)] transition-colors border border-[var(--color-app-border)]"
        aria-label="Close"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Hint text */}
      <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-[var(--color-app-text-muted)]">
        Click anywhere or press Esc to close
      </span>

      {/* Image */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()} 
        className="max-h-[90vh] max-w-[95vw] rounded-xl shadow-2xl object-contain bg-white p-4"
      />
    </div>,
    document.body
  );
}
