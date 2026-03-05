'use client';

import { useState, useEffect, useRef } from 'react';
import { useAttentes } from '@/app/hooks/useAttentes';
import type { CommandeAttente, Representant, StatsAttentes } from '@/app/api/attentes/schema';
import { genererInitiales, codeProductionCourt, getStatutCouleur, getServiceCouleur, getServiceLabel } from '@/app/api/attentes/schema';

// ╔══════════════════════════════════════════════════════╗
// ║             PAGE ATTENTES - RAMPES GARDEX             ║
// ╚══════════════════════════════════════════════════════╝

export default function AttentesPage() {
  const { commandes, representants, stats, loading, envoiEnCours, charger, envoyerAttentes } = useAttentes();

  // === ÉTATS ===
  const [selectedRepresentants, setSelectedRepresentants] = useState<string[]>([]);
  const [showRepresentantDropdown, setShowRepresentantDropdown] = useState(false);
  const [envoiAutoLundi, setEnvoiAutoLundi] = useState(true);
  const [showConfirmEnvoi, setShowConfirmEnvoi] = useState(false);
  const [commandeDetaillee, setCommandeDetaillee] = useState<CommandeAttente | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // === CHARGEMENT ===
  useEffect(() => {
    charger();
  }, [charger]);

  // Fermer dropdown au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowRepresentantDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // === FILTRES ===
  const commandesFiltrees = commandes.filter((cmd) => {
    if (selectedRepresentants.length === 0) return true;
    return cmd.representantId && selectedRepresentants.includes(cmd.representantId);
  });

  const getAttentesParRepresentant = (repId: string) => {
    return commandes.filter((cmd) => cmd.representantId === repId).length;
  };

  const toggleRepresentant = (repId: string) => {
    setSelectedRepresentants((prev) =>
      prev.includes(repId) ? prev.filter((r) => r !== repId) : [...prev, repId]
    );
  };

  const retirerRepresentant = (repId: string) => {
    setSelectedRepresentants((prev) => prev.filter((r) => r !== repId));
  };

  // === ACTIONS ===
  const envoyerPourRepresentant = async (repId: string) => {
    const ok = await envoyerAttentes([repId]);
    if (ok) {
      setToast({ message: 'Email envoyé via Microsoft 365', type: 'success' });
      charger();
    } else {
      setToast({ message: "Erreur lors de l'envoi", type: 'error' });
    }
  };

  const ouvrirDetail = (cmd: CommandeAttente) => {
    setCommandeDetaillee(cmd);
    setShowDetailModal(true);
  };

  const formaterDate = (d: string | null | undefined) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('fr-CA');
  };

  // ╔══════════════════════════════════════════════════════╗
  // ║             MODAL DÉTAIL COMMANDE                    ║
  // ╚══════════════════════════════════════════════════════╝

  const DetailCommandeModal = () => {
    if (!showDetailModal || !commandeDetaillee) return null;
    const cmd = commandeDetaillee;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[1rem]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[48rem] max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-[1.5rem] border-b border-slate-200 bg-slate-800 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[1.5rem] font-bold">Détail Commande #{cmd.numero}</h2>
                <p className="text-slate-300 text-[0.875rem]">{cmd.clientNom}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-[0.5rem] hover:bg-slate-700 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-[1.5rem] space-y-[1.5rem]">
            {/* Infos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.5rem]">
              <div className="bg-slate-50 rounded-xl p-[1rem]">
                <h3 className="font-semibold text-slate-800 mb-[0.75rem] text-[0.9375rem]">👤 Informations client</h3>
                <div className="space-y-[0.375rem] text-[0.875rem]">
                  <p><span className="text-slate-500">Client:</span> <strong>{cmd.clientNom}</strong></p>
                  <p><span className="text-slate-500">Adresse:</span> {cmd.clientAdresse || '-'}</p>
                  <p><span className="text-slate-500">Téléphone:</span> {cmd.clientTelephone || '-'}</p>
                  <p><span className="text-slate-500">Représentant:</span> <strong>{cmd.representantNom ? `${genererInitiales(cmd.representantNom)} — ${cmd.representantNom}` : '-'}</strong></p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-[1rem]">
                <h3 className="font-semibold text-slate-800 mb-[0.75rem] text-[0.9375rem]">📅 Dates</h3>
                <div className="space-y-[0.375rem] text-[0.875rem]">
                  <p><span className="text-slate-500">Date d&apos;entrée:</span> <strong>{formaterDate(cmd.dateEntree)}</strong></p>
                  <p><span className="text-slate-500">Date prévue:</span> <strong>{formaterDate(cmd.datePrevue)}</strong></p>
                  <p><span className="text-slate-500">Dernier envoi:</span> {formaterDate(cmd.dateDernierEnvoi) || 'Jamais'}</p>
                </div>
              </div>
            </div>

            {/* Détails techniques */}
            <div className="bg-blue-50 rounded-xl p-[1rem] border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-[0.75rem] text-[0.9375rem]">🔧 Détails techniques</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-[1rem] text-[0.875rem]">
                <p><span className="text-slate-500">Service:</span> <span className={`px-[0.5rem] py-[0.125rem] rounded text-[0.75rem] font-bold ${getServiceCouleur(cmd.service)}`}>{getServiceLabel(cmd.service)}</span></p>
                <p><span className="text-slate-500">Pieds linéaires:</span> <strong>{cmd.piedsLineaires || '-'}</strong></p>
                <p><span className="text-slate-500">Couleur:</span> <strong>{cmd.couleur || cmd.couleurPersonnalisee || '-'}</strong></p>
              </div>
            </div>

            {/* Progression */}
            <div className="bg-slate-50 rounded-xl p-[1rem]">
              <h3 className="font-semibold text-slate-800 mb-[0.75rem] text-[0.9375rem]">Progression</h3>
              <div className="grid grid-cols-5 gap-[0.5rem] text-center text-[0.8125rem]">
                {[
                  { label: 'Mesure', code: cmd.mesure },
                  { label: 'Plan', code: cmd.plan },
                  { label: 'Envoyé Prod.', code: cmd.envoyeProduction },
                  { label: 'Prod. Terminée', code: cmd.productionTerminee },
                  { label: 'Terminé', code: cmd.termine },
                ].map((etape) => {
                  const short = codeProductionCourt(etape.code);
                  const bg = short === '√' ? 'bg-green-100 text-green-800'
                    : (short === 'At.C' || short === 'At.Rep') ? 'bg-sky-100 text-sky-800'
                    : short === 'N/A' ? 'bg-slate-200 text-slate-500'
                    : 'bg-slate-100';
                  return (
                    <div key={etape.label} className={`p-[0.75rem] rounded-lg ${bg}`}>
                      <p className="font-semibold text-[0.75rem]">{etape.label}</p>
                      <p className="text-[1.125rem] mt-[0.25rem]">{short}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            {cmd.commentaire && (
              <div className="bg-amber-50 rounded-xl p-[1rem] border border-amber-200">
                <h3 className="font-semibold text-amber-800 mb-[0.375rem] text-[0.9375rem]">📝 Notes</h3>
                <p className="text-[0.875rem] text-slate-700 whitespace-pre-line">{cmd.commentaire}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-[1rem] border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className={`px-[0.75rem] py-[0.25rem] rounded-full text-[0.8125rem] font-semibold ${
              cmd.attenteEnvoyee ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
            }`}>
              {cmd.attenteEnvoyee ? '✓ Envoyée' : '⏳ Non envoyée'}
            </span>
            <div className="flex gap-[0.5rem]">
              {cmd.representantId && (
                <button
                  onClick={() => { envoyerPourRepresentant(cmd.representantId!); setShowDetailModal(false); }}
                  className="px-[1rem] py-[0.5rem] bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[0.875rem] flex items-center gap-[0.375rem] transition-colors"
                >
                  ✉️ Envoyer au représentant
                </button>
              )}
              <button onClick={() => setShowDetailModal(false)} className="px-[1rem] py-[0.5rem] border border-slate-300 rounded-lg hover:bg-slate-100 text-[0.875rem] transition-colors">
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ╔══════════════════════════════════════════════════════╗
  // ║           MODAL CONFIRMATION ENVOI                   ║
  // ╚══════════════════════════════════════════════════════╝

  const ConfirmEnvoiModal = () => {
    if (!showConfirmEnvoi) return null;

    const representantsAvecAttentes = [...new Set(
      (selectedRepresentants.length > 0
        ? commandesFiltrees
        : commandes
      ).filter((c) => c.representantId).map((c) => c.representantId!)
    )];

    const handleConfirm = async () => {
      const ids = selectedRepresentants.length > 0 ? selectedRepresentants : representantsAvecAttentes;
      const ok = await envoyerAttentes(ids);
      if (ok) {
        setToast({ message: `Emails envoyés via Microsoft 365 à ${ids.length} représentant(s)`, type: 'success' });
        charger();
      } else {
        setToast({ message: "Erreur lors de l'envoi", type: 'error' });
      }
      setShowConfirmEnvoi(false);
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[1rem]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[28rem] p-[1.5rem]">
          <h2 className="text-[1.25rem] font-bold text-slate-800 mb-[1rem]">Confirmer l&apos;envoi</h2>

          <p className="text-[0.875rem] text-slate-600 mb-[1rem]">
            Vous allez envoyer les attentes via <strong>Microsoft 365</strong> à {representantsAvecAttentes.length} représentant(s):
          </p>

          <ul className="bg-slate-50 rounded-lg p-[1rem] mb-[1.5rem] space-y-[0.5rem]">
            {representantsAvecAttentes.map((repId) => {
              const rep = representants.find((r) => r.id === repId);
              const nb = commandes.filter((c) => c.representantId === repId).length;
              return (
                <li key={repId} className="flex justify-between items-center text-[0.875rem]">
                  <span><strong>{rep ? `${genererInitiales(rep.nom)} — ${rep.nom}` : repId}</strong>
                    <span className="text-slate-500 text-[0.75rem] ml-[0.25rem]">({rep?.email || '-'})</span>
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-[0.5rem] py-[0.125rem] rounded text-[0.75rem] font-bold">{nb} attente(s)</span>
                </li>
              );
            })}
          </ul>

          <div className="flex justify-end gap-[0.75rem]">
            <button onClick={() => setShowConfirmEnvoi(false)} className="px-[1rem] py-[0.5rem] border border-slate-300 rounded-lg hover:bg-slate-50 text-[0.875rem] transition-colors">
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={envoiEnCours}
              className="px-[1rem] py-[0.5rem] bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white rounded-lg text-[0.875rem] font-semibold flex items-center gap-[0.375rem] transition-colors"
            >
              {envoiEnCours ? '⏳ Envoi...' : '✉️ Confirmer l\'envoi'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ╔══════════════════════════════════════════════════════╗
  // ║                  RENDU PRINCIPAL                     ║
  // ╚══════════════════════════════════════════════════════╝

  return (
    <div className="space-y-[1rem]">
      {/* Modals */}
      <DetailCommandeModal />
      <ConfirmEnvoiModal />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-[1rem] right-[1rem] z-[70] px-[1rem] py-[0.75rem] rounded-lg shadow-lg text-white text-[0.875rem] font-medium animate-slide-in ${
          toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'} {toast.message}
        </div>
      )}

      {/* Header (identique App.js) */}
      <div className="bg-slate-800 rounded-2xl p-[1rem] flex flex-wrap items-center justify-between gap-[0.75rem]">
        <div className="flex items-center gap-[1rem]">
          <h1 className="text-[1.875rem] font-bold text-white">ATTENTES</h1>
        </div>

        {/* Statistiques */}
        <div className="flex items-center gap-[1.5rem] text-white text-[0.875rem]">
          <div className="text-right">
            <p className="text-slate-400 text-[0.75rem]">Commandes en attentes</p>
            <p className="text-[1.5rem] font-bold text-blue-400">{commandesFiltrees.length}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-400 text-[0.75rem]">Commandes totales</p>
            <p className="text-[1.5rem] font-bold">{stats?.totalCommandes || 0}</p>
          </div>
        </div>
      </div>

      {/* Barre de filtres et actions */}
      <div className="flex flex-wrap items-center justify-between gap-[1rem]">
        {/* Filtre par représentant */}
        <div className="flex items-center gap-[0.5rem] flex-wrap" ref={dropdownRef}>
          {/* Tags sélectionnés */}
          {selectedRepresentants.map((repId) => {
            const rep = representants.find((r) => r.id === repId);
            return (
              <span key={repId} className="flex items-center gap-[0.25rem] bg-slate-200 px-[0.75rem] py-[0.25rem] rounded-lg text-[0.875rem]">
                {rep ? genererInitiales(rep.nom) : repId}
                <button onClick={() => retirerRepresentant(repId)} className="hover:text-red-600 ml-[0.25rem]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </span>
            );
          })}

          {/* Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRepresentantDropdown(!showRepresentantDropdown)}
              className="flex items-center gap-[0.5rem] px-[1rem] py-[0.5rem] border border-slate-300 rounded-lg bg-white hover:bg-slate-50 text-[0.875rem] transition-colors"
            >
              <span className="text-slate-600">Rechercher des représentants</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </button>

            {showRepresentantDropdown && (
              <div className="absolute top-full left-0 mt-[0.25rem] bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[17.5rem]">
                {representants.map((rep) => (
                  <button
                    key={rep.id}
                    onClick={() => { toggleRepresentant(rep.id); setShowRepresentantDropdown(false); }}
                    className={`w-full px-[1rem] py-[0.75rem] text-left hover:bg-slate-50 flex items-center justify-between text-[0.875rem] ${
                      selectedRepresentants.includes(rep.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{genererInitiales(rep.nom)} — {rep.nom}</p>
                      <p className="text-[0.75rem] text-slate-500">{rep.email || '-'}</p>
                    </div>
                    <span className="text-[0.75rem] bg-slate-100 px-[0.5rem] py-[0.125rem] rounded">
                      {getAttentesParRepresentant(rep.id)} attente(s)
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-[1rem] flex-wrap">
          <label className="flex items-center gap-[0.5rem] text-[0.875rem] text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={envoiAutoLundi}
              onChange={(e) => setEnvoiAutoLundi(e.target.checked)}
              className="w-[1rem] h-[1rem] rounded"
            />
            ✉️ Envoi auto. chaque lundi
          </label>

          <button
            onClick={() => setShowConfirmEnvoi(true)}
            className="px-[1.5rem] py-[0.75rem] bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg flex items-center gap-[0.5rem] shadow-lg text-[0.875rem] transition-colors"
          >
            ✉️ Envoie des attentes client aux représentants
          </button>
        </div>
      </div>

      {/* Tableau des attentes */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[0.8125rem]">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-[1rem] py-[0.75rem] text-left font-semibold text-slate-700"># Projet</th>
                <th className="px-[1rem] py-[0.75rem] text-left font-semibold text-slate-700">Rep</th>
                <th className="px-[1rem] py-[0.75rem] text-left font-semibold text-slate-700">Client</th>
                <th className="px-[1rem] py-[0.75rem] text-center font-semibold text-slate-700">Date d&apos;entrée<br/>Date prévue</th>
                <th className="px-[1rem] py-[0.75rem] text-center font-semibold text-slate-700">Service</th>
                <th className="px-[1rem] py-[0.75rem] text-center font-semibold text-slate-700">Mesure</th>
                <th className="px-[1rem] py-[0.75rem] text-center font-semibold text-slate-700">Plan</th>
                <th className="px-[1rem] py-[0.75rem] text-center font-semibold text-slate-700 hidden lg:table-cell">Envoyé en<br/>Production</th>
                <th className="px-[1rem] py-[0.75rem] text-center font-semibold text-slate-700 hidden lg:table-cell">Production<br/>terminée</th>
                <th className="px-[1rem] py-[0.75rem] text-center font-semibold text-slate-700">Terminé</th>
                <th className="px-[1rem] py-[0.75rem] text-center font-semibold text-slate-700 hidden md:table-cell">Date du<br/>dernier envoi</th>
                <th className="px-[1rem] py-[0.75rem] text-center font-semibold text-slate-700">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={12} className="px-[1rem] py-[3rem] text-center text-slate-500">Chargement...</td></tr>
              ) : commandesFiltrees.length === 0 ? (
                <tr><td colSpan={12} className="px-[1rem] py-[3rem] text-center text-slate-500">Aucune commande en attente pour ce(s) représentant(s)</td></tr>
              ) : commandesFiltrees.map((cmd) => (
                <tr
                  key={cmd.id}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => ouvrirDetail(cmd)}
                >
                  <td className="px-[1rem] py-[0.75rem] font-bold text-slate-800">{cmd.numero}</td>
                  <td className="px-[1rem] py-[0.75rem] font-semibold">{genererInitiales(cmd.representantNom)}</td>
                  <td className="px-[1rem] py-[0.75rem]">
                    <div>
                      <p className="font-medium">{cmd.clientNom}</p>
                      {cmd.commentaire && (
                        <p className="text-[0.75rem] text-slate-500 mt-[0.125rem] line-clamp-2">{cmd.commentaire.split('\n')[0]}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-[1rem] py-[0.75rem] text-center">
                    <div className="inline-block border border-slate-300 rounded overflow-hidden text-[0.75rem]">
                      <div className="px-[0.75rem] py-[0.25rem] bg-white font-medium">{formaterDate(cmd.dateEntree)}</div>
                      <div className="px-[0.75rem] py-[0.25rem] bg-slate-50 text-slate-600">{formaterDate(cmd.datePrevue)}</div>
                    </div>
                  </td>
                  <td className="px-[1rem] py-[0.75rem] text-center">
                    <span className={`px-[0.75rem] py-[0.25rem] rounded text-[0.6875rem] font-bold ${getServiceCouleur(cmd.service)}`}>
                      {getServiceLabel(cmd.service)}
                    </span>
                  </td>
                  <td className={`px-[1rem] py-[0.75rem] text-center font-semibold ${getStatutCouleur(cmd.mesure)}`}>
                    {codeProductionCourt(cmd.mesure)}
                  </td>
                  <td className={`px-[1rem] py-[0.75rem] text-center font-semibold ${getStatutCouleur(cmd.plan)}`}>
                    {codeProductionCourt(cmd.plan)}
                  </td>
                  <td className={`px-[1rem] py-[0.75rem] text-center font-semibold hidden lg:table-cell ${getStatutCouleur(cmd.envoyeProduction)}`}>
                    {codeProductionCourt(cmd.envoyeProduction)}
                  </td>
                  <td className={`px-[1rem] py-[0.75rem] text-center font-semibold hidden lg:table-cell ${getStatutCouleur(cmd.productionTerminee)}`}>
                    {codeProductionCourt(cmd.productionTerminee)}
                  </td>
                  <td className={`px-[1rem] py-[0.75rem] text-center font-semibold ${getStatutCouleur(cmd.termine)}`}>
                    {codeProductionCourt(cmd.termine)}
                  </td>
                  <td className="px-[1rem] py-[0.75rem] text-center text-slate-600 hidden md:table-cell">
                    {formaterDate(cmd.dateDernierEnvoi)}
                  </td>
                  <td className="px-[1rem] py-[0.75rem] text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { if (!cmd.attenteEnvoyee && cmd.representantId) envoyerPourRepresentant(cmd.representantId); }}
                      className={`px-[0.75rem] py-[0.375rem] rounded-lg text-[0.75rem] font-bold transition-colors ${
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
        </div>
      </div>

      {/* Légende */}
      <div className="bg-white rounded-xl border border-slate-200 p-[1rem]">
        <p className="text-[0.875rem] font-semibold text-slate-600 mb-[0.75rem]">Légende:</p>
        <div className="flex flex-wrap items-center gap-[1.5rem] text-[0.875rem]">
          <div className="flex items-center gap-[0.375rem]">
            <span className="font-bold">√</span>
            <span className="text-slate-600">Complété</span>
          </div>
          <div className="flex items-center gap-[0.375rem]">
            <span className="bg-sky-200 text-sky-800 px-[0.5rem] py-[0.125rem] rounded text-[0.75rem] font-bold">At.C</span>
            <span className="text-slate-600">Attente Client</span>
          </div>
          <div className="flex items-center gap-[0.375rem]">
            <span className="text-slate-500 font-semibold">N/A</span>
            <span className="text-slate-600">Non applicable</span>
          </div>
          <div className="flex items-center gap-[0.375rem]">
            <span className="bg-green-100 text-green-800 px-[0.5rem] py-[0.125rem] rounded text-[0.75rem] font-bold">✓ Envoyée</span>
            <span className="text-slate-600">Attente envoyée par email</span>
          </div>
          <div className="flex items-center gap-[0.375rem]">
            <span className="bg-orange-400 text-white px-[0.5rem] py-[0.125rem] rounded text-[0.75rem] font-bold">Envoyer</span>
            <span className="text-slate-600">Attente non envoyée</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}