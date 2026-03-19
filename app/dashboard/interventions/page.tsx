'use client';

import { useState, useEffect, useRef } from 'react';
import { useInterventions } from '@/app/hooks/useInterventions';
import type { InterventionView, InterventionUpdate } from '@/app/api/interventions/schema';
import { getTypeConfig, getStatutConfig, formaterDate, formaterDateCourte } from '@/app/api/interventions/schema';

// ╔══════════════════════════════════════════════════════╗
// ║       PAGE INTERVENTIONS TERRAIN — RAMPES GARDEX       ║
// ╚══════════════════════════════════════════════════════╝

export default function InterventionsPage() {
  const { interventions, stats, loading, charger, sauvegarderFormulaire, completer, uploadPhoto, supprimerPhoto } = useInterventions();

  const [periode, setPeriode] = useState('toutes');
  const [filtreType, setFiltreType] = useState('');
  const [recherche, setRecherche] = useState('');

  // Modals
  const [selected, setSelected] = useState<InterventionView | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [showMap, setShowMap] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t); } }, [toast]);

  // Photo capture ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoType, setPhotoType] = useState<string>('AVANT');

  useEffect(() => { charger({ periode, type: filtreType, recherche }); }, [charger, periode, filtreType, recherche]);

  // === OUVRIR FORMULAIRE ===
  const ouvrirFormulaire = (inter: InterventionView) => {
    setSelected(inter);
    setFormData({
      heureArrivee: inter.heureArrivee || '', heureDepart: inter.heureDepart || '',
      personneRessource: inter.personneRessource || inter.clientNom, telephone: inter.telephone || inter.clientTelephone || '',
      // Installation
      accessibiliteBalcon: inter.accessibiliteBalcon, balconEncombre: inter.balconEncombre,
      niveauBalconConforme: inter.niveauBalconConforme, backingConforme: inter.backingConforme,
      colonneCapage: inter.colonneCapage, noteAvant: inter.noteAvant || '',
      travauxNonComplete: inter.travauxNonComplete, travauxNonCompleteNote: inter.travauxNonCompleteNote || '',
      mainsInstallees: inter.mainsInstallees, cacheVisInstallees: inter.cacheVisInstallees,
      capsulesPoteaux: inter.capsulesPoteaux, vuEnsemble: inter.vuEnsemble, noteApres: inter.noteApres || '',
      // Livraison
      materielComplet: inter.materielComplet, etatMateriel: inter.etatMateriel,
      quantiteConforme: inter.quantiteConforme, emplacementLivraison: inter.emplacementLivraison || '',
      accessibilite: inter.accessibilite, noteLivraison: inter.noteLivraison || '',
      // Cueillette
      materielIdentifie: inter.materielIdentifie, etatMaterielRecupere: inter.etatMaterielRecupere || '',
      quantiteRecuperee: inter.quantiteRecuperee || 0, emplacementCueillette: inter.emplacementCueillette || '',
      difficulteAcces: inter.difficulteAcces, noteCueillette: inter.noteCueillette || '',
      // Transport
      adresseDepart: inter.adresseDepart || inter.adresse, adresseArrivee: inter.adresseArrivee || '',
      vehiculeInspecte: inter.vehiculeInspecte, chargementSecurise: inter.chargementSecurise,
      documentationComplete: inter.documentationComplete,
      kmDepart: inter.kmDepart || '', kmArrivee: inter.kmArrivee || '',
      membresEquipe: Array.isArray(inter.membresEquipe) ? (inter.membresEquipe as string[]).join(', ') : '',
      materielTransporte: inter.materielTransporte || '', noteTransport: inter.noteTransport || '',
    });
    setShowForm(true);
  };

  // === SAUVEGARDER ===
  const handleSauvegarder = async (complete: boolean) => {
    if (!selected) return;
    try {
      const data: InterventionUpdate = {
        ...formData,
        statut: complete ? 'COMPLETEE' : 'EN_COURS',
        formulaireComplete: complete,
        kmDepart: formData.kmDepart ? parseInt(formData.kmDepart) : null,
        kmArrivee: formData.kmArrivee ? parseInt(formData.kmArrivee) : null,
        quantiteRecuperee: formData.quantiteRecuperee ? parseInt(formData.quantiteRecuperee) : null,
        membresEquipe: formData.membresEquipe ? formData.membresEquipe.split(',').map((s: string) => s.trim()).filter(Boolean) : null,
      };
      await sauvegarderFormulaire(selected.id, data);
      setToast({ message: complete ? 'Intervention complétée' : 'Brouillon sauvegardé', type: 'success' });
      setShowForm(false); setSelected(null);
      charger({ periode, type: filtreType, recherche });
    } catch (e: any) { setToast({ message: e.message, type: 'error' }); }
  };

  // === PHOTO CAPTURE ===
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selected || !e.target.files?.length) return;
    const file = e.target.files[0];
    try {
      await uploadPhoto(selected.id, file, photoType, '');
      setToast({ message: 'Photo uploadée', type: 'success' });
      charger({ periode, type: filtreType, recherche });
    } catch (err: any) { setToast({ message: err.message, type: 'error' }); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const prendrePhoto = (type: string) => {
    setPhotoType(type);
    fileInputRef.current?.click();
  };

  // === MAP URL ===
  const getMapUrl = (inter: InterventionView) => {
  const fullAddress = `${inter.adresse}${inter.clientVille ? ', ' + inter.clientVille : ''}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
};

  // === CHECKBOX GROUP ===
  const CB = ({ label, value, onChange, options = ['fait', 'na', 'oui', 'non'] }: { label: string; value: string | null; onChange: (v: string) => void; options?: string[] }) => (
    <div className="flex items-center justify-between py-[0.5rem] border-b border-slate-100">
      <span className="text-[0.8125rem] flex-1">{label}</span>
      <div className="flex items-center gap-[0.25rem]">
        {options.includes('fait') && <button onClick={() => onChange('fait')} className={`w-[2.5rem] h-[2rem] rounded text-[0.6875rem] font-semibold ${value === 'fait' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600'}`}>Fait</button>}
        {options.includes('na') && <button onClick={() => onChange('na')} className={`w-[2.5rem] h-[2rem] rounded text-[0.6875rem] font-semibold ${value === 'na' ? 'bg-slate-500 text-white' : 'bg-slate-100 text-slate-600'}`}>N/A</button>}
        {options.includes('oui') && <button onClick={() => onChange('oui')} className={`w-[2.5rem] h-[2rem] rounded text-[0.6875rem] font-semibold ${value === 'oui' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>Oui</button>}
        {options.includes('non') && <button onClick={() => onChange('non')} className={`w-[2.5rem] h-[2rem] rounded text-[0.6875rem] font-semibold ${value === 'non' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'}`}>Non</button>}
      </div>
    </div>
  );

  // ═══════════════════════════════════════
  // FORM MODAL (4 types in 1 modal, dynamic sections)
  // ═══════════════════════════════════════
  const FormModal = () => {
    if (!showForm || !selected) return null;
    const tc = getTypeConfig(selected.type);
    const f = formData; const set = (k: string, v: any) => setFormData({ ...f, [k]: v });

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[0.5rem] md:p-[1rem]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[42rem] max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header coloré par type */}
          <div className={`p-[1rem] ${tc.headerBg} text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[1.125rem] font-bold flex items-center gap-[0.5rem]">{tc.icone} {selected.type === 'INSTALLATION' ? 'Inspection Installation' : selected.type === 'LIVRAISON' ? 'Bon de Livraison' : selected.type === 'CUEILLETTE' ? 'Bon de Cueillette' : 'Feuille de Transport'} #{selected.commandeNumero}</h2>
                <p className="text-[0.8125rem] opacity-80">{selected.clientNom}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-[0.5rem] hover:bg-white/20 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-[1rem] md:p-[1.5rem] space-y-[1.25rem]">
            {/* Infos générales (commun à tous) */}
            <div className="bg-slate-50 rounded-xl p-[1rem]">
              <h3 className="font-semibold text-slate-800 mb-[0.75rem] text-[0.9375rem]">Informations du projet</h3>
              <div className="grid grid-cols-2 gap-[0.75rem]">
                <div><label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Personne ressource</label><input type="text" value={f.personneRessource || ''} onChange={(e) => set('personneRessource', e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem]"/></div>
                <div><label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Téléphone</label><input type="tel" value={f.telephone || ''} onChange={(e) => set('telephone', e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem]"/></div>
                <div><label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Heure arrivée</label><input type="time" value={f.heureArrivee || ''} onChange={(e) => set('heureArrivee', e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem]"/></div>
                <div><label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Heure départ</label><input type="time" value={f.heureDepart || ''} onChange={(e) => set('heureDepart', e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem]"/></div>
              </div>
            </div>

            {/* === SECTION INSTALLATION === */}
            {selected.type === 'INSTALLATION' && (<>
              <div className="bg-amber-50 rounded-xl p-[1rem] border border-amber-200">
                <h3 className="font-semibold text-amber-800 mb-[0.75rem] text-[0.9375rem]">⚠️ Inspection avant chantier</h3>
                <CB label="Accessibilité au balcon (Encombré)" value={f.accessibiliteBalcon} onChange={(v) => set('accessibiliteBalcon', v)}/>
                <CB label="Niveau du balcon conforme au plan" value={f.niveauBalconConforme} onChange={(v) => set('niveauBalconConforme', v)}/>
                <CB label="Backing conforme" value={f.backingConforme} onChange={(v) => set('backingConforme', v)}/>
                <CB label="Colonne capage fait" value={f.colonneCapage} onChange={(v) => set('colonneCapage', v)}/>
                <textarea value={f.noteAvant || ''} onChange={(e) => set('noteAvant', e.target.value)} className="w-full mt-[0.75rem] px-[0.75rem] py-[0.5rem] border border-amber-200 rounded-lg text-[0.8125rem] resize-none" rows={2} placeholder="Notes avant chantier..."/>
                <button onClick={() => prendrePhoto('AVANT')} className="mt-[0.75rem] flex items-center gap-[0.375rem] px-[1rem] py-[0.5rem] bg-amber-500 text-white rounded-lg text-[0.8125rem] font-medium">📷 Prendre photo (avant)</button>
              </div>
              <div className="bg-red-50 rounded-xl p-[1rem] border border-red-200">
                <label className="flex items-center gap-[0.75rem] cursor-pointer">
                  <input type="checkbox" checked={f.travauxNonComplete || false} onChange={(e) => set('travauxNonComplete', e.target.checked)} className="w-[1.25rem] h-[1.25rem] rounded"/>
                  <span className="font-semibold text-red-800">Travaux non complété</span>
                </label>
                {f.travauxNonComplete && <textarea value={f.travauxNonCompleteNote || ''} onChange={(e) => set('travauxNonCompleteNote', e.target.value)} className="w-full mt-[0.75rem] px-[0.75rem] py-[0.5rem] border border-red-200 rounded-lg text-[0.8125rem] resize-none" rows={2}/>}
              </div>
              <div className="bg-green-50 rounded-xl p-[1rem] border border-green-200">
                <h3 className="font-semibold text-green-800 mb-[0.75rem] text-[0.9375rem]">✓ Inspection fin de chantier</h3>
                <CB label="Mains installées" value={f.mainsInstallees} onChange={(v) => set('mainsInstallees', v)}/>
                <CB label="Cache-vis installés" value={f.cacheVisInstallees} onChange={(v) => set('cacheVisInstallees', v)}/>
                <CB label="Capsules sur les poteaux" value={f.capsulesPoteaux} onChange={(v) => set('capsulesPoteaux', v)}/>
                <CB label="Vue d'ensemble (niveau)" value={f.vuEnsemble} onChange={(v) => set('vuEnsemble', v)}/>
                <textarea value={f.noteApres || ''} onChange={(e) => set('noteApres', e.target.value)} className="w-full mt-[0.75rem] px-[0.75rem] py-[0.5rem] border border-green-200 rounded-lg text-[0.8125rem] resize-none" rows={2}/>
                <button onClick={() => prendrePhoto('APRES')} className="mt-[0.75rem] flex items-center gap-[0.375rem] px-[1rem] py-[0.5rem] bg-green-500 text-white rounded-lg text-[0.8125rem] font-medium">📷 PHOTOS global du projet</button>
              </div>
            </>)}

            {/* === SECTION LIVRAISON === */}
            {selected.type === 'LIVRAISON' && (<>
              <div className="bg-blue-50 rounded-xl p-[1rem] border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-[0.75rem] text-[0.9375rem]">📦 Vérification du matériel</h3>
                <CB label="Matériel complet selon bon de commande" value={f.materielComplet} onChange={(v) => set('materielComplet', v)} options={['oui', 'non']}/>
                <CB label="État du matériel (sans dommage)" value={f.etatMateriel} onChange={(v) => set('etatMateriel', v)} options={['oui', 'non']}/>
                <CB label="Quantité conforme" value={f.quantiteConforme} onChange={(v) => set('quantiteConforme', v)} options={['oui', 'non']}/>
                <CB label="Accessibilité du lieu" value={f.accessibilite} onChange={(v) => set('accessibilite', v)} options={['oui', 'non']}/>
              </div>
              <div className="bg-slate-50 rounded-xl p-[1rem]">
                <h3 className="font-semibold text-slate-800 mb-[0.75rem] text-[0.9375rem]">Détails de la livraison</h3>
                <div><label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Emplacement de dépose</label><input type="text" value={f.emplacementLivraison || ''} onChange={(e) => set('emplacementLivraison', e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem]" placeholder="Ex: Garage, entrée principale..."/></div>
                <div className="mt-[0.75rem]"><label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Notes / Remarques</label><textarea value={f.noteLivraison || ''} onChange={(e) => set('noteLivraison', e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem] resize-none" rows={3}/></div>
                <button onClick={() => prendrePhoto('PREUVE')} className="mt-[0.75rem] flex items-center gap-[0.375rem] px-[1rem] py-[0.5rem] bg-blue-500 text-white rounded-lg text-[0.8125rem] font-medium">📷 Photo preuve de livraison</button>
              </div>
            </>)}

            {/* === SECTION CUEILLETTE === */}
            {selected.type === 'CUEILLETTE' && (<>
              <div className="bg-yellow-50 rounded-xl p-[1rem] border border-yellow-200">
                <h3 className="font-semibold text-yellow-800 mb-[0.75rem] text-[0.9375rem]">📦 Matériel à récupérer</h3>
                <CB label="Matériel correctement identifié" value={f.materielIdentifie} onChange={(v) => set('materielIdentifie', v)} options={['oui', 'non']}/>
                <CB label="Difficulté d'accès" value={f.difficulteAcces} onChange={(v) => set('difficulteAcces', v)} options={['oui', 'non']}/>
                <div className="mt-[0.75rem] grid grid-cols-2 gap-[0.75rem]">
                  <div><label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Quantité récupérée</label><input type="number" value={f.quantiteRecuperee || ''} onChange={(e) => set('quantiteRecuperee', e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem]"/></div>
                  <div><label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Emplacement</label><input type="text" value={f.emplacementCueillette || ''} onChange={(e) => set('emplacementCueillette', e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem]"/></div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-[1rem]">
                <h3 className="font-semibold text-slate-800 mb-[0.75rem] text-[0.9375rem]">État du matériel récupéré</h3>
                <select value={f.etatMaterielRecupere || ''} onChange={(e) => set('etatMaterielRecupere', e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem] bg-white">
                  <option value="">Sélectionner l&apos;état</option>
                  <option value="excellent">Excellent — Comme neuf</option><option value="bon">Bon — Usure normale</option>
                  <option value="acceptable">Acceptable — Dommages mineurs</option><option value="mauvais">Mauvais — Dommages importants</option>
                  <option value="inutilisable">Inutilisable — À jeter</option>
                </select>
                <textarea value={f.noteCueillette || ''} onChange={(e) => set('noteCueillette', e.target.value)} className="w-full mt-[0.75rem] px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem] resize-none" rows={3}/>
                <div className="flex gap-[0.5rem] mt-[0.75rem]">
                  <button onClick={() => prendrePhoto('AVANT')} className="flex items-center gap-[0.375rem] px-[1rem] py-[0.5rem] bg-yellow-500 text-yellow-900 rounded-lg text-[0.8125rem] font-medium">📷 Photo AVANT</button>
                  <button onClick={() => prendrePhoto('APRES')} className="flex items-center gap-[0.375rem] px-[1rem] py-[0.5rem] bg-yellow-500 text-yellow-900 rounded-lg text-[0.8125rem] font-medium">📷 Photo APRÈS</button>
                </div>
              </div>
            </>)}

            {/* === SECTION TRANSPORT === */}
            {selected.type === 'TRANSPORT' && (<>
              <div className="bg-green-50 rounded-xl p-[1rem] border border-green-200">
                <h3 className="font-semibold text-green-800 mb-[0.75rem] text-[0.9375rem]">🗺️ Informations du trajet</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[0.75rem]">
                  <div className="col-span-1 md:col-span-2"><label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Adresse de départ</label><input type="text" value={f.adresseDepart || ''} onChange={(e) => set('adresseDepart', e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem]"/></div>
                  <div className="col-span-1 md:col-span-2"><label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Adresse d&apos;arrivée</label><input type="text" value={f.adresseArrivee || ''} onChange={(e) => set('adresseArrivee', e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem]"/></div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-[1rem]">
                <h3 className="font-semibold text-slate-800 mb-[0.75rem] text-[0.9375rem]">Kilométrage</h3>
                <div className="grid grid-cols-2 gap-[0.75rem]">
                  <div><label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">KM au départ</label><input type="number" value={f.kmDepart || ''} onChange={(e) => set('kmDepart', e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem]" placeholder="Ex: 45230"/></div>
                  <div><label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">KM à l&apos;arrivée</label><input type="number" value={f.kmArrivee || ''} onChange={(e) => set('kmArrivee', e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem]" placeholder="Ex: 45280"/></div>
                </div>
                {f.kmDepart && f.kmArrivee && <div className="mt-[0.75rem] p-[0.75rem] bg-green-100 rounded-lg text-[0.8125rem] text-green-800">Distance parcourue: <strong>{parseInt(f.kmArrivee) - parseInt(f.kmDepart)} km</strong></div>}
              </div>
              <div className="bg-slate-50 rounded-xl p-[1rem]">
                <h3 className="font-semibold text-slate-800 mb-[0.75rem] text-[0.9375rem]">Vérifications</h3>
                <CB label="Véhicule inspecté" value={f.vehiculeInspecte} onChange={(v) => set('vehiculeInspecte', v)} options={['oui', 'non']}/>
                <CB label="Chargement sécurisé" value={f.chargementSecurise} onChange={(v) => set('chargementSecurise', v)} options={['oui', 'non', 'na']}/>
                <CB label="Documentation complète" value={f.documentationComplete} onChange={(v) => set('documentationComplete', v)} options={['oui', 'non']}/>
              </div>
              <div className="bg-slate-50 rounded-xl p-[1rem]">
                <div><label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Membres de l&apos;équipe</label><input type="text" value={f.membresEquipe || ''} onChange={(e) => set('membresEquipe', e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem]" placeholder="Noms séparés par des virgules"/></div>
                <div className="mt-[0.75rem]"><label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Matériel transporté</label><textarea value={f.materielTransporte || ''} onChange={(e) => set('materielTransporte', e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem] resize-none" rows={2}/></div>
                <div className="mt-[0.75rem]"><label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Notes</label><textarea value={f.noteTransport || ''} onChange={(e) => set('noteTransport', e.target.value)} className="w-full px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-lg text-[0.8125rem] resize-none" rows={2}/></div>
              </div>
            </>)}

            {/* Signatures (commun) */}
            <div className="bg-slate-50 rounded-xl p-[1rem]">
              <h3 className="font-semibold text-slate-800 mb-[0.75rem] text-[0.9375rem]">Signatures</h3>
              <div className="grid grid-cols-2 gap-[0.75rem]">
                <div><label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">{selected.type === 'TRANSPORT' ? 'Signature Chauffeur' : selected.type === 'INSTALLATION' ? 'Signature Installateur' : 'Signature Livreur'}</label>
                  <div className="h-[6rem] border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-white cursor-pointer hover:border-slate-400"><span className="text-[0.8125rem] text-slate-400">Touchez pour signer</span></div></div>
                {selected.type !== 'TRANSPORT' && <div><label className="block text-[0.6875rem] text-slate-500 mb-[0.25rem]">Signature Client</label>
                  <div className="h-[6rem] border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-white cursor-pointer hover:border-slate-400"><span className="text-[0.8125rem] text-slate-400">Touchez pour signer</span></div></div>}
              </div>
            </div>

            {/* Photos existantes */}
            {selected.photos.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-[1rem]">
                <h3 className="font-semibold text-slate-800 mb-[0.75rem] text-[0.9375rem]">📷 Photos ({selected.photos.length})</h3>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-[0.5rem]">
                  {selected.photos.map((p) => (
                    <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200">
                      <img src={p.url} alt={p.description || 'Photo'} className="w-full h-full object-cover"/>
                      <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[0.625rem] px-[0.25rem] py-[0.125rem] text-center">{p.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-[1rem] border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <button onClick={() => setShowForm(false)} className="px-[1rem] py-[0.5rem] text-slate-600 hover:bg-slate-100 rounded-lg text-[0.875rem]">Annuler</button>
            <div className="flex gap-[0.5rem]">
              <button onClick={() => handleSauvegarder(false)} className="px-[1rem] py-[0.5rem] border border-slate-300 rounded-lg flex items-center gap-[0.375rem] text-[0.875rem]">💾 Brouillon</button>
              <button onClick={() => handleSauvegarder(true)} className={`px-[1.5rem] py-[0.5rem] ${tc.headerBg} hover:opacity-90 text-white font-medium rounded-lg flex items-center gap-[0.375rem] text-[0.875rem]`}>✓ Terminer</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════
  // DETAIL MODAL
  // ═══════════════════════════════════════
  const DetailModal = () => {
    if (!showDetail || !selected) return null;
    const tc = getTypeConfig(selected.type); const sc = getStatutConfig(selected.statut);
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[0.5rem] md:p-[1rem]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[48rem] max-h-[90vh] overflow-hidden flex flex-col">
          <div className={`p-[1rem] ${tc.headerBg} text-white flex items-center justify-between rounded-t-2xl`}>
            <div><h2 className="text-[1.125rem] font-bold">#{selected.commandeNumero} — {tc.label}</h2><p className="text-[0.8125rem] opacity-80">{selected.clientNom} • {selected.clientVille}</p></div>
            <button onClick={() => setShowDetail(false)} className="p-[0.5rem] hover:bg-white/20 rounded-lg"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg></button>
          </div>
          <div className="flex-1 overflow-y-auto p-[1.5rem] space-y-[1rem]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[0.75rem]">
              <div className="bg-slate-50 rounded-xl p-[0.75rem]"><p className="text-[0.6875rem] text-slate-500">Statut</p><span className={`px-[0.5rem] py-[0.125rem] rounded-full text-[0.75rem] font-semibold ${sc.couleur}`}>{sc.label}</span></div>
              <div className="bg-slate-50 rounded-xl p-[0.75rem]"><p className="text-[0.6875rem] text-slate-500">Date</p><p className="font-semibold text-[0.875rem]">{formaterDateCourte(selected.datePrevue)}</p></div>
              <div className="bg-slate-50 rounded-xl p-[0.75rem]"><p className="text-[0.6875rem] text-slate-500">Équipe</p><p className="font-semibold text-[0.875rem]">{selected.equipeNom || '—'}</p></div>
              <div className="bg-slate-50 rounded-xl p-[0.75rem]"><p className="text-[0.6875rem] text-slate-500">Formulaire</p><p className="font-semibold text-[0.875rem]">{selected.formulaireComplete ? '✓ Complété' : '— Non'}</p></div>
            </div>
            <div className="bg-slate-50 rounded-xl p-[0.75rem]"><p className="text-[0.6875rem] text-slate-500">Adresse</p><p className="font-medium">{selected.adresse}</p></div>
            {/* Photos */}
            {selected.photos.length > 0 && (
              <div><h3 className="font-bold text-slate-800 mb-[0.5rem] text-[0.9375rem]">📷 Photos ({selected.photos.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[0.5rem]">
                  {selected.photos.map((p) => (
                    <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:ring-2 hover:ring-blue-400">
                      <img src={p.url} alt={p.description || ''} className="w-full h-full object-cover"/>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[0.625rem] px-[0.375rem] py-[0.25rem] flex justify-between">
                        <span>{p.type}</span><span>{formaterDateCourte(p.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selected.notes && <div className="bg-amber-50 rounded-xl p-[1rem] border border-amber-200"><p className="text-[0.8125rem] text-slate-700 whitespace-pre-line">{selected.notes}</p></div>}
          </div>
          <div className="p-[1rem] border-t bg-slate-50 flex items-center justify-between flex-wrap gap-[0.5rem]">
            <div className="flex gap-[0.5rem]">
              <button onClick={() => { setShowDetail(false); ouvrirFormulaire(selected); }} className={`px-[1rem] py-[0.5rem] ${tc.headerBg} text-white rounded-lg text-[0.875rem]`}>📋 Formulaire</button>
              <button onClick={() => prendrePhoto('AUTRE')} className="px-[1rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.875rem]">📷 Photo</button>
              <a href={getMapUrl(selected)} target="_blank" rel="noopener noreferrer" className="px-[1rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.875rem] inline-flex items-center gap-[0.25rem]">🗺️ Navigation</a>
            </div>
            <button onClick={() => setShowDetail(false)} className="px-[1rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.875rem]">Fermer</button>
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
      <FormModal/><DetailModal/>
      {/* Hidden file input for camera */}
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoCapture}/>

      {toast && <div className={`fixed bottom-[1rem] right-[1rem] z-[70] px-[1rem] py-[0.75rem] rounded-lg shadow-lg text-white text-[0.875rem] font-medium ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{toast.type === 'success' ? '✓' : '✕'} {toast.message}</div>}

      {/* Header + Stats */}
      <div className="flex flex-wrap items-center justify-between gap-[1rem]">
        <div><h1 className="text-[1.875rem] font-bold text-slate-800">Interventions Terrain</h1><p className="text-slate-500 mt-[0.25rem] text-[0.875rem]">Suivi des interventions et compte-rendus</p></div>
        <div className="flex items-center gap-[1rem] bg-white px-[1.5rem] py-[0.75rem] rounded-2xl border border-slate-200 shadow-sm flex-wrap">
          <div className="text-center"><p className="text-[1.5rem] font-bold text-slate-800">{stats?.total || 0}</p><p className="text-[0.6875rem] text-slate-500">Total</p></div>
          <div className="w-px h-[2.5rem] bg-slate-200 hidden md:block"/>
          <div className="text-center"><p className="text-[1.5rem] font-bold text-red-600">{stats?.installations || 0}</p><p className="text-[0.6875rem] text-slate-500">Install.</p></div>
          <div className="text-center"><p className="text-[1.5rem] font-bold text-blue-600">{stats?.livraisons || 0}</p><p className="text-[0.6875rem] text-slate-500">Livr.</p></div>
          <div className="text-center"><p className="text-[1.5rem] font-bold text-yellow-600">{stats?.cueillettes || 0}</p><p className="text-[0.6875rem] text-slate-500">Cueil.</p></div>
          <div className="text-center"><p className="text-[1.5rem] font-bold text-green-600">{stats?.transports || 0}</p><p className="text-[0.6875rem] text-slate-500">Transp.</p></div>
          <div className="w-px h-[2.5rem] bg-slate-200 hidden md:block"/>
          <div className="text-center"><p className="text-[1.5rem] font-bold text-purple-600">{stats?.heuresEstimees || 0}h</p><p className="text-[0.6875rem] text-slate-500">Estimé</p></div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-[1rem]">
        <div className="flex bg-slate-100 p-[0.25rem] rounded-xl">
          {['aujourdhui', 'semaine', 'toutes'].map((p) => (
            <button key={p} onClick={() => setPeriode(p)} className={`px-[1rem] py-[0.5rem] rounded-lg font-medium text-[0.8125rem] transition-all ${periode === p ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600'}`}>
              {p === 'aujourdhui' ? "Aujourd'hui" : p === 'semaine' ? 'Cette semaine' : 'Toutes'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-[0.5rem] flex-wrap">
          <button onClick={() => setFiltreType('')} className={`px-[0.75rem] py-[0.375rem] rounded-lg text-[0.8125rem] font-medium ${filtreType === '' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200'}`}>Tous</button>
          <button onClick={() => setFiltreType('INSTALLATION')} className={`px-[0.75rem] py-[0.375rem] rounded-lg text-[0.8125rem] font-medium flex items-center gap-[0.25rem] ${filtreType === 'INSTALLATION' ? 'bg-red-500 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>🔧 Installation</button>
          <button onClick={() => setFiltreType('LIVRAISON')} className={`px-[0.75rem] py-[0.375rem] rounded-lg text-[0.8125rem] font-medium flex items-center gap-[0.25rem] ${filtreType === 'LIVRAISON' ? 'bg-blue-500 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>🚚 Livraison</button>
          <button onClick={() => setFiltreType('CUEILLETTE')} className={`px-[0.75rem] py-[0.375rem] rounded-lg text-[0.8125rem] font-medium flex items-center gap-[0.25rem] ${filtreType === 'CUEILLETTE' ? 'bg-yellow-500 text-yellow-900' : 'bg-white border border-slate-200 text-slate-700'}`}>📦 Cueillette</button>
          <button onClick={() => setFiltreType('TRANSPORT')} className={`px-[0.75rem] py-[0.375rem] rounded-lg text-[0.8125rem] font-medium flex items-center gap-[0.25rem] ${filtreType === 'TRANSPORT' ? 'bg-green-500 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>🚛 Transport</button>
        </div>
        <input type="text" value={recherche} onChange={(e) => setRecherche(e.target.value)} className="px-[0.75rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.8125rem] w-full md:w-auto md:min-w-[12rem]" placeholder="Rechercher..."/>
      </div>

      {/* Liste */}
      {loading ? <div className="text-center py-[3rem] text-slate-500">Chargement...</div> : interventions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-[3rem] text-center"><span className="text-[3rem]">📅</span><p className="text-slate-500 mt-[1rem]">Aucune intervention prévue pour cette période</p></div>
      ) : (
        <div className="space-y-[1rem]">
          {interventions.map((inter) => {
            const tc = getTypeConfig(inter.type);
            return (
              <div key={inter.id} className={`bg-white rounded-2xl border-l-4 ${tc.border} border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden`}>
                <div className="p-[1.25rem]">
                  <div className="flex items-start justify-between gap-[1rem] flex-wrap">
                    <div className="flex-1 min-w-[15rem]" onClick={() => { setSelected(inter); setShowDetail(true); }}>
                      <div className="flex items-center gap-[0.75rem] mb-[0.5rem] flex-wrap">
                        <span className="font-mono font-bold text-[1.25rem] text-slate-800">{inter.commandeNumero}</span>
                        <span className={`px-[0.75rem] py-[0.25rem] rounded-full text-[0.75rem] font-bold ${tc.couleur}`}>{tc.label}</span>
                        {inter.formulaireComplete && <span className="px-[0.5rem] py-[0.25rem] bg-emerald-100 text-emerald-700 rounded text-[0.6875rem] flex items-center gap-[0.25rem]">✓ Formulaire complété</span>}
                        {inter.photos.length > 0 && <span className="px-[0.5rem] py-[0.25rem] bg-blue-100 text-blue-700 rounded text-[0.6875rem]">📷 {inter.photos.length}</span>}
                      </div>
                      <p className="text-[1.0625rem] font-semibold text-slate-800">{inter.clientNom}</p>
                      <p className="text-[0.8125rem] text-slate-500 mt-[0.25rem] flex items-center gap-[0.25rem]">📍 {inter.adresse}</p>
                      <div className="flex items-center gap-[1.5rem] mt-[0.75rem] text-[0.8125rem] flex-wrap">
                        <span className="flex items-center gap-[0.25rem] text-slate-600">📅 {formaterDateCourte(inter.datePrevue)}</span>
                        {inter.heureDebut && <span className="flex items-center gap-[0.25rem] text-slate-600">🕐 {inter.heureDebut}{inter.heureFin ? `–${inter.heureFin}` : ''}</span>}
                        <span className="flex items-center gap-[0.25rem] text-slate-600">⏱️ {inter.tempsEstimeInstallation || 1}h</span>
                        {inter.equipeNom && <span className={`px-[0.5rem] py-[0.125rem] rounded text-[0.6875rem] font-semibold text-white ${inter.equipeCouleur || 'bg-slate-500'}`}>{inter.equipeNom}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-[0.5rem]">
                      <button onClick={() => ouvrirFormulaire(inter)} className={`px-[1rem] py-[0.625rem] text-white font-medium rounded-xl flex items-center gap-[0.375rem] text-[0.8125rem] ${tc.headerBg} hover:opacity-90`}>
                        📋 {inter.type === 'INSTALLATION' ? 'Inspection' : inter.type === 'LIVRAISON' ? 'Bon livraison' : inter.type === 'CUEILLETTE' ? 'Bon cueillette' : 'Feuille transport'}
                      </button>
                      <button onClick={() => { setSelected(inter); prendrePhoto('AUTRE'); }} className="px-[1rem] py-[0.625rem] border border-slate-300 hover:bg-slate-50 rounded-xl flex items-center gap-[0.375rem] text-slate-700 text-[0.8125rem]">📷 Photos</button>
                      <a href={getMapUrl(inter)} target="_blank" rel="noopener noreferrer" className="px-[1rem] py-[0.625rem] border border-slate-300 hover:bg-slate-50 rounded-xl flex items-center gap-[0.375rem] text-slate-700 text-[0.8125rem]">🗺️ Navigation</a>
                    </div>
                  </div>
                </div>
                {inter.type === 'INSTALLATION' && (
                  <div className="px-[1.25rem] py-[0.75rem] bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-wrap gap-[0.5rem]">
                    <div className="flex items-center gap-[1rem] text-[0.75rem]">
                      <span className={`px-[0.5rem] py-[0.25rem] rounded ${inter.mesure === 'COMPLETE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>Mesure {inter.mesure === 'COMPLETE' ? '✓' : '—'}</span>
                      <span className={`px-[0.5rem] py-[0.25rem] rounded ${inter.plan === 'COMPLETE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>Plan {inter.plan === 'COMPLETE' ? '✓' : '—'}</span>
                      <span className={`px-[0.5rem] py-[0.25rem] rounded ${inter.productionTerminee === 'COMPLETE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>Production {inter.productionTerminee === 'COMPLETE' ? '✓' : '—'}</span>
                    </div>
                    <span className="text-[0.75rem] text-slate-500">Couleur: <strong>{inter.couleur || '—'}</strong></span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}