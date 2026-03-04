'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/app/components/ui/Modal'
import { Button } from '@/app/components/ui/Button'
import { Input } from '@/app/components/ui/Input'
import { Select } from '@/app/components/ui/Select'
import { useInventaire, Produit } from '@/app/hooks/useInventaire'

interface ModalProduitProps {
  isOpen: boolean
  onClose: () => void
  produitToEdit?: Produit
}

export default function ModalProduit({ isOpen, onClose, produitToEdit }: ModalProduitProps) {
  // Sécurisation des données avec valeurs par défaut
  const { categories = [], unites = [], fournisseurs = [], createProduit, updateProduit } = useInventaire()
  const [formData, setFormData] = useState<Partial<Produit>>({
    code: '',
    nom: '',
    description: '',
    categoriePieceId: '',
    couleur: '',
    uniteId: '',
    fournisseurId: '',
    quantite: 0,
    seuilMin: 0,
    prixUnitaire: 0,
    emplacement: '',
    codePieceNonPeinte: '',
    piecePeinte: false,
    achatFait: false,
    partiPeinture: 0,
  })

  // Initialisation du formulaire
  useEffect(() => {
    if (produitToEdit) {
      setFormData(produitToEdit)
    } else {
      setFormData({
        code: '',
        nom: '',
        description: '',
        categoriePieceId: '',
        couleur: '',
        uniteId: '',
        fournisseurId: '',
        quantite: 0,
        seuilMin: 0,
        prixUnitaire: 0,
        emplacement: '',
        codePieceNonPeinte: '',
        piecePeinte: false,
        achatFait: false,
        partiPeinture: 0,
      })
    }
  }, [produitToEdit])

  // Validation avant soumission
  const handleSubmit = () => {
    if (!formData.code || !formData.nom) {
      alert('Code et nom sont requis')
      return
    }
    if (produitToEdit) {
      updateProduit({ id: produitToEdit.id, data: formData })
    } else {
      createProduit(formData)
    }
    onClose()
  }

  // Sécurisation des tableaux avant de les mapper
  const safeCategories = Array.isArray(categories) ? categories : []
  const safeUnites = Array.isArray(unites) ? unites : []
  const safeFournisseurs = Array.isArray(fournisseurs) ? fournisseurs : []

  // Construction des options pour les selects
  const optionsCategories = [
    { value: '', label: 'Sélectionner...' },
    ...safeCategories.map((c) => ({ value: c.id, label: c.nom })),
  ]
  const optionsUnites = [
    { value: '', label: 'Sélectionner...' },
    ...safeUnites.map((u) => ({ value: u.id, label: u.unite })),
  ]
  const optionsFournisseurs = [
    { value: '', label: 'Sélectionner...' },
    ...safeFournisseurs.map((f) => ({ value: f.id, label: f.nom })),
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={produitToEdit ? 'Modifier le produit' : 'Nouveau produit'}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            {produitToEdit ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Code et Nom */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Code *</label>
            <Input
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nom *</label>
            <Input
              value={formData.nom || ''}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Input
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* Catégorie et Couleur */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Catégorie</label>
            <Select
              options={optionsCategories}
              value={formData.categoriePieceId || ''}
              onChange={(e) => setFormData({ ...formData, categoriePieceId: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Couleur</label>
            <Input
              value={formData.couleur || ''}
              onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
            />
          </div>
        </div>

        {/* Unité et Fournisseur */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Unité</label>
            <Select
              options={optionsUnites}
              value={formData.uniteId || ''}
              onChange={(e) => setFormData({ ...formData, uniteId: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fournisseur principal</label>
            <Select
              options={optionsFournisseurs}
              value={formData.fournisseurId || ''}
              onChange={(e) => setFormData({ ...formData, fournisseurId: e.target.value })}
            />
          </div>
        </div>

        {/* Quantité, Seuil, Prix */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Quantité</label>
            <Input
              type="number"
              value={formData.quantite ?? 0}
              onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Seuil min</label>
            <Input
              type="number"
              value={formData.seuilMin ?? 0}
              onChange={(e) => setFormData({ ...formData, seuilMin: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Prix unitaire ($)</label>
            <Input
              type="number"
              step="0.01"
              value={formData.prixUnitaire ?? 0}
              onChange={(e) => setFormData({ ...formData, prixUnitaire: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        {/* Emplacement */}
        <div>
          <label className="block text-sm font-medium mb-1">Emplacement</label>
          <Input
            value={formData.emplacement || ''}
            onChange={(e) => setFormData({ ...formData, emplacement: e.target.value })}
          />
        </div>

        {/* Code pièce non peinte et Parti peinture */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Code pièce non peinte</label>
            <Input
              value={formData.codePieceNonPeinte || ''}
              onChange={(e) => setFormData({ ...formData, codePieceNonPeinte: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Parti peinture</label>
            <Input
              type="number"
              value={formData.partiPeinture ?? 0}
              onChange={(e) => setFormData({ ...formData, partiPeinture: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.piecePeinte || false}
              onChange={(e) => setFormData({ ...formData, piecePeinte: e.target.checked })}
            />
            Pièce peinte
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.achatFait || false}
              onChange={(e) => setFormData({ ...formData, achatFait: e.target.checked })}
            />
            Achat fait
          </label>
        </div>
      </div>
    </Modal>
  )
}