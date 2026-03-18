// ╔══════════════════════════════════════════════════════════╗
// ║  FICHIER: lib/mfa.ts                                      ║
// ║  NOUVEAU — copier dans lib/                               ║
// ║  npm install otpauth qrcode                               ║
// ╚══════════════════════════════════════════════════════════╝

import * as OTPAuth from 'otpauth';

const APP_NAME = 'Rampes Gardex';

/** Génère un nouveau secret TOTP pour un utilisateur */
export function genererSecret(email: string): { secret: string; uri: string } {
  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: new OTPAuth.Secret({ size: 20 }),
  });

  return {
    secret: totp.secret.base32,
    uri: totp.toString(),
  };
}

/** Vérifie un code TOTP (6 chiffres) contre un secret */
export function verifierCode(secret: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  // window: 1 = accepte le code précédent et suivant (±30s)
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}