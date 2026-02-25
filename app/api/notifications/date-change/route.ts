import { NextResponse } from "next/server";
import twilio from "twilio";
import { Resend } from "resend";

// Initialiser les clients (à configurer dans .env)
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { commande, toSms, toEmails } = body;

    // Formatter la date pour l'affichage (semaine)
    const formatDateToWeek = (dateStr: string) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      const week = Math.ceil(((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
      return `Semaine finissant le ${d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    };

    const ancienneSemaine = commande.ancienneDate ? formatDateToWeek(commande.ancienneDate) : "";
    const nouvelleSemaine = commande.nouvelleDate ? formatDateToWeek(commande.nouvelleDate) : "";

    // Construire le message email professionnel
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #003366; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Les Rampes Gardex</h1>
        </div>
        <div style="background-color: #f5f5f5; padding: 20px;">
          <h2 style="color: #003366;">Avis de changement de date</h2>
          <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <hr style="border: 1px solid #ddd;" />
          <p><strong>Client :</strong> ${commande.clientNom || ""}</p>
          <br />
          <p><strong>Représentant :</strong> ${commande.representantNom || ""}</p>
          <br />
          <p><strong>Commande :</strong> ${commande.numero || ""}</p>
          <br />
          <p><strong>Référence :</strong> ${commande.reference || ""}</p>
          <br />
          <p><strong>Ville :</strong> ${commande.ville || ""}</p>
          <br />
          <p><strong>Type de commande :</strong> ${commande.typeCommande || ""}</p>
          <br />
          <p><strong>Couleur des rampes :</strong> ${commande.couleur || ""}</p>
          <hr style="border: 1px solid #ddd;" />
          <p><strong>Date modifiée</strong></p>
          <p><strong>Ancienne date de livraison :</strong> ${ancienneSemaine}</p>
          <br />
          <p><strong>Nouvelle date de livraison :</strong> ${nouvelleSemaine}</p>
          <br />
          <hr style="border: 1px solid #ddd;" />
          <p><strong>Raison du changement de date :</strong></p>
          <p style="background-color: white; padding: 15px; border-left: 4px solid #003366;">${commande.raison || ""}</p>
          <hr style="border: 1px solid #ddd;" />
          <br />
          <p>Pour toutes questions, veuillez communiquer avec votre représentant, ${commande.representantNom || ""},<br /> par courriel au <a href="mailto:${commande.representantEmail || ""}">${commande.representantEmail || ""}</a><br /> ou par téléphone au: ${commande.representantTelephone || ""}.</p>
          <p style="font-size: 0.9em; color: #666;">Merci de votre confiance.</p>
        </div>
      </div>
    `;

    // Envoi des SMS (via Twilio)
    const smsPromises = toSms.map(async (phone: string) => {
      // Simplifier le message pour SMS (caractères limités)
      const smsMessage = 
`Les Rampes Gardex

Changement de date -Commande numero:${commande.numero}

Ancienne semaine : ${ancienneSemaine}

Nouvelle semaine : ${nouvelleSemaine}

Raison :
${commande.raison || "Non spécifiée"}

Pour plus d'informations, veuillez contacter votre représentant :
${commande.representantNom || "—"}
${commande.representantEmail ? `Email : ${commande.representantEmail}` : ""}
${commande.representantTelephone ? `Téléphone : ${commande.representantTelephone}` : ""}`;  
      try {
        await twilioClient.messages.create({
          body: smsMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone,
        });
      } catch (err) {
        console.error(`Erreur envoi SMS à ${phone}:`, err);
      }
    });

    // Envoi des emails
    const emailPromises = toEmails.map(async (email: string) => {
      try {
        await resend.emails.send({
          from: "...@resend.dev",
          to: email,
          subject: `Avis de changement de date - Commande ${commande.numero}`,
          html: emailHtml,
        });
      } catch (err) {
        console.error(`Erreur envoi email à ${email}:`, err);
      }
    });

    await Promise.all([...smsPromises, ...emailPromises]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur API notification:", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
  }
}