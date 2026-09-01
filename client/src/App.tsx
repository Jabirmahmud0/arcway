import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import Analytics from "@/pages/Analytics";
import Dashboard from "@/pages/Dashboard";
import Exceptions from "@/pages/Exceptions";
import Ingestion from "@/pages/Ingestion";
import TradeInbox from "@/pages/TradeInbox";
import NewTrade from "@/pages/NewTrade";
import NotFound from "@/pages/NotFound";
import ReviewQueue from "@/pages/ReviewQueue";
import TradeDetail from "@/pages/TradeDetail";
import Trades from "@/pages/Trades";
import Vault from "@/pages/Vault";
import DocumentWorkbench from "@/pages/DocumentWorkbench";
import OperationsHub from "@/pages/OperationsHub";
import TradeWorkspace from "@/pages/TradeWorkspace";
import IntegrationCenter from "@/pages/IntegrationCenter";
import GovernanceCenter from "@/pages/GovernanceCenter";
import GuestPortal from "@/pages/GuestPortal";
import AssuranceCenter from "@/pages/AssuranceCenter";
import CommandSearch from "@/pages/CommandSearch";
import ActionCenter from "@/pages/ActionCenter";
import ExecutiveOutcomes from "@/pages/ExecutiveOutcomes";
import CanonicalizationCenter from "@/pages/CanonicalizationCenter";
import PreflightGovernance from "@/pages/PreflightGovernance";
import ExceptionResolutionCenter from "@/pages/ExceptionResolutionCenter";
import ObligationManagement from "@/pages/ObligationManagement";
import MonitoringCenter from "@/pages/MonitoringCenter";
import StructuredSourceReview from "@/pages/StructuredSourceReview";
import CollaborationCenter from "@/pages/CollaborationCenter";
import PolicyGovernanceCenter from "@/pages/PolicyGovernanceCenter";
import ProductRiskReporting from "@/pages/ProductRiskReporting";
import AlertPolicyCenter from "@/pages/AlertPolicyCenter";
import LCPreflightCenter from "@/pages/LCPreflightCenter";
import ComparisonMatrix from "@/pages/ComparisonMatrix";
import ShadowAuditReview from "@/pages/ShadowAuditReview";
import CriticalPathCenter from "@/pages/CriticalPathCenter";
import EntityResolutionCenter from "@/pages/EntityResolutionCenter";
import CommitmentReviewCenter from "@/pages/CommitmentReviewCenter";
import WhyBlockedCenter from "@/pages/WhyBlockedCenter";
import MessageDraftCenter from "@/pages/MessageDraftCenter";
import SourceAliasReviewCenter from "@/pages/SourceAliasReviewCenter";
import AlertQualityCenter from "@/pages/AlertQualityCenter";
import DeterministicEvaluationCenter from "@/pages/DeterministicEvaluationCenter";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function WorkspaceRouter() { return <DashboardLayout><Switch><Route path="/" component={Dashboard} /><Route path="/deterministic-evaluation" component={DeterministicEvaluationCenter} /><Route path="/alert-quality" component={AlertQualityCenter} /><Route path="/source-alias-review" component={SourceAliasReviewCenter} /><Route path="/message-drafts" component={MessageDraftCenter} /><Route path="/why-blocked" component={WhyBlockedCenter} /><Route path="/commitment-review" component={CommitmentReviewCenter} /><Route path="/entity-resolution" component={EntityResolutionCenter} /><Route path="/critical-path" component={CriticalPathCenter} /><Route path="/shadow-audit" component={ShadowAuditReview} /><Route path="/comparison" component={ComparisonMatrix} /><Route path="/lc-preflight" component={LCPreflightCenter} /><Route path="/inbox" component={TradeInbox} /><Route path="/trades" component={Trades} /><Route path="/trades/new" component={NewTrade} /><Route path="/trades/:id/workspace" component={TradeWorkspace} /><Route path="/trades/:id" component={TradeDetail} /><Route path="/canonicalization" component={CanonicalizationCenter} /><Route path="/structured-review" component={StructuredSourceReview} /><Route path="/collaboration" component={CollaborationCenter} /><Route path="/policy-governance" component={PolicyGovernanceCenter} /><Route path="/alert-policies" component={AlertPolicyCenter} /><Route path="/product-risk" component={ProductRiskReporting} /><Route path="/preflight" component={PreflightGovernance} /><Route path="/preflight-governance" component={PreflightGovernance} /><Route path="/exception-resolution" component={ExceptionResolutionCenter} /><Route path="/obligations" component={ObligationManagement} /><Route path="/workbench" component={DocumentWorkbench} /><Route path="/document-workbench" component={DocumentWorkbench} /><Route path="/operations" component={OperationsHub} /><Route path="/integrations" component={IntegrationCenter} /><Route path="/monitoring" component={MonitoringCenter} /><Route path="/governance" component={GovernanceCenter} /><Route path="/assurance" component={AssuranceCenter} /><Route path="/search" component={CommandSearch} /><Route path="/actions" component={ActionCenter} /><Route path="/outcomes" component={ExecutiveOutcomes} /><Route path="/review" component={ReviewQueue} /><Route path="/ingestion" component={Ingestion} /><Route path="/vault" component={Vault} /><Route path="/exceptions" component={Exceptions} /><Route path="/analytics" component={Analytics} /><Route component={NotFound} /></Switch></DashboardLayout>; }
function Router() { return <Switch><Route path="/guest/:token" component={GuestPortal} /><Route component={WorkspaceRouter} /></Switch>; }

function App() { return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster theme="dark" richColors /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
export default App;
