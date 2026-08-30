ALTER TABLE `tradeExceptions` ADD `resolutionOutcome` enum('corrected','accepted_with_waiver','rejected_source','duplicate','not_actionable');--> statement-breakpoint
ALTER TABLE `tradeExceptions` ADD `resolutionRationale` text;--> statement-breakpoint
ALTER TABLE `tradeExceptions` ADD `resolvedBy` int;--> statement-breakpoint
ALTER TABLE `tradeExceptions` ADD CONSTRAINT `tradeExceptions_resolvedBy_users_id_fk` FOREIGN KEY (`resolvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;