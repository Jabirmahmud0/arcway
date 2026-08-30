CREATE TABLE `preflightWaivers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tradeId` int NOT NULL,
	`policyVersionId` int,
	`ruleKey` varchar(160) NOT NULL,
	`reason` text NOT NULL,
	`decision` enum('active','expired','revoked') NOT NULL DEFAULT 'active',
	`expiresAt` timestamp NOT NULL,
	`approvedBy` int NOT NULL,
	`approvedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `preflightWaivers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `preflightWaivers` ADD CONSTRAINT `preflightWaivers_tradeId_trades_id_fk` FOREIGN KEY (`tradeId`) REFERENCES `trades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `preflightWaivers` ADD CONSTRAINT `preflightWaivers_policyVersionId_policyVersions_id_fk` FOREIGN KEY (`policyVersionId`) REFERENCES `policyVersions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `preflightWaivers` ADD CONSTRAINT `preflightWaivers_approvedBy_users_id_fk` FOREIGN KEY (`approvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `preflight_waivers_trade_idx` ON `preflightWaivers` (`tradeId`);--> statement-breakpoint
CREATE INDEX `preflight_waivers_policy_idx` ON `preflightWaivers` (`policyVersionId`);--> statement-breakpoint
CREATE INDEX `preflight_waivers_decision_idx` ON `preflightWaivers` (`decision`);