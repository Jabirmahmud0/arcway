CREATE TABLE `canonicalResolutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tradeId` int NOT NULL,
	`fieldName` varchar(120) NOT NULL,
	`selectedEvidenceFieldId` int,
	`selectedValue` text NOT NULL,
	`conflictingEvidenceFieldIds` json,
	`rationale` text NOT NULL,
	`policyContext` json,
	`resolvedBy` int NOT NULL,
	`resolvedAt` timestamp NOT NULL DEFAULT (now()),
	`previousResolutionId` int,
	`active` int NOT NULL DEFAULT 1,
	CONSTRAINT `canonicalResolutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `canonicalResolutions` ADD CONSTRAINT `canres_trade_fk` FOREIGN KEY (`tradeId`) REFERENCES `trades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `canonicalResolutions` ADD CONSTRAINT `canres_evidence_fk` FOREIGN KEY (`selectedEvidenceFieldId`) REFERENCES `evidenceFields`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `canonicalResolutions` ADD CONSTRAINT `canres_resolver_fk` FOREIGN KEY (`resolvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `canonical_resolutions_trade_idx` ON `canonicalResolutions` (`tradeId`);--> statement-breakpoint
CREATE INDEX `canonical_resolutions_field_idx` ON `canonicalResolutions` (`tradeId`,`fieldName`);--> statement-breakpoint
CREATE INDEX `canonical_resolutions_active_idx` ON `canonicalResolutions` (`active`);