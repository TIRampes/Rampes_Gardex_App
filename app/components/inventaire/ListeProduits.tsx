'use client'

import { useMemo } from 'react'
import { useInventaire } from '@/app/hooks/useInventaire'
import StatsCards from './StatsCards'
import FiltresProduits from './FiltresProduits'
import TableauProduits from './TableauProduits'

export default function ListeProduits() {
  const {
    produits = [], // Valeur par défaut pour éviter undefined
    isLoadingProduits,
    deleteProduit,
  } = useInventaire()

  // Calcul des statistiques avec useMemo et vérifications de type
  const stats = useMemo(() => {
    if (!Array.isArray(produits)) {
      return { totalProduits: 0, alerteStock: 0, valeurStock: 0 }
    }

    const total = produits.length

    const alerte = produits.filter(p => 
      p && 
      typeof p.quantite === 'number' && 
      typeof p.seuilMin === 'number' && 
      p.quantite <= p.seuilMin && 
      p.seuilMin > 0
    ).length

    const valeur = produits.reduce((acc, p) => {
      const qte = typeof p.quantite === 'number' ? p.quantite : 0
      const prix = typeof p.prixUnitaire === 'number' ? p.prixUnitaire : 0
      return acc + (prix * qte)
    }, 0)

    return { totalProduits: total, alerteStock: alerte, valeurStock: valeur }
  }, [produits])

  const mouvementsJour = 0 // À connecter plus tard

  if (isLoadingProduits) {
    return <div className="p-12 text-center">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <StatsCards
        totalProduits={stats.totalProduits}
        alerteStock={stats.alerteStock}
        valeurStock={stats.valeurStock}
        mouvementsJour={mouvementsJour}
      />

      <FiltresProduits />

      <TableauProduits
        produits={produits}
        onEdit={(produit) => {
          // Tu pourras ouvrir le modal d'édition ici
          console.log('Éditer', produit)
        }}
        onDelete={(id) => {
          if (confirm('Supprimer ce produit ?')) {
            deleteProduit(id)
          }
        }}
      />
    </div>
  )
}