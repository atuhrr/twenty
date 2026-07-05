// FORK: Voka CRM — Fase 20.2: tabela core.roiRelatorio
import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';
import { QueryRunner } from 'typeorm';

@RegisteredInstanceCommand('2.16.0', 1783382400000)
export class CreateRoiRelatorioTableFastInstanceCommand
  implements FastInstanceCommand
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core."roiRelatorio" (
        "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
        "workspaceId"  UUID NOT NULL,
        "nome"         TEXT NOT NULL,
        "filtros"      JSONB NOT NULL DEFAULT '{}',
        "investimento" NUMERIC(14, 2) NOT NULL DEFAULT 0,
        "criadoPorId"  UUID,
        "criadoEm"     TIMESTAMPTZ NOT NULL DEFAULT now(),
        "atualizadoEm" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_roi_relatorio" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ROI_RELATORIO_WORKSPACE"
        ON core."roiRelatorio" ("workspaceId")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS core."roiRelatorio"`);
  }
}
