import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaGoogle, FaGithub, FaFacebookF } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import "../styles/pages/login.css";
import { loginUser } from "../api/auth";
import { API_BASE_URL } from "../config";
import axios from "axios";
import { notifySuccess, notifyError } from "../utils/toast";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const data = await loginUser(email, password);
      localStorage.setItem("access_token", data.access_token);

      notifySuccess("Giriş başarılı!");
      navigate("/chat");
    } catch (err) {
      const message = err.detail || "Giriş yapılamadı.";
      setError(message);
      notifyError(message);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    axios
      .get(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(() => navigate("/chat"))
      .catch(() => {});
  }, []);
  return (
    <div className="login-container">
      <div className="login-geometric-pattern"></div>

      <div className="login-box">
        <div className="login-auth-header">
          <button className="login-back-button" onClick={() => navigate("/")}>
            <FiArrowLeft />
          </button>
          <h1 className="login-gradient-text">
            <span>Syllexa</span> AI'ya Hoş Geldin
          </h1>
          <p className="login-auth-subtitle">Disleksi dostu deneyimine başla</p>
        </div>

        <form className="login-auth-form" onSubmit={handleLogin}>
          <div className="login-input-group">
            <input
              type="email"
              className="login-modern-input"
              placeholder="E-posta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="login-input-group">
            <input
              type="password"
              className="login-modern-input"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="login-auth-options">
            <label className="login-remember-me">
              <input type="checkbox" />
              <span className="login-checkmark"></span>
              Beni Hatırla
            </label>
            <a href="/forgot-password" className="login-forgot-password">
              Şifremi Unuttum?
            </a>
          </div>

          <button className="login-auth-button primary">Giriş Yap</button>
        </form>

        <div className="login-social-divider">
          <span>veya ile devam et</span>
        </div>

        <div className="login-social-auth">
          <button className="login-social-button">
            <FaGoogle className="login-social-icon" />
          </button>
          <button className="login-social-button">
            <FaGithub className="login-social-icon" />
          </button>
          <button className="login-social-button">
            <FaFacebookF className="login-social-icon" />
          </button>
        </div>
      </div>
    </div>
  );
}
