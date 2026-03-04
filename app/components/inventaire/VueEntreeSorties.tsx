'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/app/components/ui/Card'
import { Button } from '@/app/components/ui/Button'
import { Input } from '@/app/components/ui/Input'
import { Select } from '@/app/components/ui/Select'
import { useInventaire } from '@/app/hooks/useInventaire'

export default function VueEntreesSorties() {
  const { produits = [], createMouvement } = useInventaire()
  const [selectedProduitId, setSelectedProduitId] = useState('')
  const [type, setType] = useState<'ENTREE' | 'SORTIE' | 'AJUSTEMENT'>('ENTREE')
  const [quantite, setQuantite] = useState(0)
  const [notes, setNotes] = useState('')

  // Sécuriser l'accès à produits
  const produitsArray = Array.isArray(produits) ? produits : []

  const selectedProduit = produitsArray.find(p => p?.id === selectedProduitId)

  const handleSubmit = () => {
    if (!selectedProduitId || quantite <= 0) {
      alert('Veuillez sélectionner un produit et une quantité valide')
      return
    }
    createMouvement({
      produitId: selectedProduitId,
      type,
      quantite,
      notes,
    })
    setSelectedProduitId('')
    setType('ENTREE')
    setQuantite(0)
    setNotes('')
  }

  const optionsProduits = [
    { value: '', label: 'Choisir...' },
    ...produitsArray.map(p => ({
      value: p.id,
      label: `${p.code || ''} - ${p.nom || 'Sans nom'}`,
    })),
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Ajouter un mouvement</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Produit</label>
              <Select
                options={optionsProduits}
                value={selectedProduitId}
                onChange={(e) => setSelectedProduitId(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <Select
                options={[
                  { value: 'ENTREE', label: 'Entrée' },
                  { value: 'SORTIE', label: 'Sortie' },
                  { value: 'AJUSTEMENT', label: 'Ajustement' },
                ]}
                value={type}
                onChange={(e) => setType(e.target.value as 'ENTREE' | 'SORTIE' | 'AJUSTEMENT')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantité</label>
              <Input
                type="number"
                value={quantite}
                onChange={(e) => setQuantite(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSubmit}>Enregistrer</Button>
            </div>
          </div>
          {selectedProduit && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm">
                Stock actuel : <strong>{selectedProduit.quantite ?? 0}</strong>{' '}
                {selectedProduit.unite?.unite || ''}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section réception commande (à implémenter) */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Réceptionner une commande</h2>
          <p className="text-slate-500">En développement...</p>
        </CardContent>
      </Card>
    </div>
  )
}