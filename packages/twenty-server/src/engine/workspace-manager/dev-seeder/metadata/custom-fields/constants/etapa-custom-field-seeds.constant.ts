// FORK: Voka CRM — campos da Etapa (Stage)
import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const ETAPA_CUSTOM_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.SELECT,
    label: 'Cor',
    name: 'cor',
    options: [
      { label: 'Amarelo', value: 'AMARELO', position: 0, color: 'yellow' },
      { label: 'Roxo', value: 'ROXO', position: 1, color: 'purple' },
      { label: 'Verde', value: 'VERDE', position: 2, color: 'green' },
      { label: 'Azul', value: 'AZUL', position: 3, color: 'blue' },
      { label: 'Laranja', value: 'LARANJA', position: 4, color: 'orange' },
      { label: 'Vermelho', value: 'VERMELHO', position: 5, color: 'red' },
      { label: 'Turquesa', value: 'TURQUESA', position: 6, color: 'turquoise' },
      { label: 'Cinza', value: 'CINZA', position: 7, color: 'gray' },
    ],
  },
  {
    type: FieldMetadataType.NUMBER,
    label: 'Posição',
    name: 'posicao',
    defaultValue: 0,
  },
  {
    type: FieldMetadataType.NUMBER,
    label: 'Probabilidade (%)',
    name: 'probabilidade',
    defaultValue: 0,
  },
];
