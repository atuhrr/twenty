// FORK: Voka CRM — Fase 14.2: nó "Iniciar bot" no canvas
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { styled } from '@linaria/react';

import { IconPlayerPlay } from 'twenty-ui/icon';

import { CANVAS_PALETTE as C } from '@/salesbot/constants/canvasPalette';

const Wrap = styled.div`
  align-items: center;
  background: ${C.cardBg};
  border: 2px solid ${C.startBorder};
  border-radius: 10px;
  cursor: default;
  display: flex;
  gap: 10px;
  min-width: 160px;
  padding: 10px 16px;
  user-select: none;
`;

const IconWrap = styled.div`
  align-items: center;
  background: ${C.startBorder};
  border-radius: 50%;
  color: ${C.textInverted};
  display: flex;
  flex-shrink: 0;
  height: 28px;
  justify-content: center;
  width: 28px;
`;

const Label = styled.span`
  color: ${C.textPrimary};
  font-size: 14px;
  font-weight: 600;
`;

const SourceHandle = styled(Handle)`
  background: ${C.handleBg};
  border: 2px solid ${C.textInverted};
  border-radius: 50%;
  height: 14px;
  right: -8px;
  width: 14px;
`;

export const BotStartNode = (_: NodeProps) => (
  <Wrap>
    <IconWrap>
      <IconPlayerPlay size={14} />
    </IconWrap>
    <Label>Iniciar bot</Label>
    <SourceHandle type="source" position={Position.Right} id="output" />
  </Wrap>
);
