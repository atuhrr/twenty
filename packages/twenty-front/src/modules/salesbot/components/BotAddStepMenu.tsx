// FORK: Voka CRM — Fase 14.3A: menu "Adicionar próximo passo"
import { useEffect, useRef } from 'react';

import { useAtom, useSetAtom } from 'jotai';
import { styled } from '@linaria/react';

import {
  CANVAS_OVERLAY as O,
  CANVAS_PALETTE as C,
  CORE_NODE_CATALOG,
  EXTENDED_NODE_CATALOG,
} from '@/salesbot/constants/canvasPalette';
import {
  botEditorAddStepMenuAtom,
  botEditorDirtyAtom,
  botEditorGraphAtom,
  botEditorSelectedNodeIdAtom,
} from '@/salesbot/states/botEditorState';
import type { BotNodeType } from '@/salesbot/hooks/useSalesbot';

const Backdrop = styled.div`
  bottom: 0;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 100;
`;

const Menu = styled.div<{ x: number; y: number }>`
  background: ${C.cardBg};
  border: 1px solid ${C.cardBorder};
  border-radius: 10px;
  box-shadow: 0 8px 32px ${O.shadow};
  left: ${({ x }) => x}px;
  min-width: 220px;
  overflow: hidden;
  position: fixed;
  top: ${({ y }) => y}px;
  z-index: 101;
`;

const MenuTitle = styled.div`
  border-bottom: 1px solid ${C.cardBorder};
  color: ${C.textMuted};
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 10px 14px 8px;
  text-transform: uppercase;
`;

const MenuItem = styled.button`
  align-items: center;
  background: transparent;
  border: none;
  color: ${C.textPrimary};
  cursor: pointer;
  display: flex;
  font-size: 13px;
  font-weight: 500;
  gap: 10px;
  padding: 9px 14px;
  text-align: left;
  transition: background 0.1s;
  width: 100%;

  &:hover { background: ${O.sm}; }
`;

const Dot = styled.span<{ color: string }>`
  background: ${({ color }) => color};
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
  height: 10px;
  width: 10px;
`;

export const BotAddStepMenu = () => {
  const [menu, setMenu] = useAtom(botEditorAddStepMenuAtom);
  const setGraph = useSetAtom(botEditorGraphAtom);
  const setDirty = useSetAtom(botEditorDirtyAtom);
  const setSelectedNodeId = useSetAtom(botEditorSelectedNodeIdAtom);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;

    // Ajuste de posição para não sair da viewport
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    if (rect.bottom > vh) {
      menuRef.current.style.top = `${menu.screenY - rect.height}px`;
    }
    if (rect.right > vw) {
      menuRef.current.style.left = `${menu.screenX - rect.width}px`;
    }
  }, [menu]);

  if (!menu) return null;

  const handleSelect = (type: string) => {
    const nodeId = crypto.randomUUID();
    const edgeId = crypto.randomUUID();

    setGraph((prev) => ({
      nodes: [
        ...prev.nodes,
        {
          id: nodeId,
          type: type.toUpperCase() as BotNodeType,
          config: {},
          position: menu.newNodeFlowPos,
        },
      ],
      edges: [
        ...prev.edges,
        {
          id: edgeId,
          source: menu.sourceNodeId,
          target: nodeId,
          sourceHandle: menu.sourceHandle,
          targetHandle: 'input',
        },
      ],
    }));

    setDirty(true);
    setSelectedNodeId(nodeId);
    setMenu(null);
  };

  return (
    <>
      <Backdrop onClick={() => setMenu(null)} />
      <Menu ref={menuRef} x={menu.screenX} y={menu.screenY}>
        <MenuTitle>Adicionar próximo passo</MenuTitle>
        {CORE_NODE_CATALOG.map(({ type, label, color }) => (
          <MenuItem key={type} onClick={() => handleSelect(type)}>
            <Dot color={color} />
            {label}
          </MenuItem>
        ))}
        <div
          style={{
            borderTop: `1px solid ${C.cardBorder}`,
            color: C.textMuted,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            padding: '8px 14px 4px',
            textTransform: 'uppercase',
          }}
        >
          Avançado
        </div>
        {EXTENDED_NODE_CATALOG.map(({ type, label, color }) => (
          <MenuItem key={type} onClick={() => handleSelect(type)}>
            <Dot color={color} />
            {label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
