// FORK: Voka CRM — Fase 14.3A: nó Ação (coleta dado do contato)
import { useAtomValue } from 'jotai';
import { type NodeProps } from '@xyflow/react';

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

export const BotActionNode = ({ id, data }: NodeProps) => {
  const selectedId = useAtomValue(botEditorSelectedNodeIdAtom);
  const config = data.config as Record<string, unknown>;
  const question = config.question as string | undefined;
  const fieldToSave = config.fieldToSave as string | undefined;

  return (
    <BotNodeBase
      num={data.num as number | undefined}
      typeLabel="Ação"
      typeColor={N.action}
      selected={selectedId === id}
    >
      <NodeBody>
        {question ? (
          <NodeBodyText>{question}</NodeBodyText>
        ) : (
          <NodePlaceholder>Clique para adicionar pergunta…</NodePlaceholder>
        )}
        {fieldToSave && (
          <span
            style={{
              background: H.action,
              borderRadius: 4,
              color: N.action,
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 600,
              marginTop: 6,
              padding: '2px 6px',
            }}
          >
            → {fieldToSave}
          </span>
        )}
      </NodeBody>
    </BotNodeBase>
  );
};
