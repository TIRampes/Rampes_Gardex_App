"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, MessageSquare, Calendar, Building2, User, Award, Package, Loader2 } from "lucide-react";
import DeleteConfirmModal from "@/app/components/clients/DeleteConfirmModal";

interface Client {
  id: string;
  nom: string;
  type: "ENTREPRENEUR" | "RESIDENTIEL" | "DISTRIBUTEUR" | "AMBASSADEUR";
  adresse: string;
  ville?: string | null;
  province?: string | null;
  codePostal?: string | null;
  pays?: string | null;
  telephone: string;
  cellulaire?: string | null;
  fax?: string | null;
  personne_Contact: string;
  emails: string[];
  communicationTexto: boolean;
  communicationCourriel: boolean;
  communicationTelephone: boolean;
  commentaires?: string | null;
  createdAt: string;
  _count?: { commandes: number };
}

const typeConfig = {
  ENTREPRENEUR: { label: "Entrepreneur", icon: Building2, gradient: "from-blue-500 to-blue-600" },
  RESIDENTIEL: { label: "Résidentiel", icon: User, gradient: "from-emerald-500 to-emerald-600" },
  DISTRIBUTEUR: { label: "Distributeur", icon: Package, gradient: "from-purple-500 to-purple-600" },
  AMBASSADEUR: { label: "Ambassadeur", icon: Award, gradient: "from-amber-500 to-amber-600" },
};

export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/clients/${id}`);
      if (res.ok) {
        setClient(await res.json());
      } else {
        router.push("/dashboard/clients");
      }
    } catch {
      router.push("/dashboard/clients");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    router.push("/dashboard/clients");
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" /></div>;
  if (!client) return null;

  const config = typeConfig[client.type];
  const TypeIcon = config.icon;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className={`relative bg-gradient-to-r ${config.gradient} rounded-2xl p-6 lg:p-8 shadow-lg`}>
        <div className="absolute inset-0 bg-black/10 rounded-2xl" />
        <div className="relative">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-white/80 hover:text-white mb-6">
            <ArrowLeft size={20} />Retour
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                {client.nom.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">{client.nom}</h1>
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm">
                  <TypeIcon size={16} />{config.label}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => router.push(`/dashboard/clients/${id}/edit`)} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white font-medium">
                <Edit size={18} /><span className="hidden sm:inline">Modifier</span>
              </button>
              <button onClick={() => setShowDeleteModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500/80 hover:bg-red-500 rounded-xl text-white font-medium">
                <Trash2 size={18} /><span className="hidden sm:inline">Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact */}
          <Section title="Informations de contact" icon={User}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoCard label="Personne contact" value={client.personne_Contact} />
              <InfoCard label="Téléphone" value={client.telephone} icon={Phone} href={`tel:${client.telephone}`} />
              {client.cellulaire && <InfoCard label="Cellulaire" value={client.cellulaire} icon={Phone} href={`tel:${client.cellulaire}`} />}
              {client.fax && <InfoCard label="Fax" value={client.fax} />}
            </div>
          </Section>

          {/* Emails */}
          <Section title="Adresses courriel" icon={Mail}>
            {client.emails && client.emails.length > 0 ? (
              <div className="space-y-2">
                {client.emails.map((email, i) => (
                  <a key={i} href={`mailto:${email}`} className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 group">
                    <Mail size={18} className="text-gray-400 group-hover:text-[var(--color-primary)]" />
                    <span className="text-gray-900 dark:text-white group-hover:text-[var(--color-primary)]">{email}</span>
                  </a>
                ))}
              </div>
            ) : <p className="text-gray-400 px-4 py-3 italic">Aucun courriel</p>}
          </Section>

          {/* Adresse */}
          <Section title="Adresse" icon={MapPin}>
            <div className="px-4 py-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <p className="text-gray-900 dark:text-white font-medium">{client.adresse}</p>
              {(client.ville || client.province || client.codePostal) && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {[client.ville, client.province, client.codePostal].filter(Boolean).join(", ")}
                </p>
              )}
              {client.pays && <p className="text-gray-500">{client.pays}</p>}
            </div>
          </Section>

          {/* Préférences */}
          <Section title="Préférences de communication" icon={MessageSquare}>
            <div className="flex flex-wrap gap-3">
              <Badge label="Texto" active={client.communicationTexto} />
              <Badge label="Courriel" active={client.communicationCourriel} />
              <Badge label="Téléphone" active={client.communicationTelephone} />
            </div>
          </Section>

          {/* Commentaires */}
          {client.commentaires && (
            <Section title="Commentaires">
              <div className="px-4 py-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{client.commentaires}</p>
              </div>
            </Section>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Statistiques</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500"><Package size={18} />Commandes</div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{client._count?.commandes || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500"><Calendar size={18} />Client depuis</div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{new Date(client.createdAt).toLocaleDateString("fr-CA")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && <DeleteConfirmModal clientName={client.nom} onClose={() => setShowDeleteModal(false)} onConfirm={handleDelete} />}
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon size={18} className="text-gray-400" />}
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoCard({ label, value, icon: Icon, href }: { label: string; value: string; icon?: React.ElementType; href?: string }) {
  const content = (
    <div className={`px-4 py-3 bg-gray-50 dark:bg-gray-900 rounded-xl ${href ? "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer" : ""}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={16} className="text-gray-400" />}
        <p className="font-medium text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
  return href ? <a href={href}>{content}</a> : content;
}

function Badge({ label, active }: { label: string; active: boolean }) {
  return (
    <span className={`px-4 py-2 rounded-xl text-sm font-medium border ${active ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/30" : "bg-gray-100 dark:bg-gray-700 text-gray-400 border-transparent"}`}>
      {label}: {active ? "Oui" : "Non"}
    </span>
  );
}