// FORK: Zellate — F4 Financeiro: valor líquido (conciliação bruto×taxas)
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1784678400000)
export class FinanceiroF4FastInstanceCommand implements FastInstanceCommand {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE core."fatura"
        ADD COLUMN IF NOT EXISTS "valorLiquidoCentavos" INTEGER;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE core."fatura"
        DROP COLUMN IF EXISTS "valorLiquidoCentavos";
    `);
  }
}
