CREATE TABLE `operationalSchedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scheduleKey` varchar(80) NOT NULL,
	`taskUid` varchar(65),
	`cronExpression` varchar(80) NOT NULL,
	`enabled` int NOT NULL DEFAULT 1,
	`lastExecutedAt` timestamp,
	`lastResult` json,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operationalSchedules_id` PRIMARY KEY(`id`),
	CONSTRAINT `operationalSchedules_scheduleKey_unique` UNIQUE(`scheduleKey`),
	CONSTRAINT `operationalSchedules_taskUid_unique` UNIQUE(`taskUid`)
);
--> statement-breakpoint
CREATE INDEX `operational_schedules_task_uid_idx` ON `operationalSchedules` (`taskUid`);