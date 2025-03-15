import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";

export default function App() {
  return (
    <div className="d-flex vh-100 justify-content-center align-items-center bg-light">
      <div className="card p-4 shadow" style={{ width: "300px" }}>
        <h2 className="text-center">Giriş Yap</h2>
        <input type="text" className="form-control my-2" placeholder="Kullanıcı Adı" />
        <input type="password" className="form-control my-2" placeholder="Şifre" />
        <button className="btn btn-primary w-100 mt-2">Giriş Yap</button>
      </div>
    </div>
  );
}
