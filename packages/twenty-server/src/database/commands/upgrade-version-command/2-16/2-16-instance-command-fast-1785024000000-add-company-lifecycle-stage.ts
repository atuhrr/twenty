// FORK: Zellate — F2 Cliente: campo standard SELECT `lifecycleStage` no company
// em workspaces JÁ EXISTENTES. SELECT vira enum nativo do Postgres
// (computePostgresEnumName = `<table>_<column>_enum`), então além da coluna e do
// fieldMetadata é preciso CRIAR O ENUM. Faz backfill do ciclo a partir dos
// negócios: tem GANHO → CLIENTE, tem negócio → OPORTUNIDADE, senão LEAD.
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

const LIFECYCLE_UNIVERSAL_IDENTIFIER = '750eb078-305a-4bee-9d1d-f8f13ae310ed';

// Espelha exatamente as opções do compute-company-standard-flat-field-metadata
const OPTIONS_JSON = JSON.stringify([
  { id: 'f4762a6d-bdfd-4d64-ba4d-5ff8f65f4f45', value: 'LEAD', label: 'Lead', position: 0, color: 'gray' },
  { id: '183a2d29-a436-451f-b67a-19cd471e902a', value: 'OPORTUNIDADE', label: 'Oportunidade', position: 1, color: 'blue' },
  { id: '2b6c740a-b319-4dbb-b3c5-e2fa8da690f0', value: 'CLIENTE', label: 'Cliente', position: 2, color: 'green' },
  { id: '116117d2-fded-4b8b-a741-f5c4f9b252d6', value: 'INATIVO', label: 'Inativo', position: 3, color: 'red' },
]);

@RegisteredInstanceCommand('2.16.0', 1785024000000)
export class AddCompanyLifecycleStageFastInstanceCommand
  implements FastInstanceCommand
{
  async up(queryRunner: QueryRunner): Promise<void> {
    const workspaces: Array<{ objectMetadataId: string; workspaceId: string }> =
      await queryRunner.query(`
        SELECT om.id AS "objectMetadataId", om."workspaceId" AS "workspaceId"
        FROM core."objectMetadata" om
        WHERE om."nameSingular" = 'company'
      `);

    for (const ws of workspaces) {
      const schemaName = getWorkspaceSchemaName(ws.workspaceId);

      const [{ existe }] = await queryRunner.query(
        `SELECT to_regclass($1) IS NOT NULL AS existe`,
        [`${schemaName}.company`],
      );

      if (!existe) {
        continue;
      }

      // Enum nativo (idempotente)
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE "${schemaName}"."company_lifecycleStage_enum"
            AS ENUM ('LEAD', 'OPORTUNIDADE', 'CLIENTE', 'INATIVO');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);

      // Coluna física com default LEAD (espelha o defaultValue do compute)
      await queryRunner.query(`
        ALTER TABLE "${schemaName}"."company"
          ADD COLUMN IF NOT EXISTS "lifecycleStage"
            "${schemaName}"."company_lifecycleStage_enum" DEFAULT 'LEAD'
      `);

      // Backfill a partir dos negócios
      await queryRunner.query(`
        UPDATE "${schemaName}"."company" c
        SET "lifecycleStage" = 'CLIENTE'
        WHERE EXISTS (
          SELECT 1 FROM "${schemaName}"."opportunity" o
          WHERE o."companyId" = c.id AND o.stage = 'GANHO'
        )
      `);
      await queryRunner.query(`
        UPDATE "${schemaName}"."company" c
        SET "lifecycleStage" = 'OPORTUNIDADE'
        WHERE c."lifecycleStage" = 'LEAD'
          AND EXISTS (
            SELECT 1 FROM "${schemaName}"."opportunity" o
            WHERE o."companyId" = c.id
          )
      `);

      // fieldMetadata (SELECT com options)
      await queryRunner.query(
        `
        INSERT INTO core."fieldMetadata"
          (id, "objectMetadataId", type, name, label, "defaultValue",
           description, icon, options, "isActive", "isSystem", "isUIReadOnly",
           "isNullable", "workspaceId", "isLabelSyncedWithName",
           "universalIdentifier", "applicationId", "isUIEditable",
           "isSystemSideEffect")
        SELECT gen_random_uuid(), om.id, 'SELECT', 'lifecycleStage',
               'Ciclo de vida', '"''LEAD''"'::jsonb,
               'Estágio do relacionamento com a empresa', 'IconTargetArrow',
               $1::jsonb,
               true, false, false, true, om."workspaceId", false,
               $2, om."applicationId", true, false
        FROM core."objectMetadata" om
        WHERE om.id = $3
          AND NOT EXISTS (
            SELECT 1 FROM core."fieldMetadata" f
            WHERE f."objectMetadataId" = om.id AND f.name = 'lifecycleStage'
          )
      `,
        [OPTIONS_JSON, LIFECYCLE_UNIVERSAL_IDENTIFIER, ws.objectMetadataId],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM core."fieldMetadata"
      WHERE "universalIdentifier" = '${LIFECYCLE_UNIVERSAL_IDENTIFIER}'
    `);
    // Coluna e enum físicos permanecem (reversão não destrói dados).
  }
}
