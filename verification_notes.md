# ARCWAY Visual Verification Notes

## 2026-08-22 operational automation milestone

The reviewer workspace renders the new Monitoring Center, Obligation Control, Document Workbench, Preflight Governance, and Canonicalization Center within the existing dark financial-grade application shell. The screenshots confirm readable hierarchy, visible action controls, status badges, evidence-link panels, source-recovery empty states, preflight rerun controls, and field-resolution controls at the desktop breakpoint. No overlapping or clipped primary controls were observed in the verified views.

## 2026-08-22 full-PRD expansion validation

The Executive Outcomes & Risk workspace renders outcome cards, management interpretation, concentration tabs, and financial concentration tables with clear hierarchy. Product Risk renders actual trade-line/product-master aggregation with value, share, trade count, and risk drivers. Governance renders retention, capability, membership, source, guest, and audit administration entry points. Collaboration, Structured Source Review, and Monitoring each provide purposeful empty states without fabricated operational records. No layout overlap, clipped text, or visible client rendering failure was observed in the captured desktop views.

## 2026-08-22 mobile validation

At the 375×812 viewport, the dashboard, outcomes, product-risk, monitoring, alert-policy, collaboration, and structured-review views retain readable headings, touch-sized controls, single-column cards, usable select/input controls, and horizontally constrained report tables without page-level overflow. The mobile sidebar trigger remains available. No clipped primary actions, overlapping panels, or illegible status content was observed.

## 2026-08-22 static review

A bounded scan of TypeScript application sources found no apparent hardcoded API keys, passwords, or secret literals. The current regression suite, static type check, and production build all complete successfully. The browser and development logs inspected after service restart did not show a current application error.

## 2026-08-22 post-scheduler checkpoint verification

The desktop overview renders the ARCWAY assurance navigation, active-trade and value-at-risk metrics, assurance status, visual trust gauge, and immutable activity ledger without layout overlap or client render failures. The unauthenticated preview log records the expected missing-session message only; the development data view remains available for visual verification.

## 2026-08-22 operational schedule control verification

The Monitoring Center renders the production operational-sweep panel with explicit no-schedule state, six-field UTC cron input, reviewer activation action, and clear explanatory copy. The source health, replay queue, run-attempt history, and workflow-alert surfaces remain visible beside it without overlap or clipping.

## 2026-08-22 mobile workflow validation

At the 375×812 viewport, Action Center preserves contextual task inputs and document-draft controls; Collaboration presents clear empty-state metrics; Governance tabs and data controls stack without overflow; and Monitoring retains its run, recovery, schedule, and alert controls. The deliberately invalid guest-link route returns a restrained secure-link-unavailable state rather than exposing trade data.

## 2026-08-22 operational schedule validation

The Monitoring Center visibly presents the hourly UTC expression `0 0 * * * *`; the server now accepts this valid six-field form and validates malformed expressions before schedule registration. Caller-based regression coverage confirms that Trader accounts are rejected before either structured-source canonical confirmation or operational schedule configuration can read, mutate, or invoke protected resources. No production Heartbeat has been created, consistent with the user's explicit deferral.

## 2026-08-22 assurance interface route validation

The Document Workbench, Structured Source Review, Alert Policies, Canonicalization, Collaboration, Governance, Monitoring, and Preflight Governance surfaces render at their direct URLs with no primary layout overlap. Direct `document-workbench` and `preflight-governance` aliases were added after route review found that those descriptive URLs fell through to the not-found view; both now resolve to their intended assurance interfaces. The empty states shown for unconfigured sources and partner requests are operationally honest and do not introduce fabricated records.

## 2026-08-22 mobile assurance-control review

At 375×812, Document Workbench keeps the exact document states, evidence provenance, correction control, and version-diff panels readable in a single-column flow. Preflight, Alert Policies, Governance, and Monitoring preserve touch-sized controls, wrapped governance tabs, reviewer policy inputs, source recovery context, and the intentionally inactive production-schedule panel without page-level overflow or clipped primary actions.

## 2026-08-22 role-boundary and reporting review

The Reviewer workspace correctly denies the Trader-only trade-creation interface and provides a clear route to the review queue. Review Queue, Evidence Vault, Executive Outcomes, and Product Risk render real Trade Twin context, exact evidence status badges, visible trust gauge, retained-data wording, concentration calculations, and explanatory reporting language without fabricated testimonials or user-generated claims.

## 2026-08-22 mobile role-boundary and reporting review

At 375×812, the Trader-only creation restriction, reviewer decision queue, evidence vault, and executive outcome report retain readable hierarchy and constrained single-column layouts. The role-denial state is explicit and action-oriented; reviewer trade context remains visible; and report metrics, concentration tabs, and explanatory narrative remain accessible without page-level overflow.

## 2026-08-22 mobile decision and vault accessibility refinement

The Reviewer Queue now converts its narrow-screen table into a decision card that exposes value, shipment, evidence, readiness, trust gauge, and the Review Trade Twin action without horizontal scrolling. Evidence Vault likewise presents each document as a mobile card with its exact state, Trade Twin provenance, immutable-history status, and stored-file availability. Desktop tables remain available at the medium breakpoint and above.

## 2026-08-22 post-restart validation

After server restart, the reviewer dashboard rehydrated to the active Trade Twin, risk, assurance, trust-gauge, and activity-ledger view without runtime errors. A local browser-runner experiment correctly reached the real ARCWAY sign-in boundary; it was removed rather than introducing an authentication bypass solely for tests. Existing protected-procedure contracts, authenticated preview reviews, and regression checks remain the retained non-deployment validation evidence.

## 2026-08-22 isolated browser-runner follow-up

Three bounded attempts to run public-only Playwright coverage in the sandbox were not retained: the system Chromium process closed immediately, sandbox-safe launch flags did not correct that behavior, and the supported runner required a browser engine not present for the mobile device profile. The temporary dependency, test files, configuration, and artifacts were removed without altering ARCWAY’s OAuth boundary or validation baseline. The corresponding comprehensive browser item remains open for a future authorized authenticated session; no insecure test-login mechanism was introduced.

## 2026-08-22 guest-link security hardening

The public partner-request response procedure now validates that a guest link exists, is active, is unexpired, and includes the `partner_request.respond` scope before it reads the named partner request. A focused caller-level contract confirms an expired link returns `FORBIDDEN` and performs no request lookup, response persistence, handoff recording, or audit write. The complete offline regression is green with 54 tests across 20 files, and both TypeScript checking and the production build pass; the build continues to emit only the pre-existing client chunk-size advisory.

## 2026-08-22 core Trade Twin authorization coverage

A caller-level contract now proves that a Trader is rejected before a reviewer-only preflight rerun, final trade approval or rejection, or material-exception resolution can access the requested Trade Twin. The complete offline regression is green with 55 tests across 21 files, and TypeScript checking and the production build pass. The build emits the existing client chunk-size advisory only.

## 2026-08-22 expanded public guest-link denial coverage

The guest response boundary is now covered for expired, revoked, and incorrectly scoped links. Each denial case is asserted to return `FORBIDDEN` before a named partner request can be read or any response, handoff, or audit persistence can occur. The complete offline regression is green with 57 tests across 21 files, with TypeScript checking and the production build passing; only the existing client chunk-size advisory remains.

## 2026-08-22 action-only guest-link data minimization

Public guest-link resolution now requires the explicit `trade.read` scope before loading or returning Trade Twin records, document metadata, or obligations. Valid action-only links return only their grant metadata and scoped request context, and the portal presents an action-only state rather than rendering trade data. A procedure-level contract proves an action-only packing-list link does not query the Trade Twin or partner-request records. The full offline suite is green with 58 tests across 21 files, alongside successful TypeScript and production-build validation; the build reports only the existing client chunk-size advisory.

## 2026-08-22 guest-link issuer ownership control

Guest-link creation now requires both Trader role and ownership of the specified Trade Twin. A same-organization Trader cannot delegate a different owner’s trade to an external partner; the caller-level contract confirms the request returns `FORBIDDEN` before either the guest grant or its audit record is persisted. The complete offline regression is green with 59 tests across 22 files, and TypeScript checking and production build pass; the only build output remains the existing client chunk-size advisory.

## 2026-08-22 guest-link revocation ownership control

Guest-link revocation now performs an owner-scoped lookup before updating the link or recording its audit event. A same-organization Trader cannot revoke another owner’s partner link; the caller-level contract confirms the procedure returns `NOT_FOUND` before revocation or audit persistence. The complete offline regression is green with 60 tests across 22 files, and TypeScript checking and production build pass; the only build output remains the existing client chunk-size advisory.

## 2026-08-22 document role-boundary validation

Caller-level coverage now confirms a Trader is denied before reviewer-only document verification can access a document record, while a Reviewer is denied before Trader-only evidence upload can access the same record. The complete offline regression is green with 61 tests across 22 files, and TypeScript checking and production build pass; the only build output remains the existing client chunk-size advisory.

## 2026-08-22 Trader-only operational role-boundary validation

Caller-level coverage now confirms a Reviewer is denied before Trader-only obligation fulfillment or source-email ingestion can access its requested obligation or Trade Twin. The complete offline regression is green with 62 tests across 22 files, and TypeScript checking and production build pass; the only build output remains the existing client chunk-size advisory.

## 2026-08-22 secure guest-portal accessibility refinement

The guest portal now uses semantic headings and explicit labels for cargo-ready dates, packing-list references, partner-request selection, response summaries, and evidence fields. Icon-only evidence removal and evidence-add controls now have accessible names. At 375×812, the deliberately invalid link retains a centered, readable secure-link-unavailable state without overflow or clipped text. The full 62-test regression suite, TypeScript check, and production build pass; the build continues to emit only the existing client chunk-size advisory.

## 2026-08-22 secure guest accessibility regression guard

A static Vitest contract now preserves explicit labels for every scoped guest action and accessible names for the evidence-add and evidence-removal icon controls. The guard runs within the configured server test scope, alongside the full suite. Regression, TypeScript checking, and production build are green with 63 tests across 23 files; the build reports only the existing client chunk-size advisory.

## 2026-08-22 bounded injection-pattern scan

A static scan of TypeScript and TSX application sources found no occurrences of `dangerouslySetInnerHTML`, direct `innerHTML` assignment, `eval`, or `new Function`. This is limited evidence only and does not replace the still-open comprehensive security and authenticated browser validation work.

## 2026-08-22 collaboration owner-scope hardening

Trader-side collaboration operations now enforce Trade Twin ownership inside a shared organization, while Reviewers retain organization-wide access. Partner-request listings now pass role and identity into a role-aware query: Trader results are constrained to Trade Twins they own, and Reviewer results remain workspace-wide. Caller-level contracts cover cross-owner update denial and both list-visibility contexts. The full offline regression is green with 66 tests across 24 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory.

## 2026-08-22 shipment search owner-scope hardening

Shipment search now passes role and identity into an owner-aware query. Trader results are limited to allocations for Trade Twins they own, while Reviewer results remain organization-wide. Caller-level contracts cover both query contexts. The full offline regression is green with 68 tests across 25 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory.

## 2026-08-22 integration list and mapping access hardening

The sensitive integration-operations list, which includes source receipts, alerts, provider records, and saved mappings, is now Reviewer-only. Trader structured-file ingestion uses an owner-scoped mapping lookup and cannot read or apply a mapping created by another user. Caller-level contracts cover Trader denial of the integration list and mapping-unavailable denial before source receipt persistence. The full offline regression is green with 70 tests across 26 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory.

## 2026-08-22 executive product concentration authorization

Organization-wide product concentration is now a Reviewer-only reporting endpoint. The caller-level Trade Twin authorization contract confirms a Trader is denied before any cross-trade concentration aggregation is read. The full offline regression remains green with 70 tests across 26 files, alongside successful TypeScript checking and production build; the build emits only the existing client chunk-size advisory.

## 2026-08-22 global keyboard-focus safeguard

Global `:focus-visible` styling now gives anchors, buttons, inputs, textareas, selects, and button-role controls a high-contrast blue outline with offset, including plain icon controls outside component primitives. The accessibility regression guard now verifies this rule alongside secure guest-control labels. The full offline regression is green with 71 tests across 26 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory.

## 2026-08-22 governance overview authorization

The governance overview, which aggregates organization controls, audit records, guest grants, memberships, capability grants, and source configurations, is now Reviewer-only. A caller-level authorization contract confirms a Trader is denied before the overview data is queried. The full offline regression is green with 72 tests across 26 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory.

## 2026-08-22 dashboard-shell keyboard navigation review

The authenticated dashboard shell now provides a focus-revealed “Skip to main content” link targeting a focusable `main` landmark. Desktop review confirmed the sidebar, summary metrics, portfolio, and activity ledger remain aligned after the structural refactor. At 375×812, the compact header, mobile navigation trigger, review CTA, and stacked metric cards remain readable without horizontal overflow or clipped controls. This review does not substitute for the still-open authenticated browser E2E program.

## 2026-08-22 dashboard skip-navigation regression guard

The static accessibility contract now protects the authenticated dashboard’s skip link, `main-content` landmark target, and labelled mobile navigation dialog alongside secure guest labels and global focus styling. The full offline regression is green with 73 tests across 26 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory.

## 2026-08-22 Integration Center role-aware review

The reviewer Integration Center renders the protected provider catalog, run context, source health state, and mapping area without a protected-query error after client-side role alignment. At 375×812, the title, explanatory copy, adapter cards, capability chips, and connection controls remain readable and vertically scroll without horizontal clipping. The Trader-only explanatory state is implemented but remains part of the broader authenticated browser E2E work that is intentionally open.

## 2026-08-22 Governance navigation role alignment

The Governance route is now marked Reviewer-only in the authenticated workspace navigation, matching its protected organization-wide overview endpoint. The static dashboard regression guard asserts this navigation policy alongside skip-link and mobile-dialog semantics. The full offline regression is green with 74 tests across 26 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory.

## 2026-08-22 Integration Center Trader-safe query regression guard

The static role-aware client contract now verifies that protected integration operations are enabled only for Reviewers, that Trader-facing explanation text remains present, and that Trader mapping creation is retained. The full offline regression is green with 75 tests across 26 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory.

## 2026-08-22 privileged governance authorization coverage

Caller-level governance coverage now rejects Traders before audit export, source configuration updates, and every membership administration operation: add, role update, removal, capability grant, and capability revocation. The full offline regression is green with 76 tests across 26 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory.

## 2026-08-22 source recovery authorization coverage

Caller-level recovery coverage now rejects Traders before they can run a provider normalization sample or replay a failed source receipt. The full offline regression is green with 77 tests across 26 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory.

## 2026-08-22 bounded static injection-pattern scan refresh

The application TypeScript/TSX source was rescanned for `dangerouslySetInnerHTML`, direct `innerHTML` assignment, `eval`, and `new Function`. No matches were found. This is bounded static evidence only and does not close the broader PRD-wide security and authenticated end-to-end validation items.

## 2026-08-22 Reviewer source-replay recovery contract

A focused Reviewer caller contract now proves replay first updates the failed source receipt, then records a completed `source_replay` integration run with the retained receipt identity and source type, and appends a `source.replayed` Trade Twin activity event. The complete offline regression is green with 78 tests across 27 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory. This extends bounded recovery evidence without claiming the still-open PRD-wide operational and authenticated browser scenario validation.

## 2026-08-22 integration failure and workflow-alert persistence contracts

Focused Reviewer caller contracts now prove that a provider failure records an `operator_failure_record` run with the selected integration identity, provider type, and operator rationale; they also prove that acknowledgment updates only a known workflow alert with the Reviewer actor identity. The complete offline regression is green with 80 tests across 28 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory. These bounded persistence contracts do not close the broader PRD-wide recovery and authenticated browser scenario validation.

## 2026-08-22 Reviewer policy-pack governance contract

A focused Reviewer caller contract now proves policy-pack authoring persists the current workspace and Reviewer ownership, then records immutable `policy_pack.created` audit context with the resulting policy identifier and full submitted policy state. The complete offline regression is green with 81 tests across 29 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory. This remains bounded governance evidence and does not close the broader PRD-wide authorization and authenticated browser scenario validation.

## 2026-08-22 policy-pack authoring authorization coverage

A caller-level contract now rejects a Trader before reviewer-only policy-pack authoring can create governance state or write audit records. The complete offline regression is green with 82 tests across 29 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory. This extends bounded role-isolation evidence without closing the broader PRD-wide authorization and authenticated browser scenario validation.

## 2026-08-22 policy-governance registry access alignment

The policy-registry endpoint now explicitly requires the Reviewer role. The Policy Governance client disables that protected query for Trader users and renders a clear role-boundary state rather than attempting to load organization policy packs or immutable versions. Caller-level and static client-role contracts preserve both boundaries. The complete offline regression is green with 84 tests across 29 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory. This is bounded role-isolation and accessibility evidence, not a substitute for the still-open authenticated browser E2E program.

## 2026-08-22 Reviewer manual operational-sweep persistence contract

A focused Reviewer caller contract now proves the manual operational-sweep action returns its completed obligation-escalation and source-health results and retains both in the immutable `monitoring.operational_sweep` audit record with the triggering Reviewer identity. No production schedule was created or activated. The complete offline regression is green with 85 tests across 30 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory. This is bounded recovery evidence and does not close the broader PRD-wide operational or authenticated browser scenario validation.

## 2026-08-22 Monitoring Center role-aware query alignment

The Monitoring Center now disables both the Reviewer-only integration-operations and operational-schedule queries for Trader clients, then renders a clear role-boundary state instead of attempting restricted reads. A caller-level contract also rejects Trader access to operational-schedule metadata, while the static client-role guard protects both disabled queries and the explanatory state. The complete offline regression is green with 87 tests across 30 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory. This is bounded authorization/accessibility evidence and does not replace authenticated browser E2E validation.

## 2026-08-22 Alert Policy and Product Risk role-aware query alignment

The Alert Policy and Product Risk pages now disable their Reviewer-only source-operations and organization-wide concentration queries for Trader clients, with clear role-boundary states. Static client-role coverage protects both query gates. The complete offline regression is green with 89 tests across 30 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory. The distinct Trader-safe selector for reusable source mappings remains an open, scoped follow-up.

## 2026-08-22 Trader-safe reusable mapping selector

File ingestion now uses a dedicated reusable-mapping endpoint instead of the Reviewer-only source-operations registry. The persistence layer owner-scopes mappings for Traders and retains organization-wide Reviewer visibility; a caller contract verifies the current Trader identity and workspace scope are passed to that selector. The complete offline regression is green with 90 tests across 30 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory.

## 2026-08-22 Structured Source Review role-aware query alignment

Structured Source Review now disables its Reviewer-only source-operations query for Trader clients before receipt data can be requested. The existing explicit restricted-review state remains visible, and the static client-role guard protects both the disabled query and role-boundary copy. The complete offline regression is green with 91 tests across 30 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory.

## 2026-08-22 governance overview role-aware query alignment

Governance Center now disables the Reviewer-only governance overview query for Trader clients while preserving their separately authorized scoped guest-link creation and revocation mutations. The static client-role guard confirms both the disabled query and retained scoped action route. The complete offline regression is green with 92 tests across 30 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory.

## 2026-08-22 bounded client transport scan

The client TypeScript/TSX source was scanned for direct `fetch`, Axios, and `XMLHttpRequest` calls. No matches were found, supporting the intended typed client-layer boundary. This is bounded static evidence only and does not close the comprehensive security or authenticated browser E2E validation items.

## 2026-08-22 bounded browser credential-storage scan

The client TypeScript/TSX source was scanned for `localStorage` or `sessionStorage` access using token, secret, API-key, or password identifiers. No matches were found. This is bounded static evidence only and does not close the comprehensive security or authenticated browser E2E validation items.

## 2026-08-22 bounded browser hard-coded-secret scan

The client TypeScript/TSX source was scanned for hard-coded API-key, secret, and bearer-value assignments. No matches were found. This is bounded static evidence only and does not close the comprehensive security or authenticated browser E2E validation items.

## 2026-08-22 bounded positive-tab-index scan

The client TypeScript/TSX source was scanned for positive `tabIndex` values. No matches were found, helping preserve natural keyboard focus order. This is bounded static evidence only and does not close the comprehensive accessibility or authenticated browser E2E validation items.

## 2026-08-22 bounded new-tab link scan

The client source contains one Evidence Vault surface that opens stored evidence in a new tab; each matching link includes `rel="noreferrer"`. This is bounded static evidence only and does not close the comprehensive security or authenticated browser E2E validation items.

## 2026-08-24 renewed PRD audit: Trade Inbox and change-impact analysis

The renewed audit against the original PRD identified two immediate initial-product gaps: a first-class source-receipt Trade Inbox and explainable downstream change-impact analysis before canonical resolution. ARCWAY now provides both. The Trade Inbox uses immutable source receipts with role-aware visibility, retained hashes/statuses, candidate Trade Twin context, deterministic confidence, and reviewer recovery/confirmation routes. The canonicalization workflow now shows deterministic document, obligation, shipment, settlement, and release-gate consequences before a Reviewer retains the decision. Full validation is green with 97 tests across 32 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory. The renewed audit correctly retains LC specialist preflight and an expanded source-driven comparison matrix as substantive remaining work.

## 2026-08-24 LC specialist preflight and source-driven comparison matrix

ARCWAY now provides a Reviewer-only documentary presentation assessment that deterministically evaluates retained LC terms, presentation timing, required evidence, and cross-document conflicts. It explicitly states that it is not a bank, legal, or regulatory certification. A new cross-document matrix derives its field rows and evidence columns from actual retained source provenance, keeps disagreements visible, and routes reviewer resolution to canonicalization. The complete offline regression is green with 102 tests across 35 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory.

## 2026-08-24 version-aware masters and relationship-policy obligation preview

ARCWAY now retains counterparty and product successors as immutable version lineage with effective periods. Reviewers can bind an active policy pack to a reusable obligation template, optionally scope it to a Buyer/Supplier relationship or product master, preview deterministic condition matching against retained Trade Twin facts, and explicitly retain an idempotent policy-derived obligation with its policy-version provenance. The capability is explicitly framed as deterministic assistance rather than legal, regulatory, banking, or trade-compliance certification. Focused policy-matching, Trader-denial, and client-role tests pass; desktop and mobile views were reviewed. Full validation is green with 106 tests across 36 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory.

## 2026-08-24 unlinked source intake and explicit human routing

ARCWAY now accepts immutable source receipts without a preselected Trade Twin. It derives a bounded, explainable candidate list from retained reference, party, commodity, and shipment-date signals, but never auto-routes or adopts a canonical value. A human supplies rationale and selects a candidate to route the receipt; the system retains route context, records an audit event, creates the Trade Twin provenance event only after that choice, and keeps Trader routing limited to receipts and Trade Twins they own. Candidate-matching, unlinked-intake retention, and cross-owner denial contracts pass. Trade Inbox desktop and mobile views were reviewed. Full validation is green with 110 tests across 39 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory.

## 2026-08-24 bounded historical Shadow Audit review

ARCWAY now exposes a Reviewer-only, read-only Shadow Audit workspace over a selected historical period of up to 90 days. It aggregates only retained Trade Twins, source receipts, evidence fields, exceptions, obligations, and explicitly marked Shadow Audit events; the ledger does not fabricate results for empty periods and never changes a customer workflow. Metrics distinguish discovered Trade Twins, evidence-led reconstruction, clarification demand, open critical exceptions/obligations, unlinked receipts, and a transparent internal reconciliation estimate. The UI explicitly states that this is not legal, regulatory, banking, or trade-compliance certification. Historical aggregation, Reviewer boundary, date-window validation, and Trader client-role contracts pass; desktop and mobile views were reviewed. Full validation is green with 114 tests across 41 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory.

## 2026-08-24 unlinked-receipt routing integrity hardening

The pending-to-routed receipt update is now a compare-and-set transition. ARCWAY records external provenance, Trade Twin activity, and the audit event only when exactly one pending receipt was routed; a competing or already-completed transition returns a recoverable conflict without duplicate downstream side effects. The focused contract proves both cross-owner denial and no provenance, activity, or audit writes after a lost compare-and-set. Full validation is green with 115 tests across 41 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory.

## 2026-08-24 linked source-receipt context minimization

Trader Trade Inbox responses now retain deterministic candidate context only while a receipt remains unlinked and routable by that Trader. Once a receipt is linked to a Trade Twin, the response removes reviewer-generated candidate context so a routed receipt cannot disclose other workspace trade candidates through its retained routing record. The focused role-redaction contract covers both pending and linked cases. Full validation is green with 117 tests across 42 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory.

## 2026-08-24 routed Trade Twin activity minimization

After a successful source route, the Trade Twin activity record now retains the selected receipt, selected Trade Twin, actor, timestamp, and human rationale only. It no longer embeds the retained routing context or any candidate list. The focused success-path contract proves that an alternate candidate cannot reach the Trade Twin activity payload. Full validation is green with 118 tests across 42 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory.

## 2026-08-24 Trade Inbox dynamic-control accessibility refinement

The Trade Inbox now exposes each status filter’s selected state programmatically and politely announces the retained receipt count for the active queue. A static semantic regression guard covers both properties. This is bounded accessibility evidence only; it does not close the intentionally open comprehensive accessibility, security, operational-recovery, or authenticated browser end-to-end validation scope. Full validation is green with 119 tests across 42 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory.

## 2026-08-24 retained-data operational Critical Path

ARCWAY now provides an explicit Critical Path workspace that orders only retained open obligation deadlines, stored shipment cut-offs, and the Trade Twin’s planned shipment date. It excludes fulfilled obligations, exposes overdue and next-72-hour risk status, and does not infer missing carrier milestones. The route is Trade Twin-scoped, so Trader ownership is checked before the workspace is read. Critical-path ordering and cross-owner-denial contracts pass; desktop and mobile views were reviewed. Full validation is green with 121 tests across 44 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory.

## 2026-08-24 dependency-aware Critical Path

The Critical Path now includes an unresolved prerequisite when it blocks a retained release dependency, even if that prerequisite has no independent deadline. In that case the path makes the absence explicit and uses the planned shipment date only to sequence the item for visibility; it never claims that date is the obligation’s deadline. The dependency contract covers release-blocker inclusion, fulfilled-work exclusion, and the required missing-deadline language. Full validation is green with 122 tests across 44 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory.

## 2026-08-24 deterministic counterparty entity resolution

ARCWAY now evaluates active, same-country retained counterparties for bounded high-confidence alias signals, including retained tax identifiers, normalized legal/trading-name equivalence, and constrained name containment. It never merges records. A Reviewer may instead confirm one name as a versioned trading alias with a rationale; the action creates a counterparty successor and audit record while preserving both masters. Weak, cross-country, and inactive master versions are excluded from proposals. Matcher, Reviewer-denial, client-role, and alias-successor/audit contracts pass; desktop and mobile views were reviewed. Full validation is green with 126 tests across 46 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory.

## 2026-08-24 human-reviewed commitment extraction

ARCWAY now derives review-required operational candidates from retained source text using bounded deterministic patterns for delivery, shipment, and cargo-ready language, quantity/unit, and explicit or relative date expressions. A Reviewer-only workspace exposes the source evidence and confidence without changing an obligation, canonical field, evidence record, event, or audit record. Relative dates remain expressions rather than fabricated calendar dates. Extraction, no-write preview, Reviewer-denial, and client-role contracts pass; desktop and mobile views were reviewed. Full validation is green with 130 tests across 48 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory.

## 2026-08-24 evidence-led Why Blocked assurance explanation

ARCWAY now provides a Trade Twin-scoped Why Blocked workspace that derives explainable retained reasons from rejected documents, open critical exceptions and obligations, conflicting evidence fields, and the latest blocked/at-risk/insufficient-data preflight. Each reason routes to the existing evidence or resolution workflow. The workspace infers no new facts, never recalculates a release decision, and explicitly preserves the non-certification boundary. Explanation and cross-owner Trader-denial contracts pass; desktop and mobile views were reviewed. Full validation is green with 133 tests across 49 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory.

## 2026-08-24 copy-only operational message drafting

ARCWAY now provides a Trade Twin-scoped Message Drafts workspace that deterministically prepares supplier, document-owner, buyer, forwarder, and bank-contact messages from retained parties, expected shipment date, a selected purpose, and human-supplied operational focus. It does not select a recipient address, create a communication record, send externally, or change canonical facts. Each draft is marked copy-only and explicitly requires human review/editing before use through an approved channel. A no-send model contract and a Trader cross-owner denial contract pass; desktop and 375px mobile views were reviewed. Full validation is green with 135 tests across 50 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory. This remains focused implementation and validation evidence only; comprehensive accessibility, security, operational-recovery, and authenticated browser E2E scope remain open.

## 2026-08-24 reviewer-approved commitment obligations

The Commitment Review workspace now lets a Reviewer explicitly retain a deterministic source-text commitment candidate as one operational obligation. The operation is restricted to a linked source receipt, carries forward the immutable receipt ID, candidate index/snapshot, candidate evidence, date-treatment choice, and Reviewer rationale into Trade Twin activity and audit records, and uses an idempotency key tied to the retained receipt/candidate pair. It never changes a canonical field, evidence field, or source receipt. A source exact date may become the obligation deadline; relative language remains an expression and requires a Reviewer-supplied deadline rather than automated interpretation. Exact provenance/no-canonical-side-effect, relative-date rejection, duplicate retention, and Trader-denial contracts pass. Commitment Review’s desktop and 375px mobile empty states were visually reviewed; no retained source receipt was available in that preview session to exercise the approval controls interactively. Full validation is green with 139 tests across 50 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory. Comprehensive accessibility, security, operational-recovery, and authenticated browser E2E scope remain intentionally open.

## 2026-08-24 enriched unlinked-source Trade Twin matching

Unlinked intake now adds retained booking/container references as deterministic candidate signals and treats a retained trade total/currency as supporting context only when an identity signal already exists. A monetary amount alone cannot create a candidate. The score version moved to `deterministic-v2`; signal fields and matched values remain visible in the Trade Inbox before human routing. The route remains explicit, compare-and-set protected, and separate from canonicalization. Shipment-reference-plus-amount, amount-only no-candidate, and unlinked-intake score-version contracts pass. Trade Inbox desktop and 375px mobile empty states were visually reviewed; no receipt was available in that preview session to render a candidate card. Full validation is green with 141 tests across 50 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory. Comprehensive accessibility, security, operational-recovery, and authenticated browser E2E scope remain intentionally open.

## 2026-08-24 read-only retained-source party alias review

ARCWAY now provides a Reviewer-only Source Alias Review workspace that compares bounded party-name fields retained in a selected source receipt with active counterparty masters. Exact normalized names, multi-token containment, and strong normalized overlap can produce a review-required no-merge suggestion; weak, generic single-token, email-like, and inactive master signals are excluded. The preview is read-only: it does not merge masters, create an alias successor, mutate source evidence, update a canonical Trade Twin field, or record a workflow event/audit action. A Reviewer-only/no-write caller contract and positive/negative matcher contracts pass. Desktop and 375px mobile empty states were visually reviewed; no source receipt was available in that preview session to render a proposal card. Full validation is green with 145 tests across 52 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory. Comprehensive accessibility, security, operational-recovery, and authenticated browser E2E scope remain intentionally open.

## 2026-08-24 Reviewer-selected commitment criticality

Commitment Review now makes criticality an explicit Reviewer decision before a retained source candidate becomes an obligation. The selector offers critical, warning (the default), and information, while preserving the existing source receipt/candidate snapshot, rationale, date-treatment, duplicate protection, and no-canonical-mutation boundaries. The existing approval caller contract validates retention of a critical choice. Desktop and 375px mobile empty states were visually reviewed; no retained receipt was available in that preview session to show the interactive selector. Full validation remains green with 145 tests across 52 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory. Comprehensive accessibility, security, operational-recovery, and authenticated browser E2E scope remain intentionally open.

## 2026-08-24 commitment criticality provenance correction

The commitment-approval immutable provenance payload now explicitly retains the Reviewer-selected criticality in both the Trade Twin activity and audit record, alongside source receipt ID, candidate snapshot, rationale, date treatment, and no-canonical-mutation boundary. A focused caller contract asserts the critical value in both retained contexts. Full validation remains green with 145 tests across 52 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory. This is a focused integrity correction and does not close the broader comprehensive accessibility, security, operational-recovery, or authenticated browser E2E scope.

## 2026-08-24 explicit receipt-derived alias confirmation

Source Alias Review now lets a Reviewer explicitly confirm a currently bounded source-party proposal after providing a rationale. The mutation re-derives the proposal from the selected immutable receipt, verifies that it matches the selected active counterparty master, then creates only a versioned counterparty successor. Its immutable audit record retains the receipt ID, file name, payload hash, alias, rationale, successor ID, and explicit no-master-merge marker. It never changes source evidence or Trade Twin canonical facts. The receipt-derived successor/audit-provenance contract passes. Desktop and 375px mobile empty states were visually reviewed; no source receipt was available in the preview session to exercise a live proposal confirmation. Full validation is green with 146 tests across 52 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory. Comprehensive accessibility, security, operational-recovery, and authenticated browser E2E scope remain intentionally open.

## 2026-08-24 cross-workspace source alias confirmation denial

The receipt-derived alias confirmation contract now explicitly proves that a source receipt belonging to another workspace is rejected before a counterparty successor or audit record can be created. This is targeted tenant-isolation evidence for the new workflow only; it is not represented as comprehensive application security validation. Full validation is green with 147 tests across 52 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory. Comprehensive accessibility, security, operational-recovery, and authenticated browser E2E scope remain intentionally open.

## 2026-08-24 insufficient-evidence assurance explanation

Why Blocked now distinguishes a clean retained context from an absent retained assurance context. When no documents, exceptions, obligations, evidence fields, or preflight runs exist for a Trade Twin, it returns `insufficient_evidence` and says that ARCWAY does not have enough retained assurance evidence to explain whether the Trade Twin is blocked. The state is amber and explicitly non-release; it does not invent missing facts. Blocked, attention, and clean-retained-context outcomes retain their prior deterministic semantics. The empty-context contract passes, and desktop/mobile Why Blocked views were reviewed. Full validation is green with 148 tests across 52 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory. Comprehensive accessibility, security, operational-recovery, and authenticated browser E2E scope remain intentionally open.

## 2026-08-24 deterministic commitment-extraction provenance

Each commitment candidate extracted from retained source text now carries `deterministic_pattern` as its method and `commitment-extractor-v1` as its engine version. The commitment preview also states that its source is the immutable receipt and that human review is required. This metadata does not describe an AI model and does not create new trade facts; confidence and evidence remain tied to the bounded deterministic text pattern. Extractor and preview contracts assert the metadata. Full validation remains green with 148 tests across 52 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory. Comprehensive accessibility, security, operational-recovery, and authenticated browser E2E scope remain intentionally open.

## 2026-08-24 Source Alias Review client-role regression

The client-role regression suite now verifies that Source Alias Review disables its data preview for Trader clients, exposes an explicit Reviewer-controlled boundary, and is marked Reviewer-only in workspace navigation. This is a focused static/client behavior contract and is not represented as comprehensive accessibility, authorization, or authenticated browser E2E evidence. Full validation is green with 149 tests across 52 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory. Comprehensive accessibility, security, operational-recovery, and authenticated browser E2E scope remain intentionally open.

## 2026-08-24 observed product-risk reporting boundary

Product Risk Reporting now explicitly distinguishes observed retained exposure and current Trade Twin signals from predictive risk. It states that no calibrated prediction model is active and that it does not forecast production delay, booking risk, document rework, or payment delay. The existing Reviewer-only query/client role contract asserts this boundary. Desktop and 375px mobile views were reviewed. Full validation remains green with 149 tests across 52 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory. Comprehensive accessibility, security, operational-recovery, and authenticated browser E2E scope remain intentionally open.

## 2026-08-24 commitment preview Trader-denial contract

The Reviewer-only commitment preview now has a focused authorization contract proving a Trader receives `FORBIDDEN` before ARCWAY reads a retained source receipt. This is targeted procedure-level tenant/role boundary evidence, not a substitute for comprehensive security or authenticated browser E2E validation. Full validation is green with 150 tests across 52 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory. Comprehensive accessibility, security, operational-recovery, and authenticated browser E2E scope remain intentionally open.

## 2026-08-24 retained alert-quality monitoring

ARCWAY now provides a Reviewer-only Alert Quality workspace that summarizes actual retained exception outcomes. It reports exception precision, critical alert precision, dismissal rate, repeated false-alert count/rate, and outcome coverage. Duplicate and not-actionable resolutions are the only retained outcomes counted as dismissed; all other retained resolved outcomes are classified as actionable for this transparent metric only. If the workspace has no resolved outcomes, quality rates are null and the UI explicitly says it will not fabricate them. Metrics do not infer false-positive causes, assess staff performance, or predict future alert quality. Deterministic aggregation/no-data and Reviewer-denial-before-read contracts pass. Desktop and 375px mobile views were reviewed. Full validation is green with 154 tests across 54 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory. Comprehensive accessibility, security, operational-recovery, and authenticated browser E2E scope remain intentionally open.

## 2026-08-24 Alert Quality client-role regression

The client-role regression suite now verifies that Alert Quality disables its retained outcome query for Trader clients, exposes an explicit Reviewer-controlled boundary, and is marked Reviewer-only in workspace navigation. This is focused static/client behavior evidence rather than comprehensive accessibility, authorization, or authenticated browser E2E evidence. Full validation is green with 155 tests across 54 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory. Comprehensive accessibility, security, operational-recovery, and authenticated browser E2E scope remain intentionally open.

## 2026-08-24 bounded deterministic evaluation harness

ARCWAY now retains a bounded deterministic evaluation summary, `arcway-deterministic-evaluation-v1`, for explicit expected outcomes in Trade Twin linking and commitment extraction. It checks shipment-reference linking, amount-only no-candidate behavior, relative-date review preservation, and unrelated-text no-candidate behavior. The endpoint is Reviewer-only. It invokes no external model and clearly states that it is not a production model evaluation and does not cover document-field or line-item accuracy. The evaluation-summary and Reviewer-denial contracts pass. Full validation is green with 158 tests across 56 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory. Comprehensive accessibility, security, operational-recovery, and authenticated browser E2E scope remain intentionally open.

## 2026-08-24 deterministic evaluation review surface

The Reviewer-only Deterministic Evaluation workspace now renders the bounded suite identifier, execution time, pass/fail counts, each named expected-outcome case, and its explicit no-model/non-production evaluation boundary. Its client query is disabled for Trader clients and the workspace navigation entry is Reviewer-only. Desktop and 375px mobile views were reviewed. Full validation is green with 159 tests across 56 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory. Comprehensive accessibility, security, operational-recovery, and authenticated browser E2E scope remain intentionally open.

## 2026-08-24 repeated retained dismissal patterns

Alert Quality now shows up to five retained category/title patterns with more than one duplicate or not-actionable outcome. Each row states the total dismissed outcomes and occurrences beyond the first; it deliberately does not claim why an alert pattern exists, assess user performance, or predict future alerts. If no repeated pattern exists, the workspace shows an explicit empty state. The aggregation/no-data contract passes, and desktop/mobile Alert Quality views were reviewed. Full validation remains green with 159 tests across 56 files, TypeScript checking, and production build; the build retains only the known client chunk-size advisory. Comprehensive accessibility, security, operational-recovery, and authenticated browser E2E scope remain intentionally open.

## 2026-08-22 expanded privileged-operation authorization coverage

A caller-level contract now rejects Traders before they can create or revoke preflight waivers, author obligation templates, resolve canonical evidence, decide approvals, or write Trade Twin revision history. The complete offline regression is green with 93 tests across 30 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory. This is bounded authorization evidence and does not close PRD-wide scenario validation.

## 2026-08-22 Reviewer-only Trade Twin seed authorization coverage

The core Trade Twin authorization contract now explicitly rejects a Trader before the Reviewer-only seed action can create workspace data. The complete offline regression remains green with 93 tests across 30 files, and TypeScript checking and production build pass; the build emits only the existing client chunk-size advisory.

## 2026-08-24 versioned deterministic evaluation manifest

The Reviewer-only Deterministic Evaluation workspace now exposes a frozen, versioned configuration manifest for the bounded expected-outcome suite. It displays the manifest identifier, a stable SHA-256 fingerprint, its four fixed case identifiers, and the declared deterministic implementation versions for trade linking and commitment extraction. The manifest explicitly says it is not a customer-data corpus, calibrated benchmark, or production model evaluation. Targeted evaluator, Reviewer endpoint, and client-role/presentation contracts pass. Desktop and 375×812 reviews showed the fingerprint wrapping within its panel, single-column mobile cards, readable case outcomes, and both coverage boundaries without visible clipping. The complete offline regression is green with 160 tests across 56 files; TypeScript checking and production build pass, with only the known large client-chunk advisory. This focused visual and contract evidence does not close the intentionally open comprehensive accessibility, security, operational-recovery, or authenticated browser end-to-end validation scope.

## 2026-08-24 retained Alert Quality workflow drill-down

Repeated retained dismissal patterns now carry up to three deterministically sorted retained exception/trade references, visible only through the existing Reviewer-only Alert Quality response. Each reference opens the established exception-resolution workflow with the selected Trade Twin and exception context; it does not create a new exception, infer why a pattern occurred, evaluate staff performance, or forecast alert quality. The aggregation contract proves reference ordering and bounding, the Reviewer endpoint contract proves the references are returned only after the existing Reviewer gate, and the existing Trader-denial-before-read contract remains in place. Desktop and 375×812 Alert Quality reviews showed the truthful no-outcome empty state and metric boundary without clipping; the currently retained preview data contained no resolved repeated pattern to render live links. Full validation is green with 160 tests across 56 files, TypeScript checking, and production build; only the known large client-chunk advisory remains. This focused evidence does not close comprehensive accessibility, security, recovery, or authenticated browser E2E validation.
