'use client';

import { useEffect, useRef } from 'react';

interface SlidePanelProps {
  ouvert: boolean;
  onFermer: () => void;
  titre: string;
  children: React.ReactNode;
  largeur?: string;
}

export default function SlidePanel({ ouvert, onFermer, titre, children, largeur = 'max-w-[36rem]' }: SlidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer();
    };
    if (ouvert) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [ouvert, onFermer]);

  if (!ouvert) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={onFermer}
      />
      {/* Panel */}
      <div
        ref={panelRef}
        className={`absolute top-0 right-0 h-full ${largeur} w-full bg-white shadow-2xl flex flex-col animate-slide-in`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[1.5rem] py-[1rem] border-b border-slate-200 bg-slate-50">
          <h2 className="text-[1.125rem] font-bold text-slate-800">{titre}</h2>
          <button
            onClick={onFermer}
            className="p-[0.375rem] hover:bg-slate-200 rounded-lg transition-colors"
            title="Fermer (Échap)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-[1.5rem] py-[1.25rem]">
          {children}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}