import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782172800000)
export class CreateWhatsappTablesFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "core"."whatsappInstance_connectionStatus_enum"
          AS ENUM ('CONNECTED', 'DISCONNECTED', 'PENDING');
        EXCEPTION WHEN duplicate_object THEN null;
       END $$`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "core"."whatsappInstance" (
        "id"                    uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspaceId"           uuid NOT NULL,
        "wabaId"                text NOT NULL,
        "phoneNumberId"         text NOT NULL,
        "accessTokenEncrypted"  text NOT NULL,
        "appSecretEncrypted"    text NOT NULL,
        "connectionStatus"      "core"."whatsappInstance_connectionStatus_enum" NOT NULL DEFAULT 'DISCONNECTED',
        "displayPhoneNumber"    text,
        "createdAt"             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt"             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_whatsappInstance_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_whatsappInstance_workspaceId"
          FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_WHATSAPP_INSTANCE_WORKSPACE_ID"
        ON "core"."whatsappInstance" ("workspaceId")`,
    );

    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "core"."whatsappMessage_direction_enum"
          AS ENUM ('INBOUND', 'OUTBOUND');
        EXCEPTION WHEN duplicate_object THEN null;
       END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "core"."whatsappMessage_type_enum"
          AS ENUM ('TEXT', 'IMAGE', 'AUDIO', 'DOCUMENT', 'TEMPLATE');
        EXCEPTION WHEN duplicate_object THEN null;
       END $$`,
    );
    await queryRunner.query(
      `DO $$ BEGIN
        CREATE TYPE "core"."whatsappMessage_status_enum"
          AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');
        EXCEPTION WHEN duplicate_object THEN null;
       END $$`,
    );
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "core"."whatsappMessage" (
        "id"                uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspaceId"       uuid NOT NULL,
        "contactId"         uuid NOT NULL,
        "direction"         "core"."whatsappMessage_direction_enum" NOT NULL,
        "type"              "core"."whatsappMessage_type_enum" NOT NULL DEFAULT 'TEXT',
        "content"           text,
        "mediaUrl"          text,
        "externalMessageId" text NOT NULL,
        "status"            "core"."whatsappMessage_status_enum" NOT NULL DEFAULT 'SENT',
        "timestamp"         TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_whatsappMessage_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_whatsappMessage_workspaceId"
          FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_WHATSAPP_MESSAGE_EXTERNAL_ID_UNIQUE"
        ON "core"."whatsappMessage" ("externalMessageId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_WHATSAPP_MESSAGE_WORKSPACE_CONTACT"
        ON "core"."whatsappMessage" ("workspaceId", "contactId")`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "core"."whatsappContactWindow" (
        "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspaceId"   uuid NOT NULL,
        "contactId"     uuid NOT NULL,
        "lastInboundAt" TIMESTAMP WITH TIME ZONE NOT NULL,
        "createdAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_whatsappContactWindow_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_whatsappContactWindow_workspaceId"
          FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_WHATSAPP_CONTACT_WINDOW_WORKSPACE_CONTACT_UNIQUE"
        ON "core"."whatsappContactWindow" ("workspaceId", "contactId")`,
    );

    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "core"."whatsappTemplate" (
        "id"               uuid NOT NULL DEFAULT uuid_generate_v4(),
        "workspaceId"      uuid NOT NULL,
        "name"             text NOT NULL,
        "languageCode"     text NOT NULL,
        "category"         text NOT NULL,
        "bodyParamsSchema" jsonb,
        "createdAt"        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt"        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_whatsappTemplate_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_whatsappTemplate_workspaceId"
          FOREIGN KEY ("workspaceId") REFERENCES "core"."workspace"("id") ON DELETE CASCADE
      )`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_WHATSAPP_TEMPLATE_WORKSPACE_NAME_LANG_UNIQUE"
        ON "core"."whatsappTemplate" ("workspaceId", "name", "languageCode")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_WHATSAPP_TEMPLATE_WORKSPACE_ID"
        ON "core"."whatsappTemplate" ("workspaceId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "core"."whatsappTemplate"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "core"."whatsappContactWindow"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "core"."whatsappMessage"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "core"."whatsappInstance"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "core"."whatsappMessage_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "core"."whatsappMessage_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "core"."whatsappMessage_direction_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "core"."whatsappInstance_connectionStatus_enum"`,
    );
  }
}
