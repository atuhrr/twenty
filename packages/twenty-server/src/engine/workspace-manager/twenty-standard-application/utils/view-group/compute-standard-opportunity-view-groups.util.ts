import { type FlatViewGroup } from 'src/engine/metadata-modules/flat-view-group/types/flat-view-group.type';
import {
  createStandardViewGroupFlatMetadata,
  type CreateStandardViewGroupArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view-group/create-standard-view-group-flat-metadata.util';

// FORK: Voka CRM — os fieldValues apontam para as etapas Kommo do campo stage
// (compute-opportunity-standard-flat-field-metadata.util.ts, fonte das opções).
// Os viewGroupNames são chaves do registro STANDARD_OBJECTS de twenty-shared
// (IDs universais fixos) e não podem ser renomeados.
export const computeStandardOpportunityViewGroups = (
  args: Omit<CreateStandardViewGroupArgs<'opportunity'>, 'context'>,
): Record<string, FlatViewGroup> => {
  return {
    byStageNew: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'new',
        isVisible: true,
        fieldValue: 'LEADS_RECEBIDOS',
        position: 0,
      },
    }),
    byStageScreening: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'screening',
        isVisible: true,
        fieldValue: 'TOMADA_DECISAO',
        position: 1,
      },
    }),
    byStageMeeting: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'meeting',
        isVisible: true,
        fieldValue: 'NEGOCIACAO',
        position: 2,
      },
    }),
    byStageProposal: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'proposal',
        isVisible: true,
        fieldValue: 'DECISAO_FINAL',
        position: 3,
      },
    }),
    byStageCustomer: createStandardViewGroupFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        viewGroupName: 'customer',
        isVisible: true,
        fieldValue: 'GANHO',
        position: 4,
      },
    }),
  };
};
