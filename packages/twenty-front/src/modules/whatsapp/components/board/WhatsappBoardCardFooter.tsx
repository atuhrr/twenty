import { styled } from '@linaria/react';

import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { useLastWhatsappMessage } from '@/whatsapp/hooks/useLastWhatsappMessage';

type WhatsappBoardCardFooterProps = {
  recordId: string;
};

// Origin tag display config per DESIGN_SPEC §5
const ORIGIN_STYLES: Record<string, { bg: string; color: string }> = {
  'Tráfego Pago': { bg: '#E3EDFF', color: '#2563EB' },
  'Revendedor': { bg: '#FFF0DF', color: '#EA8C00' },
  'Compra': { bg: '#E2F6E8', color: '#1DAA52' },
  'Interesse': { bg: '#FFF6DA', color: '#B7891A' },
  'Proposta Enviada': { bg: '#EFE7FF', color: '#7C5CFC' },
  'Ganho': { bg: '#E2F6E8', color: '#1DAA52' },
};

const DEFAULT_ORIGIN_STYLE = { bg: '#F4F5F8', color: '#8B8B9A' };

const StyledFooter = styled.div`
  border-top: 1px solid #e8e9ef;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 10px 8px;
`;

const StyledPreview = styled.p`
  color: #8b8b9a;
  display: -webkit-box;
  font-size: 13px;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin: 0;
  overflow: hidden;
`;

const StyledBaseline = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`;

const StyledRelativeTime = styled.span`
  color: #8b8b9a;
  font-size: 11px;
`;

const StyledOriginChip = styled.span<{ bg: string; color: string }>`
  background: ${({ bg }) => bg};
  border-radius: 4px;
  color: ${({ color }) => color};
  font-size: 11px;
  font-weight: 500;
  padding: 2px 6px;
`;

const formatRelativeTime = (isoString: string): string => {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);

  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);

  return `${diffD}d`;
};

export const WhatsappBoardCardFooter = ({
  recordId,
}: WhatsappBoardCardFooterProps) => {
  const { message } = useLastWhatsappMessage(recordId);

  // FORK: reads whatsappOriginTag custom field from workspace Person metadata
  const record = useAtomFamilyStateValue(recordStoreFamilyState, recordId);
  const originLabel = (record as Record<string, unknown>)?.whatsappOriginTag as
    | string
    | undefined;

  if (!message && !originLabel) {
    return null;
  }

  const originStyle =
    originLabel && ORIGIN_STYLES[originLabel]
      ? ORIGIN_STYLES[originLabel]
      : DEFAULT_ORIGIN_STYLE;

  return (
    <StyledFooter>
      {message?.content && (
        <StyledPreview>Mensagem: {message.content}</StyledPreview>
      )}
      <StyledBaseline>
        <StyledRelativeTime>
          {message ? formatRelativeTime(message.timestamp) : ''}
        </StyledRelativeTime>
        {originLabel && (
          <StyledOriginChip bg={originStyle.bg} color={originStyle.color}>
            {originLabel}
          </StyledOriginChip>
        )}
      </StyledBaseline>
    </StyledFooter>
  );
};
