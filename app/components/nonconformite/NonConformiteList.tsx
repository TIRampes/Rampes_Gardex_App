'use client';

import { useState } from 'react';
import { Icon } from '@/app/components/icons/Icon';

// Types des relations
type Departement = { nom: string };
type Responsable = { nom: string };
type TypeNC = { nom: string };

// Type de la non-conformité
export type NonConformite = {
  id: number;
  noProjet?: string | null;
  description?: string | null;
  dateDetection: string;
  departement?: Departement | null;
  responsable?: Responsable | null;
  type?: TypeNC | null;
  departementTexte?: string | null;
  responsableTexte?: string | null;
};

// Props du composant
type Props = {
  data: NonConformite[];
  loading: boolean;
  onEdit: (item: NonConformite) => void;
  onDelete: (id: number) => void;
  onRowClick?: (item: NonConformite) => void; // Nouvelle prop pour le clic sur la ligne
};

export default function NonConformiteList({
  data,
  loading,
  onEdit,
  onDelete,
  onRowClick,
}: Props) {

  // États des filtres
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterResp, setFilterResp] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Filtrage des données
  const filteredData = data.filter((item) => {
    const matchSearch =
      !search ||
      item.noProjet?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase()) ||
      item.type?.nom?.toLowerCase().includes(search.toLowerCase());

    const matchDept = !filterDept || item.departement?.nom === filterDept;
    const matchResp = !filterResp || item.responsable?.nom === filterResp;
    const matchDate =
      !filterDate || item.dateDetection?.split('T')[0] === filterDate;

    return matchSearch && matchDept && matchResp && matchDate;
  });

  // Listes uniques pour les select
  const uniqueDepts = [...new Set(data.map((d) => d.departement?.nom).filter(Boolean))];
  const uniqueResps = [...new Set(data.map((d) => d.responsable?.nom).filter(Boolean))];

  if (loading) return <div className="text-center py-12">Chargement...</div>;

  return (
    <div className="space-y-4">

      {/* Filtres */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

          <input
            type="text"
            placeholder="Rechercher (projet, description, type...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-400"
          />

          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white"
          >
            <option value="">Tous les départements</option>
            {uniqueDepts.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={filterResp}
            onChange={(e) => setFilterResp(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white"
          >
            <option value="">Tous les responsables</option>
            {uniqueResps.map((resp) => (
              <option key={resp} value={resp}>{resp}</option>
            ))}
          </select>

          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl"
          />

          <button
            onClick={() => {
              setSearch('');
              setFilterDept('');
              setFilterResp('');
              setFilterDate('');
            }}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2"
          >
            <Icon name="x" size={16} />
            Réinitialiser
          </button>

        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase"># Projet</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Département</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Responsable</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Non-conformité</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">

              {filteredData.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  <td className="px-6 py-4 text-sm text-slate-600">{new Date(item.dateDetection).toLocaleDateString('fr-CA')}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{item.noProjet || '-'}</td>
                  <td className="px-6 py-4">{item.departement?.nom || item.departementTexte || '-'}</td>
                  <td className="px-6 py-4">{item.responsable?.nom || item.responsableTexte || '-'}</td>
                  <td className="px-6 py-4">{item.type?.nom || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">{item.description}</td>
                  <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(item);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Modifier"
                      >
                        <Icon name="edit" size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.id);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Supprimer"
                      >
                        <Icon name="x" size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

            </tbody>
          </table>

          {filteredData.length === 0 && (
            <div className="p-12 text-center text-slate-500">Aucune non-conformité trouvée</div>
          )}
        </div>
      </div>

    </div>
  );
}