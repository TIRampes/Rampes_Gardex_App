'use client';

import { useState, useEffect } from 'react';
import { useReprises } from '@/app/hooks/useReprise';
import type { RepriseView, RepriseUpdate } from '@/app/api/reprises/schema';
import {
  getTypeInfo, getStatutInfo, getPrioriteInfo,
  formaterDate, formaterDateCourte,
  TYPE_REPRISE_MAP, STATUT_REPRISE_MAP, PRIORITE_MAP,
} from '@/app/api/reprises/schema';

// ╔══════════════════════════════════════════════════════╗
// ║            PAGE REPRISES - RAMPES GARDEX              ║
// ╚══════════════════════════════════════════════════════╝

export default function ReprisesPage() {
  const { actives, historique, stats, loading, charger, modifier, supprimer, completer, envoyerConseils } = useReprises();

  // === ÉTATS ===
  const [onglet, setOnglet] = useState<'actives' | 'historique' | 'statistiques' | 'conseils'>('actives');
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState('');
  const [filtrePriorite, setFiltrePriorite] = useState('');
  const [filtrePeriode, setFiltrePeriode] = useState('tout');
  const [statsPeriode, setStatsPeriode] = useState('');

  // Modals
  const [repriseDetail, setRepriseDetail] = useState<RepriseView | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [repriseEdition, setRepriseEdition] = useState<RepriseView | null>(null);
  const [showEdition, setShowEdition] = useState(false);
  const [repriseACompleter, setRepriseACompleter] = useState<RepriseView | null>(null);
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [envoiConseilsEnCours, setEnvoiConseilsEnCours] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); } }, [toast]);

  // === CHARGEMENT ===
  useEffect(() => {
    charger({ statsPeriode, ...(statsPeriode === 'annee' ? { statsAnnee: String(new Date().getFullYear()) } : {}) });
  }, [charger, statsPeriode]);

  // === FILTRAGE LOCAL ===
  const filtrer = (data: RepriseView[]) => {
    return data.filter((r) => {
      const matchRecherche = !recherche ||
        r.commandeNumero.toLowerCase().includes(recherche.toLowerCase()) ||
        r.clientNom.toLowerCase().includes(recherche.toLowerCase()) ||
        r.raison.toLowerCase().includes(recherche.toLowerCase());
      const matchType = !filtreType || r.typeReprise === filtreType;
      const matchPriorite = !filtrePriorite || r.priorite === filtrePriorite;
      return matchRecherche && matchType && matchPriorite;
    });
  };

  const filtrerParPeriode = (data: RepriseView[]) => {
    const now = new Date();
    return data.filter((r) => {
      const d = new Date(r.dateReprise);
      switch (filtrePeriode) {
        case 'jour': return d.toDateString() === now.toDateString();
        case 'semaine': {
          const deb = new Date(now); deb.setDate(now.getDate() - now.getDay()); deb.setHours(0, 0, 0, 0);
          const fin = new Date(deb); fin.setDate(deb.getDate() + 7);
          return d >= deb && d < fin;
        }
        case 'mois': return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        case 'annee': return d.getFullYear() === now.getFullYear();
        default: return true;
      }
    });
  };

  const activesFiltrees = filtrerParPeriode(filtrer(actives));
  const historiqueFiltree = filtrer(historique);
  const toutesReprises = [...actives, ...historique];

  // === ACTIONS ===
  const handleCompleter = async () => {
    if (!repriseACompleter) return;
    try {
      await completer(repriseACompleter.id);
      setToast({ message: 'Reprise complétée', type: 'success' });
      charger({ statsPeriode });
    } catch (e: any) { setToast({ message: e.message, type: 'error' }); }
    setShowConfirmComplete(false); setRepriseACompleter(null); setShowDetail(false);
  };

  const handleSupprimer = async (id: string) => {
    try {
      await supprimer(id);
      setToast({ message: 'Reprise supprimée', type: 'success' });
      charger({ statsPeriode });
    } catch (e: any) { setToast({ message: e.message, type: 'error' }); }
    setShowConfirmDelete(null);
  };

  const handleSauvegarder = async () => {
    if (!repriseEdition) return;
    try {
      await modifier(repriseEdition.id, {
        typeReprise: repriseEdition.typeReprise,
        raison: repriseEdition.raison,
        dateReprise: repriseEdition.dateReprise.split('T')[0],
        dateOrigine: repriseEdition.dateOrigine?.split('T')[0],
        nombreReprises: repriseEdition.nombreReprises,
        tempsEstime: repriseEdition.tempsEstime,
        priorite: repriseEdition.priorite,
        responsable: repriseEdition.responsable || undefined,
        notes: repriseEdition.notes || undefined,
      });
      setToast({ message: 'Reprise modifiée', type: 'success' });
      setShowEdition(false); setRepriseEdition(null);
      charger({ statsPeriode });
    } catch (e: any) { setToast({ message: e.message, type: 'error' }); }
  };

  const handleEnvoyerConseils = async () => {
    setEnvoiConseilsEnCours(true);
    try {
      const res = await envoyerConseils();
      setToast({ message: `${res.envoyes} email(s) de conseils envoyé(s) via Microsoft 365`, type: 'success' });
    } catch (e: any) { setToast({ message: e.message || 'Erreur envoi', type: 'error' }); }
    setEnvoiConseilsEnCours(false);
  };

  // === KEBAB MENU ===
  const KebabMenu = ({ reprise }: { reprise: RepriseView }) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setOpen(!open)} className="p-[0.375rem] hover:bg-slate-200 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-[0.25rem] bg-white border border-slate-200 rounded-lg shadow-xl z-50 min-w-[10rem] py-[0.25rem]">
              <button onClick={() => { setOpen(false); setRepriseACompleter(reprise); setShowConfirmComplete(true); }} className="w-full text-left px-[0.75rem] py-[0.5rem] text-[0.8125rem] text-emerald-600 hover:bg-emerald-50">✓ Compléter</button>
              <button onClick={() => { setOpen(false); setRepriseEdition({ ...reprise }); setShowEdition(true); }} className="w-full text-left px-[0.75rem] py-[0.5rem] text-[0.8125rem] text-slate-700 hover:bg-slate-100">✏️ Modifier</button>
              <button onClick={() => { setOpen(false); setShowConfirmDelete(reprise.id); }} className="w-full text-left px-[0.75rem] py-[0.5rem] text-[0.8125rem] text-red-600 hover:bg-red-50">🗑️ Supprimer</button>
            </div>
          </>
        )}
      </div>
    );
  };

  // === BARRE PROGRESSION ===
  const BarreProgression = ({ label, valeur, max, couleur }: { label: string; valeur: number; max: number; couleur: string }) => {
    const pct = max > 0 ? Math.min((valeur / max) * 100, 100) : 0;
    return (
      <div className="flex items-center gap-[0.75rem]">
        <span className="text-[0.8125rem] font-medium text-slate-700 w-[11rem] truncate" title={label}>{label}</span>
        <div className="flex-1 h-[1.25rem] bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${couleur} transition-all duration-500`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-[0.8125rem] font-bold text-slate-800 w-[5rem] text-right">{valeur} ({pct.toFixed(0)}%)</span>
      </div>
    );
  };

  // === TABLEAU REPRISES ===
  const TableauReprises = ({ data, isHistorique }: { data: RepriseView[]; isHistorique: boolean }) => (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[0.8125rem]">
          <thead className="bg-slate-800 text-white">
            <tr>
              <th className="px-[0.75rem] py-[0.75rem] text-left"># Commande</th>
              <th className="px-[0.75rem] py-[0.75rem] text-left">Client / Ville</th>
              <th className="px-[0.75rem] py-[0.75rem] text-center">Type</th>
              <th className="px-[0.75rem] py-[0.75rem] text-center">Nb</th>
              <th className="px-[0.75rem] py-[0.75rem] text-center">Priorité</th>
              <th className="px-[0.75rem] py-[0.75rem] text-center hidden md:table-cell">Date</th>
              <th className="px-[0.75rem] py-[0.75rem] text-center hidden lg:table-cell">Note</th>
              {!isHistorique && <th className="px-[0.75rem] py-[0.75rem] text-center w-[3rem]"></th>}
              {isHistorique && <th className="px-[0.75rem] py-[0.75rem] text-center">Complétée le</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr><td colSpan={isHistorique ? 7 : 8} className="px-[1rem] py-[3rem] text-center text-slate-400">Aucune reprise trouvée</td></tr>
            ) : data.map((r, i) => (
              <tr
                key={r.id}
                className={`hover:bg-blue-50 cursor-pointer ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} ${r.nombreReprises > 1 ? 'border-l-4 border-l-red-500' : ''}`}
                onClick={() => { setRepriseDetail(r); setShowDetail(true); }}
              >
                <td className="px-[0.75rem] py-[0.75rem]">
                  <p className="font-bold text-slate-800">{r.commandeNumero}</p>
                  <p className="text-[0.6875rem] text-slate-500">{r.commandeService ? r.commandeService.charAt(0) + r.commandeService.slice(1).toLowerCase() : ''}</p>
                </td>
                <td className="px-[0.75rem] py-[0.75rem]">
                  <p className="font-medium">{r.clientNom}</p>
                  <p className="text-[0.6875rem] text-slate-500">{r.clientVille || ''}{r.representantNom ? ` • Rep: ${r.representantNom}` : ''}</p>
                </td>
                <td className="px-[0.75rem] py-[0.75rem] text-center">
                  <span className={`px-[0.5rem] py-[0.125rem] rounded text-[0.6875rem] font-bold ${getTypeInfo(r.typeReprise).couleur}`}>
                    {getTypeInfo(r.typeReprise).label}
                  </span>
                </td>
                <td className="px-[0.75rem] py-[0.75rem] text-center">
                  {r.nombreReprises > 1
                    ? <span className="inline-flex items-center justify-center w-[1.75rem] h-[1.75rem] bg-red-500 text-white rounded-full font-bold text-[0.8125rem]">{r.nombreReprises}</span>
                    : <span className="text-slate-400">1</span>}
                </td>
                <td className="px-[0.75rem] py-[0.75rem] text-center">
                  <span className={`px-[0.5rem] py-[0.125rem] rounded-full text-[0.6875rem] font-semibold border ${getPrioriteInfo(r.priorite).couleur}`}>
                    {getPrioriteInfo(r.priorite).label}
                  </span>
                </td>
                <td className="px-[0.75rem] py-[0.75rem] text-center text-[0.75rem] hidden md:table-cell">{formaterDateCourte(r.dateReprise)}</td>
                <td className="px-[0.75rem] py-[0.75rem] text-[0.6875rem] text-slate-500 hidden lg:table-cell max-w-[12rem] truncate">{r.notes || r.commandeCommentaire || '-'}</td>
                {!isHistorique && (
                  <td className="px-[0.75rem] py-[0.75rem] text-center"><KebabMenu reprise={r} /></td>
                )}
                {isHistorique && (
                  <td className="px-[0.75rem] py-[0.75rem] text-center text-[0.75rem] text-emerald-700 font-medium">{formaterDateCourte(r.dateCompletion)}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // === MODAL DÉTAIL ===
  const DetailModal = () => {
    if (!showDetail || !repriseDetail) return null;
    const r = repriseDetail;
    const isHist = r.completee;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[1rem]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[48rem] max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-[1.25rem] bg-slate-800 text-white flex items-center justify-between rounded-t-2xl">
            <div>
              <h2 className="text-[1.25rem] font-bold">Détail reprise — #{r.commandeNumero}</h2>
              <p className="text-slate-300 text-[0.875rem]">{r.clientNom} • {r.clientVille || ''}</p>
            </div>
            <div className="flex items-center gap-[0.5rem]">
              {r.nombreReprises > 1 && <span className="px-[0.75rem] py-[0.25rem] bg-red-500 text-white rounded-full text-[0.8125rem] font-bold">{r.nombreReprises}x reprises</span>}
              <button onClick={() => setShowDetail(false)} className="p-[0.5rem] hover:bg-slate-700 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-[1.5rem] space-y-[1.25rem]">
            {/* Info commande originale */}
            <div className="bg-blue-50 rounded-xl p-[1rem] border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-[0.5rem] text-[0.9375rem]">📦 Commande originale #{r.commandeNumero}</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-[0.5rem] text-[0.8125rem]">
                <p><span className="text-slate-500">Client:</span> <strong>{r.clientNom}</strong></p>
                <p><span className="text-slate-500">Adresse:</span> {r.commandeAdresse || '-'}</p>
                <p><span className="text-slate-500">Téléphone:</span> {r.clientTelephone || '-'}</p>
                <p><span className="text-slate-500">Service:</span> {r.commandeService || '-'}</p>
                <p><span className="text-slate-500">Couleur:</span> {r.commandeCouleur || '-'}</p>
                <p><span className="text-slate-500">Représentant:</span> {r.representantNom || '-'}</p>
              </div>
              {r.commandeCommentaire && (
                <div className="mt-[0.5rem] pt-[0.5rem] border-t border-blue-200">
                  <p className="text-[0.75rem] text-blue-700"><strong>Note commande:</strong> {r.commandeCommentaire}</p>
                </div>
              )}
            </div>

            {/* Infos principales */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-[0.75rem]">
              <div className="bg-slate-50 rounded-xl p-[0.75rem]">
                <p className="text-[0.6875rem] text-slate-500">Responsable</p>
                <p className="font-semibold text-[0.875rem]">{r.responsable || '—'}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-[0.75rem]">
                <p className="text-[0.6875rem] text-slate-500">Priorité</p>
                <span className={`px-[0.75rem] py-[0.25rem] rounded-full text-[0.75rem] font-semibold border ${getPrioriteInfo(r.priorite).couleur}`}>{getPrioriteInfo(r.priorite).label}</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-[0.75rem]">
                <p className="text-[0.6875rem] text-slate-500">Statut</p>
                <span className={`px-[0.75rem] py-[0.25rem] rounded-full text-[0.75rem] font-semibold ${getStatutInfo(r.statut).couleur}`}>{getStatutInfo(r.statut).label}</span>
              </div>
            </div>

            {/* Type et raison */}
            <div className="bg-red-50 rounded-xl p-[1rem] border border-red-200">
              <div className="flex items-center gap-[0.75rem] mb-[0.5rem]">
                <span className={`px-[0.75rem] py-[0.25rem] rounded text-[0.75rem] font-bold ${getTypeInfo(r.typeReprise).couleur}`}>{getTypeInfo(r.typeReprise).label}</span>
              </div>
              <p className="text-[0.875rem] text-slate-800 font-medium">{r.raison}</p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-[0.75rem]">
              <div className="bg-white rounded-xl p-[0.75rem] border border-slate-200">
                <p className="text-[0.6875rem] text-slate-500">Date commande originale</p>
                <p className="font-medium text-[0.875rem]">{formaterDate(r.dateOrigine)}</p>
              </div>
              <div className="bg-white rounded-xl p-[0.75rem] border border-slate-200">
                <p className="text-[0.6875rem] text-slate-500">Date de reprise</p>
                <p className="font-medium text-[0.875rem]">{formaterDate(r.dateReprise)}</p>
              </div>
              <div className="bg-white rounded-xl p-[0.75rem] border border-slate-200">
                <p className="text-[0.6875rem] text-slate-500">Temps estimé</p>
                <p className="font-bold text-[1.125rem]">{r.tempsEstime ? `${r.tempsEstime}h` : '—'}</p>
              </div>
            </div>

            {r.notes && (
              <div className="bg-amber-50 rounded-xl p-[1rem] border border-amber-200">
                <h4 className="font-semibold text-amber-800 mb-[0.25rem] text-[0.875rem]">📝 Notes</h4>
                <p className="text-[0.8125rem] text-slate-700 whitespace-pre-line">{r.notes}</p>
              </div>
            )}

            {isHist && (
              <div className="bg-emerald-50 rounded-xl p-[1rem] border border-emerald-200">
                <h4 className="font-semibold text-emerald-800 mb-[0.25rem]">✓ Reprise complétée</h4>
                <p className="text-[0.875rem] text-slate-700">Date de complétion: <strong>{formaterDate(r.dateCompletion)}</strong></p>
              </div>
            )}
          </div>

          <div className="p-[1rem] border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              {!isHist && (
                <button onClick={() => { setRepriseACompleter(r); setShowConfirmComplete(true); }}
                  className="px-[1.25rem] py-[0.5rem] bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg text-[0.875rem] flex items-center gap-[0.375rem] transition-colors">
                  ✓ Marquer comme complétée
                </button>
              )}
            </div>
            <div className="flex gap-[0.5rem]">
              {!isHist && (
                <button onClick={() => { setRepriseEdition({ ...r }); setShowDetail(false); setShowEdition(true); }}
                  className="px-[1rem] py-[0.5rem] bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[0.875rem] flex items-center gap-[0.375rem] transition-colors">
                  ✏️ Modifier
                </button>
              )}
              <button onClick={() => setShowDetail(false)} className="px-[1rem] py-[0.5rem] border border-slate-300 rounded-lg hover:bg-slate-100 text-[0.875rem] transition-colors">Fermer</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // === MODAL EDITION ===
  const EditionModal = () => {
    if (!showEdition || !repriseEdition) return null;
    const r = repriseEdition;
    const set = (key: string, val: any) => setRepriseEdition({ ...r, [key]: val } as any);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[1rem]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[48rem] max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-[1.25rem] bg-slate-800 text-white rounded-t-2xl">
            <h2 className="text-[1.125rem] font-bold">Modifier la reprise — #{r.commandeNumero}</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-[1.5rem] space-y-[1rem]">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-[1rem]">
              <div>
                <label className="block text-[0.8125rem] font-semibold text-slate-700 mb-[0.25rem]">Type de reprise</label>
                <select value={r.typeReprise} onChange={(e) => set('typeReprise', e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.8125rem]">
                  {Object.entries(TYPE_REPRISE_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[0.8125rem] font-semibold text-slate-700 mb-[0.25rem]">Priorité</label>
                <select value={r.priorite} onChange={(e) => set('priorite', e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.8125rem]">
                  {Object.entries(PRIORITE_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[0.8125rem] font-semibold text-slate-700 mb-[0.25rem]">Responsable</label>
                <input type="text" value={r.responsable || ''} onChange={(e) => set('responsable', e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.8125rem]" />
              </div>
              <div>
                <label className="block text-[0.8125rem] font-semibold text-slate-700 mb-[0.25rem]">Date commande originale</label>
                <input type="date" value={r.dateOrigine?.split('T')[0] || ''} onChange={(e) => set('dateOrigine', e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.8125rem]" />
              </div>
              <div>
                <label className="block text-[0.8125rem] font-semibold text-slate-700 mb-[0.25rem]">Date de reprise</label>
                <input type="date" value={r.dateReprise?.split('T')[0] || ''} onChange={(e) => set('dateReprise', e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.8125rem]" />
              </div>
              <div>
                <label className="block text-[0.8125rem] font-semibold text-slate-700 mb-[0.25rem]">Nombre de reprises</label>
                <input type="number" min="1" value={r.nombreReprises} onChange={(e) => set('nombreReprises', parseInt(e.target.value) || 1)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.8125rem]" />
              </div>
              <div>
                <label className="block text-[0.8125rem] font-semibold text-slate-700 mb-[0.25rem]">Temps estimé (heures)</label>
                <input type="number" min="0" value={r.tempsEstime || ''} onChange={(e) => set('tempsEstime', parseInt(e.target.value) || null)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.8125rem]" />
              </div>
            </div>
            <div>
              <label className="block text-[0.8125rem] font-semibold text-slate-700 mb-[0.25rem]">Raison détaillée</label>
              <textarea value={r.raison} onChange={(e) => set('raison', e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.8125rem]" rows={2} />
            </div>
            <div>
              <label className="block text-[0.8125rem] font-semibold text-slate-700 mb-[0.25rem]">Notes</label>
              <textarea value={r.notes || ''} onChange={(e) => set('notes', e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.8125rem]" rows={2} />
            </div>
          </div>
          <div className="p-[1rem] border-t border-slate-200 flex justify-end gap-[0.75rem]">
            <button onClick={() => { setShowEdition(false); setRepriseEdition(null); }} className="px-[1.5rem] py-[0.5rem] border border-slate-300 rounded-lg hover:bg-slate-50 text-[0.875rem] transition-colors">Annuler</button>
            <button onClick={handleSauvegarder} className="px-[1.5rem] py-[0.5rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-[0.875rem] transition-colors">Enregistrer</button>
          </div>
        </div>
      </div>
    );
  };

  // === MODALS CONFIRM ===
  const ConfirmCompleteModal = () => {
    if (!showConfirmComplete || !repriseACompleter) return null;
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-[1rem]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[26rem] p-[1.5rem] text-center">
          <div className="w-[4rem] h-[4rem] bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-[1rem]">
            <span className="text-[1.5rem]">✓</span>
          </div>
          <h3 className="text-[1.125rem] font-bold text-slate-800 mb-[0.5rem]">Compléter la reprise ?</h3>
          <p className="text-slate-600 text-[0.875rem] mb-[0.25rem]">Commande <strong>#{repriseACompleter.commandeNumero}</strong> — {repriseACompleter.clientNom}</p>
          <p className="text-[0.8125rem] text-slate-500 mb-[1.5rem]">La reprise sera déplacée dans l&apos;historique.</p>
          <div className="flex justify-center gap-[1rem]">
            <button onClick={() => { setShowConfirmComplete(false); setRepriseACompleter(null); }} className="px-[1.5rem] py-[0.5rem] border border-slate-300 rounded-lg hover:bg-slate-50 text-[0.875rem]">Annuler</button>
            <button onClick={handleCompleter} className="px-[1.5rem] py-[0.5rem] bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg text-[0.875rem]">✓ Confirmer</button>
          </div>
        </div>
      </div>
    );
  };

  const ConfirmDeleteModal = () => {
    if (!showConfirmDelete) return null;
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-[1rem]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[26rem] p-[1.5rem] text-center">
          <h3 className="text-[1.125rem] font-bold text-slate-800 mb-[0.75rem]">Supprimer cette reprise ?</h3>
          <p className="text-[0.875rem] text-slate-500 mb-[1.5rem]">Cette action est irréversible.</p>
          <div className="flex justify-center gap-[1rem]">
            <button onClick={() => setShowConfirmDelete(null)} className="px-[1.5rem] py-[0.5rem] border border-slate-300 rounded-lg hover:bg-slate-50 text-[0.875rem]">Annuler</button>
            <button onClick={() => handleSupprimer(showConfirmDelete)} className="px-[1.5rem] py-[0.5rem] bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-[0.875rem]">Supprimer</button>
          </div>
        </div>
      </div>
    );
  };

  // ╔══════════════════════════════════════════════════════╗
  // ║                 RENDU PRINCIPAL                      ║
  // ╚══════════════════════════════════════════════════════╝

  return (
    <div className="space-y-[1rem]">
      <DetailModal /><EditionModal /><ConfirmCompleteModal /><ConfirmDeleteModal />

      {toast && (
        <div className={`fixed bottom-[1rem] right-[1rem] z-[70] px-[1rem] py-[0.75rem] rounded-lg shadow-lg text-white text-[0.875rem] font-medium ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-800 rounded-2xl p-[1rem] flex flex-wrap items-center justify-between gap-[0.75rem]">
        <div className="flex items-center gap-[1rem]">
          <div>
            <h1 className="text-[1.5rem] font-bold text-white">Reprises</h1>
            <p className="text-slate-400 text-[0.8125rem]">Suivi des reprises et statistiques</p>
          </div>
        </div>
        <div className="flex items-center gap-[1.5rem] text-white text-[0.875rem]">
          <div className="text-right"><p className="text-slate-400 text-[0.75rem]">Actives</p><p className="text-[1.5rem] font-bold text-red-400">{stats?.totalActives || 0}</p></div>
          <div className="text-right"><p className="text-slate-400 text-[0.75rem]">Ce mois</p><p className="text-[1.5rem] font-bold text-amber-400">{stats?.parPeriode.mois || 0}</p></div>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-[0.5rem] bg-slate-100 p-[0.25rem] rounded-xl w-fit flex-wrap">
        {[
          { id: 'actives' as const, label: `🔧 Actives (${actives.length})` },
          { id: 'historique' as const, label: `📋 Historique (${historique.length})` },
          { id: 'statistiques' as const, label: '📊 Statistiques' },
          { id: 'conseils' as const, label: '💡 Conseils & Prévention' },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setOnglet(tab.id)} className={`px-[1.25rem] py-[0.625rem] rounded-lg font-medium transition-all text-[0.875rem] ${onglet === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* === ACTIVES === */}
      {onglet === 'actives' && (
        <>
          {/* Période */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-[0.75rem]">
            {[
              { id: 'jour', label: "Aujourd'hui", val: stats?.parPeriode.jour || 0 },
              { id: 'semaine', label: 'Cette semaine', val: stats?.parPeriode.semaine || 0 },
              { id: 'mois', label: 'Ce mois', val: stats?.parPeriode.mois || 0 },
              { id: 'annee', label: 'Cette année', val: stats?.parPeriode.annee || 0 },
              { id: 'tout', label: 'Tout', val: stats?.totalToutes || 0 },
            ].map((p) => (
              <button key={p.id} onClick={() => setFiltrePeriode(p.id)} className={`p-[0.75rem] rounded-xl border text-left transition-all ${filtrePeriode === p.id ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
                <p className="text-[0.6875rem] text-slate-500">{p.label}</p>
                <p className="text-[1.25rem] font-bold text-slate-800">{p.val}</p>
              </button>
            ))}
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-xl p-[1rem] border border-slate-200 flex flex-wrap items-end gap-[0.75rem]">
            <div className="flex-1 min-w-[11.25rem]">
              <label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Rechercher</label>
              <input type="text" value={recherche} onChange={(e) => setRecherche(e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.8125rem]" placeholder="# commande, client, raison..." />
            </div>
            <div className="min-w-[9.375rem]">
              <label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Type</label>
              <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.8125rem]">
                <option value="">Tous types</option>
                {Object.entries(TYPE_REPRISE_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="min-w-[6.875rem]">
              <label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Priorité</label>
              <select value={filtrePriorite} onChange={(e) => setFiltrePriorite(e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.8125rem]">
                <option value="">Toutes</option>
                {Object.entries(PRIORITE_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>

          {loading ? <div className="text-center py-[3rem] text-slate-500">Chargement...</div> : <TableauReprises data={activesFiltrees} isHistorique={false} />}
        </>
      )}

      {/* === HISTORIQUE === */}
      {onglet === 'historique' && (
        <>
          <div className="bg-emerald-50 rounded-xl p-[1rem] border border-emerald-200 flex items-center gap-[0.75rem]">
            <span className="text-[1.5rem]">✓</span>
            <div>
              <p className="font-semibold text-emerald-800">Historique des reprises complétées</p>
              <p className="text-[0.8125rem] text-emerald-600">{historique.length} reprise(s) complétée(s)</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-[1rem] border border-slate-200 flex flex-wrap items-end gap-[0.75rem]">
            <div className="flex-1 min-w-[11.25rem]">
              <label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Rechercher</label>
              <input type="text" value={recherche} onChange={(e) => setRecherche(e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.8125rem]" placeholder="# commande, client..." />
            </div>
            <div className="min-w-[9.375rem]">
              <label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Type</label>
              <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.8125rem]">
                <option value="">Tous</option>
                {Object.entries(TYPE_REPRISE_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <TableauReprises data={historiqueFiltree} isHistorique={true} />
        </>
      )}

      {/* === STATISTIQUES === */}
      {onglet === 'statistiques' && (
        <div className="space-y-[1.5rem]">
          {/* Vue d'ensemble */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[0.75rem]">
            <div className="bg-white p-[1rem] rounded-xl border border-slate-200 text-center">
              <p className="text-[0.6875rem] text-slate-500">Total toutes</p>
              <p className="text-[1.875rem] font-bold text-slate-800">{stats?.totalToutes || 0}</p>
            </div>
            <div className="bg-white p-[1rem] rounded-xl border border-red-200 text-center">
              <p className="text-[0.6875rem] text-slate-500">Actives</p>
              <p className="text-[1.875rem] font-bold text-red-600">{stats?.totalActives || 0}</p>
            </div>
            <div className="bg-white p-[1rem] rounded-xl border border-emerald-200 text-center">
              <p className="text-[0.6875rem] text-slate-500">Complétées</p>
              <p className="text-[1.875rem] font-bold text-emerald-600">{stats?.totalHistorique || 0}</p>
            </div>
            <div className="bg-white p-[1rem] rounded-xl border border-amber-200 text-center">
              <p className="text-[0.6875rem] text-slate-500">Multi-reprises</p>
              <p className="text-[1.875rem] font-bold text-amber-600">{stats?.commandesMultiReprises || 0}</p>
            </div>
          </div>

          {/* Filtre période pour stats par type */}
          <div className="bg-white rounded-xl p-[1.5rem] border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-[0.75rem] mb-[1.25rem]">
              <h3 className="font-bold text-slate-800 text-[1.0625rem]">📊 Pourcentage de reprises par type</h3>
              <div className="flex gap-[0.5rem]">
                {[
                  { id: '', label: 'Tout' },
                  { id: 'semaine', label: 'Semaine' },
                  { id: 'mois', label: 'Mois' },
                  { id: 'annee', label: 'Année' },
                ].map((p) => (
                  <button key={p.id} onClick={() => setStatsPeriode(p.id)} className={`px-[0.75rem] py-[0.375rem] rounded-lg text-[0.8125rem] font-medium transition-all ${statsPeriode === p.id ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-[0.75rem]">
              {(stats?.parType || []).map((s, i) => {
                const couleurs = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-blue-500', 'bg-purple-500', 'bg-teal-500', 'bg-pink-500', 'bg-indigo-500'];
                return <BarreProgression key={s.type} label={s.label} valeur={s.count} max={stats?.totalToutes || 1} couleur={couleurs[i % couleurs.length]} />;
              })}
              {(stats?.parType || []).length === 0 && <p className="text-center text-slate-400 py-[1rem]">Aucune donnée pour cette période</p>}
            </div>
          </div>

          {/* Grille type */}
          <div className="bg-white rounded-xl p-[1.5rem] border border-slate-200">
            <h3 className="font-bold text-slate-800 text-[1.0625rem] mb-[1rem]">🔍 Répartition détaillée</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[0.75rem]">
              {(stats?.parType || []).map((s) => (
                <div key={s.type} className="bg-slate-50 rounded-xl p-[0.75rem] border border-slate-200 flex items-center gap-[0.75rem]">
                  <span className={`px-[0.5rem] py-[0.25rem] rounded text-[0.75rem] font-bold ${getTypeInfo(s.type).couleur}`}>{s.count}</span>
                  <div>
                    <p className="text-[0.8125rem] font-medium">{s.label}</p>
                    <p className="text-[0.6875rem] text-slate-500">{s.pourcentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* === CONSEILS & PRÉVENTION === */}
      {onglet === 'conseils' && (
        <div className="space-y-[1.5rem]">
          <div className="bg-blue-50 rounded-xl p-[1rem] border border-blue-200 flex flex-wrap items-center justify-between gap-[0.75rem]">
            <div>
              <p className="font-semibold text-blue-800">💡 Conseils et recommandations basés sur l&apos;analyse de vos reprises</p>
              <p className="text-[0.8125rem] text-blue-600 mt-[0.25rem]">Ces conseils sont générés automatiquement à partir des données les plus fréquentes.</p>
            </div>
            <button onClick={handleEnvoyerConseils} disabled={envoiConseilsEnCours} className="px-[1.25rem] py-[0.5rem] bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white font-semibold rounded-lg text-[0.875rem] flex items-center gap-[0.375rem] transition-colors shadow">
              {envoiConseilsEnCours ? '⏳ Envoi...' : '✉️ Envoyer les conseils à toute l\'entreprise'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[1rem]">
            {(stats?.parType || []).slice(0, 6).map((s) => {
              const info = getTypeInfo(s.type);
              const borderColors: Record<string, string> = {
                ERREURS_MESURE: 'border-l-red-500', ERREURS_PRODUCTION: 'border-l-orange-500',
                MAUVAISE_COULEUR: 'border-l-pink-500', PIECES_GRAFIGNEES: 'border-l-amber-500',
              };
              return (
                <div key={s.type} className={`bg-white rounded-xl p-[1.25rem] border-l-4 ${borderColors[s.type] || 'border-l-slate-400'} border border-slate-200`}>
                  <div className="flex items-start gap-[0.75rem]">
                    <span className="text-[1.5rem]">{info.icone}</span>
                    <div>
                      <h4 className="font-bold text-slate-800 text-[0.9375rem]">{info.label} ({s.count} cas — {s.pourcentage}%)</h4>
                      <p className="text-[0.8125rem] text-slate-600 mt-[0.25rem]">Mesures préventives recommandées :</p>
                      <ul className="mt-[0.5rem] text-[0.8125rem] text-slate-700 space-y-[0.25rem]">
                        <li>• Analyser les causes racines de chaque occurrence</li>
                        <li>• Mettre en place une procédure de vérification systématique</li>
                        <li>• Former les équipes sur les bonnes pratiques spécifiques</li>
                        <li>• Documenter chaque cas pour amélioration continue</li>
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recommandations générales */}
          <div className="bg-white rounded-xl p-[1.5rem] border border-slate-200">
            <h3 className="font-bold text-slate-800 text-[1.0625rem] mb-[1rem]">🎯 Recommandations générales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1rem]">
              <div className="bg-emerald-50 rounded-xl p-[1rem] border border-emerald-200">
                <h4 className="font-semibold text-emerald-800 mb-[0.5rem]">✅ Actions immédiates</h4>
                <ul className="text-[0.8125rem] text-slate-700 space-y-[0.25rem]">
                  <li>• Réunion hebdomadaire de 15 min sur les reprises de la semaine</li>
                  <li>• Formulaire de reprise obligatoire avec cause identifiée</li>
                  <li>• Photo avant/après pour chaque reprise</li>
                  <li>• Feedback immédiat à l&apos;équipe concernée</li>
                </ul>
              </div>
              <div className="bg-blue-50 rounded-xl p-[1rem] border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-[0.5rem]">📋 Actions à moyen terme</h4>
                <ul className="text-[0.8125rem] text-slate-700 space-y-[0.25rem]">
                  <li>• Programme de formation trimestriel par type d&apos;erreur</li>
                  <li>• Audit qualité mensuel sur les processus critiques</li>
                  <li>• Analyse des tendances et ajustement des procédures</li>
                </ul>
              </div>
              <div className="bg-amber-50 rounded-xl p-[1rem] border border-amber-200">
                <h4 className="font-semibold text-amber-800 mb-[0.5rem]">⚠️ Points d&apos;attention</h4>
                <ul className="text-[0.8125rem] text-slate-700 space-y-[0.25rem]">
                  {(stats?.parType || [])[0] && <li>• Le type <strong>&quot;{(stats?.parType || [])[0].label}&quot;</strong> est le plus fréquent ({(stats?.parType || [])[0].pourcentage}%) — priorité d&apos;amélioration</li>}
                  {(stats?.commandesMultiReprises || 0) > 0 && <li>• <strong>{stats?.commandesMultiReprises}</strong> commande(s) ont nécessité plusieurs reprises</li>}
                </ul>
              </div>
              <div className="bg-purple-50 rounded-xl p-[1rem] border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-[0.5rem]">🏆 Objectifs suggérés</h4>
                <ul className="text-[0.8125rem] text-slate-700 space-y-[0.25rem]">
                  <li>• Réduire les reprises de 20% d&apos;ici la fin de l&apos;année</li>
                  <li>• Éliminer les erreurs récurrentes sous 3 mois</li>
                  <li>• Aucune commande avec plus de 2 reprises</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-[1rem] border border-slate-200 text-center text-[0.8125rem] text-slate-500">
            ✉️ Un email de conseils & prévention est envoyé automatiquement à toute l&apos;entreprise <strong>tous les 3 jours</strong> via Microsoft 365.
          </div>
        </div>
      )}
    </div>
  );
}