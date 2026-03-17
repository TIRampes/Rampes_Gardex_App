'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePlanification, useNonPlanifiees, useEquipes, useVehicules, useChauffeurs } from '@/app/hooks/usePlanification';
import type { PlanificationView, CommandeNonPlanifiee } from '@/app/api/planification/schema';
import {
  MONTH_NAMES, DAY_NAMES_SHORT, SERVICE_COULEUR, SERVICE_TEXT, TYPE_COMMANDE_COULEUR,
  formatDateKey, getDaysInMonth, calculerJoursNecessaires, depasseJournee,
  getProdStatusColor, getAchatStatusColor, getSymbol, getServiceBg, getServiceLabel,
  getWeekNumber, needsEquipe, needsChauffeur, needsMesureur,
} from '@/app/api/planification/schema';

export default function PlanificationPage() {
  const { planifications, stats, loading, charger, creer, modifier, envoyerAvis } = usePlanification();
  const { commandes: nonPlanifiees, charger: chargerNP } = useNonPlanifiees();
  const { equipes, calendrier, charger: chargerEquipes, creer: creerEquipe, modifier: modifierEquipe, supprimer: supprimerEquipe, chargerCalendrier, creerCalendrier, supprimerCalendrier } = useEquipes();
  const { vehicules, charger: chargerVehicules, creer: creerVehicule, modifier: modifierVehicule, supprimer: supprimerVehicule } = useVehicules();
  const { chauffeurs, charger: chargerChauffeurs, creer: creerChauffeur, modifier: modifierChauffeur, supprimer: supprimerChauffeur } = useChauffeurs();

  const [mois, setMois] = useState(new Date());
  const [filtreType, setFiltreType] = useState('');
  const [filtreCommande, setFiltreCommande] = useState('');
  const [filtreEquipe, setFiltreEquipe] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showNonPlanifiees, setShowNonPlanifiees] = useState(false);
  const [showEquipes, setShowEquipes] = useState(false);
  const [showCalendrier, setShowCalendrier] = useState(false);
  const [showPlanifier, setShowPlanifier] = useState(false);
  const [cmdAPlanifier, setCmdAPlanifier] = useState<CommandeNonPlanifiee | null>(null);
  const [selectedPlanif, setSelectedPlanif] = useState<PlanificationView | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showVehicules, setShowVehicules] = useState(false);
  const [showChauffeurs, setShowChauffeurs] = useState(false);

  const [equipeForm, setEquipeForm] = useState({ nom: '', responsable: '', nbHeuresJour: 8, couleur: 'bg-blue-500' });
  const [editingEquipeId, setEditingEquipeId] = useState<string | null>(null);
  const [calForm, setCalForm] = useState({ equipeId: '', semaineDu: '', jours: 5, heures: 40 });
  const [planifForm, setPlanifForm] = useState({ date: '', equipeId: '', chauffeurId: '', vehiculeId: '', heureDebut: '', heureFin: '', clientPresent: false, representantPresent: false, envoyerAvis: false, notes: '' });
  const [vehiculeForm, setVehiculeForm] = useState({ nom: '', type: '', plaque: '' });
  const [editVehiculeId, setEditVehiculeId] = useState<string | null>(null);
  const [chauffeurForm, setChauffeurForm] = useState({ nom: '', telephone: '', permis: '' });
  const [editChauffeurId, setEditChauffeurId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 4000); return () => clearTimeout(t); } }, [toast]);

  const moisKey = `${mois.getFullYear()}-${String(mois.getMonth() + 1).padStart(2, '0')}`;

  const recharger = useCallback(() => {
    const params: Record<string, string> = { mois: moisKey };
    if (filtreType) params.type = filtreType;
    if (filtreCommande) params.typeCommande = filtreCommande;
    if (filtreEquipe) params.equipeId = filtreEquipe;
    charger(params);
  }, [charger, moisKey, filtreType, filtreCommande, filtreEquipe]);

  useEffect(() => { recharger(); }, [recharger]);
  useEffect(() => { chargerNP(); chargerEquipes(); chargerVehicules(); chargerChauffeurs(); chargerCalendrier(); }, [chargerNP, chargerEquipes, chargerVehicules, chargerChauffeurs, chargerCalendrier]);

  const days = useMemo(() => getDaysInMonth(mois), [mois]);
  const toLocalDate = (s: string) => new Date(s + 'T12:00:00');

  const getPlanifsForDate = (date: Date): PlanificationView[] => {
    const key = formatDateKey(date);
    return planifications.filter((p) => {
      const pDate = toLocalDate(p.datePlanifiee.split('T')[0]);
      if (formatDateKey(pDate) === key) return true;
      const jours = calculerJoursNecessaires(p.tempsEstimeInstallation);
      if (jours > 1) { let w = 0; const c = new Date(pDate); while (w < jours) { if (c.getDay() !== 0 && c.getDay() !== 6) { if (formatDateKey(c) === key) return true; w++; } c.setDate(c.getDate() + 1); } }
      return false;
    });
  };

  const getTotals = (date: Date) => { const pl = getPlanifsForDate(date); return { count: pl.length, heures: pl.reduce((a, p) => a + (p.tempsEstimeInstallation || 0), 0), pieds: pl.reduce((a, p) => a + (p.piedsLineaires || 0), 0) }; };

  // Map — ouvre dans un nouvel onglet sans crasher l'app
  const ouvrirCarte = (planifs?: PlanificationView[]) => {
    const list = planifs || planifications;
    const addrs = list.filter(p => p.adresse).map(p => p.adresse);
    if (!addrs.length) { setToast({ message: 'Aucune adresse à afficher', type: 'error' }); return; }
    let url: string;
    if (addrs.length === 1) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addrs[0])}`;
    } else {
      const origin = encodeURIComponent(addrs[0]);
      const dest = encodeURIComponent(addrs[addrs.length - 1]);
      const wps = addrs.slice(1, -1).map(a => encodeURIComponent(a)).join('|');
      url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}${wps ? `&waypoints=${wps}` : ''}&travelmode=driving`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // === HANDLERS ===
  const handlePlanifier = async () => {
    if (!cmdAPlanifier || !planifForm.date) return;
    if (needsEquipe(cmdAPlanifier.service) && !planifForm.equipeId) return;
    if (needsChauffeur(cmdAPlanifier.service) && !planifForm.chauffeurId) return;
    try {
      await creer({
        commandeId: cmdAPlanifier.id,
        equipeId: planifForm.equipeId || null,
        chauffeurId: planifForm.chauffeurId || null,
        vehiculeId: planifForm.vehiculeId || null,
        datePlanifiee: planifForm.date,
        heureDebut: planifForm.heureDebut || null,
        heureFin: planifForm.heureFin || null,
        clientPresent: planifForm.clientPresent,
        representantPresent: planifForm.representantPresent,
        envoyerAvis: planifForm.envoyerAvis,
        notes: planifForm.notes || null,
      });
      setToast({ message: 'Planification réussie', type: 'success' });
      setShowPlanifier(false); setCmdAPlanifier(null);
      setPlanifForm({ date: '', equipeId: '', chauffeurId: '', vehiculeId: '', heureDebut: '', heureFin: '', clientPresent: false, representantPresent: false, envoyerAvis: false, notes: '' });
      // RECHARGER les deux listes
      recharger();
      chargerNP();
    } catch (e: any) { setToast({ message: e.message, type: 'error' }); }
  };

  const handleCompleter = async (id: string) => { try { await modifier(id, { statut: 'COMPLETEE' }); setToast({ message: 'Terminée', type: 'success' }); setSelectedDate(null); recharger(); } catch (e: any) { setToast({ message: e.message, type: 'error' }); } };
  const handleAvisClient = async (id: string) => { try { const r = await envoyerAvis(id); setToast({ message: `Email: ${r.email ? '✓' : '✕'} | SMS: ${r.sms ? '✓' : '✕'}`, type: r.email || r.sms ? 'success' : 'error' }); recharger(); } catch (e: any) { setToast({ message: e.message, type: 'error' }); } };

  const handleSaveEquipe = async () => { if (!equipeForm.nom) return; try { if (editingEquipeId) await modifierEquipe(editingEquipeId, equipeForm); else await creerEquipe(equipeForm); setToast({ message: editingEquipeId ? 'Modifiée' : 'Ajoutée', type: 'success' }); setEquipeForm({ nom: '', responsable: '', nbHeuresJour: 8, couleur: 'bg-blue-500' }); setEditingEquipeId(null); chargerEquipes(); } catch (e: any) { setToast({ message: e.message, type: 'error' }); } };
  const handleAddCal = async () => { if (!calForm.equipeId || !calForm.semaineDu) return; try { await creerCalendrier(calForm); setToast({ message: 'Ajouté', type: 'success' }); setCalForm({ equipeId: '', semaineDu: '', jours: 5, heures: 40 }); chargerCalendrier(); } catch (e: any) { setToast({ message: e.message, type: 'error' }); } };
  const handleSaveVehicule = async () => { if (!vehiculeForm.nom || !vehiculeForm.type || !vehiculeForm.plaque) return; try { if (editVehiculeId) await modifierVehicule(editVehiculeId, vehiculeForm); else await creerVehicule(vehiculeForm); setToast({ message: editVehiculeId ? 'Modifié' : 'Ajouté', type: 'success' }); setVehiculeForm({ nom: '', type: '', plaque: '' }); setEditVehiculeId(null); chargerVehicules(); } catch (e: any) { setToast({ message: e.message, type: 'error' }); } };
  const handleSaveChauffeur = async () => { if (!chauffeurForm.nom) return; try { if (editChauffeurId) await modifierChauffeur(editChauffeurId, chauffeurForm); else await creerChauffeur(chauffeurForm); setToast({ message: editChauffeurId ? 'Modifié' : 'Ajouté', type: 'success' }); setChauffeurForm({ nom: '', telephone: '', permis: '' }); setEditChauffeurId(null); chargerChauffeurs(); } catch (e: any) { setToast({ message: e.message, type: 'error' }); } };

  // Semaines du mois pour filtre
  const getSemainesDuMois = () => {
    const y = mois.getFullYear(), m = mois.getMonth();
    const semaines: { label: string; start: string; end: string }[] = [];
    let cur = new Date(y, m, 1);
    while (cur.getMonth() === m) {
      const wStart = new Date(cur);
      wStart.setDate(cur.getDate() - cur.getDay() + 1); // Lundi
      const wEnd = new Date(wStart);
      wEnd.setDate(wStart.getDate() + 6); // Dimanche
      const label = `${wStart.getDate()} ${MONTH_NAMES[wStart.getMonth()].slice(0, 3)} — ${wEnd.getDate()} ${MONTH_NAMES[wEnd.getMonth()].slice(0, 3)}`;
      const key = formatDateKey(wStart);
      if (!semaines.find(s => s.start === key)) semaines.push({ label, start: key, end: formatDateKey(wEnd) });
      cur.setDate(cur.getDate() + 7);
    }
    return semaines;
  };

  // ═══════════ DATE DETAIL ═══════════
  const DateDetailModal = () => {
    if (!selectedDate) return null;
    const planifs = getPlanifsForDate(selectedDate);
    const totals = getTotals(selectedDate);
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[0.5rem] md:p-[1rem]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[64rem] max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-[1rem] bg-gradient-to-r from-slate-800 to-slate-700 text-white flex items-center justify-between">
            <h2 className="text-[1.125rem] font-bold">Projets du {selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}</h2>
            <div className="flex gap-[0.5rem]">
              {planifs.length > 0 && <button onClick={() => ouvrirCarte(planifs)} className="px-[0.75rem] py-[0.375rem] bg-white/20 hover:bg-white/30 rounded-lg text-[0.8125rem]">🗺️ Voir distances</button>}
              <button onClick={() => setSelectedDate(null)} className="p-[0.5rem] hover:bg-slate-600 rounded-lg">✕</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-[1rem] space-y-[1rem]">
            {planifs.length === 0 ? <div className="text-center py-[3rem] text-slate-500">Aucune intervention</div> : planifs.map((p) => (
              <div key={p.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                {/* Header */}
                <div className="p-[1rem] border-b border-slate-100 flex items-start justify-between gap-[0.5rem] flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-[0.5rem] mb-[0.375rem] flex-wrap">
                      <span className="font-mono font-bold text-[1.125rem] text-slate-900">{p.commandeNumero}</span>
                      <span className={`px-[0.5rem] py-[0.125rem] ${getServiceBg(p.service)} ${SERVICE_TEXT[p.service] || 'text-white'} text-[0.6875rem] font-bold rounded`}>{getServiceLabel(p.service).toUpperCase()}</span>
                      {p.typeCommande && p.typeCommande !== 'STANDARD' && <span className={`px-[0.5rem] py-[0.125rem] text-[0.6875rem] font-semibold rounded ${TYPE_COMMANDE_COULEUR[p.typeCommande] || 'bg-slate-100 text-slate-600'}`}>{p.typeCommande}</span>}
                      {p.reprise && <span className="px-[0.375rem] py-[0.125rem] bg-orange-500 text-white text-[0.6875rem] font-bold rounded">Reprise</span>}
                    </div>
                    <p className="font-bold text-[1.0625rem] text-slate-900">{p.clientNom}</p>
                    {p.reference && <p className="text-[0.8125rem] text-slate-500">{p.reference}</p>}
                    <p className="text-[0.8125rem] text-slate-500 mt-[0.125rem]">📍 {p.adresse || 'Adresse non spécifiée'}</p>
                    {p.commentaire && <div className="mt-[0.5rem] p-[0.5rem] bg-slate-50 rounded border text-[0.8125rem] whitespace-pre-line text-slate-600">{p.commentaire}</div>}
                  </div>
                  <button onClick={() => { setSelectedPlanif({ ...p }); setShowEdit(true); }} className="p-[0.375rem] hover:bg-slate-100 rounded-lg text-[1rem]">✏️</button>
                </div>

                {/* Production + Achats */}
                <div className="p-[1rem] grid grid-cols-2 gap-[1rem]">
                  <div className="space-y-[0.375rem]">
                    {[{ l: 'Mesure:', v: p.mesure }, { l: 'Plan:', v: p.plan }, { l: 'Envoyé prod.:', v: p.envoyeProduction }, { l: 'Prod. terminée:', v: p.productionTerminee }].map((s) => (
                      <div key={s.l} className="flex items-center justify-between text-[0.8125rem]">
                        <span className="text-slate-600">{s.l}</span>
                        <span className={`px-[0.5rem] py-[0.0625rem] rounded font-semibold text-[0.75rem] ${getProdStatusColor(s.v)}`}>{getSymbol(s.v)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-[0.375rem]">
                    {[{ l: 'Verre:', v: p.achatVerres }, { l: 'Limon:', v: p.achatLimons }, { l: 'Peinture:', v: p.achatPeinture }, { l: 'Colonne:', v: p.achatColonnes }, { l: 'Fibre:', v: p.achatFibre }, { l: 'Attaches:', v: p.achatAttaches }].map((s) => (
                      <div key={s.l} className="flex items-center justify-between text-[0.8125rem]">
                        <span className="text-slate-600">{s.l}</span>
                        <span className={`px-[0.5rem] py-[0.0625rem] rounded font-semibold text-[0.75rem] ${getAchatStatusColor(s.v)}`}>{getSymbol(s.v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-[1rem] py-[0.75rem] bg-slate-50 border-t border-slate-100 flex items-center gap-[0.5rem] flex-wrap">
                  {p.equipeNom && <span className={`px-[0.5rem] py-[0.25rem] rounded-lg text-white text-[0.75rem] font-semibold ${p.equipeCouleur}`}>{p.equipeNom}</span>}
                  {p.chauffeurNom && <span className="px-[0.375rem] py-[0.125rem] bg-slate-700 text-white rounded text-[0.6875rem]">🚛 {p.chauffeurNom}</span>}
                  {p.vehiculeNom && <span className="px-[0.375rem] py-[0.125rem] bg-slate-600 text-white rounded text-[0.6875rem]">🚐 {p.vehiculeNom}</span>}
                  <span className="text-[0.75rem] text-slate-500">{p.tempsEstimeInstallation}h</span>
                  {depasseJournee(p.tempsEstimeInstallation) && <span className="bg-amber-100 text-amber-800 rounded text-[0.6875rem] px-[0.25rem]">⚠️ &gt;8h</span>}
                  <div className="ml-auto flex gap-[0.25rem]">
                    <button onClick={() => { window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.adresse)}`, '_blank', 'noopener'); }} className="px-[0.5rem] py-[0.25rem] bg-slate-500 text-white rounded text-[0.75rem]">📍</button>
                    <button onClick={() => handleAvisClient(p.id)} className={`px-[0.5rem] py-[0.25rem] rounded text-[0.75rem] ${p.avisClientEnvoye ? 'bg-slate-200 text-slate-600' : 'bg-blue-500 text-white'}`}>{p.avisClientEnvoye ? '✓ Avis' : '📨 Avis'}</button>
                    <button onClick={() => handleCompleter(p.id)} className="px-[0.5rem] py-[0.25rem] bg-emerald-500 text-white rounded text-[0.75rem]">✓ Terminer</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t-4 border-blue-500 p-[1rem] flex items-center justify-between flex-wrap gap-[0.5rem]">
            <button onClick={() => setSelectedDate(null)} className="px-[1.5rem] py-[0.625rem] bg-blue-500 text-white font-semibold rounded-xl text-[0.875rem]">Sortir</button>
            <div className="flex gap-[0.75rem]">
              <div className="border-2 border-blue-500 px-[0.75rem] py-[0.375rem] rounded-lg"><p className="text-[0.625rem] text-slate-600">Temps</p><p className="text-[1.125rem] font-bold">{totals.heures}h</p></div>
              <div className="border-2 border-blue-500 px-[0.75rem] py-[0.375rem] rounded-lg"><p className="text-[0.625rem] text-slate-600">Pieds</p><p className="text-[1.125rem] font-bold">{totals.pieds}</p></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════ PLANIFIER ═══════════
  const PlanifierModal = () => {
    if (!showPlanifier || !cmdAPlanifier) return null;
    const jours = calculerJoursNecessaires(cmdAPlanifier.tempsEstimeInstallation);
    const isInstall = needsEquipe(cmdAPlanifier.service);
    const isTransport = needsChauffeur(cmdAPlanifier.service);
    const isMesure = needsMesureur(cmdAPlanifier.service);
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-[1rem]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[28rem]">
          <div className={`p-[1rem] border-b ${getServiceBg(cmdAPlanifier.service)} ${SERVICE_TEXT[cmdAPlanifier.service] || 'text-white'}`}><h2 className="text-[1rem] font-bold">Planifier — {getServiceLabel(cmdAPlanifier.service)}</h2><p className="text-[0.8125rem] opacity-90">{cmdAPlanifier.numero} — {cmdAPlanifier.clientNom}</p></div>
          <div className="p-[1.25rem] space-y-[0.75rem]">
            {isMesure && <div className="bg-violet-50 p-[0.625rem] rounded-xl text-[0.8125rem] text-violet-700 border border-violet-200">📐 Prise de mesures — Sélectionnez la date et l&apos;heure du rendez-vous</div>}
            <div className="bg-blue-50 p-[0.625rem] rounded-xl text-[0.8125rem] text-blue-600">Temps: <strong>{cmdAPlanifier.tempsEstimeInstallation}h</strong>{jours > 1 && <span className="text-amber-600 ml-[0.5rem]">⚠️ {jours} jours</span>}</div>
            <div><label className="block text-[0.8125rem] font-semibold mb-[0.25rem]">Date *</label><input type="date" value={planifForm.date} onChange={(e) => setPlanifForm({ ...planifForm, date: e.target.value })} className="w-full px-[0.75rem] py-[0.5rem] border rounded-xl text-[0.8125rem]"/></div>
            {isInstall && <div><label className="block text-[0.8125rem] font-semibold mb-[0.25rem]">Équipe *</label><select value={planifForm.equipeId} onChange={(e) => setPlanifForm({ ...planifForm, equipeId: e.target.value })} className="w-full px-[0.75rem] py-[0.5rem] border rounded-xl bg-white text-[0.8125rem]"><option value="">Choisir...</option>{equipes.map((eq) => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}</select></div>}
            {isTransport && (<>
              <div><label className="block text-[0.8125rem] font-semibold mb-[0.25rem]">Chauffeur *</label><select value={planifForm.chauffeurId} onChange={(e) => setPlanifForm({ ...planifForm, chauffeurId: e.target.value })} className="w-full px-[0.75rem] py-[0.5rem] border rounded-xl bg-white text-[0.8125rem]"><option value="">Choisir...</option>{chauffeurs.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}</select>{chauffeurs.length === 0 && <p className="text-[0.75rem] text-red-500 mt-[0.125rem]">Aucun chauffeur — <button type="button" onClick={() => { setShowPlanifier(false); setShowChauffeurs(true); }} className="underline font-medium">en ajouter</button></p>}</div>
              <div><label className="block text-[0.8125rem] font-semibold mb-[0.25rem]">Véhicule</label><select value={planifForm.vehiculeId} onChange={(e) => setPlanifForm({ ...planifForm, vehiculeId: e.target.value })} className="w-full px-[0.75rem] py-[0.5rem] border rounded-xl bg-white text-[0.8125rem]"><option value="">Choisir...</option>{vehicules.map((v) => <option key={v.id} value={v.id}>{v.nom} ({v.plaque})</option>)}</select>{vehicules.length === 0 && <p className="text-[0.75rem] text-red-500 mt-[0.125rem]">Aucun véhicule — <button type="button" onClick={() => { setShowPlanifier(false); setShowVehicules(true); }} className="underline font-medium">en ajouter</button></p>}</div>
            </>)}
            <div className="grid grid-cols-2 gap-[0.5rem]"><div><label className="block text-[0.6875rem] text-slate-500 mb-[0.125rem]">Heure début</label><input type="time" value={planifForm.heureDebut} onChange={(e) => setPlanifForm({ ...planifForm, heureDebut: e.target.value })} className="w-full px-[0.5rem] py-[0.375rem] border rounded-lg text-[0.8125rem]"/></div><div><label className="block text-[0.6875rem] text-slate-500 mb-[0.125rem]">Heure fin</label><input type="time" value={planifForm.heureFin} onChange={(e) => setPlanifForm({ ...planifForm, heureFin: e.target.value })} className="w-full px-[0.5rem] py-[0.375rem] border rounded-lg text-[0.8125rem]"/></div></div>
            <div className="space-y-[0.375rem]">{[{ k: 'clientPresent', l: 'Client présent' }, { k: 'representantPresent', l: 'Représentant présent' }, { k: 'envoyerAvis', l: "Envoyer avis" }].map((o) => <label key={o.k} className="flex items-center gap-[0.5rem] cursor-pointer"><input type="checkbox" checked={(planifForm as any)[o.k]} onChange={(e) => setPlanifForm({ ...planifForm, [o.k]: e.target.checked })} className="w-[1rem] h-[1rem] rounded"/><span className="text-[0.8125rem]">{o.l}</span></label>)}</div>
          </div>
          <div className="flex items-center justify-between p-[1rem] border-t bg-slate-50">
            <button onClick={() => { setShowPlanifier(false); setCmdAPlanifier(null); }} className="px-[1rem] py-[0.5rem] text-slate-600 text-[0.8125rem]">Annuler</button>
            <button onClick={handlePlanifier} disabled={!planifForm.date || (isInstall && !planifForm.equipeId) || (isTransport && !planifForm.chauffeurId)} className="px-[1.25rem] py-[0.5rem] bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-medium rounded-lg text-[0.8125rem]">Planifier</button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════ NON PLANIFIÉES ═══════════
  const NonPlanifieesModal = () => {
    const [search, setSearch] = useState('');
    const [filtreSvc, setFiltreSvc] = useState('');
    const [filtreSemaine, setFiltreSemaine] = useState('');
    if (!showNonPlanifiees) return null;
    const semaines = getSemainesDuMois();
    let filtered = nonPlanifiees;
    if (filtreSvc) filtered = filtered.filter((c) => c.service === filtreSvc.toUpperCase());
    if (search) filtered = filtered.filter((c) => c.numero.toLowerCase().includes(search.toLowerCase()) || c.clientNom.toLowerCase().includes(search.toLowerCase()));
    if (filtreSemaine) { const sem = semaines.find((s) => s.start === filtreSemaine); if (sem) filtered = filtered.filter((c) => { if (!c.datePrevue) return false; const dk = formatDateKey(new Date(c.datePrevue)); return dk >= sem.start && dk <= sem.end; }); }

    const grouped: Record<string, CommandeNonPlanifiee[]> = {};
    filtered.forEach((cmd) => { let wk = 'Sans date'; if (cmd.datePrevue) { const { year, week } = getWeekNumber(new Date(cmd.datePrevue)); wk = `S${week} — ${year}`; } if (!grouped[wk]) grouped[wk] = []; grouped[wk].push(cmd); });
    const sortedWeeks = Object.keys(grouped).sort((a, b) => a === 'Sans date' ? 1 : b === 'Sans date' ? -1 : a.localeCompare(b));

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[0.5rem] md:p-[1rem]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[72rem] max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-[1rem] bg-amber-500 text-white flex items-center justify-between">
            <div>
              <h2 className="text-[1.125rem] font-bold">Commandes non planifiées</h2>
              <p className="text-[0.8125rem] opacity-90">{filtered.length} commande(s) en attente</p>
            </div>
            <button onClick={() => setShowNonPlanifiees(false)} className="p-[0.5rem] hover:bg-white/20 rounded-lg">✕</button>
          </div>

          {/* Filtres */}
          <div className="p-[0.75rem] border-b flex flex-wrap gap-[0.5rem] items-center">
            <input type="text" placeholder="Rechercher # commande ou client..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 min-w-[12rem] px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.8125rem]"/>
            <select value={filtreSvc} onChange={(e) => setFiltreSvc(e.target.value)} className="px-[0.5rem] py-[0.5rem] border rounded-lg text-[0.8125rem]">
              <option value="">Tous services</option>
              {['installation', 'livraison', 'cueillette', 'transport', 'mesure'].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
            <select value={filtreSemaine} onChange={(e) => setFiltreSemaine(e.target.value)} className="px-[0.5rem] py-[0.5rem] border rounded-lg text-[0.8125rem]">
              <option value="">Toutes les semaines</option>
              {semaines.map((s) => <option key={s.start} value={s.start}>{s.label}</option>)}
            </select>
          </div>

          {/* Tableau */}
          <div className="flex-1 overflow-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-[3rem] text-slate-500">Aucune commande trouvée</div>
            ) : (
              <div className="space-y-[0.5rem] p-[0.75rem]">
                {sortedWeeks.map((wk) => (
                  <div key={wk}>
                    <div className="bg-slate-700 text-white px-[0.75rem] py-[0.5rem] rounded-t-lg sticky top-0 z-10">
                      <span className="text-[0.8125rem] font-bold">{wk}</span>
                      <span className="text-[0.75rem] opacity-70 ml-[0.5rem]">({grouped[wk].length} commande{grouped[wk].length > 1 ? 's' : ''})</span>
                    </div>
                    <div className="border border-slate-200 rounded-b-lg overflow-hidden">
                      <table className="w-full text-[0.8125rem]">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-[0.75rem] py-[0.5rem] text-left font-semibold text-slate-700"># Commande</th>
                            <th className="px-[0.75rem] py-[0.5rem] text-center font-semibold text-slate-700">Service</th>
                            <th className="px-[0.75rem] py-[0.5rem] text-center font-semibold text-slate-700 hidden md:table-cell">Date prévue</th>
                            <th className="px-[0.75rem] py-[0.5rem] text-left font-semibold text-slate-700">Client</th>
                            <th className="px-[0.75rem] py-[0.5rem] text-center font-semibold text-slate-700 hidden lg:table-cell">Ville</th>
                            <th className="px-[0.75rem] py-[0.5rem] text-center font-semibold text-slate-700 hidden lg:table-cell">Temps</th>
                            <th className="px-[0.75rem] py-[0.5rem] text-center font-semibold text-slate-700 hidden lg:table-cell">Pieds</th>
                            <th className="px-[0.75rem] py-[0.5rem] w-[6rem]"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {grouped[wk].map((cmd, i) => (
                            <tr key={cmd.id} className={`hover:bg-blue-50 cursor-pointer transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                              <td className="px-[0.75rem] py-[0.625rem]">
                                <span className="font-mono font-bold text-[0.9375rem] text-slate-800">{cmd.numero}</span>
                              </td>
                              <td className="px-[0.75rem] py-[0.625rem] text-center">
                                <span className={`inline-block px-[0.5rem] py-[0.125rem] ${getServiceBg(cmd.service)} ${SERVICE_TEXT[cmd.service] || 'text-white'} text-[0.6875rem] font-bold rounded-full`}>
                                  {getServiceLabel(cmd.service)}
                                </span>
                              </td>
                              <td className="px-[0.75rem] py-[0.625rem] text-center hidden md:table-cell text-[0.8125rem] text-slate-600">
                                {cmd.datePrevue ? new Date(cmd.datePrevue).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }) : '—'}
                              </td>
                              <td className="px-[0.75rem] py-[0.625rem]">
                                <p className="font-semibold text-slate-800 text-[0.8125rem]">{cmd.clientNom}</p>
                              </td>
                              <td className="px-[0.75rem] py-[0.625rem] text-center hidden lg:table-cell text-[0.8125rem] text-slate-500">
                                {cmd.clientVille || '—'}
                              </td>
                              <td className="px-[0.75rem] py-[0.625rem] text-center hidden lg:table-cell">
                                <span className="bg-blue-100 text-blue-800 px-[0.375rem] py-[0.0625rem] rounded text-[0.75rem] font-semibold">{cmd.tempsEstimeInstallation || 0}h</span>
                              </td>
                              <td className="px-[0.75rem] py-[0.625rem] text-center hidden lg:table-cell">
                                <span className="bg-emerald-100 text-emerald-800 px-[0.375rem] py-[0.0625rem] rounded text-[0.75rem] font-semibold">{cmd.piedsLineaires || 0}</span>
                              </td>
                              <td className="px-[0.75rem] py-[0.625rem] text-center">
                                <button
                                  onClick={() => { setCmdAPlanifier(cmd); setShowNonPlanifiees(false); setShowPlanifier(true); }}
                                  className="px-[0.75rem] py-[0.375rem] bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg text-[0.75rem] whitespace-nowrap"
                                >
                                  Planifier
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-[0.75rem] border-t bg-slate-50 flex items-center justify-between">
            <button onClick={() => setShowNonPlanifiees(false)} className="px-[1.25rem] py-[0.5rem] bg-blue-500 text-white font-semibold rounded-xl text-[0.875rem]">Fermer</button>
            <span className="text-[0.8125rem] text-slate-500">{filtered.length} commande(s) affichée(s) sur {nonPlanifiees.length}</span>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════ ÉQUIPES ═══════════
  const EquipesModal = () => { if (!showEquipes) return null; return (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[1rem]"><div className="bg-slate-500 rounded-2xl shadow-2xl w-full max-w-[52rem] max-h-[90vh] overflow-hidden flex flex-col"><div className="p-[1rem] flex items-center justify-between"><h2 className="text-[1.5rem] font-bold text-white underline">Équipes</h2><button onClick={() => { setShowEquipes(false); setShowCalendrier(true); }} className="px-[0.75rem] py-[0.375rem] bg-white/20 text-white rounded-lg text-[0.875rem]">📅 Calendrier</button></div><div className="bg-white rounded-lg mx-[1rem] overflow-auto"><table className="w-full text-[0.875rem]"><thead className="bg-slate-200"><tr><th className="px-[0.75rem] py-[0.625rem] text-left underline text-blue-700">Nom</th><th className="px-[0.75rem] py-[0.625rem] text-center underline text-blue-700">Responsable</th><th className="px-[0.75rem] py-[0.625rem] text-center underline text-blue-700">Nb H/Jour</th><th className="px-[0.75rem] py-[0.625rem] w-[11rem]"></th></tr></thead><tbody className="divide-y divide-slate-200">{equipes.map((eq, i) => (<tr key={eq.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}><td className="px-[0.75rem] py-[0.625rem] font-semibold">{eq.nom}</td><td className="px-[0.75rem] py-[0.625rem] text-center">{eq.responsable || '—'}</td><td className="px-[0.75rem] py-[0.625rem] text-center font-bold">{eq.nbHeuresJour ?? ''}</td><td className="px-[0.75rem] py-[0.625rem] text-center"><div className="flex gap-[0.25rem] justify-center"><button onClick={() => { setEditingEquipeId(eq.id); setEquipeForm({ nom: eq.nom, responsable: eq.responsable || '', nbHeuresJour: eq.nbHeuresJour ?? 8, couleur: eq.couleur }); }} className="px-[0.5rem] py-[0.25rem] bg-blue-500 text-white rounded font-semibold text-[0.75rem]">Modifier</button><button onClick={async () => { await supprimerEquipe(eq.id); chargerEquipes(); }} className="px-[0.5rem] py-[0.25rem] bg-blue-500 text-white rounded font-semibold text-[0.75rem]">Supprimer</button></div></td></tr>))}</tbody></table></div>
  <div className="p-[1rem]"><h3 className="text-[1.125rem] font-bold text-white text-center underline mb-[0.5rem]">{editingEquipeId ? "Modifier l'équipe" : 'Ajouter une équipe'}</h3><div className="flex flex-wrap items-end gap-[0.5rem]"><div className="flex-1 min-w-[7rem]"><label className="block text-[0.75rem] text-white mb-[0.125rem]">Nom</label><input type="text" value={equipeForm.nom} onChange={(e) => setEquipeForm({ ...equipeForm, nom: e.target.value })} className="w-full px-[0.5rem] py-[0.375rem] rounded-lg text-[0.8125rem]"/></div><div className="flex-1 min-w-[7rem]"><label className="block text-[0.75rem] text-white mb-[0.125rem]">Responsable</label><input type="text" value={equipeForm.responsable} onChange={(e) => setEquipeForm({ ...equipeForm, responsable: e.target.value })} className="w-full px-[0.5rem] py-[0.375rem] rounded-lg text-[0.8125rem]"/></div><div className="w-[5rem]"><label className="block text-[0.75rem] text-white mb-[0.125rem]">Nb h/J</label><input type="number" value={equipeForm.nbHeuresJour} onChange={(e) => setEquipeForm({ ...equipeForm, nbHeuresJour: parseInt(e.target.value) || 0 })} className="w-full px-[0.5rem] py-[0.375rem] rounded-lg text-[0.8125rem]"/></div><button onClick={handleSaveEquipe} className="px-[1rem] py-[0.375rem] bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg">{editingEquipeId ? 'Modifier' : 'Ajouter'}</button>{editingEquipeId && <button onClick={() => { setEditingEquipeId(null); setEquipeForm({ nom: '', responsable: '', nbHeuresJour: 8, couleur: 'bg-blue-500' }); }} className="text-white/80 text-[0.8125rem]">Annuler</button>}</div></div>
  <div className="p-[1rem] flex justify-center"><button onClick={() => setShowEquipes(false)} className="px-[2rem] py-[0.625rem] bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg text-[1rem]">Sortir</button></div></div></div>); };

  // ═══════════ CALENDRIER ÉQUIPES ═══════════
  const CalendrierModal = () => { if (!showCalendrier) return null; return (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[1rem]"><div className="bg-slate-500 rounded-2xl shadow-2xl w-full max-w-[52rem] max-h-[90vh] overflow-hidden flex flex-col"><div className="p-[1rem]"><h2 className="text-[1.375rem] font-bold text-white text-center underline">Calendrier des équipes</h2></div><div className="bg-white rounded-lg mx-[1rem] overflow-auto"><table className="w-full text-[0.875rem]"><thead className="bg-slate-200"><tr><th className="px-[0.75rem] py-[0.625rem] text-left font-bold underline">Semaine du</th><th className="px-[0.75rem] py-[0.625rem] text-center font-bold underline">Équipe</th><th className="px-[0.75rem] py-[0.625rem] text-center font-bold underline"># Jours</th><th className="px-[0.75rem] py-[0.625rem] text-center font-bold underline"># Heures</th><th className="px-[0.75rem] py-[0.625rem] w-[11rem]"></th></tr></thead><tbody className="divide-y divide-slate-200">{calendrier.map((c, i) => (<tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}><td className="px-[0.75rem] py-[0.625rem]">{new Date(c.semaineDu).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}</td><td className="px-[0.75rem] py-[0.625rem] text-center font-semibold">{c.equipeNom}</td><td className="px-[0.75rem] py-[0.625rem] text-center font-bold">{c.jours}</td><td className="px-[0.75rem] py-[0.625rem] text-center font-bold">{c.heures}</td><td className="px-[0.75rem] py-[0.625rem] text-center"><div className="flex gap-[0.25rem] justify-center"><button className="px-[0.5rem] py-[0.25rem] bg-blue-500 text-white rounded text-[0.75rem] font-semibold">Modifier</button><button onClick={async () => { await supprimerCalendrier(c.id); chargerCalendrier(); }} className="px-[0.5rem] py-[0.25rem] bg-blue-500 text-white rounded text-[0.75rem] font-semibold">Supprimer</button></div></td></tr>))}</tbody></table></div>
  <div className="p-[1rem] flex flex-wrap items-end gap-[0.5rem]"><div className="min-w-[9rem]"><label className="block text-[0.75rem] text-white mb-[0.125rem]">Semaine du:</label><input type="date" value={calForm.semaineDu} onChange={(e) => setCalForm({ ...calForm, semaineDu: e.target.value })} className="w-full px-[0.5rem] py-[0.375rem] rounded-lg text-[0.875rem]"/></div><div className="min-w-[7rem]"><label className="block text-[0.75rem] text-white mb-[0.125rem]">Équipe</label><select value={calForm.equipeId} onChange={(e) => setCalForm({ ...calForm, equipeId: e.target.value })} className="w-full px-[0.5rem] py-[0.375rem] rounded-lg bg-white text-[0.875rem]"><option value="">Choisir...</option>{equipes.map((eq) => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}</select></div><div className="w-[4rem]"><label className="block text-[0.75rem] text-white mb-[0.125rem]"># Jours</label><input type="number" value={calForm.jours} onChange={(e) => setCalForm({ ...calForm, jours: parseInt(e.target.value) || 0 })} className="w-full px-[0.5rem] py-[0.375rem] rounded-lg text-[0.875rem]"/></div><div className="w-[4rem]"><label className="block text-[0.75rem] text-white mb-[0.125rem]"># Heures</label><input type="number" value={calForm.heures} onChange={(e) => setCalForm({ ...calForm, heures: parseInt(e.target.value) || 0 })} className="w-full px-[0.5rem] py-[0.375rem] rounded-lg text-[0.875rem]"/></div><button onClick={handleAddCal} className="px-[1rem] py-[0.375rem] bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg">Ajouter</button></div>
  <div className="p-[1rem] flex justify-center"><button onClick={() => setShowCalendrier(false)} className="px-[2rem] py-[0.625rem] bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg text-[1rem]">Sortir</button></div></div></div>); };

  // ═══════════ VÉHICULES ═══════════
  const VehiculesModal = () => { if (!showVehicules) return null; return (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[1rem]"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-[44rem] max-h-[90vh] overflow-hidden flex flex-col"><div className="p-[1rem] bg-slate-800 text-white flex items-center justify-between"><h2 className="text-[1rem] font-bold">🚐 Gestion des véhicules</h2><button onClick={() => setShowVehicules(false)} className="p-[0.375rem] hover:bg-slate-700 rounded-lg">✕</button></div><div className="flex-1 overflow-auto p-[0.75rem]"><table className="w-full text-[0.8125rem]"><thead className="bg-slate-100"><tr><th className="px-[0.75rem] py-[0.5rem] text-left">Nom</th><th className="px-[0.75rem] py-[0.5rem] text-center">Type</th><th className="px-[0.75rem] py-[0.5rem] text-center">Plaque</th><th className="px-[0.75rem] py-[0.5rem] w-[9rem]"></th></tr></thead><tbody className="divide-y divide-slate-200">{vehicules.map((v) => (<tr key={v.id} className="hover:bg-slate-50"><td className="px-[0.75rem] py-[0.5rem] font-semibold">{v.nom}</td><td className="px-[0.75rem] py-[0.5rem] text-center">{v.type}</td><td className="px-[0.75rem] py-[0.5rem] text-center font-mono">{v.plaque}</td><td className="px-[0.75rem] py-[0.5rem] text-center"><div className="flex gap-[0.25rem] justify-center"><button onClick={() => { setEditVehiculeId(v.id); setVehiculeForm({ nom: v.nom, type: v.type, plaque: v.plaque }); }} className="px-[0.375rem] py-[0.125rem] bg-blue-500 text-white rounded text-[0.6875rem]">Modifier</button><button onClick={async () => { await supprimerVehicule(v.id); chargerVehicules(); setToast({ message: 'Supprimé', type: 'success' }); }} className="px-[0.375rem] py-[0.125rem] bg-red-500 text-white rounded text-[0.6875rem]">Supprimer</button></div></td></tr>))}</tbody></table>{vehicules.length === 0 && <div className="text-center py-[2rem] text-slate-400">Aucun véhicule</div>}</div>
  <div className="p-[0.75rem] border-t bg-slate-50"><h4 className="font-bold text-[0.875rem] mb-[0.375rem]">{editVehiculeId ? 'Modifier' : 'Ajouter un véhicule'}</h4><div className="flex flex-wrap items-end gap-[0.375rem]"><div className="flex-1 min-w-[6rem]"><label className="block text-[0.625rem] text-slate-500">Nom</label><input type="text" value={vehiculeForm.nom} onChange={(e) => setVehiculeForm({ ...vehiculeForm, nom: e.target.value })} className="w-full px-[0.375rem] py-[0.25rem] border rounded text-[0.8125rem]" placeholder="Camion 1"/></div><div className="flex-1 min-w-[6rem]"><label className="block text-[0.625rem] text-slate-500">Type</label><input type="text" value={vehiculeForm.type} onChange={(e) => setVehiculeForm({ ...vehiculeForm, type: e.target.value })} className="w-full px-[0.375rem] py-[0.25rem] border rounded text-[0.8125rem]" placeholder="Fourgon"/></div><div className="w-[5.5rem]"><label className="block text-[0.625rem] text-slate-500">Plaque</label><input type="text" value={vehiculeForm.plaque} onChange={(e) => setVehiculeForm({ ...vehiculeForm, plaque: e.target.value })} className="w-full px-[0.375rem] py-[0.25rem] border rounded text-[0.8125rem]"/></div><button onClick={handleSaveVehicule} className="px-[0.75rem] py-[0.25rem] bg-emerald-500 text-white rounded text-[0.8125rem]">{editVehiculeId ? 'Modifier' : 'Ajouter'}</button>{editVehiculeId && <button onClick={() => { setEditVehiculeId(null); setVehiculeForm({ nom: '', type: '', plaque: '' }); }} className="text-slate-500 text-[0.75rem]">Annuler</button>}</div></div></div></div>); };

  // ═══════════ CHAUFFEURS ═══════════
  const ChauffeursModal = () => { if (!showChauffeurs) return null; return (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[1rem]"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-[44rem] max-h-[90vh] overflow-hidden flex flex-col"><div className="p-[1rem] bg-slate-800 text-white flex items-center justify-between"><h2 className="text-[1rem] font-bold">🚛 Gestion des chauffeurs</h2><button onClick={() => setShowChauffeurs(false)} className="p-[0.375rem] hover:bg-slate-700 rounded-lg">✕</button></div><div className="flex-1 overflow-auto p-[0.75rem]"><table className="w-full text-[0.8125rem]"><thead className="bg-slate-100"><tr><th className="px-[0.75rem] py-[0.5rem] text-left">Nom</th><th className="px-[0.75rem] py-[0.5rem] text-center">Téléphone</th><th className="px-[0.75rem] py-[0.5rem] text-center">Permis</th><th className="px-[0.75rem] py-[0.5rem] w-[9rem]"></th></tr></thead><tbody className="divide-y divide-slate-200">{chauffeurs.map((c) => (<tr key={c.id} className="hover:bg-slate-50"><td className="px-[0.75rem] py-[0.5rem] font-semibold">{c.nom}</td><td className="px-[0.75rem] py-[0.5rem] text-center">{c.telephone || '—'}</td><td className="px-[0.75rem] py-[0.5rem] text-center">{c.permis || '—'}</td><td className="px-[0.75rem] py-[0.5rem] text-center"><div className="flex gap-[0.25rem] justify-center"><button onClick={() => { setEditChauffeurId(c.id); setChauffeurForm({ nom: c.nom, telephone: c.telephone || '', permis: c.permis || '' }); }} className="px-[0.375rem] py-[0.125rem] bg-blue-500 text-white rounded text-[0.6875rem]">Modifier</button><button onClick={async () => { await supprimerChauffeur(c.id); chargerChauffeurs(); setToast({ message: 'Supprimé', type: 'success' }); }} className="px-[0.375rem] py-[0.125rem] bg-red-500 text-white rounded text-[0.6875rem]">Supprimer</button></div></td></tr>))}</tbody></table>{chauffeurs.length === 0 && <div className="text-center py-[2rem] text-slate-400">Aucun chauffeur</div>}</div>
  <div className="p-[0.75rem] border-t bg-slate-50"><h4 className="font-bold text-[0.875rem] mb-[0.375rem]">{editChauffeurId ? 'Modifier' : 'Ajouter un chauffeur'}</h4><div className="flex flex-wrap items-end gap-[0.375rem]"><div className="flex-1 min-w-[7rem]"><label className="block text-[0.625rem] text-slate-500">Nom</label><input type="text" value={chauffeurForm.nom} onChange={(e) => setChauffeurForm({ ...chauffeurForm, nom: e.target.value })} className="w-full px-[0.375rem] py-[0.25rem] border rounded text-[0.8125rem]"/></div><div className="w-[7rem]"><label className="block text-[0.625rem] text-slate-500">Téléphone</label><input type="tel" value={chauffeurForm.telephone} onChange={(e) => setChauffeurForm({ ...chauffeurForm, telephone: e.target.value })} className="w-full px-[0.375rem] py-[0.25rem] border rounded text-[0.8125rem]"/></div><div className="w-[5rem]"><label className="block text-[0.625rem] text-slate-500">Permis</label><input type="text" value={chauffeurForm.permis} onChange={(e) => setChauffeurForm({ ...chauffeurForm, permis: e.target.value })} className="w-full px-[0.375rem] py-[0.25rem] border rounded text-[0.8125rem]"/></div><button onClick={handleSaveChauffeur} className="px-[0.75rem] py-[0.25rem] bg-emerald-500 text-white rounded text-[0.8125rem]">{editChauffeurId ? 'Modifier' : 'Ajouter'}</button>{editChauffeurId && <button onClick={() => { setEditChauffeurId(null); setChauffeurForm({ nom: '', telephone: '', permis: '' }); }} className="text-slate-500 text-[0.75rem]">Annuler</button>}</div></div></div></div>); };

  // ═══════════ EDIT ═══════════
  const EditModal = () => { if (!showEdit || !selectedPlanif) return null; return (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-[1rem]"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-[28rem]"><div className="p-[1rem] border-b"><h2 className="text-[1rem] font-bold">Modifier {selectedPlanif.commandeNumero}</h2></div><div className="p-[1rem] space-y-[0.75rem]"><div><label className="block text-[0.8125rem] font-semibold mb-[0.25rem]">Date</label><input type="date" value={selectedPlanif.datePlanifiee.split('T')[0]} onChange={(e) => setSelectedPlanif({ ...selectedPlanif, datePlanifiee: e.target.value })} className="w-full px-[0.75rem] py-[0.5rem] border rounded-xl text-[0.8125rem]"/></div>{needsEquipe(selectedPlanif.service) && <div><label className="block text-[0.8125rem] font-semibold mb-[0.25rem]">Équipe</label><select value={selectedPlanif.equipeId || ''} onChange={(e) => setSelectedPlanif({ ...selectedPlanif, equipeId: e.target.value })} className="w-full px-[0.75rem] py-[0.5rem] border rounded-xl bg-white text-[0.8125rem]"><option value="">—</option>{equipes.map((eq) => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}</select></div>}</div><div className="flex items-center justify-between p-[1rem] border-t bg-slate-50"><button onClick={() => { setShowEdit(false); setSelectedPlanif(null); }} className="text-slate-600 text-[0.8125rem]">Annuler</button><div className="flex gap-[0.25rem]"><button onClick={() => { handleCompleter(selectedPlanif.id); setShowEdit(false); }} className="px-[0.75rem] py-[0.375rem] bg-emerald-500 text-white rounded-lg text-[0.8125rem]">Terminer</button><button onClick={async () => { try { await modifier(selectedPlanif.id, { datePlanifiee: selectedPlanif.datePlanifiee.split('T')[0], equipeId: selectedPlanif.equipeId || null }); setToast({ message: 'Modifié', type: 'success' }); setShowEdit(false); setSelectedPlanif(null); recharger(); } catch (e: any) { setToast({ message: e.message, type: 'error' }); } }} className="px-[0.75rem] py-[0.375rem] bg-blue-500 text-white rounded-lg text-[0.8125rem]">Enregistrer</button></div></div></div></div>); };

  // ═══════════ RENDU ═══════════
  return (
    <div className="space-y-[1rem]">
      <DateDetailModal/><NonPlanifieesModal/><EquipesModal/><CalendrierModal/><PlanifierModal/><EditModal/><VehiculesModal/><ChauffeursModal/>
      {toast && <div className={`fixed bottom-[1rem] right-[1rem] z-[70] px-[1rem] py-[0.75rem] rounded-lg shadow-lg text-white text-[0.875rem] font-medium ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{toast.type === 'success' ? '✓' : '✕'} {toast.message}</div>}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-[0.75rem]">
        <div><h1 className="text-[1.5rem] font-bold text-slate-800">Planification</h1><p className="text-slate-500 text-[0.8125rem]">Installations, livraisons, cueillettes, transports et mesures</p></div>
        <div className="flex items-center gap-[0.375rem] flex-wrap">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-[0.75rem] py-[0.375rem] rounded-xl text-[0.8125rem]"><p className="text-[0.625rem] opacity-80">Cette semaine</p><span><strong>{stats?.nbPlanifiees || 0}</strong> planif. <strong>{stats?.heuresTotal || 0}</strong>h</span></div>
          <button onClick={() => setShowEquipes(true)} className="px-[0.625rem] py-[0.375rem] border border-slate-300 rounded-xl hover:bg-slate-50 text-[0.8125rem]">👥 Équipes</button>
          <button onClick={() => setShowVehicules(true)} className="px-[0.625rem] py-[0.375rem] border border-slate-300 rounded-xl hover:bg-slate-50 text-[0.8125rem]">🚐 Véhicules</button>
          <button onClick={() => setShowChauffeurs(true)} className="px-[0.625rem] py-[0.375rem] border border-slate-300 rounded-xl hover:bg-slate-50 text-[0.8125rem]">🚛 Chauffeurs</button>
          <button type="button" onClick={() => ouvrirCarte()} className="px-[0.625rem] py-[0.375rem] border border-slate-300 rounded-xl hover:bg-slate-50 text-[0.8125rem]">🗺️ Carte</button>
          <button onClick={() => setShowNonPlanifiees(true)} className="px-[0.75rem] py-[0.5rem] bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-semibold rounded-xl shadow-lg text-[0.875rem]">+ Non planifiées ({stats?.nbNonPlanifiees || nonPlanifiees.length})</button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-slate-200 p-[0.625rem] flex flex-wrap items-center gap-[0.625rem]">
        <div className="flex items-center gap-[0.25rem]"><span className="text-[0.75rem] text-slate-600">Type:</span><select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} className="px-[0.375rem] py-[0.25rem] border rounded text-[0.8125rem]"><option value="">Tous</option><option value="installation">Installation</option><option value="livraison">Livraison</option><option value="cueillette">Cueillette</option><option value="transport">Transport</option><option value="mesure">Mesure</option></select></div>
        <div className="flex items-center gap-[0.25rem]"><span className="text-[0.75rem] text-slate-600">Équipe:</span><select value={filtreEquipe} onChange={(e) => setFiltreEquipe(e.target.value)} className="px-[0.375rem] py-[0.25rem] border rounded text-[0.8125rem]"><option value="">Toutes</option>{equipes.map((eq) => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}</select></div>
        <span className="ml-auto px-[0.5rem] py-[0.25rem] bg-green-500 text-white text-[0.75rem] font-semibold rounded">{stats?.nbNonPlanifiees || nonPlanifiees.length} prêtes</span>
      </div>

      {/* Calendrier */}
      {loading && <div className="text-center py-[1.5rem] text-slate-500 text-[0.875rem]">Chargement...</div>}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between p-[0.75rem] bg-slate-800 text-white">
          <button onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() - 1, 1))} className="p-[0.5rem] hover:bg-slate-700 rounded-full text-[1.25rem]">◀</button>
          <h2 className="text-[1.25rem] font-bold">{MONTH_NAMES[mois.getMonth()]} {mois.getFullYear()}</h2>
          <button onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() + 1, 1))} className="p-[0.5rem] hover:bg-slate-700 rounded-full text-[1.25rem]">▶</button>
        </div>
        <div className="grid grid-cols-7 bg-slate-700 text-white">{DAY_NAMES_SHORT.map((d) => <div key={d} className="p-[0.5rem] text-center border-r border-slate-600 last:border-r-0"><p className="font-semibold uppercase text-[0.6875rem]">{d}</p></div>)}</div>
        <div className="grid grid-cols-7">
          {days.map((di, idx) => {
            const totals = getTotals(di.date);
            const planifs = getPlanifsForDate(di.date);
            const isWE = di.date.getDay() === 0 || di.date.getDay() === 6;
            const isToday = formatDateKey(di.date) === formatDateKey(new Date());
            return (
              <div key={idx} onClick={() => totals.count > 0 && setSelectedDate(di.date)}
                className={`min-h-[8rem] border-r border-b border-slate-200 p-[0.25rem] transition-colors ${!di.currentMonth ? 'bg-slate-100 text-slate-400' : isWE ? 'bg-slate-50' : 'bg-white'} ${totals.count > 0 ? 'cursor-pointer hover:bg-blue-50' : ''} ${isToday && di.currentMonth ? 'ring-2 ring-inset ring-blue-500' : ''}`}>
                <div className="flex items-start justify-between mb-[0.125rem]">
                  <span className={`text-[0.875rem] font-bold ${!di.currentMonth ? 'text-slate-300' : isToday ? 'bg-blue-500 text-white w-[1.5rem] h-[1.5rem] rounded-full flex items-center justify-center text-[0.6875rem]' : ''}`}>{di.day}</span>
                  {totals.count > 0 && di.currentMonth && (
                    <div className="flex gap-[0.125rem]">
                      <span className="bg-slate-800 text-white text-[0.5625rem] font-bold px-[0.1875rem] rounded">{totals.count}</span>
                      <span className="bg-red-500 text-white text-[0.5625rem] font-bold px-[0.1875rem] rounded">{totals.heures}h</span>
                    </div>
                  )}
                </div>
                {di.currentMonth && planifs.slice(0, 3).map((p) => (
                  <div key={p.id} className={`mb-[0.125rem] p-[0.1875rem] rounded text-[0.5625rem] ${getServiceBg(p.service)} ${SERVICE_TEXT[p.service] || 'text-white'} relative`}>
                    {depasseJournee(p.tempsEstimeInstallation) && <span className="absolute -top-[0.125rem] -right-[0.125rem] bg-amber-400 text-amber-900 text-[0.4375rem] w-[0.75rem] h-[0.75rem] rounded-full flex items-center justify-center font-bold">!</span>}
                    <p className="font-bold truncate">{p.commandeNumero}</p>
                    <div className="flex justify-between text-[0.4375rem] opacity-80">
                      <span>{p.equipeNom || p.chauffeurNom || getServiceLabel(p.service)}</span>
                      <span>{p.tempsEstimeInstallation}h</span>
                    </div>
                  </div>
                ))}
                {planifs.length > 3 && di.currentMonth && <p className="text-[0.5625rem] text-blue-600 font-medium text-center">+{planifs.length - 3}</p>}
              </div>
            );
          })}
        </div>
      </div>

      {planifications.length === 0 && !loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-[1rem] text-center">
          <p className="text-[0.875rem] text-amber-800 font-medium">Aucune commande planifiée pour {MONTH_NAMES[mois.getMonth()]} {mois.getFullYear()}</p>
          <p className="text-[0.8125rem] text-amber-600 mt-[0.25rem]">Cliquez sur <strong>« + Non planifiées »</strong> pour planifier vos commandes.</p>
        </div>
      )}
    </div>
  );
}