"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Edit, Trash2, Loader2, Package, Calendar, DollarSign,
  Ruler, Factory, ShoppingCart, AlertTriangle, Building2, Layers,
  CheckCircle2, Truck, Wrench, Clock, MapPin, User, FileText,
  Download, ChevronDown, ChevronRight, ExternalLink
} from "lucide-react";

// ─── MAPPINGS ────────────────────────────────────────────────
const CODE_SYMBOLS: Record<string, { symbol: string; label: string; color: string }> = {
  COMPLETE: { symbol: "✓", label: "Complété", color: "text-green-600 bg-green-100" },
  ATTENTE_CLIENT: { symbol: "At.C", label: "Attente client", color: "text-orange-600 bg-orange-100" },
  NON_APPLICABLE: { symbol: "N/A", label: "Non applicable", color: "text-gray-500 bg-gray-100" },
  PARTIEL: { symbol: "P", label: "Partiel", color: "text-blue-600 bg-blue-100" },
  DOSSIER_MESUREUR: { symbol: "D", label: "Dossier mesureur", color: "text-purple-600 bg-purple-100" },
  MODIFICATION: { symbol: "M", label: "Modification", color: "text-yellow-600 bg-yellow-100" },
  ATTENTE_CAROL_CONFIRM: { symbol: "C-C", label: "Attente Carol confirm.", color: "text-pink-600 bg-pink-100" },
  ATTENTE_CAROL_MESURE: { symbol: "C-RM", label: "Attente Carol mesure", color: "text-pink-600 bg-pink-100" },
  BACK_ORDER: { symbol: "B/O", label: "Back order", color: "text-red-600 bg-red-100" },
  ATTENTE_REPRESENTANT: { symbol: "At.Rep", label: "Attente représentant", color: "text-indigo-600 bg-indigo-100" },
  APPROBATION_PLAN: { symbol: "AP", label: "Approbation plan", color: "text-purple-600 bg-purple-100" },
};

const ACHAT_SYMBOLS: Record<string, { symbol: string; label: string; color: string }> = {
  A_FAIRE: { symbol: "①", label: "À faire", color: "text-gray-600 bg-gray-100" },
  FAIT: { symbol: "✓", label: "Fait", color: "text-green-600 bg-green-100" },
  RECEPTIONNE: { symbol: "R", label: "Réceptionné", color: "text-blue-600 bg-blue-100" },
  PRET_A_RAMASSER: { symbol: "P", label: "Prêt à ramasser", color: "text-purple-600 bg-purple-100" },
  BACK_ORDER: { symbol: "B/O", label: "Back order", color: "text-red-600 bg-red-100" },
};

const TYPE_LABELS: Record<string, string> = {
  STANDARD: "Standard", COMMERCIAL: "Commercial", MULTI_PHASE: "Multi-Phase", MULTIPLAN: "Multiplan",
};
const SERVICE_LABELS: Record<string, string> = {
  INSTALLATION: "🔧 Installation", LIVRAISON: "🚚 Livraison", CUEILLETTE: "📦 Cueillette", TRANSPORT: "🚛 Transport",
};
const STATUT_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "bg-green-100 text-green-700" },
  EN_ATTENTE: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  COMPLETEE: { label: "Complétée", color: "bg-blue-100 text-blue-700" },
  ANNULEE: { label: "Annulée", color: "bg-red-100 text-red-700" },
};
const TYPE_ACHAT_LABELS: Record<string, string> = {
  FIBRE: "Fibre", LIMONS: "Limons", VERRES: "Verres", COLONNES: "Colonnes",
  PEINTURE: "Peinture", ATTACHES: "Attaches", PLANCHER_ALUMINIUM: "Plancher alu.",
  EUROFORGINGS: "EuroForgings", PEINTURE_DJ: "Peinture DJ", VERRE_LEPAGE: "Verre Lepage",
  STRUCTURE: "Structure", AUTRE: "Autre",
};
const COULEUR_LABELS: Record<string, string> = {
  NOIR: "Noir", BLANC: "Blanc", BRUN_COMMERCIALE: "Brun commerciale", GRIS_CHARBON: "Gris charbon",
  ARGILE: "Argile", SPECIALE: "Spéciale", GRIS_METALLIQUE: "Gris métallique", AUTRE: "Autre",
};

const formatDate = (d?: string | null) => d ? new Date(d).toLocaleDateString("fr-CA") : "—";
const formatMoney = (n?: number | null) => (n ?? 0).toLocaleString("fr-CA", { style: "currency", currency: "CAD" });

const CodeBadge = ({ code }: { code?: string | null }) => {
  if (!code) return <span className="text-xs text-gray-400">—</span>;
  const info = CODE_SYMBOLS[code];
  if (!info) return <span className="text-xs">{code}</span>;
  return <span className={`px-2 py-0.5 rounded text-xs font-bold ${info.color}`}>{info.symbol}</span>;
};

const AchatBadge = ({ code }: { code?: string | null }) => {
  if (!code) return <span className="text-xs text-gray-400">—</span>;
  const info = ACHAT_SYMBOLS[code];
  if (!info) return <span className="text-xs">{code}</span>;
  return <span className={`px-2 py-0.5 rounded text-xs font-bold ${info.color}`}>{info.symbol} {info.label}</span>;
};

// ─── Collapsible Section ────────────────────────────────────
function Section({ title, icon, children, defaultOpen = true }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[var(--color-primary)]/10 rounded-xl flex items-center justify-center text-[var(--color-primary)]">{icon}</div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="p-4 pt-0 border-t border-gray-200 dark:border-gray-700">{children}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PAGE DÉTAIL
// ═══════════════════════════════════════════════════════════════
export default function CommandeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [commande, setCommande] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const fetchCommande = async () => {
      try {
        const res = await fetch(`/api/commandes/${params.id}`);
        if (!res.ok) throw new Error("Commande introuvable");
        setCommande(await res.json());
      } catch (e: any) { setError(e.message); }
      finally { setLoading(false); }
    };
    if (params.id) fetchCommande();
  }, [params.id]);

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/commandes/${params.id}`, { method: "DELETE" });
      if (res.ok) router.push("/dashboard/commandes");
    } catch { setError("Erreur lors de la suppression"); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
    </div>
  );
  if (error || !commande) return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
        <ArrowLeft size={20} /><span>Retour</span>
      </button>
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <p className="text-red-800 font-semibold">{error || "Commande introuvable"}</p>
      </div>
    </div>
  );

  const c = commande;
  const couleurLabel = c.couleur === "AUTRE" ? c.couleurPersonnalisee : COULEUR_LABELS[c.couleur] || c.couleur;

  // Achats globaux
  const achatsGlobaux = [
    { label: "Fibre", statut: c.achatFibre, dateRec: c.dateReceptionFibre, nonRecu: c.quantiteNonRecueFibre },
    { label: "Limons", statut: c.achatLimons, dateRec: c.dateReceptionLimons, nonRecu: c.quantiteNonRecueLimons },
    { label: "Verres", statut: c.achatVerres, dateRec: c.dateReceptionVerre, nonRecu: c.quantiteNonRecueVerres },
    { label: "Colonnes", statut: c.achatColonnes, dateRec: c.dateReceptionColonnes, nonRecu: c.quantiteNonRecueColonnes },
    { label: "Peinture", statut: c.achatPeinture, dateRec: c.dateReceptionPeinture, nonRecu: c.quantiteNonRecuePeinture },
    { label: "Attaches", statut: c.achatAttaches, dateRec: c.dateReceptionAttaches, nonRecu: c.quantiteNonRecueAttaches },
    { label: "Plancher alu.", statut: c.achatPlancherAluminium, dateRec: c.dateReceptionPlancherAluminium, nonRecu: c.quantiteNonRecuePlancherAluminium },
  ].filter(a => a.statut);

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-8 px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/commandes")} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{c.numero}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUT_CONFIG[c.statut]?.color || "bg-gray-100"}`}>
                {STATUT_CONFIG[c.statut]?.label || c.statut}
              </span>
              {c.reprise && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-bold">REPRISE</span>}
              {c.enProduction && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">EN PRODUCTION</span>}
            </div>
            <p className="text-sm text-gray-500">{c.client?.nom} • {TYPE_LABELS[c.typeCommande] || c.typeCommande} • {SERVICE_LABELS[c.service] || c.service}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push(`/dashboard/commandes/${c.id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl text-sm font-medium">
            <Edit size={16} /> Modifier
          </button>
          <button onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-medium hover:bg-red-200">
            <Trash2 size={16} /> Supprimer
          </button>
        </div>
      </div>

      {/* ─── SECTION: Informations générales ─────────────── */}
      <Section title="Informations générales" icon={<Package size={18} />}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
          <InfoField label="Numéro" value={c.numero} />
          <InfoField label="Référence" value={c.reference} />
          <InfoField label="Client" value={c.client?.nom} />
          <InfoField label="Contact" value={c.client?.personne_Contact} />
          <InfoField label="Représentant" value={c.representant?.nom} />
          <InfoField label="Type" value={TYPE_LABELS[c.typeCommande] || c.typeCommande} />
          <InfoField label="Service" value={SERVICE_LABELS[c.service] || c.service} />
          <InfoField label="Couleur" value={couleurLabel} />
          <div className="col-span-2 sm:col-span-3 lg:col-span-4">
            <InfoField label="Adresse" value={c.adresse} />
          </div>
          {c.commentaireAdresse && <div className="col-span-2"><InfoField label="Commentaire adresse" value={c.commentaireAdresse} /></div>}
          {c.commentaire && <div className="col-span-2 sm:col-span-3 lg:col-span-4"><InfoField label="Commentaire" value={c.commentaire} /></div>}
          {c.reprise && <InfoField label="Ancienne commande" value={c.ancienneCommandeNumero} />}
        </div>
      </Section>

      {/* ─── SECTION: Dates et Prix ──────────────────────── */}
      <Section title="Dates et Prix" icon={<Calendar size={18} />}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-sm mb-4">
          <InfoField label="Date entrée" value={formatDate(c.dateEntree)} />
          <InfoField label="Date prévue" value={formatDate(c.datePrevue)} highlight />
          <InfoField label="Date production" value={formatDate(c.dateProduction)} />
          <InfoField label="Date mesure" value={formatDate(c.datePriseMesure)} />
          <InfoField label="Date livraison" value={formatDate(c.dateLivraison)} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <InfoField label="Prix total" value={formatMoney(Number(c.prixTotal))} highlight />
          <InfoField label="Prix installation" value={formatMoney(Number(c.prixVenteInstallation))} />
          <InfoField label="Prix matériaux" value={formatMoney(Number(c.prixVenteMateriaux))} />
          <InfoField label="Temps installation (h)" value={`${c.tempsEstimeInstallation || 0} h`} />
        </div>
      </Section>

      {/* ─── SECTION: Pieds linéaires ────────────────────── */}
      <Section title="Pieds linéaires et Poteaux" icon={<Ruler size={18} />} defaultOpen={false}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <InfoField label="Barrotin" value={c.piedsLineairesBarrotin} />
          <InfoField label="Verre" value={c.piedsLineairesVerre} />
          <InfoField label="Mur" value={c.piedsLineairesMur} />
          <InfoField label="Main double" value={c.piedsLineairesMainDouble} />
          <InfoField label="Gardex Vision" value={c.piedsLineairesGardexVision} />
          <InfoField label="Gardex Urbaine" value={c.piedsLineairesGardexUrbaine} />
          <InfoField label="Gardex Optimum" value={c.piedsLineairesGardexOptimum} />
          <InfoField label="Nombre poteaux" value={c.nombrePoteaux} />
          <div className="col-span-2 sm:col-span-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex justify-between">
            <span className="font-medium text-purple-700">Total pieds linéaires (avec facteurs)</span>
            <span className="text-xl font-bold text-purple-700">{c.piedsLineairesRampes || 0} pi</span>
          </div>
        </div>
      </Section>

      {/* ─── SECTION: Production (pipeline) ──────────────── */}
      <Section title="Production" icon={<Factory size={18} />}>
        <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-4">
          {[
            { label: "Mesure", code: c.mesure },
            { label: "Plan", code: c.plan },
            { label: "Envoyé prod.", code: c.envoyeProduction },
            { label: "Prod. terminée", code: c.productionTerminee },
            { label: "Terminé", code: c.termine },
            { label: "Livraison", code: c.statutLivraison === "LIVRE" ? "COMPLETE" : null },
            { label: "Installation", code: c.installation },
          ].map((e, i, arr) => {
            const isComplete = e.code === "COMPLETE" || e.code === "LIVRE";
            return (
              <div key={e.label} className="flex items-center">
                <div className={`flex flex-col items-center px-3 py-2 rounded-xl min-w-[90px] border-2 ${
                  isComplete ? "border-green-400 bg-green-50" : e.code ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-gray-50"
                }`}>
                  <span className="text-[10px] font-semibold text-gray-500 mb-1">{e.label}</span>
                  <CodeBadge code={e.code} />
                </div>
                {i < arr.length - 1 && <div className={`w-4 h-0.5 flex-shrink-0 ${isComplete ? "bg-green-400" : "bg-gray-200"}`} />}
              </div>
            );
          })}
        </div>
        {c.mesureDonneeLe && <p className="text-xs text-gray-500">Mesure donnée le : {formatDate(c.mesureDonneeLe)}</p>}
        {c.planApprobationEnvoyeLe && <p className="text-xs text-gray-500">Plan envoyé pour approbation le : {formatDate(c.planApprobationEnvoyeLe)}</p>}
      </Section>

      {/* ─── SECTION: Achats globaux ─────────────────────── */}
      {achatsGlobaux.length > 0 && (
        <Section title="Achats (globaux)" icon={<ShoppingCart size={18} />} defaultOpen={false}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {achatsGlobaux.map(a => (
              <div key={a.label} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border text-center">
                <p className="text-xs text-gray-500 mb-1">{a.label}</p>
                <AchatBadge code={a.statut} />
                {a.dateRec && <p className="text-[10px] text-gray-400 mt-1">Reçu: {formatDate(a.dateRec)}</p>}
                {a.nonRecu > 0 && <p className="text-[10px] text-red-500 mt-0.5">Non reçu: {a.nonRecu}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ─── SECTION: Achats par phase (achatPhases) ─────── */}
      {c.achatPhases && c.achatPhases.length > 0 && (
        <Section title={`Achats par phase (${c.achatPhases.length})`} icon={<ShoppingCart size={18} />}>
          <div className="space-y-3">
            {c.achatPhases.map((ap: any) => (
              <div key={ap.id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-bold">
                      {TYPE_ACHAT_LABELS[ap.typeAchat] || ap.typeAchat}
                    </span>
                    <span className="text-sm text-gray-500">Phase {ap.phaseNumero}</span>
                    {ap.details?.fournisseurNom && (
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">→ {ap.details.fournisseurNom}</span>
                    )}
                  </div>
                  <AchatBadge code={ap.statut} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {ap.dateEnvoie && <div><span className="text-gray-400">Envoyé:</span> {formatDate(ap.dateEnvoie)}</div>}
                  {ap.dateReception && <div><span className="text-gray-400">Reçu:</span> {formatDate(ap.dateReception)}</div>}
                  {ap.quantiteNonRecue > 0 && <div><span className="text-gray-400">Non reçu:</span> <span className="text-red-600 font-bold">{ap.quantiteNonRecue}</span></div>}
                  {ap.description && <div className="col-span-2"><span className="text-gray-400">Description:</span> {ap.description}</div>}
                  {ap.codeProduit && <div><span className="text-gray-400">Code produit:</span> {ap.codeProduit}</div>}
                  {ap.couleur && <div><span className="text-gray-400">Couleur:</span> {ap.couleur}</div>}
                  {ap.quantite && <div><span className="text-gray-400">Quantité:</span> {ap.quantite}</div>}
                  {ap.prixUnitaire && <div><span className="text-gray-400">Prix unit.:</span> {formatMoney(Number(ap.prixUnitaire))}</div>}
                  {ap.epaisseur && <div><span className="text-gray-400">Épaisseur:</span> {ap.epaisseur}</div>}
                  {ap.typeVerre && <div><span className="text-gray-400">Type verre:</span> {ap.typeVerre}</div>}
                  {ap.longueur && <div><span className="text-gray-400">Longueur:</span> {ap.longueur}</div>}
                  {ap.hauteur && <div><span className="text-gray-400">Hauteur:</span> {ap.hauteur}</div>}
                </div>
                {ap.notes && <p className="mt-2 text-xs text-gray-500 italic bg-amber-50 rounded p-2">{ap.notes}</p>}
                {/* Bouton télécharger formulaire si fournisseur a un formulaire */}
                {ap.details?.fournisseurId && (
                  <a href={`/api/fournisseurs/${ap.details.fournisseurId}/formulaire`} download
                    className="mt-2 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                    <Download size={12} /> Formulaire fournisseur
                  </a>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ─── SECTION: Structures d'achat ─────────────────── */}
      {c.structuresAchat && c.structuresAchat.length > 0 && (
        <Section title={`Structures d'achat (${c.structuresAchat.length})`} icon={<Layers size={18} />} defaultOpen={false}>
          <div className="space-y-2">
            {c.structuresAchat.map((sa: any) => (
              <div key={sa.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                <span className="font-medium text-sm">{sa.nom}</span>
                <div className="flex items-center gap-3">
                  {sa.dateEnvoie && <span className="text-xs text-gray-400">Envoi: {formatDate(sa.dateEnvoie)}</span>}
                  {sa.dateReception && <span className="text-xs text-gray-400">Réception: {formatDate(sa.dateReception)}</span>}
                  <AchatBadge code={sa.statutAchat} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ─── SECTION: Balcons / Phases / Plans ───────────── */}
      {c.balcons && c.balcons.length > 0 && (
        <Section title={`Balcons / Phases (${c.balcons.length})`} icon={<Building2 size={18} />}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 text-left">
                  <th className="px-3 py-2 font-semibold">Nom</th>
                  <th className="px-3 py-2 font-semibold text-center">Phase</th>
                  <th className="px-3 py-2 font-semibold text-center">Pi. lin.</th>
                  <th className="px-3 py-2 font-semibold text-center">Poteaux</th>
                  <th className="px-3 py-2 font-semibold text-center">Mesure</th>
                  <th className="px-3 py-2 font-semibold text-center">Plan</th>
                  <th className="px-3 py-2 font-semibold text-center">Prod.</th>
                  <th className="px-3 py-2 font-semibold text-center">Term.</th>
                  <th className="px-3 py-2 font-semibold text-center">Install.</th>
                  <th className="px-3 py-2 font-semibold text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {c.balcons.map((b: any) => (
                  <tr key={b.id} className={`border-b border-gray-100 dark:border-gray-700 ${b.installationTerminee ? "bg-green-50/50" : ""}`}>
                    <td className="px-3 py-2 font-medium">{b.nom}</td>
                    <td className="px-3 py-2 text-center text-gray-500">{b.numeroPhase ?? "—"}</td>
                    <td className="px-3 py-2 text-center">{b.piedsLineaires}</td>
                    <td className="px-3 py-2 text-center">{b.poteaux}</td>
                    <td className="px-3 py-2 text-center"><CodeBadge code={b.mesure} /></td>
                    <td className="px-3 py-2 text-center"><CodeBadge code={b.plan} /></td>
                    <td className="px-3 py-2 text-center"><CodeBadge code={b.envoyeProduction} /></td>
                    <td className="px-3 py-2 text-center"><CodeBadge code={b.termine} /></td>
                    <td className="px-3 py-2 text-center"><CodeBadge code={b.installation} /></td>
                    <td className="px-3 py-2 text-center">
                      {b.installationTerminee
                        ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">Complété</span>
                        : <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">En cours</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ─── SECTION: Historique des statuts ──────────────── */}
      {c.historiqueStatuts && c.historiqueStatuts.length > 0 && (
        <Section title="Historique" icon={<Clock size={18} />} defaultOpen={false}>
          <div className="space-y-2">
            {c.historiqueStatuts.map((h: any) => (
              <div key={h.id} className="flex items-center gap-3 text-sm p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <span className="text-xs text-gray-400 w-24 flex-shrink-0">{formatDate(h.dateChangement)}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUT_CONFIG[h.ancienStatut]?.color || "bg-gray-100"}`}>
                  {STATUT_CONFIG[h.ancienStatut]?.label || h.ancienStatut}
                </span>
                <ChevronRight size={14} className="text-gray-400" />
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUT_CONFIG[h.nouveauStatut]?.color || "bg-gray-100"}`}>
                  {STATUT_CONFIG[h.nouveauStatut]?.label || h.nouveauStatut}
                </span>
                {h.commentaire && <span className="text-xs text-gray-500 italic">— {h.commentaire}</span>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ─── Modal suppression ───────────────────────────── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Supprimer la commande?</h3>
            <p className="text-sm text-gray-500 mb-4">Cette action est irréversible. Toutes les données liées seront supprimées.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium">Annuler</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({ label, value, highlight }: { label: string; value?: string | number | null; highlight?: boolean }) {
  return (
    <div className={`p-2.5 rounded-lg ${highlight ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200" : "bg-gray-50 dark:bg-gray-900"}`}>
      <p className="text-[11px] text-gray-400 font-medium mb-0.5">{label}</p>
      <p className={`font-semibold text-gray-800 dark:text-white ${highlight ? "text-blue-700 dark:text-blue-300" : ""}`}>
        {value ?? "—"}
      </p>
    </div>
  );
}