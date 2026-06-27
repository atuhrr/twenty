// FORK: Voka CRM — campos do Funil de Vendas
import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const FUNIL_CUSTOM_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.TEXT,
    label: 'Descrição',
    name: 'descricao',
  },
  {
    type: FieldMetadataType.BOOLEAN,
    label: 'Padrão',
    name: 'isPadrao',
    defaultValue: false,
  },
];
