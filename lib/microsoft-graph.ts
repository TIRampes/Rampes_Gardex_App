// ╔══════════════════════════════════════════════════════╗
// ║   CLIENT MICROSOFT GRAPH - OAuth2 Client Credentials ║
// ╚══════════════════════════════════════════════════════╝
// Ce module gère l'authentification OAuth2 pour Microsoft Graph et l'envoi d'emails via l'API Graph.

interface GraphTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface GraphMailMessage {
  message: {
    subject: string;
    body: {
      contentType: 'HTML' | 'Text';
      content: string;
    };
    toRecipients: Array<{
      emailAddress: {
        address: string;
        name?: string;
      };
    }>;
    ccRecipients?: Array<{
      emailAddress: {
        address: string;
        name?: string;
      };
    }>;
    importance?: 'low' | 'normal' | 'high';
  };
  saveToSentItems?: boolean;
}

// Cache du token en mémoire (valide ~3600s)
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Obtient un access token via OAuth2 client_credentials
 */
async function getAccessToken(): Promise<string> {
  // Retourner le token en cache s'il est encore valide (marge 5 min)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 300_000) {
    return cachedToken.token;
  }

  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      'Variables Azure manquantes : AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET'
    );
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Erreur OAuth2 Azure (${response.status}): ${err}`);
  }

  const data: GraphTokenResponse = await response.json();

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

/**
 * Envoie un email via Microsoft Graph API
 */
export async function sendMailViaGraph(params: {
  to: string;
  toName?: string;
  subject: string;
  htmlBody: string;
  cc?: Array<{ address: string; name?: string }>;
  importance?: 'low' | 'normal' | 'high';
  saveToSent?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const fromEmail = process.env.AZURE_MAIL_FROM;
  if (!fromEmail) {
    throw new Error('Variable AZURE_MAIL_FROM manquante');
  }

  const token = await getAccessToken();

  const mailPayload: GraphMailMessage = {
    message: {
      subject: params.subject,
      body: {
        contentType: 'HTML',
        content: params.htmlBody,
      },
      toRecipients: [
        {
          emailAddress: {
            address: params.to,
            ...(params.toName ? { name: params.toName } : {}),
          },
        },
      ],
      ...(params.cc?.length
        ? {
            ccRecipients: params.cc.map((c) => ({
              emailAddress: { address: c.address, ...(c.name ? { name: c.name } : {}) },
            })),
          }
        : {}),
      importance: params.importance || 'normal',
    },
    saveToSentItems: params.saveToSent ?? true,
  };

  // POST /users/{fromEmail}/sendMail
  const graphUrl = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(fromEmail)}/sendMail`;

  const response = await fetch(graphUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mailPayload),
  });

  // Graph API retourne 202 Accepted pour sendMail
  if (response.status === 202 || response.ok) {
    return { success: true };
  }

  const errBody = await response.text();
  console.error(` Graph sendMail erreur (${response.status}):`, errBody);
  return {
    success: false,
    error: `Graph API ${response.status}: ${errBody.substring(0, 300)}`,
  };
}