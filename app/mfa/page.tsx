// ╔══════════════════════════════════════════════════════════╗
// ║  FICHIER: app/(auth)/mfa/page.tsx                         ║
// ║  NOUVEAU — créer le dossier app/(auth)/mfa/               ║
// ╚══════════════════════════════════════════════════════════╝

'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function MFAPage() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [erreur, setErreur] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const { data: session } = useSession();

  // Focus sur le premier input au chargement
  useEffect(() => { inputRefs.current[0]?.focus(); }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // chiffres seulement

    const newCode = [...code];
    newCode[index] = value.slice(-1); // un seul chiffre
    setCode(newCode);
    setErreur('');

    // Passer au champ suivant
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit quand 6 chiffres remplis
    if (index === 5 && value) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        verifier(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Backspace → revenir au champ précédent
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      verifier(pasted);
    }
  };

  const verifier = async (fullCode: string) => {
    setLoading(true);
    setErreur('');

    try {
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fullCode }),
      });

      if (res.ok) {
        router.push('/dashboard/dashboard');
        router.refresh();
      } else {
        const data = await res.json();
        setErreur(data.error || 'Code invalide');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setErreur('Erreur de connexion');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[24rem] p-[2rem] text-center">
        {/* Icône cadenas */}
        <div className="w-[4rem] h-[4rem] mx-auto mb-[1.25rem] bg-slate-800 rounded-full flex items-center justify-center">
          <span className="text-[1.5rem]">🔐</span>
        </div>

        <h1 className="text-[1.375rem] font-bold text-slate-800 mb-[0.375rem]">Vérification requise</h1>
        <p className="text-[0.8125rem] text-slate-500 mb-[0.25rem]">
          Entrez le code à 6 chiffres de votre
        </p>
        <p className="text-[0.8125rem] text-slate-500 mb-[2rem]">
          application Microsoft Authenticator
        </p>

        {/* 6 inputs */}
        <div className="flex justify-center gap-[0.5rem] mb-[1.5rem]" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={loading}
              className={`w-[3rem] h-[3.5rem] text-center text-[1.5rem] font-bold border-2 rounded-xl outline-none transition-colors
                ${erreur ? 'border-red-400 bg-red-50' : digit ? 'border-slate-800 bg-slate-50' : 'border-slate-200'}
                focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                disabled:bg-slate-100 disabled:text-slate-400`}
            />
          ))}
        </div>

        {/* Erreur */}
        {erreur && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-[0.625rem] mb-[1rem]">
            <p className="text-red-600 text-[0.8125rem]">{erreur}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <p className="text-blue-600 text-[0.8125rem] mb-[1rem]">Vérification en cours...</p>
        )}

        {/* Info */}
        <p className="text-[0.6875rem] text-slate-400 mb-[1.5rem]">
          Connecté en tant que {session?.user?.email}
        </p>

        {/* Bouton déconnexion */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-[0.8125rem] text-slate-500 hover:text-slate-700 underline"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}