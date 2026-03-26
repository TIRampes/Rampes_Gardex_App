'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useAchats, useFournisseurs, useDelais } from '@/app/hooks/useAchats';
import type { AchatCommandeView, AchatTypeView, UpdateAchatsCommande, DelaiLivraison, RuptureStock, DelaisConfig } from '@/app/api/achats/schema';
import type { FournisseurView } from '@/app/hooks/useAchats';
import {
  ACHAT_TYPES, STATUT_ACHAT_ENUM, STATUT_ACHAT_MAP, TYPE_ACHAT_ENUM,
  getStatutAchatInfo, getStatutGlobalInfo, getServiceCouleur,
  formaterDate, formaterDateCourte, calculerDateLivraison,
} from '@/app/api/achats/schema';

// ═══════════════════════════════════════════════════════════════════════════
// Composant FournisseurModal (extra pour optimiser la saisie)
// ═══════════════════════════════════════════════════════════════════════════
interface FournisseurModalProps {
  show: boolean;
  fournisseur: (Partial<FournisseurView> & { formulaireFile?: File | null; supprimerFormulaire?: boolean }) | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

const FournisseurModal = memo(function FournisseurModal({ show, fournisseur, onClose, onSave }: FournisseurModalProps) {
  const [localData, setLocalData] = useState(fournisseur);

  // Synchroniser quand le fournisseur change (ouverture du modal)
  useEffect(() => {
    setLocalData(fournisseur);
  }, [fournisseur]);

  const handleChange = useCallback((key: string, value: any) => {
    setLocalData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!localData) return;
    await onSave(localData);
  }, [localData, onSave]);

  if (!show || !localData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[1rem]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[40rem] max-h-[90vh] overflow-y-auto">
        <div className="p-[1.25rem] bg-slate-800 text-white rounded-t-2xl">
          <h2 className="text-[1.125rem] font-bold">{localData.id ? 'Modifier le fournisseur' : 'Ajouter un fournisseur'}</h2>
        </div>
        <div className="p-[1.5rem] grid grid-cols-2 gap-[1rem]">
          <div className="col-span-2">
            <label className="block text-[0.8125rem] font-semibold mb-[0.25rem]">Nom *</label>
            <input
              type="text"
              value={localData.nom || ''}
              onChange={(e) => handleChange('nom', e.target.value)}
              className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.8125rem]"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[0.8125rem] font-semibold mb-[0.25rem]">Adresse</label>
            <input
              type="text"
              value={localData.adresse || ''}
              onChange={(e) => handleChange('adresse', e.target.value)}
              className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.8125rem]"
            />
          </div>
          <div>
            <label className="block text-[0.8125rem] font-semibold mb-[0.25rem]">Téléphone</label>
            <input
              type="tel"
              value={localData.telephone || ''}
              onChange={(e) => handleChange('telephone', e.target.value)}
              className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.8125rem]"
            />
          </div>
          <div>
            <label className="block text-[0.8125rem] font-semibold mb-[0.25rem]">Contact</label>
            <input
              type="text"
              value={localData.contact || ''}
              onChange={(e) => handleChange('contact', e.target.value)}
              className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.8125rem]"
            />
          </div>
          <div>
            <label className="block text-[0.8125rem] font-semibold mb-[0.25rem]">Email</label>
            <input
              type="email"
              value={localData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.8125rem]"
            />
          </div>
          <div>
            <label className="block text-[0.8125rem] font-semibold mb-[0.25rem]">Notes</label>
            <input
              type="text"
              value={localData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.8125rem]"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-[0.8125rem] font-semibold mb-[0.25rem]">Type d'achat</label>
            <select
              value={localData.typeAchat || ''}
              onChange={(e) => handleChange('typeAchat', e.target.value)}
              className="w-full px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.8125rem]"
            >
              <option value="">-- Sélectionner --</option>
              {TYPE_ACHAT_ENUM.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[0.8125rem] font-semibold mb-[0.25rem]">Formulaire de commande (PDF, Word, Excel)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => handleChange('formulaireFile', e.target.files?.[0] || null)}
              className="w-full text-[0.8125rem]"
            />
            {localData.formulaireNom && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <span className="text-slate-600">Fichier actuel :</span>
                <a
                  href={`/api/achats/fournisseurs/${localData.id}/formulaire`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {localData.formulaireNom}
                </a>
                <button
                  type="button"
                  onClick={() => handleChange('supprimerFormulaire', true)}
                  className="text-red-500 text-xs"
                >
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="p-[1rem] border-t flex justify-end gap-[0.75rem]">
          <button onClick={onClose} className="px-[1.5rem] py-[0.5rem] border rounded-lg hover:bg-slate-50 text-[0.875rem]">
            Annuler
          </button>
          <button onClick={handleSave} className="px-[1.5rem] py-[0.5rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-[0.875rem]">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════
export default function AchatsPage() {
  const { actifs, historique, stats, loading, charger, mettreAJourAchats, validerLivraison } = useAchats();
  const { fournisseurs, charger: chargerFournisseurs, creer: creerFournisseur, modifier: modifierFournisseur, supprimer: supprimerFournisseur } = useFournisseurs();
  const { config: delaisConfig, charger: chargerDelais, sauvegarder: sauvegarderDelais, envoyerParCourriel } = useDelais();

  const [onglet, setOnglet] = useState<'achats' | 'historique' | 'delais' | 'fournisseurs'>('achats');
  const [recherche, setRecherche] = useState('');
  const [filtreService, setFiltreService] = useState('');
  const [filtreTypeAchat, setFiltreTypeAchat] = useState('');

  // Modals achats
  const [achatDetail, setAchatDetail] = useState<AchatCommandeView | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [achatEdition, setAchatEdition] = useState<AchatCommandeView | null>(null);
  const [showEdition, setShowEdition] = useState(false);
  const [achatALivrer, setAchatALivrer] = useState<AchatCommandeView | null>(null);
  const [showConfirmLivraison, setShowConfirmLivraison] = useState(false);

  // Modals fournisseurs
  const [showFournisseurForm, setShowFournisseurForm] = useState(false);
  const [fournisseurEdition, setFournisseurEdition] = useState<Partial<FournisseurView> & { formulaireFile?: File | null; supprimerFormulaire?: boolean } | null>(null);
  const [rechercheFournisseur, setRechercheFournisseur] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

  // Modals délais
  const [showModifierDelais, setShowModifierDelais] = useState(false);
  const [showModifierRuptures, setShowModifierRuptures] = useState(false);
  const [showConfirmEnvoiDelais, setShowConfirmEnvoiDelais] = useState(false);
  const [delaiEnEdition, setDelaiEnEdition] = useState<string | null>(null);
  const [ruptureEnEdition, setRuptureEnEdition] = useState<string | null>(null);
  const [showAjouterRupture, setShowAjouterRupture] = useState(false);
  const [nouvelleRupture, setNouvelleRupture] = useState({ piece: '', couleur: '', dateReception: '' });
  const [localDelais, setLocalDelais] = useState<DelaiLivraison[]>([]);
  const [localRuptures, setLocalRuptures] = useState<RuptureStock[]>([]);
  const [localDebut, setLocalDebut] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); } }, [toast]);

  // Chargement initial
  useEffect(() => { charger(); chargerFournisseurs(); chargerDelais(); }, [charger, chargerFournisseurs, chargerDelais]);
  useEffect(() => {
    if (delaisConfig) {
      setLocalDelais(delaisConfig.delais || []);
      setLocalRuptures(delaisConfig.ruptures || []);
      setLocalDebut(delaisConfig.debutConstruction || '');
    }
  }, [delaisConfig]);

  // Filtrage achats
  const achatsFiltres = actifs.filter((a) => {
    const mr = !recherche || a.commandeNumero.toLowerCase().includes(recherche.toLowerCase()) || a.clientNom.toLowerCase().includes(recherche.toLowerCase());
    const ms = !filtreService || a.service === filtreService;
    const mt = !filtreTypeAchat || a.achats.some((ac) => ac.key === filtreTypeAchat && ac.actif);
    return mr && ms && mt;
  });

  // === HANDLERS ACHATS ===
  const handleValiderLivraison = async () => {
    if (!achatALivrer) return;
    try { await validerLivraison(achatALivrer.id); setToast({ message: 'Livraison validée', type: 'success' }); charger(); }
    catch (e: any) { setToast({ message: e.message, type: 'error' }); }
    setShowConfirmLivraison(false); setAchatALivrer(null); setShowDetail(false);
  };

  const handleSauvegarderAchats = async () => {
    if (!achatEdition) return;
    try {
      const data: UpdateAchatsCommande = {};
      for (const at of achatEdition.achats) {
        const td = ACHAT_TYPES.find((t) => t.key === at.key);
        if (!td) continue;
        (data as any)[td.prismaStatut] = at.actif ? (at.statut || null) : null;
        (data as any)[td.prismaEnvoi] = at.dateEnvoie || null;
        (data as any)[td.prismaRecep] = at.dateReception || null;
        (data as any)[td.prismaQte] = at.quantiteNonRecue ?? null;
      }
      await mettreAJourAchats(achatEdition.id, data);
      setToast({ message: 'Achats mis à jour', type: 'success' });
      setShowEdition(false); setAchatEdition(null); charger();
    } catch (e: any) { setToast({ message: e.message, type: 'error' }); }
  };

  // === HANDLERS FOURNISSEURS ===
  const handleSauvegarderFournisseur = useCallback(async (data: any) => {
    try {
      if (data.id) {
        await modifierFournisseur(data.id, {
          nom: data.nom,
          contact: data.contact,
          telephone: data.telephone,
          email: data.email,
          adresse: data.adresse,
          notes: data.notes,
          typeAchat: data.typeAchat,
          formulaire: data.formulaireFile,
          supprimerFormulaire: data.supprimerFormulaire,
        });
        setToast({ message: 'Fournisseur modifié', type: 'success' });
      } else {
        await creerFournisseur({
          nom: data.nom,
          contact: data.contact,
          telephone: data.telephone,
          email: data.email,
          adresse: data.adresse,
          notes: data.notes,
          typeAchat: data.typeAchat,
          formulaire: data.formulaireFile,
        });
        setToast({ message: 'Fournisseur ajouté', type: 'success' });
      }
      setShowFournisseurForm(false);
      setFournisseurEdition(null);
      chargerFournisseurs();
    } catch (e: any) {
      setToast({ message: e.message, type: 'error' });
    }
  }, [creerFournisseur, modifierFournisseur, chargerFournisseurs]);

  const handleSupprimerFournisseur = async (id: string) => {
    try { await supprimerFournisseur(id); setToast({ message: 'Fournisseur supprimé', type: 'success' }); chargerFournisseurs(); }
    catch (e: any) { setToast({ message: e.message, type: 'error' }); }
    setShowConfirmDelete(null);
  };

  // === HANDLERS DÉLAIS ===
  const handleSauvegarderDelais = async (delais: DelaiLivraison[], ruptures: RuptureStock[], debut: string) => {
    try {
      await sauvegarderDelais({ delais, ruptures, debutConstruction: debut });
      setToast({ message: 'Délais sauvegardés', type: 'success' });
      chargerDelais();
    } catch (e: any) { setToast({ message: e.message, type: 'error' }); }
  };

  const handleModifierDelai = (id: string, val: string) => {
    const updated = localDelais.map((d) => d.id === id ? { ...d, delaiSemaines: parseInt(val) || 0 } : d);
    setLocalDelais(updated);
    setDelaiEnEdition(null);
    handleSauvegarderDelais(updated, localRuptures, localDebut);
  };

  const handleAjouterRupture = () => {
    if (!nouvelleRupture.piece) return;
    const updated = [...localRuptures, { id: `r${Date.now()}`, ...nouvelleRupture }];
    setLocalRuptures(updated);
    setNouvelleRupture({ piece: '', couleur: '', dateReception: '' });
    setShowAjouterRupture(false);
    handleSauvegarderDelais(localDelais, updated, localDebut);
  };

  const handleSupprimerRupture = (id: string) => {
    const updated = localRuptures.filter((r) => r.id !== id);
    setLocalRuptures(updated);
    handleSauvegarderDelais(localDelais, updated, localDebut);
  };

  const handleModifierRuptureField = (id: string, field: string, value: string) => {
    const updated = localRuptures.map((r) => r.id === id ? { ...r, [field]: value } : r);
    setLocalRuptures(updated);
    handleSauvegarderDelais(localDelais, updated, localDebut);
  };

  const handleDebutChange = (val: string) => {
    setLocalDebut(val);
    handleSauvegarderDelais(localDelais, localRuptures, val);
  };

  const handleEnvoyerDelais = async () => {
    setEnvoiEnCours(true);
    try {
      const res = await envoyerParCourriel();
      setToast({ message: `${res.envoyes} email(s) envoyé(s) via Microsoft 365`, type: 'success' });
    } catch (e: any) { setToast({ message: e.message || 'Erreur envoi', type: 'error' }); }
    setEnvoiEnCours(false);
    setShowConfirmEnvoiDelais(false);
  };

  // === ICÔNE ACHAT ===
  const AchatIcon = ({ achat }: { achat: AchatTypeView }) => {
    if (!achat.actif) return null;
    const info = getStatutAchatInfo(achat.statut);
    if (!info) return <span className="inline-flex items-center justify-center w-[1.75rem] h-[1.75rem] rounded-full bg-slate-200 text-slate-600 text-[0.6875rem] font-bold">●</span>;
    return <span className={`inline-flex items-center justify-center w-[1.75rem] h-[1.75rem] rounded-full ${info.couleur} text-[0.6875rem] font-bold`} title={info.label}>{info.symbol}</span>;
  };

  // === KEBAB MENU ===
  const KebabMenu = ({ achat }: { achat: AchatCommandeView }) => {
    const [open, setOpen] = useState(false);
    return (
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setOpen(!open)} className="p-[0.375rem] hover:bg-slate-200 rounded-lg transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
        </button>
        {open && (<>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}/>
          <div className="absolute right-0 top-full mt-[0.25rem] bg-white border border-slate-200 rounded-lg shadow-xl z-50 min-w-[10rem] py-[0.25rem]">
            <button onClick={() => { setOpen(false); setAchatALivrer(achat); setShowConfirmLivraison(true); }} className="w-full text-left px-[0.75rem] py-[0.5rem] text-[0.8125rem] text-emerald-600 hover:bg-emerald-50">✓ Valider livraison</button>
            <button onClick={() => { setOpen(false); setAchatEdition(JSON.parse(JSON.stringify(achat))); setShowEdition(true); }} className="w-full text-left px-[0.75rem] py-[0.5rem] text-[0.8125rem] text-slate-700 hover:bg-slate-100">✏️ Modifier achats</button>
          </div>
        </>)}
      </div>
    );
  };

  // ═══════════════════════════════════════
  // TABLEAU ACHATS
  // ═══════════════════════════════════════
  const TableauAchats = ({ data, isHistorique }: { data: AchatCommandeView[]; isHistorique: boolean }) => (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[0.8125rem]">
          <thead className="bg-slate-800 text-black/50">
            <tr>
              <th className="px-[0.75rem] py-[0.75rem] text-left"># Projet</th>
              <th className="px-[0.75rem] py-[0.75rem] text-left">Client<br/><span className="font-normal text-[0.6875rem] text-slate-300">Service / Ville</span></th>
              <th className="px-[0.75rem] py-[0.75rem] text-center hidden md:table-cell">Date prévue</th>
              {ACHAT_TYPES.slice(0, 6).map((t) => (<th key={t.key} className="px-[0.375rem] py-[0.75rem] text-center text-[0.6875rem] hidden lg:table-cell">{t.label}</th>))}
              <th className="px-[0.75rem] py-[0.75rem] text-center">Statut</th>
              {isHistorique && <th className="px-[0.75rem] py-[0.75rem] text-center">Livraison</th>}
              {!isHistorique && <th className="px-[0.75rem] py-[0.75rem] text-center w-[3rem]"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-[1rem] py-[3rem] text-center text-slate-400">Aucun achat trouvé</td>
              </tr>
            ) : data.map((a, i) => (
              <tr key={a.id} className={`hover:bg-blue-50 cursor-pointer ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`} onClick={() => { setAchatDetail(a); setShowDetail(true); }}>
                <td className="px-[0.75rem] py-[0.75rem]"><p className="font-bold text-slate-800 text-[0.9375rem]">{a.commandeNumero}</p></td>
                <td className="px-[0.75rem] py-[0.75rem]">
                  <p className="font-medium">{a.clientNom}</p>
                  <div className="flex items-center gap-[0.375rem] mt-[0.125rem]">
                    <span className={`px-[0.375rem] py-[0.0625rem] rounded text-[0.6875rem] font-bold ${getServiceCouleur(a.service)}`}>{a.service.charAt(0) + a.service.slice(1).toLowerCase()}</span>
                    <span className="text-[0.6875rem] text-slate-500">{a.clientVille || ''}</span>
                  </div>
                  {a.commentaire && <p className="text-[0.6875rem] text-slate-400 mt-[0.125rem] truncate max-w-[12rem]">{a.commentaire.split('\n')[0]}</p>}
                </td>
                <td className="px-[0.75rem] py-[0.75rem] text-center hidden md:table-cell text-[0.8125rem]">{formaterDateCourte(a.datePrevue)}</td>
                {ACHAT_TYPES.slice(0, 6).map((t) => { const ac = a.achats.find((x) => x.key === t.key); return <td key={t.key} className="px-[0.375rem] py-[0.75rem] text-center hidden lg:table-cell">{ac && <AchatIcon achat={ac}/>}</td>; })}
                <td className="px-[0.75rem] py-[0.75rem] text-center"><span className={`px-[0.5rem] py-[0.125rem] rounded-full text-[0.6875rem] font-semibold ${getStatutGlobalInfo(a.statutGlobal).couleur}`}>{getStatutGlobalInfo(a.statutGlobal).label}</span></td>
                {isHistorique && <td className="px-[0.75rem] py-[0.75rem] text-center text-emerald-700 font-medium text-[0.8125rem]">✓</td>}
                {!isHistorique && <td className="px-[0.75rem] py-[0.75rem] text-center"><KebabMenu achat={a}/></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ═══════════════════════════════════════
  // MODAL DÉTAIL ACHAT
  // ═══════════════════════════════════════
  const DetailModal = () => {
    if (!showDetail || !achatDetail) return null;
    const a = achatDetail; const isHist = a.statutLivraison === 'LIVRE';
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[1rem]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[52rem] max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-[1.25rem] bg-slate-800 text-white flex items-center justify-between rounded-t-2xl">
            <div><h2 className="text-[1.25rem] font-bold">Détail — Commande #{a.commandeNumero}</h2><p className="text-slate-300 text-[0.875rem]">{a.clientNom} • {a.clientVille || ''}</p></div>
            <button onClick={() => setShowDetail(false)} className="p-[0.5rem] hover:bg-slate-700 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
          <div className="flex-1 overflow-y-auto p-[1.5rem] space-y-[1.25rem]">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-[0.75rem]">
              <div className="bg-slate-50 rounded-xl p-[0.75rem]"><p className="text-[0.6875rem] text-slate-500">Service</p><span className={`px-[0.375rem] py-[0.125rem] rounded text-[0.6875rem] font-bold ${getServiceCouleur(a.service)}`}>{a.service}</span></div>
              <div className="bg-slate-50 rounded-xl p-[0.75rem]"><p className="text-[0.6875rem] text-slate-500">Date prévue</p><p className="font-semibold text-[0.875rem]">{formaterDate(a.datePrevue)}</p></div>
              <div className="bg-slate-50 rounded-xl p-[0.75rem]"><p className="text-[0.6875rem] text-slate-500">Statut</p><span className={`px-[0.75rem] py-[0.25rem] rounded-full text-[0.75rem] font-semibold ${getStatutGlobalInfo(a.statutGlobal).couleur}`}>{getStatutGlobalInfo(a.statutGlobal).label}</span></div>
              <div className="bg-slate-50 rounded-xl p-[0.75rem]"><p className="text-[0.6875rem] text-slate-500">Achats</p><p className="font-bold text-[1rem]">{a.nbAchatsRecus}/{a.nbAchatsActifs} reçus</p></div>
            </div>
            {a.couleur && <div className="bg-slate-50 rounded-xl p-[0.75rem] inline-block"><p className="text-[0.6875rem] text-slate-500">Couleur</p><p className="font-semibold">{a.couleur}</p></div>}
            {a.structure && <span className="ml-[0.75rem] px-[0.75rem] py-[0.25rem] bg-blue-100 text-blue-800 rounded-full text-[0.75rem] font-semibold">Structure: Oui</span>}
            <div>
              <h3 className="font-bold text-slate-800 mb-[0.75rem] text-[1.0625rem]">Détail des achats par type</h3>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-[0.8125rem]"><thead className="bg-slate-100"><tr><th className="px-[1rem] py-[0.75rem] text-left font-semibold">Type</th><th className="px-[1rem] py-[0.75rem] text-center font-semibold">Statut</th><th className="px-[1rem] py-[0.75rem] text-center font-semibold">Envoi</th><th className="px-[1rem] py-[0.75rem] text-center font-semibold">Réception</th><th className="px-[1rem] py-[0.75rem] text-center font-semibold">Non reçu</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">{a.achats.map((ac) => { const info = getStatutAchatInfo(ac.statut); return (
                    <tr key={ac.key} className={ac.actif ? 'bg-white' : 'bg-slate-50 opacity-40'}>
                      <td className="px-[1rem] py-[0.75rem] font-medium">{ac.label}</td>
                      <td className="px-[1rem] py-[0.75rem] text-center">{ac.actif && info ? <span className={`px-[0.5rem] py-[0.125rem] rounded-full text-[0.6875rem] font-semibold ${info.couleur}`}>{info.label}</span> : <span className="text-slate-400">—</span>}</td>
                      <td className="px-[1rem] py-[0.75rem] text-center text-[0.8125rem]">{ac.actif ? formaterDateCourte(ac.dateEnvoie) : '—'}</td>
                      <td className="px-[1rem] py-[0.75rem] text-center text-[0.8125rem]">{ac.actif ? formaterDateCourte(ac.dateReception) : '—'}</td>
                      <td className="px-[1rem] py-[0.75rem] text-center">{ac.quantiteNonRecue ? <span className="text-red-600 font-bold">{ac.quantiteNonRecue}</span> : '—'}</td>
                    </tr>
                  ); })}</tbody>
                </table>
              </div>
            </div>
            {a.commentaire && <div className="bg-amber-50 rounded-xl p-[1rem] border border-amber-200"><h4 className="font-semibold text-amber-800 mb-[0.25rem] text-[0.875rem]">📝 Notes</h4><p className="text-[0.8125rem] text-slate-700 whitespace-pre-line">{a.commentaire}</p></div>}
            {isHist && <div className="bg-emerald-50 rounded-xl p-[1rem] border border-emerald-200"><h4 className="font-semibold text-emerald-800">✓ Livraison validée</h4></div>}
          </div>
          <div className="p-[1rem] border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>{!isHist && <button onClick={() => { setAchatALivrer(a); setShowConfirmLivraison(true); }} className="px-[1.25rem] py-[0.5rem] bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg text-[0.875rem]">✓ Valider la livraison</button>}</div>
            <div className="flex gap-[0.5rem]">
              {!isHist && <button onClick={() => { setAchatEdition(JSON.parse(JSON.stringify(a))); setShowDetail(false); setShowEdition(true); }} className="px-[1rem] py-[0.5rem] bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[0.875rem]">✏️ Modifier</button>}
              <button onClick={() => setShowDetail(false)} className="px-[1rem] py-[0.5rem] border border-slate-300 rounded-lg hover:bg-slate-100 text-[0.875rem]">Fermer</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════
  // MODAL EDITION ACHATS
  // ═══════════════════════════════════════
  const EditionModal = () => {
    if (!showEdition || !achatEdition) return null;
    const upd = (key: string, field: keyof AchatTypeView, value: any) => setAchatEdition({ ...achatEdition, achats: achatEdition.achats.map((a) => a.key === key ? { ...a, [field]: value, ...(field === 'statut' && value ? { actif: true } : {}) } : a) });
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[1rem]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[52rem] max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-[1.25rem] bg-slate-800 text-white rounded-t-2xl"><h2 className="text-[1.125rem] font-bold">Modifier les achats — #{achatEdition.commandeNumero}</h2><p className="text-slate-400 text-[0.8125rem]">{achatEdition.clientNom}</p></div>
          <div className="flex-1 overflow-y-auto p-[1.5rem] space-y-[1rem]">
            <h3 className="font-bold text-slate-800 text-[1rem] border-b pb-[0.5rem]">Types d&apos;achats requis</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[1rem]">
              {achatEdition.achats.map((ac) => (
                <div key={ac.key} className={`p-[0.75rem] rounded-xl border-2 ${ac.actif ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                  <label className="flex items-center gap-[0.5rem] cursor-pointer mb-[0.5rem]"><input type="checkbox" checked={ac.actif} onChange={(e) => upd(ac.key, 'actif', e.target.checked)} className="w-[1rem] h-[1rem]"/><span className="text-[0.8125rem] font-semibold text-slate-700">{ac.label}</span></label>
                  {ac.actif && (<div className="space-y-[0.375rem]">
                    <select value={ac.statut || ''} onChange={(e) => upd(ac.key, 'statut', e.target.value || null)} className="w-full px-[0.5rem] py-[0.25rem] border rounded text-[0.75rem]"><option value="">Statut...</option>{STATUT_ACHAT_ENUM.map((s) => <option key={s} value={s}>{STATUT_ACHAT_MAP[s]?.label || s}</option>)}</select>
                    <div><label className="text-[0.6875rem] text-slate-500">Date envoi</label><input type="date" value={ac.dateEnvoie?.split('T')[0] || ''} onChange={(e) => upd(ac.key, 'dateEnvoie', e.target.value || null)} className="w-full px-[0.5rem] py-[0.25rem] border rounded text-[0.75rem]"/></div>
                    <div><label className="text-[0.6875rem] text-slate-500">Date réception</label><input type="date" value={ac.dateReception?.split('T')[0] || ''} onChange={(e) => upd(ac.key, 'dateReception', e.target.value || null)} className="w-full px-[0.5rem] py-[0.25rem] border rounded text-[0.75rem]"/></div>
                    <div><label className="text-[0.6875rem] text-slate-500">Qté non reçue</label><input type="number" min="0" value={ac.quantiteNonRecue || ''} onChange={(e) => upd(ac.key, 'quantiteNonRecue', parseInt(e.target.value) || null)} className="w-full px-[0.5rem] py-[0.25rem] border rounded text-[0.75rem]"/></div>
                  </div>)}
                </div>
              ))}
            </div>
          </div>
          <div className="p-[1rem] border-t border-slate-200 flex justify-end gap-[0.75rem]">
            <button onClick={() => { setShowEdition(false); setAchatEdition(null); }} className="px-[1.5rem] py-[0.5rem] border border-slate-300 rounded-lg hover:bg-slate-50 text-[0.875rem]">Annuler</button>
            <button onClick={handleSauvegarderAchats} className="px-[1.5rem] py-[0.5rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-[0.875rem]">Enregistrer</button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════
  // MODALS CONFIRM (livraison, delete, envoi)
  // ═══════════════════════════════════════
  const ConfirmLivraisonModal = () => { if (!showConfirmLivraison || !achatALivrer) return null; return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-[1rem]"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-[26rem] p-[1.5rem] text-center">
      <div className="w-[4rem] h-[4rem] bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-[1rem]"><span className="text-[1.5rem]">✓</span></div>
      <h3 className="text-[1.125rem] font-bold text-slate-800 mb-[0.5rem]">Valider la livraison ?</h3>
      <p className="text-slate-600 text-[0.875rem] mb-[0.25rem]">Commande <strong>#{achatALivrer.commandeNumero}</strong> — {achatALivrer.clientNom}</p>
      <p className="text-[0.8125rem] text-slate-500 mb-[1.5rem]">Tous les achats seront marqués comme réceptionnés.</p>
      <div className="flex justify-center gap-[1rem]">
        <button onClick={() => { setShowConfirmLivraison(false); setAchatALivrer(null); }} className="px-[1.5rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.875rem]">Annuler</button>
        <button onClick={handleValiderLivraison} className="px-[1.5rem] py-[0.5rem] bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg text-[0.875rem]">✓ Confirmer</button>
      </div>
    </div></div>); };

  const ConfirmDeleteModal = () => { if (!showConfirmDelete) return null; return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-[1rem]"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-[26rem] p-[1.5rem] text-center">
      <h3 className="text-[1.125rem] font-bold text-slate-800 mb-[0.75rem]">Supprimer ce fournisseur ?</h3>
      <div className="flex justify-center gap-[1rem]">
        <button onClick={() => setShowConfirmDelete(null)} className="px-[1.5rem] py-[0.5rem] border rounded-lg text-[0.875rem]">Annuler</button>
        <button onClick={() => handleSupprimerFournisseur(showConfirmDelete)} className="px-[1.5rem] py-[0.5rem] bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-[0.875rem]">Supprimer</button>
      </div>
    </div></div>); };

  const ConfirmEnvoiDelaisModal = () => { if (!showConfirmEnvoiDelais) return null; return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[1rem]"><div className="bg-slate-300 rounded-2xl shadow-2xl w-full max-w-[26rem] p-[2rem] text-center">
      <p className="text-[1.0625rem] font-bold text-slate-800 mb-[1.5rem]">Confirmer l&apos;envoi de la liste des délais par courriel ?</p>
      <div className="flex justify-center gap-[1.5rem]">
        <button onClick={handleEnvoyerDelais} disabled={envoiEnCours} className="px-[2.5rem] py-[0.75rem] bg-blue-500 hover:bg-blue-600 disabled:bg-slate-400 text-white font-semibold rounded-lg text-[1.0625rem]">{envoiEnCours ? '⏳ Envoi...' : 'Confirmer'}</button>
        <button onClick={() => setShowConfirmEnvoiDelais(false)} className="px-[2.5rem] py-[0.75rem] bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg text-[1.0625rem]">Annuler</button>
      </div>
    </div></div>); };

  // ═══════════════════════════════════════
  // MODAL MODIFIER DÉLAIS
  // ═══════════════════════════════════════
  const ModifierDelaisModal = () => {
    if (!showModifierDelais) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[1rem]">
        <div className="bg-slate-300 rounded-2xl shadow-2xl w-full max-w-[40rem] max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-[1.5rem]">
            <h2 className="text-[1.5rem] font-bold text-center text-blue-600 underline mb-[1.5rem]">Modification des délais</h2>
            <div className="bg-white rounded-lg overflow-hidden">
              <table className="w-full text-[0.875rem]">
                <thead className="bg-slate-200"><tr><th className="px-[1rem] py-[0.75rem] text-center text-blue-600">Secteur</th><th className="px-[1rem] py-[0.75rem] text-center text-blue-600">Nombre de semaines</th><th className="px-[1rem] py-[0.75rem] w-[4rem]"></th></tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {localDelais.map((d, i) => (
                    <tr key={d.id} className={i % 2 === 0 ? 'bg-slate-100' : 'bg-white'}>
                      <td className="px-[1rem] py-[0.75rem] font-semibold text-center text-[0.8125rem]">{d.secteur}</td>
                      <td className="px-[1rem] py-[0.75rem] text-center">
                        {delaiEnEdition === d.id ? (
                          <input type="number" defaultValue={d.delaiSemaines} min="0" className="w-[5rem] px-[0.5rem] py-[0.25rem] border rounded text-center" autoFocus
                            onBlur={(e) => handleModifierDelai(d.id, e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleModifierDelai(d.id, (e.target as HTMLInputElement).value); }}/>
                        ) : <span className="text-[1.25rem] font-bold">{d.delaiSemaines}</span>}
                      </td>
                      <td className="px-[1rem] py-[0.75rem] text-center">
                        <button onClick={() => setDelaiEnEdition(d.id)} className="text-blue-500 hover:text-blue-700">✏️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="p-[1rem] flex justify-center">
            <button onClick={() => { setShowModifierDelais(false); setDelaiEnEdition(null); }} className="px-[2.5rem] py-[0.75rem] bg-blue-500 hover:bg-blue-600 text-white text-[1.25rem] font-semibold rounded-lg">Sortir</button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════
  // MODAL MODIFIER RUPTURES
  // ═══════════════════════════════════════
  const ModifierRupturesModal = () => {
    if (!showModifierRuptures) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[1rem]">
        <div className="bg-slate-300 rounded-2xl shadow-2xl w-full max-w-[40rem] max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-[1.5rem]">
            <h2 className="text-[1.5rem] font-bold text-center text-blue-600 underline mb-[1.5rem]">Modification des ruptures de stock</h2>
            <div className="bg-white rounded-lg overflow-hidden mb-[1rem]">
              <table className="w-full text-[0.875rem]">
                <thead className="bg-slate-200"><tr><th className="px-[1rem] py-[0.75rem] text-center text-blue-600">Pièces</th><th className="px-[1rem] py-[0.75rem] text-center text-blue-600">Couleur</th><th className="px-[1rem] py-[0.75rem] text-center text-blue-600">Date de réception</th><th className="px-[1rem] py-[0.75rem] w-[6rem]"></th></tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {localRuptures.map((r) => (
                    <tr key={r.id}>
                      <td className="px-[1rem] py-[0.75rem]">{ruptureEnEdition === r.id ? <input type="text" defaultValue={r.piece} className="w-full px-[0.5rem] py-[0.25rem] border rounded" onBlur={(e) => handleModifierRuptureField(r.id, 'piece', e.target.value)}/> : r.piece}</td>
                      <td className="px-[1rem] py-[0.75rem] text-center">{ruptureEnEdition === r.id ? <input type="text" defaultValue={r.couleur} className="w-full px-[0.5rem] py-[0.25rem] border rounded" onBlur={(e) => handleModifierRuptureField(r.id, 'couleur', e.target.value)}/> : r.couleur}</td>
                      <td className="px-[1rem] py-[0.75rem] text-center">{ruptureEnEdition === r.id ? <input type="date" defaultValue={r.dateReception} className="px-[0.5rem] py-[0.25rem] border rounded" onBlur={(e) => handleModifierRuptureField(r.id, 'dateReception', e.target.value)}/> : formaterDate(r.dateReception)}</td>
                      <td className="px-[1rem] py-[0.75rem] text-center flex gap-[0.25rem] justify-center">
                        <button onClick={() => setRuptureEnEdition(ruptureEnEdition === r.id ? null : r.id)} className="text-blue-500">✏️</button>
                        <button onClick={() => handleSupprimerRupture(r.id)} className="text-red-500">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {showAjouterRupture && (
              <div className="bg-white rounded-lg p-[1rem] mb-[1rem] border-2 border-blue-300">
                <div className="grid grid-cols-3 gap-[0.75rem]">
                  <input type="text" placeholder="Pièce" value={nouvelleRupture.piece} onChange={(e) => setNouvelleRupture({ ...nouvelleRupture, piece: e.target.value })} className="px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"/>
                  <input type="text" placeholder="Couleur" value={nouvelleRupture.couleur} onChange={(e) => setNouvelleRupture({ ...nouvelleRupture, couleur: e.target.value })} className="px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"/>
                  <input type="date" value={nouvelleRupture.dateReception} onChange={(e) => setNouvelleRupture({ ...nouvelleRupture, dateReception: e.target.value })} className="px-[0.75rem] py-[0.5rem] border rounded-lg text-[0.875rem]"/>
                </div>
                <div className="mt-[0.75rem] flex gap-[0.5rem]">
                  <button onClick={handleAjouterRupture} className="px-[1rem] py-[0.5rem] bg-emerald-500 text-white rounded-lg text-[0.875rem]">Ajouter</button>
                  <button onClick={() => setShowAjouterRupture(false)} className="px-[1rem] py-[0.5rem] border rounded-lg text-[0.875rem]">Annuler</button>
                </div>
              </div>
            )}
          </div>
          <div className="p-[1rem] flex justify-center gap-[1rem]">
            <button onClick={() => { setShowModifierRuptures(false); setRuptureEnEdition(null); }} className="px-[2.5rem] py-[0.75rem] bg-blue-500 hover:bg-blue-600 text-white text-[1.25rem] font-semibold rounded-lg">Sortir</button>
            <button onClick={() => setShowAjouterRupture(true)} className="px-[2.5rem] py-[0.75rem] bg-blue-500 hover:bg-blue-600 text-white text-[1.25rem] font-semibold rounded-lg">Ajouter Rupture</button>
          </div>
        </div>
      </div>
    );
  };

  // ╔══════════════════════════════════════════════════════╗
  // ║                  RENDU PRINCIPAL                      ║
  // ╚══════════════════════════════════════════════════════╝
  return (
    <div className="space-y-[1rem]">
      <DetailModal/>
      <EditionModal/>
      <ConfirmLivraisonModal/>
      <ConfirmDeleteModal/>
      <ConfirmEnvoiDelaisModal/>
      <ModifierDelaisModal/>
      <ModifierRupturesModal/>
      <FournisseurModal
        show={showFournisseurForm}
        fournisseur={fournisseurEdition}
        onClose={() => { setShowFournisseurForm(false); setFournisseurEdition(null); }}
        onSave={handleSauvegarderFournisseur}
      />

      {toast && <div className={`fixed bottom-[1rem] right-[1rem] z-[70] px-[1rem] py-[0.75rem] rounded-lg shadow-lg text-white text-[0.875rem] font-medium ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{toast.type === 'success' ? '✓' : '✕'} {toast.message}</div>}

      {/* Header */}
      <div className="bg-slate-800 rounded-2xl p-[1rem] flex flex-wrap items-center justify-between gap-[0.75rem]">
        <h1 className="text-[1.5rem] font-bold text-white">Liste des achats pour les commandes</h1>
        <div className="text-right text-white"><p className="text-slate-400 text-[0.75rem]">Commandes actives</p><p className="text-[1.5rem] font-bold text-blue-400">{stats?.total || 0}</p></div>
      </div>

      {/* Onglets */}
      <div className="flex gap-[0.5rem] bg-slate-100 p-[0.25rem] rounded-xl w-fit flex-wrap">
        {([
          { id: 'achats' as const, label: `📦 Achats actifs (${actifs.length})` },
          { id: 'historique' as const, label: `📋 Historique (${historique.length})` },
          { id: 'delais' as const, label: '🕐 Délais de livraison' },
          { id: 'fournisseurs' as const, label: `🏭 Fournisseurs (${fournisseurs.length})` },
        ]).map((tab) => (
          <button key={tab.id} onClick={() => setOnglet(tab.id)} className={`px-[1.25rem] py-[0.625rem] rounded-lg font-medium transition-all text-[0.875rem] ${onglet === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600'}`}>{tab.label}</button>
        ))}
      </div>

      {/* ===== ACHATS ACTIFS ===== */}
      {onglet === 'achats' && (<>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-[0.75rem]">
          <div className="bg-white p-[0.75rem] rounded-xl border border-amber-200"><p className="text-[0.6875rem] text-slate-500">À commander</p><p className="text-[1.25rem] font-bold text-amber-600">{stats?.aFaire || 0}</p></div>
          <div className="bg-white p-[0.75rem] rounded-xl border border-purple-200"><p className="text-[0.6875rem] text-slate-500">Achat Fait</p><p className="text-[1.25rem] font-bold text-purple-600">{stats?.fait || 0}</p></div>
          <div className="bg-white p-[0.75rem] rounded-xl border border-blue-200"><p className="text-[0.6875rem] text-slate-500">Prêt à ramasser</p><p className="text-[1.25rem] font-bold text-blue-600">{stats?.enTransit || 0}</p></div>
          <div className="bg-white p-[0.75rem] rounded-xl border border-red-200"><p className="text-[0.6875rem] text-slate-500">Back order</p><p className="text-[1.25rem] font-bold text-red-600">{stats?.backOrder || 0}</p></div>
          <div className="bg-white p-[0.75rem] rounded-xl border border-emerald-200"><p className="text-[0.6875rem] text-slate-500">Historique Achat</p><p className="text-[1.25rem] font-bold text-emerald-600">{stats?.historiqueLivres || 0}</p></div>
        </div>
        <div className="bg-white rounded-xl p-[1rem] border border-slate-200 flex flex-wrap items-end gap-[0.75rem]">
          <div className="flex-1 min-w-[11.25rem]"><label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Rechercher</label><input type="text" value={recherche} onChange={(e) => setRecherche(e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.8125rem]" placeholder="# commande, client..."/></div>
          <div className="min-w-[8.125rem]"><label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Service</label><select value={filtreService} onChange={(e) => setFiltreService(e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.8125rem]"><option value="">Tous</option>{['INSTALLATION','LIVRAISON','CUEILLETTE','TRANSPORT'].map((s) => <option key={s} value={s}>{s.charAt(0)+s.slice(1).toLowerCase()}</option>)}</select></div>
          <div className="min-w-[9.375rem]"><label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Type d&apos;achat</label><select value={filtreTypeAchat} onChange={(e) => setFiltreTypeAchat(e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.8125rem]"><option value="">Tous types</option>{ACHAT_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</select></div>
        </div>
        <div className="flex flex-wrap items-center gap-[1rem] text-[0.75rem] text-slate-600">
          <span className="font-semibold">Légende:</span>
          {Object.entries(STATUT_ACHAT_MAP).map(([k, info]) => (<span key={k} className="flex items-center gap-[0.25rem]"><span className={`inline-flex items-center justify-center w-[1.25rem] h-[1.25rem] rounded-full ${info.couleur} text-[0.625rem]`}>{info.symbol}</span> {info.label}</span>))}
        </div>
        {loading ? <div className="text-center py-[3rem] text-slate-500">Chargement...</div> : <TableauAchats data={achatsFiltres} isHistorique={false}/>}
      </>)}

      {/* ===== HISTORIQUE ===== */}
      {onglet === 'historique' && (<>
        <div className="bg-emerald-50 rounded-xl p-[1rem] border border-emerald-200 flex items-center gap-[0.75rem]"><span className="text-[1.5rem]">✓</span><div><p className="font-semibold text-emerald-800">Historique des achats livrés</p><p className="text-[0.8125rem] text-emerald-600">{historique.length} livraison(s) complétée(s)</p></div></div>
        <TableauAchats data={historique} isHistorique={true}/>
      </>)}

      {/* ===== DÉLAIS DE LIVRAISON ===== */}
      {onglet === 'delais' && (<>
        <div className="flex justify-end gap-[0.75rem] flex-wrap">
          <button onClick={() => setShowModifierDelais(true)} className="px-[1rem] py-[0.5rem] bg-white border border-slate-300 rounded-lg flex items-center gap-[0.375rem] hover:bg-slate-50 text-[0.875rem] font-medium">🕐 Modifier délai semaines</button>
          <button onClick={() => setShowModifierRuptures(true)} className="px-[1rem] py-[0.5rem] bg-white border border-slate-300 rounded-lg flex items-center gap-[0.375rem] hover:bg-slate-50 text-[0.875rem] font-medium">📄 Modifier ruptures de stock</button>
          <button onClick={() => setShowConfirmEnvoiDelais(true)} className="px-[1rem] py-[0.5rem] bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-[0.375rem] text-[0.875rem] font-medium">✉️ Envoi par courriel</button>
        </div>

        {/* Tableau délais */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-[0.875rem]">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-[1.5rem] py-[0.75rem] text-left font-semibold text-slate-700 underline text-[1.0625rem]">Secteur</th>
                <th className="px-[1.5rem] py-[0.75rem] text-center font-semibold text-slate-700 underline text-[1.0625rem]" colSpan={2}>Délai</th>
                <th className="px-[1.5rem] py-[0.75rem] text-center font-semibold text-blue-600 underline text-[1.0625rem]">Date de livraison</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {localDelais.map((d, i) => (
                <tr key={d.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-[1.5rem] py-[0.75rem] font-semibold">{d.secteur}</td>
                  <td className="px-[1rem] py-[0.75rem] text-right font-bold text-[1.125rem]">{d.delaiSemaines}</td>
                  <td className="px-[1rem] py-[0.75rem] text-left text-slate-600 font-semibold">SEMAINES</td>
                  <td className="px-[1.5rem] py-[0.75rem] text-center font-medium">{calculerDateLivraison(d.delaiSemaines, localDebut || undefined)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Début construction */}
        <div className="flex items-center gap-[0.75rem] text-[0.875rem]">
          <span className="text-slate-600">Début semaine de la construction:</span>
          <input type="date" value={localDebut} onChange={(e) => handleDebutChange(e.target.value)} className="px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-lg"/>
        </div>

        {/* Ruptures de stock */}
        {localRuptures.length > 0 && (
          <div>
            <h3 className="text-[1.5rem] font-bold text-center underline mb-[1rem]">Rupture de stock</h3>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-[0.875rem]">
                <tbody className="divide-y divide-slate-200">
                  {localRuptures.map((r) => (
                    <tr key={r.id}>
                      <td className="px-[1.5rem] py-[0.75rem] font-semibold">{r.piece}</td>
                      <td className="px-[1.5rem] py-[0.75rem] text-center">{r.couleur}</td>
                      <td className="px-[1.5rem] py-[0.75rem] text-center"><span className="bg-slate-100 px-[0.75rem] py-[0.25rem] rounded">{formaterDate(r.dateReception)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>)}

      {/* ===== FOURNISSEURS ===== */}
      {onglet === 'fournisseurs' && (<>
        <div className="flex items-center justify-between gap-[1rem] flex-wrap">
          <input type="text" value={rechercheFournisseur} onChange={(e) => setRechercheFournisseur(e.target.value)} className="px-[1rem] py-[0.5rem] border border-slate-300 rounded-lg w-full max-w-[25rem] text-[0.8125rem]" placeholder="Rechercher un fournisseur..."/>
          <button onClick={() => { setFournisseurEdition({ nom: '', contact: '', telephone: '', email: '', adresse: '', notes: '', typeAchat: '', formulaireFile: null, supprimerFormulaire: false }); setShowFournisseurForm(true); }} className="px-[1.25rem] py-[0.5rem] bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-semibold rounded-lg flex items-center gap-[0.375rem] shadow text-[0.875rem] whitespace-nowrap">+ Ajouter un fournisseur</button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[0.8125rem]">
              <thead className="bg-slate-800 text-black/50">
                <tr>
                  <th className="px-[1rem] py-[0.75rem] text-left">Fournisseur</th>
                  <th className="px-[1rem] py-[0.75rem] text-left hidden md:table-cell">Adresse</th>
                  <th className="px-[1rem] py-[0.75rem] text-center">Téléphone</th>
                  <th className="px-[1rem] py-[0.75rem] text-center hidden lg:table-cell">Contact</th>
                  <th className="px-[1rem] py-[0.75rem] text-center hidden lg:table-cell">Email</th>
                  <th className="px-[1rem] py-[0.75rem] text-center">Type d'achat</th>
                  <th className="px-[1rem] py-[0.75rem] text-center">Formulaire</th>
                  <th className="px-[1rem] py-[0.75rem] text-center w-[8rem]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fournisseurs.filter((f) => !rechercheFournisseur || f.nom.toLowerCase().includes(rechercheFournisseur.toLowerCase())).map((f, i) => (
                  <tr key={f.id} className={`hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-sky-50'}`}>
                    <td className="px-[1rem] py-[0.75rem] font-bold">{f.nom}</td>
                    <td className="px-[1rem] py-[0.75rem] text-[0.75rem] text-slate-600 hidden md:table-cell">{f.adresse || '—'}</td>
                    <td className="px-[1rem] py-[0.75rem] text-center">{f.telephone || '—'}</td>
                    <td className="px-[1rem] py-[0.75rem] text-center hidden lg:table-cell">{f.contact || '—'}</td>
                    <td className="px-[1rem] py-[0.75rem] text-center text-[0.75rem] hidden lg:table-cell">{f.email || '—'}</td>
                    <td className="px-[1rem] py-[0.75rem] text-center">{f.typeAchat || '—'}</td>
                    <td className="px-[1rem] py-[0.75rem] text-center">
                      {f.formulaireNom ? (
                        <a
                          href={`/api/achats/fournisseurs/${f.id}/formulaire`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline text-sm"
                        >
                          📎 {f.formulaireNom.length > 20 ? f.formulaireNom.substring(0, 20) + '…' : f.formulaireNom}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="px-[1rem] py-[0.75rem] text-center">
                      <div className="flex gap-[0.25rem] justify-center">
                        <button onClick={() => { setFournisseurEdition({ ...f, formulaireFile: null, supprimerFormulaire: false }); setShowFournisseurForm(true); }} className="px-[0.75rem] py-[0.25rem] bg-blue-500 text-white text-[0.75rem] rounded">Modifier</button>
                        <button onClick={() => setShowConfirmDelete(f.id)} className="px-[0.75rem] py-[0.25rem] bg-red-500 text-white text-[0.75rem] rounded">Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {fournisseurs.length === 0 && <div className="p-[3rem] text-center text-slate-400">Aucun fournisseur</div>}
        </div>
      </>)}
    </div>
  );
}