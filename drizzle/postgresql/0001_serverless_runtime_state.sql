CREATE TABLE "appRuntimeState" (
	"id" serial PRIMARY KEY NOT NULL,
	"namespace" varchar(64) NOT NULL,
	"key" varchar(512) NOT NULL,
	"value" jsonb NOT NULL,
	"expiresAt" timestamp with time zone,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "runtime_state_key_idx" ON "appRuntimeState" USING btree ("namespace","key");--> statement-breakpoint
CREATE INDEX "runtime_state_expiry_idx" ON "appRuntimeState" USING btree ("expiresAt");