import { z } from "zod";

export const TypeClient = z.enum([
   "ENTREPRENEUR",
   "RESIDENTIEL",
   "DISTRIBUTEUR",
   "AMBASSADEUR",
]);


export const clientSchema = z.object({
  nom: z.string().min(1, "Le nom est obligatoire"),

  type: TypeClient,

  adresse: z.string().min(1, "L'adresse est obligatoire"),

  ville: z.string().nullable().optional(),

  province: z.string().nullable().optional(),

  codePostal: z.string().nullable().optional(),

  pays: z.string().nullable().optional(),

  telephone: z
    .string()
    .min(1, "Le téléphone est obligatoire"),

  cellulaire: z.string().nullable().optional(),

  fax: z.string().nullable().optional(),

  personne_Contact: z
    .string()
    .min(1, "La personne contact est obligatoire"),

  emails: z
    .array(z.string().email("Email invalide"))
    .default([]),

  communicationTexto: z.boolean().default(false),

  communicationCourriel: z.boolean().default(true),

  communicationTelephone: z.boolean().default(false),

  commentaires: z.string().nullable().optional(),
});
