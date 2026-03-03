"use client";

import { useState, useEffect, useRef } from "react";
import { AlertTriangle, MoreVertical, Check, X as XIcon, Loader2 } from "lucide-react";

// ══════════════════════════════════════════
// CONFIRM DIALOG
// ══════════════════════════════════════════

interface ConfirmDialogProps {
  open: boolean;
  titre: string;
  message: string;
  labelConfirm?: string;
  variante?: "danger" | "warning";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, titre, message, labelConfirm = "Confirmer", variante = "danger", loading, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;
  const colors = variante === "danger"
    ? { bg: "bg-red-100", icon: "text-red-600", btn: "bg-red-600 hover:bg-red-700" }
    : { bg: "bg-amber-100", icon: "text-amber-600", btn: "bg-amber-600 hover:bg-amber-700" };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-[0.75rem]">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[1px]" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[24rem] p-[1.5rem]">
        <div className={`w-[2.75rem] h-[2.75rem] ${colors.bg} rounded-xl flex items-center justify-center mx-auto mb-[1rem]`}>
          <AlertTriangle className={`w-[1.25rem] h-[1.25rem] ${colors.icon}`} />
        </div>
        <h3 className="text-[1rem] font-bold text-slate-800 text-center mb-[0.375rem]">{titre}</h3>
        <p className="text-[0.8125rem] text-slate-500 text-center leading-relaxed mb-[1.25rem]">{message}</p>
        <div className="flex gap-[0.5rem]">
          <button onClick={onCancel} disabled={loading} className="flex-1 px-[0.875rem] py-[0.5rem] border border-slate-300 rounded-xl text-[0.8125rem] font-medium hover:bg-slate-50 transition-colors">
            Annuler
          </button>
          <button onClick={onConfirm} disabled={loading} className={`flex-1 px-[0.875rem] py-[0.5rem] ${colors.btn} text-white rounded-xl text-[0.8125rem] font-semibold transition-colors flex items-center justify-center gap-[0.375rem]`}>
            {loading ? <Loader2 className="w-[0.875rem] h-[0.875rem] animate-spin" /> : null}
            {labelConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// ACTION MENU (kebab 3 dots)
// ══════════════════════════════════════════

interface ActionItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface ActionMenuProps {
  actions: ActionItem[];
}

export function ActionMenu({ actions }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-[0.375rem] rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <MoreVertical className="w-[1rem] h-[1rem]" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-[0.25rem] bg-white border border-slate-200 rounded-xl shadow-xl z-40 min-w-[10rem] overflow-hidden py-[0.25rem]">
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); a.onClick(); setOpen(false); }}
              disabled={a.disabled}
              className={`w-full px-[0.75rem] py-[0.5rem] text-left flex items-center gap-[0.5rem] text-[0.8125rem] transition-colors ${
                a.danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50"
              } ${a.disabled ? "opacity-40 pointer-events-none" : ""}`}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  visible: boolean;
  onClose: () => void;
}

export function Toast({ message, type, visible, onClose }: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [visible, onClose]);

  if (!visible) return null;

  const colors = {
    success: "bg-emerald-600",
    error: "bg-red-600",
    info: "bg-sky-600",
  };
  const icons = {
    success: <Check className="w-[0.875rem] h-[0.875rem]" />,
    error: <XIcon className="w-[0.875rem] h-[0.875rem]" />,
    info: <Check className="w-[0.875rem] h-[0.875rem]" />,
  };

  return (
    <div className="fixed bottom-[1.5rem] right-[1.5rem] z-[70] animate-[slideUp_0.3s_ease-out]">
      <div className={`${colors[type]} text-white px-[1rem] py-[0.625rem] rounded-xl shadow-xl flex items-center gap-[0.5rem] text-[0.8125rem] font-medium`}>
        {icons[type]}
        {message}
        <button onClick={onClose} className="ml-[0.5rem] p-[0.125rem] rounded hover:bg-white/20 transition-colors">
          <XIcon className="w-[0.75rem] h-[0.75rem]" />
        </button>
      </div>
      <style jsx global>{`
        @keyframes slideUp { from { transform: translateY(1rem); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════
// FIELD INPUT (for forms)
// ══════════════════════════════════════════

interface FieldProps {
  label: string;
  id: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
}

export function Field({ label, id, value, onChange, type = "text", placeholder, required, disabled, rows }: FieldProps) {
  const cls = "w-full px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-xl text-[0.8125rem] bg-white focus:ring-2 focus:ring-sky-300 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400";
  return (
    <div>
      <label htmlFor={id} className="text-[0.75rem] font-semibold text-slate-600 mb-[0.25rem] block">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {rows ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} disabled={disabled} rows={rows} className={`${cls} resize-none`} />
      ) : (
        <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} disabled={disabled} className={cls} />
      )}
    </div>
  );
}

export function SelectField({ label, id, value, onChange, options, placeholder, required, disabled }: {
  label: string; id: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string; required?: boolean; disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-[0.75rem] font-semibold text-slate-600 mb-[0.25rem] block">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <select
        id={id} value={value} onChange={(e) => onChange(e.target.value)} required={required} disabled={disabled}
        className="w-full px-[0.75rem] py-[0.5rem] border border-slate-200 rounded-xl text-[0.8125rem] bg-white focus:ring-2 focus:ring-sky-300 outline-none transition-all"
      >
        <option value="">{placeholder ?? "Sélectionner…"}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function ToggleField({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="flex items-center gap-[0.5rem] cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-[2.5rem] h-[1.375rem] rounded-full transition-colors ${checked ? "bg-sky-500" : "bg-slate-300"} ${disabled ? "opacity-50" : ""}`}
      >
        <span className={`absolute top-[0.125rem] left-[0.125rem] w-[1.125rem] h-[1.125rem] bg-white rounded-full shadow transition-transform ${checked ? "translate-x-[1.125rem]" : ""}`} />
      </button>
      <span className="text-[0.8125rem] text-slate-700">{label}</span>
    </label>
  );
}