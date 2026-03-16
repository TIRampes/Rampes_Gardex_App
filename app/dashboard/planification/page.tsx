'use client';

import { useState, useEffect, useMemo } from 'react';
import { usePlanification, useNonPlanifiees, useEquipes } from '@/app/hooks/usePlanification';
import type { PlanificationView, CommandeNonPlanifiee } from '@/app/api/planification/schema';
import {
  MONTH_NAMES, DAY_NAMES_SHORT, TYPE_COMMANDE_COULEUR, SERVICE_COULEUR,
  formatDateKey, getDaysInMonth, calculerJoursNecessaires, depasseJournee,
  getProdStatusColor, getAchatStatusColor, getSymbol,
  getWeekNumber,
} from '@/app/api/planification/schema';

export default function PlanificationPage() {
  const { planifications, stats, charger, creer, modifier } = usePlanification();
  const { commandes: nonPlanifiees, charger: chargerNP } = useNonPlanifiees();
  const { equipes, charger: chargerEquipes, creer: creerEquipe, supprimer: supprimerEquipe } = useEquipes();

  const [mois, setMois] = useState(new Date());
  const [filtreType, setFiltreType] = useState('tous');
  const [filtreCommande, setFiltreCommande] = useState('tous');
  const [filtreEquipe, setFiltreEquipe] = useState('toutes');

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showNonPlanifiees, setShowNonPlanifiees] = useState(false);
  const [showEquipes, setShowEquipes] = useState(false);
  const [showPlanifier, setShowPlanifier] = useState(false);
  const [cmdAPlanifier, setCmdAPlanifier] = useState<CommandeNonPlanifiee | null>(null);
  const [selectedPlanif, setSelectedPlanif] = useState<PlanificationView | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddEquipe, setShowAddEquipe] = useState(false);
  const [equipeForm, setEquipeForm] = useState({ nom: '', couleur: 'bg-blue-500' });
  const [planifForm, setPlanifForm] = useState({
    date: '', equipeId: '', heureDebut: '', heureFin: '',
    clientPresent: false, representantPresent: false, envoyerAvis: false, notes: ''
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const moisKey = `${mois.getFullYear()}-${String(mois.getMonth() + 1).padStart(2, '0')}`;
  useEffect(() => {
    charger({
      mois: moisKey,
      type: filtreType !== 'tous' ? filtreType : '',
      typeCommande: filtreCommande,
      equipeId: filtreEquipe !== 'toutes' ? filtreEquipe : ''
    });
  }, [charger, moisKey, filtreType, filtreCommande, filtreEquipe]);

  useEffect(() => {
    chargerNP();
    chargerEquipes();
  }, [chargerNP, chargerEquipes]);

  const days = useMemo(() => getDaysInMonth(mois), [mois]);

  // Helper pour créer une date locale à partir d'une chaîne YYYY-MM-DD
  const toLocalDate = (dateStr: string) => new Date(dateStr + 'T12:00:00');

  const getPlanifsForDate = (date: Date): PlanificationView[] => {
    const key = formatDateKey(date);
    return planifications.filter((p) => {
      const pDate = toLocalDate(p.datePlanifiee.split('T')[0]);
      const pKey = formatDateKey(pDate);
      if (pKey === key) return true;
      const jours = calculerJoursNecessaires(p.tempsEstimeInstallation);
      if (jours > 1) {
        const start = pDate;
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

  const handlePlanifier = async () => {
    if (!cmdAPlanifier || !planifForm.date) return;
    // Pour les non-installations, on n'a pas besoin d'équipe
    if (cmdAPlanifier.service === 'INSTALLATION' && !planifForm.equipeId) return;
    try {
      await creer({
        commandeId: cmdAPlanifier.id,
        equipeId: planifForm.equipeId || null, // peut être null pour non-installation
        datePlanifiee: planifForm.date,
        heureDebut: planifForm.heureDebut || null,
        heureFin: planifForm.heureFin || null,
        clientPresent: planifForm.clientPresent,
        representantPresent: planifForm.representantPresent,
        envoyerAvis: planifForm.envoyerAvis,
        notes: planifForm.notes || null,
      });
      setToast({ message: 'Planification réussie', type: 'success' });
      setShowPlanifier(false);
      setCmdAPlanifier(null);
      setPlanifForm({ date: '', equipeId: '', heureDebut: '', heureFin: '', clientPresent: false, representantPresent: false, envoyerAvis: false, notes: '' });
      charger({ mois: moisKey });
      chargerNP();
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' });
    }
  };

  const handleEditSave = async () => {
    if (!selectedPlanif) return;
    try {
      await modifier(selectedPlanif.id, {
        datePlanifiee: selectedPlanif.datePlanifiee.split('T')[0],
        equipeId: selectedPlanif.equipeId,
      });
      setToast({ message: 'Planification modifiée', type: 'success' });
      setShowEdit(false);
      setSelectedPlanif(null);
      charger({ mois: moisKey });
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' });
    }
  };

  const handleCompleter = async (id: string) => {
    try {
      await modifier(id, { statut: 'COMPLETEE' });
      setToast({ message: 'Terminée', type: 'success' });
      setSelectedDate(null);
      charger({ mois: moisKey });
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' });
    }
  };

  const handleAddEquipe = async () => {
    if (!equipeForm.nom) return;
    try {
      await creerEquipe(equipeForm);
      setToast({ message: 'Équipe ajoutée', type: 'success' });
      setEquipeForm({ nom: '', couleur: 'bg-blue-500' });
      setShowAddEquipe(false);
      chargerEquipes();
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' });
    }
  };

  const handleDeleteEquipe = async (id: string) => {
    try {
      await supprimerEquipe(id);
      setToast({ message: 'Équipe supprimée', type: 'success' });
      chargerEquipes();
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' });
    }
  };

  const getMapUrl = () => {
    const addresses = planifications.filter((p) => p.adresse).map((p) => encodeURIComponent(p.adresse));
    if (addresses.length === 0) return '#';
    if (addresses.length === 1) return `https://www.google.com/maps/search/?api=1&query=${addresses[0]}`;
    return `https://www.google.com/maps/dir/${addresses.join('/')}`;
  };

  const couleurs = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-red-500', 'bg-cyan-500'];

  // =================== MODALS ===================

  const DateDetailModal = () => {
    if (!selectedDate) return null;
    const planifs = getPlanifsForDate(selectedDate);
    const totals = getTotals(selectedDate);
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-700 text-white flex items-center justify-between">
            <h2 className="text-xl font-bold">
              Projets du {selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </h2>
            <button onClick={() => setSelectedDate(null)} className="p-2 hover:bg-slate-600 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {planifs.length === 0 ? (
              <div className="text-center py-12 text-slate-500">Aucune intervention planifiée</div>
            ) : (
              planifs.map((p) => (
                <div key={p.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="flex items-start justify-between p-4 border-b border-slate-100">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="font-mono font-bold text-xl">{p.commandeNumero}</span>
                        {p.reprise && <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded">Reprise</span>}
                        <span className={`px-3 py-1 text-white text-xs font-bold rounded ${SERVICE_COULEUR[p.service] || 'bg-slate-600'}`}>{p.service}</span>
                        <span className={`px-2 py-1 text-xs font-bold rounded ${TYPE_COMMANDE_COULEUR[p.typeCommande] || 'bg-slate-100 text-slate-700'}`}>{p.typeCommande}</span>
                      </div>
                      <p className="font-semibold text-lg">{p.clientNom}</p>
                      {p.reference && <p className="text-sm text-slate-500">{p.reference}</p>}
                      <p className="text-sm text-slate-600 mt-1">📍 {p.adresse}</p>
                      {p.commentaire && (
                        <div className="mt-3 p-3 bg-slate-50 rounded-lg border text-sm">
                          <p className="whitespace-pre-line">{p.commentaire}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button onClick={() => { setSelectedPlanif({ ...p }); setShowEdit(true); }} className="p-2 hover:bg-slate-100 rounded-lg">✏️</button>
                    </div>
                  </div>
                  {/* Statuts production + achats (inchangé) */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      {[{ l: 'Mesure', v: p.mesure }, { l: 'Plan', v: p.plan }, { l: 'Envoyé prod.', v: p.envoyeProduction }, { l: 'Prod. terminée', v: p.productionTerminee }].map((s) => (
                        <div key={s.l} className="flex items-center gap-2 text-sm">
                          <span className="text-slate-500 w-32">{s.l}:</span>
                          <span className={`px-2 py-0.5 rounded font-semibold text-xs ${getProdStatusColor(s.v)}`}>{getSymbol(s.v)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      {[{ l: 'Verre', v: p.achatVerres }, { l: 'Limon', v: p.achatLimons }, { l: 'Peinture', v: p.achatPeinture }, { l: 'Colonne', v: p.achatColonnes }, { l: 'Fibre', v: p.achatFibre }, { l: 'Attaches', v: p.achatAttaches }].map((s) => (
                        <div key={s.l} className="flex items-center gap-2 text-sm">
                          <span className="text-slate-500 w-20">{s.l}:</span>
                          <span className={`px-2 py-0.5 rounded font-semibold text-xs ${getAchatStatusColor(s.v)}`}>{getSymbol(s.v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 border-t flex items-center gap-4 flex-wrap">
                    <div className={`px-3 py-1.5 rounded-lg text-white text-sm font-semibold ${p.equipeCouleur}`}>{p.equipeNom}</div>
                    <span className="text-sm text-slate-500">Pieds: <strong>{p.piedsLineaires}</strong></span>
                    <span className="text-sm text-slate-500">Temps: <strong>{p.tempsEstimeInstallation}h</strong></span>
                    <span className="text-sm text-slate-500">Couleur: <strong>{p.couleur || '—'}</strong></span>
                    {depasseJournee(p.tempsEstimeInstallation) && <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs">⚠️ Dépasse 8h</span>}
                    <button onClick={() => handleCompleter(p.id)} className="ml-auto px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-sm">✓ Terminer</button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="border-t-4 border-blue-500 p-4 bg-white flex items-center justify-between flex-wrap gap-3">
            <button onClick={() => setSelectedDate(null)} className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl">Sortir</button>
            <div className="flex items-center gap-4">
              <div className="border-2 border-blue-500 px-4 py-2 rounded-lg">
                <p className="text-xs text-slate-600">Temps:</p>
                <p className="text-xl font-bold">{totals.heures}h</p>
              </div>
              <div className="border-2 border-blue-500 px-4 py-2 rounded-lg">
                <p className="text-xs text-slate-600">Pieds:</p>
                <p className="text-xl font-bold">{totals.pieds}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const PlanifierModal = () => {
    if (!showPlanifier || !cmdAPlanifier) return null;
    const jours = calculerJoursNecessaires(cmdAPlanifier.tempsEstimeInstallation);
    const isInstallation = cmdAPlanifier.service === 'INSTALLATION';
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="p-4 border-b bg-gradient-to-r from-amber-400 to-yellow-500">
            <h2 className="text-lg font-bold text-slate-900">Planifier {cmdAPlanifier.service}</h2>
            <p className="text-sm text-slate-700">{cmdAPlanifier.numero} — {cmdAPlanifier.clientNom}</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 p-4 rounded-xl">
              <p className="text-sm text-blue-600">Temps estimé: <strong>{cmdAPlanifier.tempsEstimeInstallation}h</strong></p>
              {jours > 1 && <p className="text-sm text-amber-600 mt-1">⚠️ Nécessite {jours} jours de travail</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Date de début</label>
              <input
                type="date"
                value={planifForm.date}
                onChange={(e) => setPlanifForm({ ...planifForm, date: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            {isInstallation && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Équipe</label>
                <select
                  value={planifForm.equipeId}
                  onChange={(e) => setPlanifForm({ ...planifForm, equipeId: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm"
                >
                  <option value="">Choisir une équipe</option>
                  {equipes.map((eq) => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Heure début</label>
                <input
                  type="time"
                  value={planifForm.heureDebut}
                  onChange={(e) => setPlanifForm({ ...planifForm, heureDebut: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Heure fin</label>
                <input
                  type="time"
                  value={planifForm.heureFin}
                  onChange={(e) => setPlanifForm({ ...planifForm, heureFin: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="space-y-3">
              {[
                { k: 'clientPresent', l: 'Le client veut être présent' },
                { k: 'representantPresent', l: 'Le représentant veut être présent' },
                { k: 'envoyerAvis', l: "Envoyer un avis d'installation" }
              ].map((o) => (
                <label key={o.k} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(planifForm as any)[o.k]}
                    onChange={(e) => setPlanifForm({ ...planifForm, [o.k]: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm">{o.l}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between p-4 border-t bg-slate-50">
            <button
              onClick={() => { setShowPlanifier(false); setCmdAPlanifier(null); }}
              className="px-4 py-2 text-slate-600 text-sm"
            >
              Annuler
            </button>
            <button
              onClick={handlePlanifier}
              disabled={!planifForm.date || (isInstallation && !planifForm.equipeId)}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-medium rounded-lg text-sm"
            >
              Planifier
            </button>
          </div>
        </div>
      </div>
    );
  };

  const NonPlanifieesModal = () => {
    const [searchTerm, setSearchTerm] = useState('');
    if (!showNonPlanifiees) return null;

    // Filtrer par mois
    const filteredByMonth = nonPlanifiees.filter(cmd => {
      if (!cmd.datePrevue) return true; // on garde ceux sans date
      const cmdDate = new Date(cmd.datePrevue);
      return cmdDate.getFullYear() === mois.getFullYear() && cmdDate.getMonth() === mois.getMonth();
    });

    const filtered = filteredByMonth.filter(cmd =>
      cmd.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.clientNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cmd.clientVille && cmd.clientVille.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const groupedByWeek: { [key: string]: CommandeNonPlanifiee[] } = {};
    filtered.forEach(cmd => {
      let weekKey = 'Sans date';
      if (cmd.datePrevue) {
        const { year, week } = getWeekNumber(new Date(cmd.datePrevue));
        weekKey = `${year}-S${week.toString().padStart(2, '0')}`;
      }
      if (!groupedByWeek[weekKey]) groupedByWeek[weekKey] = [];
      groupedByWeek[weekKey].push(cmd);
    });

    const sortedWeeks = Object.keys(groupedByWeek).sort((a, b) => {
      if (a === 'Sans date') return 1;
      if (b === 'Sans date') return -1;
      return b.localeCompare(a);
    });

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 bg-amber-500 text-white">
            <div>
              <h2 className="text-lg font-bold">Commandes non planifiées</h2>
              <p className="text-sm opacity-90">{filtered.length} commande(s) en attente pour {MONTH_NAMES[mois.getMonth()]}</p>
            </div>
            <div className="flex gap-2">
              <a href={getMapUrl()} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-1 text-sm">🗺️ Carte</a>
              <button onClick={() => setShowNonPlanifiees(false)} className="p-2 hover:bg-white/20 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <div className="p-4 border-b">
            <input
              type="text"
              placeholder="Rechercher par n° commande, client ou ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-6">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-500">Aucune commande trouvée</div>
            ) : (
              sortedWeeks.map(weekKey => (
                <div key={weekKey}>
                  <h3 className="text-base font-bold bg-slate-100 p-2 rounded-t-lg sticky top-0">
                    {weekKey === 'Sans date' ? 'Sans date prévue' : `Semaine ${weekKey.split('-S')[1]} (${weekKey.split('-')[0]})`}
                  </h3>
                  <div className="space-y-4 mt-2">
                    {groupedByWeek[weekKey].map((cmd) => (
                      <div key={cmd.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex-1 min-w-[15rem]">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <span className="font-mono font-bold text-lg">{cmd.numero}</span>
                              <span className={`px-2 py-1 text-xs font-bold rounded ${TYPE_COMMANDE_COULEUR[cmd.typeCommande] || 'bg-slate-100 text-slate-700'}`}>{cmd.typeCommande}</span>
                              <span className={`px-2 py-1 text-white text-xs font-bold rounded ${SERVICE_COULEUR[cmd.service] || 'bg-slate-600'}`}>{cmd.service}</span>
                            </div>
                            <p className="font-semibold">{cmd.clientNom}</p>
                            <p className="text-sm text-slate-500">📍 {cmd.adresse}</p>
                            <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
                              <span className="bg-blue-100 px-3 py-1 rounded text-blue-800">Temps: <strong>{cmd.tempsEstimeInstallation || 0}h</strong></span>
                              <span className="bg-emerald-100 px-3 py-1 rounded text-emerald-800">Pieds: <strong>{cmd.piedsLineaires || 0}</strong></span>
                              {calculerJoursNecessaires(cmd.tempsEstimeInstallation) > 1 && (
                                <span className="bg-amber-100 px-3 py-1 rounded text-amber-800">⚠️ {calculerJoursNecessaires(cmd.tempsEstimeInstallation)} jours</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => { setCmdAPlanifier(cmd); setShowNonPlanifiees(false); setShowPlanifier(true); }}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg text-sm"
                          >
                            Planifier
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t bg-slate-50">
            <button onClick={() => setShowNonPlanifiees(false)} className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl text-sm">Fermer</button>
          </div>
        </div>
      </div>
    );
  };

  const EquipesModal = () => {
    if (!showEquipes) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-800 text-white flex items-center justify-between">
            <h2 className="text-lg font-bold">Gestion des équipes</h2>
            <button onClick={() => setShowEquipes(false)} className="p-2 hover:bg-slate-700 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {equipes.map((eq) => (
              <div key={eq.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className={`p-4 ${eq.couleur} text-white flex items-center justify-between`}>
                  <div>
                    <h3 className="font-bold text-lg">{eq.nom}</h3>
                    <p className="text-sm opacity-90">{eq.nbPlanifications} planif. • {eq.heuresTotal}h</p>
                  </div>
                  <button onClick={() => handleDeleteEquipe(eq.id)} className="p-2 hover:bg-white/20 rounded-lg">✕</button>
                </div>
                {eq.membres.length > 0 && (
                  <div className="p-3 bg-slate-50 flex flex-wrap gap-1.5">
                    {eq.membres.map((m) => (
                      <span key={m.id} className="px-2 py-1 bg-white border text-slate-700 text-sm rounded">{m.prenom} {m.nom}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {showAddEquipe && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h4 className="font-bold mb-3 text-base">Nouvelle équipe</h4>
                <input
                  type="text"
                  value={equipeForm.nom}
                  onChange={(e) => setEquipeForm({ ...equipeForm, nom: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm mb-3"
                  placeholder="Nom de l'équipe"
                />
                <div className="flex gap-1.5 mb-3">
                  {couleurs.map((c) => (
                    <button
                      key={c}
                      onClick={() => setEquipeForm({ ...equipeForm, couleur: c })}
                      className={`w-8 h-8 rounded-full ${c} ${equipeForm.couleur === c ? 'ring-2 ring-offset-2 ring-slate-800' : ''}`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddEquipe(false)} className="px-4 py-2 text-slate-600 text-sm">Annuler</button>
                  <button onClick={handleAddEquipe} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm">Ajouter</button>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t bg-slate-50 flex justify-between">
            <button onClick={() => setShowAddEquipe(true)} className="px-4 py-2 bg-amber-500 text-white rounded-lg flex items-center gap-1 text-sm">+ Nouvelle équipe</button>
            <button onClick={() => setShowEquipes(false)} className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-xl text-sm">Fermer</button>
          </div>
        </div>
      </div>
    );
  };

  const EditModal = () => {
    if (!showEdit || !selectedPlanif) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="p-4 border-b"><h2 className="text-lg font-bold">Modifier {selectedPlanif.commandeNumero}</h2></div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Date prévue</label>
              <input
                type="date"
                value={selectedPlanif.datePlanifiee.split('T')[0]}
                onChange={(e) => setSelectedPlanif({ ...selectedPlanif, datePlanifiee: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Équipe</label>
              <select
                value={selectedPlanif.equipeId}
                onChange={(e) => setSelectedPlanif({ ...selectedPlanif, equipeId: e.target.value })}
                className="w-full px-4 py-3 border rounded-xl bg-white text-sm"
              >
                <option value="">Sélectionner</option>
                {equipes.map((eq) => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 border-t bg-slate-50">
            <button onClick={() => { setShowEdit(false); setSelectedPlanif(null); }} className="px-4 py-2 text-slate-600 text-sm">Annuler</button>
            <div className="flex gap-2">
              <button onClick={() => { handleCompleter(selectedPlanif.id); setShowEdit(false); }} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm">Terminer</button>
              <button onClick={handleEditSave} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">Enregistrer</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =================== RENDU PRINCIPAL ===================

  return (
    <div className="space-y-6">
      <DateDetailModal />
      <NonPlanifieesModal />
      <EquipesModal />
      <PlanifierModal />
      <EditModal />
      {toast && (
        <div className={`fixed bottom-4 right-4 z-[70] px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Planification</h1>
          <p className="text-slate-500 mt-1 text-sm">Planifiez les interventions</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl">
            <p className="text-xs opacity-80">Cette semaine</p>
            <div className="flex items-center gap-4 text-sm">
              <span><strong>{stats?.nbPlanifiees || 0}</strong> planif.</span>
              <span><strong>{stats?.heuresTotal || 0}</strong>h</span>
              <span><strong>{stats?.piedsTotal || 0}</strong> pi</span>
            </div>
          </div>
          <button onClick={() => setShowEquipes(true)} className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center gap-1 text-sm">👥 Équipes</button>
          <a href={getMapUrl()} target="_blank" rel="noopener noreferrer" className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center gap-1 text-sm">🗺️ Carte</a>
          <button onClick={() => setShowNonPlanifiees(true)} className="px-4 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-semibold rounded-xl shadow-lg flex items-center gap-1 text-sm">
            + Non planifiées ({stats?.nbNonPlanifiees || 0})
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Service:</span>
          <select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="tous">Tous</option>
            <option value="installation">Installation</option>
            <option value="livraison">Livraison</option>
            <option value="cueillette">Cueillette</option>
            <option value="transport">Transport</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Type commande:</span>
          <select value={filtreCommande} onChange={(e) => setFiltreCommande(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="tous">Tous</option>
            <option value="standard">Standard</option>
            <option value="commercial">Commercial</option>
            <option value="multiplan">Multiplan</option>
            <option value="multi_phase">Multiphase</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">Équipe:</span>
          <select value={filtreEquipe} onChange={(e) => setFiltreEquipe(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="toutes">Toutes</option>
            {equipes.map((eq) => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}
          </select>
        </div>
        <span className="ml-auto px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded">{stats?.nbNonPlanifiees || 0} prêtes à planifier</span>
      </div>

      {/* Calendrier */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-slate-800 text-white">
          <button onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() - 1, 1))} className="p-2 hover:bg-slate-700 rounded-full text-2xl">◀</button>
          <h2 className="text-2xl font-bold">{MONTH_NAMES[mois.getMonth()]} {mois.getFullYear()}</h2>
          <button onClick={() => setMois(new Date(mois.getFullYear(), mois.getMonth() + 1, 1))} className="p-2 hover:bg-slate-700 rounded-full text-2xl">▶</button>
        </div>
        <div className="grid grid-cols-7 bg-slate-700 text-white">
          {DAY_NAMES_SHORT.map((d) => (
            <div key={d} className="p-3 text-center border-r border-slate-600 last:border-r-0">
              <p className="font-semibold uppercase text-sm">{d}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((dayInfo, idx) => {
            const totals = getTotals(dayInfo.date);
            const planifs = getPlanifsForDate(dayInfo.date);
            const isWeekend = dayInfo.date.getDay() === 0 || dayInfo.date.getDay() === 6;
            const isToday = formatDateKey(dayInfo.date) === formatDateKey(new Date());
            return (
              <div
                key={idx}
                onClick={() => totals.count > 0 && setSelectedDate(dayInfo.date)}
                className={`min-h-[140px] border-r border-b border-slate-200 p-2 transition-colors
                  ${!dayInfo.currentMonth ? 'bg-slate-100 text-slate-400' : isWeekend ? 'bg-slate-50' : 'bg-white'}
                  ${totals.count > 0 ? 'cursor-pointer hover:bg-blue-50' : ''}
                  ${isToday && dayInfo.currentMonth ? 'ring-2 ring-inset ring-blue-500' : ''}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className={`text-lg font-bold ${!dayInfo.currentMonth ? 'text-slate-300' : isToday ? 'bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm' : ''}`}>
                    {dayInfo.day}
                  </span>
                  {totals.count > 0 && dayInfo.currentMonth && (
                    <div className="flex items-center gap-1">
                      {depasseJournee(totals.heures) && <span className="text-amber-500 text-xs">ⓘ</span>}
                      <span className="bg-slate-800 text-white text-xs font-bold px-1.5 py-0.5 rounded">{totals.count}</span>
                      <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">{totals.heures}</span>
                    </div>
                  )}
                </div>
                {dayInfo.currentMonth && planifs.slice(0, 2).map((p) => (
                  <div
                    key={p.id}
                    className={`mb-1 p-1.5 rounded text-xs text-white relative ${SERVICE_COULEUR[p.service] || p.equipeCouleur}`}
                  >
                    {depasseJournee(p.tempsEstimeInstallation) && (
                      <span className="absolute -top-1 -right-1 bg-amber-400 text-amber-900 text-[0.5rem] w-4 h-4 rounded-full flex items-center justify-center font-bold">!</span>
                    )}
                    <p className="font-bold truncate">{p.commandeNumero}</p>
                    <p className="truncate opacity-90 text-[0.5rem]">{p.clientNom}</p>
                    <div className="flex items-center justify-between mt-0.5 text-[0.5rem] opacity-75">
                      <span>{p.equipeNom?.split(' ')[1] || p.equipeNom}</span>
                      <span>{p.tempsEstimeInstallation}h • {p.piedsLineaires}pi</span>
                    </div>
                  </div>
                ))}
                {planifs.length > 2 && dayInfo.currentMonth && (
                  <p className="text-xs text-blue-600 font-medium text-center">+{planifs.length - 2} autres</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}