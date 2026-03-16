'use client';

import { useState, useCallback } from 'react';
import type { PlanificationView, CommandeNonPlanifiee, EquipeView, StatsPlanification, PlanificationCreate, PlanificationUpdate, EquipeCreate } from '@/app/api/planification/schema';

async function api<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) { const e = await res.json().catch(() => ({ error: 'Erreur réseau' })); throw new Error(e.error || `Erreur ${res.status}`); }
  return res.json();
}

export function usePlanification() {
  const [planifications, setPlanifications] = useState<PlanificationView[]>([]);
  const [stats, setStats] = useState<StatsPlanification | null>(null);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async (filtres?: Record<string, string>) => {
    setLoading(true);
    try {
      const q = filtres ? new URLSearchParams(filtres).toString() : '';
      const data = await api<{ planifications: PlanificationView[]; stats: StatsPlanification }>(`/api/planification${q ? `?${q}` : ''}`);
      setPlanifications(data.planifications || []);
      setStats(data.stats || null);
    } catch (e) { console.error('Erreur chargement planifications:', e); }
    setLoading(false);
  }, []);

  const creer = useCallback(async (data: PlanificationCreate) => {
    await api('/api/planification', { method: 'POST', body: JSON.stringify(data) });
  }, []);

  const modifier = useCallback(async (id: string, data: PlanificationUpdate) => {
    await api(`/api/planification/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }, []);

  const supprimer = useCallback(async (id: string) => {
    await api(`/api/planification/${id}`, { method: 'DELETE' });
  }, []);

  return { planifications, stats, loading, charger, creer, modifier, supprimer };
}

export function useNonPlanifiees() {
  const [commandes, setCommandes] = useState<CommandeNonPlanifiee[]>([]);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ commandes: CommandeNonPlanifiee[] }>('/api/planification/non-planifiees');
      setCommandes(data.commandes || []);
    } catch (e) { console.error('Erreur chargement non-planifiées:', e); }
    setLoading(false);
  }, []);

  return { commandes, loading, charger };
}

export function useEquipes() {
  const [equipes, setEquipes] = useState<EquipeView[]>([]);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ equipes: EquipeView[] }>('/api/planification/equipes');
      setEquipes(data.equipes || []);
    } catch (e) { console.error('Erreur chargement équipes:', e); }
    setLoading(false);
  }, []);

  const creer = useCallback(async (data: EquipeCreate) => {
    await api('/api/planification/equipes', { method: 'POST', body: JSON.stringify(data) });
  }, []);

  const supprimer = useCallback(async (id: string) => {
    await api(`/api/planification/equipes/${id}`, { method: 'DELETE' });
  }, []);

  return { equipes, loading, charger, creer, supprimer };
}