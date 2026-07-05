// FORK: Voka CRM — Fase 11: Template picker for closed 24h window
/* oxlint-disable twenty/no-hardcoded-colors */
import { useEffect, useRef, useState } from 'react';
import { styled } from '@linaria/react';

import {
  type WhatsappTemplate,
  useWhatsappTemplates,
} from '@/whatsapp/hooks/useWhatsappTemplates';

type Props = {
  contactId: string;
  phoneNumber: string;
  onSent?: () => void;
};

const StyledBtn = styled.button`
  align-items: center;
  background: #7c3aed;
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  display: flex;
  font-size: 12px;
  font-weight: 600;
  gap: 5px;
  padding: 6px 12px;
  white-space: nowrap;
  &:hover { opacity: 0.88; }
  &:disabled { cursor: not-allowed; opacity: 0.5; }
`;

const StyledOverlay = styled.div`
  bottom: 0;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 199;
`;

const StyledPanel = styled.div`
  background: #fff;
  border: 1px solid #eaecf0;
  border-radius: 10px;
  bottom: calc(100% + 8px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  display: flex;
  flex-direction: column;
  max-height: 320px;
  position: absolute;
  right: 0;
  width: 340px;
  z-index: 200;
`;

const StyledPanelHeader = styled.div`
  border-bottom: 1px solid #eaecf0;
  color: #101828;
  font-size: 13px;
  font-weight: 600;
  padding: 12px 14px 10px;
`;

const StyledList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const StyledItem = styled.button<{ selected: boolean }>`
  background: ${({ selected }) => (selected ? '#f5f0fe' : 'transparent')};
  border: none;
  border-bottom: 1px solid #f2f4f7;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 14px;
  text-align: left;
  width: 100%;
  &:hover { background: #f9fafb; }
`;

const StyledItemName = styled.div`
  color: #101828;
  font-size: 13px;
  font-weight: 600;
`;

const StyledItemBody = styled.div`
  color: #667085;
  font-size: 11px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledItemTag = styled.span`
  background: #f2f4f7;
  border-radius: 4px;
  color: #667085;
  font-size: 10px;
  padding: 1px 5px;
`;

const StyledFooter = styled.div`
  border-top: 1px solid #eaecf0;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 10px 12px;
`;

const StyledSendBtn = styled.button`
  background: #7c3aed;
  border: none;
  border-radius: 7px;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  padding: 7px 16px;
  &:disabled { cursor: not-allowed; opacity: 0.5; }
  &:hover:not(:disabled) { opacity: 0.88; }
`;

const StyledCancelBtn = styled.button`
  background: transparent;
  border: 1px solid #d0d5dd;
  border-radius: 7px;
  color: #667085;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  padding: 7px 14px;
  &:hover { background: #f9fafb; }
`;

const StyledEmpty = styled.div`
  color: #98a2b3;
  font-size: 12px;
  padding: 24px;
  text-align: center;
`;

const StyledError = styled.div`
  background: #fef2f2;
  border-radius: 0 0 8px 8px;
  color: #b91c1c;
  font-size: 11px;
  padding: 6px 14px;
  text-align: center;
`;

const getBodyText = (t: WhatsappTemplate): string => {
  const body = t.components.find((c) => c.type === 'BODY');
  return body?.text ?? '—';
};

export const TemplatePickerButton = ({ contactId, phoneNumber, onSent }: Props) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<WhatsappTemplate | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { templates, loading, sending, sendTemplate } = useWhatsappTemplates(
    contactId,
    phoneNumber,
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSend = async () => {
    if (!selected) return;
    setSendError(null);
    const result = await sendTemplate(selected.name, selected.language);
    if (result.errorMessage) {
      setSendError(result.errorMessage);
    } else {
      setOpen(false);
      setSelected(null);
      onSent?.();
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={wrapperRef}>
      {open && <StyledOverlay onClick={() => setOpen(false)} />}
      <StyledBtn onClick={() => setOpen((o) => !o)} disabled={sending}>
        📋 Template
      </StyledBtn>

      {open && (
        <StyledPanel>
          <StyledPanelHeader>Selecione um template aprovado</StyledPanelHeader>
          <StyledList>
            {loading ? (
              <StyledEmpty>Carregando templates…</StyledEmpty>
            ) : templates.length === 0 ? (
              <StyledEmpty>
                Nenhum template aprovado encontrado.<br />
                Configure templates no Meta Business Manager.
              </StyledEmpty>
            ) : (
              templates.map((t) => (
                <StyledItem
                  key={t.id}
                  selected={selected?.id === t.id}
                  onClick={() => setSelected(t)}
                >
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <StyledItemName>{t.name}</StyledItemName>
                    <StyledItemTag>{t.language}</StyledItemTag>
                    {t.category && <StyledItemTag>{t.category}</StyledItemTag>}
                  </div>
                  <StyledItemBody>{getBodyText(t)}</StyledItemBody>
                </StyledItem>
              ))
            )}
          </StyledList>
          {sendError && <StyledError>⚠ {sendError}</StyledError>}
          <StyledFooter>
            <StyledCancelBtn onClick={() => setOpen(false)}>Cancelar</StyledCancelBtn>
            <StyledSendBtn onClick={handleSend} disabled={!selected || sending}>
              {sending ? 'Enviando…' : 'Enviar template'}
            </StyledSendBtn>
          </StyledFooter>
        </StyledPanel>
      )}
    </div>
  );
};
