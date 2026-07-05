// FORK: Voka CRM — Fase 14.2/14.5C: topbar do editor visual do bot
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAtom, useAtomValue } from 'jotai';
import { styled } from '@linaria/react';

import { IconDownload, IconEye, IconEyeOff, IconPencil, IconX } from 'twenty-ui/icon';

import {
  CANVAS_PALETTE as C,
  CANVAS_OVERLAY as O,
} from '@/salesbot/constants/canvasPalette';
import {
  botEditorDirtyAtom,
  botEditorGraphAtom,
  botEditorNameAtom,
  botPreviewOpenAtom,
} from '@/salesbot/states/botEditorState';

const Bar = styled.div`
  align-items: center;
  background: ${C.topbarBg};
  border-bottom: 1px solid ${C.topbarBorder};
  display: flex;
  flex-shrink: 0;
  gap: 12px;
  height: 52px;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 20;
`;

const NameArea = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
  min-width: 0;
`;

const NameDisplay = styled.span`
  color: ${C.textPrimary};
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;

  &:hover { opacity: 0.8; }
`;

const NameInput = styled.input`
  background: ${O.sm};
  border: 1px solid ${C.startBorder};
  border-radius: 6px;
  color: ${C.textPrimary};
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.02em;
  min-width: 200px;
  outline: none;
  padding: 4px 8px;
  text-transform: uppercase;
`;

const PencilBtn = styled.button`
  background: none;
  border: none;
  color: ${C.textMuted};
  cursor: pointer;
  display: flex;
  padding: 2px;

  &:hover { color: ${C.textPrimary}; }
`;

const Actions = styled.div`
  align-items: center;
  display: flex;
  gap: 8px;
`;

const CancelBtn = styled.button`
  background: none;
  border: none;
  color: ${C.cancelColor};
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 12px;

  &:hover { color: ${C.textPrimary}; }
`;

const SaveBtn = styled.button`
  background: ${C.saveBg};
  border: none;
  border-radius: 8px;
  color: ${C.textInverted};
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 18px;
  transition: background 0.15s;

  &:hover { background: ${C.saveBgHover}; }
  &:disabled { cursor: not-allowed; opacity: 0.5; }
`;

const CloseBtn = styled.button`
  align-items: center;
  background: ${O.md};
  border: none;
  border-radius: 6px;
  color: ${C.textMuted};
  cursor: pointer;
  display: flex;
  height: 30px;
  justify-content: center;
  margin-left: 4px;
  width: 30px;

  &:hover { background: ${O.hoverLg}; color: ${C.textPrimary}; }
`;

const IconBtn = styled.button<{ active?: boolean }>`
  align-items: center;
  background: ${({ active }) => (active ? O.lg : O.sm)};
  border: 1px solid ${({ active }) => (active ? O.border : 'transparent')};
  border-radius: 6px;
  color: ${({ active }) => (active ? C.textPrimary : C.textMuted)};
  cursor: pointer;
  display: flex;
  gap: 5px;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  padding: 5px 10px;

  &:hover { background: ${O.hover}; color: ${C.textPrimary}; }
`;

type Props = {
  onSave: () => Promise<void>;
  saving: boolean;
};

export const BotEditorTopbar = ({ onSave, saving }: Props) => {
  const navigate = useNavigate();
  const [name, setName] = useAtom(botEditorNameAtom);
  const [dirty] = useAtom(botEditorDirtyAtom);
  const graph = useAtomValue(botEditorGraphAtom);
  const [previewOpen, setPreviewOpen] = useAtom(botPreviewOpenAtom);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(graph, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `${name || 'salesbot'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startEdit = () => {
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => setEditing(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') commitEdit();
  };

  return (
    <Bar>
      <NameArea>
        {editing ? (
          <NameInput
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <>
            <NameDisplay onClick={startEdit}>{name || 'Sem nome'}</NameDisplay>
            <PencilBtn onClick={startEdit}>
              <IconPencil size={14} />
            </PencilBtn>
          </>
        )}
        {dirty && (
          <span style={{ color: C.textMuted, fontSize: 11 }}>● não salvo</span>
        )}
      </NameArea>

      <Actions>
        <IconBtn onClick={handleExportJson} title="Exportar grafo como JSON">
          <IconDownload size={14} />
          JSON
        </IconBtn>
        <IconBtn
          active={previewOpen}
          onClick={() => setPreviewOpen((v) => !v)}
          title={previewOpen ? 'Fechar preview' : 'Abrir preview'}
        >
          {previewOpen ? <IconEyeOff size={14} /> : <IconEye size={14} />}
          Preview
        </IconBtn>
        <CancelBtn onClick={() => navigate('/salesbot')}>Cancelar</CancelBtn>
        <SaveBtn onClick={onSave} disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar e continuar'}
        </SaveBtn>
        <CloseBtn onClick={() => navigate('/salesbot')}>
          <IconX size={16} />
        </CloseBtn>
      </Actions>
    </Bar>
  );
};
