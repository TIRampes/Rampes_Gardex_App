// lib/graph.ts
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import 'isomorphic-fetch';

let graphClient: Client | null = null;

export function getGraphClient(): Client {
  if (graphClient) return graphClient;

  const tenantId = process.env.AZURE_TENANT_ID;
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const userEmail = process.env.AZURE_USER_EMAIL; // le compte qui envoie les emails

  if (!tenantId || !clientId || !clientSecret || !userEmail) {
    throw new Error('Missing Azure credentials');
  }

  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

  graphClient = Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await credential.getToken('https://graph.microsoft.com/.default');
        return token.token;
      },
    },
    
  });

  return graphClient;
}

export async function sendEmail(
  to: string[],
  subject: string,
  body: string
): Promise<void> {
  const client = getGraphClient();
  const userEmail = process.env.AZURE_USER_EMAIL!;

  const message = {
    message: {
      subject,
      body: {
        contentType: 'Text',
        content: body,
      },
      toRecipients: to.map(email => ({
        emailAddress: { address: email },
      })),
    },
    saveToSentItems: true,
  };

  await client.api(`/users/${userEmail}/sendMail`).post(message);
}