// FORK: Zellate — campo standard isUnclassified em workspaces JÁ EXISTENTES.
// Workspaces novos ganham o campo na ativação (via
// compute-opportunity-standard-flat-field-metadata + registro em
// twenty-shared). Este comando replica, para os existentes, o que a
// ativação faria: coluna física no schema do workspace + linha de
// fieldMetadata (o cache flush pós-upgrade regenera o schema GraphQL).
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

// Mesmo universalIdentifier do registro STANDARD_OBJECTS (twenty-shared)
const IS_UNCLASSIFIED_UNIVERSAL_IDENTIFIER =
  '20202020-4c1b-47e5-b52a-9e1d3fca8b06';

@RegisteredInstanceCommand('2.16.0', 1784160000000)
export class AddIsUnclassifiedToOpportunityFastInstanceCommand
  implements FastInstanceCommand
{
  async up(queryRunner: QueryRunner): Promise<void> {
    const workspaces: Array<{ objectMetadataId: string; schema: string }> =
      await queryRunner.query(`
        SELECT om.id AS "objectMetadataId", ds.schema
        FROM core."objectMetadata" om
        JOIN core."dataSource" ds ON ds."workspaceId" = om."workspaceId"
        WHERE om."nameSingular" = 'opportunity'
          AND ds.schema IS NOT NULL
      `);

    for (const ws of workspaces) {
      await queryRunner.query(`
        ALTER TABLE ${queryRunner.connection.driver.escape(ws.schema)}."opportunity"
          ADD COLUMN IF NOT EXISTS "isUnclassified" boolean NOT NULL DEFAULT false
      `);

      await queryRunner.query(
        `
        INSERT INTO core."fieldMetadata"
          (id, "objectMetadataId", type, name, label, "defaultValue",
           description, icon, "isActive", "isSystem", "isUIReadOnly",
           "isNullable", "workspaceId", "isLabelSyncedWithName",
           "universalIdentifier", "applicationId", "isUIEditable",
           "isSystemSideEffect")
        SELECT gen_random_uuid(), om.id, 'BOOLEAN', 'isUnclassified',
               'Não classificado', 'false'::jsonb,
               'Lead de entrada aguardando classificação', 'IconInbox',
               true, false, false, false, om."workspaceId", false,
               $1, om."applicationId", true, false
        FROM core."objectMetadata" om
        WHERE om.id = $2
          AND NOT EXISTS (
            SELECT 1 FROM core."fieldMetadata" f
            WHERE f."objectMetadataId" = om.id AND f.name = 'isUnclassified'
          )
      `,
        [IS_UNCLASSIFIED_UNIVERSAL_IDENTIFIER, ws.objectMetadataId],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM core."fieldMetadata"
      WHERE name = 'isUnclassified'
        AND "universalIdentifier" = '${IS_UNCLASSIFIED_UNIVERSAL_IDENTIFIER}'
    `);
    // As colunas físicas permanecem (drop destrutivo por workspace é
    // intencionalmente evitado na reversão).
  }
}
