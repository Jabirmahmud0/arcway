import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const source = readFileSync(fileURLToPath(new URL("../client/src/pages/GuestPortal.tsx", import.meta.url)), "utf8");
const globalStyles = readFileSync(fileURLToPath(new URL("../client/src/index.css", import.meta.url)), "utf8");
const dashboardShell = readFileSync(fileURLToPath(new URL("../client/src/components/DashboardLayout.tsx", import.meta.url)), "utf8");
const integrationCenter = readFileSync(fileURLToPath(new URL("../client/src/pages/IntegrationCenter.tsx", import.meta.url)), "utf8");
const policyGovernanceCenter = readFileSync(fileURLToPath(new URL("../client/src/pages/PolicyGovernanceCenter.tsx", import.meta.url)), "utf8");
const monitoringCenter = readFileSync(fileURLToPath(new URL("../client/src/pages/MonitoringCenter.tsx", import.meta.url)), "utf8");
const alertPolicyCenter = readFileSync(fileURLToPath(new URL("../client/src/pages/AlertPolicyCenter.tsx", import.meta.url)), "utf8");
const productRiskReporting = readFileSync(fileURLToPath(new URL("../client/src/pages/ProductRiskReporting.tsx", import.meta.url)), "utf8");
const structuredSourceReview = readFileSync(fileURLToPath(new URL("../client/src/pages/StructuredSourceReview.tsx", import.meta.url)), "utf8");
const governanceCenter = readFileSync(fileURLToPath(new URL("../client/src/pages/GovernanceCenter.tsx", import.meta.url)), "utf8");
const lcPreflightCenter = readFileSync(fileURLToPath(new URL("../client/src/pages/LCPreflightCenter.tsx", import.meta.url)), "utf8");
const obligationManagement = readFileSync(fileURLToPath(new URL("../client/src/pages/ObligationManagement.tsx", import.meta.url)), "utf8");
const shadowAuditReview = readFileSync(fileURLToPath(new URL("../client/src/pages/ShadowAuditReview.tsx", import.meta.url)), "utf8");
const tradeInbox = readFileSync(fileURLToPath(new URL("../client/src/pages/TradeInbox.tsx", import.meta.url)), "utf8");
const entityResolutionCenter = readFileSync(fileURLToPath(new URL("../client/src/pages/EntityResolutionCenter.tsx", import.meta.url)), "utf8");
const commitmentReviewCenter = readFileSync(fileURLToPath(new URL("../client/src/pages/CommitmentReviewCenter.tsx", import.meta.url)), "utf8");
const sourceAliasReviewCenter = readFileSync(fileURLToPath(new URL("../client/src/pages/SourceAliasReviewCenter.tsx", import.meta.url)), "utf8");
const alertQualityCenter = readFileSync(fileURLToPath(new URL("../client/src/pages/AlertQualityCenter.tsx", import.meta.url)), "utf8");
const deterministicEvaluationCenter = readFileSync(fileURLToPath(new URL("../client/src/pages/DeterministicEvaluationCenter.tsx", import.meta.url)), "utf8");
const exceptionResolutionCenter = readFileSync(fileURLToPath(new URL("../client/src/pages/ExceptionResolutionCenter.tsx", import.meta.url)), "utf8");

describe("secure guest portal accessibility contract", () => {
  it("retains explicit labels for each scoped action and accessible names for icon-only evidence controls", () => {
    expect(source).toContain('htmlFor="cargo-ready-date"');
    expect(source).toContain('htmlFor="packing-reference"');
    expect(source).toContain('htmlFor="partner-request"');
    expect(source).toContain('htmlFor="partner-response"');
    expect(source).toContain('aria-label="Evidence label"');
    expect(source).toContain('aria-label="Evidence reference"');
    expect(source).toContain('aria-label="Add evidence reference"');
    expect(source).toContain('aria-label={`Remove ${item.label} evidence reference`}');
  });

  it("retains a visible global focus indicator for keyboard-reachable controls", () => {
    expect(globalStyles).toContain("button:focus-visible");
    expect(globalStyles).toContain("outline: 2px solid #4da3ff");
  });

  it("retains dashboard skip navigation, a main-content target, and a labelled mobile navigation dialog", () => {
    expect(dashboardShell).toContain('href="#main-content"');
    expect(dashboardShell).toContain('id="main-content"');
    expect(dashboardShell).toContain('role="dialog"');
    expect(dashboardShell).toContain('aria-label="Workspace navigation"');
  });

  it("keeps the protected Governance route marked as Reviewer-only in workspace navigation", () => {
    expect(dashboardShell).toContain('{ label: "Governance", path: "/governance", icon: Settings2, reviewerOnly: true }');
  });

  it("keeps protected integration operations disabled for Trader clients while retaining scoped mapping creation", () => {
    expect(integrationCenter).toContain('enabled: isReviewer');
    expect(integrationCenter).toContain('Source configuration and operational records are Reviewer-only.');
    expect(integrationCenter).toContain('user?.role !== "trader"');
  });

  it("keeps protected policy registry data disabled for Trader clients with a clear role boundary", () => {
    expect(policyGovernanceCenter).toContain('enabled: isReviewer');
    expect(policyGovernanceCenter).toContain('Policy-pack registry data is available to Reviewers only.');
  });

  it("keeps protected Monitoring Center queries disabled for Trader clients with a clear role boundary", () => {
    expect(monitoringCenter).toContain('integrations.list.useQuery(undefined, { retry: false, enabled: isReviewer })');
    expect(monitoringCenter).toContain('operationalSchedule.useQuery(undefined, { retry: false, enabled: isReviewer })');
    expect(monitoringCenter).toContain('Operational monitoring is Reviewer-only');
  });

  it("keeps protected Alert Policy source-operation data disabled for Trader clients", () => {
    expect(alertPolicyCenter).toContain('integrations.list.useQuery(undefined, { retry: false, enabled: isReviewer })');
    expect(alertPolicyCenter).toContain('Operational alert policy records are available to Reviewers only.');
  });

  it("keeps protected Product Risk concentration data disabled for Trader clients", () => {
    expect(productRiskReporting).toContain('productConcentration.useQuery(undefined, { retry: false, enabled: isReviewer })');
    expect(productRiskReporting).toContain('Product-risk concentration data is available to Reviewers only.');
    expect(productRiskReporting).toContain('No calibrated prediction model is active.');
  });

  it("keeps protected Structured Source Review operations disabled for Trader clients", () => {
    expect(structuredSourceReview).toContain('integrations.list.useQuery(undefined, { retry: false, enabled: isReviewer })');
    expect(structuredSourceReview).toContain('Mapped source confirmation is reviewer-controlled.');
  });

  it("keeps the Reviewer-only governance overview disabled for Trader clients while retaining scoped guest actions", () => {
    expect(governanceCenter).toContain('governance.overview.useQuery(undefined, { retry: false, enabled: reviewer })');
    expect(governanceCenter).toContain('governance.createGuestLink.useMutation');
  });

  it("keeps the specialist LC preflight query disabled for Trader clients", () => {
    expect(lcPreflightCenter).toContain('const reviewer = user?.role === "reviewer"');
    expect(lcPreflightCenter).toContain('enabled: Boolean(reviewer && activeId)');
    expect(lcPreflightCenter).toContain('Reviewer access required');
  });

  it("keeps policy-derived obligation preview data disabled for Trader clients", () => {
    expect(obligationManagement).toContain('enabled: isReviewer && Boolean(activeTradeId)');
    expect(obligationManagement).toContain('Deterministic assistance only; this does not certify legal, regulatory, banking, or trade compliance.');
  });

  it("keeps workspace-wide historical Shadow Audit data disabled for Trader clients", () => {
    expect(shadowAuditReview).toContain('enabled: isReviewer');
    expect(shadowAuditReview).toContain('Historical Shadow Audit review is Reviewer-controlled');
  });

  it("keeps Trade Inbox filters programmatically selected and announces dynamic queue results", () => {
    expect(tradeInbox).toContain('aria-pressed={filter === status}');
    expect(tradeInbox).toContain('aria-live="polite"');
  });

  it("keeps entity-resolution proposals disabled for Trader clients with an explicit Reviewer boundary", () => {
    expect(entityResolutionCenter).toContain('enabled: reviewer');
    expect(entityResolutionCenter).toContain('Entity resolution is Reviewer-controlled');
  });

  it("keeps commitment extraction disabled for Trader clients with an explicit review boundary", () => {
    expect(commitmentReviewCenter).toContain('enabled: Boolean(reviewer && activeId)');
    expect(commitmentReviewCenter).toContain('Commitment review is Reviewer-controlled');
  });

  it("keeps retained-source alias review disabled for Trader clients and hidden behind Reviewer-only navigation", () => {
    expect(sourceAliasReviewCenter).toContain('enabled: reviewer');
    expect(sourceAliasReviewCenter).toContain('Source alias review is Reviewer-controlled');
    expect(dashboardShell).toContain('{ label: "Source Alias Review", path: "/source-alias-review", icon: FileSearch, reviewerOnly: true }');
  });

  it("keeps Alert Quality disabled for Trader clients and hidden behind Reviewer-only navigation", () => {
    expect(alertQualityCenter).toContain('alertQuality.useQuery(undefined, { enabled: reviewer, retry: false })');
    expect(alertQualityCenter).toContain('Alert-quality reporting is Reviewer-controlled');
    expect(alertQualityCenter).toContain('Inspect exception #{reference.exceptionId}');
    expect(alertQualityCenter).toContain('href={`/exceptions?tradeId=${reference.tradeId}&exceptionId=${reference.exceptionId}`}');
    expect(exceptionResolutionCenter).toContain('new URLSearchParams(window.location.search)');
    expect(exceptionResolutionCenter).toContain('validHandoffExceptionId');
    expect(dashboardShell).toContain('{ label: "Alert Quality", path: "/alert-quality", icon: BarChart3, reviewerOnly: true }');
  });

  it("keeps deterministic evaluation disabled for Trader clients and hidden behind Reviewer-only navigation", () => {
    expect(deterministicEvaluationCenter).toContain('deterministicEvaluation.useQuery(undefined, { enabled: reviewer, retry: false })');
    expect(deterministicEvaluationCenter).toContain('Deterministic evaluation is Reviewer-controlled');
    expect(deterministicEvaluationCenter).toContain('Versioned evaluation manifest');
    expect(deterministicEvaluationCenter).toContain('Stable fingerprint');
    expect(dashboardShell).toContain('{ label: "Evaluation", path: "/deterministic-evaluation", icon: FlaskConical, reviewerOnly: true }');
  });
});
