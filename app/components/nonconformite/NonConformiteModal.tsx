'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@/app/components/icons/Icon';

export default function NonConformiteModal({ isOpen, onClose, onSave, nc }) {
  const [form, setForm] = useState({
    noProjet: '',
    departementId: '',
    typeId: '',
    responsableId: '',
    description: '',
    dateDetection: new Date().toISOString().split('T')[0],
    envoiMail: false,
    mesureCorrective: '',
    correction: '',
    dateCorrection: '',
    confirmation: false,
  });
  const [departements, setDepartements] = useState([]);
  const [types, setTypes] = useState([]);
  const [responsables, setResponsables] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/departements').then(r => r.json()).then(setDepartements);
      fetch('/api/responsables').then(r => r.json()).then(setResponsables);
      if (nc) {
        setForm({
          noProjet: nc.noProjet || '',
          departementId: nc.departementId || '',
          typeId: nc.typeId || '',
          responsableId: nc.responsableId || '',
          description: nc.description || '',
          dateDetection: nc.dateDetection.split('T')[0] || new Date().toISOString().split('T')[0],
          envoiMail: nc.envoiMail || false,
          mesureCorrective: nc.mesureCorrective || '',
          correction: nc.correction || '',
          dateCorrection: nc.dateCorrection ? nc.dateCorrection.split('T')[0] : '',
          confirmation: nc.confirmation || false,
        });
        if (nc.departementId) loadTypes(nc.departementId);
      } else {
        setForm({
          noProjet: '',
          departementId: '',
          typeId: '',
          responsableId: '',
          description: '',
          dateDetection: new Date().toISOString().split('T')[0],
          envoiMail: false,
          mesureCorrective: '',
          correction: '',
          dateCorrection: '',
          confirmation: false,
        });
      }
    }
  }, [isOpen, nc]);

  const loadTypes = async (deptId) => {
    const res = await fetch(`/api/types?departementId=${deptId}`);
    const data = await res.json();
    setTypes(data);
  };

  const handleDepartementChange = (e) => {
    const deptId = e.target.value;
    setForm({ ...form, departementId: deptId, typeId: '' });
    if (deptId) loadTypes(deptId);
    else setTypes([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const method = nc ? 'PUT' : 'POST';
    const url = nc ? `/api/non-conformites/${nc.id}` : '/api/non-conformites';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    onSave();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200 bg-slate-800 text-white">
          <h2 className="text-xl font-bold">
            {nc ? 'Modifier la non-conformité' : 'Nouvelle non-conformité'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
              <input
                type="date"
                value={form.dateDetection}
                onChange={(e) => setForm({ ...form, dateDetection: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2"># Projet</label>
              <input
                type="text"
                value={form.noProjet}
                onChange={(e) => setForm({ ...form, noProjet: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                placeholder="Ex: 260002"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Département</label>
              <select
                value={form.departementId}
                onChange={handleDepartementChange}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white"
                required
              >
                <option value="">Sélectionner un département</option>
                {departements.map(d => (
                  <option key={d.id} value={d.id}>{d.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Non-conformité (type)</label>
              <select
                value={form.typeId}
                onChange={(e) => setForm({ ...form, typeId: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white"
                required
                disabled={!form.departementId}
              >
                <option value="">Sélectionner un type</option>
                {types.map(t => (
                  <option key={t.id} value={t.id}>{t.nom}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Responsable</label>
              <select
                value={form.responsableId}
                onChange={(e) => setForm({ ...form, responsableId: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white"
                required
              >
                <option value="">Sélectionner un responsable</option>
                {responsables.map(r => (
                  <option key={r.id} value={r.id}>{r.nom}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl resize-none"
                required
              />
            </div>
            {/* Champs supplémentaires optionnels */}
            <div className="col-span-2 border-t border-slate-200 pt-4">
              <h3 className="font-semibold text-slate-700 mb-3">Actions et suivi</h3>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.envoiMail}
                    onChange={(e) => setForm({ ...form, envoiMail: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm">Envoi mail effectué</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.confirmation}
                    onChange={(e) => setForm({ ...form, confirmation: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm">Confirmation</span>
                </label>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Mesure corrective</label>
                <input
                  type="text"
                  value={form.mesureCorrective}
                  onChange={(e) => setForm({ ...form, mesureCorrective: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="mt-3">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Correction apportée</label>
                <input
                  type="text"
                  value={form.correction}
                  onChange={(e) => setForm({ ...form, correction: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="mt-3">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Date de correction</label>
                <input
                  type="date"
                  value={form.dateCorrection}
                  onChange={(e) => setForm({ ...form, dateCorrection: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Sortir
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-semibold rounded-lg hover:shadow-lg disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : (nc ? 'Modifier' : 'Ajouter')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}