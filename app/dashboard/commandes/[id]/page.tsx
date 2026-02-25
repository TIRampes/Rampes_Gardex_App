"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Edit, Trash2, Package, User, MapPin, Calendar, DollarSign,
  Ruler, Factory, ShoppingCart, AlertTriangle, FileText, Phone, Mail,
  Clock, CheckCircle2, XCircle, Loader2, Building2, Layers, ExternalLink,
  History, Wrench, Truck, MessageCircle, Paintbrush, Hash, RefreshCw
} from "lucide-react";

// Types complets
interface Client {
  id: string; nom: string; type: string; adresse: string; telephone: string;
  cellulaire?: string; personne_Contact: string; emails: string[];
}
interface Representant { id: string; nom: string; telephone?: string; }
interface Balcon {
  id: string; nom: string; numeroPhase: number; piedsLineaires: number;
  poteaux: number; produit: boolean; installationTerminee: boolean; reprise: boolean;coutBalcon?: number; prixTotal?: number;
}
interface StructureAchat {
  id: string; nom: string; statutAchat: string;
  dateEnvoie?: string; dateReception?: string; quantiteNonRecue?: number;
}
interface Intervention {
  id: string; type: string; datePrevue: string; statut: string;
  equipe?: { nom: string; couleur: string };
}
interface HistoriqueStatut {
  id: string; ancienStatut: string; nouveauStatut: string; dateChangement: string; commentaire?: string;
}
interface Commande {
  id: string; numero: string; reference?: string; typeCommande: string;
  service: string; statut: string; adresse: string; commentaireAdresse?: string;
  client: Client; representant?: Representant; balcons: Balcon[];
  structuresAchat: StructureAchat[];
  dateEntree: string; datePrevue?: string; dateProduction?: string;
  datePriseMesure?: string; dateLivraison?: string; semainePrevue?: string;
  prixTotal: number; prixVenteMateriaux: number; prixVenteInstallation: number;
  tempsInstallationAuto: number; utiliserCalculAuto: boolean;
  // Pieds linéaires
  piedsLineairesBarrotin: number; piedsLineairesVerre: number;
  piedsLineairesMur: number; piedsLineairesMainDouble: number;
  piedsLineairesGardexVision: number; piedsLineairesGardexUrbaine: number;
  piedsLineairesGardexOptimum: number; piedsLineairesRampes: number;
  nombrePoteaux: number;
  // Anciens champs
  tempsEstimeInstallation: number; piedsCarresFibre?: number;
  piedsRampesBarrotin: number; piedsRampesVerre: number;
  piedsRampesMurIntimite: number; piedsRampesMainDouble: number;
  piedsRampesGardexVision: number; piedsRampesGardexVisionUrbaine: number;
  piedsRampesGardexVisionOptimum: number;
  // Production
  structure: boolean; couleur?: string; couleurPersonnalisee?: string;
  mesure?: string; mesureDonneeLe?: string;
  plan?: string; envoyeProduction?: string; productionTerminee?: string;
  termine?: string; statutLivraison: string; installation?: string;
  enProduction: boolean; reprise: boolean; ancienneCommandeNumero?: string;
  // Achats avec nouveaux champs
  achatFibre?: string; dateEnvoieFibre?: string; dateReceptionFibre?: string;
  quantiteNonRecueFibre?: number;
  achatLimons?: string; dateEnvoieLimons?: string; dateReceptionLimons?: string;
  quantiteNonRecueLimons?: number;
  achatVerres?: string; dateEnvoieVerres?: string; dateReceptionVerre?: string;
  quantiteNonRecueVerres?: number;
  achatColonnes?: string; dateEnvoieColonnes?: string; dateReceptionColonnes?: string;
  quantiteNonRecueColonnes?: number;
  achatPeinture?: string; dateEnvoiePeinture?: string; dateReceptionPeinture?: string;
  quantiteNonRecuePeinture?: number;
  achatAttaches?: string; dateEnvoieAttaches?: string; dateReceptionAttaches?: string;
  quantiteNonRecueAttaches?: number;
  achatPlancherAluminium?: string; dateEnvoiePlancherAluminium?: string;
  dateReceptionPlancherAluminium?: string; quantiteNonRecuePlancherAluminium?: number;
  // Avertissements
  avertissementClient?: string; avertissementPriseMesure?: string;
  // Commentaire
  commentaire?: string;
  // Dates système
  createdAt: string; updatedAt: string;
  interventions: Intervention[]; historiqueStatuts: HistoriqueStatut[];
  _count: { interventions: number; reprises: number; achats: number };
  config?: { coutHeureInstallation: number; facteurTempsInstallation: number };
}

// Mappings
const CODE_SYMBOLS: Record<string, { symbol: string; label: string; color: string; bgColor: string }> = {
  COMPLETE: { symbol: "✓", label: "Complété", color: "text-green-700", bgColor: "bg-green-100" },
  ATTENTE_CLIENT: { symbol: "At.C", label: "Attente client", color: "text-orange-700", bgColor: "bg-orange-100" },
  NON_APPLICABLE: { symbol: "N/A", label: "Non applicable", color: "text-gray-600", bgColor: "bg-gray-100" },
  PARTIEL: { symbol: "P", label: "Partiel", color: "text-blue-700", bgColor: "bg-blue-100" },
  DOSSIER_MESUREUR: { symbol: "D", label: "Dossier mesureur", color: "text-purple-700", bgColor: "bg-purple-100" },
  MODIFICATION: { symbol: "M", label: "Modification", color: "text-yellow-700", bgColor: "bg-yellow-100" },
  ATTENTE_CAROL_CONFIRM: { symbol: "C-C", label: "Attente Carol confirm.", color: "text-pink-700", bgColor: "bg-pink-100" },
  ATTENTE_CAROL_MESURE: { symbol: "C-RM", label: "Attente Carol mesure", color: "text-pink-700", bgColor: "bg-pink-100" },
  BACK_ORDER: { symbol: "B/O", label: "Back order", color: "text-red-700", bgColor: "bg-red-100" },
  ATTENTE_REPRESENTANT: { symbol: "At.Rep", label: "Attente rep.", color: "text-indigo-700", bgColor: "bg-indigo-100" },
};

const ACHAT_SYMBOLS: Record<string, { symbol: string; label: string; color: string; bgColor: string }> = {
  A_FAIRE: { symbol: "①", label: "À faire", color: "text-gray-700", bgColor: "bg-gray-100" },
  FAIT: { symbol: "✓", label: "Fait", color: "text-green-700", bgColor: "bg-green-100" },
  RECEPTIONNE: { symbol: "R", label: "Réceptionné", color: "text-blue-700", bgColor: "bg-blue-100" },
  PRET_A_RAMASSER: { symbol: "P", label: "Prêt à ramasser", color: "text-purple-700", bgColor: "bg-purple-100" },
  BACK_ORDER: { symbol: "B/O", label: "Back order", color: "text-red-700", bgColor: "bg-red-100" },
};

const STATUT_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  ACTIVE: { label: "Active", color: "text-green-700", bgColor: "bg-green-100", icon: <CheckCircle2 size={16} /> },
  EN_ATTENTE: { label: "En attente", color: "text-yellow-700", bgColor: "bg-yellow-100", icon: <Clock size={16} /> },
  COMPLETEE: { label: "Complétée", color: "text-blue-700", bgColor: "bg-blue-100", icon: <CheckCircle2 size={16} /> },
  ANNULEE: { label: "Annulée", color: "text-red-700", bgColor: "bg-red-100", icon: <XCircle size={16} /> },
};

const TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  STANDARD: { label: "Standard", color: "text-blue-700", bgColor: "bg-blue-100" },
  COMMERCIAL: { label: "Commercial", color: "text-purple-700", bgColor: "bg-purple-100" },
  MULTI_PHASE: { label: "Multi-Phase", color: "text-orange-700", bgColor: "bg-orange-100" },
  MULTIPLAN: { label: "Multiplan", color: "text-emerald-700", bgColor: "bg-emerald-100" },
};

const SERVICE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  INSTALLATION: { label: "Installation", color: "bg-blue-500", icon: <Wrench size={14} /> },
  LIVRAISON: { label: "Livraison", color: "bg-green-500", icon: <Truck size={14} /> },
  CUEILLETTE: { label: "Cueillette", color: "bg-yellow-500", icon: <Package size={14} /> },
  TRANSPORT: { label: "Transport", color: "bg-purple-500", icon: <Truck size={14} /> },
};

const COULEUR_MAP: Record<string, { bg: string; text: string; label: string }> = {
  NOIR: { bg: "bg-gray-900", text: "text-white", label: "Noir" },
  BLANC: { bg: "bg-gray-100", text: "text-gray-900", label: "Blanc" },
  BRUN_COMMERCIALE: { bg: "bg-amber-800", text: "text-white", label: "Brun commerciale" },
  GRIS_CHARBON: { bg: "bg-gray-700", text: "text-white", label: "Gris charbon" },
  ARGILE: { bg: "bg-amber-200", text: "text-amber-900", label: "Argile" },
  SPECIALE: { bg: "bg-purple-600", text: "text-white", label: "Spéciale" },
  GRIS_METALLIQUE: { bg: "bg-gray-400", text: "text-gray-900", label: "Gris métallique" },
  AUTRE: { bg: "bg-blue-400", text: "text-white", label: "Autre" },
};

const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString("fr-CA", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const formatSemaine = (date?: string) => {
  if (!date) return "—";
  const d = new Date(date);
  const week = Math.ceil(((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
  return `Semaine ${week}`;
};

export default function CommandeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [commande, setCommande] = useState<Commande | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);

  useEffect(() => {
    const fetchCommande = async () => {
      try {
        const res = await fetch(`/api/commandes/${params.id}`);
        if (res.ok) {
          setCommande(await res.json());
        }
      } catch (err) {
        console.error("Erreur:", err);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchCommande();
  }, [params.id]);

  const handleDelete = async () => {
    try {
      await fetch(`/api/commandes/${params.id}`, { method: "DELETE" });
      router.push("/dashboard/commandes");
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (!commande) {
    return (
      <div className="text-center py-20">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Commande non trouvée</p>
        <button onClick={() => router.back()} className="mt-4 text-[var(--color-primary)]">Retour</button>
      </div>
    );
  }

  const statutConfig = STATUT_CONFIG[commande.statut];
  const typeConfig = TYPE_CONFIG[commande.typeCommande];
  const serviceConfig = SERVICE_CONFIG[commande.service];
  const couleurConfig = commande.couleur ? COULEUR_MAP[commande.couleur] : null;

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-8 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{commande.numero}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeConfig.bgColor} ${typeConfig.color}`}>
                {typeConfig.label}
              </span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${statutConfig.bgColor} ${statutConfig.color}`}>
                {statutConfig.icon} {statutConfig.label}
              </span>
              {commande.reprise && <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">REPRISE</span>}
            </div>
            <p className="text-sm text-gray-500 mt-1">{commande.reference || "Sans référence"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/dashboard/commandes/${commande.id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200"
          >
            <Edit size={18} />
            <span className="hidden sm:inline">Modifier</span>
          </button>
          <button
            onClick={() => setDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-700 font-medium hover:bg-red-200"
          >
            <Trash2 size={18} />
            <span className="hidden sm:inline">Supprimer</span>
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<DollarSign />} label="Prix total" value={commande.prixTotal.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} color="green" />
        <StatCard icon={<Ruler />} label="Pieds linéaires" value={`${commande.piedsLineairesRampes} pi`} color="blue" />
        <StatCard icon={<Clock />} label="Temps installation" value={
  commande.utiliserCalculAuto
    ? `${Number(commande.tempsInstallationAuto || 0).toFixed(2)}h`
    : `${Number(commande.tempsEstimeInstallation || 0)}h`
} color="purple" />
        <StatCard icon={<Package />} label="Interventions" value={commande._count.interventions.toString()} color="orange" />
      </div>

      {/* SECTION: CLIENT */}
      <SectionCard icon={<User />} title="Client" badge={commande.client.type}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Nom</p>
            <p className="font-semibold text-gray-900 dark:text-white text-lg">{commande.client.nom}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Contact</p>
            <p className="font-medium text-gray-900 dark:text-white">{commande.client.personne_Contact}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Téléphone</p>
            <a href={`tel:${commande.client.telephone}`} className="font-medium text-[var(--color-primary)] flex items-center gap-1">
              <Phone size={14} /> {commande.client.telephone}
            </a>
          </div>
          {commande.representant && (
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Représentant</p>
              <p className="font-medium text-gray-900 dark:text-white">{commande.representant.nom}</p>
            </div>
          )}
          <div className="sm:col-span-2">
            <p className="text-xs text-gray-500 uppercase font-medium">Adresse</p>
            <p className="font-medium text-gray-900 dark:text-white flex items-start gap-1">
              <MapPin size={16} className="mt-0.5 flex-shrink-0 text-gray-400" />
              {commande.adresse}
            </p>
            {commande.commentaireAdresse && (
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                <MessageCircle size={14} />
                {commande.commentaireAdresse}
              </p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* SECTION: DATES */}
      <SectionCard icon={<Calendar />} title="Dates">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <DateField label="Date d'entrée" value={commande.dateEntree} />
          <DateField label="Date production" value={commande.dateProduction} />
          <DateField label="Date prévue" value={commande.datePrevue} highlight />
          <DateField label="Semaine prévue" value={commande.semainePrevue || formatSemaine(commande.datePrevue)} isText />
          <DateField label="Mesure donnée le" value={commande.mesureDonneeLe} />
        </div>
      </SectionCard>

      {/* SECTION: PRIX */}
      <SectionCard icon={<DollarSign />} title="Prix">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <p className="text-xs text-gray-500 uppercase font-medium">Matériaux</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {Number(commande.prixVenteMateriaux).toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
            </p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <p className="text-xs text-gray-500 uppercase font-medium">Installation</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {Number(commande.prixVenteInstallation).toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
            </p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800">
            <p className="text-xs text-green-600 uppercase font-medium">Total</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              {Number(commande.prixTotal).toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
            </p>
          </div>
        </div>
        {commande.utiliserCalculAuto && commande.config && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Temps installation auto: {Number(commande.tempsInstallationAuto || 0).toFixed(2)}h 
              (basé sur {commande.config.coutHeureInstallation}$/h × facteur {commande.config.facteurTempsInstallation})
            </p>
          </div>
        )}
      </SectionCard>

      {/* SECTION: COULEUR */}
      {commande.couleur && (
        <SectionCard icon={<Paintbrush />} title="Couleur">
          <div className="flex items-center gap-3">
            {couleurConfig ? (
              <span className={`px-4 py-2 rounded-lg font-medium ${couleurConfig.bg} ${couleurConfig.text}`}>
                {couleurConfig.label}
              </span>
            ) : (
              <span className="text-gray-900 dark:text-white">{commande.couleur}</span>
            )}
            {commande.couleur === "AUTRE" && commande.couleurPersonnalisee && (
              <span className="text-gray-600">({commande.couleurPersonnalisee})</span>
            )}
          </div>
        </SectionCard>
      )}

      {/* SECTION: PIEDS LINÉAIRES ET POTEAUX */}
      <SectionCard icon={<Ruler />} title="Pieds linéaires et Poteaux">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <MeasureField label="Barrotin" value={`${commande.piedsLineairesBarrotin} pi (×1.25)`} />
          <MeasureField label="Verre" value={`${commande.piedsLineairesVerre} pi`} />
          <MeasureField label="Mur" value={`${commande.piedsLineairesMur} pi (×4)`} />
          <MeasureField label="Main double" value={`${commande.piedsLineairesMainDouble} pi (×2.25)`} />
          <MeasureField label="Gardex Vision" value={`${commande.piedsLineairesGardexVision} pi`} />
          <MeasureField label="Gardex Urbaine" value={`${commande.piedsLineairesGardexUrbaine} pi (×2)`} />
          <MeasureField label="Gardex Optimum" value={`${commande.piedsLineairesGardexOptimum} pi (×0.75)`} />
          <MeasureField label="Total" value={`${commande.piedsLineairesRampes} pi`} highlight />
          <MeasureField label="Poteaux" value={commande.nombrePoteaux} highlight />
        </div>
      </SectionCard>

      {/* SECTION: PRODUCTION */}
      <SectionCard icon={<Factory />} title="Production" badge={commande.enProduction ? "En production" : undefined}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <CodeField label="Mesure" code={commande.mesure} />
          <CodeField label="Plan" code={commande.plan} />
          <CodeField label="Envoyé production" code={commande.envoyeProduction} />
          <CodeField label="Production terminée" code={commande.productionTerminee} />
          <CodeField label="Terminé" code={commande.termine} />
          <CodeField label="Installation" code={commande.installation} />
          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Statut livraison</p>
            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ${
              commande.statutLivraison === "LIVRE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
            }`}>
              {commande.statutLivraison === "LIVRE" ? "Livré" : "N/A"}
            </span>
          </div>
        </div>
      </SectionCard>

      {/* SECTION: ACHATS */}
      <SectionCard icon={<ShoppingCart />} title="Achats">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <AchatField label="Fibre" code={commande.achatFibre} dateEnvoie={commande.dateEnvoieFibre} dateReception={commande.dateReceptionFibre} quantiteNonRecue={commande.quantiteNonRecueFibre} />
          <AchatField label="Limons" code={commande.achatLimons} dateEnvoie={commande.dateEnvoieLimons} dateReception={commande.dateReceptionLimons} quantiteNonRecue={commande.quantiteNonRecueLimons} />
          <AchatField label="Verres" code={commande.achatVerres} dateEnvoie={commande.dateEnvoieVerres} dateReception={commande.dateReceptionVerre} quantiteNonRecue={commande.quantiteNonRecueVerres} />
          <AchatField label="Colonnes" code={commande.achatColonnes} dateEnvoie={commande.dateEnvoieColonnes} dateReception={commande.dateReceptionColonnes} quantiteNonRecue={commande.quantiteNonRecueColonnes} />
          <AchatField label="Peinture" code={commande.achatPeinture} dateEnvoie={commande.dateEnvoiePeinture} dateReception={commande.dateReceptionPeinture} quantiteNonRecue={commande.quantiteNonRecuePeinture} />
          <AchatField label="Attaches" code={commande.achatAttaches} dateEnvoie={commande.dateEnvoieAttaches} dateReception={commande.dateReceptionAttaches} quantiteNonRecue={commande.quantiteNonRecueAttaches} />
          <AchatField label="Plancher alu." code={commande.achatPlancherAluminium} dateEnvoie={commande.dateEnvoiePlancherAluminium} dateReception={commande.dateReceptionPlancherAluminium} quantiteNonRecue={commande.quantiteNonRecuePlancherAluminium} />
        </div>

        {/* Structures d'achat */}
        {commande.structuresAchat && commande.structuresAchat.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Structures d'achat</h4>
            <div className="space-y-2">
              {commande.structuresAchat.map(s => (
                <div key={s.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{s.nom}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        ACHAT_SYMBOLS[s.statutAchat]?.bgColor || "bg-gray-100"
                      } ${ACHAT_SYMBOLS[s.statutAchat]?.color || "text-gray-600"}`}>
                        {ACHAT_SYMBOLS[s.statutAchat]?.symbol || s.statutAchat}
                      </span>
                      {s.dateEnvoie && <span className="text-xs text-gray-500">Envoi: {formatDate(s.dateEnvoie)}</span>}
                      {s.dateReception && <span className="text-xs text-gray-500">Reçu: {formatDate(s.dateReception)}</span>}
                      {s.quantiteNonRecue && s.quantiteNonRecue > 0 && (
                        <span className="text-xs text-red-600">Non reçu: {s.quantiteNonRecue}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* SECTION: BALCONS/PHASES si applicable */}
      {commande.balcons && commande.balcons.length > 0 && (
        <SectionCard 
          icon={commande.typeCommande === "COMMERCIAL" ? <Building2 /> : <Layers />} 
          title={commande.typeCommande === "COMMERCIAL" ? "Balcons" : commande.typeCommande === "MULTI_PHASE" ? "Phases" : "Plans"}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="px-3 py-2 text-left text-xs font-semibold">Nom</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold">Pieds lin.</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold">Poteaux</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold">Coût</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold">Prix</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold">Produit</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold">Installé</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold">Reprise</th>
                </tr>
              </thead>
              <tbody>
                {commande.balcons.map(b => (
                  <tr key={b.id} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="px-3 py-2 font-medium">{b.nom}</td>
                    <td className="px-3 py-2 text-right">{b.piedsLineaires}</td>
                    <td className="px-3 py-2 text-right">{b.poteaux}</td>
                    <td className="px-3 py-2 text-right">{b.coutBalcon?.toFixed(2) ?? "0.00"} $</td>
                    <td className="px-3 py-2 text-right">{b.prixTotal?.toFixed(2) ?? "0.00"} $</td>
                    <td className="px-3 py-2 text-center">{b.produit ? <CheckCircle2 size={16} className="text-green-500 mx-auto" /> : "—"}</td>
                    <td className="px-3 py-2 text-center">{b.installationTerminee ? <CheckCircle2 size={16} className="text-green-500 mx-auto" /> : "—"}</td>
                    <td className="px-3 py-2 text-center">{b.reprise ? <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">Oui</span> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* SECTION: REPRISE */}
      {commande.reprise && commande.ancienneCommandeNumero && (
        <SectionCard icon={<RefreshCw />} title="Reprise">
          <p className="text-gray-700 dark:text-gray-300">
            Ancienne commande: <span className="font-bold">{commande.ancienneCommandeNumero}</span>
          </p>
        </SectionCard>
      )}

      {/* SECTION: AVERTISSEMENTS */}
      {(commande.avertissementClient || commande.avertissementPriseMesure) && (
        <SectionCard icon={<AlertTriangle />} title="Avertissements">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {commande.avertissementClient && (
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200">
                <p className="text-xs text-orange-600 uppercase font-medium">Client</p>
                <p className="font-semibold text-orange-700">{commande.avertissementClient}</p>
              </div>
            )}
            {commande.avertissementPriseMesure && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200">
                <p className="text-xs text-blue-600 uppercase font-medium">Prise de mesure</p>
                <p className="font-semibold text-blue-700">{commande.avertissementPriseMesure}</p>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* SECTION: COMMENTAIRES */}
      {commande.commentaire && (
        <SectionCard icon={<FileText />} title="Commentaires">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{commande.commentaire}</p>
        </SectionCard>
      )}

      {/* SECTION: HISTORIQUE */}
      {commande.historiqueStatuts && commande.historiqueStatuts.length > 0 && (
        <SectionCard icon={<History />} title="Historique des statuts">
          <div className="space-y-3">
            {commande.historiqueStatuts.map(h => (
              <div key={h.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full" />
                <div className="flex-1">
                  <p className="text-sm">
                    <span className={`font-medium ${STATUT_CONFIG[h.ancienStatut]?.color || ""}`}>{STATUT_CONFIG[h.ancienStatut]?.label || h.ancienStatut}</span>
                    {" → "}
                    <span className={`font-medium ${STATUT_CONFIG[h.nouveauStatut]?.color || ""}`}>{STATUT_CONFIG[h.nouveauStatut]?.label || h.nouveauStatut}</span>
                  </p>
                  {h.commentaire && <p className="text-xs text-gray-500 mt-1">{h.commentaire}</p>}
                </div>
                <span className="text-xs text-gray-400">{formatDate(h.dateChangement)}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Modal suppression */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Supprimer la commande ?</h3>
            <p className="text-gray-500 mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal(false)} className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl font-medium">Annuler</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Composants
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    green: "from-green-500 to-green-600",
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 text-white`}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">{icon}</div>
      </div>
      <p className="text-xl sm:text-2xl font-bold">{value}</p>
      <p className="text-white/80 text-xs">{label}</p>
    </div>
  );
}

function SectionCard({ icon, title, badge, children }: { icon: React.ReactNode; title: string; badge?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center text-[var(--color-primary)]">{icon}</div>
        <h3 className="font-semibold text-gray-900 dark:text-white flex-1">{title}</h3>
        {badge && <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">{badge}</span>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function DateField({ label, value, highlight, isText }: { label: string; value?: string; highlight?: boolean; isText?: boolean }) {
  return (
    <div className={highlight ? "p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl" : ""}>
      <p className="text-xs text-gray-500 uppercase font-medium">{label}</p>
      <p className={`font-semibold ${highlight ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-white"}`}>
        {isText ? value : formatDate(value)}
      </p>
    </div>
  );
}

function MeasureField({ label, value, highlight }: { label: string; value?: string | number; highlight?: boolean }) {
  return (
    <div className={`p-3 rounded-xl ${highlight ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800" : "bg-gray-50 dark:bg-gray-900"}`}>
      <p className="text-xs text-gray-500 uppercase font-medium">{label}</p>
      <p className={`font-bold ${highlight ? "text-blue-700 dark:text-blue-300 text-lg" : "text-gray-900 dark:text-white"}`}>
        {value || "—"}
      </p>
    </div>
  );
}

function CodeField({ label, code }: { label: string; code?: string }) {
  const config = code ? CODE_SYMBOLS[code] : null;
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase font-medium">{label}</p>
      {config ? (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-semibold ${config.bgColor} ${config.color}`}>
          {config.symbol} {config.label}
        </span>
      ) : (
        <span className="text-gray-400">—</span>
      )}
    </div>
  );
}

function AchatField({ label, code, dateEnvoie, dateReception, quantiteNonRecue }: { 
  label: string; code?: string; dateEnvoie?: string; dateReception?: string; quantiteNonRecue?: number;
}) {
  const config = code ? ACHAT_SYMBOLS[code] : null;
  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
      <p className="text-xs text-gray-500 uppercase font-medium mb-1">{label}</p>
      {config ? (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${config.bgColor} ${config.color}`}>
          {config.symbol}
        </span>
      ) : (
        <span className="text-gray-400 text-sm">—</span>
      )}
      <div className="mt-1 space-y-1">
        {dateEnvoie && <p className="text-xs text-gray-500">Envoi: {formatDate(dateEnvoie)}</p>}
        {dateReception && <p className="text-xs text-gray-500">Reçu: {formatDate(dateReception)}</p>}
        {quantiteNonRecue && quantiteNonRecue > 0 && (
          <p className="text-xs text-red-600">Non reçu: {quantiteNonRecue}</p>
        )}
      </div>
    </div>
  );
}