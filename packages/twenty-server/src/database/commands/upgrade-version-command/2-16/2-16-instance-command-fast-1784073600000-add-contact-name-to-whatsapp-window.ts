// FORK: Zellate — nome de perfil do WhatsApp na janela de conversa
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1784073600000)
export class AddContactNameToWhatsappWindowFastInstanceCommand
  implements FastInstanceCommand
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE core."whatsappContactWindow"
        ADD COLUMN IF NOT EXISTS "contactName" text
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE core."whatsappContactWindow"
        DROP COLUMN IF EXISTS "contactName"
    `);
  }
}
