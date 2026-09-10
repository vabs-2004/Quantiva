export default function ParameterInput({ parameters, values, onChange }) {
  if (!parameters || parameters.length === 0) {
    return (
      <p className="text-xs text-[var(--color-app-text-muted)] italic">
        This algorithm has no configurable parameters.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 max-w-2xl">
      {parameters.map((param) => (
        <div key={param.name} className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[var(--color-app-text-light)] uppercase tracking-wider">
            {param.name}
          </label>

          {param.type === "select" ? (
            <select
              value={values[param.name] ?? param.default ?? ""}
              onChange={(e) => onChange(param.name, e.target.value)}
              className="rounded-lg border border-[var(--color-app-border-light)] bg-[var(--color-app-base)] px-3 py-2 text-xs text-[var(--color-app-text-main)] outline-none focus:border-[var(--color-app-primary)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all"
            >
              {param.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={param.type || "text"}
              value={values[param.name] ?? ""}
              onChange={(e) =>
                onChange(
                  param.name,
                  param.type === "number"
                    ? Number(e.target.value)
                    : e.target.value
                )
              }
              placeholder={param.placeholder || ""}
              min={param.min}
              max={param.max}
              step={param.step}
              className="rounded-lg border border-[var(--color-app-border-light)] bg-[var(--color-app-base)] px-3 py-2 text-xs text-[var(--color-app-text-main)] placeholder-[var(--color-app-text-muted)] outline-none focus:border-[var(--color-app-primary)] focus:shadow-[0_0_0_2px_rgba(0,212,255,0.1)] transition-all"
            />
          )}
        </div>
      ))}
    </div>
  );
}
