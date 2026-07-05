// FORK: Voka CRM — Fase 14.3B: nó Parar bot (terminal, sem saída)
import { useAtomValue } from 'jotai';
import { type NodeProps } from '@xyflow/react';
import { styled } from '@linaria/react';

import { NODE_PALETTE as N } from '@/salesbot/constants/canvasPalette';
import { botEditorSelectedNodeIdAtom } from '@/salesbot/states/botEditorState';
import { BotNodeBase, NodeBody } from '@/salesbot/components/BotNodeBase';

const StopLabel = styled.span`
  color: ${N.stop};
  font-size: 13px;
  font-weight: 600;
`;

export const BotStopNode = ({ id, data }: NodeProps) => {
  const selectedId = useAtomValue(botEditorSelectedNodeIdAtom);

  return (
    <BotNodeBase
      num={data.num as number | undefined}
      typeLabel="Parar bot"
      typeColor={N.stop}
      selected={selectedId === id}
      outputs={[]}
    >
      <NodeBody>
        <StopLabel>Encerrar conversa</StopLabel>
      </NodeBody>
    </BotNodeBase>
  );
};
