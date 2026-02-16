"use client";

import { useState, useEffect, useCallback } from 'react';

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
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [palette, setPalette] = useState<ColorPalette>(defaultPalette);

  // Charger au montage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-mode') as ThemeMode;
    const savedPalette = localStorage.getItem('theme-palette');
    
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(savedTheme);
    } else {
      document.documentElement.classList.add('dark');
    }
    
    if (savedPalette) {
      try {
        const parsed = JSON.parse(savedPalette);
        const found = colorPalettes.find(p => p.name === parsed.name);
        if (found) {
          setPalette(found);
          document.documentElement.style.setProperty('--color-primary', found.primary);
        }
      } catch {}
    }
  }, []);

  // Toggle thème
  const toggleTheme = useCallback(() => {
    const newTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    
    // Mettre à jour l'état
    setTheme(newTheme);
    
    // Appliquer au DOM immédiatement
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newTheme);
    
    // Sauvegarder
    localStorage.setItem('theme-mode', newTheme);
  }, [theme]);

  // Sélectionner palette
  const selectPalette = useCallback((newPalette: ColorPalette) => {
    setPalette(newPalette);
    document.documentElement.style.setProperty('--color-primary', newPalette.primary);
    localStorage.setItem('theme-palette', JSON.stringify(newPalette));
  }, []);

  return {
    theme,
    palette,
    toggleTheme,
    selectPalette,
    colorPalettes,
    isDark: theme === 'dark',
  };
}