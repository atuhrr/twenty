// FORK: Zellate — tabela core.agendaEvento (calendário do usuário)
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1784332800000)
export class CreateAgendaEventoTableFastInstanceCommand
  implements FastInstanceCommand
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core."agendaEvento" (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "workspaceId"     UUID NOT NULL,
        titulo            TEXT NOT NULL,
        cor               TEXT NOT NULL DEFAULT 'primary',
        inicio            TIMESTAMPTZ NOT NULL,
        fim               TIMESTAMPTZ NOT NULL,
        "leadId"          UUID,
        "criadoPorUserId" UUID,
        "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_AGENDA_EVENTO_WORKSPACE_INICIO"
        ON core."agendaEvento" ("workspaceId", inicio);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS core."agendaEvento"`);
  }
}
