// FORK: Voka CRM — Fase 14.3B: nó Transferir para Humano (terminal)
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

export const BotHandoffNode = ({ id, data }: NodeProps) => {
  const selectedId = useAtomValue(botEditorSelectedNodeIdAtom);
  const config = data.config as Record<string, unknown>;
  const message = config.message as string | undefined;

  return (
    // Terminal: outputs=[] → sem handle de saída
    <BotNodeBase
      num={data.num as number | undefined}
      typeLabel="Transferir"
      typeColor={N.handoff}
      selected={selectedId === id}
      outputs={[]}
    >
      <NodeBody>
        {message ? (
          <NodeBodyText>{message}</NodeBodyText>
        ) : (
          <NodePlaceholder>Mensagem de transferência opcional…</NodePlaceholder>
        )}
      </NodeBody>
    </BotNodeBase>
  );
};
