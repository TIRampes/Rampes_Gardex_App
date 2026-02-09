"use client";

import { useState } from "react";
import Image from "next/image";

// Icône Microsoft
const MicrosoftIcon = () => (
  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="10" height="10" fill="#F25022" />
    <rect x="11" width="10" height="10" fill="#7FBA00" />
    <rect y="11" width="10" height="10" fill="#00A4EF" />
    <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
  </svg>
);

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    // Simuler un délai puis rediriger
    await new Promise((resolve) => setTimeout(resolve, 1500));
    window.location.href = "/dashboard/dashboard";
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Section gauche - Branding (visible desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gardex-black relative overflow-hidden">
        {/* Effets décoratifs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gardex-orange/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gardex-orange/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

        {/* Contenu */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          {/* Logo */}
          <div className="mb-8">
            <Image
              src="/images/logo-gardex.png"
              alt="Rampes Gardex"
              width={250}
              height={83}
              className="object-contain"
              priority
            />
          </div>
          <p className="text-gardex-orange/80 text-lg italic mb-12">
            Fabricant de rampes d&apos;aluminium
          </p>

          {/* Caractéristiques */}
          <div className="max-w-md space-y-4">
            <FeatureItem icon="📊" title="Gestion complète" description="Commandes, production et interventions" />
            <FeatureItem icon="📱" title="Accès mobile" description="Formulaires terrain sur tous appareils" />
            <FeatureItem icon="📈" title="Tableaux de bord" description="KPIs et performances en temps réel" />
            <FeatureItem icon="🔒" title="Sécurisé" description="Authentification Microsoft Azure AD" />
          </div>

          {/* Footer */}
          <p className="absolute bottom-8 text-gray-500 text-sm">
            © {new Date().getFullYear()} Rampes Gardex. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Section droite - Formulaire */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen lg:min-h-0">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden flex justify-center mb-6">
            <div className="bg-gardex-black rounded-2xl p-6">
              <Image
                src="/images/logo-gardex.png"
                alt="Rampes Gardex"
                width={180}
                height={60}
                className="object-contain"
                priority
              />
              <p className="text-gardex-orange/80 text-sm mt-2 text-center italic">
                Fabricant de rampes d&apos;aluminium
              </p>
            </div>
          </div>

          {/* Carte de connexion */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Bienvenue</h1>
              <p className="text-sm sm:text-base text-gray-600">
                Connectez-vous avec votre compte Microsoft professionnel
              </p>
            </div>

            {/* Bouton Microsoft */}
            <button
              onClick={handleMicrosoftLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-gardex-orange hover:bg-gardex-orange/5 text-gray-700 font-medium px-4 sm:px-6 py-3 sm:py-4 rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gardex-orange border-t-transparent rounded-full animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <MicrosoftIcon />
                  <span>Se connecter avec Microsoft</span>
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-500 mt-6">
              Utilisez votre compte Microsoft professionnel
            </p>
          </div>

          {/* Aide */}
          <div className="mt-4 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              Problème de connexion?{" "}
              <a href="mailto:support@rampesgardex.com" className="text-gardex-orange hover:underline font-medium">
                Contactez le support
              </a>
            </p>
          </div>

          {/* Footer mobile */}
          <p className="lg:hidden mt-8 text-center text-gray-400 text-xs">
            © {new Date().getFullYear()} Rampes Gardex
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="text-2xl">{icon}</div>
      <div>
        <h3 className="text-white font-semibold">{title}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </div>
  );
}