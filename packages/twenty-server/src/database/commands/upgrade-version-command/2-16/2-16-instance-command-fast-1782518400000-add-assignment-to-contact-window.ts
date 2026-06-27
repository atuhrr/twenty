// FORK: Voka CRM — Fase 11: add thread assignment fields to whatsappContactWindow
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782518400000)
export class AddAssignmentToContactWindowFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."whatsappContactWindow"
       ADD COLUMN IF NOT EXISTS "assignedUserId"   uuid,
       ADD COLUMN IF NOT EXISTS "assignedUserName" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."whatsappContactWindow"
       DROP COLUMN IF EXISTS "assignedUserId",
       DROP COLUMN IF EXISTS "assignedUserName"`,
    );
  }
}
