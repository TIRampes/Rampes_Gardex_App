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
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

// Formatage des erreurs Zod
function formatZodErrors(zodError: any): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = [];
  const flat = zodError.flatten();
  if (flat.fieldErrors) {
    for (const [field, msgs] of Object.entries(flat.fieldErrors)) {
      const messages = msgs as string[];
      if (messages?.length) {
        errors.push({ field, message: `${field}: ${messages[0]}` });
      }
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
    const body = await request.json();

    const existingCommande = await prisma.commande.findUnique({ where: { id } });
    if (!existingCommande) return NextResponse.json({ error: "Inexistant" }, { status: 404 });

    const validation = commandeSchema.partial().safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalide", fieldErrors: formatZodErrors(validation.error) }, { status: 400 });
    }

    const data = validation.data;
    const { balcons, structuresAchat, achatsPhase, ...rest } = data as any;

    const updateData: any = { ...rest };
    
    // Recalcul des prix et pieds si nécessaire
    updateData.prixTotal = (rest.prixVenteMateriaux ?? Number(existingCommande.prixVenteMateriaux)) + 
                           (rest.prixVenteInstallation ?? Number(existingCommande.prixVenteInstallation));

    const commande = await prisma.commande.update({
      where: { id },
      data: updateData,
      include: { client: true, balcons: true }
    });

    return NextResponse.json(commande);
  } catch (error) {
    console.error("Erreur PUT:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
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
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }
}