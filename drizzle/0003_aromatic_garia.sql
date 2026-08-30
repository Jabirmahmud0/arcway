CREATE TABLE `tradeDocumentVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`tradeId` int NOT NULL,
	`version` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` varchar(1024) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`extractedData` json,
	`inconsistencies` json,
	`source` varchar(80) NOT NULL DEFAULT 'user_upload',
	`supersededBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tradeDocumentVersions_id` PRIMARY KEY(`id`),
	CONSTRAINT `document_version_idx` UNIQUE(`documentId`,`version`)
);
--> statement-breakpoint
ALTER TABLE `tradeDocumentVersions` ADD CONSTRAINT `tradeDocumentVersions_documentId_tradeDocuments_id_fk` FOREIGN KEY (`documentId`) REFERENCES `tradeDocuments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tradeDocumentVersions` ADD CONSTRAINT `tradeDocumentVersions_tradeId_trades_id_fk` FOREIGN KEY (`tradeId`) REFERENCES `trades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tradeDocumentVersions` ADD CONSTRAINT `tradeDocumentVersions_supersededBy_users_id_fk` FOREIGN KEY (`supersededBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `document_versions_trade_idx` ON `tradeDocumentVersions` (`tradeId`);