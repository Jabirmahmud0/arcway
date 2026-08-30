CREATE TABLE `approvals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`tradeId` int,
	`exceptionId` int,
	`type` varchar(120) NOT NULL,
	`status` enum('pending','approved','rejected','expired') NOT NULL DEFAULT 'pending',
	`requestedBy` int NOT NULL,
	`approverId` int,
	`reason` text NOT NULL,
	`decisionReason` text,
	`evidence` json,
	`decidedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approvals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tradeId` int NOT NULL,
	`exceptionId` int,
	`parentId` int,
	`authorId` int NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`editedAt` timestamp,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `counterparties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`legalName` varchar(255) NOT NULL,
	`tradingNames` json,
	`countryCode` varchar(2) NOT NULL,
	`taxId` varchar(120),
	`addresses` json,
	`contacts` json,
	`bankDetails` json,
	`defaultTerms` json,
	`documentPreferences` json,
	`requiredCertificates` json,
	`status` enum('active','inactive','needs_review') NOT NULL DEFAULT 'active',
	`validFrom` timestamp NOT NULL DEFAULT (now()),
	`validTo` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `counterparties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidenceFields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tradeId` int NOT NULL,
	`documentId` int,
	`fieldName` varchar(120) NOT NULL,
	`fieldValue` text NOT NULL,
	`authority` enum('canonical','authoritative','supporting','conflicting') NOT NULL DEFAULT 'supporting',
	`confidence` decimal(5,4),
	`sourceLocation` json,
	`modelVersion` varchar(120),
	`extractedAt` timestamp,
	`confirmedBy` int,
	`confirmedAt` timestamp,
	`validFrom` timestamp NOT NULL DEFAULT (now()),
	`validTo` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidenceFields_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paymentRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tradeId` int NOT NULL,
	`paymentTermId` int,
	`amount` decimal(18,2) NOT NULL,
	`currency` varchar(3) NOT NULL,
	`status` enum('expected','received','overdue','disputed') NOT NULL DEFAULT 'expected',
	`evidenceDocumentId` int,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `paymentRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paymentTerms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tradeId` int NOT NULL,
	`method` enum('open_account','advance','letter_of_credit','documentary_collection','other') NOT NULL,
	`depositPercent` decimal(5,2),
	`presentationDays` int,
	`latestShipmentDate` timestamp,
	`dueDate` timestamp,
	`lcReference` varchar(160),
	`specialClauses` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentTerms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `policyPacks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`scope` enum('company','counterparty','product','route','payment','transport','jurisdiction') NOT NULL,
	`status` enum('draft','active','retired') NOT NULL DEFAULT 'draft',
	`ownerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `policyPacks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `policyVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`policyPackId` int NOT NULL,
	`version` int NOT NULL,
	`rules` json NOT NULL,
	`effectiveFrom` timestamp NOT NULL,
	`effectiveTo` timestamp,
	`source` varchar(180),
	`jurisdiction` varchar(120),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `policyVersions_id` PRIMARY KEY(`id`),
	CONSTRAINT `policy_version_idx` UNIQUE(`policyPackId`,`version`)
);
--> statement-breakpoint
CREATE TABLE `preflightRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tradeId` int NOT NULL,
	`gate` varchar(80) NOT NULL,
	`status` enum('ready','ready_with_warnings','at_risk','blocked','insufficient_data') NOT NULL,
	`checks` json NOT NULL,
	`policySnapshot` json,
	`evidenceSnapshot` json,
	`runBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `preflightRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`sku` varchar(120) NOT NULL,
	`buyerSku` varchar(120),
	`description` text NOT NULL,
	`variants` json,
	`countryOfOrigin` varchar(2),
	`hsClassification` varchar(32),
	`dimensions` json,
	`netWeight` decimal(14,3),
	`grossWeight` decimal(14,3),
	`packing` json,
	`leadTimeDays` int,
	`certifications` json,
	`complianceAttributes` json,
	`version` int NOT NULL DEFAULT 1,
	`validFrom` timestamp NOT NULL DEFAULT (now()),
	`validTo` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_org_sku_idx` UNIQUE(`organizationId`,`sku`,`version`)
);
--> statement-breakpoint
CREATE TABLE `shipmentAllocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shipmentId` int NOT NULL,
	`tradeId` int NOT NULL,
	`allocatedQuantity` decimal(18,3),
	`allocatedValue` decimal(18,2),
	CONSTRAINT `shipmentAllocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shipmentEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`shipmentId` int NOT NULL,
	`eventType` varchar(120) NOT NULL,
	`location` varchar(180),
	`plannedAt` timestamp,
	`actualAt` timestamp,
	`source` varchar(80) NOT NULL DEFAULT 'manual',
	`rawPayload` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shipmentEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shipments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`mode` enum('sea','air','road','rail','multimodal') NOT NULL,
	`carrier` varchar(180),
	`forwarder` varchar(180),
	`bookingReference` varchar(160),
	`containerReferences` json,
	`origin` varchar(180),
	`destination` varchar(180),
	`etd` timestamp,
	`eta` timestamp,
	`vessel` varchar(180),
	`voyage` varchar(120),
	`cutoffs` json,
	`status` enum('planned','booked','in_transit','delivered','cancelled') NOT NULL DEFAULT 'planned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shipments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tradeLines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tradeId` int NOT NULL,
	`productId` int,
	`sequence` int NOT NULL,
	`sku` varchar(120),
	`description` text NOT NULL,
	`quantity` decimal(18,3) NOT NULL,
	`unit` varchar(32) NOT NULL,
	`unitPrice` decimal(18,4),
	`totalValue` decimal(18,2),
	`source` varchar(80) NOT NULL DEFAULT 'canonical',
	`validFrom` timestamp NOT NULL DEFAULT (now()),
	`validTo` timestamp,
	CONSTRAINT `tradeLines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tradeRevisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tradeId` int NOT NULL,
	`version` int NOT NULL,
	`reason` text NOT NULL,
	`beforeState` json,
	`afterState` json NOT NULL,
	`source` varchar(80) NOT NULL,
	`observedAt` timestamp,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`recordedBy` int,
	CONSTRAINT `tradeRevisions_id` PRIMARY KEY(`id`),
	CONSTRAINT `trade_revision_idx` UNIQUE(`tradeId`,`version`)
);
--> statement-breakpoint
ALTER TABLE `approvals` ADD CONSTRAINT `approvals_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approvals` ADD CONSTRAINT `approvals_tradeId_trades_id_fk` FOREIGN KEY (`tradeId`) REFERENCES `trades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approvals` ADD CONSTRAINT `approvals_exceptionId_tradeExceptions_id_fk` FOREIGN KEY (`exceptionId`) REFERENCES `tradeExceptions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approvals` ADD CONSTRAINT `approvals_requestedBy_users_id_fk` FOREIGN KEY (`requestedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `approvals` ADD CONSTRAINT `approvals_approverId_users_id_fk` FOREIGN KEY (`approverId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_tradeId_trades_id_fk` FOREIGN KEY (`tradeId`) REFERENCES `trades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_exceptionId_tradeExceptions_id_fk` FOREIGN KEY (`exceptionId`) REFERENCES `tradeExceptions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_authorId_users_id_fk` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `counterparties` ADD CONSTRAINT `counterparties_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidenceFields` ADD CONSTRAINT `evidenceFields_tradeId_trades_id_fk` FOREIGN KEY (`tradeId`) REFERENCES `trades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidenceFields` ADD CONSTRAINT `evidenceFields_documentId_tradeDocuments_id_fk` FOREIGN KEY (`documentId`) REFERENCES `tradeDocuments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evidenceFields` ADD CONSTRAINT `evidenceFields_confirmedBy_users_id_fk` FOREIGN KEY (`confirmedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paymentRecords` ADD CONSTRAINT `paymentRecords_tradeId_trades_id_fk` FOREIGN KEY (`tradeId`) REFERENCES `trades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paymentRecords` ADD CONSTRAINT `paymentRecords_paymentTermId_paymentTerms_id_fk` FOREIGN KEY (`paymentTermId`) REFERENCES `paymentTerms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paymentRecords` ADD CONSTRAINT `paymentRecords_evidenceDocumentId_tradeDocuments_id_fk` FOREIGN KEY (`evidenceDocumentId`) REFERENCES `tradeDocuments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paymentTerms` ADD CONSTRAINT `paymentTerms_tradeId_trades_id_fk` FOREIGN KEY (`tradeId`) REFERENCES `trades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `policyPacks` ADD CONSTRAINT `policyPacks_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `policyPacks` ADD CONSTRAINT `policyPacks_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `policyVersions` ADD CONSTRAINT `policyVersions_policyPackId_policyPacks_id_fk` FOREIGN KEY (`policyPackId`) REFERENCES `policyPacks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `policyVersions` ADD CONSTRAINT `policyVersions_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `preflightRuns` ADD CONSTRAINT `preflightRuns_tradeId_trades_id_fk` FOREIGN KEY (`tradeId`) REFERENCES `trades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `preflightRuns` ADD CONSTRAINT `preflightRuns_runBy_users_id_fk` FOREIGN KEY (`runBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shipmentAllocations` ADD CONSTRAINT `shipmentAllocations_shipmentId_shipments_id_fk` FOREIGN KEY (`shipmentId`) REFERENCES `shipments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shipmentAllocations` ADD CONSTRAINT `shipmentAllocations_tradeId_trades_id_fk` FOREIGN KEY (`tradeId`) REFERENCES `trades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shipmentEvents` ADD CONSTRAINT `shipmentEvents_shipmentId_shipments_id_fk` FOREIGN KEY (`shipmentId`) REFERENCES `shipments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tradeLines` ADD CONSTRAINT `tradeLines_tradeId_trades_id_fk` FOREIGN KEY (`tradeId`) REFERENCES `trades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tradeLines` ADD CONSTRAINT `tradeLines_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tradeRevisions` ADD CONSTRAINT `tradeRevisions_tradeId_trades_id_fk` FOREIGN KEY (`tradeId`) REFERENCES `trades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tradeRevisions` ADD CONSTRAINT `tradeRevisions_recordedBy_users_id_fk` FOREIGN KEY (`recordedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `approvals_trade_idx` ON `approvals` (`tradeId`);--> statement-breakpoint
CREATE INDEX `approvals_status_idx` ON `approvals` (`status`);--> statement-breakpoint
CREATE INDEX `comments_trade_idx` ON `comments` (`tradeId`);--> statement-breakpoint
CREATE INDEX `counterparties_org_idx` ON `counterparties` (`organizationId`);--> statement-breakpoint
CREATE INDEX `counterparties_legal_idx` ON `counterparties` (`legalName`);--> statement-breakpoint
CREATE INDEX `evidence_fields_trade_idx` ON `evidenceFields` (`tradeId`);--> statement-breakpoint
CREATE INDEX `evidence_fields_document_idx` ON `evidenceFields` (`documentId`);--> statement-breakpoint
CREATE INDEX `payment_records_trade_idx` ON `paymentRecords` (`tradeId`);--> statement-breakpoint
CREATE INDEX `payment_terms_trade_idx` ON `paymentTerms` (`tradeId`);--> statement-breakpoint
CREATE INDEX `policy_packs_org_idx` ON `policyPacks` (`organizationId`);--> statement-breakpoint
CREATE INDEX `preflight_runs_trade_idx` ON `preflightRuns` (`tradeId`);--> statement-breakpoint
CREATE INDEX `preflight_runs_gate_idx` ON `preflightRuns` (`gate`);--> statement-breakpoint
CREATE INDEX `shipment_allocations_trade_idx` ON `shipmentAllocations` (`tradeId`);--> statement-breakpoint
CREATE INDEX `shipment_events_shipment_idx` ON `shipmentEvents` (`shipmentId`);--> statement-breakpoint
CREATE INDEX `shipments_org_idx` ON `shipments` (`organizationId`);--> statement-breakpoint
CREATE INDEX `trade_lines_trade_idx` ON `tradeLines` (`tradeId`);