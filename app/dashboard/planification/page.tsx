'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePlanification, useNonPlanifiees, useEquipes } from '@/app/hooks/usePlanification';
import type { PlanificationView, CommandeNonPlanifiee } from '@/app/api/planification/schema';
import {
  MONTH_NAMES, DAY_NAMES_SHORT, STATUT_PLANIF_MAP, TYPE_COMMANDE_COULEUR,
  formatDateKey, getDaysInMonth, calculerJoursNecessaires, depasseJournee,
  getProdStatusColor, getAchatStatusColor, getSymbol,
} from '@/app/api/planification/schema';

// ╔══════════════════════════════════════════════════════╗
// ║       PAGE PLANIFICATION — RAMPES GARDEX              ║
// ╚══════════════════════════════════════════════════════╝

export default function PlanificationPage() {
  const { planifications, stats, loading, charger, creer, modifier, supprimer } = usePlanification();
  const { commandes: nonPlanifiees, charger: chargerNP } = useNonPlanifiees();
  const { equipes, charger: chargerEquipes, creer: creerEquipe, supprimer: supprimerEquipe } = useEquipes();

  // Navigation mois
  const [mois, setMois] = useState(new Date());
  const [filtreType, setFiltreType] = useState('tous');
  const [filtreCommande, setFiltreCommande] = useState('tous');
  const [filtreEquipe, setFiltreEquipe] = useState('toutes');

  // Modals
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showNonPlanifiees, setShowNonPlanifiees] = useState(false);
  const [showEquipes, setShowEquipes] = useState(false);
  const [showPlanifier, setShowPlanifier] = useState(false);
  const [cmdAPlanifier, setCmdAPlanifier] = useState<CommandeNonPlanifiee | null>(null);
  const [selectedPlanif, setSelectedPlanif] = useState<PlanificationView | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddEquipe, setShowAddEquipe] = useState(false);
  const [equipeForm, setEquipeForm] = useState({ nom: '', couleur: 'bg-blue-500' });
  const [planifForm, setPlanifForm] = useState({ date: '', equipeId: '', heureDebut: '', heureFin: '', clientPresent: false, representantPresent: false, envoyerAvis: false, notes: '' });

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); } }, [toast]);

  // Chargement
  const moisKey = `${mois.getFullYear()}-${String(mois.getMonth() + 1).padStart(2, '0')}`;
  useEffect(() => { charger({ mois: moisKey, type: filtreType !== 'tous' ? filtreType : '', typeCommande: filtreCommande, equipeId: filtreEquipe !== 'toutes' ? filtreEquipe : '' }); }, [charger, moisKey, filtreType, filtreCommande, filtreEquipe]);
  useEffect(() => { chargerNP(); chargerEquipes(); }, [chargerNP, chargerEquipes]);

  // Calendar days
  const days = useMemo(() => getDaysInMonth(mois), [mois]);

  // Get planifs for a date
  const getPlanifsForDate = (date: Date): PlanificationView[] => {
    const key = formatDateKey(date);
    return planifications.filter((p) => {
      const pKey = formatDateKey(new Date(p.datePlanifiee));
      if (pKey === key) return true;
      // Multi-day
      const jours = calculerJoursNecessaires(p.tempsEstimeInstallation);
      if (jours > 1) {
        const start = new Date(p.datePlanifiee);
        let worked = 0;
        const cur = new Date(start);
        while (worked < jours) {
          if (cur.getDay() !== 0 && cur.getDay() !== 6) {
            if (formatDateKey(cur) === key) return true;
            worked++;
          }
          cur.setDate(cur.getDate() + 1);
        }
      }
      return false;
    });
  };

  const getTotals = (date: Date) => {
    const planifs = getPlanifsForDate(date);
    return {
      count: planifs.length,
      heures: planifs.reduce((a, p) => a + (p.tempsEstimeInstallation || 0), 0),
      pieds: planifs.reduce((a, p) => a + (p.piedsLineaires || 0), 0),
    };
  };

  // === HANDLERS ===
  const handlePlanifier = async () => {
    if (!cmdAPlanifier || !planifForm.date || !planifForm.equipeId) return;
    try {
      await creer({
        commandeId: cmdAPlanifier.id,
        equipeId: planifForm.equipeId,
        datePlanifiee: planifForm.date,
        heureDebut: planifForm.heureDebut || null,
        heureFin: planifForm.heureFin || null,
        clientPresent: planifForm.clientPresent,
        representantPresent: planifForm.representantPresent,
        envoyerAvis: planifForm.envoyerAvis,
        notes: planifForm.notes || null,
      });
      setToast({ message: 'Installation planifiée', type: 'success' });
      setShowPlanifier(false); setCmdAPlanifier(null);
      setPlanifForm({ date: '', equipeId: '', heureDebut: '', heureFin: '', clientPresent: false, representantPresent: false, envoyerAvis: false, notes: '' });
      charger({ mois: moisKey }); chargerNP();
    } catch (e: any) { setToast({ message: e.message, type: 'error' }); }
  };

  const handleEditSave = async () => {
    if (!selectedPlanif) return;
    try {
      await modifier(selectedPlanif.id, {
        datePlanifiee: selectedPlanif.datePlanifiee.split('T')[0],
        equipeId: selectedPlanif.equipeId,
      });
      setToast({ message: 'Planification modifiée', type: 'success' });
      setShowEdit(false); setSelectedPlanif(null);
      charger({ mois: moisKey });
    } catch (e: any) { setToast({ message: e.message, type: 'error' }); }
  };

  const handleCompleter = async (id: string) => {
    try {
      await modifier(id, { statut: 'COMPLETEE' });
      setToast({ message: 'Installation terminée', type: 'success' });
      setSelectedDate(null); charger({ mois: moisKey });
    } catch (e: any) { setToast({ message: e.message, type: 'error' }); }
  };

  const handleAddEquipe = async () => {
    if (!equipeForm.nom) return;
    try {
      await creerEquipe(equipeForm);
      setToast({ message: 'Équipe ajoutée', type: 'success' });
      setEquipeForm({ nom: '', couleur: 'bg-blue-500' }); setShowAddEquipe(false);
      chargerEquipes();
    } catch (e: any) { setToast({ message: e.message, type: 'error' }); }
  };

  const handleDeleteEquipe = async (id: string) => {
    try {
      await supprimerEquipe(id);
      setToast({ message: 'Équipe supprimée', type: 'success' });
      chargerEquipes();
    } catch (e: any) { setToast({ message: e.message, type: 'error' }); }
  };

  const getMapUrl = () => {
    const addresses = planifications.filter((p) => p.adresse).map((p) => encodeURIComponent(p.adresse));
    if (addresses.length === 0) return '#';
    if (addresses.length === 1) return `https://www.google.com/maps/search/?api=1&query=${addresses[0]}`;
    return `https://www.google.com/maps/dir/${addresses.join('/')}`;
  };

  const couleurs = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-red-500', 'bg-cyan-500'];

  // ═══════════════════════════════════════
  // MODAL DÉTAILS DATE
  // ═══════════════════════════════════════
  const DateDetailModal = () => {
    if (!selectedDate) return null;
    const planifs = getPlanifsForDate(selectedDate);
    const totals = getTotals(selectedDate);
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[0.5rem] md:p-[1rem]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[64rem] max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-[1rem] bg-gradient-to-r from-slate-800 to-slate-700 text-white flex items-center justify-between">
            <h2 className="text-[1.25rem] font-bold">Projets du {selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}</h2>
            <button onClick={() => setSelectedDate(null)} className="p-[0.5rem] hover:bg-slate-600 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
          <div className="flex-1 overflow-y-auto p-[1rem] space-y-[1rem]">
            {planifs.length === 0 ? <div className="text-center py-[3rem] text-slate-500">Aucune installation planifiée</div> : planifs.map((p) => (
              <div key={p.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="flex items-start justify-between p-[1rem] border-b border-slate-100">
                  <div className="flex-1">
                    <div className="flex items-center gap-[0.75rem] mb-[0.5rem] flex-wrap">
                      <span className="font-mono font-bold text-[1.25rem]">{p.commandeNumero}</span>
                      {p.reprise && <span className="px-[0.75rem] py-[0.25rem] bg-orange-500 text-white text-[0.6875rem] font-bold rounded">Reprise</span>}
                      <span className="px-[0.75rem] py-[0.25rem] bg-red-600 text-white text-[0.6875rem] font-bold rounded">{p.service}</span>
                      <span className={`px-[0.5rem] py-[0.25rem] text-[0.6875rem] font-bold rounded ${TYPE_COMMANDE_COULEUR[p.typeCommande] || 'bg-slate-100 text-slate-700'}`}>{p.typeCommande}</span>
                    </div>
                    <p className="font-semibold text-[1.0625rem]">{p.clientNom}</p>
                    {p.reference && <p className="text-[0.8125rem] text-slate-500">{p.reference}</p>}
                    <p className="text-[0.8125rem] text-slate-600 mt-[0.25rem]">📍 {p.adresse}</p>
                    {p.commentaire && <div className="mt-[0.75rem] p-[0.75rem] bg-slate-50 rounded-lg border text-[0.8125rem]"><p className="whitespace-pre-line">{p.commentaire}</p></div>}
                  </div>
                  <div className="flex flex-col items-end gap-[0.5rem]">
                    <button onClick={() => { setSelectedPlanif({ ...p }); setShowEdit(true); }} className="p-[0.5rem] hover:bg-slate-100 rounded-lg">✏️</button>
                  </div>
                </div>
                {/* Statuts production + achats */}
                <div className="p-[1rem] grid grid-cols-1 md:grid-cols-2 gap-[1rem]">
                  <div className="space-y-[0.375rem]">
                    {[{ l: 'Mesure', v: p.mesure }, { l: 'Plan', v: p.plan }, { l: 'Envoyé prod.', v: p.envoyeProduction }, { l: 'Prod. terminée', v: p.productionTerminee }].map((s) => (
                      <div key={s.l} className="flex items-center gap-[0.5rem] text-[0.8125rem]"><span className="text-slate-500 w-[8rem]">{s.l}:</span><span className={`px-[0.5rem] py-[0.125rem] rounded font-semibold text-[0.75rem] ${getProdStatusColor(s.v)}`}>{getSymbol(s.v)}</span></div>
                    ))}
                  </div>
                  <div className="space-y-[0.375rem]">
                    {[{ l: 'Verre', v: p.achatVerres }, { l: 'Limon', v: p.achatLimons }, { l: 'Peinture', v: p.achatPeinture }, { l: 'Colonne', v: p.achatColonnes }, { l: 'Fibre', v: p.achatFibre }, { l: 'Attaches', v: p.achatAttaches }].map((s) => (
                      <div key={s.l} className="flex items-center gap-[0.5rem] text-[0.8125rem]"><span className="text-slate-500 w-[5rem]">{s.l}:</span><span className={`px-[0.5rem] py-[0.125rem] rounded font-semibold text-[0.75rem] ${getAchatStatusColor(s.v)}`}>{getSymbol(s.v)}</span></div>
                    ))}
                  </div>
                </div>
                <div className="p-[1rem] bg-slate-50 border-t flex items-center gap-[1rem] flex-wrap">
                  <div className={`px-[0.75rem] py-[0.375rem] rounded-lg text-white text-[0.8125rem] font-semibold ${p.equipeCouleur}`}>{p.equipeNom}</div>
                  <span className="text-[0.8125rem] text-slate-500">Pieds: <strong>{p.piedsLineaires}</strong></span>
                  <span className="text-[0.8125rem] text-slate-500">Temps: <strong>{p.tempsEstimeInstallation}h</strong></span>
                  <span className="text-[0.8125rem] text-slate-500">Couleur: <strong>{p.couleur || '—'}</strong></span>
                  {depasseJournee(p.tempsEstimeInstallation) && <span className="px-[0.5rem] py-[0.25rem] bg-amber-100 text-amber-800 rounded text-[0.75rem]">⚠️ Dépasse 8h</span>}
                  <button onClick={() => handleCompleter(p.id)} className="ml-auto px-[1rem] py-[0.375rem] bg-emerald-500 text-white rounded-lg text-[0.8125rem]">✓ Terminer</button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t-4 border-blue-500 p-[1rem] bg-white flex items-center justify-between flex-wrap gap-[0.75rem]">
            <button onClick={() => setSelectedDate(null)} className="px-[1.5rem] py-[0.75rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl">Sortir</button>
            <div className="flex items-center gap-[1rem]">
              <div className="border-2 border-blue-500 px-[1rem] py-[0.5rem] rounded-lg"><p className="text-[0.75rem] text-slate-600">Temps:</p><p className="text-[1.25rem] font-bold">{totals.heures}h</p></div>
              <div className="border-2 border-blue-500 px-[1rem] py-[0.5rem] rounded-lg"><p className="text-[0.75rem] text-slate-600">Pieds:</p><p className="text-[1.25rem] font-bold">{totals.pieds}</p></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════
  // MODAL PLANIFIER
  // ═══════════════════════════════════════
  const PlanifierModal = () => {
    if (!showPlanifier || !cmdAPlanifier) return null;
    const jours = calculerJoursNecessaires(cmdAPlanifier.tempsEstimeInstallation);
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-[1rem]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[30rem]">
          <div className="p-[1rem] border-b bg-gradient-to-r from-amber-400 to-yellow-500"><h2 className="text-[1.125rem] font-bold text-slate-900">Planifier l&apos;installation</h2><p className="text-[0.8125rem] text-slate-700">{cmdAPlanifier.numero} — {cmdAPlanifier.clientNom}</p></div>
          <div className="p-[1.5rem] space-y-[1rem]">
            <div className="bg-blue-50 p-[1rem] rounded-xl"><p className="text-[0.8125rem] text-blue-600">Temps estimé: <strong>{cmdAPlanifier.tempsEstimeInstallation}h</strong></p>
              {jours > 1 && <p className="text-[0.8125rem] text-amber-600 mt-[0.25rem]">⚠️ Nécessite {jours} jours de travail</p>}
            </div>
            <div><label className="block text-[0.8125rem] font-semibold text-slate-700 mb-[0.5rem]">Date de début</label><input type="date" value={planifForm.date} onChange={(e) => setPlanifForm({ ...planifForm, date: e.target.value })} className="w-full px-[1rem] py-[0.75rem] border border-slate-200 rounded-xl text-[0.8125rem]"/></div>
            <div><label className="block text-[0.8125rem] font-semibold text-slate-700 mb-[0.5rem]">Équipe</label>
              <select value={planifForm.equipeId} onChange={(e) => setPlanifForm({ ...planifForm, equipeId: e.target.value })} className="w-full px-[1rem] py-[0.75rem] border border-slate-200 rounded-xl bg-white text-[0.8125rem]">
                <option value="">Choisir une équipe</option>
                {equipes.map((eq) => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-[0.75rem]">
              <div><label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Heure début</label><input type="time" value={planifForm.heureDebut} onChange={(e) => setPlanifForm({ ...planifForm, heureDebut: e.target.value })} className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.8125rem]"/></div>
              <div><label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Heure fin</label><input type="time" value={planifForm.heureFin} onChange={(e) => setPlanifForm({ ...planifForm, heureFin: e.target.value })} className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.8125rem]"/></div>
            </div>
            <div className="space-y-[0.75rem]">
              {[{ k: 'clientPresent', l: 'Le client veut être présent' }, { k: 'representantPresent', l: 'Le représentant veut être présent' }, { k: 'envoyerAvis', l: "Envoyer un avis d'installation" }].map((o) => (
                <label key={o.k} className="flex items-center gap-[0.75rem] cursor-pointer"><input type="checkbox" checked={(planifForm as any)[o.k]} onChange={(e) => setPlanifForm({ ...planifForm, [o.k]: e.target.checked })} className="w-[1.25rem] h-[1.25rem] rounded"/><span className="text-[0.8125rem]">{o.l}</span></label>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between p-[1rem] border-t bg-slate-50">
            <button onClick={() => { setShowPlanifier(false); setCmdAPlanifier(null); }} className="px-[1rem] py-[0.5rem] text-slate-600 text-[0.875rem]">Annuler</button>
            <button onClick={handlePlanifier} disabled={!planifForm.date || !planifForm.equipeId} className="px-[1.5rem] py-[0.5rem] bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-medium rounded-lg text-[0.875rem]">Planifier</button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════
  // MODAL NON PLANIFIÉES
  // ═══════════════════════════════════════
  const NonPlanifieesModal = () => {
    if (!showNonPlanifiees) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[0.5rem] md:p-[1rem]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[64rem] max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-[1rem] bg-amber-500 text-white">
            <div><h2 className="text-[1.125rem] font-bold">Installations non planifiées</h2><p className="text-[0.8125rem] opacity-90">{nonPlanifiees.length} installation(s) en attente</p></div>
            <div className="flex gap-[0.5rem]">
              <a href={getMapUrl()} target="_blank" rel="noopener noreferrer" className="px-[1rem] py-[0.5rem] bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-[0.375rem] text-[0.875rem]">🗺️ Carte</a>
              <button onClick={() => setShowNonPlanifiees(false)} className="p-[0.5rem] hover:bg-white/20 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-[1rem] space-y-[1rem]">
            {nonPlanifiees.length === 0 ? <div className="text-center py-[3rem] text-slate-500">Toutes les installations sont planifiées!</div> : nonPlanifiees.map((cmd) => (
              <div key={cmd.id} className="border border-slate-200 rounded-xl p-[1rem] hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-[1rem] flex-wrap">
                  <div className="flex-1 min-w-[15rem]">
                    <div className="flex items-center gap-[0.75rem] mb-[0.5rem] flex-wrap">
                      <span className="font-mono font-bold text-[1.125rem]">{cmd.numero}</span>
                      <span className={`px-[0.5rem] py-[0.25rem] text-[0.6875rem] font-bold rounded ${TYPE_COMMANDE_COULEUR[cmd.typeCommande] || 'bg-slate-100 text-slate-700'}`}>{cmd.typeCommande}</span>
                      <span className="px-[0.5rem] py-[0.25rem] bg-red-600 text-white text-[0.6875rem] font-bold rounded">{cmd.service}</span>
                    </div>
                    <p className="font-semibold">{cmd.clientNom}</p><p className="text-[0.8125rem] text-slate-500">📍 {cmd.adresse}</p>
                    <div className="flex items-center gap-[1rem] mt-[0.75rem] text-[0.8125rem] flex-wrap">
                      <span className="bg-blue-100 px-[0.75rem] py-[0.25rem] rounded text-blue-800">Temps: <strong>{cmd.tempsEstimeInstallation || 0}h</strong></span>
                      <span className="bg-emerald-100 px-[0.75rem] py-[0.25rem] rounded text-emerald-800">Pieds: <strong>{cmd.piedsLineaires || 0}</strong></span>
                      {calculerJoursNecessaires(cmd.tempsEstimeInstallation) > 1 && <span className="bg-amber-100 px-[0.75rem] py-[0.25rem] rounded text-amber-800">⚠️ {calculerJoursNecessaires(cmd.tempsEstimeInstallation)} jours</span>}
                    </div>
                  </div>
                  <button onClick={() => { setCmdAPlanifier(cmd); setShowNonPlanifiees(false); setShowPlanifier(true); }} className="px-[1rem] py-[0.5rem] bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg text-[0.875rem]">Planifier</button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-[1rem] border-t bg-slate-50"><button onClick={() => setShowNonPlanifiees(false)} className="px-[1.5rem] py-[0.75rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl text-[0.875rem]">Fermer</button></div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════
  // MODAL ÉQUIPES
  // ═══════════════════════════════════════
  const EquipesModal = () => {
    if (!showEquipes) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[1rem]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[48rem] max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-[1rem] bg-slate-800 text-white flex items-center justify-between"><h2 className="text-[1.125rem] font-bold">Gestion des équipes</h2><button onClick={() => setShowEquipes(false)} className="p-[0.5rem] hover:bg-slate-700 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg></button></div>
          <div className="flex-1 overflow-auto p-[1rem] space-y-[1rem]">
            {equipes.map((eq) => (
              <div key={eq.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className={`p-[1rem] ${eq.couleur} text-white flex items-center justify-between`}>
                  <div><h3 className="font-bold text-[1.0625rem]">{eq.nom}</h3><p className="text-[0.8125rem] opacity-90">{eq.nbPlanifications} planif. • {eq.heuresTotal}h</p></div>
                  <button onClick={() => handleDeleteEquipe(eq.id)} className="p-[0.5rem] hover:bg-white/20 rounded-lg">✕</button>
                </div>
                {eq.membres.length > 0 && <div className="p-[0.75rem] bg-slate-50 flex flex-wrap gap-[0.375rem]">{eq.membres.map((m) => <span key={m.id} className="px-[0.5rem] py-[0.25rem] bg-white border text-slate-700 text-[0.8125rem] rounded">{m.prenom} {m.nom}</span>)}</div>}
              </div>
            ))}
            {showAddEquipe && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-[1rem]">
                <h4 className="font-bold mb-[0.75rem] text-[0.9375rem]">Nouvelle équipe</h4>
                <input type="text" value={equipeForm.nom} onChange={(e) => setEquipeForm({ ...equipeForm, nom: e.target.value })} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem] mb-[0.75rem]" placeholder="Nom de l'équipe"/>
                <div className="flex gap-[0.375rem] mb-[0.75rem]">{couleurs.map((c) => <button key={c} onClick={() => setEquipeForm({ ...equipeForm, couleur: c })} className={`w-[2rem] h-[2rem] rounded-full ${c} ${equipeForm.couleur === c ? 'ring-2 ring-offset-2 ring-slate-800' : ''}`}/>)}</div>
                <div className="flex gap-[0.5rem]"><button onClick={() => setShowAddEquipe(false)} className="px-[1rem] py-[0.5rem] text-slate-600 text-[0.875rem]">Annuler</button><button onClick={handleAddEquipe} className="px-[1rem] py-[0.5rem] bg-emerald-500 text-white rounded-lg text-[0.875rem]">Ajouter</button></div>
              </div>
            )}
          </div>
          <div className="p-[1rem] border-t bg-slate-50 flex justify-between">
            <button onClick={() => setShowAddEquipe(true)} className="px-[1rem] py-[0.5rem] bg-amber-500 text-white rounded-lg flex items-center gap-[0.375rem] text-[0.875rem]">+ Nouvelle équipe</button>
            <button onClick={() => setShowEquipes(false)} className="px-[1.5rem] py-[0.75rem] bg-blue-500 text-white font-semibold rounded-xl text-[0.875rem]">Fermer</button>
          </div>
        </div>
      </div>
    );
  };

  // EDIT MODAL
  const EditModal = () => {
    if (!showEdit || !selectedPlanif) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-[1rem]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[30rem]">
          <div className="p-[1rem] border-b"><h2 className="text-[1.125rem] font-bold">Modifier {selectedPlanif.commandeNumero}</h2></div>
          <div className="p-[1.5rem] space-y-[1rem]">
            <div><label className="block text-[0.8125rem] font-semibold mb-[0.5rem]">Date prévue</label><input type="date" value={selectedPlanif.datePlanifiee.split('T')[0]} onChange={(e) => setSelectedPlanif({ ...selectedPlanif, datePlanifiee: e.target.value })} className="w-full px-[1rem] py-[0.75rem] border rounded-xl text-[0.8125rem]"/></div>
            <div><label className="block text-[0.8125rem] font-semibold mb-[0.5rem]">Équipe</label><select value={selectedPlanif.equipeId} onChange={(e) => setSelectedPlanif({ ...selectedPlanif, equipeId: e.target.value })} className="w-full px-[1rem] py-[0.75rem] border rounded-xl bg-white text-[0.8125rem]"><option value="">Sélectionner</option>{equipes.map((eq) => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}</select></div>
          </div>
          <div className="flex items-center justify-between p-[1rem] border-t bg-slate-50">
            <button onClick={() => { setShowEdit(false); setSelectedPlanif(null); }} className="px-[1rem] py-[0.5rem] text-slate-600 text-[0.875rem]">Annuler</button>
            <div className="flex gap-[0.5rem]">
              <button onClick={() => { handleCompleter(selectedPlanif.id); setShowEdit(false); }} className="px-[1rem] py-[0.5rem] bg-emerald-500 text-white rounded-lg text-[0.875rem]">Terminer</button>
              <button onClick={handleEditSave} className="px-[1rem] py-[0.5rem] bg-blue-500 text-white rounded-lg text-[0.875rem]">Enregistrer</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ╔══════════════════════════════════════════════════════╗
  // ║                  RENDU PRINCIPAL                      ║
  // ╚══════════════════════════════════════════════════════╝
  return (
    <div className="space-y-[1.5rem]">
      <DateDetailModal/><NonPlanifieesModal/><EquipesModal/><PlanifierModal/><EditModal/>
      {toast && <div className={`fixed bottom-[1rem] right-[1rem] z-[70] px-[1rem] py-[0.75rem] rounded-lg shadow-lg text-white text-[0.875rem] font-medium ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{toast.type === 'success' ? '✓' : '✕'} {toast.message}</div>}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-[1rem]">
        <div><h1 className="text-[1.875rem] font-bold text-slate-800">Planification</h1><p className="text-slate-500 mt-[0.25rem] text-[0.875rem]">Planifiez les installations et les mesures</p></div>
        <div className="flex items-center gap-[0.75rem] flex-wrap">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-[1rem] py-[0.5rem] rounded-xl">
            <p className="text-[0.6875rem] opacity-80">Cette semaine</p>
            <div className="flex items-center gap-[1rem] text-[0.8125rem]"><span><strong>{stats?.nbPlanifiees || 0}</strong> install.</span><span><strong>{stats?.heuresTotal || 0}</strong>h</span><span><strong>{stats?.piedsTotal || 0}</strong> pi</span></div>
          </div>
          <button onClick={() => setShowEquipes(true)} className="px-[1rem] py-[0.5rem] border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center gap-[0.375rem] text-[0.875rem]">👥 Équipes</button>
          <a href={getMapUrl()} target="_blank" rel="noopener noreferrer" className="px-[1rem] py-[0.5rem] border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center gap-[0.375rem] text-[0.875rem]">🗺️ Carte</a>
          <button onClick={() => setShowNonPlanifiees(true)} className="px-[1rem] py-[0.75rem] bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-semibold rounded-xl shadow-lg flex items-center gap-[0.375rem] text-[0.875rem]">+ Non planifiées ({stats?.nbNonPlanifiees || 0})</button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-slate-200 p-[1rem] flex flex-wrap items-center gap-[1rem]">
        <div className="flex items-center gap-[0.5rem]"><span className="text-[0.8125rem] text-slate-600">Type:</span>
          <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} className="px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem]"><option value="tous">Tous</option><option value="installation">Installation</option><option value="mesure">Mesure</option></select></div>
        <div className="flex items-center gap-[0.5rem]"><span className="text-[0.8125rem] text-slate-600">Commande:</span>
          <select value={filtreCommande} onChange={(e) => setFiltreCommande(e.target.value)} className="px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem]"><option value="tous">Tous</option><option value="standard">Standard</option><option value="commercial">Commercial</option><option value="multiplan">Multiplan</option><option value="multi_phase">Multiphase</option></select></div>
        <div className="flex items-center gap-[0.5rem]"><span className="text-[0.8125rem] text-slate-600">Équipe:</span>
          <select value={filtreEquipe} onChange={(e) => setFiltreEquipe(e.target.value)} className="px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem]"><option value="toutes">Toutes</option>{equipes.map((eq) => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}</select></div>
        <span className="ml-auto px-[0.75rem] py-[0.25rem] bg-green-500 text-white text-[0.8125rem] font-semibold rounded">{stats?.nbNonPlanifiees || 0} prêtes à planifier</span>
      </div>

      {/* Calendrier */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between p-[1rem] bg-slate-800 text-white">
          <button onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() - 1, 1))} className="p-[0.5rem] hover:bg-slate-700 rounded-full text-[1.5rem]">◀</button>
          <h2 className="text-[1.5rem] font-bold">{MONTH_NAMES[mois.getMonth()]} {mois.getFullYear()}</h2>
          <button onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() + 1, 1))} className="p-[0.5rem] hover:bg-slate-700 rounded-full text-[1.5rem]">▶</button>
        </div>
        <div className="grid grid-cols-7 bg-slate-700 text-white">
          {DAY_NAMES_SHORT.map((d) => <div key={d} className="p-[0.75rem] text-center border-r border-slate-600 last:border-r-0"><p className="font-semibold uppercase text-[0.8125rem]">{d}</p></div>)}
        </div>
        <div className="grid grid-cols-7">
          {days.map((dayInfo, idx) => {
            const totals = getTotals(dayInfo.date);
            const planifs = getPlanifsForDate(dayInfo.date);
            const isWeekend = dayInfo.date.getDay() === 0 || dayInfo.date.getDay() === 6;
            const isToday = formatDateKey(dayInfo.date) === formatDateKey(new Date());
            return (
              <div key={idx} onClick={() => totals.count > 0 && setSelectedDate(dayInfo.date)}
                className={`min-h-[8.75rem] border-r border-b border-slate-200 p-[0.5rem] transition-colors
                  ${!dayInfo.currentMonth ? 'bg-slate-100 text-slate-400' : isWeekend ? 'bg-slate-50' : 'bg-white'}
                  ${totals.count > 0 ? 'cursor-pointer hover:bg-blue-50' : ''}
                  ${isToday && dayInfo.currentMonth ? 'ring-2 ring-inset ring-blue-500' : ''}`}>
                <div className="flex items-start justify-between mb-[0.25rem]">
                  <span className={`text-[1.0625rem] font-bold ${!dayInfo.currentMonth ? 'text-slate-300' : isToday ? 'bg-blue-500 text-white w-[2rem] h-[2rem] rounded-full flex items-center justify-center text-[0.8125rem]' : ''}`}>{dayInfo.day}</span>
                  {totals.count > 0 && dayInfo.currentMonth && (
                    <div className="flex items-center gap-[0.25rem]">
                      {depasseJournee(totals.heures) && <span className="text-amber-500 text-[0.6875rem]">ⓘ</span>}
                      <span className="bg-slate-800 text-white text-[0.6875rem] font-bold px-[0.375rem] py-[0.125rem] rounded">{totals.count}</span>
                      <span className="bg-red-500 text-white text-[0.6875rem] font-bold px-[0.375rem] py-[0.125rem] rounded">{totals.heures}</span>
                    </div>
                  )}
                </div>
                {dayInfo.currentMonth && planifs.slice(0, 2).map((p) => (
                  <div key={p.id} className={`mb-[0.25rem] p-[0.375rem] rounded text-[0.6875rem] text-white relative ${p.service === 'MESURE' ? 'bg-cyan-500' : p.equipeCouleur}`}>
                    {depasseJournee(p.tempsEstimeInstallation) && <span className="absolute -top-[0.25rem] -right-[0.25rem] bg-amber-400 text-amber-900 text-[0.5625rem] w-[1rem] h-[1rem] rounded-full flex items-center justify-center font-bold">!</span>}
                    <p className="font-bold truncate">{p.commandeNumero}</p>
                    <p className="truncate opacity-90 text-[0.5625rem]">{p.clientNom}</p>
                    <div className="flex items-center justify-between mt-[0.125rem] text-[0.5625rem] opacity-75">
                      <span>{p.equipeNom?.split(' ')[1] || p.equipeNom}</span>
                      <span>{p.tempsEstimeInstallation}h • {p.piedsLineaires}pi</span>
                    </div>
                  </div>
                ))}
                {planifs.length > 2 && dayInfo.currentMonth && <p className="text-[0.6875rem] text-blue-600 font-medium text-center">+{planifs.length - 2} autres</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}