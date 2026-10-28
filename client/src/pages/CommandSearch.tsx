import { useAuth } from "@/_core/hooks/useAuth";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  Archive,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Boxes,
  Building2,
  Check,
  CornerDownLeft,
  FileCheck2,
  FileSearch,
  GitBranch,
  LayoutGrid,
  PackageSearch,
  Plus,
  RefreshCw,
  ScanLine,
  Search,
  ShieldCheck,
  Ship,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

type Category =
  | "all"
  | "trades"
  | "evidence"
  | "shipments"
  | "parties"
  | "products"
  | "actions";
type SearchEntry = {
  id: string;
  category: Exclude<Category, "all">;
  title: string;
  description: string;
  keywords: string;
  path: string;
  icon: typeof Search;
  tag?: string;
};
const categories: { id: Category; label: string; icon: typeof Search }[] = [
  { id: "all", label: "Everything", icon: LayoutGrid },
  { id: "trades", label: "Trade Twins", icon: Boxes },
  { id: "evidence", label: "Evidence", icon: Archive },
  { id: "shipments", label: "Shipments", icon: Ship },
  { id: "parties", label: "Counterparties", icon: Building2 },
  { id: "products", label: "Products", icon: PackageSearch },
  { id: "actions", label: "Actions", icon: ArrowUpRight },
];

export default function CommandSearch() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("all");
  const trades = trpc.trades.list.useQuery(undefined, { retry: false });
  const masters = trpc.operations.masters.list.useQuery(undefined, {
    retry: false,
  });
  const vault = trpc.trades.vault.useQuery(undefined, { retry: false });
  const shipments = trpc.operations.shipments.list.useQuery(undefined, {
    retry: false,
  });
  const sources = [trades, masters, vault, shipments];
  const loading = sources.some(source => source.isLoading);
  const unavailable = sources.some(source => source.isError);
  const refreshing = sources.some(source => source.isFetching);
  const retry = () => {
    void Promise.all(sources.map(source => source.refetch()));
  };

  const entries = useMemo(() => {
    const items: SearchEntry[] = [
      {
        id: "workbench",
        category: "actions",
        title: "Document Workbench",
        description: "Review documents and reconcile trade evidence",
        keywords: "open document workbench review",
        path: "/workbench",
        icon: ScanLine,
        tag: "Workspace",
      },
      {
        id: "trades",
        category: "actions",
        title: "Trade Twins",
        description: "Explore your portfolio and assurance state",
        keywords: "open trade twins portfolio",
        path: "/trades",
        icon: Boxes,
        tag: "Workspace",
      },
      {
        id: "exceptions",
        category: "actions",
        title: "Exception resolution",
        description: "Investigate blockers and resolve discrepancies",
        keywords: "open exceptions blocked resolution",
        path: "/exceptions",
        icon: GitBranch,
        tag: "Workspace",
      },
      {
        id: "integrations",
        category: "actions",
        title: "Integration center",
        description: "Manage connected sources and integration workflows",
        keywords: "run integration workflow sources",
        path: "/integrations",
        icon: FileSearch,
        tag: "Workspace",
      },
      ...(user?.role === "trader"
        ? [
            {
              id: "create",
              category: "actions" as const,
              title: "Create Trade Twin",
              description: "Start a new trade and its evidence record",
              keywords: "new create trade twin",
              path: "/trades/new",
              icon: Plus,
              tag: "Action",
            },
          ]
        : []),
      ...(user?.role === "reviewer"
        ? [
            {
              id: "governance",
              category: "actions" as const,
              title: "Governance controls",
              description: "Review access, policy, and release controls",
              keywords: "open governance controls policy",
              path: "/governance",
              icon: ShieldCheck,
              tag: "Workspace",
            },
          ]
        : []),
    ];
    trades.data?.forEach(trade =>
      items.push({
        id: `trade-${trade.id}`,
        category: "trades",
        title: trade.reference,
        description: `${trade.sellerName} → ${trade.buyerName}`,
        keywords: `${trade.reference} ${trade.buyerName} ${trade.sellerName} ${trade.commodity} ${trade.originCountry} ${trade.destinationCountry}`,
        path: `/trades/${trade.id}/workspace`,
        icon: Boxes,
        tag: trade.assuranceState.replaceAll("_", " "),
      })
    );
    vault.data?.forEach(row =>
      items.push({
        id: `document-${row.document.id}`,
        category: "evidence",
        title: row.document.fileName || row.document.documentType,
        description: `${row.trade.reference} · ${row.document.documentType}`,
        keywords: `${row.trade.reference} ${row.document.documentType} ${row.document.fileName || ""} ${row.document.status} evidence`,
        path: "/vault",
        icon: Archive,
        tag: row.document.status,
      })
    );
    shipments.data?.forEach(record => {
      items.push({
        id: `shipment-${record.shipment.id}`,
        category: "shipments",
        title: record.shipment.bookingReference || "Unreferenced shipment",
        description: `${record.trade.reference} · ${record.shipment.origin || "Origin pending"} → ${record.shipment.destination || "Destination pending"}`,
        keywords: `${record.trade.reference} ${record.shipment.bookingReference || ""} ${record.shipment.carrier || ""} ${record.shipment.forwarder || ""} ${record.shipment.vessel || ""} ${record.shipment.voyage || ""} ${record.shipment.origin || ""} ${record.shipment.destination || ""} shipment booking`,
        path: `/trades/${record.trade.id}/workspace`,
        icon: Ship,
        tag: record.shipment.mode,
      });
      record.events.forEach(event =>
        items.push({
          id: `event-${event.id}`,
          category: "shipments",
          title: event.eventType.replaceAll("_", " "),
          description: `${record.trade.reference} · ${event.location || "Location pending"} · ${event.source || "manual"}`,
          keywords: `${record.trade.reference} ${record.shipment.bookingReference || ""} ${event.eventType} ${event.location || ""} shipment event`,
          path: `/trades/${record.trade.id}/workspace`,
          icon: Ship,
          tag: "Event",
        })
      );
    });
    masters.data?.counterparties.forEach(item =>
      items.push({
        id: `party-${item.id}`,
        category: "parties",
        title: item.legalName,
        description: item.countryCode,
        keywords: `${item.legalName} ${item.countryCode} counterparty`,
        path: "/operations",
        icon: Building2,
        tag: "Counterparty",
      })
    );
    masters.data?.products.forEach(item =>
      items.push({
        id: `product-${item.id}`,
        category: "products",
        title: item.sku,
        description: item.description,
        keywords: `${item.sku} ${item.buyerSku || ""} ${item.description} product`,
        path: "/operations",
        icon: PackageSearch,
        tag: `Version ${item.version}`,
      })
    );
    return items;
  }, [trades.data, masters.data, vault.data, shipments.data, user?.role]);
  const matched = useMemo(() => {
    const terms = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return entries.filter(entry =>
      terms.every(term =>
        `${entry.title} ${entry.description} ${entry.keywords}`
          .toLowerCase()
          .includes(term)
      )
    );
  }, [entries, search]);
  const visible = matched.filter(
    entry => category === "all" || entry.category === category
  );
  const groups = categories
    .filter(
      item => item.id !== "all" && (category === "all" || category === item.id)
    )
    .map(item => ({
      ...item,
      entries: visible.filter(entry => entry.category === item.id),
    }))
    .filter(group => group.entries.length);

  return (
    <div className="search-workspace mx-auto max-w-[1440px]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-white/[0.08] pb-8">
        <div>
          <p className="eyebrow mb-3">YOUR WORKSPACE, CONNECTED</p>
          <h1 className="text-3xl font-semibold text-slate-50 md:text-4xl">
            Find clarity. <span className="text-slate-400">Keep moving.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Search every trade, document, and shipment. Get straight to what
            matters.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300">
          <ShieldCheck className="size-3.5 text-teal-300" />
          Your workspace access applies
        </span>
      </div>
      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0" aria-label="Workspace search">
          <Command
            shouldFilter={false}
            label="Search workspace records and actions"
            className="overflow-hidden rounded-2xl border border-white/10 bg-card shadow-sm"
          >
            <div className="flex items-center border-b border-white/10 bg-[#15232c] px-2 focus-within:bg-[#182a33]">
              <CommandInput
                autoFocus
                aria-label="Search workspace"
                value={search}
                onValueChange={setSearch}
                placeholder="Search trades, companies, documents…"
                wrapperClassName="h-[76px] flex-1 border-0 px-4 [&>svg]:size-5 [&>svg]:text-teal-300 [&>svg]:opacity-100"
                className="text-base placeholder:text-slate-500"
              />
              {search ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                  className="mr-3 text-slate-400"
                >
                  <X className="size-4" />
                </Button>
              ) : (
                <kbd
                  aria-hidden="true"
                  className="mr-4 hidden shrink-0 rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-slate-400 sm:block"
                >
                  Type to search
                </kbd>
              )}
            </div>
            <div
              className="category-scroll flex gap-1 overflow-x-auto border-b border-white/[0.08] px-4 py-3"
              aria-label="Search categories"
            >
              {categories.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setCategory(id)}
                  aria-pressed={category === id}
                  className={cn(
                    "shrink-0 rounded-md px-3 py-2 text-xs font-medium",
                    category === id
                      ? "bg-teal-400/10 text-teal-200"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 px-6 pb-1 pt-5">
              <h2 className="text-xs font-medium text-slate-400">
                {search
                  ? `Results for “${search}”`
                  : category === "all"
                    ? "Explore your workspace"
                    : categories.find(item => item.id === category)?.label}
              </h2>
              <span
                className="shrink-0 text-[11px] tabular-nums text-slate-500"
                aria-live="polite"
              >
                {visible.length} result{visible.length === 1 ? "" : "s"}
              </span>
            </div>
            <CommandList className="min-h-80 max-h-[580px] px-3 pb-4">
              {loading && (
                <div
                  role="status"
                  className="flex items-center gap-2 px-3 py-4 text-xs text-slate-400"
                >
                  <RefreshCw className="size-3.5" />
                  Loading workspace records…
                </div>
              )}
              <CommandEmpty>
                <div className="mx-auto flex max-w-sm flex-col items-center px-5 py-10">
                  <div className="grid size-12 place-items-center rounded-xl border border-white/10 bg-white/5">
                    <Search className="size-5 text-slate-400" />
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-slate-100">
                    {loading
                      ? "Searching your workspace"
                      : "No matching results"}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {unavailable && category !== "actions"
                      ? "Some records are unavailable. You can retry the connection or search workspace actions."
                      : "Try a trade reference, company name, or another category."}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-5"
                    onClick={() => {
                      setSearch("");
                      setCategory("all");
                    }}
                  >
                    Reset search
                  </Button>
                </div>
              </CommandEmpty>
              {groups.map(group => (
                <CommandGroup
                  key={group.id}
                  heading={
                    group.id === "actions" && !search
                      ? "Jump to a workspace"
                      : group.label
                  }
                  className="py-2 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:text-slate-500"
                >
                  {group.entries.map(entry => (
                    <CommandItem
                      key={entry.id}
                      value={entry.id}
                      onSelect={() => navigate(entry.path)}
                      className="group my-1 cursor-pointer gap-4 rounded-xl border border-transparent px-3 py-3.5 data-[selected=true]:border-white/10 data-[selected=true]:bg-white/[0.045]"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-[#1c2a33] text-slate-400 group-data-[selected=true]:border-teal-400/20 group-data-[selected=true]:bg-teal-400/10 group-data-[selected=true]:text-teal-300">
                        <entry.icon className="size-[18px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-100">
                          {entry.title}
                        </span>
                        <span className="mt-1 block truncate text-xs text-slate-400">
                          {entry.description}
                        </span>
                      </span>
                      <span className="hidden rounded-md border border-white/[0.07] px-2 py-1 text-[10px] capitalize text-slate-500 sm:block">
                        {entry.tag}
                      </span>
                      <ArrowUpRight className="size-4 text-slate-500 group-data-[selected=true]:text-teal-300" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] bg-white/[0.015] px-6 py-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-white/10 p-0.5">
                  <ArrowUp className="size-3" />
                </kbd>
                <kbd className="rounded border border-white/10 p-0.5">
                  <ArrowDown className="size-3" />
                </kbd>
                <span className="ml-1">to navigate</span>
              </span>
              <span className="flex items-center gap-2">
                <kbd className="rounded border border-white/10 px-1 py-0.5">
                  <CornerDownLeft className="size-3" />
                </kbd>
                to open
              </span>
              <span className="hidden items-center gap-1.5 sm:flex">
                <Check className="size-3 text-teal-300" />
                Search respects your permissions
              </span>
            </div>
          </Command>
          {unavailable && (
            <div
              role="status"
              className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-300/15 bg-amber-300/[0.035] px-4 py-3"
            >
              <span className="size-1.5 shrink-0 rounded-full bg-amber-300" />
              <p className="min-w-0 flex-1 text-xs leading-5 text-slate-400">
                Some workspace records couldn’t be loaded. Navigation and
                actions are still available.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={retry}
                disabled={refreshing}
                className="h-8 gap-2 text-xs text-amber-200"
              >
                <RefreshCw className="size-3" />
                {refreshing ? "Retrying…" : "Retry"}
              </Button>
            </div>
          )}
        </section>
        <aside className="space-y-6" aria-label="Search shortcuts">
          <div className="rounded-2xl border border-white/[0.09] bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100">
                Start with a workspace
              </h2>
              <ArrowUpRight className="size-4 text-slate-500" />
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              The right context, one click away.
            </p>
            <div className="mt-5 space-y-1">
              {[
                {
                  title: "Trade portfolio",
                  text: "The complete trade picture",
                  icon: Boxes,
                  path: "/trades",
                },
                {
                  title: "Evidence vault",
                  text: "Documents and provenance",
                  icon: Archive,
                  path: "/vault",
                },
                {
                  title: "Critical path",
                  text: "Dependencies and deadlines",
                  icon: GitBranch,
                  path: "/critical-path",
                },
                {
                  title: "Assurance pack",
                  text: "Readiness at every handoff",
                  icon: ShieldCheck,
                  path: "/assurance",
                },
              ].map(({ title, text, icon: Icon, path }) => (
                <Link
                  key={path}
                  href={path}
                  className="group -mx-2 flex items-center gap-3 rounded-lg p-2 hover:bg-white/[0.035]"
                >
                  <Icon className="size-4 shrink-0 text-slate-400" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-slate-200">
                      {title}
                    </span>
                    <span className="mt-1 block text-[11px] text-slate-500">
                      {text}
                    </span>
                  </span>
                  <ArrowRight className="size-3.5 text-slate-600 group-hover:text-teal-300" />
                </Link>
              ))}
            </div>
          </div>
          <div className="px-1">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-300">
              <FileCheck2 className="size-4 text-teal-300" />A little context
              goes a long way
            </div>
            <p className="text-xs leading-6 text-slate-400">
              Search by a trade reference, buyer, booking number, or document
              name. Combine words to narrow your results.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["invoice", "shipment", "governance"].map(example => (
                <button
                  key={example}
                  onClick={() => {
                    setSearch(example);
                    setCategory("all");
                  }}
                  className="rounded-md border border-white/10 px-2.5 py-1.5 font-mono text-[10px] text-slate-400 hover:border-teal-400/30 hover:text-teal-200"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-white/[0.08] px-1 pt-5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-teal-400/10 text-teal-300">
              <ShieldCheck className="size-4" />
            </span>
            <p className="text-[11px] leading-5 text-slate-500">
              Connected evidence.
              <br />
              <span className="text-slate-300">Confident decisions.</span>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
