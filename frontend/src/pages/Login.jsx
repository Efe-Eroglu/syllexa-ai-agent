import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/pages/login.css";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Giriş Yap</h2>
        <form>
          <div className="mb-3">
            <label className="form-label">Kullanıcı Adı</label>
            <input type="text" className="form-control" placeholder="Kullanıcı Adı" />
          </div>
          <div className="mb-3">
            <label className="form-label">Şifre</label>
            <input type="password" className="form-control" placeholder="Şifre" />
          </div>
          <button className="btn btn-login">Giriş Yap</button>
        </form>
        <button className="btn btn-back" onClick={() => navigate("/")}>
          Ana Sayfaya Dön
        </button>
      </div>
    </div>
  );
}
