import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { startLogin } from "@/const";
import { Activity, Archive, BadgeCheck, BarChart3, BellRing, Boxes, CheckSquare2, ChevronRight, CircleDotDashed, FileSearch, FileSpreadsheet, FlaskConical, GitBranch, GitCompareArrows, Handshake, History, Landmark, LayoutDashboard, LineChart, ListChecks, LogOut, MailPlus, Menu, MessageSquareText, PanelLeftClose, PenLine, PlugZap, Plus, ScanLine, Search, Settings2, ShieldCheck, ShieldAlert, ShieldQuestion, Sparkles, TimerReset, UserRoundCheck } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

type NavItem = { label: string; path: string; icon: typeof LayoutDashboard; reviewerOnly?: boolean; traderOnly?: boolean };

const navigation: NavItem[] = [
  { label: "Overview", path: "/", icon: LayoutDashboard },
  { label: "Trade Inbox", path: "/inbox", icon: FileSearch },
  { label: "Trade Twins", path: "/trades", icon: Boxes },
  { label: "Create Trade", path: "/trades/new", icon: Plus, traderOnly: true },
  { label: "Ingest email", path: "/ingestion", icon: MailPlus, traderOnly: true },
  { label: "Evidence Vault", path: "/vault", icon: Archive },
  { label: "Document Workbench", path: "/workbench", icon: ScanLine },
  { label: "Comparison Matrix", path: "/comparison", icon: GitCompareArrows },
  { label: "Critical Path", path: "/critical-path", icon: TimerReset },
  { label: "Why Blocked", path: "/why-blocked", icon: ShieldQuestion },
  { label: "Message Drafts", path: "/message-drafts", icon: PenLine },
  { label: "Entity Resolution", path: "/entity-resolution", icon: Sparkles, reviewerOnly: true },
  { label: "Source Alias Review", path: "/source-alias-review", icon: FileSearch, reviewerOnly: true },
  { label: "Commitment Review", path: "/commitment-review", icon: MessageSquareText, reviewerOnly: true },
  { label: "Operations", path: "/operations", icon: Boxes },
  { label: "Integrations", path: "/integrations", icon: PlugZap },
  { label: "Monitoring", path: "/monitoring", icon: Activity, reviewerOnly: true },
  { label: "Shadow Audit", path: "/shadow-audit", icon: History, reviewerOnly: true },
  { label: "Structured Review", path: "/structured-review", icon: FileSpreadsheet, reviewerOnly: true },
  { label: "Collaboration", path: "/collaboration", icon: Handshake },
  { label: "Policy Governance", path: "/policy-governance", icon: ShieldCheck, reviewerOnly: true },
  { label: "Product Risk", path: "/product-risk", icon: Boxes, reviewerOnly: true },
  { label: "Alert Policies", path: "/alert-policies", icon: BellRing, reviewerOnly: true },
  { label: "Alert Quality", path: "/alert-quality", icon: BarChart3, reviewerOnly: true },
  { label: "Evaluation", path: "/deterministic-evaluation", icon: FlaskConical, reviewerOnly: true },
  { label: "Governance", path: "/governance", icon: Settings2, reviewerOnly: true },
  { label: "Assurance Pack", path: "/assurance", icon: BadgeCheck },
  { label: "Command Search", path: "/search", icon: Search },
  { label: "Action Center", path: "/actions", icon: CheckSquare2 },
  { label: "Obligation Control", path: "/obligations", icon: GitBranch },
  { label: "Canonicalization", path: "/canonicalization", icon: CircleDotDashed },
  { label: "Preflight Governance", path: "/preflight", icon: ShieldQuestion, reviewerOnly: true },
  { label: "LC Preflight", path: "/lc-preflight", icon: Landmark, reviewerOnly: true },
  { label: "Resolution Workbench", path: "/exception-resolution", icon: ListChecks },
  { label: "Executive Outcomes", path: "/outcomes", icon: LineChart, reviewerOnly: true },
  { label: "Review Queue", path: "/review", icon: ShieldCheck, reviewerOnly: true },
  { label: "Exceptions", path: "/exceptions", icon: ShieldAlert },
  { label: "Analytics", path: "/analytics", icon: BarChart3, reviewerOnly: true },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { loading, user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        navigate("/search");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  if (loading) return <div className="grid min-h-screen place-items-center bg-[#090d16]"><div className="h-6 w-6 animate-spin rounded-full border-2 border-white/15 border-t-blue-400" /></div>;
  if (!user) return <SignedOutWorkspace />;

  const visibleNavigation = navigation.filter(item => !(item.reviewerOnly && user.role !== "reviewer") && !(item.traderOnly && user.role !== "trader"));
  const sidebar = <Sidebar collapsed={collapsed} location={location} navigation={visibleNavigation} onNavigate={() => setMobileOpen(false)} onToggle={() => setCollapsed(value => !value)} user={user} onLogout={logout} />;

  return <div className="min-h-screen bg-[#090d16] text-slate-100">
    <a href="#main-content" className="sr-only fixed left-4 top-4 z-[100] rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg focus:not-sr-only">Skip to main content</a>
    <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block">{sidebar}</div>
    <div className={`min-h-screen transition-[margin] duration-200 ${collapsed ? "lg:ml-[76px]" : "lg:ml-[248px]"}`}>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/[0.07] bg-[#090d16]/90 px-5 backdrop-blur-xl md:px-8">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="rounded-md p-2 text-slate-400 hover:bg-white/[0.05] lg:hidden" aria-label="Open navigation"><Menu className="h-4 w-4" /></button>
          <div><p className="text-xs font-semibold tracking-[0.04em] text-slate-300">ARCWAY / assurance console</p><p className="mt-0.5 text-[10px] text-slate-600">{user.role === "reviewer" ? "Reviewer-controlled evidence and release environment" : "Trader-controlled submission and evidence environment"}</p></div>
        </div>
        <div className="flex items-center gap-2"><button className="rounded-md p-2 text-slate-500 hover:bg-white/[0.05] hover:text-slate-300" aria-label="Owner notification channel"><BellRing className="h-4 w-4" /></button><div className="hidden rounded-full border border-blue-400/15 bg-blue-400/[0.07] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-300 sm:block">{user.role} workspace</div></div>
      </header>
      <main id="main-content" tabIndex={-1} className="p-5 md:p-8">{children}</main>
    </div>
    {mobileOpen && <div className="fixed inset-0 z-50 bg-black/60 lg:hidden" onClick={() => setMobileOpen(false)}><div role="dialog" aria-label="Workspace navigation" className="h-full w-[280px]" onClick={event => event.stopPropagation()}>{sidebar}</div></div>}
  </div>;
}

function Sidebar({ collapsed, location, navigation, onNavigate, onToggle, user, onLogout }: { collapsed: boolean; location: string; navigation: NavItem[]; onNavigate: () => void; onToggle: () => void; user: NonNullable<ReturnType<typeof useAuth>["user"]>; onLogout: () => void }) {
  return <aside className={`flex h-full flex-col border-r border-white/[0.07] bg-[#0d1320] transition-all duration-200 ${collapsed ? "w-[76px]" : "w-[248px]"}`}>
    <div className="flex h-16 items-center border-b border-white/[0.07] px-4">
      <Link href="/" className="flex min-w-0 flex-1 items-center gap-3"><div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-500 text-white"><ShieldCheck className="h-4 w-4" /></div>{!collapsed && <div className="min-w-0"><p className="text-sm font-semibold tracking-[0.02em] text-slate-100">ARCWAY</p><p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-blue-300">Trade assurance</p></div>}</Link>
      <button onClick={onToggle} className="hidden rounded-md p-1.5 text-slate-500 hover:bg-white/[0.05] hover:text-slate-200 lg:block" aria-label="Toggle navigation">{collapsed ? <Menu className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}</button>
    </div>
    <div className="flex-1 px-3 py-5"><p className={`mb-2 px-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-600 ${collapsed ? "text-center text-[0px]" : ""}`}>Workspace</p><nav className="space-y-1" aria-label="Workspace navigation">{navigation.map(item => <NavigationItem key={item.path} item={item} active={location === item.path || (item.path === "/trades" && location.startsWith("/trades/"))} collapsed={collapsed} onNavigate={onNavigate} />)}</nav></div>
    <div className="border-t border-white/[0.07] p-3"><div className={`flex items-center gap-3 rounded-lg p-2 ${collapsed ? "justify-center" : ""}`}><Avatar className="h-8 w-8 border border-white/[0.1]"><AvatarFallback className="bg-slate-800 text-xs text-blue-200">{user.name?.slice(0, 1).toUpperCase() || "A"}</AvatarFallback></Avatar>{!collapsed && <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-200">{user.name || "ARCWAY user"}</p><p className="mt-0.5 flex items-center gap-1 text-[10px] capitalize text-slate-500"><UserRoundCheck className="h-3 w-3" />{user.role}</p></div>}<button onClick={onLogout} className={`${collapsed ? "hidden" : ""} text-slate-600 hover:text-rose-300`} aria-label="Sign out"><LogOut className="h-4 w-4" /></button></div></div>
  </aside>;
}

function NavigationItem({ item, active, collapsed, onNavigate }: { item: NavItem; active: boolean; collapsed: boolean; onNavigate: () => void }) {
  const Icon = item.icon;
  return <Tooltip><TooltipTrigger asChild><Link href={item.path} onClick={onNavigate} aria-current={active ? "page" : undefined} className={`flex h-10 items-center gap-3 rounded-lg px-2.5 text-sm transition-colors ${active ? "bg-blue-400/[0.12] text-blue-200" : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"}`}><Icon className="h-4 w-4 shrink-0" />{!collapsed && <span className="truncate">{item.label}</span>}</Link></TooltipTrigger>{collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}</Tooltip>;
}

function SignedOutWorkspace() {
  return <div className="relative grid min-h-screen overflow-hidden bg-[#090d16] px-5 py-8 text-slate-100"><div className="aurora" /><div className="relative z-10 mx-auto flex w-full max-w-md flex-col justify-center"><div className="mb-10 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500 text-white shadow-[0_0_30px_rgba(59,130,246,0.32)]"><ShieldCheck className="h-5 w-5" /></div><div><p className="text-base font-semibold tracking-tight">ARCWAY</p><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-300">Trade assurance network</p></div></div><div className="rounded-2xl border border-white/[0.10] bg-[#111827]/85 p-7 shadow-2xl shadow-black/30 backdrop-blur"><p className="eyebrow">Secure workspace</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-100">Every trade.<br />Checked before it moves.</h1><p className="mt-4 text-sm leading-6 text-slate-400">Reconstruct commercial truth, verify the evidence, and create a defensible operating record before goods, documents, or money move.</p><Button onClick={() => startLogin()} className="mt-7 h-11 w-full bg-blue-500 text-white hover:bg-blue-400">Sign in to ARCWAY<ChevronRight className="ml-2 h-4 w-4" /></Button><div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-5 text-center"><div><p className="text-xs font-semibold text-slate-300">Capture</p><p className="mt-1 text-[10px] text-slate-600">Trade Twin</p></div><div><p className="text-xs font-semibold text-slate-300">Verify</p><p className="mt-1 text-[10px] text-slate-600">Evidence</p></div><div><p className="text-xs font-semibold text-slate-300">Release</p><p className="mt-1 text-[10px] text-slate-600">Assurance</p></div></div></div><p className="mt-6 text-center text-xs text-slate-600">ARCWAY maintains a structured, timestamped trade record.</p></div></div>;
}
