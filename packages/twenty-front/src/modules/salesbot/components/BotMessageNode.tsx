// FORK: Voka CRM — Fase 14.3A: nó Mensagem
import { useAtomValue } from 'jotai';
import { type NodeProps } from '@xyflow/react';

import { NODE_PALETTE as N } from '@/salesbot/constants/canvasPalette';
import { botEditorSelectedNodeIdAtom } from '@/salesbot/states/botEditorState';
import {
  BotNodeBase,
  NodeBody,
  NodeBodyText,
  NodePlaceholder,
} from '@/salesbot/components/BotNodeBase';

export const BotMessageNode = ({ id, data }: NodeProps) => {
  const selectedId = useAtomValue(botEditorSelectedNodeIdAtom);
  const config = data.config as Record<string, unknown>;
  const text = config.text as string | undefined;

  return (
    <BotNodeBase
      num={data.num as number | undefined}
      typeLabel="Mensagem"
      typeColor={N.message}
      selected={selectedId === id}
    >
      <NodeBody>
        {text ? (
          <NodeBodyText>{text}</NodeBodyText>
        ) : (
          <NodePlaceholder>Clique para adicionar mensagem…</NodePlaceholder>
        )}
      </NodeBody>
    </BotNodeBase>
  );
};
