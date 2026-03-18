'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRentabilite } from '@/app/hooks/useRentabilite';
import type { LigneRentabilite } from '@/app/api/rentabilite/schema';
import {
  calculerRentabilite, calculerCoutInstallation, getCouleurRentabilite,
  formaterDate, formaterMontant,
} from '@/app/api/rentabilite/schema';

export default function RentabilitePage() {
  const { data, loading, charger, enregistrerHeures, modifierHeures, modifierCoutHoraire } = useRentabilite();

  // Modals
  const [showEntreeHeures, setShowEntreeHeures] = useState(false);
  const [showModifHeures, setShowModifHeures] = useState(false);
  const [showCoutModal, setShowCoutModal] = useState(false);

  // Filtres
  const [filtreProjet, setFiltreProjet] = useState('');
  const [filtreClient, setFiltreClient] = useState('');
  const [filtreDateDebut, setFiltreDateDebut] = useState('');
  const [filtreDateFin, setFiltreDateFin] = useState('');

  // Entrée d'heures
  const [entreeForm, setEntreeForm] = useState({ numProjet: '', nombreHeures: '', dateInstallation: new Date().toISOString().split('T')[0] });

  // Modification
  const [filtreAnnee, setFiltreAnnee] = useState(String(new Date().getFullYear()));
  const [rechercheModif, setRechercheModif] = useState('');
  const [modifEntries, setModifEntries] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editHeures, setEditHeures] = useState('');
  const [editDate, setEditDate] = useState('');

  // Coût
  const [nouveauCout, setNouveauCout] = useState('');

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); } }, [toast]);

  const recharger = useCallback(() => {
    const f: Record<string, string> = {};
    if (filtreProjet) f.projet = filtreProjet;
    if (filtreClient) f.client = filtreClient;
    if (filtreDateDebut) f.dateDebut = filtreDateDebut;
    if (filtreDateFin) f.dateFin = filtreDateFin;
    charger(f);
  }, [charger, filtreProjet, filtreClient, filtreDateDebut, filtreDateFin]);

  useEffect(() => { recharger(); }, [recharger]);

  // Charger les heures pour modification
  const chargerModifEntries = useCallback(async () => {
    try {
      const res = await fetch(`/api/rentabilite/heures?annee=${filtreAnnee}&recherche=${rechercheModif}`);
      if (res.ok) { const d = await res.json(); setModifEntries(d.entries || []); }
    } catch {}
  }, [filtreAnnee, rechercheModif]);

  useEffect(() => { if (showModifHeures) chargerModifEntries(); }, [showModifHeures, chargerModifEntries]);

  const { lignes, stats, coutHoraire } = data;

  // ═══════════ HANDLERS ═══════════
  const handleEnregistrer = async () => {
    if (!entreeForm.numProjet || !entreeForm.nombreHeures) { setToast({ msg: 'Remplir tous les champs', type: 'error' }); return; }
    try {
      await enregistrerHeures({ numProjet: entreeForm.numProjet, nombreHeures: parseFloat(entreeForm.nombreHeures), dateInstallation: entreeForm.dateInstallation });
      setToast({ msg: 'Heures enregistrées', type: 'success' });
      setEntreeForm({ numProjet: '', nombreHeures: '', dateInstallation: new Date().toISOString().split('T')[0] });
      setShowEntreeHeures(false);
      recharger();
    } catch (e: any) { setToast({ msg: e.message, type: 'error' }); }
  };

  const handleSaveModif = async (id: string) => {
    try {
      await modifierHeures({ commandeId: id, nombreHeures: parseFloat(editHeures), dateInstallation: editDate });
      setEditingId(null);
      chargerModifEntries();
      setToast({ msg: 'Modifié', type: 'success' });
    } catch (e: any) { setToast({ msg: e.message, type: 'error' }); }
  };

  const handleSaveCout = async () => {
    const val = parseFloat(nouveauCout);
    if (!val || val <= 0) return;
    try {
      await modifierCoutHoraire(val);
      setToast({ msg: 'Coût modifié', type: 'success' });
      setShowCoutModal(false);
      recharger();
    } catch (e: any) { setToast({ msg: e.message, type: 'error' }); }
  };

  // ═══════════ MODAL: ENTRÉE D'HEURES ═══════════
  const EntreeHeuresModal = () => {
    if (!showEntreeHeures) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[1rem]">
        <div className="bg-slate-600 rounded-2xl shadow-2xl w-full max-w-[28rem] p-[2rem]">
          <h2 className="text-[1.375rem] font-bold text-white text-center mb-[2rem] underline">
            Entrée d&apos;heures d&apos;installation
          </h2>
          <div className="space-y-[1.25rem]">
            <div className="flex items-center gap-[1rem]">
              <label className="text-white text-[1rem] w-[10rem]"># Projet:</label>
              <input type="text" value={entreeForm.numProjet} onChange={(e) => setEntreeForm({ ...entreeForm, numProjet: e.target.value })} className="flex-1 px-[1rem] py-[0.75rem] rounded-lg text-[1rem]" placeholder="Ex: 251299"/>
            </div>
            <div className="flex items-center gap-[1rem]">
              <label className="text-white text-[1rem] w-[10rem]">Nombre d&apos;heures:</label>
              <input type="number" step="0.25" value={entreeForm.nombreHeures} onChange={(e) => setEntreeForm({ ...entreeForm, nombreHeures: e.target.value })} className="flex-1 px-[1rem] py-[0.75rem] rounded-lg text-[1rem]" placeholder="Ex: 2.5"/>
            </div>
            <div className="flex items-center gap-[1rem]">
              <label className="text-white text-[1rem] w-[10rem]">Date d&apos;installation:</label>
              <input type="date" value={entreeForm.dateInstallation} onChange={(e) => setEntreeForm({ ...entreeForm, dateInstallation: e.target.value })} className="flex-1 px-[1rem] py-[0.75rem] rounded-lg text-[1rem]"/>
            </div>
          </div>
          <div className="flex justify-center gap-[1.5rem] mt-[2rem]">
            <button onClick={() => setShowEntreeHeures(false)} className="px-[2rem] py-[0.75rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-full text-[1rem]">Annuler</button>
            <button onClick={handleEnregistrer} className="px-[2rem] py-[0.75rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-full text-[1rem]">Enregistrer</button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════ MODAL: MODIFICATION DES HEURES ═══════════
  const ModifHeuresModal = () => {
    if (!showModifHeures) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[1rem]">
        <div className="bg-slate-100 rounded-2xl shadow-2xl w-full max-w-[48rem] max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-[1.5rem] border-b">
            <h2 className="text-[1.375rem] font-bold text-blue-600 text-center underline">Modification des heures d&apos;installation</h2>
            <div className="flex items-center justify-center gap-[2rem] mt-[1.25rem]">
              <div className="flex items-center gap-[0.75rem]">
                <label className="text-slate-700 text-[0.875rem]">Rechercher un # de projet:</label>
                <input type="text" value={rechercheModif} onChange={(e) => setRechercheModif(e.target.value)} className="px-[1rem] py-[0.5rem] border-2 border-blue-400 rounded-lg w-[8rem] text-[0.875rem]" placeholder="# projet"/>
              </div>
              <div className="flex items-center gap-[0.75rem]">
                <label className="text-slate-700 text-[0.875rem]">Année d&apos;installation:</label>
                <select value={filtreAnnee} onChange={(e) => setFiltreAnnee(e.target.value)} className="px-[1rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.875rem]">
                  {[2026, 2025, 2024, 2023, 2022].map((a) => <option key={a} value={String(a)}>{a}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-white sticky top-0">
                <tr className="border-b-2 border-blue-400">
                  <th className="px-[1.5rem] py-[1rem] text-blue-600 font-semibold text-[0.875rem]"># Projet</th>
                  <th className="px-[1.5rem] py-[1rem] text-blue-600 font-semibold text-[0.875rem]">Nombre d&apos;heures</th>
                  <th className="px-[1.5rem] py-[1rem] text-blue-600 font-semibold text-[0.875rem]">Date de l&apos;installation</th>
                  <th className="px-[1.5rem] py-[1rem] text-blue-600 font-semibold text-[0.875rem]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {modifEntries.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-[2rem] text-slate-400">Aucune entrée trouvée</td></tr>
                ) : modifEntries.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-[1.5rem] py-[1rem] text-center font-medium text-[0.875rem]">{item.numProjet}</td>
                    <td className="px-[1.5rem] py-[1rem] text-center text-[0.875rem]">
                      {editingId === item.id ? (
                        <input type="number" step="0.25" value={editHeures} onChange={(e) => setEditHeures(e.target.value)} className="w-[5rem] px-[0.5rem] py-[0.25rem] border rounded text-center text-[0.875rem]"/>
                      ) : (
                        <span className="font-semibold">{item.nombreHeures}</span>
                      )}
                    </td>
                    <td className="px-[1.5rem] py-[1rem] text-center text-[0.875rem]">
                      {editingId === item.id ? (
                        <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="px-[0.5rem] py-[0.25rem] border rounded text-[0.875rem]"/>
                      ) : (
                        formaterDate(item.dateInstallation)
                      )}
                    </td>
                    <td className="px-[1.5rem] py-[1rem]">
                      <div className="flex items-center justify-center gap-[0.5rem]">
                        {editingId === item.id ? (
                          <>
                            <button onClick={() => handleSaveModif(item.id)} className="p-[0.375rem] text-blue-600 hover:bg-blue-100 rounded text-[0.8125rem]">💾</button>
                            <button onClick={() => setEditingId(null)} className="p-[0.375rem] text-slate-600 hover:bg-slate-100 rounded text-[0.8125rem]">✕</button>
                          </>
                        ) : (
                          <button onClick={() => { setEditingId(item.id); setEditHeures(String(item.nombreHeures)); setEditDate(item.dateInstallation); }} className="p-[0.375rem] text-blue-600 hover:bg-blue-100 rounded text-[0.8125rem]">✏️</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-[1rem] border-t flex justify-center">
            <button onClick={() => { setShowModifHeures(false); recharger(); }} className="px-[2.5rem] py-[0.75rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-full text-[1rem]">Sortir</button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════ MODAL: COÛT D'INSTALLATION ═══════════
  const CoutModal = () => {
    if (!showCoutModal) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[1rem]">
        <div className="bg-slate-600 rounded-2xl shadow-2xl w-full max-w-[26rem] p-[2rem]">
          <h2 className="text-[1.125rem] font-bold text-white text-center mb-[1.5rem] underline">Modification du coût d&apos;installation</h2>
          <div className="flex items-center justify-center gap-[1rem] mb-[2rem]">
            <label className="text-white text-[1.125rem]">Coût d&apos;installation:</label>
            <input type="number" defaultValue={coutHoraire} onChange={(e) => setNouveauCout(e.target.value)} className="w-[5rem] px-[1rem] py-[0.5rem] rounded-lg text-[1.125rem] text-center"/>
            <span className="text-white text-[1.125rem]">$/h</span>
          </div>
          <div className="flex justify-center gap-[1rem]">
            <button onClick={() => setShowCoutModal(false)} className="px-[2rem] py-[0.75rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-full">Annuler</button>
            <button onClick={handleSaveCout} className="px-[2rem] py-[0.75rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-full">Modifier</button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════ RENDU ═══════════
  return (
    <div className="space-y-[1.25rem]">
      <EntreeHeuresModal/><ModifHeuresModal/><CoutModal/>
      {toast && <div className={`fixed bottom-[1rem] right-[1rem] z-[70] px-[1rem] py-[0.75rem] rounded-lg shadow-lg text-white text-[0.875rem] font-medium ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{toast.type === 'success' ? '✓' : '✕'} {toast.msg}</div>}

      {/* Header — dark bar avec boutons d'action */}
      <div className="bg-slate-800 rounded-2xl p-[1rem] flex items-center justify-between">
        <h1 className="text-[1.375rem] font-bold text-white">Rentabilité des installations</h1>
        <div className="flex items-center gap-[0.5rem]">
          <button onClick={() => setShowEntreeHeures(true)} className="flex flex-col items-center p-[0.75rem] hover:bg-slate-700 rounded-lg text-white">
            <span className="text-[1.25rem]">✅</span>
            <span className="text-[0.6875rem] mt-[0.25rem]">Entrée d&apos;heures</span>
          </button>
          <button onClick={() => setShowModifHeures(true)} className="flex flex-col items-center p-[0.75rem] hover:bg-slate-700 rounded-lg text-white">
            <span className="text-[1.25rem]">✏️</span>
            <span className="text-[0.6875rem] mt-[0.25rem]">Modifier des entrées</span>
          </button>
          <button onClick={() => { setNouveauCout(String(coutHoraire)); setShowCoutModal(true); }} className="flex flex-col items-center p-[0.75rem] hover:bg-slate-700 rounded-lg text-white">
            <span className="text-[1.25rem]">📋</span>
            <span className="text-[0.6875rem] mt-[0.25rem]">Coût d&apos;installation</span>
          </button>
        </div>
      </div>

      {/* Filtres + Statistiques */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-[1.25rem]">
        <div className="flex flex-wrap items-end gap-[1.25rem]">
          {/* Filtres */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-[0.75rem]">
            <div>
              <label className="block text-[0.6875rem] font-semibold text-slate-600 mb-[0.25rem]"># Projet</label>
              <input type="text" value={filtreProjet} onChange={(e) => setFiltreProjet(e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.8125rem]" placeholder="Rechercher..."/>
            </div>
            <div>
              <label className="block text-[0.6875rem] font-semibold text-slate-600 mb-[0.25rem]">Client</label>
              <input type="text" value={filtreClient} onChange={(e) => setFiltreClient(e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.8125rem]" placeholder="Rechercher..."/>
            </div>
            <div>
              <label className="block text-[0.6875rem] font-semibold text-slate-600 mb-[0.25rem]">Date début</label>
              <input type="date" value={filtreDateDebut} onChange={(e) => setFiltreDateDebut(e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.8125rem]"/>
            </div>
            <div>
              <label className="block text-[0.6875rem] font-semibold text-slate-600 mb-[0.25rem]">Date fin</label>
              <input type="date" value={filtreDateFin} onChange={(e) => setFiltreDateFin(e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.8125rem]"/>
            </div>
          </div>

          {/* Statistiques */}
          <div className="flex items-center gap-[1.25rem] bg-slate-50 px-[1.25rem] py-[0.875rem] rounded-xl">
            <div className="text-right">
              <p className="text-[0.75rem] text-slate-600">Nombre d&apos;installation:</p>
              <p className="text-[1.5rem] font-bold text-slate-800">{stats.nombreInstallations}</p>
            </div>
            <div className="w-[0.0625rem] h-[3rem] bg-slate-300"></div>
            <div className="text-right">
              <p className="text-[0.75rem] text-slate-600">% de Rentabilité &gt; 20%:</p>
              <p className="text-[1.5rem] font-bold text-slate-800">{stats.rentabiliteSup20}</p>
            </div>
            <div className="w-[0.0625rem] h-[3rem] bg-slate-300"></div>
            <div className="text-right">
              <p className="text-[0.75rem] text-slate-600">Moyenne en %:</p>
              <p className="text-[1.5rem] font-bold text-slate-800">{stats.moyenneRentabilite.toFixed(2)}</p>
            </div>
            <div className="w-[0.0625rem] h-[3rem] bg-slate-300"></div>
            <div className="text-right">
              <p className="text-[0.75rem] text-slate-600">Coût horaire:</p>
              <p className="text-[1.5rem] font-bold text-blue-600">***$</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau de rentabilité */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading && <div className="text-center py-[1.5rem] text-slate-500 text-[0.875rem]">Chargement...</div>}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800 text-white">
              <tr>
                <th className="px-[1.25rem] py-[1rem] text-left text-[0.8125rem] font-semibold"># Projet</th>
                <th className="px-[1.25rem] py-[1rem] text-left text-[0.8125rem] font-semibold">Client</th>
                <th className="px-[1.25rem] py-[1rem] text-center text-[0.8125rem] font-semibold">Vente Installation $</th>
                <th className="px-[1.25rem] py-[1rem] text-center text-[0.8125rem] font-semibold">Date début<br/>Date fin</th>
                <th className="px-[1.25rem] py-[1rem] text-center text-[0.8125rem] font-semibold">Nombre d&apos;heures</th>
                <th className="px-[1.25rem] py-[1rem] text-center text-[0.8125rem] font-semibold">Coût installation</th>
                <th className="px-[1.25rem] py-[1rem] text-center text-[0.8125rem] font-semibold">Rentabilité %</th>
                <th className="px-[0.5rem] py-[1rem]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lignes.length === 0 && !loading ? (
                <tr><td colSpan={8} className="text-center py-[3rem] text-slate-400">Aucune installation trouvée avec ces filtres</td></tr>
              ) : lignes.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-[1.25rem] py-[1rem] font-medium text-slate-800 text-[0.875rem]">{item.numProjet}</td>
                  <td className="px-[1.25rem] py-[1rem] text-slate-600 text-[0.875rem]">{item.client}</td>
                  <td className="px-[1.25rem] py-[1rem] text-center font-medium text-[0.875rem]">{formaterMontant(item.venteInstallation)}</td>
                  <td className="px-[1.25rem] py-[1rem] text-center text-[0.8125rem]">
                    <div>{formaterDate(item.dateDebut)}</div>
                    <div>{formaterDate(item.dateFin)}</div>
                  </td>
                  <td className="px-[1.25rem] py-[1rem] text-center font-bold text-[1.0625rem]">
                    {item.heuresReelles > 0 ? String(item.heuresReelles).replace('.', ',') : '—'}
                  </td>
                  <td className="px-[1.25rem] py-[1rem] text-center font-medium text-[0.875rem]">
                    {item.heuresReelles > 0 ? formaterMontant(item.coutInstallation) : '—'}
                  </td>
                  <td className="px-[1.25rem] py-[1rem] text-center">
                    {item.heuresReelles > 0 ? (
                      <span className={`inline-block min-w-[5rem] px-[1rem] py-[0.5rem] rounded-lg font-bold text-[1.0625rem] ${getCouleurRentabilite(item.rentabilite)}`}>
                        {item.rentabilite.toFixed(2).replace('.', ',')}
                      </span>
                    ) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-[0.5rem] py-[1rem]">
                    <button className="p-[0.375rem] text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg text-[1rem]">›</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Légende */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-[1rem]">
        <p className="text-[0.8125rem] font-semibold text-slate-600 mb-[0.75rem]">Légende de rentabilité:</p>
        <div className="flex flex-wrap items-center gap-[1rem]">
          {[
            { couleur: 'bg-emerald-500', label: '≥ 50% Excellent' },
            { couleur: 'bg-green-500', label: '≥ 30% Très bon' },
            { couleur: 'bg-lime-500', label: '≥ 20% Bon' },
            { couleur: 'bg-yellow-500', label: '≥ 10% Acceptable' },
            { couleur: 'bg-orange-500', label: '≥ 0% Faible' },
            { couleur: 'bg-red-500', label: '< 0% Déficitaire' },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-[0.5rem]">
              <span className={`w-[1.25rem] h-[1.25rem] rounded ${l.couleur}`}></span>
              <span className="text-[0.75rem] text-slate-600">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}