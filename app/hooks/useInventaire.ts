'use client';

import { useState, useCallback } from 'react';
import type {
  Piece, PieceForm,
  FournisseurInv, FournisseurForm,
  UniteInv, UniteForm,
  CategorieInv, CategorieForm,
  Transaction, TransactionForm,
  StatsInventaire,
} from '@/app/api/inventaire/PieceSchema';

// === Helper fetch ===
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

// === PIÈCES ===
export function usePieces() {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<StatsInventaire | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limite: 100, total: 0, totalPages: 0 });

  const charger = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ tous: 'true', ...params }).toString();
      const res = await apiFetch<any>(`/api/inventaire/pieces?${query}`);
      setPieces(res.data);
      if (res.pagination) setPagination(res.pagination);
      if (res.stats) setStats(res.stats);
    } catch (e) {
      console.error('Erreur chargement pièces:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const creer = useCallback(async (form: PieceForm) => {
    const res = await apiFetch<Piece>('/api/inventaire/pieces', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    return res;
  }, []);

  const modifier = useCallback(async (id: string, form: Partial<PieceForm>) => {
    const res = await apiFetch<Piece>(`/api/inventaire/pieces/${id}`, {
      method: 'PUT',
      body: JSON.stringify(form),
    });
    return res;
  }, []);

  const supprimer = useCallback(async (id: string) => {
    const res = await apiFetch<any>(`/api/inventaire/pieces/${id}`, { method: 'DELETE' });
    return res;
  }, []);

  return { pieces, loading, stats, pagination, charger, creer, modifier, supprimer };
}

// === FOURNISSEURS ===
export function useFournisseurs() {
  const [fournisseurs, setFournisseurs] = useState<FournisseurInv[]>([]);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const query = params ? new URLSearchParams(params).toString() : '';
      const res = await apiFetch<any>(`/api/inventaire/fournisseurs${query ? `?${query}` : ''}`);
      setFournisseurs(res.data);
    } catch (e) {
      console.error('Erreur chargement fournisseurs:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const creer = useCallback(async (form: FournisseurForm) => {
    const res = await apiFetch<FournisseurInv>('/api/inventaire/fournisseurs', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    return res;
  }, []);

  const modifier = useCallback(async (id: string, form: Partial<FournisseurForm>) => {
    const res = await apiFetch<FournisseurInv>(`/api/inventaire/fournisseurs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(form),
    });
    return res;
  }, []);

  const supprimer = useCallback(async (id: string) => {
    const res = await apiFetch<any>(`/api/inventaire/fournisseurs/${id}`, { method: 'DELETE' });
    return res;
  }, []);

  return { fournisseurs, loading, charger, creer, modifier, supprimer };
}

// === UNITÉS ===
export function useUnites() {
  const [unites, setUnites] = useState<UniteInv[]>([]);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/api/inventaire/unites');
      setUnites(res.data);
    } catch (e) {
      console.error('Erreur chargement unités:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const creer = useCallback(async (form: UniteForm) => {
    const res = await apiFetch<UniteInv>('/api/inventaire/unites', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    return res;
  }, []);

  const modifier = useCallback(async (id: string, form: Partial<UniteForm>) => {
    const res = await apiFetch<UniteInv>(`/api/inventaire/unites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(form),
    });
    return res;
  }, []);

  const supprimer = useCallback(async (id: string) => {
    const res = await apiFetch<any>(`/api/inventaire/unites/${id}`, { method: 'DELETE' });
    return res;
  }, []);

  return { unites, loading, charger, creer, modifier, supprimer };
}

// === CATÉGORIES ===
export function useCategories() {
  const [categories, setCategories] = useState<CategorieInv[]>([]);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/api/inventaire/categories');
      setCategories(res.data);
    } catch (e) {
      console.error('Erreur chargement catégories:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const creer = useCallback(async (form: CategorieForm) => {
    const res = await apiFetch<CategorieInv>('/api/inventaire/categories', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    return res;
  }, []);

  const modifier = useCallback(async (id: string, form: CategorieForm) => {
    const res = await apiFetch<CategorieInv>(`/api/inventaire/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(form),
    });
    return res;
  }, []);

  const supprimer = useCallback(async (id: string) => {
    const res = await apiFetch<any>(`/api/inventaire/categories/${id}`, { method: 'DELETE' });
    return res;
  }, []);

  return { categories, loading, charger, creer, modifier, supprimer };
}

// === TRANSACTIONS ===
export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limite: 50, total: 0, totalPages: 0 });

  const charger = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const query = params ? new URLSearchParams(params).toString() : '';
      const res = await apiFetch<any>(`/api/inventaire/transactions${query ? `?${query}` : ''}`);
      setTransactions(res.data);
      if (res.pagination) setPagination(res.pagination);
    } catch (e) {
      console.error('Erreur chargement transactions:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const creer = useCallback(async (form: TransactionForm) => {
    const res = await apiFetch<Transaction>('/api/inventaire/transactions', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    return res;
  }, []);

  return { transactions, loading, pagination, charger, creer };
}