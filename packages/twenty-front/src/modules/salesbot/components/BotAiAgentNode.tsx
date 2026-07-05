// FORK: Voka CRM — Fase 14.3B: nó Agente de IA (Claude)
import { useAtomValue } from 'jotai';
import { type NodeProps } from '@xyflow/react';
import { styled } from '@linaria/react';

import {
  NODE_HIGHLIGHT as H,
  NODE_PALETTE as N,
} from '@/salesbot/constants/canvasPalette';
import { botEditorSelectedNodeIdAtom } from '@/salesbot/states/botEditorState';
import {
  BotNodeBase,
  NodeBody,
  NodeBodyText,
  NodePlaceholder,
} from '@/salesbot/components/BotNodeBase';

const Badge = styled.span`
  background: ${H.ai_agent};
  border-radius: 4px;
  color: ${N.ai_agent};
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-top: 4px;
  padding: 2px 6px;
  text-transform: uppercase;
`;

export const BotAiAgentNode = ({ id, data }: NodeProps) => {
  const selectedId = useAtomValue(botEditorSelectedNodeIdAtom);
  const config = data.config as Record<string, unknown>;
  const systemPrompt = config.systemPrompt as string | undefined;
  const maxTurns = (config.maxAiTurns as number | undefined) ?? 10;

  const preview = systemPrompt
    ? systemPrompt.slice(0, 60) + (systemPrompt.length > 60 ? '…' : '')
    : undefined;

  return (
    <BotNodeBase
      num={data.num as number | undefined}
      typeLabel="Agente de IA"
      typeColor={N.ai_agent}
      selected={selectedId === id}
    >
      <NodeBody>
        {preview ? (
          <>
            <NodeBodyText>{preview}</NodeBodyText>
            <div style={{ marginTop: 6 }}>
              <Badge>Máx. {maxTurns} turnos</Badge>
            </div>
          </>
        ) : (
          <NodePlaceholder>Clique para configurar prompt…</NodePlaceholder>
        )}
      </NodeBody>
    </BotNodeBase>
  );
};
