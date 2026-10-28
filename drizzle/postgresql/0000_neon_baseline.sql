CREATE TYPE "public"."approvals_status_enum" AS ENUM('pending', 'approved', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."counterparties_status_enum" AS ENUM('active', 'inactive', 'needs_review');--> statement-breakpoint
CREATE TYPE "public"."evidence_fields_authority_enum" AS ENUM('canonical', 'authoritative', 'supporting', 'conflicting');--> statement-breakpoint
CREATE TYPE "public"."generated_documents_status_enum" AS ENUM('draft', 'issued', 'voided');--> statement-breakpoint
CREATE TYPE "public"."guest_access_grants_status_enum" AS ENUM('active', 'expired', 'revoked', 'completed');--> statement-breakpoint
CREATE TYPE "public"."integration_run_attempts_status_enum" AS ENUM('running', 'completed', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."integration_runs_status_enum" AS ENUM('queued', 'running', 'completed', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."integrations_provider_type_enum" AS ENUM('email', 'storage', 'erp', 'carrier', 'visibility', 'ebl', 'compliance', 'payment', 'finance', 'identity');--> statement-breakpoint
CREATE TYPE "public"."integrations_status_enum" AS ENUM('disconnected', 'connected', 'degraded', 'paused');--> statement-breakpoint
CREATE TYPE "public"."memberships_role_enum" AS ENUM('trader', 'reviewer');--> statement-breakpoint
CREATE TYPE "public"."obligation_dependencies_dependency_type_enum" AS ENUM('blocks_release', 'blocks_task', 'evidence_prerequisite');--> statement-breakpoint
CREATE TYPE "public"."obligation_templates_criticality_enum" AS ENUM('critical', 'warning', 'information');--> statement-breakpoint
CREATE TYPE "public"."organization_controls_pii_redaction_enum" AS ENUM('off', 'on_upload', 'on_model_request');--> statement-breakpoint
CREATE TYPE "public"."organization_controls_public_model_training_enum" AS ENUM('disallowed', 'allowed');--> statement-breakpoint
CREATE TYPE "public"."organization_controls_require_mfa_enum" AS ENUM('disabled', 'required');--> statement-breakpoint
CREATE TYPE "public"."partner_requests_status_enum" AS ENUM('sent', 'viewed', 'responded', 'accepted', 'completed', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_records_status_enum" AS ENUM('expected', 'received', 'overdue', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."payment_terms_method_enum" AS ENUM('open_account', 'advance', 'letter_of_credit', 'documentary_collection', 'other');--> statement-breakpoint
CREATE TYPE "public"."policy_obligation_bindings_relationship_role_enum" AS ENUM('buyer', 'supplier', 'forwarder', 'carrier', 'bank', 'inspector', 'any');--> statement-breakpoint
CREATE TYPE "public"."policy_obligation_bindings_status_enum" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."policy_packs_scope_enum" AS ENUM('company', 'counterparty', 'product', 'route', 'payment', 'transport', 'jurisdiction');--> statement-breakpoint
CREATE TYPE "public"."policy_packs_status_enum" AS ENUM('draft', 'active', 'retired');--> statement-breakpoint
CREATE TYPE "public"."preflight_runs_status_enum" AS ENUM('ready', 'ready_with_warnings', 'at_risk', 'blocked', 'insufficient_data');--> statement-breakpoint
CREATE TYPE "public"."preflight_waivers_decision_enum" AS ENUM('active', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."shipments_mode_enum" AS ENUM('sea', 'air', 'road', 'rail', 'multimodal');--> statement-breakpoint
CREATE TYPE "public"."shipments_status_enum" AS ENUM('planned', 'booked', 'in_transit', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."source_ingestion_receipts_normalized_status_enum" AS ENUM('queued', 'normalized', 'failed', 'replayed');--> statement-breakpoint
CREATE TYPE "public"."source_ingestion_receipts_routing_status_enum" AS ENUM('pending', 'routed', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."source_ingestion_receipts_source_type_enum" AS ENUM('email_attachment', 'structured_file', 'webhook');--> statement-breakpoint
CREATE TYPE "public"."trade_documents_document_type_enum" AS ENUM('commercial invoice', 'packing list', 'bill of lading', 'certificate of origin', 'inspection certificate', 'LC/payment terms');--> statement-breakpoint
CREATE TYPE "public"."trade_documents_status_enum" AS ENUM('pending', 'uploaded', 'under review', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."trade_exceptions_category_enum" AS ENUM('commercial', 'documentation', 'execution', 'logistics', 'settlement', 'compliance');--> statement-breakpoint
CREATE TYPE "public"."trade_exceptions_resolution_outcome_enum" AS ENUM('corrected', 'accepted_with_waiver', 'rejected_source', 'duplicate', 'not_actionable');--> statement-breakpoint
CREATE TYPE "public"."trade_exceptions_severity_enum" AS ENUM('critical', 'warning', 'information');--> statement-breakpoint
CREATE TYPE "public"."trade_exceptions_status_enum" AS ENUM('open', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."trade_obligations_criticality_enum" AS ENUM('critical', 'warning', 'information');--> statement-breakpoint
CREATE TYPE "public"."trade_obligations_status_enum" AS ENUM('open', 'fulfilled', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."trade_tasks_status_enum" AS ENUM('open', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."trades_assurance_state_enum" AS ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."trades_commercial_state_enum" AS ENUM('draft', 'confirmed');--> statement-breakpoint
CREATE TYPE "public"."trades_document_state_enum" AS ENUM('pending', 'in_progress', 'complete');--> statement-breakpoint
CREATE TYPE "public"."trades_execution_state_enum" AS ENUM('not_started', 'ready', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."trades_logistics_state_enum" AS ENUM('planned', 'booked', 'in_transit', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."trades_party_kyc_state_enum" AS ENUM('unknown', 'pending', 'verified', 'failed');--> statement-breakpoint
CREATE TYPE "public"."trades_settlement_state_enum" AS ENUM('unconfirmed', 'partial', 'confirmed');--> statement-breakpoint
CREATE TYPE "public"."trades_trust_band_enum" AS ENUM('critical', 'guarded', 'review', 'ready');--> statement-breakpoint
CREATE TYPE "public"."users_role_enum" AS ENUM('trader', 'reviewer');--> statement-breakpoint
CREATE TYPE "public"."workflow_alert_policies_alert_type_enum" AS ENUM('source_failure', 'source_health', 'obligation_sla');--> statement-breakpoint
CREATE TYPE "public"."workflow_alert_policies_severity_enum" AS ENUM('critical', 'warning', 'information');--> statement-breakpoint
CREATE TYPE "public"."workflow_alerts_severity_enum" AS ENUM('critical', 'warning', 'information');--> statement-breakpoint
CREATE TYPE "public"."workflow_alerts_status_enum" AS ENUM('open', 'acknowledged', 'resolved');--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"tradeId" integer,
	"exceptionId" integer,
	"type" varchar(120) NOT NULL,
	"status" "approvals_status_enum" DEFAULT 'pending' NOT NULL,
	"requestedBy" integer NOT NULL,
	"approverId" integer,
	"reason" text NOT NULL,
	"decisionReason" text,
	"evidence" jsonb,
	"decidedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auditRecords" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"actorId" integer,
	"action" varchar(160) NOT NULL,
	"objectType" varchar(120) NOT NULL,
	"objectId" varchar(160) NOT NULL,
	"beforeState" jsonb,
	"afterState" jsonb,
	"reason" text,
	"source" varchar(120) DEFAULT 'application' NOT NULL,
	"sourceIp" varchar(64),
	"device" varchar(255),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "canonicalResolutions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tradeId" integer NOT NULL,
	"fieldName" varchar(120) NOT NULL,
	"selectedEvidenceFieldId" integer,
	"selectedValue" text NOT NULL,
	"conflictingEvidenceFieldIds" jsonb,
	"rationale" text NOT NULL,
	"policyContext" jsonb,
	"resolvedBy" integer NOT NULL,
	"resolvedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"previousResolutionId" integer,
	"active" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "capabilityGrants" (
	"id" serial PRIMARY KEY NOT NULL,
	"membershipId" integer NOT NULL,
	"capability" varchar(120) NOT NULL,
	"grantedBy" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tradeId" integer NOT NULL,
	"exceptionId" integer,
	"parentId" integer,
	"authorId" integer NOT NULL,
	"body" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"editedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "counterparties" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"legalName" varchar(255) NOT NULL,
	"tradingNames" jsonb,
	"countryCode" varchar(2) NOT NULL,
	"taxId" varchar(120),
	"addresses" jsonb,
	"contacts" jsonb,
	"bankDetails" jsonb,
	"defaultTerms" jsonb,
	"documentPreferences" jsonb,
	"requiredCertificates" jsonb,
	"status" "counterparties_status_enum" DEFAULT 'active' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"supersedesCounterpartyId" integer,
	"validFrom" timestamp with time zone DEFAULT now() NOT NULL,
	"validTo" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidenceFields" (
	"id" serial PRIMARY KEY NOT NULL,
	"tradeId" integer NOT NULL,
	"documentId" integer,
	"fieldName" varchar(120) NOT NULL,
	"fieldValue" text NOT NULL,
	"authority" "evidence_fields_authority_enum" DEFAULT 'supporting' NOT NULL,
	"confidence" numeric(5, 4),
	"sourceLocation" jsonb,
	"modelVersion" varchar(120),
	"extractedAt" timestamp with time zone,
	"confirmedBy" integer,
	"confirmedAt" timestamp with time zone,
	"validFrom" timestamp with time zone DEFAULT now() NOT NULL,
	"validTo" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "externalReferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"tradeId" integer,
	"entityType" varchar(100) NOT NULL,
	"providerName" varchar(180) NOT NULL,
	"externalId" varchar(255) NOT NULL,
	"payload" jsonb,
	"observedAt" timestamp with time zone NOT NULL,
	"recordedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "generatedDocuments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tradeId" integer NOT NULL,
	"documentType" varchar(120) NOT NULL,
	"templateVersion" varchar(120) NOT NULL,
	"status" "generated_documents_status_enum" DEFAULT 'draft' NOT NULL,
	"dataSnapshot" jsonb NOT NULL,
	"renderedContent" text NOT NULL,
	"contentHash" varchar(128) NOT NULL,
	"issuedBy" integer,
	"issuedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guestAccessGrants" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"tradeId" integer NOT NULL,
	"recipientEmail" varchar(320) NOT NULL,
	"tokenHash" varchar(255) NOT NULL,
	"scope" jsonb NOT NULL,
	"status" "guest_access_grants_status_enum" DEFAULT 'active' NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"accessedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guestAccessGrants_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
CREATE TABLE "importMappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"sourceName" varchar(180) NOT NULL,
	"entityType" varchar(100) NOT NULL,
	"mapping" jsonb NOT NULL,
	"createdBy" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrationRunAttempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"integrationRunId" integer NOT NULL,
	"attempt" integer NOT NULL,
	"status" "integration_run_attempts_status_enum" NOT NULL,
	"errorMessage" text,
	"detail" jsonb,
	"startedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"completedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "integrationRuns" (
	"id" serial PRIMARY KEY NOT NULL,
	"integrationId" integer NOT NULL,
	"runType" varchar(100) NOT NULL,
	"status" "integration_runs_status_enum" DEFAULT 'queued' NOT NULL,
	"inputSummary" jsonb,
	"outputSummary" jsonb,
	"errorMessage" text,
	"startedAt" timestamp with time zone,
	"completedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"providerType" "integrations_provider_type_enum" NOT NULL,
	"providerName" varchar(180) NOT NULL,
	"status" "integrations_status_enum" DEFAULT 'disconnected' NOT NULL,
	"configuration" jsonb,
	"healthMessage" text,
	"lastSyncedAt" timestamp with time zone,
	"createdBy" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"userId" integer NOT NULL,
	"role" "memberships_role_enum" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "obligationDependencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"obligationId" integer NOT NULL,
	"dependsOnObligationId" integer NOT NULL,
	"dependencyType" "obligation_dependencies_dependency_type_enum" DEFAULT 'blocks_release' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "obligationEscalations" (
	"id" serial PRIMARY KEY NOT NULL,
	"obligationId" integer NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"reason" text NOT NULL,
	"escalatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"acknowledgedAt" timestamp with time zone,
	"escalatedBy" integer
);
--> statement-breakpoint
CREATE TABLE "obligationTemplates" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"name" varchar(180) NOT NULL,
	"actor" varchar(180) NOT NULL,
	"action" varchar(255) NOT NULL,
	"evidenceRequirement" varchar(255),
	"criticality" "obligation_templates_criticality_enum" DEFAULT 'information' NOT NULL,
	"dueOffsetHours" integer,
	"releaseCondition" jsonb,
	"active" integer DEFAULT 1 NOT NULL,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operationalSchedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"scheduleKey" varchar(80) NOT NULL,
	"taskUid" varchar(65),
	"cronExpression" varchar(80) NOT NULL,
	"enabled" integer DEFAULT 1 NOT NULL,
	"lastExecutedAt" timestamp with time zone,
	"lastResult" jsonb,
	"lastError" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "operationalSchedules_scheduleKey_unique" UNIQUE("scheduleKey"),
	CONSTRAINT "operationalSchedules_taskUid_unique" UNIQUE("taskUid")
);
--> statement-breakpoint
CREATE TABLE "organizationControls" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"dataRetentionDays" integer DEFAULT 2555 NOT NULL,
	"allowedAiProviders" jsonb,
	"regionalProcessing" varchar(80) DEFAULT 'default',
	"piiRedaction" "organization_controls_pii_redaction_enum" DEFAULT 'on_model_request' NOT NULL,
	"publicModelTraining" "organization_controls_public_model_training_enum" DEFAULT 'disallowed' NOT NULL,
	"requireMfa" "organization_controls_require_mfa_enum" DEFAULT 'disabled' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizationControls_organizationId_unique" UNIQUE("organizationId")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(180) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "partnerRequests" (
	"id" serial PRIMARY KEY NOT NULL,
	"tradeId" integer NOT NULL,
	"requestedBy" integer NOT NULL,
	"recipientEmail" varchar(320) NOT NULL,
	"requestType" varchar(120) NOT NULL,
	"message" text NOT NULL,
	"status" "partner_requests_status_enum" DEFAULT 'sent' NOT NULL,
	"scope" jsonb,
	"responseSummary" text,
	"responseEvidence" jsonb,
	"respondedAt" timestamp with time zone,
	"dueAt" timestamp with time zone,
	"lastReminderAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"completedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "paymentRecords" (
	"id" serial PRIMARY KEY NOT NULL,
	"tradeId" integer NOT NULL,
	"paymentTermId" integer,
	"amount" numeric(18, 2) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"status" "payment_records_status_enum" DEFAULT 'expected' NOT NULL,
	"evidenceDocumentId" integer,
	"recordedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paymentTerms" (
	"id" serial PRIMARY KEY NOT NULL,
	"tradeId" integer NOT NULL,
	"method" "payment_terms_method_enum" NOT NULL,
	"depositPercent" numeric(5, 2),
	"presentationDays" integer,
	"latestShipmentDate" timestamp with time zone,
	"dueDate" timestamp with time zone,
	"lcReference" varchar(160),
	"specialClauses" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policyObligationBindings" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"policyPackId" integer NOT NULL,
	"obligationTemplateId" integer NOT NULL,
	"counterpartyId" integer,
	"productId" integer,
	"relationshipRole" "policy_obligation_bindings_relationship_role_enum" DEFAULT 'any' NOT NULL,
	"status" "policy_obligation_bindings_status_enum" DEFAULT 'active' NOT NULL,
	"effectiveFrom" timestamp with time zone DEFAULT now() NOT NULL,
	"effectiveTo" timestamp with time zone,
	"source" varchar(180),
	"createdBy" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policyPacks" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"name" varchar(180) NOT NULL,
	"scope" "policy_packs_scope_enum" NOT NULL,
	"status" "policy_packs_status_enum" DEFAULT 'draft' NOT NULL,
	"ownerId" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policyVersions" (
	"id" serial PRIMARY KEY NOT NULL,
	"policyPackId" integer NOT NULL,
	"version" integer NOT NULL,
	"rules" jsonb NOT NULL,
	"effectiveFrom" timestamp with time zone NOT NULL,
	"effectiveTo" timestamp with time zone,
	"source" varchar(180),
	"jurisdiction" varchar(120),
	"createdBy" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preflightRuns" (
	"id" serial PRIMARY KEY NOT NULL,
	"tradeId" integer NOT NULL,
	"gate" varchar(80) NOT NULL,
	"status" "preflight_runs_status_enum" NOT NULL,
	"checks" jsonb NOT NULL,
	"policySnapshot" jsonb,
	"evidenceSnapshot" jsonb,
	"runBy" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preflightWaivers" (
	"id" serial PRIMARY KEY NOT NULL,
	"tradeId" integer NOT NULL,
	"policyVersionId" integer,
	"ruleKey" varchar(160) NOT NULL,
	"reason" text NOT NULL,
	"decision" "preflight_waivers_decision_enum" DEFAULT 'active' NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"approvedBy" integer NOT NULL,
	"approvedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"sku" varchar(120) NOT NULL,
	"buyerSku" varchar(120),
	"description" text NOT NULL,
	"variants" jsonb,
	"countryOfOrigin" varchar(2),
	"hsClassification" varchar(32),
	"dimensions" jsonb,
	"netWeight" numeric(14, 3),
	"grossWeight" numeric(14, 3),
	"packing" jsonb,
	"leadTimeDays" integer,
	"certifications" jsonb,
	"complianceAttributes" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"supersedesProductId" integer,
	"validFrom" timestamp with time zone DEFAULT now() NOT NULL,
	"validTo" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipmentAllocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"shipmentId" integer NOT NULL,
	"tradeId" integer NOT NULL,
	"allocatedQuantity" numeric(18, 3),
	"allocatedValue" numeric(18, 2)
);
--> statement-breakpoint
CREATE TABLE "shipmentEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"shipmentId" integer NOT NULL,
	"eventType" varchar(120) NOT NULL,
	"location" varchar(180),
	"plannedAt" timestamp with time zone,
	"actualAt" timestamp with time zone,
	"source" varchar(80) DEFAULT 'manual' NOT NULL,
	"rawPayload" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"mode" "shipments_mode_enum" NOT NULL,
	"carrier" varchar(180),
	"forwarder" varchar(180),
	"bookingReference" varchar(160),
	"containerReferences" jsonb,
	"origin" varchar(180),
	"destination" varchar(180),
	"etd" timestamp with time zone,
	"eta" timestamp with time zone,
	"vessel" varchar(180),
	"voyage" varchar(120),
	"cutoffs" jsonb,
	"status" "shipments_status_enum" DEFAULT 'planned' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sourceIngestionReceipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"tradeId" integer,
	"integrationId" integer,
	"sourceType" "source_ingestion_receipts_source_type_enum" NOT NULL,
	"fileName" varchar(255),
	"fileKey" varchar(512),
	"fileUrl" varchar(1024),
	"mimeType" varchar(120),
	"payloadHash" varchar(128),
	"rawPayload" jsonb,
	"normalizedStatus" "source_ingestion_receipts_normalized_status_enum" DEFAULT 'queued' NOT NULL,
	"routingStatus" "source_ingestion_receipts_routing_status_enum" DEFAULT 'routed' NOT NULL,
	"routingContext" jsonb,
	"routedAt" timestamp with time zone,
	"routedBy" integer,
	"errorMessage" text,
	"replayCount" integer DEFAULT 0 NOT NULL,
	"receivedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"normalizedAt" timestamp with time zone,
	"createdBy" integer
);
--> statement-breakpoint
CREATE TABLE "tradeDocumentVersions" (
	"id" serial PRIMARY KEY NOT NULL,
	"documentId" integer NOT NULL,
	"tradeId" integer NOT NULL,
	"version" integer NOT NULL,
	"fileName" varchar(255) NOT NULL,
	"fileKey" varchar(512) NOT NULL,
	"fileUrl" varchar(1024) NOT NULL,
	"mimeType" varchar(120) NOT NULL,
	"extractedData" jsonb,
	"inconsistencies" jsonb,
	"source" varchar(80) DEFAULT 'user_upload' NOT NULL,
	"supersededBy" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tradeDocuments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tradeId" integer NOT NULL,
	"documentType" "trade_documents_document_type_enum" NOT NULL,
	"status" "trade_documents_status_enum" DEFAULT 'pending' NOT NULL,
	"fileName" varchar(255),
	"fileKey" varchar(512),
	"fileUrl" varchar(1024),
	"mimeType" varchar(120),
	"extractedData" jsonb,
	"inconsistencies" jsonb,
	"reviewerNotes" text,
	"uploadedBy" integer,
	"reviewedBy" integer,
	"uploadedAt" timestamp with time zone,
	"reviewedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tradeEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"tradeId" integer NOT NULL,
	"actorId" integer,
	"eventType" varchar(80) NOT NULL,
	"title" varchar(255) NOT NULL,
	"detail" text,
	"source" varchar(80) DEFAULT 'application' NOT NULL,
	"beforeState" jsonb,
	"afterState" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tradeExceptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tradeId" integer NOT NULL,
	"documentId" integer,
	"category" "trade_exceptions_category_enum" NOT NULL,
	"severity" "trade_exceptions_severity_enum" NOT NULL,
	"status" "trade_exceptions_status_enum" DEFAULT 'open' NOT NULL,
	"title" varchar(255) NOT NULL,
	"detail" text NOT NULL,
	"resolutionOutcome" "trade_exceptions_resolution_outcome_enum",
	"resolutionRationale" text,
	"resolvedBy" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"resolvedAt" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tradeLines" (
	"id" serial PRIMARY KEY NOT NULL,
	"tradeId" integer NOT NULL,
	"productId" integer,
	"sequence" integer NOT NULL,
	"sku" varchar(120),
	"description" text NOT NULL,
	"quantity" numeric(18, 3) NOT NULL,
	"unit" varchar(32) NOT NULL,
	"unitPrice" numeric(18, 4),
	"totalValue" numeric(18, 2),
	"source" varchar(80) DEFAULT 'canonical' NOT NULL,
	"validFrom" timestamp with time zone DEFAULT now() NOT NULL,
	"validTo" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tradeMessages" (
	"id" serial PRIMARY KEY NOT NULL,
	"tradeId" integer NOT NULL,
	"sender" varchar(320) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"source" varchar(80) DEFAULT 'email' NOT NULL,
	"receivedAt" timestamp with time zone NOT NULL,
	"ingestedBy" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tradeObligations" (
	"id" serial PRIMARY KEY NOT NULL,
	"tradeId" integer NOT NULL,
	"actor" varchar(180) NOT NULL,
	"action" varchar(255) NOT NULL,
	"evidenceRequirement" varchar(255),
	"deadline" timestamp with time zone,
	"criticality" "trade_obligations_criticality_enum" DEFAULT 'information' NOT NULL,
	"status" "trade_obligations_status_enum" DEFAULT 'open' NOT NULL,
	"source" varchar(180),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tradeRevisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"tradeId" integer NOT NULL,
	"version" integer NOT NULL,
	"reason" text NOT NULL,
	"beforeState" jsonb,
	"afterState" jsonb NOT NULL,
	"source" varchar(80) NOT NULL,
	"observedAt" timestamp with time zone,
	"recordedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"recordedBy" integer
);
--> statement-breakpoint
CREATE TABLE "tradeTasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"tradeId" integer NOT NULL,
	"exceptionId" integer,
	"obligationId" integer,
	"title" varchar(255) NOT NULL,
	"detail" text NOT NULL,
	"assigneeId" integer,
	"deadline" timestamp with time zone,
	"status" "trade_tasks_status_enum" DEFAULT 'open' NOT NULL,
	"completedAt" timestamp with time zone,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trades" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" varchar(32) NOT NULL,
	"organizationId" integer,
	"ownerId" integer NOT NULL,
	"buyerName" varchar(180) NOT NULL,
	"buyerCountry" varchar(2) NOT NULL,
	"sellerName" varchar(180) NOT NULL,
	"sellerCountry" varchar(2) NOT NULL,
	"commodity" varchar(240) NOT NULL,
	"quantity" numeric(18, 3) NOT NULL,
	"unit" varchar(24) NOT NULL,
	"unitPrice" numeric(18, 2) NOT NULL,
	"totalValue" numeric(18, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"incoterm" varchar(8) NOT NULL,
	"originCountry" varchar(2) NOT NULL,
	"destinationCountry" varchar(2) NOT NULL,
	"expectedShipmentDate" timestamp with time zone NOT NULL,
	"commercialState" "trades_commercial_state_enum" DEFAULT 'draft' NOT NULL,
	"executionState" "trades_execution_state_enum" DEFAULT 'not_started' NOT NULL,
	"documentState" "trades_document_state_enum" DEFAULT 'pending' NOT NULL,
	"logisticsState" "trades_logistics_state_enum" DEFAULT 'planned' NOT NULL,
	"settlementState" "trades_settlement_state_enum" DEFAULT 'unconfirmed' NOT NULL,
	"assuranceState" "trades_assurance_state_enum" DEFAULT 'draft' NOT NULL,
	"partyKycState" "trades_party_kyc_state_enum" DEFAULT 'pending' NOT NULL,
	"trustScore" integer DEFAULT 0 NOT NULL,
	"trustBand" "trades_trust_band_enum" DEFAULT 'critical' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"submittedAt" timestamp with time zone,
	"resolvedAt" timestamp with time zone,
	CONSTRAINT "trades_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "users_role_enum" DEFAULT 'trader' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "workflowAlertPolicies" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"alertType" "workflow_alert_policies_alert_type_enum" NOT NULL,
	"enabled" integer DEFAULT 1 NOT NULL,
	"severity" "workflow_alert_policies_severity_enum" DEFAULT 'warning' NOT NULL,
	"threshold" integer DEFAULT 1 NOT NULL,
	"updatedBy" integer,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflowAlerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizationId" integer NOT NULL,
	"integrationId" integer,
	"integrationRunId" integer,
	"severity" "workflow_alerts_severity_enum" DEFAULT 'warning' NOT NULL,
	"status" "workflow_alerts_status_enum" DEFAULT 'open' NOT NULL,
	"title" varchar(255) NOT NULL,
	"detail" text NOT NULL,
	"dedupeKey" varchar(180),
	"occurrenceCount" integer DEFAULT 1 NOT NULL,
	"firstSeenAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSeenAt" timestamp with time zone DEFAULT now() NOT NULL,
	"acknowledgedAt" timestamp with time zone,
	"acknowledgedBy" integer,
	"resolvedAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_tradeId_trades_id_fk" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_exceptionId_tradeExceptions_id_fk" FOREIGN KEY ("exceptionId") REFERENCES "public"."tradeExceptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_requestedBy_users_id_fk" FOREIGN KEY ("requestedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approverId_users_id_fk" FOREIGN KEY ("approverId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditRecords" ADD CONSTRAINT "auditRecords_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditRecords" ADD CONSTRAINT "auditRecords_actorId_users_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canonicalResolutions" ADD CONSTRAINT "canres_trade_fk" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canonicalResolutions" ADD CONSTRAINT "canres_evidence_fk" FOREIGN KEY ("selectedEvidenceFieldId") REFERENCES "public"."evidenceFields"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "canonicalResolutions" ADD CONSTRAINT "canres_resolver_fk" FOREIGN KEY ("resolvedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capabilityGrants" ADD CONSTRAINT "capabilityGrants_membershipId_memberships_id_fk" FOREIGN KEY ("membershipId") REFERENCES "public"."memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capabilityGrants" ADD CONSTRAINT "capabilityGrants_grantedBy_users_id_fk" FOREIGN KEY ("grantedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_tradeId_trades_id_fk" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_exceptionId_tradeExceptions_id_fk" FOREIGN KEY ("exceptionId") REFERENCES "public"."tradeExceptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counterparties" ADD CONSTRAINT "counterparties_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counterparties" ADD CONSTRAINT "cp_supersedes_fk" FOREIGN KEY ("supersedesCounterpartyId") REFERENCES "public"."counterparties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidenceFields" ADD CONSTRAINT "evidenceFields_tradeId_trades_id_fk" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidenceFields" ADD CONSTRAINT "evidenceFields_documentId_tradeDocuments_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."tradeDocuments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidenceFields" ADD CONSTRAINT "evidenceFields_confirmedBy_users_id_fk" FOREIGN KEY ("confirmedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "externalReferences" ADD CONSTRAINT "externalReferences_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "externalReferences" ADD CONSTRAINT "externalReferences_tradeId_trades_id_fk" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generatedDocuments" ADD CONSTRAINT "generatedDocuments_tradeId_trades_id_fk" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generatedDocuments" ADD CONSTRAINT "generatedDocuments_issuedBy_users_id_fk" FOREIGN KEY ("issuedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guestAccessGrants" ADD CONSTRAINT "guestAccessGrants_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guestAccessGrants" ADD CONSTRAINT "guestAccessGrants_tradeId_trades_id_fk" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guestAccessGrants" ADD CONSTRAINT "guestAccessGrants_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "importMappings" ADD CONSTRAINT "importMappings_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "importMappings" ADD CONSTRAINT "importMappings_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrationRunAttempts" ADD CONSTRAINT "integrationRunAttempts_integrationRunId_integrationRuns_id_fk" FOREIGN KEY ("integrationRunId") REFERENCES "public"."integrationRuns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrationRuns" ADD CONSTRAINT "integrationRuns_integrationId_integrations_id_fk" FOREIGN KEY ("integrationId") REFERENCES "public"."integrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligationDependencies" ADD CONSTRAINT "obligationDependencies_obligationId_tradeObligations_id_fk" FOREIGN KEY ("obligationId") REFERENCES "public"."tradeObligations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligationDependencies" ADD CONSTRAINT "obligationDependencies_dependsOnObligationId_tradeObligations_id_fk" FOREIGN KEY ("dependsOnObligationId") REFERENCES "public"."tradeObligations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligationEscalations" ADD CONSTRAINT "obligationEscalations_obligationId_tradeObligations_id_fk" FOREIGN KEY ("obligationId") REFERENCES "public"."tradeObligations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligationEscalations" ADD CONSTRAINT "obligationEscalations_escalatedBy_users_id_fk" FOREIGN KEY ("escalatedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligationTemplates" ADD CONSTRAINT "obligationTemplates_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "obligationTemplates" ADD CONSTRAINT "obligationTemplates_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizationControls" ADD CONSTRAINT "organizationControls_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partnerRequests" ADD CONSTRAINT "partnerRequests_tradeId_trades_id_fk" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partnerRequests" ADD CONSTRAINT "partnerRequests_requestedBy_users_id_fk" FOREIGN KEY ("requestedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paymentRecords" ADD CONSTRAINT "paymentRecords_tradeId_trades_id_fk" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paymentRecords" ADD CONSTRAINT "paymentRecords_paymentTermId_paymentTerms_id_fk" FOREIGN KEY ("paymentTermId") REFERENCES "public"."paymentTerms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paymentRecords" ADD CONSTRAINT "paymentRecords_evidenceDocumentId_tradeDocuments_id_fk" FOREIGN KEY ("evidenceDocumentId") REFERENCES "public"."tradeDocuments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paymentTerms" ADD CONSTRAINT "paymentTerms_tradeId_trades_id_fk" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policyObligationBindings" ADD CONSTRAINT "pob_org_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policyObligationBindings" ADD CONSTRAINT "pob_policy_fk" FOREIGN KEY ("policyPackId") REFERENCES "public"."policyPacks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policyObligationBindings" ADD CONSTRAINT "pob_template_fk" FOREIGN KEY ("obligationTemplateId") REFERENCES "public"."obligationTemplates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policyObligationBindings" ADD CONSTRAINT "pob_counterparty_fk" FOREIGN KEY ("counterpartyId") REFERENCES "public"."counterparties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policyObligationBindings" ADD CONSTRAINT "pob_product_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policyObligationBindings" ADD CONSTRAINT "pob_creator_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policyPacks" ADD CONSTRAINT "policyPacks_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policyPacks" ADD CONSTRAINT "policyPacks_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policyVersions" ADD CONSTRAINT "policyVersions_policyPackId_policyPacks_id_fk" FOREIGN KEY ("policyPackId") REFERENCES "public"."policyPacks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policyVersions" ADD CONSTRAINT "policyVersions_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preflightRuns" ADD CONSTRAINT "preflightRuns_tradeId_trades_id_fk" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preflightRuns" ADD CONSTRAINT "preflightRuns_runBy_users_id_fk" FOREIGN KEY ("runBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preflightWaivers" ADD CONSTRAINT "preflightWaivers_tradeId_trades_id_fk" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preflightWaivers" ADD CONSTRAINT "preflightWaivers_policyVersionId_policyVersions_id_fk" FOREIGN KEY ("policyVersionId") REFERENCES "public"."policyVersions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preflightWaivers" ADD CONSTRAINT "preflightWaivers_approvedBy_users_id_fk" FOREIGN KEY ("approvedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "product_supersedes_fk" FOREIGN KEY ("supersedesProductId") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipmentAllocations" ADD CONSTRAINT "shipmentAllocations_shipmentId_shipments_id_fk" FOREIGN KEY ("shipmentId") REFERENCES "public"."shipments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipmentAllocations" ADD CONSTRAINT "shipmentAllocations_tradeId_trades_id_fk" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipmentEvents" ADD CONSTRAINT "shipmentEvents_shipmentId_shipments_id_fk" FOREIGN KEY ("shipmentId") REFERENCES "public"."shipments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sourceIngestionReceipts" ADD CONSTRAINT "sourceIngestionReceipts_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sourceIngestionReceipts" ADD CONSTRAINT "sourceIngestionReceipts_tradeId_trades_id_fk" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sourceIngestionReceipts" ADD CONSTRAINT "sourceIngestionReceipts_integrationId_integrations_id_fk" FOREIGN KEY ("integrationId") REFERENCES "public"."integrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sourceIngestionReceipts" ADD CONSTRAINT "sourceIngestionReceipts_routedBy_users_id_fk" FOREIGN KEY ("routedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sourceIngestionReceipts" ADD CONSTRAINT "sourceIngestionReceipts_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeDocumentVersions" ADD CONSTRAINT "tradeDocumentVersions_documentId_tradeDocuments_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."tradeDocuments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeDocumentVersions" ADD CONSTRAINT "tradeDocumentVersions_tradeId_trades_id_fk" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeDocumentVersions" ADD CONSTRAINT "tradeDocumentVersions_supersededBy_users_id_fk" FOREIGN KEY ("supersededBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeDocuments" ADD CONSTRAINT "tradeDocuments_tradeId_trades_id_fk" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeDocuments" ADD CONSTRAINT "tradeDocuments_uploadedBy_users_id_fk" FOREIGN KEY ("uploadedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeDocuments" ADD CONSTRAINT "tradeDocuments_reviewedBy_users_id_fk" FOREIGN KEY ("reviewedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeEvents" ADD CONSTRAINT "tradeEvents_tradeId_trades_id_fk" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeEvents" ADD CONSTRAINT "tradeEvents_actorId_users_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeExceptions" ADD CONSTRAINT "tradeExceptions_tradeId_trades_id_fk" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeExceptions" ADD CONSTRAINT "tradeExceptions_documentId_tradeDocuments_id_fk" FOREIGN KEY ("documentId") REFERENCES "public"."tradeDocuments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeExceptions" ADD CONSTRAINT "tradeExceptions_resolvedBy_users_id_fk" FOREIGN KEY ("resolvedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeLines" ADD CONSTRAINT "tradeLines_tradeId_trades_id_fk" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeLines" ADD CONSTRAINT "tradeLines_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeMessages" ADD CONSTRAINT "tradeMessages_tradeId_trades_id_fk" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeMessages" ADD CONSTRAINT "tradeMessages_ingestedBy_users_id_fk" FOREIGN KEY ("ingestedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeObligations" ADD CONSTRAINT "tradeObligations_tradeId_trades_id_fk" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeRevisions" ADD CONSTRAINT "tradeRevisions_tradeId_trades_id_fk" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeRevisions" ADD CONSTRAINT "tradeRevisions_recordedBy_users_id_fk" FOREIGN KEY ("recordedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeTasks" ADD CONSTRAINT "tradeTasks_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeTasks" ADD CONSTRAINT "tradeTasks_tradeId_trades_id_fk" FOREIGN KEY ("tradeId") REFERENCES "public"."trades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeTasks" ADD CONSTRAINT "tradeTasks_exceptionId_tradeExceptions_id_fk" FOREIGN KEY ("exceptionId") REFERENCES "public"."tradeExceptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeTasks" ADD CONSTRAINT "tradeTasks_obligationId_tradeObligations_id_fk" FOREIGN KEY ("obligationId") REFERENCES "public"."tradeObligations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeTasks" ADD CONSTRAINT "tradeTasks_assigneeId_users_id_fk" FOREIGN KEY ("assigneeId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tradeTasks" ADD CONSTRAINT "tradeTasks_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflowAlertPolicies" ADD CONSTRAINT "alpol_org_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflowAlertPolicies" ADD CONSTRAINT "alpol_user_fk" FOREIGN KEY ("updatedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflowAlerts" ADD CONSTRAINT "workflowAlerts_organizationId_organizations_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflowAlerts" ADD CONSTRAINT "workflowAlerts_integrationId_integrations_id_fk" FOREIGN KEY ("integrationId") REFERENCES "public"."integrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflowAlerts" ADD CONSTRAINT "workflowAlerts_integrationRunId_integrationRuns_id_fk" FOREIGN KEY ("integrationRunId") REFERENCES "public"."integrationRuns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflowAlerts" ADD CONSTRAINT "workflowAlerts_acknowledgedBy_users_id_fk" FOREIGN KEY ("acknowledgedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "approvals_trade_idx" ON "approvals" USING btree ("tradeId");--> statement-breakpoint
CREATE INDEX "approvals_status_idx" ON "approvals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "audit_records_org_idx" ON "auditRecords" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "audit_records_object_idx" ON "auditRecords" USING btree ("objectType","objectId");--> statement-breakpoint
CREATE INDEX "audit_records_created_idx" ON "auditRecords" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "canonical_resolutions_trade_idx" ON "canonicalResolutions" USING btree ("tradeId");--> statement-breakpoint
CREATE INDEX "canonical_resolutions_field_idx" ON "canonicalResolutions" USING btree ("tradeId","fieldName");--> statement-breakpoint
CREATE INDEX "canonical_resolutions_active_idx" ON "canonicalResolutions" USING btree ("active");--> statement-breakpoint
CREATE UNIQUE INDEX "capability_grant_unique_idx" ON "capabilityGrants" USING btree ("membershipId","capability");--> statement-breakpoint
CREATE INDEX "capability_grant_membership_idx" ON "capabilityGrants" USING btree ("membershipId");--> statement-breakpoint
CREATE INDEX "comments_trade_idx" ON "comments" USING btree ("tradeId");--> statement-breakpoint
CREATE INDEX "counterparties_org_idx" ON "counterparties" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "counterparties_legal_idx" ON "counterparties" USING btree ("legalName");--> statement-breakpoint
CREATE INDEX "counterparties_version_idx" ON "counterparties" USING btree ("organizationId","legalName","version");--> statement-breakpoint
CREATE INDEX "evidence_fields_trade_idx" ON "evidenceFields" USING btree ("tradeId");--> statement-breakpoint
CREATE INDEX "evidence_fields_document_idx" ON "evidenceFields" USING btree ("documentId");--> statement-breakpoint
CREATE UNIQUE INDEX "external_reference_unique_idx" ON "externalReferences" USING btree ("organizationId","providerName","entityType","externalId");--> statement-breakpoint
CREATE INDEX "external_reference_trade_idx" ON "externalReferences" USING btree ("tradeId");--> statement-breakpoint
CREATE INDEX "generated_documents_trade_idx" ON "generatedDocuments" USING btree ("tradeId");--> statement-breakpoint
CREATE INDEX "generated_documents_status_idx" ON "generatedDocuments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "guest_access_trade_idx" ON "guestAccessGrants" USING btree ("tradeId");--> statement-breakpoint
CREATE INDEX "guest_access_org_idx" ON "guestAccessGrants" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "import_mappings_org_idx" ON "importMappings" USING btree ("organizationId");--> statement-breakpoint
CREATE UNIQUE INDEX "integration_attempt_unique_idx" ON "integrationRunAttempts" USING btree ("integrationRunId","attempt");--> statement-breakpoint
CREATE INDEX "integration_attempt_run_idx" ON "integrationRunAttempts" USING btree ("integrationRunId");--> statement-breakpoint
CREATE INDEX "integration_runs_integration_idx" ON "integrationRuns" USING btree ("integrationId");--> statement-breakpoint
CREATE INDEX "integration_runs_status_idx" ON "integrationRuns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "integrations_org_idx" ON "integrations" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "integrations_provider_idx" ON "integrations" USING btree ("providerType");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_unique" ON "memberships" USING btree ("organizationId","userId");--> statement-breakpoint
CREATE UNIQUE INDEX "obligation_dependency_unique_idx" ON "obligationDependencies" USING btree ("obligationId","dependsOnObligationId");--> statement-breakpoint
CREATE INDEX "obligation_dependencies_obligation_idx" ON "obligationDependencies" USING btree ("obligationId");--> statement-breakpoint
CREATE INDEX "obligation_escalations_obligation_idx" ON "obligationEscalations" USING btree ("obligationId");--> statement-breakpoint
CREATE INDEX "obligation_templates_org_idx" ON "obligationTemplates" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "obligation_templates_active_idx" ON "obligationTemplates" USING btree ("active");--> statement-breakpoint
CREATE INDEX "operational_schedules_task_uid_idx" ON "operationalSchedules" USING btree ("taskUid");--> statement-breakpoint
CREATE INDEX "partner_requests_trade_idx" ON "partnerRequests" USING btree ("tradeId");--> statement-breakpoint
CREATE INDEX "payment_records_trade_idx" ON "paymentRecords" USING btree ("tradeId");--> statement-breakpoint
CREATE INDEX "payment_terms_trade_idx" ON "paymentTerms" USING btree ("tradeId");--> statement-breakpoint
CREATE INDEX "policy_obligation_binding_org_idx" ON "policyObligationBindings" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "policy_obligation_binding_policy_idx" ON "policyObligationBindings" USING btree ("policyPackId");--> statement-breakpoint
CREATE INDEX "policy_obligation_binding_counterparty_idx" ON "policyObligationBindings" USING btree ("counterpartyId");--> statement-breakpoint
CREATE INDEX "policy_obligation_binding_product_idx" ON "policyObligationBindings" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "policy_packs_org_idx" ON "policyPacks" USING btree ("organizationId");--> statement-breakpoint
CREATE UNIQUE INDEX "policy_version_idx" ON "policyVersions" USING btree ("policyPackId","version");--> statement-breakpoint
CREATE INDEX "preflight_runs_trade_idx" ON "preflightRuns" USING btree ("tradeId");--> statement-breakpoint
CREATE INDEX "preflight_runs_gate_idx" ON "preflightRuns" USING btree ("gate");--> statement-breakpoint
CREATE INDEX "preflight_waivers_trade_idx" ON "preflightWaivers" USING btree ("tradeId");--> statement-breakpoint
CREATE INDEX "preflight_waivers_policy_idx" ON "preflightWaivers" USING btree ("policyVersionId");--> statement-breakpoint
CREATE INDEX "preflight_waivers_decision_idx" ON "preflightWaivers" USING btree ("decision");--> statement-breakpoint
CREATE UNIQUE INDEX "product_org_sku_idx" ON "products" USING btree ("organizationId","sku","version");--> statement-breakpoint
CREATE INDEX "shipment_allocations_trade_idx" ON "shipmentAllocations" USING btree ("tradeId");--> statement-breakpoint
CREATE INDEX "shipment_events_shipment_idx" ON "shipmentEvents" USING btree ("shipmentId");--> statement-breakpoint
CREATE INDEX "shipments_org_idx" ON "shipments" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "source_receipts_org_idx" ON "sourceIngestionReceipts" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "source_receipts_trade_idx" ON "sourceIngestionReceipts" USING btree ("tradeId");--> statement-breakpoint
CREATE INDEX "source_receipts_status_idx" ON "sourceIngestionReceipts" USING btree ("normalizedStatus");--> statement-breakpoint
CREATE INDEX "source_receipts_routing_idx" ON "sourceIngestionReceipts" USING btree ("routingStatus");--> statement-breakpoint
CREATE INDEX "source_receipts_hash_idx" ON "sourceIngestionReceipts" USING btree ("payloadHash");--> statement-breakpoint
CREATE UNIQUE INDEX "document_version_idx" ON "tradeDocumentVersions" USING btree ("documentId","version");--> statement-breakpoint
CREATE INDEX "document_versions_trade_idx" ON "tradeDocumentVersions" USING btree ("tradeId");--> statement-breakpoint
CREATE UNIQUE INDEX "trade_document_type_idx" ON "tradeDocuments" USING btree ("tradeId","documentType");--> statement-breakpoint
CREATE INDEX "trade_documents_status_idx" ON "tradeDocuments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trade_events_trade_idx" ON "tradeEvents" USING btree ("tradeId");--> statement-breakpoint
CREATE INDEX "trade_events_created_idx" ON "tradeEvents" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "trade_exceptions_trade_idx" ON "tradeExceptions" USING btree ("tradeId");--> statement-breakpoint
CREATE INDEX "trade_exceptions_status_idx" ON "tradeExceptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trade_lines_trade_idx" ON "tradeLines" USING btree ("tradeId");--> statement-breakpoint
CREATE INDEX "trade_messages_trade_idx" ON "tradeMessages" USING btree ("tradeId");--> statement-breakpoint
CREATE INDEX "trade_obligations_trade_idx" ON "tradeObligations" USING btree ("tradeId");--> statement-breakpoint
CREATE UNIQUE INDEX "trade_revision_idx" ON "tradeRevisions" USING btree ("tradeId","version");--> statement-breakpoint
CREATE INDEX "trade_tasks_trade_idx" ON "tradeTasks" USING btree ("tradeId");--> statement-breakpoint
CREATE INDEX "trade_tasks_assignee_idx" ON "tradeTasks" USING btree ("assigneeId");--> statement-breakpoint
CREATE INDEX "trade_tasks_status_idx" ON "tradeTasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trades_owner_idx" ON "trades" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "trades_assurance_idx" ON "trades" USING btree ("assuranceState");--> statement-breakpoint
CREATE UNIQUE INDEX "alert_policy_org_type_idx" ON "workflowAlertPolicies" USING btree ("organizationId","alertType");--> statement-breakpoint
CREATE INDEX "alert_policy_org_idx" ON "workflowAlertPolicies" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "workflow_alert_org_idx" ON "workflowAlerts" USING btree ("organizationId");--> statement-breakpoint
CREATE INDEX "workflow_alert_status_idx" ON "workflowAlerts" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_alert_dedupe_idx" ON "workflowAlerts" USING btree ("organizationId","dedupeKey");