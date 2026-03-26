// app/hooks/useAchats.ts

import { useState, useCallback } from 'react';
import type { AchatCommandeView, StatsAchats, UpdateAchatsCommande, DelaisConfig } from '@/app/api/achats/schema';

async function apiFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(err.error || `Erreur ${res.status}`);
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
      const data = await apiFetch<{ actifs: AchatCommandeView[]; historique: AchatCommandeView[]; stats: StatsAchats }>(`/api/achats${q ? `?${q}` : ''}`);
      setActifs(data.actifs || []);
      setHistorique(data.historique || []);
      setStats(data.stats || null);
    } catch (e) { console.error('Erreur chargement achats:', e); }
    setLoading(false);
  }, []);

  const mettreAJourAchats = useCallback(async (commandeId: string, data: UpdateAchatsCommande) => {
    await apiFetch(`/api/achats/commandes/${commandeId}`, { method: 'PUT', body: JSON.stringify(data) });
  }, []);

  const validerLivraison = useCallback(async (commandeId: string) => {
    await apiFetch(`/api/achats/commandes/${commandeId}/livraison`, { method: 'POST' });
  }, []);

  return { actifs, historique, stats, loading, charger, mettreAJourAchats, validerLivraison };
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
  typeAchat: string | null;
  formulaireNom: string | null;
  formulaireMime: string | null;
  _count?: { achats: number };
}

export function useFournisseurs() {
  const [fournisseurs, setFournisseurs] = useState<FournisseurView[]>([]);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ fournisseurs: FournisseurView[] }>('/api/achats/fournisseurs');
      setFournisseurs(data.fournisseurs || []);
    } catch (e) { console.error('Erreur chargement fournisseurs:', e); }
    setLoading(false);
  }, []);

  // Création avec FormData
  const creer = useCallback(async (data: {
    nom: string;
    contact?: string | null;
    telephone?: string | null;
    email?: string | null;
    adresse?: string | null;
    notes?: string | null;
    typeAchat?: string | null;
    formulaire?: File | null;
  }) => {
    const formData = new FormData();
    formData.append('nom', data.nom);
    if (data.contact) formData.append('contact', data.contact);
    if (data.telephone) formData.append('telephone', data.telephone);
    if (data.email) formData.append('email', data.email);
    if (data.adresse) formData.append('adresse', data.adresse);
    if (data.notes) formData.append('notes', data.notes);
    if (data.typeAchat) formData.append('typeAchat', data.typeAchat);
    if (data.formulaire) formData.append('formulaire', data.formulaire);

    const res = await fetch('/api/achats/fournisseurs', { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
      throw new Error(err.error || `Erreur ${res.status}`);
    }
    return res.json();
  }, []);

  // Modification avec FormData
  const modifier = useCallback(async (id: string, data: {
    nom?: string;
    contact?: string | null;
    telephone?: string | null;
    email?: string | null;
    adresse?: string | null;
    notes?: string | null;
    typeAchat?: string | null;
    formulaire?: File | null;
    supprimerFormulaire?: boolean;
  }) => {
    const formData = new FormData();
    if (data.nom !== undefined) formData.append('nom', data.nom);
    if (data.contact !== undefined) formData.append('contact', data.contact || '');
    if (data.telephone !== undefined) formData.append('telephone', data.telephone || '');
    if (data.email !== undefined) formData.append('email', data.email || '');
    if (data.adresse !== undefined) formData.append('adresse', data.adresse || '');
    if (data.notes !== undefined) formData.append('notes', data.notes || '');
    if (data.typeAchat !== undefined) formData.append('typeAchat', data.typeAchat || '');
    if (data.formulaire) formData.append('formulaire', data.formulaire);
    if (data.supprimerFormulaire) formData.append('supprimerFormulaire', 'true');

    const res = await fetch(`/api/achats/fournisseurs/${id}`, { method: 'PUT', body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur réseau' }));
      throw new Error(err.error || `Erreur ${res.status}`);
    }
    return res.json();
  }, []);

  const supprimer = useCallback(async (id: string) => {
    await apiFetch(`/api/achats/fournisseurs/${id}`, { method: 'DELETE' });
  }, []);

  return { fournisseurs, loading, charger, creer, modifier, supprimer };
}

// ═══════════════════════════════════════
// Hook délais de livraison & ruptures
// ═══════════════════════════════════════
export function useDelais() {
  const [config, setConfig] = useState<DelaisConfig | null>(null);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<DelaisConfig>('/api/achats/delais');
      setConfig(data);
    } catch (e) { console.error('Erreur chargement délais:', e); }
    setLoading(false);
  }, []);

  const sauvegarder = useCallback(async (data: DelaisConfig) => {
    await apiFetch('/api/achats/delais', { method: 'PUT', body: JSON.stringify(data) });
  }, []);

  const envoyerParCourriel = useCallback(async () => {
    return apiFetch<{ envoyes: number; erreurs: string[] }>('/api/achats/delais/envoi', { method: 'POST' });
  }, []);

  return { config, loading, charger, sauvegarder, envoyerParCourriel };
}