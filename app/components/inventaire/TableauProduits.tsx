'use client'

import { useState } from 'react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/app/components/ui/Table'
import { Badge } from '@/app/components/ui/Badge'
import { Button } from '@/app/components/ui/Button'
import { Icon } from '@/app/components/icons/Icon'
import { Produit } from '@/app/hooks/useInventaire'
import ModalProduit from '@/app/components/inventaire/ModalProduit'

interface TableauProduitsProps {
  produits: Produit[]
  onEdit: (produit: Produit) => void
  onDelete: (id: string) => void
}

export default function TableauProduits({ produits, onEdit, onDelete }: TableauProduitsProps) {
  const [editingProduit, setEditingProduit] = useState<Produit | null>(null)

  const getStockColor = (quantite: number, seuilMin: number) => {
    if (seuilMin === 0) return ''
    if (quantite <= 0) return 'bg-red-100'
    if (quantite <= seuilMin) return 'bg-amber-100'
    return 'bg-green-100'
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Couleur</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center">Point commande</TableHead>
                <TableHead className="text-center">Achat fait</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produits.map((produit, index) => (
                <TableRow key={produit.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <TableCell className="font-medium">{produit.code}</TableCell>
                  <TableCell>{produit.nom}</TableCell>
                  <TableCell>{produit.couleur || '-'}</TableCell>
                  <TableCell>{produit.categoriePiece?.nom || '-'}</TableCell>
                  <TableCell>{produit.fournisseur?.nom || '-'}</TableCell>
                  <TableCell>{produit.unite?.unite || '-'}</TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStockColor(produit.quantite, produit.seuilMin)}`}>
                      {produit.quantite}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {produit.seuilMin > 0 ? (
                      <Badge variant={produit.quantite <= produit.seuilMin ? 'destructive' : 'outline'}>
                        {produit.seuilMin}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {produit.achatFait ? (
                      <Badge variant="success">✓</Badge>
                    ) : (
                      <Badge variant="secondary">—</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(produit)}
                        title="Modifier"
                      >
                        <Icon name="Pencil" size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(produit.id)}
                        title="Supprimer"
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {produits.length === 0 && (
            <div className="p-12 text-center text-slate-500">Aucun produit trouvé</div>
          )}
        </div>
      </div>

      {/* Modal d'édition */}
      {editingProduit && (
        <ModalProduit
          isOpen={!!editingProduit}
          onClose={() => setEditingProduit(null)}
          produitToEdit={editingProduit}
        />
      )}
    </>
  )
}