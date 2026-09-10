export default function FormulaCard({ formula, timeComplexity, spaceComplexity }) {
  return (
    <div className="rounded-lg app-glass p-4">
      {formula && (
        <div className="mb-3">
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-app-accent)]">
            Formula
          </h4>
          <p className="mt-1 font-mono text-xs text-[var(--color-app-primary)]">{formula}</p>
        </div>
      )}

      <div className="flex gap-6">
        {timeComplexity && (
          <div>
            <span className="text-xs text-[var(--color-app-text-muted)]">Time: </span>
            <span className="text-xs font-mono font-bold text-[var(--color-app-text-main)]">
              {timeComplexity}
            </span>
          </div>
        )}
        {spaceComplexity && (
          <div>
            <span className="text-xs text-[var(--color-app-text-muted)]">Space: </span>
            <span className="text-xs font-mono font-bold text-[var(--color-app-text-main)]">
              {spaceComplexity}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
