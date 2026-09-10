import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SIDEBAR_LINKS } from "../../utils/constants";

const icons = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  bloch: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  ),
  circuit: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9h6m8 0h6M2 15h6m8 0h6" /><rect x="8" y="6" width="8" height="6" rx="1" />
      <rect x="8" y="12" width="8" height="6" rx="1" />
    </svg>
  ),
  sandbox: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /><line x1="12" y1="2" x2="12" y2="22" opacity="0.3" />
    </svg>
  ),
  playground: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 12h4m-2-2v4m8-2h.01M16 10h.01" />
    </svg>
  ),
};

import { useAuth } from "../../context/AuthContext";

export default function Sidebar({ isOpen, onToggle, isMobile }) {
  const { isAdmin } = useAuth();

  return (
    <AnimatePresence mode="wait">
      {isOpen ? (
        <motion.aside
          key="open"
          initial={{ width: 0, opacity: 0, x: isMobile ? -50 : 0 }}
          animate={{ width: 240, opacity: 1, x: 0 }}
          exit={{ width: 0, opacity: 0, x: isMobile ? -50 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`sidebar-container ${isMobile ? "fixed inset-y-0 left-0 z-50 shadow-2xl" : ""}`}
        >
          <div className="sidebar-header">
            <span className="sidebar-title">Navigation</span>
            <button onClick={onToggle} className="sidebar-toggle" title="Collapse Sidebar">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <nav className="sidebar-nav" data-lenis-prevent="true">
            {SIDEBAR_LINKS.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={isMobile ? onToggle : undefined}
                className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              >
                <span className="sidebar-link-icon">
                  {icons[link.icon]}
                </span>
                <span className="sidebar-link-text">{link.label}</span>
              </NavLink>
            ))}

            {isAdmin && (
              <NavLink
                to="/admin"
                onClick={isMobile ? onToggle : undefined}
                className={({ isActive }) => `sidebar-link mt-4 !border-[var(--color-app-error)] !bg-[rgba(239,68,68,0.05)] ${isActive ? "active" : ""}`}
              >
                <span className="sidebar-link-icon text-[var(--color-app-error)]">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <span className="sidebar-link-text text-[var(--color-app-error)] font-bold">Admin Panel</span>
              </NavLink>
            )}
          </nav>
        </motion.aside>
      ) : isMobile ? null : (
        <motion.aside
          key="collapsed"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 60, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="sidebar-container sidebar-collapsed"
          style={{ alignItems: "center", paddingTop: "1rem" }}
        >
          <button onClick={onToggle} className="sidebar-toggle" title="Open Sidebar">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <nav className="sidebar-nav" style={{ alignItems: "center" }}>
            {SIDEBAR_LINKS.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                title={link.label}
                style={{ justifyContent: "center", padding: "0.65rem" }}
              >
                <span className="sidebar-link-icon">
                  {icons[link.icon]}
                </span>
              </NavLink>
            ))}
          </nav>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
