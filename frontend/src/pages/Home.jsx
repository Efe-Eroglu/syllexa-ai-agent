import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/pages/home.css";

export default function Home() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    document.body.classList.add("home-page");
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => {
      document.body.classList.remove("home-page");
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="home-container">
      {/* Transparan Navbar */}
      <nav className={`navbar ${isScrolled ? "scrolled" : ""}`}>
        <div className="navbar-content">
          <div className="navbar-brand">
            <span className="logo-icon">🧠</span>
            <span className="logo-text">Syllexa AI</span>
          </div>

          <div className="navbar-links">
            <a href="#features">Özellikler</a>
            <a href="#about">Hakkımızda</a>
            <a href="#pricing">Ücretlendirme</a>
          </div>

          <div className="navbar-actions">
            <button className="nav-button" onClick={() => navigate("/login")}>
              Giriş Yap
            </button>
            <button
              className="nav-button primary"
              onClick={() => navigate("/register")}
            >
              Ücretsiz Başla
            </button>
          </div>
        </div>
      </nav>

      {/* Ana İçerik */}
      <div className="geometric-pattern"></div>

      <div className="content-wrapper">
        <div className="hero-section">
          <div className="title-container">
            <h1 className="gradient-text">
              <span className="gradient-primary">Syllexa</span>
              <span className="ai-highlight"> AI</span>
            </h1>

            <div className="animated-underline"></div>
          </div>

          <p className="hero-subtitle">
            Disleksi dostu yapay zeka ile öğrenme deneyimini yeniden keşfet
          </p>

          <div className="cta-buttons">
            <button
              className="cta-button chat-button"
              onClick={() => navigate("/chat")}
            >
              <span className="button-icon">🗨️</span>
              Sohbete Başla
              <div className="button-hover-effect"></div>
            </button>
            <button className="cta-button app-button" disabled>
              <span className="button-icon">📱</span>
              Mobil Uygulama
              <span className="coming-soon-badge">Yakında</span>
            </button>
          </div>
        </div>

        <div className="scrolling-indicator">
          <div className="mouse"></div>
        </div>
      </div>

      <div className="floating-shapes">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="shape"></div>
        ))}
      </div>
    </div>
  );
}
