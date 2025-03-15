import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/pages/home.css"; 

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-overlay">
        <div className="home-content">
          <h1 className="display-2 fw-bold">Syllexa AI</h1>
          <p className="lead">
            Disleksi hastalarına özel yapay zeka destekli öğrenme asistanı
          </p>
          <div className="button-group">
            <button className="btn btn-home" onClick={() => navigate("/login")}>
              Giriş Yap
            </button>
            <button className="btn btn-home-outline" onClick={() => navigate("/register")}>
              Kayıt Ol
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
