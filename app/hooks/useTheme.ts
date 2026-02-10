
"use client";

import { useState, useEffect } from 'react';

type ThemeMode = 'light' | 'dark';

interface ColorPalette {
  name: string;
  primary: string;
  gradient: string;
  bgSidebar: string;
}

const defaultPalette: ColorPalette = {
  name: "Orange Gardex",
  primary: "#f97316",
  gradient: "from-[#f97316] to-[#e6951f]",
  bgSidebar: "from-[#1a2332] to-[#0f1419]",
};

const colorPalettes: ColorPalette[] = [
  defaultPalette,
  { 
    name: "Bleu Professionnel", 
    primary: "#3b82f6", 
    gradient: "from-[#3b82f6] to-[#1d4ed8]",
    bgSidebar: "from-[#1e293b] to-[#0f172a]"
  },
  { 
    name: "Vert Naturel", 
    primary: "#10b981", 
    gradient: "from-[#10b981] to-[#059669]",
    bgSidebar: "from-[#1a2c2a] to-[#0f1f1d]"
  },
  { 
    name: "Violet Créatif", 
    primary: "#8b5cf6", 
    gradient: "from-[#8b5cf6] to-[#7c3aed]",
    bgSidebar: "from-[#2a1b4d] to-[#1a1033]"
  },
  { 
    name: "Rouge Énergique", 
    primary: "#ef4444", 
    gradient: "from-[#ef4444] to-[#dc2626]",
    bgSidebar: "from-[#2c1a1a] to-[#1a0f0f]"
  },
];

export function useTheme() {
  // État pour le mode dark/light
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme-mode') as ThemeMode) || 'dark';
    }
    return 'dark';
  });

  // État pour la palette
  const [palette, setPalette] = useState<ColorPalette>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme-palette');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return defaultPalette;
        }
      }
    }
    return defaultPalette;
  });

  // Appliquer le thème au document
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    
    // Sauvegarder dans localStorage
    localStorage.setItem('theme-mode', theme);
  }, [theme]);

  // Appliquer la palette
  useEffect(() => {
    const root = document.documentElement;
    
    // Définir la couleur primaire comme variable CSS
    root.style.setProperty('--primary-color', palette.primary);
    
    // Sauvegarder dans localStorage
    localStorage.setItem('theme-palette', JSON.stringify(palette));
  }, [palette]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const selectPalette = (newPalette: ColorPalette) => {
    setPalette(newPalette);
  };

  return {
    theme,
    palette,
    toggleTheme,
    selectPalette,
    colorPalettes,
  };
}