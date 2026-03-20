'use client';

import { useState, useEffect, useCallback } from 'react';
import NonConformiteList from '@/app/components/nonconformite/NonConformiteList';
import NonConformiteModal from '@/app/components/nonconformite/NonConformiteModal';
import NonConformiteDetailModal from '@/app/components/nonconformite/NonConformiteDetailModal';
import DepartementModal from '@/app/components/nonconformite/DepartementModal';
import TypeModal from '@/app/components/nonconformite/TypeModal';
import ResponsableModal from '@/app/components/nonconformite/ResponsableModal';
import { 
  Plus, CheckCircle2, AlertTriangle, BarChart3, X, 
  ShieldAlert, List, LayoutDashboard, Settings2, Users, Database
} from 'lucide-react';

export default function NonConformitesPage() {
  const [nonConformites, setNonConformites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [toast, setToast] = useState(null);

  // États des Modals
  const [activeModal, setActiveModal] = useState(null); 
  const [editingNc, setEditingNc] = useState(null);
  const [selectedNc, setSelectedNc] = useState(null);
  const [ncToDelete, setNcToDelete] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ncRes, statsRes] = await Promise.all([
        fetch('/api/non-conformites'),
        fetch('/api/non-conformites/stats')
      ]);
      setNonConformites(await ncRes.json());
      setStats(await statsRes.json());
    } catch (error) {
      showToast("Erreur de synchronisation", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  const confirmDelete = async () => {
    if (!ncToDelete) return;
    try {
      const res = await fetch(`/api/non-conformites/${ncToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Signalement supprimé avec succès", "success");
        setNcToDelete(null);
        refreshAll();
      }
    } catch {
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const handleSave = () => {
    setActiveModal(null);
    setEditingNc(null);
    showToast("Action effectuée avec succès", "success");
    refreshAll();
  };

  const totalOuvertes = stats.reduce((acc, c) => acc + c.ouvertes, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 space-y-8 antialiased">
      
      {/* 🟢 TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-8 right-8 z-[250] animate-in slide-in-from-right duration-300">
          <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border bg-white ${
            toast.type === 'success' ? 'border-emerald-100' : 'border-red-100'
          }`}>
            <div className={`p-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
              {toast.type === 'success' ? <CheckCircle2 size={18} className="text-white"/> : <ShieldAlert size={18} className="text-white"/>}
            </div>
            <p className="font-bold text-slate-800 text-sm">{toast.message}</p>
            <button onClick={() => setToast(null)} className="ml-4 text-slate-300"><X size={16}/></button>
          </div>
        </div>
      )}

      {/* ⚠️ MODALE DE CONFIRMATION (Dossiers NC) */}
      {ncToDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-black">Supprimer définitivement ?</h3>
            <div className="flex gap-3">
              <button onClick={() => setNcToDelete(null)} className="flex-1 px-6 py-3 rounded-xl border border-slate-200 font-bold hover:bg-slate-50">Annuler</button>
              <button onClick={confirmDelete} className="flex-1 px-6 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-100">Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
           <div className="flex items-center gap-3">
              <div className="w-2 h-10 bg-[#f59e0b] rounded-full" />
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Non-Conformités</h1>
           </div>
           <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em] ml-5 mt-2 font-mono italic">Processus Qualité & Standard Gardex</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Bloc de configuration (Dépt, Type, Responsables) */}
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex items-center flex-1 xl:flex-none">
             <button onClick={() => setActiveModal('dept')} className="flex-1 px-4 py-2 hover:bg-slate-50 rounded-xl text-[10px] font-black text-slate-500 uppercase transition-all tracking-wider">Départements</button>
             <button onClick={() => setActiveModal('type')} className="flex-1 px-4 py-2 hover:bg-slate-50 rounded-xl text-[10px] font-black text-slate-500 uppercase border-l border-slate-100 transition-all tracking-wider">Types</button>
             <button onClick={() => setActiveModal('resp')} className="flex-1 px-4 py-2 hover:bg-slate-50 rounded-xl text-[10px] font-black text-slate-500 uppercase border-l border-slate-100 transition-all tracking-wider">Responsables</button>
          </div>
          
          <button
            onClick={() => setActiveModal('stats')}
            className="bg-white border-2 border-[#f59e0b] text-[#f59e0b] font-black px-6 py-3 rounded-2xl flex items-center gap-3 hover:bg-[#fefce8] transition-all shadow-sm active:scale-95"
          >
            <BarChart3 size={20} />
            <span className="text-xs uppercase tracking-widest">Analytics</span>
          </button>

          {/* BOUTON GARDEX JAUNE */}
          <button
            onClick={() => { setEditingNc(null); setActiveModal('nc'); }}
            className="bg-[#f59e0b] text-slate-950 font-black px-8 py-3.5 rounded-2xl uppercase flex items-center gap-3 shadow-[0_8px_20px_-4px_rgba(245,158,11,0.4)] hover:shadow-[0_12px_25px_-4px_rgba(245,158,11,0.5)] hover:-translate-y-0.5 transition-all active:scale-95 text-sm tracking-tight"
          >
            <Plus size={20} strokeWidth={3} />
            Nouvelle non-conformité
          </button>
        </div>
      </div>

      {/* DASHBOARD STATS (Vérification charge de travail) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col justify-center relative overflow-hidden shadow-2xl">
            <ShieldAlert className="absolute right-[-10px] bottom-[-10px] opacity-10" size={150}/>
            <p className="text-amber-400 font-black text-xs uppercase tracking-[0.2em] mb-2">Vigilance Système</p>
            <div className="text-5xl font-black">{stats.filter(r => r.ouvertes >= 3).length}</div>
            <p className="text-slate-400 text-xs mt-2 uppercase font-bold tracking-tighter">Responsables en surcharge</p>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
           <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Users size={16}/> Saturation par responsable</h2>
              <span className="text-[9px] bg-slate-100 px-3 py-1 rounded-full font-black text-slate-500 uppercase tracking-tighter italic">Seuil alerte: 3+</span>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              {stats.slice(0, 4).map(r => (
                <div key={r.id} className="space-y-2 group">
                   <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight">
                      <span className="text-slate-600">{r.nom}</span>
                      <span className={r.ouvertes >= 3 ? "text-red-500 font-black" : "text-slate-400"}>{r.ouvertes} Dossiers</span>
                   </div>
                   <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${r.ouvertes >= 3 ? 'bg-red-500' : 'bg-[#f59e0b]'}`}
                        style={{ width: `${Math.min((r.ouvertes / 4) * 100, 100)}%` }}
                      />
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* TABLEAU LISTE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <NonConformiteList
          data={nonConformites}
          loading={loading}
          onEdit={(nc) => { setEditingNc(nc); setActiveModal('nc'); }}
          onDelete={(id) => setNcToDelete(id)}
          onRowClick={(nc) => { setSelectedNc(nc); setActiveModal('detail'); }}
        />
      </div>

      {/* RENDER MODALS */}
      {activeModal === 'nc' && (
        <NonConformiteModal isOpen={true} onClose={() => setActiveModal(null)} onSave={handleSave} nc={editingNc} />
      )}
      {activeModal === 'dept' && <DepartementModal isOpen={true} onClose={() => setActiveModal(null)} />}
      
      {/* 🔴 MODALE TYPES RÉTABLIE */}
      {activeModal === 'type' && <TypeModal isOpen={true} onClose={() => setActiveModal(null)} />}
      
      {activeModal === 'resp' && <ResponsableModal isOpen={true} onClose={() => setActiveModal(null)} />}
      
      {activeModal === 'detail' && selectedNc && (
        <NonConformiteDetailModal
          isOpen={true} onClose={() => setActiveModal(null)} nc={selectedNc}
          onEdit={() => { setEditingNc(selectedNc); setActiveModal('nc'); }}
          onDelete={() => setNcToDelete(selectedNc.id)}
        />
      )}

      {activeModal === 'stats' && (
        /* Un dashboard plus complet si nécessaire */
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
           <div className="bg-white w-full max-w-4xl rounded-[3rem] p-10 relative overflow-hidden">
              <button onClick={() => setActiveModal(null)} className="absolute right-8 top-8 p-2 bg-slate-100 rounded-full"><X/></button>
              <h2 className="text-3xl font-black mb-8 flex items-center gap-4"><BarChart3 size={32} className="text-amber-500"/> Performances Qualité</h2>
              <div className="grid grid-cols-1 gap-6 max-h-[60vh] overflow-y-auto pr-4">
                 {stats.map(r => (
                   <div key={r.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                      <div className="font-black text-slate-800 text-lg">{r.nom}</div>
                      <div className="flex gap-8">
                         <div className="text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cette Semaine</p><p className="font-black text-xl">{r.cetteSemaine}</p></div>
                         <div className="text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mois</p><p className="font-black text-xl">{r.ceMois}</p></div>
                         <div className="text-center"><p className="text-[10px] font-black text-[#f59e0b] uppercase tracking-widest">Année</p><p className="font-black text-xl text-[#f59e0b]">{r.cetteAnnee}</p></div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

    </div>
  );
}