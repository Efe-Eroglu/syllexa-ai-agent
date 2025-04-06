import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaGoogle, FaGithub, FaFacebookF } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import "../styles/pages/register.css";
import { registerUser } from "../api/auth";
import { API_BASE_URL } from "../config";
import axios from "axios";
import { notifySuccess, notifyError } from "../utils/toast";

export default function Register() {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [agreed, setAgreed] = useState(false);

  const handleNavigation = (path) => {
    setIsExiting(true);
    setTimeout(() => navigate(path), 300);
  };
  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (!agreed) {
        const msg = "Devam etmek için şartları kabul etmelisiniz.";
        setError(msg);
        notifyError(msg);
        return;
      }

      await registerUser(email, password, fullName);
      notifySuccess("Kayıt başarılı!");
      navigate("/chat");
    } catch (err) {
      const message =
        err.response?.data?.detail || "Kayıt işlemi sırasında bir hata oluştu.";
      setError(message);
      notifyError(message);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    console.log("Token : ", token);
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
    <div className={`register-container ${isExiting ? "exit-animation" : ""}`}>
      <div className="register-geometric-pattern"></div>

      <div className="register-box">
        <div className="register-auth-header">
          <button
            className="register-back-button"
            onClick={() => handleNavigation("/")}
          >
            <FiArrowLeft />
          </button>
          <h1 className="register-gradient-text">
            <span>Syllexa</span> AI'ya Katıl
          </h1>
          <p className="register-auth-subtitle">
            Disleksi dostu geleceği birlikte inşa edelim
          </p>
        </div>

        <form className="register-auth-form" onSubmit={handleRegister}>
          <div className="register-input-group">
            <input
              type="text"
              className="register-modern-input"
              placeholder="Tam Adınız"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="register-input-group">
            <input
              type="email"
              className="register-modern-input"
              placeholder="E-posta Adresiniz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="register-input-group">
            <input
              type="password"
              className="register-modern-input"
              placeholder="Şifreniz"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="register-terms">
            {error && <p className="register-error">{error}</p>}

            <label className="register-agreement">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span className="register-checkmark"></span>
              <span>
                <a href="/terms" className="register-terms-link">
                  Kullanım Koşulları
                </a>
                ’nı ve{" "}
                <a href="/privacy" className="register-terms-link">
                  Gizlilik Politikası
                </a>
                ’nı kabul ediyorum
              </span>
            </label>
          </div>
          <button type="submit" className="register-auth-button primary">
            Kayıt Ol
          </button>
        </form>

        <div className="register-social-divider">
          <span>veya ile devam et</span>
        </div>

        <div className="register-social-auth">
          <button className="register-social-button">
            <FaGoogle className="register-social-icon" />
          </button>
          <button className="register-social-button">
            <FaGithub className="register-social-icon" />
          </button>
          <button className="register-social-button">
            <FaFacebookF className="register-social-icon" />
          </button>
        </div>

        <button
          className="register-existing-account"
          onClick={() => handleNavigation("/login")}
        >
          Zaten hesabın var mı? <span>Giriş Yap</span>
        </button>
      </div>
    </div>
  );
}
