import React from 'react';
import { FiSun, FiMoon, FiEye } from 'react-icons/fi';
import '../styles/components/theme-settings.css';

const ThemeSettings = ({ currentTheme, onThemeChange }) => {
  const themes = [
    { id: 'light', name: 'Aydınlık', icon: <FiSun /> },
    { id: 'dark', name: 'Karanlık', icon: <FiMoon /> },
    { id: 'protanopia', name: 'Kırmızı-Yeşil Renk Körlüğü', icon: <FiEye /> },
    { id: 'deuteranopia', name: 'Yeşil-Kırmızı Renk Körlüğü', icon: <FiEye /> },
    { id: 'tritanopia', name: 'Mavi-Sarı Renk Körlüğü', icon: <FiEye /> },
  ];

  return (
    <div className="theme-settings">
      <h3>Tema Ayarları</h3>
      <div className="theme-options">
        {themes.map((theme) => (
          <button
            key={theme.id}
            className={`theme-option ${currentTheme === theme.id ? 'active' : ''}`}
            onClick={() => onThemeChange(theme.id)}
            title={theme.name}
          >
            <span className="theme-icon">{theme.icon}</span>
            <span className="theme-name">{theme.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSettings; 