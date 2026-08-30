CREATE TABLE `integrationRunAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`integrationRunId` int NOT NULL,
	`attempt` int NOT NULL,
	`status` enum('running','completed','failed','skipped') NOT NULL,
	`errorMessage` text,
	`detail` json,
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `integrationRunAttempts_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_attempt_unique_idx` UNIQUE(`integrationRunId`,`attempt`)
);
--> statement-breakpoint
CREATE TABLE `sourceIngestionReceipts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`tradeId` int,
	`integrationId` int,
	`sourceType` enum('email_attachment','structured_file','webhook') NOT NULL,
	`fileName` varchar(255),
	`fileKey` varchar(512),
	`fileUrl` varchar(1024),
	`mimeType` varchar(120),
	`payloadHash` varchar(128),
	`rawPayload` json,
	`normalizedStatus` enum('queued','normalized','failed','replayed') NOT NULL DEFAULT 'queued',
	`errorMessage` text,
	`replayCount` int NOT NULL DEFAULT 0,
	`receivedAt` timestamp NOT NULL DEFAULT (now()),
	`normalizedAt` timestamp,
	`createdBy` int,
	CONSTRAINT `sourceIngestionReceipts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workflowAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`integrationId` int,
	`integrationRunId` int,
	`severity` enum('critical','warning','information') NOT NULL DEFAULT 'warning',
	`status` enum('open','acknowledged','resolved') NOT NULL DEFAULT 'open',
	`title` varchar(255) NOT NULL,
	`detail` text NOT NULL,
	`dedupeKey` varchar(180),
	`occurrenceCount` int NOT NULL DEFAULT 1,
	`firstSeenAt` timestamp NOT NULL DEFAULT (now()),
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`acknowledgedAt` timestamp,
	`acknowledgedBy` int,
	`resolvedAt` timestamp,
	CONSTRAINT `workflowAlerts_id` PRIMARY KEY(`id`),
	CONSTRAINT `workflow_alert_dedupe_idx` UNIQUE(`organizationId`,`dedupeKey`)
);
--> statement-breakpoint
ALTER TABLE `integrationRunAttempts` ADD CONSTRAINT `integrationRunAttempts_integrationRunId_integrationRuns_id_fk` FOREIGN KEY (`integrationRunId`) REFERENCES `integrationRuns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sourceIngestionReceipts` ADD CONSTRAINT `sourceIngestionReceipts_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sourceIngestionReceipts` ADD CONSTRAINT `sourceIngestionReceipts_tradeId_trades_id_fk` FOREIGN KEY (`tradeId`) REFERENCES `trades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sourceIngestionReceipts` ADD CONSTRAINT `sourceIngestionReceipts_integrationId_integrations_id_fk` FOREIGN KEY (`integrationId`) REFERENCES `integrations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sourceIngestionReceipts` ADD CONSTRAINT `sourceIngestionReceipts_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workflowAlerts` ADD CONSTRAINT `workflowAlerts_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workflowAlerts` ADD CONSTRAINT `workflowAlerts_integrationId_integrations_id_fk` FOREIGN KEY (`integrationId`) REFERENCES `integrations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workflowAlerts` ADD CONSTRAINT `workflowAlerts_integrationRunId_integrationRuns_id_fk` FOREIGN KEY (`integrationRunId`) REFERENCES `integrationRuns`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workflowAlerts` ADD CONSTRAINT `workflowAlerts_acknowledgedBy_users_id_fk` FOREIGN KEY (`acknowledgedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `integration_attempt_run_idx` ON `integrationRunAttempts` (`integrationRunId`);--> statement-breakpoint
CREATE INDEX `source_receipts_org_idx` ON `sourceIngestionReceipts` (`organizationId`);--> statement-breakpoint
CREATE INDEX `source_receipts_trade_idx` ON `sourceIngestionReceipts` (`tradeId`);--> statement-breakpoint
CREATE INDEX `source_receipts_status_idx` ON `sourceIngestionReceipts` (`normalizedStatus`);--> statement-breakpoint
CREATE INDEX `source_receipts_hash_idx` ON `sourceIngestionReceipts` (`payloadHash`);--> statement-breakpoint
CREATE INDEX `workflow_alert_org_idx` ON `workflowAlerts` (`organizationId`);--> statement-breakpoint
CREATE INDEX `workflow_alert_status_idx` ON `workflowAlerts` (`status`);