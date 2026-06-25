/* oxlint-disable twenty/no-hardcoded-colors */
import { useEffect } from 'react';

import { styled } from '@linaria/react';

import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { useLastWhatsappMessage } from '@/whatsapp/hooks/useLastWhatsappMessage';
import { useWhatsappContactWindow } from '@/whatsapp/hooks/useWhatsappContactWindow';

type WhatsappBoardCardFooterProps = {
  recordId: string;
};

// Module-level map avoids no-state-useref rule while tracking previous stage per record
const prevStageByRecord = new Map<string, string>();

// WA-brand colors — intentionally not in the theme system
/* oxlint-disable no-hardcoded-colors */
const ORIGIN_STYLES: Record<string, { bg: string; color: string }> = {
  'Tráfego Pago': { bg: '#E3EDFF', color: '#2563EB' },
  Revendedor: { bg: '#FFF0DF', color: '#EA8C00' },
  Compra: { bg: '#E2F6E8', color: '#1DAA52' },
  Interesse: { bg: '#FFF6DA', color: '#B7891A' },
  'Proposta Enviada': { bg: '#EFE7FF', color: '#7C5CFC' },
  Ganho: { bg: '#E2F6E8', color: '#1DAA52' },
};
const DEFAULT_ORIGIN_STYLE = { bg: '#F4F5F8', color: '#8B8B9A' };
/* oxlint-enable no-hardcoded-colors */

// green = window open >4h left, amber = <4h left, grey = closed
const getWindowStatus = (
  isWindowOpen: boolean,
  lastInboundAt: string | null,
): 'green' | 'amber' | 'grey' => {
  if (!isWindowOpen || !lastInboundAt) return 'grey';
  const hoursLeft =
    24 - (Date.now() - new Date(lastInboundAt).getTime()) / 3_600_000;
  return hoursLeft > 4 ? 'green' : 'amber';
};

/* oxlint-disable no-hardcoded-colors */
const WINDOW_COLOR: Record<'green' | 'amber' | 'grey', string> = {
  amber: '#F59E0B',
  green: '#25D366',
  grey: '#C7C7D0',
};
/* oxlint-enable no-hardcoded-colors */

const WINDOW_LABEL: Record<'green' | 'amber' | 'grey', string> = {
  amber: 'Janela fechando',
  green: 'Janela aberta',
  grey: 'Janela fechada',
};

const formatRelativeTime = (isoString: string): string => {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  return `${Math.floor(diffH / 24)}d`;
};

// "Precisa de resposta" — last message is from the customer (INBOUND)
/* oxlint-disable no-hardcoded-colors */
const StyledFooter = styled.div<{ needsReply: boolean }>`
  border-left: ${({ needsReply }) =>
    needsReply ? '3px solid #EF4444' : '3px solid transparent'};
  border-top: 1px solid #e8e9ef;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 10px 8px 8px;
`;

const StyledNeedsReplyBadge = styled.div`
  align-items: center;
  background: #fef2f2;
  border-radius: 4px;
  color: #ef4444;
  display: inline-flex;
  font-size: 11px;
  font-weight: 600;
  gap: 4px;
  padding: 2px 6px;
  width: fit-content;
`;
/* oxlint-enable no-hardcoded-colors */

const StyledPreview = styled.p`
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  color: #8b8b9a;
  display: -webkit-box;
  font-size: 13px;
  margin: 0;
  overflow: hidden;
`;

const StyledBaseline = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`;

const StyledLeft = styled.div`
  align-items: center;
  display: flex;
  gap: 6px;
`;

const StyledRelativeTime = styled.span`
  color: #8b8b9a;
  font-size: 11px;
`;

const StyledWindowDot = styled.span<{ status: 'green' | 'amber' | 'grey' }>`
  background: ${({ status }) => WINDOW_COLOR[status]};
  border-radius: 50%;
  flex-shrink: 0;
  height: 7px;
  width: 7px;
`;

const StyledOriginChip = styled.span<{ bg: string; color: string }>`
  background: ${({ bg }) => bg};
  border-radius: 4px;
  color: ${({ color }) => color};
  font-size: 11px;
  font-weight: 500;
  padding: 2px 6px;
`;

export const WhatsappBoardCardFooter = ({
  recordId,
}: WhatsappBoardCardFooterProps) => {
  const { message } = useLastWhatsappMessage(recordId);
  const { window: contactWindow, isWindowOpen } =
    useWhatsappContactWindow(recordId);

  // matching-state-variable: must be named `recordStore`
  const recordStore = useAtomFamilyStateValue(recordStoreFamilyState, recordId);
  const originLabel = (recordStore as Record<string, unknown>)
    ?.whatsappOriginTag as string | undefined;

  // Phase 5: toast when stage changes (automation fires on stage change)
  const { enqueueSuccessSnackBar } = useSnackBar();
  const stageValue = (recordStore as Record<string, unknown>)?.stage as
    | string
    | undefined;

  useEffect(() => {
    const prevStage = prevStageByRecord.get(recordId);
    if (prevStage !== undefined && stageValue !== undefined && stageValue !== prevStage) {
      const nameRaw = (recordStore as Record<string, unknown>)?.name;
      let displayName = '';
      if (typeof nameRaw === 'object' && nameRaw !== null) {
        const parts = [
          (nameRaw as Record<string, unknown>).firstName,
          (nameRaw as Record<string, unknown>).lastName,
        ].filter((p): p is string => typeof p === 'string' && p.length > 0);
        displayName = parts.join(' ');
      } else if (typeof nameRaw === 'string') {
        displayName = nameRaw;
      }
      enqueueSuccessSnackBar({
        message:
          displayName.length > 0
            ? `Mensagem automática enviada para ${displayName}`
            : 'Mensagem automática enviada',
      });
    }
    if (stageValue !== undefined) {
      prevStageByRecord.set(recordId, stageValue);
    }
    return () => {
      prevStageByRecord.delete(recordId);
    };
  }, [stageValue, recordId, enqueueSuccessSnackBar, recordStore]);

  const needsReply = message?.direction === 'INBOUND';
  const windowStatus = getWindowStatus(
    isWindowOpen,
    contactWindow?.lastInboundAt ?? null,
  );

  if (!message && !originLabel) return null;

  const originStyle =
    originLabel !== undefined && Object.hasOwn(ORIGIN_STYLES, originLabel)
      ? ORIGIN_STYLES[originLabel]
      : DEFAULT_ORIGIN_STYLE;

  return (
    <StyledFooter needsReply={needsReply}>
      {needsReply && (
        <StyledNeedsReplyBadge>● Precisa de resposta</StyledNeedsReplyBadge>
      )}
      {message?.content !== undefined && message.content !== '' && (
        <StyledPreview>Mensagem: {message.content}</StyledPreview>
      )}
      <StyledBaseline>
        <StyledLeft>
          {message !== null && (
            <StyledWindowDot
              status={windowStatus}
              title={WINDOW_LABEL[windowStatus]}
            />
          )}
          <StyledRelativeTime>
            {message !== null ? formatRelativeTime(message.timestamp) : ''}
          </StyledRelativeTime>
        </StyledLeft>
        {originLabel !== undefined && (
          <StyledOriginChip bg={originStyle.bg} color={originStyle.color}>
            {originLabel}
          </StyledOriginChip>
        )}
      </StyledBaseline>
    </StyledFooter>
  );
};
