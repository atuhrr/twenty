// FORK: Voka CRM — Fase 12: broadcast campaign tables
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782691200000)
export class CreateBroadcastTablesFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "core"."broadcastCampaign" (
        "id"              uuid          NOT NULL DEFAULT uuid_generate_v4(),
        "workspaceId"     uuid          NOT NULL,
        "name"            text          NOT NULL,
        "channel"         text          NOT NULL DEFAULT 'WHATSAPP',
        "status"          text          NOT NULL DEFAULT 'DRAFT',
        "templateName"    text,
        "languageCode"    text          NOT NULL DEFAULT 'pt_BR',
        "segmentFilter"   jsonb,
        "scheduledAt"     TIMESTAMP WITH TIME ZONE,
        "startedAt"       TIMESTAMP WITH TIME ZONE,
        "completedAt"     TIMESTAMP WITH TIME ZONE,
        "totalCount"      integer       NOT NULL DEFAULT 0,
        "sentCount"       integer       NOT NULL DEFAULT 0,
        "deliveredCount"  integer       NOT NULL DEFAULT 0,
        "readCount"       integer       NOT NULL DEFAULT 0,
        "failedCount"     integer       NOT NULL DEFAULT 0,
        "createdAt"       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt"       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_broadcastCampaign" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_broadcastCampaign_workspaceId"
        ON "core"."broadcastCampaign" ("workspaceId")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "core"."broadcastRecipient" (
        "id"             uuid          NOT NULL DEFAULT uuid_generate_v4(),
        "campaignId"     uuid          NOT NULL,
        "workspaceId"    uuid          NOT NULL,
        "contactId"      uuid,
        "phoneNumber"    text          NOT NULL,
        "status"         text          NOT NULL DEFAULT 'PENDING',
        "sentAt"         TIMESTAMP WITH TIME ZONE,
        "deliveredAt"    TIMESTAMP WITH TIME ZONE,
        "readAt"         TIMESTAMP WITH TIME ZONE,
        "errorMessage"   text,
        CONSTRAINT "PK_broadcastRecipient" PRIMARY KEY ("id"),
        CONSTRAINT "FK_broadcastRecipient_campaign"
          FOREIGN KEY ("campaignId")
          REFERENCES "core"."broadcastCampaign" ("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_broadcastRecipient_campaignId"
        ON "core"."broadcastRecipient" ("campaignId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_broadcastRecipient_workspaceId"
        ON "core"."broadcastRecipient" ("workspaceId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "core"."broadcastRecipient"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "core"."broadcastCampaign"`);
  }
}
