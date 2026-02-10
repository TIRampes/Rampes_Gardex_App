"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type ThemeMode = "light" | "dark";
type ColorPalette = {
  name: string;
  primary: string;
  gradient: string;
  bgSidebar: string;
  light?: {
    bg: string;
    text: string;
    sidebar: string;
  };
  dark?: {
    bg: string;
    text: string;
    sidebar: string;
  };
};

interface ThemeContextType {
  theme: ThemeMode;
  palette: ColorPalette;
  toggleTheme: () => void;
  setPalette: (palette: ColorPalette) => void;
}

const defaultPalette: ColorPalette = {
  name: "Orange Gardex",
  primary: "#f97316",
  gradient: "from-[#f97316] to-[#e6951f]",
  bgSidebar: "from-[#1a2332] to-[#0f1419]",
  light: {
    bg: "#ffffff",
    text: "#0f172a",
    sidebar: "from-[#f8fafc] to-[#e2e8f0]",
  },
  dark: {
    bg: "#0f1419",
    text: "#f8fafc",
    sidebar: "from-[#1a2332] to-[#0f1419]",
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [palette, setPalette] = useState<ColorPalette>(defaultPalette);

  useEffect(() => {
    // Charger depuis localStorage
    const savedTheme = localStorage.getItem("theme-mode") as ThemeMode;
    const savedPalette = localStorage.getItem("theme-palette");
    
    if (savedTheme && ["light", "dark"].includes(savedTheme)) {
      setTheme(savedTheme);
    }
    
    if (savedPalette) {
      try {
        setPalette(JSON.parse(savedPalette));
      } catch (error) {
        console.error("Erreur de parsing palette:", error);
      }
    }
  }, []);

  useEffect(() => {
    // Appliquer le thème au document
    const root = document.documentElement;
    
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      // Appliquer les couleurs du mode sombre
      root.style.setProperty("--background", palette.dark?.bg || "#0f1419");
      root.style.setProperty("--foreground", palette.dark?.text || "#f8fafc");
      root.style.setProperty("--sidebar-bg", palette.dark?.sidebar || "linear-gradient(to bottom, #1a2332, #0f1419)");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      // Appliquer les couleurs du mode clair
      root.style.setProperty("--background", palette.light?.bg || "#ffffff");
      root.style.setProperty("--foreground", palette.light?.text || "#0f172a");
      root.style.setProperty("--sidebar-bg", palette.light?.sidebar || "linear-gradient(to bottom, #f8fafc, #e2e8f0)");
    }
    
    // Toujours définir la couleur primaire
    root.style.setProperty("--primary-color", palette.primary);
    
    // Sauvegarder
    localStorage.setItem("theme-mode", theme);
    localStorage.setItem("theme-palette", JSON.stringify(palette));
  }, [theme, palette]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  const updatePalette = (newPalette: ColorPalette) => {
    setPalette(newPalette);
  };

  return (
    <ThemeContext.Provider value={{ theme, palette, toggleTheme, setPalette: updatePalette }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}