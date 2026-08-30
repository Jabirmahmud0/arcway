CREATE TABLE `policyObligationBindings` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizationId` int NOT NULL,
  `policyPackId` int NOT NULL,
  `obligationTemplateId` int NOT NULL,
  `counterpartyId` int,
  `productId` int,
  `relationshipRole` enum('buyer','supplier','forwarder','carrier','bank','inspector','any') NOT NULL DEFAULT 'any',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `effectiveFrom` timestamp NOT NULL DEFAULT (now()),
  `effectiveTo` timestamp,
  `source` varchar(180),
  `createdBy` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `pob_pk` PRIMARY KEY(`id`),
  CONSTRAINT `pob_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action,
  CONSTRAINT `pob_policy_fk` FOREIGN KEY (`policyPackId`) REFERENCES `policyPacks`(`id`) ON DELETE no action ON UPDATE no action,
  CONSTRAINT `pob_template_fk` FOREIGN KEY (`obligationTemplateId`) REFERENCES `obligationTemplates`(`id`) ON DELETE no action ON UPDATE no action,
  CONSTRAINT `pob_counterparty_fk` FOREIGN KEY (`counterpartyId`) REFERENCES `counterparties`(`id`) ON DELETE no action ON UPDATE no action,
  CONSTRAINT `pob_product_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action,
  CONSTRAINT `pob_creator_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
ALTER TABLE `counterparties` ADD `version` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `counterparties` ADD `supersedesCounterpartyId` int;--> statement-breakpoint
ALTER TABLE `products` ADD `supersedesProductId` int;--> statement-breakpoint
ALTER TABLE `counterparties` ADD CONSTRAINT `cp_supersedes_fk` FOREIGN KEY (`supersedesCounterpartyId`) REFERENCES `counterparties`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `product_supersedes_fk` FOREIGN KEY (`supersedesProductId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `policy_obligation_binding_org_idx` ON `policyObligationBindings` (`organizationId`);--> statement-breakpoint
CREATE INDEX `policy_obligation_binding_policy_idx` ON `policyObligationBindings` (`policyPackId`);--> statement-breakpoint
CREATE INDEX `policy_obligation_binding_counterparty_idx` ON `policyObligationBindings` (`counterpartyId`);--> statement-breakpoint
CREATE INDEX `policy_obligation_binding_product_idx` ON `policyObligationBindings` (`productId`);--> statement-breakpoint
CREATE INDEX `counterparties_version_idx` ON `counterparties` (`organizationId`,`legalName`,`version`);
