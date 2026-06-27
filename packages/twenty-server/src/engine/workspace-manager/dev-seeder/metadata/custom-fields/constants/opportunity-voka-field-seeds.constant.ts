// FORK: Voka CRM — campos extras para Lead (Opportunity)
import { FieldMetadataType } from 'twenty-shared/types';

import { type FieldMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/field-metadata-seed.type';

export const OPPORTUNITY_VOKA_FIELD_SEEDS: FieldMetadataSeed[] = [
  {
    type: FieldMetadataType.SELECT,
    label: 'Fonte',
    name: 'fonte',
    options: [
      { label: 'Site', value: 'SITE', position: 0, color: 'blue' },
      { label: 'Indicação', value: 'INDICACAO', position: 1, color: 'green' },
      { label: 'Cold Call', value: 'COLD_CALL', position: 2, color: 'orange' },
      { label: 'WhatsApp', value: 'WHATSAPP', position: 3, color: 'turquoise' },
      { label: 'Instagram', value: 'INSTAGRAM', position: 4, color: 'pink' },
      { label: 'Facebook', value: 'FACEBOOK', position: 5, color: 'sky' },
      { label: 'LinkedIn', value: 'LINKEDIN', position: 6, color: 'blue' },
      { label: 'Evento', value: 'EVENTO', position: 7, color: 'purple' },
      { label: 'Outro', value: 'OUTRO', position: 8, color: 'gray' },
    ],
  },
  {
    type: FieldMetadataType.SELECT,
    label: 'Status',
    name: 'statusLead',
    options: [
      { label: 'Aberto', value: 'ABERTO', position: 0, color: 'blue' },
      { label: 'Ganho', value: 'GANHO', position: 1, color: 'green' },
      { label: 'Perdido', value: 'PERDIDO', position: 2, color: 'red' },
    ],
  },
  {
    type: FieldMetadataType.NUMBER,
    label: 'Score',
    name: 'score',
    defaultValue: 0,
  },
  {
    type: FieldMetadataType.TEXT,
    label: 'Motivo da Perda',
    name: 'motivoPerda',
  },
  {
    type: FieldMetadataType.MULTI_SELECT,
    label: 'Etiquetas',
    name: 'etiquetas',
    options: [
      { label: 'Urgente', value: 'URGENTE', position: 0, color: 'red' },
      { label: 'VIP', value: 'VIP', position: 1, color: 'purple' },
      { label: 'Parceiro', value: 'PARCEIRO', position: 2, color: 'blue' },
      { label: 'Reativação', value: 'REATIVACAO', position: 3, color: 'orange' },
      { label: 'Indicação', value: 'INDICACAO', position: 4, color: 'green' },
    ],
  },
  // FORK: Voka CRM — Fase 5: flags lead as "incoming" (queue before funnel assignment)
  {
    type: FieldMetadataType.BOOLEAN,
    label: 'Não Classificado',
    name: 'isUnclassified',
    defaultValue: false,
  },
];
