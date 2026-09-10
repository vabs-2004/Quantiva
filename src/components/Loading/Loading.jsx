
/**
 * Full-screen loading overlay with animated quantum spinner.
 *
 * @param {boolean} visible — controls visibility
 * @param {string}  message — optional status message
 */
export default function Loading({ visible = false, message = "Running quantum simulation..." }) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-app-base)]/85 backdrop-blur-md">
      <div className="flex flex-col items-center gap-5 rounded-2xl app-glass px-12 py-10 shadow-2xl shadow-[rgba(0,212,255,0.05)]">
        {/* Animated quantum rings */}
        <div className="relative h-20 w-20">
          <div
            className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[var(--color-app-primary)]"
            style={{ animationDuration: "1s" }}
          />
          <div
            className="absolute inset-1.5 animate-spin rounded-full border-2 border-transparent border-t-[var(--color-app-accent)]"
            style={{ animationDuration: "1.5s", animationDirection: "reverse" }}
          />
          <div
            className="absolute inset-3 animate-spin rounded-full border-2 border-transparent border-t-[var(--color-app-primary-hover)]"
            style={{ animationDuration: "2s" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--color-app-primary)]" />
          </div>
        </div>

        <p className="text-xs font-semibold text-[var(--color-app-text-main)]">{message}</p>
        <p className="text-xs text-[var(--color-app-text-muted)]">Processing qubits...</p>
      </div>
    </div>
  );
}
