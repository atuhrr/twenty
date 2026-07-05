// FORK: Voka CRM — Fase 14.3A: canvas com nós núcleo + "Add next step" + painel
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type OnConnectStartParams,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { styled } from '@linaria/react';

import { CANVAS_PALETTE as C } from '@/salesbot/constants/canvasPalette';
import { BotStartNode } from '@/salesbot/components/BotStartNode';
import { BotMessageNode } from '@/salesbot/components/BotMessageNode';
import { BotConditionNode } from '@/salesbot/components/BotConditionNode';
import { BotPauseNode } from '@/salesbot/components/BotPauseNode';
import { BotActionNode } from '@/salesbot/components/BotActionNode';
import {
  BotReactionNode,
  BotCommentNode,
  BotInternalMessageNode,
  BotSubscribeNode,
  BotCustomStepNode,
  BotWidgetNode,
  BotDistributionNode,
} from '@/salesbot/components/BotExtendedNodes';
import { BotListMessageNode } from '@/salesbot/components/BotListMessageNode';
import { BotAiAgentNode } from '@/salesbot/components/BotAiAgentNode';
import { BotHandoffNode } from '@/salesbot/components/BotHandoffNode';
import { BotValidationNode } from '@/salesbot/components/BotValidationNode';
import { BotStopNode } from '@/salesbot/components/BotStopNode';
import { BotTriggerCard } from '@/salesbot/components/BotTriggerCard';
import { BotAddStepMenu } from '@/salesbot/components/BotAddStepMenu';
import { BotConfigPanel } from '@/salesbot/components/BotConfigPanel';
import { BotPreviewPanel } from '@/salesbot/components/BotPreviewPanel';
import {
  botEditorAddStepMenuAtom,
  botEditorDirtyAtom,
  botEditorGraphAtom,
  botEditorSelectedNodeIdAtom,
  botPreviewOpenAtom,
} from '@/salesbot/states/botEditorState';
import type { BotGraph } from '@/salesbot/hooks/useSalesbot';

// ── Tipos ReactFlow ──────────────────────────────────────────────────────────

type BotRFNodeData = { config: Record<string, unknown>; label: string; num?: number };
type BotRFNode = Node<BotRFNodeData, string>;

const NODE_TYPES = {
  start:            BotStartNode,
  message:          BotMessageNode,
  condition:        BotConditionNode,
  pause:            BotPauseNode,
  action:           BotActionNode,
  reaction:         BotReactionNode,
  comment:          BotCommentNode,
  internal_message: BotInternalMessageNode,
  list_message:     BotListMessageNode,
  subscribe:        BotSubscribeNode,
  ai_agent:         BotAiAgentNode,
  handoff:          BotHandoffNode,
  validation:       BotValidationNode,
  stop:             BotStopNode,
  custom_step:      BotCustomStepNode,
  widget:           BotWidgetNode,
  distribution:     BotDistributionNode,
} as const;

// ── Conversão ────────────────────────────────────────────────────────────────

const graphToRfNodes = (graph: BotGraph): BotRFNode[] => {
  const flowNodes = (graph?.nodes ?? []).filter((n) => n.type !== 'TRIGGER');
  let num = 0;

  return flowNodes.map((n) => {
    const isFlow = n.type !== 'START';

    if (isFlow) num += 1;

    return {
      id: n.id,
      type: n.type.toLowerCase(),
      position: n.position,
      data: {
        config: n.config,
        label: n.type,
        num: isFlow ? num : undefined,
      },
      width: n.width,
      height: n.height,
    };
  });
};

// ── Estilos ─────────────────────────────────────────────────────────────────

const CanvasRow = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

const CanvasWrap = styled.div`
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;

  .react-flow__node-input,
  .react-flow__node-default,
  .react-flow__node-output,
  .react-flow__node-group {
    padding: 0;
    text-align: start;
    white-space: nowrap;
    width: auto;
  }

  .react-flow__controls {
    background: ${C.cardBg};
    border: 1px solid ${C.cardBorder};
    border-radius: 8px;
    box-shadow: none;
  }

  .react-flow__controls-button {
    background: transparent;
    border: none;
    border-bottom: 1px solid ${C.cardBorder};
    color: ${C.textMuted};
    fill: ${C.textMuted};

    &:hover {
      background: var(--t-canvas-overlay-sm);
      fill: ${C.textPrimary};
    }

    &:last-child { border-bottom: none; }
  }

  .react-flow__minimap {
    background: ${C.cardBg};
    border: 1px solid ${C.cardBorder};
    border-radius: 8px;
  }

  .react-flow__edge-path {
    stroke: ${C.edge};
    stroke-width: 1.5px;
  }
`;

// ── Inner canvas ─────────────────────────────────────────────────────────────

const MIN_DRAG_PX = 5;

const BotCanvasCore = () => {
  const [graph, setGraph] = useAtom(botEditorGraphAtom);
  const setDirty = useSetAtom(botEditorDirtyAtom);
  const setSelectedNodeId = useSetAtom(botEditorSelectedNodeIdAtom);
  const setAddStepMenu = useSetAtom(botEditorAddStepMenuAtom);
  const selectedNodeId = useAtomValue(botEditorSelectedNodeIdAtom);
  const previewOpen = useAtomValue(botPreviewOpenAtom);

  const reactflow = useReactFlow<BotRFNode>();
  const containerRef = useRef<HTMLDivElement>(null);
  const connectStartRef = useRef<{
    nodeId: string;
    handle: string;
    startX: number;
    startY: number;
  } | null>(null);

  const [rfNodes, setRfNodes] = useState<BotRFNode[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Inicializa quando o grafo chega do servidor
  useEffect(() => {
    if (!initialized && (graph?.nodes?.length ?? 0) > 0) {
      setRfNodes(graphToRfNodes(graph));
      setInitialized(true);
    }
  }, [graph, initialized]);

  // Re-sincroniza quando novos nós são adicionados via BotAddStepMenu
  useEffect(() => {
    if (!initialized) return;
    const rfIds = new Set(rfNodes.map((n) => n.id));
    const newNodes = (graph?.nodes ?? [])
      .filter((n) => n.type !== 'TRIGGER' && !rfIds.has(n.id));

    if (newNodes.length > 0) {
      const currentFlowNodes = (graph?.nodes ?? []).filter((n) => n.type !== 'TRIGGER');
      let num = 0;

      const fullRfNodes = currentFlowNodes.map((n) => {
        const isFlow = n.type !== 'START';

        if (isFlow) num += 1;

        return {
          id: n.id,
          type: n.type.toLowerCase(),
          position: n.position,
          data: { config: n.config, label: n.type, num: isFlow ? num : undefined },
        } as BotRFNode;
      });

      setRfNodes(fullRfNodes);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph?.nodes?.length, initialized]);

  const onNodesChange = useCallback(
    (changes: NodeChange<BotRFNode>[]) => {
      setRfNodes((prev) => applyNodeChanges(changes, prev));

      const posChanges = changes.filter(
        (c): c is NodeChange<BotRFNode> & { type: 'position'; position: { x: number; y: number } } =>
          c.type === 'position' && 'position' in c && !!c.position,
      );

      if (posChanges.length > 0) {
        setGraph((prev: BotGraph) => ({
          ...prev,
          nodes: prev.nodes.map((n) => {
            const ch = posChanges.find((c) => c.id === n.id);

            return ch?.position ? { ...n, position: ch.position } : n;
          }),
        }));
        setDirty(true);
      }

      const removeChanges = changes.filter((c) => c.type === 'remove');

      if (removeChanges.length > 0) {
        const removedIds = new Set(removeChanges.map((c) => c.id));

        setGraph((prev: BotGraph) => ({
          nodes: prev.nodes.filter((n) => !removedIds.has(n.id)),
          edges: prev.edges.filter(
            (e) => !removedIds.has(e.source) && !removedIds.has(e.target),
          ),
        }));
        setDirty(true);
      }
    },
    [setGraph, setDirty],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setGraph((prev: BotGraph) => ({
        ...prev,
        edges: [
          ...prev.edges,
          {
            id: crypto.randomUUID(),
            source: connection.source ?? '',
            target: connection.target ?? '',
            sourceHandle: connection.sourceHandle ?? 'output',
            targetHandle: connection.targetHandle ?? 'input',
          },
        ],
      }));
      setDirty(true);
    },
    [setGraph, setDirty],
  );

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      const deletedIds = new Set(deleted.map((e) => e.id));

      setGraph((prev: BotGraph) => ({
        ...prev,
        edges: prev.edges.filter((e) => !deletedIds.has(e.id)),
      }));
      setDirty(true);
    },
    [setGraph, setDirty],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: BotRFNode) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const onConnectStart = useCallback(
    (_: MouseEvent | TouchEvent, params: OnConnectStartParams) => {
      if (params.nodeId && params.handleId) {
        const ev = _ as MouseEvent;

        connectStartRef.current = {
          nodeId: params.nodeId,
          handle: params.handleId,
          startX: ev.clientX ?? 0,
          startY: ev.clientY ?? 0,
        };
      }
    },
    [],
  );

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const start = connectStartRef.current;
      connectStartRef.current = null;

      if (!start || !(event instanceof MouseEvent)) return;

      const dx = event.clientX - start.startX;
      const dy = event.clientY - start.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Dropped on empty canvas (or small click on handle) → open "Add next step"
      const target = event.target as Element | null;
      const droppedOnNode = target?.closest?.('.react-flow__node');

      if (droppedOnNode) return;

      // Compute flow position for new node (offset 200px right of cursor)
      const flowPos = reactflow.screenToFlowPosition({
        x: event.clientX + (dist < MIN_DRAG_PX ? 200 : 0),
        y: event.clientY - 40,
      });

      setAddStepMenu({
        screenX: event.clientX + 8,
        screenY: event.clientY + 8,
        sourceNodeId: start.nodeId,
        sourceHandle: start.handle,
        newNodeFlowPos: flowPos,
      });
    },
    [reactflow, setAddStepMenu],
  );

  return (
    <CanvasRow>
      <CanvasWrap ref={containerRef}>
        <ReactFlow
          nodes={rfNodes}
          edges={(graph?.edges ?? []).map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
            label: e.label,
            type: 'default',
            style: { stroke: C.edge, strokeWidth: 1.5 },
          }))}
          onNodesChange={onNodesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          nodeTypes={NODE_TYPES}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          deleteKeyCode={['Delete', 'Backspace']}
          nodesDraggable
          nodesConnectable
          panOnScroll
          panOnDrag={!selectedNodeId}
          fitView
          proOptions={{ hideAttribution: true }}
          style={{ background: C.bg }}
          defaultViewport={{ x: 280, y: 120, zoom: 1 }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            color={C.dotColor}
            size={2}
            gap={24}
          />
          <Controls position="top-right" showInteractive={false} />
          <MiniMap
            position="bottom-right"
            nodeColor={C.cardBorder}
            style={{ background: C.cardBg }}
          />
        </ReactFlow>

        <BotTriggerCard />
        <BotAddStepMenu />
        {previewOpen && <BotPreviewPanel />}
      </CanvasWrap>

      {!previewOpen && <BotConfigPanel />}
    </CanvasRow>
  );
};

// ── Componente público ────────────────────────────────────────────────────────

export const BotCanvas = () => (
  <ReactFlowProvider>
    <BotCanvasCore />
  </ReactFlowProvider>
);
