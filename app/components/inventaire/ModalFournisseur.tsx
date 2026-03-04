'use client'

import { useEffect, useState } from 'react'
import { Modal } from '@/app/components/ui/Modal'
import { Button } from '@/app/components/ui/Button'
import { Input } from '@/app/components/ui/Input'
import { useInventaire, Fournisseur } from '@/app/hooks/useInventaire'

interface ModalFournisseurProps {
  isOpen: boolean
  onClose: () => void
  fournisseurToEdit?: Fournisseur
}

export default function ModalFournisseur({ isOpen, onClose, fournisseurToEdit }: ModalFournisseurProps) {
  const { createFournisseur, updateFournisseur } = useInventaire()
  const [formData, setFormData] = useState<Partial<Fournisseur>>({
    nom: '',
    contact: '',
    telephone: '',
    email: '',
    adresse: '',
    notes: '',
  })

  useEffect(() => {
    if (fournisseurToEdit) {
      setFormData(fournisseurToEdit)
    } else {
      setFormData({
        nom: '',
        contact: '',
        telephone: '',
        email: '',
        adresse: '',
        notes: '',
      })
    }
  }, [fournisseurToEdit])

  const handleSubmit = () => {
    if (!formData.nom) {
      alert('Le nom est requis')
      return
    }
    if (fournisseurToEdit) {
      updateFournisseur({ id: fournisseurToEdit.id, data: formData })
    } else {
      createFournisseur(formData)
    }
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={fournisseurToEdit ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            {fournisseurToEdit ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nom *</label>
          <Input
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Contact</label>
          <Input
            value={formData.contact || ''}
            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Téléphone</label>
            <Input
              value={formData.telephone || ''}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Adresse</label>
          <Input
            value={formData.adresse || ''}
            onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </div>
    </Modal>
  )
}