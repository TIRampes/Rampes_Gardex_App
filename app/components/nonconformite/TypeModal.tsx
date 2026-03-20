'use client';

import { useState, useEffect } from 'react';
import { X, Tag, List, Plus, Edit3, Trash2 } from 'lucide-react';

export default function TypeModal({ isOpen, onClose }) {
  const [types, setTypes] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formNom, setFormNom] = useState('');
  const [formDepartementId, setFormDepartementId] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [tRes, dRes] = await Promise.all([fetch('/api/types'), fetch('/api/departements')]);
      setTypes(await tRes.json());
      setDepartements(await dRes.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (isOpen) fetchAll(); }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formNom.trim() || !formDepartementId) return;

    const url = editing ? `/api/types/${editing.id}` : '/api/types';
    await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom: formNom, departementId: formDepartementId }),
    });

    setFormNom('');
    setFormDepartementId('');
    setEditing(null);
    fetchAll();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[250] p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95">
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between rounded-t-[2.5rem]">
          <div className="flex items-center gap-3">
            <Tag className="text-amber-500" size={24}/>
            <h2 className="text-xl font-black uppercase">Types de Non-Conformité</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="border border-slate-100 rounded-3xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-4 italic">Type de défaut</th>
                  <th className="px-6 py-4">Secteur / Dépt</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {types.map((type) => (
                  <tr key={type.id} className={`hover:bg-slate-50 ${deletingId === type.id ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 font-bold text-slate-700 uppercase tracking-tight">{type.nom}</td>
                    <td className="px-6 py-4"><span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold uppercase">{type.departement?.nom || '-'}</span></td>
                    <td className="px-6 py-4 text-right">
                      {deletingId === type.id ? (
                        <button onClick={async () => { await fetch(`/api/types/${type.id}`, {method: 'DELETE'}); setDeletingId(null); fetchAll(); }} className="text-red-500 font-black text-[10px] uppercase">Confirmer</button>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => {setEditing(type); setFormNom(type.nom); setFormDepartementId(type.departementId);}} className="text-slate-400 hover:text-amber-500"><Edit3 size={16}/></button>
                          <button onClick={() => setDeletingId(type.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 rounded-b-[2.5rem]">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input type="text" value={formNom} onChange={(e) => setFormNom(e.target.value)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold" placeholder="Nom du type..." required />
            <select value={formDepartementId} onChange={(e) => setFormDepartementId(e.target.value)} className="w-48 px-4 py-3 border border-slate-200 rounded-xl text-xs font-bold uppercase bg-white cursor-pointer" required>
              <option value="">Secteur</option>
              {departements.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
            </select>
            <button type="submit" className="bg-[#f59e0b] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-100">
               {editing ? 'Update' : 'Ajouter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}