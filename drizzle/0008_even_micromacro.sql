CREATE TABLE `auditRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`actorId` int,
	`action` varchar(160) NOT NULL,
	`objectType` varchar(120) NOT NULL,
	`objectId` varchar(160) NOT NULL,
	`beforeState` json,
	`afterState` json,
	`reason` text,
	`source` varchar(120) NOT NULL DEFAULT 'application',
	`sourceIp` varchar(64),
	`device` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `capabilityGrants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`membershipId` int NOT NULL,
	`capability` varchar(120) NOT NULL,
	`grantedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `capabilityGrants_id` PRIMARY KEY(`id`),
	CONSTRAINT `capability_grant_unique_idx` UNIQUE(`membershipId`,`capability`)
);
--> statement-breakpoint
CREATE TABLE `guestAccessGrants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`tradeId` int NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`tokenHash` varchar(255) NOT NULL,
	`scope` json NOT NULL,
	`status` enum('active','expired','revoked','completed') NOT NULL DEFAULT 'active',
	`expiresAt` timestamp NOT NULL,
	`accessedAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `guestAccessGrants_id` PRIMARY KEY(`id`),
	CONSTRAINT `guestAccessGrants_tokenHash_unique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `organizationControls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` int NOT NULL,
	`dataRetentionDays` int NOT NULL DEFAULT 2555,
	`allowedAiProviders` json,
	`regionalProcessing` varchar(80) DEFAULT 'default',
	`piiRedaction` enum('off','on_upload','on_model_request') NOT NULL DEFAULT 'on_model_request',
	`publicModelTraining` enum('disallowed','allowed') NOT NULL DEFAULT 'disallowed',
	`requireMfa` enum('disabled','required') NOT NULL DEFAULT 'disabled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `organizationControls_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizationControls_organizationId_unique` UNIQUE(`organizationId`)
);
--> statement-breakpoint
ALTER TABLE `auditRecords` ADD CONSTRAINT `auditRecords_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auditRecords` ADD CONSTRAINT `auditRecords_actorId_users_id_fk` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `capabilityGrants` ADD CONSTRAINT `capabilityGrants_membershipId_memberships_id_fk` FOREIGN KEY (`membershipId`) REFERENCES `memberships`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `capabilityGrants` ADD CONSTRAINT `capabilityGrants_grantedBy_users_id_fk` FOREIGN KEY (`grantedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guestAccessGrants` ADD CONSTRAINT `guestAccessGrants_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guestAccessGrants` ADD CONSTRAINT `guestAccessGrants_tradeId_trades_id_fk` FOREIGN KEY (`tradeId`) REFERENCES `trades`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `guestAccessGrants` ADD CONSTRAINT `guestAccessGrants_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organizationControls` ADD CONSTRAINT `organizationControls_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `audit_records_org_idx` ON `auditRecords` (`organizationId`);--> statement-breakpoint
CREATE INDEX `audit_records_object_idx` ON `auditRecords` (`objectType`,`objectId`);--> statement-breakpoint
CREATE INDEX `audit_records_created_idx` ON `auditRecords` (`createdAt`);--> statement-breakpoint
CREATE INDEX `capability_grant_membership_idx` ON `capabilityGrants` (`membershipId`);--> statement-breakpoint
CREATE INDEX `guest_access_trade_idx` ON `guestAccessGrants` (`tradeId`);--> statement-breakpoint
CREATE INDEX `guest_access_org_idx` ON `guestAccessGrants` (`organizationId`);