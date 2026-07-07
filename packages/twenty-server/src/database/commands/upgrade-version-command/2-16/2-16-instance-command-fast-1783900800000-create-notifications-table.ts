// FORK: Voka CRM — Fase C: tabela de notificações
import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';
import { QueryRunner } from 'typeorm';

@RegisteredInstanceCommand('2.16.0', 1783900800000)
export class CreateNotificationsTableFastInstanceCommand
  implements FastInstanceCommand
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core."notification" (
        "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId" UUID NOT NULL,
        "title"       TEXT NOT NULL,
        "body"        TEXT,
        "type"        TEXT NOT NULL DEFAULT 'SYSTEM',
        "link"        TEXT,
        "readAt"      TIMESTAMPTZ,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_notification" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notification_workspaceId_createdAt"
        ON core."notification" ("workspaceId", "createdAt" DESC)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS core."notification"`);
  }
}
