"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface SlidePanelProps {
  open: boolean;
  onClose: () => void;
  titre: string;
  sousTitre?: string;
  largeur?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function SlidePanel({ open, onClose, titre, sousTitre, largeur = "max-w-[32rem]", children, footer }: SlidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`absolute right-0 top-0 bottom-0 ${largeur} w-full bg-white shadow-2xl flex flex-col animate-[slideIn_0.25s_ease-out]`}
        style={{ animationFillMode: "forwards" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[1.25rem] py-[1rem] border-b border-slate-200 bg-slate-50/80">
          <div className="min-w-0">
            <h2 className="text-[1rem] font-bold text-slate-800 truncate">{titre}</h2>
            {sousTitre && <p className="text-[0.75rem] text-slate-500 mt-[0.125rem]">{sousTitre}</p>}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-[0.75rem] p-[0.375rem] rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-[1.125rem] h-[1.125rem]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-[1.25rem] py-[1rem]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-[1.25rem] py-[0.875rem] border-t border-slate-200 bg-slate-50/80">
            {footer}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}