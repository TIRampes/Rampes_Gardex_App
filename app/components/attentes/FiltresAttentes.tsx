// components/attentes/FiltresAttentes.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { Icon } from '@/app/components/icons/Icon';
import { Representant } from '@prisma/client';

interface FiltresAttentesProps {
  representants: Representant[];
  selectedRepresentants: string[];
  onToggleRepresentant: (id: string) => void;
  onClear: () => void;
}

export default function FiltresAttentes({
  representants,
  selectedRepresentants,
  onToggleRepresentant,
  onClear,
}: FiltresAttentesProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getAttentesCount = (repId: string) => {
    // sera géré par le parent via les données chargées, mais ici on peut juste afficher le nombre de commandes associées
    // on laisse le parent passer une prop si besoin
    return 0;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="relative">
        <div className="flex items-center gap-2">
          {selectedRepresentants.map((repId) => {
            const rep = representants.find(r => r.id === repId);
            return rep ? (
              <span key={repId} className="flex items-center gap-1 bg-slate-200 px-3 py-1 rounded-lg text-sm">
                {rep.nom}
                <button onClick={() => onToggleRepresentant(repId)} className="hover:text-red-600">
                  <Icon name="X" size={14} />
                </button>
              </span>
            ) : null;
          })}

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50"
            >
              <span className="text-sm text-slate-600">Filtrer par représentant</span>
              <Icon name="ChevronDown" size={16} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[280px]">
                {representants.map((rep) => (
                  <button
                    key={rep.id}
                    onClick={() => {
                      onToggleRepresentant(rep.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between ${
                      selectedRepresentants.includes(rep.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{rep.nom}</p>
                      <p className="text-sm text-slate-500">{rep.email}</p>
                    </div>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                      {/* Nombre d'attentes pour ce représentant - à passer en prop */}
                      0 attente(s)
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 rounded" />
          <Icon name="Mail" size={14} />
          Envoi auto. chaque lundi
        </label>

        <Button variant="default" size="sm" onClick={() => {}} className="bg-teal-500 hover:bg-teal-600 text-white">
          <Icon name="Mail" size={18} className="mr-2" />
          Envoyer les attentes
        </Button>
      </div>
    </div>
  );
}