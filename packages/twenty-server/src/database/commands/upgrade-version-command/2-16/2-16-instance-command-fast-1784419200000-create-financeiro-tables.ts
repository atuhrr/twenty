// FORK: Zellate — F1 Financeiro: tabelas core do módulo de faturas
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1784419200000)
export class CreateFinanceiroTablesFastInstanceCommand
  implements FastInstanceCommand
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core."financeiroConta" (
        id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "workspaceId"      UUID NOT NULL,
        provider           TEXT NOT NULL DEFAULT 'ASAAS',
        tipo               TEXT NOT NULL DEFAULT 'CONTA_PROPRIA',
        "apiKeyEncrypted"  TEXT NOT NULL,
        ambiente           TEXT NOT NULL DEFAULT 'SANDBOX',
        "webhookToken"     TEXT NOT NULL,
        "statusConta"      TEXT NOT NULL DEFAULT 'CONECTADA',
        "nomeConta"        TEXT,
        -- reservados à F5 (Zellate Pay)
        "walletId"         TEXT,
        "asaasAccountId"   TEXT,
        "onboardingUrl"    TEXT,
        "dadosCadastrais"  JSONB,
        "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_FINANCEIRO_CONTA_WORKSPACE"
        ON core."financeiroConta" ("workspaceId");

      CREATE TABLE IF NOT EXISTS core."fatura" (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "workspaceId"         UUID NOT NULL,
        "numeroSeq"           INTEGER NOT NULL,
        "leadId"              UUID,
        "personId"            UUID,
        "clienteNome"         TEXT NOT NULL,
        "clienteCpfCnpj"      TEXT,
        "clienteEmail"        TEXT,
        "clienteTelefone"     TEXT,
        descricao             TEXT NOT NULL,
        "valorCentavos"       INTEGER NOT NULL,
        vencimento            DATE NOT NULL,
        meios                 TEXT NOT NULL DEFAULT 'TODOS',
        status                TEXT NOT NULL DEFAULT 'PENDENTE',
        provider              TEXT NOT NULL DEFAULT 'ASAAS',
        "providerCobrancaId"  TEXT,
        "providerClienteId"   TEXT,
        "linkPagamento"       TEXT,
        "pixPayload"          TEXT,
        "pixQrCodeBase64"     TEXT,
        "pagaEm"              TIMESTAMPTZ,
        "valorPagoCentavos"   INTEGER,
        "formaPagamento"      TEXT,
        "createdAt"           TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt"           TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_FATURA_WORKSPACE_STATUS"
        ON core."fatura" ("workspaceId", status);
      CREATE INDEX IF NOT EXISTS "IDX_FATURA_WORKSPACE_VENCIMENTO"
        ON core."fatura" ("workspaceId", vencimento);
      CREATE INDEX IF NOT EXISTS "IDX_FATURA_PROVIDER_COBRANCA"
        ON core."fatura" ("workspaceId", "providerCobrancaId");

      CREATE TABLE IF NOT EXISTS core."faturaEvento" (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "workspaceId" UUID NOT NULL,
        "faturaId"    UUID NOT NULL,
        tipo          TEXT NOT NULL,
        payload       JSONB,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_FATURA_EVENTO_FATURA"
        ON core."faturaEvento" ("faturaId");
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS core."faturaEvento";
      DROP TABLE IF EXISTS core."fatura";
      DROP TABLE IF EXISTS core."financeiroConta";
    `);
  }
}
