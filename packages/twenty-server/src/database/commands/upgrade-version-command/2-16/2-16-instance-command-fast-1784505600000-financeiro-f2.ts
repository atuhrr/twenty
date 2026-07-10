// FORK: Zellate — F2 Financeiro: juros/multa/desconto, régua de lembretes
// e assinaturas (recorrência)
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1784505600000)
export class FinanceiroF2FastInstanceCommand implements FastInstanceCommand {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE core."fatura"
        ADD COLUMN IF NOT EXISTS "jurosPercent" NUMERIC(5,2),
        ADD COLUMN IF NOT EXISTS "multaPercent" NUMERIC(5,2),
        ADD COLUMN IF NOT EXISTS "descontoCentavos" INTEGER,
        ADD COLUMN IF NOT EXISTS "lembretesAtivos" BOOLEAN NOT NULL DEFAULT TRUE,
        ADD COLUMN IF NOT EXISTS "assinaturaId" UUID;

      ALTER TABLE core."financeiroConta"
        ADD COLUMN IF NOT EXISTS "jurosPadraoPercent" NUMERIC(5,2),
        ADD COLUMN IF NOT EXISTS "multaPadraoPercent" NUMERIC(5,2),
        ADD COLUMN IF NOT EXISTS "reguaLembretes" JSONB NOT NULL
          DEFAULT '{"ativo": true, "diasAntes": [1], "diasDepois": [1, 3, 7]}',
        ADD COLUMN IF NOT EXISTS "templateLembrete" TEXT;

      CREATE TABLE IF NOT EXISTS core."assinatura" (
        id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "workspaceId"            UUID NOT NULL,
        "leadId"                 UUID,
        "clienteNome"            TEXT NOT NULL,
        "clienteCpfCnpj"         TEXT,
        "clienteTelefone"        TEXT,
        descricao                TEXT NOT NULL,
        "valorCentavos"          INTEGER NOT NULL,
        ciclo                    TEXT NOT NULL DEFAULT 'MENSAL',
        "proximoVencimento"      DATE NOT NULL,
        meios                    TEXT NOT NULL DEFAULT 'TODOS',
        status                   TEXT NOT NULL DEFAULT 'ATIVA',
        provider                 TEXT NOT NULL DEFAULT 'ASAAS',
        "providerAssinaturaId"   TEXT,
        "providerClienteId"      TEXT,
        "createdAt"              TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"              TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_ASSINATURA_WORKSPACE_STATUS"
        ON core."assinatura" ("workspaceId", status);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS core."assinatura";
      ALTER TABLE core."fatura"
        DROP COLUMN IF EXISTS "jurosPercent",
        DROP COLUMN IF EXISTS "multaPercent",
        DROP COLUMN IF EXISTS "descontoCentavos",
        DROP COLUMN IF EXISTS "lembretesAtivos",
        DROP COLUMN IF EXISTS "assinaturaId";
      ALTER TABLE core."financeiroConta"
        DROP COLUMN IF EXISTS "jurosPadraoPercent",
        DROP COLUMN IF EXISTS "multaPadraoPercent",
        DROP COLUMN IF EXISTS "reguaLembretes",
        DROP COLUMN IF EXISTS "templateLembrete";
    `);
  }
}
