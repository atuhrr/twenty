// FORK: Voka CRM — Fase 14: Salesbot tables
import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';
import { QueryRunner } from 'typeorm';

@RegisteredInstanceCommand('2.16.0', 1782950400000)
export class CreateSalesbotTablesFastInstanceCommand implements FastInstanceCommand {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core."salesbot" (
        "id"             UUID NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId"    UUID NOT NULL,
        "name"           TEXT NOT NULL,
        "trigger"        TEXT NOT NULL DEFAULT 'KEYWORD',
        "triggerKeyword" TEXT,
        "nodes"          JSONB NOT NULL DEFAULT '[]',
        "enabled"        BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_salesbot" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_salesbot_workspace"
        ON core."salesbot" ("workspaceId")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core."salesbotSession" (
        "id"                  UUID NOT NULL DEFAULT gen_random_uuid(),
        "botId"               UUID NOT NULL REFERENCES core."salesbot"("id") ON DELETE CASCADE,
        "workspaceId"         UUID NOT NULL,
        "contactPhone"        TEXT NOT NULL,
        "opportunityId"       UUID,
        "currentNodeId"       TEXT NOT NULL,
        "collectedData"       JSONB NOT NULL DEFAULT '{}',
        "conversationHistory" JSONB NOT NULL DEFAULT '[]',
        "status"              TEXT NOT NULL DEFAULT 'ACTIVE',
        "aiTurns"             INT NOT NULL DEFAULT 0,
        "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_salesbot_session" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_salesbot_session_phone"
        ON core."salesbotSession" ("workspaceId", "contactPhone", "status")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS core."salesbotSession"`);
    await queryRunner.query(`DROP TABLE IF EXISTS core."salesbot"`);
  }
}
