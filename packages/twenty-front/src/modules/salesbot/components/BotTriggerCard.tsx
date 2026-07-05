// FORK: Voka CRM — Fase 14.3 (ajuste): card "Gatilhos" com edição inline
import { useState } from 'react';

import { useAtom, useSetAtom } from 'jotai';
import { styled } from '@linaria/react';

import { IconPlus, IconX } from 'twenty-ui/icon';

import {
  CANVAS_OVERLAY as O,
  CANVAS_PALETTE as C,
} from '@/salesbot/constants/canvasPalette';
import {
  botEditorDirtyAtom,
  botEditorTriggersAtom,
} from '@/salesbot/states/botEditorState';
import {
  TRIGGER_TYPE_LABELS,
  CHANNEL_LABELS,
  type BotTrigger,
  type BotTriggerType,
  type BotChannelType,
} from '@/salesbot/hooks/useSalesbot';

// ── Estilos ──────────────────────────────────────────────────────────────────

const Card = styled.div`
  background: ${C.cardBg};
  border: 1px solid ${C.cardBorder};
  border-radius: 12px;
  left: 20px;
  max-width: 240px;
  padding: 16px;
  pointer-events: all;
  position: absolute;
  top: 20px;
  z-index: 10;
`;

const Title = styled.h3`
  color: ${C.textPrimary};
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 6px 0;
`;

const Description = styled.p`
  color: ${C.textMuted};
  font-size: 12px;
  line-height: 1.5;
  margin: 0 0 10px 0;
`;

const TriggerList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 5px;
  list-style: none;
  margin: 0 0 10px 0;
  padding: 0;
`;

const TriggerItem = styled.li`
  align-items: center;
  background: ${O.sm};
  border: 1px solid ${C.cardBorder};
  border-radius: 6px;
  display: flex;
  gap: 6px;
  justify-content: space-between;
  padding: 5px 8px;
`;

const TriggerText = styled.span`
  color: ${C.textPrimary};
  font-size: 11px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RemoveBtn = styled.button`
  background: none;
  border: none;
  color: ${C.textMuted};
  cursor: pointer;
  display: flex;
  flex-shrink: 0;
  padding: 1px;

  &:hover { color: #ef4444; }
`;

const AddBtn = styled.button`
  align-items: center;
  background: transparent;
  border: 1px dashed ${C.cardBorder};
  border-radius: 6px;
  color: ${C.textMuted};
  cursor: pointer;
  display: flex;
  font-size: 12px;
  gap: 4px;
  padding: 6px 10px;
  transition: border-color 0.15s, color 0.15s;
  width: 100%;

  &:hover {
    border-color: ${C.startBorder};
    color: ${C.startBorder};
  }
`;

const Form = styled.div`
  background: ${O.xs};
  border: 1px solid ${C.cardBorder};
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  padding: 10px;
`;

const Select = styled.select`
  background: ${O.sm};
  border: 1px solid ${C.cardBorder};
  border-radius: 6px;
  box-sizing: border-box;
  color: ${C.textPrimary};
  font-size: 12px;
  outline: none;
  padding: 6px 8px;
  width: 100%;

  option { background: ${C.cardBg}; }
  &:focus { border-color: ${C.startBorder}; }
`;

const Input = styled.input`
  background: ${O.sm};
  border: 1px solid ${C.cardBorder};
  border-radius: 6px;
  box-sizing: border-box;
  color: ${C.textPrimary};
  font-size: 12px;
  outline: none;
  padding: 6px 8px;
  width: 100%;

  &:focus { border-color: ${C.startBorder}; }
  &::placeholder { color: ${C.textMuted}; }
`;

const FormRow = styled.div`
  display: flex;
  gap: 6px;
`;

const ConfirmBtn = styled.button`
  background: ${C.startBorder};
  border: none;
  border-radius: 6px;
  color: ${C.textInverted};
  cursor: pointer;
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 8px;

  &:disabled { cursor: not-allowed; opacity: 0.4; }
`;

const CancelFormBtn = styled.button`
  background: ${O.md};
  border: none;
  border-radius: 6px;
  color: ${C.textMuted};
  cursor: pointer;
  font-size: 12px;
  padding: 6px 8px;
`;

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatTrigger = (t: BotTrigger): string => {
  const label = TRIGGER_TYPE_LABELS[t.type] ?? t.type;

  return t.keyword ? `${label}: "${t.keyword}"` : label;
};

const TRIGGER_TYPES: BotTriggerType[] = [
  'KEYWORD',
  'ALWAYS',
  'UNCLASSIFIED',
  'CONVERSATION_CLOSED',
  'MANUAL',
];

const CHANNEL_OPTIONS: BotChannelType[] = [
  'WHATSAPP',
  'TELEGRAM',
  'INSTAGRAM',
  'MESSENGER',
  'EMAIL',
];

// ── Componente ────────────────────────────────────────────────────────────────

export const BotTriggerCard = () => {
  const [triggers, setTriggers] = useAtom(botEditorTriggersAtom);
  const setDirty = useSetAtom(botEditorDirtyAtom);

  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState<BotTriggerType>('KEYWORD');
  const [newKeyword, setNewKeyword] = useState('');
  const [newChannel, setNewChannel] = useState<BotChannelType | ''>('');

  const handleAdd = () => {
    const trigger: BotTrigger = {
      type: newType,
      ...(newKeyword.trim() ? { keyword: newKeyword.trim() } : {}),
      ...(newChannel ? { channel: newChannel } : {}),
    };

    setTriggers((prev) => [...prev, trigger]);
    setDirty(true);
    setAdding(false);
    setNewType('KEYWORD');
    setNewKeyword('');
    setNewChannel('');
  };

  const handleRemove = (index: number) => {
    setTriggers((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  };

  const handleCancel = () => {
    setAdding(false);
    setNewKeyword('');
    setNewChannel('');
  };

  return (
    <Card>
      <Title>Gatilhos</Title>
      <Description>
        Dispara o bot automaticamente pelas regras abaixo, ou manualmente pelo card do lead.
      </Description>

      {triggers.length > 0 && (
        <TriggerList>
          {triggers.map((t, i) => (
            <TriggerItem key={i}>
              <TriggerText title={formatTrigger(t)}>{formatTrigger(t)}</TriggerText>
              <RemoveBtn onClick={() => handleRemove(i)} title="Remover gatilho">
                <IconX size={11} />
              </RemoveBtn>
            </TriggerItem>
          ))}
        </TriggerList>
      )}

      {adding ? (
        <Form>
          <Select
            value={newType}
            onChange={(e) => setNewType(e.target.value as BotTriggerType)}
          >
            {TRIGGER_TYPES.map((t) => (
              <option key={t} value={t}>{TRIGGER_TYPE_LABELS[t]}</option>
            ))}
          </Select>

          {newType === 'KEYWORD' && (
            <Input
              placeholder="Palavra-chave (ex: oi, preço)"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              autoFocus
            />
          )}

          <Select
            value={newChannel}
            onChange={(e) => setNewChannel(e.target.value as BotChannelType | '')}
          >
            <option value="">Todos os canais</option>
            {CHANNEL_OPTIONS.map((c) => (
              <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>
            ))}
          </Select>

          <FormRow>
            <CancelFormBtn onClick={handleCancel}>Cancelar</CancelFormBtn>
            <ConfirmBtn
              onClick={handleAdd}
              disabled={newType === 'KEYWORD' && !newKeyword.trim()}
            >
              Adicionar
            </ConfirmBtn>
          </FormRow>
        </Form>
      ) : (
        <AddBtn onClick={() => setAdding(true)}>
          <IconPlus size={12} />
          Gatilho
        </AddBtn>
      )}
    </Card>
  );
};
