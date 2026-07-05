// FORK: Voka CRM — Fase 14.5B: simulador de bot (frontend only, sem API calls)
import type { BotGraph, BotNode } from '@/salesbot/hooks/useSalesbot';

export type SimMessage = { from: 'bot' | 'user'; text: string };

export type SimState = {
  nodeId: string | null;
  collectedData: Record<string, string>;
  status: 'active' | 'paused' | 'done';
  // Campo/chave aguardando input. '_pause' = PAUSE genérico, '_list' = LIST_MESSAGE.
  awaitingKey: string | null;
};

export type SimStepResult = {
  state: SimState;
  newMessages: SimMessage[];
};

const MAX_STEPS = 60;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getNext(graph: BotGraph, nodeId: string, handle = 'output'): BotNode | null {
  const edge = graph.edges.find(
    (e) => e.source === nodeId && e.sourceHandle === handle,
  );

  if (!edge) return null;

  return graph.nodes.find((n) => n.id === edge.target) ?? null;
}

function evalCondition(value: string, operator: string, expected: string): boolean {
  switch (operator) {
    case 'eq':
      return value.toLowerCase() === expected.toLowerCase();
    case 'contains':
      return value.toLowerCase().includes(expected.toLowerCase());
    case 'exists':
      return value.trim().length > 0;
    default:
      return false;
  }
}

function validateFormat(value: string, type: string): boolean {
  switch (type) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'phone':
      return /^\+?[\d\s\-()]{8,}$/.test(value.replace(/\s/g, ''));
    case 'number':
      return !Number.isNaN(Number(value));
    default:
      return value.trim().length > 0;
  }
}

// ── API pública ───────────────────────────────────────────────────────────────

export function createSimState(graph: BotGraph): SimState {
  const start = (graph?.nodes ?? []).find((n) => n.type === 'START');

  return {
    nodeId: start?.id ?? null,
    collectedData: {},
    status: 'active',
    awaitingKey: null,
  };
}

/**
 * Executa um passo do simulador.
 * - Quando userInput é null: executa a partir do estado atual (auto-advance).
 * - Quando userInput é uma string: processa o input do usuário e avança.
 */
export function simulateStep(
  graph: BotGraph,
  state: SimState,
  userInput: string | null,
): SimStepResult {
  const messages: SimMessage[] = [];
  let cur: SimState = { ...state, collectedData: { ...state.collectedData } };

  // Processa input do usuário
  if (userInput !== null && cur.awaitingKey !== null) {
    messages.push({ from: 'user', text: userInput });
    const key = cur.awaitingKey;

    cur = { ...cur, awaitingKey: null, status: 'active' };

    const node = graph.nodes.find((n) => n.id === cur.nodeId);

    if (node) {
      if (node.type === 'VALIDATION') {
        const validationType = (node.config.validationType as string) ?? 'text';
        const isValid = validateFormat(userInput, validationType);

        if (!isValid) {
          messages.push({
            from: 'bot',
            text: `Formato inválido para ${node.config.field ?? 'campo'}. Tente novamente.`,
          });
          cur = { ...cur, awaitingKey: key, status: 'paused' };

          return { state: cur, newMessages: messages };
        }

        cur.collectedData[node.config.field as string ?? 'value'] = userInput;
        const nextValid = getNext(graph, node.id, 'true');

        cur.nodeId = nextValid?.id ?? null;
        if (!cur.nodeId) cur.status = 'done';
      } else if (key !== '_pause' && key !== '_list') {
        // ACTION: armazena campo coletado
        cur.collectedData[key] = userInput;
        const next = getNext(graph, node.id);

        cur.nodeId = next?.id ?? null;
        if (!cur.nodeId) cur.status = 'done';
      } else {
        // PAUSE ou LIST_MESSAGE: apenas avança
        if (key === '_list') cur.collectedData.listChoice = userInput;
        const next = getNext(graph, node.id);

        cur.nodeId = next?.id ?? null;
        if (!cur.nodeId) cur.status = 'done';
      }
    }
  }

  // Auto-avança nós até chegar num nó de espera ou terminal
  let steps = 0;

  while (cur.nodeId && cur.status === 'active' && steps < MAX_STEPS) {
    steps++;
    const node = graph.nodes.find((n) => n.id === cur.nodeId);

    if (!node) { cur.status = 'done'; break; }

    switch (node.type) {
      case 'START': {
        const next = getNext(graph, node.id);

        cur.nodeId = next?.id ?? null;
        if (!cur.nodeId) cur.status = 'done';
        break;
      }
      case 'MESSAGE': {
        const text = (node.config.text as string) ?? '';

        if (text) messages.push({ from: 'bot', text });
        const next = getNext(graph, node.id);

        cur.nodeId = next?.id ?? null;
        if (!cur.nodeId) cur.status = 'done';
        break;
      }
      case 'ACTION': {
        const question = (node.config.question as string) ?? '';
        const field = (node.config.fieldToSave as string) ?? 'value';

        if (cur.collectedData[field]) {
          const next = getNext(graph, node.id);

          cur.nodeId = next?.id ?? null;
          if (!cur.nodeId) cur.status = 'done';
        } else {
          if (question) messages.push({ from: 'bot', text: question });
          cur = { ...cur, awaitingKey: field, status: 'paused' };
        }
        break;
      }
      case 'PAUSE': {
        messages.push({ from: 'bot', text: '⏳ Aguardando sua resposta…' });
        cur = { ...cur, awaitingKey: '_pause', status: 'paused' };
        break;
      }
      case 'CONDITION': {
        const field = (node.config.field as string) ?? '';
        const operator = (node.config.operator as string) ?? 'exists';
        const expected = (node.config.value as string) ?? '';
        const met = evalCondition(cur.collectedData[field] ?? '', operator, expected);
        const next = getNext(graph, node.id, met ? 'true' : 'false');

        cur.nodeId = next?.id ?? null;
        if (!cur.nodeId) cur.status = 'done';
        break;
      }
      case 'VALIDATION': {
        const field = (node.config.field as string) ?? 'value';

        if (cur.collectedData[field]) {
          // Já coletado (improvável aqui, mas seguro)
          const next = getNext(graph, node.id, 'true');

          cur.nodeId = next?.id ?? null;
          if (!cur.nodeId) cur.status = 'done';
        } else {
          const typeLabel = (node.config.validationType as string) ?? 'text';

          messages.push({
            from: 'bot',
            text: `Por favor, informe seu ${field} (${typeLabel}):`,
          });
          cur = { ...cur, awaitingKey: field, nodeId: node.id, status: 'paused' };
        }
        break;
      }
      case 'LIST_MESSAGE': {
        const header = (node.config.headerText as string) ?? 'Escolha uma opção:';
        const items = (node.config.items as Array<{ id: string; title: string }>) ?? [];
        const itemLines = items.map((it, i) => `  ${i + 1}. ${it.title}`).join('\n');

        messages.push({ from: 'bot', text: `${header}\n${itemLines}` });
        cur = { ...cur, awaitingKey: '_list', status: 'paused' };
        break;
      }
      case 'AI_AGENT': {
        messages.push({
          from: 'bot',
          text: '🤖 (Agente de IA — resposta simulada no preview)',
        });
        const next = getNext(graph, node.id);

        cur.nodeId = next?.id ?? null;
        if (!cur.nodeId) cur.status = 'done';
        break;
      }
      case 'REACTION': {
        const emoji = (node.config.emoji as string) ?? '👍';

        messages.push({ from: 'bot', text: `Reagiu com: ${emoji}` });
        const next = getNext(graph, node.id);

        cur.nodeId = next?.id ?? null;
        if (!cur.nodeId) cur.status = 'done';
        break;
      }
      case 'COMMENT': {
        const text = (node.config.text as string) ?? '';

        if (text) messages.push({ from: 'bot', text: `📝 Comentário: ${text}` });
        const next = getNext(graph, node.id);

        cur.nodeId = next?.id ?? null;
        if (!cur.nodeId) cur.status = 'done';
        break;
      }
      case 'INTERNAL_MESSAGE': {
        const text = (node.config.text as string) ?? '';

        if (text) messages.push({ from: 'bot', text: `📨 @time: ${text}` });
        const next = getNext(graph, node.id);

        cur.nodeId = next?.id ?? null;
        if (!cur.nodeId) cur.status = 'done';
        break;
      }
      case 'SUBSCRIBE': {
        messages.push({ from: 'bot', text: '✅ Inscrito no funil.' });
        const next = getNext(graph, node.id);

        cur.nodeId = next?.id ?? null;
        if (!cur.nodeId) cur.status = 'done';
        break;
      }
      case 'HANDOFF': {
        const msg =
          (node.config.message as string) ??
          'Transferindo para um atendente…';

        messages.push({ from: 'bot', text: `🎧 ${msg}` });
        cur.status = 'done';
        break;
      }
      case 'STOP': {
        messages.push({ from: 'bot', text: '✅ Conversa encerrada pelo bot.' });
        cur.status = 'done';
        break;
      }
      default: {
        const next = getNext(graph, node.id);

        cur.nodeId = next?.id ?? null;
        if (!cur.nodeId) cur.status = 'done';
      }
    }
  }

  return { state: cur, newMessages: messages };
}
