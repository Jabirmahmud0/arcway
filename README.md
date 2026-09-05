# ARCWAY — Trade Assurance Platform

> **ARCWAY creates a continuously synchronized digital twin of every international trade, understands the obligations and evidence behind it, detects conflicts across all systems and documents involved, and verifies readiness before critical commercial, logistics and financial handoffs.**

---

## Table of Contents

- [Overview](#overview)
- [Core Concept — The Trade Twin](#core-concept--the-trade-twin)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Design](#api-design)
- [Security Model](#security-model)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Design System](#design-system)
- [Product Philosophy](#product-philosophy)
- [Strategic Vision](#strategic-vision)

---

## Overview

International trade fails not because companies lack software — it fails because there is no **shared, trustworthy state** across the many systems involved in a single shipment. A buyer's PO, a factory's packing list, a freight forwarder's booking, an LC from the bank, and a customs declaration may all describe the same physical shipment yet disagree in quantity, Incoterm, weight, or dates. No existing system reliably answers:

> **Do all of these things still describe the same trade?**

ARCWAY answers that question continuously.

Rather than forcing companies to migrate away from their existing ERP, email, or spreadsheet workflows, ARCWAY **observes** those systems, **reconstructs** each international transaction into a canonical Trade Twin, **evaluates** that twin against its obligations and evidence, and surfaces exactly what is wrong, missing, late, or risky — before goods, documents, or money move.

---

## Core Concept — The Trade Twin

The foundational object in ARCWAY is the **Trade Twin** — a structured digital representation of one real-world international trade, modelled as a graph of interconnected nodes:

```
TRADE TWIN
│
├── Parties          (buyer, seller, counterparties, contacts)
├── Agreement        (commercial terms, PO reference, pricing, Incoterm)
├── Goods            (product master, variants, HS codes, specifications)
├── Delivery         (production milestones, cargo-ready dates, cut-offs)
├── Settlement       (payment terms, records, LC conditions)
├── Obligations      (structured obligation graph with deadlines and dependencies)
├── Documents        (all versions, evidence fields, provenance, hashes)
├── Shipments        (multi-leg, multi-allocation, tracking events)
├── Payments         (deposits, balances, bank evidence)
├── Events           (full timeline of all trade events)
├── Evidence         (source, confidence, operator confirmations)
└── Exceptions       (conflicts, missing items, blockers, resolutions)
```

State is tracked independently across six dimensions — `commercial_state`, `execution_state`, `document_state`, `logistics_state`, `settlement_state`, and `assurance_state` — rather than as a single opaque status field.

Every field carries full provenance:

- **Source** — which document or system it came from
- **Extracted at** — when it was ingested
- **Confidence** — model certainty score
- **Confirmed by** — operator who verified it
- **Conflicts** — competing values from other sources

---

## Key Features

### 1. Trade Twin Reconstruction

ARCWAY reconstructs trades from fragmented, heterogeneous sources without requiring workflow migration. Incoming documents (PDFs, emails, spreadsheets, ERP exports) are ingested, parsed, entity-resolved, and merged into a single coherent twin.

- Automatic source matching against existing trades using reference numbers, buyer/supplier names, amounts, and dates
- Confidence scoring on every automated match
- Human-in-the-loop confirmation for low-confidence matches
- Full ingestion receipt audit trail for every incoming source

---

### 2. Preflight Release Gates

ARCWAY Preflight is the core product surface. It evaluates whether a Trade Twin is **ready for a specific irreversible business handoff** across six gates:

| Gate | Question |
|---|---|
| **Gate 1 — Commercially Confirmed** | Can this order safely become a committed trade? |
| **Gate 2 — Ready for Production** | Is the commercial instruction complete enough for execution? |
| **Gate 3 — Ready for Booking** | Can logistics safely book transport? |
| **Gate 4 — Ready to Ship** | Most critical gate — all documents, cargo, and booking aligned? |
| **Gate 5 — Ready for Presentation** | Can documents be safely presented to the bank? |
| **Gate 6 — Ready to Close** | Has the trade been fully settled and archived? |

Each gate returns one of: `READY` · `READY WITH WARNINGS` · `AT RISK` · `BLOCKED` · `INSUFFICIENT DATA`

Preflight never returns opaque scores. Every result surfaces the specific **problem**, **evidence**, **impact**, **owner**, **deadline**, and **resolution options**. Preflight waivers are supported — an operator can override a blocking check with a recorded reason, and that waiver becomes part of the audit evidence.

---

### 3. Exception Engine

Every detected conflict, missing obligation, or shipment risk becomes a structured **Exception**:

- **Type** — commercial / documentation / execution / logistics / settlement / compliance
- **Severity** — critical / warning / info
- **Evidence** — the exact fields and sources that triggered it
- **Impact** — which downstream milestone it blocks
- **Owner** — the team or individual responsible
- **Deadline** — the time window before impact becomes irreversible
- **Resolution options** — concrete actions (correct document / accept with amendment / mark approved exception / request clarification)

Every resolution is logged as immutable audit evidence. Exception types include: quantity mismatches, Incoterm conflicts, missing documents, invalid dates, cargo-ready date risks, vessel cut-off breaches, LC discrepancy detection, missing bank evidence, missing certificates, weight inconsistencies, and compliance gaps.

---

### 4. Obligation Graph

ARCWAY models every commitment in a trade as a structured **Obligation**:

```
OBLIGATION

Actor       Factory
Action      Complete packing
Deadline    Sep 16
Reason      Cargo cut-off Sep 17
Evidence    Final packing list
Status      OVERDUE
Dependency  → Booking gate
Criticality CRITICAL
```

Obligations are created from policy packs, LC terms, and manual entry; escalated automatically when deadlines breach; connected through a dependency graph; versioned and auditable; and owned by specific actors or teams.

The obligation graph is the foundation for tasks, alerts, preflight gates, and future agent-bound workflows — all derived from the same structured model rather than from separate checklist systems.

---

### 5. Document Intelligence and Workbench

The **Document Workbench** is a split-pane interface showing the raw source document alongside its structured extraction:

```
SOURCE DOCUMENT       STRUCTURED FIELDS        STATUS
[PDF — Packing List]  Quantity: 23,800         Conflicts with PO
                      Gross Weight: 9,840 kg   Consistent
                      Incoterm: FOB            Consistent
                      Description: TX-41 Box   Matches product master
```

Clicking a field highlights its location in the source document. Operators can correct extractions, and every correction is recorded as a canonical resolution with provenance.

Document versions are immutable snapshots — a commercial invoice issued yesterday cannot be retroactively altered even if canonical data changes today. Each issued document stores a source data snapshot, template version, issue timestamp, issuer identity, and SHA hash.

Supports: PDF, XLSX, CSV, DOCX, images, ZIP.

---

### 6. Cross-Document Comparison Matrix

The **Comparison Matrix** places all trade documents in a field-by-document grid, making cross-document inconsistencies immediately visible:

```
                 PO      INV     PACK    SI      BOOKING
Quantity        24,000  24,000  23,800  24,000  —
                                [DIFF]
Incoterm        FOB     CIF     —       FOB     —
                        [DIFF]
Gross Weight    —       —       9,840   —       9,480
                                                [DIFF]
Latest Ship     Sep 18  Sep 18  —       —       Sep 21
                                                [DIFF]
```

This is a core signature UI — one screen that communicates the entire value proposition of trade reconciliation.

---

### 7. LC Preflight (Letter of Credit)

For LC-based trades, ARCWAY runs a specialist preflight that:

1. Extracts all LC conditions: applicant, beneficiary, amount, tolerance, expiry, latest shipment date, presentation period, required ports, Incoterm, required documents, and special clauses
2. Compares every submitted document against LC conditions
3. Surfaces discrepancies with the specific clause violated and the remaining time before the presentation deadline

Output: `BLOCKED — 3 discrepancies · 1 critical deadline · Documents: 8/9`

---

### 8. Critical Path Engine

ARCWAY calculates inter-dependency chains across production, logistics, and documentation milestones. If any event shifts:

```
Cargo ready: Sep 17 -> Sep 18
       |
SI cut-off missed (Sep 17 16:00)
       |
Current booking at risk
       |
ETA impact: +7 days
```

The critical path engine surfaces cascading impacts immediately, before the team discovers them through missed deadlines.

---

### 9. Change Impact Engine

When any canonical field changes — a quantity, a date, a price — ARCWAY immediately shows every affected downstream artifact:

```
QUANTITY CHANGED: 24,000 -> 23,800

AFFECTED
  Commercial Invoice
  Packing List
  Shipping Instruction
  Insurance (declared value)
  LC tolerance check
  Buyer balance
  Shipment weight (booking)
```

Every change is reversible through the revision history. The system maintains bi-temporal records: when a fact was observed, and what was believed at each point in time.

---

### 10. Shadow Audit Mode

Shadow Mode is the onboarding innovation: ARCWAY connects to existing email/storage/ERP sources, operates **read-only**, reconstructs historical trades, and produces an audit without touching the customer's workflow.

```
TRADE ASSURANCE AUDIT

126 trades analyzed
31 cross-document conflicts
18 missing obligations
11 shipment-risk events
7 payment-presentation risks

Estimated manual reconciliation:  84 hours
```

The customer sees real errors in their own historical data before paying for the product. Shadow Audit Review is implemented as a dedicated page including UI to review historical source receipts, anomalies found, and operator resolution decisions.

---

### 11. Trade Inbox and Ingestion Layer

The **Trade Inbox** is where all unstructured incoming information lands — emails, uploaded files, ERP exports. Each incoming item is:

1. Parsed and structured
2. Matched to an existing trade (or flagged as unlinked)
3. Presented with a confidence score and match rationale
4. Confirmed or corrected by an operator
5. Merged into the Trade Twin

Structured spreadsheet imports include AI-assisted column mapping: ARCWAY suggests which of your columns maps to which canonical field. Mappings are saved and reusable per source.

Ingestion sources: Email (Gmail / Outlook / forwarding), PDF, XLSX, CSV, DOCX, images, AWS S3-compatible storage, and pluggable ERP adapters.

---

### 12. Email Intelligence and Commitment Extraction

ARCWAY understands operational commitments buried in plain-text emails:

> "We cannot finish packing before Friday. Please move the booking to the next vessel."

Extracted:
```
EVENT         Production delay
PROPOSED      Cargo ready -> Friday
TRADE         AR-28412
IMPACT        Current vessel cut-off missed
```

Human confirms before canonical state changes. Extracted commitments flow into the obligation graph and exception engine automatically.

---

### 13. Partner Collaboration and Guest Portal

External partners do not require a paid ARCWAY account. A secure, scoped **Guest Portal** is generated per trade per request:

- Magic link delivery via email
- Optional OTP verification
- Configurable expiry
- Scoped to specific fields, documents, or actions on a single trade
- Full audit logging of every guest action

Guest capabilities: confirm quantity / cargo-ready date, upload document, approve change, answer question — and nothing else.

After repeated interactions, ARCWAY offers partners a free workspace. The network grows because the second party receives utility, not because ARCWAY demands membership.

---

### 14. Governance and Policy Engine

Policy Packs define trade-level rules that activate based on trade attributes:

```
IF payment_method = LETTER_OF_CREDIT
THEN activate Documentary Presentation Pack

IF destination = Germany AND product_category = Textiles
THEN require OEKO-TEX Certificate
```

Policy packs are versioned with effective dates, scoped to organization / buyer / product / route / jurisdiction, automatically bound to applicable trades, and previewed before application so operators see which obligations will be created.

The Governance Center provides a unified view of all partner requests, preflight waivers, policy violations, obligation escalations, and approval decisions.

---

### 15. Alert System and Quality Controls

**Alert Policies** define when workflow alerts fire — integration health, obligation deadlines, unreviewed exceptions. Each policy is configurable per organization.

**Alert Quality** tracking measures exception precision, user dismissal rates, and repeated false-alert rates. Operations teams abandon systems that alert too noisily; ARCWAY monitors alert quality as a first-class metric.

---

### 16. Entity Resolution

When ARCWAY encounters name variations of the same company:

```
"Nord Haus GmbH"
"NORDHAUS"
"NordHaus Germany"
```

The Entity Resolution engine proposes merges with a confidence score and supporting evidence. Low-confidence proposals are never silently merged — they enter a human review queue.

---

### 17. Source Alias and Canonicalization

The **Source Alias Review** center maps incoming source party names to canonical counterparties, determining how ARCWAY routes future receipts from that same source automatically.

The **Canonicalization Center** manages field-level canonical resolutions: when two sources disagree, operators record the authoritative value, the reason, and the source hierarchy decision. Every resolution becomes permanent audit evidence.

---

### 18. Assurance Center and Executive View

The **Assurance Center** provides a high-level view of trade portfolio health:

```
$18.4M   OPEN TRADE
$6.2M    READY
$9.8M    IN EXECUTION
$1.7M    AT RISK
$0.7M    BLOCKED
```

Drilling into any status shows the actual exceptions behind it — no opaque aggregate scores.

**Executive Outcomes** tracks clean first-pass rate, prevented exceptions, median resolution time, and active trade volume over time.

After a release gate passes, ARCWAY can generate an **Assurance Pack** — a time-stamped record of every check performed, evidence referenced, document version included, and approval granted. This is the bridge from software to network trust infrastructure.

---

### 19. Monitoring and Operational Scheduling

The **Monitoring Center** tracks integration health, source receipt status, sweep results, and system-level operational events. Integration runs are recorded with attempt-level detail including errors and retry state.

**Operational Sweeps** run on a configurable schedule — obligation escalation sweeps, source health sweeps — with execution history logged per organization.

---

### 20. Audit Trail

Every significant action in ARCWAY is an immutable audit record:

```
actor          Sarah Chen
organization   Delta Manufacturing
action         CANONICAL_RESOLUTION_CREATED
object         Trade AR-28412, field: quantity
before         23,800
after          24,000
reason         Packing list was provisional; final count confirmed by QC
timestamp      2026-09-17T14:23:11Z
```

The audit log cannot be retroactively erased. It covers: trade edits, document uploads, preflight runs, exception resolutions, approval decisions, canonical resolutions, waiver creation, partner requests, and integration events.

---

### 21. Integration Center

The **Integration Center** manages connections to external systems. The adapter pattern means ARCWAY's core business logic does not depend on any single vendor. Each integration records: runs, attempts, success/failure state, extracted receipts, and health status. Operators can manually trigger or replay integration runs. Import mappings are created once per source format and reused indefinitely.

---

### 22. Command Search

A global **Command Search** (command palette) allows keyboard-driven navigation:

```
Open AR-28412
Run shipment preflight
Create partner request
Upload packing list
Resolve exception
Search NordHaus
```

Universal search spans trade IDs, PO numbers, buyer names, supplier names, products, invoices, containers, bookings, and documents.

---

### 23. AI Layer

ARCWAY is AI-native but not AI-dependent. AI handles the unstructured; deterministic code handles the numeric, financial, and rule-based.

| Capability | Description |
|---|---|
| **Extraction** | Structured field extraction from PDFs, emails, images with confidence, source, and model provenance |
| **Entity Resolution** | Fuzzy counterparty matching with merge proposals |
| **Trade Linking** | Match incoming documents to existing trades using multi-signal scoring |
| **Commitment Extraction** | Detect and structure operational commitments in free-text email |
| **Assurance Explanation** | Natural-language explanation of why a trade is blocked, grounded in actual evidence |
| **Message Drafting** | Generate context-aware messages to buyers, suppliers, forwarders, and banks |
| **Deterministic Evaluation** | Rule-based checks run alongside AI to validate numeric and date-sensitive conditions |
| **Voice Transcription** | Audio ingestion via Whisper-compatible API with language detection and timestamped segments |
| **Image Generation** | Internal utility for document thumbnails and visual processing |

Every AI output carries provenance: confidence, source, reasoning summary, model version, timestamp, and human override capability. Low-confidence states surface `INSUFFICIENT DATA` rather than hallucinating trade facts.

---

## Architecture

ARCWAY is a **modular monolith** — a single deployable application with cleanly separated domain modules, rather than a premature microservices split.

```
+----------------------------------------------------------+
|                   CLIENT (Vite + React)                  |
|  44 pages  tRPC client  React Query  Radix UI  Framer    |
+------------------------+---------------------------------+
                         |  tRPC over HTTP
+------------------------v---------------------------------+
|                SERVER (Express + tRPC)                   |
|                                                          |
|  Routers           Domain Logic         Core Services    |
|  ----------        ------------         -------------    |
|  operations.ts     preflight.ts         llm.ts           |
|  trades.ts         criticalPath.ts      storage.ts       |
|  governance.ts     changeImpact.ts      oauth.ts         |
|                    lcPreflight.ts       notification.ts   |
|                    entityResolution.ts  heartbeat.ts     |
|                    policyApplication.ts sdk.ts           |
|                    commitmentExtract.ts                  |
|                    shadowAuditReview.ts                  |
+------------------------+---------------------------------+
                         |
           +-------------+-------------+
           |                           |
+----------v-----------+   +-----------v------------------+
|  MySQL / Drizzle ORM |   |  AWS S3-compatible Storage   |
|  52+ tables          |   |  Presigned URL delivery      |
|  20 migrations       |   +------------------------------+
+----------------------+
```

**Key architectural decisions:**

- **tRPC** — End-to-end type safety between client and server; no schema drift, no separate OpenAPI spec needed
- **Drizzle ORM** — Type-safe SQL with migration-based schema management (20 migrations, 43 KB schema)
- **Zod v4** — Runtime input validation on every tRPC procedure
- **Provider abstractions** — All external integrations (LLM, storage, email, carrier) sit behind adapter interfaces; core domain never imports a vendor SDK directly
- **Bi-temporal data model** — `valid_from`/`valid_to` on significant records to support historical queries
- **Immutable document snapshots** — Issued documents carry a SHA hash and are never retroactively modified
- **Capability-based permissions** — `capabilityGrants` table drives all authorization; no scattered inline role checks

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.9 | End-to-end type safety |
| Vite | 7 | Build tool and dev server with HMR |
| Tailwind CSS | 4 | Utility-first styling |
| Radix UI | Full suite | Accessible headless component primitives |
| Framer Motion | 12 | Animations and state-change transitions |
| tRPC + React Query | 11 + 5 | Type-safe data fetching and caching |
| Wouter | 3 | Lightweight client-side routing |
| React Hook Form + Zod | 7 + 4 | Form state management and validation |
| Recharts | 2 | Analytics and metrics charts |
| date-fns | 4 | Date manipulation and formatting |
| next-themes | 0.4 | Dark/light theme with system detection |
| Sonner | 2 | Toast notification system |
| cmdk | 1 | Command palette component |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js + TypeScript | 20+ / 5.9 | Runtime and language |
| Express | 4 | HTTP server |
| tRPC | 11 | Type-safe API router |
| Drizzle ORM | 0.44 | Type-safe SQL query builder and migrations |
| MySQL 2 | 3 | Database driver |
| Zod | 4 | Runtime validation schemas |
| jose | 6 | JWT session token signing and verification |
| AWS SDK v3 | 3 | S3-compatible object storage |
| pdf-parse | 2 | PDF text extraction |
| xlsx | 0.18 | Spreadsheet parsing |
| nanoid | 5 | Collision-resistant short ID generation |
| axios | 1 | HTTP client for external API calls |

### Tooling

| Technology | Purpose |
|---|---|
| Vitest | Unit testing framework (83 server-side test files) |
| Prettier | Opinionated code formatting |
| esbuild | Fast production server bundle compilation |
| drizzle-kit | Database migration file generation |
| pnpm | Fast, disk-efficient package manager |
| tsx | TypeScript execution for dev with hot reload |

---

## Project Structure

```
ARCWAY-c92d0ae5/
|
+-- client/                         # Frontend (Vite + React)
|   +-- src/
|       +-- pages/                  # 44 page-level components
|       |   +-- Dashboard.tsx
|       |   +-- TradeInbox.tsx
|       |   +-- TradeWorkspace.tsx
|       |   +-- TradeDetail.tsx
|       |   +-- DocumentWorkbench.tsx
|       |   +-- ComparisonMatrix.tsx
|       |   +-- ExceptionResolutionCenter.tsx
|       |   +-- ObligationManagement.tsx
|       |   +-- PreflightGovernance.tsx
|       |   +-- LCPreflightCenter.tsx
|       |   +-- CriticalPathCenter.tsx
|       |   +-- GovernanceCenter.tsx
|       |   +-- CollaborationCenter.tsx
|       |   +-- PolicyGovernanceCenter.tsx
|       |   +-- MonitoringCenter.tsx
|       |   +-- ShadowAuditReview.tsx
|       |   +-- EntityResolutionCenter.tsx
|       |   +-- CommitmentReviewCenter.tsx
|       |   +-- CanonicalizationCenter.tsx
|       |   +-- AssuranceCenter.tsx
|       |   +-- ExecutiveOutcomes.tsx
|       |   +-- WhyBlockedCenter.tsx
|       |   +-- MessageDraftCenter.tsx
|       |   +-- AlertPolicyCenter.tsx
|       |   +-- AlertQualityCenter.tsx
|       |   +-- DeterministicEvaluationCenter.tsx
|       |   +-- SourceAliasReviewCenter.tsx
|       |   +-- StructuredSourceReview.tsx
|       |   +-- IntegrationCenter.tsx
|       |   +-- GuestPortal.tsx
|       |   +-- OperationsHub.tsx
|       |   +-- ActionCenter.tsx
|       |   +-- CommandSearch.tsx
|       |   +-- Ingestion.tsx
|       |   +-- Vault.tsx
|       |   +-- Analytics.tsx
|       +-- components/             # Reusable UI components
|       +-- hooks/                  # Custom React hooks
|       +-- contexts/               # React context providers (Theme)
|       +-- lib/                    # Utility functions
|
+-- server/                         # Backend (Express + tRPC)
|   +-- _core/                      # Infrastructure layer
|   |   +-- index.ts                # Express app entry point
|   |   +-- trpc.ts                 # tRPC router and context setup
|   |   +-- llm.ts                  # LLM provider abstraction (multimodal)
|   |   +-- voiceTranscription.ts   # Whisper-compatible audio transcription
|   |   +-- imageGeneration.ts      # Image generation utility
|   |   +-- storageProxy.ts         # S3-compatible object storage wrapper
|   |   +-- oauth.ts                # OAuth 2.0 PKCE callback + dev login
|   |   +-- cookies.ts              # Secure session cookie management
|   |   +-- env.ts                  # Typed environment config
|   |   +-- sdk.ts                  # Platform SDK (session tokens, auth)
|   |   +-- heartbeat.ts            # Health checks and liveness endpoints
|   |   +-- notification.ts         # Notification dispatch
|   |   +-- map.ts                  # Geographic data utilities
|   |   +-- dataApi.ts              # External data API abstraction
|   |
|   +-- routers/                    # tRPC procedure definitions
|   |   +-- operations.ts           # ~70 procedures: ingestion, obligations,
|   |   |                           #   preflight, exceptions, integrations,
|   |   |                           #   partner collab, alert policies,
|   |   |                           #   entity resolution, critical path, LC
|   |   +-- trades.ts               # ~20 procedures: trade CRUD, workspace,
|   |   |                           #   documents, shipments, payments, tasks
|   |   +-- governance.ts           # ~15 procedures: policy, guest portal,
|   |                               #   partner requests, preflight governance
|   |
|   +-- integrations/
|   |   +-- registry.ts             # Provider catalog and adapter simulation
|   |
|   +-- services/
|   |   +-- documentIntelligence.ts # Document processing service
|   |
|   +-- db.ts                       # All database queries (1,134 lines)
|   |
|   # Domain logic modules (each paired with a .test.ts file):
|   +-- preflight.ts                # Preflight gate evaluation engine
|   +-- lcPreflight.ts              # Letter of Credit specialist preflight
|   +-- criticalPath.ts             # Critical path dependency calculation
|   +-- changeImpact.ts             # Downstream change impact analysis
|   +-- policyApplication.ts        # Policy pack binding and preview
|   +-- entityResolution.ts         # Fuzzy entity matching proposals
|   +-- sourceMatching.ts           # Document-to-trade matching (AI)
|   +-- commitmentExtraction.ts     # Email commitment extraction (AI)
|   +-- assuranceExplanation.ts     # Natural language explanations (AI)
|   +-- messageDrafting.ts          # AI context-aware message generation
|   +-- shadowAuditReview.ts        # Historical shadow audit processing
|   +-- tradeDomain.ts              # Core trade domain logic
|   +-- alertPolicy.ts              # Alert policy evaluation engine
|   +-- alertQuality.ts             # Alert quality measurement
|   +-- deterministicEvaluation.ts  # Rule-based validation checks
|   +-- comparisonMatrix.ts         # Cross-document field comparison logic
|   +-- sourcePartyAlias.ts         # Source party normalization
|   +-- access.ts                   # Role and capability enforcement
|   +-- partnerAccess.ts            # Partner request authorization
|   +-- ownerNotifications.ts       # Notification routing logic
|
+-- shared/                         # Shared types and constants (client + server)
|   +-- comparisonMatrix.ts
|   +-- reporting.ts
|   +-- const.ts
|
+-- drizzle/                        # Database schema and migrations
|   +-- schema.ts                   # Full schema (43,437 bytes, 52+ tables)
|   +-- 0000-0019_*.sql             # 20 incremental migration files
|
+-- vite.config.ts
+-- vitest.config.ts
+-- drizzle.config.ts
+-- tsconfig.json
+-- components.json
+-- package.json
```

---

## Database Schema

`drizzle/schema.ts` defines 52+ tables across all trade domains:

**Identity and Access**
`users` `organizations` `memberships` `capabilityGrants` `organizationControls`

**Trade Core**
`trades` `tradeLines` `tradeRevisions` `tradeEvents` `tradeTasks`

**Commercial**
`counterparties` `products` `paymentTerms` `paymentRecords`

**Documents and Evidence**
`tradeDocuments` `tradeDocumentVersions` `evidenceFields` `canonicalResolutions` `generatedDocuments`

**Obligations**
`tradeObligations` `obligationTemplates` `obligationDependencies` `obligationEscalations`

**Logistics**
`shipments` `shipmentAllocations` `shipmentEvents` `externalReferences`

**Exceptions and Approvals**
`tradeExceptions` `approvals` `preflightRuns` `preflightWaivers`

**Policies**
`policyPacks` `policyVersions` `policyObligationBindings`

**Integrations and Ingestion**
`integrations` `integrationRuns` `integrationRunAttempts` `sourceIngestionReceipts` `importMappings`

**Collaboration**
`partnerRequests` `guestAccessGrants` `tradeMessages` `comments`

**Monitoring**
`workflowAlerts` `workflowAlertPolicies` `operationalSchedules` `auditRecords`

---

## API Design

All API procedures are exposed via **tRPC**, providing end-to-end type safety with zero schema drift between client and server.

| Router | Approximate Procedures | Domain Coverage |
|---|---|---|
| `operations` | ~70 | Trade ingestion, obligation management, preflight runs, waiver management, exception resolution, entity resolution, source alias, structured mapping, shadow audit, critical path, LC preflight, alert policies, alert quality, monitoring, partner requests, commitment review, message drafting, change impact, assurance explanation |
| `trades` | ~20 | Trade CRUD, workspace data, documents, shipments, tracking events, payments, comments, tasks, approvals, evidence fields |
| `governance` | ~15 | Policy packs, policy governance, partner request lifecycle, preflight governance, guest portal access |

All procedures are `protectedProcedure` — requiring a valid JWT session token — except guest portal routes which validate against scoped `guestAccessGrants`.

Authorization is enforced at the procedure level via `requireArcwayRole` and `capabilityGrants`, following least-privilege principles.

---

## Security Model

| Concern | Implementation |
|---|---|
| **Authentication** | OAuth 2.0 PKCE callback flow + JWT session cookies signed with HS256; dev login endpoint for reviewers |
| **CSRF protection** | OAuth state nonce verified against a one-time HttpOnly cookie set at login initiation |
| **Session cookies** | HttpOnly, Secure, SameSite enforcement via `getSessionCookieOptions` |
| **Tenant isolation** | Every database query scoped to `organizationId` — no cross-tenant data leakage |
| **Capability-based authz** | `capabilityGrants` table drives all permission checks; no scattered inline role conditionals |
| **Guest access** | Scoped `guestAccessGrants` per trade per request; configurable expiry, OTP, full audit logging |
| **Document integrity** | SHA hashes on issued document snapshots; immutable once issued |
| **Secret management** | All secrets via environment variables; typed and validated through `env.ts` |
| **Signed storage links** | S3 presigned URLs for file delivery; no public bucket exposure |
| **Audit immutability** | `auditRecords` is append-only; no application-layer delete path exposed |
| **Upload validation** | File type and size validated before any storage write |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- MySQL 8+ (or compatible)
- S3-compatible object storage

### Install dependencies

```bash
pnpm install
```

### Configure environment

Create a `.env` file with the variables listed in the [Environment Variables](#environment-variables) section.

### Apply database schema

```bash
pnpm db:push
```

Generates migration SQL from `drizzle/schema.ts` and applies it to `DATABASE_URL`.

### Start development server

```bash
pnpm dev
```

Starts the Express server with `tsx watch` (hot reload). Vite serves the React frontend with HMR via the Express Vite middleware — both on the same port, no proxy configuration needed.

### Production build

```bash
pnpm build    # Vite builds client into dist/ + esbuild bundles server
pnpm start    # Runs dist/index.js in production mode
```

### Type check

```bash
pnpm check
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | MySQL connection string |
| `JWT_SECRET` | Yes | Session token signing key (minimum 32 characters) |
| `OAUTH_SERVER_URL` | Yes | OAuth provider base URL |
| `OWNER_OPEN_ID` | Yes | OpenID of the primary workspace owner |
| `BUILT_IN_FORGE_API_URL` | Yes | LLM / AI provider base URL |
| `BUILT_IN_FORGE_API_KEY` | Yes | LLM / AI provider API key |
| `AWS_ACCESS_KEY_ID` | Yes | S3-compatible storage access key |
| `AWS_SECRET_ACCESS_KEY` | Yes | S3-compatible storage secret |
| `AWS_S3_BUCKET` | Yes | Object storage bucket name |
| `AWS_S3_ENDPOINT` | Conditional | Custom endpoint for non-AWS S3 providers |
| `NODE_ENV` | No | `development` or `production` (default: `development`) |
| `VITE_APP_ID` | No | App identifier used in client build (default: `arcway`) |

---

## Testing

ARCWAY has **83 server-side test files** using Vitest:

```bash
pnpm test
```

| Area | Test Files |
|---|---|
| Access control and authorization | `access.test`, `operationsAuthorization.test`, `tradeAuthorization.test`, `operationsLcPreflightAuthorization.test`, `operationsCriticalPathAuthorization.test`, `operationsShadowAuditAuthorization.test`, `operationsMappingAccess.test`, `operationsUnlinkedReceiptAuthorization.test` |
| Preflight and gate evaluation | `preflight.test`, `lcPreflight.test`, `operationsDeterministicEvaluation.test` |
| Domain logic | `tradeDomain.test`, `criticalPath.test`, `changeImpact.test`, `policyApplication.test`, `deterministicEvaluation.test` |
| AI and ML modules | `entityResolution.test`, `sourceMatching.test`, `commitmentExtraction.test`, `assuranceExplanation.test` |
| Alert system | `alertPolicy.test`, `alertQuality.test`, `operationsAlertPolicy.test`, `operationsAlertQuality.test` |
| Partner collaboration | `governanceGuestLinkAuthorization.test`, `governanceGuestResponse.test`, `guestPortalAccessibility.test`, `operationsPartnerLifecycle.test` |
| Ingestion and receipts | `operationsUnlinkedIntake.test`, `operationsReplayReceipt.test`, `sourceReceiptVisibility.test` |
| Operational sweeps | `operationalSweep.test`, `operationsManualSweep.test`, `operationsScheduleConfiguration.test` |
| Integrations | `integrations/registry.test`, `operationsIntegrationRecovery.test` |
| Visibility | `operationsShipmentVisibility.test`, `operationsInboxVisibility.test`, `operationsCollaborationVisibility.test` |
| Other | `documentWorkflow.test`, `shadowAuditReview.test`, `sourcePartyAlias.test`, `structuredSpreadsheet.test`, `reporting.test`, `assuranceScenario.test`, `comparisonMatrix.test`, `auth.logout.test`, `ownerNotifications.test` |

---

## Design System

The UI follows a purposeful, calm-under-complexity aesthetic inspired by Linear's precision and Stripe's clarity — not generic SaaS dashboards.

**Color semantics — color communicates state, not decoration:**

| State | Color |
|---|---|
| READY | Green |
| WARNING | Amber |
| BLOCKED | Red |
| INFORMATION | Blue |
| UNKNOWN / INSUFFICIENT DATA | Gray |

**Surfaces:** Warm neutral canvas, white/dark graphite cards, navy navigation, controlled blue interactive states.

**Motion:** Framer Motion is used to explain state changes — exceptions entering the queue, gate status transitions, evidence drawer reveals. No cinematic scrolling inside operational screens.

**Dark mode:** Supported out of the box via `next-themes` with system preference detection.

**Components:** Full Radix UI suite for accessible, unstyled headless primitives, configured via `components.json` (shadcn/ui registry pattern).

---

## Product Philosophy

Five things ARCWAY must be the best in the world at:

1. **Trade Reconstruction** — Turn fragmented information into a trustworthy Trade Twin
2. **Cross-Source Reconciliation** — Detect when reality disagrees with itself
3. **Readiness / Preflight** — Know whether a trade can safely move to its next gate
4. **Exception Resolution** — Turn a discovered problem into a clear, owned, time-bound action
5. **Evidence and Provenance** — Show exactly why ARCWAY believes what it believes

Every feature must satisfy at least one of:

- **Prevent** an expensive mistake
- **Clarify** the real trade state
- **Accelerate** manual coordination
- **Prove** something happened
- **Connect** two companies without overhead

If a feature satisfies none of these — it does not get built.

---

## Strategic Vision

ARCWAY's maturity model progresses through distinct stages, each requiring proven exit criteria before advancing:

| Stage | Status | Description |
|---|---|---|
| **0 — Trade Assurance** | Current | Shadow mode, Trade Twin reconstruction, Preflight gates, Exception inbox, Obligation graph, Audit trail |
| **1 — System of Action** | Planned | Tasks, approvals, partner requests, limited workflow automation |
| **2 — System of Record** | Future | Native quotation, Trade Orders, product master, counterparty master |
| **3 — Trade Network** | Future | Free partner workspaces, verified identities, cross-company inbox |
| **4 — Financial Distribution** | Future | Payments, FX, insurance, trade finance via regulated partners |
| **5 — Transaction Infrastructure** | Future | Selective financial vertical integration (if economically justified) |
| **6 — Autonomous Trade** | Future | Policy-bound agents executing bounded trade actions |

The long-term north star:

> **The trust layer that every international trade passes through before goods, documents or money move.**

---

*ARCWAY — Global Trade Assurance and Operating Network*
