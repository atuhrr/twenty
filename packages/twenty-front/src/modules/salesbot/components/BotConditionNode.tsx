// FORK: Voka CRM — Fase 14.3A: nó Condição (ramifica em true/false)
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useAtomValue } from 'jotai';
import { styled } from '@linaria/react';

import {
  NODE_BRANCH_COLORS as B,
  NODE_PALETTE as N,
} from '@/salesbot/constants/canvasPalette';
import { botEditorSelectedNodeIdAtom } from '@/salesbot/states/botEditorState';
import {
  BotNodeBase,
  NodeBody,
  NodePlaceholder,
  TypeDot,
} from '@/salesbot/components/BotNodeBase';

const BranchRow = styled.div`
  align-items: center;
  border-top: 1px solid ${N.headerBorder};
  display: flex;
  justify-content: space-between;
  padding: 6px 12px;
  position: relative;
`;

const BranchLabel = styled.span<{ color: string }>`
  color: ${({ color }) => color};
  font-size: 11px;
  font-weight: 600;
`;

const BranchHandle = styled(Handle)<{ color: string }>`
  background: ${({ color }) => color};
  border: 2px solid ${B.handleBorder};
  border-radius: 50%;
  height: 12px;
  position: relative;
  right: -7px;
  top: auto;
  transform: none;
  width: 12px;
`;

const BRANCH_TRUE_COLOR = B.true;
const BRANCH_FALSE_COLOR = B.false;

export const BotConditionNode = ({ id, data }: NodeProps) => {
  const selectedId = useAtomValue(botEditorSelectedNodeIdAtom);
  const config = data.config as Record<string, unknown>;
  const field = config.field as string | undefined;
  const operator = config.operator as string | undefined;
  const value = config.value as string | undefined;

  const summary =
    field && operator
      ? `${field} ${operator}${value ? ` "${value}"` : ''}`
      : undefined;

  return (
    <BotNodeBase
      num={data.num as number | undefined}
      typeLabel="Condição"
      typeColor={N.condition}
      selected={selectedId === id}
      outputs={[]} // handles manuais abaixo
    >
      <NodeBody>
        {summary ? (
          <span style={{ color: N.bodyText, fontSize: 13 }}>{summary}</span>
        ) : (
          <NodePlaceholder>Clique para configurar…</NodePlaceholder>
        )}
      </NodeBody>

      <BranchRow>
        <TypeDot color={BRANCH_TRUE_COLOR} />
        <BranchLabel color={BRANCH_TRUE_COLOR}>Sim</BranchLabel>
        <BranchHandle
          type="source"
          position={Position.Right}
          id="true"
          color={BRANCH_TRUE_COLOR}
        />
      </BranchRow>

      <BranchRow>
        <TypeDot color={BRANCH_FALSE_COLOR} />
        <BranchLabel color={BRANCH_FALSE_COLOR}>Não</BranchLabel>
        <BranchHandle
          type="source"
          position={Position.Right}
          id="false"
          color={BRANCH_FALSE_COLOR}
        />
      </BranchRow>
    </BotNodeBase>
  );
};
