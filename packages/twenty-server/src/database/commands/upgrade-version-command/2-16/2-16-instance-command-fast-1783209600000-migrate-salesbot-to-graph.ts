// FORK: Voka CRM — Fase 14.1: migra salesbot de nodes[] flat para graph JSONB
import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1783209600000)
export class MigrateSalesbotToGraphFastInstanceCommand
  implements FastInstanceCommand
{
  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Adiciona as novas colunas
    await queryRunner.query(`
      ALTER TABLE core."salesbot"
        ADD COLUMN IF NOT EXISTS "graph"    jsonb NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
        ADD COLUMN IF NOT EXISTS "triggers" jsonb NOT NULL DEFAULT '[]'
    `);

    // 2. Migra dados existentes: converte nodes[] + trigger/triggerKeyword → graph + triggers
    //    (sem dados em prod, mas a migration deve ser correta para testes)
    await queryRunner.query(`
      UPDATE core."salesbot"
      SET
        "graph" = jsonb_build_object(
          'nodes', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id',       elem->>'id',
                'type',     elem->>'type',
                'config',   elem - 'id' - 'type' - 'nextNodeId'
                              - 'trueNextNodeId' - 'falseNextNodeId',
                'position', jsonb_build_object(
                  'x', 300 + (ordinality - 1) * 0,
                  'y', 100 + (ordinality - 1) * 160
                )
              )
            )
            FROM jsonb_array_elements("nodes") WITH ORDINALITY AS t(elem, ordinality)
          ),
          'edges', (
            SELECT COALESCE(jsonb_agg(e), '[]'::jsonb)
            FROM (
              SELECT jsonb_build_object(
                'id',           gen_random_uuid()::text,
                'source',       elem->>'id',
                'target',       elem->>'nextNodeId',
                'sourceHandle', 'output',
                'targetHandle', 'input'
              ) AS e
              FROM jsonb_array_elements("nodes") AS t(elem)
              WHERE elem->>'nextNodeId' IS NOT NULL
              UNION ALL
              SELECT jsonb_build_object(
                'id',           gen_random_uuid()::text,
                'source',       elem->>'id',
                'target',       elem->>'trueNextNodeId',
                'sourceHandle', 'true',
                'targetHandle', 'input'
              ) AS e
              FROM jsonb_array_elements("nodes") AS t(elem)
              WHERE elem->>'trueNextNodeId' IS NOT NULL
              UNION ALL
              SELECT jsonb_build_object(
                'id',           gen_random_uuid()::text,
                'source',       elem->>'id',
                'target',       elem->>'falseNextNodeId',
                'sourceHandle', 'false',
                'targetHandle', 'input'
              ) AS e
              FROM jsonb_array_elements("nodes") AS t(elem)
              WHERE elem->>'falseNextNodeId' IS NOT NULL
            ) sub
          )
        ),
        "triggers" = jsonb_build_array(
          jsonb_build_object(
            'type',    "trigger",
            'keyword', "triggerKeyword"
          )
        )
      WHERE jsonb_array_length("nodes") > 0
    `);

    // 3. Remove as colunas antigas
    await queryRunner.query(`
      ALTER TABLE core."salesbot"
        DROP COLUMN IF EXISTS "nodes",
        DROP COLUMN IF EXISTS "trigger",
        DROP COLUMN IF EXISTS "triggerKeyword"
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Reverte: recria colunas legadas (sem dados — não há como reconstruir exatamente)
    await queryRunner.query(`
      ALTER TABLE core."salesbot"
        ADD COLUMN IF NOT EXISTS "nodes"          jsonb NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "trigger"        text  NOT NULL DEFAULT 'KEYWORD',
        ADD COLUMN IF NOT EXISTS "triggerKeyword" text
    `);

    await queryRunner.query(`
      ALTER TABLE core."salesbot"
        DROP COLUMN IF EXISTS "graph",
        DROP COLUMN IF EXISTS "triggers"
    `);
  }
}
