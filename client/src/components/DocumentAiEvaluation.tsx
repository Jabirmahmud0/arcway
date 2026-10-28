import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { FlaskConical, Play, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function DocumentAiEvaluation() {
  const utils = trpc.useUtils();
  const query = trpc.operations.monitoring.aiEvaluation.useQuery();
  const [provider, setProvider] = useState<"gemini" | "groq">("gemini");
  const run = trpc.operations.monitoring.runAiEvaluation.useMutation({ onSuccess: report => { utils.operations.monitoring.aiEvaluation.invalidate(); toast.success(`${report.completedCases}/${report.totalCases} model calls completed`); }, onError: error => toast.error(error.message) });
  const available = query.data?.providers ?? [];
  const selected = available.find(item => item.provider === provider)?.provider ?? available[0]?.provider;
  const report = query.data?.report;
  const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
  return <section className="panel mt-6 overflow-hidden">
    <div className="flex flex-wrap items-start justify-between gap-5 border-b border-border p-6">
      <div className="max-w-xl"><div className="flex items-center gap-2 text-teal-300"><FlaskConical className="h-4 w-4" /><p className="text-sm font-semibold">Document AI benchmark</p></div><h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">Measure extraction against known answers.</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Five synthetic documents test factual fields, missing values, a zero amount, and an embedded instruction. Each run makes five real API calls to your selected provider.</p></div>
      <div className="flex flex-wrap items-end gap-3"><label className="text-xs text-muted-foreground">Provider<select aria-label="AI benchmark provider" className="mt-2 block h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground" value={selected ?? ""} disabled={run.isPending || !available.length} onChange={event => setProvider(event.target.value as "gemini" | "groq")}>{available.length ? available.map(item => <option key={item.provider} value={item.provider}>{item.provider === "gemini" ? "Gemini" : "Groq"} · {item.model}</option>) : <option value="">No provider configured</option>}</select></label><Button disabled={run.isPending || !selected} onClick={() => selected && run.mutate({ provider: selected })}>{run.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}{run.isPending ? "Evaluating…" : "Run benchmark"}</Button></div>
    </div>
    <div className="p-6" aria-live="polite">
      {query.isError ? <p className="text-sm text-destructive">Could not load the benchmark. <button className="underline" onClick={() => query.refetch()}>Retry</button></p> : !report ? <p className="text-sm text-muted-foreground">{query.isLoading ? "Loading evaluation history…" : "No model evaluation has been retained for this workspace yet. Run the benchmark to record measured results."}</p> : <>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><p><span className="font-semibold capitalize text-foreground">{report.provider}</span> · {Array.from(new Set(report.cases.map(item => item.model).filter(Boolean))).join(", ") || "No successful model response"}</p><p>{new Date(report.executedAt).toLocaleString()} · {(report.durationMs / 1000).toFixed(1)}s</p></div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[{ label: "Field precision", value: percent(report.precision) }, { label: "Field recall", value: percent(report.recall) }, { label: "F1 score", value: percent(report.f1) }, { label: "Exact document matches", value: `${report.passedCases}/${report.totalCases}` }].map(metric => <div key={metric.label} className="rounded-xl border border-border bg-background/50 p-4"><p className="text-2xl font-semibold tracking-tight text-foreground">{metric.value}</p><p className="mt-1 text-xs text-muted-foreground">{metric.label}</p></div>)}</div>
        {report.completedCases < report.totalCases && <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-200">{report.totalCases - report.completedCases} extraction(s) failed. This run is incomplete; failed calls cannot pass a case.</p>}
        <div className="mt-5 divide-y divide-border">{report.cases.map(item => <details key={item.id} className="py-3"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2 text-foreground">{item.completed && !item.mismatches.length ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />}{item.id.replaceAll("_", " ")}</span><span className="shrink-0 text-xs text-muted-foreground">{!item.completed ? "Extraction failed" : item.mismatches.length ? `${item.mismatches.length} mismatch(es)` : "All fields match"}</span></summary><div className="mt-3 space-y-2">{item.mismatches.map(mismatch => <div key={mismatch.field} className="grid gap-2 rounded-lg bg-background/50 p-3 text-xs sm:grid-cols-3"><span className="font-medium text-foreground">{mismatch.field}</span><span className="break-words text-muted-foreground">Expected: {mismatch.expected || "empty"}</span><span className="break-words text-muted-foreground">Extracted: {mismatch.actual || "empty"}</span></div>)}{item.issues.map((issue, index) => <p key={index} className="text-xs text-muted-foreground">{issue}</p>)}</div></details>)}</div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">{report.boundary}</p><details className="mt-3 text-xs text-muted-foreground"><summary className="cursor-pointer">Reproducibility record</summary><p className="mt-2">{report.suite} · {report.id}</p><code className="mt-1 block break-all">{report.fingerprint}</code></details>
      </>}
    </div>
  </section>;
}
