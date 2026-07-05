// FORK: Voka CRM — Fase 2: objetos do domínio CRM (motivoPerda, clienteRecorrente, produto, leadScore)
import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';
import { type QueryRunner } from 'typeorm';

@RegisteredInstanceCommand('2.16.0', 1783468800000)
export class CreateVokaCrmObjectsFastInstanceCommand
  implements FastInstanceCommand
{
  async up(queryRunner: QueryRunner): Promise<void> {
    // ── Motivo de perda de lead ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core."motivoPerda" (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "workspaceId" UUID NOT NULL,
        nome          TEXT NOT NULL,
        ativo         BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_motivoPerda_workspaceId"
        ON core."motivoPerda" ("workspaceId");
    `);

    // ── Score de lead (por lead record no workspace schema) ──────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core."leadScore" (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "workspaceId" UUID NOT NULL,
        "leadId"      UUID NOT NULL,
        score         INTEGER NOT NULL DEFAULT 0,
        fatores       JSONB NOT NULL DEFAULT '[]',
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_leadScore_workspaceId_leadId"
        ON core."leadScore" ("workspaceId", "leadId");
    `);

    // ── Cliente recorrente ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core."clienteRecorrente" (
        id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "workspaceId"     UUID NOT NULL,
        nome              TEXT NOT NULL,
        email             TEXT,
        telefone          TEXT,
        empresa           TEXT,
        "periodicidade"   TEXT NOT NULL DEFAULT 'MENSAL',
        "valorRecorrente" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "proximoContato"  DATE,
        "responsavelId"   UUID,
        tags              TEXT[] NOT NULL DEFAULT '{}',
        observacoes       TEXT,
        "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_clienteRecorrente_workspaceId"
        ON core."clienteRecorrente" ("workspaceId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_clienteRecorrente_proximoContato"
        ON core."clienteRecorrente" ("workspaceId", "proximoContato");
    `);

    // ── Produto / catálogo ───────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core."produto" (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "workspaceId" UUID NOT NULL,
        nome          TEXT NOT NULL,
        descricao     TEXT,
        preco         NUMERIC(14,2) NOT NULL DEFAULT 0,
        unidade       TEXT NOT NULL DEFAULT 'un',
        sku           TEXT,
        ativo         BOOLEAN NOT NULL DEFAULT TRUE,
        "categoria"   TEXT,
        imagens       TEXT[] NOT NULL DEFAULT '{}',
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_produto_workspaceId"
        ON core."produto" ("workspaceId");
    `);

    // ── Itens de produto vinculados a leads ──────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core."leadProduto" (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "workspaceId" UUID NOT NULL,
        "leadId"      UUID NOT NULL,
        "produtoId"   UUID NOT NULL REFERENCES core."produto"(id) ON DELETE CASCADE,
        quantidade    NUMERIC(10,3) NOT NULL DEFAULT 1,
        preco         NUMERIC(14,2) NOT NULL DEFAULT 0,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_leadProduto_leadId"
        ON core."leadProduto" ("workspaceId", "leadId");
    `);

    // ── Notificações (central de notificações) ───────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS core."vokaNotification" (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "workspaceId" UUID NOT NULL,
        "userId"      UUID NOT NULL,
        tipo          TEXT NOT NULL,
        titulo        TEXT NOT NULL,
        corpo         TEXT,
        link          TEXT,
        lida          BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_vokaNotification_userId_lida"
        ON core."vokaNotification" ("workspaceId", "userId", lida, "createdAt" DESC);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS core."vokaNotification";`);
    await queryRunner.query(`DROP TABLE IF EXISTS core."leadProduto";`);
    await queryRunner.query(`DROP TABLE IF EXISTS core."produto";`);
    await queryRunner.query(`DROP TABLE IF EXISTS core."clienteRecorrente";`);
    await queryRunner.query(`DROP TABLE IF EXISTS core."leadScore";`);
    await queryRunner.query(`DROP TABLE IF EXISTS core."motivoPerda";`);
  }
}
