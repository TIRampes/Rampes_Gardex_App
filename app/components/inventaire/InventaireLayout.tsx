'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/app/components/ui/Tab'
import { Button } from '@/app/components/ui/Button'
import { Icon } from '@/app/components/icons/Icon'
import ListeProduits from '@/app/components/inventaire/ListeProduits'
import VueEntreesSorties from '@/app/components/inventaire/VueEntreeSorties'
import VueTransactions from '@/app/components/inventaire/VueTransactions'
import ModalProduit from '@/app/components/inventaire/ModalProduit'
import ModalFournisseur from '@/app/components/inventaire/ModalFournisseur'
import ModalUnite from '@/app/components/inventaire/ModalUnite'

export default function InventaireLayout() {
  const [activeTab, setActiveTab] = useState('liste')
  const [modalProduitOpen, setModalProduitOpen] = useState(false)
  const [modalFournisseurOpen, setModalFournisseurOpen] = useState(false)
  const [modalUniteOpen, setModalUniteOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">Inventaire</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setModalProduitOpen(true)}>
            <Icon name="Plus" size={16} className="mr-2" />
            Nouveau produit
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setModalFournisseurOpen(true)}>
            <Icon name="Building2" size={16} className="mr-2" />
            Fournisseur
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setModalUniteOpen(true)}>
            <Icon name="Ruler" size={16} className="mr-2" />
            Unités
          </Button>
        </div>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="liste">📦 Liste des produits</TabsTrigger>
          <TabsTrigger value="entrees-sorties">↔️ Entrées / Sorties</TabsTrigger>
          <TabsTrigger value="transactions">📋 Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="liste">
          <ListeProduits />
        </TabsContent>

        <TabsContent value="entrees-sorties">
          <VueEntreesSorties />
        </TabsContent>

        <TabsContent value="transactions">
          <VueTransactions />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ModalProduit
        isOpen={modalProduitOpen}
        onClose={() => setModalProduitOpen(false)}
      />
      <ModalFournisseur
        isOpen={modalFournisseurOpen}
        onClose={() => setModalFournisseurOpen(false)}
      />
      <ModalUnite
        isOpen={modalUniteOpen}
        onClose={() => setModalUniteOpen(false)}
      />
    </div>
  )
}