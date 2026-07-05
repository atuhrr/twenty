// FORK: Voka CRM — Fase 14.1: modelo de grafo serializável
export type BotNodeType =
  | 'TRIGGER'           // card especial de gatilhos (não é nó executável)
  | 'START'             // "Iniciar bot"
  | 'MESSAGE'           // Mensagem
  | 'REACTION'          // Reação
  | 'COMMENT'           // Comentário
  | 'INTERNAL_MESSAGE'  // Enviar mensagem interna
  | 'LIST_MESSAGE'      // Mensagem de lista (WhatsApp)
  | 'PAUSE'             // Pausa
  | 'SUBSCRIBE'         // Inscrever (Meta)
  | 'ACTION'            // Ação
  | 'CONDITION'         // Condição
  | 'VALIDATION'        // Validação
  | 'CUSTOM_STEP'       // Passo customizado (código)
  | 'WIDGET'            // Widget
  | 'DISTRIBUTION'      // Distribuição (Round Robin)
  | 'AI_AGENT'          // Agente IA
  | 'HANDOFF'           // Transferir para humano
  | 'STOP';             // Parar bot

export type BotNode = {
  id: string;
  type: BotNodeType;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  width?: number;
  height?: number;
};

// sourceHandle IDs semânticos
// 'output'     — saída única (MESSAGE, COLLECT, PAUSE…)
// 'true'       — ramo verdadeiro (CONDITION)
// 'false'      — ramo falso (CONDITION)
// 'no-answer'  — sem resposta (MESSAGE com botões)
// 'other'      — outra resposta (MESSAGE com botões)
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

export type GraphValidationError = {
  code: string;
  message: string;
  nodeId?: string;
};

export type GraphValidationResult = {
  valid: boolean;
  errors: GraphValidationError[];
};
