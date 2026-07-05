// FORK: Voka CRM — Fase 16: Integration Marketplace tables
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1783123200000)
export class CreateIntegrationTablesFastInstanceCommand
  implements FastInstanceCommand
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core."installedIntegration" (
        "id"             uuid        NOT NULL DEFAULT uuid_generate_v4(),
        "workspaceId"    uuid        NOT NULL,
        "integrationKey" varchar     NOT NULL,
        "config"         jsonb       NOT NULL DEFAULT '{}',
        "enabled"        boolean     NOT NULL DEFAULT true,
        "createdAt"      timestamptz NOT NULL DEFAULT now(),
        "updatedAt"      timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_installedIntegration" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_installedIntegration_workspace_key"
          UNIQUE ("workspaceId", "integrationKey")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_installedIntegration_workspaceId"
        ON core."installedIntegration" ("workspaceId")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS core."installedIntegration"`,
    );
  }
}
