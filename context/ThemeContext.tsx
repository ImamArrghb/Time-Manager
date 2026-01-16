'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 1. Cek LocalStorage saat aplikasi pertama kali dimuat
  useEffect(() => {
    const savedSettings = localStorage.getItem('user_settings');
    if (savedSettings) {
      const { darkMode } = JSON.parse(savedSettings);
      setIsDarkMode(darkMode);
      if (darkMode) document.documentElement.classList.add('dark');
    }
  }, []);

  // 2. Fungsi Toggle
  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      
      // Update Class HTML
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Update LocalStorage (Hanya update key darkMode, biarkan setting lain)
      const currentSettings = JSON.parse(localStorage.getItem('user_settings') || '{}');
      localStorage.setItem('user_settings', JSON.stringify({ ...currentSettings, darkMode: newMode }));

      return newMode;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook Custom agar mudah dipanggil di mana saja
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}