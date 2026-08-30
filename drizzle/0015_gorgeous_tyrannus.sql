ALTER TABLE `partnerRequests` MODIFY COLUMN `status` enum('sent','viewed','responded','accepted','completed','overdue','cancelled') NOT NULL DEFAULT 'sent';--> statement-breakpoint
ALTER TABLE `partnerRequests` ADD `scope` json;--> statement-breakpoint
ALTER TABLE `partnerRequests` ADD `responseSummary` text;--> statement-breakpoint
ALTER TABLE `partnerRequests` ADD `responseEvidence` json;--> statement-breakpoint
ALTER TABLE `partnerRequests` ADD `respondedAt` timestamp;--> statement-breakpoint
ALTER TABLE `partnerRequests` ADD `dueAt` timestamp;--> statement-breakpoint
ALTER TABLE `partnerRequests` ADD `lastReminderAt` timestamp;