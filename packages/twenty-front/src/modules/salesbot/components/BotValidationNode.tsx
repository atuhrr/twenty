// FORK: Voka CRM — Fase 14.3B: nó Validação de entrada do usuário
import { useAtomValue } from 'jotai';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { styled } from '@linaria/react';

import {
  NODE_BRANCH_COLORS as B,
  NODE_PALETTE as N,
} from '@/salesbot/constants/canvasPalette';
import { botEditorSelectedNodeIdAtom } from '@/salesbot/states/botEditorState';
import {
  BotNodeBase,
  NodeBody,
  NodeBodyText,
  NodePlaceholder,
} from '@/salesbot/components/BotNodeBase';

const VALIDATION_LABELS: Record<string, string> = {
  email: 'E-mail',
  phone: 'Telefone',
  number: 'Número',
  text: 'Texto livre',
};

const BranchRow = styled.div`
  align-items: center;
  border-top: 1px solid ${N.headerBorder};
  display: flex;
  justify-content: space-between;
  padding: 6px 12px;
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

const VALID_COLOR = B.true;
const INVALID_COLOR = B.false;

export const BotValidationNode = ({ id, data }: NodeProps) => {
  const selectedId = useAtomValue(botEditorSelectedNodeIdAtom);
  const config = data.config as Record<string, unknown>;
  const field = config.field as string | undefined;
  const validationType = (config.validationType as string | undefined) ?? 'text';
  const typeLabel = VALIDATION_LABELS[validationType] ?? validationType;

  return (
    <BotNodeBase
      num={data.num as number | undefined}
      typeLabel="Validação"
      typeColor={N.validation}
      selected={selectedId === id}
      outputs={[]}
    >
      <NodeBody>
        {field ? (
          <NodeBodyText>
            {field} → {typeLabel}
          </NodeBodyText>
        ) : (
          <NodePlaceholder>Clique para configurar validação…</NodePlaceholder>
        )}
      </NodeBody>

      <BranchRow>
        <BranchLabel color={VALID_COLOR}>Válido</BranchLabel>
        <BranchHandle
          type="source"
          position={Position.Right}
          id="true"
          color={VALID_COLOR}
        />
      </BranchRow>

      <BranchRow>
        <BranchLabel color={INVALID_COLOR}>Inválido</BranchLabel>
        <BranchHandle
          type="source"
          position={Position.Right}
          id="false"
          color={INVALID_COLOR}
        />
      </BranchRow>
    </BotNodeBase>
  );
};
