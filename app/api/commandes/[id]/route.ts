import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { commandeSchema, calculatePiedsLineairesTotaux, calculateTempsInstallationAuto } from "../schema";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 1. Configuration du client S3 pour Railway Tigris (Photos)
const s3Client = new S3Client({
  endpoint: "https://t3.storageapi.dev",
  region: 'auto',
  credentials: {
    accessKeyId: process.env.RAILWAY_STORAGE_ACCESS_KEY!,
    secretAccessKey: process.env.RAILWAY_STORAGE_SECRET_KEY!,
  },
  forcePathStyle: true,
});

// Helper pour signer les URLs des photos
async function signUrl(rawUrl: string) {
  if (!rawUrl || !rawUrl.includes('t3.storageapi.dev')) return rawUrl;
  try {
    const key = rawUrl.split('.dev/').pop()?.split('?')[0] || '';
    const command = new GetObjectCommand({
      Bucket: process.env.RAILWAY_STORAGE_BUCKET,
      Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } catch (e) {
    console.error("Erreur signature image:", e);
    return rawUrl;
  }
}

function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === "string") {
    if (val.trim() === "") return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// CORRECTION PRINCIPALE : Nettoyer les "" → null AVANT Zod
// Le frontend envoie "" pour les selects vides (couleur, mesure,
// achatFibre, avertissementClient, etc.) mais Zod attend null
// ou une valeur d'enum valide — pas une chaîne vide.
// ═══════════════════════════════════════════════════════════════
function cleanEmptyStrings(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(cleanEmptyStrings);
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string" && value.trim() === "") {
        cleaned[key] = null;
      } else if (typeof value === "object" && value !== null && !(value instanceof Date)) {
        cleaned[key] = cleanEmptyStrings(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }
  return obj;
}

// Formatage des erreurs Zod
function formatZodErrors(zodError: any): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = [];
  if (zodError?.issues) {
    for (const issue of zodError.issues) {
      errors.push({
        field: issue.path.join("."),
        message: `${issue.path.join(".")}: ${issue.message}`,
      });
    }
  }
  return errors;
}

// Formatage des erreurs Prisma
function formatPrismaError(error: any): { field: string; message: string }[] {
  if (error?.code === 'P2002') return [{ field: 'numero', message: 'Ce numéro existe déjà' }];
  return [{ field: '_global', message: error?.message || 'Erreur base de données' }];
}

// -------------------------------------------------------------------------
// GET - Récupérer une commande par ID
// -------------------------------------------------------------------------
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id === "undefined") {
      return NextResponse.json({ error: "ID de commande invalide" }, { status: 400 });
    }

    const commande = await prisma.commande.findUnique({
      where: { id },
      include: {
        client: true,
        representant: true,
        balcons: { orderBy: { numeroPhase: "asc" } },
        structuresAchat: true,
        achatPhases: true,
        planifications: { include: { equipe: true }, orderBy: { datePlanifiee: "desc" }, take: 5 },
        productions: { orderBy: { dateProduction: "desc" }, take: 5 },
        interventions: {
          include: { equipe: true, responsable: true, photos: true },
          orderBy: { datePrevue: "desc" },
        },
        reprises: { include: { equipe: true }, orderBy: { dateReprise: "desc" } },
        achats: { include: { fournisseur: true }, orderBy: { dateCommande: "desc" } },
        historiqueStatuts: { orderBy: { dateChangement: "desc" }, take: 10 },
        _count: { select: { interventions: true, reprises: true, achats: true, productions: true } },
      },
    });

    if (!commande) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    // --- SIGNATURE DES PHOTOS ---
    if (commande.interventions) {
      for (const inter of commande.interventions) {
        if (inter.photos) {
          for (const photo of inter.photos) {
            photo.url = await signUrl(photo.url);
          }
        }
      }
    }

    const configs = await prisma.configuration.findMany();
    const configMap = Object.fromEntries(configs.map((c) => [c.cle, c.valeur]));

    return NextResponse.json({
      ...commande,
      config: {
        coutHeureInstallation: parseFloat(configMap.coutHeureInstallation || "160"),
        facteurTempsInstallation: parseFloat(configMap.facteurTempsInstallation || "0.7"),
      },
    });
  } catch (error) {
    console.error("Erreur GET commande:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
  }
}

// -------------------------------------------------------------------------
// PUT - Mettre à jour une commande
// -------------------------------------------------------------------------
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rawBody = await request.json();

    // ═══════════════════════════════════════════════════════
    // NETTOYAGE : convertir "" → null AVANT validation Zod
    // ═══════════════════════════════════════════════════════
    const body = cleanEmptyStrings(rawBody);

    // Protéger les champs obligatoires (ne doivent pas devenir null)
    if (body.numero === null) body.numero = "";
    if (body.clientId === null) body.clientId = "";
    if (body.adresse === null) body.adresse = "";

    const existingCommande = await prisma.commande.findUnique({ where: { id } });
    if (!existingCommande) {
      return NextResponse.json({ error: "Commande inexistante" }, { status: 404 });
    }

    const validation = commandeSchema.partial().safeParse(body);
    if (!validation.success) {
      console.error("Zod validation errors (PUT):", JSON.stringify(validation.error.flatten(), null, 2));
      return NextResponse.json(
        { error: "Invalide", fieldErrors: formatZodErrors(validation.error) },
        { status: 400 }
      );
    }

    const data = validation.data;
    const { balcons, structuresAchat, achatsPhase, ...rest } = data as any;

    // Recalcul des prix
    const prixVenteMateriaux = rest.prixVenteMateriaux ?? Number(existingCommande.prixVenteMateriaux);
    const prixVenteInstallation = rest.prixVenteInstallation ?? Number(existingCommande.prixVenteInstallation);

    // Construire l'objet updateData en nettoyant les enums
    const updateData: any = {};

    // Copier tous les champs scalaires du rest
    for (const [key, value] of Object.entries(rest)) {
      // Convertir les dates string en Date
      if (
        typeof value === "string" &&
        value.match(/^\d{4}-\d{2}-\d{2}/) &&
        (key.includes("date") || key.includes("Date") || key === "mesureDonneeLe" || key === "planApprobationEnvoyeLe" || key === "dateAvertissement" || key === "dateAvertissementPriseMesure")
      ) {
        updateData[key] = toDate(value);
      } else {
        updateData[key] = value;
      }
    }

    // Forcer le recalcul du prix total
    updateData.prixTotal = prixVenteMateriaux + prixVenteInstallation;

    // ─── Mise à jour des balcons si fournis ───
    if (balcons && Array.isArray(balcons) && balcons.length > 0) {
      // Supprimer les anciens balcons et recréer
      await prisma.balcon.deleteMany({ where: { commandeId: id } });
      await prisma.balcon.createMany({
        data: balcons.map((b: any, i: number) => ({
          commandeId: id,
          nom: b.nom || `Balcon ${i + 1}`,
          numeroPhase: b.numeroPhase || i + 1,
          piedsLineaires: b.piedsLineaires || 0,
          poteaux: b.poteaux || 0,
          coutBalcon: b.coutBalcon || 0,
          prixTotal: b.prixTotal || 0,
          produit: b.produit || false,
          installationTerminee: b.installationTerminee || false,
          reprise: b.reprise || false,
          notes: b.notes || null,
          datePrevue: toDate(b.datePrevue),
          prixVenteInstallation: b.prixVenteInstallation ?? null,
          mesure: b.mesure || null,
          plan: b.plan || null,
          planApprobationEnvoyeLe: toDate(b.planApprobationEnvoyeLe),
          envoyeProduction: b.envoyeProduction || null,
          termine: b.termine || null,
          installation: b.installation || null,
        })),
      });
    }

    // ─── Mise à jour des structures d'achat si fournies ───
    if (structuresAchat && Array.isArray(structuresAchat)) {
      await prisma.structureAchat.deleteMany({ where: { commandeId: id } });
      if (structuresAchat.length > 0) {
        await prisma.structureAchat.createMany({
          data: structuresAchat.map((s: any) => ({
            commandeId: id,
            nom: s.nom || "Structure",
            statutAchat: s.statutAchat || "A_FAIRE",
            dateEnvoie: toDate(s.dateEnvoie),
            dateReception: toDate(s.dateReception),
            quantiteNonRecue: s.quantiteNonRecue || null,
          })),
        });
      }
    }

    // ─── Mise à jour des achats par phase si fournis ───
    if (achatsPhase && Array.isArray(achatsPhase)) {
      await prisma.achatPhase.deleteMany({ where: { commandeId: id } });
      if (achatsPhase.length > 0) {
        await prisma.achatPhase.createMany({
          data: achatsPhase.map((a: any) => ({
            commandeId: id,
            phaseNumero: a.phaseNumero || 1,
            typeAchat: a.typeAchat,
            statut: a.statut || "A_FAIRE",
            dateEnvoie: toDate(a.dateEnvoie),
            dateReception: toDate(a.dateReception),
            quantiteNonRecue: a.quantiteNonRecue ?? null,
            codeProduit: a.codeProduit || null,
            description: a.description || null,
            quantite: a.quantite ?? null,
            prixUnitaire: a.prixUnitaire ?? null,
            couleur: a.couleur || null,
            epaisseur: a.epaisseur || null,
            typeVerre: a.typeVerre || null,
            longueur: a.longueur ?? null,
            hauteur: a.hauteur ?? null,
            notes: a.notes || null,
            details: a.details || null,
          })),
        });
      }
    }

    // ─── Historique de changement de statut ───
    if (rest.statut && rest.statut !== existingCommande.statut) {
      await prisma.historiqueStatut.create({
        data: {
          commandeId: id,
          ancienStatut: existingCommande.statut,
          nouveauStatut: rest.statut,
          commentaire: "Modification de la commande",
        },
      });
    }

    // ─── Update de la commande ───
    const commande = await prisma.commande.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, nom: true, type: true } },
        representant: { select: { id: true, nom: true } },
        balcons: { orderBy: { numeroPhase: "asc" } },
        structuresAchat: true,
        achatPhases: true,
      },
    });

    return NextResponse.json(commande);
  } catch (error: any) {
    console.error("Erreur PUT commande:", error);

    // Erreur Prisma connue
    if (error?.code) {
      return NextResponse.json(
        { error: "Erreur base de données", fieldErrors: formatPrismaError(error) },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur serveur", details: String(error) },
      { status: 500 }
    );
  }
}

// -------------------------------------------------------------------------
// DELETE - Supprimer une commande
// -------------------------------------------------------------------------
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.commande.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE commande:", error);
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}