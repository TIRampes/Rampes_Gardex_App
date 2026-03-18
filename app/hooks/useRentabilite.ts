'use client';

import { useState, useCallback } from 'react';
import type { RentabiliteResponse, EntreeHeures, ModifHeures } from '@/app/api/rentabilite/schema';

async function api<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) {
    const t = await res.text();
    let msg = `Erreur ${res.status}`;
    try { msg = JSON.parse(t).error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

async function apiSafe<T>(url: string, fallback: T): Promise<T> {
  try { return await api<T>(url); } catch { return fallback; }
}

const EMPTY: RentabiliteResponse = { lignes: [], stats: { nombreInstallations: 0, rentabiliteSup20: 0, moyenneRentabilite: 0, coutHoraire: 160 }, coutHoraire: 160 };

export function useRentabilite() {
  const [data, setData] = useState<RentabiliteResponse>(EMPTY);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async (filtres?: Record<string, string>) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtres) Object.entries(filtres).forEach(([k, v]) => { if (v) params.set(k, v); });
    const url = `/api/rentabilite${params.toString() ? `?${params}` : ''}`;
    const result = await apiSafe<RentabiliteResponse>(url, EMPTY);
    setData(result);
    setLoading(false);
  }, []);

  const enregistrerHeures = useCallback(async (d: EntreeHeures) => {
    return api<any>('/api/rentabilite/heures', { method: 'POST', body: JSON.stringify(d) });
  }, []);

  const modifierHeures = useCallback(async (d: ModifHeures) => {
    return api<any>('/api/rentabilite/heures', { method: 'PUT', body: JSON.stringify(d) });
  }, []);

  const modifierCoutHoraire = useCallback(async (coutHoraire: number) => {
    return api<any>('/api/rentabilite/cout', { method: 'PUT', body: JSON.stringify({ coutHoraire }) });
  }, []);

  return { data, loading, charger, enregistrerHeures, modifierHeures, modifierCoutHoraire };
}