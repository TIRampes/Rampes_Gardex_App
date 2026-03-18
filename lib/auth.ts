// ╔══════════════════════════════════════════════════════════╗
// ║  FICHIER: lib/auth.ts                                     ║
// ║  REMPLACE ton lib/auth.ts existant                        ║
// ╚══════════════════════════════════════════════════════════╝

import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Login Microsoft — chercher le rôle dans la BD par email
      if (account?.provider === "microsoft-entra-id" && token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            include: { equipe: { select: { id: true, nom: true } } },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.equipeId = dbUser.equipeId;
            token.equipeNom = dbUser.equipe?.nom || null;
          } else {
            // Email pas dans la table users → EMPLOYE par défaut
            token.role = "EMPLOYE";
          }
        } catch {
          token.role = "EMPLOYE";
        }
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role || "EMPLOYE";
        (session.user as any).equipeId = token.equipeId || null;
        (session.user as any).equipeNom = token.equipeNom || null;
        (session.user as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  trustHost: true,
});