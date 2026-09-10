import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { loginUser, registerUser, getCurrentUser, googleLoginUser } from "../services/api";

const AuthContext = createContext(null);

/**
 * AuthProvider
 * Manages authentication state: user info, JWT token, and role.
 * Persists token in localStorage for session survival.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("qsl_token"));
  const [loading, setLoading] = useState(true);

  const isLoggedIn = !!user;
  const isAdmin = user?.role === "admin";

  // On mount, validate stored token
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userData = await getCurrentUser(token);
        setUser(userData);
      } catch (err) {
        // Token invalid — clear it
        console.error("Token validation failed:", err);
        localStorage.removeItem("qsl_token");
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    }
    validateToken();
  }, [token]);

  const login = useCallback(async (username, password) => {
    const data = await loginUser(username, password);
    localStorage.setItem("qsl_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (userData) => {
    const data = await registerUser(userData);
    localStorage.setItem("qsl_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const googleLogin = useCallback(async (googleToken, os) => {
    const data = await googleLoginUser(googleToken, os);
    localStorage.setItem("qsl_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("qsl_token");
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    isLoggedIn,
    isAdmin,
    loading,
    login,
    register,
    googleLogin,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook for consuming auth context.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
