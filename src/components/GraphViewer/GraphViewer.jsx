import { useState } from "react";
import ImageLightbox from "../ImageLightbox/ImageLightbox";

export default function GraphViewer({ graphData }) {
  const [showFullView, setShowFullView] = useState(false);

  if (!graphData || typeof graphData !== "string") {
    return (
      <div className="rounded-lg app-glass p-4">
        <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-app-accent)] flex items-center gap-1.5">
          <svg className="h-4 w-4 text-[var(--color-app-accent-hover)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l-2 2M15 19V9l-2 2M21 19V4l-2 2M3 19h18" />
          </svg>
          Probability Distribution
        </h4>
        <div className="flex h-32 items-center justify-center text-xs text-[var(--color-app-text-muted)] italic">
          Run the algorithm to see the probability distribution.
        </div>
      </div>
    );
  }

  const imgSrc = graphData.startsWith("data:image") ? graphData : `data:image/png;base64,${graphData}`;

  return (
    <>
      <div className="rounded-lg app-glass p-4">
        <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-app-accent)] flex items-center gap-1.5">
          <svg className="h-4 w-4 text-[var(--color-app-accent-hover)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l-2 2M15 19V9l-2 2M21 19V4l-2 2M3 19h18" />
          </svg>
          Probability Distribution
        </h4>

        <div
          className="flex justify-center p-3 bg-white/95 rounded-lg cursor-zoom-in group"
          onClick={() => setShowFullView(true)}
          title="Click to view full size"
        >
          <img
            src={imgSrc}
            alt="Probability Distribution"
            className="max-w-full h-auto rounded transition-transform duration-200 group-hover:scale-[1.02]"
          />
        </div>

        <p className="mt-2 text-xs text-[var(--color-app-text-muted)] text-center">
          Click image to expand
        </p>
      </div>

      {showFullView && (
        <ImageLightbox
          src={imgSrc}
          alt="Probability Distribution — Full View"
          onClose={() => setShowFullView(false)}
        />
      )}
    </>
  );
}
