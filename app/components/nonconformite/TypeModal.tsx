'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@/app/components/icons/Icon';

interface Departement {
  id: string;
  nom: string;
}

interface Type {
  id: string;
  nom: string;
  departementId: string;
  departement?: Departement;
}

export default function TypeModal({ isOpen, onClose }) {
  const [types, setTypes] = useState<Type[]>([]);
  const [departements, setDepartements] = useState<Departement[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Type | null>(null);
  const [formNom, setFormNom] = useState('');
  const [formDepartementId, setFormDepartementId] = useState('');

  const fetchTypes = async () => {
    setLoading(true);
    const res = await fetch('/api/types');
    const data = await res.json();
    setTypes(data);
    setLoading(false);
  };

  const fetchDepartements = async () => {
    const res = await fetch('/api/departements');
    const data = await res.json();
    setDepartements(data);
  };

  useEffect(() => {
    if (isOpen) {
      fetchTypes();
      fetchDepartements();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNom.trim() || !formDepartementId) return;

    if (editing) {
      await fetch(`/api/types/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: formNom, departementId: formDepartementId }),
      });
    } else {
      await fetch('/api/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: formNom, departementId: formDepartementId }),
      });
    }
    setFormNom('');
    setFormDepartementId('');
    setEditing(null);
    fetchTypes();
  };

  const handleEdit = (type: Type) => {
    setEditing(type);
    setFormNom(type.nom);
    setFormDepartementId(type.departementId);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce type ?')) return;
    await fetch(`/api/types/${id}`, { method: 'DELETE' });
    fetchTypes();
  };

  const handleCancel = () => {
    setEditing(null);
    setFormNom('');
    setFormDepartementId('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-800 text-white flex items-center justify-between">
          <h2 className="text-xl font-bold">Gestion des types de non-conformité</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg">
            <Icon name="x" size={24} />
          </button>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : (
            <div className="space-y-4">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Type</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Département</th>
                    <th className="px-4 py-2 text-center w-32">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {types.map((type) => (
                    <tr key={type.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{type.nom}</td>
                      <td className="px-4 py-3">{type.departement?.nom || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEdit(type)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Modifier"
                          >
                            <Icon name="edit" size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(type.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Supprimer"
                          >
                            <Icon name="x" size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {types.length === 0 && (
                <p className="text-center text-slate-500 py-4">Aucun type</p>
              )}
            </div>
          )}
        </div>

        {/* Formulaire d'ajout/édition */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                {editing ? 'Modifier le type' : 'Nouveau type'}
              </label>
              <input
                type="text"
                value={formNom}
                onChange={(e) => setFormNom(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-400"
                placeholder="Nom du type"
                required
              />
            </div>
            <div className="w-64">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Département</label>
              <select
                value={formDepartementId}
                onChange={(e) => setFormDepartementId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white"
                required
              >
                <option value="">Sélectionner</option>
                {departements.map(d => (
                  <option key={d.id} value={d.id}>{d.nom}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              {editing && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100"
                >
                  Annuler
                </button>
              )}
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-semibold rounded-lg hover:shadow-md"
              >
                {editing ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}