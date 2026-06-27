// FORK: Voka CRM — Fase 10: create teamChatMessage table for internal team collaboration
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782432000000)
export class CreateTeamChatTableFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "core"."teamChatMessage" (
        "id"                uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspaceId"       uuid NOT NULL,
        "senderId"          uuid NOT NULL,
        "senderName"        text NOT NULL,
        "relatedRecordId"   uuid,
        "relatedRecordType" text,
        "content"           text NOT NULL,
        "createdAt"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_teamChatMessage_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_teamChatMessage_workspaceId"
          FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_TEAM_CHAT_MESSAGE_WORKSPACE_RECORD"
        ON "core"."teamChatMessage" ("workspaceId", "relatedRecordId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "core"."teamChatMessage"`);
  }
}
