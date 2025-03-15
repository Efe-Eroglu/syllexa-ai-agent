import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaGoogle, FaGithub, FaFacebookF } from "react-icons/fa";
import { FiArrowLeft } from "react-icons/fi";
import "../styles/pages/register.css";

export default function Register() {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);

  const handleNavigation = (path) => {
    setIsExiting(true);
    setTimeout(() => navigate(path), 300);
  };

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
          <p className="register-auth-subtitle">Disleksi dostu geleceği birlikte inşa edelim</p>
        </div>

        <form className="register-auth-form">
          <div className="register-input-group">
            <input 
              type="text" 
              className="register-modern-input" 
              placeholder="Tam Adınız" 
            />
          </div>
          <div className="register-input-group">
            <input 
              type="email" 
              className="register-modern-input" 
              placeholder="E-posta Adresiniz" 
            />
          </div>
          <div className="register-input-group">
            <input 
              type="password" 
              className="register-modern-input" 
              placeholder="Şifreniz" 
            />
          </div>

          <div className="register-terms">
            <label className="register-agreement">
              <input type="checkbox" />
              <span className="register-checkmark"></span>
              <span>
                <a href="/terms" className="register-terms-link">Kullanım Koşulları</a>'nı 
                ve <a href="/privacy" className="register-terms-link">Gizlilik Politikası</a>'nı kabul ediyorum
              </span>
            </label>
          </div>

          <button className="register-auth-button primary">
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