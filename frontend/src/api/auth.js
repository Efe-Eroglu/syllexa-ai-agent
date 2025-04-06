import axios from "axios";
import { API_BASE_URL } from "../config";

const AUTH_URL = `${API_BASE_URL}/auth`;

export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${AUTH_URL}/login`, {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: "Giriş sırasında hata oluştu." };
  }
};

export const registerUser = async (email, password, full_name) => {
  try {
    const response = await axios.post(`${AUTH_URL}/register`, {
      email,
      password,
      full_name,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { detail: "Kayıt sırasında hata oluştu." };
  }
};

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    axios
      .get(`${API_BASE_URL}/auth/me`, {
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

export const logoutUser = async () => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
    return;
  }

  try {
    await axios.post(`${AUTH_URL}/logout`, null, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.warn("Logout hatası:", error.response?.data || error.message);
  } finally {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
  }
};
