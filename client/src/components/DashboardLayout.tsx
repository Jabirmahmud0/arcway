import SignInPage from "@/pages/SignIn";
import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { startLogin } from "@/const";
import {
  Activity,
  Archive,
  BadgeCheck,
  BarChart3,
  BellRing,
  Boxes,
  CheckSquare2,
  ChevronDown,
  ChevronRight,
  CircleDotDashed,
  FileSearch,
  FileSpreadsheet,
  FlaskConical,
  GitBranch,
  GitCompareArrows,
  Handshake,
  History,
  Landmark,
  LayoutDashboard,
  LineChart,
  ListChecks,
  LogOut,
  MailPlus,
  Menu,
  MessageSquareText,
  PanelLeftClose,
  PenLine,
  PlugZap,
  Plus,
  ScanLine,
  Search,
  Settings2,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Sparkles,
  TimerReset,
  UserRoundCheck,
} from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

type NavItem = {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  reviewerOnly?: boolean;
  traderOnly?: boolean;
};

const navigation: NavItem[] = [
  { label: "Overview", path: "/", icon: LayoutDashboard },
  { label: "Trade Inbox", path: "/inbox", icon: FileSearch },
  { label: "Trade Twins", path: "/trades", icon: Boxes },
  { label: "Create Trade", path: "/trades/new", icon: Plus, traderOnly: true },
  {
    label: "Ingest email",
    path: "/ingestion",
    icon: MailPlus,
    traderOnly: true,
  },
  { label: "Evidence Vault", path: "/vault", icon: Archive },
  { label: "Document Workbench", path: "/workbench", icon: ScanLine },
  { label: "Comparison Matrix", path: "/comparison", icon: GitCompareArrows },
  { label: "Critical Path", path: "/critical-path", icon: TimerReset },
  { label: "Why Blocked", path: "/why-blocked", icon: ShieldQuestion },
  { label: "Message Drafts", path: "/message-drafts", icon: PenLine },
  {
    label: "Entity Resolution",
    path: "/entity-resolution",
    icon: Sparkles,
    reviewerOnly: true,
  },
  {
    label: "Source Alias Review",
    path: "/source-alias-review",
    icon: FileSearch,
    reviewerOnly: true,
  },
  {
    label: "Commitment Review",
    path: "/commitment-review",
    icon: MessageSquareText,
    reviewerOnly: true,
  },
  { label: "Operations", path: "/operations", icon: Boxes },
  { label: "Integrations", path: "/integrations", icon: PlugZap },
  {
    label: "Monitoring",
    path: "/monitoring",
    icon: Activity,
    reviewerOnly: true,
  },
  {
    label: "Shadow Audit",
    path: "/shadow-audit",
    icon: History,
    reviewerOnly: true,
  },
  {
    label: "Structured Review",
    path: "/structured-review",
    icon: FileSpreadsheet,
    reviewerOnly: true,
  },
  { label: "Collaboration", path: "/collaboration", icon: Handshake },
  {
    label: "Policy Governance",
    path: "/policy-governance",
    icon: ShieldCheck,
    reviewerOnly: true,
  },
  {
    label: "Product Risk",
    path: "/product-risk",
    icon: Boxes,
    reviewerOnly: true,
  },
  {
    label: "Alert Policies",
    path: "/alert-policies",
    icon: BellRing,
    reviewerOnly: true,
  },
  {
    label: "Alert Quality",
    path: "/alert-quality",
    icon: BarChart3,
    reviewerOnly: true,
  },
  {
    label: "Evaluation",
    path: "/deterministic-evaluation",
    icon: FlaskConical,
    reviewerOnly: true,
  },
  {
    label: "Governance",
    path: "/governance",
    icon: Settings2,
    reviewerOnly: true,
  },
  { label: "Assurance Pack", path: "/assurance", icon: BadgeCheck },
  { label: "Command Search", path: "/search", icon: Search },
  { label: "Action Center", path: "/actions", icon: CheckSquare2 },
  { label: "Obligation Control", path: "/obligations", icon: GitBranch },
  {
    label: "Canonicalization",
    path: "/canonicalization",
    icon: CircleDotDashed,
  },
  {
    label: "Preflight Governance",
    path: "/preflight",
    icon: ShieldQuestion,
    reviewerOnly: true,
  },
  {
    label: "LC Preflight",
    path: "/lc-preflight",
    icon: Landmark,
    reviewerOnly: true,
  },
  {
    label: "Resolution Workbench",
    path: "/exception-resolution",
    icon: ListChecks,
  },
  {
    label: "Executive Outcomes",
    path: "/outcomes",
    icon: LineChart,
    reviewerOnly: true,
  },
  {
    label: "Review Queue",
    path: "/review",
    icon: ShieldCheck,
    reviewerOnly: true,
  },
  { label: "Exceptions", path: "/exceptions", icon: ShieldAlert },
  {
    label: "Analytics",
    path: "/analytics",
    icon: BarChart3,
    reviewerOnly: true,
  },
];

const navGroups = [
  {
    label: "Workspace",
    paths: [
      "/",
      "/inbox",
      "/trades",
      "/trades/new",
      "/ingestion",
      "/vault",
      "/actions",
      "/exceptions",
    ],
  },
  {
    label: "Trade intelligence",
    paths: [
      "/workbench",
      "/comparison",
      "/critical-path",
      "/why-blocked",
      "/message-drafts",
      "/assurance",
      "/obligations",
      "/exception-resolution",
      "/collaboration",
    ],
  },
  {
    label: "Review & assurance",
    paths: [
      "/review",
      "/entity-resolution",
      "/source-alias-review",
      "/commitment-review",
      "/structured-review",
      "/canonicalization",
      "/preflight",
      "/lc-preflight",
      "/shadow-audit",
    ],
  },
  {
    label: "Manage workspace",
    paths: [
      "/operations",
      "/integrations",
      "/monitoring",
      "/policy-governance",
      "/product-risk",
      "/alert-policies",
      "/alert-quality",
      "/deterministic-evaluation",
      "/governance",
      "/outcomes",
      "/analytics",
    ],
  },
];
const isActive = (path: string, location: string) =>
  path === location ||
  (path === "/trades" &&
    location.startsWith("/trades/") &&
    location !== "/trades/new");

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { loading, user, logout, error, refresh } = useAuth();
  const [location, navigate] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // A new workspace page should not inherit the previous page's scroll offset.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    setMobileOpen(false);
  }, [location]);

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

  if (loading)
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/15 border-t-teal-400" />
      </div>
    );
  if (error && !user) return <div role="alert" className="grid min-h-dvh place-items-center bg-background p-8 text-slate-100"><div className="panel max-w-md p-8 text-center"><ShieldCheck className="mx-auto size-8 text-teal-300" /><h1 className="mt-5 text-xl font-semibold">We couldn’t open your workspace</h1><p className="mt-3 text-sm leading-6 text-slate-400">Your identity could not be linked to the workspace. Please try again.</p><Button onClick={() => refresh()} className="mt-6">Try again</Button></div></div>;
  if (!user) return import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? <SignInPage /> : <SignedOutWorkspace />;

  const visibleNavigation = navigation.filter(
    item =>
      !(item.reviewerOnly && user.role !== "reviewer") &&
      !(item.traderOnly && user.role !== "trader")
  );
  const sidebar = (
    <Sidebar
      collapsed={collapsed}
      location={location}
      navigation={visibleNavigation}
      onNavigate={() => setMobileOpen(false)}
      onToggle={() => setCollapsed(value => !value)}
      user={user}
      onLogout={logout}
    />
  );

  return (
    <div className="app-shell min-h-dvh bg-background text-slate-100">
      <a
        href="#main-content"
        className="sr-only fixed left-4 top-4 z-50 rounded-md bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-lg focus:not-sr-only"
      >
        Skip to main content
      </a>
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block">
        {sidebar}
      </div>
      <div
        className={`min-h-dvh ${collapsed ? "lg:ml-[76px]" : "lg:ml-[264px]"}`}
      >
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-4 border-b border-white/[0.08] bg-background px-5 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-2 text-slate-400 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </button>
            <span className="hidden text-sm text-slate-400 sm:block">
              Workspace
            </span>
            <ChevronRight className="hidden size-3 text-slate-400 sm:block" />
            <span className="truncate text-sm font-medium text-slate-200">
              {navigation.find(item => isActive(item.path, location))?.label ||
                "Trade workspace"}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <Link
              href="/search"
              className="hidden items-center gap-2 text-xs text-slate-400 hover:text-white md:flex"
            >
              <Search className="size-4" />
              Search workspace
              <kbd className="ml-3 rounded border border-white/10 px-1.5 py-0.5 text-[10px]">
                Ctrl K
              </kbd>
            </Link>
            <span className="hidden h-5 w-px bg-white/10 md:block" />
            <span className="hidden rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs capitalize text-slate-300 sm:inline-flex">
              {user.role} workspace
            </span>
            <Link
              href="/actions"
              aria-label="Open action center"
              className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <BellRing className="size-4" />
            </Link>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="workspace-main p-5 md:p-8 xl:px-10 xl:py-9"
        >
          {children}
        </main>
      </div>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          role="dialog"
          aria-label="Workspace navigation"
          side="left"
          className="w-[280px] gap-0 border-0 p-0 [&>button]:top-5"
        >
          <SheetTitle className="sr-only">Workspace navigation</SheetTitle>
          <Sidebar
            collapsed={false}
            location={location}
            navigation={visibleNavigation}
            onNavigate={() => setMobileOpen(false)}
            onToggle={() => {}}
            user={user}
            onLogout={logout}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Sidebar({
  collapsed,
  location,
  navigation,
  onNavigate,
  onToggle,
  user,
  onLogout,
}: {
  collapsed: boolean;
  location: string;
  navigation: NavItem[];
  onNavigate: () => void;
  onToggle: () => void;
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  onLogout: () => void;
}) {
  return (
    <aside
      className={`flex h-dvh flex-col border-r border-white/[0.08] bg-[#101d26] ${collapsed ? "w-[76px]" : "w-[264px]"}`}
    >
      <div className="flex h-[72px] shrink-0 items-center border-b border-white/[0.07] px-5">
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-teal-300/20 bg-teal-300/10 text-teal-200">
            <ShieldCheck className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-lg font-semibold text-slate-50">Arcway</p>
              <p className="mt-0.5 text-[9px] font-medium uppercase text-slate-500">
                Trade assurance
              </p>
            </div>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="hidden rounded-md p-1.5 text-slate-500 hover:bg-white/[0.05] hover:text-slate-200 lg:block"
          aria-label="Toggle navigation"
        >
          {collapsed ? (
            <Menu className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>
      <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-3 py-5">
        <Link
          href="/search"
          onClick={onNavigate}
          aria-label="Search workspace"
          className={cn(
            "mb-6 flex h-10 items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 text-xs text-slate-400 hover:text-white",
            location === "/search" &&
              "border-teal-300/20 bg-teal-300/[0.06] text-teal-200",
            collapsed && "justify-center px-0"
          )}
        >
          <Search className="size-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1">Find anything…</span>
              <kbd className="text-[10px]">Ctrl K</kbd>
            </>
          )}
        </Link>
        <nav aria-label="Workspace navigation" className="space-y-5">
          {navGroups.map((group, index) => {
            const items = group.paths
              .map(path => navigation.find(item => item.path === path))
              .filter((item): item is NavItem => Boolean(item));
            if (!items.length) return null;
            const links = (
              <div className="mt-2 space-y-1">
                {items.map(item => (
                  <NavigationItem
                    key={item.path}
                    item={item}
                    active={isActive(item.path, location)}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            );
            return index === 0 || collapsed ? (
              <div key={group.label}>
                {!collapsed && (
                  <p className="px-3 text-[11px] font-medium text-slate-500">
                    {group.label}
                  </p>
                )}
                {links}
              </div>
            ) : (
              <details
                key={`${group.label}-${location}`}
                open={
                  index === 1 ||
                  items.some(item => isActive(item.path, location)) ||
                  undefined
                }
                className="group/nav"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between rounded px-3 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-100">
                  {group.label}
                  <ChevronDown className="size-3 group-open/nav:rotate-180" />
                </summary>
                {links}
              </details>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-white/[0.07] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div
          className={`flex items-center gap-3 rounded-lg p-2 ${collapsed ? "justify-center" : ""}`}
        >
          <Avatar className="h-8 w-8 border border-white/[0.1]">
            <AvatarFallback className="bg-slate-800 text-xs text-teal-200">
              {user.name?.slice(0, 1).toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-slate-200">
                {user.name || "ARCWAY user"}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] capitalize text-slate-400">
                <UserRoundCheck className="h-3 w-3" />
                {user.role}
              </p>
            </div>
          )}
          <button
            onClick={onLogout}
            className={`${collapsed ? "hidden" : ""} text-slate-400 hover:text-rose-300`}
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavigationItem({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={item.path}
          onClick={onNavigate}
          aria-label={collapsed ? item.label : undefined}
          aria-current={active ? "page" : undefined}
          className={cn(
            "relative flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors",
            active
              ? "bg-teal-300/[0.09] text-teal-100 before:absolute before:inset-y-3 before:left-0 before:w-0.5 before:rounded-full before:bg-teal-300"
              : "text-slate-400 hover:bg-white/5 hover:text-slate-100",
            collapsed && "justify-center"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </Link>
      </TooltipTrigger>
      {collapsed && <TooltipContent side="right">{item.label}</TooltipContent>}
    </Tooltip>
  );
}

function SignedOutWorkspace() {
  return (
    <div className="relative grid min-h-dvh overflow-hidden bg-background px-5 py-8 text-slate-100">
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col justify-center">
        <div className="mb-10 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-500 text-white shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight">ARCWAY</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-teal-300">
              Trade assurance network
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.10] bg-card/85 p-7 shadow-2xl shadow-black/30 backdrop-blur">
          <p className="eyebrow">Secure workspace</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-100">
            Every trade.
            <br />
            Checked before it moves.
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Reconstruct commercial truth, verify the evidence, and create a
            defensible operating record before goods, documents, or money move.
          </p>
          <Button
            onClick={() => startLogin()}
            className="mt-7 h-11 w-full bg-teal-500 text-white hover:bg-teal-600"
          >
            Sign in to ARCWAY
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
          <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-5 text-center">
            <div>
              <p className="text-xs font-semibold text-slate-300">Capture</p>
              <p className="mt-1 text-[10px] text-slate-400">Trade Twin</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-300">Verify</p>
              <p className="mt-1 text-[10px] text-slate-400">Evidence</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-300">Release</p>
              <p className="mt-1 text-[10px] text-slate-400">Assurance</p>
            </div>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          ARCWAY maintains a structured, timestamped trade record.
        </p>
      </div>
    </div>
  );
}
