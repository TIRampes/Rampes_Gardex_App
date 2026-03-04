'use client'

import { useState } from 'react'
import { useInventaire } from '@/app/hooks/useInventaire'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/app/components/ui/Table'
import { Input } from '@/app/components/ui/Input'
import { Button } from '@/app/components/ui/Button'
import { formatDate } from '@/lib/utils'

export default function VueTransactions() {
  const [recherche, setRecherche] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')

  const { useMouvements } = useInventaire()
  const { data: mouvementsData = [], isLoading } = useMouvements(undefined, dateDebut, dateFin)

  // Sécuriser les données
  const mouvements = Array.isArray(mouvementsData) ? mouvementsData : []

  // Filtrer en vérifiant l'existence des propriétés
  const filtered = mouvements.filter((m) => {
    if (!m?.produit) return false
    const code = m.produit.code?.toLowerCase() || ''
    const nom = m.produit.nom?.toLowerCase() || ''
    const searchLower = recherche.toLowerCase()
    return code.includes(searchLower) || nom.includes(searchLower)
  })

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">Recherche</label>
            <Input
              placeholder="Code ou description"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium mb-1">Date début</label>
            <Input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
            />
          </div>
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium mb-1">Date fin</label>
            <Input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setRecherche('')
              setDateDebut('')
              setDateFin('')
            }}
          >
            Effacer
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Quantité</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-center">Avant</TableHead>
                <TableHead className="text-center">Après</TableHead>
                <TableHead>Référence</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                    Aucune transaction
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m) => {
                  // Valeurs par défaut pour éviter les erreurs d'affichage
                  const code = m.produit?.code || '-'
                  const nom = m.produit?.nom || '-'
                  const quantite = m.quantite ?? 0
                  const type = m.type || ''
                  const quantiteAvant = m.quantiteAvant ?? 0
                  const quantiteApres = m.quantiteApres ?? 0
                  const reference = m.reference || '-'
                  const date = m.createdAt ? formatDate(m.createdAt) : '-'

                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{code}</TableCell>
                      <TableCell>{nom}</TableCell>
                      <TableCell className="text-center font-bold">{quantite}</TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            type === 'ENTREE'
                              ? 'bg-green-100 text-green-800'
                              : type === 'SORTIE'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {type}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{quantiteAvant}</TableCell>
                      <TableCell className="text-center">{quantiteApres}</TableCell>
                      <TableCell>{reference}</TableCell>
                      <TableCell>{date}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}