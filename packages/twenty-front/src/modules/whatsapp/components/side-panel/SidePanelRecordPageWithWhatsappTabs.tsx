import { useState } from 'react';

import { styled } from '@linaria/react';
import { TabButton } from 'twenty-ui/input';

import { recordStoreFamilyState } from '@/object-record/record-store/states/recordStoreFamilyState';
import { viewableRecordIdComponentState } from '@/side-panel/pages/record-page/states/viewableRecordIdComponentState';
import { SidePanelRecordPage } from '@/side-panel/pages/record-page/components/SidePanelRecordPage';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { ChatTab } from '@/whatsapp/components/chat/ChatTab';

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

export const SidePanelRecordPageWithWhatsappTabs = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'details'>('chat');

  const viewableRecordId = useAtomComponentStateValue(
    viewableRecordIdComponentState,
  );

  // FORK: reads Person fields for chat header display
  const record = useAtomFamilyStateValue(
    recordStoreFamilyState,
    viewableRecordId ?? '',
  );

  const { displayName, phoneNumber } = extractNameAndPhone(
    record as Record<string, unknown> | null,
  );

  const originLabel = (record as Record<string, unknown> | null)
    ?.whatsappOriginTag as string | undefined;

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
