// FORK: Voka CRM — Fase 11: chat composer with "/" quick-reply picker
/* oxlint-disable twenty/no-hardcoded-colors */
import { styled } from '@linaria/react';
import { useEffect, useRef, useState } from 'react';
import { IconPaperclip, IconMoodSmile } from 'twenty-ui/icon';

import { useWhatsappQuickReplies } from '@/whatsapp/hooks/useWhatsappQuickReplies';

const C = {
  border: '#EAECF0',
  gray: '#98A2B3',
  txt: '#101828',
  muted: '#667085',
  activeBg: '#EEF4FF',
  sendBg: '#D0D5DD',
  qrBg: '#FFFFFF',
  qrBorder: '#EAECF0',
  qrHover: '#F9FAFB',
  shortcut: '#7C3AED',
};

const StyledComposerInput = styled.div`
  align-items: center;
  border: 1px solid ${C.border};
  border-radius: 10px;
  color: ${C.gray};
  display: flex;
  font-size: 12.5px;
  gap: 8px;
  padding: 8px 11px;
  position: relative;
`;

const StyledInput = styled.input`
  background: transparent;
  border: none;
  flex: 1;
  font-size: 12.5px;
  outline: none;
`;

const StyledActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 10px;
`;

const StyledSendBtn = styled.button`
  background: ${C.sendBg};
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 16px;

  &:disabled {
    opacity: 0.5;
  }
`;

const StyledCancelLink = styled.span`
  color: ${C.muted};
  cursor: pointer;
  font-size: 12px;
  padding: 6px 4px;
`;

const StyledQrDropdown = styled.div`
  background: ${C.qrBg};
  border: 1px solid ${C.qrBorder};
  border-radius: 8px;
  bottom: calc(100% + 4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  left: 0;
  max-height: 220px;
  overflow-y: auto;
  position: absolute;
  right: 0;
  z-index: 100;
`;

const StyledQrItem = styled.div<{ focused: boolean }>`
  align-items: center;
  background: ${({ focused }) => (focused ? C.activeBg : C.qrBg)};
  cursor: pointer;
  display: flex;
  gap: 10px;
  padding: 8px 12px;

  &:hover {
    background: ${C.qrHover};
  }
`;

const StyledShortcut = styled.span`
  color: ${C.shortcut};
  font-size: 12px;
  font-weight: 700;
  min-width: 60px;
`;

const StyledQrTitle = styled.span`
  color: ${C.txt};
  font-size: 12px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledQrPreview = styled.span`
  color: ${C.muted};
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 120px;
`;

export const QuickReplyComposer = ({
  placeholder,
  onSend,
  disabled,
  sending,
}: {
  placeholder: string;
  onSend: (text: string) => void | Promise<unknown>;
  disabled?: boolean;
  sending?: boolean;
}) => {
  const [draft, setDraft] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [qrFilter, setQrFilter] = useState('');
  const [focusedIdx, setFocusedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { quickReplies } = useWhatsappQuickReplies();

  const filtered = quickReplies.filter(
    (qr) =>
      qrFilter === '' ||
      qr.shortcut.toLowerCase().includes(qrFilter.toLowerCase()) ||
      qr.title.toLowerCase().includes(qrFilter.toLowerCase()),
  );

  const handleChange = (value: string) => {
    setDraft(value);
    if (value.startsWith('/')) {
      setQrFilter(value.slice(1));
      setShowQr(true);
      setFocusedIdx(0);
    } else {
      setShowQr(false);
    }
  };

  const selectQr = (content: string) => {
    setDraft(content);
    setShowQr(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showQr && filtered.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIdx((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        const qr = filtered[focusedIdx];
        if (qr) selectQr(qr.content);
        return;
      }
      if (e.key === 'Escape') {
        setShowQr(false);
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey && !showQr) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleSend = async () => {
    if (!draft.trim() || disabled || sending) return;
    await onSend(draft.trim());
    setDraft('');
    setShowQr(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.parentElement?.contains(e.target as Node)) {
        setShowQr(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div>
      <StyledComposerInput>
        <IconMoodSmile size={15} />
        <StyledInput
          ref={inputRef}
          placeholder={placeholder}
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <IconPaperclip size={15} />

        {showQr && filtered.length > 0 && (
          <StyledQrDropdown>
            {filtered.map((qr, idx) => (
              <StyledQrItem
                key={qr.id}
                focused={idx === focusedIdx}
                onMouseDown={() => selectQr(qr.content)}
                onMouseEnter={() => setFocusedIdx(idx)}
              >
                <StyledShortcut>/{qr.shortcut}</StyledShortcut>
                <StyledQrTitle>{qr.title}</StyledQrTitle>
                <StyledQrPreview>{qr.content}</StyledQrPreview>
              </StyledQrItem>
            ))}
          </StyledQrDropdown>
        )}
      </StyledComposerInput>

      <StyledActions>
        <StyledSendBtn onClick={() => void handleSend()} disabled={sending || disabled}>
          {sending ? 'Enviando…' : 'Enviar'}
        </StyledSendBtn>
        <StyledCancelLink onClick={() => setDraft('')}>Cancelar</StyledCancelLink>
      </StyledActions>
    </div>
  );
};
