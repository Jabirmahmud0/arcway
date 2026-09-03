import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { FileUp, Plus, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRoute } from "wouter";

type EvidenceItem = { label: string; reference: string };
type PartnerRequest = { id: number; requestType: string; message: string; status: string; dueAt: Date | null; responseSummary: string | null; responseEvidence: unknown };

const asEvidence = (value: unknown): EvidenceItem[] => Array.isArray(value)
  ? value.filter((item): item is EvidenceItem => Boolean(item && typeof item === "object" && "label" in item && "reference" in item))
  : [];

export default function GuestPortal() {
  const [, params] = useRoute("/guest/:token");
  const token = params?.token ?? "";
  const query = trpc.governance.guest.resolve.useQuery({ token }, { enabled: token.length >= 12, retry: false });
  const [summary, setSummary] = useState("");
  const [cargoReadyDate, setCargoReadyDate] = useState("");
  const [packingReference, setPackingReference] = useState("");
  const [requestId, setRequestId] = useState("");
  const [evidenceLabel, setEvidenceLabel] = useState("");
  const [evidenceReference, setEvidenceReference] = useState("");
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);

  const namedResponse = trpc.governance.guest.respondToPartnerRequest.useMutation({
    onSuccess: () => { toast.success("Response and evidence attached to the named partner request"); setSummary(""); setRequestId(""); setEvidenceLabel(""); setEvidenceReference(""); setEvidenceItems([]); query.refetch(); },
    onError: error => toast.error(error.message),
  });
  const cargoReady = trpc.governance.guest.updateCargoReadyDate.useMutation({
    onSuccess: () => { toast.success("Cargo-ready date recorded"); setCargoReadyDate(""); query.refetch(); },
    onError: error => toast.error(error.message),
  });
  const packingList = trpc.governance.guest.submitPackingListReference.useMutation({
    onSuccess: () => { toast.success("Packing-list reference recorded"); setPackingReference(""); query.refetch(); },
    onError: error => toast.error(error.message),
  });

  const addEvidence = () => {
    if (!evidenceLabel.trim() || !evidenceReference.trim()) return toast.error("Provide both an evidence label and reference.");
    setEvidenceItems(items => [...items, { label: evidenceLabel.trim(), reference: evidenceReference.trim() }]);
    setEvidenceLabel("");
    setEvidenceReference("");
  };

  if (query.isLoading) return <div className="grid min-h-screen place-items-center bg-[#080c16] text-sm text-slate-500">Opening secure collaboration space…</div>;
  if (!query.data) return <div className="grid min-h-screen place-items-center bg-[#080c16] px-6 text-center"><div><p className="text-lg font-semibold text-slate-100">Secure link unavailable</p><p className="mt-2 text-sm text-slate-500">This collaboration link may be expired, revoked, or invalid.</p></div></div>;

  const { trade, documents, obligations, grant, partnerRequests } = query.data;
  const scopes = Array.isArray(grant.scope) ? grant.scope.filter((value): value is string => typeof value === "string") : [];
  const canReadTrade = Boolean(trade);
  const pending = partnerRequests.filter(request => !["completed", "cancelled"].includes(request.status));

  return <div className="min-h-screen bg-[#080c16] text-slate-100">
    <header className="border-b border-white/[0.07] bg-[#0b1020]"><div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5"><div><p className="text-sm font-semibold">ARCWAY · secure partner collaboration</p><p className="mt-1 text-xs text-slate-500">{canReadTrade ? "Scope-limited Trade Twin access" : "Scope-limited partner action"}</p></div><ShieldCheck className="h-5 w-5 text-emerald-300" /></div></header>
    <main className="mx-auto max-w-5xl px-6 py-12">
      {trade ? <><p className="font-mono text-xs text-blue-300">{trade.reference}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{trade.sellerName} → {trade.buyerName}</h1></> : <><p className="font-mono text-xs text-blue-300">ACTION-ONLY ACCESS</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Submit permitted partner evidence</h1></>}
      <p className="mt-3 text-sm text-slate-400">{canReadTrade ? "You can view only the evidence and actions required for this collaboration request." : "This link permits a specific partner action without exposing Trade Twin records."} Link expires {new Date(grant.expiresAt).toLocaleString()}.</p>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {canReadTrade && <section className="rounded-xl border border-white/[0.08] bg-[#101722] p-6"><h2 className="text-sm font-semibold">Required documents</h2><div className="mt-5 space-y-3">{documents.map(document => <div key={document.id} className="flex items-center justify-between rounded-lg border border-white/[0.07] px-3 py-3"><div><p className="text-sm text-slate-200">{document.documentType}</p><p className="mt-1 text-xs text-slate-500">{document.fileName || "Awaiting evidence"}</p></div><StatusBadge status={document.status} /></div>)}</div>{scopes.includes("partner_request.respond") && <div className="mt-6 border-t border-white/[0.07] pt-5"><h2 className="text-sm font-semibold">Named collaboration requests</h2><PartnerRequests requests={partnerRequests} /></div>}</section>}
        <section className="rounded-xl border border-white/[0.08] bg-[#101722] p-6">
          <h2 className="text-sm font-semibold">Your permitted actions</h2>
          {canReadTrade && <div className="mt-5 space-y-3">{obligations.map(item => <div key={item.id} className="rounded-lg border border-white/[0.07] px-3 py-3"><p className="text-sm text-slate-200">{item.action}</p><p className="mt-1 text-xs text-slate-500">Owner: {item.actor} · {item.deadline ? new Date(item.deadline).toLocaleString() : "No deadline"}</p></div>)}</div>}
          {!canReadTrade && <p className="mt-3 text-sm text-slate-500">Trade, document, and obligation data are intentionally unavailable for this link.</p>}
          {scopes.includes("cargo_ready_date.write") && <div className="mt-5 border-t border-white/[0.07] pt-5"><label htmlFor="cargo-ready-date" className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Cargo-ready date update</label><Input id="cargo-ready-date" type="date" value={cargoReadyDate} onChange={event => setCargoReadyDate(event.target.value)} className="mt-3 border-white/[0.1] bg-[#0b1020] text-slate-100" /><Button disabled={!cargoReadyDate || cargoReady.isPending} onClick={() => cargoReady.mutate({ token, cargoReadyDate: new Date(`${cargoReadyDate}T00:00:00Z`), summary: `Partner provided cargo-ready date: ${cargoReadyDate}` })} className="mt-3 bg-blue-500 text-white hover:bg-blue-400">Record cargo-ready date</Button></div>}
          {scopes.includes("packing_list.upload") && <div className="mt-5 border-t border-white/[0.07] pt-5"><label htmlFor="packing-reference" className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Packing-list evidence reference</label><Input id="packing-reference" value={packingReference} onChange={event => setPackingReference(event.target.value)} placeholder="File name, document ID, or secure reference" className="mt-3 border-white/[0.1] bg-[#0b1020] text-slate-100 placeholder:text-slate-600" /><Button disabled={!packingReference || packingList.isPending} onClick={() => packingList.mutate({ token, reference: packingReference, summary: `Partner supplied packing-list evidence reference: ${packingReference}` })} className="mt-3 bg-blue-500 text-white hover:bg-blue-400"><FileUp className="mr-2 h-4 w-4" />Record packing-list evidence</Button></div>}
          {scopes.includes("partner_request.respond") && <div className="mt-5 border-t border-white/[0.07] pt-5"><label htmlFor="partner-request" className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Respond to a named request</label><select id="partner-request" value={requestId} onChange={event => setRequestId(event.target.value)} className="mt-3 h-10 w-full rounded-md border border-white/[0.1] bg-[#0b1020] px-3 text-sm text-slate-100"><option value="">Select pending request</option>{pending.map(request => <option key={request.id} value={request.id}>{request.requestType}</option>)}</select><label htmlFor="partner-response" className="mt-3 block text-xs font-medium text-slate-400">Response summary</label><Textarea id="partner-response" value={summary} onChange={event => setSummary(event.target.value)} placeholder="Describe the evidence supplied or response to this partner request…" className="mt-2 min-h-24 border-white/[0.1] bg-[#0b1020] text-slate-100 placeholder:text-slate-600" /><p className="mt-3 text-xs font-medium text-slate-400">Evidence references</p><div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1.3fr_auto]"><Input aria-label="Evidence label" value={evidenceLabel} onChange={event => setEvidenceLabel(event.target.value)} placeholder="Evidence label" className="border-white/[0.1] bg-[#0b1020] text-slate-100 placeholder:text-slate-600" /><Input aria-label="Evidence reference" value={evidenceReference} onChange={event => setEvidenceReference(event.target.value)} placeholder="File name, document ID, or secure ref" className="border-white/[0.1] bg-[#0b1020] text-slate-100 placeholder:text-slate-600" /><Button type="button" aria-label="Add evidence reference" onClick={addEvidence} variant="outline" className="border-blue-400/20 bg-blue-400/[0.04] text-blue-200"><Plus className="h-4 w-4" /></Button></div>{evidenceItems.length > 0 && <div className="mt-2 space-y-1">{evidenceItems.map((item, index) => <div key={`${item.label}-${index}`} className="flex items-center justify-between rounded-md border border-emerald-400/15 bg-emerald-400/[0.04] px-2 py-1.5 text-xs text-emerald-100"><span>{item.label}: {item.reference}</span><button type="button" aria-label={`Remove ${item.label} evidence reference`} onClick={() => setEvidenceItems(items => items.filter((_, itemIndex) => itemIndex !== index))} className="text-emerald-300 hover:text-rose-200"><X className="h-3.5 w-3.5" /></button></div>)}</div>}<Button disabled={!summary || !requestId || namedResponse.isPending} onClick={() => namedResponse.mutate({ token, requestId: Number(requestId), summary, evidence: evidenceItems })} className="mt-3 bg-blue-500 text-white hover:bg-blue-400">Record response and evidence</Button></div>}
          <p className="mt-5 text-xs text-slate-500">ARCWAY enforces the permission boundaries contained in this secure link and records each permitted action in the Trade Twin history.</p>
        </section>
        {!canReadTrade && scopes.includes("partner_request.respond") && <section className="rounded-xl border border-white/[0.08] bg-[#101722] p-6"><h2 className="text-sm font-semibold">Named collaboration requests</h2><PartnerRequests requests={partnerRequests} /></section>}
      </div>
    </main>
  </div>;
}

function PartnerRequests({ requests }: { requests: PartnerRequest[] }) {
  return <div className="mt-4 space-y-3">{requests.map(request => { const retained = asEvidence(request.responseEvidence); return <div key={request.id} className="rounded-lg border border-white/[0.07] px-3 py-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-slate-200">{request.requestType}</p><p className="mt-1 text-xs leading-5 text-slate-500">{request.message}</p></div><StatusBadge status={request.status} /></div>{request.dueAt && <p className="mt-2 text-[11px] text-slate-600">Due {new Date(request.dueAt).toLocaleString()}</p>}{request.responseSummary && <p className="mt-2 text-xs text-emerald-200">Response retained: {request.responseSummary}</p>}{retained.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{retained.map(item => <span key={`${item.label}-${item.reference}`} className="rounded border border-emerald-400/15 bg-emerald-400/[0.04] px-1.5 py-1 text-[10px] text-emerald-200">{item.label}: {item.reference}</span>)}</div>}</div>; })}{!requests.length && <p className="text-xs text-slate-500">No named requests are associated with this secure link.</p>}</div>;
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === "verified" || status === "completed" ? "bg-emerald-400/10 text-emerald-200" : status === "rejected" ? "bg-rose-400/10 text-rose-200" : "bg-amber-400/10 text-amber-200";
  return <span className={`rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${tone}`}>{status}</span>;
}
