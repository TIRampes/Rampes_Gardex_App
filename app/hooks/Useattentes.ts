'use client';

import { useState, useCallback } from 'react';
import type { CommandeAttente, Representant, StatsAttentes } from '@/app/api/attentes/schema';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(err.error || `Erreur ${res.status}`);
  }
  return res.json();
}

export function useAttentes() {
  const [commandes, setCommandes] = useState<CommandeAttente[]>([]);
  const [representants, setRepresentants] = useState<Representant[]>([]);
  const [stats, setStats] = useState<StatsAttentes | null>(null);
  const [loading, setLoading] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const charger = useCallback(async (filtres?: { representantIds?: string[]; recherche?: string }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtres?.representantIds?.length) params.set('representantIds', filtres.representantIds.join(','));
      if (filtres?.recherche) params.set('recherche', filtres.recherche);
      const query = params.toString();
      const res = await apiFetch<any>(`/api/attentes${query ? `?${query}` : ''}`);
      setCommandes(res.commandes || []);
      setRepresentants(res.representants || []);
      setStats(res.stats || null);
    } catch (e) {
      console.error('Erreur chargement attentes:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const envoyerAttentes = useCallback(async (representantIds: string[], notes?: string): Promise<boolean> => {
    setEnvoiEnCours(true);
    try {
      const res = await apiFetch<any>('/api/attentes/envoi', {
        method: 'POST',
        body: JSON.stringify({ representantIds, notes }),
      });
      return res.success;
    } catch (e) {
      console.error('Erreur envoi attentes:', e);
      return false;
    } finally {
      setEnvoiEnCours(false);
    }
  }, []);

  return { commandes, representants, stats, loading, envoiEnCours, charger, envoyerAttentes };
}