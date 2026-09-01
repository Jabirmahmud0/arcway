import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Clock3, FileWarning, ShieldCheck } from "lucide-react";
import { ReactNode } from "react";

const documentStatusStyles: Record<string, string> = {
  pending: "border-white/10 bg-white/[0.035] text-slate-400",
  uploaded: "border-blue-400/20 bg-blue-400/[0.10] text-blue-300",
  "under review": "border-amber-400/20 bg-amber-400/[0.10] text-amber-300",
  verified: "border-emerald-400/20 bg-emerald-400/[0.10] text-emerald-300",
  rejected: "border-rose-400/20 bg-rose-400/[0.10] text-rose-300",
};

const assuranceStyles: Record<string, string> = {
  draft: "border-white/10 bg-white/[0.035] text-slate-400",
  submitted: "border-blue-400/20 bg-blue-400/[0.10] text-blue-300",
  under_review: "border-amber-400/20 bg-amber-400/[0.10] text-amber-300",
  approved: "border-emerald-400/20 bg-emerald-400/[0.10] text-emerald-300",
  rejected: "border-rose-400/20 bg-rose-400/[0.10] text-rose-300",
};

export function StatusBadge({ status, kind = "document" }: { status: string; kind?: "document" | "assurance" }) {
  const display = status.replaceAll("_", " ");
  const styles = kind === "document" ? documentStatusStyles : assuranceStyles;
  return <span className={cn("inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]", styles[status] ?? documentStatusStyles.pending)}>{display}</span>;
}

export function TrustGauge({ score, band = "critical", compact = false }: { score: number; band?: string; compact?: boolean }) {
  const safeScore = Math.max(0, Math.min(100, score));
  const tone = band === "ready" ? "#3dd598" : band === "review" ? "#4da3ff" : band === "guarded" ? "#f4b740" : "#ff6b7d";
  const radius = compact ? 30 : 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeScore / 100) * circumference;
  return (
    <div className={cn("relative grid place-items-center", compact ? "h-20 w-20" : "h-32 w-32")} aria-label={`Trust score ${safeScore} out of 100, ${band}`}>
      <svg className="absolute -rotate-90" width={compact ? 80 : 128} height={compact ? 80 : 128} viewBox={compact ? "0 0 80 80" : "0 0 128 128"}>
        <circle cx={compact ? 40 : 64} cy={compact ? 40 : 64} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={compact ? 6 : 8} />
        <circle cx={compact ? 40 : 64} cy={compact ? 40 : 64} r={radius} fill="none" stroke={tone} strokeWidth={compact ? 6 : 8} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-[stroke-dashoffset] duration-500" />
      </svg>
      <div className="z-10 text-center"><div className={cn("font-semibold tabular-nums text-slate-100", compact ? "text-lg" : "text-3xl")}>{safeScore}</div>{!compact && <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">Trust score</div>}</div>
    </div>
  );
}

export function MetricCard({ label, value, helper, icon, tone = "blue" }: { label: string; value: string | number; helper: string; icon: ReactNode; tone?: "blue" | "green" | "amber" | "rose" }) {
  const tones = { blue: "bg-blue-400/10 text-blue-300", green: "bg-emerald-400/10 text-emerald-300", amber: "bg-amber-400/10 text-amber-300", rose: "bg-rose-400/10 text-rose-300" };
  return <div className="panel group p-5"><div className="flex items-start justify-between gap-3"><div><p className="eyebrow">{label}</p><p className="mt-3 text-2xl font-semibold tracking-tight text-slate-100 md:text-3xl">{value}</p></div><div className={cn("grid h-10 w-10 place-items-center rounded-xl", tones[tone])}>{icon}</div></div><p className="mt-4 text-xs text-slate-500">{helper}</p></div>;
}

export function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 border-b border-white/[0.07] pb-6 md:flex-row md:items-end"><div><p className="eyebrow">{eyebrow}</p><h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-slate-100 md:text-3xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p></div>{action && <div className="shrink-0">{action}</div>}</div>;
}

export function EmptyPanel({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="panel relative flex min-h-72 flex-col items-center justify-center overflow-hidden px-6 py-12 text-center"><div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" /><div className="grid h-12 w-12 place-items-center rounded-2xl border border-blue-400/15 bg-blue-400/[0.08] text-blue-300"><ShieldCheck className="h-6 w-6" /></div><h2 className="mt-5 text-lg font-semibold text-slate-100">{title}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p><div className="mt-6 flex items-center justify-center gap-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-600"><span className="rounded border border-white/[0.07] bg-white/[0.025] px-2 py-1">Trade truth</span><span className="h-px w-5 bg-blue-400/35" /><span className="rounded border border-white/[0.07] bg-white/[0.025] px-2 py-1">Evidence</span><span className="h-px w-5 bg-blue-400/35" /><span className="rounded border border-white/[0.07] bg-white/[0.025] px-2 py-1">Assurance</span></div>{action && <div className="mt-5">{action}</div>}</div>;
}

export function AssuranceIcon({ status }: { status: string }) {
  if (status === "approved") return <CheckCircle2 className="h-4 w-4 text-emerald-300" />;
  if (status === "rejected") return <FileWarning className="h-4 w-4 text-rose-300" />;
  if (status === "submitted" || status === "under_review") return <Clock3 className="h-4 w-4 text-amber-300" />;
  return <AlertTriangle className="h-4 w-4 text-slate-500" />;
}

export const formatMoney = (value: number | string, currency = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value || 0));
export const formatDate = (value: Date | string | null) => value ? new Date(value).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—";
