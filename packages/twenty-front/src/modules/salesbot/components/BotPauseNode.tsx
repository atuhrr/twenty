// FORK: Voka CRM — Fase 14.3A: nó Pausa (aguarda resposta do contato)
import { useAtomValue } from 'jotai';
import { type NodeProps } from '@xyflow/react';

import { NODE_PALETTE as N } from '@/salesbot/constants/canvasPalette';
import { botEditorSelectedNodeIdAtom } from '@/salesbot/states/botEditorState';
import {
  BotNodeBase,
  NodeBody,
  NodeBodyText,
} from '@/salesbot/components/BotNodeBase';

export const BotPauseNode = ({ id, data }: NodeProps) => {
  const selectedId = useAtomValue(botEditorSelectedNodeIdAtom);

  return (
    <BotNodeBase
      num={data.num as number | undefined}
      typeLabel="Pausa"
      typeColor={N.pause}
      selected={selectedId === id}
    >
      <NodeBody>
        <NodeBodyText>Aguardando resposta do contato…</NodeBodyText>
      </NodeBody>
    </BotNodeBase>
  );
};
