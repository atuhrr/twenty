// FORK: Voka CRM — B1.1: garante que graph nunca é NULL na tabela salesbot
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1751068800000)
export class FixSalesbotNullGraphFastInstanceCommand
  implements FastInstanceCommand
{
  async up(queryRunner: QueryRunner): Promise<void> {
    // Em instalação nova a tabela ainda não existe (é criada por um comando
    // com timestamp posterior) — sem o guard, o upgrade inteiro aborta.
    const [{ existe }] = await queryRunner.query(
      `SELECT to_regclass('core.salesbot') IS NOT NULL AS existe`,
    );

    if (!existe) {
      return;
    }

    await queryRunner.query(`
      UPDATE core."salesbot"
      SET "graph" = '{"nodes":[],"edges":[]}'::jsonb
      WHERE "graph" IS NULL
    `);
  }

  async down(_queryRunner: QueryRunner): Promise<void> {
    // Não há como saber quais rows eram originalmente null — reversão no-op.
  }
}
