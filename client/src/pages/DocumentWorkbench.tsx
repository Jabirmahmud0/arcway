import { useAuth } from "@/_core/hooks/useAuth";
import {
  EmptyPanel,
  PageTitle,
  StatusBadge,
} from "@/components/arcway/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  ArrowUpRight,
  FileSearch,
  FileText,
  History,
  Link2,
  ScanLine,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

const documentStatuses = [
  "all",
  "pending",
  "uploaded",
  "under review",
  "verified",
  "rejected",
] as const;
type DocumentStatusFilter = (typeof documentStatuses)[number];
const labelFor = (key: string) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, character => character.toUpperCase());
const displayValue = (value: unknown) =>
  value === "" || value === null || value === undefined
    ? "—"
    : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);

export default function DocumentWorkbench() {
  const { user } = useAuth();
  const isReviewer = user?.role === "reviewer";
  const trades = trpc.trades.list.useQuery(undefined, { retry: false });
  const [tradeId, setTradeId] = useState<number | null>(null);
  const activeId = tradeId ?? trades.data?.[0]?.id ?? null;
  const workspace = trpc.trades.get.useQuery(
    { tradeId: activeId ?? 0 },
    { enabled: Boolean(activeId), retry: false }
  );
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<DocumentStatusFilter>("all");
  const [comparisonVersionId, setComparisonVersionId] = useState<number | null>(
    null
  );
  const [correctionJson, setCorrectionJson] = useState("");
  const [reviewerNotes, setReviewerNotes] = useState("");
  const data = workspace.data;
  const visibleDocuments = useMemo(
    () =>
      data?.documents.filter(
        document => statusFilter === "all" || document.status === statusFilter
      ) ?? [],
    [data?.documents, statusFilter]
  );
  const activeDocument =
    visibleDocuments.find(item => item.id === documentId) ??
    visibleDocuments.find(item => item.fileKey || item.extractedData) ??
    visibleDocuments[0];
  const extracted = (activeDocument?.extractedData ?? {}) as Record<
    string,
    unknown
  >;
  const fieldEntries = Object.entries(extracted).filter(
    ([key]) => !["issues", "confidence"].includes(key)
  );
  const versions =
    data?.documentVersions.filter(
      item => item.documentId === activeDocument?.id
    ) ?? [];
  const comparisonVersion =
    versions.find(version => version.id === comparisonVersionId) ??
    versions.find(version => version.fileKey !== activeDocument?.fileKey) ??
    versions[0];
  const versionFields = (comparisonVersion?.extractedData ?? {}) as Record<
    string,
    unknown
  >;
  const diffKeys = Array.from(
    new Set([...Object.keys(versionFields), ...Object.keys(extracted)])
  ).filter(key => !["issues", "confidence"].includes(key));
  const changedCount = diffKeys.filter(
    key => displayValue(versionFields[key]) !== displayValue(extracted[key])
  ).length;
  const linkedExceptions =
    data?.exceptions.filter(
      exception => exception.documentId === activeDocument?.id
    ) ?? [];
  const issues = Array.from(
    new Set([
      ...(Array.isArray(extracted.issues) ? extracted.issues.map(String) : []),
      ...(Array.isArray(activeDocument?.inconsistencies)
        ? activeDocument.inconsistencies.map(String)
        : []),
    ])
  );
  const utils = trpc.useUtils();
  const correctExtraction =
    trpc.operations.documents.correctExtraction.useMutation({
      onSuccess: () => {
        toast.success("Correction saved; comparisons and readiness updated");
        utils.operations.invalidate();
        utils.trades.invalidate();
        if (activeId) utils.trades.get.invalidate({ tradeId: activeId });
      },
      onError: error => toast.error(error.message),
    });
  useEffect(() => {
    setCorrectionJson(
      JSON.stringify(activeDocument?.extractedData ?? {}, null, 2)
    );
    setReviewerNotes("");
    setComparisonVersionId(null);
    correctExtraction.reset();
  }, [activeDocument?.id, activeDocument?.extractedData]);

  const title = (
    <PageTitle
      eyebrow="Document Workbench"
      title="A clear view of every document."
      description="Inspect extracted fields, follow source history, and review the issues that need attention."
    />
  );
  if (trades.isLoading)
    return (
      <div>
        {title}
        <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  if (trades.isError)
    return (
      <div>
        {title}
        <EmptyPanel
          title="Documents could not be loaded"
          description="Your trade list is temporarily unavailable. Try loading it again."
          action={<Button onClick={() => trades.refetch()}>Try again</Button>}
        />
      </div>
    );
  if (!trades.data?.length)
    return (
      <div>
        {title}
        <EmptyPanel
          title="Your evidence workspace starts with a trade"
          description="Create a Trade Twin, then upload its supporting documents to inspect them here."
          action={
            <Link href={isReviewer ? "/" : "/trades/new"}>
              <Button>{isReviewer ? "Open overview" : "Create a trade"}</Button>
            </Link>
          }
        />
      </div>
    );

  return (
    <div className="mx-auto max-w-[1440px]">
      {title}
      <div className="panel mb-5 flex min-w-0 flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between">
        <label className="block min-w-0 flex-1 sm:max-w-xl">
          <span className="mb-2 block text-xs font-medium text-slate-400">
            Trade Twin
          </span>
          <select
            aria-label="Select Trade Twin"
            value={activeId ?? ""}
            onChange={event => {
              setTradeId(Number(event.target.value));
              setDocumentId(null);
            }}
            className="h-11 w-full min-w-0 rounded-lg border border-white/10 bg-background px-3 text-sm text-slate-200"
          >
            {trades.data.map(trade => (
              <option key={trade.id} value={trade.id}>
                {trade.reference} · {trade.sellerName} → {trade.buyerName}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
          <span>
            <strong className="font-medium tabular-nums text-slate-200">
              {data?.documents.length ?? 0}
            </strong>{" "}
            documents
          </span>
          <span>
            <strong className="font-medium tabular-nums text-slate-200">
              {data?.documents.filter(document => document.fileKey).length ?? 0}
            </strong>{" "}
            uploaded
          </span>
          <Link
            href={`/trades/${activeId}`}
            className="inline-flex items-center gap-1.5 font-medium text-teal-300 hover:text-teal-200"
          >
            Open trade
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
      <div className="panel mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:hidden">
        <label className="block min-w-0 text-xs text-slate-400">
          Document
          <select
            aria-label="Select document"
            value={activeDocument?.id ?? ""}
            onChange={event => setDocumentId(Number(event.target.value))}
            className="mt-2 h-11 w-full min-w-0 rounded-lg border border-white/10 bg-background px-3 text-sm text-slate-200"
          >
            {visibleDocuments.length ? (
              visibleDocuments.map(document => (
                <option key={document.id} value={document.id}>
                  {document.documentType} · {document.status}
                </option>
              ))
            ) : (
              <option value="">No matching documents</option>
            )}
          </select>
        </label>
        <label className="block min-w-0 text-xs text-slate-400">
          Workflow state
          <select
            aria-label="Filter documents by exact status"
            value={statusFilter}
            onChange={event => {
              setStatusFilter(event.target.value as DocumentStatusFilter);
              setDocumentId(null);
            }}
            className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-background px-3 text-sm text-slate-200"
          >
            {documentStatuses.map(status => (
              <option key={status} value={status}>
                {status === "all" ? "All workflow states" : status}
              </option>
            ))}
          </select>
        </label>
      </div>
      {workspace.isError ? (
        <EmptyPanel
          title="This trade’s evidence could not be loaded"
          description="Try again to load the document list and retained evidence."
          action={
            <Button onClick={() => workspace.refetch()}>Try again</Button>
          }
        />
      ) : workspace.isLoading ? (
        <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside
            className="panel hidden min-w-0 overflow-hidden lg:block"
            aria-label="Document queue"
          >
            <div className="border-b border-white/[0.07] p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-100">
                  Documents
                </h2>
                <FileSearch className="size-4 text-slate-400" />
              </div>
              <label className="mt-4 block">
                <span className="sr-only">
                  Filter documents by exact status
                </span>
                <select
                  aria-label="Filter documents by exact status"
                  value={statusFilter}
                  onChange={event => {
                    setStatusFilter(event.target.value as DocumentStatusFilter);
                    setDocumentId(null);
                  }}
                  className="h-9 w-full rounded-lg border border-white/10 bg-background px-3 text-xs text-slate-300"
                >
                  {documentStatuses.map(status => (
                    <option key={status} value={status}>
                      {status === "all" ? "All workflow states" : status}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="max-h-80 divide-y divide-white/[0.06] overflow-y-auto lg:max-h-[560px]">
              {visibleDocuments.length ? (
                visibleDocuments.map(document => (
                  <button
                    key={document.id}
                    aria-pressed={activeDocument?.id === document.id}
                    onClick={() => setDocumentId(document.id)}
                    className={cn(
                      "flex w-full gap-3 p-4 text-left transition-colors",
                      activeDocument?.id === document.id
                        ? "bg-teal-400/10"
                        : "hover:bg-white/[0.03]"
                    )}
                  >
                    <ScanLine
                      className={cn(
                        "mt-1 size-4 shrink-0",
                        activeDocument?.id === document.id
                          ? "text-teal-300"
                          : "text-slate-500"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium capitalize text-slate-200">
                        {document.documentType}
                      </p>
                      <p
                        className="mt-1 truncate text-xs text-slate-500"
                        title={document.fileName ?? undefined}
                      >
                        {document.fileName || "Awaiting upload"}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <StatusBadge status={document.status} />
                        {Array.isArray(document.inconsistencies) &&
                          document.inconsistencies.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs tabular-nums text-amber-300">
                              <AlertTriangle className="size-3" />
                              {document.inconsistencies.length}
                            </span>
                          )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <p className="p-6 text-sm leading-6 text-slate-400">
                  No documents match this workflow state.
                </p>
              )}
            </div>
          </aside>
          {activeDocument ? (
            <section
              className="min-w-0 space-y-5"
              aria-label="Selected document details"
            >
              <div className="panel overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.07] p-5">
                  <div className="flex min-w-0 flex-1 basis-full gap-3 sm:basis-0">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-teal-400/15 bg-teal-400/5">
                      <FileText className="size-5 text-teal-300" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold capitalize text-slate-100">
                        {activeDocument.documentType}
                      </h2>
                      <p className="mt-1 break-words text-xs text-slate-400">
                        {activeDocument.fileName || "No source file uploaded"}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <StatusBadge status={activeDocument.status} />
                        <span className="text-xs tabular-nums text-slate-500">
                          {
                            fieldEntries.filter(
                              ([, value]) => displayValue(value) !== "—"
                            ).length
                          }{" "}
                          populated fields · {versions.length} retained version
                          {versions.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {activeDocument.fileUrl && (
                    <a
                      href={activeDocument.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-medium text-slate-200 hover:bg-white/5"
                    >
                      Open source
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  )}
                </div>
                <Tabs
                  defaultValue="fields"
                  key={`${activeDocument.id}-${isReviewer}`}
                  className="gap-0"
                >
                  <div className="overflow-x-auto border-b border-white/[0.07] px-4 py-3">
                    <TabsList
                      aria-label="Document information"
                      className="h-10 bg-background"
                    >
                      <TabsTrigger value="fields" className="px-3 text-xs">
                        Extracted fields
                      </TabsTrigger>
                      <TabsTrigger value="history" className="px-3 text-xs">
                        Version history
                      </TabsTrigger>
                      {isReviewer && (
                        <TabsTrigger
                          value="correction"
                          className="px-3 text-xs"
                        >
                          Reviewer correction
                        </TabsTrigger>
                      )}
                    </TabsList>
                  </div>
                  <TabsContent value="fields" className="m-0 p-5">
                    <p className="mb-4 text-xs leading-5 text-slate-400">
                      Source-derived values for review. Empty values were not
                      found in this document.
                    </p>
                    {fieldEntries.length ? (
                      <dl className="grid min-w-0 grid-cols-1 gap-px overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2 2xl:grid-cols-3">
                        {fieldEntries.map(([field, value]) => {
                          const flagged = issues.some(issue =>
                            issue.toLowerCase().includes(field.toLowerCase())
                          );
                          return (
                            <div
                              key={field}
                              className="min-w-0 bg-card px-4 py-3.5"
                            >
                              <dt className="flex items-center gap-2 text-xs text-slate-400">
                                {labelFor(field)}
                                {flagged && (
                                  <AlertTriangle
                                    aria-label="Consistency flag"
                                    className="size-3.5 shrink-0 text-amber-300"
                                  />
                                )}
                              </dt>
                              <dd
                                className={cn(
                                  "mt-1.5 break-words text-sm tabular-nums",
                                  flagged
                                    ? "text-amber-200"
                                    : displayValue(value) === "—"
                                      ? "text-slate-500"
                                      : "text-slate-100"
                                )}
                              >
                                {displayValue(value)}
                              </dd>
                            </div>
                          );
                        })}
                      </dl>
                    ) : (
                      <div className="rounded-lg border border-dashed border-white/10 px-5 py-10 text-center">
                        <ScanLine className="mx-auto size-6 text-slate-500" />
                        <p className="mt-3 text-sm text-slate-300">
                          No extracted fields yet
                        </p>
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          Upload evidence from the trade’s document checklist to
                          start extraction.
                        </p>
                        <Link
                          href={`/trades/${activeId}`}
                          className="mt-4 inline-block text-xs font-medium text-teal-300"
                        >
                          Open document checklist
                        </Link>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="history" className="m-0 p-5">
                    <div className="mb-4 flex items-start gap-2">
                      <History className="mt-0.5 size-4 shrink-0 text-slate-400" />
                      <p className="text-xs leading-5 text-slate-400">
                        Compare a retained source snapshot with the current
                        extracted values. Field names stay visible on every row.
                      </p>
                    </div>
                    {versions.length ? (
                      <>
                        <label className="block text-xs text-slate-400">
                          Compare source version
                          <select
                            aria-label="Immutable version to compare"
                            value={comparisonVersion?.id ?? ""}
                            onChange={event =>
                              setComparisonVersionId(Number(event.target.value))
                            }
                            className="mt-2 h-10 w-full min-w-0 rounded-lg border border-white/10 bg-background px-3 text-xs text-slate-200"
                          >
                            {versions.map(version => (
                              <option value={version.id} key={version.id}>
                                v{version.version} · {version.fileName} ·{" "}
                                {new Date(
                                  version.createdAt
                                ).toLocaleDateString()}
                              </option>
                            ))}
                          </select>
                        </label>
                        <p className="my-4 text-xs tabular-nums text-slate-400">
                          {changedCount} changed field
                          {changedCount === 1 ? "" : "s"} compared with v
                          {comparisonVersion?.version}
                        </p>
                        <div className="overflow-x-auto rounded-lg border border-white/[0.07]">
                          <table className="w-full min-w-[460px] table-fixed text-left text-xs">
                            <thead>
                              <tr className="border-b border-white/[0.07] text-slate-400">
                                <th className="w-1/3 px-4 py-3">Field</th>
                                <th className="w-1/3 px-4 py-3">
                                  v{comparisonVersion?.version} source
                                </th>
                                <th className="w-1/3 px-4 py-3">
                                  Current value
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {diffKeys.map(field => {
                                const changed =
                                  displayValue(versionFields[field]) !==
                                  displayValue(extracted[field]);
                                return (
                                  <tr
                                    key={field}
                                    className={cn(
                                      "border-b border-white/[0.06] last:border-0",
                                      changed && "bg-amber-400/5"
                                    )}
                                  >
                                    <th
                                      scope="row"
                                      className="break-words px-4 py-3 font-medium text-slate-400"
                                    >
                                      {labelFor(field)}
                                    </th>
                                    <td className="break-words px-4 py-3 tabular-nums text-slate-300">
                                      {displayValue(versionFields[field])}
                                    </td>
                                    <td
                                      className={cn(
                                        "break-words px-4 py-3 tabular-nums",
                                        changed
                                          ? "text-amber-200"
                                          : "text-slate-200"
                                      )}
                                    >
                                      {displayValue(extracted[field])}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <p className="rounded-lg border border-dashed border-white/10 p-5 text-sm text-slate-400">
                        Upload a document to create its first immutable source
                        snapshot.
                      </p>
                    )}
                  </TabsContent>
                  {isReviewer && (
                    <TabsContent
                      value="correction"
                      className="m-0 space-y-4 p-5"
                    >
                      <p className="text-xs leading-5 text-slate-400">
                        Corrections retain their source and require a reviewer’s
                        explanation.
                      </p>
                      <label className="block text-xs text-slate-400">
                        Structured fields
                        <Textarea
                          aria-label="Structured extraction fields"
                          value={correctionJson}
                          onChange={event =>
                            setCorrectionJson(event.target.value)
                          }
                          className="mt-2 min-h-64 border-white/10 bg-background font-mono text-xs text-slate-200"
                        />
                      </label>
                      <label className="block text-xs text-slate-400">
                        Reason for correction
                        <Textarea
                          aria-label="Reason for extraction correction"
                          value={reviewerNotes}
                          onChange={event =>
                            setReviewerNotes(event.target.value)
                          }
                          placeholder="Describe the evidence reviewed and why the value should change…"
                          className="mt-2 min-h-24 border-white/10 bg-background text-sm text-slate-200"
                        />
                      </label>
                      {correctExtraction.error && (
                        <p role="alert" className="text-sm text-rose-300">
                          {correctExtraction.error.message}
                        </p>
                      )}
                      <Button
                        disabled={
                          !reviewerNotes.trim() || correctExtraction.isPending
                        }
                        onClick={() => {
                          try {
                            const fields = JSON.parse(correctionJson);
                            if (
                              !fields ||
                              typeof fields !== "object" ||
                              Array.isArray(fields)
                            )
                              throw new Error();
                            correctExtraction.mutate({
                              documentId: activeDocument.id,
                              extractedData: fields,
                              reviewerNotes,
                            });
                          } catch {
                            toast.error(
                              "Structured fields must be a valid JSON object."
                            );
                          }
                        }}
                      >
                        {correctExtraction.isPending
                          ? "Saving correction…"
                          : "Retain extraction correction"}
                      </Button>
                    </TabsContent>
                  )}
                </Tabs>
              </div>
              {(issues.length > 0 || linkedExceptions.length > 0) && (
                <div className="panel p-5">
                  <div className="flex items-center gap-2">
                    <Link2 className="size-4 text-amber-300" />
                    <h3 className="text-sm font-semibold text-slate-100">
                      Issues & linked exceptions
                    </h3>
                  </div>
                  <div className="mt-4 space-y-3">
                    {issues.map(issue => (
                      <p
                        key={issue}
                        className="flex gap-2 text-xs leading-5 text-amber-200"
                      >
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                        {issue}
                      </p>
                    ))}
                    {linkedExceptions.map(exception => (
                      <div
                        key={exception.id}
                        className="rounded-lg border border-white/[0.08] p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-medium text-slate-200">
                            {exception.title}
                          </p>
                          <StatusBadge status={exception.status} />
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-400">
                          {exception.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          ) : (
            <EmptyPanel
              title="No document selected"
              description="Choose another workflow state to inspect its documents."
              action={
                <Button onClick={() => setStatusFilter("all")}>
                  Show all documents
                </Button>
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
