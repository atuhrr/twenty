// FORK: Voka CRM — Fase 11: add isDefault + label columns for multi-number WhatsApp
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1783555200000)
export class AddMultiNumberToWhatsappInstanceFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."whatsappInstance"
       ADD COLUMN IF NOT EXISTS "label" text,
       ADD COLUMN IF NOT EXISTS "isDefault" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."whatsappInstance"
       DROP COLUMN IF EXISTS "label",
       DROP COLUMN IF EXISTS "isDefault"`,
    );
  }
}
