/* oxlint-disable twenty/no-hardcoded-colors */
import { styled } from '@linaria/react';

import { ChatInput } from '@/whatsapp/components/chat/ChatInput';
import { ChatMessageList } from '@/whatsapp/components/chat/ChatMessageList';
import { useWhatsappContactWindow } from '@/whatsapp/hooks/useWhatsappContactWindow';
import { useSendWhatsappMessage } from '@/whatsapp/hooks/useSendWhatsappMessage';
import { useWhatsappMessages } from '@/whatsapp/hooks/useWhatsappMessages';

type ChatTabProps = {
  contactId: string;
  phoneNumber: string | null;
  originLabel?: string | null;
  originCampaign?: string | null;
};

const StyledContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`;

const StyledOriginBanner = styled.div`
  align-items: flex-start;
  background: #fff6da;
  border-bottom: 1px solid #f0e4b0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 16px;
`;

const StyledOriginLine = styled.span`
  color: #b7891a;
  font-size: 12px;
  font-weight: 500;
`;

const StyledCampaignLine = styled.span`
  color: #b7891a;
  font-size: 11px;
  opacity: 0.8;
`;

export const ChatTab = ({
  contactId,
  phoneNumber,
  originLabel,
  originCampaign,
}: ChatTabProps) => {
  const { messages, loading } = useWhatsappMessages(contactId);
  const { isWindowOpen } = useWhatsappContactWindow(contactId);
  const { send, loading: sending } = useSendWhatsappMessage(
    contactId,
    phoneNumber ?? '',
  );

  return (
    <StyledContainer>
      {originLabel && (
        <StyledOriginBanner>
          <StyledOriginLine>Lead veio do {originLabel}</StyledOriginLine>
          {originCampaign && (
            <StyledCampaignLine>{originCampaign}</StyledCampaignLine>
          )}
        </StyledOriginBanner>
      )}
      <ChatMessageList messages={messages} loading={loading} />
      <ChatInput
        onSend={send}
        disabled={!phoneNumber || !isWindowOpen}
        sending={sending}
      />
    </StyledContainer>
  );
};
