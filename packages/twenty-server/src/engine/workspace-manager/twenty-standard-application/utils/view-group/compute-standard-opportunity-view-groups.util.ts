import { type FlatViewGroup } from 'src/engine/metadata-modules/flat-view-group/types/flat-view-group.type';
import {
  createStandardViewGroupFlatMetadata,
  type CreateStandardViewGroupArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-group/create-standard-view-group-flat-metadata.util';

// FORK: Voka CRM — grupos do kanban alinhados às etapas Kommo do campo stage
// (compute-opportunity-standard-flat-field-metadata.util.ts, fonte das opções).
export const computeStandardOpportunityViewGroups = (
  args: Omit<CreateStandardViewGroupArgs<'opportunity'>, 'context'>,
): Record<string, FlatViewGroup> => {
  return {
    byStageLeadsRecebidos: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'leadsRecebidos',
        isVisible: true,
        fieldValue: 'LEADS_RECEBIDOS',
        position: 0,
      },
    }),
    byStageTomadaDecisao: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'tomadaDecisao',
        isVisible: true,
        fieldValue: 'TOMADA_DECISAO',
        position: 1,
      },
    }),
    byStageNegociacao: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'negociacao',
        isVisible: true,
        fieldValue: 'NEGOCIACAO',
        position: 2,
      },
    }),
    byStageDecisaoFinal: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'decisaoFinal',
        isVisible: true,
        fieldValue: 'DECISAO_FINAL',
        position: 3,
      },
    }),
    byStageGanho: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'ganho',
        isVisible: true,
        fieldValue: 'GANHO',
        position: 4,
      },
    }),
  };
};
