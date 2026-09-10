import { useNavigate } from "react-router-dom";
import { useAlgorithmContext } from "../../context/AlgorithmContext";
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION, APP_ORG } from "../../utils/constants";
import { CATEGORIES } from "../../data/algorithms";

export default function Home() {
  const { algorithmList } = useAlgorithmContext();
  const navigate = useNavigate();

  const categoryCount = new Set(algorithmList.map((a) => a.category)).size;

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-app-base)] px-6 py-10">
      <div className="mx-auto max-w-5xl">

        {/* Hero Section */}
        <header className="mb-12 relative">
          {/* Decorative particles */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[var(--color-app-primary)]/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-20 w-48 h-48 rounded-full bg-[var(--color-app-accent)]/5 blur-3xl pointer-events-none" />
          
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-app-accent)]/30 bg-[var(--color-app-accent)]/10 px-4 py-1.5 mb-4">
              <svg className="h-3.5 w-3.5 text-[var(--color-app-accent)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-app-accent)]">
                {APP_ORG}
              </span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-[var(--color-app-text-main)] mb-3">
              {APP_NAME}
            </h1>
            <p className="text-xs font-medium text-[var(--color-app-primary)]">
              {APP_TAGLINE}
            </p>
            <p className="mt-3 text-xs text-[var(--color-app-text-light)] leading-relaxed max-w-2xl">
              {APP_DESCRIPTION}
            </p>

            {/* Stats Row */}
            <div className="mt-8 flex gap-4">
              <StatCard label="Algorithms" value={algorithmList.length} icon="⚛" />
              <StatCard label="Categories" value={categoryCount} icon="◈" />
              <StatCard label="Qiskit Powered" value="✓" icon="⟁" />
            </div>
          </div>

          <div className="mt-8 app-gradient-line" />
        </header>

        {/* Quick Actions */}
        <div className="mb-10 flex gap-3">
          <button
            onClick={() => navigate("/algorithm/grover-search")}
            className="rounded-lg bg-gradient-to-r from-[var(--color-app-primary)] to-[var(--color-app-primary-hover)] px-5 py-2.5 text-xs font-bold text-[var(--color-app-base)] hover:shadow-lg hover:shadow-[rgba(0,212,255,0.2)] transition-all"
          >
            Start with Grover's Search →
          </button>
          <button
            onClick={() => navigate("/sandbox")}
            className="rounded-lg border border-[var(--color-app-accent)]/30 bg-[var(--color-app-accent)]/10 px-5 py-2.5 text-xs font-bold text-[var(--color-app-accent)] hover:bg-[var(--color-app-accent)]/20 transition-all"
          >
            Open Sandbox
          </button>
        </div>

        {/* Categories Grid */}
        <section className="space-y-8">
          <h2 className="text-xs font-bold text-[var(--color-app-text-main)]">
            All Algorithms
          </h2>

          {Object.values(CATEGORIES).map((category) => {
            const algos = algorithmList.filter((a) => a.category === category);
            if (algos.length === 0) return null;

            return (
              <div key={category} className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--color-app-accent)] border-b border-[var(--color-app-border)] pb-2">
                  {category}
                </h3>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {algos.map((algo) => (
                    <AlgoGridCard
                      key={algo.id}
                      algorithm={algo}
                      onClick={() => navigate(`/algorithm/${algo.id}`)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────── */

function StatCard({ label, value, icon }) {
  return (
    <div className="app-glass rounded-lg px-5 py-3 min-w-[120px]">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs">{icon}</span>
        <span className="text-xs font-extrabold text-[var(--color-app-text-main)]">{value}</span>
      </div>
      <span className="text-xs uppercase tracking-wider text-[var(--color-app-text-muted)]">{label}</span>
    </div>
  );
}

function AlgoGridCard({ algorithm, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left p-4 rounded-lg app-glass app-card-hover block w-full cursor-pointer"
    >
      <h4 className="text-xs font-bold text-[var(--color-app-text-main)]">
        {algorithm.name}
      </h4>
      <p className="mt-1 text-xs text-[var(--color-app-text-muted)] line-clamp-2 leading-relaxed">
        {algorithm.shortDescription}
      </p>

      <div className="mt-3 flex gap-2 font-mono text-xs">
        <span className="bg-[var(--color-app-base)] text-[var(--color-app-primary)] px-2 py-0.5 rounded border border-[var(--color-app-border)]">
          {algorithm.timeComplexity}
        </span>
        <span className="bg-[var(--color-app-base)] text-[var(--color-app-accent-hover)] px-2 py-0.5 rounded border border-[var(--color-app-border)]">
          {algorithm.spaceComplexity}
        </span>
      </div>
    </button>
  );
}
