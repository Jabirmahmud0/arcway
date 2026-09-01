import { PageTitle, StatusBadge } from "@/components/arcway/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, GitBranch, Plus, ShieldCheck, Timer, Workflow } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Criticality = "critical" | "warning" | "information";
type DependencyType = "blocks_release" | "blocks_task" | "evidence_prerequisite";

const criticalityClasses: Record<Criticality, string> = {
  critical: "text-rose-300",
  warning: "text-amber-300",
  information: "text-blue-300",
};

export default function ObligationManagement() {
  const { user } = useAuth();
  const isReviewer = user?.role === "reviewer";
  const isTrader = user?.role === "trader";
  const trades = trpc.trades.list.useQuery(undefined, { retry: false });
  const [selectedTradeId, setSelectedTradeId] = useState<number | null>(null);
  const activeTradeId = selectedTradeId ?? trades.data?.[0]?.id ?? null;
  const workspace = trpc.trades.get.useQuery({ tradeId: activeTradeId ?? 0 }, { enabled: Boolean(activeTradeId), retry: false });
  const templates = trpc.operations.obligations.listTemplates.useQuery(undefined, { retry: false });
  const policyPreview = trpc.operations.policies.obligationPreview.useQuery({ tradeId: activeTradeId ?? 0 }, { enabled: isReviewer && Boolean(activeTradeId), retry: false });
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [evidenceRequirement, setEvidenceRequirement] = useState("");
  const [dueOffsetHours, setDueOffsetHours] = useState("48");
  const [releaseCondition, setReleaseCondition] = useState("All linked evidence verified");
  const [criticality, setCriticality] = useState<Criticality>("warning");
  const [templateToApply, setTemplateToApply] = useState("");
  const [dependencySource, setDependencySource] = useState("");
  const [dependencyTarget, setDependencyTarget] = useState("");
  const [dependencyType, setDependencyType] = useState<DependencyType>("blocks_release");
  const [escalationReasons, setEscalationReasons] = useState<Record<number, string>>({});

  const refreshTrade = () => {
    if (activeTradeId) utils.trades.get.invalidate({ tradeId: activeTradeId });
  };

  const createTemplate = trpc.operations.obligations.createTemplate.useMutation({
    onSuccess: () => {
      toast.success("Reusable obligation template created");
      setName(""); setActor(""); setAction(""); setEvidenceRequirement("");
      utils.operations.obligations.listTemplates.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const applyTemplate = trpc.operations.obligations.applyTemplate.useMutation({
    onSuccess: () => { toast.success("Obligation added to Trade Twin"); setTemplateToApply(""); refreshTrade(); },
    onError: error => toast.error(error.message),
  });
  const addDependency = trpc.operations.obligations.addDependency.useMutation({
    onSuccess: () => { toast.success("Release dependency recorded"); setDependencySource(""); setDependencyTarget(""); refreshTrade(); },
    onError: error => toast.error(error.message),
  });
  const escalate = trpc.operations.obligations.escalate.useMutation({
    onSuccess: () => { toast.success("Obligation escalation has been retained in its lifecycle record"); refreshTrade(); },
    onError: error => toast.error(error.message),
  });
  const applyPolicyPreview = trpc.operations.policies.applyPreview.useMutation({
    onSuccess: result => { toast.success(result.existing ? "This policy obligation was already retained" : "Policy-derived obligation retained"); refreshTrade(); policyPreview.refetch(); },
    onError: error => toast.error(error.message),
  });

  const data = workspace.data;

  return <div className="mx-auto max-w-[1540px] animate-enter">
    <PageTitle eyebrow="Obligation control" title="Make every commitment owned, evidenced, and release-aware." description="Templates create repeatable operating controls. Dependencies show what blocks a task or trade release, while escalations remain immutable lifecycle evidence." />
    <div className="mt-6 grid gap-5 2xl:grid-cols-[250px_minmax(0,1fr)_350px]">
      <aside className="panel h-fit overflow-hidden">
        <div className="border-b border-white/[0.07] px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">Trade Twin</p></div>
        {trades.data?.map(trade => <button key={trade.id} onClick={() => setSelectedTradeId(trade.id)} className={`w-full border-b border-white/[0.05] px-4 py-4 text-left ${activeTradeId === trade.id ? "bg-blue-500/[0.08]" : "hover:bg-white/[0.03]"}`}>
          <p className="font-mono text-[10px] text-blue-300">{trade.reference}</p>
          <p className="mt-1 text-xs text-slate-300">{trade.sellerName} → {trade.buyerName}</p>
        </button>)}
      </aside>

      <section className="space-y-5">
        {!data ? <div className="panel p-8 text-sm text-slate-500">Select a Trade Twin to view its obligations.</div> : <>
          <div className="panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2"><Workflow className="h-4 w-4 text-blue-300" /><p className="text-sm font-semibold text-slate-100">Release-aware obligation graph</p></div>
                <p className="mt-2 text-xs leading-5 text-slate-500">Each edge has an explicit operational effect. A blocked release cannot be explained away by a generic task status.</p>
              </div>
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-right"><p className="text-lg font-semibold text-slate-100">{data.obligations.length}</p><p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Obligations</p></div>
            </div>
            {isTrader ? <div className="mt-5 flex flex-col gap-3 rounded-xl border border-blue-400/15 bg-blue-400/[0.04] p-4 sm:flex-row">
              <select aria-label="Template to apply" value={templateToApply} onChange={event => setTemplateToApply(event.target.value)} className="h-10 flex-1 rounded-md border border-white/[0.1] bg-[#111827] px-3 text-sm text-slate-200">
                <option value="">Select a reusable obligation template…</option>
                {templates.data?.filter(template => template.active === 1).map(template => <option value={template.id} key={template.id}>{template.name} · {template.actor}</option>)}
              </select>
              <Button disabled={!templateToApply || applyTemplate.isPending} onClick={() => applyTemplate.mutate({ tradeId: data.trade.id, templateId: Number(templateToApply) })} className="bg-blue-500 text-white hover:bg-blue-400"><Plus className="mr-1.5 h-4 w-4" />Apply to Trade Twin</Button>
            </div> : <div className="mt-5 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4 text-xs leading-5 text-amber-100">Reviewers govern templates, dependencies, and escalations. Traders instantiate approved templates on their Trade Twins.</div>}
          </div>

          {isReviewer && <div className="panel p-6">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-blue-300" /><p className="text-sm font-semibold text-slate-100">Policy-to-obligation preview</p></div><p className="mt-2 text-xs leading-5 text-slate-500">Configured relationship, product, payment, and route conditions are evaluated against retained Trade Twin facts before any obligation is created.</p></div><p className="max-w-xs text-right text-[10px] leading-4 text-slate-500">Deterministic assistance only; this does not certify legal, regulatory, banking, or trade compliance.</p></div>
            <div className="mt-4 space-y-3">{policyPreview.isLoading ? <p className="text-xs text-slate-500">Evaluating active bindings…</p> : policyPreview.data?.length ? policyPreview.data.map(candidate => <div key={candidate.bindingId} className={`rounded-xl border p-4 ${candidate.eligible ? "border-blue-400/20 bg-blue-400/[0.035]" : "border-white/[0.08] bg-white/[0.02]"}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-100">{candidate.template.name}</p><p className="mt-1 text-xs text-slate-400">{candidate.policy.name} · v{candidate.policy.version} · {candidate.relationship.role} relationship</p></div>{candidate.eligible ? <Button disabled={applyPolicyPreview.isPending} onClick={() => applyPolicyPreview.mutate({ tradeId: data.trade.id, bindingId: candidate.bindingId })} className="h-9 bg-blue-500 text-xs text-white hover:bg-blue-400">Apply governed obligation</Button> : <span className="rounded-md border border-white/[0.1] px-2 py-1 text-[10px] text-slate-400">{candidate.alreadyApplied ? "Already applied" : "Not applicable"}</span>}</div><div className="mt-3 space-y-1">{candidate.reasons.map(reason => <p key={reason} className="text-[11px] leading-4 text-slate-500">{reason}</p>)}</div></div>) : <p className="rounded-xl border border-dashed border-white/[0.12] p-5 text-xs leading-5 text-slate-500">No active relationship-policy bindings are configured for this workspace. Reviewers can create them from Operations → Policy packs.</p>}</div>
          </div>}

          <div className="space-y-3">
            {data.obligations.length ? data.obligations.map(obligation => {
              const blockers = data.obligationDependencies.filter(edge => edge.obligationId === obligation.id);
              const escalations = data.obligationEscalations.filter(record => record.obligationId === obligation.id);
              const unmetBlockers = blockers.filter(edge => data.obligations.find(item => item.id === edge.dependsOnObligationId)?.status !== "fulfilled");
              return <div key={obligation.id} className={`rounded-xl border p-4 ${obligation.status === "overdue" ? "border-rose-400/20 bg-rose-400/[0.035]" : "border-white/[0.08] bg-white/[0.02]"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><div className="flex items-center gap-2"><p className="text-sm font-medium text-slate-100">{obligation.action}</p><StatusBadge status={obligation.status} /></div><p className="mt-1 text-xs text-slate-500">Owner: {obligation.actor}{obligation.evidenceRequirement ? ` · Evidence: ${obligation.evidenceRequirement}` : ""}</p></div>
                  <div className="text-right"><p className={`text-xs font-medium ${criticalityClasses[obligation.criticality]}`}>{obligation.criticality} control</p>{obligation.deadline && <p className="mt-1 text-[11px] text-slate-500">Due {new Date(obligation.deadline).toLocaleString()}</p>}</div>
                </div>
                {blockers.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{blockers.map(edge => {
                  const prerequisite = data.obligations.find(item => item.id === edge.dependsOnObligationId);
                  return <span key={edge.id} className={`rounded-md border px-2 py-1 text-[10px] ${prerequisite?.status === "fulfilled" ? "border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200" : "border-amber-400/20 bg-amber-400/[0.05] text-amber-100"}`}><GitBranch className="mr-1 inline h-3 w-3" />{edge.dependencyType.replaceAll("_", " ")}: {prerequisite?.action ?? `#${edge.dependsOnObligationId}`}</span>;
                })}{unmetBlockers.length > 0 && <span className="rounded-md bg-rose-400/[0.08] px-2 py-1 text-[10px] text-rose-200">Release remains blocked</span>}</div>}
                {escalations.length > 0 && <div className="mt-3 border-l-2 border-rose-400/30 pl-3">{escalations.map(record => <p key={record.id} className="text-[11px] leading-5 text-slate-400"><AlertTriangle className="mr-1 inline h-3 w-3 text-rose-300" />Level {record.level} · {record.reason} · {new Date(record.escalatedAt).toLocaleString()}</p>)}</div>}
                {isReviewer && obligation.status !== "fulfilled" && <div className="mt-3 flex gap-2"><Input value={escalationReasons[obligation.id] ?? ""} onChange={event => setEscalationReasons(current => ({ ...current, [obligation.id]: event.target.value }))} placeholder="Escalation reason and required intervention…" className="h-9 border-white/[0.1] bg-[#111827] text-xs text-slate-200 placeholder:text-slate-600" /><Button disabled={(escalationReasons[obligation.id]?.length ?? 0) < 8 || escalate.isPending} onClick={() => escalate.mutate({ tradeId: data.trade.id, obligationId: obligation.id, reason: escalationReasons[obligation.id] })} variant="outline" className="h-9 border-rose-400/20 bg-rose-400/[0.04] text-xs text-rose-200 hover:bg-rose-400/[0.1]">Escalate</Button></div>}
              </div>;
            }) : <div className="rounded-xl border border-dashed border-white/[0.12] p-8 text-center text-sm text-slate-500">Apply a template to instantiate the first controlled obligation for this Trade Twin.</div>}
          </div>

          {isReviewer && data.obligations.length > 1 && <div className="panel p-6">
            <div className="flex items-center gap-2"><GitBranch className="h-4 w-4 text-blue-300" /><p className="text-sm font-semibold text-slate-100">Add a dependency edge</p></div><p className="mt-2 text-xs text-slate-500">Dependency edges record whether a prerequisite blocks trade release, work execution, or evidence readiness.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <select aria-label="Dependent obligation" value={dependencySource} onChange={event => setDependencySource(event.target.value)} className="h-10 rounded-md border border-white/[0.1] bg-[#111827] px-3 text-xs text-slate-200"><option value="">Obligation to constrain</option>{data.obligations.map(item => <option value={item.id} key={item.id}>{item.action}</option>)}</select>
              <select aria-label="Prerequisite obligation" value={dependencyTarget} onChange={event => setDependencyTarget(event.target.value)} className="h-10 rounded-md border border-white/[0.1] bg-[#111827] px-3 text-xs text-slate-200"><option value="">Must be completed first</option>{data.obligations.filter(item => item.id !== Number(dependencySource)).map(item => <option value={item.id} key={item.id}>{item.action}</option>)}</select>
              <select aria-label="Dependency effect" value={dependencyType} onChange={event => setDependencyType(event.target.value as DependencyType)} className="h-10 rounded-md border border-white/[0.1] bg-[#111827] px-3 text-xs text-slate-200"><option value="blocks_release">Blocks release</option><option value="blocks_task">Blocks task</option><option value="evidence_prerequisite">Evidence prerequisite</option></select>
            </div>
            <Button disabled={!dependencySource || !dependencyTarget || addDependency.isPending} onClick={() => addDependency.mutate({ tradeId: data.trade.id, obligationId: Number(dependencySource), dependsOnObligationId: Number(dependencyTarget), dependencyType })} className="mt-3 bg-blue-500 text-white hover:bg-blue-400">Record dependency</Button>
          </div>}
        </>}
      </section>

      <aside className="space-y-5">
        {isReviewer && <div className="panel p-5"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-blue-300" /><p className="text-sm font-semibold text-slate-100">Reusable template</p></div><p className="mt-2 text-xs leading-5 text-slate-500">Policy owners define repeatable commitments and the release condition they support.</p>
          <div className="mt-4 space-y-2"><Input value={name} onChange={event => setName(event.target.value)} placeholder="Template name" className="border-white/[0.1] bg-[#111827] text-slate-200 placeholder:text-slate-600" /><Input value={actor} onChange={event => setActor(event.target.value)} placeholder="Required actor" className="border-white/[0.1] bg-[#111827] text-slate-200 placeholder:text-slate-600" /><Textarea value={action} onChange={event => setAction(event.target.value)} placeholder="Required action" className="min-h-20 border-white/[0.1] bg-[#111827] text-slate-200 placeholder:text-slate-600" /><Input value={evidenceRequirement} onChange={event => setEvidenceRequirement(event.target.value)} placeholder="Evidence requirement (optional)" className="border-white/[0.1] bg-[#111827] text-slate-200 placeholder:text-slate-600" /><label className="block text-xs text-slate-500">SLA offset (hours)<Input type="number" min="0" value={dueOffsetHours} onChange={event => setDueOffsetHours(event.target.value)} className="mt-1 border-white/[0.1] bg-[#111827] text-slate-200" /></label><Input value={releaseCondition} onChange={event => setReleaseCondition(event.target.value)} placeholder="Release condition" className="border-white/[0.1] bg-[#111827] text-slate-200 placeholder:text-slate-600" /><select aria-label="Template criticality" value={criticality} onChange={event => setCriticality(event.target.value as Criticality)} className="h-10 w-full rounded-md border border-white/[0.1] bg-[#111827] px-3 text-sm text-slate-200"><option value="critical">Critical</option><option value="warning">Warning</option><option value="information">Information</option></select></div>
          <Button disabled={!name || !actor || !action || createTemplate.isPending} onClick={() => createTemplate.mutate({ name, actor, action, evidenceRequirement: evidenceRequirement || undefined, criticality, dueOffsetHours: dueOffsetHours ? Number(dueOffsetHours) : undefined, releaseCondition: { description: releaseCondition } })} className="mt-3 w-full bg-blue-500 text-white hover:bg-blue-400">Save template</Button>
        </div>}
        <div className="panel p-5"><div className="flex items-center gap-2"><Timer className="h-4 w-4 text-blue-300" /><p className="text-sm font-semibold text-slate-100">Template catalog</p></div><div className="mt-4 space-y-3">{templates.data?.length ? templates.data.map(template => <div key={template.id} className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-3"><p className="text-xs font-medium text-slate-200">{template.name}</p><p className="mt-1 text-[11px] text-slate-500">{template.actor} · {template.dueOffsetHours ?? "No"}h SLA</p><p className={`mt-1 text-[10px] font-medium ${criticalityClasses[template.criticality]}`}>{template.criticality}</p></div>) : <p className="text-xs text-slate-500">No templates available in this workspace.</p>}</div></div>
      </aside>
    </div>
  </div>;
}
