// FORK: Zellate — vincula a conversa do WhatsApp ao Contato (person) e ao
// Lead (opportunity) do workspace, e adiciona a pausa do bot por conversa.
// O backfill liga janelas existentes pelo telefone normalizado.
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

@RegisteredInstanceCommand('2.16.0', 1784246400000)
export class LinkWhatsappWindowToCrmFastInstanceCommand
  implements FastInstanceCommand
{
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE core."whatsappContactWindow"
        ADD COLUMN IF NOT EXISTS "personId" uuid,
        ADD COLUMN IF NOT EXISTS "opportunityId" uuid,
        ADD COLUMN IF NOT EXISTS "botPaused" boolean NOT NULL DEFAULT false
    `);

    // Backfill por workspace: casa o telefone da janela com o telefone
    // primário do person e pega o lead mais recente apontando para ele.
    const workspaces: Array<{ workspaceId: string }> = await queryRunner.query(`
      SELECT DISTINCT "workspaceId" FROM core."whatsappContactWindow"
    `);

    for (const { workspaceId } of workspaces) {
      const schemaName = getWorkspaceSchemaName(workspaceId);

      const [{ existe }] = await queryRunner.query(
        `SELECT to_regclass($1) IS NOT NULL AS existe`,
        [`${schemaName}.person`],
      );

      if (!existe) {
        continue;
      }

      await queryRunner.query(`
        UPDATE core."whatsappContactWindow" cw
        SET "personId" = p.id
        FROM "${schemaName}"."person" p
        WHERE cw."workspaceId" = '${workspaceId}'
          AND cw."personId" IS NULL
          AND cw."phoneNumber" IS NOT NULL
          AND regexp_replace(p."phonesPrimaryPhoneNumber", '\\D', '', 'g') = cw."phoneNumber"
      `);

      await queryRunner.query(`
        UPDATE core."whatsappContactWindow" cw
        SET "opportunityId" = o.id
        FROM "${schemaName}"."opportunity" o
        WHERE cw."workspaceId" = '${workspaceId}'
          AND cw."opportunityId" IS NULL
          AND cw."personId" IS NOT NULL
          AND o."pointOfContactId" = cw."personId"
          AND o."deletedAt" IS NULL
      `);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE core."whatsappContactWindow"
        DROP COLUMN IF EXISTS "personId",
        DROP COLUMN IF EXISTS "opportunityId",
        DROP COLUMN IF EXISTS "botPaused"
    `);
  }
}
