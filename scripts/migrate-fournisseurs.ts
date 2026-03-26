import { PrismaClient, TypeAchat } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Liste des types d'achat à assigner aléatoirement (sans FIBRE ni AUTRE si vous préférez)
const typesAchatPossibles: TypeAchat[] = [
  TypeAchat.LIMONS,
  TypeAchat.VERRES,
  TypeAchat.COLONNES,
  TypeAchat.PEINTURE,
  TypeAchat.ATTACHES,
  TypeAchat.PLANCHER_ALUMINIUM,
];

function getRandomTypeAchat(): TypeAchat {
  const randomIndex = Math.floor(Math.random() * typesAchatPossibles.length);
  return typesAchatPossibles[randomIndex];
}

async function main() {
  const filePath = path.join(__dirname, '..', 'data', 'Logistique_Fournisseur.csv');
  console.log(`📁 Lecture du fichier : ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.error('❌ Fichier CSV introuvable.');
    process.exit(1);
  }

  const records: any[] = [];
  const parser = fs.createReadStream(filePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      relax_quotes: true,
    })
  );

  for await (const record of parser) {
    records.push(record);
  }

  console.log(`📄 ${records.length} fournisseurs trouvés dans le CSV.`);

  let imported = 0;
  let skipped = 0;

  for (const row of records) {
    const nom = row.Fournisseur?.trim();
    if (!nom) {
      console.warn(`⚠️ Ligne ignorée (nom manquant) : ${JSON.stringify(row)}`);
      skipped++;
      continue;
    }

    const adresseParts = [
      row.Adresse_Fournisseur,
      row.CodePostal_Fournisseur,
      row.Ville_Fournisseur,
      row.Province_Fournisseur,
      row.Pays_Fournisseur,
    ].filter((part) => part && part.trim() !== '');
    const adresse = adresseParts.length > 0 ? adresseParts.join(', ') : null;

    const data = {
      nom,
      contact: row.Contact_Fournisseur?.trim() || null,
      telephone: row.Telephone_Fournisseur?.trim() || null,
      email: row.Email_Fournisseur?.trim() || null,
      adresse,
      notes: row.Transport_Fournisseur?.trim() || null,
      actif: true,
      typeAchat: getRandomTypeAchat(),
      formulaireNom: null,
      formulaireMime: null,
      formulaireData: null,
    };

    const existing = await prisma.fournisseur.findFirst({
      where: { nom: data.nom },
    });

    if (existing) {
      console.log(`⏭️ Fournisseur déjà existant : ${data.nom} (ID: ${existing.id})`);
      skipped++;
      continue;
    }

    try {
      await prisma.fournisseur.create({ data });
      console.log(`✅ Fournisseur créé : ${data.nom} (type: ${data.typeAchat})`);
      imported++;
    } catch (error) {
      console.error(`❌ Erreur pour ${data.nom} :`, error);
      skipped++;
    }
  }

  console.log(`\n🎉 Import terminé : ${imported} créés, ${skipped} ignorés.`);
}

main()
  .catch((e) => {
    console.error('Erreur fatale :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });