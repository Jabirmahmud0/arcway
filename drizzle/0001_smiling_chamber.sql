CREATE TABLE `tradeDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tradeId` int NOT NULL,
	`documentType` enum('commercial invoice','packing list','bill of lading','certificate of origin','inspection certificate','LC/payment terms') NOT NULL,
	`status` enum('pending','uploaded','under review','verified','rejected') NOT NULL DEFAULT 'pending',
	`fileName` varchar(255),
	`fileKey` varchar(512),
	`fileUrl` varchar(1024),
	`mimeType` varchar(120),
	`extractedData` json,
	`inconsistencies` json,
	`reviewerNotes` text,
	`uploadedBy` int,
	`reviewedBy` int,
	`uploadedAt` timestamp,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tradeDocuments_id` PRIMARY KEY(`id`),
	CONSTRAINT `trade_document_type_idx` UNIQUE(`tradeId`,`documentType`)
);
--> statement-breakpoint
CREATE TABLE `tradeEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tradeId` int NOT NULL,
	`actorId` int,
	`eventType` varchar(80) NOT NULL,
	`title` varchar(255) NOT NULL,
	`detail` text,
	`source` varchar(80) NOT NULL DEFAULT 'application',
	`beforeState` json,
	`afterState` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tradeEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tradeExceptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tradeId` int NOT NULL,
	`documentId` int,
	`category` enum('commercial','documentation','execution','logistics','settlement','compliance') NOT NULL,
	`severity` enum('critical','warning','information') NOT NULL,
	`status` enum('open','resolved') NOT NULL DEFAULT 'open',
	`title` varchar(255) NOT NULL,
	`detail` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `tradeExceptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tradeObligations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tradeId` int NOT NULL,
	`actor` varchar(180) NOT NULL,
	`action` varchar(255) NOT NULL,
	`evidenceRequirement` varchar(255),
	`deadline` timestamp,
	`criticality` enum('critical','warning','information') NOT NULL DEFAULT 'information',
	`status` enum('open','fulfilled','overdue') NOT NULL DEFAULT 'open',
	`source` varchar(180),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tradeObligations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reference` varchar(32) NOT NULL,
	`ownerId` int NOT NULL,
	`buyerName` varchar(180) NOT NULL,
	`buyerCountry` varchar(2) NOT NULL,
	`sellerName` varchar(180) NOT NULL,
	`sellerCountry` varchar(2) NOT NULL,
	`commodity` varchar(240) NOT NULL,
	`quantity` decimal(18,3) NOT NULL,
	`unit` varchar(24) NOT NULL,
	`unitPrice` decimal(18,2) NOT NULL,
	`totalValue` decimal(18,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`incoterm` varchar(8) NOT NULL,
	`originCountry` varchar(2) NOT NULL,
	`destinationCountry` varchar(2) NOT NULL,
	`expectedShipmentDate` timestamp NOT NULL,
	`commercialState` enum('draft','confirmed') NOT NULL DEFAULT 'draft',
	`executionState` enum('not_started','ready','blocked') NOT NULL DEFAULT 'not_started',
	`documentState` enum('pending','in_progress','complete') NOT NULL DEFAULT 'pending',
	`logisticsState` enum('planned','booked','in_transit','delivered') NOT NULL DEFAULT 'planned',
	`settlementState` enum('unconfirmed','partial','confirmed') NOT NULL DEFAULT 'unconfirmed',
	`assuranceState` enum('draft','submitted','under_review','approved','rejected') NOT NULL DEFAULT 'draft',
	`partyKycState` enum('unknown','pending','verified','failed') NOT NULL DEFAULT 'pending',
	`trustScore` int NOT NULL DEFAULT 0,
	`trustBand` enum('critical','guarded','review','ready') NOT NULL DEFAULT 'critical',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`submittedAt` timestamp,
	`resolvedAt` timestamp,
	CONSTRAINT `trades_id` PRIMARY KEY(`id`),
	CONSTRAINT `trades_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('trader','reviewer') NOT NULL DEFAULT 'trader';--> statement-breakpoint
ALTER TABLE `tradeDocuments` ADD CONSTRAINT `tradeDocuments_tradeId_trades_id_fk` FOREIGN KEY (`tradeId`) REFERENCES `trades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tradeDocuments` ADD CONSTRAINT `tradeDocuments_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tradeDocuments` ADD CONSTRAINT `tradeDocuments_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tradeEvents` ADD CONSTRAINT `tradeEvents_tradeId_trades_id_fk` FOREIGN KEY (`tradeId`) REFERENCES `trades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tradeEvents` ADD CONSTRAINT `tradeEvents_actorId_users_id_fk` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tradeExceptions` ADD CONSTRAINT `tradeExceptions_tradeId_trades_id_fk` FOREIGN KEY (`tradeId`) REFERENCES `trades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tradeExceptions` ADD CONSTRAINT `tradeExceptions_documentId_tradeDocuments_id_fk` FOREIGN KEY (`documentId`) REFERENCES `tradeDocuments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tradeObligations` ADD CONSTRAINT `tradeObligations_tradeId_trades_id_fk` FOREIGN KEY (`tradeId`) REFERENCES `trades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trades` ADD CONSTRAINT `trades_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `trade_documents_status_idx` ON `tradeDocuments` (`status`);--> statement-breakpoint
CREATE INDEX `trade_events_trade_idx` ON `tradeEvents` (`tradeId`);--> statement-breakpoint
CREATE INDEX `trade_events_created_idx` ON `tradeEvents` (`createdAt`);--> statement-breakpoint
CREATE INDEX `trade_exceptions_trade_idx` ON `tradeExceptions` (`tradeId`);--> statement-breakpoint
CREATE INDEX `trade_exceptions_status_idx` ON `tradeExceptions` (`status`);--> statement-breakpoint
CREATE INDEX `trade_obligations_trade_idx` ON `tradeObligations` (`tradeId`);--> statement-breakpoint
CREATE INDEX `trades_owner_idx` ON `trades` (`ownerId`);--> statement-breakpoint
CREATE INDEX `trades_assurance_idx` ON `trades` (`assuranceState`);