'use client';

import { useState, useEffect } from 'react';
import NonConformiteList from '@/app/components/nonconformite/NonConformiteList';
import NonConformiteModal from '@/app/components/nonconformite/NonConformiteModal';
import NonConformiteDetailModal from '@/app/components/nonconformite/NonConformiteDetailModal';
import DepartementModal from '@/app/components/nonconformite/DepartementModal';
import TypeModal from '@/app/components/nonconformite/TypeModal';
import ResponsableModal from '@/app/components/nonconformite/ResponsableModal';
import { List, Users, Plus } from 'lucide-react';

export default function NonConformitesPage() {
  const [nonConformites, setNonConformites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNcModal, setShowNcModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showRespModal, setShowRespModal] = useState(false);
  const [editingNc, setEditingNc] = useState(null);
  const [selectedNc, setSelectedNc] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchNonConformites = async () => {
    setLoading(true);
    const res = await fetch('/api/non-conformites');
    const data = await res.json();
    setNonConformites(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchNonConformites();
  }, []);

  const handleAdd = () => {
    setEditingNc(null);
    setShowNcModal(true);
  };

  const handleEdit = (nc) => {
    setEditingNc(nc);
    setShowNcModal(true);
    setShowDetailModal(false);
  };

  const handleDelete = async (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette non-conformité ?')) {
      await fetch(`/api/non-conformites/${id}`, { method: 'DELETE' });
      if (selectedNc?.id === id) {
        setShowDetailModal(false);
        setSelectedNc(null);
      }
      fetchNonConformites();
    }
  };

  const handleRowClick = (nc) => {
    setSelectedNc(nc);
    setShowDetailModal(true);
  };

  const handleEditFromDetail = () => {
    setShowDetailModal(false);
    setEditingNc(selectedNc);
    setShowNcModal(true);
  };

  const handleSave = () => {
    setShowNcModal(false);
    setEditingNc(null);
    fetchNonConformites();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Non-Conformités</h1>
          <p className="text-slate-500 mt-1">Gestion des écarts et actions correctives</p>
        </div>

        {/* Boutons actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeptModal(true)}
            className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center gap-2"
          >
            <List size={18} /> Départements
          </button>

          <button
            onClick={() => setShowTypeModal(true)}
            className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center gap-2"
          >
            <List size={18} /> Types
          </button>

          <button
            onClick={() => setShowRespModal(true)}
            className="px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 flex items-center gap-2"
          >
            <Users size={18} /> Responsables
          </button>

          <button
            onClick={handleAdd}
            className="bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus size={20} /> Nouvelle non-conformité
          </button>
        </div>
      </div>

      {/* Liste */}
      <NonConformiteList
        data={nonConformites}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRowClick={handleRowClick}
      />

      {/* Modals */}
      {showNcModal && (
        <NonConformiteModal
          isOpen={showNcModal}
          onClose={() => setShowNcModal(false)}
          onSave={handleSave}
          nc={editingNc}
        />
      )}
      {showDeptModal && (
        <DepartementModal
          isOpen={showDeptModal}
          onClose={() => setShowDeptModal(false)}
        />
      )}
      {showTypeModal && (
        <TypeModal
          isOpen={showTypeModal}
          onClose={() => setShowTypeModal(false)}
        />
      )}
      {showRespModal && (
        <ResponsableModal
          isOpen={showRespModal}
          onClose={() => setShowRespModal(false)}
        />
      )}
      {showDetailModal && selectedNc && (
        <NonConformiteDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          nc={selectedNc}
          onEdit={handleEditFromDetail}
          onDelete={() => handleDelete(selectedNc.id)}
        />
      )}
    </div>
  );
}