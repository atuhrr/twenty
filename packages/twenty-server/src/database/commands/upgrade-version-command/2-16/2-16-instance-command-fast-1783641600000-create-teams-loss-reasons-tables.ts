// FORK: Voka CRM — Fase 18/19: equipes + motivos de perda
import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';
import { QueryRunner } from 'typeorm';

@RegisteredInstanceCommand('2.16.0', 1783641600000)
export class CreateTeamsLossReasonsFastInstanceCommand implements FastInstanceCommand {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core."team" (
        "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" UUID NOT NULL,
        "name"        TEXT NOT NULL,
        "description" TEXT,
        "memberIds"   JSONB NOT NULL DEFAULT '[]',
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_team" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_team_workspaceId"
        ON core."team" ("workspaceId")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core."lossReason" (
        "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" UUID NOT NULL,
        "label"       TEXT NOT NULL,
        "position"    INTEGER NOT NULL DEFAULT 0,
        "isDefault"   BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_loss_reason" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_lossReason_workspaceId"
        ON core."lossReason" ("workspaceId")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS core."lossReason"`);
    await queryRunner.query(`DROP TABLE IF EXISTS core."team"`);
  }
}
