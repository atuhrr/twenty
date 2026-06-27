// FORK: Voka CRM — Fase 11: "/" triggers quick reply picker
/* oxlint-disable twenty/no-hardcoded-colors */
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';

import { styled } from '@linaria/react';

import { useWhatsappQuickReplies } from '@/whatsapp/hooks/useWhatsappQuickReplies';

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

const StyledQrDropdown = styled.div`
  background: #ffffff;
  border: 1px solid #eaecf0;
  border-radius: 8px;
  bottom: calc(100% + 4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  left: 12px;
  max-height: 200px;
  overflow-y: auto;
  position: absolute;
  right: 12px;
  z-index: 100;
`;

const StyledQrItem = styled.div<{ focused: boolean }>`
  align-items: center;
  background: ${({ focused }) => (focused ? '#EEF4FF' : '#fff')};
  cursor: pointer;
  display: flex;
  gap: 10px;
  padding: 8px 12px;

  &:hover {
    background: #f9fafb;
  }
`;

const StyledQrShortcut = styled.span`
  color: #7c3aed;
  font-size: 12px;
  font-weight: 700;
  min-width: 55px;
`;

const StyledQrTitle = styled.span`
  color: #101828;
  flex: 1;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledQrPreview = styled.span`
  color: #667085;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 110px;
`;

const StyledInputBarWrapper = styled.div`
  position: relative;
`;

export const ChatInput = ({ onSend, disabled, sending }: ChatInputProps) => {
  const [text, setText] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [qrFilter, setQrFilter] = useState('');
  const [focusedIdx, setFocusedIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { quickReplies } = useWhatsappQuickReplies();

  const filtered = quickReplies.filter(
    (qr) =>
      qrFilter === '' ||
      qr.shortcut.toLowerCase().includes(qrFilter.toLowerCase()) ||
      qr.title.toLowerCase().includes(qrFilter.toLowerCase()),
  );

  const handleChange = (value: string) => {
    setText(value);
    if (value.startsWith('/')) {
      setQrFilter(value.slice(1));
      setShowQr(true);
      setFocusedIdx(0);
    } else {
      setShowQr(false);
    }
  };

  const selectQr = (content: string) => {
    setText(content);
    setShowQr(false);
    textareaRef.current?.focus();
  };

  const handleSend = () => {
    const trimmed = text.trim();

    if (!trimmed || sending) return;
    onSend(trimmed);
    setText('');
    setShowQr(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showQr && filtered.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setFocusedIdx((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setFocusedIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (event.key === 'Tab' || (event.key === 'Enter' && filtered.length > 0 && showQr)) {
        event.preventDefault();
        const qr = filtered[focusedIdx];
        if (qr) selectQr(qr.content);
        return;
      }
      if (event.key === 'Escape') {
        setShowQr(false);
        return;
      }
    }
    if (event.key === 'Enter' && !event.shiftKey && !showQr) {
      event.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (textareaRef.current && !textareaRef.current.closest('[data-chat-input]')?.contains(e.target as Node)) {
        setShowQr(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      {disabled && (
        <StyledWindowWarning>
          Janela de 24h encerrada. Use um template para retomar a conversa.
        </StyledWindowWarning>
      )}
      <StyledInputBarWrapper data-chat-input>
        {showQr && filtered.length > 0 && (
          <StyledQrDropdown>
            {filtered.map((qr, idx) => (
              <StyledQrItem
                key={qr.id}
                focused={idx === focusedIdx}
                onMouseDown={() => selectQr(qr.content)}
                onMouseEnter={() => setFocusedIdx(idx)}
              >
                <StyledQrShortcut>/{qr.shortcut}</StyledQrShortcut>
                <StyledQrTitle>{qr.title}</StyledQrTitle>
                <StyledQrPreview>{qr.content}</StyledQrPreview>
              </StyledQrItem>
            ))}
          </StyledQrDropdown>
        )}
        <StyledInputBar>
          <StyledIconBtn title="Emoji" disabled={disabled}>
            😊
          </StyledIconBtn>
          <StyledIconBtn title="Anexar arquivo" disabled={disabled}>
            📎
          </StyledIconBtn>
          <StyledTextInput
            ref={textareaRef}
            placeholder="Digite / para respostas rápidas…"
            value={text}
            onChange={(e) => handleChange(e.target.value)}
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
      </StyledInputBarWrapper>
    </>
  );
};
