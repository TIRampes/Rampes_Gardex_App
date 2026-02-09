"use client";

import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { width: 120, height: 40 },
  md: { width: 150, height: 50 },
  lg: { width: 200, height: 67 },
};

export default function Logo({ size = "md", className = "" }: LogoProps) {
  const dimensions = sizeMap[size];

  return (
    <Link href="/dashboard" className={`block ${className}`}>
      <Image
        src="/images/logo-gardex.png"
        alt="Rampes Gardex"
        width={dimensions.width}
        height={dimensions.height}
        className="object-contain"
        priority
      />
    </Link>
  );
}

// Logo animé pour la page de connexion
export function LogoAnimated({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-gardex-orange/20 rounded-full blur-xl animate-pulse" />
        <Image
          src="/images/logo-gardex.png"
          alt="Rampes Gardex"
          width={180}
          height={60}
          className="relative object-contain"
          priority
        />
      </div>
      <p className="text-gardex-orange/80 text-sm mt-3 italic">
        Fabricant de rampes d&apos;aluminium
      </p>
    </div>
  );
}