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

// ==============================
// Helper fetch sécurisé
// ==============================
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  let data: any = {};

  try {
    const text = await res.text();
    if (text) data = JSON.parse(text);
  } catch {
    // JSON invalide, on reste avec un objet vide
  }

  if (!res.ok) {
    const message = data && typeof data === 'object' && typeof data.error === 'string'
      ? data.error
      : `Erreur ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

// ==============================
// Hook Pieces
// ==============================
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
      setPieces(res.data ?? []);
      if (res.pagination) setPagination(res.pagination);
      if (res.stats) setStats(res.stats);
    } catch (e) {
      console.error('Erreur chargement pièces:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const creer = useCallback(async (form: PieceForm) => {
    return apiFetch<Piece>('/api/inventaire/pieces', {
      method: 'POST',
      body: JSON.stringify(form),
    });
  }, []);

  const modifier = useCallback(async (id: string, form: Partial<PieceForm>) => {
    return apiFetch<Piece>(`/api/inventaire/pieces/${id}`, {
      method: 'PUT',
      body: JSON.stringify(form),
    });
  }, []);

  const supprimer = useCallback(async (id: string) => {
    return apiFetch<any>(`/api/inventaire/pieces/${id}`, { method: 'DELETE' });
  }, []);

  return { pieces, loading, stats, pagination, charger, creer, modifier, supprimer };
}

// ==============================
// Hook Fournisseurs
// ==============================
export function useFournisseurs() {
  const [fournisseurs, setFournisseurs] = useState<FournisseurInv[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limite: 50, total: 0, totalPages: 0 });

  const charger = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const query = params ? new URLSearchParams(params).toString() : '';
      const res = await apiFetch<any>(`/api/inventaire/fournisseurs${query ? `?${query}` : ''}`);
      setFournisseurs(res.data ?? []);
      if (res.pagination) setPagination(res.pagination);
    } catch (e) {
      console.error('Erreur chargement fournisseurs:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const creer = useCallback(async (form: FournisseurForm) => {
    return apiFetch<FournisseurInv>('/api/inventaire/fournisseurs', {
      method: 'POST',
      body: JSON.stringify(form),
    });
  }, []);

  const modifier = useCallback(async (id: string, form: Partial<FournisseurForm>) => {
    return apiFetch<FournisseurInv>(`/api/inventaire/fournisseurs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(form),
    });
  }, []);

  const supprimer = useCallback(async (id: string) => {
    return apiFetch<any>(`/api/inventaire/fournisseurs/${id}`, { method: 'DELETE' });
  }, []);

  return { fournisseurs, loading, pagination, charger, creer, modifier, supprimer };
}

// ==============================
// Hook Unites
// ==============================
export function useUnites() {
  const [unites, setUnites] = useState<UniteInv[]>([]);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/api/inventaire/unites');
      setUnites(res.data ?? []);
    } catch (e) {
      console.error('Erreur chargement unités:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const creer = useCallback(async (form: UniteForm) => {
    return apiFetch<UniteInv>('/api/inventaire/unites', {
      method: 'POST',
      body: JSON.stringify(form),
    });
  }, []);

  const modifier = useCallback(async (id: string, form: Partial<UniteForm>) => {
    return apiFetch<UniteInv>(`/api/inventaire/unites/${id}`, {
      method: 'PUT',
      body: JSON.stringify(form),
    });
  }, []);

  const supprimer = useCallback(async (id: string) => {
    return apiFetch<any>(`/api/inventaire/unites/${id}`, { method: 'DELETE' });
  }, []);

  return { unites, loading, charger, creer, modifier, supprimer };
}

// ==============================
// Hook Categories
// ==============================
export function useCategories() {
  const [categories, setCategories] = useState<CategorieInv[]>([]);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/api/inventaire/categories');
      setCategories(res.data ?? []);
    } catch (e) {
      console.error('Erreur chargement catégories:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const creer = useCallback(async (form: CategorieForm) => {
    return apiFetch<CategorieInv>('/api/inventaire/categories', {
      method: 'POST',
      body: JSON.stringify(form),
    });
  }, []);

  const modifier = useCallback(async (id: string, form: CategorieForm) => {
    return apiFetch<CategorieInv>(`/api/inventaire/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(form),
    });
  }, []);

  const supprimer = useCallback(async (id: string) => {
    return apiFetch<any>(`/api/inventaire/categories/${id}`, { method: 'DELETE' });
  }, []);

  return { categories, loading, charger, creer, modifier, supprimer };
}

// ==============================
// Hook Transactions
// ==============================
export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limite: 50, total: 0, totalPages: 0 });

  const charger = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const query = params ? new URLSearchParams(params).toString() : '';
      const res = await apiFetch<any>(`/api/inventaire/transactions${query ? `?${query}` : ''}`);
      setTransactions(res.data ?? []);
      if (res.pagination) setPagination(res.pagination);
    } catch (e) {
      console.error('Erreur chargement transactions:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const creer = useCallback(async (form: TransactionForm) => {
    return apiFetch<Transaction>('/api/inventaire/transactions', {
      method: 'POST',
      body: JSON.stringify(form),
    });
  }, []);

  return { transactions, loading, pagination, charger, creer };
}''