'use client';

import { useState, useCallback } from 'react';
import type { RepriseView, StatsReprises, RepriseUpdate } from '@/app/api/reprises/schema';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(err.error || `Erreur ${res.status}`);
  }
  return res.json();
}

export function useReprises() {
  const [actives, setActives] = useState<RepriseView[]>([]);
  const [historique, setHistorique] = useState<RepriseView[]>([]);
  const [stats, setStats] = useState<StatsReprises | null>(null);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async (filtres?: Record<string, string>) => {
    setLoading(true);
    try {
      const query = filtres ? new URLSearchParams(filtres).toString() : '';
      const res = await apiFetch<any>(`/api/reprises${query ? `?${query}` : ''}`);
      setActives(res.actives || []);
      setHistorique(res.historique || []);
      setStats(res.stats || null);
    } catch (e) {
      console.error('Erreur chargement reprises:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const modifier = useCallback(async (id: string, data: RepriseUpdate) => {
    await apiFetch(`/api/reprises/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }, []);

  const supprimer = useCallback(async (id: string) => {
    await apiFetch(`/api/reprises/${id}`, { method: 'DELETE' });
  }, []);

  const completer = useCallback(async (id: string) => {
    await apiFetch(`/api/reprises/${id}/completer`, { method: 'POST' });
  }, []);

  const envoyerConseils = useCallback(async () => {
    return apiFetch<any>('/api/reprises/cron-conseils', { method: 'POST' });
  }, []);

  return { actives, historique, stats, loading, charger, modifier, supprimer, completer, envoyerConseils };
}