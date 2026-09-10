import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export default function usePageTracking() {
  const location = useLocation();
  const { token, isLoggedIn, isAdmin } = useAuth();

  useEffect(() => {
    // Only track if user is logged in, and do not track admin visits
    if (isLoggedIn && !isAdmin) {
      axios.post(
        `${API_BASE_URL}/analytics/track-page`,
        { path: location.pathname },
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(err => {
        console.error("Failed to track page visit", err);
      });
    }
  }, [location.pathname, isLoggedIn, isAdmin, token]);
}
