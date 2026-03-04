'use client';

import { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';

// ╔══════════════════════════════════════════╗
// ║             KEBAB MENU (⋮)               ║
// ╚══════════════════════════════════════════╝

interface ActionItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  icone?: string;
}

export function KebabMenu({ actions }: { actions: ActionItem[] }) {
  const [ouvert, setOuvert] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOuvert(false);
      }
    };
    if (ouvert) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [ouvert]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOuvert(!ouvert);
        }}
        className="p-[0.375rem] hover:bg-slate-200 rounded-lg transition-colors"
        title="Actions"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {ouvert && (
        <div className="absolute right-0 top-full mt-[0.25rem] bg-white border border-slate-200 rounded-lg shadow-xl z-50 min-w-[10rem] py-[0.25rem]">
          {actions.map((action, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setOuvert(false);
                action.onClick();
              }}
              className={`w-full text-left px-[0.75rem] py-[0.5rem] text-[0.8125rem] hover:bg-slate-100 transition-colors ${
                action.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700'
              }`}
            >
              {action.icone && <span className="mr-[0.5rem]">{action.icone}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ╔══════════════════════════════════════════╗
// ║          CONFIRM DIALOG                  ║
// ╚══════════════════════════════════════════╝

interface ConfirmDialogProps {
  ouvert: boolean;
  titre: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  labelConfirm?: string;
  danger?: boolean;
}

export function ConfirmDialog({ ouvert, titre, message, onConfirm, onCancel, labelConfirm = 'Confirmer', danger = false }: ConfirmDialogProps) {
  if (!ouvert) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-[1rem]">
      <div className="bg-white rounded-xl shadow-2xl max-w-[26rem] w-full p-[1.5rem]">
        <h3 className="text-[1.0625rem] font-bold text-slate-800 mb-[0.5rem]">{titre}</h3>
        <p className="text-[0.875rem] text-slate-600 mb-[1.5rem]">{message}</p>
        <div className="flex justify-end gap-[0.75rem]">
          <button
            onClick={onCancel}
            className="px-[1rem] py-[0.5rem] border border-slate-300 rounded-lg text-[0.875rem] hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className={`px-[1rem] py-[0.5rem] rounded-lg text-[0.875rem] font-semibold text-white transition-colors ${
              danger
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {labelConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}

// ╔══════════════════════════════════════════╗
// ║              TOAST                       ║
// ╚══════════════════════════════════════════╝

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let nextId = useRef(0);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const couleurs: Record<ToastType, string> = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  const icones: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Container toasts */}
      <div className="fixed bottom-[1rem] right-[1rem] z-[70] flex flex-col gap-[0.5rem]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${couleurs[t.type]} text-white px-[1rem] py-[0.75rem] rounded-lg shadow-lg flex items-center gap-[0.5rem] text-[0.875rem] font-medium animate-toast-in max-w-[22rem]`}
          >
            <span className="text-[1rem] font-bold">{icones[t.type]}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes toastIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-toast-in {
          animation: toastIn 0.3s ease-out;
        }
      `}</style>
    </ToastContext.Provider>
  );
}