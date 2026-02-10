"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { createContext, useContext, useEffect, useState } from "react";

// ============================================
// PALETTE DE COULEURS
// ============================================
export const colorPalettes = {
  orange: {
    name: "Orange Gardex",
    primary: "#F5A623",
    primaryLight: "#FFBD4A",
    primaryDark: "#D4890F",
  },
  blue: {
    name: "Bleu",
    primary: "#3B82F6",
    primaryLight: "#60A5FA",
    primaryDark: "#2563EB",
  },
  green: {
    name: "Vert",
    primary: "#10B981",
    primaryLight: "#34D399",
    primaryDark: "#059669",
  },
  purple: {
    name: "Violet",
    primary: "#8B5CF6",
    primaryLight: "#A78BFA",
    primaryDark: "#7C3AED",
  },
  red: {
    name: "Rouge",
    primary: "#EF4444",
    primaryLight: "#F87171",
    primaryDark: "#DC2626",
  },
  teal: {
    name: "Turquoise",
    primary: "#14B8A6",
    primaryLight: "#2DD4BF",
    primaryDark: "#0D9488",
  },
};

export type PaletteKey = keyof typeof colorPalettes;

// ============================================
// CONTEXTE POUR LA PALETTE DE COULEURS
// ============================================
interface ColorContextType {
  palette: PaletteKey;
  setPalette: (palette: PaletteKey) => void;
  colors: typeof colorPalettes.orange;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export function useColorPalette() {
  const context = useContext(ColorContext);
  if (!context) {
    throw new Error("useColorPalette must be used within Providers");
  }
  return context;
}

// ============================================
// PROVIDER DE COULEURS
// ============================================
function ColorPaletteProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPaletteState] = useState<PaletteKey>("orange");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("color-palette") as PaletteKey | null;
    if (saved && colorPalettes[saved]) {
      setPaletteState(saved);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const colors = colorPalettes[palette];
    const root = document.documentElement;
    
    root.style.setProperty("--color-primary", colors.primary);
    root.style.setProperty("--color-primary-light", colors.primaryLight);
    root.style.setProperty("--color-primary-dark", colors.primaryDark);
    
    localStorage.setItem("color-palette", palette);
  }, [palette, mounted]);

  const setPalette = (newPalette: PaletteKey) => {
    setPaletteState(newPalette);
  };

  return (
    <ColorContext.Provider value={{ palette, setPalette, colors: colorPalettes[palette] }}>
      {children}
    </ColorContext.Provider>
  );
}

// ============================================
// PROVIDER PRINCIPAL
// ============================================
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
      >
        <ColorPaletteProvider>
          {children}
        </ColorPaletteProvider>
      </NextThemesProvider>
    </SessionProvider>
  );
}