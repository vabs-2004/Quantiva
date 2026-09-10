export default function OutputConsole({ output }) {
  if (!output) return null;

  return (
    <div className="rounded-lg app-glass p-4">
      <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-app-accent)] flex items-center gap-1.5">
        <svg className="h-4 w-4 text-[var(--color-app-accent-hover)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Console Output
      </h4>

      <div className="app-console rounded-lg p-4 text-xs leading-relaxed max-w-full overflow-x-auto">
        {output.split("\n").map((line, i) => (
          <div key={i} className="flex gap-3">
            <span className="select-none text-[var(--color-app-text-muted)] opacity-40 min-w-[1.5rem] text-right">
              {String(i + 1).padStart(2, " ")}
            </span>
            <span
              className={
                line.includes("✓") || line.includes("successful") || line.includes("success")
                  ? "text-[var(--color-app-success)]"
                  : line.includes("Error") || line.includes("✗") || line.includes("error")
                  ? "text-[var(--color-app-error)]"
                  : line.startsWith("═")
                  ? "text-[var(--color-app-accent)] font-bold"
                  : "text-[var(--color-app-success)] opacity-80"
              }
            >
              {line || "\u00A0"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
