import { PageTitle, StatusBadge } from "@/components/arcway/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CheckSquare2, FilePenLine, GitBranch, ListTodo } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ActionCenter() {
  const { user } = useAuth();
  const trades = trpc.trades.list.useQuery(undefined, { retry: false });
  const [tradeId, setTradeId] = useState<number | null>(null);
  const activeId = tradeId ?? trades.data?.[0]?.id ?? null;
  const workspace = trpc.trades.get.useQuery({ tradeId: activeId ?? 0 }, { enabled: Boolean(activeId), retry: false });
  const utils = trpc.useUtils();
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [deadline, setDeadline] = useState("");
  const [obligationId, setObligationId] = useState("");
  const refresh = () => { if (activeId) utils.trades.get.invalidate({ tradeId: activeId }); };
  const createTask = trpc.operations.tasks.create.useMutation({ onSuccess: () => { toast.success("Contextual task created"); setTitle(""); setDetail(""); setDeadline(""); setObligationId(""); refresh(); }, onError: error => toast.error(error.message) });
  const updateTask = trpc.operations.tasks.updateStatus.useMutation({ onSuccess: () => { toast.success("Task lifecycle updated"); refresh(); }, onError: error => toast.error(error.message) });
  const createDraft = trpc.operations.documents.generateDraft.useMutation({ onSuccess: result => { toast.success(`${result.status === "issued" ? "Issued snapshot" : "Document draft"} created`); refresh(); }, onError: error => toast.error(error.message) });
  const data = workspace.data;

  return <div className="mx-auto max-w-[1540px] animate-enter">
    <PageTitle eyebrow="Action center" title="Turn trade evidence into owned work and controlled drafts." description="Tasks retain their Trade Twin, obligation or exception context, owner, deadline, escalation visibility, and timestamped completion history. Document drafts preserve the exact issuance snapshot." />
    <div className="mt-6 grid gap-5 xl:grid-cols-[250px_1fr]">
      <aside className="panel h-fit overflow-hidden"><div className="border-b border-white/[0.07] px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">Trade Twin</p></div>{trades.data?.map(trade => <button key={trade.id} onClick={() => setTradeId(trade.id)} className={`w-full border-b border-white/[0.05] px-4 py-4 text-left ${activeId === trade.id ? "bg-blue-500/[0.08]" : "hover:bg-white/[0.03]"}`}><p className="font-mono text-[10px] text-blue-300">{trade.reference}</p><p className="mt-1 text-xs text-slate-300">{trade.sellerName} → {trade.buyerName}</p></button>)}</aside>
      {data && <section className="grid gap-5 xl:grid-cols-2">
        <div className="panel p-6"><div className="flex items-center gap-2"><ListTodo className="h-4 w-4 text-blue-300" /><p className="text-sm font-semibold text-slate-100">Contextual tasks</p></div><p className="mt-2 text-xs leading-5 text-slate-500">Create an action that remains attached to its operating reason rather than a disconnected to-do list.</p>
          <Input value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Resolve 200 kg packing-list discrepancy" className="mt-5 border-white/[0.1] bg-[#111827] text-slate-200 placeholder:text-slate-600" />
          <Textarea value={detail} onChange={event => setDetail(event.target.value)} placeholder="Explain the evidence, deadline driver, and requested resolution…" className="mt-3 min-h-24 border-white/[0.1] bg-[#111827] text-slate-200 placeholder:text-slate-600" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs text-slate-500">Obligation context<select aria-label="Linked obligation" value={obligationId} onChange={event => setObligationId(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-white/[0.1] bg-[#111827] px-3 text-sm text-slate-200"><option value="">General trade action</option>{data.obligations.map(obligation => <option key={obligation.id} value={obligation.id}>{obligation.action}</option>)}</select></label><label className="text-xs text-slate-500">Deadline<Input type="datetime-local" value={deadline} onChange={event => setDeadline(event.target.value)} className="mt-1 border-white/[0.1] bg-[#111827] text-slate-200" /></label></div>
          <label className="mt-3 block text-xs text-slate-500">Assignee<Input value={user?.name || "Current workspace user"} readOnly className="mt-1 border-white/[0.1] bg-[#111827] text-slate-300" /></label>
          <Button disabled={!title || !detail || createTask.isPending} onClick={() => createTask.mutate({ tradeId: data.trade.id, title, detail, obligationId: obligationId ? Number(obligationId) : undefined, assigneeId: user?.id, deadline: deadline ? new Date(deadline) : undefined })} className="mt-3 bg-blue-500 text-white hover:bg-blue-400">Create contextual task</Button>
          <div className="mt-6 space-y-3 border-t border-white/[0.07] pt-5">{data.tasks.length ? data.tasks.map(task => { const overdue = task.deadline && task.status !== "completed" && new Date(task.deadline) < new Date(); const obligation = task.obligationId ? data.obligations.find(item => item.id === task.obligationId) : undefined; return <div key={task.id} className={`rounded-lg border p-4 ${overdue ? "border-rose-400/20 bg-rose-400/[0.04]" : "border-white/[0.07] bg-white/[0.025]"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-slate-200">{task.title}</p><p className="mt-1 text-xs text-slate-500">{task.detail}</p>{obligation && <p className="mt-2 flex items-center gap-1 text-[11px] text-blue-200"><GitBranch className="h-3 w-3" />Obligation: {obligation.action}</p>}{task.deadline && <p className={`mt-2 text-xs ${overdue ? "text-rose-300" : "text-slate-500"}`}>{overdue ? "Escalation required · " : "Deadline · "}{new Date(task.deadline).toLocaleString()}</p>}{task.completedAt && <p className="mt-1 text-xs text-emerald-300">Completed {new Date(task.completedAt).toLocaleString()} · lifecycle event retained</p>}</div><StatusBadge status={task.status} /></div><div className="mt-3 flex gap-2">{task.status !== "completed" && <Button disabled={updateTask.isPending} onClick={() => updateTask.mutate({ taskId: task.id, status: "completed" })} variant="outline" className="h-8 border-emerald-400/20 bg-emerald-400/[0.04] text-xs text-emerald-200 hover:bg-emerald-400/[0.1]"><CheckSquare2 className="mr-1.5 h-3.5 w-3.5" />Complete</Button>}<Button disabled={updateTask.isPending} onClick={() => updateTask.mutate({ taskId: task.id, status: "in_progress" })} variant="outline" className="h-8 border-white/[0.1] bg-white/[0.03] text-xs text-slate-300">In progress</Button></div></div>; }) : <p className="text-sm text-slate-500">No tasks created for this Trade Twin.</p>}</div>
        </div>
        <div className="panel p-6"><div className="flex items-center gap-2"><FilePenLine className="h-4 w-4 text-blue-300" /><p className="text-sm font-semibold text-slate-100">Document drafting & issuance</p></div><p className="mt-2 text-xs leading-5 text-slate-500">Drafts are generated from the current canonical Trade Twin. Issuing stores the exact data snapshot, template version, timestamp, issuer, and content hash.</p><div className="mt-5 grid grid-cols-2 gap-2">{["quotation", "proforma invoice", "commercial invoice", "packing list", "purchase order", "sales confirmation", "shipping instruction", "VGM", "document cover schedule"].map(type => <Button key={type} disabled={createDraft.isPending} onClick={() => createDraft.mutate({ tradeId: data.trade.id, documentType: type as any, issueNow: false })} variant="outline" className="h-auto justify-start border-white/[0.1] bg-white/[0.025] px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/[0.07]">{type}</Button>)}</div><div className="mt-6 space-y-3 border-t border-white/[0.07] pt-5">{data.generatedDocuments.length ? data.generatedDocuments.map(document => <div key={document.id} className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-4"><div className="flex items-center justify-between"><p className="text-sm text-slate-200">{document.documentType}</p><StatusBadge status={document.status} /></div><p className="mt-1 text-xs text-slate-500">{document.templateVersion} · sha256 {document.contentHash.slice(0, 12)}…</p></div>) : <p className="text-sm text-slate-500">No generated drafts for this Trade Twin.</p>}</div></div>
      </section>}
    </div>
  </div>;
}
