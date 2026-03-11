'use client';

import { useState, useCallback } from 'react';
import type {
  AchatCommandeView,
  StatsAchats,
  UpdateAchatsCommande,
  FournisseurCreate,
  FournisseurUpdate
} from '@/app/api/achats/schema';

export async function apiFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(opts?.headers || {}),
    },
    ...opts,
  });

  if (!res.ok) {
    let message = `Erreur ${res.status}`;

    try {
      const data = await res.json();
      if (data?.error) {
        message = data.error;
      }
    } catch {
      message = "Erreur réseau";
    }

    throw new Error(message);
  }

  return res.json();
}

// ═══════════════════════════════════════
// Hook principal — commandes avec achats
// ═══════════════════════════════════════
export function useAchats() {
  const [actifs, setActifs] = useState<AchatCommandeView[]>([]);
  const [historique, setHistorique] = useState<AchatCommandeView[]>([]);
  const [stats, setStats] = useState<StatsAchats | null>(null);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async (filtres?: Record<string, string>) => {
    setLoading(true);

    try {
      const q = filtres ? new URLSearchParams(filtres).toString() : '';

      const data = await apiFetch<{
        actifs: AchatCommandeView[];
        historique: AchatCommandeView[];
        stats: StatsAchats;
      }>(`/api/achats${q ? `?${q}` : ''}`);

      setActifs(data.actifs || []);
      setHistorique(data.historique || []);
      setStats(data.stats || null);

    } catch (e) {
      console.error('Erreur chargement achats:', e);
    }

    setLoading(false);
  }, []);

  const mettreAJourAchats = useCallback(async (commandeId: string, data: UpdateAchatsCommande) => {
    await apiFetch(`/api/achats/commandes/${commandeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }, []);

  const validerLivraison = useCallback(async (commandeId: string) => {
    await apiFetch(`/api/achats/commandes/${commandeId}/livraison`, {
      method: 'POST',
    });
  }, []);

  return {
    actifs,
    historique,
    stats,
    loading,
    charger,
    mettreAJourAchats,
    validerLivraison
  };
}

// ═══════════════════════════════════════
// Hook fournisseurs
// ═══════════════════════════════════════
export interface FournisseurView {
  id: string;
  nom: string;
  contact: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  notes: string | null;
  actif: boolean;
}

export function useFournisseurs() {
  const [fournisseurs, setFournisseurs] = useState<FournisseurView[]>([]);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);

    try {
      const data = await apiFetch<{ fournisseurs: FournisseurView[] }>(
        '/api/achats/fournisseurs'
      );

      setFournisseurs(data.fournisseurs || []);
    } catch (e) {
      console.error('Erreur chargement fournisseurs:', e);
    }

    setLoading(false);
  }, []);

  const creer = useCallback(async (data: FournisseurCreate) => {
    await apiFetch('/api/achats/fournisseurs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }, []);

  const modifier = useCallback(async (id: string, data: FournisseurUpdate) => {
    await apiFetch(`/api/achats/fournisseurs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }, []);

  const supprimer = useCallback(async (id: string) => {
    await apiFetch(`/api/achats/fournisseurs/${id}`, {
      method: 'DELETE',
    });
  }, []);

  return {
    fournisseurs,
    loading,
    charger,
    creer,
    modifier,
    supprimer
  };
}