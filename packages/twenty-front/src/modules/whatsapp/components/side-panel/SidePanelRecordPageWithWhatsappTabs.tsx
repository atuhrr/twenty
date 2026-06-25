/* oxlint-disable twenty/no-hardcoded-colors */
import { useMemo, useState } from 'react';

import { styled } from '@linaria/react';
import { TabButton } from 'twenty-ui/input';

import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { viewableRecordIdComponentState } from '@/side-panel/pages/record-page/states/viewableRecordIdComponentState';
import { SidePanelRecordPage } from '@/side-panel/pages/record-page/components/SidePanelRecordPage';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { ChatTab } from '@/whatsapp/components/chat/ChatTab';
import { useWhatsappContactWindow } from '@/whatsapp/hooks/useWhatsappContactWindow';

const StyledContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`;

const StyledTabBar = styled.div`
  border-bottom: 1px solid #e8e9ef;
  display: flex;
  flex-shrink: 0;
  gap: 0;
  padding: 0 16px;
`;

const StyledActiveTab = styled.div`
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

const StyledChatHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid #e8e9ef;
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  padding: 12px 16px;
`;

const StyledAvatar = styled.div`
  align-items: center;
  background: #25d366;
  border-radius: 50%;
  color: #ffffff;
  display: flex;
  flex-shrink: 0;
  font-size: 15px;
  font-weight: 600;
  height: 36px;
  justify-content: center;
  width: 36px;
`;

const StyledNameBlock = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const StyledName = styled.span`
  color: #1a1a2e;
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledPhone = styled.span`
  color: #8b8b9a;
  font-size: 12px;
`;

// B2: 24h window countdown pill in chat header
const StyledWindowPill = styled.span<{ status: 'open' | 'closing' | 'closed' }>`
  background: ${({ status }) =>
    status === 'open' ? '#E2F6E8' : status === 'closing' ? '#FFF6DA' : '#F4F5F8'};
  border-radius: 10px;
  color: ${({ status }) =>
    status === 'open' ? '#1DAA52' : status === 'closing' ? '#B7891A' : '#8B8B9A'};
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
`;

type RecordWithName = {
  name?: { firstName?: string; lastName?: string } | string;
  phones?: { primaryPhoneNumber?: string };
};

const extractNameAndPhone = (
  record: Record<string, unknown> | null,
): { displayName: string; phoneNumber: string | null } => {
  if (!record) return { displayName: '', phoneNumber: null };

  const raw = record as RecordWithName;
  let displayName = '';

  if (typeof raw.name === 'object' && raw.name !== null) {
    const parts = [raw.name.firstName, raw.name.lastName].filter(Boolean);

    displayName = parts.join(' ');
  } else if (typeof raw.name === 'string') {
    displayName = raw.name;
  }

  const phoneNumber = raw.phones?.primaryPhoneNumber ?? null;

  return { displayName, phoneNumber };
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);

  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
};

const formatWindowCountdown = (
  isWindowOpen: boolean,
  lastInboundAt: string | null,
): { label: string; status: 'open' | 'closing' | 'closed' } => {
  if (!isWindowOpen || !lastInboundAt) {
    return { label: 'Janela fechada', status: 'closed' };
  }

  const msLeft =
    24 * 3_600_000 - (Date.now() - new Date(lastInboundAt).getTime());
  const hoursLeft = msLeft / 3_600_000;

  if (hoursLeft <= 0) return { label: 'Janela fechada', status: 'closed' };

  const h = Math.floor(hoursLeft);
  const m = Math.floor((hoursLeft - h) * 60);
  const label = h > 0 ? `Janela: ${h}h${m > 0 ? ` ${m}min` : ''}` : `Janela: ${m}min`;
  const status = hoursLeft > 4 ? 'open' : 'closing';

  return { label, status };
};

export const SidePanelRecordPageWithWhatsappTabs = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'details'>('chat');

  const viewableRecordId = useAtomComponentStateValue(
    viewableRecordIdComponentState,
  );

  // FORK: reads Person fields for chat header display
  const recordStore = useAtomFamilyStateValue(
    recordStoreFamilyState,
    viewableRecordId ?? '',
  );

  const { displayName, phoneNumber } = extractNameAndPhone(
    recordStore as Record<string, unknown> | null,
  );

  const originLabel = (recordStore as Record<string, unknown> | null)
    ?.whatsappOriginTag as string | undefined;

  // B2: 24h window data for countdown pill
  const { window: contactWindow, isWindowOpen } = useWhatsappContactWindow(
    viewableRecordId ?? '',
  );

  const windowCountdown = useMemo(
    () =>
      formatWindowCountdown(
        isWindowOpen,
        contactWindow?.lastInboundAt ?? null,
      ),
    [isWindowOpen, contactWindow?.lastInboundAt],
  );

  return (
    <StyledContainer>
      <StyledTabBar>
        <TabButton
          id="chat"
          title="Chat"
          active={activeTab === 'chat'}
          onClick={() => setActiveTab('chat')}
        />
        <TabButton
          id="details"
          title="Detalhes"
          active={activeTab === 'details'}
          onClick={() => setActiveTab('details')}
        />
      </StyledTabBar>

      <StyledActiveTab>
        {activeTab === 'chat' && viewableRecordId ? (
          <>
            <StyledChatHeader>
              <StyledAvatar>{getInitials(displayName)}</StyledAvatar>
              <StyledNameBlock>
                <StyledName>{displayName}</StyledName>
                {phoneNumber && (
                  <StyledPhone>{phoneNumber}</StyledPhone>
                )}
              </StyledNameBlock>
              {/* B2: window countdown pill — always visible in chat header */}
              <StyledWindowPill status={windowCountdown.status}>
                {windowCountdown.label}
              </StyledWindowPill>
            </StyledChatHeader>
            <ChatTab
              contactId={viewableRecordId}
              phoneNumber={phoneNumber}
              originLabel={originLabel ?? null}
            />
          </>
        ) : (
          <SidePanelRecordPage />
        )}
      </StyledActiveTab>
    </StyledContainer>
  );
};
