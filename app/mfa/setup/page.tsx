// ╔══════════════════════════════════════════════════════════╗
// ║  FICHIER: app/(auth)/mfa/setup/page.tsx                   ║
// ║  NOUVEAU — page pour activer/désactiver le MFA            ║
// ║  Accessible via /mfa/setup                                ║
// ╚══════════════════════════════════════════════════════════╝

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function MFASetupPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [etape, setEtape] = useState<'chargement' | 'inactif' | 'scan' | 'confirmer' | 'actif'>('chargement');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState('');
  const [loading, setLoading] = useState(false);

  // Vérifier si MFA déjà actif
  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/auth/mfa/verify');
        const data = await res.json();
        setEtape(data.required ? 'actif' : 'inactif');
      } catch {
        setEtape('inactif');
      }
    }
    check();
  }, []);

  // Étape 1: Générer le QR code
  const lancerSetup = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/mfa/setup');
      const data = await res.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setEtape('scan');
    } catch {
      setErreur('Erreur lors de la génération du QR code');
    }
    setLoading(false);
  };

  // Étape 2: Confirmer avec le premier code
  const confirmerCode = async () => {
    if (code.length !== 6) { setErreur('Entrez un code à 6 chiffres'); return; }
    setLoading(true);
    setErreur('');
    try {
      const res = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret, code }),
      });
      if (res.ok) {
        // Poser le cookie MFA pour cette session
        await fetch('/api/auth/mfa/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        setEtape('actif');
      } else {
        const data = await res.json();
        setErreur(data.error || 'Code invalide');
      }
    } catch {
      setErreur('Erreur de connexion');
    }
    setLoading(false);
  };

  // Désactiver le MFA
  const desactiver = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/mfa/setup', { method: 'DELETE' });
      if (res.ok) setEtape('inactif');
    } catch {}
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-[1rem]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[28rem] p-[2rem]">

        {/* CHARGEMENT */}
        {etape === 'chargement' && (
          <p className="text-center text-slate-500">Chargement...</p>
        )}

        {/* MFA NON ACTIVÉ */}
        {etape === 'inactif' && (
          <div className="text-center">
            <div className="w-[4rem] h-[4rem] mx-auto mb-[1rem] bg-slate-100 rounded-full flex items-center justify-center">
              <span className="text-[1.5rem]">🔓</span>
            </div>
            <h1 className="text-[1.25rem] font-bold text-slate-800 mb-[0.5rem]">Authentification à deux facteurs</h1>
            <p className="text-[0.8125rem] text-slate-500 mb-[1.5rem]">
              Ajoutez une couche de sécurité supplémentaire à votre compte avec Microsoft Authenticator ou toute autre application TOTP.
            </p>
            <button
              onClick={lancerSetup}
              disabled={loading}
              className="w-full py-[0.75rem] bg-slate-800 hover:bg-slate-700 disabled:bg-slate-400 text-white font-semibold rounded-xl text-[0.9375rem]"
            >
              {loading ? 'Chargement...' : 'Activer le MFA'}
            </button>
            <button
              onClick={() => router.push('/dashboard/dashboard')}
              className="mt-[0.75rem] text-[0.8125rem] text-slate-500 hover:text-slate-700 underline"
            >
              Retour au dashboard
            </button>
          </div>
        )}

        {/* SCANNER LE QR CODE */}
        {etape === 'scan' && (
          <div className="text-center">
            <h1 className="text-[1.25rem] font-bold text-slate-800 mb-[0.375rem]">Scannez ce QR code</h1>
            <p className="text-[0.8125rem] text-slate-500 mb-[1.25rem]">
              Ouvrez Microsoft Authenticator et scannez ce code
            </p>
            {qrCode && (
              <div className="bg-white p-[1rem] rounded-xl border-2 border-slate-200 inline-block mb-[1rem]">
                <img src={qrCode} alt="QR Code MFA" className="w-[12rem] h-[12rem]"/>
              </div>
            )}
            <p className="text-[0.6875rem] text-slate-400 mb-[1rem]">
              Ou entrez manuellement la clé: <br/>
              <code className="bg-slate-100 px-[0.5rem] py-[0.25rem] rounded text-[0.625rem] font-mono select-all">{secret}</code>
            </p>
            <button
              onClick={() => setEtape('confirmer')}
              className="w-full py-[0.75rem] bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-[0.9375rem]"
            >
              J&apos;ai scanné le code
            </button>
          </div>
        )}

        {/* CONFIRMER AVEC LE PREMIER CODE */}
        {etape === 'confirmer' && (
          <div className="text-center">
            <h1 className="text-[1.25rem] font-bold text-slate-800 mb-[0.375rem]">Confirmez l&apos;activation</h1>
            <p className="text-[0.8125rem] text-slate-500 mb-[1.5rem]">
              Entrez le code à 6 chiffres affiché dans votre application
            </p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setErreur(''); }}
              className="w-full px-[1rem] py-[0.875rem] text-center text-[1.5rem] font-mono font-bold border-2 border-slate-200 rounded-xl mb-[1rem] focus:border-blue-500 outline-none tracking-[0.5rem]"
              placeholder="000000"
              autoFocus
            />
            {erreur && <p className="text-red-600 text-[0.8125rem] mb-[0.75rem]">{erreur}</p>}
            <button
              onClick={confirmerCode}
              disabled={loading || code.length !== 6}
              className="w-full py-[0.75rem] bg-slate-800 hover:bg-slate-700 disabled:bg-slate-400 text-white font-semibold rounded-xl text-[0.9375rem]"
            >
              {loading ? 'Vérification...' : 'Confirmer et activer'}
            </button>
            <button onClick={() => setEtape('scan')} className="mt-[0.75rem] text-[0.8125rem] text-slate-500 underline">
              Revenir au QR code
            </button>
          </div>
        )}

        {/* MFA ACTIVÉ */}
        {etape === 'actif' && (
          <div className="text-center">
            <div className="w-[4rem] h-[4rem] mx-auto mb-[1rem] bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-[1.5rem]">✅</span>
            </div>
            <h1 className="text-[1.25rem] font-bold text-slate-800 mb-[0.375rem]">MFA activé</h1>
            <p className="text-[0.8125rem] text-slate-500 mb-[1.5rem]">
              Votre compte est protégé par l&apos;authentification à deux facteurs. Un code sera demandé à chaque connexion.
            </p>
            <button
              onClick={() => router.push('/dashboard/dashboard')}
              className="w-full py-[0.75rem] bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-[0.9375rem] mb-[0.75rem]"
            >
              Retour au dashboard
            </button>
            <button
              onClick={desactiver}
              disabled={loading}
              className="text-[0.8125rem] text-red-500 hover:text-red-700 underline"
            >
              {loading ? 'Désactivation...' : 'Désactiver le MFA'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}