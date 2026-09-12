import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { chatWithTutor, getRecommendations } from "../services/api";
import {
  normalizeContext,
  isSameContext,
  getInitialGreeting,
} from "../components/AITutor/tutorContextHelper";

const AITutorContext = createContext(null);

/**
 * AITutorProvider
 * Global controller for Quantiva's contextual AI Tutor.
 * 
 * Supports:
 * - Deterministic context model (source, topic, resource, knowledgeMap, learner)
 * - Safe context switching without context leakage
 * - Coherent multi-turn conversation memory across navigation
 * - Suggested starter questions and contextual greetings
 * - Loading, error, and retry handling
 */
export function AITutorProvider({ children }) {
  const location = useLocation();
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [activeContext, setActiveContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);
  const [pendingmessage, setPendingmessage] = useState(null);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: getInitialGreeting(null),
      id: "msg-init",
      timestamp: Date.now(),
    },
  ]);

  // Ref to track latest state inside async callbacks
  const stateRef = useRef({ messages, activeContext, loading, isOpen });
  useEffect(() => {
    stateRef.current = { messages, activeContext, loading, isOpen };
  }, [messages, activeContext, loading, isOpen]);

  /**
   * Send a message to the AI Tutor with the active context preserved.
   */
  const sendMessage = useCallback(
    async (rawText) => {
      const text = (rawText || "").trim();
      if (!text || stateRef.current.loading) return;

      setError(null);
      setLastFailedMessage(null);

      // Handle recommendation shortcut
      if (text === "__RECOMMEND__") {
        const userMsg = {
          role: "user",
          text: "What should I learn next?",
          id: `msg-${Date.now()}-u`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);

        try {
          const data = await getRecommendations();
          const tutorMsg = {
            role: "assistant",
            text: data.recommendation || "Here are your recommended next steps in Quantiva.",
            id: `msg-${Date.now()}-a`,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, tutorMsg]);
        } catch (err) {
          setError(
            err?.response?.data?.error ||
              "Couldn't fetch recommendations right now."
          );
        } finally {
          setLoading(false);
        }
        return;
      }

      const userMsg = {
        role: "user",
        text,
        id: `msg-${Date.now()}-u`,
        timestamp: Date.now(),
      };

      const currentMessages = stateRef.current.messages;
      const nextMessages = [...currentMessages, userMsg];
      setMessages(nextMessages);
      setLoading(true);

      try {
        // Build history for API
        const history = nextMessages
          .filter((m) => m.role === "user" || m.role === "assistant")
          .slice(0, -1)
          .map((m) => ({
            role: m.role,
            text: m.text,
          }));

        // Build structured context payload for backend
        const ctx = stateRef.current.activeContext || normalizeContext(null, user);
        const contextPayload = {
  page: location.pathname,
  source: ctx.source || "dashboard",
  topic: ctx.topic || null,
  resource: ctx.resource || null,
  knowledgeMap: ctx.knowledgeMap || null,
  learner:
    ctx.learner ||
    (user?.startingLevel ? { level: user.startingLevel } : null),
  query: ctx.query || null,

  // Challenge Tutor context
  challengeMode: ctx.challengeMode || false,
  challenge: ctx.challenge || null,
  numQubits: ctx.numQubits ?? null,
  gates: ctx.gates || [],
  layers: ctx.layers || [],
  probabilities: ctx.probabilities || {},

  // Legacy/general circuit context
  circuit: ctx.circuit || null,

  // Code context
  code: ctx.code || null,
};

        const data = await chatWithTutor(text, history, contextPayload);

        const tutorMsg = {
          role: "assistant",
          text: data.reply || data.message || "I am thinking through this quantum concept.",
          id: `msg-${Date.now()}-a`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, tutorMsg]);
      } catch (err) {
        console.error("AI Tutor chat failed:", err);
        const errorMsg =
          err?.response?.data?.error ||
          "AI Tutor is unavailable right now. Please check your connection and try again.";
        setError(errorMsg);
        setLastFailedMessage(text);
      } finally {
        setLoading(false);
      }
    },
    [location.pathname, user]
  );

  /**
   * Retry the last failed message
   */
  const retryLastMessage = useCallback(() => {
    if (lastFailedMessage) {
      sendMessage(lastFailedMessage);
    }
  }, [lastFailedMessage, sendMessage]);

  /**
   * Explicitly open the Tutor, optionally setting or switching context.
   */
  const openTutor = useCallback(
    (seedMessage = null, rawContext = null) => {
      if (rawContext) {
        const normalized = normalizeContext(rawContext, user);
        const currentCtx = stateRef.current.activeContext;

        if (!isSameContext(currentCtx, normalized)) {
          // Context switched! Start fresh conversation for this context (no context leakage)
          setActiveContext(normalized);
          setMessages([
            {
              role: "assistant",
              text: getInitialGreeting(normalized),
              id: `msg-ctx-${Date.now()}`,
              timestamp: Date.now(),
            },
          ]);
          setError(null);
          setLastFailedMessage(null);
        }

        if (seedMessage) {
          setPendingmessage(seedMessage);
        }
      } else {
        // Opened without explicit context (e.g. launcher button)
        if (!stateRef.current.activeContext) {
          const defaultCtx = normalizeContext(null, user);
          setActiveContext(defaultCtx);
        }
        if (seedMessage) {
          setPendingmessage(seedMessage);
        }
      }

      setIsOpen(true);
    },
    [user]
  );

  const closeTutor = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleTutor = useCallback(() => {
    setIsOpen((v) => !v);
  }, []);

  const clearContext = useCallback(() => {
    const defaultCtx = normalizeContext(null, user);
    setActiveContext(defaultCtx);
    setMessages([
      {
        role: "assistant",
        text: getInitialGreeting(defaultCtx),
        id: `msg-clear-${Date.now()}`,
        timestamp: Date.now(),
      },
    ]);
    setError(null);
    setLastFailedMessage(null);
  }, [user]);

  const clearPendingmessage = useCallback(() => {
    setPendingmessage(null);
  }, []);

  // Process pending message on open
  useEffect(() => {
    if (pendingmessage && isOpen) {
      const msg = pendingmessage;
      setPendingmessage(null);
      sendMessage(msg);
    }
  }, [pendingmessage, isOpen, sendMessage]);

  const value = {
    isOpen,
    openTutor,
    closeTutor,
    toggleTutor,
    activeContext,
    clearContext,
    messages,
    loading,
    error,
    lastFailedMessage,
    sendMessage,
    retryLastMessage,
    // Backwards compatibility:
    pendingmessage,
    clearPendingmessage,
    pageContext: activeContext || {},
    setPageContext: (ctx) => openTutor(null, ctx),
  };

  return (
    <AITutorContext.Provider value={value}>
      {children}
    </AITutorContext.Provider>
  );
}

export function useAITutor() {
  const context = useContext(AITutorContext);
  if (!context) {
    throw new Error("useAITutor must be used within an AITutorProvider");
  }
  return context;
}

export default AITutorContext;
