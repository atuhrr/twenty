// FORK: Voka CRM — Fase 9: add phoneNumber to whatsappContactWindow for thread display
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782259200000)
export class AddPhoneToWhatsappContactWindowFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."whatsappContactWindow"
       ADD COLUMN IF NOT EXISTS "phoneNumber" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."whatsappContactWindow"
       DROP COLUMN IF EXISTS "phoneNumber"`,
    );
  }
}
