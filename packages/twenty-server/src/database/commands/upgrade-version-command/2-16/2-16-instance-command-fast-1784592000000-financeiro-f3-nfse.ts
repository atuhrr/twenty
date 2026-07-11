// FORK: Zellate — F3 Financeiro: NFS-e opcional (nativa do Asaas)
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1784592000000)
export class FinanceiroF3NfseFastInstanceCommand
  implements FastInstanceCommand
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE core."financeiroConta"
        ADD COLUMN IF NOT EXISTS "nfseAtiva" BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS "nfseMomento" TEXT NOT NULL DEFAULT 'MANUAL',
        ADD COLUMN IF NOT EXISTS "nfseCodigoServico" TEXT,
        ADD COLUMN IF NOT EXISTS "nfseNomeServico" TEXT,
        ADD COLUMN IF NOT EXISTS "nfseAliquotaIss" NUMERIC(5,2),
        ADD COLUMN IF NOT EXISTS "nfseDescricaoPadrao" TEXT;

      ALTER TABLE core."fatura"
        ADD COLUMN IF NOT EXISTS "nfseStatus" TEXT,
        ADD COLUMN IF NOT EXISTS "nfseProviderId" TEXT,
        ADD COLUMN IF NOT EXISTS "nfsePdfUrl" TEXT,
        ADD COLUMN IF NOT EXISTS "nfseErro" TEXT;

      CREATE INDEX IF NOT EXISTS "IDX_FATURA_NFSE_PROVIDER"
        ON core."fatura" ("workspaceId", "nfseProviderId");
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE core."financeiroConta"
        DROP COLUMN IF EXISTS "nfseAtiva",
        DROP COLUMN IF EXISTS "nfseMomento",
        DROP COLUMN IF EXISTS "nfseCodigoServico",
        DROP COLUMN IF EXISTS "nfseNomeServico",
        DROP COLUMN IF EXISTS "nfseAliquotaIss",
        DROP COLUMN IF EXISTS "nfseDescricaoPadrao";
      ALTER TABLE core."fatura"
        DROP COLUMN IF EXISTS "nfseStatus",
        DROP COLUMN IF EXISTS "nfseProviderId",
        DROP COLUMN IF EXISTS "nfsePdfUrl",
        DROP COLUMN IF EXISTS "nfseErro";
    `);
  }
}
