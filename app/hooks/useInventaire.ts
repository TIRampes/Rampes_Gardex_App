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

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  let data: any = {};
  try {
    const text = await res.text();
    if (text) data = JSON.parse(text);
  } catch {}

  if (!res.ok) {
    throw new Error(data?.error || `Erreur ${res.status}`);
  }
  return data as T;
}

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
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const creer = useCallback(async (form: PieceForm) => {
    return apiFetch<Piece>('/api/inventaire/pieces', { method: 'POST', body: JSON.stringify(form) });
  }, []);

  const modifier = useCallback(async (id: string, form: Partial<PieceForm>) => {
    return apiFetch<Piece>(`/api/inventaire/pieces/${id}`, { method: 'PUT', body: JSON.stringify(form) });
  }, []);

  const supprimer = useCallback(async (id: string) => {
    return apiFetch<any>(`/api/inventaire/pieces/${id}`, { method: 'DELETE' });
  }, []);

  return { pieces, loading, stats, pagination, charger, creer, modifier, supprimer };
}

export function useFournisseurs() {
  const [fournisseurs, setFournisseurs] = useState<FournisseurInv[]>([]);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const query = params ? new URLSearchParams(params).toString() : '';
      const res = await apiFetch<any>(`/api/inventaire/fournisseurs${query ? `?${query}` : ''}`);
      setFournisseurs(res.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const creer = useCallback(async (form: any) => {
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (key === 'typeAchat' && value === '') return; // Ignorer si vide
        formData.append(key, value as any);
      }
    });

    const res = await fetch('/api/inventaire/fournisseurs', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Erreur lors de la création');
    return res.json();
  }, []);

  const modifier = useCallback(async (id: string, form: any) => {
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'typeAchat' && value === '') formData.append(key, '');
        else formData.append(key, value as any);
      }
    });

    const res = await fetch(`/api/inventaire/fournisseurs/${id}`, { method: 'PUT', body: formData });
    if (!res.ok) throw new Error('Erreur lors de la modification');
    return res.json();
  }, []);

  const supprimer = useCallback(async (id: string) => {
    return apiFetch<any>(`/api/inventaire/fournisseurs/${id}`, { method: 'DELETE' });
  }, []);

  return { fournisseurs, loading, charger, creer, modifier, supprimer };
}

export function useUnites() {
  const [unites, setUnites] = useState<UniteInv[]>([]);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/api/inventaire/unites');
      setUnites(res.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const creer = useCallback(async (form: UniteForm) => {
    return apiFetch<UniteInv>('/api/inventaire/unites', { method: 'POST', body: JSON.stringify(form) });
  }, []);

  const modifier = useCallback(async (id: string, form: Partial<UniteForm>) => {
    return apiFetch<UniteInv>(`/api/inventaire/unites/${id}`, { method: 'PUT', body: JSON.stringify(form) });
  }, []);

  const supprimer = useCallback(async (id: string) => {
    return apiFetch<any>(`/api/inventaire/unites/${id}`, { method: 'DELETE' });
  }, []);

  return { unites, loading, charger, creer, modifier, supprimer };
}

export function useCategories() {
  const [categories, setCategories] = useState<CategorieInv[]>([]);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<any>('/api/inventaire/categories');
      setCategories(res.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const creer = useCallback(async (form: CategorieForm) => {
    return apiFetch<CategorieInv>('/api/inventaire/categories', { method: 'POST', body: JSON.stringify(form) });
  }, []);

  return { categories, loading, charger, creer };
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const query = params ? new URLSearchParams(params).toString() : '';
      const res = await apiFetch<any>(`/api/inventaire/transactions${query ? `?${query}` : ''}`);
      setTransactions(res.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const creer = useCallback(async (form: TransactionForm) => {
    return apiFetch<Transaction>('/api/inventaire/transactions', { method: 'POST', body: JSON.stringify(form) });
  }, []);

  return { transactions, loading, charger, creer };
}