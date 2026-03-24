'use client';

import { useState, useCallback } from 'react';
import type { EquipeView, EquipeHeureSemaineView, EquipeCreate, EquipeHeureSemaineCreate } from '@/app/api/planification/schema';

async function api<T>(url: string, opts?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function useEquipes() {
  const [equipes, setEquipes] = useState<EquipeView[]>([]);
  const [calendrier, setCalendrier] = useState<EquipeHeureSemaineView[]>([]);
  const [loading, setLoading] = useState(false);

  // --- Gestion des Équipes ---
  const chargerEquipes = useCallback(async () => {
    setLoading(true);
    const d = await api<{ equipes: EquipeView[] }>('/api/planification/equipes');
    if (d) setEquipes(d.equipes || []);
    setLoading(false);
  }, []);

  const creerEquipe = useCallback(async (data: EquipeCreate) => {
    await api('/api/planification/equipes', { method: 'POST', body: JSON.stringify(data) });
    await chargerEquipes();
  }, [chargerEquipes]);

  const modifierEquipe = useCallback(async (id: string, data: any) => {
    await api(`/api/planification/equipes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    await chargerEquipes();
  }, [chargerEquipes]);

  const supprimerEquipe = useCallback(async (id: string) => {
    await api(`/api/planification/equipes/${id}`, { method: 'DELETE' });
    await chargerEquipes();
  }, [chargerEquipes]);

  // --- Gestion du Calendrier (Heures Semaine) ---
  const chargerCalendrier = useCallback(async () => {
    const d = await api<{ items: EquipeHeureSemaineView[] }>('/api/planification/equipes/calendrier');
    if (d) setCalendrier(d.items || []);
  }, []);

  const creerCalendrier = useCallback(async (data: EquipeHeureSemaineCreate) => {
    await api('/api/planification/equipes/calendrier', { method: 'POST', body: JSON.stringify(data) });
    await chargerCalendrier();
  }, [chargerCalendrier]);

  const supprimerCalendrier = useCallback(async (id: string) => {
    const res = await fetch(`/api/planification/equipes/calendrier/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setCalendrier((prev) => prev.filter(item => item.id !== id));
    }
  }, []);

  return {
    equipes,
    calendrier,
    loading,
    charger: chargerEquipes, // Aligné avec votre destructuring
    creer: creerEquipe,
    modifier: modifierEquipe,
    supprimer: supprimerEquipe,
    chargerCalendrier,
    creerCalendrier,
    supprimerCalendrier,
  };
}