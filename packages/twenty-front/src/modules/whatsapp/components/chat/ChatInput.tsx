import { KeyboardEvent, useState } from 'react';

import { styled } from '@linaria/react';

type ChatInputProps = {
  onSend: (text: string) => void;
  disabled: boolean;
  sending: boolean;
};

const StyledInputBar = styled.div`
  align-items: flex-end;
  background: #f0f2f5;
  border-top: 1px solid #e8e9ef;
  display: flex;
  gap: 8px;
  padding: 8px 12px;
`;

const StyledIconBtn = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  color: #8b8b9a;
  cursor: pointer;
  display: flex;
  font-size: 20px;
  height: 36px;
  justify-content: center;
  padding: 0;
  width: 36px;

  &:hover {
    color: #1a1a2e;
  }
`;

const StyledTextInput = styled.textarea`
  background: #ffffff;
  border: none;
  border-radius: 20px;
  color: #1a1a2e;
  flex: 1;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  max-height: 120px;
  min-height: 36px;
  outline: none;
  padding: 8px 14px;
  resize: none;

  &::placeholder {
    color: #8b8b9a;
  }
`;

const StyledSendBtn = styled.button<{ disabled: boolean }>`
  align-items: center;
  background: ${({ disabled }) => (disabled ? '#C7C7D0' : '#25D366')};
  border: none;
  border-radius: 50%;
  color: #ffffff;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  display: flex;
  flex-shrink: 0;
  font-size: 16px;
  height: 36px;
  justify-content: center;
  transition: background 0.15s;
  width: 36px;

  &:hover:not(:disabled) {
    background: #1daa52;
  }
`;

const StyledWindowWarning = styled.div`
  background: #fff6da;
  border-radius: 0 0 0 0;
  border-top: 1px solid #e8e9ef;
  color: #b7891a;
  font-size: 12px;
  padding: 8px 16px;
  text-align: center;
`;

export const ChatInput = ({ onSend, disabled, sending }: ChatInputProps) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();

    if (!trimmed || sending) return;
    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {disabled && (
        <StyledWindowWarning>
          Janela de 24h encerrada. Use um template para retomar a conversa.
        </StyledWindowWarning>
      )}
      <StyledInputBar>
        <StyledIconBtn title="Emoji" disabled={disabled}>
          😊
        </StyledIconBtn>
        <StyledIconBtn title="Anexar arquivo" disabled={disabled}>
          📎
        </StyledIconBtn>
        <StyledTextInput
          placeholder="Digite uma mensagem..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
        />
        <StyledSendBtn
          disabled={disabled || !text.trim() || sending}
          onClick={handleSend}
          title="Enviar"
        >
          ➤
        </StyledSendBtn>
      </StyledInputBar>
    </>
  );
};
