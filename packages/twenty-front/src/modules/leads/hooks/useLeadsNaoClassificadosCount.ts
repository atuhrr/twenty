// FORK: Voka CRM — Fase 5: count of unclassified (incoming) leads for nav badge
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import type { RecordGqlOperationFilter } from 'twenty-shared/types';

const UNCLASSIFIED_FILTER: RecordGqlOperationFilter = {
  isUnclassified: { eq: true },
};

export const useLeadsNaoClassificadosCount = () => {
  const { totalCount } = useFindManyRecords({
    objectNameSingular: 'opportunity',
    filter: UNCLASSIFIED_FILTER,
    limit: 1,
    recordGqlFields: { id: true },
  });

  return totalCount ?? 0;
};
