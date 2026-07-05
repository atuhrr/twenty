// FORK: Voka CRM — Fase 14.1: tipos de grafo + hooks
import { useMutation, useQuery } from '@apollo/client/react';

import {
  CREATE_SALESBOT,
  DELETE_SALESBOT,
  GET_SALESBOTS,
  UPDATE_SALESBOT,
} from '@/salesbot/graphql/salesbotQueries';

// ── Tipos de grafo ──────────────────────────────────────────────────────────

export type BotNodeType =
  | 'TRIGGER'
  | 'START'
  | 'MESSAGE'
  | 'REACTION'
  | 'COMMENT'
  | 'INTERNAL_MESSAGE'
  | 'LIST_MESSAGE'
  | 'PAUSE'
  | 'SUBSCRIBE'
  | 'ACTION'
  | 'CONDITION'
  | 'VALIDATION'
  | 'CUSTOM_STEP'
  | 'WIDGET'
  | 'DISTRIBUTION'
  | 'AI_AGENT'
  | 'HANDOFF'
  | 'STOP';

export type BotNode = {
  id: string;
  type: BotNodeType;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  width?: number;
  height?: number;
};

export type BotEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  label?: string;
};

export type BotGraph = {
  nodes: BotNode[];
  edges: BotEdge[];
};

export type BotTriggerType =
  | 'KEYWORD'
  | 'ALWAYS'
  | 'UNCLASSIFIED'
  | 'CONVERSATION_CLOSED'
  | 'MANUAL';

export type BotChannelType =
  | 'WHATSAPP'
  | 'TELEGRAM'
  | 'INSTAGRAM'
  | 'MESSENGER'
  | 'EMAIL';

export type BotTrigger = {
  type: BotTriggerType;
  keyword?: string;
  channel?: BotChannelType;
};

export type Salesbot = {
  id: string;
  workspaceId: string;
  name: string;
  triggers: BotTrigger[];
  graph: BotGraph;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

// ── Helpers ─────────────────────────────────────────────────────────────────

export const TRIGGER_TYPE_LABELS: Record<BotTriggerType, string> = {
  KEYWORD: 'Palavra-chave',
  ALWAYS: 'Sempre (nova conversa)',
  UNCLASSIFIED: 'Lead não classificado',
  CONVERSATION_CLOSED: 'Conversa encerrada',
  MANUAL: 'Manual (pelo card do lead)',
};

export const CHANNEL_LABELS: Record<BotChannelType, string> = {
  WHATSAPP: 'WhatsApp',
  TELEGRAM: 'Telegram',
  INSTAGRAM: 'Instagram',
  MESSENGER: 'Messenger',
  EMAIL: 'E-mail',
};

/** Conta nós reais do fluxo (exclui TRIGGER e START) */
export const countFlowNodes = (graph: BotGraph | null | undefined): number =>
  (graph?.nodes ?? []).filter((n) => n.type !== 'TRIGGER' && n.type !== 'START').length;

// ── Hooks ───────────────────────────────────────────────────────────────────

export const useSalesbots = () => {
  const { data, loading, refetch } = useQuery<{ salesbots: Salesbot[] }>(
    GET_SALESBOTS,
    { fetchPolicy: 'cache-and-network' },
  );

  return { bots: data?.salesbots ?? [], loading, refetch };
};

export const useCreateSalesbot = () => {
  const [create, { loading }] = useMutation(CREATE_SALESBOT, {
    refetchQueries: [{ query: GET_SALESBOTS }],
  });

  return { create, loading };
};

export const useUpdateSalesbot = () => {
  const [update, { loading }] = useMutation(UPDATE_SALESBOT, {
    refetchQueries: [{ query: GET_SALESBOTS }],
  });

  return { update, loading };
};

export const useDeleteSalesbot = () => {
  const [remove] = useMutation(DELETE_SALESBOT, {
    refetchQueries: [{ query: GET_SALESBOTS }],
  });

  return { remove };
};
