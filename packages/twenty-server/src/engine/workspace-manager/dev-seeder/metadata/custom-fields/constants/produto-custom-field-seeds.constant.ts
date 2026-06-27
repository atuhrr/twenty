// FORK: Voka CRM — campos do Produto (Catálogo)
import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const PRODUTO_CUSTOM_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.TEXT,
    label: 'Descrição',
    name: 'descricao',
  },
  {
    type: FieldMetadataType.CURRENCY,
    label: 'Preço',
    name: 'preco',
  },
  {
    type: FieldMetadataType.SELECT,
    label: 'Categoria',
    name: 'categoria',
    options: [
      { label: 'Produto', value: 'PRODUTO', position: 0, color: 'blue' },
      { label: 'Serviço', value: 'SERVICO', position: 1, color: 'green' },
      { label: 'Assinatura', value: 'ASSINATURA', position: 2, color: 'purple' },
      { label: 'Consultoria', value: 'CONSULTORIA', position: 3, color: 'orange' },
      { label: 'Outro', value: 'OUTRO', position: 4, color: 'gray' },
    ],
  },
  {
    type: FieldMetadataType.BOOLEAN,
    label: 'Ativo',
    name: 'ativo',
    defaultValue: true,
  },
];
