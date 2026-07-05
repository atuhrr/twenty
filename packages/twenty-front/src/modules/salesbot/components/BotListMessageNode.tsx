// FORK: Voka CRM — Fase 14.3B: nó Lista de Opções (WhatsApp)
import { useAtomValue } from 'jotai';
import { type NodeProps } from '@xyflow/react';
import { styled } from '@linaria/react';

import { NODE_PALETTE as N } from '@/salesbot/constants/canvasPalette';
import { botEditorSelectedNodeIdAtom } from '@/salesbot/states/botEditorState';
import {
  BotNodeBase,
  NodeBody,
  NodeBodyText,
  NodePlaceholder,
} from '@/salesbot/components/BotNodeBase';

const ItemRow = styled.div`
  align-items: center;
  border-top: 1px solid ${N.headerBorder};
  color: ${N.bodyText};
  display: flex;
  font-size: 12px;
  gap: 6px;
  padding: 5px 12px;
`;

const Bullet = styled.span`
  background: ${N.list_message};
  border-radius: 2px;
  flex-shrink: 0;
  height: 6px;
  width: 6px;
`;

type ListItem = { id: string; title: string };

export const BotListMessageNode = ({ id, data }: NodeProps) => {
  const selectedId = useAtomValue(botEditorSelectedNodeIdAtom);
  const config = data.config as Record<string, unknown>;
  const header = config.headerText as string | undefined;
  const items = (config.items as ListItem[] | undefined) ?? [];

  return (
    <BotNodeBase
      num={data.num as number | undefined}
      typeLabel="Lista (WhatsApp)"
      typeColor={N.list_message}
      selected={selectedId === id}
    >
      <NodeBody>
        {header ? (
          <NodeBodyText>{header}</NodeBodyText>
        ) : (
          <NodePlaceholder>Clique para configurar lista…</NodePlaceholder>
        )}
      </NodeBody>
      {items.slice(0, 3).map((item) => (
        <ItemRow key={item.id}>
          <Bullet />
          {item.title}
        </ItemRow>
      ))}
      {items.length > 3 && (
        <ItemRow>
          <span style={{ color: N.typeColor }}>+{items.length - 3} opções…</span>
        </ItemRow>
      )}
    </BotNodeBase>
  );
};
