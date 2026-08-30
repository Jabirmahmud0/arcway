ALTER TABLE `sourceIngestionReceipts` ADD `routingStatus` enum('pending','routed','dismissed') DEFAULT 'routed' NOT NULL;--> statement-breakpoint
ALTER TABLE `sourceIngestionReceipts` ADD `routingContext` json;--> statement-breakpoint
ALTER TABLE `sourceIngestionReceipts` ADD `routedAt` timestamp;--> statement-breakpoint
ALTER TABLE `sourceIngestionReceipts` ADD `routedBy` int;--> statement-breakpoint
ALTER TABLE `sourceIngestionReceipts` ADD CONSTRAINT `sourceIngestionReceipts_routedBy_users_id_fk` FOREIGN KEY (`routedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `source_receipts_routing_idx` ON `sourceIngestionReceipts` (`routingStatus`);