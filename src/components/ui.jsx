import React from "react";
import {
  X, Search, ChevronLeft, ChevronRight, Banknote, Landmark, CreditCard, CheckCircle2, AlertTriangle, ChevronDown,
} from "lucide-react";
import { C } from "../constants/theme";

export const Badge = ({ tone = "muted", children }) => {
  const tones = {
    green: { bg: C.greenSoft, fg: C.green },
    red: { bg: C.redSoft, fg: C.red },
    orange: { bg: C.orangeSoft, fg: C.orange },
    navy: { bg: C.navyFaint, fg: C.navy },
    muted: { bg: "#EEF0F3", fg: C.textMuted },
  }[tone];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: tones.bg, color: tones.fg }}
    >
      {children}
    </span>
  );
};

export const Btn = ({ variant = "primary", size = "md", className = "", children, ...props }) => {
  const base = "rtd-focus inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { md: "px-4 py-2.5 text-sm", sm: "px-3 py-1.5 text-xs" };
  const variants = {
    primary: { background: C.navy, color: "#fff" },
    danger: { background: C.red, color: "#fff" },
    ghost: { background: "transparent", color: C.navy, border: `1px solid ${C.border}` },
    subtle: { background: C.navyFaint, color: C.navy },
  };
  return (
    <button
      className={`${base} ${sizes[size]} ${className}`}
      style={variants[variant]}
      onMouseDown={(e) => e.currentTarget.style.opacity = "0.88"}
      onMouseUp={(e) => e.currentTarget.style.opacity = "1"}
      {...props}
    >
      {children}
    </button>
  );
};

export const Card = ({ className = "", style = {}, children }) => (
  <div className={`rounded-2xl ${className}`} style={{ background: C.card, border: `1px solid ${C.border}`, ...style }}>
    {children}
  </div>
);

export const Field = ({ label, required, error, children, hint }) => (
  <label className="block">
    <span className="mb-1.5 flex items-center gap-1 text-sm font-semibold" style={{ color: C.text }}>
      {label} {required && <span style={{ color: C.red }}>*</span>}
    </span>
    {children}
    {hint && !error && <span className="mt-1 block text-xs" style={{ color: C.textFaint }}>{hint}</span>}
    {error && <span className="mt-1 flex items-center gap-1 text-xs font-medium" style={{ color: C.red }}><AlertTriangle size={12} />{error}</span>}
  </label>
);

export const inputBase = "rtd-focus w-full rounded-lg px-3 py-2.5 text-sm";

export const inputStyle = (hasError) => ({ background: "#fff", border: `1px solid ${hasError ? C.red : C.border}`, color: C.text });

export const TextInput = (props) => <input {...props} className={`${inputBase} ${props.className || ""}`} style={inputStyle(props["aria-invalid"])} />;

export const TextArea = (props) => <textarea {...props} className={`${inputBase} ${props.className || ""}`} style={inputStyle(props["aria-invalid"])} />;

export const Select = ({ children, ...props }) => (
  <div className="relative">
    <select {...props} className={`${inputBase} appearance-none pr-9`} style={inputStyle(props["aria-invalid"])}>
      {children}
    </select>
    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
  </div>
);

export const CurrencyInput = ({ value, onChange, error, disabled }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: C.textMuted }}>Rp</span>
    <input
      inputMode="numeric"
      disabled={disabled}
      value={value ? Number(value).toLocaleString("id-ID") : ""}
      onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, "")) || 0)}
      placeholder="0"
      className={`${inputBase} pl-9 tabular-nums disabled:opacity-60`}
      style={inputStyle(error)}
    />
  </div>
);

export const PaymentIcon = ({ method, size = 14 }) => {
  if (method === "Tunai") return <Banknote size={size} />;
  if (method === "Transfer Bank") return <Landmark size={size} />;
  return <CreditCard size={size} />;
};

export const Modal = ({ title, subtitle, onClose, children, width = 560 }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(12,33,54,0.45)" }} onMouseDown={onClose}>
    <div
      className="rtd-anim w-full overflow-hidden rounded-2xl"
      style={{ maxWidth: width, background: C.card, maxHeight: "88vh", display: "flex", flexDirection: "column" }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between border-b px-6 py-4" style={{ borderColor: C.border }}>
        <div>
          <h3 className="rtd-display text-lg font-semibold" style={{ color: C.text }}>{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm" style={{ color: C.textMuted }}>{subtitle}</p>}
        </div>
        <button onClick={onClose} className="rtd-focus rounded-lg p-1.5" style={{ color: C.textMuted }}><X size={18} /></button>
      </div>
      <div className="overflow-y-auto px-6 py-5">{children}</div>
    </div>
  </div>
);

export const ConfirmDialog = ({ title, message, onConfirm, onCancel, tone = "danger" }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(12,33,54,0.45)" }} onMouseDown={onCancel}>
    <div className="rtd-anim w-full max-w-sm rounded-2xl p-6" style={{ background: C.card }} onMouseDown={(e) => e.stopPropagation()}>
      <div
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-full"
        style={{ background: tone === "danger" ? C.redSoft : C.orangeSoft, color: tone === "danger" ? C.red : C.orange }}
      >
        <AlertTriangle size={20} />
      </div>
      <h3 className="rtd-display text-base font-semibold" style={{ color: C.text }}>{title}</h3>
      <p className="mt-1.5 text-sm" style={{ color: C.textMuted }}>{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Btn variant="ghost" onClick={onCancel}>Batal</Btn>
        <Btn variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm}>Ya, Lanjutkan</Btn>
      </div>
    </div>
  </div>
);

export const Toasts = ({ toasts, remove }) => (
  <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2" style={{ maxWidth: 340 }}>
    {toasts.map((t) => (
      <div
        key={t.id}
        className="rtd-anim flex items-start gap-2.5 rounded-xl px-4 py-3 shadow-lg"
        style={{ background: C.navyDark, color: "#fff" }}
      >
        {t.tone === "error" ? <AlertTriangle size={17} style={{ color: "#F3A5A0", flexShrink: 0, marginTop: 1 }} /> : <CheckCircle2 size={17} style={{ color: "#7FDDAA", flexShrink: 0, marginTop: 1 }} />}
        <span className="text-sm leading-snug">{t.message}</span>
        <button onClick={() => remove(t.id)} className="ml-auto flex-shrink-0" style={{ color: "#B9C4D1" }}><X size={14} /></button>
      </div>
    ))}
  </div>
);

export const EmptyState = ({ icon: Icon = Search, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: C.navyFaint, color: C.navy }}>
      <Icon size={20} />
    </div>
    <p className="text-sm font-semibold" style={{ color: C.text }}>{title}</p>
    {subtitle && <p className="mt-1 max-w-xs text-xs" style={{ color: C.textMuted }}>{subtitle}</p>}
  </div>
);

export const Pagination = ({ page, totalPages, onChange, totalItems, pageSize }) => {
  if (totalItems === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3" style={{ borderColor: C.border }}>
      <span className="text-xs" style={{ color: C.textMuted }}>Menampilkan {from}–{to} dari {totalItems} data</span>
      <div className="flex items-center gap-1">
        <button disabled={page === 1} onClick={() => onChange(page - 1)} className="rtd-focus flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-40" style={{ border: `1px solid ${C.border}`, color: C.navy }}><ChevronLeft size={15} /></button>
        <span className="px-2 text-xs font-semibold" style={{ color: C.text }}>{page} / {totalPages || 1}</span>
        <button disabled={page === totalPages || totalPages === 0} onClick={() => onChange(page + 1)} className="rtd-focus flex h-8 w-8 items-center justify-center rounded-lg disabled:opacity-40" style={{ border: `1px solid ${C.border}`, color: C.navy }}><ChevronRight size={15} /></button>
      </div>
    </div>
  );
};

export const RangeFilterButtons = ({ value, onChange }) => {
  const opts = [["7", "7 Hari"], ["30", "30 Hari"], ["90", "3 Bulan"], ["180", "6 Bulan"], ["365", "1 Tahun"]];
  return (
    <div className="flex flex-wrap gap-1.5">
      {opts.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className="rtd-focus rounded-lg px-3 py-1.5 text-xs font-semibold transition"
          style={value === v ? { background: C.navy, color: "#fff" } : { background: C.navyFaint, color: C.navy }}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

/* ============================================================
   SIDEBAR / TOPBAR
   ============================================================ */
