"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Save, Loader2, X, Search, 
  DollarSign, Percent, Calendar, User,
  FileText, AlertCircle, CheckCircle, Home,
  ChevronDown
} from "lucide-react";

interface Commande {
  id: string;
  numero: string;
  client: {
    id: string;
    nom: string;
  };
  montantTotal: number;
  dateEntree: string;
}

interface Representant {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
}

// Types de déficiences
const TYPES_DEFICIENCE = [
  { value: "MESURES", label: "Déf: Mesures" },
  { value: "VENTES", label: "Déf: Ventes" },
  { value: "FABRICATION", label: "Déf: Fabrication" },
  { value: "FOURNISSEUR", label: "Déf: Fournisseur" },
  { value: "INSTALLATION", label: "Déf: Installation" },
  { value: "PRODUCTION", label: "Déf: Production" },
  { value: "LIVRAISON", label: "Déf: Livraison" },
  { value: "CLIENT", label: "Déf: Client" },
  { value: "MULTIPLE", label: "Déf: 2/+ déficiences" },
  { value: "PRODUIT", label: "Déf: Produit" },
  { value: "AUTRE", label: "Autre" },
];

// Secteurs (basés sur les images)
const SECTEURS_DEFICIENCE = [
  { value: "ANNULE_REPRESENTANT", label: "Annulé par le représentant" },
  { value: "SAUTE_ERREUR", label: "sauté/erreur" },
  { value: "SERVICE_APRES_VENTE", label: "Service après vente" },
  { value: "DEMANDE_PRISE_MESURES", label: "Demande prise mesures" },
];

export default function NouvelleCommissionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingCommandes, setLoadingCommandes] = useState(false);
  const [loadingRepresentants, setLoadingRepresentants] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<{field: string; message: string} | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // États pour les données
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [representants, setRepresentants] = useState<Representant[]>([]);
  const [searchCommande, setSearchCommande] = useState("");
  const [showCommandesList, setShowCommandesList] = useState(false);
  const [showSecteursMenu, setShowSecteursMenu] = useState(false);
  
  // État du formulaire
  const [formData, setFormData] = useState({
    commandeId: "",
    commandeNumero: "",
    clientNom: "",
    representantId: "",
    montantSoumission: 0,
    pourcentage: 5,
    montantCommission: 0,
    dateSoumission: new Date().toISOString().split('T')[0],
    depotGarantie: 0,
    numeroFacture: "",
    typeCommission: "SOUMISSION" as "SOUMISSION" | "VENTE" | "INSTALLATION",
    typeDeficience: "",
    secteurDeficience: "",
    motifDeficience: "",
    notes: "",
  });

  // Charger les données au montage
  useEffect(() => {
    fetchCommandes();
    fetchRepresentants();
  }, []);

  // Recalculer la commission quand le montant ou le pourcentage change
  useEffect(() => {
    const montant = formData.montantSoumission || 0;
    const pourcentage = formData.pourcentage || 0;
    const commission = (montant * pourcentage) / 100;
    setFormData(prev => ({ ...prev, montantCommission: commission }));
  }, [formData.montantSoumission, formData.pourcentage]);

  const fetchCommandes = async () => {
    try {
      setLoadingCommandes(true);
      setFetchError(null);
      console.log("🔄 Chargement des commandes...");
      
      const res = await fetch("/api/commandes?limit=100");
      console.log("📡 Statut réponse:", res.status);
      
      if (!res.ok) {
        throw new Error(`Erreur HTTP: ${res.status}`);
      }
      
      const data = await res.json();
      console.log("📦 Données reçues:", data);
      
      // Extraire les commandes quel que soit le format
      let commandesArray: Commande[] = [];
      
      if (Array.isArray(data)) {
        commandesArray = data;
      } else if (data?.data && Array.isArray(data.data)) {
        commandesArray = data.data;
      } else if (data?.commandes && Array.isArray(data.commandes)) {
        commandesArray = data.commandes;
      } else if (data?.results && Array.isArray(data.results)) {
        commandesArray = data.results;
      } else {
        console.warn("Format inattendu, utilisation d'un tableau vide");
        commandesArray = [];
      }
      
      console.log(`✅ ${commandesArray.length} commandes chargées`);
      setCommandes(commandesArray);
      
      if (commandesArray.length === 0) {
        setFetchError("Aucune commande trouvée");
      }
    } catch (error) {
      console.error("❌ Erreur chargement commandes:", error);
      setFetchError("Impossible de charger les commandes");
      setCommandes([]);
    } finally {
      setLoadingCommandes(false);
    }
  };

  const fetchRepresentants = async () => {
    try {
      setLoadingRepresentants(true);
      const res = await fetch("/api/representants");
      
      if (res.ok) {
        const data = await res.json();
        
        let representantsArray: Representant[] = [];
        
        if (Array.isArray(data)) {
          representantsArray = data;
        } else if (data?.data && Array.isArray(data.data)) {
          representantsArray = data.data;
        } else if (data?.representants && Array.isArray(data.representants)) {
          representantsArray = data.representants;
        }
        
        setRepresentants(representantsArray);
      }
    } catch (error) {
      console.error("Erreur chargement représentants:", error);
      setRepresentants([]);
    } finally {
      setLoadingRepresentants(false);
    }
  };

  const handleSelectCommande = (commande: Commande) => {
    setFormData({
      ...formData,
      commandeId: commande.id,
      commandeNumero: commande.numero,
      clientNom: commande.client.nom,
      montantSoumission: commande.montantTotal || 0,
      dateSoumission: new Date(commande.dateEntree).toISOString().split('T')[0],
    });
    setShowCommandesList(false);
    setSearchCommande(`${commande.numero} - ${commande.client.nom}`);
  };

  // Filtrer les commandes pour la recherche
  const filteredCommandes = commandes.filter(cmd => 
    cmd.numero?.toLowerCase().includes(searchCommande.toLowerCase()) ||
    cmd.client?.nom?.toLowerCase().includes(searchCommande.toLowerCase())
  ).slice(0, 10);

  const validateForm = () => {
    if (!formData.commandeId) {
      setError({ field: "commande", message: "Veuillez sélectionner une commande" });
      return false;
    }
    if (!formData.representantId) {
      setError({ field: "representant", message: "Veuillez sélectionner un représentant" });
      return false;
    }
    if (formData.montantSoumission <= 0) {
      setError({ field: "montant", message: "Le montant doit être supérieur à 0" });
      return false;
    }
    if (formData.pourcentage <= 0 || formData.pourcentage > 100) {
      setError({ field: "pourcentage", message: "Le pourcentage doit être entre 1 et 100" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commandeId: formData.commandeId,
          representantId: formData.representantId,
          montantSoumission: formData.montantSoumission,
          pourcentage: formData.pourcentage,
          montantCommission: formData.montantCommission,
          dateSoumission: formData.dateSoumission,
          depotGarantie: formData.depotGarantie || 0,
          numeroFacture: formData.numeroFacture || null,
          typeCommission: formData.typeCommission,
          typeDeficience: formData.typeDeficience || null,
          secteurDeficience: formData.secteurDeficience || null,
          motifDeficience: formData.motifDeficience || null,
          notes: formData.notes || null,
        }),
      });

      if (res.ok) {
        router.push("/dashboard/commissions");
      } else {
        const data = await res.json();
        setError({ field: "general", message: data.error || "Erreur lors de la création" });
      }
    } catch (error) {
      setError({ field: "general", message: "Erreur lors de la création" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Nouvelle commission
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Créer une commission pour un représentant
          </p>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-700 dark:text-red-400 font-medium">
              {error.message}
            </p>
          </div>
          <button onClick={() => setError(null)} className="text-red-600">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Message d'erreur de chargement */}
      {fetchError && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl flex items-center justify-between">
          <p className="text-yellow-700 dark:text-yellow-400">{fetchError}</p>
          <button
            onClick={fetchCommandes}
            className="text-sm text-[var(--color-primary)] hover:underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        
        {/* Section: Sélection commande */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText size={20} className="text-[var(--color-primary)]" />
            Commande associée
          </h2>
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span className="text-red-500">*</span> Rechercher une commande
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchCommande}
                onChange={(e) => {
                  setSearchCommande(e.target.value);
                  setShowCommandesList(true);
                }}
                onFocus={() => setShowCommandesList(true)}
                placeholder="Numéro de commande ou nom du client..."
                className={`w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border ${error?.field === 'commande' ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-gray-900 dark:text-white`}
              />
            </div>

            {/* Indicateur de chargement des commandes */}
            {loadingCommandes && (
              <div className="mt-2 text-sm text-blue-600 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Chargement des commandes...
              </div>
            )}

            {/* Liste des commandes */}
            {showCommandesList && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
                {loadingCommandes ? (
                  <div className="p-4 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    <p className="text-sm text-gray-500 mt-2">Chargement...</p>
                  </div>
                ) : commandes.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-gray-500">Aucune commande disponible</p>
                    <button
                      onClick={fetchCommandes}
                      className="mt-2 text-sm text-[var(--color-primary)] hover:underline"
                    >
                      Réessayer
                    </button>
                  </div>
                ) : searchCommande.length > 0 && filteredCommandes.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-gray-500">Aucune commande ne correspond à votre recherche</p>
                  </div>
                ) : (
                  (searchCommande.length > 0 ? filteredCommandes : commandes.slice(0, 10)).map((cmd) => (
                    <button
                      key={cmd.id}
                      type="button"
                      onClick={() => handleSelectCommande(cmd)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b last:border-0"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white font-bold">
                        {cmd.numero?.slice(0, 2) || "CM"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{cmd.numero || "Sans numéro"}</p>
                        <p className="text-sm text-gray-500">{cmd.client?.nom || "Client inconnu"}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Commande sélectionnée */}
          {formData.commandeId && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-green-600" size={20} />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Commande {formData.commandeNumero}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Client: {formData.clientNom}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section: Représentant */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User size={20} className="text-[var(--color-primary)]" />
            Représentant
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <span className="text-red-500">*</span> Sélectionner un représentant
            </label>
            <select
              value={formData.representantId}
              onChange={(e) => setFormData({ ...formData, representantId: e.target.value })}
              className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border ${error?.field === 'representant' ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-gray-900 dark:text-white`}
            >
              <option value="">Choisir un représentant...</option>
              {loadingRepresentants ? (
                <option disabled>Chargement...</option>
              ) : (
                representants.map((rep) => (
                  <option key={rep.id} value={rep.id}>{rep.nom}</option>
                ))
              )}
            </select>
            {representants.length === 0 && !loadingRepresentants && (
              <p className="mt-1 text-xs text-yellow-600">
                Aucun représentant trouvé. Veuillez d'abord créer des représentants.
              </p>
            )}
          </div>
        </div>

        {/* Section: Montants */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <DollarSign size={20} className="text-[var(--color-primary)]" />
            Montants
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-red-500">*</span> Montant de la soumission ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  value={formData.montantSoumission}
                  onChange={(e) => setFormData({ ...formData, montantSoumission: parseFloat(e.target.value) || 0 })}
                  className={`w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border ${error?.field === 'montant' ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-gray-900 dark:text-white`}
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-red-500">*</span> Pourcentage de commission (%)
              </label>
              <div className="relative">
                <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  value={formData.pourcentage}
                  onChange={(e) => setFormData({ ...formData, pourcentage: parseFloat(e.target.value) || 0 })}
                  className={`w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border ${error?.field === 'pourcentage' ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} rounded-xl text-gray-900 dark:text-white`}
                  step="0.1"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Commission calculée</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {formData.montantCommission.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Détails */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-[var(--color-primary)]" />
            Détails de la commission
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date de soumission
              </label>
              <input
                type="date"
                value={formData.dateSoumission}
                onChange={(e) => setFormData({ ...formData, dateSoumission: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dépôt garantie ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  value={formData.depotGarantie}
                  onChange={(e) => setFormData({ ...formData, depotGarantie: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Numéro de facture
              </label>
              <input
                type="text"
                value={formData.numeroFacture}
                onChange={(e) => setFormData({ ...formData, numeroFacture: e.target.value })}
                placeholder="ex: FAC-2025-001"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type de commission
              </label>
              <select
                value={formData.typeCommission}
                onChange={(e) => setFormData({ ...formData, typeCommission: e.target.value as any })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
              >
                <option value="SOUMISSION">Soumission</option>
                <option value="VENTE">Vente</option>
                <option value="INSTALLATION">Installation</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section: Déficience - AMÉLIORÉE AVEC TOUS LES TYPES */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertCircle size={20} className="text-[var(--color-primary)]" />
            Déficience
          </h2>
          
          <div className="space-y-4">
            {/* Type de déficience - Liste complète */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type de déficience
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {TYPES_DEFICIENCE.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, typeDeficience: type.value })}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-all text-left ${
                      formData.typeDeficience === type.value
                        ? 'bg-red-50 border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300'
                        : 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Secteur de déficience (si applicable) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Secteur
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSecteursMenu(!showSecteursMenu)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-left flex items-center justify-between text-gray-900 dark:text-white"
                >
                  <span>
                    {formData.secteurDeficience 
                      ? SECTEURS_DEFICIENCE.find(s => s.value === formData.secteurDeficience)?.label 
                      : "Sélectionner un secteur (optionnel)"}
                  </span>
                  <ChevronDown size={18} className="text-gray-400" />
                </button>
                
                {showSecteursMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSecteursMenu(false)} />
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-48 overflow-auto">
                      <button
                        onClick={() => {
                          setFormData({ ...formData, secteurDeficience: "" });
                          setShowSecteursMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500"
                      >
                        Aucun
                      </button>
                      {SECTEURS_DEFICIENCE.map((secteur) => (
                        <button
                          key={secteur.value}
                          onClick={() => {
                            setFormData({ ...formData, secteurDeficience: secteur.value });
                            setShowSecteursMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          {secteur.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Motif / Raison */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Motif / Raison (CAA, etc.)
              </label>
              <input
                type="text"
                value={formData.motifDeficience}
                onChange={(e) => setFormData({ ...formData, motifDeficience: e.target.value })}
                placeholder="ex: CAA, Erreur de mesure, etc."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white"
              />
            </div>

            {/* Notes supplémentaires */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes supplémentaires
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Informations complémentaires..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white resize-none"
              />
            </div>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 rounded-xl font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving || !formData.commandeId || !formData.representantId || representants.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))" }}
          >
            {saving ? (
              <><Loader2 size={20} className="animate-spin" />Création...</>
            ) : (
              <><Save size={20} />Créer la commission</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}