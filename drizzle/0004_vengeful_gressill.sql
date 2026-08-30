CREATE TABLE `tradeMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tradeId` int NOT NULL,
	`sender` varchar(320) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`source` varchar(80) NOT NULL DEFAULT 'email',
	`receivedAt` timestamp NOT NULL,
	`ingestedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tradeMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `tradeMessages` ADD CONSTRAINT `tradeMessages_tradeId_trades_id_fk` FOREIGN KEY (`tradeId`) REFERENCES `trades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tradeMessages` ADD CONSTRAINT `tradeMessages_ingestedBy_users_id_fk` FOREIGN KEY (`ingestedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `trade_messages_trade_idx` ON `tradeMessages` (`tradeId`);