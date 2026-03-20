'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Plus, Edit3, Trash2, AlertCircle } from 'lucide-react';

export default function ResponsableModal({ isOpen, onClose }) {
  const [responsables, setResponsables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formNom, setFormNom] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [deletingId, setDeletingId] = useState(null); // État pour la suppression

  const fetchResponsables = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/responsables');
      const data = await res.json();
      setResponsables(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (isOpen) fetchResponsables(); }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formNom.trim()) return;

    const method = editing ? 'PUT' : 'POST';
    const url = editing ? `/api/responsables/${editing.id}` : '/api/responsables';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom: formNom, email: formEmail || null }),
    });

    setFormNom('');
    setFormEmail('');
    setEditing(null);
    fetchResponsables();
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    await fetch(`/api/responsables/${deletingId}`, { method: 'DELETE' });
    setDeletingId(null);
    fetchResponsables();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[250] p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-xl text-white"><User size={20}/></div>
            <h2 className="text-xl font-black uppercase tracking-tight">Responsables NC</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            <div className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Responsable</th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">Email</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {responsables.map((resp) => (
                    <tr key={resp.id} className={`hover:bg-slate-50/50 transition-colors ${deletingId === resp.id ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 font-bold text-slate-800">{resp.nom}</td>
                      <td className="px-6 py-4 text-slate-500 font-medium italic">{resp.email || 'Pas d\'email'}</td>
                      <td className="px-6 py-4 text-right">
                        {deletingId === resp.id ? (
                          <div className="flex justify-end items-center gap-2 animate-in slide-in-from-right-2">
                             <button onClick={confirmDelete} className="text-[10px] font-black text-white bg-red-500 px-3 py-1.5 rounded-lg uppercase">Confirmer</button>
                             <button onClick={() => setDeletingId(null)} className="text-[10px] font-black text-slate-400 uppercase underline">Annuler</button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <button onClick={() => {setEditing(resp); setFormNom(resp.nom); setFormEmail(resp.email || '');}} className="p-2 text-slate-400 hover:text-amber-500 transition-colors"><Edit3 size={16} /></button>
                            <button onClick={() => setDeletingId(resp.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Form */}
        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <input type="text" value={formNom} onChange={(e) => setFormNom(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-bold" placeholder="Nom complet..." required />
            </div>
            <div className="md:col-span-2">
              <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-medium" placeholder="adresse@email.com" />
            </div>
            <button type="submit" className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${editing ? 'bg-amber-500 text-white' : 'bg-slate-900 text-white'}`}>
              {editing ? 'Update' : 'Ajouter'}
            </button>
          </form>
          {editing && <button onClick={() => {setEditing(null); setFormNom(''); setFormEmail('');}} className="mt-2 text-[10px] font-bold text-slate-400 uppercase underline">Annuler la modification</button>}
        </div>
      </div>
    </div>
  );
}