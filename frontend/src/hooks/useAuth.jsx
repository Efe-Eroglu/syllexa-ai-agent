import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config";

export const useAuth = () => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then(() => setIsAuthenticated(true))
    .catch(() => setIsAuthenticated(false))
    .finally(() => setLoading(false));
  }, []);

  return { isAuthenticated, loading };
};
