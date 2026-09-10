import { createContext, useContext, useState, useCallback } from "react";

const AITutorContext = createContext(null);

/**
 * AITutorProvider
 * Global controller for the floating AI Tutor panel. Any page can call
 * openTutor() with a seed question and page context (e.g. current code)
 * so the tutor can give a context-aware answer without the user retyping it.
 */
export function AITutorProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingmessage, setPendingmessage] = useState(null);
  const [pageContext, setPageContext] = useState({});

  const openTutor = useCallback((seedmessage = null, context = null) => {
    if (context) setPageContext((prev) => ({ ...prev, ...context }));
    if (seedmessage) setPendingmessage(seedmessage);
    setIsOpen(true);
  }, []);

  const closeTutor = useCallback(() => setIsOpen(false), []);
  const toggleTutor = useCallback(() => setIsOpen((v) => !v), []);
  const clearPendingmessage = useCallback(() => setPendingmessage(null), []);

  const value = {
    isOpen,
    openTutor,
    closeTutor,
    toggleTutor,
    pendingmessage,
    clearPendingmessage,
    pageContext,
    setPageContext,
  };

  return <AITutorContext.Provider value={value}>{children}</AITutorContext.Provider>;
}

export function useAITutor() {
  const context = useContext(AITutorContext);
  if (!context) {
    throw new Error("useAITutor must be used within an AITutorProvider");
  }
  return context;
}

export default AITutorContext;
