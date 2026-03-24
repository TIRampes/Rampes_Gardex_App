'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2, Settings, RotateCcw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAUTS: Record<string, string> = {
  facteur_barrotin: '1.25', facteur_verre: '1', facteur_mur: '4',
  facteur_main_double: '2.25', facteur_gardex_vision: '1',
  facteur_gardex_urbaine: '2', facteur_gardex_optimum: '0.75',
  coutHeureInstallation: '160', facteurTempsInstallation: '0.7',
};

const LABELS: Record<string, string> = {
  facteur_barrotin: 'Barrotin', facteur_verre: 'Verre', facteur_mur: 'Mur / Intimité',
  facteur_main_double: 'Main double', facteur_gardex_vision: 'Gardex Vision',
  facteur_gardex_urbaine: 'Gardex Urbaine', facteur_gardex_optimum: 'Gardex Optimum',
  coutHeureInstallation: "Coût horaire installation ($)", facteurTempsInstallation: "Facteur temps installation",
};

export default function ParametresModal({ isOpen, onClose }: Props) {
  const [parametres, setParametres] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMessage(null);
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/parametres');
        if (res.ok) {
          const data = await res.json();
          const values: Record<string, string> = {};
          for (const [cle, info] of Object.entries(data)) values[cle] = (info as any).valeur;
          for (const [cle, def] of Object.entries(DEFAUTS)) if (!values[cle]) values[cle] = def;
          setParametres(values);
        } else setParametres({ ...DEFAUTS });
      } catch { setParametres({ ...DEFAUTS }); }
      finally { setLoading(false); }
    })();
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true); setMessage(null);
    try {
      const res = await fetch('/api/parametres', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parametres) });
      if (res.ok) { setMessage({ type: 'success', text: 'Paramètres sauvegardés' }); setTimeout(() => onClose(), 1200); }
      else { const d = await res.json(); setMessage({ type: 'error', text: d.error || 'Erreur' }); }
    } catch { setMessage({ type: 'error', text: 'Erreur réseau' }); }
    finally { setSaving(false); }
  };

  if (!isOpen) return null;

  const facteurKeys = Object.keys(DEFAUTS).filter(k => k.startsWith('facteur_'));
  const autresKeys = Object.keys(DEFAUTS).filter(k => !k.startsWith('facteur_'));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-800 rounded-xl flex items-center justify-center">
              <Settings size={20} className="text-amber-700 dark:text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Paramètres</h2>
              <p className="text-xs text-gray-500">Facteurs de calcul et coûts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-amber-500" /></div>
          ) : (
            <>
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Facteurs pieds linéaires</h3>
              <p className="text-xs text-gray-500 mb-3">Multiplicateurs appliqués aux pieds linéaires de chaque type.</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {facteurKeys.map(cle => (
                  <div key={cle} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <label className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">{LABELS[cle]}</label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">×</span>
                      <input type="number" step="0.01" min="0" value={parametres[cle] || ''} onChange={(e) => { setParametres(p => ({ ...p, [cle]: e.target.value })); setMessage(null); }} className="w-16 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-right font-mono" />
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Calcul temps d&apos;installation</h3>
              <p className="text-xs text-gray-500 mb-3">Formule: (Prix installation ÷ Coût horaire) × Facteur temps</p>
              <div className="space-y-2">
                {autresKeys.map(cle => (
                  <div key={cle} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{LABELS[cle]}</label>
                    <input type="number" step={cle === 'coutHeureInstallation' ? '1' : '0.01'} min="0" value={parametres[cle] || ''} onChange={(e) => { setParametres(p => ({ ...p, [cle]: e.target.value })); setMessage(null); }} className="w-20 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-right font-mono" />
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-xs text-blue-700 dark:text-blue-300">
                <p className="font-semibold mb-1">Exemple:</p>
                <p>10 pi Barrotin × {parametres.facteur_barrotin || '1.25'} + 5 pi Verre × {parametres.facteur_verre || '1'} = <strong>{Math.round(10 * parseFloat(parametres.facteur_barrotin || '1.25') + 5 * parseFloat(parametres.facteur_verre || '1'))} pi total</strong></p>
              </div>
            </>
          )}
        </div>

        {message && (
          <div className={`mx-4 mb-2 p-2 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{message.text}</div>
        )}

        <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button type="button" onClick={() => { setParametres({ ...DEFAUTS }); setMessage(null); }} className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm"><RotateCcw size={14} /> Défauts</button>
          <div className="flex-1" />
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">Annuler</button>
          <button type="button" onClick={handleSave} disabled={saving || loading} className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}