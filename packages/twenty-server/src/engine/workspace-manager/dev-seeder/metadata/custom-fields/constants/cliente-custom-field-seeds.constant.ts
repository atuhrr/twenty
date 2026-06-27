// FORK: Voka CRM — campos do Cliente
import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const CLIENTE_CUSTOM_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.EMAILS,
    label: 'E-mail',
    name: 'email',
  },
  {
    type: FieldMetadataType.PHONES,
    label: 'Telefone',
    name: 'telefone',
  },
  {
    type: FieldMetadataType.SELECT,
    label: 'Periodicidade',
    name: 'periodicidade',
    options: [
      { label: 'Semanal', value: 'SEMANAL', position: 0, color: 'blue' },
      { label: 'Mensal', value: 'MENSAL', position: 1, color: 'green' },
      { label: 'Trimestral', value: 'TRIMESTRAL', position: 2, color: 'orange' },
      { label: 'Semestral', value: 'SEMESTRAL', position: 3, color: 'yellow' },
      { label: 'Anual', value: 'ANUAL', position: 4, color: 'purple' },
    ],
  },
  {
    type: FieldMetadataType.CURRENCY,
    label: 'Valor Médio',
    name: 'valorMedio',
  },
  {
    type: FieldMetadataType.DATE,
    label: 'Última Compra',
    name: 'ultimaCompra',
  },
  {
    type: FieldMetadataType.DATE,
    label: 'Próximo Contato',
    name: 'proximoContato',
  },
  {
    type: FieldMetadataType.CURRENCY,
    label: 'Valor Recorrente',
    name: 'valorRecorrente',
  },
];
