import { useAuth } from "@/_core/hooks/useAuth";
import { PageTitle, StatusBadge } from "@/components/arcway/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ClipboardCheck, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function PolicyGovernanceCenter() {
  const { user } = useAuth();
  const isReviewer = user?.role === "reviewer";
  const data = trpc.operations.policies.list.useQuery(undefined, { retry: false, enabled: isReviewer });
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"company" | "counterparty" | "product" | "route" | "payment" | "transport" | "jurisdiction">("company");
  const [jurisdiction, setJurisdiction] = useState("");
  const [rules, setRules] = useState('[\n  {\n    "if": { "document_status": "verified" },\n    "then": { "decision": "allow" }\n  }\n]');
  const create = trpc.operations.policies.create.useMutation({
    onSuccess: () => {
      toast.success("Policy pack and immutable version authored with reviewer audit evidence");
      setName("");
      utils.operations.policies.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const submit = () => {
    try {
      const parsed = JSON.parse(rules);
      if (!Array.isArray(parsed)) return toast.error("Rules must be a JSON array.");
      create.mutate({ name, scope, jurisdiction: jurisdiction || undefined, rules: parsed });
    } catch {
      toast.error("Policy rules must be valid JSON.");
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] animate-enter">
      <PageTitle
        eyebrow="Policy administration"
        title="Author controlled policy packs with retained version and reviewer audit context."
        description="Policy packs are organization-scoped. Every authored rule set becomes an immutable version used by preflight snapshots and governed waiver decisions."
      />

      <div className="mt-6 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="panel p-6">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-blue-300" />
            <p className="text-sm font-semibold text-slate-100">Author policy pack</p>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">Only Reviewers can author organization policy. The submitted rule set is stored as policy version 1 and is later bound into release-decision history.</p>
          <Input value={name} onChange={event => setName(event.target.value)} disabled={!isReviewer} placeholder="Policy pack name" className="mt-5 border-white/[0.1] bg-[#111827] text-slate-200" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select value={scope} disabled={!isReviewer} onChange={event => setScope(event.target.value as typeof scope)} className="h-10 rounded-lg border border-white/[0.1] bg-[#111827] px-3 text-sm text-slate-200">
              {["company", "counterparty", "product", "route", "payment", "transport", "jurisdiction"].map(value => <option key={value} value={value}>{value}</option>)}
            </select>
            <Input value={jurisdiction} disabled={!isReviewer} onChange={event => setJurisdiction(event.target.value)} placeholder="Jurisdiction (optional)" className="border-white/[0.1] bg-[#111827] text-slate-200" />
          </div>
          <Textarea value={rules} disabled={!isReviewer} onChange={event => setRules(event.target.value)} className="mt-3 min-h-56 border-white/[0.1] bg-[#111827] font-mono text-xs text-slate-200" />
          <Button disabled={!isReviewer || !name.trim() || create.isPending} onClick={submit} className="mt-3 w-full bg-blue-500 text-white hover:bg-blue-400">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Author policy version
          </Button>
        </div>

        <div className="panel overflow-hidden">
          <div className="border-b border-white/[0.07] px-6 py-4">
            <p className="text-sm font-semibold text-slate-100">Policy pack registry</p>
            <p className="mt-1 text-xs text-slate-500">Each pack shows immutable versions and can be reconciled against preflight run snapshots.</p>
          </div>
          {!isReviewer ? (
            <div className="px-6 py-12 text-sm leading-6 text-slate-500">Policy-pack registry data is available to Reviewers only. Your workspace role can continue submitting and tracking Trade Twin evidence through its permitted workflows.</div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {data.data?.packs.length ? data.data.packs.map(pack => {
                const versions = data.data?.versions.filter(version => version.policyPackId === pack.id) ?? [];
                return (
                  <div key={pack.id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-100">{pack.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{pack.scope}{pack.status ? ` · ${pack.status}` : ""} · updated {new Date(pack.updatedAt).toLocaleString()}</p>
                      </div>
                      <StatusBadge status={pack.status} />
                    </div>
                    <div className="mt-4 space-y-2">
                      {versions.map(version => (
                        <div key={version.id} className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-3">
                          <div className="flex items-center justify-between">
                            <p className="font-mono text-xs text-blue-200">v{version.version}</p>
                            <p className="text-[10px] text-slate-600">effective {new Date(version.effectiveFrom).toLocaleDateString()}</p>
                          </div>
                          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-[11px] leading-5 text-slate-400">{JSON.stringify(version.rules, null, 2)}</pre>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }) : <p className="px-6 py-12 text-sm text-slate-500">No policy pack has been authored for this organization.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
