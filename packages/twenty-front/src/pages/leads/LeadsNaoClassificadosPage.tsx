// FORK: Voka CRM — Fase 5: Leads não classificados (Incoming queue)
/* oxlint-disable twenty/no-hardcoded-colors */
import { styled } from '@linaria/react';
import { useCallback } from 'react';

import { useDeleteOneRecord } from '@/object-record/hooks/useDeleteOneRecord';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import type { ObjectRecord } from '@/object-record/types/ObjectRecord';
import type { RecordGqlOperationFilter } from 'twenty-shared/types';

// ─── Styled ──────────────────────────────────────────────────────────────────

const StyledPage = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  padding: var(--t-spacing-6);
`;

const StyledHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid var(--t-border-color-light);
  display: flex;
  gap: var(--t-spacing-3);
  margin-bottom: var(--t-spacing-6);
  padding-bottom: var(--t-spacing-4);
`;

const StyledTitle = styled.h1`
  color: var(--t-font-color-primary);
  font-size: var(--t-font-size-xl);
  font-weight: var(--t-font-weight-semi-bold);
  margin: 0;
`;

const StyledCount = styled.span`
  background: #7C3AED;
  border-radius: 999px;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  min-width: 20px;
  padding: 2px 7px;
  text-align: center;
`;

const StyledSubtitle = styled.p`
  color: var(--t-font-color-secondary);
  font-size: var(--t-font-size-sm);
  margin: 0;
`;

const StyledList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--t-spacing-3);
  max-width: 800px;
`;

const StyledCard = styled.div`
  background: var(--t-background-primary);
  border: 1px solid var(--t-border-color-light);
  border-radius: var(--t-border-radius-md);
  display: flex;
  flex-direction: column;
  gap: var(--t-spacing-2);
  padding: var(--t-spacing-4);
`;

const StyledCardTop = styled.div`
  align-items: flex-start;
  display: flex;
  gap: var(--t-spacing-3);
`;

const StyledChannelBadge = styled.span`
  background: var(--t-background-tertiary);
  border-radius: var(--t-border-radius-sm);
  color: var(--t-font-color-secondary);
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  padding: 2px 8px;
  text-transform: uppercase;
`;

const StyledLeadInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const StyledLeadName = styled.div`
  color: #2E90FA;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledLeadMeta = styled.div`
  color: var(--t-font-color-secondary);
  font-size: 12px;
  margin-top: 2px;
`;

const StyledPreview = styled.div`
  color: var(--t-font-color-tertiary);
  font-size: 13px;
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledActions = styled.div`
  display: flex;
  flex-shrink: 0;
  gap: var(--t-spacing-2);
`;

const StyledAcceptBtn = styled.button`
  background: #12B76A;
  border: none;
  border-radius: var(--t-border-radius-sm);
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;

  &:hover {
    background: #0fa05d;
  }
`;

const StyledRejectBtn = styled.button`
  background: transparent;
  border: 1px solid var(--t-border-color-medium);
  border-radius: var(--t-border-radius-sm);
  color: var(--t-font-color-secondary);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;

  &:hover {
    background: #FEF3F2;
    border-color: #F04438;
    color: #F04438;
  }
`;

const StyledEmpty = styled.div`
  align-items: center;
  color: var(--t-font-color-light);
  display: flex;
  flex-direction: column;
  font-size: var(--t-font-size-md);
  gap: var(--t-spacing-4);
  margin-top: var(--t-spacing-16);
  text-align: center;
`;

const StyledEmptyIcon = styled.div`
  font-size: 48px;
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const UNCLASSIFIED_FILTER: RecordGqlOperationFilter = {
  isUnclassified: { eq: true },
};

const RECORD_GQL_FIELDS = {
  id: true,
  name: true,
  isUnclassified: true,
  stage: true,
  amount: { amountMicros: true, currencyCode: true },
  company: { id: true, name: true },
  pointOfContact: {
    id: true,
    name: { firstName: true, lastName: true },
  },
};

type LeadRecord = ObjectRecord & {
  name?: string | null;
  company?: { name?: string | null } | null;
  pointOfContact?: {
    name?: { firstName?: string | null; lastName?: string | null } | null;
  } | null;
};

const getLeadDisplayName = (record: LeadRecord): string => {
  const poc = record.pointOfContact;
  if (poc?.name) {
    const full = [poc.name.firstName, poc.name.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (full) return full;
  }
  return record.name || 'Lead sem nome';
};

// ─── Component ───────────────────────────────────────────────────────────────

export const LeadsNaoClassificadosPage = () => {
  const { records, loading, totalCount } = useFindManyRecords<LeadRecord>({
    objectNameSingular: 'opportunity',
    filter: UNCLASSIFIED_FILTER,
    recordGqlFields: RECORD_GQL_FIELDS,
    limit: 100,
  });

  const { updateOneRecord } = useUpdateOneRecord();
  const { deleteOneRecord } = useDeleteOneRecord({
    objectNameSingular: 'opportunity',
  });

  const handleAccept = useCallback(
    async (recordId: string) => {
      await updateOneRecord({
        objectNameSingular: 'opportunity',
        idToUpdate: recordId,
        updateOneRecordInput: { isUnclassified: false },
      });
    },
    [updateOneRecord],
  );

  const handleReject = useCallback(
    async (recordId: string) => {
      await deleteOneRecord(recordId);
    },
    [deleteOneRecord],
  );

  const count = totalCount ?? records.length;

  return (
    <StyledPage>
      <StyledHeader>
        <div>
          <StyledTitle>
            Leads não classificados{' '}
            {count > 0 && <StyledCount>{count}</StyledCount>}
          </StyledTitle>
          <StyledSubtitle>
            Leads recebidos de canais externos aguardando triagem. Aceite para
            mover ao funil ou recuse para descartar.
          </StyledSubtitle>
        </div>
      </StyledHeader>

      {loading && (
        <StyledEmpty>
          <StyledEmptyIcon>⏳</StyledEmptyIcon>
          Carregando leads...
        </StyledEmpty>
      )}

      {!loading && records.length === 0 && (
        <StyledEmpty>
          <StyledEmptyIcon>✅</StyledEmptyIcon>
          <div>
            <strong>Tudo em dia!</strong>
            <br />
            Nenhum lead aguarda triagem no momento.
          </div>
        </StyledEmpty>
      )}

      {!loading && records.length > 0 && (
        <StyledList>
          {records.map((record) => {
            const displayName = getLeadDisplayName(record);
            const companyName = record.company?.name;

            return (
              <StyledCard key={record.id}>
                <StyledCardTop>
                  <StyledChannelBadge>WhatsApp</StyledChannelBadge>

                  <StyledLeadInfo>
                    <StyledLeadName>{displayName}</StyledLeadName>
                    {companyName && (
                      <StyledLeadMeta>{companyName}</StyledLeadMeta>
                    )}
                    <StyledPreview>
                      Nova mensagem recebida — clique em Aceitar para ver no
                      funil
                    </StyledPreview>
                  </StyledLeadInfo>

                  <StyledActions>
                    <StyledAcceptBtn
                      onClick={() => handleAccept(record.id)}
                    >
                      Aceitar
                    </StyledAcceptBtn>
                    <StyledRejectBtn
                      onClick={() => handleReject(record.id)}
                    >
                      Recusar
                    </StyledRejectBtn>
                  </StyledActions>
                </StyledCardTop>
              </StyledCard>
            );
          })}
        </StyledList>
      )}
    </StyledPage>
  );
};
