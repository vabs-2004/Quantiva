export default function MeasurementTable({ measurements }) {
  if (!measurements || measurements.length === 0) return null;

  return (
    <div className="rounded-lg app-glass p-4">
      <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-app-accent)] flex items-center gap-1.5">
        <svg className="h-4 w-4 text-[var(--color-app-accent-hover)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M3 6h18M3 18h18" />
        </svg>
        Measurement Results
      </h4>

      <div className="overflow-x-auto rounded-lg border border-[var(--color-app-border)] max-w-2xl">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-[var(--color-app-surface-hover)] border-b border-[var(--color-app-border)]">
              <th className="px-4 py-2.5 font-bold text-[var(--color-app-primary)] text-xs uppercase tracking-wider">
                State
              </th>
              <th className="px-4 py-2.5 font-bold text-[var(--color-app-primary)] text-xs uppercase tracking-wider">
                Probability
              </th>
              <th className="px-4 py-2.5 font-bold text-[var(--color-app-primary)] text-xs uppercase tracking-wider">
                Count
              </th>
              <th className="px-4 py-2.5 font-bold text-[var(--color-app-primary)] text-xs uppercase tracking-wider w-1/3">
                Distribution
              </th>
            </tr>
          </thead>
          <tbody>
            {measurements.map((m, i) => (
              <tr
                key={i}
                className="border-b border-[var(--color-app-border)] hover:bg-[rgba(0,212,255,0.03)] transition-colors"
              >
                <td className="px-4 py-2.5 font-mono text-[var(--color-app-text-main)]">
                  {m.state}
                </td>
                <td className="px-4 py-2.5 font-mono text-[var(--color-app-accent)]">
                  {(m.probability * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-2.5 font-mono text-[var(--color-app-text-muted)]">
                  {m.count}
                </td>
                <td className="px-4 py-2.5">
                  <div className="h-2 w-full rounded-full bg-[var(--color-app-base)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--color-app-primary)] to-[var(--color-app-primary-hover)] transition-all duration-500"
                      style={{ width: `${m.probability * 100}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
