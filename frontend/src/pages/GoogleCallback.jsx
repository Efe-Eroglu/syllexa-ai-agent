import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { notifyError } from "../utils/toast";

const GoogleCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // URL'den gelen code parametresini yakala
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    
    if (!code) {
      notifyError("Google ile giriş başarısız oldu. Lütfen tekrar deneyin.");
      navigate("/login");
      return;
    }
    
    // Sayfayı yönlendirme bildirimi
    const loadingElement = document.createElement("div");
    loadingElement.textContent = "Google ile giriş yapılıyor...";
    loadingElement.style.cssText = "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 18px; color: #333;";
    document.body.appendChild(loadingElement);
    
    // Backend zaten URL'deki kodu işleyip bizi başka bir URL'e yönlendirecek
    // Sadece bir bilgilendirme mesajı gösteriyoruz
    
    // Eğer 5 saniye içinde backend tarafından yönlendirme olmazsa
    // login sayfasına gönder (bu genellikle gerçekleşmez)  
    const timeout = setTimeout(() => {
      notifyError("Google ile giriş zaman aşımına uğradı. Lütfen tekrar deneyin.");
      navigate("/login");
    }, 5000);
    
    return () => {
      clearTimeout(timeout);
      if (document.body.contains(loadingElement)) {
        document.body.removeChild(loadingElement);
      }
    };
  }, [navigate]);

  return null; // Bu bileşen herhangi bir UI göstermiyor
};

export default GoogleCallback; 