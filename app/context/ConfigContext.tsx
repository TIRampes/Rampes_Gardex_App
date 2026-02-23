"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Config {
  coutHeureInstallation: number;
  facteurTempsInstallation: number;
  facteursPiedsLineaires: {
    barrotin: number;
    verre: number;
    mur: number;
    mainDouble: number;
    gardexVision: number;
    gardexUrbaine: number;
    gardexOptimum: number;
  };
}

interface ConfigContextType {
  config: Config | null;
  loading: boolean;
  refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) throw new Error("useConfig must be used within ConfigProvider");
  return context;
};

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/configurations");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (error) {
      console.error("Erreur chargement config:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading, refreshConfig: fetchConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};