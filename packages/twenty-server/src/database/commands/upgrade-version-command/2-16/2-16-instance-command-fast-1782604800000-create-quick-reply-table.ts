// FORK: Voka CRM — Fase 11: create whatsappQuickReply table
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782604800000)
export class CreateQuickReplyTableFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "core"."whatsappQuickReply" (
        "id"          uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspaceId" uuid NOT NULL,
        "shortcut"    text NOT NULL,
        "title"       text NOT NULL,
        "content"     text NOT NULL,
        "createdAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_whatsappQuickReply_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_whatsappQuickReply_workspaceId"
          FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_WHATSAPP_QUICK_REPLY_WORKSPACE"
        ON "core"."whatsappQuickReply" ("workspaceId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "core"."whatsappQuickReply"`);
  }
}
