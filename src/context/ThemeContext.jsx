import { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext(null);

/**
 * ThemeProvider
 * Manages dark/light theme state.
 * Persists user preference in localStorage.
 * Applies data-theme attribute to <html> for CSS variable switching.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("qsl_theme");
    if (saved === "light" || saved === "dark") return saved;
    // Default to dark (project's native theme)
    return "dark";
  });

  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("qsl_theme", theme);
    // Update meta theme-color for browser
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", isDark ? "#0a0e1a" : "#f8fafc");
    }
  }, [theme, isDark]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const value = { theme, isDark, toggleTheme };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook for consuming theme context.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export default ThemeContext;
