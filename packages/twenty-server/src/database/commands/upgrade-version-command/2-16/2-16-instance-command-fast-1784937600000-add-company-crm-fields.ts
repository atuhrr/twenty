// FORK: Zellate — F1 Empresa 360: campos standard `employees` (NUMBER) e
// `cnpj` (TEXT) em workspaces JÁ EXISTENTES. Workspaces novos ganham os campos
// na ativação (compute-company-standard-flat-field-metadata + registro em
// twenty-shared). Este comando replica, para os existentes, o que a ativação
// faria: coluna física no schema do workspace + linha de fieldMetadata (o cache
// flush pós-upgrade regenera o schema GraphQL). Espelha o precedente
// add-is-unclassified-to-opportunity.
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';
import { getWorkspaceSchemaName } from 'src/engine/workspace-datasource/utils/get-workspace-schema-name.util';

// Mesmos universalIdentifiers do registro STANDARD_OBJECTS (twenty-shared)
const EMPLOYEES_UNIVERSAL_IDENTIFIER = 'f669c073-004c-4c0f-ad9f-c2dda5a0d54b';
const CNPJ_UNIVERSAL_IDENTIFIER = '970702fc-15bc-4637-9995-2cf0574010c1';

@RegisteredInstanceCommand('2.16.0', 1784937600000)
export class AddCompanyCrmFieldsFastInstanceCommand
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

      // Colunas físicas
      await queryRunner.query(`
        ALTER TABLE "${schemaName}"."company"
          ADD COLUMN IF NOT EXISTS "employees" numeric
      `);
      await queryRunner.query(`
        ALTER TABLE "${schemaName}"."company"
          ADD COLUMN IF NOT EXISTS "cnpj" text
      `);

      // fieldMetadata: employees (NUMBER, inteiro)
      await queryRunner.query(
        `
        INSERT INTO core."fieldMetadata"
          (id, "objectMetadataId", type, name, label, "defaultValue",
           description, icon, settings, "isActive", "isSystem", "isUIReadOnly",
           "isNullable", "workspaceId", "isLabelSyncedWithName",
           "universalIdentifier", "applicationId", "isUIEditable",
           "isSystemSideEffect")
        SELECT gen_random_uuid(), om.id, 'NUMBER', 'employees',
               'Funcionários', NULL,
               'Número de funcionários da empresa', 'IconUsers',
               '{"dataType":"int"}'::jsonb,
               true, false, false, true, om."workspaceId", false,
               $1, om."applicationId", true, false
        FROM core."objectMetadata" om
        WHERE om.id = $2
          AND NOT EXISTS (
            SELECT 1 FROM core."fieldMetadata" f
            WHERE f."objectMetadataId" = om.id AND f.name = 'employees'
          )
      `,
        [EMPLOYEES_UNIVERSAL_IDENTIFIER, ws.objectMetadataId],
      );

      // fieldMetadata: cnpj (TEXT)
      await queryRunner.query(
        `
        INSERT INTO core."fieldMetadata"
          (id, "objectMetadataId", type, name, label, "defaultValue",
           description, icon, "isActive", "isSystem", "isUIReadOnly",
           "isNullable", "workspaceId", "isLabelSyncedWithName",
           "universalIdentifier", "applicationId", "isUIEditable",
           "isSystemSideEffect")
        SELECT gen_random_uuid(), om.id, 'TEXT', 'cnpj',
               'CNPJ', NULL,
               'CNPJ da empresa', 'IconId',
               true, false, false, true, om."workspaceId", false,
               $1, om."applicationId", true, false
        FROM core."objectMetadata" om
        WHERE om.id = $2
          AND NOT EXISTS (
            SELECT 1 FROM core."fieldMetadata" f
            WHERE f."objectMetadataId" = om.id AND f.name = 'cnpj'
          )
      `,
        [CNPJ_UNIVERSAL_IDENTIFIER, ws.objectMetadataId],
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM core."fieldMetadata"
      WHERE "universalIdentifier" IN (
        '${EMPLOYEES_UNIVERSAL_IDENTIFIER}',
        '${CNPJ_UNIVERSAL_IDENTIFIER}'
      )
    `);
    // As colunas físicas permanecem (drop destrutivo por workspace é
    // intencionalmente evitado na reversão).
  }
}
