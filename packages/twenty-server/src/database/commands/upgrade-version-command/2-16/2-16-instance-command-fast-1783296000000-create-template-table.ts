// FORK: Voka CRM — B2.1: tabela core.template
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1783296000000)
export class CreateTemplateTableFastInstanceCommand
  implements FastInstanceCommand
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core."template" (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "workspaceId" UUID NOT NULL,
        nome         TEXT NOT NULL,
        tipo         TEXT NOT NULL,
        canal        TEXT,
        assunto      TEXT,
        corpo        TEXT NOT NULL DEFAULT '',
        variaveis    TEXT[] NOT NULL DEFAULT '{}',
        ativo        BOOLEAN NOT NULL DEFAULT TRUE,
        "criadoEm"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        "atualizadoEm" TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_template_workspace
        ON core."template" ("workspaceId");
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS core."template"`);
  }
}
