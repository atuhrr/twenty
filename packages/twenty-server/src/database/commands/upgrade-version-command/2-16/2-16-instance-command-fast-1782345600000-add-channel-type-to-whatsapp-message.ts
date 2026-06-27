// FORK: Voka CRM — Fase 10: add channelType to whatsappMessage for omni-channel routing
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782345600000)
export class AddChannelTypeToWhatsappMessageFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "core"."whatsappMessage_channelType_enum"
          AS ENUM ('WHATSAPP', 'INSTAGRAM', 'MESSENGER', 'TELEGRAM');
        EXCEPTION WHEN duplicate_object THEN null;
       END $$`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."whatsappMessage"
       ADD COLUMN IF NOT EXISTS "channelType"
         "core"."whatsappMessage_channelType_enum" NOT NULL DEFAULT 'WHATSAPP'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."whatsappMessage"
       DROP COLUMN IF EXISTS "channelType"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "core"."whatsappMessage_channelType_enum"`,
    );
  }
}
