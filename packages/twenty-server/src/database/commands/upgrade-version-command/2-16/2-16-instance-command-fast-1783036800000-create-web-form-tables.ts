// FORK: Voka CRM — Fase 15: Web Forms + Chat Widget
import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';
import { QueryRunner } from 'typeorm';

@RegisteredInstanceCommand('2.16.0', 1783036800000)
export class CreateWebFormTablesFastInstanceCommand implements FastInstanceCommand {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core."webForm" (
        "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId"  UUID NOT NULL,
        "name"         TEXT NOT NULL,
        "fields"       JSONB NOT NULL DEFAULT '[]',
        "funnelId"     TEXT,
        "publicToken"  TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
        "enabled"      BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_web_form" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_web_form_workspace"
        ON core."webForm" ("workspaceId")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core."webFormSubmission" (
        "id"             UUID NOT NULL DEFAULT gen_random_uuid(),
        "formId"         UUID NOT NULL,
        "workspaceId"    UUID NOT NULL,
        "data"           JSONB NOT NULL DEFAULT '{}',
        "source"         TEXT NOT NULL DEFAULT 'WEB_FORM',
        "opportunityId"  UUID,
        "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_web_form_submission" PRIMARY KEY ("id")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS core."webFormSubmission"`);
    await queryRunner.query(`DROP TABLE IF EXISTS core."webForm"`);
  }
}
