import { AggregateOperations, ViewType, ViewKey } from 'twenty-shared/types';

import { type FlatView } from 'src/engine/metadata-modules/flat-view/types/flat-view.type';

import {
  createStandardViewFlatMetadata,
  type CreateStandardViewArgs,
} from 'src/engine/workspace-manager/twenty-standard-application/utils/view/create-standard-view-flat-metadata.util';

export const computeStandardOpportunityViews = (
  args: Omit<CreateStandardViewArgs<'opportunity'>, 'context'>,
): Record<string, FlatView> => {
  return {
    allOpportunities: createStandardViewFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'allOpportunities',
        name: 'All {objectLabelPlural}',
        type: ViewType.TABLE,
        // FORK: demoted to non-index so Kanban opens by default
        key: null,
        position: 1,
        icon: 'IconList',
      },
    }),
    byStage: createStandardViewFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'byStage',
        name: 'By Stage',
        type: ViewType.KANBAN,
        // FORK: Kanban is now the INDEX (default) view for Opportunities
        key: ViewKey.INDEX,
        position: 0,
        icon: 'IconLayoutKanban',
        mainGroupByFieldName: 'stage',
        kanbanAggregateOperation: AggregateOperations.SUM,
        kanbanAggregateOperationFieldName: 'amount',
      },
    }),
    opportunityRecordPageFields: createStandardViewFlatMetadata({
      ...args,
      objectName: 'opportunity',
      context: {
        viewName: 'opportunityRecordPageFields',
        name: 'Opportunity Record Page Fields',
        type: ViewType.FIELDS_WIDGET,
        key: null,
        position: 0,
        icon: 'IconList',
      },
    }),
  };
};
