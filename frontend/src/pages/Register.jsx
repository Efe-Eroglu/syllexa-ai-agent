import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/pages/register.css"; 

export default function Register() {
  const navigate = useNavigate();

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Kayıt Ol</h2>
        <form>
          <div className="mb-3">
            <label className="form-label">Ad Soyad</label>
            <input type="text" className="form-control" placeholder="Adınızı girin" />
          </div>
          <div className="mb-3">
            <label className="form-label">E-posta</label>
            <input type="email" className="form-control" placeholder="E-posta adresiniz" />
          </div>
          <div className="mb-3">
            <label className="form-label">Şifre</label>
            <input type="password" className="form-control" placeholder="Şifre oluşturun" />
          </div>
          <button className="btn btn-register">Kayıt Ol</button>
        </form>
        <button className="btn btn-back" onClick={() => navigate("/login")}>
          Zaten bir hesabın var mı? Giriş Yap
        </button>
      </div>
    </div>
  );
}
