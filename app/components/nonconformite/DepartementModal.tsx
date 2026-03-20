'use client';

import { useState, useEffect } from 'react';
import { X, Building2, Edit3, Trash2, Check, RotateCcw } from 'lucide-react';

export default function DepartementModal({ isOpen, onClose }) {
  const [departements, setDepartements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formNom, setFormNom] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchDepartements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/departements');
      setDepartements(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (isOpen) fetchDepartements(); }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formNom.trim()) return;

    await fetch(editing ? `/api/departements/${editing.id}` : '/api/departements', {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom: formNom }),
    });

    setFormNom('');
    setEditing(null);
    fetchDepartements();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[250] p-4 font-sans">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95">
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-xl"><Building2 size={20}/></div>
            <h2 className="text-lg font-black uppercase tracking-widest">Départements</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors"><X /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
           <div className="space-y-2">
             {departements.map((dept) => (
               <div key={dept.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${deletingId === dept.id ? 'border-red-200 bg-red-50' : 'border-slate-50 bg-white hover:border-slate-200 shadow-sm'}`}>
                 <span className="font-bold text-slate-700 text-sm uppercase">{dept.nom}</span>
                 
                 <div className="flex gap-1">
                    {deletingId === dept.id ? (
                      <div className="flex items-center gap-3">
                        <button onClick={async () => { await fetch(`/api/departements/${dept.id}`, {method: 'DELETE'}); setDeletingId(null); fetchDepartements(); }} className="p-2 bg-red-500 text-white rounded-lg shadow-md"><Check size={16}/></button>
                        <button onClick={() => setDeletingId(null)} className="p-2 bg-slate-200 text-slate-500 rounded-lg"><RotateCcw size={16}/></button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => {setEditing(dept); setFormNom(dept.nom);}} className="p-2 text-slate-300 hover:text-amber-500 transition-colors"><Edit3 size={16}/></button>
                        <button onClick={() => setDeletingId(dept.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                      </>
                    )}
                 </div>
               </div>
             ))}
           </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
           <form onSubmit={handleSubmit} className="flex gap-3">
             <input type="text" value={formNom} onChange={(e) => setFormNom(e.target.value)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:border-[#f59e0b] focus:ring-0 text-sm font-bold placeholder:font-medium" placeholder="Ajouter un secteur..." required />
             <button type="submit" className="px-6 py-3 bg-[#f59e0b] text-white rounded-xl font-black text-[10px] uppercase tracking-[0.1em] hover:shadow-xl shadow-amber-200 transition-all active:scale-95">
                {editing ? 'Update' : 'Ajouter'}
             </button>
           </form>
           {editing && <button onClick={() => {setEditing(null); setFormNom('');}} className="mt-3 text-[10px] font-black text-slate-400 uppercase tracking-widest underline block mx-auto">Annuler édition</button>}
        </div>
      </div>
    </div>
  );
}