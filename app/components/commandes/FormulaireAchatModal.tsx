// ╔══════════════════════════════════════════════════════════╗
// ║  FICHIER: components/FormulaireAchatModal.tsx             ║
// ║  NOUVEAU — modal formulaire fournisseur dynamique         ║
// ╚══════════════════════════════════════════════════════════╝

'use client';

import { useState, useEffect } from 'react';
import { X, Download, Send, Plus, Trash2, Loader2, Mail, AlertTriangle } from 'lucide-react';
import type { TypeAchatConfig, Fournisseur, ChampFormulaire } from '@/lib/fournisseurs-config';

interface FormulaireAchatModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TypeAchatConfig;
  commandeNumero: string;
  phaseName?: string;
}

export default function FormulaireAchatModal({
  isOpen, onClose, config, commandeNumero, phaseName,
}: FormulaireAchatModalProps) {
  const [fournisseurActif, setFournisseurActif] = useState<Fournisseur>(config.fournisseurs[0]);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [lignes, setLignes] = useState<Record<string, any>[]>([{}]);
  const [emailCustom, setEmailCustom] = useState('');
  const [sending, setSending] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reset form quand on change de fournisseur ou qu'on ouvre
  useEffect(() => {
    if (isOpen) {
      setFormValues({ noCommande: commandeNumero, dateCommande: new Date().toISOString().split('T')[0], po: commandeNumero, date: new Date().toISOString().split('T')[0] });
      setLignes([{}]);
      setMessage(null);
      setFournisseurActif(config.fournisseurs[0]);
    }
  }, [isOpen, config, commandeNumero]);

  if (!isOpen) return null;

  const form = config.formulaire;
  const hasLignes = !!form.lignes;
  const maxLignes = form.maxLignes || 20;
  const emailFournisseur = emailCustom || fournisseurActif.email;

  const updateField = (key: string, value: any) => setFormValues(prev => ({ ...prev, [key]: value }));
  const updateLigne = (idx: number, key: string, value: any) => setLignes(prev => prev.map((l, i) => i === idx ? { ...l, [key]: value } : l));
  const addLigne = () => { if (lignes.length < maxLignes) setLignes(prev => [...prev, {}]); };
  const removeLigne = (idx: number) => setLignes(prev => prev.filter((_, i) => i !== idx));

  const getWidthClass = (w?: string) => {
    if (w === 'full') return 'col-span-2 lg:col-span-4';
    if (w === 'third') return 'col-span-1';
    return 'col-span-1 lg:col-span-2';
  };

  // Télécharger le formulaire en PDF
  const handleDownload = async () => {
    setDownloading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/commandes/achats/formulaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typeAchat: config.id,
          fournisseur: fournisseurActif,
          formValues, lignes, commandeNumero, phaseName,
        }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Commande_${config.label}_${commandeNumero}${phaseName ? `_${phaseName}` : ''}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage({ type: 'success', text: 'Formulaire téléchargé' });
      } else {
        setMessage({ type: 'error', text: 'Erreur lors du téléchargement' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau' });
    }
    setDownloading(false);
  };

  // Envoyer par email via Microsoft Graph
  const handleSendEmail = async () => {
    if (!emailFournisseur) { setMessage({ type: 'error', text: "Aucune adresse email fournisseur. Ajoutez-en une." }); return; }
    setSending(true);
    setMessage(null);
    try {
      const res = await fetch('/api/commandes/achats/envoyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typeAchat: config.id,
          fournisseur: { ...fournisseurActif, email: emailFournisseur },
          formValues, lignes, commandeNumero, phaseName,
        }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `Formulaire envoyé à ${emailFournisseur}` });
        // Sauvegarder l'email si nouveau
        if (emailCustom && emailCustom !== fournisseurActif.email) {
          await fetch('/api/fournisseurs/email', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fournisseurId: fournisseurActif.id, email: emailCustom }),
          });
        }
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Erreur lors de l\'envoi' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau' });
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[0.5rem] overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-[56rem] max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-[1rem] border-b border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900">
          <div>
            <h2 className="text-[1.125rem] font-bold text-gray-900 dark:text-white">{form.titre}</h2>
            <p className="text-[0.75rem] text-gray-500">{commandeNumero}{phaseName ? ` — ${phaseName}` : ''}</p>
          </div>
          <button onClick={onClose} className="p-[0.375rem] hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"><X size={20} /></button>
        </div>

        {/* Sélecteur fournisseur (si plusieurs) */}
        {config.fournisseurs.length > 1 && (
          <div className="px-[1rem] pt-[0.75rem]">
            <label className="block text-[0.75rem] font-medium text-gray-600 mb-[0.375rem]">Fournisseur</label>
            <div className="flex gap-[0.5rem]">
              {config.fournisseurs.map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => { setFournisseurActif(f); setEmailCustom(''); }}
                  className={`px-[0.875rem] py-[0.5rem] rounded-lg text-[0.8125rem] font-medium transition-colors ${
                    fournisseurActif.id === f.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {f.nom}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Info fournisseur */}
        <div className="px-[1rem] pt-[0.5rem]">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-[0.625rem] text-[0.75rem] text-blue-800 dark:text-blue-300">
            <span className="font-semibold">{fournisseurActif.nom}</span>
            {fournisseurActif.adresse && <span> — {fournisseurActif.adresse}</span>}
            {fournisseurActif.email && <span> — 📧 {fournisseurActif.email}</span>}
          </div>
        </div>

        {/* Formulaire scroll */}
        <div className="flex-1 overflow-y-auto p-[1rem]">
          {/* Champs en-tête */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-[0.625rem]">
            {form.champsEntete.map(champ => (
              <div key={champ.key} className={getWidthClass(champ.width)}>
                <label className="block text-[0.75rem] font-medium text-gray-600 dark:text-gray-400 mb-[0.25rem]">{champ.label}{champ.required ? ' *' : ''}</label>
                {champ.type === 'select' ? (
                  <select value={formValues[champ.key] || ''} onChange={e => updateField(champ.key, e.target.value)} className="w-full px-[0.625rem] py-[0.5rem] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-[0.8125rem]">
                    {champ.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : champ.type === 'textarea' ? (
                  <textarea value={formValues[champ.key] || ''} onChange={e => updateField(champ.key, e.target.value)} rows={2} placeholder={champ.placeholder} className="w-full px-[0.625rem] py-[0.5rem] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-[0.8125rem] resize-none" />
                ) : (
                  <input type={champ.type} value={formValues[champ.key] || ''} onChange={e => updateField(champ.key, champ.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)} placeholder={champ.placeholder} className="w-full px-[0.625rem] py-[0.5rem] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-[0.8125rem]" />
                )}
              </div>
            ))}
          </div>

          {/* Lignes du formulaire (grille) */}
          {hasLignes && form.lignes && (
            <div className="mt-[1rem]">
              <div className="flex items-center justify-between mb-[0.5rem]">
                <h4 className="text-[0.8125rem] font-semibold text-gray-700 dark:text-gray-300">Détails ({lignes.length}/{maxLignes})</h4>
                <button type="button" onClick={addLigne} disabled={lignes.length >= maxLignes} className="flex items-center gap-[0.25rem] px-[0.5rem] py-[0.25rem] bg-blue-100 text-blue-700 rounded-lg text-[0.75rem] disabled:opacity-40">
                  <Plus size={14} /> Ligne
                </button>
              </div>

              {/* En-tête colonnes */}
              <div className="grid gap-[0.25rem] mb-[0.25rem]" style={{ gridTemplateColumns: `${form.lignes.colonnes.map(c => c.width || '1fr').join(' ')} 32px` }}>
                {form.lignes.colonnes.map(col => (
                  <div key={col.key} className="text-[0.625rem] font-semibold text-gray-500 uppercase px-[0.25rem]">{col.label}</div>
                ))}
                <div />
              </div>

              {/* Lignes */}
              {lignes.map((ligne, idx) => (
                <div key={idx} className="grid gap-[0.25rem] mb-[0.25rem]" style={{ gridTemplateColumns: `${form.lignes!.colonnes.map(c => c.width || '1fr').join(' ')} 32px` }}>
                  {form.lignes!.colonnes.map(col => (
                    <input
                      key={col.key}
                      type={col.type}
                      value={ligne[col.key] || ''}
                      onChange={e => updateLigne(idx, col.key, col.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                      className="px-[0.375rem] py-[0.375rem] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-[0.8125rem]"
                    />
                  ))}
                  <button type="button" onClick={() => removeLigne(idx)} className="p-[0.25rem] text-red-400 hover:text-red-600" title="Supprimer">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email fournisseur */}
        <div className="px-[1rem] pb-[0.5rem]">
          <div className="flex items-center gap-[0.5rem]">
            <Mail size={16} className="text-gray-400" />
            <label className="text-[0.75rem] font-medium text-gray-600">Email fournisseur :</label>
            <input
              type="email"
              value={emailCustom || fournisseurActif.email}
              onChange={e => setEmailCustom(e.target.value)}
              placeholder="Ajouter ou modifier l'email"
              className="flex-1 px-[0.625rem] py-[0.375rem] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-[0.8125rem]"
            />
            {!fournisseurActif.email && !emailCustom && (
              <span className="flex items-center gap-[0.25rem] text-[0.6875rem] text-amber-600">
                <AlertTriangle size={12} /> Requis pour envoyer
              </span>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mx-[1rem] mb-[0.5rem] p-[0.5rem] rounded-lg text-[0.8125rem] ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-[0.5rem] p-[1rem] border-t border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900">
          <button type="button" onClick={onClose} className="px-[1rem] py-[0.625rem] bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-[0.875rem] font-medium">
            Fermer
          </button>
          <button type="button" onClick={handleDownload} disabled={downloading} className="flex-1 flex items-center justify-center gap-[0.375rem] px-[1rem] py-[0.625rem] bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[0.875rem] font-medium disabled:opacity-50">
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Télécharger PDF
          </button>
          <button type="button" onClick={handleSendEmail} disabled={sending || (!emailFournisseur)} className="flex-1 flex items-center justify-center gap-[0.375rem] px-[1rem] py-[0.625rem] bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[0.875rem] font-medium disabled:opacity-50">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Envoyer par courriel
          </button>
        </div>
      </div>
    </div>
  );
}