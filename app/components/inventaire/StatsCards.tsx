import { Card, CardContent } from '@/app/components/ui/Card'
import { Package, AlertTriangle, DollarSign, ArrowLeftRight } from 'lucide-react'

interface StatsCardsProps {
  totalProduits: number
  alerteStock: number
  valeurStock: number
  mouvementsJour: number
}

export default function StatsCards({
  totalProduits,
  alerteStock,
  valeurStock,
  mouvementsJour,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Total produits</p>
            <p className="text-3xl font-bold">{totalProduits}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full text-blue-600">
            <Package size={24} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Alerte stock</p>
            <p className="text-3xl font-bold text-amber-600">{alerteStock}</p>
          </div>
          <div className="p-3 bg-amber-100 rounded-full text-amber-600">
            <AlertTriangle size={24} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Valeur totale</p>
            <p className="text-3xl font-bold">{valeurStock.toLocaleString()} $</p>
          </div>
          <div className="p-3 bg-green-100 rounded-full text-green-600">
            <DollarSign size={24} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Mouvements aujourd'hui</p>
            <p className="text-3xl font-bold">{mouvementsJour}</p>
          </div>
          <div className="p-3 bg-purple-100 rounded-full text-purple-600">
            <ArrowLeftRight size={24} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}