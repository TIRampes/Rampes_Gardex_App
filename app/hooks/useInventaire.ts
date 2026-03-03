"use client";

import { useState, useCallback } from "react";
import type { Piece, FournisseurInv, UniteInv, CategorieInv } from "@/app/types/inventaire";

// ══════════════════════════════════════════
// GENERIC FETCH HELPERS
// ══════════════════════════════════════════

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Erreur serveur");
  return json;
}

// ══════════════════════════════════════════
// HOOK PIÈCES
// ══════════════════════════════════════════

export function usePieces() {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ totalActives: number; totalInactives: number; totalSousSeuil: number; valeurStock: number } | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limite: 50, total: 0, totalPages: 0 });

  const charger = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams(params ?? {}).toString();
      const res = await apiFetch<{ data: Piece[]; pagination: typeof pagination; stats: typeof stats }>(`/api/inventaire/pieces?${qs}`);
      setPieces(res.data);
      setPagination(res.pagination);
      if (res.stats) setStats(res.stats);
    } finally {
      setLoading(false);
    }
  }, []);

  const creer = useCallback(async (data: Record<string, unknown>) => {
    const res = await apiFetch<{ data: Piece }>("/api/inventaire/pieces", { method: "POST", body: JSON.stringify(data) });
    setPieces((prev) => [res.data, ...prev]);
    return res.data;
  }, []);

  const modifier = useCallback(async (id: string, data: Record<string, unknown>) => {
    const res = await apiFetch<{ data: Piece }>(`/api/inventaire/pieces/${id}`, { method: "PUT", body: JSON.stringify(data) });
    setPieces((prev) => prev.map((p) => (p.id === id ? res.data : p)));
    return res.data;
  }, []);

  const supprimer = useCallback(async (id: string) => {
    await apiFetch(`/api/inventaire/pieces/${id}`, { method: "DELETE" });
    setPieces((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { pieces, loading, stats, pagination, charger, creer, modifier, supprimer };
}

// ══════════════════════════════════════════
// HOOK FOURNISSEURS
// ══════════════════════════════════════════

export function useFournisseurs() {
  const [fournisseurs, setFournisseurs] = useState<FournisseurInv[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limite: 50, total: 0, totalPages: 0 });

  const charger = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams(params ?? {}).toString();
      const res = await apiFetch<{ data: FournisseurInv[]; pagination: typeof pagination }>(`/api/inventaire/fournisseurs?${qs}`);
      setFournisseurs(res.data);
      setPagination(res.pagination);
    } finally {
      setLoading(false);
    }
  }, []);

  const creer = useCallback(async (data: Record<string, unknown>) => {
    const res = await apiFetch<{ data: FournisseurInv }>("/api/inventaire/fournisseurs", { method: "POST", body: JSON.stringify(data) });
    setFournisseurs((prev) => [res.data, ...prev]);
    return res.data;
  }, []);

  const modifier = useCallback(async (id: string, data: Record<string, unknown>) => {
    const res = await apiFetch<{ data: FournisseurInv }>(`/api/inventaire/fournisseurs/${id}`, { method: "PUT", body: JSON.stringify(data) });
    setFournisseurs((prev) => prev.map((f) => (f.id === id ? res.data : f)));
    return res.data;
  }, []);

  const supprimer = useCallback(async (id: string) => {
    await apiFetch(`/api/inventaire/fournisseurs/${id}`, { method: "DELETE" });
    setFournisseurs((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return { fournisseurs, loading, pagination, charger, creer, modifier, supprimer };
}

// ══════════════════════════════════════════
// HOOK UNITÉS
// ══════════════════════════════════════════

export function useUnites() {
  const [unites, setUnites] = useState<UniteInv[]>([]);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: UniteInv[] }>("/api/inventaire/unites");
      setUnites(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  const creer = useCallback(async (data: Record<string, unknown>) => {
    const res = await apiFetch<{ data: UniteInv }>("/api/inventaire/unites", { method: "POST", body: JSON.stringify(data) });
    setUnites((prev) => [...prev, res.data].sort((a, b) => a.unite.localeCompare(b.unite)));
    return res.data;
  }, []);

  const modifier = useCallback(async (id: string, data: Record<string, unknown>) => {
    const res = await apiFetch<{ data: UniteInv }>(`/api/inventaire/unites/${id}`, { method: "PUT", body: JSON.stringify(data) });
    setUnites((prev) => prev.map((u) => (u.id === id ? res.data : u)));
    return res.data;
  }, []);

  const supprimer = useCallback(async (id: string) => {
    await apiFetch(`/api/inventaire/unites/${id}`, { method: "DELETE" });
    setUnites((prev) => prev.filter((u) => u.id !== id));
  }, []);

  return { unites, loading, charger, creer, modifier, supprimer };
}

// ══════════════════════════════════════════
// HOOK CATÉGORIES
// ══════════════════════════════════════════

export function useCategories() {
  const [categories, setCategories] = useState<CategorieInv[]>([]);
  const [loading, setLoading] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: CategorieInv[] }>("/api/inventaire/categories");
      setCategories(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  const creer = useCallback(async (data: Record<string, unknown>) => {
    const res = await apiFetch<{ data: CategorieInv }>("/api/inventaire/categories", { method: "POST", body: JSON.stringify(data) });
    setCategories((prev) => [...prev, res.data].sort((a, b) => a.nom.localeCompare(b.nom)));
    return res.data;
  }, []);

  const modifier = useCallback(async (id: string, data: Record<string, unknown>) => {
    const res = await apiFetch<{ data: CategorieInv }>(`/api/inventaire/categories/${id}`, { method: "PUT", body: JSON.stringify(data) });
    setCategories((prev) => prev.map((c) => (c.id === id ? res.data : c)));
    return res.data;
  }, []);

  const supprimer = useCallback(async (id: string) => {
    await apiFetch(`/api/inventaire/categories/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { categories, loading, charger, creer, modifier, supprimer };
}