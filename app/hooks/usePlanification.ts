'use client';

import { useState, useCallback } from 'react';
import type {
  PlanificationView, CommandeNonPlanifiee, EquipeView, EquipeHeureSemaineView,
  VehiculeView, ChauffeurView, StatsPlanification,
  PlanificationCreate, PlanificationUpdate, EquipeCreate, EquipeHeureSemaineCreate,
  VehiculeCreate, ChauffeurCreate,
} from '@/app/api/planification/schema';

async function api<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = `Erreur ${res.status}`;
    try { msg = JSON.parse(text).error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// Version silencieuse — ne crash pas si la route n'existe pas encore
async function apiSafe<T>(url: string, fallback: T): Promise<T> {
  try {
    return await api<T>(url);
  } catch {
    return fallback;
  }
}

// ═══════════════════════════════════════
export function usePlanification() {
  const [planifications, setPlanifications] = useState<PlanificationView[]>([]);
  const [stats, setStats] = useState<StatsPlanification | null>(null);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async (filtres?: Record<string, string>) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtres) Object.entries(filtres).forEach(([k, v]) => { if (v) params.set(k, v); });
      const url = `/api/planification${params.toString() ? `?${params}` : ''}`;
      const data = await api<{ planifications: PlanificationView[]; stats: StatsPlanification }>(url);
      setPlanifications(data.planifications ?? []);
      setStats(data.stats ?? null);
    } catch (e) { console.error('charger planif:', e); }
    setLoading(false);
  }, []);

  const creer = useCallback(async (d: PlanificationCreate) => {
    return api<any>('/api/planification', { method: 'POST', body: JSON.stringify(d) });
  }, []);

  const modifier = useCallback(async (id: string, d: PlanificationUpdate) => {
    return api<any>(`/api/planification/${id}`, { method: 'PUT', body: JSON.stringify(d) });
  }, []);

  const supprimer = useCallback(async (id: string) => {
    return api<any>(`/api/planification/${id}`, { method: 'DELETE' });
  }, []);

  const envoyerAvis = useCallback(async (id: string) => {
    return api<{ email: boolean; sms: boolean }>(`/api/planification/${id}/avis`, { method: 'POST' });
  }, []);

  return { planifications, stats, loading, charger, creer, modifier, supprimer, envoyerAvis };
}

// ═══════════════════════════════════════
export function useNonPlanifiees() {
  const [commandes, setCommandes] = useState<CommandeNonPlanifiee[]>([]);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ commandes: CommandeNonPlanifiee[] }>('/api/planification/non-planifiees');
      setCommandes(data.commandes ?? []);
    } catch (e) { console.error('charger NP:', e); }
    setLoading(false);
  }, []);

  return { commandes, loading, charger };
}

// ═══════════════════════════════════════
export function useEquipes() {
  const [equipes, setEquipes] = useState<EquipeView[]>([]);
  const [calendrier, setCalendrier] = useState<EquipeHeureSemaineView[]>([]);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<{ equipes: EquipeView[] }>('/api/planification/equipes');
      setEquipes(data.equipes ?? []);
    } catch (e) { console.error('charger equipes:', e); }
    setLoading(false);
  }, []);

  const creer = useCallback(async (d: EquipeCreate) => {
    return api<any>('/api/planification/equipes', { method: 'POST', body: JSON.stringify(d) });
  }, []);

  const modifier = useCallback(async (id: string, d: Partial<EquipeCreate>) => {
    return api<any>(`/api/planification/equipes/${id}`, { method: 'PUT', body: JSON.stringify(d) });
  }, []);

  const supprimer = useCallback(async (id: string) => {
    return api<any>(`/api/planification/equipes/${id}`, { method: 'DELETE' });
  }, []);

  const chargerCalendrier = useCallback(async () => {
    try {
      const data = await apiSafe<{ items: EquipeHeureSemaineView[] }>('/api/planification/equipes/calendrier', { items: [] });
      setCalendrier(data.items ?? []);
    } catch (e) { console.error('charger calendrier:', e); }
  }, []);

  const creerCalendrier = useCallback(async (d: EquipeHeureSemaineCreate) => {
    return api<any>('/api/planification/equipes/calendrier', { method: 'POST', body: JSON.stringify(d) });
  }, []);

  const supprimerCalendrier = useCallback(async (id: string) => {
    return api<any>('/api/planification/equipes/calendrier', { method: 'DELETE', body: JSON.stringify({ id }) });
  }, []);

  return { equipes, calendrier, loading, charger, creer, modifier, supprimer, chargerCalendrier, creerCalendrier, supprimerCalendrier };
}

// ═══════════════════════════════════════
export function useVehicules() {
  const [vehicules, setVehicules] = useState<VehiculeView[]>([]);

  const charger = useCallback(async () => {
    try {
      const data = await api<{ vehicules: VehiculeView[] }>('/api/planification/vehicules');
      setVehicules(data.vehicules ?? []);
    } catch (e) { console.error('charger vehicules:', e); }
  }, []);

  const creer = useCallback(async (d: VehiculeCreate) => {
    return api<any>('/api/planification/vehicules', { method: 'POST', body: JSON.stringify(d) });
  }, []);

  const modifier = useCallback(async (id: string, d: Partial<VehiculeCreate>) => {
    return api<any>(`/api/planification/vehicules/${id}`, { method: 'PUT', body: JSON.stringify(d) });
  }, []);

  const supprimer = useCallback(async (id: string) => {
    return api<any>(`/api/planification/vehicules/${id}`, { method: 'DELETE' });
  }, []);

  return { vehicules, charger, creer, modifier, supprimer };
}

// ═══════════════════════════════════════
export function useChauffeurs() {
  const [chauffeurs, setChauffeurs] = useState<ChauffeurView[]>([]);

  const charger = useCallback(async () => {
    try {
      const data = await api<{ chauffeurs: ChauffeurView[] }>('/api/planification/chauffeurs');
      setChauffeurs(data.chauffeurs ?? []);
    } catch (e) { console.error('charger chauffeurs:', e); }
  }, []);

  const creer = useCallback(async (d: ChauffeurCreate) => {
    return api<any>('/api/planification/chauffeurs', { method: 'POST', body: JSON.stringify(d) });
  }, []);

  const modifier = useCallback(async (id: string, d: Partial<ChauffeurCreate>) => {
    return api<any>(`/api/planification/chauffeurs/${id}`, { method: 'PUT', body: JSON.stringify(d) });
  }, []);

  const supprimer = useCallback(async (id: string) => {
    return api<any>(`/api/planification/chauffeurs/${id}`, { method: 'DELETE' });
  }, []);

  return { chauffeurs, charger, creer, modifier, supprimer };
}