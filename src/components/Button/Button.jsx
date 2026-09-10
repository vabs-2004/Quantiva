const VARIANTS = {
  primary:
    "bg-gradient-to-r from-[var(--color-app-primary)] to-[var(--color-app-primary-hover)] text-[var(--color-app-base)] font-bold hover:shadow-lg hover:shadow-[rgba(0,212,255,0.2)] border border-transparent",
  secondary:
    "bg-[var(--color-app-surface-hover)] text-[var(--color-app-text-main)] hover:bg-[var(--color-app-surface-alt)] border border-[var(--color-app-border-light)]",
  danger:
    "bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30",
  gold:
    "bg-gradient-to-r from-[var(--color-app-accent)] to-[var(--color-app-accent-hover)] text-[var(--color-app-base)] font-bold hover:shadow-lg hover:shadow-[rgba(199,169,78,0.2)] border border-transparent",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-xs rounded-lg",
  lg: "px-6 py-2.5 text-xs rounded-lg font-semibold",
};

export default function Button({
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  children,
  className = "",
  ...rest
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-1.5
        transition-all duration-200 cursor-pointer
        disabled:cursor-not-allowed disabled:opacity-40
        ${VARIANTS[variant]} ${SIZES[size]} ${className}
      `}
      {...rest}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin text-current"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
