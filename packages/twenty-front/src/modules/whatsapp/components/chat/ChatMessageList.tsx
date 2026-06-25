/* oxlint-disable twenty/no-hardcoded-colors */
import { useEffect, useRef } from 'react';

import { styled } from '@linaria/react';

import { ChatMessageBubble } from '@/whatsapp/components/chat/ChatMessageBubble';
import type { WhatsappMessage } from '@/whatsapp/types/WhatsappMessage.type';

type ChatMessageListProps = {
  messages: WhatsappMessage[];
  loading: boolean;
};

const StyledScrollArea = styled.div`
  background: #ece5dd;
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow-y: auto;
  padding: 16px 12px;
`;

const StyledSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
`;

const StyledSkeletonBubble = styled.div<{ isRight?: boolean }>`
  align-self: ${({ isRight }) => (isRight ? 'flex-end' : 'flex-start')};
  animation: pulse 1.5s ease-in-out infinite;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  height: 36px;
  width: ${({ isRight }) => (isRight ? '55%' : '65%')};

  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
`;

const StyledEmpty = styled.div`
  align-items: center;
  color: #8b8b9a;
  display: flex;
  flex: 1;
  font-size: 14px;
  justify-content: center;
`;

export const ChatMessageList = ({ messages, loading }: ChatMessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading && messages.length === 0) {
    return (
      <StyledScrollArea>
        <StyledSkeleton>
          <StyledSkeletonBubble />
          <StyledSkeletonBubble isRight />
          <StyledSkeletonBubble />
          <StyledSkeletonBubble isRight />
        </StyledSkeleton>
      </StyledScrollArea>
    );
  }

  if (!loading && messages.length === 0) {
    return (
      <StyledScrollArea>
        <StyledEmpty>Nenhuma mensagem ainda.</StyledEmpty>
      </StyledScrollArea>
    );
  }

  return (
    <StyledScrollArea>
      {messages.map((msg) => (
        <ChatMessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </StyledScrollArea>
  );
};
