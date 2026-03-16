'use client';

import { useState, useCallback } from 'react';
import type { InterventionView, StatsInterventions, InterventionUpdate } from '@/app/api/interventions/schema';

async function apiFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(err.error || `Erreur ${res.status}`);
  }
  return res.json();
}

export function useInterventions() {
  const [interventions, setInterventions] = useState<InterventionView[]>([]);
  const [stats, setStats] = useState<StatsInterventions | null>(null);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async (filtres?: Record<string, string>) => {
    setLoading(true);
    try {
      const q = filtres ? new URLSearchParams(filtres).toString() : '';
      const data = await apiFetch<{ interventions: InterventionView[]; stats: StatsInterventions }>(`/api/interventions${q ? `?${q}` : ''}`);
      setInterventions(data.interventions || []);
      setStats(data.stats || null);
    } catch (e) { console.error('Erreur chargement interventions:', e); }
    setLoading(false);
  }, []);

  const sauvegarderFormulaire = useCallback(async (id: string, data: InterventionUpdate) => {
    await apiFetch(`/api/interventions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }, []);

  const completer = useCallback(async (id: string) => {
    await apiFetch(`/api/interventions/${id}/completer`, { method: 'POST' });
  }, []);

  const uploadPhoto = useCallback(async (interventionId: string, file: File, type: string, description?: string) => {
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('type', type);
    if (description) formData.append('description', description);

    const res = await fetch(`/api/interventions/${interventionId}/photos`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur upload' }));
      throw new Error(err.error);
    }
    return res.json();
  }, []);

  const supprimerPhoto = useCallback(async (interventionId: string, photoId: string) => {
    await apiFetch(`/api/interventions/${interventionId}/photos`, {
      method: 'DELETE',
      body: JSON.stringify({ photoId }),
    });
  }, []);

  return { interventions, stats, loading, charger, sauvegarderFormulaire, completer, uploadPhoto, supprimerPhoto };
}