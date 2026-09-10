import React, { useState } from "react";
import { useAlgorithmContext } from "../../context/AlgorithmContext";
import { useAlgorithm } from "../../hooks/useAlgorithm";
import ParameterInput from "../ParameterInput/ParameterInput";
import Button from "../Button/Button";
import ImageLightbox from "../ImageLightbox/ImageLightbox";

export default function BlochImageViewer({ blochImage }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const { selectedAlgorithm, parameters, updateParameter, result } = useAlgorithmContext();
  const { execute, isRunning } = useAlgorithm();

  if (!blochImage && !result?.blochImage) return null;

  const currentImage = result?.blochImage || blochImage;

  return (
    <>
      <div 
        className="app-glass rounded-xl p-4 overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-[1.02] border-2 border-transparent hover:border-[var(--color-app-primary)]"
        onClick={() => setIsModalOpen(true)}
        title="Click to open full-screen tuner"
      >
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-app-accent)] w-full text-center border-b border-[var(--color-app-border)] pb-2">
          2D Bloch Sphere (Click to Tune)
        </p>
        <div className="w-full overflow-x-auto custom-scrollbar flex justify-center">
          <img
            src={`data:image/png;base64,${currentImage}`}
            alt="Qiskit Bloch Sphere Output"
            className="max-h-64 object-contain invert brightness-90 hue-rotate-180"
          />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="bg-[var(--color-app-base)] border border-[var(--color-app-border)] rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-[var(--color-app-surface)] px-6 py-4 border-b border-[var(--color-app-border)]">
              <h2 className="text-sm font-bold text-[var(--color-app-primary)] flex items-center gap-2">
                Bloch Sphere Tuner — {selectedAlgorithm?.name}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--color-app-text-muted)] hover:text-white bg-[var(--color-app-surface-hover)] p-2 rounded-lg"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
              
              {/* Left Side: Parameters */}
              <div className="w-full lg:w-1/3 border-r border-[var(--color-app-border)] p-6 overflow-y-auto bg-[var(--color-app-surface)]" data-lenis-prevent="true">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-app-accent)]">
                  Algorithm Parameters
                </h3>
                <ParameterInput
                  parameters={selectedAlgorithm?.parameters || []}
                  values={parameters}
                  onChange={updateParameter}
                />
                
                <div className="mt-8">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    loading={isRunning}
                    onClick={execute}
                  >
                    {isRunning ? "Running..." : "Update Bloch Sphere"}
                  </Button>
                </div>
              </div>

              {/* Right Side: Image */}
              <div className="w-full lg:w-2/3 p-6 flex flex-col items-center justify-center bg-black/40">
                {isRunning ? (
                  <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="h-12 w-12 rounded-full border-4 border-[var(--color-app-primary)] border-t-transparent animate-spin" />
                    <p className="text-xs font-bold text-[var(--color-app-primary)] uppercase tracking-widest">
                      Simulating Circuit...
                    </p>
                  </div>
                ) : (
                  currentImage && (
                    <div 
                      className="cursor-zoom-in group flex flex-col items-center"
                      onClick={() => setShowFullImage(true)}
                      title="Click to view full size"
                    >
                      <img
                        src={`data:image/png;base64,${currentImage}`}
                        alt="Qiskit Bloch Sphere Output"
                        className="max-w-full max-h-full object-contain invert brightness-90 hue-rotate-180 drop-shadow-2xl transition-transform duration-200 group-hover:scale-[1.02]"
                      />
                      <p className="mt-4 text-xs text-[var(--color-app-text-muted)] group-hover:text-white transition-colors">
                        Click image to expand
                      </p>
                    </div>
                  )
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {showFullImage && currentImage && (
        <ImageLightbox
          src={`data:image/png;base64,${currentImage}`}
          alt="Bloch Sphere — Full View"
          onClose={() => setShowFullImage(false)}
        />
      )}
    </>
  );
}
