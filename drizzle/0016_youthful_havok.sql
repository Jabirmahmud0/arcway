CREATE TABLE `workflowAlertPolicies` (
  `id` int AUTO_INCREMENT NOT NULL,
  `organizationId` int NOT NULL,
  `alertType` enum('source_failure','source_health','obligation_sla') NOT NULL,
  `enabled` int NOT NULL DEFAULT 1,
  `severity` enum('critical','warning','information') NOT NULL DEFAULT 'warning',
  `threshold` int NOT NULL DEFAULT 1,
  `updatedBy` int,
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `workflowAlertPolicies_id` PRIMARY KEY(`id`),
  CONSTRAINT `alert_policy_org_type_idx` UNIQUE(`organizationId`,`alertType`),
  CONSTRAINT `alpol_org_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action,
  CONSTRAINT `alpol_user_fk` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX `alert_policy_org_idx` ON `workflowAlertPolicies` (`organizationId`);
