-- AuditLog: actor snapshot, impersonation, tenant context, entity label
ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_user_id_fkey";

ALTER TABLE "audit_logs" ALTER COLUMN "user_id" DROP NOT NULL;

ALTER TABLE "audit_logs"
  ADD COLUMN "user_email" TEXT,
  ADD COLUMN "user_name" TEXT,
  ADD COLUMN "impersonated_id" UUID,
  ADD COLUMN "impersonated_name" TEXT,
  ADD COLUMN "company_id" UUID,
  ADD COLUMN "project_id" UUID,
  ADD COLUMN "entity_label" TEXT;

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX "audit_logs_entity_idx";
DROP INDEX "audit_logs_entity_id_idx";

CREATE INDEX "audit_logs_company_id_idx" ON "audit_logs"("company_id");
CREATE INDEX "audit_logs_entity_entity_id_created_at_idx" ON "audit_logs"("entity", "entity_id", "created_at");

-- LoginAttempt: successful logins and user agent
ALTER TABLE "login_attempts"
  ADD COLUMN "success" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "user_agent" TEXT;

CREATE INDEX "login_attempts_created_at_idx" ON "login_attempts"("created_at");
