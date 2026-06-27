// FORK: Voka CRM — cria objetos custom Voka faltantes no workspace sem destruir dados
import { Logger } from '@nestjs/common';

import { Command, CommandRunner } from 'nest-commander';

import { SEED_APPLE_WORKSPACE_ID } from 'src/engine/workspace-manager/dev-seeder/core/constants/seeder-workspaces.constant';
import { ETAPA_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-fields/constants/etapa-custom-field-seeds.constant';
import { FUNIL_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-fields/constants/funil-custom-field-seeds.constant';
import { CLIENTE_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-fields/constants/cliente-custom-field-seeds.constant';
import { PRODUTO_CUSTOM_FIELD_SEEDS } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-fields/constants/produto-custom-field-seeds.constant';
import { ETAPA_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-objects/constants/etapa-custom-object-seed.constant';
import { FUNIL_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-objects/constants/funil-custom-object-seed.constant';
import { CLIENTE_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-objects/constants/cliente-custom-object-seed.constant';
import { PRODUTO_CUSTOM_OBJECT_SEED } from 'src/engine/workspace-manager/dev-seeder/metadata/custom-objects/constants/produto-custom-object-seed.constant';
import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';
import { type ObjectMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/object-metadata-seed.type';
import { FieldMetadataService } from 'src/engine/metadata-modules/field-metadata/services/field-metadata.service';
import { ObjectMetadataService } from 'src/engine/metadata-modules/object-metadata/object-metadata.service';

type VokaObjectEntry = {
  seed: ObjectMetadataSeed;
  fields?: FieldMetadataSeed[];
};

@Command({
  name: 'voka:seed:objects',
  description:
    'Cria objetos custom Voka (funil, etapa, cliente, produto) se ainda não existirem. Idempotente — não destrói dados.',
})
export class SeedVokaObjectsCommand extends CommandRunner {
  private readonly logger = new Logger(SeedVokaObjectsCommand.name);

  constructor(
    private readonly objectMetadataService: ObjectMetadataService,
    private readonly fieldMetadataService: FieldMetadataService,
  ) {
    super();
  }

  async run(): Promise<void> {
    const workspaceId = SEED_APPLE_WORKSPACE_ID;

    const vokaObjects: VokaObjectEntry[] = [
      { seed: FUNIL_CUSTOM_OBJECT_SEED, fields: FUNIL_CUSTOM_FIELD_SEEDS },
      { seed: ETAPA_CUSTOM_OBJECT_SEED, fields: ETAPA_CUSTOM_FIELD_SEEDS },
      { seed: CLIENTE_CUSTOM_OBJECT_SEED, fields: CLIENTE_CUSTOM_FIELD_SEEDS },
      { seed: PRODUTO_CUSTOM_OBJECT_SEED, fields: PRODUTO_CUSTOM_FIELD_SEEDS },
    ];

    for (const { seed, fields } of vokaObjects) {
      let objectMetadata =
        await this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
          where: { nameSingular: seed.nameSingular },
        });

      if (objectMetadata) {
        this.logger.log(`✓ ${seed.nameSingular} já existe — pulando`);
        continue;
      }

      this.logger.log(`→ Criando ${seed.nameSingular}…`);

      try {
        await this.objectMetadataService.createOneObject({
          createObjectInput: seed,
          workspaceId,
        });
      } catch (err) {
        this.logger.error(`Falha ao criar ${seed.nameSingular}: ${String(err)}`);
        continue;
      }

      if (fields && fields.length > 0) {
        objectMetadata =
          await this.objectMetadataService.findOneWithinWorkspace(workspaceId, {
            where: { nameSingular: seed.nameSingular },
          });

        if (!objectMetadata) {
          this.logger.warn(`Objeto ${seed.nameSingular} criado mas não encontrado — pulando campos`);
          continue;
        }

        try {
          await this.fieldMetadataService.createManyFields({
            createFieldInputs: fields.map((f) => ({
              ...f,
              objectMetadataId: objectMetadata!.id,
            })),
            workspaceId,
          });
          this.logger.log(`  ✓ ${fields.length} campo(s) criado(s)`);
        } catch (err) {
          this.logger.error(`Falha ao criar campos de ${seed.nameSingular}: ${String(err)}`);
        }
      }

      this.logger.log(`✓ ${seed.nameSingular} criado com sucesso`);
    }

    this.logger.log('voka:seed:objects concluído');
  }
}
