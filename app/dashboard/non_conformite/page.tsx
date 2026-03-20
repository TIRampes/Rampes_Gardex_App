'use client';

import { useState, useEffect, useCallback } from 'react';
import NonConformiteList from '@/app/components/nonconformite/NonConformiteList';
import NonConformiteModal from '@/app/components/nonconformite/NonConformiteModal';
import NonConformiteDetailModal from '@/app/components/nonconformite/NonConformiteDetailModal';
import DepartementModal from '@/app/components/nonconformite/DepartementModal';
import TypeModal from '@/app/components/nonconformite/TypeModal';
import ResponsableModal from '@/app/components/nonconformite/ResponsableModal';
import { 
  Plus, CheckCircle2, AlertTriangle, BarChart3, X, Info, 
  TrendingUp, Calendar, ShieldAlert, Users, List, LayoutDashboard,
  ArrowRight, Search
} from 'lucide-react';

export default function NonConformitesPage() {
  const [nonConformites, setNonConformites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [toast, setToast] = useState(null);

  // États des Modals
  const [activeModal, setActiveModal] = useState(null); // 'nc' | 'dept' | 'type' | 'resp' | 'detail' | 'stats'
  const [editingNc, setEditingNc] = useState(null);
  const [selectedNc, setSelectedNc] = useState(null);
  const [ncToDelete, setNcToDelete] = useState(null);

  // === Système de Toast ===
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // === Rafraîchissement des données ===
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
      showToast("Échec de la synchronisation", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  // === CRUD Actions ===
  const confirmDelete = async () => {
    if (!ncToDelete) return;
    try {
      const res = await fetch(`/api/non-conformites/${ncToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Dossier supprimé définitivement", "success");
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
    showToast("Enregistrement réussi", "success");
    refreshAll();
  };

  const totalOuvertes = stats.reduce((acc, c) => acc + c.ouvertes, 0);
  const alertesCritiques = stats.filter(r => r.ouvertes >= 3).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 space-y-8 antialiased">
      
      {/* 🟢 TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-8 right-8 z-[200] animate-in slide-in-from-right duration-300">
          <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border bg-white ${
            toast.type === 'success' ? 'border-emerald-100' : 'border-red-100'
          }`}>
            <div className={`p-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
              {toast.type === 'success' ? <CheckCircle2 size={18} className="text-white"/> : <ShieldAlert size={18} className="text-white"/>}
            </div>
            <p className="font-bold text-slate-800 text-sm">{toast.message}</p>
            <button onClick={() => setToast(null)} className="ml-4 text-slate-400"><X size={16}/></button>
          </div>
        </div>
      )}

      {/* 🔴 MODALE SUPPRESSION */}
      {ncToDelete && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500">
              <AlertTriangle size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black">Confirmer la suppression ?</h3>
              <p className="text-slate-500 text-sm mt-2">Cette action supprimera toutes les données du dossier de manière irréversible.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setNcToDelete(null)} className="flex-1 px-6 py-3 rounded-xl border border-slate-200 font-bold hover:bg-slate-50">Annuler</button>
              <button onClick={confirmDelete} className="flex-1 px-6 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-100">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* 📊 MODALE DASHBOARD ANALYTIQUE (Le visuel de tes stats) */}
      {activeModal === 'stats' && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 md:p-10 animate-in zoom-in-95 duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500 rounded-2xl text-white shadow-lg shadow-amber-200">
                  <LayoutDashboard size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-800">Analytique Qualité</h2>
                  <p className="text-slate-500 text-sm font-medium">Suivi de performance par responsable</p>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-3 hover:bg-slate-200 rounded-full transition-colors"><X /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10">
              {/* KPIs de la modale */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-2">Total Dossiers</p>
                  <div className="text-4xl font-black text-slate-800">{nonConformites.length}</div>
                </div>
                <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                  <p className="text-red-400 font-bold text-[10px] uppercase tracking-widest mb-2">Saturation Critique</p>
                  <div className="text-4xl font-black text-red-600">{alertesCritiques}</div>
                </div>
                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                  <p className="text-amber-400 font-bold text-[10px] uppercase tracking-widest mb-2">Ouvertes (Moyenne)</p>
                  <div className="text-4xl font-black text-amber-600">{(totalOuvertes / (stats.length || 1)).toFixed(1)}</div>
                </div>
              </div>

              {/* Graphique de charge par responsable */}
              <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                   <Users className="text-amber-500" size={20}/> Répartition de la charge opérationnelle
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  {stats.map((r) => (
                    <div key={r.id} className="group p-6 rounded-3xl border border-slate-100 hover:border-amber-200 transition-all bg-white shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <div className="font-bold text-slate-700 text-lg flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${r.ouvertes >= 3 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                          {r.nom}
                        </div>
                        <div className="flex gap-4">
                           <div className="text-center">
                              <p className="text-[10px] text-slate-400 uppercase font-black">Semaine</p>
                              <p className="font-bold text-slate-800">{r.cetteSemaine}</p>
                           </div>
                           <div className="text-center border-l border-slate-100 pl-4">
                              <p className="text-[10px] text-slate-400 uppercase font-black">Année</p>
                              <p className="font-bold text-slate-800">{r.cetteAnnee}</p>
                           </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-400 uppercase">Progression saturation</span>
                          <span className={r.ouvertes >= 3 ? "text-red-500" : "text-emerald-500"}>{r.ouvertes} NC actives</span>
                        </div>
                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={`h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(0,0,0,0.1)] ${r.ouvertes >= 3 ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-amber-400 to-yellow-500'}`}
                            style={{ width: `${Math.min((r.ouvertes / 5) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
               <button onClick={() => setActiveModal(null)} className="bg-slate-900 text-white px-10 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all">Fermer le Dashboard</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <div className="flex items-center gap-3">
             <div className="h-10 w-2 bg-amber-500 rounded-full" />
             <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Non-Conformités</h1>
          </div>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em] mt-2 ml-5">Système de Management de la Qualité Gardex</p>
        </div>

        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 flex flex-1 xl:flex-none">
            <button onClick={() => setActiveModal('dept')} className="flex-1 px-4 py-2 hover:bg-slate-50 rounded-xl text-[11px] font-black text-slate-500 uppercase">DÉPARTEMENTS</button>
            <button onClick={() => setActiveModal('resp')} className="flex-1 px-4 py-2 hover:bg-slate-50 rounded-xl text-[11px] font-black text-slate-500 uppercase border-l border-slate-100">RESPONSABLES</button>
          </div>
          
          {/* 🔘 BOUTON DASHBOARD ANALYTIQUE */}
          <button
            onClick={() => setActiveModal('stats')}
            className="bg-white border-2 border-amber-500 text-amber-600 font-black px-6 py-3 rounded-2xl flex items-center gap-3 hover:bg-amber-50 transition-all shadow-lg shadow-amber-100 relative group overflow-hidden"
          >
            <BarChart3 size={20} className="group-hover:scale-110 transition-transform" />
            <span>STATS & PERFORMANCE</span>
            {alertesCritiques > 0 && <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-ping" />}
          </button>

          <button
            onClick={() => { setEditingNc(null); setActiveModal('nc'); }}
            className="bg-slate-900 text-white font-black px-6 py-3 rounded-2xl uppercase flex items-center gap-3 shadow-xl hover:bg-slate-800 transition-all active:scale-95"
          >
            <Plus size={22} /> nouvelle non-conformité
          </button>
        </div>
      </div>

      {/* REGISTRE LIST SECTION */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden transition-all hover:shadow-2xl">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
           <div className="flex items-center gap-4 text-slate-400">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><List size={18}/></div>
              <h3 className="font-black uppercase tracking-widest text-sm">Registre des signalements</h3>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Ouvertes</span>
                <span className="font-black text-slate-900 leading-tight">{totalOuvertes}</span>
              </div>
              <div className="h-8 w-px bg-slate-100" />
              <div className="flex flex-col text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Vigilance</span>
                <span className="font-black text-red-500 leading-tight">{alertesCritiques}</span>
              </div>
           </div>
        </div>
        
        {/* Ton composant de liste utilisant désormais notre Delete Modal au lieu du confirm browser */}
        <NonConformiteList
          data={nonConformites}
          loading={loading}
          onEdit={(nc) => { setEditingNc(nc); setActiveModal('nc'); }}
          onDelete={(id) => setNcToDelete(id)}
          onRowClick={(nc) => { setSelectedNc(nc); setActiveModal('detail'); }}
        />
      </div>

      {/* RENDER DES MODALES SECONDAIRES */}
      {activeModal === 'nc' && (
        <NonConformiteModal isOpen={true} onClose={() => setActiveModal(null)} onSave={handleSave} nc={editingNc} />
      )}
      {activeModal === 'dept' && <DepartementModal isOpen={true} onClose={() => setActiveModal(null)} />}
      {activeModal === 'type' && <TypeModal isOpen={true} onClose={() => setActiveModal(null)} />}
      {activeModal === 'resp' && <ResponsableModal isOpen={true} onClose={() => setActiveModal(null)} />}
      {activeModal === 'detail' && selectedNc && (
        <NonConformiteDetailModal
          isOpen={true} onClose={() => setActiveModal(null)} nc={selectedNc}
          onEdit={() => { setEditingNc(selectedNc); setActiveModal('nc'); }}
          onDelete={() => setNcToDelete(selectedNc.id)}
        />
      )}

    </div>
  );
}