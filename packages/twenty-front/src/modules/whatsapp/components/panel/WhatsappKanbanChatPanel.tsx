/* oxlint-disable twenty/no-hardcoded-colors */
import { useMemo } from 'react';

import { styled } from '@linaria/react';

import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { ChatTab } from '@/whatsapp/components/chat/ChatTab';
import { useWhatsappContactWindow } from '@/whatsapp/hooks/useWhatsappContactWindow';
import { activeBoardContactState } from '@/whatsapp/states/activeBoardContactState';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { IconBrandWhatsapp } from 'twenty-ui/icon';

const WA_GREEN = '#25d366';

const StyledPanel = styled.div`
  border-left: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  height: 100%;
  overflow: hidden;
  width: 320px;
`;

const StyledHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid ${themeCssVariables.border.color.light};
  display: flex;
  flex-shrink: 0;
  gap: 10px;
  padding: 12px 16px;
`;

const StyledAvatar = styled.div`
  align-items: center;
  background: ${WA_GREEN};
  border-radius: 50%;
  color: #fff;
  display: flex;
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 700;
  height: 34px;
  justify-content: center;
  width: 34px;
`;

const StyledNameBlock = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
`;

const StyledName = styled.span`
  color: ${themeCssVariables.font.color.primary};
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledPhone = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: 12px;
`;

const StyledWindowPill = styled.span<{ open: boolean }>`
  background: ${({ open }) => (open ? '#E2F6E8' : '#F4F5F8')};
  border-radius: 10px;
  color: ${({ open }) => (open ? '#1DAA52' : '#8B8B9A')};
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
`;

const StyledEmpty = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex: 1;
  flex-direction: column;
  font-size: 13px;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: center;
  text-align: center;
`;

type RecordWithName = {
  name?: { firstName?: string; lastName?: string } | string;
  phones?: { primaryPhoneNumber?: string };
  whatsappOriginTag?: string;
  whatsappOriginCampaign?: string;
};

const extractInfo = (record: Record<string, unknown> | null) => {
  if (!record)
    return {
      displayName: '',
      phoneNumber: null,
      originLabel: null,
      originCampaign: null,
    };

  const raw = record as RecordWithName;
  let displayName = '';

  if (typeof raw.name === 'object' && raw.name !== null) {
    displayName = [raw.name.firstName, raw.name.lastName]
      .filter(Boolean)
      .join(' ');
  } else if (typeof raw.name === 'string') {
    displayName = raw.name;
  }

  return {
    displayName,
    phoneNumber: raw.phones?.primaryPhoneNumber ?? null,
    originLabel: raw.whatsappOriginTag ?? null,
    originCampaign: raw.whatsappOriginCampaign ?? null,
  };
};

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');

export const WhatsappKanbanChatPanel = () => {
  const activeBoardContact = useAtomStateValue(activeBoardContactState);

  const recordStore = useAtomFamilyStateValue(
    recordStoreFamilyState,
    activeBoardContact ?? '',
  );

  const { displayName, phoneNumber, originLabel, originCampaign } = extractInfo(
    recordStore as Record<string, unknown> | null,
  );

  const { isWindowOpen, window: contactWindow } = useWhatsappContactWindow(
    activeBoardContact ?? '',
  );

  const windowLabel = useMemo(() => {
    if (!isWindowOpen || !contactWindow?.lastInboundAt) return 'Janela fechada';
    const hoursLeft =
      24 -
      (Date.now() - new Date(contactWindow.lastInboundAt).getTime()) /
        3_600_000;
    if (hoursLeft <= 0) return 'Janela fechada';
    const h = Math.floor(hoursLeft);
    const m = Math.floor((hoursLeft - h) * 60);
    return h > 0
      ? `Janela: ${h}h${m > 0 ? ` ${m}min` : ''}`
      : `Janela: ${m}min`;
  }, [isWindowOpen, contactWindow?.lastInboundAt]);

  if (!activeBoardContact) {
    return (
      <StyledPanel>
        <StyledEmpty>
          <IconBrandWhatsapp size={32} color={WA_GREEN} strokeWidth={1.5} />
          <span>Clique em um card para abrir o chat</span>
        </StyledEmpty>
      </StyledPanel>
    );
  }

  return (
    <StyledPanel>
      <StyledHeader>
        <StyledAvatar>{getInitials(displayName) || '?'}</StyledAvatar>
        <StyledNameBlock>
          <StyledName>{displayName || 'Lead'}</StyledName>
          {phoneNumber && <StyledPhone>{phoneNumber}</StyledPhone>}
        </StyledNameBlock>
        <StyledWindowPill open={isWindowOpen}>{windowLabel}</StyledWindowPill>
      </StyledHeader>

      <ChatTab
        contactId={activeBoardContact}
        phoneNumber={phoneNumber}
        originLabel={originLabel}
        originCampaign={originCampaign}
      />
    </StyledPanel>
  );
};
