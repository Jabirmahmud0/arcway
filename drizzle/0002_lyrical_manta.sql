CREATE TABLE `partnerRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tradeId` int NOT NULL,
	`requestedBy` int NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`requestType` varchar(120) NOT NULL,
	`message` text NOT NULL,
	`status` enum('sent','completed','cancelled') NOT NULL DEFAULT 'sent',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `partnerRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `partnerRequests` ADD CONSTRAINT `partnerRequests_tradeId_trades_id_fk` FOREIGN KEY (`tradeId`) REFERENCES `trades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `partnerRequests` ADD CONSTRAINT `partnerRequests_requestedBy_users_id_fk` FOREIGN KEY (`requestedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `partner_requests_trade_idx` ON `partnerRequests` (`tradeId`);