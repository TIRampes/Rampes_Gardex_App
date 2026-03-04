// components/attentes/StatsAttentes.tsx
import { Card, CardContent } from '@/app/components/ui/Card';
import { Icon } from '@/app/components/icons/Icon';

interface StatsAttentesProps {
  totalAttentes: number;
  totalCommandes: number;
}

export default function StatsAttentes({ totalAttentes, totalCommandes }: StatsAttentesProps) {
  return (
    <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
      <div className="text-center">
        <p className="text-2xl font-bold text-slate-800">{totalAttentes}</p>
        <p className="text-xs text-slate-500">En attente</p>
      </div>
      <div className="w-px h-10 bg-slate-200" />
      <div className="text-center">
        <p className="text-2xl font-bold text-slate-800">{totalCommandes}</p>
        <p className="text-xs text-slate-500">Commandes totales</p>
      </div>
    </div>
  );
}