// FORK: Voka CRM — Fase 13: automation engine tables
import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';
import { type QueryRunner } from 'typeorm';

@RegisteredInstanceCommand('2.16.0', 1782864000000)
export class CreateAutomationTablesFastInstanceCommand
  implements FastInstanceCommand
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core."automationRule" (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "workspaceId"    UUID NOT NULL,
        name             TEXT NOT NULL,
        "triggerType"    TEXT NOT NULL,
        "triggerConfig"  JSONB NOT NULL DEFAULT '{}',
        conditions       JSONB NOT NULL DEFAULT '[]',
        actions          JSONB NOT NULL DEFAULT '[]',
        enabled          BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_automationRule_workspaceId_trigger"
        ON core."automationRule" ("workspaceId", "triggerType");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core."automationExecution" (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "ruleId"       UUID NOT NULL REFERENCES core."automationRule"(id) ON DELETE CASCADE,
        "workspaceId"  UUID NOT NULL,
        "recordId"     TEXT NOT NULL,
        status         TEXT NOT NULL DEFAULT 'SUCCESS',
        error          TEXT,
        "executedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_automationExecution_ruleId"
        ON core."automationExecution" ("ruleId");
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS core."automationExecution";`);
    await queryRunner.query(`DROP TABLE IF EXISTS core."automationRule";`);
  }
}
