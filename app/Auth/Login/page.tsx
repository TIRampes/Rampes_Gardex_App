"use client";

import { useState,FormEvent } from "react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";


export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Connexion Microsoft Entra ID
  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      await signIn("microsoft-entra-id", { callbackUrl: "/dashboard/dashboard" });
    } catch (err) {
      setError("Erreur de connexion Microsoft");
      setIsLoading(false);
    }
  };

  // Connexion email/mot de passe
  const handleCredentialsLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoadingCredentials(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou mot de passe incorrect");
      } else {
        window.location.href = "/dashboard/dashboard";
      }
    } catch (err) {
      setError("Erreur de connexion");
    } finally {
      setIsLoadingCredentials(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Image de fond avec overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/background-login.jpg"
          alt="Projets Rampes Gardex"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a2332]/95 via-[#1a2332]/85 to-[#1a2332]/90" />
        
        {/* Effet de particules/lumière */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gardex-orange/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gardex-orange/10 rounded-full blur-[120px]" />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 w-full max-w-5xl mx-4 flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
        
        {/* Section gauche - Branding */}
        <div className="flex-1 text-center lg:text-left">
          {/* Logo */}
          <div className="mb-6">
            <Image
              src="/images/logo-gardex.png"
              alt="Rampes Gardex"
              width={280}
              height={93}
              className="mx-auto lg:mx-0"
              priority
            />
          </div>
          
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Système de gestion
            <span className="block text-gardex-orange">Rampes Gardex</span>
          </h1>
          
          <p className="text-gray-300 text-lg mb-8 max-w-md mx-auto lg:mx-0">
            Gérez vos commandes, production et interventions terrain en toute simplicité.
          </p>

          {/* Features - visible seulement sur grand écran */}
          <div className="hidden lg:grid grid-cols-2 gap-4 max-w-md">
            <FeatureCard icon="📊" text="Tableau de bord en temps réel" />
            <FeatureCard icon="📱" text="Accès mobile optimisé" />
            <FeatureCard icon="🔧" text="Gestion des interventions" />
            <FeatureCard icon="📦" text="Suivi des commandes" />
          </div>
        </div>

        {/* Section droite - Formulaire de connexion */}
        <div className="w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Connexion</h2>
              <p className="text-gray-600">Accédez à votre espace de travail</p>
            </div>

            {/* Erreur */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Bouton Microsoft Entra ID */}
            <button
              onClick={handleMicrosoftLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-[#2F2F2F] hover:bg-[#1a1a1a] text-white font-semibold px-6 py-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <Spinner />
              ) : (
                <>
                  <MicrosoftIcon />
                  <span>Continuer avec Microsoft</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-gray-500 text-sm">ou avec votre compte</span>
              </div>
            </div>

            {/* Formulaire email/mot de passe */}
            <form onSubmit={handleCredentialsLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse courriel
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="votre.nom@rampesgardex.com"
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gardex-orange focus:border-transparent transition-all duration-200 outline-none text-gray-900 placeholder-gray-400"
                  required
                />
              </div>
            {/* Mot de passe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gardex-orange focus:border-transparent transition-all duration-200 outline-none text-gray-900"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoadingCredentials}
                className="w-full bg-gradient-to-r from-gardex-orange to-[#e6951f] hover:from-[#e6951f] hover:to-gardex-orange text-white font-bold px-6 py-4 rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoadingCredentials ? <Spinner /> : "Se connecter"}
              </button>
            </form>

            {/* Liens */}
            <div className="mt-6 text-center space-y-3">
              <Link 
                href="/forgot-password" 
                className="text-sm text-gardex-orange hover:underline font-medium"
              >
                Mot de passe oublié ?
              </Link>
              {/* Lien vers la page d'inscription */}
              <p className="text-sm text-gray-600">
                Pas encore de compte ?{" "}
                <Link href="/auth/register" className="text-gardex-orange hover:underline font-semibold">
                  Créer un compte
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-400 text-sm mt-6">
            © {new Date().getFullYear()} Rampes Gardex. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}

// Composants
function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
      <rect width="10" height="10" fill="#F25022" />
      <rect x="11" width="10" height="10" fill="#7FBA00" />
      <rect y="11" width="10" height="10" fill="#00A4EF" />
      <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

function FeatureCard({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
      <span className="text-xl">{icon}</span>
      <span className="text-white text-sm">{text}</span>
    </div>
  );
}