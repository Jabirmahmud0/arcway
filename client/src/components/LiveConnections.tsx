import { useState } from "react";
import { Link } from "wouter";
import { Mail, HardDrive, ArrowRight, RefreshCw, PlugZap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function LiveConnections() {
  const status = trpc.operations.integrations.gmail.status.useQuery(undefined, { retry: false });
  const trades = trpc.trades.list.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();
  const [tradeId, setTradeId] = useState("");
  const [query, setQuery] = useState("");
  const [pageToken, setPageToken] = useState<string>();
  const connect = trpc.operations.integrations.gmail.connect.useMutation({ onSuccess: data => window.location.assign(data.url), onError: error => toast.error(error.message) });
  const sync = trpc.operations.integrations.gmail.sync.useMutation({ onSuccess: data => { setPageToken(data.nextPageToken); toast.success(`${data.imported} imported · ${data.duplicates} already retained · ${data.skippedAttachments} unsupported/oversized attachments skipped`); utils.operations.invalidate(); }, onError: error => toast.error(error.message) });
  const disconnect = trpc.operations.integrations.gmail.disconnect.useMutation({ onSuccess: data => { utils.operations.integrations.gmail.status.invalidate(); setPageToken(undefined); toast.success(data.revoked ? "Gmail disconnected" : "Local connection removed. Remove ARCWAY access in your Google Account to finish revocation."); }, onError: error => toast.error(error.message) });
  const busy = sync.isPending || connect.isPending || disconnect.isPending;
  const chooseTrade = (value: string) => { setTradeId(value); const trade = trades.data?.find(item => item.id === Number(value)); setQuery(trade ? `newer_than:30d "${trade.reference}"` : ""); setPageToken(undefined); };
  return <section className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]" aria-label="Live connections">
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-5"><div className="flex items-center gap-3"><div className="rounded-xl bg-teal-400/10 p-2.5"><Mail className="h-5 w-5 text-teal-300" /></div><div><h2 className="text-sm font-semibold text-slate-100">Gmail</h2><p className="mt-1 text-xs text-slate-400">Bring relevant correspondence into the trade record.</p></div></div><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-teal-200">{status.data?.connected ? "Connected" : "Read-only access"}</span></div>
      <div className="space-y-4 p-6">
        {status.isError ? <div className="text-sm text-amber-200">Connection status could not load. <button className="underline" onClick={() => status.refetch()}>Retry</button></div> : status.isLoading ? <p className="text-sm text-slate-400">Checking connection…</p> : status.data?.connected ? <>
          <p className="text-sm text-slate-300">Connected as <span className="font-medium text-slate-100">{status.data.email}</span></p>
          <label className="block text-xs text-slate-400">Destination trade<select value={tradeId} disabled={busy} onChange={event => chooseTrade(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-white/10 bg-card px-3 text-sm text-slate-200"><option value="">Select a Trade Twin</option>{trades.data?.map(trade => <option key={trade.id} value={trade.id}>{trade.reference} · {trade.buyerName}</option>)}</select></label>
          <label className="block text-xs text-slate-400">Gmail search<Input value={query} disabled={busy} onChange={event => { setQuery(event.target.value); setPageToken(undefined); }} placeholder='newer_than:30d "order reference"' className="mt-2 border-white/10 bg-card text-slate-200" /></label>
          <p className="text-xs leading-5 text-slate-400">Imports up to 10 matching messages per batch, plus supported attachments up to 10 MB each. Review the search and destination before importing. Messages remain unchanged in Gmail; imported evidence awaits your review.</p>
          <div className="flex flex-wrap gap-2"><Button disabled={busy || !tradeId || query.trim().length < 3} onClick={() => sync.mutate({ tradeId: Number(tradeId), query })} className="bg-teal-500 text-white hover:bg-teal-600"><RefreshCw className={`mr-2 h-4 w-4 ${sync.isPending ? "animate-spin" : ""}`} />{sync.isPending ? "Importing…" : "Import matching emails"}</Button>{pageToken && <Button disabled={busy} variant="outline" onClick={() => sync.mutate({ tradeId: Number(tradeId), query, pageToken })}>Import next batch</Button>}<Button variant="ghost" disabled={busy} onClick={() => disconnect.mutate()} className="text-slate-400">Disconnect</Button></div>
        </> : <><p className="text-sm leading-6 text-slate-300">Connect your mailbox, choose a trade, and import matching messages and attachments. Each import retains its source and skips duplicates.</p>{!status.data?.configured && <div className="rounded-xl border border-amber-400/15 bg-amber-400/5 p-4 text-xs leading-5 text-amber-100">Google OAuth setup is needed. Add GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET to the server environment. The callback URL is /api/integrations/gmail/callback. Setup steps are in the project README.</div>}<Button disabled={busy || !status.data?.configured} onClick={() => connect.mutate()} className="bg-teal-500 text-white hover:bg-teal-600"><PlugZap className="mr-2 h-4 w-4" />Connect Gmail</Button><p className="text-xs text-slate-500">Google sign-in and Gmail mailbox permission are separate connections.</p></>}
      </div>
    </div>
    <div className="panel flex flex-col p-6"><div className="flex items-center gap-3"><div className="rounded-xl bg-teal-400/10 p-2.5"><HardDrive className="h-5 w-5 text-teal-300" /></div><div><h2 className="text-sm font-semibold text-slate-100">Document storage</h2><p className="mt-1 text-xs text-teal-300">Private local storage · active</p></div></div><p className="mt-5 text-sm leading-6 text-slate-300">Upload PDFs, images, text, and CSV files from your Trade Twin. Files stay on this server; document records and version history are retained in Neon.</p><p className="mt-3 text-xs leading-5 text-slate-400">Gemini and Groq extract document fields for review. Downloads require a signed-in account with access to the trade. Keep the storage folder on a persistent disk when deploying.</p><Link href="/trades" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-teal-300 hover:text-teal-200">Open Trade Twins<ArrowRight className="h-4 w-4" /></Link></div>
  </section>;
}
