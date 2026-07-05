// FORK: Voka CRM — Fase 14.3A: shell compartilhada dos nós do canvas
import type { ReactNode } from 'react';

import { Handle, Position } from '@xyflow/react';
import { styled } from '@linaria/react';

import { NODE_PALETTE as N } from '@/salesbot/constants/canvasPalette';

// ── Primitivas de estilo ────────────────────────────────────────────────────

export const NodeCard = styled.div<{ selected?: boolean }>`
  background: ${N.bg};
  border: 1.5px solid ${({ selected }) => (selected ? N.borderSelected : N.border)};
  border-radius: 10px;
  cursor: pointer;
  min-width: 240px;
  overflow: visible;
  position: relative;
`;

export const NodeHeader = styled.div`
  align-items: center;
  border-bottom: 1px solid ${N.headerBorder};
  display: flex;
  gap: 8px;
  padding: 8px 12px;
`;

export const NodeNum = styled.span`
  color: ${N.numColor};
  font-size: 11px;
  font-weight: 700;
  min-width: 14px;
`;

export const NodeTypeName = styled.span`
  color: ${N.typeColor};
  flex: 1;
  font-size: 12px;
  font-weight: 600;
`;

export const NodeBody = styled.div`
  padding: 10px 12px;
`;

export const NodeBodyText = styled.p`
  color: ${N.bodyText};
  font-size: 13px;
  line-height: 1.45;
  margin: 0;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const NodePlaceholder = styled.span`
  color: ${N.placeholderText};
  font-size: 13px;
  font-style: italic;
`;

// Handle de entrada (top-left, invisível para o usuário — só para React Flow)
export const InputHandle = styled(Handle)`
  background: transparent;
  border: none;
  height: 1px;
  left: 0;
  width: 1px;
`;

// Handle de saída padrão (direita)
export const OutputHandle = styled(Handle)<{ offsetY?: number }>`
  background: ${N.border};
  border: 2px solid ${N.typeColor};
  border-radius: 50%;
  height: 12px;
  right: -7px;
  top: ${({ offsetY }) => (offsetY !== undefined ? `${offsetY}px` : '50%')};
  transform: ${({ offsetY }) => (offsetY !== undefined ? 'none' : 'translateY(-50%)')};
  transition: background 0.15s;
  width: 12px;

  &:hover { background: ${N.typeColor}; }
`;

// ── Tipo do dot colorido de ícone ─────────────────────────────────────────

export const TypeDot = styled.span<{ color: string }>`
  background: ${({ color }) => color};
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
  height: 8px;
  width: 8px;
`;

// ── Componente de shell ──────────────────────────────────────────────────────

type Props = {
  num?: number;
  typeLabel: string;
  typeColor: string;
  selected?: boolean;
  children: ReactNode;
  outputs?: Array<{ id: string; label?: string; color?: string; offsetY?: number }>;
  showInput?: boolean;
};

export const BotNodeBase = ({
  num,
  typeLabel,
  typeColor,
  selected = false,
  children,
  outputs = [{ id: 'output' }],
  showInput = true,
}: Props) => (
  <NodeCard selected={selected}>
    {showInput && (
      <InputHandle type="target" position={Position.Left} id="input" />
    )}

    <NodeHeader>
      <TypeDot color={typeColor} />
      {num !== undefined && <NodeNum>{num}</NodeNum>}
      <NodeTypeName>{typeLabel}</NodeTypeName>
    </NodeHeader>

    {children}

    {outputs.map(({ id, offsetY }) => (
      <OutputHandle
        key={id}
        type="source"
        position={Position.Right}
        id={id}
        offsetY={offsetY}
      />
    ))}
  </NodeCard>
);
