CREATE TABLE `obligationDependencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`obligationId` int NOT NULL,
	`dependsOnObligationId` int NOT NULL,
	`dependencyType` enum('blocks_release','blocks_task','evidence_prerequisite') NOT NULL DEFAULT 'blocks_release',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obligationDependencies_id` PRIMARY KEY(`id`),
	CONSTRAINT `obligation_dependency_unique_idx` UNIQUE(`obligationId`,`dependsOnObligationId`)
);
--> statement-breakpoint
CREATE TABLE `obligationEscalations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`obligationId` int NOT NULL,
	`level` int NOT NULL DEFAULT 1,
	`reason` text NOT NULL,
	`escalatedAt` timestamp NOT NULL DEFAULT (now()),
	`acknowledgedAt` timestamp,
	`escalatedBy` int,
	CONSTRAINT `obligationEscalations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `obligationTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`name` varchar(180) NOT NULL,
	`actor` varchar(180) NOT NULL,
	`action` varchar(255) NOT NULL,
	`evidenceRequirement` varchar(255),
	`criticality` enum('critical','warning','information') NOT NULL DEFAULT 'information',
	`dueOffsetHours` int,
	`releaseCondition` json,
	`active` int NOT NULL DEFAULT 1,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `obligationTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `obligationDependencies` ADD CONSTRAINT `obligationDependencies_obligationId_tradeObligations_id_fk` FOREIGN KEY (`obligationId`) REFERENCES `tradeObligations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `obligationDependencies` ADD CONSTRAINT `obligationDependencies_dependsOnObligationId_tradeObligations_id_fk` FOREIGN KEY (`dependsOnObligationId`) REFERENCES `tradeObligations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `obligationEscalations` ADD CONSTRAINT `obligationEscalations_obligationId_tradeObligations_id_fk` FOREIGN KEY (`obligationId`) REFERENCES `tradeObligations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `obligationEscalations` ADD CONSTRAINT `obligationEscalations_escalatedBy_users_id_fk` FOREIGN KEY (`escalatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `obligationTemplates` ADD CONSTRAINT `obligationTemplates_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `obligationTemplates` ADD CONSTRAINT `obligationTemplates_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `obligation_dependencies_obligation_idx` ON `obligationDependencies` (`obligationId`);--> statement-breakpoint
CREATE INDEX `obligation_escalations_obligation_idx` ON `obligationEscalations` (`obligationId`);--> statement-breakpoint
CREATE INDEX `obligation_templates_org_idx` ON `obligationTemplates` (`organizationId`);--> statement-breakpoint
CREATE INDEX `obligation_templates_active_idx` ON `obligationTemplates` (`active`);