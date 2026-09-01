import { useAuth } from "@/_core/hooks/useAuth";
import { AssuranceIcon, EmptyPanel, MetricCard, PageTitle, StatusBadge, TrustGauge, formatMoney } from "@/components/arcway/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CircleCheck, Clock3, FileWarning, Plus, ShieldAlert, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const dashboard = trpc.trades.dashboard.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();
  const shadowAudit = trpc.trades.seedShadowAudit.useMutation({ onSuccess: data => { utils.trades.dashboard.invalidate(); utils.trades.list.invalidate(); window.location.assign(`/trades/${data.tradeId}`); } });
  const data = dashboard.data;
  const roleLabel = user?.role === "reviewer" ? "Reviewer command center" : "Trader command center";

  return <div className="mx-auto max-w-[1540px] animate-enter">
    <PageTitle eyebrow={roleLabel} title="Trade assurance, in view." description="A single operating picture of the trades that need attention before goods, documents, or money move." action={user?.role === "trader" ? <Link href="/trades/new"><Button className="h-10 gap-2 bg-blue-500 text-white hover:bg-blue-400"><Plus className="h-4 w-4" />Create trade</Button></Link> : <Link href="/review"><Button className="h-10 gap-2 bg-blue-500 text-white hover:bg-blue-400">Open review queue<ArrowRight className="h-4 w-4" /></Button></Link>} />

    {dashboard.isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-2xl bg-white/[0.06]" />)}</div> : <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active trades" value={data?.activeTrades ?? 0} helper="Open trade twins under assurance" icon={<TrendingUp className="h-5 w-5" />} />
        <MetricCard label="Value at risk" value={formatMoney(data?.valueAtRisk ?? 0)} helper="Open exposure across active trades" icon={<ShieldAlert className="h-5 w-5" />} tone="amber" />
        <MetricCard label="Awaiting review" value={data?.verification.underReview ?? 0} helper="Submitted or currently under review" icon={<Clock3 className="h-5 w-5" />} tone="amber" />
        <MetricCard label="Verified" value={data?.verification.approved ?? 0} helper="Trades released by assurance review" icon={<CircleCheck className="h-5 w-5" />} tone="green" />
      </section>

      {(data?.trades.length ?? 0) === 0 ? <div className="mt-5"><EmptyPanel title="Your assurance workspace is ready" description={user?.role === "reviewer" ? "Open a labelled Shadow Audit case to see ARCWAY reconstruct messy trade evidence, identify contradictions, and block unsafe release gates." : "Create a trade to generate its Trade Twin, required document checklist, and a defensible evidence trail."} action={user?.role === "trader" ? <Link href="/trades/new"><Button className="bg-blue-500 text-white hover:bg-blue-400"><Plus className="mr-2 h-4 w-4" />Create your first trade</Button></Link> : <Button disabled={shadowAudit.isPending} onClick={() => shadowAudit.mutate()} className="bg-blue-500 text-white hover:bg-blue-400"><FileWarning className="mr-2 h-4 w-4" />{shadowAudit.isPending ? "Constructing Shadow Audit…" : "Open Shadow Audit case"}</Button>} /></div> : <section className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_0.9fr]">
        <div className="panel overflow-hidden"><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div><p className="text-sm font-semibold text-slate-100">Trade portfolio</p><p className="mt-1 text-xs text-slate-500">Most recently active Trade Twins</p></div><Link href="/trades" className="text-xs font-medium text-blue-300 hover:text-blue-200">View all trades</Link></div><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-white/[0.06] text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500"><th className="px-5 py-3">Trade</th><th className="px-5 py-3">Value</th><th className="px-5 py-3">Assurance</th><th className="px-5 py-3 text-right">Trust</th></tr></thead><tbody>{data?.trades.map(trade => <tr key={trade.id} className="group border-b border-white/[0.05] last:border-b-0 hover:bg-white/[0.025]"><td className="px-5 py-4"><Link href={`/trades/${trade.id}`} className="block"><p className="font-mono text-xs text-blue-300">{trade.reference}</p><p className="mt-1 text-sm font-medium text-slate-200">{trade.sellerName} <span className="text-slate-600">→</span> {trade.buyerName}</p></Link></td><td className="px-5 py-4 text-sm font-medium text-slate-300">{formatMoney(trade.totalValue, trade.currency)}</td><td className="px-5 py-4"><StatusBadge status={trade.assuranceState} kind="assurance" /></td><td className="px-5 py-3"><div className="flex justify-end"><TrustGauge score={trade.trustScore} band={trade.trustBand} compact /></div></td></tr>)}</tbody></table></div></div>
        <div className="panel"><div className="border-b border-white/[0.07] px-5 py-4"><p className="text-sm font-semibold text-slate-100">Activity ledger</p><p className="mt-1 text-xs text-slate-500">Immutable operational events</p></div><div className="max-h-[430px] overflow-y-auto px-5 py-2">{data?.activity.length ? data.activity.map(({ tradeEvents: event, trades: trade }) => <Link key={event.id} href={`/trades/${trade.id}`} className="block border-b border-white/[0.06] py-4 last:border-0"><div className="flex gap-3"><div className="mt-0.5"><AssuranceIcon status={event.eventType.includes("approved") ? "approved" : event.eventType.includes("rejected") ? "rejected" : event.eventType.includes("submitted") ? "submitted" : "draft"} /></div><div><p className="text-sm font-medium text-slate-200">{event.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{event.detail || trade.reference}</p><p className="mt-2 font-mono text-[10px] text-slate-600">{trade.reference} · {new Date(event.createdAt).toLocaleString()}</p></div></div></Link>) : <div className="py-12 text-center text-sm text-slate-500">No event activity yet.</div>}</div></div>
      </section>}
    </>}
  </div>;
}
