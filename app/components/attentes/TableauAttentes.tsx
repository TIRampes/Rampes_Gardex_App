// components/attentes/TableauAttentes.tsx
'use client';

import { Commande, Representant } from '@prisma/client';
import { getStatutCouleur, getServiceCouleur, formatDateCourte } from '@/lib/utils';
import { Inbox} from 'lucide-react';

interface CommandeWithRep extends Commande {
  representant: Representant | null;
}

interface TableauAttentesProps {
  commandes: CommandeWithRep[];
  onRowClick: (commande: CommandeWithRep) => void;
  onEnvoyerClick: (commande: CommandeWithRep) => void;
}

export default function TableauAttentes({ commandes, onRowClick, onEnvoyerClick }: TableauAttentesProps) {
  const getStatutCouleurWrapper = (valeur: any) => getStatutCouleur(valeur?.toString() || null);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700"># Projet</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Rep</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Client</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">Date d'entrée<br />Date prévue</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">Service</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">Mesure</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">Plan</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">Envoyé en<br />Production</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">Production<br />terminée</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">Terminé</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">Dernier envoi</th>
              <th className="px-4 py-3 text-center font-semibold text-slate-700">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {commandes.map((cmd) => (
              <tr
                key={cmd.id}
                className="hover:bg-slate-50 cursor-pointer"
                onClick={() => onRowClick(cmd)}
              >
                <td className="px-4 py-3 font-bold text-slate-800">{cmd.numero}</td>
                <td className="px-4 py-3 font-semibold">{cmd.representant?.nom || '-'}</td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{cmd.clientPresent || 'Inconnu'}</p>
                    {cmd.commentaire && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cmd.commentaire.split('\n')[0]}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="inline-block border border-slate-300 rounded overflow-hidden">
                    <div className="px-3 py-1 bg-white font-medium">{formatDateCourte(cmd.dateEntree)}</div>
                    <div className="px-3 py-1 bg-slate-50 text-slate-600">{formatDateCourte(cmd.datePrevue)}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-3 py-1 rounded text-xs font-bold ${getServiceCouleur(cmd.service)}`}>
                    {cmd.service.replace('_', ' ')}
                  </span>
                </td>
                <td className={`px-4 py-3 text-center font-semibold ${getStatutCouleurWrapper(cmd.mesure)}`}>
                  {cmd.mesure || '-'}
                </td>
                <td className={`px-4 py-3 text-center font-semibold ${getStatutCouleurWrapper(cmd.plan)}`}>
                  {cmd.plan || '-'}
                </td>
                <td className={`px-4 py-3 text-center font-semibold ${getStatutCouleurWrapper(cmd.envoyeProduction)}`}>
                  {cmd.envoyeProduction || '-'}
                </td>
                <td className={`px-4 py-3 text-center font-semibold ${getStatutCouleurWrapper(cmd.productionTerminee)}`}>
                  {cmd.productionTerminee || '-'}
                </td>
                <td className={`px-4 py-3 text-center font-semibold ${getStatutCouleurWrapper(cmd.termine)}`}>
                  {cmd.termine || '-'}
                </td>
                <td className="px-4 py-3 text-center text-slate-600">
                  {cmd.dateDernierEnvoiAttente ? formatDateCourte(cmd.dateDernierEnvoiAttente) : '-'}
                </td>
                <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onEnvoyerClick(cmd)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      cmd.attenteEnvoyee
                        ? 'bg-green-100 text-green-800 cursor-default'
                        : 'bg-orange-400 text-white hover:bg-orange-500 cursor-pointer'
                    }`}
                  >
                    {cmd.attenteEnvoyee ? '✓ Envoyée' : 'Envoyer'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {commandes.length === 0 && (
          <div className="p-12 text-center">
            <Inbox size={48} className="mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">Aucune commande en attente</p>
          </div>
        )}
      </div>
    </div>
  );
}