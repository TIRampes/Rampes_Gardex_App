'use client'

import { useState, useEffect } from 'react'
import { useInventaire } from '@/app/hooks/useInventaire'
import { Input } from '@/app/components/ui/Input'
import { Button } from '@/app/components/ui/Button'
import { Select } from '@/app/components/ui/Select'
import { Icon } from '@/app/components/icons/Icon'

export default function FiltresProduits() {
  const { searchParams, setSearchParam, clearFilters, categories = [], fournisseurs = [] } = useInventaire()
  const [search, setSearch] = useState(searchParams?.get('search') || '')
  const [categorie, setCategorie] = useState(searchParams?.get('categorieId') || '')
  const [fournisseur, setFournisseur] = useState(searchParams?.get('fournisseurId') || '')
  const [pointCommande, setPointCommande] = useState(searchParams?.get('pointCommande') === 'true')

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParam('search', search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, setSearchParam])

  const handleCategorieChange = (value: string) => {
    setCategorie(value)
    setSearchParam('categorieId', value)
  }

  const handleFournisseurChange = (value: string) => {
    setFournisseur(value)
    setSearchParam('fournisseurId', value)
  }

  const handlePointCommandeChange = (checked: boolean) => {
    setPointCommande(checked)
    setSearchParam('pointCommande', checked ? 'true' : '')
  }

  const handleClear = () => {
    setSearch('')
    setCategorie('')
    setFournisseur('')
    setPointCommande(false)
    clearFilters()
  }

  const optionsCategories = [
    { value: '', label: 'Toutes les catégories' },
    ...(Array.isArray(categories) ? categories.map((c) => ({ value: c.id, label: c.nom })) : []),
  ]

  const optionsFournisseurs = [
    { value: '', label: 'Tous les fournisseurs' },
    ...(Array.isArray(fournisseurs) ? fournisseurs.map((f) => ({ value: f.id, label: f.nom })) : []),
  ]

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Recherche</label>
          <Input
            placeholder="Code, nom, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
          <Select
            options={optionsCategories}
            value={categorie}
            onChange={(e) => handleCategorieChange(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fournisseur</label>
          <Select
            options={optionsFournisseurs}
            value={fournisseur}
            onChange={(e) => handleFournisseurChange(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={pointCommande}
              onChange={(e) => handlePointCommandeChange(e.target.checked)}
              className="rounded border-slate-300"
            />
            Point commande atteint
          </label>
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <Icon name="X" size={16} className="mr-1" />
            Effacer
          </Button>
        </div>
      </div>
    </div>
  )
}