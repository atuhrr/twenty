// FORK: Zellate — F3 Catálogo: desconto por item de negócio na tabela leadProduto
// (core-module, sem metadata — como o resto dos objetos de domínio do fork).
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1785110400000)
export class AddDescontoToLeadProdutoFastInstanceCommand
  implements FastInstanceCommand
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE core."leadProduto"
        ADD COLUMN IF NOT EXISTS desconto NUMERIC(14,2) NOT NULL DEFAULT 0
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE core."leadProduto" DROP COLUMN IF EXISTS desconto
    `);
  }
}
