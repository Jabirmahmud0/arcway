import { useAuth } from "@/_core/hooks/useAuth";
import {
  StatusBadge,
  TrustGauge,
  formatDate,
  formatMoney,
} from "@/components/arcway/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  GitBranch,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

const filters = [
  { value: "all", label: "All trades" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function Trades() {
  const { user } = useAuth();
  const query = trpc.trades.list.useQuery(undefined, { retry: false });
  const [search, setSearch] = useState("");
  const [state, setState] = useState("all");
  const [sort, setSort] = useState("updated");
  const trades = query.data ?? [];
  const rows = useMemo(
    () =>
      (query.data ?? [])
        .filter(
          trade =>
            (state === "all" || trade.assuranceState === state) &&
            `${trade.reference} ${trade.sellerName} ${trade.buyerName} ${trade.commodity}`
              .toLowerCase()
              .includes(search.toLowerCase())
        )
        .sort((a, b) =>
          sort === "value"
            ? Number(b.totalValue) - Number(a.totalValue)
            : sort === "trust"
              ? b.trustScore - a.trustScore
              : +new Date(b.updatedAt) - +new Date(a.updatedAt)
        ),
    [query.data, search, state, sort]
  );
  const filtered = Boolean(search || state !== "all");
  const isTrader = user?.role === "trader";
  const summary = [
    {
      label: "Total Trade Twins",
      value: trades.length,
      caption: "Your trade portfolio",
      icon: Boxes,
    },
    {
      label: "Awaiting review",
      value: trades.filter(t =>
        ["submitted", "under_review"].includes(t.assuranceState)
      ).length,
      caption: "Ready for your attention",
      icon: Clock3,
    },
    {
      label: "Approved",
      value: trades.filter(t => t.assuranceState === "approved").length,
      caption: "Assurance review complete",
      icon: ShieldCheck,
    },
    {
      label: "Verified documents",
      value: trades.reduce(
        (total, t) =>
          total + t.documentSummary.filter(d => d.status === "verified").length,
        0
      ),
      caption: "Evidence you can rely on",
      icon: FileCheck2,
    },
  ];

  return (
    <div className="mx-auto max-w-[1540px] space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-teal-300">
            <span className="size-1.5 rounded-full bg-teal-400" />
            TRADE ASSURANCE
          </div>
          <h1 className="text-3xl font-semibold text-slate-50 md:text-4xl">
            Trade Twins<span className="text-teal-400">.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
            One clear view of every trade. From the first agreement to the final
            handoff.
          </p>
        </div>
        <Button
          asChild
          className="h-10 gap-2 rounded-lg bg-teal-500 px-4 text-white shadow-sm hover:bg-teal-600"
        >
          <Link href={isTrader ? "/trades/new" : "/inbox"}>
            {isTrader ? (
              <Plus className="size-4" />
            ) : (
              <FileText className="size-4" />
            )}
            {isTrader ? "Create trade" : "Open trade inbox"}
            <ArrowUpRight className="ml-2 size-4" />
          </Link>
        </Button>
      </div>

      <section
        aria-label="Portfolio summary"
        className="grid grid-cols-2 divide-x divide-white/[0.08] overflow-hidden rounded-xl border border-white/[0.09] bg-card lg:grid-cols-4"
      >
        {summary.map(({ label, value, caption, icon: Icon }) => (
          <div key={label} className="p-4 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-slate-400">{label}</p>
              <Icon className="size-4 text-slate-500" />
            </div>
            {query.isLoading ? (
              <Skeleton className="my-3 h-9 w-12" />
            ) : (
              <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-100">
                {query.isError ? "—" : value.toString().padStart(2, "0")}
              </p>
            )}
            <p className="mt-2 text-[11px] text-slate-500">{caption}</p>
          </div>
        ))}
      </section>

      <section aria-label="Trade portfolio" className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 md:px-6">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Your trade portfolio
            </h2>
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] tabular-nums text-slate-400">
              {query.isLoading || query.isError ? "—" : trades.length}
            </span>
          </div>
          <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="size-3.5" />
            Evidence-backed assurance
          </span>
        </div>
        <div
          className="category-scroll mt-4 flex gap-5 overflow-x-auto border-b border-white/[0.08] px-5 md:px-6"
          aria-label="Assurance state filters"
        >
          {filters.map(filter => (
            <button
              key={filter.value}
              onClick={() => setState(filter.value)}
              aria-pressed={state === filter.value}
              className={cn(
                "shrink-0 border-b-2 px-0.5 pb-3 text-xs font-medium transition-colors",
                state === filter.value
                  ? "border-teal-400 text-teal-200"
                  : "border-transparent text-slate-400 hover:text-slate-100"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 border-b border-white/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              aria-label="Search trades"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search reference, company, or commodity…"
              className="h-10 rounded-lg border-white/10 bg-background pl-9 text-xs text-slate-200 placeholder:text-slate-500"
            />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger
              aria-label="Sort trades"
              className="h-10 w-full rounded-lg border-white/10 text-xs text-slate-300 sm:w-44"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Recently updated</SelectItem>
              <SelectItem value="value">Highest trade value</SelectItem>
              <SelectItem value="trust">Highest trust score</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {query.isLoading ? (
          <div className="space-y-2 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 bg-white/5" />
            ))}
          </div>
        ) : query.isError ? (
          <PortfolioEmpty
            isTrader={isTrader}
            unavailable
            onRetry={() => query.refetch()}
            retrying={query.isFetching}
          />
        ) : rows.length === 0 ? (
          filtered ? (
            <div className="px-6 py-20 text-center">
              <Search className="mx-auto size-7 text-slate-400" />
              <h3 className="mt-5 text-lg font-semibold">No matching trades</h3>
              <p className="mt-2 text-sm text-slate-400">
                Try another reference, company, or assurance state.
              </p>
              <Button
                variant="outline"
                className="mt-5"
                onClick={() => {
                  setSearch("");
                  setState("all");
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <PortfolioEmpty isTrader={isTrader} />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] font-medium text-slate-400">
                  <th className="px-6 py-3">Trade / counterparties</th>
                  <th className="px-5 py-3">Route & commodity</th>
                  <th className="px-5 py-3">Shipment date</th>
                  <th className="px-5 py-3">Evidence</th>
                  <th className="px-5 py-3">Assurance</th>
                  <th className="px-6 py-3 text-right">Trust score</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(trade => {
                  const verified = trade.documentSummary.filter(
                    doc => doc.status === "verified"
                  ).length;
                  return (
                    <tr
                      key={trade.id}
                      className="border-b border-white/[0.06] last:border-0 hover:bg-white/[0.025]"
                    >
                      <td className="px-6 py-5">
                        <Link href={`/trades/${trade.id}`} className="group">
                          <p className="flex items-center gap-2 font-mono text-xs text-teal-300">
                            {trade.reference}
                            <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100" />
                          </p>
                          <p className="mt-2 text-sm font-medium text-slate-200">
                            {trade.sellerName}{" "}
                            <span className="text-slate-500">→</span>{" "}
                            {trade.buyerName}
                          </p>
                          <p className="mt-1 text-xs tabular-nums text-slate-400">
                            {formatMoney(trade.totalValue, trade.currency)}
                          </p>
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-200">
                          {trade.commodity}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {trade.originCountry} → {trade.destinationCountry} ·{" "}
                          {trade.incoterm}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-xs tabular-nums text-slate-400">
                        {formatDate(trade.expectedShipmentDate)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs tabular-nums text-slate-200">
                          {verified} / 6 verified
                        </p>
                        <div className="mt-2 h-1 w-20 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-teal-400"
                            style={{
                              width: `${Math.min(100, (verified / 6) * 100)}%`,
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge
                          status={trade.assuranceState}
                          kind="assurance"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex justify-end">
                          <TrustGauge
                            score={trade.trustScore}
                            band={trade.trustBand}
                            compact
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-wrap justify-between gap-2 border-t border-white/[0.07] px-6 py-3 text-[11px] text-slate-500">
          <span aria-live="polite">
            {query.isLoading
              ? "Loading portfolio…"
              : query.isError
                ? "Portfolio unavailable"
                : `${rows.length} trade${rows.length === 1 ? "" : "s"}${filtered ? ` of ${trades.length}` : " in your workspace"}`}
          </span>
          <span>Every trade. Checked before it moves.</span>
        </div>
      </section>
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          {
            icon: FileText,
            title: "A single source of truth",
            description:
              "Bring terms, parties, and documents into one connected trade record.",
            path: "/vault",
            link: "Explore the evidence vault",
          },
          {
            icon: GitBranch,
            title: "See what needs to happen",
            description:
              "Understand dependencies and obligations before the next handoff.",
            path: "/critical-path",
            link: "View critical path",
          },
          {
            icon: ShieldCheck,
            title: "Move forward with confidence",
            description:
              "Review evidence and readiness before goods, documents, or money move.",
            path: "/assurance",
            link: "Explore assurance",
          },
        ].map(({ icon: Icon, title, description, path, link }) => (
          <Link
            href={path}
            key={path}
            className="group rounded-xl border border-white/[0.07] p-5 hover:border-white/20 hover:bg-white/[0.02]"
          >
            <Icon className="size-5 text-slate-400" />
            <h2 className="mt-4 text-sm font-semibold text-slate-200">
              {title}
            </h2>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              {description}
            </p>
            <span className="mt-4 inline-flex items-center gap-2 text-xs text-teal-300">
              {link}
              <ArrowRight className="size-3.5 group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function PortfolioEmpty({
  isTrader,
  unavailable = false,
  onRetry,
  retrying = false,
}: {
  isTrader: boolean;
  unavailable?: boolean;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div className="grid gap-10 px-6 py-12 md:px-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] xl:items-center xl:gap-16 xl:py-14">
      <div className="mx-auto w-full max-w-md xl:mx-0">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/5 px-3 py-1 text-[11px] text-teal-200">
          <Boxes className="size-3.5" />
          {unavailable
            ? "Portfolio temporarily unavailable"
            : "A clearer picture starts here"}
        </div>
        <h3 className="text-2xl font-semibold leading-tight text-slate-100 md:text-3xl">
          {unavailable ? "Let’s reconnect" : "Your next trade."}
          <br />
          <span className="text-slate-400">
            {unavailable
              ? "your trade portfolio."
              : "Connected. Verified. Clear."}
          </span>
        </h3>
        <p className="mt-4 text-sm leading-6 text-slate-400">
          {unavailable
            ? "We couldn’t retrieve your trades. Try reconnecting to load the latest evidence and assurance state."
            : isTrader
              ? "Create your first Trade Twin to bring commercial terms, supporting evidence, and obligations into one trusted record."
              : "Your portfolio is ready for its first Trade Twin. Review incoming evidence in the trade inbox, or wait for a trader to submit a trade."}
        </p>
        {unavailable ? (
          <Button
            onClick={onRetry}
            disabled={retrying}
            className="mt-6 h-10 gap-2 bg-teal-500 text-white hover:bg-teal-600"
          >
            {retrying ? "Reconnecting…" : "Try reconnecting"}
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            asChild
            className="mt-6 h-10 gap-2 bg-teal-500 text-white hover:bg-teal-600"
          >
            <Link href={isTrader ? "/trades/new" : "/inbox"}>
              {isTrader ? (
                <Plus className="size-4" />
              ) : (
                <FileText className="size-4" />
              )}
              {isTrader ? "Create your first trade" : "Go to trade inbox"}
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        )}
        <p className="mt-3 text-[11px] text-slate-500">
          {unavailable
            ? "Your portfolio will appear once the connection is restored."
            : isTrader
              ? "Start with the basics. Add evidence as your trade progresses."
              : "Submitted trades will appear here automatically."}
        </p>
      </div>
      <div
        className="mx-auto w-full max-w-lg rounded-2xl border border-white/10 bg-background p-5 sm:p-7"
        aria-label="How a Trade Twin works"
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2">
            <Boxes className="size-4 text-teal-300" />
            <span className="text-xs font-semibold text-slate-200">
              The connected Trade Twin
            </span>
          </div>
          <span className="rounded border border-white/10 px-2 py-1 text-[10px] text-slate-500">
            HOW IT WORKS
          </span>
        </div>
        <div className="mt-5 space-y-0">
          {[
            {
              icon: FileText,
              title: "Capture the agreement",
              text: "Parties, goods, terms, and milestones",
              number: "01",
            },
            {
              icon: FileCheck2,
              title: "Connect the evidence",
              text: "Documents linked to the facts they support",
              number: "02",
            },
            {
              icon: ShieldCheck,
              title: "Verify every handoff",
              text: "Readiness grounded in reviewed evidence",
              number: "03",
            },
          ].map(({ icon: Icon, title, text, number }, index) => (
            <div key={title} className="relative flex gap-4 pb-6 last:pb-0">
              {index < 2 && (
                <span className="absolute bottom-0 left-5 top-10 w-px bg-white/10" />
              )}
              <div className="relative grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-secondary text-teal-300">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-xs font-medium text-slate-200">{title}</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-400">
                  {text}
                </p>
              </div>
              <span className="pt-1 font-mono text-[10px] text-slate-600">
                {number}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-2 border-t border-white/[0.08] pt-4 text-[11px] text-slate-400">
          <CheckCircle2 className="size-3.5 text-teal-300" />
          One trade. A complete, traceable picture.
          <Check className="ml-auto size-3.5 text-slate-500" />
        </div>
      </div>
    </div>
  );
}
