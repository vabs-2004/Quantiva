export default function AlgorithmCard({ algorithm, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all duration-200 block ${
        isActive
          ? "bg-[var(--color-app-primary-glow)] text-[var(--color-app-primary)] border-l-2 border-[var(--color-app-primary)] app-glow-border"
          : "text-[var(--color-app-text-light)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--color-app-text-main)] border-l-2 border-transparent"
      }`}
    >
      <div className={`font-semibold text-xs ${isActive ? "text-[var(--color-app-text-main)]" : ""}`}>
        {algorithm.name}
      </div>
      <div className={`text-xs mt-0.5 line-clamp-1 ${isActive ? "text-[var(--color-app-primary)]" : "text-[var(--color-app-text-muted)]"}`}>
        {algorithm.shortDescription}
      </div>
    </button>
  );
}
