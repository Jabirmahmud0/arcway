CREATE TABLE `externalReferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`tradeId` int,
	`entityType` varchar(100) NOT NULL,
	`providerName` varchar(180) NOT NULL,
	`externalId` varchar(255) NOT NULL,
	`payload` json,
	`observedAt` timestamp NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `externalReferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `external_reference_unique_idx` UNIQUE(`organizationId`,`providerName`,`entityType`,`externalId`)
);
--> statement-breakpoint
CREATE TABLE `importMappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`sourceName` varchar(180) NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`mapping` json NOT NULL,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `importMappings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integrationRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`integrationId` int NOT NULL,
	`runType` varchar(100) NOT NULL,
	`status` enum('queued','running','completed','failed','skipped') NOT NULL DEFAULT 'queued',
	`inputSummary` json,
	`outputSummary` json,
	`errorMessage` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `integrationRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`providerType` enum('email','storage','erp','carrier','visibility','ebl','compliance','payment','finance','identity') NOT NULL,
	`providerName` varchar(180) NOT NULL,
	`status` enum('disconnected','connected','degraded','paused') NOT NULL DEFAULT 'disconnected',
	`configuration` json,
	`healthMessage` text,
	`lastSyncedAt` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `externalReferences` ADD CONSTRAINT `externalReferences_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `externalReferences` ADD CONSTRAINT `externalReferences_tradeId_trades_id_fk` FOREIGN KEY (`tradeId`) REFERENCES `trades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `importMappings` ADD CONSTRAINT `importMappings_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `importMappings` ADD CONSTRAINT `importMappings_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `integrationRuns` ADD CONSTRAINT `integrationRuns_integrationId_integrations_id_fk` FOREIGN KEY (`integrationId`) REFERENCES `integrations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `integrations` ADD CONSTRAINT `integrations_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `integrations` ADD CONSTRAINT `integrations_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `external_reference_trade_idx` ON `externalReferences` (`tradeId`);--> statement-breakpoint
CREATE INDEX `import_mappings_org_idx` ON `importMappings` (`organizationId`);--> statement-breakpoint
CREATE INDEX `integration_runs_integration_idx` ON `integrationRuns` (`integrationId`);--> statement-breakpoint
CREATE INDEX `integration_runs_status_idx` ON `integrationRuns` (`status`);--> statement-breakpoint
CREATE INDEX `integrations_org_idx` ON `integrations` (`organizationId`);--> statement-breakpoint
CREATE INDEX `integrations_provider_idx` ON `integrations` (`providerType`);