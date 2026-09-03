import { useAuth } from "@/_core/hooks/useAuth";
import { PageTitle, StatusBadge } from "@/components/arcway/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Activity, DatabaseZap, FileSpreadsheet, Play, PlugZap, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function IntegrationCenter() {
  const { user } = useAuth();
  const isReviewer = user?.role === "reviewer";
  const catalog = trpc.operations.integrations.catalog.useQuery();
  const data = trpc.operations.integrations.list.useQuery(undefined, { enabled: isReviewer, retry: false });
  const trades = trpc.trades.list.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();
  const [tradeId, setTradeId] = useState("");
  const [sourceName, setSourceName] = useState("");

  const connect = trpc.operations.integrations.connect.useMutation({ onSuccess: () => { toast.success("Adapter connected in demonstration mode"); utils.operations.integrations.list.invalidate(); }, onError: error => toast.error(error.message) });
  const run = trpc.operations.integrations.runMock.useMutation({ onSuccess: result => { toast.success(`Normalized ${result.normalized.entityType} signal retained for review`); utils.operations.integrations.list.invalidate(); }, onError: error => toast.error(error.message) });
  const saveMapping = trpc.operations.integrations.saveMapping.useMutation({ onSuccess: () => { toast.success("Reusable import mapping saved for your structured-file intake"); setSourceName(""); }, onError: error => toast.error(error.message) });

  const integrations = data.data?.integrations ?? [];
  const mappings = data.data?.mappings ?? [];
  const runs = data.data?.runs ?? [];

  return <div className="mx-auto max-w-[1540px] animate-enter">
    <PageTitle eyebrow="Integration operations" title="Normalize source systems. Preserve source truth." description={isReviewer ? "ARCWAY’s assurance logic depends on provider-neutral records, not a particular vendor. Reviewer controls below use safe mocked adapters to demonstrate the ingestion, reference, and health workflow." : "Traders can save reusable structured-file mapping templates. Source configuration, receipts, alerts, and adapter operations are restricted to Reviewer oversight."} />
    {!isReviewer && <div className="mt-6 rounded-xl border border-blue-400/15 bg-blue-400/[0.05] p-4 text-sm leading-6 text-blue-100">Source configuration and operational records are Reviewer-only. Your saved mapping can be applied during structured-file ingestion, but source receipts and provider health remain in the reviewer workspace.</div>}
    <div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
      <section className="space-y-5">
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4"><div><p className="text-sm font-semibold text-slate-100">Adapter catalog</p><p className="mt-1 text-xs text-slate-500">Connect a provider capability; credentials and live webhooks are intentionally not configured in this demonstration.</p></div><PlugZap className="h-5 w-5 text-blue-300" /></div>
          <div className="grid gap-px bg-white/[0.06] md:grid-cols-2">{catalog.data?.map(provider => {
            const active = integrations.find(integration => integration.providerType === provider.type);
            return <div key={provider.type} className="bg-[#101722] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-100">{provider.name}</p><p className="mt-2 text-xs leading-5 text-slate-500">{provider.description}</p></div>{isReviewer && active ? <StatusBadge status={active.status} /> : <span className="rounded-full border border-white/[0.1] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">{isReviewer ? "available" : "reviewer managed"}</span>}</div><div className="mt-4 flex flex-wrap gap-1.5">{provider.capabilities.map(capability => <span key={capability} className="rounded bg-white/[0.05] px-2 py-1 text-[10px] text-slate-400">{capability}</span>)}</div>{isReviewer && <div className="mt-5 flex gap-2">{active ? <Button disabled={run.isPending || !tradeId} onClick={() => run.mutate({ integrationId: active.id, providerType: provider.type, tradeId: Number(tradeId) })} variant="outline" className="h-8 border-white/[0.1] bg-white/[0.03] text-xs text-slate-200 hover:bg-white/[0.08]"><Play className="mr-1.5 h-3.5 w-3.5" />Run normalized sample</Button> : <Button disabled={connect.isPending} onClick={() => connect.mutate({ providerType: provider.type })} className="h-8 bg-blue-500 text-xs text-white hover:bg-blue-400"><PlugZap className="mr-1.5 h-3.5 w-3.5" />Connect adapter</Button>}</div>}</div>;
          })}</div>
        </div>
        <div className="panel p-6"><div className="flex items-center gap-2"><FileSpreadsheet className="h-4 w-4 text-blue-300" /><p className="text-sm font-semibold text-slate-100">Spreadsheet import mapping</p></div><p className="mt-2 text-xs leading-5 text-slate-500">Save a reusable mapping so CSV/XLSX columns become canonical ARCWAY fields only after reviewer confirmation.</p><div className="mt-4 flex flex-col gap-3 md:flex-row"><Input aria-label="Structured-file mapping source name" value={sourceName} onChange={event => setSourceName(event.target.value)} placeholder="Source name, e.g. August order export" className="border-white/[0.1] bg-[#111827] text-slate-200 placeholder:text-slate-600" /><Button disabled={user?.role !== "trader" || !sourceName || saveMapping.isPending} onClick={() => saveMapping.mutate({ sourceName, entityType: "trade", mapping: { Buyer: "counterparty", PO: "buyer_order_reference", ETD: "planned_departure", Amount: "trade_value", Status: "external_status" } })} className="bg-blue-500 text-white hover:bg-blue-400">Save mapping</Button></div>{isReviewer ? <div className="mt-4 grid gap-2 md:grid-cols-2">{mappings.map(mapping => <div key={mapping.id} className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-3"><p className="text-sm text-slate-200">{mapping.sourceName}</p><p className="mt-1 text-xs text-slate-500">{mapping.entityType} mapping · reusable</p></div>)}</div> : <p className="mt-4 text-xs text-slate-500">Saved mappings are privately available to your subsequent structured-file ingestion; the shared mapping catalogue is Reviewer-only.</p>}</div>
      </section>
      <aside className="space-y-5">
        <div className="panel p-6"><div className="flex items-center gap-2"><DatabaseZap className="h-4 w-4 text-blue-300" /><p className="text-sm font-semibold text-slate-100">Run context</p></div>{isReviewer ? <><p className="mt-2 text-xs leading-5 text-slate-500">Select a Trade Twin to emit a deterministic, reviewable normalized signal. No external provider is contacted.</p><label htmlFor="integration-trade" className="sr-only">Select Trade Twin</label><select id="integration-trade" value={tradeId} onChange={event => setTradeId(event.target.value)} className="mt-4 h-10 w-full rounded-md border border-white/[0.1] bg-[#111827] px-3 text-sm text-slate-200"><option value="">Select Trade Twin</option>{trades.data?.map(trade => <option key={trade.id} value={trade.id}>{trade.reference}</option>)}</select></> : <p className="mt-2 text-xs leading-5 text-slate-500">Normalized provider runs are managed by Reviewers to protect source provenance and operational recovery records.</p>}</div>
        <div className="panel p-6"><div className="flex items-center gap-2"><Activity className="h-4 w-4 text-blue-300" /><p className="text-sm font-semibold text-slate-100">Source health & run history</p></div>{isReviewer ? <div className="mt-5 space-y-3">{runs.length ? runs.slice(0, 8).map(item => { const integration = integrations.find(entry => entry.id === item.integrationId); return <div key={item.id} className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-slate-200">{integration?.providerName || "Adapter"}</p><StatusBadge status={item.status} /></div><p className="mt-1 text-xs text-slate-500">{item.runType} · {new Date(item.createdAt).toLocaleString()}</p></div>; }) : <p className="text-sm text-slate-500">No normalized adapter runs yet.</p>}</div> : <p className="mt-3 text-xs leading-5 text-slate-500">Run histories, receipts, alert queues, and recovery actions are visible to Reviewers only.</p>}</div>
        <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.05] p-5"><div className="flex gap-3"><ShieldAlert className="h-4 w-4 shrink-0 text-amber-300" /><p className="text-xs leading-5 text-amber-100/80">Provider data is treated as evidence with provenance. Incoming values do not silently overwrite canonical Trade Twin facts; consequential changes remain reviewable.</p></div></div>
      </aside>
    </div>
  </div>;
}
