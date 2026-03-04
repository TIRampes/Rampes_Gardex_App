'use client'

import { useState } from 'react'
import { Modal } from '@/app/components/ui/Modal'
import { Button } from '@/app/components/ui/Button'
import { Input } from '@/app/components/ui/Input'
import { useInventaire } from '@/app/hooks/useInventaire'

interface ModalUniteProps {
  isOpen: boolean
  onClose: () => void
}

export default function ModalUnite({ isOpen, onClose }: ModalUniteProps) {
  const { unites = [], createUnite, deleteUnite } = useInventaire()
  const [newUnite, setNewUnite] = useState('')
  const [qtePar, setQtePar] = useState(1)
  const [description, setDescription] = useState('')

  const handleAdd = () => {
    if (!newUnite) return
    createUnite({ unite: newUnite, qtePar, description })
    setNewUnite('')
    setQtePar(1)
    setDescription('')
  }

  // S'assurer que unites est un tableau
  const unitesArray = Array.isArray(unites) ? unites : []

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestion des unités"
      size="lg"
      footer={
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Liste existante */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-2 text-left">Unité</th>
                <th className="px-4 py-2 text-left">Qté par unité</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {unitesArray.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-2">{u.unite || '-'}</td>
                  <td className="px-4 py-2">{u.qtePar ?? 0}</td>
                  <td className="px-4 py-2">{u.description || '-'}</td>
                  <td className="px-4 py-2 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Supprimer cette unité ?')) {
                          deleteUnite(u.id)
                        }
                      }}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </td>
                </tr>
              ))}
              {unitesArray.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Aucune unité trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Ajout */}
        <div className="bg-slate-50 p-4 rounded-lg">
          <h3 className="font-medium mb-3">Ajouter une unité</h3>
          <div className="grid grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">Unité</label>
              <Input
                value={newUnite}
                onChange={(e) => setNewUnite(e.target.value)}
                placeholder="ex: Boîte"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantité par unité</label>
              <Input
                type="number"
                value={qtePar}
                onChange={(e) => setQtePar(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Button onClick={handleAdd} disabled={!newUnite}>
                Ajouter
              </Button>
            </div>
          </div>
          <div className="mt-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}