'use client';

import { useState, useCallback } from 'react';
import type {
  PlanificationView, CommandeNonPlanifiee, EquipeView, EquipeHeureSemaineView,
  VehiculeView, ChauffeurView, StatsPlanification,
  PlanificationCreate, PlanificationUpdate, EquipeCreate, EquipeHeureSemaineCreate,
  VehiculeCreate, ChauffeurCreate,
} from '@/app/api/planification/schema';

async function api<T>(url: string, opts?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });

    let data: any = null;

    try {
      data = await res.json();
    } catch {}

    if (!res.ok) {
      console.warn('API FAIL →', url, res.status, data);
      return null;
    }

    return data;

  } catch (err) {
    console.warn('FETCH FAIL →', url, err);
    return null;
  }
}

export function useEquipes() {
  const [equipes, setEquipes] = useState<EquipeView[]>([]);
  const [calendrier, setCalendrier] = useState<EquipeHeureSemaineView[]>([]);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);

    const d = await api<{ equipes: EquipeView[] }>(
      '/api/planification/equipes'
    );

    if (d) setEquipes(d.equipes || []);

    setLoading(false);
  }, []);

  const chargerCalendrier = useCallback(async () => {
    const d = await api<{ items: EquipeHeureSemaineView[] }>(
      '/api/planification/equipes/calendrier'
    );

    if (d) setCalendrier(d.items || []);
  }, []);

  const creerCalendrier = useCallback(async (d: EquipeHeureSemaineCreate) => {
    await api('/api/planification/equipes/calendrier', {
      method: 'POST',
      body: JSON.stringify(d),
    });
  }, []);

  // ⭐⭐⭐⭐⭐ CORRECTION ICI
  const supprimerCalendrier = useCallback(async (id: string) => {
    await api(`/api/planification/equipes/calendrier/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    });
  }, []);

  return {
    equipes,
    calendrier,
    loading,
    charger,
    chargerCalendrier,
    creerCalendrier,
    supprimerCalendrier,
  };
}