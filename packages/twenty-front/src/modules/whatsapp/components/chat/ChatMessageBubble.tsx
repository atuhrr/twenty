/* oxlint-disable twenty/no-hardcoded-colors */
import { styled } from '@linaria/react';

import { ChatAttachment } from '@/whatsapp/components/chat/ChatAttachment';
import type {
  WhatsappMessage,
  WhatsappMessageStatus,
} from '@/whatsapp/types/WhatsappMessage.type';

type ChatMessageBubbleProps = {
  message: WhatsappMessage;
};

const StyledRow = styled.div<{ isOutbound: boolean }>`
  align-items: flex-end;
  display: flex;
  justify-content: ${({ isOutbound }) => (isOutbound ? 'flex-end' : 'flex-start')};
  margin-bottom: 4px;
`;

const StyledBubble = styled.div<{ isOutbound: boolean }>`
  background: ${({ isOutbound }) => (isOutbound ? '#D9FDD3' : '#FFFFFF')};
  border-radius: ${({ isOutbound }) =>
    isOutbound ? '12px 12px 2px 12px' : '12px 12px 12px 2px'};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  max-width: 75%;
  min-width: 60px;
  padding: 6px 10px 4px;
`;

const StyledContent = styled.p`
  color: #1a1a2e;
  font-size: 14px;
  line-height: 1.45;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

const StyledMeta = styled.div`
  align-items: center;
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  margin-top: 2px;
`;

const StyledTime = styled.span`
  color: #8b8b9a;
  font-size: 11px;
`;

const StyledStatus = styled.span<{ isRead: boolean; isFailed: boolean }>`
  color: ${({ isRead, isFailed }) =>
    isFailed ? '#E53E3E' : isRead ? '#4FC3F7' : '#8b8b9a'};
  font-size: 11px;
`;

const STATUS_CHECKMARK: Record<WhatsappMessageStatus, string> = {
  SENT: '✓',
  DELIVERED: '✓✓',
  READ: '✓✓',
  FAILED: '❌',
};

const formatTime = (isoString: string): string => {
  const date = new Date(isoString);

  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

export const ChatMessageBubble = ({ message }: ChatMessageBubbleProps) => {
  const isOutbound = message.direction === 'OUTBOUND';

  return (
    <StyledRow isOutbound={isOutbound}>
      <StyledBubble isOutbound={isOutbound}>
        {message.mediaUrl && (
          <ChatAttachment
            type={message.type}
            mediaUrl={message.mediaUrl}
            content={message.content}
          />
        )}
        {message.type === 'TEXT' && message.content && (
          <StyledContent>{message.content}</StyledContent>
        )}
        <StyledMeta>
          <StyledTime>{formatTime(message.timestamp)}</StyledTime>
          {isOutbound && (
            <StyledStatus
              isRead={message.status === 'READ'}
              isFailed={message.status === 'FAILED'}
            >
              {STATUS_CHECKMARK[message.status]}
            </StyledStatus>
          )}
        </StyledMeta>
      </StyledBubble>
    </StyledRow>
  );
};
