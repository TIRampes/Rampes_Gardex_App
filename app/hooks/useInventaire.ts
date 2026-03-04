import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

export interface Produit {
  id: string
  code: string
  nom: string
  description?: string | null
  categoriePieceId?: string | null
  categoriePiece?: { id: string; nom: string } | null
  couleur?: string | null
  uniteId?: string | null
  unite?: { id: string; unite: string } | null
  fournisseurId?: string | null
  fournisseur?: { id: string; nom: string } | null
  quantite: number
  seuilMin: number
  prixUnitaire?: number | null
  emplacement?: string | null
  codePieceNonPeinte?: string | null
  piecePeinte: boolean
  achatFait: boolean
  partiPeinture: number
  // ... autres champs
}

export interface Fournisseur {
  id: string
  nom: string
  contact?: string
  telephone?: string
  email?: string
  adresse?: string
  notes?: string
}

export interface Unite {
  id: string
  unite: string
  qtePar: number
  description?: string
}

export interface Categorie {
  id: string
  nom: string
}

export interface Mouvement {
  id: string
  produitId: string
  produit: Produit
  commandeId?: string
  type: string
  quantite: number
  quantiteAvant: number
  quantiteApres: number
  reference?: string
  notes?: string
  createdAt: string
}

// Fonctions API
const api = {
  produits: {
    list: async (params?: URLSearchParams) => {
      const url = `/api/produits${params ? `?${params}` : ''}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Erreur chargement produits')
      return res.json()
    },
    create: async (data: Partial<Produit>) => {
      const res = await fetch('/api/produits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Erreur création produit')
      return res.json()
    },
    update: async (id: string, data: Partial<Produit>) => {
      const res = await fetch(`/api/produits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Erreur mise à jour produit')
      return res.json()
    },
    delete: async (id: string) => {
      const res = await fetch(`/api/produits/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur suppression produit')
      return res.json()
    },
  },
  fournisseurs: {
    list: async (search?: string) => {
      const url = search ? `/api/fournisseurs?search=${search}` : '/api/fournisseurs'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Erreur chargement fournisseurs')
      return res.json()
    },
    create: async (data: Partial<Fournisseur>) => {
      const res = await fetch('/api/fournisseurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Erreur création fournisseur')
      return res.json()
    },
    update: async (id: string, data: Partial<Fournisseur>) => {
      const res = await fetch(`/api/fournisseurs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Erreur mise à jour fournisseur')
      return res.json()
    },
    delete: async (id: string) => {
      const res = await fetch(`/api/fournisseurs/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur suppression fournisseur')
      return res.json()
    },
  },
  unites: {
    list: async () => {
      const res = await fetch('/api/unites')
      if (!res.ok) throw new Error('Erreur chargement unités')
      return res.json()
    },
    create: async (data: Partial<Unite>) => {
      const res = await fetch('/api/unites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Erreur création unité')
      return res.json()
    },
    delete: async (id: string) => {
      const res = await fetch(`/api/unites/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur suppression unité')
      return res.json()
    },
  },
  categories: {
    list: async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Erreur chargement catégories')
      return res.json()
    },
  },
  mouvements: {
    list: async (produitId?: string, debut?: string, fin?: string) => {
      const params = new URLSearchParams()
      if (produitId) params.set('produitId', produitId)
      if (debut) params.set('debut', debut)
      if (fin) params.set('fin', fin)
      const res = await fetch(`/api/mouvements?${params}`)
      if (!res.ok) throw new Error('Erreur chargement mouvements')
      return res.json()
    },
    create: async (data: Partial<Mouvement>) => {
      const res = await fetch('/api/mouvements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Erreur création mouvement')
      return res.json()
    },
  },
}

export function useInventaire() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useState<URLSearchParams>(new URLSearchParams())

  // Produits
  const produitsQuery = useQuery({
    queryKey: ['produits', searchParams.toString()],
    queryFn: () => api.produits.list(searchParams),
  })

  const createProduitMutation = useMutation({
    mutationFn: api.produits.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produits'] })
      toast.success('Produit créé avec succès')
    },
    onError: (error) => toast.error(error.message),
  })

  const updateProduitMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Produit> }) =>
      api.produits.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produits'] })
      toast.success('Produit mis à jour')
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteProduitMutation = useMutation({
    mutationFn: api.produits.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produits'] })
      toast.success('Produit supprimé')
    },
    onError: (error) => toast.error(error.message),
  })

  // Fournisseurs
  const fournisseursQuery = useQuery({
    queryKey: ['fournisseurs'],
    queryFn: () => api.fournisseurs.list(),
  })

  const createFournisseurMutation = useMutation({
    mutationFn: api.fournisseurs.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fournisseurs'] })
      toast.success('Fournisseur créé')
    },
    onError: (error) => toast.error(error.message),
  })

  const updateFournisseurMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Fournisseur> }) =>
      api.fournisseurs.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fournisseurs'] })
      toast.success('Fournisseur mis à jour')
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteFournisseurMutation = useMutation({
    mutationFn: api.fournisseurs.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fournisseurs'] })
      toast.success('Fournisseur supprimé')
    },
    onError: (error) => toast.error(error.message),
  })

  // Unités
  const unitesQuery = useQuery({
    queryKey: ['unites'],
    queryFn: api.unites.list,
  })

  const createUniteMutation = useMutation({
    mutationFn: api.unites.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unites'] })
      toast.success('Unité créée')
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteUniteMutation = useMutation({
    mutationFn: api.unites.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unites'] })
      toast.success('Unité supprimée')
    },
    onError: (error) => toast.error(error.message),
  })

  // Catégories
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: api.categories.list,
  })

  // Mouvements
  const mouvementsQuery = (produitId?: string, debut?: string, fin?: string) =>
    useQuery({
      queryKey: ['mouvements', produitId, debut, fin],
      queryFn: () => api.mouvements.list(produitId, debut, fin),
    })

  const createMouvementMutation = useMutation({
    mutationFn: api.mouvements.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produits'] })
      queryClient.invalidateQueries({ queryKey: ['mouvements'] })
      toast.success('Mouvement enregistré')
    },
    onError: (error) => toast.error(error.message),
  })

  return {
    // Produits
    produits: produitsQuery.data ?? [],
    isLoadingProduits: produitsQuery.isLoading,
    refetchProduits: produitsQuery.refetch,
    createProduit: createProduitMutation.mutate,
    updateProduit: updateProduitMutation.mutate,
    deleteProduit: deleteProduitMutation.mutate,

    // Fournisseurs
    fournisseurs: fournisseursQuery.data ?? [],
    isLoadingFournisseurs: fournisseursQuery.isLoading,
    createFournisseur: createFournisseurMutation.mutate,
    updateFournisseur: updateFournisseurMutation.mutate,
    deleteFournisseur: deleteFournisseurMutation.mutate,

    // Unités
    unites: unitesQuery.data ?? [],
    isLoadingUnites: unitesQuery.isLoading,
    createUnite: createUniteMutation.mutate,
    deleteUnite: deleteUniteMutation.mutate,

    // Catégories
    categories: categoriesQuery.data ?? [],

    // Mouvements
    useMouvements: mouvementsQuery,
    createMouvement: createMouvementMutation.mutate,

    // Filtres
    searchParams,
    setSearchParam: (key: string, value: string) => {
      const newParams = new URLSearchParams(searchParams)
      if (value) newParams.set(key, value)
      else newParams.delete(key)
      setSearchParams(newParams)
    },
    clearFilters: () => setSearchParams(new URLSearchParams()),
  }
}