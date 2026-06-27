// FORK: Voka CRM — Fase 10: reusable team chat panel (lead profile + Inbox sidebar)
/* oxlint-disable twenty/no-hardcoded-colors */
import { styled } from '@linaria/react';
import { useState } from 'react';
import { IconSend, IconUsers } from 'twenty-ui/icon';

import { useTeamChat } from '@/team-chat/hooks/useTeamChat';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#FFFFFF',
  border: '#EAECF0',
  txt: '#101828',
  muted: '#667085',
  gray: '#98A2B3',
  inputBg: '#F9FAFB',
  avatarBg: '#EEF4FF',
  avatarTx: '#185FA5',
  sendBg: '#7C3AED',
};

// ─── Styled ───────────────────────────────────────────────────────────────────
const StyledPanel = styled.div`
  border-top: 1px solid ${C.border};
  display: flex;
  flex-direction: column;
  max-height: 340px;
  min-height: 200px;
`;

const StyledHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid ${C.border};
  color: ${C.muted};
  display: flex;
  font-size: 11px;
  font-weight: 700;
  gap: 6px;
  letter-spacing: 0.5px;
  padding: 8px 14px;
`;

const StyledMessages = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding: 10px 14px;
`;

const StyledMsg = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const StyledMsgHeader = styled.div`
  align-items: center;
  display: flex;
  gap: 6px;
`;

const StyledAvatar = styled.div`
  align-items: center;
  background: ${C.avatarBg};
  border-radius: 50%;
  color: ${C.avatarTx};
  display: flex;
  font-size: 10px;
  font-weight: 700;
  height: 22px;
  justify-content: center;
  width: 22px;
`;

const StyledSender = styled.span`
  color: ${C.txt};
  font-size: 12px;
  font-weight: 600;
`;

const StyledTime = styled.span`
  color: ${C.gray};
  font-size: 10.5px;
`;

const StyledContent = styled.div`
  color: ${C.txt};
  font-size: 12.5px;
  line-height: 1.45;
  padding-left: 28px;
`;

const StyledEmpty = styled.div`
  color: ${C.muted};
  font-size: 12px;
  padding: 12px 0;
  text-align: center;
`;

const StyledComposer = styled.div`
  border-top: 1px solid ${C.border};
  display: flex;
  gap: 6px;
  padding: 8px 14px;
`;

const StyledInput = styled.input`
  background: ${C.inputBg};
  border: 1px solid ${C.border};
  border-radius: 8px;
  color: ${C.txt};
  flex: 1;
  font-size: 12.5px;
  outline: none;
  padding: 6px 10px;

  &::placeholder {
    color: ${C.gray};
  }
`;

const StyledSendBtn = styled.button`
  align-items: center;
  background: ${C.sendBg};
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  display: flex;
  height: 32px;
  justify-content: center;
  padding: 0 10px;

  &:disabled {
    opacity: 0.4;
  }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

// ─── Component ────────────────────────────────────────────────────────────────
export const TeamChatPanel = ({
  relatedRecordId,
  placeholder = 'Mencione um colega…',
}: {
  relatedRecordId: string | null;
  placeholder?: string;
}) => {
  const { messages, sending, sendMessage } = useTeamChat(relatedRecordId);
  const [draft, setDraft] = useState('');

  const handleSend = async () => {
    if (!draft.trim()) return;
    await sendMessage(draft.trim());
    setDraft('');
  };

  return (
    <StyledPanel>
      <StyledHeader>
        <IconUsers size={13} />
        CHAT DA EQUIPE
      </StyledHeader>

      <StyledMessages>
        {messages.length === 0 ? (
          <StyledEmpty>Nenhuma mensagem da equipe ainda.</StyledEmpty>
        ) : (
          messages.map((msg) => (
            <StyledMsg key={msg.id}>
              <StyledMsgHeader>
                <StyledAvatar>{initials(msg.senderName)}</StyledAvatar>
                <StyledSender>{msg.senderName}</StyledSender>
                <StyledTime>{timeLabel(msg.createdAt)}</StyledTime>
              </StyledMsgHeader>
              <StyledContent>{msg.content}</StyledContent>
            </StyledMsg>
          ))
        )}
      </StyledMessages>

      <StyledComposer>
        <StyledInput
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && void handleSend()}
          disabled={!relatedRecordId}
        />
        <StyledSendBtn
          onClick={() => void handleSend()}
          disabled={sending || !draft.trim()}
        >
          <IconSend size={14} />
        </StyledSendBtn>
      </StyledComposer>
    </StyledPanel>
  );
};
