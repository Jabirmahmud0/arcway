CREATE TABLE `generatedDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tradeId` int NOT NULL,
	`documentType` varchar(120) NOT NULL,
	`templateVersion` varchar(120) NOT NULL,
	`status` enum('draft','issued','voided') NOT NULL DEFAULT 'draft',
	`dataSnapshot` json NOT NULL,
	`renderedContent` text NOT NULL,
	`contentHash` varchar(128) NOT NULL,
	`issuedBy` int,
	`issuedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generatedDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tradeTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`tradeId` int NOT NULL,
	`exceptionId` int,
	`obligationId` int,
	`title` varchar(255) NOT NULL,
	`detail` text NOT NULL,
	`assigneeId` int,
	`deadline` timestamp,
	`status` enum('open','in_progress','completed','cancelled') NOT NULL DEFAULT 'open',
	`completedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tradeTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `generatedDocuments` ADD CONSTRAINT `generatedDocuments_tradeId_trades_id_fk` FOREIGN KEY (`tradeId`) REFERENCES `trades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `generatedDocuments` ADD CONSTRAINT `generatedDocuments_issuedBy_users_id_fk` FOREIGN KEY (`issuedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tradeTasks` ADD CONSTRAINT `tradeTasks_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tradeTasks` ADD CONSTRAINT `tradeTasks_tradeId_trades_id_fk` FOREIGN KEY (`tradeId`) REFERENCES `trades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tradeTasks` ADD CONSTRAINT `tradeTasks_exceptionId_tradeExceptions_id_fk` FOREIGN KEY (`exceptionId`) REFERENCES `tradeExceptions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tradeTasks` ADD CONSTRAINT `tradeTasks_obligationId_tradeObligations_id_fk` FOREIGN KEY (`obligationId`) REFERENCES `tradeObligations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tradeTasks` ADD CONSTRAINT `tradeTasks_assigneeId_users_id_fk` FOREIGN KEY (`assigneeId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tradeTasks` ADD CONSTRAINT `tradeTasks_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `generated_documents_trade_idx` ON `generatedDocuments` (`tradeId`);--> statement-breakpoint
CREATE INDEX `generated_documents_status_idx` ON `generatedDocuments` (`status`);--> statement-breakpoint
CREATE INDEX `trade_tasks_trade_idx` ON `tradeTasks` (`tradeId`);--> statement-breakpoint
CREATE INDEX `trade_tasks_assignee_idx` ON `tradeTasks` (`assigneeId`);--> statement-breakpoint
CREATE INDEX `trade_tasks_status_idx` ON `tradeTasks` (`status`);