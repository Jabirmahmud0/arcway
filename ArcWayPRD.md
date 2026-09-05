# ARCWAY

## Final Product Requirements Document

### Codename — Global Trade Assurance & Operating Network

**PRD version:** 2.0 — Final Strategic Architecture
**Working codename:** ARCWAY
**Launch brand:** TBD after trademark/domain clearance
**Category at launch:** Trade Assurance Platform
**Long-term category:** Global Trade Operating Network
**Initial customer:** SME and mid-market exporters
**Long-term participants:** Exporters · Importers · Manufacturers · Suppliers · Buyers · Freight Forwarders · Customs Brokers · Inspection Firms · Banks · Insurers · Trade-Finance Providers
**Product philosophy:** Enter as an assurance layer. Earn system-of-record status. Compound into a network.

---

# 1. Executive Thesis

International trade does not primarily suffer from a lack of software.

It suffers from a lack of **shared, trustworthy state**.

One shipment may be represented differently in:

* buyer PO
* sales order
* ERP
* Excel tracker
* commercial invoice
* packing list
* booking
* shipping instruction
* bill of lading
* letter of credit
* inspection report
* bank presentation
* email
* WhatsApp

Each artifact represents part of the same commercial transaction.

Yet no system reliably answers:

> **Do all of these things still describe the same trade?**

ARCWAY begins there.

ARCWAY observes the tools a company already uses, reconstructs every international transaction into a canonical **Trade Twin**, continuously evaluates that trade against its obligations and evidence, and tells operations:

# Is this trade safe to move forward?

ARCWAY does not initially replace the ERP.

It does not initially replace email.

It does not initially replace Excel.

It watches them.

Understands them.

Reconciles them.

And prevents the expensive mistakes created between them.

The long-term sequence is:

```text
OBSERVE
   ↓
UNDERSTAND
   ↓
VERIFY
   ↓
RESOLVE
   ↓
COORDINATE
   ↓
OPERATE
   ↓
CONNECT
   ↓
TRANSACT
   ↓
AUTOMATE
```

That is ARCWAY.

---

# 2. One-Sentence Product

> **ARCWAY continuously reconstructs and verifies international trades so companies know exactly what is wrong, missing, late or risky before goods, documents or money move.**

---

# 3. Initial Promise

Do NOT launch with:

> The operating system for global trade.

That is the destination.

Launch with:

# **Catch trade errors before they become shipment or payment problems.**

Alternative:

# **Every export order. Checked before it moves.**

The initial customer should understand ARCWAY within five seconds.

---

# 4. The Fundamental Problem

A trade contains three connected realities:

```text
COMMERCIAL
What was agreed?

PHYSICAL
What is actually happening to the goods?

FINANCIAL
What must happen for money to move?
```

Those realities constantly drift apart.

Example:

```text
PURCHASE ORDER

Quantity
24,000

Incoterm
FOB

Required shipment
Sep 18
```

Later:

```text
PACKING LIST

Quantity
23,800
```

Later:

```text
COMMERCIAL INVOICE

Quantity
24,000

Incoterm
CIF
```

Later:

```text
BOOKING

Cargo ready
Sep 21
```

Each system individually works.

The trade itself does not.

ARCWAY's job is to detect the **drift between systems**.

---

# 5. Why Existing Software Does Not Fully Solve It

## Documentation software

Products already exist that:

* generate invoices
* generate packing lists
* reuse order information
* reduce retyping
* perform document checks

Therefore:

**document generation alone is not a viable strategic moat.**

## ERP

ERP usually understands the company's internal transaction.

It does not reliably understand everything happening between:

* buyer
* exporter
* factory
* forwarder
* carrier
* bank
* inspector
* broker

## Freight platforms

Platforms such as Flexport offer strong:

* PO management
* shipment execution
* supplier collaboration
* customs
* tracking
* logistics optimization

ARCWAY must therefore not compete primarily as a transportation platform.

## Enterprise supply-chain networks

Infor Nexus already demonstrates that large multi-enterprise networks can connect:

* buyers
* suppliers
* logistics providers
* banks

ARCWAY cannot win by merely saying:

> We connect everybody.

## ARCWAY's differentiation

ARCWAY starts one layer lower:

> **Can we reconstruct the actual trade and prove whether it is internally coherent and ready for its next handoff?**

That is the wedge.

---

# 6. Why Now

International trade remains heavily dependent on paper-derived workflows and manual information exchange.

At the same time:

* digital trade laws are expanding
* eBL interoperability is improving
* shipping APIs are standardizing
* AI can extract previously inaccessible document/email information
* companies increasingly expect real-time operational software

The OECD still describes international goods trade as heavily paper dependent.

DCSA's June 2026 interoperability milestone allows eBL exchange across multiple previously separate platforms.

ICC continues pushing MLETR-based legal reform.

The infrastructure required for interoperable digital trade is finally becoming credible.

ARCWAY should not build another closed ecosystem.

It should become the **orchestration and assurance layer above an increasingly interoperable ecosystem**.

---

# 7. The Core Strategic Insight

ARCWAY does NOT require workflow migration before delivering value.

This is the key difference between this PRD and the previous version.

## Traditional enterprise software

```text
Buy software
↓
Migrate data
↓
Train team
↓
Change process
↓
Onboard partners
↓
Maybe receive value
```

## ARCWAY

```text
Connect existing workflow
↓
ARCWAY observes
↓
ARCWAY reconstructs trades
↓
ARCWAY finds problems
↓
Customer receives value
↓
Customer voluntarily moves more workflow into ARCWAY
```

This radically lowers adoption resistance.

---

# 8. The ARCWAY Trade Twin

The foundational product object is the:

# Trade Twin

A Trade Twin is ARCWAY's digital representation of one real-world international trade.

Externally, users experience it as a **Trade Order**.

Internally it is a structured graph.

```text
TRADE TWIN
│
├── Parties
│
├── Agreement
│
├── Goods
│
├── Delivery
│
├── Settlement
│
├── Obligations
│
├── Documents
│
├── Shipments
│
├── Payments
│
├── Events
│
├── Evidence
│
└── Exceptions
```

---

# 9. Why "Twin" Matters

Initially ARCWAY may not own the source transaction.

The PO may come from SAP.

The invoice may come from Excel.

The booking may come from email.

The shipment event may come from Maersk.

ARCWAY creates:

> a synchronized digital representation of all of them.

This lets ARCWAY create value without pretending to be the source system.

Later, as users create more information natively inside ARCWAY, the Twin gradually becomes the system of record.

---

# 10. Standards-Aligned Domain Model

ARCWAY's conceptual model should align where practical with UN/CEFACT's Buy-Ship-Pay model:

```text
BUY
Trade Agreement

SHIP
Trade Delivery

PAY
Trade Settlement
```

ARCWAY extends this operationally with:

```text
OBLIGATIONS
What each participant must do.

EVIDENCE
What proves it happened.

EXCEPTIONS
Where reality conflicts with expectation.
```

ARCWAY should map standards internally rather than expose standards jargon to normal users.

---

# 11. The Obligation Graph

This is one of the most important architectural additions.

A Trade Twin is not merely data.

It contains **obligations**.

Example:

```text
OBLIGATION

Factory
must complete packing

BY
Sep 16

BECAUSE
Cargo cut-off Sep 17

EVIDENCE
Final packing list
```

Another:

```text
OBLIGATION

Buyer
must pay 30% deposit

BY
5 days after confirmation

EVIDENCE
Bank receipt
```

Another:

```text
OBLIGATION

Exporter
must present documents

BY
21 days after shipment

SOURCE
Letter of Credit
```

Every obligation contains:

```text
actor
action
object
condition
deadline
source
evidence requirement
status
dependency
criticality
```

---

# 12. Why the Obligation Graph Is Powerful

Once obligations exist structurally, ARCWAY can answer:

> What should happen next?

> Who owns it?

> When does it become late?

> What evidence satisfies it?

> What downstream milestone breaks if it fails?

This becomes the foundation for:

* tasks
* alerts
* predictions
* workflows
* approvals
* AI agents

without requiring separate systems.

---

# 13. ARCWAY Preflight

The initial flagship product is:

# ARCWAY PREFLIGHT

Preflight determines whether a Trade Twin is ready for a specific irreversible business handoff.

Do not create one vague:

```text
Trade Score 82
```

Instead evaluate explicit gates.

---

# 14. Release Gates

Recommended default gates:

## Gate 1 — Commercially Confirmed

Can this order safely become a committed trade?

Check:

* buyer
* seller
* product
* quantity
* currency
* price
* Incoterm
* delivery requirement
* payment terms
* PO vs quotation

---

## Gate 2 — Ready for Production

Is the commercial instruction complete enough for execution?

Check:

* approved order
* specifications
* variants
* quantities
* production deadline
* packaging
* required certificates
* deposit where required

---

## Gate 3 — Ready for Booking

Can logistics safely book transport?

Check:

* cargo-ready date
* package count
* weight
* dimensions
* port
* destination
* dangerous-goods information
* booking deadline
* transport requirements

---

## Gate 4 — Ready to Ship

The most important initial operational gate.

Check:

* goods complete
* inspection status
* invoice
* packing list
* quantity consistency
* weight consistency
* buyer/consignee
* Incoterm
* shipping instruction
* booking
* cut-offs
* certificates
* compliance requirements
* payment condition where relevant

---

## Gate 5 — Ready for Presentation / Payment

Especially important for documentary trade.

Check:

* required documents
* document names
* dates
* amounts
* goods descriptions
* transport references
* LC conditions
* presentation deadline
* insurance
* endorsements
* cross-document consistency

---

## Gate 6 — Ready to Close

Check:

* goods delivered
* required documents delivered
* payment received
* claims unresolved
* final costs
* trade archive complete

---

# 15. Gate Statuses

Every gate must return one of:

```text
READY

READY WITH WARNINGS

AT RISK

BLOCKED

INSUFFICIENT DATA
```

Never return false certainty.

---

# 16. Example Preflight

```text
AR-28412

READY TO SHIP?

BLOCKED
```

### Critical

```text
PACKING QUANTITY

PO
24,000

Invoice
24,000

Packing List
23,800

Difference
200 PCS
```

### Critical

```text
SHIPPING INSTRUCTION

Deadline
Today 16:00

Status
Missing
```

### Warning

```text
CERTIFICATE OF ORIGIN

Expected
Before document presentation

Currently
Not uploaded
```

### Clear

```text
Booking
✓

Inspection
✓

Payment condition
✓
```

---

# 17. No Opaque Risk Scores

ARCWAY may calculate models internally.

But user-facing output must prioritize:

```text
PROBLEM
EVIDENCE
IMPACT
OWNER
DEADLINE
RESOLUTION
```

over:

```text
Risk = 83
```

Scores can summarize.

They must never replace explanation.

---

# 18. Evidence and Provenance

Every meaningful field in ARCWAY should answer:

# Where did this value come from?

Example:

```text
Quantity
24,000

SOURCE
Buyer PO #91822

Extracted
Aug 12 · 10:31

Confidence
99.8%

Confirmed by
Sarah Chen
```

Alternative source:

```text
ERP Sales Order
24,000
```

Conflicting source:

```text
Packing List
23,800
```

This creates a **data lineage graph**.

---

# 19. Source Priority

Different fields may have different authoritative sources.

Example:

```text
Agreed quantity
Buyer PO

Actual packed quantity
Final Packing List

Price
Accepted quotation / PO

Actual vessel
Carrier booking

Payment
Bank confirmation
```

ARCWAY must not assume:

> newest document = truth.

Authority is contextual.

---

# 20. Conflict Resolution

When sources disagree:

```text
CONFLICT

Incoterm

Purchase Order
FOB Chattogram

Commercial Invoice
CIF Hamburg
```

User can:

```text
Use PO value
Correct invoice
Mark intentional override
Request clarification
```

Every decision is logged.

---

# 21. Immutable Issued Documents

Canonical information may change.

Issued documents may not.

Example:

Customer address updated today.

Yesterday's invoice must remain unchanged.

Therefore:

```text
LIVE CANONICAL DATA
+
IMMUTABLE DOCUMENT SNAPSHOT
```

Every issued document stores:

* source data snapshot
* template version
* issue timestamp
* issuer
* hash
* version

---

# 22. Change Impact Engine

Suppose quantity changes:

```text
24,000
→
23,800
```

ARCWAY should immediately show:

```text
AFFECTED

Commercial Invoice
Packing List
Shipping Instruction
Insurance
Letter of Credit tolerance
Buyer balance
Shipment weight
```

Not merely:

> Quantity updated.

---

# 23. Shadow Mode

This is the critical onboarding innovation.

Customer connects:

```text
Email
Cloud storage
ERP / CSV
```

ARCWAY operates read-only.

It reconstructs trades without changing the customer's workflow.

Example:

```text
184 trades discovered

173 reconstructed automatically

11 need clarification

38 discrepancies found

9 high-risk exceptions
```

The customer can receive value before training the entire company.

---

# 24. Shadow Audit as Sales Motion

ARCWAY's strongest sales motion may be:

# Run ARCWAY against your last 30–90 days of trades.

Output:

```text
TRADE ASSURANCE AUDIT

126 trades analyzed

31 cross-document conflicts

18 missing obligations

11 shipment-risk events

7 payment-presentation risks

Estimated manual reconciliation
84 hours
```

This is much more persuasive than a product demo.

---

# 25. Ingestion Layer

ARCWAY needs first-class ingestion from:

### Email

* Gmail
* Microsoft 365
* forwarding address

### Files

* PDF
* XLSX
* CSV
* DOCX
* images
* ZIP

### Storage

* Google Drive
* OneDrive
* SharePoint
* Dropbox
* S3

### Enterprise systems

* ERP
* accounting
* CRM
* WMS
* TMS

### External trade systems

* carriers
* forwarders
* eBL
* customs
* banks

---

# 26. Trade Inbox

Unstructured incoming information lands here.

```text
TRADE INBOX

12 require review

────────────────────

Buyer PO
NordHaus GmbH

Matched:
AR-28412

Confidence:
99%

────────────────────

Packing List

Likely trade:
AR-28418

Confidence:
91%

[Confirm]

────────────────────

Email

"Cargo will be ready on the 19th."

Matched:
AR-28412

Detected change:
Cargo ready Sep 17 → Sep 19

[Review]
```

---

# 27. Email Intelligence

ARCWAY should understand operational commitments in email.

Example:

> We cannot finish packing before Friday. Please move the booking to the next vessel.

ARCWAY extracts:

```text
EVENT
Production delay

PROPOSED CHANGE
Cargo ready → Friday

RELATED
Trade AR-28412

POTENTIAL IMPACT
Current vessel cut-off missed
```

Human confirms before canonical state changes.

---

# 28. Communication Philosophy

Do NOT force users away from email/WhatsApp on day one.

ARCWAY should:

```text
observe existing communication
↓
structure commitments
↓
attach them to trades
↓
create actions
```

Later, teams naturally use ARCWAY-native collaboration because it becomes more useful.

---

# 29. WhatsApp

Where official APIs, permissions and applicable rules permit:

ARCWAY may support:

* business-message ingestion
* file capture
* trade linking
* commitment extraction
* notification

Never depend on unofficial scraping.

---

# 30. Trade Workspace

The primary workspace should answer six questions:

```text
WHAT WAS AGREED?

WHAT IS HAPPENING?

WHAT MUST HAPPEN NEXT?

WHAT IS WRONG?

WHAT EVIDENCE DO WE HAVE?

WHO OWNS THE NEXT ACTION?
```

Navigation:

```text
Overview
Preflight
Commercial
Execution
Documents
Shipment
Settlement
Activity
```

---

# 31. Trade Header

Example:

```text
AR-28412

NordHaus GmbH
↕
Delta Manufacturing Ltd.

TX-41 Storage Box

24,000 units

€138,400

FOB Chattogram
→ Hamburg

Required
18 Oct
```

Underneath:

```text
COMMERCIAL       READY

PRODUCTION       78%

BOOKING          READY

SHIPMENT         BLOCKED

PRESENTATION     AT RISK

PAYMENT          ON TRACK
```

---

# 32. Exception Inbox

The real operational homepage.

Not dashboards.

Example:

```text
NEEDS ATTENTION
17

CRITICAL
────────────────────────

AR-28412
Quantity mismatch
Blocks shipment

Owner
Documentation Team

Deadline
2h 14m


AR-28392
Cargo-ready date misses vessel cut-off

Potential impact
+7 days ETA


AR-28422
LC presentation deadline in 36h

Missing
Insurance certificate
```

---

# 33. Exception Anatomy

Every exception requires:

```text
Type
Severity
Trade
Evidence
Reason
Impact
Owner
Deadline
Resolution options
History
```

Exceptions may be:

* system detected
* AI detected
* partner reported
* manually created

---

# 34. Exception Types

## Commercial

* price mismatch
* quantity mismatch
* currency mismatch
* Incoterm mismatch
* unauthorized revision

## Documentation

* missing document
* conflicting fields
* invalid date
* wrong version
* incomplete signature

## Execution

* production delay
* inspection failure
* cargo shortfall

## Logistics

* missed cut-off
* booking rollover
* ETA risk
* weight inconsistency

## Settlement

* late deposit
* missing bank evidence
* LC discrepancy
* overdue balance

## Compliance

* missing classification
* required evidence absent
* screening result requiring review

---

# 35. Resolution Engine

ARCWAY should not merely detect.

It should help resolve.

Example:

```text
INCOTERM CONFLICT

PO
FOB Chattogram

Invoice
CIF Hamburg
```

Actions:

```text
[Correct invoice]

[Accept invoice and request PO amendment]

[Mark approved exception]

[Ask buyer]
```

The resolution itself becomes part of audit evidence.

---

# 36. Product Master

Canonical reusable product information:

```text
SKU
Buyer SKU
Description
Variants
Material
Country of origin
HS classification
Dimensions
Net weight
Gross weight
Packing
MOQ
Lead time
Certification
Compliance attributes
```

Product data must be version-aware.

---

# 37. Counterparty Master

Counterparties contain:

```text
Legal entity
Trading names
Addresses
Tax IDs
Contacts
Bank details
Buyer/supplier references
Default terms
Document preferences
Required certificates
Communication preferences
```

Do not treat counterparties like generic CRM leads.

---

# 38. Counterparty-Specific Rules

Buyer A may require:

```text
specific invoice terminology
specific packing-list columns
specific inspection company
specific document naming
```

Buyer B may not.

ARCWAY should support relationship-specific policies.

This becomes extremely sticky.

---

# 39. Policy Packs

A Trade Twin receives relevant policy packs:

```text
Company Policy

Buyer Policy

Product Policy

Route Policy

Payment Policy

Transport Policy

Jurisdiction Policy
```

Rules combine to determine obligations.

---

# 40. Policy Engine

Example:

```text
IF

payment_method = LETTER_OF_CREDIT

THEN

activate
Documentary Presentation Pack
```

Another:

```text
IF

destination = Germany

AND

product_category = X

THEN

require
Certificate Y
```

Rules require:

* version
* effective date
* jurisdiction
* source
* owner

---

# 41. Legal/Compliance Boundary

ARCWAY must distinguish:

### Deterministic validation

> Invoice quantity conflicts with PO.

from:

### Compliance assistance

> Based on the configured rule set, Certificate X may be required.

ARCWAY must never imply:

> Legally compliant guaranteed.

unless a specifically qualified regulated service actually provides that assurance.

---

# 42. Document Workbench

A purpose-built workspace:

```text
SOURCE DOCUMENT       STRUCTURED DATA       ISSUES

[PDF]                 Quantity              ⚠
                      Price                 ✓
                      Incoterm              ⚠
                      Buyer                 ✓
                      Dates                 ✓
```

Selecting a field highlights its location in the source.

---

# 43. Cross-Document Comparison

Compare simultaneously:

```text
PO
Quote
Invoice
Packing List
Booking
Shipping Instruction
LC
```

Fields become rows.

```text
                 PO      INV      PACK     SI

Quantity        24K     24K      23.8K    24K
                               ⚠

Incoterm        FOB     CIF      —        FOB
                        ⚠

Gross Weight     —      —       9840     9480
                                         ⚠
```

This is a core signature UI.

---

# 44. Document Generation

ARCWAY may eventually generate:

* quotation
* proforma invoice
* commercial invoice
* packing list
* PO
* sales confirmation
* shipping instruction
* VGM
* document cover schedule

But document generation supports the assurance system.

It is not the company's identity.

---

# 45. Letter of Credit Preflight

For LC-based trades, ARCWAY should eventually provide specialist preflight.

Extract:

* applicant
* beneficiary
* amount
* tolerance
* expiry
* latest shipment
* presentation period
* ports
* Incoterm
* required documents
* special clauses

Then compare every submitted document.

Output:

```text
BANK PRESENTATION

BLOCKED

3 discrepancies

1 critical deadline

Documents
8 / 9
```

This can be a premium high-value module.

---

# 46. Production / Fulfilment

ARCWAY should initially integrate rather than become manufacturing ERP.

Track only trade-relevant milestones:

```text
Materials ready

Production started

Production completed

QC

Packing

Cargo ready
```

Customers may configure milestone templates.

---

# 47. Critical Path

ARCWAY calculates dependencies.

Example:

```text
Cargo ready
Sep 17

SI cut-off
Sep 17 16:00

CY cut-off
Sep 18 12:00

ETD
Sep 20
```

If production shifts to Sep 18:

ARCWAY immediately surfaces:

```text
CURRENT BOOKING AT RISK
```

---

# 48. Delivery Prediction

Prediction should combine:

* current progress
* historical performance
* partner performance
* carrier schedule
* port events
* cut-offs
* inspection status

Output:

```text
Required delivery
18 Oct

Current expected
20 Oct

Confidence
78%

Primary driver
Production delay
```

Prediction must include drivers.

---

# 49. Shipment Model

Trade and shipment are not one-to-one.

Support:

```text
one trade
→ multiple shipments

multiple trades
→ consolidated shipment
```

Model:

```text
Trade
TradeLine

Shipment
ShipmentLeg

ShipmentAllocation
```

Do not bake PO=container assumptions into architecture.

---

# 50. Shipment Workspace

Track:

```text
mode
carrier
forwarder
booking
container
origin
port
destination
ETD
ETA
vessel
voyage
cut-offs
events
```

Maps are secondary.

Exceptions are primary.

---

# 51. Logistics Integration

ARCWAY should remain logistics-provider neutral.

Possible integration sources:

* carriers
* freight forwarders
* visibility providers
* DCSA APIs
* manual forwarding
* email extraction

ARCWAY's role is:

> reconcile logistics reality with commercial obligations.

---

# 52. Electronic Bills of Lading

Do NOT build a proprietary closed eBL ecosystem.

Integrate with standards-compliant providers.

DCSA's interoperability architecture already provides mechanisms for multi-platform eBL exchange.

ARCWAY should function as:

```text
Trade Twin
      ↓
eBL Adapter
      ↓
DCSA-compatible provider
```

---

# 53. Assurance Pack

After a release gate passes, ARCWAY can produce an:

# Assurance Pack

Example:

```text
AR-28412
READY TO SHIP

Checked
Sep 17 · 14:42 UTC

Commercial consistency
PASS

Document completeness
PASS

Packing reconciliation
PASS

Booking readiness
PASS

Inspection
PASS

Known warnings
1

Approvals
2
```

The pack includes:

* checks performed
* evidence references
* document versions
* approvals
* timestamps
* hashes where appropriate

---

# 54. Assurance Pack Is NOT a Legal Certificate

Important.

It means:

> ARCWAY ran the specified checks against the available evidence and configured policies.

It does not mean:

> Government-approved / legally guaranteed.

This distinction must be explicit.

---

# 55. Why Assurance Packs Matter

Today a bank, forwarder or buyer may repeat validation because they do not trust upstream preparation.

Over time, ARCWAY can create standardized evidence that downstream participants can consume.

That is the bridge from:

**software**

to:

**network trust infrastructure**.

---

# 56. Partner Collaboration Without Cold Start

The second party does NOT need a paid account.

Example:

```text
NordHaus requests confirmation
for PO 91822.

[Open securely]
```

Supplier can:

```text
Confirm quantity
Confirm cargo-ready date
Upload document
Answer question
Approve change
```

No onboarding ceremony.

---

# 57. Guest Collaboration

Guest access uses:

* secure magic links
* optional OTP
* expiration
* scoped permissions
* full audit logging

Guest only sees the relevant:

```text
trade
document
request
```

not the customer's workspace.

---

# 58. Partner Conversion Loop

After repeated interactions:

```text
You currently have

8 active trades
3 customers

inside ARCWAY.
```

Offer:

# Create your free Partner Workspace

Benefits:

* one inbox
* reusable company profile
* document history
* status updates
* fewer repetitive requests

The network grows because the second party receives utility.

Not because ARCWAY demands membership.

---

# 59. Free Partner Workspace

Partner workspaces should remain free initially.

This is strategic.

Charging every supplier destroys network adoption.

Revenue comes primarily from organizations orchestrating trades.

---

# 60. Relationship Privacy

Do NOT expose universal public supplier performance scores initially.

Buyer A sees performance derived from Buyer A's relationship.

Supplier sees its own metrics.

Buyer B cannot see Buyer A's proprietary history.

Over time, suppliers may voluntarily expose selected verified credentials.

---

# 61. Persistent Network Identity

Later, organizations may claim a verified network identity.

```text
Delta Manufacturing Ltd.

Verified Entity

Bangladesh

Trade connections
27

Verified identifiers
✓
```

Commercial information remains permissioned.

---

# 62. Trade Graph

As ARCWAY grows, it accumulates relationships among:

```text
organizations
products
trade orders
obligations
documents
shipments
payments
routes
ports
exceptions
resolutions
```

This becomes the real long-term data moat.

---

# 63. AI Strategy

ARCWAY is AI-native.

It is NOT AI-dependent.

Use AI where information is:

* unstructured
* ambiguous
* language-heavy
* visual
* predictive

Use deterministic code where information is:

* numeric
* rule-based
* financial
* date-sensitive
* stateful

---

# 64. AI Capability 1 — Extraction

Extract:

```text
PO
Invoice
Packing list
LC
Email
Booking
Certificate
Inspection report
```

into structured fields.

Every field receives:

```text
value
confidence
source
location
model version
timestamp
```

---

# 65. AI Capability 2 — Entity Resolution

Determine:

```text
"Nord Haus GmbH"

"NORDHAUS"

"NordHaus Germany"
```

may be the same entity.

Never silently merge low-confidence entities.

---

# 66. AI Capability 3 — Trade Linking

Determine which trade an incoming document/email belongs to using:

* references
* buyer
* supplier
* product
* amount
* dates
* shipment references

Provide confidence.

---

# 67. AI Capability 4 — Commitment Extraction

From:

> We can deliver the revised 20,000 units by Friday.

extract:

```text
quantity
20,000

commitment
cargo ready

date
Friday

actor
supplier
```

Human review where consequential.

---

# 68. AI Capability 5 — Explanation

Example:

```text
Why is this trade blocked?
```

ARCWAY:

> The packing list shows 23,800 units while the buyer PO and commercial invoice show 24,000. The current shipping instruction also references 24,000. Resolve the final packed quantity before document issuance.

The explanation derives from actual evidence.

---

# 69. AI Capability 6 — Drafting

Generate context-aware messages:

```text
Ask supplier
Request correction
Notify buyer
Ask forwarder
Request bank clarification
```

Human remains sender unless configured automation permits otherwise.

---

# 70. AI Capability 7 — Predictive Risk

Models may eventually predict:

* production delay
* booking risk
* document rework
* payment delay

Models require:

* calibration
* explanation
* monitoring
* versioning

---

# 71. AI Guardrails

No important AI result may exist without provenance.

Requirements:

```text
confidence
source
reasoning summary
model
version
timestamp
human override
```

Low-confidence states should say:

> I don't have enough evidence.

Never hallucinate missing trade facts.

---

# 72. AI Evaluation

Maintain gold datasets for:

* invoices
* packing lists
* POs
* emails
* LCs
* shipping instructions

Measure:

* field accuracy
* line-item accuracy
* entity matching
* trade linking
* exception precision
* exception recall

Production deployment requires regression tests.

---

# 73. False Positive Discipline

Operations teams will abandon ARCWAY if every trade is red.

Therefore:

> alert quality matters more than alert volume.

Measure:

```text
Exception Precision
Critical Alert Precision
User Dismissal Rate
Repeated False Alert Rate
```

The system should learn from confirmed resolutions.

---

# 74. Finance — Strategic Boundary

ARCWAY Software and regulated finance must remain conceptually separate.

ARCWAY initially owns:

```text
order context
document evidence
payment terms
payment status
trade history
risk signals
```

Financial partners own:

```text
money movement
FX
escrow
credit
insurance
regulated underwriting
```

---

# 75. Financial Readiness

ARCWAY may evaluate:

# Is this trade ready to request financing?

That is different from:

> ARCWAY approves credit.

Example:

```text
FINANCE PACK

PO
✓

Buyer
✓

Commercial terms
✓

Production evidence
✓

Shipment
✓

Invoice
✓

Known exceptions
0
```

Then a financing partner decides.

---

# 76. Financial Distribution

Future ARCWAY interface:

```text
Request financing
```

ARCWAY sends structured permissioned data to partners.

Potential revenue:

* referral
* origination
* platform
* revenue share

without holding customer funds.

---

# 77. Regulated Financial Infrastructure

Only consider direct financial infrastructure when:

* network volume is material
* partner economics justify vertical integration
* compliance competence exists
* licenses/capital make strategic sense

This is a separate strategic decision.

Not a normal product feature.

---

# 78. Approval Engine

Organizations configure approvals.

Example:

```text
Discount > 8%
→ Sales Manager
```

```text
Bank account changed
→ Finance + Admin
```

```text
Ship despite critical discrepancy
→ Head of Operations
```

Every override requires:

```text
actor
reason
time
evidence
```

---

# 79. Tasks

ARCWAY tasks should always have context.

Bad:

> Check documents.

Good:

```text
AR-28412

Resolve 200-unit discrepancy
between packing list and PO.

Deadline
14:00

Reason
Shipping instruction cut-off 16:00.
```

---

# 80. Operational Home

The homepage should prioritize:

```text
WHAT NEEDS ME?
```

Then:

```text
WHAT IS AT RISK?
```

Then:

```text
WHAT IS MOVING TODAY?
```

Analytics come later.

---

# 81. Executive View

Executives need a different abstraction.

Example:

```text
$18.4M
OPEN TRADE

$6.2M
READY

$9.8M
IN EXECUTION

$1.7M
AT RISK

$0.7M
BLOCKED
```

Click:

> Why is $0.7M blocked?

ARCWAY shows actual exceptions.

---

# 82. Analytics

Operational metrics:

```text
Clean first-pass rate
Document discrepancy rate
Average resolution time
Shipment delay rate
Trade cycle time
Manual touches
Production variance
Payment delay
```

---

# 83. North-Star Metric

# Clean First-Pass Trades

Definition:

> A trade where ARCWAY ran the relevant preflight before a key external handoff and no preventable discrepancy identified by ARCWAY required downstream correction.

This measures actual outcome.

Not logins.

Not dashboards viewed.

---

# 84. Supporting Outcome Metric

# Prevented Exceptions

Count confirmed critical exceptions resolved before they reached:

* buyer
* carrier
* bank
* customs
* shipment execution

Do not inflate monetary "savings" unless evidence supports the estimate.

---

# 85. Product Metrics

## Activation

```text
Time to first reconstructed Trade Twin

Time to first detected exception

% imported trades reconstructed automatically
```

## Trust

```text
Exception precision
Field extraction accuracy
Manual correction rate
```

## Engagement

```text
Trades preflighted
Exceptions resolved
Partner actions
```

## Retention

```text
Active trade organizations
Trade volume retained
Expansion into native workflows
```

---

# 86. Migration Metric

One unusual metric should matter:

# Native Data Share

```text
Month 1
12%

Month 6
48%

Month 18
78%
```

This measures how much trade data originates inside ARCWAY versus mirrored systems.

The goal is to gradually earn system-of-record status.

---

# 87. Initial ICP

Do not target "all SMEs."

Initial profile:

```text
Exporter / manufacturer-exporter

20–250 employees

Dedicated export/documentation team

20–300 international trades or shipments/month

Multiple buyers

Multiple document types

ERP + Excel + email workflow

Recurring documentation or coordination errors
```

---

# 88. Initial Economic Buyer

Likely:

* COO
* Export Director
* Head of Commercial
* Head of Operations
* CFO
* Owner

depending on company size.

---

# 89. Initial Champion

Likely:

* Export Operations Manager
* Documentation Manager
* Commercial Manager

The champion must personally feel the pain ARCWAY removes.

---

# 90. Initial Vertical Strategy

Do NOT horizontally target every trade industry.

Choose one based on field research.

Score candidate segments against:

```text
Trade frequency
Document complexity
Repetition
Error cost
Payment complexity
Partner count
Existing software quality
Integration difficulty
Sales accessibility
```

Good early candidates may include:

* apparel/home textiles
* plastics
* furniture
* light manufacturing
* consumer goods
* industrial components

Avoid unusually specialized regulated goods initially unless the domain team already understands them deeply.

---

# 91. Corridor Strategy

Choose one corridor.

Example hypothesis:

```text
South Asia
→
EU / UK
```

The exact corridor must be chosen after discovery.

Why corridor concentration matters:

* repeated ports
* repeated banks
* repeated document rules
* repeated buyer requirements
* repeated forwarders
* faster domain learning

---

# 92. Discovery Before Product Expansion

Before adding a new workflow, observe real trades.

Required interviews:

* exporter commercial team
* documentation team
* production
* freight forwarder
* buyer
* bank trade-finance operations
* customs broker

Do not merely ask:

> What features do you want?

Observe actual:

```text
emails
spreadsheets
POs
documents
approvals
handoffs
mistakes
```

---

# 93. Design Partner Program

Recruit a small number of companies whose real trades become product-learning environments.

Requirements:

* recurring trade volume
* willingness to share redacted historical data
* weekly operations access
* domain champion

ARCWAY engineers must watch real operational work.

---

# 94. Initial Product Surface

The initial sellable product should concentrate on:

```text
Trade Inbox

Trade Twins

Preflight

Exception Inbox

Document Workbench

Cross-document comparison

Obligation tracking

Activity / audit

Basic partner requests

Email ingestion

CSV / spreadsheet ingestion
```

Everything else is secondary.

---

# 95. What Is Deliberately NOT Initial

Do NOT initially build:

* ERP replacement
* accounting
* freight marketplace
* customs filing
* direct payments
* FX
* lending
* escrow
* insurance
* public supplier marketplace
* universal supplier rating
* blockchain
* proprietary eBL
* autonomous procurement
* giant workflow builder
* every country
* every vertical

Focus is strategic discipline.

---

# 96. Adoption Ladder

ARCWAY expands through **earned adoption**, not forced migration.

## Level 0 — Mirror

ARCWAY observes.

Customer changes nothing.

## Level 1 — Assurance

Customer trusts Preflight.

## Level 2 — Action

Customer resolves exceptions inside ARCWAY.

## Level 3 — Creation

Customer begins creating selected data/documents inside ARCWAY.

## Level 4 — Coordination

Partners begin interacting through ARCWAY.

## Level 5 — Record

ARCWAY becomes authoritative for the Trade Order.

## Level 6 — Network

Organizations reuse identities and collaborate across trades.

## Level 7 — Transaction Infrastructure

Financial/logistics services plug into the network.

## Level 8 — Autonomous Execution

Policy-bound agents perform routine actions.

---

# 97. Promotion Gate: Mirror → Assurance

Do not move forward until:

* reconstruction accuracy is high
* customer trusts Trade Twins
* exceptions find genuine problems
* false positives are controlled

---

# 98. Promotion Gate: Assurance → Action

Do not expand workflow until users repeatedly:

* open exceptions
* resolve them
* assign owners
* approve corrections

ARCWAY should first become the place problems are fixed.

---

# 99. Promotion Gate: Action → Record

Only move native creation into ARCWAY when customers say:

> We're already fixing everything here. Why are we still updating Excel?

That is the migration moment.

---

# 100. Promotion Gate: Record → Network

Do not force network functionality until:

* significant trade volume is native
* external partners repeatedly interact
* partner reuse appears organically

---

# 101. Promotion Gate: Network → Finance

Only add financial distribution when ARCWAY possesses enough trustworthy structured trade information to improve:

* application preparation
* risk context
* processing time

---

# 102. Network Flywheel

```text
CUSTOMER
connects trades
    ↓
ARCWAY
creates assurance
    ↓
CUSTOMER
invites partner for one action
    ↓
PARTNER
gets utility without setup
    ↓
PARTNER
interacts repeatedly
    ↓
PARTNER
claims free workspace
    ↓
PARTNER
brings additional relationships
```

This is stronger than:

> Join our marketplace.

---

# 103. Data Flywheel

```text
More trades
↓
More exceptions
↓
More resolutions
↓
Better rules
↓
Better extraction
↓
Better predictions
↓
More trust
↓
More trades
```

---

# 104. Long-Term Moat

ARCWAY's defensibility should compound through:

## 1. Operational context

How real trades actually work.

## 2. Relationship rules

Buyer/supplier-specific requirements.

## 3. Exception corpus

What actually goes wrong.

## 4. Resolution corpus

How humans fix it.

## 5. Trade Graph

Connections between actors, goods, documents and events.

## 6. Network

Recurring participants.

## 7. Standards integrations

Infrastructure connectivity.

## 8. Financial relationships

If later justified.

AI models alone are not the moat.

---

# 105. Interoperability Strategy

ARCWAY must prefer standards over proprietary formats.

Relevant ecosystems include:

* UN/CEFACT
* DCSA
* ICC DSI
* MLETR-compatible platforms
* WCO-aligned models
* UN/LOCODE
* ISO currency/country codes
* carrier APIs

---

# 106. Key Trade Data

ICC's Key Trade Documents and Data Elements work analyzed 36 key trade documents.

ARCWAY should use such industry mapping as reference when designing canonical fields rather than inventing disconnected document schemas.

The internal philosophy:

# Data first. Documents are views over data.

---

# 107. External System Architecture

Provider adapters:

```text
EmailProvider

StorageProvider

ERPProvider

CarrierProvider

VisibilityProvider

EBLProvider

ComplianceProvider

PaymentProvider

FinanceProvider

IdentityProvider
```

Core business logic must not depend directly on one vendor.

---

# 108. API-First Future

Everything important should eventually be addressable through an API.

Examples:

```text
create Trade Twin

submit evidence

run preflight

resolve exception

read readiness

create partner request

receive event
```

---

# 109. Event Architecture

Canonical events:

```text
trade.created

trade.updated

evidence.received

document.issued

obligation.created

obligation.fulfilled

exception.detected

exception.resolved

gate.blocked

gate.ready

shipment.updated

payment.recorded
```

Use stable schemas and versioning.

---

# 110. Technical Architecture

Start with a modular monolith plus independent workers.

Do NOT begin with dozens of microservices.

Recommended domains:

```text
Identity

Organizations

Counterparties

Products

Trades

Obligations

Evidence

Documents

Preflight

Exceptions

Execution

Logistics

Settlement

Policies

Collaboration

Integrations

AI

Analytics

Audit
```

---

# 111. Recommended Stack

## Web

```text
Next.js 16+
React 19
TypeScript
Tailwind CSS
Radix UI
Framer Motion
```

## Core application

```text
TypeScript
Node.js
Domain-oriented service layer
```

## Database

```text
PostgreSQL
```

## Cache

```text
Redis
```

## Object storage

```text
S3-compatible
```

## Search

```text
OpenSearch
```

or equivalent when needed.

## Durable workflows

```text
Temporal
```

Trade processes run for weeks/months.

A durable workflow engine is more appropriate than ad-hoc cron logic for critical long-running processes.

## Background processing

Dedicated workers for:

* documents
* extraction
* integrations
* rules
* analytics

## Observability

```text
OpenTelemetry
Sentry
metrics
structured logs
distributed tracing
```

---

# 112. Repository Architecture

```text
apps/
├── web/
├── worker/
└── api/

packages/
├── domain/
│   ├── trade/
│   ├── obligation/
│   ├── document/
│   ├── preflight/
│   ├── exception/
│   └── settlement/
│
├── integrations/
├── workflows/
├── ai/
├── policies/
├── database/
├── events/
├── security/
├── observability/
├── ui/
└── config/
```

Feature/domain boundaries matter more than frontend folder aesthetics.

---

# 113. Core Data Model

Major entities:

```text
Organization

User
Membership
Role
Capability

Counterparty
CounterpartyRelationship

Product
ProductVariant
ProductClassification

Trade
TradeLine
TradeRevision

TradeAgreement
TradeDelivery
TradeSettlement

Obligation
ObligationDependency

Evidence
EvidenceSource
EvidenceField

Document
DocumentVersion
DocumentSnapshot

Shipment
ShipmentLeg
ShipmentAllocation
TrackingEvent

PaymentTerm
PaymentRecord

Policy
PolicyVersion
Rule

PreflightRun
PreflightCheck
GateResult

Exception
ExceptionEvidence
Resolution

Approval

PartnerRequest

Comment
Activity

Integration
ExternalReference

AuditRecord
```

---

# 114. State Model

Never create one giant:

```text
trade.status
```

Maintain independent dimensions.

```text
commercial_state

execution_state

document_state

logistics_state

settlement_state

assurance_state
```

Overall presentation can be derived.

---

# 115. Temporal Data

Trade facts change.

ARCWAY must support temporal questions:

> What did we believe on September 12?

Therefore significant records need:

```text
valid_from
valid_to

observed_at
recorded_at
source
```

Historical truth matters.

---

# 116. Audit Model

Critical actions must be auditable.

Store:

```text
actor
organization
action
object
before
after
reason
timestamp
source IP/device where appropriate
```

Do not allow privileged users to erase audit history casually.

---

# 117. Permission Architecture

Use capabilities.

Examples:

```text
trade.view

trade.edit

document.issue

exception.override

partner.invite

finance.view

bank_details.edit

policy.manage

audit.view
```

Avoid role checks scattered throughout application code.

---

# 118. External Partner Permissions

Guest users may receive permissions as narrow as:

```text
trade:AR28412

read:
production schedule

write:
cargo_ready_date

upload:
packing_list
```

This is crucial for network privacy.

---

# 119. Security Requirements

Minimum architecture:

* tenant isolation
* MFA
* SSO-ready
* encryption in transit
* encryption at rest
* least privilege
* scoped tokens
* signed file links
* secret management
* malware scanning
* upload validation
* rate limiting
* webhook signing
* audit logging
* backup
* disaster recovery
* incident response

---

# 120. Sensitive Data

Trade data may contain:

* pricing
* customer lists
* bank information
* contracts
* supplier relationships
* proprietary product details

Security must be a sales feature.

---

# 121. AI Data Controls

Organizations should control:

```text
Allowed AI providers

Data retention policy

Regional processing

PII redaction

Model training permission

Private-model routing
```

Default:

> customer trade data is not used to train public models.

---

# 122. Compliance Roadmap

ARCWAY should architect for:

* GDPR
* SOC 2
* ISO 27001
* data residency

Do not market certification until certification exists.

---

# 123. UX Philosophy

ARCWAY should feel:

> calm during complexity.

Inspiration:

* Linear precision
* Stripe clarity
* institutional finance trust
* high-quality logistics spatial interfaces

Avoid:

* excessive gradients
* glassmorphism
* fake AI sparkles
* dozens of KPI cards
* unnecessary animations

---

# 124. Design System

Primary surfaces:

```text
Warm neutral canvas

White / dark graphite surfaces

Navy / deep ink navigation

Controlled blue interactive state
```

Semantic:

```text
Ready      Green

Warning    Amber

Blocked    Red

Information Blue

Unknown    Gray
```

Colors communicate state.

Not decoration.

---

# 125. Layout System

Different workflows deserve different layouts.

Use:

```text
Exception feed

Trade timeline

Split document workbench

Comparison matrix

Critical path timeline

Operational data table

Shipment map

Evidence drawer

Approval panel

Audit timeline
```

No repetitive dashboard-template UI.

---

# 126. Motion

Motion explains state changes.

Examples:

* new exception enters queue
* issue resolves
* readiness gate changes
* data source updates
* affected documents highlight

No cinematic scrolling inside operational software.

Marketing website can be more expressive.

---

# 127. Mobile

Mobile targets action.

Key workflows:

```text
Review exception

Approve change

Upload evidence

Confirm date

View trade

Respond to request

Capture document/photo
```

Do not cram the full desktop product onto a phone.

---

# 128. Search

Universal search across:

```text
Trade IDs
PO numbers
buyer
supplier
product
invoice
container
booking
document
shipment
```

Results should understand operational context.

---

# 129. Command Palette

Examples:

```text
Open AR-28412

Run shipment preflight

Create partner request

Upload packing list

Resolve exception

Search NordHaus
```

---

# 130. Integration Philosophy

A customer should not hear:

> Replace your ERP first.

ARCWAY integrates.

Initial easy paths:

```text
CSV/XLSX
Email
Drive
API
```

Enterprise paths:

```text
SAP
Oracle
Dynamics
NetSuite
Odoo
custom ERP
```

---

# 131. Spreadsheet Import

Import must be excellent.

AI suggests mapping:

```text
Your column             ARCWAY

Buyer                   Counterparty
PO                      Buyer Order Reference
ETD                     Planned Departure
Amount                  Trade Value
Status                  External Status
```

User confirms.

Mapping is reusable.

---

# 132. Pricing Philosophy

Do NOT punish collaboration.

External partners should generally be free.

Avoid charging primarily per seat.

Pricing should correlate with trade value:

* active trades
* preflight runs
* document volume
* integrations
* advanced policy packs

---

# 133. Pricing Hypothesis

Test rather than declare permanently.

Possible structure:

### Starter

Small exporters.

Base subscription + included trade volume.

### Growth

Higher trade volume + automation + integrations.

### Business

Multiple teams + advanced controls + SSO + policy packs.

### Enterprise

Custom security/data/integration requirements.

Premium add-ons:

* LC Preflight
* advanced integrations
* private AI
* advanced audit
* finance-ready packs

---

# 134. Sales Motion

The first sale should begin with proof.

### Step 1

Historical Trade Audit.

### Step 2

Show errors ARCWAY found.

### Step 3

Shadow mode on current trades.

### Step 4

Measure prevented exceptions.

### Step 5

Convert to recurring software.

This is more compelling than:

> Would you like a demo of our dashboard?

---

# 135. ROI Story

ARCWAY should eventually report verified outcomes such as:

```text
THIS MONTH

41 discrepancies caught before handoff

11 blocked release risks resolved

19 missing obligations surfaced

Median exception resolution
2h 18m

Clean first-pass rate
94.2%
```

Avoid fictional monetary savings.

---

# 136. Competitive Positioning

## Against documentation software

ARCWAY does not merely create matching documents.

It verifies the entire Trade Twin across:

* agreement
* execution
* logistics
* documents
* settlement

## Against Flexport

ARCWAY is logistics-provider neutral and begins before logistics execution.

## Against Infor Nexus

ARCWAY's entry model is lightweight assurance for SME/mid-market operators rather than large-enterprise network transformation.

## Against ERP

ERP owns internal business records.

ARCWAY owns cross-system trade coherence.

---

# 137. Category Creation

The category should not initially be:

> Global Trade Management.

Too broad.

Use:

# Trade Assurance

Possible explanation:

> Trade Assurance continuously verifies the data, evidence and obligations behind an international transaction before critical handoffs occur.

If ARCWAY owns this category, it gets a much sharper market position.

---

# 138. Brand Message Hierarchy

## Homepage

# Every trade. Checked before it moves.

Supporting:

> ARCWAY catches document conflicts, missed obligations and shipment risks across your existing email, spreadsheets and systems.

CTA:

**Run a Trade Audit**

Secondary:

**See Preflight**

---

# 139. Customer Story

The best demo:

### Incoming

Buyer emails PO.

ARCWAY automatically creates Trade Twin.

### Agreement

ARCWAY compares PO with accepted quotation.

Finds:

```text
Unit price conflict
```

Team resolves.

### Production

Supplier email changes cargo-ready date.

ARCWAY detects:

```text
Current vessel cut-off at risk.
```

Operations moves booking.

### Shipment Preflight

ARCWAY compares:

```text
PO
Invoice
Packing List
Shipping Instruction
Booking
```

Finds:

```text
200-unit discrepancy.
```

Team fixes invoice/packing data.

### Presentation

LC Preflight finds:

```text
Insurance certificate missing.
```

Document uploaded.

### Result

```text
READY FOR PRESENTATION
```

One demo communicates the entire wedge.

---

# 140. Product Maturity Stage 0 — Trade Assurance

This is the entry business.

Required:

```text
Shadow mode
Trade Twins
Email/file ingestion
Document extraction
Cross-source reconciliation
Obligation graph
Preflight gates
Exception inbox
Resolution
Audit trail
```

### Exit criteria

Do not advance because six months passed.

Advance when:

* Trade Twins reconstruct reliably
* users trust preflight
* critical exception precision is excellent
* customers pay for assurance alone
* measurable downstream rework decreases

---

# 141. Product Maturity Stage 1 — System of Action

ARCWAY becomes where issues are resolved.

Add:

```text
tasks
approvals
partner requests
structured clarification
limited workflow automation
```

### Exit criteria

A meaningful percentage of operational exceptions are resolved inside ARCWAY.

---

# 142. Product Maturity Stage 2 — System of Record

Customers begin creating authoritative trade data natively.

Add:

```text
quotation
Trade Order
selected documents
product master
counterparty master
production milestones
```

### Exit criteria

Native Data Share becomes dominant among mature customers.

---

# 143. Product Maturity Stage 3 — Trade Network

Persistent cross-company collaboration appears.

Add:

```text
free Partner Workspace
verified organization identity
cross-company inbox
standardized exchange
network APIs
```

### Exit criteria

Partners participate across multiple customer relationships without being individually re-onboarded.

---

# 144. Product Maturity Stage 4 — Financial Distribution

Integrate:

```text
payments
FX
insurance
trade finance
```

through regulated partners.

ARCWAY remains the data/orchestration layer.

### Exit criteria

ARCWAY materially reduces partner underwriting/processing friction.

---

# 145. Product Maturity Stage 5 — Transaction Infrastructure

Only if economically and regulatorily justified:

ARCWAY may vertically integrate selected financial capabilities.

This requires an entirely separate regulatory strategy.

---

# 146. Product Maturity Stage 6 — Autonomous Trade

At sufficient trust:

agents can execute bounded work.

Examples:

```text
prepare document correction

request cargo-ready update

request freight quotes

compare bookings

prepare presentation pack
```

Humans retain approval where policy requires it.

---

# 147. Agent Identity

Every autonomous agent requires:

```text
identity

owner

permissions

tools

budget

data access

approval thresholds

audit
```

Example:

```text
Freight Agent

CAN
request quotes

CAN
compare options

CANNOT
commit > $5,000

REQUIRES APPROVAL
cost increase > 8%
```

Agent governance emerges naturally from ARCWAY's existing permission model.

---

# 148. Future Agent-to-Agent Trade

Eventually:

```text
Buyer Agent
      ↓
Seller Agent
      ↓
Production Agent
      ↓
Freight Agent
      ↓
Compliance Agent
      ↓
Finance Agent
```

All act on the same Trade Twin.

ARCWAY does not need to speculate on that market today.

It earns the position through existing human trade.

---

# 149. Strategic Kill Tests

ARCWAY should be killed or radically changed if field evidence shows:

### Kill Test 1

Export teams do not care enough about preventable trade errors to pay.

### Kill Test 2

ARCWAY cannot reconstruct trades accurately without excessive manual work.

### Kill Test 3

Exception false positives overwhelm operators.

### Kill Test 4

Existing ERP/logistics/document systems already solve the target segment's problems sufficiently.

### Kill Test 5

Customer data access/security objections make Shadow Mode impractical.

### Kill Test 6

Buyers require months of implementation before meaningful value.

These are real falsification criteria.

---

# 150. Product Principles

Every feature must satisfy at least one:

### Prevent

Does it prevent an expensive mistake?

### Clarify

Does it make the real trade state more trustworthy?

### Accelerate

Does it eliminate manual coordination?

### Prove

Does it create useful evidence?

### Connect

Does it reduce repeated work between companies?

If not:

do not build it.

---

# 151. The Five Things ARCWAY Must Be Best in the World At

ARCWAY does not need to be best at every trade function.

It must be exceptional at:

## 1. Trade Reconstruction

Turn fragmented information into a trustworthy Trade Twin.

## 2. Cross-Source Reconciliation

Detect when reality disagrees with itself.

## 3. Readiness / Preflight

Know whether a trade can safely move to its next gate.

## 4. Exception Resolution

Turn a discovered problem into a clear action.

## 5. Evidence / Provenance

Show exactly why ARCWAY believes what it believes.

Everything else supports those five.

---

# 152. Final Strategic Definition

ARCWAY begins as:

# A Trade Assurance Layer.

It becomes:

# A Trade System of Action.

Then:

# A Trade System of Record.

Then:

# A Global Trade Network.

Eventually:

# Infrastructure through which humans and agents conduct international trade.

The sequence matters.

Trying to start at the end destroys the company.

---

# 153. Final Product Definition

> **ARCWAY creates a continuously synchronized digital twin of every international trade, understands the obligations and evidence behind it, detects conflicts across the systems and documents involved, and verifies readiness before critical commercial, logistics and financial handoffs.**

That is the company.

---

# 154. Final Build Directive

Build ARCWAY's initial product as a production-quality **Trade Assurance Platform**, not as a broad global-trade dashboard.

The product must center on:

* Trade Twin reconstruction
* evidence provenance
* obligation modeling
* source conflict detection
* Preflight release gates
* cross-document reconciliation
* exception prioritization
* resolution workflows
* immutable document snapshots
* change-impact analysis
* email/file ingestion
* shadow-mode onboarding
* partner requests
* auditability

Use realistic international-trade seed data with intentionally messy conditions:

* conflicting quantities
* changing cargo-ready dates
* multiple invoice versions
* missing certificates
* PO amendments
* packing discrepancies
* inconsistent Incoterms
* booking cut-offs
* LC presentation requirements
* duplicate counterparties
* ambiguous emails

The UI must demonstrate ARCWAY's core value visibly.

A user should be able to watch the platform:

```text
ingest messy trade data
        ↓
construct a Trade Twin
        ↓
identify contradictions
        ↓
explain their impact
        ↓
assign required action
        ↓
resolve them
        ↓
rerun Preflight
        ↓
move from BLOCKED to READY
```

Do not spend primary design effort on generic analytics dashboards.

Build exceptional:

* Trade Inbox
* Trade Workspace
* Preflight
* Exception Inbox
* Document Workbench
* Comparison Matrix
* Obligation Timeline
* Evidence/Activity History
* Partner Request Experience
* Executive Risk View

Use:

**Next.js + React + TypeScript + Tailwind CSS** for the web application, with modular domain architecture, PostgreSQL, durable background workflows, secure object storage, complete auditability, provider abstractions, deterministic rule evaluation and carefully bounded AI extraction/reasoning.

The system must preserve:

* source provenance
* historical truth
* document immutability
* tenant isolation
* granular permissions
* explainable automated decisions

External carrier, ERP, bank, compliance, eBL and AI integrations may initially be mocked behind realistic adapters.

Do not build placeholder pages for speculative future businesses merely to make the project appear larger.

The initial implementation should look narrower than the previous Trade OS concept but feel dramatically deeper.

The user viewing the demo should immediately understand:

> **ARCWAY knows whether this trade is actually ready—and can prove why.**

That is the standard.

---

# Final North Star

ARCWAY should not aspire to become:

> software where companies record international trade.

It should aspire to become:

# **the trust layer that every international trade passes through before goods, documents or money move.**

If ARCWAY achieves that position, the operating system, network, financial distribution and eventually autonomous trade all become logical consequences rather than speculative feature expansion.
