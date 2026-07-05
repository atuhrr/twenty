// FORK: Voka CRM — B2.1: tabela core.template
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import { ActiveWorkspacesIteratorCommand } from 'src/database/commands/active-workspaces-iterator.command';

export class CreateTemplateTableCommand extends ActiveWorkspacesIteratorCommand {
  constructor(@InjectDataSource() protected readonly dataSource: DataSource) {
    super(dataSource);
  }

  protected async executeOnBatch(): Promise<void> {
    await this.dataSource.query(`
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
}
